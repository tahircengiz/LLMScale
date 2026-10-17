// What a serving engine keeps on each GPU besides the weights and the KV cache.
//
// vLLM 0.31.0 budgets gpu_memory_utilization × the card's memory per GPU
// (vllm/v1/worker/gpu_worker.py) and fills it in this order:
//   - the weights;
//   - what the runtime keeps once loaded: workspaces, input buffers, a 4-byte
//     value per vocabulary entry for each of max_num_seqs sequences, and NCCL's
//     buffers when the model is split across GPUs;
//   - the peak of one profiling pass: a forward pass over max_num_batched_tokens
//     tokens, then sampling (vllm/v1/worker/gpu/model_runner.py, profile_run;
//     vllm/utils/mem_utils.py);
//   - the CUDA graphs it captures for decode batches up to min(2 × max_num_seqs, 512);
//   - and whatever is left becomes KV cache.
// The rest of the card (8% at the default 0.92) holds the CUDA context and anything
// else on the GPU. Each GPU of a tensor-parallel group repeats all of this for its
// shard, so the overhead is counted once per GPU, not once per model.
//
// The coefficients come from eleven vLLM startups on an RTX 4070 Ti
// (scripts/fixtures/vllm/, checked by scripts/test-vllmlog.ts): Qwen3 0.6B, 4B and
// 8B (FP8), Qwen2.5-7B AWQ, Gemma 3 1B and Granite 4.0-H Micro, at the serve
// defaults of a card under 70 GiB and of one above, and with 16 sequences. The
// estimate lands within 0.13 GiB of what vLLM measured in every run. Eight more
// from 2026-10-16 (MoE and multimodal models, scripts/test-audit3.ts) placed the
// output-layer term (activationGiB below) and the vision encoder's.
//
// React-free: calc.ts and vllm.ts size with it, and the tests run it.

import type { ModelArch } from "./calc.ts";

const GiB = 1024 ** 3;

/** vLLM 0.31.0's default --gpu-memory-utilization (CacheConfig). */
export const VLLM_UTIL = 0.92;

/** The batch vLLM profiles with: max_num_batched_tokens and max_num_seqs, and the
 *  largest decode batch it captures a CUDA graph for. */
export interface BatchShape {
  tokens: number;
  seqs: number;
  /** 512, or 1024 on datacenter Blackwell (vllm/config/vllm.py). */
  graphCap?: number;
  /** How the card's sparse-MLA kernel stores a DeepSeek Sparse Attention row
   *  (calc.ts, dsaBytes): "sm100" on B200/B300, "sm120" on RTX 50, RTX PRO
   *  Blackwell and DGX Spark; Hopper and the rest otherwise. */
  sparseMla?: "sm100" | "sm120";
  /** The kernel vLLM 0.31.0 runs MXFP4 experts with here, which sets how it pads
   *  them (calc.ts, mxfp4Pad): FlashInfer TRT-LLM on B200/B300, the Triton kernels
   *  on Hopper, Marlin on Turing to Ada and on SM120 Blackwell, ROCm's on AMD. */
  mxfp4?: "trtllm" | "triton" | "marlin" | "rocm";
}

/** `vllm serve`'s defaults for a card of this much memory (EngineArgs in
 *  vllm/engine/arg_utils.py): bigger cards batch more, and an A100 stays at the
 *  small defaults whatever its memory. */
export function vllmBatch(cardGiB: number, name = ""): BatchShape {
  const graphCap = /\b(g?b[23]00)\b/i.test(name) ? 1024 : 512;
  const sparseMla = sparseMlaFamily(name);
  const mxfp4 = mxfp4Kernel(name);
  const shape = (tokens: number, seqs: number): BatchShape => ({
    tokens, seqs, graphCap, ...(sparseMla ? { sparseMla } : {}), ...(mxfp4 ? { mxfp4 } : {}),
  });
  if (cardGiB >= 160) return shape(16384, 1024);
  if (cardGiB >= 70 && !/a100/i.test(name)) return shape(8192, 1024);
  return shape(2048, 256);
}

