// Transparent, rule-based "is this model right for this task?" engine.
// Pure & dependency-free so it can be unit-tested with `node scripts/test-fit.ts`.

import type { ModelArch } from "./calc";

export interface Caps {
  hfId: string;
  params: number; // total params
  contextLen: number; // 0 = unknown
  isMoE: boolean;
  generative: boolean;
  instruct: boolean;
  base: boolean;
  code: boolean;
  math: boolean;
  reasoning: boolean;
  vision: boolean;
  embedding: boolean;
  reranker: boolean;
  multilingual: boolean;
  langCount: number;
}

// Common ISO language codes that show up as HF tags.
const LANG_CODES = new Set(
  "en zh fr de es it pt ru ja ko ar hi tr nl pl vi th id uk cs ro sv fa he el da fi hu no bn ur ta ml".split(" ")
);

export function extractCaps(o: {
  hfId: string;
  arch: ModelArch | null;
  numParams: number;
  modelType?: string;
  isMoE?: boolean;
  tags?: string[];
  pipelineTag?: string;
}): Caps {
  const id = o.hfId.toLowerCase();
  const tags = (o.tags ?? []).map((t) => t.toLowerCase());
  const tagSet = new Set(tags);
  const pt = (o.pipelineTag ?? "").toLowerCase();
  const mt = (o.modelType ?? "").toLowerCase();
  const has = (...ts: string[]) => ts.some((t) => tagSet.has(t));
  const nameHas = (re: RegExp) => re.test(id);

  const embedding =
    pt === "feature-extraction" ||
    pt === "sentence-similarity" ||
    has("feature-extraction", "sentence-similarity", "sentence-transformers", "text-embeddings-inference") ||
    nameHas(/embed/);
  const reranker = pt === "text-classification" || has("reranker") || nameHas(/rerank/);
  const vision =
    pt === "image-text-to-text" ||
    pt === "image-to-text" ||
    has("multimodal", "image-text-to-text") ||
    nameHas(/[-_/](vl|vlm|vision)([-_/.]|$)/) ||
    mt.includes("vl") ||
    mt.includes("vision");
  const generative =
    !embedding &&
    !reranker &&
    (pt === "text-generation" || pt === "image-text-to-text" || has("text-generation") || (!pt && !!o.arch));

  const instruct =
    has("conversational", "chat") ||
    nameHas(/[-_/](instruct|chat|sft|dpo|rlhf)([-_/.]|$)/) ||
    nameHas(/-it$/) ||
    nameHas(/[-_/]it[-_/]/);
  const base = !instruct && nameHas(/[-_/]base([-_/.]|$)/);
  const code = has("code") || tags.some((t) => t.includes("coder")) || nameHas(/cod(e|er|eqwen)/);
  const math = has("math") || nameHas(/math/);
  const reasoning = has("reasoning") || nameHas(/(r1|qwq|reason|think|distill|deepseek-r|[-_/]o1|[-_/]o3|grpo)/);

  const langCount = tags.filter((t) => LANG_CODES.has(t)).length;
  const multilingual = has("multilingual") || langCount >= 3 || nameHas(/multiling/);

  return {
    hfId: o.hfId,
    params: o.numParams || o.arch?.numParams || 0,
    contextLen: o.arch?.maxContext ?? 0,
    isMoE: Boolean(o.isMoE) || mt.includes("moe"),
    generative,
    instruct,
    base,
    code,
    math,
    reasoning,
    vision,
    embedding,
    reranker,
    multilingual,
    langCount,
  };
}

export const TASKS = [
  "chat",
  "code",
  "rag",
  "summarize",
  "agent",
  "reasoning",
  "multilingual",
  "vision",
  "embeddings",
  "edge",
  "throughput",
] as const;
export type TaskId = (typeof TASKS)[number];

export type Status = "good" | "ok" | "bad";

export interface FitCriterion {
  labelKey: string;
  weight: number;
  score: number; // 0..1
  status: Status;
  msgKey: string;
  vars?: Record<string, string | number>;
}

export interface FitResult {
  overall: number; // 0..100
  verdict: "great" | "good" | "weak" | "poor";
  criteria: FitCriterion[];
}

