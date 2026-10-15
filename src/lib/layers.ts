// Which layers keep a KV cache, and how much of it.
//
// Three kinds of decoder layer cost memory differently as the context grows:
//   - full attention keeps every token: its cache grows with the context;
//   - sliding-window attention keeps only the last `window` tokens (Gemma 2 and
//     3, gpt-oss): its cache stops growing at the window;
//   - linear attention and Mamba layers (Qwen3-Next, Granite 4.0-H, Nemotron-H)
//     keep no cache at all, only a fixed-size state per sequence.
// Counting every layer as full attention overstated Gemma 3 27B's cache 5x at
// 32k tokens and Qwen3-Next's 4x. vLLM allocates the window, not the context, to
// sliding layers (SlidingWindowSpec in vllm/v1/kv_cache_interface.py), and sizes
// the states with the shapes in vllm/model_executor/layers/mamba/mamba_utils.py,
// which stateBytesPerLayer follows.
//
// React-free: hf.ts and configExplain.ts read configs with it, and the tests run it.

// Configs are free-form JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** Transformers' defaults for the keys a nested language-model config may leave
 *  out, because they equal its class's: llava 1.5's Vicuna and Janus's Llama,
 *  llava-next's Mistral, DeepSeek-VL2's V2 (whose vocab_size vLLM sets to
 *  102,400, vllm/transformers_utils/configs/deepseek_vl2.py). vLLM decides MLA by
 *  kv_lora_rank alone, not use_mla, so a config that leaves it out is MLA there
 *  too; DeepSeek-VL2-tiny, which is not, sets it to null. */
const TEXT_DEFAULTS: Record<string, Json> = {
  llama: { hidden_size: 4096, intermediate_size: 11008, num_hidden_layers: 32, num_attention_heads: 32, max_position_embeddings: 2048, vocab_size: 32000 },
  mistral: { hidden_size: 4096, intermediate_size: 14336, num_hidden_layers: 32, num_attention_heads: 32, num_key_value_heads: 8, max_position_embeddings: 131072, vocab_size: 32000 },
  deepseek_v2: { kv_lora_rank: 512, qk_rope_head_dim: 64, vocab_size: 102400 },
};

/** The language model's part of a config, wherever a multimodal config nests it:
 *  text_config, llm_config (InternVL), thinker_config.text_config (Qwen-Omni),
 *  language_config (DeepSeek-VL2, Janus); with its class's defaults filled in. */
export function textConfig(cfg: Json): Json {
  if (!cfg || typeof cfg !== "object") return cfg;
  const nested = cfg.thinker_config?.text_config ?? cfg.text_config ?? cfg.llm_config ?? cfg.language_config;
  if (!nested || typeof nested !== "object") return cfg;
  const d = TEXT_DEFAULTS[String(nested.model_type ?? "")];
  return d ? { ...d, ...nested } : nested;
}

/** Where textConfig found the language model, as a path prefix for citing its keys. */
export function textConfigPrefix(cfg: Json): string {
  if (cfg?.thinker_config?.text_config) return "thinker_config.text_config.";
  if (cfg?.text_config) return "text_config.";
  if (cfg?.llm_config) return "llm_config.";
  if (cfg?.language_config) return "language_config.";
  return "";
}

/** Hybrid models: how many layers keep a KV cache, how many a fixed state, and
 *  what those are. */
