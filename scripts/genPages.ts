// Builds the static guides: a page per preset model and per featured GPU, in
// English and Turkish, and a hub page listing each set.
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

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  calculate,
  kvBytesPerToken,
  maxConcurrency,
  maxContextLength,
  usesMla,
  type Dtype,
  type ModelArch,
} from "../src/lib/calc.ts";
import { KNOWN_MODELS, type KnownModel } from "../src/lib/models.ts";
import { GPUS, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import { estimateTraining, type TrainMode } from "../src/lib/train.ts";
import { DEFAULT_STATE } from "../src/lib/urlState.ts";
import { DICTS, type Lang } from "../src/lib/dict.ts";
import { formatGiB, formatParams } from "../src/lib/format.ts";
import { LANG_NAME, SUGGEST } from "../src/lib/langPath.ts";
import { FEATURED_GPU_IDS, GPUS_HUB, MODELS_HUB, gpuPageFile, modelPageFile } from "../src/lib/staticPages.ts";

const outDir = process.argv[2] ?? "dist";
const LANGS: Lang[] = ["en", "tr"];

// ── the site, as built ────────────────────────────────────────────────────────
const index = readFileSync(join(outDir, "index.html"), "utf8");
const HOME = index.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const BASE = index.match(/src="([^"]*)assets\//)?.[1];
const TRACKER = index.match(/<script defer src="https:\/\/stats\.delix\.dev\/u\.js"[^>]*><\/script>/)?.[0];
if (!HOME || BASE === undefined || !TRACKER) throw new Error(`${outDir}/index.html: no canonical, base path or analytics tag to copy`);
// An ungated tag reports from wherever the file loads (see test-invariants.ts).
if (!TRACKER.includes("data-domains=")) throw new Error("the analytics tag is not gated to the live host");

// ── formatting ────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Build-time output formats explicitly: the build machine's locale must not leak
// into a page (it once rendered 131072 as "131.072" on an English one).
const dec = (lang: Lang, s: string) => (lang === "tr" ? s.replace(/(\d)\.(\d)/g, "$1,$2") : s);
const gib = (lang: Lang, n: number) => dec(lang, formatGiB(n));
const int = (lang: Lang, n: number) => n.toLocaleString(lang === "tr" ? "tr-TR" : "en-US");
const params = (lang: Lang, n: number) => dec(lang, formatParams(n));
const ratio = (lang: Lang, r: number) => `${dec(lang, String(Math.round(r * 10) / 10))}×`;
const ctxK = (c: number) => `${c % 1000 === 0 ? c / 1000 : Math.round(c / 1024)}k`;
const words = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;
const other = (lang: Lang): Lang => (lang === "tr" ? "en" : "tr");
const href = (lang: Lang, file = "") => `${BASE}${lang === "tr" ? "tr/" : ""}${file}`;
const url = (lang: Lang, file = "") => `${HOME}${lang === "tr" ? "tr/" : ""}${file}`;

// ── the engine, at the calculator's own defaults ─────────────────────────────
const WORK = { kvDtype: "fp16" as Dtype, overheadPct: DEFAULT_STATE.overheadPct, cudaContextGiB: DEFAULT_STATE.cudaContextGiB };
const PRECISIONS: Dtype[] = ["bf16", "fp8", "int4"];
// The engine's labels spell out the bytes ("BF16 (2 bytes)"); a table column only needs the name.
const LABEL: Record<string, string> = { bf16: "BF16", fp8: "FP8", int4: "INT4" };
const size = (m: ModelArch, weightDtype: Dtype, contextLength: number, concurrency = 1) =>
  calculate({ arch: m, weightDtype, contextLength, concurrency, ...WORK });
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

