// The frame every static page shares — head, header, footer, styles, the theme
// and the language offer — for the guides (genPages.ts) and the news feed
// (genFeed.ts). One copy, so a page of one kind cannot drift from the other.
//
// The site's base path, canonical host and analytics tag are read back from the
// built index.html instead of keeping second copies of them here.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Lang } from "../src/lib/dict.ts";
import { formatGiB, formatParams } from "../src/lib/format.ts";
import { LANG_NAME, SUGGEST } from "../src/lib/langPath.ts";
import { CONCEPTS_HUB, GPUS_HUB, MODELS_HUB } from "../src/lib/staticPages.ts";
import { FEED_HUB } from "../src/lib/feed.ts";

export const LANGS: Lang[] = ["en", "tr"];

// ── the site, as built ────────────────────────────────────────────────────────
export interface Site {
  home: string;
  base: string;
  tracker: string;
}

export function readSite(outDir: string): Site {
  const index = readFileSync(join(outDir, "index.html"), "utf8");
  const home = index.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const base = index.match(/src="([^"]*)assets\//)?.[1];
  const tracker = index.match(/<script defer src="https:\/\/stats\.delix\.dev\/u\.js"[^>]*><\/script>/)?.[0];
  if (!home || base === undefined || !tracker) throw new Error(`${outDir}/index.html: no canonical, base path or analytics tag to copy`);
  // An ungated tag reports from wherever the file loads (see test-invariants.ts).
  if (!tracker.includes("data-domains=")) throw new Error("the analytics tag is not gated to the live host");
  return { home, base, tracker };
}

