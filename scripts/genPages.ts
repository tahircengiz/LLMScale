// Builds the static guides: a page per preset model and per featured GPU, in
// every enabled language, and a hub page listing each set. The words are in
// scripts/locales/, a file per language; this script works out what they say.
//
//   node scripts/genPages.ts [outDir=dist]
//
// Runs after prerender.ts (see "build" in package.json), and reads the site's own
// base path, canonical host and analytics tag back from the built index.html
// instead of keeping second copies of them here.
//
// Why these exist: people search the questions the calculator answers — "how
// much VRAM does Llama 3.3 70B need", "what fits on an RTX 4090" — and a page
// that answers one of them in its HTML can rank for it, where the calculator,
// which answers all of them, ranks for none. Every figure is computed here by the
// same engine the app uses, so a page cannot drift from the calculator it links
// into, and the prose is assembled from each model's own architecture rather than
// written once and repeated. The set is bounded by the presets and a shortlist of
// GPUs (src/lib/staticPages.ts): pages worth reading, not a page per combination.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  calculate,
  kvBytesPerFullLayerToken,
  kvBytesPerToken,
  maxConcurrency,
  maxContextLength,
  usesMla,
  type Dtype,
  type ModelArch,
} from "../src/lib/calc.ts";
import { KNOWN_MODELS, type KnownModel } from "../src/lib/models.ts";
import { batchFor, cardsFor, DRIVER_RESERVE, GPUS, needOn, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import { estimateTraining, type TrainMode } from "../src/lib/train.ts";
import { DICTS } from "../src/locales/index.ts";
import { ENABLED_LANGS, LANG_META, type Lang } from "../src/lib/langs.ts";
import { CONCEPT_FILES, CONCEPTS_HUB, FEATURED_GPU_IDS, GPUS_HUB, MODELS_HUB, gpuPageFile, modelPageFile } from "../src/lib/staticPages.ts";
import { CONCEPTS, type Concept, type Fmt } from "./concepts.ts";
import { createShell, ctxK, dec, esc, gib, int, params, ratio, readSite, words } from "./shell.ts";
import { PAGE_TEXT } from "./locales/index.ts";
import { loadFeed } from "./feedData.ts";
import { modifiedDate } from "./lastModified.ts";

const outDir = process.argv[2] ?? "dist";
// Every guide is made from this script and what it imports, so they share one date.
const modified = modifiedDate("scripts/genPages.ts");
const { href, url, page } = createShell(readSite(outDir), { feed: loadFeed().length > 0, modified });

// ── the engine, at the calculator's own defaults ─────────────────────────────
const WORK = { kvDtype: "fp16" as Dtype };
const PRECISIONS: Dtype[] = ["bf16", "fp8", "int4"];
// The engine's labels spell out the bytes ("BF16 (2 bytes)"); a table column only needs the name.
const LABEL: Record<string, string> = { bf16: "BF16", fp8: "FP8", int4: "INT4" };
/** Memory for a model, with the overhead vLLM has on device `g` (a card under 70 GiB's without one). */
const size = (m: ModelArch, weightDtype: Dtype, contextLength: number, concurrency = 1, g?: Gpu) =>
  calculate({ arch: m, weightDtype, contextLength, concurrency, ...WORK, batch: g ? batchFor(g) : undefined });
/** The context the headline figures use: 8k, or the model's maximum if shorter. */
const refCtx = (m: KnownModel) => Math.min(8192, m.maxContext ?? 8192);
const gpu = (id: string): Gpu => {
  const g = GPUS.find((x) => x.id === id);
  if (!g) throw new Error(`no GPU with id ${id}`);
  return g;
};
const bySize = (a: Gpu, b: Gpu) => usableGiB(a) - usableGiB(b);
const ALL_BY_SIZE = [...GPUS].sort(bySize);
const FEATURED = FEATURED_GPU_IDS.map(gpu).sort(bySize);
const USER_CARDS = ["rtx4090-24", "rtx5090-32", "rtx6000ada-48", "h100-80", "rtxpro6000-96", "amd-strixhalo-128", "h200-141", "b200-192"].map(gpu).sort(bySize);
const MULTI_CARDS = ["h100-80", "h200-141", "b200-192"].map(gpu);
const MODELS = [...KNOWN_MODELS].sort((a, b) => a.family.localeCompare(b.family) || a.numParams - b.numParams);

function contextsFor(m: KnownModel): number[] {
  const max = m.maxContext ?? 8192;
  const set = [8192, 32768, 131072].filter((c) => c <= max);
  if (!set.includes(max)) set.push(max);
  return set.slice(-4);
}
const gpuLink = (lang: Lang, g: Gpu) =>
  FEATURED_GPU_IDS.includes(g.id) ? `<a href="${href(lang, gpuPageFile(g.id))}">${esc(g.name)}</a>` : esc(g.name);
const modelLink = (lang: Lang, m: KnownModel) => `<a href="${href(lang, modelPageFile(m.id))}">${esc(m.displayName)}</a>`;


// ── model pages ───────────────────────────────────────────────────────────────
function attentionSentence(lang: Lang, m: KnownModel): string {
  const T = PAGE_TEXT[lang].model.attention;
  const a = m.numAttentionHeads;
  const k = m.numKeyValueHeads;
  if (usesMla(m)) {
    const plain = kvBytesPerToken({ ...m, kvLoraRank: undefined, qkRopeHeadDim: undefined }, "fp16") / kvBytesPerToken(m, "fp16");
    const d = (m.kvLoraRank ?? 0) + (m.qkRopeHeadDim ?? 0);
    return T.mla({ dims: d, ratio: ratio(lang, plain) });
  }
  if (k === 1) return T.mqa({ heads: a });
  if (k < a) return T.gqa({ heads: a, kvHeads: k, ratio: ratio(lang, a / k) });
  return T.mha({ heads: a });
}

function modelPage(lang: Lang, m: KnownModel): string {
  const P = PAGE_TEXT[lang];
  const T = P.model;
  const file = modelPageFile(m.id);
  const ctx = refCtx(m);
  const bf16 = size(m, "bf16", ctx);
  const int4 = size(m, "int4", ctx);
  const max = m.maxContext ?? ctx;
  const kvAtMax = size(m, "bf16", max).kvCacheGiB;
  const contexts = contextsFor(m);
  const name = m.displayName;

  const lede = [
    T.lede.size({ name, params: params(lang, m.numParams), layers: m.numLayers }),
    attentionSentence(lang, m),
    m.isMoE && m.activeParams ? T.lede.moe({ active: params(lang, m.activeParams), total: params(lang, m.numParams) }) : "",
    T.lede.context({ max: int(lang, max), kv: gib(lang, kvAtMax) }),
    m.gated ? T.lede.gated : "",
  ].filter(Boolean).join(" ");

  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">${T.thPrecision}</th>${contexts.map((c) => `<th scope="col">${ctxK(c)} context</th>`).join("")}</tr></thead>
<tbody>${PRECISIONS.map((d) => `<tr><th scope="row">${LABEL[d]}</th>${contexts
    .map((c) => {
      const r = size(m, d, c);
      return `<td>${gib(lang, r.totalGiB)}<small>${T.kvCache} ${gib(lang, r.kvCacheGiB)}</small></td>`;
    })
    .join("")}</tr>`).join("")}</tbody>
</table></div>
<p class="note">${T.tableNote}</p>`;

  const fitItems = PRECISIONS.map((d) => {
    const need = size(m, d, ctx).totalGiB;
    const input = { arch: m, weightDtype: d, contextLength: ctx, concurrency: 1, ...WORK };
    // Not a card vLLM 0.31 does not run on (V100, audit F2).
    const holding = ALL_BY_SIZE.filter((g) => !g.noVllm && needOn(input, g) <= usableGiB(g)).slice(0, 4);
    const label = `<strong>${LABEL[d]}</strong> (${gib(lang, need)})`;
    if (holding.length) return `<li>${label}: ${holding.map((g) => gpuLink(lang, g)).join(", ")}</li>`;
    const counts = MULTI_CARDS.map((g) => `${cardsFor(input, g) ?? "—"}× ${gpuLink(lang, g)}`).join(", ");
    return `<li>${label}: ${T.noSingleGpu(counts)}</li>`;
  }).join("");

  const users = USER_CARDS.map((g) => ({
    g,
    n: PRECISIONS.map((d) => maxConcurrency({ arch: m, weightDtype: d, contextLength: ctx, ...WORK, batch: batchFor(g) }, usableGiB(g))),
  }));
  const anyUsers = users.some((u) => u.n.some((x) => x > 0));
  const usersBlock = anyUsers
    ? `<div class="scroll"><table>
<thead><tr><th scope="col">GPU</th>${PRECISIONS.map((d) => `<th scope="col">${LABEL[d]}</th>`).join("")}</tr></thead>
<tbody>${users.map((u) => `<tr><th scope="row">${gpuLink(lang, u.g)}</th>${u.n
        .map((x) => (x > 0 ? `<td>${int(lang, x)}</td>` : `<td><span class="no" aria-hidden="true">✗</span><span class="sr">${T.doesNotFit}</span></td>`))
        .join("")}</tr>`).join("")}</tbody>
</table></div>
<p class="note">${T.usersNote(ctxK(ctx))}</p>`
    : `<p>${T.noCard}</p>`;

  const modes: TrainMode[] = ["full", "lora", "qlora"];
  const trainRows = modes.map((mode) => {
    const r = estimateTraining({ arch: m, mode, batchSize: 1, seqLength: 2048, gradientCheckpointing: true, loraRank: 16, loraTarget: "attn", overheadGiB: 1 });
    const g = ALL_BY_SIZE.find((x) => r.totalGiB <= usableGiB(x, undefined, DRIVER_RESERVE));
    return `<tr><th scope="row">${T.modes[mode]}</th><td>${gib(lang, r.totalGiB)}</td><td>${g ? gpuLink(lang, g) : T.sharded}</td></tr>`;
  }).join("");

  const kib = dec(lang, (kvBytesPerToken(m, "fp16") / 1024).toFixed(1));
  // A sliding window caps most of a Gemma's or gpt-oss's layers: without it the
  // per-token figure contradicts the long-context column of the table above.
  const sliding = m.slidingWindow ? Math.min(m.slidingLayers ?? 0, m.attnLayers ?? m.numLayers) : 0;
  const fullLayers = (m.attnLayers ?? m.numLayers) - sliding;
  const pastWindow = dec(lang, ((fullLayers * kvBytesPerFullLayerToken(m, "fp16")) / 1024).toFixed(1));
  const windowNote = sliding ? T.windowNote({ sliding, layers: m.numLayers, window: int(lang, m.slidingWindow!), pastWindow, fullLayers }) : "";
  const kvFormula = usesMla(m) ? T.kvFormula.mla : T.kvFormula.heads;
  const q = `?m=${encodeURIComponent(m.hfId)}`;
  const family = MODELS.filter((x) => x.family === m.family && x.id !== m.id);

  const body = `<p class="lede">${lede}</p>
<div class="answer">
  <div class="cap">BF16 · ${ctxK(ctx)} context · ${T.oneUser}</div>
  <div class="big">${gib(lang, bf16.totalGiB)}</div>
  <p>${T.answer({ weights: gib(lang, bf16.weightsGiB), kv: gib(lang, bf16.kvCacheGiB), overhead: gib(lang, bf16.activationsGiB + bf16.runtimeGiB), int4: gib(lang, int4.totalGiB) })}</p>
  <ul class="spec"><li>${m.numLayers} ${T.specLayers}</li><li>hidden ${m.hiddenSize}</li><li>${m.numAttentionHeads}/${m.numKeyValueHeads} heads</li><li>head_dim ${bf16.headDim}</li><li>${ctxK(max)} ${T.specMaxContext}</li>${m.isMoE ? "<li>MoE</li>" : ""}${usesMla(m) ? "<li>MLA</li>" : ""}</ul>
</div>
<h2>${T.h2Memory(name)}</h2>
${table}
<h2>${T.h2Holds}</h2>
<ul class="plain">${fitItems}</ul>
<p class="note">${T.fitNote(ctxK(ctx))}</p>
<h2>${T.h2Users}</h2>
${usersBlock}
<h2>${T.h2FineTune(name)}</h2>
<div class="scroll"><table>
<thead><tr><th scope="col">${T.thMethod}</th><th scope="col">${T.thMemory}</th><th scope="col">${T.thSmallestGpu}</th></tr></thead>
<tbody>${trainRows}</tbody>
</table></div>
<p class="note">${T.trainNote}</p>
<h2>${T.h2Source}</h2>
<p>${T.source({ kvFormula, name: esc(name), kib, windowNote })}</p>
<p>${T.more({ kvCache: href(lang, CONCEPT_FILES.kvCache), attention: href(lang, CONCEPT_FILES.attention) })}</p>
<h2>${T.h2Work(name)}</h2>
<ul class="links">
  <li><a class="primary" href="${href(lang)}${q}">${T.links.size}</a></li>
  <li><a href="${href(lang, "train.html")}${q}">${T.links.train}</a></li>
  <li><a href="${href(lang, "vllm.html")}${q}">${T.links.vllm}</a></li>
  <li><a href="${href(lang, "anatomy.html")}${q}">${T.links.anatomy}</a></li>
  <li><a href="${href(lang, "config.html")}${q}">${T.links.config}</a></li>
  <li><a href="${href(lang, "serving.html")}${q}">${T.links.serving}</a></li>
</ul>
${family.length ? `<h2>${T.h2Family(m.family)}</h2>
<ul class="links">${family.map((x) => `<li>${modelLink(lang, x)}</li>`).join("")}</ul>` : ""}`;

  return page({
    lang,
    file,
    section: "models",
    title: T.title(name),
    description: T.description({ name, ctx: ctxK(ctx), bf16: gib(lang, bf16.totalGiB), int4: gib(lang, int4.totalGiB) }),
    h1: T.h1(name),
    crumbs: [
      { name: "LLMScale", file: "" },
      { name: P.section.models, file: MODELS_HUB },
      { name },
    ],
    body,
    ld: { "@context": "https://schema.org", "@type": "TechArticle", headline: T.h1(name), inLanguage: LANG_META[lang].hreflang, url: url(lang, file), about: name, isPartOf: { "@type": "WebSite", name: "LLMScale", url: url(lang) }, author: { "@type": "Person", name: "Tahir Ali Cengiz", url: "https://github.com/tahircengiz" } },
  });
}

// ── GPU pages ─────────────────────────────────────────────────────────────────
function gpuPage(lang: Lang, g: Gpu): string {
  const P = PAGE_TEXT[lang];
  const T = P.gpu;
  const file = gpuPageFile(g.id);
  const usable = usableGiB(g);
  const rows = [...KNOWN_MODELS].sort((a, b) => a.numParams - b.numParams).map((m) => {
    const ctx = refCtx(m);
    const need = PRECISIONS.map((d) => size(m, d, ctx, 1, g).totalGiB);
    const best = PRECISIONS.findIndex((_, i) => need[i] <= usable);
    return { m, ctx, need, best };
  });
  const count = (i: number) => rows.filter((r) => r.need[i] <= usable).length;

  const lede = [
    g.unified && g.totalGiB
      ? T.lede.unified({ name: g.name, total: g.totalGiB, vram: g.vramGiB, usable: gib(lang, usable), apple: g.vendor === "Apple" })
      : T.lede.discrete({ name: g.name, vram: g.vramGiB, usable: gib(lang, usable) }),
    g.bandwidthGBs ? T.lede.bandwidth(int(lang, g.bandwidthGBs)) : "",
    g.vendor === "Apple" ? T.lede.apple : "",
    T.lede.counts({ models: rows.length, bf16: count(0), fp8: count(1), int4: count(2) }),
  ].filter(Boolean).join(" ");

  const cell = (fitsHere: boolean, v: number) =>
    fitsHere ? `<td class="ok">${gib(lang, v)}</td>` : `<td><span class="no">${gib(lang, v)}</span><span class="sr">${T.doesNotFit}</span></td>`;
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">${T.thModel}</th>${PRECISIONS.map((d) => `<th scope="col">${LABEL[d]}</th>`).join("")}<th scope="col">${T.thUsers}</th><th scope="col">${T.thMaxContext}</th></tr></thead>
<tbody>${rows.map((r) => {
    const d = PRECISIONS[r.best];
    const usersN = r.best < 0 ? 0 : maxConcurrency({ arch: r.m, weightDtype: d, contextLength: r.ctx, ...WORK, batch: batchFor(g) }, usable);
    const maxCtx = r.best < 0 ? 0 : Math.min(maxContextLength({ arch: r.m, weightDtype: d, concurrency: 1, ...WORK, batch: batchFor(g) }, usable), r.m.maxContext ?? Infinity);
    return `<tr><th scope="row">${modelLink(lang, r.m)}</th>${r.need.map((v) => cell(v <= usable, v)).join("")}${
      r.best < 0 ? `<td>—</td><td>—</td>` : `<td>${int(lang, usersN)}<small>${LABEL[d]}</small></td><td>${ctxK(maxCtx)}<small>${LABEL[d]}</small></td>`
    }</tr>`;
  }).join("")}</tbody>
</table></div>
<p class="note">${T.tableNote}</p>`;

  const cat = DICTS[lang][`cat.${g.category}`] ?? g.category;
  const siblings = FEATURED.filter((x) => x.id !== g.id);
  const body = `<p class="lede">${lede}</p>
<div class="answer">
  <div class="cap">${esc(cat)} · ${T.usableMemory}</div>
  <div class="big">${gib(lang, usable)}</div>
  <p>${T.answer({ models: rows.length, bf16: count(0), int4: count(2) })}</p>
</div>
<h2>${T.h2Fit(g.name)}</h2>
${table}
<p>${T.quantization(href(lang, CONCEPT_FILES.quantization))}</p>
<p>${T.parallel}</p>
<h2>${T.h2Size(g.name)}</h2>
<ul class="links">
  <li><a class="primary" href="${href(lang)}?g=${encodeURIComponent(g.id)}">${T.open}</a></li>
</ul>
<h2>${T.h2Others}</h2>
<ul class="links">${siblings.map((x) => `<li>${gpuLink(lang, x)}</li>`).join("")}</ul>`;

  return page({
    lang,
    file,
    section: "gpus",
    title: T.title(g.name),
    description: T.description({ name: g.name, usable: gib(lang, usable), models: rows.length, bf16: count(0), int4: count(2) }),
    h1: T.h1(g.name),
    crumbs: [
      { name: "LLMScale", file: "" },
      { name: P.section.gpus, file: GPUS_HUB },
      { name: g.name },
    ],
    body,
    ld: { "@context": "https://schema.org", "@type": "TechArticle", headline: T.h1(g.name), inLanguage: LANG_META[lang].hreflang, url: url(lang, file), about: g.name, isPartOf: { "@type": "WebSite", name: "LLMScale", url: url(lang) }, author: { "@type": "Person", name: "Tahir Ali Cengiz", url: "https://github.com/tahircengiz" } },
  });
}

// ── hubs ──────────────────────────────────────────────────────────────────────
function modelsHub(lang: Lang): string {
  const P = PAGE_TEXT[lang];
  const T = P.hubs.models;
  const rows = MODELS.map((m) => {
    const ctx = refCtx(m);
    return `<tr><th scope="row">${modelLink(lang, m)}</th><td>${params(lang, m.numParams)}${m.isMoE && m.activeParams ? `<small>${params(lang, m.activeParams)} ${T.active}</small>` : ""}</td><td>${gib(lang, size(m, "bf16", ctx).totalGiB)}</td><td>${gib(lang, size(m, "int4", ctx).totalGiB)}</td><td>${ctxK(m.maxContext ?? ctx)}</td></tr>`;
  }).join("");
  const body = `<p class="lede">${T.lede(MODELS.length)}</p>
<div class="scroll"><table>
<thead><tr><th scope="col">Model</th><th scope="col">${T.thParams}</th><th scope="col">BF16 · 8k</th><th scope="col">INT4 · 8k</th><th scope="col">${T.thMaxContext}</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="note">${T.note}</p>
<ul class="links"><li><a class="primary" href="${href(lang)}">${T.links.size}</a></li><li><a href="${href(lang, GPUS_HUB)}">${T.links.byGpu}</a></li><li><a href="${href(lang, CONCEPTS_HUB)}">${T.links.memory}</a></li></ul>`;
  return page({
    lang,
    file: MODELS_HUB,
    section: "models",
    title: T.title,
    description: T.description(MODELS.length),
    h1: T.h1,
    crumbs: [{ name: "LLMScale", file: "" }, { name: P.section.models }],
    body,
    ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: T.h1, inLanguage: LANG_META[lang].hreflang, url: url(lang, MODELS_HUB), hasPart: MODELS.map((m) => ({ "@type": "TechArticle", headline: m.displayName, url: url(lang, modelPageFile(m.id)) })) },
  });
}

