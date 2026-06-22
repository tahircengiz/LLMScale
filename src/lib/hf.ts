// Hugging Face Hub integration — runs entirely client-side.
// CORS is fully supported by HF (the API reflects the Origin header), so no
// proxy is needed. Gated models (Llama, Gemma, some Mistral) return 401 on
// config.json from the browser; for those we fall back to the bundled arch DB.

import type { ModelArch } from "./calc";
import { findKnownByHfId } from "./models.ts";

const HF = "https://huggingface.co";

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
}

export type ArchSource = "config" | "bundled" | "partial";

export type WarningKey = "gatedBundled" | "gatedUnknown" | "configFailed";

export interface ResolvedModel {
  hfId: string;
  arch: ModelArch | null;
  /** Best-known total parameter count, even when full arch is unavailable. */
  numParams: number;
  gated: boolean;
  source: ArchSource;
  modelType?: string;
  isMoE?: boolean;
  warningKey?: WarningKey;
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
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HF search failed: ${res.status}`);
  return (await res.json()) as HfSearchResult[];
}

/** Fetch model metadata (param count + gated flag) — works even for gated models. */
export async function fetchModelInfo(hfId: string): Promise<HfModelInfo> {
  const res = await fetch(`${HF}/api/models/${hfId}`);
  if (!res.ok) throw new Error(`Model not found: ${res.status}`);
  const d = await res.json();
  const params = d?.safetensors?.total ?? null;
  let paramDtype: string | undefined;
  if (d?.safetensors?.parameters) {
    paramDtype = Object.entries(d.safetensors.parameters as Record<string, number>).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
  }
  return {
    id: d?.id ?? hfId,
    gated: Boolean(d?.gated) && d?.gated !== false,
    numParams: typeof params === "number" ? params : null,
    modelType: d?.config?.model_type,
    paramDtype,
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
    const res = await fetch(`${HF}/${hfId}/resolve/main/config.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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
        isMoE: (modelType ?? "").includes("moe") || known?.isMoE,
      };
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
      warningKey: gated ? "gatedBundled" : undefined,
    };
  }

  return {
    hfId,
    arch: null,
    numParams,
    gated,
    source: "partial",
    modelType: info?.modelType,
    warningKey: gated ? "gatedUnknown" : "configFailed",
  };
}