export function hybridLayers(
  c: Json,
  L: number,
): { attention: number; state: number; other: "linear" | "mamba"; path: string } | undefined {
  // layer_types (Granite, Qwen, gpt-oss) or layers_block_type (Nemotron-H re-saved
  // by Transformers v5). Attention layers are counted directly, so "moe" or "mlp"
  // entries are never mistaken for attention.
  for (const key of ["layer_types", "layers_block_type"]) {
    if (!Array.isArray(c[key])) continue;
    // Speculative-decoding layers come after the model's own (Step-3.5 lists three).
    const types: string[] = (L > 0 ? c[key].slice(0, L) : c[key]).map(String);
    const isState = (t: string) => /linear|mamba|ssm|recurrent|conv/.test(t);
    const state = types.filter(isState);
    if (state.length > 0) {
      return {
        attention: types.filter((t) => /attention/.test(t) && !isState(t)).length,
        state: state.length,
        other: state.some((t) => /mamba|ssm/.test(t)) ? "mamba" : "linear",
        path: key,
      };
    }
  }
  // LFM2 lists its attention layers; the rest are short convolutions.
  if (Array.isArray(c.full_attn_idxs) && L > 0 && c.full_attn_idxs.length < L) {
    return { attention: c.full_attn_idxs.length, state: L - c.full_attn_idxs.length, other: "linear", path: "full_attn_idxs" };
  }
  if (typeof c.full_attention_interval === "number" && c.full_attention_interval > 1 && L > 0) {
    const attention = Math.floor(L / c.full_attention_interval);
    return { attention, state: L - attention, other: "linear", path: "full_attention_interval" };
  }
  // Nemotron-H: M is a Mamba layer, * attention, - an MLP layer with neither.
  if (typeof c.hybrid_override_pattern === "string") {
    const p: string[] = [...c.hybrid_override_pattern];
    if (p.includes("M")) return { attention: p.filter((ch) => ch === "*").length, state: p.filter((ch) => ch === "M").length, other: "mamba", path: "hybrid_override_pattern" };
  }
  // Jamba: one attention layer every attn_layer_period, at attn_layer_offset, and a
  // Mamba (v1) layer everywhere else (JambaConfig.layers_block_type, vllm jamba.py).
  const period = c.attn_layer_period;
  if (typeof period === "number" && period > 0 && typeof c.attn_layer_offset === "number" && L > 0) {
    let attention = 0;
    for (let i = 0; i < L; i++) if (i % period === c.attn_layer_offset) attention++;
    if (attention < L) return { attention, state: L - attention, other: "mamba", path: "attn_layer_period" };
  }
  // MiniMax-Text-01 and M1: 1 is softmax attention, 0 lightning (linear) attention.
  if (Array.isArray(c.attn_type_list) && L > 0) {
    const attention = c.attn_type_list.slice(0, L).filter((t: unknown) => Number(t) === 1).length;
    if (attention < L) return { attention, state: L - attention, other: "linear", path: "attn_type_list" };
  }
  // Kimi-Linear: its linear_attn_config lists the KDA layers and the MLA ones.
  const lac = c.linear_attn_config;
  if (lac && Array.isArray(lac.kda_layers) && Array.isArray(lac.full_attn_layers) && lac.kda_layers.length > 0 && L > 0 &&
    lac.kda_layers.length + lac.full_attn_layers.length <= L) {
    return { attention: lac.full_attn_layers.length, state: lac.kda_layers.length, other: "linear", path: "linear_attn_config" };
  }
  // Falcon-H1: an attention block and a Mamba2 mixer side by side in every layer
  // (FalconH1ParallelHybrid in vllm/model_executor/models/falcon_h1.py).
  if (L > 0 && (/^falcon_h1/.test(String(c.model_type ?? "")) || (typeof c.mamba_d_ssm === "number" && typeof c.mamba_n_heads === "number"))) {
    return { attention: L, state: L, other: "mamba", path: "mamba_d_ssm" };
  }
  return undefined;
}

/** MiMo-V2: `hybrid_layer_pattern` marks its sliding layers (1), which have their
 *  own key-value heads and widths (swa_num_key_value_heads, swa_head_dim,
 *  swa_v_head_dim), and keys wider than values (head_dim 192, v_head_dim 128).
 *  The config has no layer_types, so vLLM 0.31 sets its 128-token window for the
 *  whole model and the global layers inherit it (arg_utils.py, Attention.__init__):
 *  every layer keeps the window, all in one group whose page is the sum of theirs.
 *  Only that sum matters, so `attention` counts layers of the sliding shape that
 *  hold as much: exact on up to as many GPUs as the global layers have KV heads. */
