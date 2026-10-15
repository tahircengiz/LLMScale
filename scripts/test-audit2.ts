// The phase-2 fixes from the 2026-10-15 data audit
// (docs/audit-2026-10-15-veri-guvenilirligi.md): architectures the sizing did not
// follow, each checked against what the audit measured from vLLM 0.31.0's own
// rules (docs/audit-2026-10-15/kv-vllm-tablolari.md) and the configs as published.
// Run: node scripts/test-audit2.ts
import { readFileSync } from "node:fs";
import { BYTES_PER_GIB, calculate, kvBytesPerToken, kvReservedPerSeq, type ModelArch } from "../src/lib/calc.ts";
import { archFromConfig, parseConfigJson } from "../src/lib/hf.ts";
import { unmodelledCacheKeys } from "../src/lib/layers.ts";
import { overheadPerGpu } from "../src/lib/overhead.ts";
import { decodeState, DEFAULT_STATE, encodeState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const cfg = (n: string) => parseConfigJson(readFileSync(new URL(`./fixtures/configs-audit/${n}.json`, import.meta.url), "utf8"));
const gib = (b: number) => b / BYTES_PER_GIB;
/** vLLM's reservation for one request, in GiB, against the audit's figure to its 3 decimals. */
function reserved(name: string, arch: ModelArch, rows: [ctx: number, batch: number, vllm: number][]) {
  for (const [ctx, batch, vllm] of rows) {
    const ours = gib(kvReservedPerSeq(arch, "bf16", ctx, batch));
    check(`${name} at ${ctx / 1024}k, ${batch}-token batches: ${vllm.toFixed(3)} GiB`, Math.abs(ours - vllm) < 0.0006, ours.toFixed(4));
  }
}

console.log("--- B1: Gemma 4 ---");
{
  const g31 = archFromConfig(cfg("google_gemma-4-31B-it"), 31.27e9)!;
  check("31B: 50 sliding layers, 10 global ones of 4 heads × 512", g31.slidingLayers === 50 && g31.attnLayers === undefined &&
    g31.globalAttn?.kvHeads === 4 && g31.globalAttn?.headDim === 512, JSON.stringify(g31.globalAttn));
  check("31B: 16 KiB a sliding token, 8 KiB a global one", kvBytesPerToken(g31, "bf16") === 50 * 16384 + 10 * 8192);
  // Before: 3.762, 8.918, 18.293, 23.918, 33.293 GiB (+9% to +72%).
  reserved("31B", g31, [[4096, 2048, 3.45], [32768, 2048, 6.418], [32768, 8192, 15.793], [131072, 2048, 13.918], [131072, 8192, 23.293]]);
  const g26 = archFromConfig(cfg("google_gemma-4-26B-A4B-it"), 25.81e9)!;
  reserved("26B-A4B", g26, [[4096, 2048, 0.862], [32768, 2048, 1.605], [32768, 8192, 3.948], [131072, 2048, 3.48], [131072, 8192, 5.823]]);
  check("26B-A4B: a MoE of 128 experts, 8 a token", g26.numExperts === 128 && g26.expertsPerToken === 8 && g26.moeIntermediateSize === 704);
  // Every unrouted expert's three 2,816 × 704 projections, in 30 layers.
  const active = 25.81e9 - 120 * 3 * 2816 * 704 * 30;
  check("26B-A4B: about 4.4B active, not dense", g26.activeParams === active, `${(g26.activeParams! / 1e9).toFixed(2)}B`);
  const g12 = archFromConfig(cfg("google_gemma-4-12B-it"), 12e9)!;
  check("12B: one global KV head of 512", g12.globalAttn?.kvHeads === 1 && g12.globalAttn?.headDim === 512);
  reserved("12B", g12, [[4096, 2048, 1.317], [32768, 2048, 2.067], [32768, 8192, 5.817], [131072, 2048, 3.567], [131072, 8192, 7.317]]);
  const e2b = archFromConfig(cfg("google_gemma-4-E2B-it"), 5.1e9)!;
  check("E2B: the last 20 of 35 layers keep no cache", e2b.attnLayers === 15 && e2b.slidingLayers === 12, `${e2b.attnLayers} own, ${e2b.slidingLayers} sliding`);
  check("E2B: without attention_k_eq_v the global layers keep their 1 KV head", e2b.globalAttn?.kvHeads === 1 && e2b.globalAttn?.headDim === 512);
  reserved("E2B", e2b, [[4096, 2048, 0.071], [32768, 2048, 0.241], [32768, 8192, 0.381], [131072, 2048, 0.803], [131072, 8192, 0.944]]);
  const e4b = archFromConfig(cfg("google_gemma-4-E4B-it"), 8e9)!;
  check("E4B: the last 18 of 42 layers keep no cache", e4b.attnLayers === 24 && e4b.slidingLayers === 20);
  reserved("E4B", e4b, [[4096, 2048, 0.22], [32768, 2048, 0.677], [32768, 8192, 1.146], [131072, 2048, 2.177], [131072, 8192, 2.646]]);
  check("no Gemma 4 key is flagged as unmodelled any more", [g31, g26, g12, e2b, e4b].every((a) => !a.unmodelled), JSON.stringify(g31.unmodelled));

  // Tensor parallelism splits each kind by its own heads: at TP 8 the sliding
  // layers hold 2 of 16 heads per GPU, the global layers one of 4, replicated.
  const tp8 = kvReservedPerSeq(g31, "bf16", 131072, 2048, 8);
  // Pages equal at 16 tokens (2 heads × 256 = 1 head × 512): 5 sliding groups of 321
  // blocks and one global group of 8,192, 10 layers each, 32 KiB a page.
  const want = (5 * 321 + 8192) * 10 * 16 * (2 * 2 * 256 * 2);
  check("31B at TP 8: each GPU holds a global head whole", tp8 === want, `${gib(tp8).toFixed(3)} GiB, not ${(13.918 / 8).toFixed(3)}`);
  const c8 = calculate({ arch: g31, weightDtype: "bf16", kvDtype: "bf16", contextLength: 131072, concurrency: 1, gpus: 8 });
  const sum = c8.weightsGiB / 8 + gib(tp8) + overheadPerGpu(g31, c8.batch, 8).totalGiB;
  check("…and the per-GPU sum carries it", Math.abs(c8.perGpuGiB - sum) < 1e-9, `${c8.perGpuGiB.toFixed(3)} vs ${sum.toFixed(3)}`);
  const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: g31 }));
  check("a link keeps the global layers' shape", JSON.stringify(back.arch?.globalAttn) === JSON.stringify(g31.globalAttn));
  check("…and its reservation", !!back.arch && kvReservedPerSeq(back.arch, "bf16", 131072) === kvReservedPerSeq(g31, "bf16", 131072));
  check("a plain Gemma 3 has no global shape", unmodelledCacheKeys({ model_type: "gemma3_text", head_dim: 128 }).length === 0 &&
    archFromConfig({ model_type: "gemma3_text", num_hidden_layers: 26, hidden_size: 1152, num_attention_heads: 4, num_key_value_heads: 1, head_dim: 256, global_head_dim: 512 }, 1e9)!.globalAttn === undefined);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
