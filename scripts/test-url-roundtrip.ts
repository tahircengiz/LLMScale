// The calculator's URL (audit phase 4, from the 2026-10-15 audit's url-fuzz.ts).
// Run: node scripts/test-url-roundtrip.ts
//
// Every reload and every shared estimate goes through encodeState → decodeState
// (urlState.ts). The audit found it dropping the model's context limit (A1): a
// reload showed Qwen3-30B-A3B holding 81,104 tokens against its 40,960, and phase 2
// found GLM-5.3-Flash's MLA lost the same way. Here:
//   1. every field of ModelArch, read from its declaration in calc.ts, comes back:
//      on samples that set them all, and on every preset and regression fixture as
//      the resolver reads it. A field added to ModelArch without a URL key fails
//      until it gets one;
//   2. what the sizing page shows — memory, max users and context, the GPU count and
//      the ×N view, typical users, decode speed, KV read per step — is the same
//      after a reload, over random architectures and settings, merged with the
//      preset as SizingPage.initialState merges a link (its list read from the page);
//   3. hand-edited and garbled links decode without throwing and size to finite,
//      non-negative figures.

import { readFileSync } from "node:fs";
import {
  calculate,
  kvBytesReadPerStep,
  layoutFor,
  layoutsOn,
  maxConcurrency,
  maxContextLength,
  typicalConcurrency,
  type Dtype,
  type ModelArch,
} from "../src/lib/calc.ts";
import { batchFor, GPUS, MIG_PROFILES, stepDevice, usableGiB } from "../src/lib/gpus.ts";
import { resolveModel } from "../src/lib/hf.ts";
import { findKnownByHfId, KNOWN_MODELS } from "../src/lib/models.ts";
import { decodeStep, layoutSpeed } from "../src/lib/perf.ts";
import { DEFAULT_STATE, decodeState, encodeState, type AppState } from "../src/lib/urlState.ts";
import { listedRepos, replayHub } from "./hub-replay.ts";
import { finish, Prop } from "./sweep-kit.ts";

const t0 = Date.now();
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

// ── 1. every ModelArch field ────────────────────────────────────────────────
const decl = /export interface ModelArch \{\n([\s\S]*?)\n\}/.exec(src("../src/lib/calc.ts"))?.[1] ?? "";
const FIELDS = [...decl.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);

/** Written rounded (urlState.ts): a parameter count is a whole number. */
const ROUNDED = new Set(["activeParams", "specParams", "lookupParams"]);
/** What the engine cannot tell from absent: false flags, a pool of 1, a topk of 0,
 *  a head size of 0 (resolveHeadDim derives one; GLM-5.3-Flash's config says 0). */
function norm(k: string, v: unknown): unknown {
  if (v === false || v === undefined || v === null) return undefined;
  if (k === "headDim" && v === 0) return undefined;
  if (ROUNDED.has(k) && typeof v === "number") return Math.round(v);
  if (k === "sparseAttn" && v && typeof v === "object") {
    const { kpool, ...rest } = v as { kpool?: number };
    return kpool && kpool > 1 ? v : rest;
  }
  if (k === "compressedAttn" && v && typeof v === "object") {
    const { topk, ...rest } = v as { topk?: number };
    return topk ? v : rest;
  }
  if (k === "notInVllm" && v && typeof v === "object") {
    const { linear, ...rest } = v as { linear?: boolean };
    return linear ? v : rest;
  }
  return v;
}
const lostKeys = (a: ModelArch, hfId = "") => {
  const back = decodeState("?" + encodeState({ ...DEFAULT_STATE, hfId, arch: a })).arch as unknown as Record<string, unknown> | undefined;
  const orig = a as unknown as Record<string, unknown>;
  return FIELDS.filter((k) => JSON.stringify(norm(k, orig[k])) !== JSON.stringify(norm(k, back?.[k])))
    .map((k) => `${k} ${JSON.stringify(orig[k])} -> ${JSON.stringify(back?.[k])}`);
};

