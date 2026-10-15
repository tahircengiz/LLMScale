// Core VRAM sizing engine.
// All math is pure and React-free so it can be unit-tested with `node calc.ts`.

import { overheadPerGpu, SMALL_CARD_BATCH, type BatchShape } from "./overhead.ts";
import { tpValid } from "./parallel.ts";

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
  int4: "INT4 / Q4 (~0.53 byte)",
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
  /** DeepSeek V4's compressed attention (config `compress_ratios`). Every layer
   *  keeps its last `window` tokens; on top of that `csa` layers keep one entry per
   *  4 tokens, each with an `indexDim`-wide indexer key, and `hca` layers one entry
   *  per 128. The entry is one `headDim`-wide vector serving as key and value. */
  compressedAttn?: { csa: number; hca: number; window: number; indexDim: number };
  /** Layers that keep a KV cache, when not all of them do: hybrids keep a fixed
   *  state in their linear-attention or Mamba layers instead (layers.ts). */
  attnLayers?: number;
  /** Of the cache-keeping layers, how many keep only the last `slidingWindow`
   *  tokens (Gemma 2 and 3, gpt-oss). */
  slidingLayers?: number;
  slidingWindow?: number;
  /** The fixed state a hybrid keeps per sequence, in bytes, whatever the context,
   *  and how many linear-attention or Mamba layers keep it. */
  stateBytesPerSeq?: number;
  stateLayers?: number;
  /** Routed experts per MoE layer and how many each token goes through: how much
   *  of a MoE a batch reads per step depends on both (perf.ts). */
  numExperts?: number;
  expertsPerToken?: number;
  /** One expert's feed-forward width (moe_intermediate_size): what a routed token
   *  works through, where intermediateSize is the dense layers' (overhead.ts). */
  moeIntermediateSize?: number;
  /** Whether the input embedding and the output head are one matrix. */
  tieEmbeddings?: boolean;
  /** A checkpoint that ships quantized: its precision and the bytes its weight
   *  files hold. Read from the repository, it is exact where a per-parameter
   *  estimate is not (hf.ts). */
  shipped?: { dtype: Dtype; bytes: number };
}

/** Does this architecture cache a compressed latent instead of K and V tensors? */
export function usesMla(arch: ModelArch): boolean {
  return !!(arch.kvLoraRank && arch.qkRopeHeadDim);
}

/** Does it keep DeepSeek V4's compressed caches instead of one entry per token? */
export function usesCompressedAttn(arch: ModelArch): boolean {
  const c = arch.compressedAttn;
  return !!c && c.csa + c.hca > 0 && c.window > 0;
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
  /** The batch the engine profiles with on the target card, which sets the
   *  activation peak (overhead.ts). Defaults to vLLM's for a card under 70 GiB. */
  batch?: BatchShape;
  /** GPUs the model is split across by tensor parallelism. Each one holds its
   *  share of the weights and the cache and repeats the overhead. Default 1. */
  gpus?: number;
}

export interface CalcResult {
  weightsGiB: number;
  kvCacheGiB: number;
  /** KV cache for a single sequence at the given context. */
  kvPerSeqGiB: number;
  kvPerTokenBytes: number;
  /** Per GPU: the peak of the engine's profiling forward pass. */
  activationsGiB: number;
  /** Per GPU: what the runtime keeps (workspaces, communication buffers) and the
   *  CUDA graphs. */
  runtimeGiB: number;
  /** GPUs the figures are for, and the batch the overhead was sized at. */
  gpus: number;
  batch: BatchShape;
  /** One GPU's load: its share of the weights and the cache, plus the overhead. */
  perGpuGiB: number;
  /** The whole deployment: weights + KV cache + the overhead on every GPU. */
  totalGiB: number;
  headDim: number;
  /** DeepSeek V4: of one request's cache, the compressed part that grows with the
   *  context and the window and compressor state sized for the tokens in flight. */
  compressed?: { growGiB: number; fixedGiB: number; inFlight: number; window: number };
}

export function resolveHeadDim(arch: ModelArch): number {
  if (arch.headDim && arch.headDim > 0) return arch.headDim;
  return Math.floor(arch.hiddenSize / arch.numAttentionHeads);
}

/** Bits a quantized weight takes with its scales: 4-bit formats keep a 16-bit
 *  scale (and zero) per group of 128, or an 8-bit scale per block of 32 (MXFP4),
 *  both about 4.25 bits. 8-bit formats carry per-channel or per-block scales. */
