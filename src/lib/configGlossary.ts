// Plain-language meanings for the fields of a Hugging Face config.json. The Config
// Decoder page reads every field of a model's config through this table; the
// words themselves are in the dictionaries (src/locales/, gloss.*).
//
// Written from the fields that real configs carry (a sample of 33 across Llama,
// Qwen, DeepSeek, gpt-oss, Gemma, Mistral, Phi, Granite, Nemotron and others), and
// held to one rule: a meaning says only what the field is and what it changes. A
// field this table does not know is shown as unexplained, with its raw value,
// rather than guessed at. A few families of fields (dropout rates, special-token
// ids, Mamba settings) are recognised by their name's pattern; those get a meaning
// that is true of the whole family and nothing more specific.
//
// React-free, so scripts/test-config.ts can hold every entry to the dictionaries.

export type FieldGroup =
  | "identity"
  | "shape"
  | "attention"
  | "position"
  | "experts"
  | "hybrid"
  | "vocab"
  | "precision"
  | "vision"
  | "audio"
  | "training"
  | "runtime"
  | "other";

/** Reading order of the field reference. */
export const FIELD_GROUPS: readonly FieldGroup[] = [
  "identity",
  "shape",
  "attention",
  "position",
  "experts",
  "hybrid",
  "vocab",
  "precision",
  "vision",
  "audio",
  "runtime",
  "training",
  "other",
];

/** core: decides memory, speed or context. detail: part of the architecture, but
 *  not a number anyone sizes against. training: has no effect once the model is
 *  trained and served. */
export type Relevance = "core" | "detail" | "training";

/** How a value is turned into words next to its raw form. */
export type ValueKind =
  | "tokens"
  | "count"
  | "number"
  | "bool"
  | "dtype"
  | "act"
  | "ids"
  | "ropeType"
  | "layerTypes"
  | "hybridPattern"
  | "raw";

/** The words of an entry are dictionary keys (src/locales/, gloss.*): each
 *  language reads them through translate(). */
export interface GlossaryEntry {
  group: FieldGroup;
  rel: Relevance;
  title: string;
  meaning: string;
  kind?: ValueKind;
  /** Unit word after a count, e.g. "layers". */
  unit?: string;
  /** What true / false mean for this particular field. */
  yes?: string;
  no?: string;
}

/** An entry whose title and meaning are `<key>.title` and `<key>.meaning`. */
function e(
  group: FieldGroup,
  rel: Relevance,
  key: string,
  extra: Partial<Omit<GlossaryEntry, "group" | "rel" | "title" | "meaning">> = {},
): GlossaryEntry {
  return { group, rel, title: `${key}.title`, meaning: `${key}.meaning`, ...extra };
}

const LAYERS = "gloss.unit.layers";
const HEADS = "gloss.unit.heads";
const EXPERTS = "gloss.unit.experts";
const TOKENS_UNIT = "gloss.unit.tokens";

