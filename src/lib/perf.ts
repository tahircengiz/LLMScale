// Decode-speed estimate.
//
// Generating a token is memory-bandwidth bound, not compute bound: for every
// step the GPU streams the active weights plus the KV cache through the memory
// system, and the arithmetic on top of that is comparatively cheap. So decode
// throughput tracks bandwidth far more closely than it tracks FLOPS, which is
// why a 128 GB unified device can hold a model a 24 GB card cannot and still
// generate more slowly.
//
// Prefill — reading the prompt before the first token — is the other way round:
// every prompt token goes through the same weights in one pass, so it is bound by
// tensor throughput (FLOPS) once the prompt is more than a few hundred tokens.
// prefillTime and decodeStep below take whichever bound is slower. The vendors'
// dense figures are peaks; the efficiencies are stated where they are applied.

import { DTYPE_BYTES, expertWeightBytes, kvBytesReadPerStep, QUANT_BITS, resolveHeadDim, weightsBytes, type Dtype, type ModelArch } from "./calc.ts";

/**
 * Share of peak bandwidth the weight reads of a decode step reach. Fitted with the
 * step's fixed cost (LAYER_MS) to vLLM 0.31.0 on an RTX 4070 Ti (scripts/fixtures/
 * vllm/calib-rtx4070ti-2026-10-16.json): dense models from 0.6B to 7B, BF16 and AWQ,
 * and MoE models of 1B and 3B, from 1 to 64 sequences, land within 10% of the
 * measured step (most within 4%; the fit is flat from 0.88 to 0.98, the midpoint
 * kept). The same constants put Llama 3.1 8B on one H100, H200 or L40S within 12%
 * of NVIDIA's published batch-1 figures (docs/audit-2026-10-15/hiz-kaynaklari.md).
 */
export const BANDWIDTH_EFFICIENCY = 0.92;
/** Attention's reads of the KV cache, a block at a time, reach less than the
 *  weights' long streams: fitted to how each step grew with the batch on the same
 *  card (up to 64 sequences of 128 to 256 tokens). */
export const KV_EFFICIENCY = 0.75;
/** What a step costs beyond its reads, per layer: the kernels between the reads,
 *  replayed from a CUDA graph. Fitted with BANDWIDTH_EFFICIENCY on the RTX 4070 Ti.
 *  A MoE layer needs nothing more: routed experts cost what they read, BF16 or GPTQ,
 *  and once their bytes are counted right (calc.ts: 16-bit tables, MXFP4) gpt-oss-20b
 *  and -120b land within 14% of published single-GPU speeds with no MoE factor. */
export const LAYER_MS = 0.065;
/** Tensor parallelism adds two all-reduces per layer to every step: fitted to
 *  published batch-1 figures for Llama 70B and 405B on 2, 4 and 8 H100s and MI300Xs
 *  (docs/audit-2026-10-15/hiz-kaynaklari.md, N7, N8, A1-A3), all within 14%. */
export const ALLREDUCE_MS = 0.014;
/** A request's fixed cost before its first token, beyond the prefill pass: taking
 *  the request, scheduling it, sampling and sending the token back. Fitted to
 *  `vllm serve` on the RTX 4070 Ti (6.5 ms) and NVIDIA's short-prompt Llama 3.1 8B
 *  figures on an H100 (5.5 ms); a host CPU sets most of it. */
export const REQUEST_MS = 6;

export interface DecodeInput {
  arch: ModelArch;
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  /** Published memory bandwidth in GB/s (decimal GB, as vendors quote it). */
  bandwidthGBs: number;
}

export interface DecodeEstimate {
  /** Bytes read to produce one token for the whole batch. */
  bytesPerStep: number;
  /** Milliseconds per decode step. */
  stepMs: number;
  /** Tokens per second as one user experiences them. */
  perUser: number;
  /** Tokens per second summed across the concurrent users. */
  total: number;
  /** Fraction of the read that is KV cache rather than weights (0..1). */
  kvShare: number;
}

/**
 * Parameters one decode step reads for a batch of `n` sequences. A dense model
 * reads all of them. A MoE reads its shared layers plus every expert at least one
 * sequence in the batch routes to: with E experts and k per token, an expert goes
 * unused by all n tokens with probability (1 − k/E)^n. Qwen3-30B-A3B (128 experts,
 * 8 per token) reads 6% of its experts for one sequence and 87% for 32, so taking
 * the active count for a whole batch overstated its throughput about threefold.
 */
