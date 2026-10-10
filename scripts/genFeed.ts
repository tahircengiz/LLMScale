// Builds the news feed from content/feed/*.json: a stream of short posts in
// English and Turkish, a page per post, and an RSS feed per language.
//
//   node scripts/genFeed.ts [outDir=dist]
//
// Runs after genPages.ts and before sitemap.ts (see "build" in package.json), on
// the same page frame as the guides (shell.ts). With no posts it writes nothing,
// and neither the guides' header nor the app's footer links to it.
//
// Each post is a few sentences with its sources. A post about a model also shows
// what the model takes to run — memory at BF16, FP8 and INT4 and the smallest
// featured device that holds it alone — computed here by the calculator's
// engine, so the feed says something about a release that its announcement does not.

import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { calculate, type Dtype } from "../src/lib/calc.ts";
import { KNOWN_MODELS, type KnownModel } from "../src/lib/models.ts";
import { GPUS, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import { DEFAULT_STATE } from "../src/lib/urlState.ts";
import type { Lang } from "../src/lib/dict.ts";
import { FEATURED_GPU_IDS, gpuPageFile, modelPageFile } from "../src/lib/staticPages.ts";
import { FEED_HUB, FEED_MEDIA, feedPostFile, feedRssFile, paragraphs, type FeedCategory, type FeedPost } from "../src/lib/feed.ts";
import { createShell, ctxK, esc, gib, LANGS, params, readSite, words } from "./shell.ts";
import { FEED_DIR, loadFeed } from "./feedData.ts";

const outDir = process.argv[2] ?? "dist";
const posts = loadFeed();
if (!posts.length) {
  console.log(`ok    feed  no posts in ${FEED_DIR}, nothing written`);
  process.exit(0);
}
const site = readSite(outDir);
const { href, url, page } = createShell(site, { feed: true });

/** Posts per stream page; older ones continue on feed/page-2.html and on. */
const PAGE_SIZE = 20;
const streamFile = (n: number) => (n === 1 ? FEED_HUB : `${FEED_HUB}page-${n}.html`);

// ── words ─────────────────────────────────────────────────────────────────────
const T = {
  en: {
    crumb: "News",
    title: "LLM News: New Models, Serving and GPUs",
    h1: "LLM news",
    lede: "New models, serving engines and GPUs, in short posts that each link to their sources. A post about a model also shows what it takes to run, computed by the same engine as the calculator.",
    disclosure: "Posts are drafted with an AI model from their sources and reviewed by Tahir Cengiz before they go out.",
    description: "Short posts on new open LLMs, serving engines and GPUs, each with its sources — and, for every new model, the GPU memory it needs at BF16, FP8 and INT4.",
    rss: "RSS feed",
    sources: "Sources",
    newer: "Newer posts",
    older: "Older posts",
    newerPost: "Newer",
    olderPost: "Older",
    all: "All news",
    page: (n: number) => `page ${n}`,
    permalink: "Link to this post",
    cat: { model: "Model", release: "Release", hardware: "Hardware", research: "Research", tooling: "Tooling" } as Record<FeedCategory, string>,
    memCap: (name: string, p: string, c: string) => `${name} · ${p} parameters · ${c} context, one user`,
    memCols: ["Precision", "Memory", "Fits on"],
    memNote: "LLMScale engine: FP16 KV cache, 10% overhead, 0.75 GiB CUDA context. “Fits on” is the smallest device that holds it alone, or how many of the largest it takes by memory.",
    openCalc: "Open in the calculator",
    guide: "Memory by context and GPU",
    credit: "Image",
  },
  tr: {
    crumb: "Haberler",
    title: "LLM Haberleri: Yeni Modeller, Servis ve GPU'lar",
    h1: "LLM haberleri",
    lede: "Yeni modeller, servis motorları ve GPU'lar; her biri kaynağına bağlanan kısa postlarda. Bir modelle ilgili post, o modeli çalıştırmak için ne gerektiğini de gösterir; hesaplayıcıyla aynı motordan.",
    disclosure: "Postlar kaynaklarından bir yapay zekâ modeliyle taslak olarak yazılır ve yayınlanmadan önce Tahir Cengiz tarafından gözden geçirilir.",
    description: "Yeni açık LLM'ler, servis motorları ve GPU'lar üzerine kaynaklı kısa postlar; her yeni model için BF16, FP8 ve INT4'te gereken GPU belleğiyle.",
    rss: "RSS akışı",
    sources: "Kaynaklar",
    newer: "Daha yeni postlar",
    older: "Daha eski postlar",
    newerPost: "Daha yeni",
    olderPost: "Daha eski",
    all: "Tüm haberler",
    page: (n: number) => `sayfa ${n}`,
    permalink: "Bu postun bağlantısı",
    cat: { model: "Model", release: "Sürüm", hardware: "Donanım", research: "Araştırma", tooling: "Araç" } as Record<FeedCategory, string>,
    memCap: (name: string, p: string, c: string) => `${name} · ${p} parametre · ${c} context, tek kullanıcı`,
    memCols: ["Hassasiyet", "Bellek", "Sığdığı cihaz"],
    memNote: "LLMScale motoru: FP16 KV cache, %10 ek yük, 0,75 GiB CUDA context. “Sığdığı cihaz”, modeli tek başına taşıyan en küçük cihaz ya da bellek olarak en büyüğünden kaç tane gerektiğidir.",
    openCalc: "Hesaplayıcıda aç",
    guide: "Context ve GPU'ya göre bellek",
    credit: "Görsel",
  },
};

// Build-time output formats dates explicitly, in UTC, so neither the build
// machine's locale nor its time zone decides what a page says.
const dateFmt = {
  en: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
  tr: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
};
const day = (lang: Lang, iso: string) => dateFmt[lang].format(new Date(iso));

/** A <title> fits in about 60 characters; a longer headline is cut at a word. */
function shortTitle(s: string): string {
  if ([...s].length <= 60) return s;
  const cut = [...s].slice(0, 59).join("");
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[\s,.:;—-]+$/, "")}…`;
}
/** A meta description: the body's first sentences, cut near 155 characters. */
function summary(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if ([...flat].length <= 155) return flat;
  const cut = [...flat].slice(0, 154).join("");
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.:;—-]+$/, "")}…`;
}
const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");

