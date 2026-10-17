// Hugging Face Hub integration — runs entirely client-side.
// CORS is fully supported by HF (the API reflects the Origin header), so no
// proxy is needed. Gated models (Llama, Gemma, some Mistral) return 401 on
// config.json from the browser; for those we fall back to the bundled arch DB.

import type { Dtype, ModelArch } from "./calc";
import { findKnownByHfId } from "./models.ts";
import { activeParamsOf, expertCount, expertsPerToken, expertWidth, lookupParams, specParamsOf } from "./moe.ts";
import { vllmRefuses } from "./vllmSupport.ts";
import { compressedLayers, crossAttention, layerPlan, mimoAttention, nasAttention, sparseIndexer, textConfig, unmodelledCacheKeys } from "./layers.ts";

const HF = "https://huggingface.co";

/** fetch with an abort timeout so a blocked / black-holed network (e.g. a proxy
 * that never responds) fails fast instead of hanging the search box or the
 * model resolver forever. Aborted requests reject → callers fall back. */
async function fetchWithTimeout(url: string, ms = 8000, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface HfSearchResult {
  id: string;
  downloads?: number;
  likes?: number;
  gated?: boolean | string;
  pipeline_tag?: string;
}

export interface HfModelInfo {
  id: string;
  gated: boolean;
  numParams: number | null;
  modelType?: string;
  /** dtype of the largest safetensors shard, e.g. "BF16". */
  paramDtype?: string;
  /** Full safetensors dtype→element-count map (for the precision-mix chart). */
  dtypeParams?: Record<string, number>;
  /** Hub tags (e.g. "conversational", "code", "multimodal", language codes). */
  tags: string[];
  /** Primary pipeline tag, e.g. "text-generation", "feature-extraction". */
  pipelineTag?: string;
  /** Base model this repo was quantized/fine-tuned from (for GGUF/AWQ/FP8 repos). */
  baseModel?: string;
  // Hub metadata (surfaced for the Model Anatomy tab).
  downloads?: number;
  likes?: number;
  license?: string;
  createdAt?: string;
  lastModified?: string;
  /** Total on-disk repo size in bytes. */
  usedStorage?: number;
  /** Bytes in the repository's top-level safetensors weight files. */
  weightFileBytes?: number;
  /** The repository's file names. */
  files?: string[];
}

/** Bytes in a repository's weight files: its top-level .safetensors, without an
 *  adapter's and, when the Hugging Face layout is there too, without Mistral's
 *  consolidated copy (subfolders such as gpt-oss's original/ hold other copies). */
export function weightFileBytes(files: { name: string; size?: number }[]): number | undefined {
  const st = files.filter((f) => !f.name.includes("/") && f.name.endsWith(".safetensors") && !f.name.startsWith("adapter_model"));
  const hf = st.filter((f) => !f.name.startsWith("consolidated"));
  const use = hf.length ? hf : st;
  if (!use.length || use.some((f) => typeof f.size !== "number")) return undefined;
  return use.reduce((a, f) => a + (f.size as number), 0);
}

/** Extract the base model id from cardData.base_model or a base_model:* tag. */
function baseModelOf(d: any): string | undefined {
  const cd = d?.cardData?.base_model;
  if (typeof cd === "string" && cd.includes("/")) return cd;
  if (Array.isArray(cd) && typeof cd[0] === "string" && cd[0].includes("/")) return cd[0];
  const tag = (d?.tags ?? []).find((t: unknown) => typeof t === "string" && t.startsWith("base_model:"));
  if (typeof tag === "string") {
    const id = tag.slice("base_model:".length).replace(/^(quantized|finetune|merge|adapter|lora):/, "");
    if (id.includes("/")) return id;
  }
  return undefined;
}

export type ArchSource = "config" | "base" | "bundled" | "partial";

export type WarningKey = "gatedBundled" | "gatedUnknown" | "configFailed" | "archFromBase" | "archFromMirror";

export interface ResolvedModel {
  hfId: string;
  arch: ModelArch | null;
  /** Best-known total parameter count, even when full arch is unavailable. */
  numParams: number;
  gated: boolean;
  source: ArchSource;
  modelType?: string;
  isMoE?: boolean;
  /** Hub tags + pipeline tag — capability signals for the task-fit checker. */
  tags: string[];
  pipelineTag?: string;
  /** Effective weight precision detected from quant config / name / torch_dtype. */
  weightDtype?: Dtype;
  /** FP8 KV-cache precision, only when the model ships a kv_cache_scheme. */
  kvDtype?: Dtype;
  warningKey?: WarningKey;
  /** Raw hub metadata already fetched here — reused by the Anatomy tab to avoid
   * a second round-trip. */
  info?: HfModelInfo | null;
  /** The config.json this resolution used (the base model's for source "base"),
   * so callers can read extra fields (intermediate_size, experts, rope…). */
  cfg?: any;
  /** The public copy the config came from, for a gated model (warning "archFromMirror"). */
  mirror?: string;
}

/** Public copies of a gated repo's config: Unsloth republishes most gated Llama
 *  and Gemma repos ungated, under the same name or, for Llama 3.1, "Meta-" before it. */
export function mirrorIds(hfId: string): string[] {
  const [org, name] = hfId.split("/");
  if (!org || !name || org.toLowerCase() === "unsloth") return [];
  const out = [`unsloth/${name}`];
  if (/^Llama-3\.1-/i.test(name)) out.push(`unsloth/Meta-${name}`);
  return out;
}

/** The stand-in the pages size a model on when nothing about it could be read: a
 *  32-layer, 4,096-wide decoder of its parameter count. Marked, so its figures are
 *  never shown as the model's own. */
export function placeholderArch(numParams: number): ModelArch {
  return { numParams: numParams || 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, placeholder: true };
}

/** Rough parameter count parsed from a repo id, e.g. "...-35B-A3B" → 35e9.
 * Used only as a fallback when the API has no safetensors size (e.g. GGUF repos).
 * Takes the largest "<n>B" token so "8x7B" / "30B-A3B" lean toward total size. */
export function paramsFromName(id: string): number {
  let max = 0;
  for (const m of id.matchAll(/(\d+(?:\.\d+)?)\s*b\b/gi)) {
    max = Math.max(max, parseFloat(m[1]));
  }
  if (max > 0) return max * 1e9;
  // Smaller models say millions: facebook/opt-125m read as no size at all, and
  // with no safetensors count to fall back on its config was never used.
  for (const m of id.matchAll(/(\d+(?:\.\d+)?)\s*m\b/gi)) {
    max = Math.max(max, parseFloat(m[1]));
  }
  return max > 0 ? max * 1e6 : 0;
}

/** Autocomplete search ranked by downloads.
 * Note: we deliberately do NOT filter by `text-generation` — many popular
 * quantized/derivative repos (e.g. RedHatAI FP8/NVFP4) omit that pipeline tag,
 * and filtering would hide them. Non-LLM hits still resolve gracefully. */
export async function searchModels(query: string, limit = 15): Promise<HfSearchResult[]> {
  if (!query.trim()) return [];
  const url = `${HF}/api/models?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=${limit}`;
  const res = await fetchWithTimeout(url, 5000);
  if (!res.ok) throw new Error(`HF search failed: ${res.status}`);
  return (await res.json()) as HfSearchResult[];
}

/** Fetch model metadata (param count + gated flag) — works even for gated models. */
export async function fetchModelInfo(hfId: string): Promise<HfModelInfo> {
  // blobs=true adds each file's size, which sizes a quantized checkpoint exactly.
  const res = await fetchWithTimeout(`${HF}/api/models/${hfId}?blobs=true`, 8000);
  if (!res.ok) throw new Error(`Model not found: ${res.status}`);
  const d = await res.json();
  // GGUF repos expose params under `gguf.total` instead of `safetensors.total`.
  const params = d?.safetensors?.total ?? d?.gguf?.total ?? null;
  const dtypeParams: Record<string, number> | undefined = d?.safetensors?.parameters;
  let paramDtype: string | undefined;
  if (dtypeParams) {
    paramDtype = Object.entries(dtypeParams).sort((a, b) => b[1] - a[1])[0]?.[0];
  }
  return {
    id: d?.id ?? hfId,
    gated: Boolean(d?.gated) && d?.gated !== false,
    numParams: typeof params === "number" ? params : null,
    modelType: d?.config?.model_type,
    paramDtype,
    dtypeParams,
    tags: Array.isArray(d?.tags) ? d.tags : [],
    pipelineTag: d?.pipeline_tag,
    baseModel: baseModelOf(d),
    downloads: typeof d?.downloads === "number" ? d.downloads : undefined,
    likes: typeof d?.likes === "number" ? d.likes : undefined,
    license: d?.cardData?.license,
    createdAt: d?.createdAt,
    lastModified: d?.lastModified,
    usedStorage: typeof d?.usedStorage === "number" ? d.usedStorage : undefined,
    files: Array.isArray(d?.siblings) ? d.siblings.map((x: any) => String(x.rfilename)) : undefined,
    weightFileBytes: Array.isArray(d?.siblings)
      ? weightFileBytes(d.siblings.map((x: any) => ({ name: String(x.rfilename), size: x.size })))
      : undefined,
  };
}

/** Model types whose Transformers config ties the embedding and the output head
 *  when the config does not say. */
const TIED_BY_DEFAULT = new Set(["gemma", "gemma2", "gemma3", "gemma3_text", "gpt2", "falcon"]);

/** The feed-forward width. Gemma 3n lists one per layer, which made the overhead
 *  NaN; the widest sets the activation peak (overhead.ts). */
function ffnWidth(c: any): number | undefined {
  const w = c.intermediate_size ?? c.ffn_dim ?? c.n_inner;
  if (typeof w === "number" && w > 0) return w;
  if (Array.isArray(w)) {
    const max = Math.max(...w.filter((x: unknown): x is number => typeof x === "number"));
    return max > 0 ? max : undefined;
  }
  return undefined;
}

/** Pull various config key spellings into our normalized arch shape. Exported for
 *  scripts/test-moe.ts. */
export function archFromConfig(cfg: any, numParams: number): ModelArch | null {
  // Multimodal models nest the LLM dims (text_config, llm_config, Qwen-Omni's
  // thinker_config, DeepSeek-VL2's language_config), some leaving their defaults out.
  const c = textConfig(cfg);
  // Bloom spells the width n_embed, MPT the depth n_layers and the heads n_heads.
  const numLayers = c.num_hidden_layers ?? c.n_layer ?? c.num_layers ?? c.n_layers;
  const hiddenSize = c.hidden_size ?? c.n_embd ?? c.n_embed ?? c.d_model;
  const numAttentionHeads = c.num_attention_heads ?? c.n_head ?? c.num_heads ?? c.n_heads;
  if (!numLayers || !hiddenSize || !numAttentionHeads) return null;
  // Every spelling vLLM reads (model_arch_config_convertor.py): Falcon's n_head_kv
  // and multi_query, ChatGLM's multi_query_group_num, Step's num_attention_groups.
  // Falling back to every head made Falcon-7B's cache 71x and GLM-4-9B's 16x too large.
  const nas = nasAttention(c, numLayers);
  // MiMo-V2's sliding layers hold most of its cache, so their shape stands for all (layers.ts).
  const mimo = mimoAttention(c, numLayers);
  const numKeyValueHeads = mimo?.kvHeads ??
    c.num_key_value_heads ?? c.num_kv_heads ?? c.n_head_kv ??
    (c.multi_query_attention !== false ? c.multi_query_group_num : undefined) ??
    c.num_attention_groups ?? (c.multi_query === true ? 1 : undefined) ?? nas?.kvHeads ?? numAttentionHeads;
  const arch: ModelArch = {
    numParams,
    numLayers,
    hiddenSize,
    intermediateSize: ffnWidth(c) ?? nas?.ffn,
    numAttentionHeads,
    numKeyValueHeads,
    headDim: mimo?.headDim ?? c.head_dim,
    // Multi-head latent attention. Both are needed before the KV formula
    // switches, so a config carrying only one is left on the ordinary path.
    kvLoraRank: c.kv_lora_rank,
    qkRopeHeadDim: c.qk_rope_head_dim,
    vocabSize: c.vocab_size,
    // The keys vLLM's _get_and_verify_max_len reads, in its order (Kimi-Linear has
    // only model_max_length).
    maxContext: c.max_position_embeddings ?? c.n_positions ?? c.max_seq_len ?? c.seq_length ?? c.model_max_length ??
      c.max_sequence_length ?? c.max_seq_length ?? c.seq_len,
  };
  // Values narrower than keys (MiMo-V2: 192 and 128). An MLA config's v_head_dim
  // is its attention output, not a cache width.
  const vHeadDim = mimo ? mimo.vHeadDim : c.kv_lora_rank ? undefined : c.v_head_dim;
  if (typeof vHeadDim === "number" && vHeadDim > 0 && vHeadDim !== (arch.headDim ?? Math.floor(hiddenSize / numAttentionHeads))) arch.vHeadDim = vHeadDim;
  // mllama's cross-attention layers keep one image's keys and values.
  const cross = crossAttention(cfg, numLayers);
  if (cross) arch.crossAttn = cross;
  const experts = expertCount(c);
  const perTok = expertsPerToken(c);
  if (experts && experts > 1 && perTok) [arch.numExperts, arch.expertsPerToken] = [experts, perTok];
  const moeWidth = expertWidth(c);
  if (arch.numExperts && typeof moeWidth === "number") arch.moeIntermediateSize = moeWidth;
  // An absent flag takes the family's default in Transformers: tied for Gemma, GPT-2
  // and Falcon, untied for the rest (Llama, Qwen, Mistral…). Reading every absent
  // flag as untied put Gemma 2 9B's INT4 estimate 21% high.
  arch.tieEmbeddings = (c.tie_word_embeddings ?? cfg?.tie_word_embeddings ?? TIED_BY_DEFAULT.has(String(c.model_type ?? cfg?.model_type ?? ""))) === true;
  // DeepSeek V4 keeps most of its context compressed 4x or 128x (calc.ts).
  const compressed = compressedLayers(c);
  if (compressed) arch.compressedAttn = compressed;
  // DeepSeek Sparse Attention keeps an indexer key per token beside MLA's latent (calc.ts).
  const sparse = sparseIndexer(c);
  if (sparse) arch.sparseAttn = sparse;
  // Decode speed reads the ACTIVE parameters (perf.ts), and the weights leave the
  // speculative-decoding layers out (calc.ts).
  countParams(arch, c);
  // What the sizing does not follow yet, said beside the figures.
  const unmodelled = unmodelledCacheKeys(c);
  if (unmodelled.length) arch.unmodelled = unmodelled;
  const refused = vllmRefuses(cfg);
  if (refused) arch.notInVllm = refused;
  // The vision encoder vLLM profiles before the language model (overhead.ts).
  const vision = visionEncoder(cfg);
  if (vision) arch.vision = vision;
  // MXFP4 (gpt-oss) quantizes the routed experts only; vLLM pads them to its kernel's tile (calc.ts, mxfp4Pad).
  const q = cfg?.quantization_config ?? c.quantization_config;
  if (arch.numExperts && String(q?.quant_method ?? "").toLowerCase() === "mxfp4") arch.mxfp4 = true;
  // Sliding windows and hybrid layers cache less than every layer at full context.
  const plan = compressed ? undefined : layerPlan(c);
  if (plan) {
    if (plan.attention !== numLayers) arch.attnLayers = plan.attention;
    if (plan.sliding && plan.window) [arch.slidingLayers, arch.slidingWindow] = [plan.sliding, plan.window];
    if (plan.stateBytesPerSeq) [arch.stateBytesPerSeq, arch.stateLayers] = [plan.stateBytesPerSeq, plan.stateLayers];
    if (plan.globalAttn) arch.globalAttn = plan.globalAttn;
  }
  return arch;
}

/** A multimodal model's vision encoder as vLLM profiles it: the patches of the
 *  largest image it takes, the tokens they become, and its width. Qwen-VL reads any
 *  resolution; vLLM's default ceiling is 16,384 tokens of 2×2-merged patches
 *  (max_pixels 12,845,056 at patch 14, 16,777,216 at 16). Gemma 4 pools 3×3 patches
 *  into each of its soft tokens; SigLIP, CLIP and Pixtral towers see a fixed size. */
export function visionEncoder(cfg: any): ModelArch["vision"] | undefined {
  const vc = cfg?.vision_config;
  if (!vc || typeof vc !== "object") return undefined;
  const hidden = vc.hidden_size ?? vc.embed_dim ?? vc.width;
  if (!(hidden > 0)) return undefined;
  const merge = vc.spatial_merge_size ?? cfg.spatial_merge_size;
  if (vc.temporal_patch_size && merge > 0) return { patches: 16384 * merge * merge, tokens: 16384, hidden };
  const soft = cfg.vision_soft_tokens_per_image ?? vc.default_output_length;
  if (soft > 0 && vc.pooling_kernel_size > 0) return { patches: soft * vc.pooling_kernel_size ** 2, tokens: soft, hidden };
  const size = Array.isArray(vc.image_size) ? vc.image_size[0] : vc.image_size;
  const patch = vc.patch_size;
  if (!(size > 0) || !(patch > 0)) return undefined;
  const patches = Math.floor(size / patch) ** 2;
  const shuffle = vc.pixel_shuffle_ratio;
  const tokens = cfg.mm_tokens_per_image ?? (merge > 0 ? patches / (merge * merge) : shuffle > 0 ? patches * shuffle * shuffle : patches);
  return tokens > 0 ? { patches, tokens: Math.max(1, Math.round(tokens)), hidden } : undefined;
}

/** The parameter counts read from a config beyond the total: the ACTIVE ones a
 *  token passes through, those in layers only speculative decoding runs, and those
 *  in lookup tables (moe.ts). Called again once a packed checkpoint's total is
 *  known: from the 5.3B elements a Qwen3-Coder AWQ repo reports, its active count
 *  came out 1.76B where 3.3B is right. */
export function countParams(arch: ModelArch, c: any): void {
  const set = (k: "activeParams" | "specParams" | "lookupParams", v: number | undefined) => {
    if (v && v > 0) arch[k] = v;
    else delete arch[k];
  };
  set("activeParams", activeParamsOf(arch, c));
  set("specParams", specParamsOf(arch, c));
  set("lookupParams", lookupParams(textConfig(c)));
}

/** JSON as Python writes it: NVIDIA's Nemotron-H configs carry a bare `Infinity`
 *  (`time_step_limit`), which JSON.parse rejects, so the whole config was lost. A
 *  bare Infinity or NaN outside a string becomes a number or null. */
export function parseConfigJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(
      text
        .replace(/([:[,]\s*)(-?)Infinity(?=\s*[,\]}])/g, (_m, pre: string, sign: string) => `${pre}${sign}1e308`)
        .replace(/([:[,]\s*)NaN(?=\s*[,\]}])/g, (_m, pre: string) => `${pre}null`),
    );
  }
}

