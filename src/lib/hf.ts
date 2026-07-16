// Hugging Face Hub integration — runs entirely client-side.
// CORS is fully supported by HF (the API reflects the Origin header), so no
// proxy is needed. Gated models (Llama, Gemma, some Mistral) return 401 on
// config.json from the browser; for those we fall back to the bundled arch DB.

import type { Dtype, ModelArch } from "./calc";
import { findKnownByHfId } from "./models.ts";

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

export type WarningKey = "gatedBundled" | "gatedUnknown" | "configFailed" | "archFromBase";

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
}

/** Rough parameter count parsed from a repo id, e.g. "...-35B-A3B" → 35e9.
 * Used only as a fallback when the API has no safetensors size (e.g. GGUF repos).
 * Takes the largest "<n>B" token so "8x7B" / "30B-A3B" lean toward total size. */
export function paramsFromName(id: string): number {
  let max = 0;
  for (const m of id.matchAll(/(\d+(?:\.\d+)?)\s*b\b/gi)) {
    max = Math.max(max, parseFloat(m[1]));
  }
  return max > 0 ? max * 1e9 : 0;
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
  const res = await fetchWithTimeout(`${HF}/api/models/${hfId}`, 8000);
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
  };
}

/** Pull various config key spellings into our normalized arch shape. */
function archFromConfig(cfg: any, numParams: number): ModelArch | null {
  // Multimodal models nest the LLM dims under text_config / llm_config.
  const c = cfg?.text_config ?? cfg?.llm_config ?? cfg;
  const numLayers = c.num_hidden_layers ?? c.n_layer ?? c.num_layers;
  const hiddenSize = c.hidden_size ?? c.n_embd ?? c.d_model;
  const numAttentionHeads = c.num_attention_heads ?? c.n_head ?? c.num_heads;
  if (!numLayers || !hiddenSize || !numAttentionHeads) return null;
  const numKeyValueHeads = c.num_key_value_heads ?? c.num_kv_heads ?? numAttentionHeads;
  return {
    numParams,
    numLayers,
    hiddenSize,
    numAttentionHeads,
    numKeyValueHeads,
    headDim: c.head_dim,
    vocabSize: c.vocab_size,
    maxContext: c.max_position_embeddings ?? c.n_positions ?? c.max_seq_len,
  };
}

/** Try to read config.json directly (public models). Returns null if gated/missing. */
async function fetchConfig(hfId: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(`${HF}/${hfId}/resolve/main/config.json`, 8000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Detect a Mixture-of-Experts model from config, even when model_type has no
 * "moe" substring (e.g. gpt_oss, deepseek_v3, qwen3_moe use expert-count keys). */
function isMoEFromConfig(cfg: any): boolean {
  const c = cfg?.text_config ?? cfg?.llm_config ?? cfg;
  const experts =
    c?.num_local_experts ?? c?.num_experts ?? c?.n_routed_experts ?? c?.moe_num_experts;
  return typeof experts === "number" && experts > 1;
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
  // compressed-tensors: inspect the first group's weight quant
  const groups = q.config_groups;
  if (groups) {
    const g: any = groups.group_0 ?? Object.values(groups)[0];
    const w = g?.weights;
    if (w?.num_bits) {
      if (String(w.type ?? "").toLowerCase() === "float" && w.num_bits === 8) return "fp8";
      if (w.num_bits === 8) return "int8";
      if (w.num_bits <= 4) return "int4";
    }
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
function detectKvDtype(cfg: any): Dtype | undefined {
  const kv = (cfg?.quantization_config ?? cfg?.text_config?.quantization_config)?.kv_cache_scheme;
  if (kv && typeof kv === "object" && (kv.num_bits === 8 || kv.num_bits === 4)) return "fp8";
  return undefined;
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
  const kvDtype = detectKvDtype(cfg);

  if (cfg) {
    const arch = archFromConfig(cfg, numParams || known?.numParams || 0);
    if (arch && arch.numParams > 0) {
      const modelType = cfg.text_config?.model_type ?? cfg.model_type ?? info?.modelType;
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
        const modelType = baseCfg.text_config?.model_type ?? baseCfg.model_type ?? info?.modelType;
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
