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
import { batchFor, GPUS, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";

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

/** What the GPU fit shows: 1 when one card holds it, else the layout's count. */
function needed(arch: ModelArch, wd: Dtype, kd: Dtype, ctx: number, users: number, g: Gpu) {
  const input = { arch, weightDtype: wd, kvDtype: kd, contextLength: ctx, concurrency: users, batch: batchFor(g) };
  if (calculate(input).totalGiB <= usableGiB(g)) return { gpus: 1, layout: null };
  const layout = layoutFor(input, usableGiB(g));
  return { gpus: layout?.gpus ?? Infinity, layout };
}

console.log("--- the screenshot: DeepSeek-V4-Flash on RTX PRO 6000s at 256k tokens ---");
const at = (u: number) => needed(v4, "fp8", "fp8", 262144, u, pro);
check("1 user: two cards", at(1).gpus === 2, JSON.stringify(at(1).layout));
// Tensor parallelism holds V4's single cached vector whole on both cards, two
// pipeline stages half of it each; at one request either holds the same.
const two = layoutsOn({ arch: v4, weightDtype: "fp8", kvDtype: "fp8", contextLength: 262144, concurrency: 1, batch: batchFor(pro) }, usableGiB(pro), 2);
check("…as TP 2 or two pipeline stages, both of which fit", two.filter((f) => f.fits).some((f) => f.layout.tp === 2) && two.filter((f) => f.fits).some((f) => f.layout.pp === 2));
check("8 users: three, as three pipeline stages", at(8).gpus === 3 && at(8).layout?.pp === 3, JSON.stringify(at(8).layout));
check("16 users: not fewer than 8 take", at(16).gpus >= at(8).gpus, `${at(8).gpus} → ${at(16).gpus}`);
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
check("three pipeline stages hold the most requests", three[0].layout.pp === 3 && three[0].fits, `${three[0].maxUsers} requests`);
check("expert parallelism over three, with 256 experts split unevenly", three.some((f) => f.layout.ep && f.layout.dp === 3 && f.fits));
check("three plain replicas cannot each hold the weights", three.some((f) => !f.layout.ep && f.layout.dp === 3 && !f.fits));
const sixteen = on(pro, 16)[0];
// vLLM's budget is 0.92 of the 94.97 GiB the card reports, 87.4 GiB a card.
check("16 requests are more than three RTX PRO 6000s hold", !sixteen.fits && sixteen.maxUsers === 14, `${sixteen.maxUsers}`);
check("…which still hold a shorter context for all 16", sixteen.maxContext > 0 && sixteen.maxContext < 262144, `${sixteen.maxContext} tokens`);
const h = on(h200, 16)[0];
check("three H200s hold 16", h.fits && h.maxUsers >= 16, `${h.maxUsers} requests, ${h.layout.perGpuGiB.toFixed(1)} GiB a GPU`);
check("the context is capped at the model's", three[0].maxContext <= 1_048_576);
for (const u of [8, 16, 32]) {
  const first = layoutsOn({ arch: v4, weightDtype: "fp8", kvDtype: "fp8", contextLength: 262144, concurrency: u, batch: batchFor(pro) }, usableGiB(pro), at(u).gpus)[0];
  check(`${u} users: the fewest GPUs, given as the count, run it the same way`, first.fits && JSON.stringify(first.layout) === JSON.stringify(at(u).layout), `${at(u).gpus} GPUs, ${JSON.stringify(first.layout)}`);
}

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