const common: ModelArch = {
  numParams: 123_456_789_012, numLayers: 61, hiddenSize: 7168, numAttentionHeads: 128, numKeyValueHeads: 8,
  headDim: 192, vocabSize: 129_280, maxContext: 163_840, intermediateSize: 18_432, activeParams: 37_123_456_789.4,
  specParams: 11_234_567_890.6, lookupParams: 2_345_678_901, unmodelled: ["rope_scaling.type", "attn_logit_softcapping"],
  placeholder: true, notInVllm: { arch: "SomeForCausalLM", until: "0.30.2", linear: true }, attnLayers: 13,
  slidingLayers: 40, slidingWindow: 4096, vHeadDim: 128, crossAttn: { layers: 8, tokens: 6404 }, globalAttn: { kvHeads: 4, headDim: 512 },
  stateBytesPerSeq: 12_345_678, stateLayers: 48, numExperts: 256, expertsPerToken: 8, moeIntermediateSize: 2048,
  tieEmbeddings: true, shipped: { dtype: "fp8", bytes: 166_886_535_336 }, mxfp4: true, vision: { patches: 16_384, tokens: 4096, hidden: 1280 },
};
const SAMPLES: [string, ModelArch][] = [
  // MLA with DeepSeek Sparse Attention, every other field set too.
  ["MLA + DSA", { ...common, kvLoraRank: 512, qkRopeHeadDim: 64, sparseAttn: { topk: 2048, indexDim: 128, indexLayers: 61, kpool: 4 } }],
  // MLA whose positional part is 0 (GLM-5.3-Flash).
  ["MLA, rope 0", { ...common, kvLoraRank: 512, qkRopeHeadDim: 0 }],
  // DeepSeek V4's compressed attention: a rope width without an MLA rank (v4Bytes reads it).
  ["V4 compressed", { ...common, qkRopeHeadDim: 96, compressedAttn: { csa: 21, hca: 20, window: 128, indexDim: 128, topk: 1024 } }],
];
const fieldsCovered = new Prop("the samples set every ModelArch field (add a new field to them)");
const covered = new Set(SAMPLES.flatMap(([, a]) => Object.keys(a)));
for (const k of FIELDS) fieldsCovered.ok(covered.has(k), () => `${k} is in ModelArch but in no sample`);
fieldsCovered.ok(FIELDS.length >= 30, () => `read only ${FIELDS.length} fields from calc.ts — has the declaration moved?`);

const fieldsBack = new Prop("every ModelArch field survives encode → decode");
for (const [name, a] of SAMPLES) {
  const lost = lostKeys(a);
  fieldsBack.ok(!lost.length, () => `${name}: ${lost.join("; ")}`);
}

const realBack = new Prop("…and every preset and regression repo, as resolved, comes back whole");
const regression = new URL("./fixtures/configs-regression/", import.meta.url);
const restore = replayHub(regression);
const resolved: { id: string; arch: ModelArch }[] = [];
for (const id of listedRepos(regression)) {
  const r = await resolveModel(id);
  if (r.arch) resolved.push({ id, arch: r.arch });
}
restore();
for (const m of KNOWN_MODELS) {
  const lost = lostKeys(m, m.hfId);
  realBack.ok(!lost.length, () => `${m.id}: ${lost.join("; ")}`);
}
for (const { id, arch } of resolved) {
  const lost = lostKeys(arch, id);
  realBack.ok(!lost.length, () => `${id}: ${lost.join("; ")}`);
}

// ── 2. the page's figures after a reload ─────────────────────────────────────
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const maybe = (p = 0.5) => rnd() < p;