function gpusHub(lang: Lang): string {
  const P = PAGE_TEXT[lang];
  const T = P.hubs.gpus;
  const rows = FEATURED.map((g) => {
    const usable = usableGiB(g);
    const n = (d: Dtype) => KNOWN_MODELS.filter((m) => size(m, d, refCtx(m), 1, g).totalGiB <= usable).length;
    return `<tr><th scope="row">${gpuLink(lang, g)}</th><td>${esc(DICTS[lang][`cat.${g.category}`] ?? g.category)}</td><td>${gib(lang, usable)}</td><td>${n("bf16")}</td><td>${n("int4")}</td></tr>`;
  }).join("");
  const body = `<p class="lede">${T.lede({ models: KNOWN_MODELS.length, gpus: FEATURED.length })}</p>
<div class="scroll"><table>
<thead><tr><th scope="col">GPU</th><th scope="col">${T.thType}</th><th scope="col">${T.thUsable}</th><th scope="col">${T.thBf16}</th><th scope="col">${T.thInt4}</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="note">${T.note(KNOWN_MODELS.length)}</p>
<ul class="links"><li><a class="primary" href="${href(lang)}">${T.links.size}</a></li><li><a href="${href(lang, MODELS_HUB)}">${T.links.byModel}</a></li><li><a href="${href(lang, CONCEPTS_HUB)}">${T.links.memory}</a></li></ul>`;
  return page({
    lang,
    file: GPUS_HUB,
    section: "gpus",
    title: T.title,
    description: T.description,
    h1: T.h1,
    crumbs: [{ name: "LLMScale", file: "" }, { name: P.section.gpus }],
    body,
    ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: T.h1, inLanguage: LANG_META[lang].hreflang, url: url(lang, GPUS_HUB), hasPart: FEATURED.map((g) => ({ "@type": "TechArticle", headline: g.name, url: url(lang, gpuPageFile(g.id)) })) },
  });
}