export const QUANT_BITS: Partial<Record<Dtype, number>> = { int4: 4.25, int8: 8, fp8: 8 };

/** Weight memory at a precision. A checkpoint that ships at that precision is
 *  sized by its files. Otherwise a quantized precision covers the transformer
 *  layers only: the embedding and the output head stay 16-bit, as AWQ, GPTQ,
 *  FP8-dynamic and NVFP4 checkpoints keep them. Checked against real checkpoints
 *  in scripts/test-calc.ts — Qwen3-8B-FP8-dynamic is 8.79 GiB on disk and here. */
export function weightsBytes(arch: ModelArch, dtype: Dtype): number {
  if (arch.shipped && arch.shipped.dtype === dtype) return arch.shipped.bytes;
  const bits = QUANT_BITS[dtype];
  if (bits && arch.vocabSize && arch.hiddenSize) {
    const embed = arch.vocabSize * arch.hiddenSize * (arch.tieEmbeddings ? 1 : 2);
    if (embed < arch.numParams) return ((arch.numParams - embed) * bits) / 8 + embed * 2;
  }
  return arch.numParams * DTYPE_BYTES[dtype];
}

/** KV cache bytes ONE layer keeps for ONE token. */
export function kvBytesPerLayerToken(arch: ModelArch, kvDtype: Dtype): number {
  // MLA caches a single compressed latent per token per layer — (d_c + d_h^R) —
  // shared across all heads, so neither the head count nor the head dim appears.
  // DeepSeek-V2 §2.1.3: "KV cache per token is (d_c + d_h^R)·l". Applying the
  // ordinary formula to these models overstates the cache badly: DeepSeek-V3 came
  // out 25x too large — 13.34 GiB at 8k context where the true figure is 0.54.
  if (usesMla(arch)) return (arch.kvLoraRank! + arch.qkRopeHeadDim!) * DTYPE_BYTES[kvDtype];
  // DeepSeek V4: one raw token in a layer's window, a single vector for K and V.
  if (usesCompressedAttn(arch)) return v4Bytes(arch, kvDtype).entry;
  // 2 = one tensor for K and one for V.
  return 2 * arch.numKeyValueHeads * resolveHeadDim(arch) * DTYPE_BYTES[kvDtype];
}

/** KV cache bytes for ONE token of ONE sequence, across every layer that keeps a
 *  cache: what a token costs while the context is shorter than any window. For
 *  DeepSeek V4, what each further token adds to a long context: a quarter of an
 *  entry and its indexer key in every CSA layer, a 128th of one in every HCA layer. */
export function kvBytesPerToken(arch: ModelArch, kvDtype: Dtype): number {
  if (usesCompressedAttn(arch)) {
    const c = arch.compressedAttn!;
    const b = v4Bytes(arch, kvDtype);
    return (c.csa * (b.entry + b.index)) / CSA_RATIO + (c.hca * b.entry) / HCA_RATIO;
  }
  return (arch.attnLayers ?? arch.numLayers) * kvBytesPerLayerToken(arch, kvDtype);
}

/**
 * DeepSeek V4 as vLLM 0.31.0 caches it (vllm/models/deepseek_v4/attention.py,
 * compressor.py, vllm/v1/attention/backends/mla/sparse_swa.py). One cached vector
 * serves as key and value, and a layer keeps up to three caches of them:
 *   - every layer, its last `window` (128) tokens as they are;
 *   - a CSA layer, one entry per 4 tokens, and beside each a 128-wide indexer key
 *     that picks which entries a query reads; an HCA layer, one entry per 128.
 * While a group of tokens is being folded into one entry, the compressor keeps the
 * group's projections and scores in fp32. The compressed caches are cut in blocks
 * of 256 tokens; the window and the compressor state are sliding windows, which
 * vLLM sizes for every token in flight as well (kvReservedPerSeq below).
 * At --kv-cache-dtype fp8, the default and on NVIDIA the only layout, an entry is
 * DeepSeek's fp8_ds_mla row: 448 fp8 values, the 64 positional ones kept in bf16
 * and a scale per 64 values, 584 bytes, with each page padded to 576 bytes. A
 * 16-bit cache keeps the 512 values plain. The indexer key is fp8 with an fp32
 * scale, 132 bytes, whatever the cache dtype. Treating every layer as keeping every
 * token made DeepSeek-V4-Flash's cache 11x too large at 256k tokens.
 */