export function paramsReadPerStep(arch: ModelArch, n: number): number {
  // What a step can read at all: not the speculative-decoding layers vLLM leaves
  // unloaded, nor lookup tables a token reads a few rows of (moe.ts).
  const spec = arch.specParams && arch.specParams < arch.numParams ? arch.specParams : 0;
  const lookup = arch.lookupParams && arch.lookupParams < arch.numParams - spec ? arch.lookupParams : 0;
  const total = arch.numParams - spec - lookup;
  const active = Math.max(0, Math.min(arch.activeParams ?? total, total));
  const E = arch.numExperts;
  const k = arch.expertsPerToken;
  if (!E || !k || k >= E || active >= total || n <= 1) return active;
  // active = shared + experts·k/E and total = shared + experts, so:
  const experts = (total - active) / (1 - k / E);
  const shared = total - experts;
  if (shared < 0) return active;
  const touched = 1 - Math.pow(1 - k / E, n);
  return Math.min(total, shared + experts * touched);
}

/** Bytes of weights `n` tokens in one forward pass read: every layer's shared
 *  weights and the output head, and of the routed experts those the tokens touch.
 *  Not the input embedding of an untied model, nor a lookup table: a token reads
 *  one row of each (moe.ts). By bytes, not parameters, since a quantized checkpoint
 *  keeps its embedding and head in 16-bit and an MXFP4 one its attention too: read
 *  by parameter share, gpt-oss-20b's step came out half of what it reads. */
export function weightBytesRead(arch: ModelArch, weightDtype: Dtype, n: number): number {
  const all = weightsBytes(arch, weightDtype);
  const bits = QUANT_BITS[weightDtype];
  // The embedding stays 16-bit in a quantized checkpoint; a lookup table is counted
  // at the quantized rate in weightsBytes, so it comes off at that rate too (read at
  // 2 bytes, Qwen3.8-Flash-Next's INT4 n-gram table outweighed every weight it has).
  const wide = bits ? 2 : DTYPE_BYTES[weightDtype];
  const table = !arch.tieEmbeddings && arch.vocabSize && arch.hiddenSize ? arch.vocabSize * arch.hiddenSize * wide : 0;
  const spec = arch.specParams && arch.specParams < arch.numParams ? arch.specParams : 0;
  const lookup = arch.lookupParams && arch.lookupParams < arch.numParams - spec ? arch.lookupParams * (bits ? bits / 8 : DTYPE_BYTES[weightDtype]) : 0;
  const unread = table + lookup < all ? table + lookup : 0;
  const experts = Math.min(expertWeightBytes(arch, weightDtype), all - unread);
  const E = arch.numExperts ?? 0;
  const k = arch.expertsPerToken ?? 0;
  if (experts > 0 && E > k && k > 0) return all - unread - experts * Math.pow(1 - k / E, Math.max(1, n));
  // A MoE known only by its active count reads that share, whatever the batch.
  return (all - unread) * Math.min(1, paramsReadPerStep(arch, n) / Math.max(1, arch.numParams - spec - (lookup ? arch.lookupParams! : 0)));
}

/**
 * The read side of a decode step: its bytes at the bandwidth they reach. Returns
 * null when the device has no published bandwidth, so callers can simply omit the
 * figure rather than invent one. Without the step's fixed cost (decodeStep adds it).
 */
export function estimateDecode(i: DecodeInput): DecodeEstimate | null {
  if (!i.bandwidthGBs || i.bandwidthGBs <= 0) return null;

  // A Mixture-of-Experts model keeps every expert resident but routes each token
  // through only a few, so the read per step follows the experts the batch
  // touches, not the total — the active ones for one sequence, nearly all of
  // them for a large batch.
  const weightBytes = weightBytesRead(i.arch, i.weightDtype, i.concurrency);

  // Attention reads the cache for every sequence in the batch on every step: all of
  // it, or for a sparse model the indexer keys and the entries they pick.
  const kvBytes = kvBytesReadPerStep(i.arch, i.kvDtype, i.contextLength) * i.concurrency;

  const bytesPerStep = weightBytes + kvBytes;
  const bps = i.bandwidthGBs * 1e9;
  const stepMs = (weightBytes / (bps * BANDWIDTH_EFFICIENCY) + kvBytes / (bps * KV_EFFICIENCY)) * 1000;

  return {
    bytesPerStep,
    stepMs,
    perUser: 1000 / stepMs,
    total: (1000 / stepMs) * i.concurrency,
    kvShare: kvBytes / bytesPerStep,
  };
}

