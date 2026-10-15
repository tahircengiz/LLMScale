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
import { textConfig } from "./layers.ts";

// Configs are free-form JSON; only the fields read below matter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Config = Record<string, any>;

/** A value a config gives once or once per layer (Hunyuan lists moe_topk and
 *  moe_intermediate_size per layer): the first. */
function first(v: unknown): number | undefined {
  const x = Array.isArray(v) ? v[0] : v;
  return typeof x === "number" ? x : undefined;
}

/** Routed experts per MoE layer, under any of the spellings configs use. */
export function expertCount(c: Config | null | undefined): number | undefined {
  return first(c?.num_local_experts ?? c?.num_experts ?? c?.n_routed_experts ?? c?.moe_num_experts);
}

/** Experts each token is routed through, under any of the spellings configs use:
 *  gpt-oss's experts_per_token, Gemma 4's top_k_experts, Hunyuan's moe_topk,
 *  ERNIE 4.5's moe_k, Kimi-Linear's num_experts_per_token. Missing, Hunyuan-A13B
 *  showed 80B active and ERNIE 4.5 read as dense. */
export function expertsPerToken(c: Config | null | undefined): number | undefined {
  return first(c?.num_experts_per_tok ?? c?.experts_per_token ?? c?.moe_top_k ?? c?.top_k_experts ?? c?.moe_topk ?? c?.moe_k ?? c?.num_experts_per_token);
}

/** One expert's feed-forward width, under the spellings configs use. */
export function expertWidth(c: Config | null | undefined): number | undefined {
  return first(c?.moe_intermediate_size ?? c?.expert_intermediate_size);
}

/** Layers past num_hidden_layers that only speculative decoding runs: DeepSeek's
 *  and ERNIE's num_nextn_predict_layers, Qwen3.5's mtp_num_hidden_layers, the
 *  draft layers DeepSeek-V4-Flash-0731 appends to compress_ratios (DSpark), Step's
 *  extra layer_types. vLLM loads none of them unless a speculative config asks
 *  (deepseek_v2.py skips them, qwen3_next.py and deepseek_v4 map "mtp." to None). */
export function specLayers(c: Config | null | undefined, L: number): number {
  if (!c || !(L > 0)) return 0;
  const counts: unknown[] = [c.num_nextn_predict_layers, c.mtp_num_hidden_layers];
  if (Array.isArray(c.compress_ratios)) counts.push(c.compress_ratios.length - L);
  if (Array.isArray(c.layer_types)) counts.push(c.layer_types.length - L);
  return Math.max(0, ...counts.filter((n): n is number => typeof n === "number" && n > 0));
}

/** Parameters in tables a token reads a few rows of, not all of: Qwen4Exp's
 *  n-gram embeddings (ngram_vocab_size_base rows per n-gram head, ple_embed_dim
 *  wide across the heads, per PLE layer: 51.2B in Qwen3.8-Flash-Next), and Gemma
 *  3n's and Gemma 4's per-layer embeddings. They sit in memory but count toward
 *  no step's reads. */
export function lookupParams(c: Config | null | undefined): number {
  if (!c) return 0;
  let n = 0;
  if (Array.isArray(c.ple_layer_ids) && typeof c.ngram_vocab_size_base === "number") {
    n += c.ple_layer_ids.length * c.ngram_vocab_size_base * (c.ple_embed_dim ?? c.hidden_size ?? 0);
  }
  const ple = c.hidden_size_per_layer_input;
  if (typeof ple === "number" && ple > 0 && typeof c.vocab_size_per_layer_input === "number") {
    n += ple * c.num_hidden_layers * c.vocab_size_per_layer_input;
  }
  return n;
}

/** Parameters of the speculative-decoding layers (specLayers): what vLLM leaves
 *  out of the weights it loads. 0 when there are none. They are taken as layers of
 *  the model's average size — DeepSeek's, V4's and Qwen3.5's carry experts like the
 *  rest: V3's one is 11B of its 684.5B, V4-Flash-0731's three 20B of its 304B —
 *  except ERNIE 4.5's, a dense Llama layer (vllm ernie_mtp.py): attention, an MLP
 *  of intermediate_size and the projection of two hidden states into one. */
export function specParamsOf(arch: ModelArch, cfg: Config | null | undefined): number {
  const c = textConfig(cfg);
  const L = arch.numLayers;
  const spec = specLayers(c, L);
  if (!spec || !(arch.numParams > 0)) return 0;
  const h = arch.hiddenSize;
  const ffn = first(c?.intermediate_size);
  if (/^ernie4_5/.test(String(c?.model_type ?? "")) && typeof ffn === "number") {
    const hd = resolveHeadDim(arch);
    const attention = 2 * h * arch.numAttentionHeads * hd + 2 * h * arch.numKeyValueHeads * hd;
    return spec * (attention + 3 * h * ffn + 2 * h * h);
  }
  const body = arch.numParams - embeddingParams(arch, c) - lookupParams(c);
  return body > 0 ? (body * spec) / (L + spec) : 0;
}