// ── the page around the content ───────────────────────────────────────────────
const DARK = "--bg:#090b10;--card:#14171f;--inset:#1b1f2a;--line:#2a303c;--text:#e7e9ef;--muted:#c3c8d4;--faint:#a1a8b8;--brand:#9698f7;--good:#00e096;--bad:#fda4af;color-scheme:dark";
const CSS = `
:root{--bg:#eef1f8;--card:#fff;--inset:#f4f6fb;--line:#dce1ee;--text:#151d48;--muted:#39405c;--faint:#555b73;--brand:#4a4cd4;--good:#0b7d57;--bad:#b3123c;--button:#4a4cd4;color-scheme:light}
:root[data-theme=dark]{${DARK}}
@media (prefers-color-scheme:dark){:root:not([data-theme]){${DARK}}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:400 1rem/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:54rem;margin:0 auto;padding-inline:1.25rem}
a{color:var(--brand);text-underline-offset:2px}
a:focus-visible,button:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:4px}
.top{background:var(--card);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.4rem 1.25rem;padding-block:.65rem}
.brand{display:inline-flex;align-items:center;gap:.5rem;font-weight:700;color:var(--text);text-decoration:none}
.top nav{display:flex;flex-wrap:wrap;gap:.2rem 1rem;font-size:.875rem}
.top nav a{color:var(--muted);text-decoration:none}
.top nav a:hover,.top nav a[aria-current=page]{color:var(--brand)}
main{padding-block:1.5rem 3rem}
.crumbs{font-size:.8125rem;color:var(--faint);margin:0 0 .6rem}
.crumbs a{color:var(--faint)}
h1{font-size:clamp(1.55rem,4vw,2.1rem);line-height:1.15;letter-spacing:-.015em;margin:0 0 .75rem;text-wrap:balance}
h2{font-size:1.15rem;line-height:1.3;letter-spacing:-.01em;margin:2.25rem 0 .6rem;text-wrap:balance}
p{margin:0 0 .9rem;max-width:68ch}
.lede{color:var(--muted)}
.answer{background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:1.1rem 1.25rem;margin:1.25rem 0}
.cap{font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;color:var(--faint)}
.big{font-size:2.1rem;font-weight:700;line-height:1.1;margin:.25rem 0 .45rem;font-variant-numeric:tabular-nums}
.answer p{margin:0;color:var(--muted);font-size:.9375rem}
.spec{display:flex;flex-wrap:wrap;gap:.4rem;list-style:none;padding:0;margin:.85rem 0 0}
.spec li{background:var(--inset);border:1px solid var(--line);border-radius:999px;padding:.05rem .6rem;font-size:.75rem;color:var(--muted)}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:.75rem;background:var(--card)}
table{border-collapse:collapse;width:100%;font-size:.875rem;font-variant-numeric:tabular-nums}
th,td{text-align:left;padding:.5rem .75rem;border-bottom:1px solid var(--line);vertical-align:top;white-space:nowrap}
tbody tr:last-child>*{border-bottom:0}
thead th{background:var(--inset);font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);font-weight:600}
th[scope=row]{font-weight:600}
td small{display:block;color:var(--faint);font-size:.75rem}
.ok{color:var(--good);font-weight:600}
.no{color:var(--bad)}
.note{font-size:.8125rem;color:var(--faint);margin-top:.6rem}
ul.plain{padding-left:1.1rem;margin:0 0 .9rem}
ul.plain li{margin:.3rem 0}
.links{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;padding:0;margin:.4rem 0 0}
.links a{display:inline-block;background:var(--card);border:1px solid var(--line);border-radius:.6rem;padding:.35rem .75rem;text-decoration:none;font-size:.875rem}
.links a.primary{background:var(--button,#4a4cd4);border-color:transparent;color:#fff}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85em;background:var(--inset);padding:.05em .35em;border-radius:4px}
footer{border-top:1px solid var(--line);padding-block:1.25rem 5rem;font-size:.8125rem;color:var(--faint)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.langsuggest{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .75rem;width:max-content;max-width:calc(100vw - 2rem);background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:.5rem .55rem .5rem 1rem;box-shadow:0 10px 30px rgb(0 0 0/.2);font-size:.875rem;color:var(--muted)}
.langsuggest a{background:#4a4cd4;color:#fff;border-radius:.5rem;padding:.2rem .7rem;text-decoration:none;font-weight:500}
.langsuggest button{background:none;border:0;color:var(--faint);cursor:pointer;padding:.2rem .5rem;border-radius:.5rem;font-size:1rem}
`.trim();

// The app's theme choice, read the same way the app's bootstrap does: a stored
// choice, else dark when the OS asks for it. Glass and light both read as light here.
const THEME_BOOT = `try{var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="light"&&t!=="glass")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"glass";document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}`;

/** The same offer as the app's LangSuggest: shown only when the visitor prefers
 *  the other language, never a redirect, and remembered either way. */
function suggestScript(lang: Lang, file: string): string {
  const o = other(lang);
  const data = JSON.stringify({ L: lang, O: o, S: SUGGEST[o], H: href(o, file) }).replace(/</g, "\\u003c");
  return `(function(d){var p=null;try{p=localStorage.getItem("lang")}catch(e){}if(p!=="en"&&p!=="tr")p=/^tr/.test(navigator.language||"")?"tr":"en";if(p===d.L)return;var b=document.createElement("div");b.className="langsuggest";b.lang=d.O;b.setAttribute("role","region");b.setAttribute("aria-label",d.S.text);var s=document.createElement("span");s.textContent=d.S.text;var a=document.createElement("a");a.href=d.H;a.hreflang=d.O;a.textContent=d.S.go;a.onclick=function(){try{localStorage.setItem("lang",d.O)}catch(e){}};var c=document.createElement("button");c.type="button";c.textContent="\\u2715";c.setAttribute("aria-label",d.S.dismiss);c.onclick=function(){try{localStorage.setItem("lang",d.L)}catch(e){}b.remove()};b.append(s,a,c);document.body.appendChild(b)})(${data});`;
}

const CHROME = {
  en: { nav: "Site", calc: "VRAM calculator", models: "Models", gpus: "GPUs", crumbs: "Breadcrumb", footer: "LLMScale works out the GPU memory an LLM needs — weights, KV cache, context and concurrent users — in your browser, from each model's own architecture." },
  tr: { nav: "Site", calc: "VRAM hesaplayıcı", models: "Modeller", gpus: "GPU'lar", crumbs: "Konum", footer: "LLMScale bir LLM'in ihtiyaç duyduğu GPU belleğini — ağırlıklar, KV cache, context ve eşzamanlı kullanıcılar — her modelin kendi mimarisinden, tarayıcında hesaplar." },
};

interface PageSpec {
  lang: Lang;
  file: string;
  section: "models" | "gpus";
  title: string;
  description: string;
  h1: string;
  crumbs: { name: string; file?: string }[];
  body: string;
  ld: object;
}

function page(p: PageSpec): string {
  const c = CHROME[p.lang];
  const o = other(p.lang);
  // Titles are cut around 60 characters in results; the brand goes first when one
  // runs long, since the words people searched for are the part worth keeping.
  const title = [...`${p.title} | LLMScale`].length <= 60 ? `${p.title} | LLMScale` : p.title;
  if ([...title].length > 60) throw new Error(`${p.lang}/${p.file}: title over 60 characters: ${title}`);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: p.crumbs.map((cr, i) => ({ "@type": "ListItem", position: i + 1, name: cr.name, item: url(p.lang, cr.file ?? p.file) })),
  };
  const ld = [breadcrumb, p.ld].map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, "\\u003c")}</script>`).join("\n");
  const current = (s: string) => (p.section === s ? ' aria-current="page"' : "");

  return `<!doctype html>