/** A step's fixed cost on `gpus` GPUs of a tensor-parallel group: every layer's
 *  kernels (`layerMs` where a device measured its own, gpus.ts), and the group's two
 *  all-reduces per layer. */
export function stepFloorMs(arch: ModelArch, gpus = 1, layerMs = LAYER_MS): number {
  const layers = Math.max(1, arch.numLayers);
  return layers * (layerMs + (gpus > 1 ? 2 * ALLREDUCE_MS : 0));
}

/** Share of the vendor's dense tensor peak a serving engine's matrix multiplies
 *  reach: prefill and big decode batches. Measured with vLLM 0.31.0 on an RTX
 *  4070 Ti (scripts/fixtures/vllm/calib-rtx4070ti.json): a 2,048-token prompt on
 *  Qwen3-4B ran at 97% of the rated 80 TFLOPS, because a GeForce card clocks well
 *  above the boost clock its rating assumes. Cards rated at their top clock
 *  (datacenter and workstation parts) are not measured here; 0.6 is a planning
 *  estimate for them. */
export const COMPUTE_EFFICIENCY = 0.6;
export const CONSUMER_COMPUTE_EFFICIENCY = 0.9;

/** A device's dense tensor throughput, TFLOPS, without structured sparsity. */
export interface Tflops {
  bf16: number;
  fp8?: number;
  fp4?: number;
}

/** The throughput the matrix multiplies run at. FP8 weights run on FP8 tensor
 *  cores where the device has them (FP8-dynamic quantizes activations too); 4-bit
 *  formats are counted as weight-only, computing in 16-bit, which is the
 *  conservative reading for AWQ, GPTQ and GGUF. */
export function computeTflops(t: Tflops, weightDtype: Dtype): number {
  if ((weightDtype === "fp8" || weightDtype === "int8") && t.fp8) return t.fp8;
  return t.bf16;
}

/** Attention width the score and value products run over: heads × head dim. */
function attnWidth(arch: ModelArch): number {
  return arch.numAttentionHeads * resolveHeadDim(arch);
}

/**
 * FLOPs to read a prompt of `tokens`: two per active parameter per token for the
 * matrix multiplies, plus attention's two products over the causal context, which
 * a sliding layer caps at its window.
 */
export function prefillFlops(arch: ModelArch, tokens: number): number {
  // The embedding is looked up, and the output head runs for the last token only.
  const head = arch.vocabSize && arch.hiddenSize ? arch.vocabSize * arch.hiddenSize : 0;
  const tables = head * (arch.tieEmbeddings ? 1 : 2);
  const all = arch.activeParams ?? arch.numParams;
  const active = tables < all ? all - tables : all;
  const attn = arch.attnLayers ?? arch.numLayers;
  const sliding = arch.slidingWindow ? Math.min(arch.slidingLayers ?? 0, attn) : 0;
  const full = attn - sliding;
  const d = attnWidth(arch);
  // Σ over t of 4·d·t for t < P is 2·d·P² per full layer.
  const fullAttn = 2 * d * tokens * tokens * full;
  const W = Math.min(arch.slidingWindow ?? 0, tokens);
  const slideAttn = sliding ? 4 * d * sliding * (W * tokens - (W * W) / 2) : 0;
  return 2 * active * tokens + (tables < all ? 2 * head : 0) + fullAttn + slideAttn;
}

export interface PrefillEstimate {
  /** Seconds to read the prompt and produce the first token. */
  seconds: number;
  /** Which limit set it. */
  bound: "compute" | "memory";
}

/** Time to first token for one request alone on `gpus` GPUs: the prompt's FLOPs
 *  at the device's share of peak (COMPUTE_EFFICIENCY unless it says otherwise),
 *  or one read of the weights the prompt touches, whichever is slower, plus the
 *  pass's fixed cost and the request's (REQUEST_MS). Without the last two a short
 *  prompt came out four times too fast: Qwen3-0.6B read 512 tokens in 11 ms where
 *  vLLM answers in 16. Queueing is not in it. */