function embeddingParams(arch: ModelArch, c: Config | null | undefined): number {
  return (arch.vocabSize ?? c?.vocab_size ?? 0) * arch.hiddenSize * (arch.tieEmbeddings ?? c?.tie_word_embeddings ? 1 : 2);
}

/** Layers whose feed-forward is a set of experts rather than one dense MLP. */
function sparseLayers(c: Config): number {
  const layers = c.num_hidden_layers ?? 0;
  const firstDense = c.first_k_dense_replace ?? 0; // DeepSeek: the first k layers stay dense
  // DeepSeek: every freq-th layer after those is sparse; MiMo-V2 lists it per layer.
  const freq = typeof c.moe_layer_freq === "number" ? c.moe_layer_freq : 1;
  const perLayer: unknown[] | undefined = Array.isArray(c.moe_layer_freq) ? c.moe_layer_freq : undefined;
  const step = c.decoder_sparse_step ?? 1; // Qwen MoE: every step-th layer is sparse
  const denseOnly = new Set<number>(Array.isArray(c.mlp_only_layers) ? c.mlp_only_layers : []);
  // ERNIE 4.5: experts from moe_layer_start_index to moe_layer_end_index, in every
  // layer whose number moe_layer_interval divides (vllm ernie45_moe.py).
  const start = typeof c.moe_layer_start_index === "number" ? c.moe_layer_start_index : 0;
  const end = typeof c.moe_layer_end_index === "number" ? c.moe_layer_end_index : layers - 1;
  const interval = typeof c.moe_layer_interval === "number" && c.moe_layer_interval > 0 ? c.moe_layer_interval : 1;
  // Jamba: an expert layer every expert_layer_period, at expert_layer_offset.
  const period = typeof c.expert_layer_period === "number" && c.expert_layer_period > 0 ? c.expert_layer_period : 1;
  const offset = typeof c.expert_layer_offset === "number" ? c.expert_layer_offset : 0;
  let n = 0;
  for (let i = 0; i < layers; i++) {
    if (i < firstDense) continue;
    if (perLayer ? Number(perLayer[i]) !== 1 : freq > 1 && i % freq !== 0) continue;
    if (step > 1 && (i + 1) % step !== 0) continue;
    if (denseOnly.has(i)) continue;
    if (i < start || i > end || (i + 1) % interval !== 0) continue;
    if (period > 1 && i % period !== offset % period) continue;
    n++;
  }
  // The speculative-decoding layers are left out whole (specParamsOf).
  return n;
}

/**
 * Parameters a token passes through: the total, less the experts it is not routed
 * to, the speculative-decoding layers vLLM does not run (specParamsOf) and the
 * lookup tables a token reads a few rows of (lookupParams). Each expert is a gated
 * MLP — gate, up and down projections between the hidden size and the expert width
 * — so every unrouted expert takes 3 × hidden × width off the count in every
 * sparse layer.
 *
 * With no expert width in the config it falls back to the split anatomy.ts draws:
 * embeddings and attention in full, the remainder scaled by experts routed over
 * experts held. Returns undefined for a dense model with nothing to leave out, or
 * when the answer is not a part of the total (a packed quantized checkpoint can
 * report too few parameters: hf.ts recounts once it knows the real total).
 */
export function activeParamsOf(arch: ModelArch, cfg: Config | null | undefined): number | undefined {
  const c = textConfig(cfg);
  if (!c) return undefined;
  const withinTotal = (n: number) => (n > 0 && n < arch.numParams ? n : undefined);
  const main = arch.numParams - specParamsOf(arch, cfg) - lookupParams(c);
  const experts = expertCount(c);
  const perToken = expertsPerToken(c);
  if (!experts || !perToken || experts <= 1 || perToken >= experts) return main < arch.numParams ? withinTotal(main) : undefined;

  const width = expertWidth(c) ?? first(c.intermediate_size);
  if (typeof width === "number" && width > 0) {
    const perExpert = 3 * arch.hiddenSize * width;
    const counted = withinTotal(main - (experts - perToken) * perExpert * sparseLayers(c));
    if (counted) return counted;
  }

  const embeddings = embeddingParams(arch, c);
  const attention = 2 * arch.numLayers * arch.hiddenSize * resolveHeadDim(arch) * (arch.numAttentionHeads + arch.numKeyValueHeads);
  const rest = main - embeddings - attention;
  return rest > 0 ? withinTotal(embeddings + attention + rest * (perToken / experts)) : undefined;
}
