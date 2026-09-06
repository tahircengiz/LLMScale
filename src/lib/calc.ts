// Core VRAM sizing engine.
// All math is pure and dependency-free so it can be unit-tested with `node calc.ts`.

export type Dtype = "fp32" | "fp16" | "bf16" | "fp8" | "int8" | "int4";

/** Bytes per parameter / element for each precision. */
export const DTYPE_BYTES: Record<Dtype, number> = {
  fp32: 4,
  fp16: 2,
  bf16: 2,
  fp8: 1,
  int8: 1,
  int4: 0.5,
};

export const DTYPE_LABELS: Record<Dtype, string> = {
  fp32: "FP32 (4 bytes)",
  fp16: "FP16 (2 bytes)",
  bf16: "BF16 (2 bytes)",
  fp8: "FP8 (1 byte)",
  int8: "INT8 / Q8 (1 byte)",
  int4: "INT4 / Q4 (0.5 byte)",
};

/** Bytes in one GiB (2^30). We size everything in GiB and compare against
 * GPU nominal capacity treated as GiB, which matches how the community's
 * VRAM calculators behave. */
export const BYTES_PER_GIB = 1024 ** 3;

export interface ModelArch {
  /** Total parameter count (for MoE: TOTAL params, not active). */
  numParams: number;
  /** num_hidden_layers */
  numLayers: number;
  hiddenSize: number;
  /** num_attention_heads */
  numAttentionHeads: number;
  /** num_key_value_heads (GQA/MQA). Equals numAttentionHeads for plain MHA. */
  numKeyValueHeads: number;
  /** Explicit head_dim if the config provides one; otherwise derived. */
  headDim?: number;
  vocabSize?: number;
  /** max_position_embeddings */
  maxContext?: number;
  /** intermediate_size — the FFN width. Only used by the fine-tuning model, which
   *  needs it to size adapters on the MLP projections; ratios to hiddenSize run
   *  from ~2.7x to ~5.3x across families, so guessing it is not good enough. */
  intermediateSize?: number;
  /** Mixture-of-Experts active params (informational only; VRAM uses total). */
  activeParams?: number;
  /**
   * Multi-head latent attention (DeepSeek V2/V3 and friends). When both are
   * present the KV cache is NOT the usual per-head tensor pair: MLA caches one
   * compressed latent per token per layer, shared across every head, so the
   * head count drops out of the formula entirely.
   *  - kvLoraRank    = config `kv_lora_rank`     (d_c, the compression dim)
   *  - qkRopeHeadDim = config `qk_rope_head_dim` (d_h^R, the decoupled RoPE key)
   */
  kvLoraRank?: number;
  qkRopeHeadDim?: number;
}

/** Does this architecture cache a compressed latent instead of K and V tensors? */
export function usesMla(arch: ModelArch): boolean {
  return !!(arch.kvLoraRank && arch.qkRopeHeadDim);
}

export interface CalcInput {
  arch: ModelArch;
  /** Quantization of the weights. */
  weightDtype: Dtype;
  /** KV cache precision (often fp16/bf16, fp8 with some engines). */
  kvDtype: Dtype;
  /** Tokens per sequence held in cache (prompt + generated). */
  contextLength: number;
  /** Number of concurrent sequences / batch size. */
  concurrency: number;
  /** Activation + fragmentation overhead as a fraction of (weights+kv), e.g. 0.1 */
  overheadPct: number;
  /** Fixed framework + CUDA context overhead in GiB. */
  cudaContextGiB: number;
}

export interface CalcResult {
  weightsGiB: number;
  kvCacheGiB: number;
  /** KV cache for a single sequence at the given context. */
  kvPerSeqGiB: number;
  kvPerTokenBytes: number;
  activationsGiB: number;
  cudaOverheadGiB: number;
  totalGiB: number;
  headDim: number;
}

export function resolveHeadDim(arch: ModelArch): number {
  if (arch.headDim && arch.headDim > 0) return arch.headDim;
  return Math.floor(arch.hiddenSize / arch.numAttentionHeads);
}

export function weightsBytes(arch: ModelArch, dtype: Dtype): number {
  return arch.numParams * DTYPE_BYTES[dtype];
}