const CSA_RATIO = 4;
const HCA_RATIO = 128;
/** --block-size the V4 recipe serves with: tokens per block of every compressed cache. */
const V4_BLOCK = 256;
/** Tokens per block of the window cache, and of the CSA and HCA compressor states. */
const V4_SWA_BLOCK = 64;
const V4_CSA_STATE_BLOCK = 4;
const V4_HCA_STATE_BLOCK = 8;

function v4Bytes(arch: ModelArch, kvDtype: Dtype) {
  const hd = resolveHeadDim(arch);
  const rope = arch.qkRopeHeadDim ?? 64;
  const packed = DTYPE_BYTES[kvDtype] < 2;
  const nope = hd - rope;
  const entry = packed ? nope + rope * 2 + Math.ceil(nope / 64 / 8) * 8 : hd * DTYPE_BYTES[kvDtype];
  const indexDim = arch.compressedAttn?.indexDim ?? 128;
  const align = packed ? 576 : 512;
  return {
    entry,
    index: indexDim + Math.ceil(indexDim / 128) * 4,
    page: (bytes: number) => Math.ceil(bytes / align) * align,
    // fp32 projection and score per token; a CSA compressor keeps two overlapping groups.
    csaState: 2 * 2 * hd * 4,
    indexState: 2 * 2 * indexDim * 4,
    hcaState: 2 * hd * 4,
  };
}

/** What ONE V4 request holds back in vLLM at `contextLength`, in two parts: the
 *  compressed caches, which grow with the context, and the window and compressor
 *  state, which vLLM sizes for `window − 1` tokens plus two batches in flight
 *  (SlidingWindowSpec.max_admission_blocks_per_request). */
function v4Reserved(arch: ModelArch, kvDtype: Dtype, contextLength: number, batchTokens: number) {
  const c = arch.compressedAttn!;
  const b = v4Bytes(arch, kvDtype);
  const blocks = Math.ceil(contextLength / V4_BLOCK);
  const perBlock =
    c.csa * (b.page((V4_BLOCK / CSA_RATIO) * b.entry) + b.page((V4_BLOCK / CSA_RATIO) * b.index)) +
    c.hca * b.page((V4_BLOCK / HCA_RATIO) * b.entry);
  const slide = (window: number, block: number) =>
    Math.ceil(Math.min(window - 1 + 2 * batchTokens, contextLength) / block) + 1;
  const csaWindow = 2 * CSA_RATIO;
  const fixed =
    arch.numLayers * slide(c.window, V4_SWA_BLOCK) * b.page(V4_SWA_BLOCK * b.entry) +
    c.csa * slide(csaWindow, V4_CSA_STATE_BLOCK) *
      (b.page(V4_CSA_STATE_BLOCK * b.csaState) + b.page(V4_CSA_STATE_BLOCK * b.indexState)) +
    c.hca * slide(HCA_RATIO, V4_HCA_STATE_BLOCK) * b.page(V4_HCA_STATE_BLOCK * b.hcaState);
  return { grow: blocks * perBlock, fixed, perBlock };
}

/** KV cache and fixed state ONE sequence holds at a context length: full-attention
 *  layers keep every token, sliding layers at most their window, and a hybrid's
 *  linear-attention or Mamba layers a fixed state. */
export function kvBytesPerSeq(arch: ModelArch, kvDtype: Dtype, contextLength: number): number {
  if (usesCompressedAttn(arch)) {
    const c = arch.compressedAttn!;
    const b = v4Bytes(arch, kvDtype);
    const at = (n: number) => Math.min(contextLength, n);
    return (
      arch.numLayers * at(c.window) * b.entry +
      c.csa * Math.floor(contextLength / CSA_RATIO) * (b.entry + b.index) +
      c.hca * Math.floor(contextLength / HCA_RATIO) * b.entry +
      c.csa * at(2 * CSA_RATIO) * (b.csaState + b.indexState) +
      c.hca * at(HCA_RATIO) * b.hcaState
    );
  }
  const perLayer = kvBytesPerLayerToken(arch, kvDtype);
  const layers = arch.attnLayers ?? arch.numLayers;
  const sliding = arch.slidingWindow ? Math.min(arch.slidingLayers ?? 0, layers) : 0;
  const windowed = sliding * Math.min(contextLength, arch.slidingWindow ?? contextLength);
  return perLayer * ((layers - sliding) * contextLength + windowed) + (arch.stateBytesPerSeq ?? 0);
}

