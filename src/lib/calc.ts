// Core VRAM sizing engine.
// All math is pure and React-free so it can be unit-tested with `node calc.ts`.

import { COMM_GIB, overheadPerGpu, SMALL_CARD_BATCH, type BatchShape } from "./overhead.ts";
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
   *  per 128. The entry is one `headDim`-wide vector serving as key and value. A CSA
   *  query reads the `topk` entries its indexer picks (config `index_topk`, 512). */
  compressedAttn?: { csa: number; hca: number; window: number; indexDim: number; topk?: number };
  /** DeepSeek Sparse Attention (V3.2, GLM-5; config `index_topk`). Beside MLA's
   *  latent, `indexLayers` layers keep an `indexDim`-wide indexer key for every
   *  token, and a query reads only the `topk` tokens the indexer picks. */
  sparseAttn?: { topk: number; indexDim: number; indexLayers: number };
  /** Config keys that shape the cache in ways the sizing does not model yet
   *  (layers.ts, unmodelledCacheKeys). The figures for such a model are approximate. */
  unmodelled?: string[];
  /** Layers that keep a KV cache, when not all of them do: hybrids keep a fixed
   *  state in their linear-attention or Mamba layers instead (layers.ts). */
  attnLayers?: number;
  /** Of the cache-keeping layers, how many keep only the last `slidingWindow`
   *  tokens (Gemma 2 and 3, gpt-oss). */
  slidingLayers?: number;
  slidingWindow?: number;
  /** The full-attention layers' own key-value shape, where it differs from the
   *  sliding layers' (numKeyValueHeads × headDim): Gemma 4 widens its global
   *  layers' heads to `global_head_dim` and, with `attention_k_eq_v`, keeps
   *  `num_global_key_value_heads` of them (vllm/transformers_utils/configs/gemma4.py). */
  globalAttn?: { kvHeads: number; headDim: number };
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
  // A positional part of 0 is still MLA: GLM-5.3-Flash caches its 512-wide latent
  // with no RoPE key, and read as per-head attention its cache came out 16x too large.
  return !!arch.kvLoraRank && typeof arch.qkRopeHeadDim === "number" && arch.qkRopeHeadDim >= 0;
}