/** KV cache bytes for ONE token of ONE sequence. */
export function kvBytesPerToken(arch: ModelArch, kvDtype: Dtype): number {
  // MLA caches a single compressed latent per token per layer — (d_c + d_h^R) —
  // shared across all heads, so neither the head count nor the head dim appears.
  // DeepSeek-V2 §2.1.3: "KV cache per token is (d_c + d_h^R)·l". Applying the
  // ordinary formula to these models overstates the cache badly: DeepSeek-V3 came
  // out 25x too large — 13.34 GiB at 8k context where the true figure is 0.54.
  if (usesMla(arch)) {
    return arch.numLayers * (arch.kvLoraRank! + arch.qkRopeHeadDim!) * DTYPE_BYTES[kvDtype];
  }
  const hd = resolveHeadDim(arch);
  // 2 = one tensor for K and one for V.
  return 2 * arch.numLayers * arch.numKeyValueHeads * hd * DTYPE_BYTES[kvDtype];
}

export function calculate(input: CalcInput): CalcResult {
  const { arch, weightDtype, kvDtype, contextLength, concurrency, overheadPct, cudaContextGiB } = input;

  const headDim = resolveHeadDim(arch);
  const weights = weightsBytes(arch, weightDtype);
  const kvPerToken = kvBytesPerToken(arch, kvDtype);
  const kvPerSeq = kvPerToken * contextLength;
  const kvTotal = kvPerSeq * concurrency;

  const activations = (weights + kvTotal) * overheadPct;
  const cudaOverhead = cudaContextGiB * BYTES_PER_GIB;
  const total = weights + kvTotal + activations + cudaOverhead;

  return {
    weightsGiB: weights / BYTES_PER_GIB,
    kvCacheGiB: kvTotal / BYTES_PER_GIB,
    kvPerSeqGiB: kvPerSeq / BYTES_PER_GIB,
    kvPerTokenBytes: kvPerToken,
    activationsGiB: activations / BYTES_PER_GIB,
    cudaOverheadGiB: cudaOverhead / BYTES_PER_GIB,
    totalGiB: total / BYTES_PER_GIB,
    headDim,
  };
}

/**
 * Reverse calculation: given an available VRAM budget (GiB) and everything
 * except concurrency, how many concurrent sequences fit?
 * Returns 0 if the model weights alone don't fit.
 */
export function maxConcurrency(
  input: Omit<CalcInput, "concurrency">,
  availableGiB: number
): number {
  const { arch, weightDtype, kvDtype, contextLength, overheadPct, cudaContextGiB } = input;
  const weights = weightsBytes(arch, weightDtype);
  const kvPerSeq = kvBytesPerToken(arch, kvDtype) * contextLength;
  const budget = availableGiB * BYTES_PER_GIB;

  // total = (weights + n*kvPerSeq) * (1 + overheadPct) + cudaOverhead <= budget
  const cudaOverhead = cudaContextGiB * BYTES_PER_GIB;
  const usableForModel = (budget - cudaOverhead) / (1 + overheadPct);
  const remainingForKv = usableForModel - weights;
  if (remainingForKv <= 0) return 0;
  // Guard a degenerate arch (0 KV heads / 0 context) so we never divide by zero
  // and surface an "Infinity" in the UI.
  if (!(kvPerSeq > 0)) return 0;
  return Math.floor(remainingForKv / kvPerSeq);
}

/**
 * Reverse calculation: max context length for a single sequence given a budget.
 */
export function maxContextLength(
  input: Omit<CalcInput, "contextLength">,
  availableGiB: number
): number {
  const { arch, weightDtype, kvDtype, concurrency, overheadPct, cudaContextGiB } = input;
  const weights = weightsBytes(arch, weightDtype);
  const kvPerTokenAllSeqs = kvBytesPerToken(arch, kvDtype) * concurrency;
  const budget = availableGiB * BYTES_PER_GIB;
  const cudaOverhead = cudaContextGiB * BYTES_PER_GIB;
  const usableForModel = (budget - cudaOverhead) / (1 + overheadPct);
  const remainingForKv = usableForModel - weights;
  if (remainingForKv <= 0) return 0;
  if (!(kvPerTokenAllSeqs > 0)) return 0;
  return Math.floor(remainingForKv / kvPerTokenAllSeqs);
}