<html lang="${p.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url(p.lang, p.file)}">
<link rel="alternate" hreflang="en" href="${url("en", p.file)}">
<link rel="alternate" hreflang="tr" href="${url("tr", p.file)}">
<link rel="alternate" hreflang="x-default" href="${url("en", p.file)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="Tahir Cengiz">
<link rel="icon" type="image/svg+xml" href="${BASE}favicon.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.h1)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url(p.lang, p.file)}">
<meta property="og:site_name" content="LLMScale">
<meta property="og:image" content="${HOME}og.png">
<meta property="og:locale" content="${p.lang === "tr" ? "tr_TR" : "en_US"}">
<meta property="og:locale:alternate" content="${p.lang === "tr" ? "en_US" : "tr_TR"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.h1)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${HOME}og.png">
<script>${THEME_BOOT}</script>
${TRACKER}
<style>${CSS}</style>
${ld}
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="${href(p.lang)}"><img src="${BASE}favicon.svg" alt="" width="24" height="24">LLMScale</a>
  <nav aria-label="${c.nav}">
    <a href="${href(p.lang)}">${c.calc}</a>
    <a href="${href(p.lang, MODELS_HUB)}"${current("models")}>${c.models}</a>
    <a href="${href(p.lang, GPUS_HUB)}"${current("gpus")}>${c.gpus}</a>
    <a href="${href(o, p.file)}" hreflang="${o}" lang="${o}" onclick="try{localStorage.setItem('lang','${o}')}catch(e){}">${LANG_NAME[o]}</a>
  </nav>
</div></header>
<main class="wrap">
  <nav class="crumbs" aria-label="${c.crumbs}">${p.crumbs
    .map((cr, i) => (i < p.crumbs.length - 1 ? `<a href="${href(p.lang, cr.file)}">${esc(cr.name)}</a> › ` : esc(cr.name)))
    .join("")}</nav>
  <h1>${esc(p.h1)}</h1>
${p.body}
</main>
<footer class="wrap">${c.footer}</footer>
<script>${suggestScript(p.lang, p.file)}</script>
</body>
</html>
`;
}

// ── model pages ───────────────────────────────────────────────────────────────
function attentionSentence(lang: Lang, m: KnownModel): string {
  const a = m.numAttentionHeads;
  const k = m.numKeyValueHeads;
  if (usesMla(m)) {
    const plain = kvBytesPerToken({ ...m, kvLoraRank: undefined, qkRopeHeadDim: undefined }, "fp16") / kvBytesPerToken(m, "fp16");
    const d = (m.kvLoraRank ?? 0) + (m.qkRopeHeadDim ?? 0);
    return lang === "en"
      ? `It uses multi-head latent attention (MLA): each layer caches one compressed ${d}-dimensional latent per token instead of keys and values for every head, which makes its KV cache ${ratio(lang, plain)} smaller than the usual formula would give.`
      : `Multi-head latent attention (MLA) kullanır: her katman, her head için key ve value yerine token başına ${d} boyutlu tek bir sıkıştırılmış latent saklar; bu da KV cache'ini alışılmış formülün vereceğinden ${ratio(lang, plain)} küçük yapar.`;
  }
  if (k === 1) {
    return lang === "en"
      ? `It uses multi-query attention: all ${a} query heads share a single key-value head, so its KV cache is ${a}× smaller than full multi-head attention would need.`
      : `Multi-query attention kullanır: ${a} query head'in hepsi tek bir key-value head'i paylaşır; bu yüzden KV cache'i tam multi-head attention'a göre ${a} kat küçüktür.`;
  }
  if (k < a) {
    return lang === "en"
      ? `It uses grouped-query attention: ${a} query heads share ${k} key-value heads, so its KV cache is ${ratio(lang, a / k)} smaller than full multi-head attention would need.`
      : `Grouped-query attention kullanır: ${a} query head, ${k} key-value head'i paylaşır; bu yüzden KV cache'i tam multi-head attention'a göre ${ratio(lang, a / k)} küçüktür.`;
  }
  return lang === "en"
    ? `It uses full multi-head attention: each of its ${a} heads keeps its own keys and values, so the KV cache is as large as its head count makes it.`
    : `Tam multi-head attention kullanır: ${a} head'in her biri kendi key ve value'larını tutar, bu yüzden KV cache'i head sayısının gerektirdiği kadar büyüktür.`;
}