// ── formatting ────────────────────────────────────────────────────────────────
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Build-time output formats explicitly: the build machine's locale must not leak
// into a page (it once rendered 131072 as "131.072" on an English one).
export const dec = (lang: Lang, s: string) => (lang === "tr" ? s.replace(/(\d)\.(\d)/g, "$1,$2") : s);
export const gib = (lang: Lang, n: number) => dec(lang, formatGiB(n));
export const int = (lang: Lang, n: number) => n.toLocaleString(lang === "tr" ? "tr-TR" : "en-US");
export const params = (lang: Lang, n: number) => dec(lang, formatParams(n));
export const ratio = (lang: Lang, r: number) => `${dec(lang, String(Math.round(r * 10) / 10))}×`;
export const ctxK = (c: number) => `${c % 1000 === 0 ? c / 1000 : Math.round(c / 1024)}k`;
export const words = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;
export const other = (lang: Lang): Lang => (lang === "tr" ? "en" : "tr");

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
pre{background:var(--inset);border:1px solid var(--line);border-radius:.6rem;padding:.75rem 1rem;overflow-x:auto;margin:0 0 .9rem;line-height:1.55}
pre code{background:none;padding:0;font-size:.82rem;white-space:pre}
footer{border-top:1px solid var(--line);padding-block:1.25rem 5rem;font-size:.8125rem;color:var(--faint)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.langsuggest{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .75rem;width:max-content;max-width:calc(100vw - 2rem);background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:.5rem .55rem .5rem 1rem;box-shadow:0 10px 30px rgb(0 0 0/.2);font-size:.875rem;color:var(--muted)}
.langsuggest a{background:#4a4cd4;color:#fff;border-radius:.5rem;padding:.2rem .7rem;text-decoration:none;font-weight:500}
.langsuggest button{background:none;border:0;color:var(--faint);cursor:pointer;padding:.2rem .5rem;border-radius:.5rem;font-size:1rem}
`.trim();

// The app's theme choice, read the same way the app's bootstrap does: a stored
// choice, else dark when the OS asks for it. Glass and light both read as light here.
const THEME_BOOT = `try{var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="light"&&t!=="glass")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"glass";document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}`;

export type Section = "models" | "gpus" | "concepts" | "feed";

export interface PageSpec {
  lang: Lang;
  file: string;
  section: Section;
  title: string;
  description: string;
  h1: string;
  crumbs: { name: string; file?: string }[];
  body: string;
  ld: object;
  /** Styles only this kind of page needs, after the shared ones. */
  css?: string;
  /** More <head> tags, such as a feed's RSS link. */
  head?: string;
  /** "article" unless said otherwise. */
  ogType?: string;
  /** An absolute image URL for social cards; the site's og.png otherwise. */
  ogImage?: string;
  /** The body brings its own <h1> and replaces the breadcrumb trail (which stays in the structured data). */
  bare?: boolean;
  /** A script this kind of page runs, after the shared ones. */
  script?: string;
  /** A page in another look than the guides' brings its own theme bootstrap,
   *  base styles, header, footer and <main> class; each defaults to the guides'. */
  boot?: string;
  baseCss?: string;
  header?: string;
  footer?: string;
  mainClass?: string;
}

/** The page builder for one built site. `feed` adds the news feed to the header,
 *  which it only does once there is a post to show. */
export function createShell(site: Site, { feed }: { feed: boolean }) {
  const href = (lang: Lang, file = "") => `${site.base}${lang === "tr" ? "tr/" : ""}${file}`;
  const url = (lang: Lang, file = "") => `${site.home}${lang === "tr" ? "tr/" : ""}${file}`;

  /** The same offer as the app's LangSuggest: shown only when the visitor prefers
   *  the other language, never a redirect, and remembered either way. */
  function suggestScript(lang: Lang, file: string): string {
    const o = other(lang);
    const data = JSON.stringify({ L: lang, O: o, S: SUGGEST[o], H: href(o, file) }).replace(/</g, "\\u003c");
    return `(function(d){var p=null;try{p=localStorage.getItem("lang")}catch(e){}if(p!=="en"&&p!=="tr")p=/^tr/.test(navigator.language||"")?"tr":"en";if(p===d.L)return;var b=document.createElement("div");b.className="langsuggest";b.lang=d.O;b.setAttribute("role","region");b.setAttribute("aria-label",d.S.text);var s=document.createElement("span");s.textContent=d.S.text;var a=document.createElement("a");a.href=d.H;a.hreflang=d.O;a.textContent=d.S.go;a.onclick=function(){try{localStorage.setItem("lang",d.O)}catch(e){}};var c=document.createElement("button");c.type="button";c.textContent="\\u2715";c.setAttribute("aria-label",d.S.dismiss);c.onclick=function(){try{localStorage.setItem("lang",d.L)}catch(e){}b.remove()};b.append(s,a,c);document.body.appendChild(b)})(${data});`;
  }

  const CHROME = {
    en: { nav: "Site", calc: "VRAM calculator", models: "Models", gpus: "GPUs", concepts: "Concepts", feed: "News", crumbs: "Breadcrumb", footer: "LLMScale works out the GPU memory an LLM needs — weights, KV cache, context and concurrent users — in your browser, from each model's own architecture." },
    tr: { nav: "Site", calc: "VRAM hesaplayıcı", models: "Modeller", gpus: "GPU'lar", concepts: "Kavramlar", feed: "Haberler", crumbs: "Konum", footer: "LLMScale bir LLM'in ihtiyaç duyduğu GPU belleğini — ağırlıklar, KV cache, context ve eşzamanlı kullanıcılar — her modelin kendi mimarisinden, tarayıcında hesaplar." },
  };

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
<link rel="icon" type="image/svg+xml" href="${site.base}favicon.svg">
<meta property="og:type" content="${p.ogType ?? "article"}">
<meta property="og:title" content="${esc(p.h1)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url(p.lang, p.file)}">
<meta property="og:site_name" content="LLMScale">
<meta property="og:image" content="${p.ogImage ?? `${site.home}og.png`}">
<meta property="og:locale" content="${p.lang === "tr" ? "tr_TR" : "en_US"}">
<meta property="og:locale:alternate" content="${p.lang === "tr" ? "en_US" : "tr_TR"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.h1)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${p.ogImage ?? `${site.home}og.png`}">
${p.head ? `${p.head}\n` : ""}<script>${p.boot ?? THEME_BOOT}</script>
${site.tracker}
<style>${p.baseCss ?? CSS}${p.css ? `\n${p.css}` : ""}</style>
${ld}
</head>
<body>
${p.header ?? `<header class="top"><div class="wrap">
  <a class="brand" href="${href(p.lang)}"><img src="${site.base}favicon.svg" alt="" width="24" height="24">LLMScale</a>
  <nav aria-label="${c.nav}">
    <a href="${href(p.lang)}">${c.calc}</a>
    <a href="${href(p.lang, MODELS_HUB)}"${current("models")}>${c.models}</a>
    <a href="${href(p.lang, GPUS_HUB)}"${current("gpus")}>${c.gpus}</a>
    <a href="${href(p.lang, CONCEPTS_HUB)}"${current("concepts")}>${c.concepts}</a>
${feed ? `    <a href="${href(p.lang, FEED_HUB)}"${current("feed")}>${c.feed}</a>\n` : ""}    <a href="${href(o, p.file)}" hreflang="${o}" lang="${o}" onclick="try{localStorage.setItem('lang','${o}')}catch(e){}">${LANG_NAME[o]}</a>
  </nav>
</div></header>`}
<main class="${p.mainClass ?? "wrap"}">
${p.bare ? "" : `  <nav class="crumbs" aria-label="${c.crumbs}">${p.crumbs
    .map((cr, i) => (i < p.crumbs.length - 1 ? `<a href="${href(p.lang, cr.file)}">${esc(cr.name)}</a> › ` : esc(cr.name)))
    .join("")}</nav>
  <h1>${esc(p.h1)}</h1>
`}${p.body}
</main>
${p.footer ?? `<footer class="wrap">${c.footer}</footer>`}
<script>${suggestScript(p.lang, p.file)}</script>
${p.script ? `<script>${p.script}</script>\n` : ""}</body>
</html>
`;
  }

  return { href, url, page, suggestScript };
}

/** The guides' styles, for other pages built in the site's look (the newsroom's review panel). */
export { CSS as SHELL_CSS, THEME_BOOT };
