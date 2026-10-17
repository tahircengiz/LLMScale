// How many GPUs serve a deployment, and how they are laid out (layoutFor in calc.ts).
// Run: node scripts/test-layout.ts
//
// The GPU fit used to search tensor-parallel sizes only and, when none held the
// load, fell back to total memory over one card. A cache that tensor parallelism
// cannot split (one MLA latent, one KV head, or more GPUs than KV heads) is held
// whole on every GPU, so no size held many requests and the fallback answered
// instead: DeepSeek-V4-Flash on RTX PRO 6000s at 256k tokens needed 4 cards for 8
// users and 3 for 16, and Llama 3.1 8B on H200s 198 for 64 users and 16 for 128.
// Pipeline stages and replicas, and for a MoE its experts spread over every GPU,
// are what serve more requests; with them the count never falls as requests or
// context grow.
import { readFileSync } from "node:fs";
import { calculate, expertWeightBytes, layoutFor, layoutsOn, weightsBytes, type Dtype, type ModelArch } from "../src/lib/calc.ts";
import { archFromConfig } from "../src/lib/hf.ts";
import { batchFor, GPUS, stepDevice, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import { findKnownByHfId, KNOWN_MODELS } from "../src/lib/models.ts";
import { layoutLabel } from "../src/lib/parallel.ts";
import { layoutSpeed } from "../src/lib/perf.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const cfg = JSON.parse(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V4-Flash-0731.json", import.meta.url), "utf8"));
const v4 = archFromConfig(cfg, 304.18e9)!;
v4.shipped = { dtype: "fp8", bytes: 166_886_535_336 };
// The URL the app writes for it carries the active count the page computed.
v4.activeParams = 27_356_354_494;
const gpu = (id: string) => GPUS.find((g) => g.id === id)!;
const pro = gpu("rtxpro6000-96");

/** What the GPU fit shows: 1 when one card holds it, else the layout's count,
 *  laid out as the card's speed ranks the layouts (GpuFit.tsx). */
function needed(arch: ModelArch, wd: Dtype, kd: Dtype, ctx: number, users: number, g: Gpu) {
  const input = { arch, weightDtype: wd, kvDtype: kd, contextLength: ctx, concurrency: users, batch: batchFor(g) };
  if (calculate(input).totalGiB <= usableGiB(g)) return { gpus: 1, layout: null };
  const layout = layoutFor(input, usableGiB(g), undefined, layoutSpeed(input, stepDevice(g)));
  return { gpus: layout?.gpus ?? Infinity, layout };
}

console.log("--- the screenshot: DeepSeek-V4-Flash on RTX PRO 6000s at 256k tokens ---");
const at = (u: number) => needed(v4, "fp8", "fp8", 262144, u, pro);
check("1 user: two cards", at(1).gpus === 2, JSON.stringify(at(1).layout));
// Tensor parallelism holds V4's single cached vector whole on both cards, two
// pipeline stages half of it each; at one request either holds the same.
const two = layoutsOn({ arch: v4, weightDtype: "fp8", kvDtype: "fp8", contextLength: 262144, concurrency: 1, batch: batchFor(pro) }, usableGiB(pro), 2);
check("…as TP 2 or two pipeline stages, both of which fit", two.filter((f) => f.fits).some((f) => f.layout.tp === 2) && two.filter((f) => f.fits).some((f) => f.layout.pp === 2));
// Three pipeline stages hold the most, but three expert-parallel ranks hold 8 too
// and need no stages (calc.ts, layoutsOn): the layout V4's recipe runs for load.
check("8 users: three, as three expert-parallel ranks", at(8).gpus === 3 && at(8).layout?.pp === 1 && at(8).layout?.dp === 3 && !!at(8).layout?.ep, JSON.stringify(at(8).layout));
check("16 users: not fewer than 8 take", at(16).gpus >= at(8).gpus, `${at(8).gpus} → ${at(16).gpus}`);
// Four: vLLM leaves the 0731 checkpoint's DSpark draft layers (mtp.*) unloaded,
// 10 GiB of its files (audit C6), but its fused MoE kernels hold ~0.9 GiB a card at
// 8,192 batched tokens (overhead.ts), so three cards hold 15 requests, not 16.
check("…four", at(16).gpus === 4, JSON.stringify(at(16).layout));
check("32 users: five", at(32).gpus === 5, JSON.stringify(at(32).layout));

console.log("\n--- Llama 3.1 8B on H200s at 128k tokens ---");
const llama = KNOWN_MODELS.find((m) => m.id === "llama-3.1-8b")! as ModelArch;
const h200 = gpu("h200-141");
const l64 = needed(llama, "bf16", "fp16", 131072, 64, h200);
const l128 = needed(llama, "bf16", "fp16", 131072, 128, h200);
check("128 users need at least what 64 do", l128.gpus >= l64.gpus, `${l64.gpus} → ${l128.gpus}`);
check("…as replicas, its 8 KV heads cap tensor parallelism", (l128.layout?.dp ?? 0) > 1 && !l128.layout?.ep, JSON.stringify(l128.layout));