/** Try to read config.json directly (public models). Returns null if gated/missing.
 *  A dropped request, a timeout or a rate limit (429, 5xx) gets one more try: left
 *  alone it put the page on a placeholder architecture, and DeepSeek-V4-Flash came
 *  out as a 32-layer model needing 541 GiB. 401, 403 and 404 (gated or missing) do
 *  not change on a retry. */
async function fetchConfig(hfId: string): Promise<any | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(`${HF}/${hfId}/resolve/main/config.json`, 8000);
      if (res.ok) return parseConfigJson(await res.text());
      if (res.status !== 429 && res.status < 500) return null;
    } catch {
      // a timeout or a network error: try once more
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

/** Detect a Mixture-of-Experts model from config, even when model_type has no
 * "moe" substring (e.g. gpt_oss, deepseek_v3, qwen3_moe use expert-count keys). */
function isMoEFromConfig(cfg: any): boolean {
  const c = textConfig(cfg);
  return (expertCount(c) ?? 0) > 1;
}

/** Map a config.json `quantization_config` to our weight-dtype buckets. */
function dtypeFromQuantConfig(q: any): Dtype | null {
  if (!q) return null;
  const m = String(q.quant_method ?? q.quant_algo ?? "").toLowerCase();
  const bits = q.bits ?? q.w_bit ?? q.weight_bits;
  if (m === "awq" || m === "gptq" || m === "gptqmodel") return bits === 8 ? "int8" : "int4";
  if (m.includes("bitsandbytes") || m === "bnb") return q.load_in_8bit ? "int8" : "int4";
  // 4-bit float families (MXFP4 in gpt-oss, NVFP4 in TensorRT/RedHat repos).
  if (m.includes("fp4")) return "int4";
  // compressed-tensors, and ModelOpt's MIXED_PRECISION: every group. The narrowest
  // format holds the bulk — nvidia's Qwen3.6-35B-A3B-NVFP4 keeps attention in FP8
  // (group_0) and its experts in NVFP4, and read by its first group it came out FP8.
  const groups = q.config_groups;
  if (groups && typeof groups === "object") {
    let pick: Dtype | null = null;
    let fewest = Infinity;
    for (const g of Object.values(groups) as any[]) {
      const w = g?.weights;
      if (typeof w?.num_bits !== "number" || w.num_bits >= fewest) continue;
      const d: Dtype | null = w.num_bits <= 4 ? "int4" : w.num_bits === 8 ? (String(w.type ?? "").toLowerCase() === "float" ? "fp8" : "int8") : null;
      if (d) [pick, fewest] = [d, w.num_bits];
    }
    if (pick) return pick;
  }
  if (m.includes("fp8")) return "fp8";
  if (bits === 8) return "int8";
  if (bits === 4 || bits === 3) return "int4";
  return null;
}

/** Detect quantization from the repo id (GGUF / name-tagged repos). */
function dtypeFromName(id: string): Dtype | null {
  const s = id.toLowerCase();
  if (/fp8/.test(s)) return "fp8";
  if (/(nvfp4|mxfp4|fp4|w4a16|awq|gptq|[-_.]int4|4[-_.]?bit|gguf|q4|q3|q2)/.test(s)) return "int4";
  if (/(w8a8|w8a16|[-_.]int8|8[-_.]?bit|q8)/.test(s)) return "int8";
  return null;
}

/** Effective weight precision to preselect in the sizing controls. Priority:
 * quantization_config → repo-id tag → torch_dtype → safetensors dtype. */
function detectWeightDtype(id: string, cfg: any, paramDtype?: string): Dtype | undefined {
  // A GGUF repo ships its base model's config, FP8 quantization block and all; its
  // files are the GGUF quant its name says (DeepSeek-V3-0324-GGUF came out at 671 GB).
  if (/gguf/i.test(id)) {
    const fromName = dtypeFromName(id);
    if (fromName) return fromName;
  }
  const q = cfg?.quantization_config ?? cfg?.text_config?.quantization_config;
  const fromQ = dtypeFromQuantConfig(q);
  if (fromQ) return fromQ;
  const fromName = dtypeFromName(id);
  if (fromName) return fromName;
  const td = String(cfg?.text_config?.torch_dtype ?? cfg?.torch_dtype ?? "").toLowerCase();
  if (td.includes("bfloat16")) return "bf16";
  if (td.includes("float16")) return "fp16";
  if (td.includes("float8")) return "fp8";
  if (td.includes("float32")) return "fp32";
  const pd = String(paramDtype ?? "").toLowerCase();
  if (pd.includes("bf16") || pd.includes("bfloat16")) return "bf16";
  if (pd === "f16" || pd.includes("float16") || pd === "fp16") return "fp16";
  if (pd.includes("f8") || pd.includes("fp8")) return "fp8";
  if (pd === "i8" || pd === "int8") return "int8";
  return undefined;
}

/** KV-cache precision is a serving choice, NOT a model property — so we only
 * preselect it when the model explicitly ships an FP8 KV-cache calibration
 * (`quantization_config.kv_cache_scheme`). Otherwise it stays the user's default. */
function detectKvDtype(cfg: any, hfQuant?: any): Dtype | undefined {
  // vLLM's own default under --kv-cache-dtype auto (torch_utils.py): a ModelOpt
  // checkpoint's kv_cache_quant_algo FP8 (config.json or hf_quant_config.json)
  // turns the cache to FP8. A compressed-tensors kv_cache_scheme does not: the
  // cache stays in the model's dtype unless fp8 is asked for.
  const q = cfg?.quantization_config ?? cfg?.text_config?.quantization_config;
  const algo = q?.kv_cache_quant_algo ?? hfQuant?.quantization?.kv_cache_quant_algo ?? hfQuant?.kv_cache_quant_algo;
  if (typeof algo === "string" && /fp8/i.test(algo)) return "fp8";
  return undefined;
}

/** ModelOpt keeps its quantization settings in hf_quant_config.json beside config.json. */
async function fetchHfQuantConfig(hfId: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(`${HF}/${hfId}/resolve/main/hf_quant_config.json`, 8000);
    return res.ok ? parseConfigJson(await res.text()) : null;
  } catch {
    return null;
  }
}

