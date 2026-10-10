// Builds the news feed from content/feed/*.json: a stream of short posts in
// English and Turkish, a page per post, and an RSS feed per language.
//
//   node scripts/genFeed.ts [outDir=dist]
//
// Runs after genPages.ts and before sitemap.ts (see "build" in package.json), on
// the same page frame as the guides (shell.ts). With no posts it writes nothing,
// and neither the guides' header nor the app's footer links to it.
//
// The feed reads like a timeline on X or Threads: one centred column, the
// author's avatar beside each post, posts divided by hairlines, newest first, and
// older posts loading as the reader scrolls down. The stream is paged into plain
// HTML files (feed/, feed/page-2.html, …) so it works and is crawlable without
// JavaScript; the page's script fetches the next file and appends its posts.
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

/** Posts per stream file; scrolling loads the next file's posts in place. */
const PAGE_SIZE = 20;
/** Other posts shown under a single post, so a shared link leads on into the feed. */
const MORE_UNDER_POST = 5;
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
    rss: "RSS",
    rssTitle: "Subscribe with RSS",
    sources: "Sources",
    newer: "Newer posts",
    older: "Older posts",
    back: "News",
    all: "All news",
    more: "More news",
    page: (n: number) => `page ${n}`,
    cat: { model: "Model", release: "Release", hardware: "Hardware", research: "Research", tooling: "Tooling" } as Record<FeedCategory, string>,
    memCap: (name: string, p: string, c: string) => `${name} · ${p} parameters · ${c} context, one user`,
    memCols: ["Precision", "Memory", "Fits on"],
    memNote: "FP16 KV cache, 10% overhead, 0.75 GiB CUDA context. “Fits on”: the smallest device that holds it alone, or how many of the largest it takes by memory.",
    guide: "Memory by context and GPU",
    calc: "Calculator",
    calcLabel: (name: string) => `Open ${name} in the calculator`,
    share: "Share",
    credit: "Image",
    js: { loading: "Loading…", end: "You're all caught up.", failed: "Couldn't load older posts.", copied: "Link copied", now: "now", m: "m", h: "h", d: "d", locale: "en-US" },
  },
  tr: {
    crumb: "Haberler",
    title: "LLM Haberleri: Yeni Modeller, Servis ve GPU'lar",
    h1: "LLM haberleri",
    lede: "Yeni modeller, servis motorları ve GPU'lar; her biri kaynağına bağlanan kısa postlarda. Bir modelle ilgili post, o modeli çalıştırmak için ne gerektiğini de gösterir; hesaplayıcıyla aynı motordan.",
    disclosure: "Postlar kaynaklarından bir yapay zekâ modeliyle taslak olarak yazılır ve yayınlanmadan önce Tahir Cengiz tarafından gözden geçirilir.",
    description: "Yeni açık LLM'ler, servis motorları ve GPU'lar üzerine kaynaklı kısa postlar; her yeni model için BF16, FP8 ve INT4'te gereken GPU belleğiyle.",
    rss: "RSS",
    rssTitle: "RSS ile takip et",
    sources: "Kaynaklar",
    newer: "Daha yeni postlar",
    older: "Daha eski postlar",
    back: "Haberler",
    all: "Tüm haberler",
    more: "Daha fazla haber",
    page: (n: number) => `sayfa ${n}`,
    cat: { model: "Model", release: "Sürüm", hardware: "Donanım", research: "Araştırma", tooling: "Araç" } as Record<FeedCategory, string>,
    memCap: (name: string, p: string, c: string) => `${name} · ${p} parametre · ${c} context, tek kullanıcı`,
    memCols: ["Hassasiyet", "Bellek", "Sığdığı cihaz"],
    memNote: "FP16 KV cache, %10 ek yük, 0,75 GiB CUDA context. “Sığdığı cihaz”: modeli tek başına taşıyan en küçük cihaz ya da bellek olarak en büyüğünden kaç tane gerektiği.",
    guide: "Context ve GPU'ya göre bellek",
    calc: "Hesapla",
    calcLabel: (name: string) => `${name} modelini hesaplayıcıda aç`,
    share: "Paylaş",
    credit: "Görsel",
    js: { loading: "Yükleniyor…", end: "Hepsi bu kadar.", failed: "Eski postlar yüklenemedi.", copied: "Bağlantı kopyalandı", now: "şimdi", m: " dk", h: " sa", d: " g", locale: "tr-TR" },
  },
};