function modelPage(lang: Lang, m: KnownModel): string {
  const en = lang === "en";
  const file = modelPageFile(m.id);
  const ctx = refCtx(m);
  const bf16 = size(m, "bf16", ctx);
  const int4 = size(m, "int4", ctx);
  const max = m.maxContext ?? ctx;
  const kvAtMax = size(m, "bf16", max).kvCacheGiB;
  const contexts = contextsFor(m);
  const name = m.displayName;

  const lede = [
    en ? `${name} has ${params(lang, m.numParams)} parameters in ${m.numLayers} layers.` : `${name}, ${m.numLayers} katmanda ${params(lang, m.numParams)} parametreye sahiptir.`,
    attentionSentence(lang, m),
    m.isMoE && m.activeParams
      ? en
        ? `It is a Mixture-of-Experts model with about ${params(lang, m.activeParams)} of its ${params(lang, m.numParams)} parameters active per token: memory has to hold all of them, while each token passes through only the active share.`
        : `Mixture-of-Experts modelidir: toplam ${params(lang, m.numParams)} parametrenin token başına yaklaşık ${params(lang, m.activeParams)} kadarı aktiftir; bellek hepsini tutmak zorundadır, her token ise yalnızca aktif kısımdan geçer.`
      : "",
    en
      ? `It takes up to ${int(lang, max)} tokens of context; one user at that length needs ${gib(lang, kvAtMax)} of KV cache at FP16 on top of the weights.`
      : `En fazla ${int(lang, max)} token context alır; bu uzunlukta tek bir kullanıcı, ağırlıkların üstüne FP16'da ${gib(lang, kvAtMax)} KV cache ister.`,
    m.gated
      ? en
        ? "Its repository is gated on Hugging Face, so LLMScale ships its architecture in a bundled database."
        : "Hugging Face deposu erişim onayı gerektirdiği için LLMScale mimarisini yerleşik veritabanında taşır."
      : "",
  ].filter(Boolean).join(" ");

  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">${en ? "Precision" : "Hassasiyet"}</th>${contexts.map((c) => `<th scope="col">${ctxK(c)} context</th>`).join("")}</tr></thead>
<tbody>${PRECISIONS.map((d) => `<tr><th scope="row">${LABEL[d]}</th>${contexts
    .map((c) => {
      const r = size(m, d, c);
      return `<td>${gib(lang, r.totalGiB)}<small>${en ? "KV cache" : "KV cache"} ${gib(lang, r.kvCacheGiB)}</small></td>`;
    })
    .join("")}</tr>`).join("")}</tbody>
</table></div>
<p class="note">${en
    ? "One user, FP16 KV cache, 10% activation overhead and 0.75 GiB of CUDA context. Quantizing shrinks the weights, not the KV cache, so the saving narrows as the context grows."
    : "Tek kullanıcı, FP16 KV cache, %10 aktivasyon payı ve 0,75 GiB CUDA context. Quantization ağırlıkları küçültür, KV cache'i değil; bu yüzden context büyüdükçe kazanç daralır."}</p>`;

  const fitItems = PRECISIONS.map((d) => {
    const need = size(m, d, ctx).totalGiB;
    const holding = ALL_BY_SIZE.filter((g) => need <= usableGiB(g)).slice(0, 4);
    const label = `<strong>${LABEL[d]}</strong> (${gib(lang, need)})`;
    if (holding.length) return `<li>${label}: ${holding.map((g) => gpuLink(lang, g)).join(", ")}</li>`;
    const counts = MULTI_CARDS.map((g) => `${Math.ceil(need / usableGiB(g))}× ${gpuLink(lang, g)}`).join(en ? ", " : ", ");
    return `<li>${label}: ${en ? `no single GPU holds it — by memory it takes ${counts}.` : `tek bir GPU'ya sığmaz — bellek olarak ${counts} gerekir.`}</li>`;
  }).join("");

  const users = USER_CARDS.map((g) => ({
    g,
    n: PRECISIONS.map((d) => maxConcurrency({ arch: m, weightDtype: d, contextLength: ctx, ...WORK }, usableGiB(g))),
  }));
  const anyUsers = users.some((u) => u.n.some((x) => x > 0));
  const usersBlock = anyUsers
    ? `<div class="scroll"><table>
<thead><tr><th scope="col">GPU</th>${PRECISIONS.map((d) => `<th scope="col">${LABEL[d]}</th>`).join("")}</tr></thead>
<tbody>${users.map((u) => `<tr><th scope="row">${gpuLink(lang, u.g)}</th>${u.n
        .map((x) => (x > 0 ? `<td>${int(lang, x)}</td>` : `<td><span class="no" aria-hidden="true">✗</span><span class="sr">${en ? "does not fit" : "sığmaz"}</span></td>`))
        .join("")}</tr>`).join("")}</tbody>
</table></div>
<p class="note">${en
        ? `Users at ${ctxK(ctx)} context each, on one card. ✗: the weights leave no room for even one.`
        : `Kullanıcı başına ${ctxK(ctx)} context ile, tek kartta. ✗: ağırlıklar tek bir kullanıcıya bile yer bırakmıyor.`}</p>`
    : `<p>${en ? "No single card here holds it at any precision; serving it means splitting it across several GPUs with tensor parallelism." : "Buradaki hiçbir kart onu herhangi bir hassasiyette tek başına taşıyamaz; servis etmek, tensor parallel ile birden çok GPU'ya bölmek demektir."}</p>`;

  const modes: { mode: TrainMode; en: string; tr: string }[] = [
    { mode: "full", en: "Full fine-tune", tr: "Tam ince ayar" },
    { mode: "lora", en: "LoRA (rank 16, attention)", tr: "LoRA (rank 16, attention)" },
    { mode: "qlora", en: "QLoRA (rank 16, attention)", tr: "QLoRA (rank 16, attention)" },
  ];
  const trainRows = modes.map(({ mode, ...label }) => {
    const r = estimateTraining({ arch: m, mode, batchSize: 1, seqLength: 2048, gradientCheckpointing: true, loraRank: 16, loraTarget: "attn", overheadGiB: 1 });
    const g = ALL_BY_SIZE.find((x) => r.totalGiB <= usableGiB(x));
    return `<tr><th scope="row">${label[lang]}</th><td>${gib(lang, r.totalGiB)}</td><td>${g ? gpuLink(lang, g) : en ? "several GPUs, sharded" : "birden çok GPU, paylaştırılmış"}</td></tr>`;
  }).join("");

  const kib = dec(lang, (kvBytesPerToken(m, "fp16") / 1024).toFixed(1));
  const kvFormula = usesMla(m)
    ? en ? "With MLA the KV cache is <code>layers × (kv_lora_rank + qk_rope_head_dim) × bytes × context × users</code>." : "MLA'da KV cache <code>katman × (kv_lora_rank + qk_rope_head_dim) × byte × context × kullanıcı</code> olur."
    : en ? "The KV cache is <code>2 × layers × key-value heads × head dimension × bytes × context × users</code>." : "KV cache <code>2 × katman × key-value head × head boyutu × byte × context × kullanıcı</code> olur.";
  const q = `?m=${encodeURIComponent(m.hfId)}`;
  const family = MODELS.filter((x) => x.family === m.family && x.id !== m.id);

  const body = `<p class="lede">${lede}</p>
<div class="answer">
  <div class="cap">BF16 · ${ctxK(ctx)} context · ${en ? "one user" : "tek kullanıcı"}</div>
  <div class="big">${gib(lang, bf16.totalGiB)}</div>
  <p>${en
      ? `${gib(lang, bf16.weightsGiB)} of weights, ${gib(lang, bf16.kvCacheGiB)} of KV cache and ${gib(lang, bf16.activationsGiB + bf16.cudaOverheadGiB)} of activations and CUDA context. At INT4 the same workload needs ${gib(lang, int4.totalGiB)}.`
      : `${gib(lang, bf16.weightsGiB)} ağırlık, ${gib(lang, bf16.kvCacheGiB)} KV cache ve ${gib(lang, bf16.activationsGiB + bf16.cudaOverheadGiB)} aktivasyon ile CUDA context. Aynı iş yükü INT4'te ${gib(lang, int4.totalGiB)} ister.`}</p>
  <ul class="spec"><li>${m.numLayers} ${en ? "layers" : "katman"}</li><li>hidden ${m.hiddenSize}</li><li>${m.numAttentionHeads}/${m.numKeyValueHeads} heads</li><li>head_dim ${bf16.headDim}</li><li>${ctxK(max)} ${en ? "max context" : "maks context"}</li>${m.isMoE ? "<li>MoE</li>" : ""}${usesMla(m) ? "<li>MLA</li>" : ""}</ul>
</div>
<h2>${en ? `${name} memory by precision and context` : `Hassasiyet ve context'e göre ${name} belleği`}</h2>
${table}
<h2>${en ? "Which single GPUs hold it" : "Onu tek başına taşıyan GPU'lar"}</h2>
<ul class="plain">${fitItems}</ul>
<p class="note">${en
      ? `At ${ctxK(ctx)} context for one user, the smallest cards first. A discrete card is budgeted at 95% of its memory; a unified-memory device at the share its GPU can address.`
      : `${ctxK(ctx)} context ve tek kullanıcı için, en küçük kartlar önce. Ayrık kartlarda belleğin %95'i, unified bellekli cihazlarda GPU'nun kullanabildiği pay hesaba katılır.`}</p>
<h2>${en ? "How many users fit" : "Kaç kullanıcı sığar"}</h2>
${usersBlock}
<h2>${en ? `Fine-tuning ${name}` : `${name} ince ayarı`}</h2>
<div class="scroll"><table>
<thead><tr><th scope="col">${en ? "Method" : "Yöntem"}</th><th scope="col">${en ? "Memory" : "Bellek"}</th><th scope="col">${en ? "Smallest GPU" : "En küçük GPU"}</th></tr></thead>
<tbody>${trainRows}</tbody>
</table></div>
<p class="note">${en
      ? "Sequence length 2,048, batch size 1, gradient checkpointing on, Adam. Full fine-tuning keeps 16 bytes per parameter before activations; QLoRA stores the frozen base in 4-bit NF4."
      : "Dizi uzunluğu 2.048, batch 1, gradient checkpointing açık, Adam. Tam ince ayar aktivasyonlardan önce parametre başına 16 byte tutar; QLoRA dondurulmuş temel modeli 4-bit NF4 olarak saklar."}</p>
<h2>${en ? "Where the numbers come from" : "Sayılar nereden geliyor"}</h2>
<p>${en
      ? `Weights are <code>parameters × bytes per parameter</code>. ${kvFormula} For ${esc(name)} that is ${kib} KiB per token at FP16. These are capacity-planning figures: the serving engine — vLLM, TGI, llama.cpp — and its paged-attention efficiency still move the real number.`
      : `Ağırlıklar <code>parametre × parametre başına byte</code> olur. ${kvFormula} ${esc(name)} için bu, FP16'da token başına ${kib} KiB eder. Bunlar kapasite planlama sayılarıdır: servis motoru — vLLM, TGI, llama.cpp — ve paged-attention verimliliği gerçek değeri yine değiştirir.`}</p>
<h2>${en ? `Work with ${name}` : `${name} ile çalış`}</h2>
<ul class="links">
  <li><a class="primary" href="${href(lang)}${q}">${en ? "Size it for your workload" : "Kendi iş yüküne göre hesapla"}</a></li>
  <li><a href="${href(lang, "train.html")}${q}">${en ? "Fine-tuning memory" : "İnce ayar belleği"}</a></li>
  <li><a href="${href(lang, "vllm.html")}${q}">${en ? "vLLM parameters" : "vLLM parametreleri"}</a></li>
  <li><a href="${href(lang, "anatomy.html")}${q}">${en ? "Model anatomy" : "Model anatomisi"}</a></li>
</ul>
${family.length ? `<h2>${en ? `Other ${m.family} models` : `Diğer ${m.family} modelleri`}</h2>
<ul class="links">${family.map((x) => `<li>${modelLink(lang, x)}</li>`).join("")}</ul>` : ""}`;

  return page({
    lang,
    file,
    section: "models",
    title: en ? `${name} VRAM Requirements` : `${name} Kaç GB VRAM İster?`,
    description: en
      ? `${name} needs ${gib(lang, bf16.totalGiB)} of GPU memory at BF16 and ${gib(lang, int4.totalGiB)} at INT4 for one user at ${ctxK(ctx)} context. Memory by precision and context, the GPUs that hold it, concurrent users and fine-tuning memory.`
      : `${name}, ${ctxK(ctx)} context'te tek kullanıcı için BF16'da ${gib(lang, bf16.totalGiB)}, INT4'te ${gib(lang, int4.totalGiB)} GPU belleği ister. Hassasiyet ve context'e göre bellek, onu taşıyan GPU'lar, eşzamanlı kullanıcılar ve ince ayar belleği.`,
    h1: en ? `${name}: how much VRAM does it need?` : `${name} kaç GB VRAM ister?`,
    crumbs: [
      { name: "LLMScale", file: "" },
      { name: en ? "Models" : "Modeller", file: MODELS_HUB },
      { name },
    ],
    body,
    ld: { "@context": "https://schema.org", "@type": "TechArticle", headline: en ? `${name}: how much VRAM does it need?` : `${name} kaç GB VRAM ister?`, inLanguage: lang, url: url(lang, file), about: name, isPartOf: { "@type": "WebSite", name: "LLMScale", url: url(lang) }, author: { "@type": "Person", name: "Tahir Cengiz", url: "https://github.com/tahircengiz" } },
  });
}