// ── the memory card ───────────────────────────────────────────────────────────
const PRECISIONS: Dtype[] = ["bf16", "fp8", "int4"];
const LABEL: Record<string, string> = { bf16: "BF16", fp8: "FP8", int4: "INT4" };
const gpu = (id: string): Gpu => {
  const g = GPUS.find((x) => x.id === id);
  if (!g) throw new Error(`no GPU with id ${id}`);
  return g;
};
const FEATURED = FEATURED_GPU_IDS.map(gpu).sort((a, b) => usableGiB(a) - usableGiB(b));
const BIGGEST = gpu("b200-192");
const gpuLink = (lang: Lang, g: Gpu) => `<a href="${href(lang, gpuPageFile(g.id))}">${esc(g.name)}</a>`;
/** The context a card is computed at: 8k, or the model's maximum if shorter — the guides' choice. */
const refCtx = (m: KnownModel) => Math.min(8192, m.maxContext ?? 8192);

function memoryCard(lang: Lang, m: KnownModel): string {
  const t = T[lang];
  const ctx = refCtx(m);
  const rows = PRECISIONS.map((d) => {
    const need = calculate({ arch: m, weightDtype: d, contextLength: ctx, concurrency: 1, kvDtype: "fp16", overheadPct: DEFAULT_STATE.overheadPct, cudaContextGiB: DEFAULT_STATE.cudaContextGiB }).totalGiB;
    const holder = FEATURED.find((g) => need <= usableGiB(g));
    return { d, need, fit: holder ? gpuLink(lang, holder) : `${Math.ceil(need / usableGiB(BIGGEST))}× ${gpuLink(lang, BIGGEST)}` };
  });
  const max = Math.max(...rows.map((r) => r.need));
  const calc = `${href(lang)}?m=${encodeURIComponent(m.hfId)}`;
  return `<figure class="mem">
<figcaption>${esc(t.memCap(m.displayName, params(lang, m.numParams), ctxK(ctx)))}</figcaption>
<table>
<thead><tr>${t.memCols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
<tbody>${rows
    .map(
      (r) =>
        `<tr><th scope="row">${LABEL[r.d]}</th><td><span class="bar" aria-hidden="true"><span style="width:${Math.max(4, Math.round((r.need / max) * 100))}%"></span></span>${gib(lang, r.need)}</td><td>${r.fit}</td></tr>`
    )
    .join("")}</tbody>
</table>
<p class="note">${t.memNote} <a href="${calc}">${t.openCalc}</a> · <a href="${href(lang, modelPageFile(m.id))}">${t.guide}</a></p>
</figure>`;
}