// Build-time output formats dates explicitly, in UTC, so neither the build
// machine's locale nor its time zone decides what a page says. The page's script
// turns them into "3h"-style ages in the reader's own time zone.
const dateFmt = {
  en: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
  tr: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
};
const fullFmt = {
  en: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }),
  tr: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }),
};
const day = (lang: Lang, iso: string) => dateFmt[lang].format(new Date(iso));
const full = (lang: Lang, iso: string) => `${fullFmt[lang].format(new Date(iso))} UTC`;

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

// Icons are inline SVG in currentColor, so they take the theme's colours and cost no request.
const icon = (path: string) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const ICON = {
  calc: icon('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>'),
  share: icon('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"/>'),
  rss: icon('<path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14"/><circle cx="6" cy="18" r="1.2" fill="currentColor"/>'),
  back: icon('<path d="M19 12H5M11 18l-6-6 6-6"/>'),
};

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
  return `<figure class="mem">
<figcaption>${esc(t.memCap(m.displayName, params(lang, m.numParams), ctxK(ctx)))}</figcaption>
<table>
<thead><tr>${t.memCols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
<tbody>${rows
    .map(
      (r) =>
        `<tr><th scope="row">${LABEL[r.d]}</th><td><span class="meter" aria-hidden="true"><span style="width:${Math.max(4, Math.round((r.need / max) * 100))}%"></span></span>${gib(lang, r.need)}</td><td>${r.fit}</td></tr>`
    )
    .join("")}</tbody>
</table>
<p class="memnote">${t.memNote} <a href="${href(lang, modelPageFile(m.id))}">${t.guide}</a></p>
</figure>`;
}

// ── a post ────────────────────────────────────────────────────────────────────
const MODELS = new Map(KNOWN_MODELS.map((m) => [m.id, m]));

interface PostView {
  /** The post's own page: its title is the page's <h1>, its time in full. */
  standalone?: boolean;
  /** The heading level of the title in a stream: h2 on the feed, h3 under "More news". */
  level?: 2 | 3;
}