function st(score: number): Status {
  return score >= 0.8 ? "good" : score >= 0.5 ? "ok" : "bad";
}
function fmtB(b: number): string {
  if (b <= 0) return "?";
  return b >= 10 ? `${Math.round(b)}B` : `${b.toFixed(1)}B`;
}
function ctxLabel(ctx: number): string {
  return ctx >= 1024 ? `${Math.round(ctx / 1024)}k` : String(ctx);
}

// ---- criterion builders ----
function sizeCrit(params: number, idealB: number, minB: number, weight: number): FitCriterion {
  const b = params / 1e9;
  const score = b >= idealB ? 1 : b >= minB ? 0.6 : b >= minB / 2 ? 0.35 : 0.2;
  return { labelKey: "fit.crit.size", weight, score, status: st(score), msgKey: "fit.msg.size", vars: { params: fmtB(b), ideal: idealB } };
}
function ctxCrit(ctx: number, idealK: number, minK: number, weight: number): FitCriterion {
  const k = ctx / 1024;
  const score = !ctx ? 0.5 : k >= idealK ? 1 : k >= minK ? 0.6 : 0.3;
  return {
    labelKey: "fit.crit.context",
    weight,
    score,
    status: st(score),
    msgKey: ctx ? "fit.msg.context" : "fit.msg.contextUnknown",
    vars: { ctx: ctxLabel(ctx), ideal: idealK },
  };
}
function instructCrit(caps: Caps, weight: number): FitCriterion {
  const score = caps.instruct ? 1 : caps.base ? 0.15 : 0.5;
  return {
    labelKey: "fit.crit.instruct",
    weight,
    score,
    status: st(score),
    msgKey: caps.instruct ? "fit.msg.instructYes" : caps.base ? "fit.msg.instructBase" : "fit.msg.instructUnknown",
  };
}
function codeCrit(caps: Caps, weight: number): FitCriterion {
  const score = caps.code ? 1 : caps.instruct ? 0.55 : 0.3;
  return { labelKey: "fit.crit.code", weight, score, status: st(score), msgKey: caps.code ? "fit.msg.codeYes" : "fit.msg.codeNo" };
}
function reasonCrit(caps: Caps, weight: number): FitCriterion {
  const b = caps.params / 1e9;
  const score = caps.reasoning || caps.math ? 1 : b >= 32 ? 0.7 : b >= 14 ? 0.55 : 0.4;
  return { labelKey: "fit.crit.reasoning", weight, score, status: st(score), msgKey: caps.reasoning || caps.math ? "fit.msg.reasonYes" : "fit.msg.reasonNo" };
}
function multiCrit(caps: Caps, weight: number): FitCriterion {
  const score = caps.multilingual ? 1 : caps.langCount >= 2 ? 0.6 : 0.3;
  return { labelKey: "fit.crit.multilingual", weight, score, status: st(score), msgKey: caps.multilingual ? "fit.msg.multiYes" : "fit.msg.multiNo" };
}
function edgeSizeCrit(caps: Caps, weight: number): FitCriterion {
  const b = caps.params / 1e9;
  const score = b <= 3 ? 1 : b <= 8 ? 0.6 : b <= 14 ? 0.3 : 0.12;
  return { labelKey: "fit.crit.size", weight, score, status: st(score), msgKey: "fit.msg.edgeSize", vars: { params: fmtB(b) } };
}
function throughputCrit(caps: Caps, weight: number): FitCriterion {
  const b = caps.params / 1e9;
  const score = caps.isMoE ? 1 : b <= 8 ? 0.8 : b <= 14 ? 0.55 : b <= 32 ? 0.35 : 0.18;
  return { labelKey: "fit.crit.efficiency", weight, score, status: st(score), msgKey: caps.isMoE ? "fit.msg.effMoE" : "fit.msg.effDense", vars: { params: fmtB(b) } };
}