/** The Blackwell families whose sparse-MLA kernels store a DSA cache row their own
 *  way (vllm/model_executor/layers/attention/mla_attention.py): datacenter
 *  Blackwell (SM100), and the GeForce, RTX PRO and GB10 parts (SM120). */
export function sparseMlaFamily(name: string): BatchShape["sparseMla"] {
  if (/\b(g?b[23]00)\b/i.test(name)) return "sm100";
  if (/\bRTX 50\d0|RTX PRO \d{4} Blackwell|GB10\b|DGX Spark/i.test(name)) return "sm120";
  return undefined;
}

/** Which MXFP4 MoE kernel vLLM 0.31.0 picks for gpt-oss on a card, by its name
 *  (fused_moe/oracle/mxfp4.py, _get_priority_backends_for_gpt_oss and each kernel's
 *  device check): TRT-LLM on SM100, Triton on SM90 (it stops short of SM120), and
 *  Marlin on every other NVIDIA card from SM75. Apple and Intel run no vLLM CUDA. */
export function mxfp4Kernel(name: string): BatchShape["mxfp4"] {
  if (!name) return undefined;
  if (/\b(g?b[23]00)\b/i.test(name)) return "trtllm";
  if (/\b(h100|h200|gh200|h800|h20)\b/i.test(name)) return "triton";
  if (/\b(amd|mi\d{3}x?|radeon)\b/i.test(name)) return "rocm";
  if (/\b(apple|intel|arc)\b/i.test(name)) return undefined;
  return "marlin";
}

export const SMALL_CARD_BATCH: BatchShape = { tokens: 2048, seqs: 256 };

export interface GpuOverhead {
  runtimeGiB: number;
  /** The profiling pass's peak, the vision encoder's included. */
  activationGiB: number;
  /** The vision encoder's part of it: what --skip-mm-profiling leaves out. */
  visionGiB: number;
  graphsGiB: number;
  totalGiB: number;
}

/** What the runtime keeps beyond the weights before its per-sequence buffers:
 *  measured 0.06 to 0.2 GiB. */
const RUNTIME_GIB = 0.15;
/** Bytes per sequence per vocabulary entry the runtime keeps for sampling. */
const SAMPLER_BYTES = 4;
/** Bytes per logit of the profiling pass's sampler run: one per sequence, kept in
 *  16-bit, since the dummy batch asks for no top-k, top-p or logprobs
 *  (gpu/model_runner.py, _dummy_sampler_run; gpu/sample/sampler.py). */
const LOGIT_BYTES = 2;
/** NCCL's buffers when the model is split. Not measured here (one GPU); NCCL's
 *  defaults and vLLM's all-reduce buffers put them near half a GiB. */
export const COMM_GIB = 0.5;
/** Bytes a token holds in the feed-forward block at the profiling peak, per
 *  element of its width. */
const FORWARD_BYTES = 8;
/** CUDA graphs: a fixed part, and at a 512-sequence capture a further part plus
 *  bytes per layer per hidden unit, both growing with the largest capture. */
const GRAPH_BASE_GIB = 0.07;
const GRAPH_AT_512_GIB = 0.18;
const GRAPH_BYTES_PER_LAYER_HIDDEN = 2048;

/** Bytes the vision encoder's profiling pass adds per patch per unit of its width.
 *  vLLM 0.31.0 runs the encoder on as many of the largest items as its encoder
 *  budget holds before it profiles the language model (gpu/model_runner.py,
 *  profile_run; encoder_budget.py), and sizes the KV cache after both. Fitted to two
 *  startups on the RTX 4070 Ti against the same model with --skip-mm-profiling
 *  (scripts/fixtures/vllm/): Qwen2.5-VL-3B, one 65,536-patch video, 1.97 GiB more;
 *  Gemma 3 4B, eight 4,096-patch images, 0.70 GiB more. 24 bytes, their least-squares
 *  fit, lands within 0.15 GiB of both. */
const VISION_BYTES = 24;

/** What the encoder's profiling pass adds on one GPU, in bytes. The budget is the
 *  larger of max_num_batched_tokens and one item, filled with whole items. */