// ── GPU pages ─────────────────────────────────────────────────────────────────
function gpuPage(lang: Lang, g: Gpu): string {
  const en = lang === "en";
  const file = gpuPageFile(g.id);
  const usable = usableGiB(g);
  const rows = [...KNOWN_MODELS].sort((a, b) => a.numParams - b.numParams).map((m) => {
    const ctx = refCtx(m);
    const need = PRECISIONS.map((d) => size(m, d, ctx).totalGiB);
    const best = PRECISIONS.findIndex((_, i) => need[i] <= usable);
    return { m, ctx, need, best };
  });
  const count = (i: number) => rows.filter((r) => r.need[i] <= usable).length;

  const lede = [
    g.unified && g.totalGiB
      ? en
        ? `${g.name} shares ${g.totalGiB} GB of memory between CPU and GPU; by default the GPU can address about ${g.vramGiB} GB of it, and that is the budget used here.`
        : `${g.name}, ${g.totalGiB} GB belleği CPU ve GPU arasında paylaşır; GPU varsayılan olarak bunun yaklaşık ${g.vramGiB} GB'ını kullanabilir ve buradaki hesaplar bu payla yapılır.`
      : en
        ? `${g.name} has ${g.vramGiB} GB of memory. LLMScale budgets ${gib(lang, usable)} of it for a model, leaving 5% for the driver.`
        : `${g.name} ${g.vramGiB} GB belleğe sahiptir. LLMScale sürücü payı olarak %5 bırakıp modele ${gib(lang, usable)} ayırır.`,
    g.bandwidthGBs
      ? en
        ? `Its memory bandwidth, ${int(lang, g.bandwidthGBs)} GB/s, is what limits generation speed once a model fits.`
        : `Bellek bant genişliği ${int(lang, g.bandwidthGBs)} GB/sn'dir; bir model sığdıktan sonra üretim hızını sınırlayan budur.`
      : "",
    g.vendor === "Apple"
      ? en ? "vLLM has no Metal backend, so models run on it with llama.cpp or MLX." : "vLLM'in Metal arka ucu olmadığı için modeller bu cihazda llama.cpp ya da MLX ile çalışır."
      : "",
    en
      ? `Of the ${rows.length} popular open models below, ${count(0)} fit at BF16, ${count(1)} at FP8 and ${count(2)} at INT4 with an 8k context for one user.`
      : `Aşağıdaki ${rows.length} popüler açık modelden ${count(0)} tanesi BF16'da, ${count(1)} tanesi FP8'de, ${count(2)} tanesi INT4'te 8k context ve tek kullanıcıyla sığar.`,
  ].filter(Boolean).join(" ");

  const cell = (fitsHere: boolean, v: number) =>
    fitsHere ? `<td class="ok">${gib(lang, v)}</td>` : `<td><span class="no">${gib(lang, v)}</span><span class="sr">${en ? " (does not fit)" : " (sığmaz)"}</span></td>`;
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">${en ? "Model" : "Model"}</th>${PRECISIONS.map((d) => `<th scope="col">${LABEL[d]}</th>`).join("")}<th scope="col">${en ? "Users" : "Kullanıcı"}</th><th scope="col">${en ? "Max context" : "Maks context"}</th></tr></thead>
<tbody>${rows.map((r) => {
    const d = PRECISIONS[r.best];
    const usersN = r.best < 0 ? 0 : maxConcurrency({ arch: r.m, weightDtype: d, contextLength: r.ctx, ...WORK }, usable);
    const maxCtx = r.best < 0 ? 0 : Math.min(maxContextLength({ arch: r.m, weightDtype: d, concurrency: 1, ...WORK }, usable), r.m.maxContext ?? Infinity);
    return `<tr><th scope="row">${modelLink(lang, r.m)}</th>${r.need.map((v) => cell(v <= usable, v)).join("")}${
      r.best < 0 ? `<td>—</td><td>—</td>` : `<td>${int(lang, usersN)}<small>${LABEL[d]}</small></td><td>${ctxK(maxCtx)}<small>${LABEL[d]}</small></td>`
    }</tr>`;
  }).join("")}</tbody>
</table></div>
<p class="note">${en
      ? "Memory at 8k context for one user (the model's maximum, where that is shorter), FP16 KV cache, 10% overhead and 0.75 GiB of CUDA context. Users (each at 8k) and maximum context are for the highest precision that fits."
      : "Bellek; 8k context ve tek kullanıcı için (modelin maksimumu daha kısaysa o), FP16 KV cache, %10 ek yük ve 0,75 GiB CUDA context ile. Kullanıcı (her biri 8k) ve maksimum context, sığan en yüksek hassasiyet içindir."}</p>`;

  const cat = DICTS[lang][`cat.${g.category}`] ?? g.category;
  const siblings = FEATURED.filter((x) => x.id !== g.id);
  const body = `<p class="lede">${lede}</p>
<div class="answer">
  <div class="cap">${esc(cat)} · ${en ? "usable memory" : "kullanılabilir bellek"}</div>
  <div class="big">${gib(lang, usable)}</div>
  <p>${en ? `${count(2)} of ${rows.length} models fit at INT4, ${count(0)} at BF16.` : `${rows.length} modelden ${count(2)} tanesi INT4'te, ${count(0)} tanesi BF16'da sığar.`}</p>
</div>
<h2>${en ? `Which LLMs fit on ${g.name}` : `${g.name}: hangi LLM'ler sığar`}</h2>
${table}
<p>${en
      ? "A model that does not fit one card can still run across several: tensor parallelism splits its weights and KV cache between them. The calculator works out how many."
      : "Tek karta sığmayan bir model birden çok kartta çalışabilir: tensor parallel, ağırlıklarını ve KV cache'ini kartlar arasında böler. Kaç tane gerektiğini hesaplayıcı bulur."}</p>
<h2>${en ? `Size a model on ${g.name}` : `${g.name} için bir modeli hesapla`}</h2>
<ul class="links">
  <li><a class="primary" href="${href(lang)}?g=${encodeURIComponent(g.id)}">${en ? "Open the calculator with this GPU" : "Hesaplayıcıyı bu GPU ile aç"}</a></li>
</ul>
<h2>${en ? "Other GPUs" : "Diğer GPU'lar"}</h2>
<ul class="links">${siblings.map((x) => `<li>${gpuLink(lang, x)}</li>`).join("")}</ul>`;

  return page({
    lang,
    file,
    section: "gpus",
    title: en ? `Which LLMs Fit on ${g.name}?` : `${g.name}: Hangi LLM'ler Sığar?`,
    description: en
      ? `Which open LLMs fit on ${g.name} (${gib(lang, usable)} usable): ${count(2)} of ${rows.length} popular models at INT4 and ${count(0)} at BF16, with concurrent users and maximum context for each.`
      : `${g.name} (kullanılabilir ${gib(lang, usable)}) üzerinde hangi açık LLM'ler çalışır: ${rows.length} popüler modelin ${count(2)} tanesi INT4'te, ${count(0)} tanesi BF16'da sığar; her biri için eşzamanlı kullanıcı ve maksimum context.`,
    h1: en ? `Which LLMs fit on ${g.name}?` : `${g.name}: hangi LLM'ler sığar?`,
    crumbs: [
      { name: "LLMScale", file: "" },
      { name: en ? "GPUs" : "GPU'lar", file: GPUS_HUB },
      { name: g.name },
    ],
    body,
    ld: { "@context": "https://schema.org", "@type": "TechArticle", headline: en ? `Which LLMs fit on ${g.name}?` : `${g.name}: hangi LLM'ler sığar?`, inLanguage: lang, url: url(lang, file), about: g.name, isPartOf: { "@type": "WebSite", name: "LLMScale", url: url(lang) }, author: { "@type": "Person", name: "Tahir Cengiz", url: "https://github.com/tahircengiz" } },
  });
}