function randomArch(): ModelArch {
  const heads = pick([8, 12, 16, 28, 32, 40, 64, 96, 128]);
  const kv = pick([1, 2, 4, 8, heads].filter((k) => heads % k === 0));
  const layers = int(2, 126);
  const hidden = heads * pick([64, 80, 128, 192]);
  const a: ModelArch = { numParams: Math.round(rnd() * 7e11) + 1e8, numLayers: layers, hiddenSize: hidden, numAttentionHeads: heads, numKeyValueHeads: kv };
  if (maybe()) a.headDim = pick([64, 96, 128, 256]);
  if (maybe(0.8)) a.vocabSize = pick([32000, 50257, 128256, 151936, 262144]);
  if (maybe(0.8)) a.maxContext = pick([2048, 4096, 32768, 40960, 131072, 163840, 1048576]);
  if (maybe(0.7)) a.intermediateSize = hidden * pick([2, 3, 4]);
  if (maybe(0.3)) {
    a.numExperts = pick([8, 32, 64, 128, 256]);
    a.expertsPerToken = pick([1, 2, 4, 8]);
    a.activeParams = a.numParams * (0.05 + rnd() * 0.3);
    a.moeIntermediateSize = pick([768, 1536, 2048]);
    if (maybe(0.2)) a.mxfp4 = true;
  }
  if (maybe(0.15)) {
    a.kvLoraRank = 512;
    a.qkRopeHeadDim = pick([0, 64]);
    if (maybe(0.4)) a.sparseAttn = { topk: 2048, indexDim: 128, indexLayers: maybe(0.5) ? layers : int(1, layers), ...(maybe(0.3) ? { kpool: 4 } : {}) };
  } else if (maybe(0.08)) {
    a.compressedAttn = { csa: int(1, layers), hca: int(0, layers), window: 128, indexDim: 128, ...(maybe() ? { topk: 512 } : {}) };
    a.headDim = 512;
    a.qkRopeHeadDim = pick([32, 64, 96]);
  }
  if (maybe(0.2)) {
    a.slidingLayers = int(1, layers);
    a.slidingWindow = pick([128, 512, 1024, 4096]);
    if (maybe(0.3)) a.globalAttn = { kvHeads: pick([1, 2, 4]), headDim: pick([256, 512]) };
  }
  if (maybe(0.15)) {
    a.attnLayers = int(1, layers);
    a.stateLayers = layers - a.attnLayers || 1;
    a.stateBytesPerSeq = int(1e5, 5e7);
  }
  if (maybe(0.1)) a.vHeadDim = pick([64, 128]);
  if (maybe(0.05)) a.crossAttn = { layers: int(1, 10), tokens: pick([1601, 6404]) };
  if (maybe(0.1)) a.specParams = Math.round(a.numParams * 0.02);
  if (maybe(0.1)) a.lookupParams = Math.round(a.numParams * 0.05);
  if (maybe(0.1)) a.vision = { patches: pick([4096, 16384]), tokens: pick([1024, 4096]), hidden: pick([1152, 1280]) };
  if (maybe(0.3)) a.tieEmbeddings = true;
  if (maybe(0.15)) a.shipped = { dtype: pick(["fp8", "int4", "int8"] as Dtype[]), bytes: Math.round(a.numParams * (0.5 + rnd())) };
  if (maybe(0.05)) a.placeholder = true;
  return a;
}

const DTS: Dtype[] = ["fp16", "bf16", "fp8", "int8", "int4", "fp32"];
function randomState(arch: ModelArch, hfId = ""): AppState {
  const g = pick(GPUS);
  const mig = maybe(0.2) ? pick(MIG_PROFILES[g.id] ?? [{ id: "" }]).id : "";
  return {
    ...DEFAULT_STATE, hfId, arch,
    weightDtype: pick(DTS), kvDtype: pick(["fp16", "bf16", "fp8"] as Dtype[]),
    contextLength: pick([1, 2048, 8192, 32768, 131072, 1048576, int(1, 300000)]),
    concurrency: pick([1, 2, 16, 64, 256, 1024, int(1, 500)]),
    gpuUtil: pick([0.92, 0.5, 0.8, 0.95, 0.99]),
    loadPrompt: maybe() ? pick([128, 1000, 4000]) : 0, loadOutput: pick([0, 250, 4000]), loadPrefix: pick([0, 200]),
    gpuId: g.id, migId: mig, gpuCount: pick([1, 1, 2, 3, 8, 16]),
  };
}

// The fields SizingPage.initialState fills from a link's preset, read from the page itself.
const page = src("../src/pages/SizingPage.tsx");
const fillList = /function initialState[\s\S]*?for \(const k of \[([^\]]+)\] as const\)/.exec(page)?.[1];
const FILL = [...(fillList ?? "").matchAll(/"(\w+)"/g)].map((m) => m[1]) as (keyof ModelArch)[];

/** A reload, as SizingPage.initialState merges the decoded URL. */
function reload(s: AppState): AppState {
  const fromUrl = decodeState("?" + encodeState(s));
  if (fromUrl.arch && fromUrl.hfId) {
    const known = findKnownByHfId(fromUrl.hfId);
    if (known) {
      const fill: Partial<ModelArch> = {};
      for (const k of FILL) if (fromUrl.arch[k] === undefined && known[k] !== undefined) (fill as Record<string, unknown>)[k] = known[k];
      fromUrl.arch = { ...fromUrl.arch, ...fill };
    }
  }
  return { ...DEFAULT_STATE, ...fromUrl };
}