export function mimoAttention(c: Json, L: number): { attention: number; kvHeads: number; headDim: number; vHeadDim: number } | undefined {
  if (!Array.isArray(c?.hybrid_layer_pattern) || typeof c.swa_num_key_value_heads !== "number" || typeof c.num_key_value_heads !== "number") return undefined;
  const hd = c.head_dim;
  const swaHd = c.swa_head_dim ?? hd;
  if (typeof hd !== "number" || typeof swaHd !== "number") return undefined;
  const p: number[] = c.hybrid_layer_pattern.slice(0, L > 0 ? L : undefined).map(Number);
  const swa = p.filter((x) => x === 1).length;
  const vHd = typeof c.v_head_dim === "number" ? c.v_head_dim : hd;
  const swaVHd = typeof c.swa_v_head_dim === "number" ? c.swa_v_head_dim : vHd;
  const width = (kv: number, k: number, v: number) => kv * (k + v);
  const ratio = width(c.num_key_value_heads, hd, vHd) / width(c.swa_num_key_value_heads, swaHd, swaVHd);
  return { attention: swa + (p.length - swa) * ratio, kvHeads: c.swa_num_key_value_heads, headDim: swaHd, vHeadDim: swaVHd };
}

/** Llama 3.2 Vision (mllama): the layers in `cross_attention_layers` attend to one
 *  image, not to the text: they keep the image's keys and values, max_num_tiles
 *  tiles of (image_size / patch_size)² + 1 patches, whatever the context. vLLM 0.31
 *  no longer loads it (vllmSupport.ts); this is how the model itself caches. */
export function crossAttention(cfg: Json, L: number): { layers: number; tokens: number } | undefined {
  const c = textConfig(cfg);
  const v = cfg?.vision_config;
  if (!Array.isArray(c?.cross_attention_layers) || !v) return undefined;
  const layers = c.cross_attention_layers.filter((i: unknown) => typeof i === "number" && i < L).length;
  const { image_size: size, patch_size: patch, max_num_tiles: tiles } = v;
  if (!layers || ![size, patch, tiles].every((x) => typeof x === "number" && x > 0)) return undefined;
  return { layers, tokens: tiles * ((Math.floor(size / patch) ** 2) + 1) };
}

/** Nemotron NAS (DeciLM: Llama-3.3-Nemotron-Super-49B, Llama-3.1-Nemotron-Ultra-253B,
 *  Llama-3.1-Nemotron-51B) gives every layer its own block. A block whose attention is
 *  `no_op` has none, and the rest keep num_attention_heads / n_heads_in_group KV heads
 *  (DeciLMDecoderLayer in vllm/model_executor/models/nemotron_nas.py); the config's
 *  num_key_value_heads is null. vLLM reports the first attention block's heads as the
 *  model's (NemotronNasModelArchConfigConvertor), and as all its layers are full
 *  attention it keeps them in one group whose page is the sum of theirs. Where the
 *  blocks differ in heads (the 51B), `attention` counts layers of `kvHeads` heads that
 *  hold as much, so it may not be whole. `linear` blocks (`replace_with_linear`) keep
 *  no cache; vLLM 0.31 cannot build them. Read as 80 layers of 64 heads, Super-49B's
 *  cache came out 13x too large. */
export function nasAttention(c: Json, L: number): { attention: number; kvHeads: number; linear: number; ffn?: number } | undefined {
  if (!Array.isArray(c?.block_configs) || typeof c.num_attention_heads !== "number") return undefined;
  const blocks: Json[] = L > 0 ? c.block_configs.slice(0, L) : c.block_configs;
  let first = 0;
  let heads = 0;
  let linear = 0;
  let ffn = 0;
  for (const b of blocks) {
    // vLLM sizes a block's MLP from ffn_mult: 2/3 of it times the width, rounded up to 256.
    const f = b?.ffn;
    if (f && !f.no_op) {
      const width = typeof f.ffn_mult === "number" ? Math.ceil(Math.floor((2 * f.ffn_mult * c.hidden_size) / 3) / 256) * 256 : f.intermediate_size;
      if (typeof width === "number" && width > ffn) ffn = width;
    }
    const a = b?.attention;
    if (!a || a.no_op) continue;
    if (a.replace_with_linear) {
      linear++;
      continue;
    }
    if (typeof a.n_heads_in_group !== "number" || a.n_heads_in_group <= 0) return undefined;
    const kv = Math.floor(c.num_attention_heads / a.n_heads_in_group);
    if (!first) first = kv;
    heads += kv;
  }
  if (!first) return undefined;
  const out: { attention: number; kvHeads: number; linear: number; ffn?: number } = { attention: heads / first, kvHeads: first, linear };
  if (ffn > 0) out.ffn = ffn;
  return out;
}

