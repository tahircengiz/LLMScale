// "Model Anatomy" engine — turns HF API + config data into the numbers the
// visual tab renders. Pure helpers (computeParamDist / classifyDtype) are
// dependency-free and unit-tested; fetchAnatomy plumbs the live data in.

import { resolveHeadDim, type Dtype, type ModelArch } from "./calc.ts";
import { resolveModel } from "./hf.ts";

const HF = "https://huggingface.co";

// ---- parameter distribution ----------------------------------------------

export interface ParamDist {
  embeddings: number;
  attention: number;
  /** Feed-forward (dense MLP) or all MoE experts — the remainder of the budget. */
  ffn: number;
  ffnLabel: "mlp" | "experts";
  /** For MoE: params actually active per token (≈ experts × perTok/total). */
  ffnActive?: number;
  total: number;
}

export interface ParamDistInput {
  numParams: number;
  numLayers: number;
  hidden: number;
  attnHeads: number;
  kvHeads: number;
  headDim: number;
  vocab?: number;
  tieEmbeddings?: boolean;
  isMoE?: boolean;
  numExperts?: number;
  expertsPerTok?: number;
}

/**
 * Split the total parameter budget into embeddings / attention / feed-forward.
 * Embeddings and attention are computed from the config (reliable, closed-form);
 * the feed-forward (or MoE expert) block is taken as the remainder so the three
 * always sum to the true total — this is accurate because the FFN/experts ARE
 * whatever is left after the (exactly known) embedding + attention matrices.
 */
export function computeParamDist(a: ParamDistInput): ParamDist {
  const embedRaw = a.vocab ? a.vocab * a.hidden * (a.tieEmbeddings ? 1 : 2) : 0;
  // q_proj + o_proj = 2·H·(Ah·hd); k_proj + v_proj = 2·H·(Kh·hd)
  const attnRaw = 2 * a.numLayers * a.hidden * a.headDim * (a.attnHeads + a.kvHeads);

  const embeddings = Math.max(0, Math.min(embedRaw, a.numParams));
  const attention = Math.max(0, Math.min(attnRaw, a.numParams - embeddings));
  const ffn = Math.max(0, a.numParams - embeddings - attention);
  const ffnLabel: "mlp" | "experts" = a.isMoE ? "experts" : "mlp";
  const ffnActive =
    a.isMoE && a.numExperts && a.expertsPerTok && a.numExperts > 0
      ? ffn * (a.expertsPerTok / a.numExperts)
      : undefined;

  return { embeddings, attention, ffn, ffnLabel, ffnActive, total: a.numParams };
}

// ---- dtype composition ----------------------------------------------------

export type DtypeTier = "full" | "half" | "fp8" | "int8" | "int4" | "other";

export interface DtypePart {
  dtype: string;
  count: number;
  tier: DtypeTier;
}

/** Map a safetensors dtype name to a precision tier for colouring / labelling. */
export function classifyDtype(dtype: string): DtypeTier {
  const d = dtype.toUpperCase();
  if (d === "F32" || d === "F64") return "full";
  if (d === "F16" || d === "BF16") return "half";
  if (d.startsWith("F8")) return "fp8";
  if (d === "I8") return "int8";
  // U8 shows up as the packed 4-bit weight tensor in MXFP4/NVFP4/AWQ repos.
  if (d === "U8" || d === "I4" || d === "U4") return "int4";
  return "other"; // I32/I16 scales, BOOL masks, etc.
}

/** Turn safetensors.parameters (dtype→element-count) into sorted parts. */
export function dtypePartsOf(parameters: Record<string, number> | undefined): DtypePart[] {
  if (!parameters) return [];
  return Object.entries(parameters)
    .filter(([, n]) => n > 0)
    .map(([dtype, count]) => ({ dtype, count, tier: classifyDtype(dtype) }))
    .sort((a, b) => b.count - a.count);
}

// ---- full anatomy ---------------------------------------------------------

export interface Anatomy {
  hfId: string;
  arch: ModelArch;
  numParams: number;
  headDim: number;
  weightDtype?: Dtype;
  isMoE: boolean;
  gated: boolean;
  source: string;

  // architecture extras (from config; may be missing for gated models)
  intermediateSize?: number;
  numExperts?: number;
  expertsPerTok?: number;
  tieEmbeddings?: boolean;
  ropeTheta?: number;
  slidingWindow?: number;

  // hub metadata
  downloads?: number;
  likes?: number;
  license?: string;
  createdAt?: string;
  lastModified?: string;
  usedStorage?: number;
  baseModel?: string;
  pipelineTag?: string;

  dtypeParts: DtypePart[];
  paramDist: ParamDist;
}

function baseModelOf(d: any): string | undefined {
  const cd = d?.cardData?.base_model;
  if (typeof cd === "string" && cd.includes("/")) return cd;
  if (Array.isArray(cd) && typeof cd[0] === "string" && cd[0].includes("/")) return cd[0];
  return undefined;
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Resolve the full anatomy for a model id (arch via resolveModel + rich extras). */
export async function fetchAnatomy(hfId: string): Promise<Anatomy> {
  const [r, info, cfg] = await Promise.all([
    resolveModel(hfId),
    fetchJson(`${HF}/api/models/${hfId}`),
    fetchJson(`${HF}/${hfId}/resolve/main/config.json`),
  ]);

  const arch: ModelArch =
    r.arch ?? { numParams: r.numParams || 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8 };
  const numParams = arch.numParams || r.numParams || 0;
  const headDim = resolveHeadDim(arch);
  const c = cfg?.text_config ?? cfg?.llm_config ?? cfg ?? {};

  const numExperts = c.num_local_experts ?? c.num_experts ?? c.n_routed_experts ?? undefined;
  const expertsPerTok = c.num_experts_per_tok ?? undefined;

  const paramDist = computeParamDist({
    numParams,
    numLayers: arch.numLayers,
    hidden: arch.hiddenSize,
    attnHeads: arch.numAttentionHeads,
    kvHeads: arch.numKeyValueHeads,
    headDim,
    vocab: arch.vocabSize ?? c.vocab_size,
    tieEmbeddings: c.tie_word_embeddings,
    isMoE: r.isMoE,
    numExperts,
    expertsPerTok,
  });

  return {
    hfId,
    arch,
    numParams,
    headDim,
    weightDtype: r.weightDtype,
    isMoE: Boolean(r.isMoE),
    gated: r.gated,
    source: r.source,
    intermediateSize: c.intermediate_size,
    numExperts,
    expertsPerTok,
    tieEmbeddings: c.tie_word_embeddings,
    ropeTheta: c.rope_theta,
    slidingWindow: c.sliding_window,
    downloads: info?.downloads,
    likes: info?.likes,
    license: info?.cardData?.license,
    createdAt: info?.createdAt,
    lastModified: info?.lastModified,
    usedStorage: info?.usedStorage,
    baseModel: baseModelOf(info),
    pipelineTag: info?.pipeline_tag ?? r.pipelineTag,
    dtypeParts: dtypePartsOf(info?.safetensors?.parameters),
    paramDist,
  };
}