console.log("\n--- what a layout is ---");
check("a dense model never shards experts", expertWeightBytes(llama, "bf16") === 0);
const share = expertWeightBytes(v4, "fp8") / weightsBytes(v4, "fp8");
check("DeepSeek-V4-Flash's experts are most of its weights", share > 0.85 && share < 0.97, share.toFixed(3));
const many = needed(v4, "fp8", "fp8", 32768, 128, pro).layout!;
check("every GPU of the layout fits the card", many.perGpuGiB <= usableGiB(pro), many.perGpuGiB.toFixed(1));
check("a stage holds at most its share of the layers", many.pp <= 16 && many.pp <= 43);
check("a deployment one card holds needs no layout but one card",
  layoutFor({ arch: llama, weightDtype: "bf16", kvDtype: "fp16", contextLength: 8192, concurrency: 1 }, 80)?.gpus === 1);
check("no count serves one request a card cannot hold",
  layoutFor({ arch: llama, weightDtype: "bf16", kvDtype: "fp16", contextLength: 100_000_000, concurrency: 1, batch: batchFor(gpu("t4-16")) }, usableGiB(gpu("t4-16"))) === null);

console.log("\n--- a given number of GPUs: DeepSeek-V4-Flash on three cards at 256k tokens ---");
const on = (g: Gpu, users: number) =>
  layoutsOn({ arch: v4, weightDtype: "fp8", kvDtype: "fp8", contextLength: 262144, concurrency: users, batch: batchFor(g) }, usableGiB(g), 3);
const three = on(pro, 1);
// 64 heads do not split three ways, so three GPUs are three stages or three replicas.
check("no tensor parallelism of three", three.every((f) => f.layout.tp === 1));
const roomiest = three.reduce((a, f) => (f.maxUsers > a.maxUsers ? f : a));
check("three pipeline stages hold the most requests", roomiest.layout.pp === 3 && roomiest.fits, `${roomiest.maxUsers} requests`);
check("…but the first holds the request without them", three[0].fits && three[0].layout.pp === 1, layoutLabel(three[0].layout));
check("expert parallelism over three, with 256 experts split unevenly", three.some((f) => f.layout.ep && f.layout.dp === 3 && f.fits));
check("three plain replicas cannot each hold the weights", three.some((f) => !f.layout.ep && f.layout.dp === 3 && !f.fits));
// vLLM's budget is 0.92 of the 94.97 GiB the card reports, 87.4 GiB a card.
const most = roomiest.maxUsers;
const over = on(pro, most + 1)[0];
check("one request more than three RTX PRO 6000s hold does not fit", most >= 15 && !over.fits && over.maxUsers === most, `${most} requests`);
check("…which still hold a shorter context for all of them", over.maxContext > 0 && over.maxContext < 262144, `${over.maxContext} tokens`);
const h = on(h200, 16)[0];
check("three H200s hold 16", h.fits && h.maxUsers >= 16, `${h.maxUsers} requests, ${h.layout.perGpuGiB.toFixed(1)} GiB a GPU`);
check("the context is capped at the model's", three[0].maxContext <= 1_048_576);
for (const u of [8, 16, 32]) {
  const input = { arch: v4, weightDtype: "fp8" as const, kvDtype: "fp8" as const, contextLength: 262144, concurrency: u, batch: batchFor(pro) };
  const first = layoutsOn(input, usableGiB(pro), at(u).gpus, layoutSpeed(input, stepDevice(pro)))[0];
  check(`${u} users: the fewest GPUs, given as the count, run it the same way`, first.fits && JSON.stringify(first.layout) === JSON.stringify(at(u).layout), `${at(u).gpus} GPUs, ${JSON.stringify(first.layout)}`);
}

