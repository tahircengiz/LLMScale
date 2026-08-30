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

import { DTYPE_BYTES, kvBytesPerToken, type Dtype, type ModelArch } from "./calc.ts";

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
 * A first-order decode estimate. Returns null when the device has no published
 * bandwidth, so callers can simply omit the figure rather than invent one.
 */
export function estimateDecode(i: DecodeInput): DecodeEstimate | null {
  if (!i.bandwidthGBs || i.bandwidthGBs <= 0) return null;

  // A Mixture-of-Experts model keeps every expert resident but routes each token
  // through only a few, so the read per step follows the ACTIVE parameters even
  // though the memory footprint follows the total.
  const readParams = i.arch.activeParams ?? i.arch.numParams;
  const weightBytes = readParams * DTYPE_BYTES[i.weightDtype];

  // Attention reads the cache for every sequence in the batch on every step.
  const kvBytes = kvBytesPerToken(i.arch, i.kvDtype) * i.contextLength * i.concurrency;

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
