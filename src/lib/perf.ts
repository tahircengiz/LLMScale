// Decode-speed estimate.
//
// Generating a token is memory-bandwidth bound, not compute bound: for every
// step the GPU streams the active weights plus the KV cache through the memory
// system, and the arithmetic on top of that is comparatively cheap. So decode
// throughput tracks bandwidth far more closely than it tracks FLOPS, which is
// why a 128 GB unified device can hold a model a 24 GB card cannot and still
// generate more slowly.
//
// Prefill — time to first token — is compute bound and deliberately NOT modelled
// here; nothing in this file should be read as a latency estimate.

import { kvBytesPerSeq, weightsBytes, type Dtype, type ModelArch } from "./calc.ts";

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

  // Attention reads the cache for every sequence in the batch on every step.
  const kvBytes = kvBytesPerSeq(i.arch, i.kvDtype, i.contextLength) * i.concurrency;

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