/** Layers at the end of the stack that read an earlier layer's cache instead of
 *  keeping their own: Gemma 3n's and Gemma 4's `num_kv_shared_layers`. vLLM gives
 *  each a kv_sharing_target_layer_name, the last earlier layer of its kind, and no
 *  cache (vllm/model_executor/models/gemma4.py, gemma3n.py). Counting them put
 *  Gemma 4 E2B's cache 94% high at 4k tokens. */
export function kvSharedLayers(c: Json, L: number): number {
  const n = c?.num_kv_shared_layers;
  return typeof n === "number" && n > 0 && n < L ? n : 0;
}

/** Gemma 4's full-attention layers' key-value shape, where it differs from the
 *  sliding layers': head_dim becomes `global_head_dim`, and with
 *  `attention_k_eq_v` the heads become `num_global_key_value_heads`
 *  (gemma4_layer_config in vllm/transformers_utils/configs/gemma4.py). Read as
 *  the sliding shape, the 31B's cache came out 72% high at 128k tokens. */
export function globalAttnShape(c: Json): { kvHeads: number; headDim: number } | undefined {
  if (!c || typeof c !== "object" || (c.model_type !== undefined && !/gemma4/.test(String(c.model_type)))) return undefined;
  const headDim = typeof c.global_head_dim === "number" && c.global_head_dim > 0 ? c.global_head_dim : c.head_dim;
  const global = c.num_global_key_value_heads;
  const kvHeads = c.attention_k_eq_v === true && typeof global === "number" && global > 0 ? global : c.num_key_value_heads;
  if (typeof headDim !== "number" || typeof kvHeads !== "number") return undefined;
  if (headDim === c.head_dim && kvHeads === c.num_key_value_heads) return undefined;
  return { kvHeads, headDim };
}

/** A sliding window that is actually in use, and how many layers use it
 *  (0 when the config does not say which). `own` limits the count to the layers
 *  that keep a cache of their own (kvSharedLayers). */
export function activeWindow(c: Json, own?: number): { size: number; sliding: number; path: string } | undefined {
  const size = c.sliding_window;
  if (typeof size !== "number" || size <= 0 || c.use_sliding_window === false) return undefined;
  // Phi-3.5-mini declares a 262,144-token window over a 131,072-token context.
  const maxCtx = c.max_position_embeddings;
  if (typeof maxCtx === "number" && size >= maxCtx) return undefined;
  const L = c.num_hidden_layers;
  const upTo = typeof own === "number" && own > 0 ? own : L;
  const types: string[] | undefined = Array.isArray(c.layer_types)
    ? (typeof upTo === "number" && upTo > 0 ? c.layer_types.slice(0, upTo) : c.layer_types).map(String)
    : undefined;
  let sliding = types ? types.filter((t) => t.includes("sliding")).length : 0;
  if (types && sliding === 0) return undefined;
  // Gemma 3 says it as a pattern instead: every pattern-th layer is global.
  const pattern = c.sliding_window_pattern;
  if (!types && typeof pattern === "number" && pattern > 1 && typeof L === "number") sliding = L - Math.floor(L / pattern);
  else if (!types && typeof L === "number" && L > 0) {
    // No layer list and no pattern. vLLM then sets CacheConfig.sliding_window for
    // every layer (arg_utils.py): Mistral-7B v0.1, Phi-3-mini-4k, Starcoder2. Gemma 2
    // alternates, as Transformers builds its layer_types; Qwen2 slides from
    // max_window_layers up when use_sliding_window is on.
    if (c.model_type === "gemma2") sliding = Math.ceil(L / 2);
    else if (c.use_sliding_window === true && typeof c.max_window_layers === "number") sliding = Math.max(0, L - c.max_window_layers);
    else sliding = L;
  }
  return { size, sliding, path: "sliding_window" };
}