// ── concept guides ────────────────────────────────────────────────────────────
const fmt = (lang: Lang): Fmt => ({
  lang,
  gib: (n) => gib(lang, n),
  int: (n) => int(lang, n),
  params: (n) => params(lang, n),
  ratio: (r) => ratio(lang, r),
  dec: (s) => dec(lang, s),
  href: (file = "") => href(lang, file),
  modelLink: (id) => {
    const m = KNOWN_MODELS.find((x) => x.id === id);
    if (!m) throw new Error(`no bundled model ${id}`);
    return modelLink(lang, m);
  },
  gpuLink: (id) => gpuLink(lang, gpu(id)),
});

function conceptPage(lang: Lang, c: Concept): string {
  return page({
    lang,
    file: c.file,
    section: "concepts",
    title: c.title,
    description: c.description,
    h1: c.h1,
    crumbs: [{ name: "LLMScale", file: "" }, { name: PAGE_TEXT[lang].section.concepts, file: CONCEPTS_HUB }, { name: c.crumb }],
    body: c.body,
    ld: { "@context": "https://schema.org", "@type": "TechArticle", headline: c.h1, description: c.description, inLanguage: LANG_META[lang].hreflang, url: url(lang, c.file), isPartOf: { "@type": "WebSite", name: "LLMScale", url: url(lang) }, author: { "@type": "Person", name: "Tahir Ali Cengiz", url: "https://github.com/tahircengiz" } },
  });
}

