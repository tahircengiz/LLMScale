// "Model Anatomy" engine — turns HF API + config data into the numbers the
// visual tab renders. Pure helpers (computeParamDist / classifyDtype) are
// dependency-free and unit-tested; fetchAnatomy plumbs the live data in.

import { resolveHeadDim, type Dtype, type ModelArch } from "./calc.ts";
import { resolveModel, type WarningKey } from "./hf.ts";
import { expertCount, expertsPerToken } from "./moe.ts";

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
  // Packed 4-bit weights: U8 for MXFP4/NVFP4 (gpt-oss), I32 for AWQ/GPTQ
  // (the `qweight` tensor packs 8×int4 into each int32).
  if (d === "U8" || d === "I4" || d === "U4" || d === "I32") return "int4";
  return "other"; // I16, BOOL masks, etc.
}

/** Map an internal weight Dtype to its precision tier (chart colouring). */
export function tierOf(dt: string): DtypeTier {
  if (dt === "fp16" || dt === "bf16") return "half";
  if (dt === "fp8") return "fp8";
  if (dt === "int8") return "int8";
  if (dt === "int4") return "int4";
  if (dt === "fp32") return "full";
  return "other";
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
  kvDtype?: Dtype;
  isMoE: boolean;
  gated: boolean;
  source: string;
  modelType?: string;
  tags?: string[];
  warningKey?: WarningKey;

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

/**
 * Resolve the full anatomy for a model id. Reuses resolveModel — which already
 * fetched api/models + config.json and now surfaces them as `info`/`cfg` — so
 * this adds no extra network round-trips. For a base-resolved (GGUF/quant) repo,
 * `cfg` is the BASE model's config, so architecture extras are still available.
 */
export async function fetchAnatomy(hfId: string): Promise<Anatomy> {
  const r = await resolveModel(hfId);
  const info = r.info ?? null;
  const cfg = r.cfg ?? null;

  const arch: ModelArch =
    r.arch ?? { numParams: r.numParams || 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8 };
  const numParams = arch.numParams || r.numParams || 0;
  const headDim = resolveHeadDim(arch);
  const c = cfg?.text_config ?? cfg?.llm_config ?? cfg ?? {};

  // The config key spellings live in moe.ts, shared with hf.ts.
  const numExperts = expertCount(c);
  const expertsPerTok = expertsPerToken(c);

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
    kvDtype: r.kvDtype,
    isMoE: Boolean(r.isMoE),
    gated: r.gated,
    source: r.source,
    modelType: r.modelType,
    tags: r.tags,
    warningKey: r.warningKey,
    intermediateSize: c.intermediate_size,
    numExperts,
    expertsPerTok,
    tieEmbeddings: c.tie_word_embeddings,
    ropeTheta: c.rope_theta,
    // Some models (e.g. Qwen2.5) declare a sliding_window but disable it via
    // use_sliding_window:false — don't advertise SWA when it isn't actually used.
    slidingWindow: c.use_sliding_window === false ? undefined : c.sliding_window,
    downloads: info?.downloads,
    likes: info?.likes,
    license: info?.license,
    createdAt: info?.createdAt,
    lastModified: info?.lastModified,
    usedStorage: info?.usedStorage,
    baseModel: info?.baseModel,
    pipelineTag: info?.pipelineTag ?? r.pipelineTag,
    dtypeParts: dtypePartsOf(info?.dtypeParams),
    paramDist,
  };
}
