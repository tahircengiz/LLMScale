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
    const types: string[] = c[key].map(String);
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

/** A sliding window that is actually in use, and how many layers use it
 *  (0 when the config does not say which). */
export function activeWindow(c: Json): { size: number; sliding: number; path: string } | undefined {
  const size = c.sliding_window;
  if (typeof size !== "number" || size <= 0 || c.use_sliding_window === false) return undefined;
  // Phi-3.5-mini declares a 262,144-token window over a 131,072-token context.
  const maxCtx = c.max_position_embeddings;
  if (typeof maxCtx === "number" && size >= maxCtx) return undefined;
  const types: string[] | undefined = Array.isArray(c.layer_types) ? c.layer_types.map(String) : undefined;
  let sliding = types ? types.filter((t) => t.includes("sliding")).length : 0;
  if (types && sliding === 0) return undefined;
  // Gemma 3 says it as a pattern instead: every pattern-th layer is global.
  const pattern = c.sliding_window_pattern;
  const L = c.num_hidden_layers;
  if (!types && typeof pattern === "number" && pattern > 1 && typeof L === "number") sliding = L - Math.floor(L / pattern);
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

export interface LayerPlan {
  /** Layers that keep a KV cache (full or sliding). */
  attention: number;
  /** Of those, the ones that keep only the last `window` tokens. */
  sliding: number;
  window?: number;
  /** Fixed state per sequence across the linear-attention and Mamba layers, bytes. */
  stateBytesPerSeq: number;
  /** How many layers keep that state. */
  stateLayers: number;
}

/** How a config's layers cache, or undefined when every layer is plain full
 *  attention. `c` is the language model's part of the config. States are counted
 *  at 2 bytes an element: vLLM keeps them in the model's dtype by default
 *  (mamba_cache_dtype "auto"), and these models ship in BF16. */
export function layerPlan(c: Json): LayerPlan | undefined {
  const L = c?.num_hidden_layers ?? 0;
  if (!L) return undefined;
  const hybrid = hybridLayers(c, L);
  const window = activeWindow(c);
  // A window the config does not assign to layers is left out: counting the whole
  // context for every layer overstates the cache, counting none would understate it.
  const sliding = window && window.sliding > 0 ? window.sliding : 0;
  if (!hybrid && !sliding) return undefined;
  const attention = hybrid ? hybrid.attention : L;
  return {
    attention,
    sliding: Math.min(sliding, attention),
    window: sliding ? window!.size : undefined,
    stateBytesPerSeq: hybrid ? hybrid.state * stateElementsPerLayer(c) * 2 : 0,
    stateLayers: hybrid ? hybrid.state : 0,
  };
}