/** A checkpoint that ships quantized is sized by its own files, which hold the
 *  scales and the layers left in 16-bit that a per-parameter estimate misses: a
 *  third of Qwen2.5-7B-Instruct-AWQ's 5.2 GiB. For packed 4-bit formats the Hub's
 *  count is of stored elements, not parameters — 40.6 billion for an NVFP4 Llama
 *  3.3 70B — so when the files hold more than 0.8 bytes per counted parameter, a
 *  4-bit checkpoint takes its parameter count from its base model. */
async function sizeShipped(arch: ModelArch, info: HfModelInfo | null, dtype: Dtype | undefined): Promise<void> {
  const bytes = info?.weightFileBytes;
  if (!bytes || (dtype !== "int4" && dtype !== "int8" && dtype !== "fp8")) return;
  arch.shipped = { dtype, bytes };
  if (dtype === "int4" && arch.numParams > 0 && bytes / arch.numParams > 0.8) {
    const base = info?.baseModel ? await fetchModelInfo(info.baseModel).catch(() => null) : null;
    if (base?.numParams && base.numParams > arch.numParams) arch.numParams = base.numParams;
    else {
      // No base model to ask (RedHatAI's Llama-3.3-70B NVFP4 names one that does not
      // exist): unpack the stored elements instead.
      const unpacked = unpackedParams(info?.dtypeParams);
      if (unpacked && unpacked > arch.numParams) arch.numParams = unpacked;
    }
  }
}