function article(lang: Lang, p: FeedPost, view: PostView = {}): string {
  const t = T[lang];
  const text = p[lang];
  const model = p.model ? MODELS.get(p.model) : undefined;
  const link = href(lang, feedPostFile(p.id));
  const lvl = view.standalone ? 1 : (view.level ?? 2);
  const title = view.standalone ? esc(text.title) : `<a href="${link}">${esc(text.title)}</a>`;
  const when = view.standalone
    ? `<time datetime="${p.published}" data-full>${full(lang, p.published)}</time>`
    : `<a class="when" href="${link}"><time datetime="${p.published}" data-age>${day(lang, p.published)}</time></a>`;
  const image = p.image
    ? `<figure class="shot"><img src="${site.base}${FEED_MEDIA}${p.image.file}" width="${p.image.width}" height="${p.image.height}" alt="${esc(p.image.alt[lang])}" loading="lazy" decoding="async"><figcaption>${t.credit}: ${esc(p.image.credit)}</figcaption></figure>\n`
    : "";
  const calcTarget = model ? model.hfId : p.hf;
  const calcName = model ? model.displayName : p.hf;
  const acts = [
    calcTarget ? `<a href="${href(lang)}?m=${encodeURIComponent(calcTarget)}" aria-label="${esc(t.calcLabel(calcName ?? ""))}">${ICON.calc}<span>${t.calc}</span></a>` : "",
    `<button type="button" data-share="${url(lang, feedPostFile(p.id))}" data-title="${esc(text.title)}" hidden>${ICON.share}<span>${t.share}</span></button>`,
  ].join("");
  return `<article class="post${view.standalone ? " big" : ""}" id="${p.id}"${view.standalone ? "" : ` data-href="${link}"`}>
<a class="av" href="${link}" tabindex="-1" aria-hidden="true"><img src="${site.base}favicon.svg" alt="" width="22" height="22"></a>
<div class="pb">
<div class="ph"><b>LLMScale</b><span aria-hidden="true">·</span>${when}<span aria-hidden="true">·</span><span class="cat">${t.cat[p.category]}</span></div>
<h${lvl} class="lead">${title}</h${lvl}>
${paragraphs(text.body).map((s) => `<p>${esc(s)}</p>`).join("\n")}
${p.tags.length ? `<p class="tags">${p.tags.map((tag) => `#${esc(tag)}`).join(" ")}</p>\n` : ""}${model ? `${memoryCard(lang, model)}\n` : ""}${image}<ul class="src" aria-label="${t.sources}">${p.refs
    .map((r) => `<li><a href="${esc(r.url)}" rel="noopener"><span class="d">${esc(r.source)} · ${esc(host(r.url))}</span><span class="t">${esc(r.title)}</span></a></li>`)
    .join("")}</ul>
<div class="acts">${acts}</div>
</div>
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
// One column like a timeline: the column is the card, posts are rows in it split
// by hairlines (DESIGN.md: rings and tone, not boxes inside boxes). Muted text
// for everything that is not the post or a link; indigo only where you can click.
const CSS = `
.stream{max-width:38rem;margin:0 auto;background:var(--card);border:1px solid var(--line);border-radius:1rem}
.topbar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:3.25rem;padding:.5rem 1rem;border-bottom:1px solid var(--line);border-radius:1rem 1rem 0 0;background:color-mix(in srgb,var(--card) 86%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.topbar h1{font-size:1.125rem;line-height:1.3;margin:0;letter-spacing:-.01em}
.topbar a{display:inline-flex;align-items:center;gap:.35rem;text-decoration:none;font-size:.875rem}
.topbar .back{color:var(--text);font-weight:600;font-size:1rem}
.pill{border:1px solid var(--line);border-radius:999px;padding:.2rem .7rem;color:var(--muted)}
.pill:hover{color:var(--brand)}
.bio{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.9rem;padding:1.1rem 1rem;border-bottom:1px solid var(--line)}
.bio>img{width:56px;height:56px;padding:13px;border-radius:50%;background:var(--inset);border:1px solid var(--line)}
.bio p{margin:0 0 .4rem;max-width:none;font-size:.9375rem;color:var(--muted)}
.bio .name{color:var(--text);font-weight:700;font-size:1rem;margin-bottom:.15rem}
.bio .disc{font-size:.8125rem;color:var(--faint);margin:0}
.post{display:grid;grid-template-columns:40px minmax(0,1fr);gap:0 .75rem;padding:.9rem 1rem .6rem;border-bottom:1px solid var(--line)}
.post[data-href]{cursor:pointer}
.post[data-href]:hover{background:color-mix(in srgb,var(--inset) 55%,transparent)}
.av img{display:block;width:40px;height:40px;padding:9px;border-radius:50%;background:var(--inset);border:1px solid var(--line)}
.ph{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .35rem;font-size:.9375rem;line-height:1.4;color:var(--faint)}
.ph b{color:var(--text);font-weight:700}
.ph a{color:var(--faint);text-decoration:none}
.ph a:hover{text-decoration:underline}
.cat{font-size:.68rem;text-transform:uppercase;letter-spacing:.07em}
.lead{font-size:1rem;font-weight:650;line-height:1.4;letter-spacing:0;margin:.15rem 0 .3rem;text-wrap:pretty}
.lead a{color:var(--text);text-decoration:none}
.lead a:hover{text-decoration:underline}
.pb p{margin:0 0 .55rem;max-width:none;font-size:.96875rem;line-height:1.55}
.pb .tags{color:var(--faint);font-size:.875rem}
.big{padding-top:1rem}
.big .lead{font-size:1.3rem;line-height:1.3;margin:.2rem 0 .5rem}
.big .pb p{font-size:1.0625rem}
.mem{margin:.6rem 0;padding:.65rem .8rem .15rem;background:var(--inset);border:1px solid var(--line);border-radius:1rem;overflow-x:auto}
.mem figcaption{font-size:.78rem;color:var(--faint);margin:0 0 .3rem}
.mem table{font-size:.85rem}
.mem th,.mem td{padding:.35rem .6rem .35rem 0;border-bottom:1px solid var(--line);white-space:normal}
.mem thead th{background:none;padding-top:0}
.mem tbody tr:last-child>*{border-bottom:0}
.mem td:nth-child(2){white-space:nowrap}
.meter{display:inline-block;vertical-align:middle;width:4rem;height:.4rem;margin-right:.5rem;border-radius:999px;background:var(--line);overflow:hidden}
.meter span{display:block;height:100%;border-radius:inherit;background:var(--brand)}
.pb .memnote{font-size:.75rem;line-height:1.45;color:var(--faint);margin:.35rem 0 .55rem}
.shot{margin:.6rem 0}
.shot img{display:block;width:100%;height:auto;border-radius:1rem;border:1px solid var(--line);background:var(--inset)}
.shot figcaption{font-size:.75rem;color:var(--faint);margin-top:.3rem}
.src{list-style:none;margin:.6rem 0 0;padding:0;border:1px solid var(--line);border-radius:1rem;overflow:hidden}
.src li+li{border-top:1px solid var(--line)}
.src a{display:block;padding:.5rem .85rem;color:var(--text);text-decoration:none;line-height:1.35;overflow-wrap:anywhere}
.src a:hover{background:var(--inset)}
.src .d{display:block;font-size:.75rem;color:var(--faint)}
.src .t{display:block;font-size:.9rem}
.acts{display:flex;gap:1.5rem;margin:.35rem 0 0}
.acts a,.acts button{display:inline-flex;align-items:center;gap:.35rem;min-height:2.25rem;padding:0;border:0;background:none;color:var(--faint);font:inherit;font-size:.8125rem;text-decoration:none;cursor:pointer}
.acts a:hover,.acts button:hover{color:var(--brand)}
.acts [hidden]{display:none}
.morehead{font-size:1rem;margin:0;padding:.85rem 1rem;border-bottom:1px solid var(--line)}
.stream>.post:last-of-type{border-bottom:0}
.more{display:flex;justify-content:center;gap:1.5rem;padding:1rem;font-size:.9rem;border-top:1px solid var(--line)}
.status{margin:0;padding:0 1rem 1rem;max-width:none;text-align:center;font-size:.85rem;color:var(--faint)}
.status:empty{display:none}
@media (max-width:40rem){main:has(.stream){padding-top:0}.stream{margin-inline:-1.25rem;border-inline:0;border-radius:0}.topbar{border-radius:0}}
@media (max-width:30rem){.post{grid-template-columns:32px minmax(0,1fr);gap:0 .6rem;padding-inline:.85rem}.av img{width:32px;height:32px;padding:7px}.meter{display:none}.mem{padding-inline:.65rem}}
`.trim();

/** Ages ("3h"), full dates in the reader's time zone, the share button, a click
 *  anywhere on a post opening it, and older posts loading as the reader nears the
 *  end. Everything here is an enhancement: without it the links still work. */
function script(lang: Lang): string {
  const data = JSON.stringify(T[lang].js).replace(/</g, "\\u003c");
  return `(function(L){
var dayF=new Intl.DateTimeFormat(L.locale,{day:"numeric",month:"short"}),yearF=new Intl.DateTimeFormat(L.locale,{day:"numeric",month:"short",year:"numeric"}),fullF=new Intl.DateTimeFormat(L.locale,{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
function age(t){var d=new Date(t.getAttribute("datetime")),s=(Date.now()-d)/1e3;t.title=fullF.format(d);
t.textContent=s<60?L.now:s<3600?Math.floor(s/60)+L.m:s<86400?Math.floor(s/3600)+L.h:s<604800?Math.floor(s/86400)+L.d:(d.getFullYear()===new Date().getFullYear()?dayF:yearF).format(d)}
function enhance(root){
root.querySelectorAll("time[data-age]").forEach(age);
root.querySelectorAll("time[data-full]").forEach(function(t){t.textContent=fullF.format(new Date(t.getAttribute("datetime")))});
root.querySelectorAll("button[data-share]").forEach(function(b){if(!navigator.share&&!(navigator.clipboard&&navigator.clipboard.writeText))return;b.hidden=false;
b.addEventListener("click",function(){var u=b.getAttribute("data-share");if(navigator.share){navigator.share({title:b.getAttribute("data-title"),url:u}).catch(function(){})}else{navigator.clipboard.writeText(u).then(function(){var s=b.querySelector("span"),o=s.textContent;s.textContent=L.copied;setTimeout(function(){s.textContent=o},1800)})}})});
root.querySelectorAll("article[data-href]").forEach(function(a){a.addEventListener("click",function(e){if(e.target.closest("a,button,figure,table")||String(getSelection()))return;location.href=a.getAttribute("data-href")})})}
enhance(document);
var more=document.querySelector("a[data-more]"),status=document.querySelector(".status");if(!more)return;
var nav=more.closest("nav"),list=nav.parentNode,busy=false;
function load(){if(busy||!more)return;busy=true;status.textContent=L.loading;
fetch(more.href).then(function(r){if(!r.ok)throw r.status;return r.text()}).then(function(h){
var doc=new DOMParser().parseFromString(h,"text/html"),frag=document.createDocumentFragment(),box=document.createElement("div");
doc.querySelectorAll(".stream>article.post").forEach(function(p){box.appendChild(document.importNode(p,true))});enhance(box);
while(box.firstChild)frag.appendChild(box.firstChild);list.insertBefore(frag,nav);
var next=doc.querySelector("a[data-more]");if(next){more.href=new URL(next.getAttribute("href"),more.href).href;status.textContent=""}else{nav.remove();more=null;status.textContent=L.end}busy=false;check()
}).catch(function(){busy=false;status.textContent=L.failed})}
more.addEventListener("click",function(e){e.preventDefault();load()});
var io="IntersectionObserver" in window?new IntersectionObserver(function(es){if(es[0].isIntersecting)load()},{rootMargin:"900px 0px"}):null;if(io)io.observe(nav);
function check(){if(io&&more){io.unobserve(nav);io.observe(nav)}}
})(${data});`;
}

const rssHead = (lang: Lang) =>
  `<link rel="alternate" type="application/rss+xml" title="${esc(`LLMScale — ${T[lang].h1}`)}" href="${url(lang, feedRssFile)}">`;

function streamPage(lang: Lang, n: number, pages: number, chunk: FeedPost[]): string {
  const t = T[lang];
  const file = streamFile(n);
  const h1 = n === 1 ? t.h1 : `${t.h1} — ${t.page(n)}`;
  const pager = [
    n > 1 ? `<a href="${href(lang, streamFile(n - 1))}" rel="prev">← ${t.newer}</a>` : "",
    n < pages ? `<a href="${href(lang, streamFile(n + 1))}" rel="next" data-more>${t.older} →</a>` : "",
  ].join("");
  const bio = n === 1
    ? `<section class="bio" aria-label="LLMScale"><img src="${site.base}favicon.svg" alt="" width="30" height="30"><div><p class="name">LLMScale</p><p>${t.lede}</p><p class="disc">${t.disclosure}</p></div></section>\n`
    : "";
  const body = `<div class="stream">
<div class="topbar"><h1>${esc(h1)}</h1><a class="pill" href="${url(lang, feedRssFile)}" title="${t.rssTitle}">${ICON.rss}${t.rss}</a></div>
${bio}${chunk.map((p) => article(lang, p)).join("\n")}
${pager ? `<nav class="more" aria-label="${t.all}">${pager}</nav>\n` : ""}<p class="status" role="status" aria-live="polite"></p>
</div>`;
  return page({
    lang,
    file,
    section: "feed",
    title: n === 1 ? t.title : h1,
    description: n === 1 ? t.description : `${t.description} (${t.page(n)})`,
    h1,
    crumbs: n === 1 ? [{ name: "LLMScale", file: "" }, { name: t.crumb }] : [{ name: "LLMScale", file: "" }, { name: t.crumb, file: FEED_HUB }, { name: t.page(n) }],
    body,
    bare: true,
    css: CSS,
    head: rssHead(lang),
    script: script(lang),
    ogType: "website",
    ld: { "@context": "https://schema.org", "@type": "CollectionPage", name: t.h1, inLanguage: lang, url: url(lang, file), hasPart: chunk.map((p) => ({ "@type": "BlogPosting", headline: p[lang].title, url: url(lang, feedPostFile(p.id)), datePublished: p.published })) },
  });
}

function postPage(lang: Lang, p: FeedPost, i: number): string {
  const t = T[lang];
  // The posts after this one, wrapping round to the newest, so every post page
  // leads on into the feed the way a reply thread does.
  const others = [...posts.slice(i + 1), ...posts.slice(0, i)].slice(0, MORE_UNDER_POST);
  const body = `<div class="stream">
<div class="topbar"><a class="back" href="${href(lang, FEED_HUB)}">${ICON.back}${t.back}</a><a class="pill" href="${url(lang, feedRssFile)}" title="${t.rssTitle}">${ICON.rss}${t.rss}</a></div>
${article(lang, p, { standalone: true })}
${others.length ? `<h2 class="morehead">${t.more}</h2>\n${others.map((o) => article(lang, o, { level: 3 })).join("\n")}\n` : ""}<nav class="more" aria-label="${t.all}"><a href="${href(lang, FEED_HUB)}">${t.all} →</a></nav>
</div>`;
  return page({
    lang,
    file: feedPostFile(p.id),
    section: "feed",
    title: shortTitle(p[lang].title),
    description: summary(p[lang].body),
    h1: p[lang].title,
    crumbs: [{ name: "LLMScale", file: "" }, { name: t.crumb, file: FEED_HUB }, { name: shortTitle(p[lang].title) }],
    body,
    bare: true,
    css: CSS,
    head: rssHead(lang),
    script: script(lang),
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
  posts.forEach((p, i) => write(lang, feedPostFile(p.id), postPage(lang, p, i)));
  write(lang, feedRssFile, rss(lang));
}
const media = [...new Set(posts.flatMap((p) => (p.image ? [p.image.file] : [])))];
if (media.length) mkdirSync(join(outDir, FEED_MEDIA), { recursive: true });
for (const f of media) copyFileSync(join(FEED_DIR, "media", f), join(outDir, FEED_MEDIA, f));

const fewest = [...written].sort((a, b) => a.words - b.words)[0];
console.log(`ok    feed  ${posts.length} posts → ${written.length} pages (${pages} stream page${pages > 1 ? "s" : ""} + posts, × ${LANGS.length} languages), 2 RSS feeds, ${media.length} images; fewest words: ${fewest.path} ${fewest.words}`);