/** Generative-modality gate. Returns the criterion and whether it's a hard mismatch. */
function genGate(caps: Caps, weight: number): { crit: FitCriterion; mismatch: boolean } {
  if (caps.embedding) return { crit: { labelKey: "fit.crit.modality", weight, score: 0, status: "bad", msgKey: "fit.msg.modalityEmbedding" }, mismatch: true };
  if (caps.reranker) return { crit: { labelKey: "fit.crit.modality", weight, score: 0, status: "bad", msgKey: "fit.msg.modalityReranker" }, mismatch: true };
  if (!caps.generative) return { crit: { labelKey: "fit.crit.modality", weight, score: 0.4, status: "bad", msgKey: "fit.msg.modalityUnknownGen" }, mismatch: false };
  return { crit: { labelKey: "fit.crit.modality", weight, score: 1, status: "good", msgKey: "fit.msg.modalityGen" }, mismatch: false };
}

export function scoreFit(caps: Caps, task: TaskId): FitResult {
  const crits: FitCriterion[] = [];
  let hardMismatch = false;
  const gen = (w: number) => {
    const r = genGate(caps, w);
    crits.push(r.crit);
    if (r.mismatch) hardMismatch = true;
  };

  switch (task) {
    case "chat":
      gen(0.15);
      crits.push(instructCrit(caps, 0.45), sizeCrit(caps.params, 7, 1.5, 0.25), ctxCrit(caps.contextLen, 8, 2, 0.15));
      break;
    case "code":
      gen(0.1);
      crits.push(codeCrit(caps, 0.35), instructCrit(caps, 0.2), sizeCrit(caps.params, 7, 3, 0.2), ctxCrit(caps.contextLen, 16, 8, 0.15));
      break;
    case "rag":
      gen(0.1);
      crits.push(ctxCrit(caps.contextLen, 32, 8, 0.4), instructCrit(caps, 0.3), sizeCrit(caps.params, 7, 3, 0.2));
      break;
    case "summarize":
      gen(0.1);
      crits.push(ctxCrit(caps.contextLen, 64, 16, 0.45), instructCrit(caps, 0.25), sizeCrit(caps.params, 7, 3, 0.2));
      break;
    case "agent":
      gen(0.1);
      crits.push(instructCrit(caps, 0.3), reasonCrit(caps, 0.25), sizeCrit(caps.params, 14, 7, 0.2), ctxCrit(caps.contextLen, 16, 8, 0.15));
      break;
    case "reasoning":
      gen(0.1);
      crits.push(reasonCrit(caps, 0.4), sizeCrit(caps.params, 14, 7, 0.35), ctxCrit(caps.contextLen, 16, 8, 0.15));
      break;
    case "multilingual":
      gen(0.1);
      crits.push(multiCrit(caps, 0.45), instructCrit(caps, 0.25), sizeCrit(caps.params, 7, 3, 0.2));
      break;
    case "vision":
      crits.push({ labelKey: "fit.crit.modality", weight: 0.55, score: caps.vision ? 1 : 0, status: caps.vision ? "good" : "bad", msgKey: caps.vision ? "fit.msg.visionYes" : "fit.msg.visionNo" });
      if (!caps.vision) hardMismatch = true;
      crits.push(instructCrit(caps, 0.2), sizeCrit(caps.params, 7, 2, 0.25));
      break;
    case "embeddings":
      crits.push({ labelKey: "fit.crit.modality", weight: 0.8, score: caps.embedding ? 1 : 0, status: caps.embedding ? "good" : "bad", msgKey: caps.embedding ? "fit.msg.embedYes" : "fit.msg.embedNo" });
      if (!caps.embedding) hardMismatch = true;
      crits.push(sizeCrit(caps.params, 0.3, 0.1, 0.2));
      break;
    case "edge":
      gen(0.15);
      crits.push(edgeSizeCrit(caps, 0.5), instructCrit(caps, 0.35));
      break;
    case "throughput":
      gen(0.15);
      crits.push(throughputCrit(caps, 0.5), instructCrit(caps, 0.2), ctxCrit(caps.contextLen, 8, 4, 0.15));
      break;
  }

  const totalW = crits.reduce((s, c) => s + c.weight, 0) || 1;
  let overall = (crits.reduce((s, c) => s + c.score * c.weight, 0) / totalW) * 100;
  if (hardMismatch) overall = Math.min(overall, 25);
  overall = Math.round(overall);
  const verdict = overall >= 80 ? "great" : overall >= 60 ? "good" : overall >= 40 ? "weak" : "poor";
  return { overall, verdict, criteria: crits };
}
