// How many GPUs serve a deployment, and how they are laid out (layoutFor in calc.ts).
// Run: node scripts/test-layout.ts
//
// The GPU fit used to search tensor-parallel sizes only and, when none held the
// load, fell back to total memory over one card. A cache that tensor parallelism
// cannot split (one MLA latent, one KV head, or more GPUs than KV heads) is held
// whole on every GPU, so no size held many requests and the fallback answered
// instead: DeepSeek-V4-Flash on RTX PRO 6000s at 256k tokens needed 4 cards for 8
// users and 3 for 16, and Llama 3.1 8B on H200s 198 for 64 users and 16 for 128.
// Replicas, and for a MoE its experts spread over every GPU, are what serve more
// requests; with them the count never falls as requests or context grow.
import { readFileSync } from "node:fs";
import { calculate, expertWeightBytes, layoutFor, weightsBytes, type Dtype, type ModelArch } from "../src/lib/calc.ts";
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
check("1 user: two cards, tensor parallel", at(1).gpus === 2 && at(1).layout?.tp === 2 && at(1).layout?.dp === 1);
check("8 users: four", at(8).gpus === 4, JSON.stringify(at(8).layout));
check("16 users: not fewer than 8 take", at(16).gpus >= at(8).gpus, `${at(8).gpus} → ${at(16).gpus}`);
check("…its experts spread over all four", at(16).layout?.ep === true && at(16).layout?.dp === 4, JSON.stringify(at(16).layout));
check("32 users: eight", at(32).gpus === 8);

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
check("expert parallelism splits the 256 experts evenly", many.ep && 256 % many.gpus === 0, `${many.gpus} GPUs`);
check("every GPU of the layout fits the card", many.perGpuGiB <= usableGiB(pro), many.perGpuGiB.toFixed(1));
check("a deployment one card holds needs no layout but one card",
  layoutFor({ arch: llama, weightDtype: "bf16", kvDtype: "fp16", contextLength: 8192, concurrency: 1 }, 80)?.gpus === 1);
check("no count serves one request a card cannot hold",
  layoutFor({ arch: llama, weightDtype: "bf16", kvDtype: "fp16", contextLength: 1_000_000, concurrency: 1, batch: batchFor(gpu("t4-16")) }, usableGiB(gpu("t4-16"))) === null);

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