// ── a post ────────────────────────────────────────────────────────────────────
const MODELS = new Map(KNOWN_MODELS.map((m) => [m.id, m]));

function article(lang: Lang, p: FeedPost, standalone: boolean): string {
  const t = T[lang];
  const text = p[lang];
  const model = p.model ? MODELS.get(p.model) : undefined;
  const link = href(lang, feedPostFile(p.id));
  const heading = standalone ? "" : `<h2><a href="${link}">${esc(text.title)}</a></h2>\n`;
  const image = p.image
    ? `<figure class="shot"><img src="${site.base}${FEED_MEDIA}${p.image.file}" width="${p.image.width}" height="${p.image.height}" alt="${esc(p.image.alt[lang])}" loading="lazy" decoding="async"><figcaption>${t.credit}: ${esc(p.image.credit)}</figcaption></figure>\n`
    : "";
  const extra = !model && p.hf ? `<p class="note"><a href="${href(lang)}?m=${encodeURIComponent(p.hf)}">${t.openCalc}: ${esc(p.hf)}</a></p>\n` : "";
  return `<article class="post" id="${p.id}">
<header><img src="${site.base}favicon.svg" alt="" width="20" height="20"><span class="who"><b>LLMScale</b><a href="${link}" title="${t.permalink}"><time datetime="${p.published}">${day(lang, p.published)}</time></a></span><span class="cat">${t.cat[p.category]}</span></header>
${heading}${paragraphs(text.body).map((s) => `<p>${esc(s)}</p>`).join("\n")}
${model ? `${memoryCard(lang, model)}\n` : ""}${image}${extra}<footer>
<ul class="refs" aria-label="${t.sources}">${p.refs.map((r) => `<li><a href="${esc(r.url)}" rel="noopener" title="${esc(r.title)}"><b>${esc(r.source)}</b> <span>${esc(r.title)}</span> <small>${esc(host(r.url))}</small></a></li>`).join("")}</ul>
${p.tags.length ? `<p class="tags">${p.tags.map((tag) => `<span>#${esc(tag)}</span>`).join(" ")}</p>\n` : ""}</footer>
</article>`;
}

function postLd(lang: Lang, p: FeedPost): object {
  const model = p.model ? MODELS.get(p.model) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p[lang].title,
    description: summary(p[lang].body),
    datePublished: p.published,
    dateModified: p.updated ?? p.published,
    inLanguage: lang,
    url: url(lang, feedPostFile(p.id)),
    mainEntityOfPage: url(lang, feedPostFile(p.id)),
    ...(p.image ? { image: `${site.home}${FEED_MEDIA}${p.image.file}` } : {}),
    ...(model ? { about: model.displayName } : {}),
    keywords: p.tags.join(", "),
    citation: p.refs.map((r) => r.url),
    author: { "@type": "Person", name: "Tahir Cengiz", url: "https://github.com/tahircengiz" },
    isPartOf: { "@type": "Blog", name: T[lang].h1, url: url(lang, FEED_HUB) },
  };
}