/** How many ways the KV cache splits across `gpus`: by key-value head, so a model
 *  with fewer KV heads than GPUs replicates them, and MLA's single latent per token
 *  is held whole on every GPU (vLLM shards attention by head; the latent has none). */
export function kvSplit(arch: ModelArch, gpus: number): number {
  if (usesMla(arch) || usesCompressedAttn(arch)) return 1;
  return Math.max(1, Math.min(gpus, arch.numKeyValueHeads || gpus));
}

/** vLLM's KV block, in tokens (CacheConfig.block_size on CUDA). */
const VLLM_BLOCK = 16;

/**
 * KV cache and state vLLM 0.31.0 holds back for ONE request at `contextLength`:
 * the bound it sizes its pool and admits requests by
 * (get_max_concurrency_for_kv_cache_config in vllm/v1/core/kv_cache_utils.py,
 * max_admission_blocks_per_request in vllm/v1/kv_cache_interface.py). It is more
 * than the cache attention reads (kvBytesPerSeq) in three ways:
 *   - a sliding layer keeps window − 1 tokens plus every token in flight, two
 *     batches of max_num_batched_tokens under async scheduling, plus one block;
 *   - a Mamba or linear-attention layer keeps two state blocks (prefix caching's
 *     "align" mode), and the attention layers' blocks grow to the state's page;
 *   - each kind of layer is cut into groups of equal size, the last one padded.
 * Checked against vLLM's own figures for Gemma 3 1B (51.0× vs 51.02×) and
 * Granite 4.0-H Micro (23.2× vs 23.21×) in scripts/test-vllmlog.ts.
 */
/** How vLLM lays out a model's cache: one block size and page for every layer, and
 *  how many equal groups each kind of layer is cut into. */
function kvLayout(arch: ModelArch, kvDtype: Dtype) {
  const perLayer = kvBytesPerLayerToken(arch, kvDtype);
  const attn = arch.attnLayers ?? arch.numLayers;
  const sliding = arch.slidingWindow ? Math.min(arch.slidingLayers ?? 0, attn) : 0;
  const full = attn - sliding;
  const stateLayers = arch.stateBytesPerSeq ? arch.stateLayers ?? 0 : 0;
  const statePerLayer = stateLayers ? arch.stateBytesPerSeq! / stateLayers : 0;
  // One page size for every layer: an attention block holds at least one state.
  const block = statePerLayer > 0 && perLayer > 0 ? Math.ceil(statePerLayer / perLayer / VLLM_BLOCK) * VLLM_BLOCK : VLLM_BLOCK;
  const page = Math.max(block * perLayer, statePerLayer);
  const kinds = [full, sliding, stateLayers].filter((n) => n > 0);
  if (!kinds.length || !(page > 0)) return null;
  const lo = Math.min(...kinds);
  const hi = Math.max(...kinds);
  // The fewest layers of any kind sets the group, unless the kinds are close in size.
  const group = hi < lo * 1.5 ? hi : lo;
  const groups = (n: number) => Math.ceil(n / group);
  return { block, page, group, full: groups(full), sliding: sliding ? groups(sliding) : 0, state: groups(stateLayers) };
}

/**
 * KV cache and state vLLM 0.31.0 holds back for ONE request at `contextLength`:
 * the bound it sizes its pool and admits requests by
 * (get_max_concurrency_for_kv_cache_config in vllm/v1/core/kv_cache_utils.py,
 * max_admission_blocks_per_request in vllm/v1/kv_cache_interface.py). It is more
 * than the cache attention reads (kvBytesPerSeq) in three ways:
 *   - a sliding layer keeps window − 1 tokens plus every token in flight, two
 *     batches of max_num_batched_tokens under async scheduling, plus one block;
 *   - a Mamba or linear-attention layer keeps two state blocks (prefix caching's
 *     "align" mode), and the attention layers' blocks grow to the state's page;
 *   - each kind of layer is cut into groups of equal size, the last one padded.
 * Checked against vLLM's own figures for Gemma 3 1B (51.0× vs 51.02×) and
 * Granite 4.0-H Micro (23.2× vs 23.21×) in scripts/test-vllmlog.ts.
 */
