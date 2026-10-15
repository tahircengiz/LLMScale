import type { Dtype, ModelArch } from "./calc";
import { VLLM_UTIL } from "./overhead.ts";

// Shareable state encoded in the URL query string so a configured calculation
// can be linked directly (great for the "share this estimate" use case).

export interface AppState {
  hfId: string;
  arch: ModelArch | null;
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  /** Share of each card the engine may fill: vLLM's --gpu-memory-utilization. */
  gpuUtil: number;
  /** A typical request, for concurrency as it runs (calc.ts, typicalConcurrency):
   *  average prompt and output tokens, and the prefix every prompt shares. A
   *  prompt of 0 means not set. */
  loadPrompt: number;
  loadOutput: number;
  loadPrefix: number;
  gpuId: string;
  migId: string;
}

/** True when the app opened on nothing of its own — no model, no architecture,
 *  no device. Every model and device in the analytics data is then a value a
 *  person picked, so the report no longer has to guess which of them were ours.
 *
 *  `arch` counts: the Custom tab produces a shareable link carrying `p`/`L`/…
 *  and no model id, and its recipient lands on a populated page. The traffic
 *  report reads the same three things (`scripts/traffic.ts`, `hasArch`), so the
 *  `landed` event and the report agree on what a blank arrival is — a
 *  cross-check that classified the same visit two ways would be worse than
 *  none. Keep the two definitions in step. */
export function isBlankStart(s: AppState): boolean {
  return !s.hfId && !s.arch && !s.gpuId;
}

export const DEFAULT_STATE: AppState = {
  hfId: "",
  arch: null,
  weightDtype: "bf16",
  kvDtype: "fp16",
  contextLength: 8192,
  concurrency: 1,
  gpuUtil: VLLM_UTIL,
  loadPrompt: 0,
  loadOutput: 0,
  loadPrefix: 0,
  // Deliberately empty: the app opens on no model and no device. A default we
  // put in front of people is indistinguishable from a choice they made, and a
  // crawler that renders the page used to emit our default as if it were one.
  // Both problems disappear when there is nothing to emit. See docs/traffic-report.md.
  gpuId: "",
  migId: "",
};

export function encodeState(s: AppState): string {
  const p = new URLSearchParams();
  if (s.hfId) p.set("m", s.hfId);
  if (s.arch) {
    p.set("p", String(s.arch.numParams));
    p.set("L", String(s.arch.numLayers));
    p.set("h", String(s.arch.hiddenSize));
    p.set("a", String(s.arch.numAttentionHeads));
    p.set("k", String(s.arch.numKeyValueHeads));
    if (s.arch.headDim) p.set("d", String(s.arch.headDim));
    // Without these two an MLA model decodes back as ordinary GQA and its KV
    // cache comes out ~25x too large. The app writes this URL itself, so leaving
    // them out broke every reload and every shared estimate, not just links
    // people typed by hand.
    if (s.arch.kvLoraRank) p.set("kl", String(s.arch.kvLoraRank));
    if (s.arch.qkRopeHeadDim) p.set("qr", String(s.arch.qkRopeHeadDim));
    // Without it a MoE model decodes back as dense on every reload and shared link,
    // and its decode estimate reads every expert instead of the routed few.
    if (s.arch.activeParams) p.set("ap", String(Math.round(s.arch.activeParams)));
    // The same for everything else the sizing reads (calc.ts, perf.ts): without
    // them a reload or a shared link counts every layer at full context again,
    // sizes a quantized checkpoint per parameter, and reads every MoE expert as
    // if the batch were one sequence.
    const a = s.arch;
    if (a.vocabSize) p.set("v", String(a.vocabSize));
    // The overhead's activation peak reads the feed-forward widths (overhead.ts).
    if (a.intermediateSize) p.set("i", String(a.intermediateSize));
    if (a.moeIntermediateSize) p.set("mi", String(a.moeIntermediateSize));
    if (a.tieEmbeddings) p.set("te", "1");
    if (a.attnLayers !== undefined) p.set("al", String(a.attnLayers));
    if (a.slidingLayers && a.slidingWindow) {
      p.set("sl", String(a.slidingLayers));
      p.set("sw", String(a.slidingWindow));
    }
    // DeepSeek V4's compressed layers: without them it decodes as one entry per token.
    if (a.compressedAttn) {
      const c = a.compressedAttn;
      p.set("cx", [c.csa, c.hca, c.window, c.indexDim, ...(c.topk ? [c.topk] : [])].join("."));
    }
    // DeepSeek Sparse Attention: without it the indexer keys drop out of the cache.
    if (a.sparseAttn) {
      const d = a.sparseAttn;
      p.set("dx", [d.topk, d.indexDim, d.indexLayers].join("."));
    }
    if (a.stateBytesPerSeq) p.set("st", String(a.stateBytesPerSeq));
    if (a.stateLayers) p.set("sn", String(a.stateLayers));
    if (a.numExperts && a.expertsPerToken) {
      p.set("ne", String(a.numExperts));
      p.set("ek", String(a.expertsPerToken));
    }
    if (a.shipped) {
      p.set("sd", a.shipped.dtype);
      p.set("sb", String(a.shipped.bytes));
    }
  }
  p.set("wd", s.weightDtype);
  p.set("kd", s.kvDtype);
  p.set("ctx", String(s.contextLength));
  p.set("n", String(s.concurrency));
  // Left out at vLLM's default, so a link only carries a share someone chose.
  if (s.gpuUtil !== VLLM_UTIL) p.set("gu", String(s.gpuUtil));
  if (s.loadPrompt > 0) {
    p.set("lp", String(s.loadPrompt));
    p.set("lo", String(s.loadOutput));
    if (s.loadPrefix > 0) p.set("lx", String(s.loadPrefix));
  }
  // Absent, not empty, while no device is chosen — an empty `g=` would still
  // read as a value and would land in the analytics data as one.
  if (s.gpuId) p.set("g", s.gpuId);
  if (s.migId) p.set("mig", s.migId);
  return p.toString();
}

