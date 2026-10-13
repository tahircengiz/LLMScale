// The sizing engine against vLLM's own figures. Run: node scripts/test-vllmlog.ts
//
// The logs in scripts/fixtures/vllm/ are vLLM 0.31.0 starting on an RTX 4070 Ti
// (11.99 GiB, WSL2) on 2026-10-13, at --gpu-memory-utilization 0.85 because the
// Windows desktop holds part of the card, with VLLM_LOGGING_LEVEL=DEBUG for the
// budget lines. Kept: the INFO and WARNING lines a user would paste, and the two
// DEBUG lines with the budget and the profile. Each run stopped after the KV cache
// was sized (the box has no nvcc for FlashInfer's sampler), so no log goes further.
//
// Three things are checked against them: that the parser reads every figure, that
// overhead.ts lands near what vLLM spent outside the weights and the cache, and
// that kvReservedPerSeq reproduces vLLM's "Maximum concurrency" — sliding windows,
// Mamba state and group padding included.

import { readFileSync } from "node:fs";
import { archFromConfig, weightFileBytes } from "../src/lib/hf.ts";
import { BYTES_PER_GIB, kvReservedPerSeq, weightsBytes, type Dtype, type ModelArch } from "../src/lib/calc.ts";
import { overheadPerGpu, vllmBatch } from "../src/lib/overhead.ts";
import { compareLog, overheadFromLog, parseVllmLog } from "../src/lib/vllmLog.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const log = (n: string) => readFileSync(new URL(`./fixtures/vllm/${n}.txt`, import.meta.url), "utf8");
const repo = (n: string) => JSON.parse(readFileSync(new URL(`./fixtures/repos/${n}.json`, import.meta.url), "utf8"));
const CARD_GIB = 11.99;

/** The arch the site would build from the repository, and the precision vLLM ran it at. */
function model(n: string): { arch: ModelArch; dtype: Dtype } {
  const r = repo(n);
  const arch = archFromConfig(r.config, r.numParams)!;
  const q = r.config.quantization_config;
  if (!q) return { arch, dtype: "bf16" };
  const dtype: Dtype = q.quant_method === "awq" ? "int4" : "fp8";
  return { arch: { ...arch, shipped: { dtype, bytes: weightFileBytes(r.files)! } }, dtype };
}

const RUNS = [
  { log: "qwen3-0.6b", repo: "Qwen_Qwen3-0.6B", tokens: 2048, seqs: 256 },
  { log: "qwen3-4b", repo: "Qwen_Qwen3-4B", tokens: 2048, seqs: 256 },
  { log: "qwen3-4b-t16384", repo: "Qwen_Qwen3-4B", tokens: 16384, seqs: 256 },
  { log: "qwen2.5-7b-awq", repo: "Qwen_Qwen2.5-7B-Instruct-AWQ", tokens: 2048, seqs: 256 },
  { log: "qwen3-8b-fp8", repo: "RedHatAI_Qwen3-8B-FP8-dynamic", tokens: 2048, seqs: 256 },
  { log: "gemma-3-1b", repo: "unsloth_gemma-3-1b-it", tokens: 2048, seqs: 256 },
  { log: "granite-4.0-h-micro", repo: "ibm-granite_granite-4.0-h-micro", tokens: 2048, seqs: 256 },
  { log: "qwen3-0.6b-big", repo: "Qwen_Qwen3-0.6B", tokens: 8192, seqs: 1024 },
  { log: "qwen3-4b-big", repo: "Qwen_Qwen3-4B", tokens: 8192, seqs: 1024 },
  { log: "gemma-3-1b-big", repo: "unsloth_gemma-3-1b-it", tokens: 8192, seqs: 1024 },
  { log: "qwen3-4b-s16", repo: "Qwen_Qwen3-4B", tokens: 8192, seqs: 16 },
];