export function kvReservedPerSeq(arch: ModelArch, kvDtype: Dtype, contextLength: number, batchTokens = 2048): number {
  if (usesCompressedAttn(arch)) {
    const r = v4Reserved(arch, kvDtype, contextLength, batchTokens);
    return r.grow + r.fixed;
  }
  const l = kvLayout(arch, kvDtype);
  if (!l) return 0;
  const blocksOf = (tokens: number) => Math.ceil(tokens / l.block);
  let blocks = l.full * blocksOf(contextLength);
  if (l.sliding) blocks += l.sliding * (blocksOf(Math.min(arch.slidingWindow! - 1 + 2 * batchTokens, contextLength)) + 1);
  blocks += l.state * 2;
  return blocks * l.group * l.page;
}

/** A load as it runs, not at its limit: what an average request sends and gets
 *  back, and how much of every prompt is the same (a system prompt, few-shot
 *  examples) and so cached once. */
export interface TypicalLoad {
  promptTokens: number;
  outputTokens: number;
  sharedPrefix: number;
}

/** Tokens an average request holds while it is served: its prompt and, since
 *  requests are at different points of their replies, half its reply. */
export function tokensInUse(load: TypicalLoad, contextLength: number): number {
  return Math.max(1, Math.min(contextLength, Math.round(load.promptTokens + load.outputTokens / 2)));
}

/** The part of a request's cache prefix caching shares: the full-attention
 *  layers' whole blocks of the common prefix. Sliding layers keep only their
 *  window and a hybrid's state is per request, so neither is shared. */
export function kvSharedPrefix(arch: ModelArch, kvDtype: Dtype, prefixTokens: number): number {
  // DeepSeek V4 shares its compressed caches' whole 256-token blocks.
  if (usesCompressedAttn(arch)) return Math.floor(Math.max(0, prefixTokens) / V4_BLOCK) * v4Reserved(arch, kvDtype, 1, 1).perBlock;
  const l = kvLayout(arch, kvDtype);
  if (!l || !l.full) return 0;
  return l.full * Math.floor(Math.max(0, prefixTokens) / l.block) * l.group * l.page;
}

/**
 * How many requests one GPU (or each of a tensor-parallel group) serves at once
 * under a typical load. vLLM hands out KV blocks as tokens arrive, so what bounds
 * concurrency in practice is the cache requests actually hold, not the
 * full-context reservation its "Maximum concurrency" line reports; and a shared
 * prefix sits in the pool once. max_num_seqs caps it either way.
 */
export function typicalConcurrency(
  input: Omit<CalcInput, "concurrency">,
  usableGiB: number,
  load: TypicalLoad,
): { users: number; inUse: number; capped: boolean } {
  const inUse = tokensInUse(load, input.contextLength);
  const room = kvRoom(input, usableGiB) * kvSplit(input.arch, input.gpus ?? 1);
  const batch = input.batch ?? SMALL_CARD_BATCH;
  const per = kvReservedPerSeq(input.arch, input.kvDtype, inUse, batch.tokens);
  const shared = Math.min(kvSharedPrefix(input.arch, input.kvDtype, Math.min(load.sharedPrefix, inUse)), per);
  if (room <= 0 || !(per > 0)) return { users: 0, inUse, capped: false };
  // The shared blocks sit in the pool once; each request adds the rest of its own.
  const unique = per - shared;
  const fit = unique > 0 ? Math.floor((room - shared) / unique) : batch.seqs;
  const users = Math.max(0, Math.min(fit, batch.seqs));
  return { users, inUse, capped: fit > batch.seqs };
}