/** Elements of fixed state one linear-attention or Mamba layer keeps per sequence,
 *  as vLLM shapes it on one GPU (vllm/model_executor/layers/mamba/mamba_utils.py):
 *  a convolution state over the last kernel − 1 inputs and the recurrent (SSM)
 *  state, which vLLM may keep in another dtype. undefined when the config does not
 *  carry the fields. */
export function stateShape(c: Json): { conv: number; ssm: number } | undefined {
  // KDA (Kimi-Linear, GLM-5.3-Flash): conv over q, k and v; a head_dim² state per
  // head (kda_state_shape).
  const lac = c.linear_attn_config;
  if (lac && typeof lac.num_heads === "number" && typeof lac.head_dim === "number") {
    const k = lac.short_conv_kernel_size ?? 4;
    return { conv: lac.num_heads * lac.head_dim * 3 * (k - 1), ssm: lac.num_heads * lac.head_dim * lac.head_dim };
  }
  // MiniMax lightning attention: a head_dim² state per head, no convolution
  // (linear_attention_state_shape).
  if (Array.isArray(c.attn_type_list) && typeof c.num_attention_heads === "number") {
    const hd = c.head_dim ?? Math.floor(c.hidden_size / c.num_attention_heads);
    if (typeof hd === "number" && hd > 0) return { conv: 0, ssm: c.num_attention_heads * hd * hd };
  }
  // Gated DeltaNet (Qwen3-Next, Qwen3.5): conv over q, k and v; state per value head.
  if (typeof c.linear_num_value_heads === "number") {
    const nk = c.linear_num_key_heads ?? c.linear_num_value_heads;
    const nv = c.linear_num_value_heads;
    const dk = c.linear_key_head_dim;
    const dv = c.linear_value_head_dim;
    const k = c.linear_conv_kernel_dim ?? 4;
    if ([nk, nv, dk, dv].every((x) => typeof x === "number")) return { conv: (dk * nk * 2 + dv * nv) * (k - 1), ssm: nv * dv * dk };
  }
  // Mamba2 (Granite 4.0-H, Nemotron-H), under either family's spelling.
  const heads = c.mamba_n_heads ?? c.mamba_num_heads;
  const hd = c.mamba_d_head ?? c.mamba_head_dim;
  const st = c.mamba_d_state ?? c.ssm_state_size ?? c.mamba_state_dim;
  if ([heads, hd, st].every((x) => typeof x === "number")) {
    const groups = c.mamba_n_groups ?? c.n_groups ?? c.mamba_num_groups ?? 1;
    const k = c.mamba_d_conv ?? c.conv_kernel ?? 4;
    // Falcon-H1 gives the mixer's width as mamba_d_ssm.
    const inner = typeof c.mamba_d_ssm === "number" ? c.mamba_d_ssm : heads * hd;
    return { conv: (inner + 2 * groups * st) * (k - 1), ssm: heads * hd * st };
  }
  // Mamba (v1, Jamba): conv and state over mamba_expand × hidden_size channels
  // (mamba1_state_shape).
  if (typeof c.mamba_expand === "number" && typeof c.mamba_d_state === "number" && typeof c.hidden_size === "number") {
    const inner = c.mamba_expand * c.hidden_size;
    return { conv: inner * ((c.mamba_d_conv ?? 4) - 1), ssm: inner * c.mamba_d_state };
  }
  return undefined;
}

/** Bytes an element of the recurrent state takes in vLLM 0.31.0. The convolution
 *  state stays in the model's dtype (16-bit); the recurrent one follows
 *  --mamba-ssm-cache-dtype, whose "auto" the model's config class resolves
 *  (vllm/model_executor/models/config.py): Nemotron-H to its config's
 *  mamba_ssm_cache_dtype or float32, Qwen3.5 (and Qwen4Exp) to its config's
 *  mamba_ssm_dtype — float32 in every published one; KDA (Kimi-Linear,
 *  GLM-5.3-Flash) keeps float32 itself. Counting 2 bytes left
 *  Nemotron Nano 9B v2's reservation 40% short at 4k tokens. */