/** Keyed by the field's own name, or by `parent.child` for fields that only mean
 *  something inside one object (rope_scaling, quantization_config, vision_config). */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ── identity & loading ───────────────────────────────────────────────────
  architectures: e("identity", "core", "gloss.architectures",
    { kind: "raw" }),
  model_type: e("identity", "core", "gloss.model_type",
    { kind: "raw" }),
  auto_map: e("runtime", "core", "gloss.auto_map"),
  transformers_version: e("runtime", "detail", "gloss.transformers_version",
    { kind: "raw" }),
  _name_or_path: e("runtime", "detail", "gloss._name_or_path",
    { kind: "raw" }),
  use_cache: e("runtime", "detail", "gloss.use_cache",
    { kind: "bool" }),
  cache_implementation: e("runtime", "detail", "gloss.cache_implementation",
    { kind: "raw" }),
  task_specific_params: e("runtime", "detail", "gloss.task_specific_params"),

  // ── shape ─────────────────────────────────────────────────────────────────
  hidden_size: e("shape", "core", "gloss.hidden_size",
    { kind: "number" }),
  num_hidden_layers: e("shape", "core", "gloss.num_hidden_layers",
    { kind: "count", unit: LAYERS }),
  intermediate_size: e("shape", "core", "gloss.intermediate_size",
    { kind: "number" }),
  hidden_act: e("shape", "detail", "gloss.hidden_act",
    { kind: "act" }),
  mlp_bias: e("shape", "detail", "gloss.mlp_bias",
    { kind: "bool" }),
  rms_norm_eps: e("shape", "detail", "gloss.rms_norm_eps",
    { kind: "number" }),
  layer_norm_eps: e("shape", "detail", "gloss.layer_norm_eps",
    { kind: "number" }),
  num_nextn_predict_layers: e("shape", "detail", "gloss.num_nextn_predict_layers",
    { kind: "count", unit: LAYERS }),
  swiglu_limit: e("shape", "detail", "gloss.swiglu_limit",
    { kind: "number" }),

  // ── attention ─────────────────────────────────────────────────────────────
  num_attention_heads: e("attention", "core", "gloss.num_attention_heads",
    { kind: "count", unit: HEADS }),
  num_key_value_heads: e("attention", "core", "gloss.num_key_value_heads",
    { kind: "count", unit: HEADS }),
  head_dim: e("attention", "core", "gloss.head_dim",
    { kind: "number" }),
  attention_bias: e("attention", "detail", "gloss.attention_bias",
    { kind: "bool" }),
  kv_lora_rank: e("attention", "core", "gloss.kv_lora_rank",
    { kind: "number" }),
  q_lora_rank: e("attention", "detail", "gloss.q_lora_rank",
    { kind: "number" }),
  qk_rope_head_dim: e("attention", "core", "gloss.qk_rope_head_dim",
    { kind: "number" }),
  qk_nope_head_dim: e("attention", "detail", "gloss.qk_nope_head_dim",
    { kind: "number" }),
  v_head_dim: e("attention", "detail", "gloss.v_head_dim",
    { kind: "number" }),
  query_pre_attn_scalar: e("attention", "detail", "gloss.query_pre_attn_scalar",
    { kind: "number" }),
  attn_logit_softcapping: e("attention", "detail", "gloss.attn_logit_softcapping",
    { kind: "number" }),
  use_qk_norm: e("attention", "detail", "gloss.use_qk_norm",
    { kind: "bool" }),
  attention_chunk_size: e("attention", "detail", "gloss.attention_chunk_size",
    { kind: "tokens" }),

  // ── position & context ────────────────────────────────────────────────────
  max_position_embeddings: e("position", "core", "gloss.max_position_embeddings",
    { kind: "tokens" }),
  rope_parameters: e("position", "core", "gloss.rope_parameters"),
  rope_theta: e("position", "detail", "gloss.rope_theta",
    { kind: "number" }),
  rope_scaling: e("position", "core", "gloss.rope_scaling"),
  "rope_scaling.rope_type": e("position", "core", "gloss.rope_scaling.rope_type",
    { kind: "ropeType" }),
  "rope_scaling.factor": e("position", "core", "gloss.rope_scaling.factor",
    { kind: "number" }),
  "rope_scaling.original_max_position_embeddings": e("position", "core", "gloss.rope_scaling.original_max_position_embeddings",
    { kind: "tokens" }),
  original_max_position_embeddings: e("position", "detail", "gloss.original_max_position_embeddings",
    { kind: "tokens" }),
  initial_context_length: e("position", "detail", "gloss.initial_context_length",
    { kind: "tokens" }),
  "rope_scaling.low_freq_factor": e("position", "detail", "gloss.rope_scaling.low_freq_factor",
    { kind: "number" }),
  "rope_scaling.high_freq_factor": e("position", "detail", "gloss.rope_scaling.high_freq_factor",
    { kind: "number" }),
  "rope_scaling.beta_fast": e("position", "detail", "gloss.rope_scaling.beta_fast",
    { kind: "number" }),
  "rope_scaling.beta_slow": e("position", "detail", "gloss.rope_scaling.beta_slow",
    { kind: "number" }),
  "rope_scaling.mscale": e("position", "detail", "gloss.rope_scaling.mscale",
    { kind: "number" }),
  "rope_scaling.mscale_all_dim": e("position", "detail", "gloss.rope_scaling.mscale_all_dim",
    { kind: "number" }),
  "rope_scaling.truncate": e("position", "detail", "gloss.rope_scaling.truncate",
    { kind: "bool" }),
  "rope_scaling.mrope_section": e("position", "detail", "gloss.rope_scaling.mrope_section",
    { kind: "raw" }),
  "rope_scaling.long_factor": e("position", "detail", "gloss.rope_scaling.long_factor",
    { kind: "raw" }),
  "rope_scaling.short_factor": e("position", "detail", "gloss.rope_scaling.short_factor",
    { kind: "raw" }),
  partial_rotary_factor: e("position", "detail", "gloss.partial_rotary_factor",
    { kind: "number" }),
  position_embedding_type: e("position", "detail", "gloss.position_embedding_type",
    { kind: "raw" }),
  sliding_window: e("position", "core", "gloss.sliding_window",
    { kind: "tokens" }),
  use_sliding_window: e("position", "detail", "gloss.use_sliding_window",
    { kind: "bool" }),
  max_window_layers: e("position", "detail", "gloss.max_window_layers",
    { kind: "count", unit: LAYERS }),
  sliding_window_pattern: e("position", "detail", "gloss.sliding_window_pattern",
    { kind: "number" }),
  rope_local_base_freq: e("position", "detail", "gloss.rope_local_base_freq",
    { kind: "number" }),
  no_rope_layers: e("position", "detail", "gloss.no_rope_layers",
    { kind: "raw" }),

  // ── experts ───────────────────────────────────────────────────────────────
  num_experts: e("experts", "core", "gloss.num_experts",
    { kind: "count", unit: EXPERTS }),
  num_experts_per_tok: e("experts", "core", "gloss.num_experts_per_tok",
    { kind: "count", unit: EXPERTS }),
  moe_intermediate_size: e("experts", "core", "gloss.moe_intermediate_size",
    { kind: "number" }),
  shared_expert_intermediate_size: e("experts", "detail", "gloss.shared_expert_intermediate_size",
    { kind: "number" }),
  n_shared_experts: e("experts", "detail", "gloss.n_shared_experts",
    { kind: "count", unit: EXPERTS }),
  norm_topk_prob: e("experts", "detail", "gloss.norm_topk_prob",
    { kind: "bool" }),
  decoder_sparse_step: e("experts", "detail", "gloss.decoder_sparse_step",
    { kind: "number" }),
  mlp_only_layers: e("experts", "detail", "gloss.mlp_only_layers",
    { kind: "raw" }),
  first_k_dense_replace: e("experts", "detail", "gloss.first_k_dense_replace",
    { kind: "count", unit: LAYERS }),
  moe_layer_freq: e("experts", "detail", "gloss.moe_layer_freq",
    { kind: "number" }),
  interleave_moe_layer_step: e("experts", "detail", "gloss.interleave_moe_layer_step",
    { kind: "number" }),
  moe_layers: e("experts", "detail", "gloss.moe_layers",
    { kind: "raw" }),
  routed_scaling_factor: e("experts", "detail", "gloss.routed_scaling_factor",
    { kind: "number" }),
  scoring_func: e("experts", "detail", "gloss.scoring_func",
    { kind: "raw" }),
  topk_method: e("experts", "detail", "gloss.topk_method",
    { kind: "raw" }),
  n_group: e("experts", "detail", "gloss.n_group",
    { kind: "number" }),
  topk_group: e("experts", "detail", "gloss.topk_group",
    { kind: "number" }),
  ep_size: e("experts", "detail", "gloss.ep_size",
    { kind: "number" }),

  // ── hybrid layers ─────────────────────────────────────────────────────────
  layer_types: e("hybrid", "core", "gloss.layer_types",
    { kind: "layerTypes" }),
  layers_block_type: e("hybrid", "core", "gloss.layers_block_type",
    { kind: "layerTypes" }),
  full_attn_idxs: e("hybrid", "core", "gloss.full_attn_idxs",
    { kind: "raw" }),
  full_attention_interval: e("hybrid", "core", "gloss.full_attention_interval",
    { kind: "number" }),
  hybrid_override_pattern: e("hybrid", "core", "gloss.hybrid_override_pattern",
    { kind: "hybridPattern" }),
  attn_layer_indices: e("hybrid", "core", "gloss.attn_layer_indices",
    { kind: "raw" }),

  // ── vocabulary & tokens ───────────────────────────────────────────────────
  vocab_size: e("vocab", "core", "gloss.vocab_size",
    { kind: "number" }),
  tie_word_embeddings: e("vocab", "core", "gloss.tie_word_embeddings",
    { kind: "bool", yes: "gloss.tie_word_embeddings.yes", no: "gloss.tie_word_embeddings.no" }),
  bos_token_id: e("vocab", "detail", "gloss.bos_token_id",
    { kind: "ids" }),
  eos_token_id: e("vocab", "detail", "gloss.eos_token_id",
    { kind: "ids" }),
  pad_token_id: e("vocab", "detail", "gloss.pad_token_id",
    { kind: "ids" }),
  unk_token_id: e("vocab", "detail", "gloss.unk_token_id",
    { kind: "ids" }),
  final_logit_softcapping: e("vocab", "detail", "gloss.final_logit_softcapping",
    { kind: "number" }),

  // ── precision & quantization ──────────────────────────────────────────────
  torch_dtype: e("precision", "core", "gloss.torch_dtype",
    { kind: "dtype" }),
  quantization_config: e("precision", "core", "gloss.quantization_config"),
  "quantization_config.quant_method": e("precision", "core", "gloss.quantization_config.quant_method",
    { kind: "raw" }),
  "quantization_config.bits": e("precision", "core", "gloss.quantization_config.bits",
    { kind: "number" }),
  "quantization_config.group_size": e("precision", "detail", "gloss.quantization_config.group_size",
    { kind: "number" }),
  "quantization_config.zero_point": e("precision", "detail", "gloss.quantization_config.zero_point",
    { kind: "bool" }),
  "quantization_config.version": e("precision", "detail", "gloss.quantization_config.version",
    { kind: "raw" }),
  "quantization_config.desc_act": e("precision", "detail", "gloss.quantization_config.desc_act",
    { kind: "bool" }),
  "quantization_config.sym": e("precision", "detail", "gloss.quantization_config.sym",
    { kind: "bool" }),
  "quantization_config.fmt": e("precision", "detail", "gloss.quantization_config.fmt",
    { kind: "raw" }),
  "quantization_config.activation_scheme": e("precision", "detail", "gloss.quantization_config.activation_scheme",
    { kind: "raw" }),
  "quantization_config.weight_block_size": e("precision", "detail", "gloss.quantization_config.weight_block_size",
    { kind: "raw" }),
  "quantization_config.modules_to_not_convert": e("precision", "detail", "gloss.quantization_config.modules_to_not_convert",
    { kind: "raw" }),
  "quantization_config.ignore": e("precision", "detail", "gloss.quantization_config.ignore",
    { kind: "raw" }),
  "quantization_config.config_groups": e("precision", "detail", "gloss.quantization_config.config_groups"),
  "quantization_config.kv_cache_scheme": e("precision", "core", "gloss.quantization_config.kv_cache_scheme"),
  "quantization_config.format": e("precision", "detail", "gloss.quantization_config.format",
    { kind: "raw" }),
  "quantization_config.quantization_status": e("precision", "detail", "gloss.quantization_config.quantization_status",
    { kind: "raw" }),
  "quantization_config.global_compression_ratio": e("precision", "detail", "gloss.quantization_config.global_compression_ratio",
    { kind: "number" }),
  "quantization_config.load_in_4bit": e("precision", "core", "gloss.quantization_config.load_in_4bit",
    { kind: "bool" }),
  "quantization_config.load_in_8bit": e("precision", "core", "gloss.quantization_config.load_in_8bit",
    { kind: "bool" }),
  "quantization_config.bnb_4bit_quant_type": e("precision", "detail", "gloss.quantization_config.bnb_4bit_quant_type",
    { kind: "raw" }),
  "quantization_config.bnb_4bit_compute_dtype": e("precision", "detail", "gloss.quantization_config.bnb_4bit_compute_dtype",
    { kind: "raw" }),
  "quantization_config.bnb_4bit_use_double_quant": e("precision", "detail", "gloss.quantization_config.bnb_4bit_use_double_quant",
    { kind: "bool" }),

  // ── vision & audio ────────────────────────────────────────────────────────
  text_config: e("identity", "core", "gloss.text_config"),
  vision_config: e("vision", "core", "gloss.vision_config"),
  audio_config: e("audio", "core", "gloss.audio_config"),
  mm_tokens_per_image: e("vision", "core", "gloss.mm_tokens_per_image",
    { kind: "count", unit: TOKENS_UNIT }),
  image_token_index: e("vision", "detail", "gloss.image_token_index",
    { kind: "ids" }),
  video_token_id: e("vision", "detail", "gloss.video_token_id",
    { kind: "ids" }),
  vision_feature_layer: e("vision", "detail", "gloss.vision_feature_layer",
    { kind: "raw" }),
  projector_hidden_act: e("vision", "detail", "gloss.projector_hidden_act",
    { kind: "act" }),
  multimodal_projector_bias: e("vision", "detail", "gloss.multimodal_projector_bias",
    { kind: "bool" }),
  "vision_config.patch_size": e("vision", "detail", "gloss.vision_config.patch_size",
    { kind: "number" }),
  "vision_config.image_size": e("vision", "detail", "gloss.vision_config.image_size",
    { kind: "number" }),
  "vision_config.num_channels": e("vision", "detail", "gloss.vision_config.num_channels",
    { kind: "number" }),
  "vision_config.out_hidden_size": e("vision", "detail", "gloss.vision_config.out_hidden_size",
    { kind: "number" }),
  "vision_config.spatial_merge_size": e("vision", "detail", "gloss.vision_config.spatial_merge_size",
    { kind: "number" }),

  // ── training only ─────────────────────────────────────────────────────────
  initializer_range: e("training", "training", "gloss.initializer_range",
    { kind: "number" }),
  router_aux_loss_coef: e("training", "training", "gloss.router_aux_loss_coef",
    { kind: "number" }),
  aux_loss_alpha: e("training", "training", "gloss.aux_loss_alpha",
    { kind: "number" }),
  output_router_logits: e("training", "training", "gloss.output_router_logits",
    { kind: "bool" }),
  router_jitter_noise: e("training", "training", "gloss.router_jitter_noise",
    { kind: "number" }),
  seq_aux: e("training", "training", "gloss.seq_aux",
    { kind: "bool" }),
  pretraining_tp: e("training", "training", "gloss.pretraining_tp",
    { kind: "number" }),
};