/** What the sizing page shows for a state (Results, GpuFit, the speed panel). */
function outputs(s: AppState) {
  const g = GPUS.find((x) => x.id === s.gpuId) ?? GPUS.find((x) => x.id === "h100-80")!;
  const a = s.arch!;
  const batch = batchFor(g, s.migId);
  const usable = usableGiB(g, s.migId, s.gpuUtil);
  const base = { arch: a, weightDtype: s.weightDtype, kvDtype: s.kvDtype, batch };
  const input = { ...base, contextLength: s.contextLength, concurrency: s.concurrency };
  const speed = layoutSpeed(input, stepDevice(g));
  const r = calculate(input);
  const needs = r.totalGiB <= usable ? 1 : g.unified || s.migId ? 0 : layoutFor(input, usable, undefined, speed)?.gpus ?? 0;
  const count = !g.unified && !s.migId ? s.gpuCount : 1;
  const on = count > 1 ? layoutsOn(input, usable, count, speed)[0] : null;
  const typical = s.loadPrompt > 0 ? typicalConcurrency({ ...base, contextLength: s.contextLength }, usable, { promptTokens: s.loadPrompt, outputTokens: s.loadOutput, sharedPrefix: s.loadPrefix }).users : -1;
  const decode = g.bandwidthGBs ? decodeStep({ arch: a, weightDtype: s.weightDtype, kvDtype: s.kvDtype, contextLength: s.contextLength }, s.concurrency, stepDevice(g))?.perUser ?? -1 : -1;
  return {
    total: r.totalGiB, perGpu: r.perGpuGiB, kv: r.kvCacheGiB, weights: r.weightsGiB,
    maxUsers: maxConcurrency({ ...base, contextLength: s.contextLength }, usable),
    maxCtx: maxContextLength({ ...base, concurrency: s.concurrency }, usable),
    needs, onUsers: on?.maxUsers ?? -1, onCtx: on?.maxContext ?? -1, typical, decode,
    read: kvBytesReadPerStep(a, s.kvDtype, s.contextLength),
    limit: a.maxContext ?? -1,
  };
}
type Out = ReturnType<typeof outputs>;
const FIGURES = ["total", "perGpu", "kv", "weights", "maxUsers", "maxCtx", "needs", "onUsers", "onCtx", "typical", "decode", "read", "limit"] as const;

const fillRead = new Prop("SizingPage.initialState's preset fill list is readable from the page");
fillRead.ok(FILL.length >= 5 && FILL.every((k) => FIELDS.includes(k)), () => `read ${JSON.stringify(FILL)}`);
const figures = Object.fromEntries(FIGURES.map((f) => [f, new Prop(`a reload keeps ${f}`)])) as Record<(typeof FIGURES)[number], Prop>;
const close = (x: number, y: number) => x === y || Math.abs(x - y) <= 1e-9 * Math.max(Math.abs(x), Math.abs(y)) || (Number.isNaN(x) && Number.isNaN(y));
function compare(s: AppState, label: string) {
  const a: Out = outputs(s);
  const b: Out = outputs(reload(s));
  for (const f of FIGURES) {
    const ok = f === "decode" ? Math.abs(a[f] - b[f]) <= 1e-6 * Math.max(1, Math.abs(a[f])) : close(a[f], b[f]);
    figures[f].ok(ok, () => `${label} ${s.weightDtype}/${s.kvDtype} ctx ${s.contextLength} users ${s.concurrency} ${s.gpuId}${s.migId ? "/" + s.migId : ""} ×${s.gpuCount}: ${a[f]} -> ${b[f]}`);
  }
}
for (let i = 0; i < 3000; i++) compare(randomState(randomArch()), `random #${i}`);
// Every preset and fixture, as a link from the page that resolved it.
for (const m of KNOWN_MODELS) for (let i = 0; i < 15; i++) compare(randomState(m, m.hfId), m.id);
for (const { id, arch } of resolved) for (let i = 0; i < 15; i++) compare(randomState(arch, id), id);