console.log("--- the parser ---");
{
  const p = parseVllmLog(log("qwen3-0.6b"));
  check("version, model and TP", p.version === "0.31.0" && p.model === "Qwen/Qwen3-0.6B" && p.tp === 1, JSON.stringify([p.version, p.model, p.tp]));
  check("weights, KV memory, tokens, concurrency",
    p.weightsGiB === 1.12 && p.availableKvGiB === 8.17 && p.kvTokens === 76464 && p.maxModelLen === 8192 && p.maxConcurrency === 9.33);
  check("the share it ran at, and the CUDA graphs' part of it", p.gpuUtil === 0.85 && p.graphShare === 0.0257 && p.graphGiB === 0.27);
  check("the batch from the compile range, the graph cap and the KV type",
    p.maxNumBatchedTokens === 2048 && p.graphCap === 512 && p.kvCacheDtype === "auto" && p.quantization === "None");
  check("DEBUG: the budget and the profile", p.requestedGiB === 10.19 && p.nonKvGiB === 1.72 && p.torchPeakGiB === 0.3 && p.consumedGiB === 1.43);
  const set = parseVllmLog(log("qwen3-4b-big"));
  check("batch and sequences set by hand", set.maxNumBatchedTokens === 8192 && set.maxNumSeqs === 1024);
  check("sequences read back from a small graph cap", parseVllmLog(log("qwen3-4b-s16")).maxNumSeqs === 16);
  check("a negative KV figure, when the weights left too little", parseVllmLog(log("qwen3-8b-fp8")).availableKvGiB === -0.55);
  check("compressed-tensors is one word", parseVllmLog(log("qwen3-8b-fp8")).quantization === "compressed-tensors");

  // What a user pastes is usually INFO only.
  const info = log("qwen3-4b").split("\n").filter((l) => !/ DEBUG /.test(l)).join("\n");
  const pi = parseVllmLog(info);
  check("INFO alone: no budget line", pi.requestedGiB === undefined && pi.nonKvGiB === undefined);
  const full = parseVllmLog(log("qwen3-4b"));
  check("INFO alone: the overhead from the card's memory matches the DEBUG budget",
    Math.abs(overheadFromLog(pi, CARD_GIB)! - overheadFromLog(full)!) < 0.02,
    `${overheadFromLog(pi, CARD_GIB)!.toFixed(2)} vs ${overheadFromLog(full)!.toFixed(2)} GiB`);
  check("INFO alone without the card: no overhead claimed", overheadFromLog(pi) === undefined);
  check("nothing in an empty paste", Object.keys(parseVllmLog("hello")).length === 0);
}

console.log("--- overhead.ts against what vLLM spent ---");
let worst = 0;
for (const r of RUNS) {
  const p = parseVllmLog(log(r.log));
  const { arch } = model(r.repo);
  check(`${r.log}: the log's batch is the one the run used`, p.maxNumBatchedTokens === r.tokens);
  const measured = overheadFromLog(p)!;
  const ours = overheadPerGpu(arch, { tokens: r.tokens, seqs: r.seqs }).totalGiB;
  worst = Math.max(worst, Math.abs(ours - measured));
  check(`${r.log}: within 0.15 GiB`, Math.abs(ours - measured) <= 0.15, `${ours.toFixed(2)} vs ${measured.toFixed(2)} GiB`);
}
console.log(`      worst miss ${worst.toFixed(2)} GiB`);
{
  // The old rule: 10% of weights and cache, plus 0.75 GiB.
  const p = parseVllmLog(log("qwen3-4b-t16384"));
  const old = (p.weightsGiB! + p.availableKvGiB!) * 0.1 + 0.75;
  check("the old 10% rule missed the larger batch", Math.abs(old - overheadFromLog(p)!) > 0.2, `${old.toFixed(2)} vs ${overheadFromLog(p)!.toFixed(2)} GiB`);
}
{
  // The serve defaults the runs were split by.
  check("a 12 GB card: 2,048 tokens, 256 sequences", JSON.stringify(vllmBatch(11.99)) === JSON.stringify({ tokens: 2048, seqs: 256, graphCap: 512 }));
  check("an H100: 8,192 and 1,024", vllmBatch(80, "H100 (SXM/PCIe) 80GB").tokens === 8192);
  check("an A100 80GB stays at the small defaults", vllmBatch(80, "A100 80GB").tokens === 2048);
  check("a B200: 16,384, graphs up to 1,024", vllmBatch(192, "B200 192GB").tokens === 16384 && vllmBatch(192, "B200 192GB").graphCap === 1024);
  check("an RTX 5090 is not datacenter Blackwell", vllmBatch(32, "RTX 5090").graphCap === 512);
}

