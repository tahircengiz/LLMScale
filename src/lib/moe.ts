// Active parameters of a Mixture-of-Experts model, read from its config.
//
// A MoE model keeps every expert in memory but sends each token through only a
// few, so decode speed follows the active parameters while memory follows the
// total (perf.ts, calc.ts). The bundled presets carry an active count from their
// model cards; a model resolved live from its config.json had none, so every live
// MoE was estimated as if it were dense — a Qwen3-30B-A3B about 9× too slow.
//
// React-free: hf.ts, anatomy.ts and scripts/test-moe.ts all use it.

import { resolveHeadDim, type ModelArch } from "./calc.ts";

// Configs are free-form JSON; only the fields read below matter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Config = Record<string, any>;

/** Routed experts per MoE layer, under any of the spellings configs use. */
export function expertCount(c: Config | null | undefined): number | undefined {
  const n = c?.num_local_experts ?? c?.num_experts ?? c?.n_routed_experts ?? c?.moe_num_experts;
  return typeof n === "number" ? n : undefined;
}

/** Experts each token is routed through (gpt-oss also spells it experts_per_token). */
export function expertsPerToken(c: Config | null | undefined): number | undefined {
  const n = c?.num_experts_per_tok ?? c?.experts_per_token ?? c?.moe_top_k;
  return typeof n === "number" ? n : undefined;
}

/** Layers whose feed-forward is a set of experts rather than one dense MLP. */
function sparseLayers(c: Config): number {
  const layers = c.num_hidden_layers ?? 0;
  const firstDense = c.first_k_dense_replace ?? 0; // DeepSeek: the first k layers stay dense
  const freq = c.moe_layer_freq ?? 1; // DeepSeek: every freq-th layer after those is sparse
  const step = c.decoder_sparse_step ?? 1; // Qwen MoE: every step-th layer is sparse
  const denseOnly = new Set<number>(Array.isArray(c.mlp_only_layers) ? c.mlp_only_layers : []);
  let n = 0;
  for (let i = 0; i < layers; i++) {
    if (i < firstDense) continue;
    if (freq > 1 && i % freq !== 0) continue;
    if (step > 1 && (i + 1) % step !== 0) continue;
    if (denseOnly.has(i)) continue;
    n++;
  }
  // DeepSeek-V3's multi-token-prediction module carries an expert layer of its own.
  return n + (c.num_nextn_predict_layers ?? 0);
}

/**
 * Parameters a token passes through: the total, less the experts it is not routed
 * to. Each expert is a gated MLP — gate, up and down projections between the hidden
 * size and the expert width — so every unrouted expert takes 3 × hidden × width off
 * the count in every sparse layer.
 *
 * With no expert width in the config it falls back to the split anatomy.ts draws:
 * embeddings and attention in full, the remainder scaled by experts routed over
 * experts held. Returns undefined for a dense model, or when the answer is not a
 * part of the total (a packed quantized checkpoint can report too few parameters).
 */
export function activeParamsOf(arch: ModelArch, cfg: Config | null | undefined): number | undefined {
  const c = cfg?.text_config ?? cfg?.llm_config ?? cfg;
  const experts = expertCount(c);
  const perToken = expertsPerToken(c);
  if (!c || !experts || !perToken || experts <= 1 || perToken >= experts) return undefined;

  const withinTotal = (n: number) => (n > 0 && n < arch.numParams ? n : undefined);
  const width = c.moe_intermediate_size ?? c.intermediate_size;
  if (typeof width === "number" && width > 0) {
    const perExpert = 3 * arch.hiddenSize * width;
    const counted = withinTotal(arch.numParams - (experts - perToken) * perExpert * sparseLayers(c));
    if (counted) return counted;
  }

  const embeddings = (arch.vocabSize ?? c.vocab_size ?? 0) * arch.hiddenSize * (c.tie_word_embeddings ? 1 : 2);
  const attention = 2 * arch.numLayers * arch.hiddenSize * resolveHeadDim(arch) * (arch.numAttentionHeads + arch.numKeyValueHeads);
  const rest = arch.numParams - embeddings - attention;
  return rest > 0 ? withinTotal(embeddings + attention + rest * (perToken / experts)) : undefined;
}