/** Other spellings of the same field, as different families write them. */
export const ALIASES: Record<string, string> = {
  n_embd: "hidden_size",
  n_embed: "hidden_size",
  d_model: "hidden_size",
  n_layer: "num_hidden_layers",
  num_layers: "num_hidden_layers",
  depth: "num_hidden_layers",
  n_head: "num_attention_heads",
  num_heads: "num_attention_heads",
  num_kv_heads: "num_key_value_heads",
  n_inner: "intermediate_size",
  ffn_dim: "intermediate_size",
  hidden_activation: "hidden_act",
  activation_function: "hidden_act",
  layer_norm_epsilon: "layer_norm_eps",
  n_positions: "max_position_embeddings",
  n_ctx: "max_position_embeddings",
  max_seq_len: "max_position_embeddings",
  rotary_emb_base: "rope_theta",
  rotary_pct: "partial_rotary_factor",
  num_local_experts: "num_experts",
  n_routed_experts: "num_experts",
  moe_num_experts: "num_experts",
  experts_per_token: "num_experts_per_tok",
  moe_top_k: "num_experts_per_tok",
  shared_intermediate_size: "shared_expert_intermediate_size",
  dtype: "torch_dtype",
  image_token_id: "image_token_index",
  "rope_scaling.type": "rope_scaling.rope_type",
  "quantization_config.llm_int8_skip_modules": "quantization_config.modules_to_not_convert",
};

