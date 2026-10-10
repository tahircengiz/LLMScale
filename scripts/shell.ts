// The frame every static page shares — head, header, footer, styles, the theme
// and the language offer — for the guides (genPages.ts) and the news feed
// (genFeed.ts). One copy, so a page of one kind cannot drift from the other.
// Both wear the app's look (appLook.ts): its themes, header and nav.
//
// The site's base path, canonical host and analytics tag are read back from the
// built index.html instead of keeping second copies of them here.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Lang } from "../src/lib/dict.ts";
import { formatGiB, formatParams } from "../src/lib/format.ts";
import { SUGGEST } from "../src/lib/langPath.ts";
import { APP_CSS, APP_SCRIPT, APP_THEME_BOOT, appFooter, appHeader, esc, other, type FrameCtx } from "./appLook.ts";

export { esc, other };
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

// ── a guide's content ─────────────────────────────────────────────────────────
// A guide sits in one card in the middle of the page, like the app's panels: the
// reading width of prose, with tables and boxes stepped down the ink ramp inside it.
const GUIDE_CSS = `
.guide{max-width:54rem;margin:0 auto;padding:1.25rem 1.5rem 1.5rem;border-radius:1rem}
.crumbs{font-size:.8125rem;color:var(--faint);margin:0 0 .6rem}
.crumbs a{color:var(--faint)}
.guide h1{font-size:clamp(1.55rem,4vw,2.1rem);line-height:1.15;letter-spacing:-.015em;margin:0 0 .75rem;text-wrap:balance}
.guide h2{font-size:1.15rem;line-height:1.3;letter-spacing:-.01em;margin:2.25rem 0 .6rem;text-wrap:balance}
.guide p{margin:0 0 .9rem;max-width:68ch}
.lede{color:var(--muted)}
.answer{background:var(--inset);border:1px solid var(--line);border-radius:1rem;padding:1.1rem 1.25rem;margin:1.25rem 0}
.cap{font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;color:var(--faint)}
.big{font-size:2.1rem;font-weight:700;line-height:1.1;margin:.25rem 0 .45rem;font-variant-numeric:tabular-nums}
.guide .answer p{margin:0;color:var(--muted);font-size:.9375rem}
.spec{display:flex;flex-wrap:wrap;gap:.4rem;list-style:none;padding:0;margin:.85rem 0 0}
.spec li{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:.05rem .6rem;font-size:.75rem;color:var(--muted)}
/* positioned, so a table's screen-reader text (.sr, absolute) scrolls with it instead of widening the page */
.scroll{position:relative;overflow-x:auto;border:1px solid var(--line);border-radius:.75rem;background:var(--inset)}
.guide table{font-size:.875rem}
.guide th,.guide td{padding:.5rem .75rem;border-bottom:1px solid var(--line);white-space:nowrap}
.guide tbody tr:last-child>*{border-bottom:0}
.guide thead th{background:var(--ink-800)}
.guide td small{display:block;color:var(--faint);font-size:.75rem}
.ok{color:var(--good);font-weight:600}
.no{color:var(--bad)}
.note{font-size:.8125rem;color:var(--faint);margin-top:.6rem}
ul.plain{padding-left:1.1rem;margin:0 0 .9rem}
ul.plain li{margin:.3rem 0}
.links{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;padding:0;margin:.4rem 0 0}
.links a{display:inline-block;background:var(--inset);border:1px solid var(--line);border-radius:.75rem;padding:.35rem .75rem;text-decoration:none;font-size:.875rem}
.links a:hover{border-color:var(--brand)}
.links a.primary{background:var(--brand-600);border-color:transparent;color:var(--onbrand)}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85em;background:var(--inset);padding:.05em .35em;border-radius:4px}
pre{background:var(--inset);border:1px solid var(--line);border-radius:.6rem;padding:.75rem 1rem;overflow-x:auto;margin:0 0 .9rem;line-height:1.55}
pre code{background:none;padding:0;font-size:.82rem;white-space:pre}
@media (max-width:40rem){.guide{padding:1rem;margin-inline:-.25rem}}
`.trim();

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
  /** The body brings its own <h1> and layout, in place of the guide card with its
   *  breadcrumb trail (which stays in the structured data). */
  bare?: boolean;
  /** A script this kind of page runs, after the shared ones. */
  script?: string;
}

/** The page builder for one built site. `feed` adds the news feed to the nav,
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

  /** What a page's section is called: the phone menu's label on a page the nav does not list. */
  const SECTION = {
    en: { models: "Models", gpus: "GPUs", concepts: "Concepts", feed: "News", crumbs: "Breadcrumb" },
    tr: { models: "Modeller", gpus: "GPU'lar", concepts: "Kavramlar", feed: "Haberler", crumbs: "Konum" },
  };

  function page(p: PageSpec): string {
    const c = SECTION[p.lang];
    const frame: FrameCtx = { lang: p.lang, file: p.file, href, base: site.base, feed };
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
    const crumbs = p.crumbs
      .map((cr, i) => (i < p.crumbs.length - 1 ? `<a href="${href(p.lang, cr.file)}">${esc(cr.name)}</a> › ` : esc(cr.name)))
      .join("");
    const main = p.bare
      ? p.body
      : `<div class="guide card">
<nav class="crumbs" aria-label="${c.crumbs}">${crumbs}</nav>
<h1>${esc(p.h1)}</h1>
${p.body}
</div>`;

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
<meta name="author" content="Tahir Ali Cengiz">
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
${p.head ? `${p.head}\n` : ""}<script>${APP_THEME_BOOT}</script>
${site.tracker}
<style>${APP_CSS}
${GUIDE_CSS}${p.css ? `\n${p.css}` : ""}</style>
${ld}
</head>
<body>
${appHeader(frame, p.section === "feed" ? "news" : null, c[p.section])}
<main class="fmain">
${main}
</main>
${appFooter(frame)}
<script>${suggestScript(p.lang, p.file)}</script>
<script>${APP_SCRIPT}</script>
${p.script ? `<script>${p.script}</script>\n` : ""}</body>
</html>
`;
  }

  return { href, url, page };
}

/** The static pages' styles and theme bootstrap, for other pages in the site's look (the newsroom's review panel). */
export const SHELL_CSS = `${APP_CSS}\n${GUIDE_CSS}`;
export { APP_THEME_BOOT as THEME_BOOT };