// ── pages ─────────────────────────────────────────────────────────────────────
const CSS = `
.feed{max-width:40rem}
.post{background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:1rem 1.15rem .85rem;margin:0 0 .9rem}
.post>header{display:flex;align-items:center;gap:.55rem;margin:0 0 .55rem;font-size:.875rem}
.post>header img{width:32px;height:32px;padding:6px;border-radius:50%;background:var(--inset);border:1px solid var(--line)}
.who{display:flex;flex-direction:column;line-height:1.3}
.who a{color:var(--faint);font-size:.78rem;text-decoration:none}
.who a:hover{text-decoration:underline}
.cat{margin-left:auto;font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);background:var(--inset);border:1px solid var(--line);border-radius:999px;padding:.05rem .55rem}
.post h2{font-size:1.05rem;margin:0 0 .4rem}
.post h2 a{color:var(--text);text-decoration:none}
.post h2 a:hover{color:var(--brand)}
.post p{margin:0 0 .65rem}
.mem{margin:.85rem 0;background:var(--inset);border:1px solid var(--line);border-radius:.75rem;padding:.7rem .85rem .2rem;overflow-x:auto}
.mem figcaption{font-size:.78rem;color:var(--faint);margin:0 0 .35rem}
.mem table{font-size:.85rem}
.mem th,.mem td{padding:.35rem .5rem .35rem 0;border-bottom:1px solid var(--line);white-space:normal}
.mem thead th{background:none;padding-top:0}
.mem tbody tr:last-child>*{border-bottom:0}
.mem td:nth-child(2){white-space:nowrap}
.bar{display:inline-block;vertical-align:middle;width:4.5rem;height:.45rem;margin-right:.5rem;border-radius:999px;background:var(--line);overflow:hidden}
.bar span{display:block;height:100%;border-radius:inherit;background:var(--brand)}
.mem .note{margin:.4rem 0 .5rem}
@media (max-width:30rem){.bar{display:none}.post{padding-inline:.9rem}.mem{padding-inline:.7rem}}
.shot{margin:.85rem 0}
.shot img{display:block;width:100%;height:auto;border-radius:.75rem;border:1px solid var(--line);background:var(--inset)}
.shot figcaption{font-size:.75rem;color:var(--faint);margin-top:.3rem}
.post>footer{border-top:1px solid var(--line);margin-top:.75rem;padding:.6rem 0 0;font-size:inherit;color:inherit}
.refs{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.35rem}
.refs a{display:block;padding:.4rem .65rem;border:1px solid var(--line);border-radius:.6rem;text-decoration:none;color:var(--text);font-size:.85rem;line-height:1.4;overflow-wrap:anywhere}
.refs a:hover{border-color:var(--brand)}
.refs b{color:var(--brand);font-weight:600}
.refs small{display:block;color:var(--faint);font-size:.72rem}
.tags{margin:.55rem 0 0;font-size:.78rem;color:var(--faint)}
.pager{display:flex;justify-content:space-between;gap:1rem;max-width:40rem;margin:1.25rem 0 0;font-size:.9rem}
.feedmeta{font-size:.8125rem;color:var(--faint);max-width:40rem}
`.trim();

const rssHead = (lang: Lang) =>
  `<link rel="alternate" type="application/rss+xml" title="${esc(`LLMScale — ${T[lang].h1}`)}" href="${url(lang, feedRssFile)}">`;

function streamPage(lang: Lang, n: number, pages: number, chunk: FeedPost[]): string {
  const t = T[lang];
  const file = streamFile(n);
  const pager = [
    n > 1 ? `<a href="${href(lang, streamFile(n - 1))}" rel="prev">← ${t.newer}</a>` : "<span></span>",
    n < pages ? `<a href="${href(lang, streamFile(n + 1))}" rel="next">${t.older} →</a>` : "<span></span>",
  ].join("");
  const body = `${n === 1 ? `<p class="lede feedmeta">${t.lede}</p>\n` : ""}<div class="feed">
${chunk.map((p) => article(lang, p, false)).join("\n")}
</div>
${pages > 1 ? `<nav class="pager" aria-label="${t.all}">${pager}</nav>\n` : ""}<p class="feedmeta">${t.disclosure} <a href="${url(lang, feedRssFile)}">${t.rss}</a></p>`;
  return page({
    lang,
    file,
    section: "feed",
    title: n === 1 ? t.title : `${t.h1} — ${t.page(n)}`,
    description: n === 1 ? t.description : `${t.description} (${t.page(n)})`,
    h1: n === 1 ? t.h1 : `${t.h1} — ${t.page(n)}`,
    crumbs: n === 1 ? [{ name: "LLMScale", file: "" }, { name: t.crumb }] : [{ name: "LLMScale", file: "" }, { name: t.crumb, file: FEED_HUB }, { name: t.page(n) }],
    body,
    css: CSS,
    head: rssHead(lang),
    ogType: "website",
    ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: t.h1, inLanguage: lang, url: url(lang, file), hasPart: chunk.map((p) => ({ "@type": "BlogPosting", headline: p[lang].title, url: url(lang, feedPostFile(p.id)), datePublished: p.published })) },
  });
}

