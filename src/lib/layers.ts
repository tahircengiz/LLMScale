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
  return undefined;
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
 *  as vLLM shapes it on one GPU: a convolution state plus the recurrent state. 0 when
 *  the config does not carry the fields. */
export function stateElementsPerLayer(c: Json): number {
  // Gated DeltaNet (Qwen3-Next): conv over q, k and v; state per value head.
  if (typeof c.linear_num_value_heads === "number") {
    const nk = c.linear_num_key_heads ?? c.linear_num_value_heads;
    const nv = c.linear_num_value_heads;
    const dk = c.linear_key_head_dim;
    const dv = c.linear_value_head_dim;
    const k = c.linear_conv_kernel_dim ?? 4;
    if ([nk, nv, dk, dv].every((x) => typeof x === "number")) return (dk * nk * 2 + dv * nv) * (k - 1) + nv * dv * dk;
  }
  // Mamba2 (Granite 4.0-H, Nemotron-H), under either family's spelling.
  const heads = c.mamba_n_heads ?? c.mamba_num_heads;
  const hd = c.mamba_d_head ?? c.mamba_head_dim;
  const st = c.mamba_d_state ?? c.ssm_state_size ?? c.mamba_state_dim;
  if ([heads, hd, st].every((x) => typeof x === "number")) {
    const groups = c.mamba_n_groups ?? c.n_groups ?? c.mamba_num_groups ?? 1;
    const k = c.mamba_d_conv ?? c.conv_kernel ?? 4;
    return (heads * hd + 2 * groups * st) * (k - 1) + heads * hd * st;
  }
  return 0;
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
export function sparseIndexer(c: Json): { topk: number; indexDim: number; indexLayers: number } | undefined {
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
  return { topk: c.index_topk, indexDim: typeof c.index_head_dim === "number" ? c.index_head_dim : 128, indexLayers };
}

/** Config keys that change what a model caches in ways the sizing does not follow
 *  yet, found by the 2026-10-15 audit (docs/audit-2026-10-15-veri-guvenilirligi.md):
 *  per-layer blocks (Nemotron NAS), linear-attention layouts (Kimi-Linear, GLM-5.3's
 *  KDA), sliding patterns given another way (MiMo-V2), interleaved attention types
 *  (MiniMax-Text, Jamba), KV shared across layers (Gemma 3n/4), a second head shape
 *  for global layers (Gemma 4), Mamba beside attention in every layer (Falcon-H1),
 *  cross-attention (Llama 3.2 Vision) and a float32 SSM state (Nemotron-H, Qwen3.5).
 *  The figures still show, marked as approximate. */
export function unmodelledCacheKeys(c: Json): string[] {
  if (!c || typeof c !== "object") return [];
  const found: string[] = [];
  const num = (k: string) => typeof c[k] === "number";
  const nas = nasAttention(c, c.num_hidden_layers ?? 0);
  if (Array.isArray(c.block_configs) && !nas) found.push("block_configs");
  if (c.num_key_value_heads === null && !nas) found.push("num_key_value_heads: null");
  if (c.linear_attn_config && typeof c.linear_attn_config === "object") found.push("linear_attn_config");
  if (c.hybrid_layer_pattern !== undefined) found.push("hybrid_layer_pattern");
  if (Array.isArray(c.attn_type_list)) found.push("attn_type_list");
  if (num("attn_layer_period")) found.push("attn_layer_period");
  if (c.mamba_d_ssm !== undefined && !Array.isArray(c.layer_types) && c.hybrid_override_pattern === undefined) found.push("mamba_d_ssm");
  if (Array.isArray(c.cross_attention_layers)) found.push("cross_attention_layers");
  const ssm = c.mamba_ssm_cache_dtype ?? c.mamba_ssm_dtype;
  if (typeof ssm === "string" && /32/.test(ssm)) found.push(c.mamba_ssm_cache_dtype !== undefined ? "mamba_ssm_cache_dtype" : "mamba_ssm_dtype");
  else if (c.model_type === "nemotron_h") found.push("mamba_ssm_cache_dtype (float32 in vLLM)");
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
 *  attention. `c` is the language model's part of the config. States are counted
 *  at 2 bytes an element: vLLM keeps them in the model's dtype by default
 *  (mamba_cache_dtype "auto"), and these models ship in BF16. */
export function layerPlan(c: Json): LayerPlan | undefined {
  const L = c?.num_hidden_layers ?? 0;
  if (!L) return undefined;
  const hybrid = hybridLayers(c, L);
  const nas = hybrid ? undefined : nasAttention(c, L);
  const shared = hybrid ? 0 : kvSharedLayers(c, L);
  const window = activeWindow(c, L - shared);
  // A window the config does not assign to layers is left out: counting the whole
  // context for every layer overstates the cache, counting none would understate it.
  const sliding = window && window.sliding > 0 ? window.sliding : 0;
  const attention = hybrid ? hybrid.attention : nas ? nas.attention : L - shared;
  const global = attention > sliding ? globalAttnShape(c) : undefined;
  if (!hybrid && !sliding && !shared && !global && !(nas && nas.attention !== L)) return undefined;
  const plan: LayerPlan = {
    attention,
    sliding: Math.min(sliding, attention),
    window: sliding ? window!.size : undefined,
    stateBytesPerSeq: hybrid ? hybrid.state * stateElementsPerLayer(c) * 2 : 0,
    stateLayers: hybrid ? hybrid.state : 0,
  };
  if (global) plan.globalAttn = global;
  return plan;
}