// ── hubs ──────────────────────────────────────────────────────────────────────
function modelsHub(lang: Lang): string {
  const en = lang === "en";
  const rows = MODELS.map((m) => {
    const ctx = refCtx(m);
    return `<tr><th scope="row">${modelLink(lang, m)}</th><td>${params(lang, m.numParams)}${m.isMoE && m.activeParams ? `<small>${params(lang, m.activeParams)} ${en ? "active" : "aktif"}</small>` : ""}</td><td>${gib(lang, size(m, "bf16", ctx).totalGiB)}</td><td>${gib(lang, size(m, "int4", ctx).totalGiB)}</td><td>${ctxK(m.maxContext ?? ctx)}</td></tr>`;
  }).join("");
  const body = `<p class="lede">${en
    ? `How much GPU memory ${MODELS.length} popular open models need, computed from each one's own architecture: weights, KV cache and overhead at BF16 and INT4 for one user at 8k context. Each page breaks it down by precision and context, lists the GPUs that hold it and how many users fit, and adds fine-tuning memory.`
    : `${MODELS.length} popüler açık modelin ne kadar GPU belleği istediği, her birinin kendi mimarisinden hesaplanmış olarak: 8k context'te tek kullanıcı için BF16 ve INT4'te ağırlık, KV cache ve ek yük. Her sayfa bunu hassasiyet ve context'e göre ayırır, onu taşıyan GPU'ları ve kaç kullanıcı sığdığını listeler, ince ayar belleğini de ekler.`}</p>