// ── 3. hand-edited and garbled links ────────────────────────────────────────
const ARCH = "p=8030000000&L=32&h=4096&a=32&k=8&d=128&v=128256";
const BASE = "p=8e9&L=32&h=4096&a=32&k=8";
const BAD = [
  "", "?", "?ctx=abc", "?n=-5", "?n=0", "?n=0.5", "?n=1e400", "?ctx=-8192", "?ctx=0.5", "?ctx=1e300",
  `?${ARCH}&wd=fp4`, `?${ARCH}&kd=int4`, `?${ARCH}&kd=fp32`, `?${ARCH}&kd=garbage`,
  `?${ARCH}&ctx=-8192`, `?${ARCH}&n=-3`, `?${ARCH}&n=0.25`, `?${ARCH}&ctx=0.5`, `?${ARCH}&ctx=1e15`, `?${ARCH}&n=1e9`,
  "?p=-8e9&L=32&h=4096&a=32&k=8", "?p=8e9&L=-32&h=4096&a=32&k=8", "?p=8e9&L=32&h=4096&a=32&k=64", "?p=8e9&L=32&h=4096&a=3&k=8",
  `?${BASE}&d=-128`, `?${BASE}&al=-4`, `?${BASE}&al=0`, `?${BASE}&sl=40&sw=-5`,
  `?${BASE}&kl=512&qr=64&dx=2048.128.0`, `?${BASE}&cx=0.0.0.0`, `?${BASE}&cx=1.1.128.128.0`, `?${BASE}&cx=21.20.128.128&qr=-64`,
  `?${BASE}&st=-100&sn=4`, `?${BASE}&ne=8&ek=16&ap=1e9`, `?${BASE}&ap=9e9&ne=8&ek=2`,
  `?${BASE}&sd=fp8&sb=-5&wd=fp8`, `?${BASE}&sd=fp8&sb=5&wd=fp8`, `?${BASE}&sd=fp4&sb=5e9`, `?${BASE}&gu=1.5`, `?${BASE}&gu=0.0001`,
  `?${BASE}&lp=1e9&lo=-5&lx=1e12`, `?${BASE}&lp=100&lx=5000`, `?${BASE}&g=h100-80&mig=7g.999gb`,
  `?${BASE}&g=h100-80&mig=3g.40gb&gn=8`, `?${BASE}&g=apple-m4-32&gn=8`, `?${BASE}&g=nope&gn=1024`, `?${BASE}&g=h100-80&gn=1024`,
  `?${BASE}&v=0&i=0`, "?p=1&L=1&h=1&a=1&k=1", `?${BASE}&te=1&v=1e12`,
  // Fields added since the audit.
  `?${BASE}&ga=0.512`, `?${BASE}&ga=4.x`, `?${BASE}&vd=-128`, `?${BASE}&ca=8`, `?${BASE}&ca=8.0`, `?${BASE}&vi=1.2`, `?${BASE}&vi=-1.2.3`,
  `?${BASE}&xp=-5e9`, `?${BASE}&xp=9e9`, `?${BASE}&lk=1e12`, `?${BASE}&mx=1`, `?${BASE}&mx=1&ne=8&ek=2&mi=0`,
  `?${BASE}&nv=%3Cscript%3E`, `?${BASE}&nv=Foo@1.2.3!`, `?${BASE}&um=a,b,%3Cx%3E`, `?${BASE}&ph=1`, `?${BASE}&ph=yes`,
  `?${BASE}&kl=512&qr=64&dx=2048.128.61.0`, `?${BASE}&kl=512&qr=64&dx=2048.128.61.-4`, `?${BASE}&mi=-2048&ne=8&ek=2`,
];
const malformed = new Prop("a malformed link decodes and sizes without throwing, NaN, Infinity or negative figures");
const MAY_BE_NEGATIVE = new Set(["onUsers", "onCtx", "typical", "decode", "limit"]);
for (const q of BAD) {
  try {
    const st = { ...DEFAULT_STATE, ...decodeState(q) };
    if (!st.arch) {
      malformed.ok(true, () => "");
      continue;
    }
    const o = outputs(st);
    const bad = Object.entries(o).filter(([k, v]) => !Number.isFinite(v) || (v < 0 && !MAY_BE_NEGATIVE.has(k)));
    malformed.ok(!bad.length, () => `${q}: ${bad.map(([k, v]) => `${k}=${v}`).join(" ")}`);
  } catch (e) {
    malformed.ok(false, () => `${q}: throws ${(e as Error).message}`);
  }
}

console.log(`${FIELDS.length} ModelArch fields, ${KNOWN_MODELS.length} presets, ${resolved.length} resolved repos, ${BAD.length} malformed links`);
finish([fieldsCovered, fieldsBack, realBack, fillRead, ...Object.values(figures), malformed], t0);