export function ssmStateBytes(c: Json): number {
  const bytes = (v: unknown) => (typeof v === "string" ? (/32/.test(v) ? 4 : /16/.test(v) ? 2 : undefined) : undefined);
  const type = String(c?.model_type ?? "");
  // KDA keeps its recurrent state in float32 under "auto" (kda_state_dtype).
  if (c?.linear_attn_config && typeof c.linear_attn_config.num_heads === "number") return bytes(c.mamba_ssm_cache_dtype) ?? 4;
  if (/^nemotron_h/.test(type)) return bytes(c.mamba_ssm_cache_dtype) ?? 4;
  if (/^qwen3_5|^qwen4_exp/.test(type)) return bytes(c.mamba_ssm_dtype) ?? 2;
  return 2;
}

/** Bytes of fixed state one linear-attention or Mamba layer keeps per sequence. */
export function stateBytesPerLayer(c: Json): number {
  const s = stateShape(c);
  return s ? s.conv * 2 + s.ssm * ssmStateBytes(c) : 0;
}

/** DeepSeek V4: how many layers fold their cache 4 tokens into one entry (CSA)
 *  and 128 into one (HCA), beside the sliding window every layer keeps. The list
 *  carries the speculative-decoding layers after the model's own, so only the
 *  first num_hidden_layers count. vLLM builds an indexer for ratio 4 only and
 *  accepts no other ratio (vllm/models/deepseek_v4/attention.py). */
export function compressedLayers(c: Json): { csa: number; hca: number; window: number; indexDim: number; topk?: number } | undefined {
  const L = c?.num_hidden_layers ?? 0;
  if (!Array.isArray(c?.compress_ratios) || !L || typeof c.sliding_window !== "number" || c.sliding_window <= 0) return undefined;
  const ratios: number[] = c.compress_ratios.slice(0, L).map(Number);
  const csa = ratios.filter((r) => r === 4).length;
  const hca = ratios.filter((r) => r === 128).length;
  if (csa + hca === 0) return undefined;
  const out: { csa: number; hca: number; window: number; indexDim: number; topk?: number } =
    { csa, hca, window: c.sliding_window, indexDim: typeof c.index_head_dim === "number" ? c.index_head_dim : 128 };
  if (typeof c.index_topk === "number" && c.index_topk > 0) out.topk = c.index_topk;
  return out;
}

/** DeepSeek Sparse Attention (DeepSeek-V3.2, GLM-5): vLLM serves an MLA config
 *  with `index_topk` as DSA and builds a lightning indexer, with a cache of its own,
 *  in every layer, unless IndexCache's `index_topk_freq` or `index_topk_pattern`
 *  ("S" skips) lets a layer reuse an earlier layer's picks. Only the first
 *  num_hidden_layers count; the speculative-decoding layers come after them
 *  (vllm/models/deepseek_v32/attention.py). V4's indexer is compressedLayers'. */
export function sparseIndexer(c: Json): { topk: number; indexDim: number; indexLayers: number; kpool?: number } | undefined {
  const L = c?.num_hidden_layers ?? 0;
  if (typeof c?.index_topk !== "number" || c.index_topk <= 0 || !L || !c.kv_lora_rank || Array.isArray(c.compress_ratios)) return undefined;
  const freq = typeof c.index_topk_freq === "number" && c.index_topk_freq > 1 ? c.index_topk_freq : 1;
  const offset = typeof c.index_skip_topk_offset === "number" ? c.index_skip_topk_offset : 2;
  const pattern: string | string[] | undefined = typeof c.index_topk_pattern === "string" || Array.isArray(c.index_topk_pattern) ? c.index_topk_pattern : undefined;
  // A hybrid's linear-attention layers keep no indexer (GLM-5.3-Flash).
  const types: string[] | undefined = Array.isArray(c.layer_types) ? c.layer_types.map(String) : undefined;
  const isState = (l: number) => !!types && /linear|mamba|ssm|recurrent|conv/.test(types[l] ?? "");
  let indexLayers = 0;
  for (let l = 0; l < L; l++) {
    const skip = pattern ? l < pattern.length && pattern[l] === "S" : Math.max(l - offset + 1, 0) % freq !== 0;
    if (!skip && !isState(l)) indexLayers++;
  }
  const out: { topk: number; indexDim: number; indexLayers: number; kpool?: number } =
    { topk: c.index_topk, indexDim: typeof c.index_head_dim === "number" ? c.index_head_dim : 128, indexLayers };
  // GLM-5.3-Flash pools its indexer keys, one per index_kpool tokens
  // (Glm5NextIndexerCache's tokens_per_state in vllm/models/glm5next).
  if (typeof c.index_kpool === "number" && c.index_kpool > 1) out.kpool = c.index_kpool;
  return out;
}

