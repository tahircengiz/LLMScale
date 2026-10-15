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

import { kvBytesReadPerStep, resolveHeadDim, weightsBytes, type Dtype, type ModelArch } from "./calc.ts";

/**
 * Share of peak bandwidth a good decode kernel actually reaches. Vendors quote
 * theoretical peak; real kernels land in the high seventies to mid eighties, so
 * this stays deliberately conservative.
 */
export const BANDWIDTH_EFFICIENCY = 0.8;

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
  const total = arch.numParams;
  const active = arch.activeParams ?? total;
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

/**
 * A first-order decode estimate. Returns null when the device has no published
 * bandwidth, so callers can simply omit the figure rather than invent one.
 */
export function estimateDecode(i: DecodeInput): DecodeEstimate | null {
  if (!i.bandwidthGBs || i.bandwidthGBs <= 0) return null;

  // A Mixture-of-Experts model keeps every expert resident but routes each token
  // through only a few, so the read per step follows the experts the batch
  // touches, not the total — the active count for one sequence, nearly all of
  // them for a large batch.
  const readShare = i.arch.numParams > 0 ? paramsReadPerStep(i.arch, i.concurrency) / i.arch.numParams : 1;
  const weightBytes = weightsBytes(i.arch, i.weightDtype) * readShare;

  // Attention reads the cache for every sequence in the batch on every step: all of
  // it, or for a sparse model the indexer keys and the entries they pick.
  const kvBytes = kvBytesReadPerStep(i.arch, i.kvDtype, i.contextLength) * i.concurrency;

  const bytesPerStep = weightBytes + kvBytes;
  const effectiveBps = i.bandwidthGBs * 1e9 * BANDWIDTH_EFFICIENCY;
  const stepMs = (bytesPerStep / effectiveBps) * 1000;

  return {
    bytesPerStep,
    stepMs,
    perUser: 1000 / stepMs,
    total: (1000 / stepMs) * i.concurrency,
    kvShare: kvBytes / bytesPerStep,
  };
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
  const active = arch.activeParams ?? arch.numParams;
  const attn = arch.attnLayers ?? arch.numLayers;
  const sliding = arch.slidingWindow ? Math.min(arch.slidingLayers ?? 0, attn) : 0;
  const full = attn - sliding;
  const d = attnWidth(arch);
  // Σ over t of 4·d·t for t < P is 2·d·P² per full layer.
  const fullAttn = 2 * d * tokens * tokens * full;
  const W = Math.min(arch.slidingWindow ?? 0, tokens);
  const slideAttn = sliding ? 4 * d * sliding * (W * tokens - (W * W) / 2) : 0;
  return 2 * active * tokens + fullAttn + slideAttn;
}

export interface PrefillEstimate {
  /** Seconds to read the prompt and produce the first token. */
  seconds: number;
  /** Which limit set it. */
  bound: "compute" | "memory";
}

/** Time to first token for one request alone on `gpus` GPUs: the prompt's FLOPs
 *  at the device's share of peak (COMPUTE_EFFICIENCY unless it says otherwise),
 *  or one read of the weights, whichever is slower. Queueing is not in it. */
export function prefillTime(
  arch: ModelArch,
  weightDtype: Dtype,
  tokens: number,
  device: { tflops: Tflops; bandwidthGBs: number; computeEfficiency?: number },
  gpus = 1,
): PrefillEstimate {
  const eff = device.computeEfficiency ?? COMPUTE_EFFICIENCY;
  const compute = prefillFlops(arch, tokens) / (computeTflops(device.tflops, weightDtype) * 1e12 * eff * gpus);
  const memory = weightsBytes(arch, weightDtype) / (device.bandwidthGBs * 1e9 * BANDWIDTH_EFFICIENCY * gpus);
  return compute >= memory ? { seconds: compute, bound: "compute" } : { seconds: memory, bound: "memory" };
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
 * sequence, plus attention over each sequence's context), whichever is slower.
 * Bandwidth bounds small batches; past the crossover the step grows with the batch
 * and total throughput levels off.
 */
export function decodeStep(
  i: Omit<DecodeInput, "concurrency" | "bandwidthGBs">,
  batch: number,
  device: { tflops?: Tflops; bandwidthGBs: number; computeEfficiency?: number },
  gpus = 1,
): DecodePoint | null {
  const mem = estimateDecode({ ...i, concurrency: batch, bandwidthGBs: device.bandwidthGBs * gpus });
  if (!mem) return null;
  let stepMs = mem.stepMs;
  let bound: DecodePoint["bound"] = "memory";
  if (device.tflops) {
    const active = i.arch.activeParams ?? i.arch.numParams;
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
  return { batch, stepMs, perUser: 1000 / stepMs, total: (1000 / stepMs) * batch, bound };
}

/** Decode speed from one sequence up to `maxBatch`, doubling: the curve a
 *  capacity plan reads its operating point from. */
export function decodeCurve(
  i: Omit<DecodeInput, "concurrency" | "bandwidthGBs">,
  maxBatch: number,
  device: { tflops?: Tflops; bandwidthGBs: number; computeEfficiency?: number },
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
