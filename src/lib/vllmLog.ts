// Reads what vLLM reports about its own memory when it starts, so an estimate can
// be checked against a real run.
//
// The lines are vLLM 0.31.0's, at its default INFO level:
//   vllm/v1/engine/core.py              "Initializing a V1 LLM engine (v0.31.0) with config:
//                                        model='…', … tensor_parallel_size=…"
//   vllm/v1/worker/gpu/model_runner.py  "Model loading took %s GiB memory and %.6f seconds"
//                                       "Graph capturing finished in %.0f secs, took %.2f GiB"
//   vllm/v1/worker/gpu_worker.py        "Available KV cache memory: %s GiB"
//                                       "… --gpu-memory-utilization=%.4f is equivalent to
//                                        --gpu-memory-utilization=%.4f without CUDA graph …"
//   vllm/v1/core/kv_cache_utils.py      "GPU KV cache size: %s tokens, Maximum concurrency
//                                        for %s tokens per request: %.2fx"
// and, with VLLM_LOGGING_LEVEL=DEBUG, gpu_worker.py's budget and
// vllm/utils/mem_utils.py's profile:
//   "Initial free memory: X GiB; Requested memory: 0.92 (util), Y GiB"
//   "Memory profiling takes … Total non KV cache memory: XGiB; torch peak memory
//    increase: YGiB; total consumed (from mem_get_info): ZGiB; weights memory: WGiB."
// vLLM budgets gpu_memory_utilization × total memory per GPU for the weights, what
// the runtime keeps, the forward pass's peak, the CUDA graphs and the KV cache.
//
// React-free: scripts/test-vllmlog.ts runs it against logs from real runs.

import { BYTES_PER_GIB, kvReservedPerSeq, weightsBytes, type Dtype, type ModelArch } from "./calc.ts";
import { overheadPerGpu, VLLM_UTIL, vllmBatch, type BatchShape } from "./overhead.ts";

export interface VllmLog {
  version?: string;
  model?: string;
  tp?: number;
  weightsGiB?: number;
  availableKvGiB?: number;
  kvTokens?: number;
  maxModelLen?: number;
  maxConcurrency?: number;
  gpuUtil?: number;
  /** What vLLM set aside for CUDA graphs, as a share of the card (current − equivalent util). */
  graphShare?: number;
  /** What capturing the graphs actually took. */
  graphGiB?: number;
  maxNumBatchedTokens?: number;
  maxNumSeqs?: number;
  /** The largest decode batch captured as a CUDA graph. */
  graphCap?: number;
  kvCacheDtype?: string;
  quantization?: string;
  /** DEBUG only: util × total memory, the budget per GPU. */
  requestedGiB?: number;
  /** DEBUG only: weights + what the runtime keeps + the forward pass's transient peak. */
  nonKvGiB?: number;
  /** DEBUG only: the forward pass's peak above what was allocated before it. */
  torchPeakGiB?: number;
  /** DEBUG only: free memory the instance used, from load until after the profile. */
  consumedGiB?: number;
}

const num = (s: string | undefined) => (s === undefined ? undefined : Number(s.replace(/,/g, "")));
const last = (text: string, re: RegExp) => {
  let m: RegExpExecArray | null = null;
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (let x = g.exec(text); x; x = g.exec(text)) m = x;
  return m;
};

/** Pull vLLM's own memory figures out of a startup log. A field is undefined when
 *  the log does not carry its line. With tensor or data parallelism every worker
 *  prints its own lines; the last one read is kept, and they agree for an even split. */
export function parseVllmLog(text: string): VllmLog {
  const out: VllmLog = {};
  out.version =
    last(text, /Initializing a V1 LLM engine \(v([\w.+-]+)\)/)?.[1] ??
    last(text, /vLLM API server version (\S+)/)?.[1];
  out.model =
    last(text, /non-default args:.*?'model(?:_tag)?':\s*'([^']+)'/)?.[1] ??
    last(text, /Initializing a V1 LLM engine .*? with config: model='([^']+)'/)?.[1];
  out.tp = num(last(text, /tensor_parallel_size=(\d+)/)?.[1] ?? last(text, /'tensor_parallel_size':\s*(\d+)/)?.[1]);
  out.weightsGiB = num(last(text, /Model loading took ([\d.]+) GiB memory/)?.[1]);
  out.availableKvGiB = num(last(text, /Available KV cache memory: (-?[\d.]+) GiB/)?.[1]);
  const kv = last(text, /KV cache size: ([\d,]+) tokens, Maximum concurrency for ([\d,]+) tokens per request: ([\d.]+)x/);
  if (kv) [out.kvTokens, out.maxModelLen, out.maxConcurrency] = [num(kv[1]), num(kv[2]), num(kv[3])];
  out.graphGiB = num(last(text, /Graph capturing finished in [\d.]+ secs?, took ([\d.]+) GiB/)?.[1]);
  const cg = last(text, /current --gpu-memory-utilization=([\d.]+) is equivalent to --gpu-memory-utilization=([\d.]+)/);
  if (cg) out.graphShare = Math.round((Number(cg[1]) - Number(cg[2])) * 1e4) / 1e4;
  out.gpuUtil =
    num(cg?.[1]) ??
    num(last(text, /Requested memory: ([\d.]+) \(util\)/)?.[1]) ??
    num(last(text, /'gpu_memory_utilization':\s*([\d.]+)/)?.[1]);
  // Set by hand they are in the non-default args; left at the default, the
  // compile range ends at the batched tokens and the graph capture stops at
  // min(2 × max_num_seqs, 512).
  out.maxNumBatchedTokens = num(
    last(text, /'max_num_batched_tokens':\s*(\d+)/)?.[1] ?? last(text, /'compile_ranges_endpoints':\s*\[(\d+)\]/)?.[1],
  );
  out.graphCap = num(last(text, /'max_cudagraph_capture_size':\s*(\d+)/)?.[1]);
  out.maxNumSeqs = num(last(text, /'max_num_seqs':\s*(\d+)/)?.[1]);
  if (out.maxNumSeqs === undefined && out.graphCap !== undefined && out.graphCap < 512) out.maxNumSeqs = out.graphCap / 2;
  out.kvCacheDtype = last(text, /\bkv_cache_dtype=(\w+)/)?.[1];
  out.quantization = last(text, /\bquantization=([\w-]+)/)?.[1];
  out.requestedGiB = num(last(text, /Requested memory: [\d.]+ \(util\), ([\d.]+) GiB/)?.[1]);
  const prof = last(text, /Total non KV cache memory: ([\d.]+)\s*GiB; torch peak memory increase: ([\d.]+)\s*GiB; total consumed \(from mem_get_info\): ([\d.]+)\s*GiB/);
  if (prof) [out.nonKvGiB, out.torchPeakGiB, out.consumedGiB] = [num(prof[1]), num(prof[2]), num(prof[3])];
  for (const k of Object.keys(out) as (keyof VllmLog)[]) if (out[k] === undefined || Number.isNaN(out[k])) delete out[k];
  return out;
}