/** Families of fields recognised by name. Their meanings are true of every member,
 *  and say nothing more specific than that. */
export const PATTERNS: { test: RegExp; entry: GlossaryEntry }[] = [
  {
    test: /(dropout|_pdrop)$/,
    entry: e("training", "training", "gloss.pattern.dropout",
      { kind: "number" }),
  },
  {
    test: /_token_(id|index)$/,
    entry: e("vocab", "detail", "gloss.pattern.specialToken",
      { kind: "ids" }),
  },
  {
    test: /^(mamba|ssm|time_step)|^conv_kernel$/,
    entry: e("hybrid", "detail", "gloss.pattern.stateSpace"),
  },
  {
    test: /^linear_/,
    entry: e("hybrid", "detail", "gloss.pattern.linearAttention"),
  },
  {
    test: /^summary_/,
    entry: e("training", "training", "gloss.pattern.classifier"),
  },
  {
    test: /^unsloth_/,
    entry: e("runtime", "detail", "gloss.pattern.unsloth"),
  },
  {
    // Not the FFN-width multipliers (LFM2's block_ffn_dim_multiplier sizes a layer).
    test: /^(?!.*ffn).*multiplier$/,
    entry: e("shape", "detail", "gloss.pattern.multiplier",
      { kind: "number" }),
  },
  {
    test: /_bias$/,
    entry: e("shape", "detail", "gloss.pattern.bias",
      { kind: "bool" }),
  },
];

