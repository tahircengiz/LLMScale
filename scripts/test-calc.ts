// Smoke test for the VRAM engine. Run with: node scripts/test-calc.ts
import { calculate, maxConcurrency, kvBytesPerToken } from "../src/lib/calc.ts";
import { KNOWN_MODELS, findKnownByHfId } from "../src/lib/models.ts";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) failures++;
}
function approx(a: number, b: number, tolPct = 0.02) {
  return Math.abs(a - b) / b <= tolPct;
}

// --- Qwen2.5-7B in BF16 ---
const qwen = findKnownByHfId("Qwen/Qwen2.5-7B-Instruct")!;
const r = calculate({
  arch: qwen,
  weightDtype: "bf16",
  kvDtype: "fp16",
  contextLength: 8192,
  concurrency: 1,
  overheadPct: 0.1,
  cudaContextGiB: 0.75,
});
console.log("\nQwen2.5-7B @ bf16, 8k ctx, 1 user:");
console.log(`  weights=${r.weightsGiB.toFixed(2)} kv/seq=${r.kvPerSeqGiB.toFixed(3)} total=${r.totalGiB.toFixed(2)} GiB`);
console.log(`  kv/token=${r.kvPerTokenBytes} bytes, head_dim=${r.headDim}`);

// 7.616B * 2 bytes / 2^30 = 14.19 GiB
check("Qwen weights ~14.19 GiB", approx(r.weightsGiB, 14.19, 0.01), `${r.weightsGiB.toFixed(2)}`);
// kv/token = 2 * 28 * 4 * 128 * 2 = 57344 bytes
check("Qwen kv/token = 57344 B", r.kvPerTokenBytes === 57344, `${r.kvPerTokenBytes}`);
check("Qwen head_dim = 128", r.headDim === 128);

// --- Llama 3.1 8B (gated, from bundled DB) ---
const llama = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;
const rl = calculate({
  arch: llama,
  weightDtype: "fp16",
  kvDtype: "fp16",
  contextLength: 128000,
  concurrency: 1,
  overheadPct: 0.1,
  cudaContextGiB: 0.75,
});
console.log("\nLlama-3.1-8B @ fp16, 128k ctx, 1 user:");
console.log(`  weights=${rl.weightsGiB.toFixed(2)} kv/seq=${rl.kvPerSeqGiB.toFixed(2)} total=${rl.totalGiB.toFixed(2)} GiB`);
// kv/token = 2 * 32 * 8 * 128 * 2 = 131072 bytes = 128 KiB
check("Llama kv/token = 131072 B", kvBytesPerToken(llama, "fp16") === 131072);
check("Llama weights ~14.96 GiB", approx(rl.weightsGiB, 8.03e9 * 2 / 1024 ** 3, 0.001));

// --- Reverse: how many 4k-ctx users fit on an 80GB H100 with Llama 8B fp16? ---
const fit = maxConcurrency(
  { arch: llama, weightDtype: "fp16", kvDtype: "fp16", contextLength: 4096, overheadPct: 0.1, cudaContextGiB: 0.75 },
  80
);
console.log(`\nLlama-3.1-8B fp16, 4k ctx on 80 GiB → ${fit} concurrent sequences`);
check("Llama 8B fp16 fits many users on 80GB", fit > 50, `${fit}`);

// --- GQA savings sanity: Qwen kv_heads=4 << attn_heads=28 ---
check("GQA reduces KV (kv_heads < attn_heads)", qwen.numKeyValueHeads < qwen.numAttentionHeads);

console.log(`\nKnown models in DB: ${KNOWN_MODELS.length}`);
console.log(failures === 0 ? "\nALL PASS ✅" : `\n${failures} FAILURE(S) ❌`);
process.exit(failures === 0 ? 0 : 1);