/** Parameters an FP4 checkpoint holds, from the elements it stores: two FP4 values
 *  to a byte (U8), plus the 16- and 32-bit tensors kept whole. Its block scales are
 *  F8 beside them and are left out: RedHatAI's Llama-3.3-70B NVFP4 stores 34.2B U8,
 *  2.1B BF16 and 4.3B F8 scales, 70.55B parameters. The Hub's count of 4-bit
 *  integers packed in I32 does not add up the same way across repos, so it is not
 *  unpacked. undefined when there is no U8. */
export function unpackedParams(dtypeParams: Record<string, number> | undefined): number | undefined {
  const u8 = dtypeParams?.U8;
  if (!u8 || u8 <= 0) return undefined;
  let n = u8 * 2;
  for (const [k, v] of Object.entries(dtypeParams!)) if (/^(BF16|F16|F32)$/.test(k) && typeof v === "number") n += v;
  return n;
}

/**
 * Full resolution pipeline:
 *  1. metadata (param count, gated) — always works
 *  2. live config.json for architecture — works for public models
 *  3. bundled DB fallback — covers popular gated models
 */
export async function resolveModel(hfId: string): Promise<ResolvedModel> {
  const known = findKnownByHfId(hfId);
  const [info, cfg] = await Promise.all([
    fetchModelInfo(hfId).catch(() => null),
    fetchConfig(hfId),
  ]);

  const gated = info?.gated ?? Boolean(known?.gated);
  const numParams =
    info?.numParams ?? known?.numParams ?? paramsFromName(hfId) ?? 0;
  const tags = info?.tags ?? [];
  const pipelineTag = info?.pipelineTag;
  const weightDtype = detectWeightDtype(hfId, cfg, info?.paramDtype);
  const hfQuant = info?.files?.includes("hf_quant_config.json") ? await fetchHfQuantConfig(hfId) : null;
  const kvDtype = detectKvDtype(cfg, hfQuant);

  if (cfg) {
    const arch = archFromConfig(cfg, numParams || known?.numParams || 0);
    if (arch && arch.numParams > 0) {
      const counted = arch.numParams;
      await sizeShipped(arch, info, weightDtype);
      // A packed checkpoint's total was corrected: count the rest from it.
      if (arch.numParams !== counted) countParams(arch, textConfig(cfg));
      // A preset's active count comes from its model card; prefer it to the estimate.
      if (known?.activeParams) arch.activeParams = known.activeParams;
      const modelType = textConfig(cfg)?.model_type ?? cfg.model_type ?? info?.modelType;
      return {
        hfId,
        arch,
        numParams: arch.numParams,
        gated,
        source: "config",
        modelType,
        isMoE: (modelType ?? "").includes("moe") || isMoEFromConfig(cfg) || known?.isMoE,
        tags,
        pipelineTag,
        weightDtype,
        kvDtype,
        info,
        cfg,
      };
    }
  }

  // GGUF / quantized repos have no own config — borrow the base model's
  // architecture (params still come from this repo's gguf/safetensors size).
  if (info?.baseModel && info.baseModel.toLowerCase() !== hfId.toLowerCase()) {
    const baseCfg = await fetchConfig(info.baseModel);
    if (baseCfg) {
      const arch = archFromConfig(baseCfg, numParams || 0);
      if (arch && arch.numParams > 0) {
        const knownBase = findKnownByHfId(info.baseModel);
        if (knownBase?.activeParams && arch.activeParams) arch.activeParams = knownBase.activeParams;
        const modelType = textConfig(baseCfg)?.model_type ?? baseCfg.model_type ?? info?.modelType;
        return {
          hfId,
          arch,
          numParams: arch.numParams,
          gated,
          source: "base",
          modelType,
          isMoE: (modelType ?? "").includes("moe") || isMoEFromConfig(baseCfg) || known?.isMoE,
          tags,
          pipelineTag,
          weightDtype: detectWeightDtype(hfId, baseCfg, info?.paramDtype),
          kvDtype: detectKvDtype(baseCfg),
          warningKey: "archFromBase",
          info,
          cfg: baseCfg,
        };
      }
    }
  }

  if (known) {
    // Use bundled dims; prefer the live param count when we have it.
    return {
      hfId,
      arch: { ...known, numParams: numParams || known.numParams },
      numParams: numParams || known.numParams,
      gated,
      source: "bundled",
      modelType: info?.modelType ?? known.family.toLowerCase(),
      isMoE: known.isMoE,
      tags,
      pipelineTag,
      weightDtype,
      kvDtype,
      warningKey: gated ? "gatedBundled" : undefined,
      info,
      cfg,
    };
  }

  // A repo built on a gated base (bartowski's GGUFs of Llama): the base's bundled entry.
  const knownBase = info?.baseModel ? findKnownByHfId(info.baseModel) : undefined;
  if (knownBase) {
    return {
      hfId,
      arch: { ...knownBase, numParams: numParams || knownBase.numParams },
      numParams: numParams || knownBase.numParams,
      gated,
      source: "bundled",
      modelType: info?.modelType ?? knownBase.family.toLowerCase(),
      isMoE: knownBase.isMoE,
      tags,
      pipelineTag,
      weightDtype,
      kvDtype,
      warningKey: "archFromBase",
      info,
      cfg,
    };
  }

  // Still nothing: the config as Unsloth republishes it, ungated (decision K15 of
  // the 2026-10-15 audit: a public mirror's config.json is read, nothing else).
  // Gemma 3, Llama 3.1 70B, Llama 4 and Gemma 3n had been sized on a 32-layer
  // placeholder: Gemma 3 1B's cache 17x too large, Llama 3.1 70B's 2.5x too small.
  // Only for a gated repo, or for the base model a repo names when its own config
  // could not be read: a public repo's failure is not the gate, and a repo of the
  // same name under unsloth/ need not be the same model.
  for (const id of [...(gated ? mirrorIds(hfId) : []), ...(info?.baseModel ? mirrorIds(info.baseModel) : [])]) {
    const mirrorCfg = await fetchConfig(id);
    const arch = mirrorCfg ? archFromConfig(mirrorCfg, numParams || 0) : null;
    if (!arch || !(arch.numParams > 0)) continue;
    const modelType = textConfig(mirrorCfg)?.model_type ?? mirrorCfg.model_type ?? info?.modelType;
    return {
      hfId,
      arch,
      numParams: arch.numParams,
      gated,
      source: "base",
      modelType,
      isMoE: (modelType ?? "").includes("moe") || isMoEFromConfig(mirrorCfg),
      tags,
      pipelineTag,
      weightDtype: detectWeightDtype(hfId, mirrorCfg, info?.paramDtype),
      kvDtype: detectKvDtype(mirrorCfg),
      warningKey: "archFromMirror",
      mirror: id,
      info,
      cfg: mirrorCfg,
    };
  }

  return {
    hfId,
    arch: null,
    numParams,
    gated,
    source: "partial",
    modelType: info?.modelType,
    tags,
    pipelineTag,
    weightDtype,
    kvDtype,
    warningKey: gated ? "gatedUnknown" : "configFailed",
    info,
    cfg,
  };
}