console.log("\n--- which layout comes first: the fastest that holds the load, no pipeline stages unless needed ---");
// vLLM's recipes run one node with tensor, data and expert parallelism and keep
// pipeline stages for several (vllm-project/recipes: DeepSeek-V3, DeepSeek-V4-Flash,
// gpt-oss-120b, Llama-3.3-70B-Instruct). Ranked by the requests a layout holds,
// the calculator put DeepSeek on pipeline stages wherever they held more cache.
const ranked = (arch: ModelArch, wd: Dtype, kd: Dtype, ctx: number, users: number, id: string, n: number, fast = true) => {
  const g = gpu(id);
  const input = { arch, weightDtype: wd, kvDtype: kd, contextLength: ctx, concurrency: users, batch: batchFor(g) };
  return layoutsOn(input, usableGiB(g), n, fast ? layoutSpeed(input, stepDevice(g)) : undefined);
};
const lbl = (fits: ReturnType<typeof ranked>) => `${layoutLabel(fits[0].layout)} (${fits[0].maxUsers} requests, ${fits[0].stepMs?.toFixed(1)} ms)`;
const v3 = findKnownByHfId("deepseek-ai/DeepSeek-V3")! as ModelArch;
const oss = findKnownByHfId("openai/gpt-oss-120b")! as ModelArch;
const l70 = findKnownByHfId("meta-llama/Llama-3.3-70B-Instruct")! as ModelArch;
const v4h200 = ranked(v4, "fp8", "fp8", 262144, 1, "h200-141", 4);
check("V4 at 256k, one request, 4× H200: TP 4, not four pipeline stages", v4h200[0].layout.tp === 4 && v4h200[0].layout.pp === 1, lbl(v4h200));
const v4pp = v4h200.find((f) => f.layout.pp === 4)!;
check("…which hold four times the requests but are slower", v4pp.maxUsers > 3 * v4h200[0].maxUsers && v4pp.stepMs! > v4h200[0].stepMs!, `PP 4: ${v4pp.maxUsers} requests, ${v4pp.stepMs?.toFixed(1)} ms`);
const v4load = ranked(v4, "fp8", "fp8", 262144, 16, "h200-141", 4);
check("…16 requests: four expert-parallel ranks, its recipe's layout for load", v4load[0].layout.dp === 4 && v4load[0].layout.ep, lbl(v4load));
const v4h100 = ranked(v4, "fp8", "fp8", 262144, 16, "h100-80", 4);
check("V4, 16 requests on 4× H100: pipeline stages, the only layout that holds them", v4h100[0].fits && v4h100[0].layout.pp > 1 && !v4h100.some((f) => f.fits && f.layout.pp === 1), lbl(v4h100));
const v4none = ranked(v4, "fp8", "fp8", 262144, 64, "h100-80", 4);
check("…64 requests, which no layout holds: the one that holds the most", !v4none[0].fits && v4none.every((f) => f.maxUsers <= v4none[0].maxUsers), lbl(v4none));
const v3one = ranked(v3, "fp8", "fp16", 32768, 1, "h200-141", 8);
check("DeepSeek V3 at 32k, one request, 8× H200: TP 8 (its recipe for low load), not PP 8", v3one[0].layout.tp === 8, lbl(v3one));
const v3load = ranked(v3, "fp8", "fp16", 32768, 64, "h200-141", 8);
check("…64 requests: DP 8 · EP (its recipe for high load)", v3load[0].layout.dp === 8 && v3load[0].layout.ep, lbl(v3load));
const v3fastest = v3load.filter((f) => f.fits).reduce((a, f) => (f.stepMs! < a.stepMs! ? f : a));
check("…within a tenth of the fastest, it holds the most requests", v3load[0].stepMs! <= v3fastest.stepMs! * 1.1 && v3load[0].maxUsers >= v3fastest.maxUsers, `fastest ${layoutLabel(v3fastest.layout)} ${v3fastest.maxUsers} requests, ${v3fastest.stepMs?.toFixed(1)} ms`);
const ossH100 = ranked(oss, "int4", "fp16", 32768, 1, "h100-80", 4);
check("gpt-oss-120b at 32k on 4× H100: TP 4, as its recipe runs it, not TP 2 · PP 2", ossH100[0].layout.tp === 4 && ossH100[0].layout.pp === 1, lbl(ossH100));
const l70h100 = ranked(l70, "bf16", "fp16", 32768, 1, "h100-80", 8);
check("Llama 3.3 70B at 32k on 8× H100: TP 8, as before", l70h100[0].layout.tp === 8, lbl(l70h100));
const blind = ranked(v4, "fp8", "fp8", 262144, 1, "h200-141", 4, false);
check("without a speed: the most requests of those without pipeline stages, and no speed figure", blind[0].layout.pp === 1 && blind[0].layout.dp === 4 && blind[0].layout.ep && blind.every((f) => f.stepMs === undefined), layoutLabel(blind[0].layout));
check("the order lists every layout that holds the load before any that does not", v4h200.every((f, i) => f.fits || v4h200.slice(i).every((x) => !x.fits)));

console.log("\n--- never fewer GPUs for more requests or a longer context ---");
const models: [string, ModelArch, Dtype][] = [...KNOWN_MODELS.map((m) => [m.id, m as ModelArch, "bf16" as Dtype] as [string, ModelArch, Dtype]), ["deepseek-v4-flash", v4, "fp8"]];
const users = [1, 2, 4, 8, 16, 32, 64, 128];
const ctxs = [8192, 32768, 131072, 262144];
const cards = GPUS.filter((g) => !g.unified);
let drops = 0;
let first = "";
for (const [id, arch, wd] of models) for (const kd of ["fp16", "fp8"] as Dtype[]) for (const g of cards) {
  const grid = ctxs.map((c) => users.map((u) => needed(arch, wd, kd, c, u, g).gpus));
  for (let i = 0; i < ctxs.length; i++) for (let j = 0; j < users.length; j++) {
    const down = (j > 0 && grid[i][j] < grid[i][j - 1]) || (i > 0 && grid[i][j] < grid[i - 1][j]);
    if (down) {
      drops++;
      first ||= `${id} ${kd} ${g.name} ${ctxs[i]} tokens ${users[j]} users`;
    }
  }
}
check(`${models.length} models × ${cards.length} cards × 2 cache precisions`, drops === 0, drops ? `${drops} drops, first: ${first}` : "");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