function visionPeak(arch: ModelArch, batch: BatchShape, n: number): number {
  const v = arch.vision;
  if (!v || !(v.tokens > 0) || !(v.patches > 0) || !(v.hidden > 0)) return 0;
  const items = Math.max(1, Math.floor(Math.max(batch.tokens, v.tokens) / v.tokens));
  return (VISION_BYTES * items * v.patches * v.hidden) / n;
}

/** Width of the feed-forward work one token does: the dense block, or the experts
 *  it is routed to. */
function ffnWidth(arch: ModelArch): number {
  const dense = arch.intermediateSize ?? 4 * arch.hiddenSize;
  if (arch.numExperts && arch.expertsPerToken) {
    const expert = arch.moeIntermediateSize ?? dense;
    return Math.max(dense, arch.expertsPerToken * expert);
  }
  return dense;
}

/** What vLLM keeps on ONE GPU besides the weights and the KV cache, for a model
 *  split across `tp` GPUs. */
export function overheadPerGpu(arch: ModelArch, batch: BatchShape = SMALL_CARD_BATCH, tp = 1): GpuOverhead {
  const n = Math.max(1, tp);
  const vocab = arch.vocabSize ?? 32000;
  // Sampling works on the whole vocabulary on every GPU, so this part does not split.
  const runtime = RUNTIME_GIB + (SAMPLER_BYTES * batch.seqs * vocab) / GiB + (n > 1 ? COMM_GIB : 0);
  // The profiling pass peaks in the largest of three places, not all of them: the
  // feed-forward block, which grows with the batched tokens and splits across the
  // group; the sampler's logits, one row per sequence, gathered whole on every GPU;
  // and, for a text-only model, a copy of its vocabulary × hidden embedding table in
  // 16-bit, split like the table. In the fourteen text-only startups where that
  // table outweighs the forward pass, the profile peaked at the table's size, to
  // 0.08 GiB. A multimodal model's did not: Gemma 3 4B stayed under its 1.25 GiB
  // table on a first start, and it and Qwen2.5-VL-3B peaked at the forward pass with
  // --skip-mm-profiling. Their compiled language model takes the embeddings
  // ready-made (inputs_embeds, gpu/model_runner.py), the lookup outside the graph,
  // and the copy goes with the lookup. Every text-only startup measured compiled its
  // graph afresh; whether one that loads it from the compile cache keeps the copy is
  // not measured. Counting the table for a multimodal model had put Gemma 3 4B
  // 1.1 GiB over. Its encoder is profiled too, and adds its own peak (C4).
  const forward = (FORWARD_BYTES * batch.tokens * ffnWidth(arch)) / n;
  const logits = LOGIT_BYTES * Math.min(batch.tokens, batch.seqs) * vocab;
  const table = arch.vision ? 0 : (2 * vocab * arch.hiddenSize) / n;
  // A MoE layer's fused kernels also hold, for every token and expert it is routed
  // to, the gate-up output, its activation and the down output before the sum, in
  // 16-bit (fused_moe): measured as 0.1 to 0.9 GiB more on four MoE startups.
  // Mixtral and gpt-oss give the expert width as intermediate_size.
  const expertWidth = arch.moeIntermediateSize ?? (arch.numExperts ? arch.intermediateSize : undefined);
  const k = arch.numExperts && arch.expertsPerToken && expertWidth ? arch.expertsPerToken : 0;
  const routed = k ? 2 * batch.tokens * k * ((3 * expertWidth!) / n + arch.hiddenSize) : 0;
  const vision = visionPeak(arch, batch, n) / GiB;
  const activation = (Math.max(forward, logits, table) + routed) / GiB + vision;
  const capture = Math.min(2 * batch.seqs, batch.graphCap ?? 512) / 512;
  const graphs =
    GRAPH_BASE_GIB + capture * (GRAPH_AT_512_GIB + (GRAPH_BYTES_PER_LAYER_HIDDEN * arch.numLayers * arch.hiddenSize) / GiB);
  return { runtimeGiB: runtime, activationGiB: activation, visionGiB: vision, graphsGiB: graphs, totalGiB: runtime + activation + graphs };
}