<div class="scroll"><table>
<thead><tr><th scope="col">Model</th><th scope="col">${en ? "Parameters" : "Parametre"}</th><th scope="col">BF16 · 8k</th><th scope="col">INT4 · 8k</th><th scope="col">${en ? "Max context" : "Maks context"}</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="note">${en ? "One user, FP16 KV cache, 10% overhead and 0.75 GiB of CUDA context; models with a shorter maximum context are shown at that maximum." : "Tek kullanıcı, FP16 KV cache, %10 ek yük ve 0,75 GiB CUDA context; maksimum context'i daha kısa olan modeller o maksimumla gösterilir."}</p>
<ul class="links"><li><a class="primary" href="${href(lang)}">${en ? "Size any Hugging Face model" : "Herhangi bir Hugging Face modelini hesapla"}</a></li><li><a href="${href(lang, GPUS_HUB)}">${en ? "Which LLMs fit on which GPU" : "Hangi GPU'ya hangi LLM sığar"}</a></li></ul>`;
  return page({
    lang,
    file: MODELS_HUB,
    section: "models",
    title: en ? "LLM VRAM Requirements by Model" : "Modele Göre LLM VRAM Gereksinimleri",
    description: en
      ? `GPU memory for ${MODELS.length} popular open LLMs — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — at BF16 and INT4, with the GPUs that fit and fine-tuning memory for each.`
      : `${MODELS.length} popüler açık LLM için GPU belleği — Llama, Qwen, Mistral, Gemma, gpt-oss, DeepSeek — BF16 ve INT4'te; her biri için sığan GPU'lar ve ince ayar belleğiyle.`,
    h1: en ? "LLM VRAM requirements by model" : "Modele göre LLM VRAM gereksinimleri",
    crumbs: [{ name: "LLMScale", file: "" }, { name: en ? "Models" : "Modeller" }],
    body,
    ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: en ? "LLM VRAM requirements by model" : "Modele göre LLM VRAM gereksinimleri", inLanguage: lang, url: url(lang, MODELS_HUB), hasPart: MODELS.map((m) => ({ "@type": "TechArticle", headline: m.displayName, url: url(lang, modelPageFile(m.id)) })) },
  });
}

function gpusHub(lang: Lang): string {
  const en = lang === "en";
  const rows = FEATURED.map((g) => {
    const usable = usableGiB(g);
    const n = (d: Dtype) => KNOWN_MODELS.filter((m) => size(m, d, refCtx(m)).totalGiB <= usable).length;
    return `<tr><th scope="row">${gpuLink(lang, g)}</th><td>${esc(DICTS[lang][`cat.${g.category}`] ?? g.category)}</td><td>${gib(lang, usable)}</td><td>${n("bf16")}</td><td>${n("int4")}</td></tr>`;
  }).join("");
  const body = `<p class="lede">${en
    ? `Which of ${KNOWN_MODELS.length} popular open LLMs fit on ${FEATURED.length} GPUs people run them on — consumer and workstation cards, data-center GPUs, Apple Silicon and unified-memory AI PCs. Each page lists every model with its memory at BF16, FP8 and INT4, how many users fit and the longest context it can hold.`
    : `${KNOWN_MODELS.length} popüler açık LLM'den hangilerinin, insanların bu modelleri çalıştırdığı ${FEATURED.length} GPU'ya sığdığı — tüketici ve iş istasyonu kartları, veri merkezi GPU'ları, Apple Silicon ve unified bellekli yapay zekâ PC'leri. Her sayfa tüm modelleri BF16, FP8 ve INT4 bellekleriyle, kaç kullanıcı sığdığıyla ve taşıyabileceği en uzun context ile listeler.`}</p>