function postPage(lang: Lang, p: FeedPost, newer?: FeedPost, older?: FeedPost): string {
  const t = T[lang];
  const pager = [
    newer ? `<a href="${href(lang, feedPostFile(newer.id))}" rel="prev">← ${t.newerPost}: ${esc(newer[lang].title)}</a>` : "<span></span>",
    older ? `<a href="${href(lang, feedPostFile(older.id))}" rel="next">${t.olderPost}: ${esc(older[lang].title)} →</a>` : "<span></span>",
  ].join("");
  return page({
    lang,
    file: feedPostFile(p.id),
    section: "feed",
    title: shortTitle(p[lang].title),
    description: summary(p[lang].body),
    h1: p[lang].title,
    crumbs: [{ name: "LLMScale", file: "" }, { name: t.crumb, file: FEED_HUB }, { name: shortTitle(p[lang].title) }],
    body: `<div class="feed">
${article(lang, p, true)}
</div>
<nav class="pager" aria-label="${t.all}">${pager}</nav>
<p class="feedmeta"><a href="${href(lang, FEED_HUB)}">${t.all}</a> · ${t.disclosure}</p>`,
    css: CSS,
    head: rssHead(lang),
    ogImage: p.image ? `${site.home}${FEED_MEDIA}${p.image.file}` : undefined,
    ld: postLd(lang, p),
  });
}

// ── RSS ───────────────────────────────────────────────────────────────────────
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function rss(lang: Lang): string {
  const t = T[lang];
  const items = posts.slice(0, 50).map((p) => {
    const link = url(lang, feedPostFile(p.id));
    const html = `${paragraphs(p[lang].body).map((s) => `<p>${esc(s)}</p>`).join("")}<p>${t.sources}: ${p.refs.map((r) => `<a href="${esc(r.url)}">${esc(r.source)}</a>`).join(" · ")}</p>`;
    return `<item>
<title>${xml(p[lang].title)}</title>
<link>${link}</link>
<guid isPermaLink="true">${link}</guid>
<pubDate>${new Date(p.published).toUTCString()}</pubDate>
<category>${xml(t.cat[p.category])}</category>
<description>${xml(html)}</description>
</item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xml(`LLMScale — ${t.h1}`)}</title>
<link>${url(lang, FEED_HUB)}</link>
<atom:link href="${url(lang, feedRssFile)}" rel="self" type="application/rss+xml"/>
<description>${xml(t.description)}</description>
<language>${lang}</language>
<lastBuildDate>${new Date(posts[0].updated ?? posts[0].published).toUTCString()}</lastBuildDate>
${items.join("\n")}
</channel>
</rss>
`;
}

// ── write ─────────────────────────────────────────────────────────────────────
const written: { path: string; words: number }[] = [];
function write(lang: Lang, file: string, content: string) {
  const rel = `${lang === "tr" ? "tr/" : ""}${file.endsWith("/") ? `${file}index.html` : file}`;
  const path = join(outDir, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  if (rel.endsWith(".html")) written.push({ path: rel, words: words(content.slice(content.indexOf("<body"))) });
}

const pages = Math.ceil(posts.length / PAGE_SIZE);
for (const lang of LANGS) {
  for (let n = 1; n <= pages; n++) write(lang, streamFile(n), streamPage(lang, n, pages, posts.slice((n - 1) * PAGE_SIZE, n * PAGE_SIZE)));
  posts.forEach((p, i) => write(lang, feedPostFile(p.id), postPage(lang, p, posts[i - 1], posts[i + 1])));
  write(lang, feedRssFile, rss(lang));
}
const media = [...new Set(posts.flatMap((p) => (p.image ? [p.image.file] : [])))];
if (media.length) mkdirSync(join(outDir, FEED_MEDIA), { recursive: true });
for (const f of media) copyFileSync(join(FEED_DIR, "media", f), join(outDir, FEED_MEDIA, f));

const fewest = [...written].sort((a, b) => a.words - b.words)[0];
console.log(`ok    feed  ${posts.length} posts → ${written.length} pages (${pages} stream page${pages > 1 ? "s" : ""} + posts, × ${LANGS.length} languages), 2 RSS feeds, ${media.length} images; fewest words: ${fewest.path} ${fewest.words}`);