console.log("--- the KV cache vLLM reserves ---");
for (const r of RUNS) {
  const p = parseVllmLog(log(r.log));
  if (p.maxConcurrency === undefined) continue;
  const { arch } = model(r.repo);
  const perSeq = kvReservedPerSeq(arch, "bf16", p.maxModelLen!, r.tokens);
  const ours = (p.availableKvGiB! * BYTES_PER_GIB) / perSeq;
  // vLLM prints the KV memory to 0.01 GiB, so the comparison carries that much slack.
  const slack = 0.006 / p.availableKvGiB! + 0.002;
  check(`${r.log}: ${p.maxConcurrency}× at ${p.maxModelLen} tokens`, Math.abs(ours / p.maxConcurrency - 1) <= slack, `${ours.toFixed(2)}×`);
}
{
  // What the old reading said for the two layouts vLLM reserves more for.
  const g = model("unsloth_gemma-3-1b-it").arch;
  const windowOnly = (6.99 * BYTES_PER_GIB) / (1024 * (4 * 8192 + 22 * 512));
  check("Gemma 3 1B: the window alone would claim three times vLLM's concurrency", windowOnly > 3 * 51.02, `${windowOnly.toFixed(0)}×`);
  check("…because a sliding layer keeps the window plus two batches in flight",
    kvReservedPerSeq(g, "bf16", 8192, 2048) > kvReservedPerSeq(g, "bf16", 8192, 512));
  check("…and never more than the context", kvReservedPerSeq(g, "bf16", 1024, 8192) === kvReservedPerSeq(g, "bf16", 1024, 2048));
  const plain = model("Qwen_Qwen3-4B").arch;
  check("a plain model reserves its context, rounded to a block",
    kvReservedPerSeq(plain, "bf16", 8192) === 36 * 2 * 8 * 128 * 2 * 8192 && kvReservedPerSeq(plain, "bf16", 8193) === 36 * 2 * 8 * 128 * 2 * 8208);
}

console.log("--- weights ---");
for (const r of RUNS.filter((x, i, a) => a.findIndex((y) => y.repo === x.repo) === i)) {
  const p = parseVllmLog(log(r.log));
  const { arch, dtype } = model(r.repo);
  const ours = weightsBytes(arch, dtype) / BYTES_PER_GIB;
  if (r.repo === "Qwen_Qwen3-0.6B") {
    // Its checkpoint ships lm_head.weight although the head is tied; the Hub
    // counts it, vLLM does not load it.
    const head = arch.vocabSize! * arch.hiddenSize * 2;
    check("Qwen3-0.6B: the Hub's count includes a tied head shipped twice", Math.abs(ours - head / BYTES_PER_GIB - p.weightsGiB!) < 0.03,
      `${ours.toFixed(2)} − ${(head / BYTES_PER_GIB).toFixed(2)} vs ${p.weightsGiB} GiB`);
    continue;
  }
  check(`${r.repo}: within 6% of what vLLM loaded`, Math.abs(ours / p.weightsGiB! - 1) <= 0.06, `${ours.toFixed(2)} vs ${p.weightsGiB} GiB`);
}

console.log("--- the page's comparison ---");
{
  const { arch, dtype } = model("Qwen_Qwen3-4B");
  const full = compareLog(parseVllmLog(log("qwen3-4b")), { arch, weightDtype: dtype });
  const row = (c: typeof full, k: string) => c.rows.find((r) => r.key === k);
  check("a DEBUG log needs no card: every row, budget from the log", full.rows.length === 5 && full.budgetFrom === "log", full.rows.map((r) => r.key).join(" "));
  check("…weights, overhead and KV memory within 0.1 GiB",
    ["weights", "overhead", "kv"].every((k) => Math.abs(row(full, k)!.ours - row(full, k)!.vllm) <= 0.1),
    ["weights", "overhead", "kv"].map((k) => `${k} ${row(full, k)!.ours.toFixed(2)}/${row(full, k)!.vllm}`).join(", "));
  check("…concurrency and tokens within 1%", Math.abs(row(full, "concurrency")!.ours / 1.1 - 1) < 0.01 && Math.abs(row(full, "tokens")!.ours / 9008 - 1) < 0.01);
  const info = parseVllmLog(log("qwen3-4b").split("\n").filter((l) => !/ DEBUG /.test(l)).join("\n"));
  check("an INFO log without a card: no memory rows, the layout rows still", compareLog(info, { arch, weightDtype: dtype }).rows.map((r) => r.key).join(" ") === "weights concurrency tokens");
  const onCard = compareLog(info, { arch, weightDtype: dtype, cardGiB: CARD_GIB });
  check("…with the card, the memory rows come back from it", onCard.rows.length === 5 && onCard.budgetFrom === "card");
  const g = model("unsloth_gemma-3-1b-it");
  const big = compareLog(parseVllmLog(log("gemma-3-1b-big")), { arch: g.arch, weightDtype: g.dtype });
  check("the batch is the log's, not the card's", big.batch.tokens === 8192 && big.batch.seqs === 1024);
  check("Gemma at 8,192 batched tokens: concurrency within 1%", Math.abs(row(big, "concurrency")!.ours / 27.82 - 1) < 0.01, row(big, "concurrency")!.ours.toFixed(2));
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
