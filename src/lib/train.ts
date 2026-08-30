// Fine-tuning memory.
//
// Serving a model needs weights + KV cache. Training needs no KV cache at all,
// but it does need gradients, optimizer state and activations kept for the
// backward pass — which is why an 8B model you can serve on one 24 GB card
// needs well over 100 GB to fully fine-tune.
//
// Sources for the constants:
//  - 16 bytes/parameter for mixed-precision Adam: 2 (bf16 weights) + 2 (bf16
//    gradients) + 4 (fp32 master copy) + 4 (m) + 4 (v). This is the figure the
//    ZeRO paper and the HuggingFace training docs use.
//  - Activation memory per layer ~ 34 * s * b * h bytes, from Korthikanti et
//    al., "Reducing Activation Recomputation in Large Transformer Models"
//    (2022). The paper's extra 5*a*s^2*b term is the materialised attention
//    matrix, which flash-attention removes; modern fine-tuning uses it, so this
//    model assumes it and says so.
//  - Full gradient checkpointing keeps only each layer's input: 2 * s * b * h
//    bytes per layer, recomputing the rest.

import { BYTES_PER_GIB, type ModelArch } from "./calc.ts";

export type TrainMode = "full" | "lora" | "qlora";
export const TRAIN_MODES: readonly TrainMode[] = ["full", "lora", "qlora"];

/** Which linear layers the adapter is attached to. */
export type LoraTarget = "attn" | "all";
export const LORA_TARGETS: readonly LoraTarget[] = ["attn", "all"];

/** Bytes per trainable parameter held by mixed-precision Adam: fp32 master + m + v. */
const ADAM_BYTES = 12;
/** Bytes per trainable parameter held as a bf16 gradient. */
const GRAD_BYTES = 2;
/** Bytes per resident parameter in the compute dtype (bf16). */
const COMPUTE_BYTES = 2;
/** Bytes per resident parameter when the base is kept in 4-bit (NF4 + quant constants). */
const NF4_BYTES = 0.55;
/** Activation bytes per token per layer per hidden unit, flash-attention assumed. */
const ACT_BYTES = 34;
/** With full recomputation only each layer's input is kept. */
const ACT_BYTES_CHECKPOINTED = 2;

export interface TrainInput {
  arch: ModelArch;
  mode: TrainMode;
  /** Sequences per optimizer step on this device. */
  batchSize: number;
  /** Tokens per sequence. */
  seqLength: number;
  gradientCheckpointing: boolean;
  /** LoRA rank (ignored for full fine-tuning). */
  loraRank: number;
  loraTarget: LoraTarget;
  /** Fixed CUDA context / fragmentation allowance, in GiB. */
  overheadGiB: number;
}

export interface TrainResult {
  /** Parameters that receive gradients. */
  trainableParams: number;
  baseWeightsGiB: number;
  gradientsGiB: number;
  optimizerGiB: number;
  activationsGiB: number;
  overheadGiB: number;
  totalGiB: number;
}

/**
 * Adapter parameter count. Each targeted projection of shape (d_in x d_out)
 * gains two low-rank factors, so it contributes r * (d_in + d_out).
 */
export function loraParams(arch: ModelArch, rank: number, target: LoraTarget): number {
  const h = arch.hiddenSize;
  const heads = arch.numAttentionHeads;
  const kvHeads = arch.numKeyValueHeads || heads;
  const headDim = arch.headDim ?? Math.floor(h / heads);
  const kvDim = kvHeads * headDim;

  // q and o are h x h; under GQA k and v are h x kvDim.
  const attn = rank * (h + h) * 2 + rank * (h + kvDim) * 2;
  if (target === "attn") return arch.numLayers * attn;

  // Gated MLP: two h x ffn projections up and one ffn x h down. The FFN width
  // is not always in the config, so fall back to the usual 3.5x hidden.
  const ffn = Math.round(h * 3.5);
  const mlp = rank * (h + ffn) * 2 + rank * (ffn + h);
  return arch.numLayers * (attn + mlp);
}

export function estimateTraining(i: TrainInput): TrainResult {
  const p = i.arch.numParams;
  const trainable = i.mode === "full" ? p : loraParams(i.arch, i.loraRank, i.loraTarget);

  // The base stays resident either way; QLoRA is the only mode that shrinks it.
  const baseBytes = p * (i.mode === "qlora" ? NF4_BYTES : COMPUTE_BYTES);
  const gradBytes = trainable * GRAD_BYTES;
  const optBytes = trainable * ADAM_BYTES;

  // Activations are kept for the backward pass through the WHOLE network, so a
  // frozen base does not make them cheaper — the common surprise with LoRA.
  const perUnit = i.gradientCheckpointing ? ACT_BYTES_CHECKPOINTED : ACT_BYTES;
  const actBytes = i.arch.numLayers * i.seqLength * i.batchSize * i.arch.hiddenSize * perUnit;

  const g = (b: number) => b / BYTES_PER_GIB;
  const baseWeightsGiB = g(baseBytes);
  const gradientsGiB = g(gradBytes);
  const optimizerGiB = g(optBytes);
  const activationsGiB = g(actBytes);

  return {
    trainableParams: trainable,
    baseWeightsGiB,
    gradientsGiB,
    optimizerGiB,
    activationsGiB,
    overheadGiB: i.overheadGiB,
    totalGiB: baseWeightsGiB + gradientsGiB + optimizerGiB + activationsGiB + i.overheadGiB,
  };
}