export function calculate(input: CalcInput): CalcResult {
  const { arch, weightDtype, kvDtype, contextLength, concurrency } = input;
  const gpus = Math.max(1, input.gpus ?? 1);

  const headDim = resolveHeadDim(arch);
  const weights = weightsBytes(arch, weightDtype);
  const kvPerToken = kvBytesPerToken(arch, kvDtype);
  // Sized as vLLM reserves it, at the batch it profiles with.
  const kvPerSeq = kvReservedPerSeq(arch, kvDtype, contextLength, (input.batch ?? SMALL_CARD_BATCH).tokens);
  const kvTotal = kvPerSeq * concurrency;

  const o = overheadPerGpu(arch, input.batch, gpus);
  const perGpu = (weights / gpus + kvTotal / kvSplit(arch, gpus)) / BYTES_PER_GIB + o.totalGiB;

  const result: CalcResult = {
    weightsGiB: weights / BYTES_PER_GIB,
    kvCacheGiB: kvTotal / BYTES_PER_GIB,
    kvPerSeqGiB: kvPerSeq / BYTES_PER_GIB,
    kvPerTokenBytes: kvPerToken,
    activationsGiB: o.activationGiB,
    runtimeGiB: o.runtimeGiB + o.graphsGiB,
    gpus,
    batch: input.batch ?? SMALL_CARD_BATCH,
    perGpuGiB: perGpu,
    totalGiB: (weights + kvTotal) / BYTES_PER_GIB + gpus * o.totalGiB,
    headDim,
  };
  if (usesCompressedAttn(arch)) {
    const tokens = (input.batch ?? SMALL_CARD_BATCH).tokens;
    const r = v4Reserved(arch, kvDtype, contextLength, tokens);
    result.compressed = { growGiB: r.grow / BYTES_PER_GIB, fixedGiB: r.fixed / BYTES_PER_GIB, inFlight: 2 * tokens, window: arch.compressedAttn!.window };
  }
  return result;
}

/** What each GPU has left for the KV cache once its share of the weights and the
 *  overhead are in, in bytes (negative when they do not fit). */
function kvRoom(input: Omit<CalcInput, "concurrency" | "contextLength">, usableGiB: number): number {
  const gpus = Math.max(1, input.gpus ?? 1);
  const o = overheadPerGpu(input.arch, input.batch, gpus);
  return (usableGiB - o.totalGiB) * BYTES_PER_GIB - weightsBytes(input.arch, input.weightDtype) / gpus;
}

/**
 * Reverse calculation: given each GPU's usable memory (GiB) and everything except
 * concurrency, how many concurrent sequences fit?
 * Returns 0 if the model weights alone don't fit.
 */
export function maxConcurrency(input: Omit<CalcInput, "concurrency">, usableGiB: number): number {
  const room = kvRoom(input, usableGiB);
  if (room <= 0) return 0;
  const kvPerSeq = kvReservedPerSeq(input.arch, input.kvDtype, input.contextLength, (input.batch ?? SMALL_CARD_BATCH).tokens);
  // Guard a degenerate arch (0 KV heads / 0 context) so we never divide by zero
  // and surface an "Infinity" in the UI.
  if (!(kvPerSeq > 0)) return 0;
  return Math.floor((room * kvSplit(input.arch, input.gpus ?? 1)) / kvPerSeq);
}

/**
 * Reverse calculation: max context length for a single sequence given each GPU's
 * usable memory.
 */
export function maxContextLength(input: Omit<CalcInput, "contextLength">, usableGiB: number): number {
  const { arch, kvDtype, concurrency } = input;
  if (!(concurrency > 0)) return 0;
  const perSeq = (kvRoom(input, usableGiB) * kvSplit(arch, input.gpus ?? 1)) / concurrency;
  const tokens = (input.batch ?? SMALL_CARD_BATCH).tokens;
  const need = (ctx: number) => kvReservedPerSeq(arch, kvDtype, ctx, tokens);
  if (perSeq <= 0 || !(need(VLLM_BLOCK) > 0) || need(1) > perSeq) return 0;
  // The reservation grows with the context, in steps of a block; past the
  // sliding layers' bound only the full-attention layers keep growing, and a
  // model with none stops growing at all.
  const far = 2 ** 40;
  if (need(far) <= perSeq) return arch.maxContext ?? Number.MAX_SAFE_INTEGER;
  let lo = 1;
  let hi = 2;
  while (need(hi) <= perSeq) {
    lo = hi;
    hi *= 2;
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (need(mid) <= perSeq) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** The fewest GPUs of `usableGiB` each that hold the deployment, counting the
 *  overhead on every one; by default only sizes vLLM can split the heads across
 *  (`validOnly` false counts memory alone). null when no size up to `limit` does. */
export function gpusNeeded(input: CalcInput, usableGiB: number, limit = 64, validOnly = true): number | null {
  const heads = input.arch.numAttentionHeads;
  const kv = input.arch.numKeyValueHeads || heads;
  for (let n = 1; n <= limit; n++) {
    if (validOnly && n > 1 && !tpValid(n, heads, kv)) continue;
    if (calculate({ ...input, gpus: n }).perGpuGiB <= usableGiB) return n;
  }
  return null;
}