/** Config keys that change what a model caches in ways the sizing does not follow
 *  yet. The 2026-10-15 audit (docs/audit-2026-10-15-veri-guvenilirligi.md) found a
 *  dozen; phase 2 modelled them (Nemotron NAS blocks, Gemma 4's global layers and
 *  shared caches, Jamba, Falcon-H1, KDA, MiMo-V2, MiniMax-Text, mllama, float32
 *  SSM states). What is left: blocks or layer lists the readers below could not
 *  make sense of. The figures still show, marked as approximate. */
export function unmodelledCacheKeys(c: Json): string[] {
  if (!c || typeof c !== "object") return [];
  const found: string[] = [];
  const L = c.num_hidden_layers ?? 0;
  const nas = nasAttention(c, L);
  if (Array.isArray(c.block_configs) && !nas) found.push("block_configs");
  if (c.num_key_value_heads === null && !nas) found.push("num_key_value_heads: null");
  if (c.linear_attn_config && typeof c.linear_attn_config === "object" && !stateShape(c)) found.push("linear_attn_config");
  if (c.hybrid_layer_pattern !== undefined && !mimoAttention(c, L)) found.push("hybrid_layer_pattern");
  return found;
}

export interface LayerPlan {
  /** Layers that keep a KV cache of their own (full or sliding). */
  attention: number;
  /** Of those, the ones that keep only the last `window` tokens. */
  sliding: number;
  window?: number;
  /** Fixed state per sequence across the linear-attention and Mamba layers, bytes. */
  stateBytesPerSeq: number;
  /** How many layers keep that state. */
  stateLayers: number;
  /** The full-attention layers' shape where it differs (Gemma 4). */
  globalAttn?: { kvHeads: number; headDim: number };
}

/** How a config's layers cache, or undefined when every layer is plain full
 *  attention. `c` is the language model's part of the config. A state's
 *  convolution part is counted at 2 bytes an element: vLLM keeps it in the model's
 *  dtype by default (mamba_cache_dtype "auto"), and these models ship in BF16; its
 *  recurrent part as ssmStateBytes says. */
export function layerPlan(c: Json): LayerPlan | undefined {
  const L = c?.num_hidden_layers ?? 0;
  if (!L) return undefined;
  const hybrid = hybridLayers(c, L);
  const nas = hybrid ? undefined : nasAttention(c, L);
  const mimo = hybrid || nas ? undefined : mimoAttention(c, L);
  const shared = hybrid ? 0 : kvSharedLayers(c, L);
  // mllama's cross-attention layers keep an image, not the context (crossAttention).
  const cross = Array.isArray(c.cross_attention_layers) ? c.cross_attention_layers.filter((i: unknown) => typeof i === "number" && i < L).length : 0;
  const window = activeWindow(c, L - shared);
  // A window the config does not assign to layers is left out: counting the whole
  // context for every layer overstates the cache, counting none would understate it.
  let sliding = window && window.sliding > 0 ? window.sliding : 0;
  const attention = hybrid ? hybrid.attention : nas ? nas.attention : mimo ? mimo.attention : L - shared - cross;
  // MiMo-V2's window reaches every layer, counted in layers of the sliding shape.
  if (mimo && sliding >= L) sliding = attention;
  const global = attention > sliding ? globalAttnShape(c) : undefined;
  if (!hybrid && !sliding && !shared && !global && !cross && !(nas && nas.attention !== L) && !(mimo && mimo.attention !== L)) return undefined;
  const plan: LayerPlan = {
    attention,
    sliding: Math.min(sliding, attention),
    window: sliding ? window!.size : undefined,
    stateBytesPerSeq: hybrid ? hybrid.state * stateBytesPerLayer(c) : 0,
    stateLayers: hybrid ? hybrid.state : 0,
  };
  if (global) plan.globalAttn = global;
  return plan;
}