export interface GlossaryHit {
  entry: GlossaryEntry;
  match: "exact" | "pattern";
}

/** The meaning of a field, given its parent object ("" at the top level, or
 *  "rope_scaling", "vision_config"…) and its own name. text_config is the language
 *  model itself, so its children read as top-level fields. */
export function lookupField(parent: string, key: string): GlossaryHit | null {
  const scope = parent === "rope_parameters" ? "rope_scaling" : parent;
  const scoped = scope && scope !== "text_config" && scope !== "llm_config" ? `${scope}.${key}` : "";
  const candidates = [scoped, scoped && ALIASES[scoped], key, ALIASES[key]].filter(Boolean) as string[];
  for (const c of candidates) {
    const hit = GLOSSARY[c];
    if (hit) return { entry: hit, match: "exact" };
  }
  for (const p of PATTERNS) if (p.test.test(key)) return { entry: p.entry, match: "pattern" };
  return null;
}

export const GROUP_LABEL: Record<FieldGroup, string> = {
  identity: "gloss.group.identity",
  shape: "gloss.group.shape",
  attention: "gloss.group.attention",
  position: "gloss.group.position",
  experts: "gloss.group.experts",
  hybrid: "gloss.group.hybrid",
  vocab: "gloss.group.vocab",
  precision: "gloss.group.precision",
  vision: "gloss.group.vision",
  audio: "gloss.group.audio",
  runtime: "gloss.group.runtime",
  training: "gloss.group.training",
  other: "gloss.group.other",
};

export const GROUP_NOTE: Partial<Record<FieldGroup, string>> = {
  vision: "gloss.groupNote.vision",
  audio: "gloss.groupNote.audio",
  training: "gloss.groupNote.training",
  other: "gloss.groupNote.other",
};