<div class="scroll"><table>
<thead><tr><th scope="col">GPU</th><th scope="col">${en ? "Type" : "Tür"}</th><th scope="col">${en ? "Usable" : "Kullanılabilir"}</th><th scope="col">${en ? "Models at BF16" : "BF16'da model"}</th><th scope="col">${en ? "Models at INT4" : "INT4'te model"}</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="note">${en ? `Out of ${KNOWN_MODELS.length} models, at 8k context for one user. Discrete cards are budgeted at 95% of their memory; unified-memory devices at the share their GPU can address.` : `${KNOWN_MODELS.length} model içinden, 8k context ve tek kullanıcı için. Ayrık kartlarda belleğin %95'i, unified bellekli cihazlarda GPU'nun kullanabildiği pay hesaba katılır.`}</p>
<ul class="links"><li><a class="primary" href="${href(lang)}">${en ? "Size a model on any GPU" : "Herhangi bir GPU'da model hesapla"}</a></li><li><a href="${href(lang, MODELS_HUB)}">${en ? "VRAM requirements by model" : "Modele göre VRAM gereksinimleri"}</a></li></ul>`;
  return page({
    lang,
    file: GPUS_HUB,
    section: "gpus",
    title: en ? "Which LLMs Fit on Which GPU?" : "Hangi GPU'ya Hangi LLM Sığar?",
    description: en
      ? `Which popular open LLMs fit on RTX 4090, RTX 5090, H100, H200, B200, Apple M-series, Strix Halo and DGX Spark — at BF16, FP8 and INT4, with users and maximum context.`
      : `Hangi popüler açık LLM'ler RTX 4090, RTX 5090, H100, H200, B200, Apple M serisi, Strix Halo ve DGX Spark'a sığar — BF16, FP8 ve INT4'te, kullanıcı sayısı ve maksimum context ile.`,
    h1: en ? "Which LLMs fit on which GPU" : "Hangi GPU'ya hangi LLM sığar",
    crumbs: [{ name: "LLMScale", file: "" }, { name: en ? "GPUs" : "GPU'lar" }],
    body,
    ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: en ? "Which LLMs fit on which GPU" : "Hangi GPU'ya hangi LLM sığar", inLanguage: lang, url: url(lang, GPUS_HUB), hasPart: FEATURED.map((g) => ({ "@type": "TechArticle", headline: g.name, url: url(lang, gpuPageFile(g.id)) })) },
  });
}

// ── write ─────────────────────────────────────────────────────────────────────
const written: { path: string; words: number }[] = [];
function write(lang: Lang, file: string, html: string) {
  const rel = `${lang === "tr" ? "tr/" : ""}${file.endsWith("/") ? `${file}index.html` : file}`;
  const path = join(outDir, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
  written.push({ path: rel, words: words(html.slice(html.indexOf("<body"))) });
}
for (const lang of LANGS) {
  for (const m of KNOWN_MODELS) write(lang, modelPageFile(m.id), modelPage(lang, m));
  for (const g of FEATURED) write(lang, gpuPageFile(g.id), gpuPage(lang, g));
  write(lang, MODELS_HUB, modelsHub(lang));
  write(lang, GPUS_HUB, gpusHub(lang));
}
const fewest = [...written].sort((a, b) => a.words - b.words)[0];
console.log(`ok    ${written.length} guide pages (${KNOWN_MODELS.length} models, ${FEATURED.length} GPUs, 2 hubs, × ${LANGS.length} languages); fewest words: ${fewest.path} ${fewest.words}`);