/** "csa.hca.window.indexDim[.topk]", as encodeState writes it. */
function compressedOf(v: string | null): ModelArch["compressedAttn"] {
  const n = (v ?? "").split(".").map(Number);
  if ((n.length !== 4 && n.length !== 5) || !n.every((x) => Number.isInteger(x) && x >= 0) || n[0] + n[1] === 0 || !n[2]) return undefined;
  const out: ModelArch["compressedAttn"] = { csa: n[0], hca: n[1], window: n[2], indexDim: n[3] };
  if (n[4]) out.topk = n[4];
  return out;
}

/** "topk.indexDim.indexLayers", as encodeState writes it. */
function sparseOf(v: string | null): ModelArch["sparseAttn"] {
  const n = (v ?? "").split(".").map(Number);
  if (n.length !== 3 || !n.every((x) => Number.isInteger(x) && x > 0)) return undefined;
  return { topk: n[0], indexDim: n[1], indexLayers: n[2] };
}

function num(v: string | null): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function decodeState(search: string): Partial<AppState> {
  const p = new URLSearchParams(search);
  const out: Partial<AppState> = {};
  if (p.get("m")) out.hfId = p.get("m")!;

  const numParams = num(p.get("p"));
  const numLayers = num(p.get("L"));
  const hiddenSize = num(p.get("h"));
  const numAttentionHeads = num(p.get("a"));
  const numKeyValueHeads = num(p.get("k"));
  if (numParams && numLayers && hiddenSize && numAttentionHeads && numKeyValueHeads) {
    out.arch = {
      numParams,
      numLayers,
      hiddenSize,
      numAttentionHeads,
      numKeyValueHeads,
      headDim: num(p.get("d")),
      kvLoraRank: num(p.get("kl")),
      qkRopeHeadDim: num(p.get("qr")),
      activeParams: num(p.get("ap")),
      vocabSize: num(p.get("v")),
      intermediateSize: num(p.get("i")),
      moeIntermediateSize: num(p.get("mi")),
      tieEmbeddings: p.get("te") === "1" ? true : undefined,
      attnLayers: num(p.get("al")),
      slidingLayers: num(p.get("sl")),
      slidingWindow: num(p.get("sw")),
      compressedAttn: compressedOf(p.get("cx")),
      sparseAttn: sparseOf(p.get("dx")),
      stateBytesPerSeq: num(p.get("st")),
      stateLayers: num(p.get("sn")),
      numExperts: num(p.get("ne")),
      expertsPerToken: num(p.get("ek")),
    } as ModelArch;
    const sd = p.get("sd") as Dtype | null;
    const sb = num(p.get("sb"));
    if (sd && sb) out.arch.shipped = { dtype: sd, bytes: sb };
    // Drop what the URL did not carry, so a decoded arch has no undefined keys.
    for (const k of Object.keys(out.arch) as (keyof ModelArch)[]) if (out.arch[k] === undefined) delete out.arch[k];
  }

  const wd = p.get("wd") as Dtype | null;
  if (wd) out.weightDtype = wd;
  const kd = p.get("kd") as Dtype | null;
  if (kd) out.kvDtype = kd;
  const ctx = num(p.get("ctx"));
  if (ctx) out.contextLength = ctx;
  const n = num(p.get("n"));
  if (n) out.concurrency = n;
  // Links made before 2026-10-13 carry `ov`, a share of the weights and cache added
  // as overhead; the overhead is now sized per GPU, so it is not read.
  const gu = num(p.get("gu"));
  if (gu !== undefined && gu > 0 && gu <= 1) out.gpuUtil = gu;
  const lp = num(p.get("lp"));
  if (lp && lp > 0) {
    out.loadPrompt = lp;
    out.loadOutput = Math.max(0, num(p.get("lo")) ?? 0);
    out.loadPrefix = Math.max(0, num(p.get("lx")) ?? 0);
  }
  if (p.get("g")) out.gpuId = p.get("g")!;
  if (p.get("mig")) out.migId = p.get("mig")!;
  return out;
}