export function prefillTime(
  arch: ModelArch,
  weightDtype: Dtype,
  tokens: number,
  device: { tflops: Tflops; bandwidthGBs: number; computeEfficiency?: number; layerMs?: number },
  gpus = 1,
): PrefillEstimate {
  const eff = device.computeEfficiency ?? COMPUTE_EFFICIENCY;
  const compute = prefillFlops(arch, tokens) / (computeTflops(device.tflops, weightDtype) * 1e12 * eff * gpus);
  const memory = weightBytesRead(arch, weightDtype, tokens) / (device.bandwidthGBs * 1e9 * BANDWIDTH_EFFICIENCY * gpus);
  const fixed = (stepFloorMs(arch, gpus, device.layerMs) + REQUEST_MS) / 1000;
  return compute >= memory ? { seconds: compute + fixed, bound: "compute" } : { seconds: memory + fixed, bound: "memory" };
}

export interface DecodePoint {
  batch: number;
  /** Milliseconds per decode step: the time between two tokens for each user. */
  stepMs: number;
  perUser: number;
  total: number;
  bound: "compute" | "memory";
}

/**
 * One decode step for `batch` sequences at `contextLength`: the bytes it reads
 * (estimateDecode) against the FLOPs it does (two per active parameter per
 * sequence, plus attention over each sequence's context), whichever is slower,
 * plus the step's fixed cost (stepFloorMs). Bandwidth bounds small batches; past
 * the crossover the step grows with the batch and total throughput levels off.
 * Without the fixed cost a small or MoE model came out up to twice too fast.
 */
export function decodeStep(
  i: Omit<DecodeInput, "concurrency" | "bandwidthGBs">,
  batch: number,
  device: { tflops?: Tflops; bandwidthGBs: number; computeEfficiency?: number; layerMs?: number },
  gpus = 1,
): DecodePoint | null {
  const mem = estimateDecode({ ...i, concurrency: batch, bandwidthGBs: device.bandwidthGBs * gpus });
  if (!mem) return null;
  let stepMs = mem.stepMs;
  let bound: DecodePoint["bound"] = "memory";
  if (device.tflops) {
    // Every token runs the output head; the input embedding is a lookup.
    const all = i.arch.activeParams ?? i.arch.numParams;
    const table = !i.arch.tieEmbeddings && i.arch.vocabSize && i.arch.hiddenSize ? i.arch.vocabSize * i.arch.hiddenSize : 0;
    const active = table < all ? all - table : all;
    const attn = i.arch.attnLayers ?? i.arch.numLayers;
    const sliding = i.arch.slidingWindow ? Math.min(i.arch.slidingLayers ?? 0, attn) : 0;
    // Each new token attends over its context; a sliding layer over its window. A
    // sparse model's top-k attend is narrower, but its indexer scores every token
    // of the context; the full span is kept, as an upper bound for the two.
    const span = (attn - sliding) * i.contextLength + sliding * Math.min(i.contextLength, i.arch.slidingWindow ?? 0);
    const flops = batch * (2 * active + 4 * attnWidth(i.arch) * span);
    const computeMs = (flops / (computeTflops(device.tflops, i.weightDtype) * 1e12 * (device.computeEfficiency ?? COMPUTE_EFFICIENCY) * gpus)) * 1000;
    if (computeMs > stepMs) [stepMs, bound] = [computeMs, "compute"];
  }
  stepMs += stepFloorMs(i.arch, gpus, device.layerMs);
  return { batch, stepMs, perUser: 1000 / stepMs, total: (1000 / stepMs) * batch, bound };
}

/** Decode speed from one sequence up to `maxBatch`, doubling: the curve a
 *  capacity plan reads its operating point from. */
export function decodeCurve(
  i: Omit<DecodeInput, "concurrency" | "bandwidthGBs">,
  maxBatch: number,
  device: { tflops?: Tflops; bandwidthGBs: number; computeEfficiency?: number; layerMs?: number },
  gpus = 1,
): DecodePoint[] {
  const out: DecodePoint[] = [];
  for (let b = 1; b <= Math.max(1, maxBatch); b *= 2) {
    const p = decodeStep(i, b, device, gpus);
    if (p) out.push(p);
  }
  if (maxBatch > 1 && out.length && out[out.length - 1].batch !== maxBatch) {
    const p = decodeStep(i, maxBatch, device, gpus);
    if (p) out.push(p);
  }
  return out;
}