function conceptsHub(lang: Lang): string {
  const P = PAGE_TEXT[lang];
  const T = P.hubs.concepts;
  const concepts = CONCEPTS.map((build) => build(fmt(lang)));
  const body = `<p class="lede">${T.lede}</p>
${concepts.map((c) => `<h2><a href="${href(lang, c.file)}">${esc(c.h1)}</a></h2>\n<p>${esc(c.summary)}</p>`).join("\n")}
<ul class="links"><li><a class="primary" href="${href(lang)}">${T.links.calculator}</a></li><li><a href="${href(lang, MODELS_HUB)}">${T.links.byModel}</a></li><li><a href="${href(lang, GPUS_HUB)}">${T.links.byGpu}</a></li></ul>`;
  return page({
    lang,
    file: CONCEPTS_HUB,
    section: "concepts",
    title: T.title,
    description: T.description,
    h1: T.h1,
    crumbs: [{ name: "LLMScale", file: "" }, { name: P.section.concepts }],
    body,
    ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: T.h1, inLanguage: LANG_META[lang].hreflang, url: url(lang, CONCEPTS_HUB), hasPart: concepts.map((c) => ({ "@type": "TechArticle", headline: c.h1, url: url(lang, c.file) })) },
  });
}

// ── write ─────────────────────────────────────────────────────────────────────
const written: { path: string; words: number }[] = [];
function write(lang: Lang, file: string, html: string) {
  const rel = `${LANG_META[lang].prefix}${file.endsWith("/") ? `${file}index.html` : file}`;
  const path = join(outDir, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
  written.push({ path: rel, words: words(html.slice(html.indexOf("<body"))) });
}
for (const lang of ENABLED_LANGS) {
  for (const m of KNOWN_MODELS) write(lang, modelPageFile(m.id), modelPage(lang, m));
  for (const g of FEATURED) write(lang, gpuPageFile(g.id), gpuPage(lang, g));
  write(lang, MODELS_HUB, modelsHub(lang));
  write(lang, GPUS_HUB, gpusHub(lang));
  for (const build of CONCEPTS) {
    const c = build(fmt(lang));
    write(lang, c.file, conceptPage(lang, c));
  }
  write(lang, CONCEPTS_HUB, conceptsHub(lang));
}
const fewest = [...written].sort((a, b) => a.words - b.words)[0];
console.log(`ok    ${written.length} guide pages (${KNOWN_MODELS.length} models, ${FEATURED.length} GPUs, ${CONCEPTS.length} concepts, 3 hubs, × ${ENABLED_LANGS.length} languages); fewest words: ${fewest.path} ${fewest.words}`);