/** What vLLM spent on one GPU outside the weights and the KV cache: what the
 *  runtime keeps, the forward pass's peak and the CUDA graphs. A DEBUG log carries
 *  the budget; an INFO log needs the card's total memory, which it does not print. */
export function overheadFromLog(log: VllmLog, totalGiB?: number): number | undefined {
  if (log.weightsGiB === undefined || log.availableKvGiB === undefined) return undefined;
  const budget = log.requestedGiB ?? (totalGiB ? (log.gpuUtil ?? VLLM_UTIL) * totalGiB : undefined);
  return budget === undefined ? undefined : budget - log.weightsGiB - log.availableKvGiB;
}

export interface LogRow {
  key: "weights" | "overhead" | "kv" | "concurrency" | "tokens";
  vllm: number;
  ours: number;
  unit: "GiB" | "x" | "tokens";
}

export interface LogCheck {
  rows: LogRow[];
  /** Where the card's total memory came from: the log's DEBUG budget, or the page's card. */
  budgetFrom?: "log" | "card";
  batch: BatchShape;
  tp: number;
}

/** vLLM's figures from a log beside this engine's for the same model, card and
 *  settings. The concurrency and token rows divide vLLM's own KV memory by the
 *  per-sequence reservation, so they check the cache layout alone; the memory rows
 *  check the weights and the overhead. */
export function compareLog(
  log: VllmLog,
  m: { arch: ModelArch; weightDtype: Dtype; cardGiB?: number; cardName?: string },
): LogCheck {
  const tp = Math.max(1, log.tp ?? 1);
  const card = vllmBatch(m.cardGiB ?? 0, m.cardName);
  const batch: BatchShape = {
    tokens: log.maxNumBatchedTokens ?? card.tokens,
    seqs: log.maxNumSeqs ?? card.seqs,
    graphCap: log.graphCap ?? card.graphCap,
    ...(card.sparseMla ? { sparseMla: card.sparseMla } : {}),
  };
  const kvDtype: Dtype = /fp8/.test(log.kvCacheDtype ?? "") ? "fp8" : "fp16";
  const rows: LogRow[] = [];
  const weights = weightsBytes(m.arch, m.weightDtype) / BYTES_PER_GIB / tp;
  if (log.weightsGiB !== undefined) rows.push({ key: "weights", vllm: log.weightsGiB, ours: weights, unit: "GiB" });
  const overhead = overheadPerGpu(m.arch, batch, tp).totalGiB;
  const spent = overheadFromLog(log, m.cardGiB);
  if (spent !== undefined) rows.push({ key: "overhead", vllm: spent, ours: overhead, unit: "GiB" });
  const budget = log.requestedGiB ?? (m.cardGiB ? (log.gpuUtil ?? VLLM_UTIL) * m.cardGiB : undefined);
  if (budget !== undefined && log.availableKvGiB !== undefined)
    rows.push({ key: "kv", vllm: log.availableKvGiB, ours: budget - weights - overhead, unit: "GiB" });
  if (log.availableKvGiB !== undefined && log.availableKvGiB > 0 && log.maxModelLen) {
    const perSeq = kvReservedPerSeq(m.arch, kvDtype, log.maxModelLen, batch.tokens, tp, batch.sparseMla);
    const conc = perSeq > 0 ? (log.availableKvGiB * BYTES_PER_GIB) / perSeq : 0;
    if (log.maxConcurrency !== undefined) rows.push({ key: "concurrency", vllm: log.maxConcurrency, ours: conc, unit: "x" });
    if (log.kvTokens !== undefined) rows.push({ key: "tokens", vllm: log.kvTokens, ours: Math.floor(conc * log.maxModelLen), unit: "tokens" });
  }
  return { rows, budgetFrom: log.requestedGiB !== undefined ? "log" : m.cardGiB ? "card" : undefined, batch, tp };
}