/** Does it keep an indexer key beside MLA's latent and read only the top-k tokens? */
export function usesDsa(arch: ModelArch): boolean {
  return usesMla(arch) && !!arch.sparseAttn && arch.sparseAttn.topk > 0;
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

/** KV cache bytes ONE layer keeps for ONE token. For DeepSeek Sparse Attention,
 *  the latent's row only: kvBytesPerToken adds the indexer keys. */
export function kvBytesPerLayerToken(arch: ModelArch, kvDtype: Dtype): number {
  if (usesDsa(arch)) return dsaBytes(arch, kvDtype).row;
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

/** The same for a full-attention layer, which in Gemma 4 has a shape of its own
 *  (ModelArch.globalAttn). Gemma 4's `attention_k_eq_v` loads one projection into
 *  both K and V, but vLLM still caches the two (gemma4.py). */
export function kvBytesPerFullLayerToken(arch: ModelArch, kvDtype: Dtype): number {
  const g = arch.globalAttn;
  if (!g || usesMla(arch) || usesCompressedAttn(arch)) return kvBytesPerLayerToken(arch, kvDtype);
  return 2 * g.kvHeads * g.headDim * DTYPE_BYTES[kvDtype];
}

/** Layers that keep a cache, split by kind: full attention, sliding window. */
function attnCounts(arch: ModelArch): { full: number; sliding: number } {
  const attn = arch.attnLayers ?? arch.numLayers;
  const sliding = arch.slidingWindow ? Math.min(arch.slidingLayers ?? 0, attn) : 0;
  return { full: attn - sliding, sliding };
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
  if (usesDsa(arch)) {
    // A hybrid (GLM-5.3-Flash) keeps the latent and the key in its attention layers only.
    const b = dsaBytes(arch, kvDtype);
    const layers = arch.attnLayers ?? arch.numLayers;
    return layers * b.row + Math.min(arch.sparseAttn!.indexLayers, layers) * b.index;
  }
  const n = attnCounts(arch);
  return n.full * kvBytesPerFullLayerToken(arch, kvDtype) + n.sliding * kvBytesPerLayerToken(arch, kvDtype);
}

/**
 * DeepSeek Sparse Attention (DeepSeek-V3.2, GLM-5) as vLLM 0.31.0 caches it
 * (vllm/models/deepseek_v32/attention.py; MLAAttention.get_kv_cache_spec in
 * vllm/model_executor/layers/attention/mla_attention.py; DeepseekV32IndexerCache in
 * vllm/model_executor/models/deepseek_v2.py). Every layer keeps MLA's latent, and
 * every layer with an indexer one key per token beside it:
 *   - the latent at 16-bit is (kv_lora_rank + qk_rope_head_dim) values, 1,152 bytes;
 *     at --kv-cache-dtype fp8 FlashMLA's sparse kernel reads it as its "FP8 with
 *     scale" row, 656 bytes: 512 fp8 NoPE values, an fp32 scale per 128 of them and
 *     the 64 RoPE values in bf16 (FlashMLA README at ba89a34; vLLM's fp8_ds_mla);
 *   - the indexer key is fp8 with an fp32 scale per 128 values, 132 bytes, at any
 *     --kv-cache-dtype.
 * Both are full-attention specs with the same 64-token block (FlashMLA's sparse
 * kernel block), so vLLM puts them in one KV cache group and pads neither page
 * (UniformTypeKVCacheSpecs in vllm/v1/kv_cache_interface.py). On B200 and B300 vLLM
 * runs an fp8 cache through FlashInfer's sparse kernel instead, which keeps the
 * latent in the plain 576 bytes: there the figure is about 11% high.
 * Counting the latent alone made DeepSeek-V3.2's cache 10% too small at 16-bit and
 * 27% too small at fp8.
 */
const DSA_BLOCK = 64;

function dsaBytes(arch: ModelArch, kvDtype: Dtype) {
  const s = arch.sparseAttn!;
  const nope = arch.kvLoraRank!;
  const rope = arch.qkRopeHeadDim!;
  const row = DTYPE_BYTES[kvDtype] < 2 ? nope + Math.ceil(nope / 128) * 4 + rope * 2 : (nope + rope) * DTYPE_BYTES[kvDtype];
  return { row, index: s.indexDim + Math.ceil(s.indexDim / 128) * 4 };
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
/** Entries a CSA query reads when the config does not say (DeepSeek-V4-Flash's index_topk). */
const V4_TOPK = 512;
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
  if (usesDsa(arch)) return kvBytesPerToken(arch, kvDtype) * contextLength;
  const n = attnCounts(arch);
  const windowed = n.sliding * Math.min(contextLength, arch.slidingWindow ?? contextLength);
  return (
    kvBytesPerFullLayerToken(arch, kvDtype) * n.full * contextLength +
    kvBytesPerLayerToken(arch, kvDtype) * windowed +
    (arch.stateBytesPerSeq ?? 0)
  );
}

/** KV cache bytes ONE decode step reads for ONE sequence: all a sequence holds
 *  (kvBytesPerSeq), except in a model that reads sparsely. DeepSeek Sparse Attention
 *  reads every indexer key and the `topk` latents the indexer picks. DeepSeek V4
 *  reads every layer's window and every HCA entry, and in a CSA layer every indexer
 *  key and the `topk` entries picked from the compressed context, all of them while
 *  there are no more (vLLM 0.31.0, vllm/models/deepseek_v4/attention.py). A V4
 *  compressor's working state is read once per group it folds, so it is left out. */
export function kvBytesReadPerStep(arch: ModelArch, kvDtype: Dtype, contextLength: number): number {
  if (usesDsa(arch)) {
    const s = arch.sparseAttn!;
    const b = dsaBytes(arch, kvDtype);
    const layers = arch.attnLayers ?? arch.numLayers;
    return layers * Math.min(contextLength, s.topk) * b.row + Math.min(s.indexLayers, layers) * contextLength * b.index;
  }
  if (usesCompressedAttn(arch)) {
    const c = arch.compressedAttn!;
    const b = v4Bytes(arch, kvDtype);
    const csaEntries = Math.floor(contextLength / CSA_RATIO);
    return (
      arch.numLayers * Math.min(contextLength, c.window) * b.entry +
      c.csa * (Math.min(csaEntries, c.topk ?? V4_TOPK) * b.entry + csaEntries * b.index) +
      c.hca * Math.floor(contextLength / HCA_RATIO) * b.entry
    );
  }
  return kvBytesPerSeq(arch, kvDtype, contextLength);
}

/** How many ways the KV cache splits across `gpus`: by key-value head, so a model
 *  with fewer KV heads than GPUs replicates them, and MLA's single latent per token
 *  is held whole on every GPU (vLLM shards attention by head; the latent has none).
 *  A model whose layers differ in head count (Gemma 4) splits each kind its own
 *  way: kvReservedPerSeq takes the tensor-parallel size and sizes one GPU's share. */
export function kvSplit(arch: ModelArch, gpus: number): number {
  if (usesMla(arch) || usesCompressedAttn(arch)) return 1;
  return Math.max(1, Math.min(gpus, arch.numKeyValueHeads || gpus));
}

/** One GPU's share of a cache with `heads` key-value heads over `tp` GPUs. */
function headShare(heads: number, tp: number): number {
  return 1 / Math.max(1, Math.min(tp, heads || tp));
}

/** vLLM's KV block, in tokens (CacheConfig.block_size on CUDA). */
const VLLM_BLOCK = 16;

/**
 * How vLLM 0.31.0 lays out a model's cache on one GPU of a `tp`-wide group: the
 * page every layer's block takes, and for each kind of layer — full attention,
 * sliding window, fixed state — how many tokens a block holds and how many equal
 * groups the kind is cut into.
 *   - A hybrid's attention block grows until its page holds a state
 *     (Platform._align_hybrid_block_size; to a multiple of 128 tokens under MLA).
 *   - Kinds whose page is smaller then scale their block until the pages are equal,
 *     or pad the page when it does not divide; a state's page is padded
 *     (unify_kv_cache_spec_page_size in vllm/v1/core/kv_cache_utils.py). Gemma 4's
 *     global layers, 4 heads of 512 against 16 of 256, take 32-token blocks.
 *   - The fewest layers of any kind set the group size, unless the kinds are close
 *     in size (_get_kv_cache_groups_uniform_page_size).
 */
function kvLayout(arch: ModelArch, kvDtype: Dtype, tp = 1) {
  const n = attnCounts(arch);
  const mla = usesMla(arch);
  const share = mla ? 1 : headShare(arch.numKeyValueHeads, tp);
  const slidingTok = kvBytesPerLayerToken(arch, kvDtype) * share;
  const fullTok = kvBytesPerFullLayerToken(arch, kvDtype) * (mla || !arch.globalAttn ? share : headShare(arch.globalAttn.kvHeads, tp));
  const stateLayers = arch.stateBytesPerSeq ? arch.stateLayers ?? 0 : 0;
  // A state splits by its own heads; vLLM shards Mamba and linear-attention heads
  // as it shards attention, so the KV heads' split stands in for it.
  const statePerLayer = stateLayers ? (arch.stateBytesPerSeq! / stateLayers) * headShare(arch.numKeyValueHeads, tp) : 0;
  const baseTok = n.full ? fullTok : slidingTok;
  const align = mla ? 128 : VLLM_BLOCK;
  const base = statePerLayer > 0 && baseTok > 0 ? Math.ceil(statePerLayer / baseTok / align) * align : VLLM_BLOCK;
  const attn = [
    { layers: n.full, tok: fullTok, sliding: false },
    { layers: n.sliding, tok: slidingTok, sliding: true },
  ].filter((k) => k.layers > 0);
  const page = Math.max(statePerLayer, ...attn.map((k) => base * k.tok));
  const counts = [...attn.map((k) => k.layers), stateLayers].filter((x) => x > 0);
  if (!counts.length || !(page > 0)) return null;
  const lo = Math.min(...counts);
  const hi = Math.max(...counts);
  const group = hi < lo * 1.5 ? hi : lo;
  const groups = (x: number) => Math.ceil(x / group);
  const kinds = attn.map((k) => {
    const own = base * k.tok;
    // A page that divides the largest grows its block; one that does not is padded.
    const ratio = page / own;
    const block = Math.abs(ratio - Math.round(ratio)) < 1e-9 ? base * Math.round(ratio) : base;
    return { sliding: k.sliding, block, groups: groups(k.layers) };
  });
  return { page, group, kinds, state: groups(stateLayers) };
}

/**
 * KV cache and state vLLM 0.31.0 holds back for ONE request at `contextLength`,
 * on one GPU of a `tp`-wide tensor-parallel group (the whole cache at the default
 * 1): the bound it sizes its pool and admits requests by
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
export function kvReservedPerSeq(arch: ModelArch, kvDtype: Dtype, contextLength: number, batchTokens = 2048, tp = 1): number {
  if (usesCompressedAttn(arch)) {
    const r = v4Reserved(arch, kvDtype, contextLength, batchTokens);
    return r.grow + r.fixed;
  }
  if (usesDsa(arch)) return Math.ceil(contextLength / DSA_BLOCK) * DSA_BLOCK * kvBytesPerToken(arch, kvDtype);
  const l = kvLayout(arch, kvDtype, tp);
  if (!l) return 0;
  let blocks = l.state * 2;
  for (const k of l.kinds) {
    const tokens = k.sliding ? Math.min(arch.slidingWindow! - 1 + 2 * batchTokens, contextLength) : contextLength;
    blocks += k.groups * (Math.ceil(tokens / k.block) + (k.sliding ? 1 : 0));
  }
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
export function kvSharedPrefix(arch: ModelArch, kvDtype: Dtype, prefixTokens: number, tp = 1): number {
  // DeepSeek V4 shares its compressed caches' whole 256-token blocks.
  if (usesCompressedAttn(arch)) return Math.floor(Math.max(0, prefixTokens) / V4_BLOCK) * v4Reserved(arch, kvDtype, 1, 1).perBlock;
  if (usesDsa(arch)) return Math.floor(Math.max(0, prefixTokens) / DSA_BLOCK) * DSA_BLOCK * kvBytesPerToken(arch, kvDtype);
  const l = kvLayout(arch, kvDtype, tp);
  const full = l?.kinds.find((k) => !k.sliding);
  if (!l || !full) return 0;
  return full.groups * Math.floor(Math.max(0, prefixTokens) / full.block) * l.group * l.page;
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
  const tp = input.gpus ?? 1;
  const room = kvRoom(input, usableGiB);
  const batch = input.batch ?? SMALL_CARD_BATCH;
  const per = kvReservedPerSeq(input.arch, input.kvDtype, inUse, batch.tokens, tp);
  const shared = Math.min(kvSharedPrefix(input.arch, input.kvDtype, Math.min(load.sharedPrefix, inUse), tp), per);
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
  const tokens = (input.batch ?? SMALL_CARD_BATCH).tokens;
  const kvPerSeq = kvReservedPerSeq(arch, kvDtype, contextLength, tokens);
  const kvTotal = kvPerSeq * concurrency;

  const o = overheadPerGpu(arch, input.batch, gpus);
  // Each GPU holds its share of every request's cache: its key-value heads, or a
  // replica of one where a kind of layer has fewer heads than GPUs.
  const kvPerGpu = (gpus > 1 ? kvReservedPerSeq(arch, kvDtype, contextLength, tokens, gpus) : kvPerSeq) * concurrency;
  const perGpu = (weights / gpus + kvPerGpu) / BYTES_PER_GIB + o.totalGiB;

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
  const kvPerSeq = kvReservedPerSeq(input.arch, input.kvDtype, input.contextLength, (input.batch ?? SMALL_CARD_BATCH).tokens, input.gpus ?? 1);
  // Guard a degenerate arch (0 KV heads / 0 context) so we never divide by zero
  // and surface an "Infinity" in the UI.
  if (!(kvPerSeq > 0)) return 0;
  return Math.floor(room / kvPerSeq);
}

/**
 * Reverse calculation: max context length for a single sequence given each GPU's
 * usable memory.
 */
export function maxContextLength(input: Omit<CalcInput, "contextLength">, usableGiB: number): number {
  const { arch, kvDtype, concurrency } = input;
  if (!(concurrency > 0)) return 0;
  const perSeq = kvRoom(input, usableGiB) / concurrency;
  return contextWithin(arch, kvDtype, (input.batch ?? SMALL_CARD_BATCH).tokens, perSeq, input.gpus ?? 1);
}

/** The longest context whose reservation on one GPU of a `tp`-wide group fits in
 *  `perSeq` bytes, up to the model's own. */
function contextWithin(arch: ModelArch, kvDtype: Dtype, tokens: number, perSeq: number, tp = 1): number {
  const need = (ctx: number) => kvReservedPerSeq(arch, kvDtype, ctx, tokens, tp);
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
  // Memory may hold more than the model reads: Qwen3-30B-A3B on one RTX PRO 6000
  // has room for 81k tokens a request at four requests, past its 40,960.
  return Math.min(lo, arch.maxContext ?? Infinity);
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

/** Bytes of the weights in routed experts: what expert parallelism shards. Each
 *  token skips experts − k of them, so the total less the active parameters is
 *  (experts − k)/experts of all expert weights. 0 for a dense model. */
export function expertWeightBytes(arch: ModelArch, dtype: Dtype): number {
  const e = arch.numExperts ?? 0;
  const k = arch.expertsPerToken ?? 0;
  if (e <= 1 || k <= 0 || k >= e || !arch.activeParams || !(arch.numParams > 0)) return 0;
  const params = ((arch.numParams - arch.activeParams) * e) / (e - k);
  return params > 0 && params < arch.numParams ? weightsBytes(arch, dtype) * (params / arch.numParams) : 0;
}

/**
 * How a deployment spreads over GPUs: `dp` replicas, each `pp` pipeline stages of
 * `tp` tensor-parallel GPUs, every replica serving its share of the requests. A
 * stage holds its share of the layers, and with them of the weights and the cache.
 * With `ep` a MoE runs its attention data-parallel and spreads its routed experts
 * over the tp × dp GPUs of each stage (vLLM's --data-parallel-size with
 * --enable-expert-parallel, the layout DeepSeek's vLLM recipes use).
 */
export interface Layout {
  gpus: number;
  tp: number;
  pp: number;
  dp: number;
  ep: boolean;
  /** Requests each replica serves, and what the busiest GPU of the layout holds. */
  usersPerReplica: number;
  perGpuGiB: number;
}

type Shape = Pick<Layout, "tp" | "pp" | "dp" | "ep">;

/** Pipeline stages vLLM is asked for in practice; past these the stages idle more
 *  than they hold. */
const MAX_PP = 16;

/** Everything a layout's per-GPU sum reads that does not depend on the layout,
 *  worked out once: what one request's cache reserves, and the weights. */
function layoutBasis(input: Omit<CalcInput, "concurrency">) {
  const { arch, weightDtype, kvDtype, contextLength } = input;
  const batch = input.batch ?? SMALL_CARD_BATCH;
  const overhead = new Map<number, number>();
  const request = new Map<number, number>();
  return {
    arch,
    batch,
    layers: Math.max(1, arch.numLayers),
    experts: arch.numExperts ?? 0,
    weights: weightsBytes(arch, weightDtype),
    expertBytes: expertWeightBytes(arch, weightDtype),
    /** What one request's cache reserves on a GPU of a tensor-parallel group, cached. */
    perRequest(tp: number): number {
      if (!request.has(tp)) request.set(tp, kvReservedPerSeq(arch, kvDtype, contextLength, batch.tokens, tp));
      return request.get(tp)!;
    },
    /** Overhead per GPU at a tensor-parallel size (overhead.ts), cached. */
    overhead(tp: number): number {
      if (!overhead.has(tp)) overhead.set(tp, overheadPerGpu(arch, batch, tp).totalGiB);
      return overhead.get(tp)!;
    },
  };
}
type Basis = ReturnType<typeof layoutBasis>;

/** The busiest pipeline stage's share of the layers: vLLM spreads the remainder
 *  of an uneven split over the stages before the last (get_pp_indices). */
function stageShare(b: Basis, pp: number): number {
  return Math.ceil(b.layers / pp) / b.layers;
}

/** What a layout's busiest GPU holds besides the cache, in GiB: its share of the
 *  weights, the overhead, and buffers to exchange tokens when no tensor-parallel
 *  group already keeps them. Expert parallelism gives the first GPUs one expert
 *  more when the experts do not split evenly (vLLM's determine_expert_map). */
function layoutFixedGiB(b: Basis, l: Shape): number {
  const stage = stageShare(b, l.pp);
  const experts = l.ep ? b.expertBytes : 0;
  const expertShare = l.ep ? Math.ceil(b.experts / (l.tp * l.dp)) / b.experts : 1 / l.tp;
  const weights = ((b.weights - experts) / l.tp + experts * expertShare) * stage;
  const comm = l.tp === 1 && (l.ep || l.pp > 1) ? COMM_GIB : 0;
  return weights / BYTES_PER_GIB + b.overhead(l.tp) + comm;
}

/** One request's cache on a GPU of the layout, in GiB: its stage's layers, split
 *  across the tensor-parallel group as far as the KV heads go. */
function layoutRequestGiB(b: Basis, l: Shape): number {
  return (b.perRequest(l.tp) * stageShare(b, l.pp)) / BYTES_PER_GIB;
}

function layoutPerGpu(b: Basis, l: Shape, users: number): number {
  return layoutFixedGiB(b, l) + Math.ceil(Math.max(1, users) / l.dp) * layoutRequestGiB(b, l);
}

/**
 * The fewest GPUs of `usableGiB` each that serve the deployment, and how: replicas
 * of tensor-parallel groups vLLM accepts, split into pipeline stages when that
 * helps, and for a MoE data-parallel attention with its experts spread over the
 * GPUs. Tensor parallelism alone cannot hold more requests than one card's cache
 * once the KV heads run out (one MLA latent or one KV head is held whole on every
 * GPU); pipeline stages and replicas can. It searches what layoutsOn sizes: up to
 * MAX_PP stages, experts split evenly or not. Adding requests or context never
 * lowers the count. Of the layouts on that many GPUs it returns the one layoutsOn puts first,
 * the one that holds the most requests. null when none up to `limit` GPUs does.
 */
export function layoutFor(input: CalcInput, usableGiB: number, limit = 1024): Layout | null {
  const b = layoutBasis(input);
  const { arch } = input;
  const heads = arch.numAttentionHeads;
  const kv = arch.numKeyValueHeads || heads;
  const users = Math.max(1, input.concurrency);
  const moe = b.expertBytes > 0;
  let best: Layout | null = null;
  const better = (l: Layout) =>
    !best || l.gpus < best.gpus || (l.gpus === best.gpus && (l.pp < best.pp || (l.pp === best.pp && l.dp < best.dp)));
  for (let tp = 1; tp <= Math.min(heads, limit); tp++) {
    if (!tpValid(tp, heads, kv)) continue;
    for (let pp = 1; pp <= Math.min(MAX_PP, b.layers, Math.floor(limit / tp)); pp++) {
      for (const ep of moe ? [false, true] : [false]) {
        // Without expert parallelism, replicas past one per request add nothing.
        const top = ep ? Math.floor(limit / (tp * pp)) : Math.min(Math.floor(limit / (tp * pp)), users);
        // Replica counts to try, ascending; expert parallelism needs two or more.
        const first = ep ? 2 : 1;
        const count = (i: number) => first + i;
        const n = top - first + 1;
        const fits = (dp: number) => layoutPerGpu(b, { tp, pp, dp, ep }, users) <= usableGiB;
        if (n < 1 || !fits(count(n - 1))) continue;
        // What a GPU holds only falls as replicas are added: halve towards the fewest.
        let lo = -1;
        let hi = n - 1;
        while (hi - lo > 1) {
          const mid = Math.floor((lo + hi) / 2);
          if (fits(count(mid))) hi = mid;
          else lo = mid;
        }
        const dp = count(hi);
        const l: Layout = { gpus: tp * pp * dp, tp, pp, dp, ep, usersPerReplica: Math.ceil(users / dp), perGpuGiB: layoutPerGpu(b, { tp, pp, dp, ep }, users) };
        if (better(l)) best = l;
      }
    }
  }
  // Of the layouts on that many GPUs, the one the count's own sizing puts first,
  // so the fewest GPUs and those GPUs given as the count agree on how to run it.
  if (!best) return null;
  return layoutsOn(input, usableGiB, best.gpus).find((f) => f.fits)?.layout ?? best;
}

/** One layout of a given number of GPUs, sized for a load. */
export interface LayoutFit {
  layout: Layout;
  /** Whether the requests at the context fit, and the most of each it holds:
   *  requests at this context, and context for this many requests. */
  fits: boolean;
  maxUsers: number;
  maxContext: number;
}

/**
 * Every way vLLM can run the deployment on exactly `gpus` GPUs of `usableGiB`
 * each — tensor parallel where the heads allow, up to MAX_PP pipeline stages,
 * replicas, and for a MoE expert parallelism, the experts split evenly or not —
 * the best first: the most requests at this context, then fewer pipeline stages,
 * then fewer replicas. The same rules layoutFor searches.
 */
export function layoutsOn(input: CalcInput, usableGiB: number, gpus: number): LayoutFit[] {
  const b = layoutBasis(input);
  const { arch, kvDtype } = input;
  const heads = arch.numAttentionHeads;
  const kv = arch.numKeyValueHeads || heads;
  const users = Math.max(1, input.concurrency);
  const moe = b.expertBytes > 0;
  const out: LayoutFit[] = [];
  for (let tp = 1; tp <= gpus; tp++) {
    if (gpus % tp || !tpValid(tp, heads, kv)) continue;
    for (let pp = 1; pp <= Math.min(gpus / tp, MAX_PP); pp++) {
      if ((gpus / tp) % pp || pp > b.layers) continue;
      const dp = gpus / (tp * pp);
      for (const ep of moe && dp > 1 ? [false, true] : [false]) {
        const shape = { tp, pp, dp, ep };
        const room = usableGiB - layoutFixedGiB(b, shape);
        const per = layoutRequestGiB(b, shape);
        const maxUsers = room > 0 && per > 0 ? Math.floor(room / per) * dp : 0;
        // The longest context each replica's share of the requests fits in.
        const perSeq = room > 0 ? (room * BYTES_PER_GIB) / stageShare(b, pp) / Math.ceil(users / dp) : 0;
        out.push({
          layout: { gpus, ...shape, usersPerReplica: Math.ceil(users / dp), perGpuGiB: layoutPerGpu(b, shape, users) },
          fits: layoutPerGpu(b, shape, users) <= usableGiB,
          maxUsers,
          maxContext: contextWithin(arch, kvDtype, b.batch.tokens, perSeq, tp),
        });
      }
    }
  }
  return out.sort((x, y) => y.maxUsers - x.maxUsers || x.layout.pp - y.layout.pp || x.layout.dp - y.layout.dp);
}
