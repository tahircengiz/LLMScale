// The app's look for the static pages — the news feed and the guides — so they
// wear the calculator's clothes: the same three themes (dark, light and the glass
// material), the same header with its theme and language switches, and the same
// grouped nav. Moving between the tools, the guides and the news does not feel
// like leaving the site.
//
// The values mirror src/index.css and src/components/ui.tsx; scripts/test-invariants.ts
// checks the theme tokens and the bootstrap against them. Pages read the tokens
// through --bg, --card, --line and friends.

import { DICTS, type Lang } from "../src/lib/dict.ts";
import { LANG_NAME } from "../src/lib/langPath.ts";
import { FEED_HUB } from "../src/lib/feed.ts";
import { CONCEPTS_HUB, GPUS_HUB, MODELS_HUB } from "../src/lib/staticPages.ts";

const LANGS: Lang[] = ["en", "tr"];
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const other = (lang: Lang): Lang => (lang === "tr" ? "en" : "tr");

/** The bootstrap every app entry runs before paint (index.html): a stored theme,
 *  else dark when the OS asks for it, else glass. */
export const APP_THEME_BOOT = `try{var m=localStorage.getItem("theme");if(m!=="dark"&&m!=="light"&&m!=="glass")m=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"glass";if(m!=="dark")document.documentElement.classList.add(m)}catch(e){}`;

export const APP_CSS = `
:root{color-scheme:dark;--ink-950:#090b10;--ink-900:#14171f;--ink-850:#1b1f2a;--ink-800:#232834;--ink-700:#333a49;--c-white:#fff;--fg:#e7e9ef;--slate-300:#c3c8d4;--slate-400:#a1a8b8;--slate-500:#868ea0;--brand-400:#9698f7;--brand-500:#5d5fef;--brand-600:#4a4cd4;--accent-400:#00e096;--accent-500:#00c886;--bad-c:#fda4af;--onbrand:#fff;--bg:var(--ink-950);--card:var(--ink-900);--inset:var(--ink-850);--line:color-mix(in oklab,var(--c-white) 10%,transparent);--text:var(--fg);--muted:var(--slate-300);--faint:var(--slate-400);--brand:var(--brand-400);--button:var(--brand-600);--good:var(--accent-400);--bad:var(--bad-c)}
.light{color-scheme:light;--ink-950:#eaeef6;--ink-900:#fff;--ink-850:#f4f6fb;--ink-800:#e9edf6;--ink-700:#dce1ee;--c-white:#151d48;--fg:#151d48;--slate-300:#39405c;--slate-400:#555b73;--slate-500:#6b7188;--brand-400:#4a4cd4;--accent-400:#0b7d57;--bad-c:#b3123c}
.glass{color-scheme:light;--ink-950:#dfe6fa;--ink-900:#fff;--ink-850:#f2f5fd;--ink-800:#e8ecf8;--ink-700:#cfd7ee;--c-white:#101736;--fg:#101736;--slate-300:#333c68;--slate-400:#3e4668;--slate-500:#434b6e;--brand-400:#3b39ba;--accent-400:#0a6f4d;--bad-c:#a30f36}
*{box-sizing:border-box}
html,body{min-height:100%}
body{margin:0;background:radial-gradient(1100px 620px at 18% -14%,rgba(93,95,239,.1),transparent 62%),var(--ink-950);color:var(--fg);font:400 1rem/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.glass body{background:radial-gradient(46% 42% at 8% 2%,rgba(99,102,241,.72) 0%,transparent 60%),radial-gradient(40% 40% at 96% 6%,rgba(34,211,238,.68) 0%,transparent 62%),radial-gradient(44% 44% at 84% 96%,rgba(167,139,250,.72) 0%,transparent 60%),radial-gradient(38% 38% at 6% 92%,rgba(45,212,191,.66) 0%,transparent 60%),radial-gradient(34% 30% at 50% 46%,rgba(244,114,182,.4) 0%,transparent 66%),var(--ink-950);background-attachment:fixed}
a{color:var(--brand);text-underline-offset:2px}
a:focus-visible,button:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:6px}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th,td{text-align:left;vertical-align:top}
thead th{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);font-weight:600}
th[scope=row]{font-weight:600}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.card{background:color-mix(in oklab,var(--ink-900) 70%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid var(--line);box-shadow:0 20px 25px -5px rgb(0 0 0/.3),0 8px 10px -6px rgb(0 0 0/.3)}
.hdr{border-bottom:1px solid var(--line);padding:.5rem 1rem}
.hin{max-width:72rem;margin:0 auto}
.hrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem}
.brand{display:flex;align-items:center;gap:.5rem;text-decoration:none}
.brand img{width:28px;height:28px}
.brand b{font-size:1.125rem;line-height:1.75rem;font-weight:700;letter-spacing:-.025em;color:var(--c-white)}
.badge{display:inline-flex;align-items:center;border-radius:999px;padding:.125rem .5rem;font-size:11px;line-height:1rem;font-weight:500;color:var(--accent-400);background:color-mix(in oklab,var(--accent-500) 15%,transparent);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--accent-500) 30%,transparent)}
.ctrls{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem}
.seg{display:flex;flex-shrink:0;gap:.25rem;border-radius:.75rem;background:var(--ink-850);padding:.25rem;box-shadow:inset 0 0 0 1px var(--line)}
.seg a,.seg button{display:block;border:0;background:none;font:inherit;font-size:.75rem;line-height:1rem;font-weight:500;padding:.25rem .625rem;border-radius:.5rem;color:var(--slate-300);text-decoration:none;white-space:nowrap;cursor:pointer;transition:background-color .15s,color .15s}
.seg a:hover,.seg button:hover,.tab:hover{background:color-mix(in oklab,var(--c-white) 5%,transparent)}
.seg [aria-pressed=true],.seg [aria-current=page],.tab[aria-current=page],.tab.on{background:var(--brand-600);color:var(--onbrand);box-shadow:0 1px 3px 0 rgb(0 0 0/.1),0 1px 2px -1px rgb(0 0 0/.1)}
.pnav{margin-top:.5rem;display:flex;justify-content:center}
.navpill{width:100%;border-radius:.75rem;background:var(--ink-850);padding:.25rem;box-shadow:inset 0 0 0 1px var(--line)}
.tab{display:block;border:0;background:none;font:inherit;border-radius:.5rem;padding:.25rem .625rem;font-size:.875rem;line-height:1.25rem;font-weight:500;white-space:nowrap;color:var(--slate-300);text-decoration:none;cursor:pointer;transition:background-color .15s,color .15s}
.mbar{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
.mbar button{display:flex;align-items:center;gap:.375rem}
.mbar svg{width:14px;height:14px;transition:transform .15s}
.mbar [aria-expanded=true] svg{transform:rotate(180deg)}
#site-nav{display:none;flex-direction:column;gap:.25rem;margin-top:.25rem}
#site-nav.open{display:flex}
.grp{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem}
.grp .sep{height:1px;flex-basis:100%;background:color-mix(in oklab,var(--c-white) 15%,transparent)}
.grp:first-child .sep{display:none}
@media (min-width:640px){.hdr{padding-inline:1.5rem}.navpill{width:auto;max-width:100%}.mbar{display:none}#site-nav{display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:0}.grp .sep{height:1rem;width:1px;flex-basis:auto;margin:0 .25rem}}
@media (max-width:360px){.seg a,.seg button{padding-inline:.375rem}.ctrls{gap:.375rem}}
@media (scripting:none){#site-nav{display:flex}.mbar button{display:none}}
.glass .card{background:rgba(255,255,255,.52);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,255,255,.65);box-shadow:inset 0 1px 0 0 rgba(255,255,255,.85),inset 0 -1px 0 0 rgba(255,255,255,.25),0 12px 32px -14px rgba(20,28,66,.42)}
.glass .hdr{background:rgba(255,255,255,.46);-webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);border-bottom-color:rgba(255,255,255,.55)}
.glass .navpill{background:rgba(255,255,255,.5);-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);box-shadow:inset 0 1px 0 0 rgba(255,255,255,.8)}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.glass .card,.glass .hdr,.glass .navpill{background:rgba(255,255,255,.92)}}
@media (prefers-reduced-transparency:reduce){.glass .card,.glass .hdr,.glass .navpill{background:rgba(255,255,255,.86);-webkit-backdrop-filter:blur(10px) saturate(130%);backdrop-filter:blur(10px) saturate(130%)}}
.theme-switching,.theme-switching *,.theme-switching *::before,.theme-switching *::after{transition:none!important}
.fmain{max-width:72rem;margin:0 auto;padding:1.5rem 1rem 2rem}
.ffoot{max-width:72rem;margin:0 auto;padding:1.5rem 1rem 5rem;border-top:1px solid var(--line);display:flex;flex-direction:column;align-items:center;gap:.5rem;text-align:center;font-size:.875rem;color:var(--slate-400)}
.ffoot .links,.ffoot nav{display:flex;flex-wrap:wrap;justify-content:center;gap:.25rem 1rem}
.ffoot .links a{color:var(--slate-400);text-decoration:none}
.ffoot .links a:hover{color:var(--brand)}
.ffoot nav a{font-size:.75rem;font-weight:500;color:var(--brand);text-decoration:none}
.ffoot nav a:hover{text-decoration:underline}
.ffoot p{margin:0;font-size:.75rem;color:var(--slate-500)}
@media (min-width:640px){.fmain{padding-inline:1.5rem}}
.langsuggest{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .75rem;width:max-content;max-width:calc(100vw - 2rem);background:var(--ink-900);border:1px solid var(--line);border-radius:1rem;padding:.5rem .55rem .5rem 1rem;box-shadow:0 10px 30px rgb(0 0 0/.2);font-size:.875rem;color:var(--slate-300)}
.langsuggest a{background:var(--brand-600);color:#fff;border-radius:.5rem;padding:.2rem .7rem;text-decoration:none;font-weight:500}
.langsuggest button{background:none;border:0;color:var(--slate-400);cursor:pointer;padding:.2rem .5rem;border-radius:.5rem;font-size:1rem}
`.trim();

/** The header's theme switch, the phone menu and the language links, as the app
 *  wires them: a theme picked here is the same stored choice the app reads. */
export const APP_SCRIPT = `(function(){var r=document.documentElement,bs=document.querySelectorAll("[data-theme-set]");
function cur(){return r.classList.contains("glass")?"glass":r.classList.contains("light")?"light":"dark"}
function mark(){var c=cur();bs.forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-theme-set")===c))})}
function show(t){r.classList.add("theme-switching");r.classList.toggle("light",t==="light");r.classList.toggle("glass",t==="glass");void getComputedStyle(r).transitionProperty;r.classList.remove("theme-switching");mark()}
bs.forEach(function(b){b.addEventListener("click",function(){var t=b.getAttribute("data-theme-set");show(t);try{localStorage.setItem("theme",t)}catch(e){}})});mark();
try{var mq=matchMedia("(prefers-color-scheme: dark)");mq.addEventListener("change",function(e){var s=null;try{s=localStorage.getItem("theme")}catch(x){}if(s!=="dark"&&s!=="light"&&s!=="glass")show(e.matches?"dark":"glass")})}catch(e){}
var mb=document.querySelector("[aria-controls=site-nav]"),l=document.getElementById("site-nav");if(mb&&l)mb.addEventListener("click",function(){mb.setAttribute("aria-expanded",String(l.classList.toggle("open")))});
document.querySelectorAll("[data-lang]").forEach(function(a){a.addEventListener("click",function(){try{localStorage.setItem("lang",a.getAttribute("data-lang"))}catch(e){}})})})();`;

// ── header and footer ─────────────────────────────────────────────────────────
// The calculator's own nav, in its four groups, with the news as the last stop:
// every tool is one click away from the feed, as the feed is from every tool.
export const NAV: { page: string; file: string }[][] = [
  [
    { page: "sizing", file: "" },
    { page: "config", file: "config.html" },
    { page: "train", file: "train.html" },
  ],
  [
    { page: "fit", file: "fit.html" },
    { page: "anatomy", file: "anatomy.html" },
    { page: "compare", file: "compare.html" },
    { page: "decode", file: "decode.html" },
  ],
  [{ page: "vllm", file: "vllm.html" }],
  [
    { page: "learn", file: "learn.html" },
    { page: "news", file: FEED_HUB },
  ],
];
const CHEVRON = `<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>`;
const THEME_LABEL = { en: "Theme", tr: "Tema" };
const LANG_LABEL = { en: "Language", tr: "Dil" };

export interface FrameCtx {
  lang: Lang;
  file: string;
  href: (lang: Lang, file?: string) => string;
  /** The site's base path, for the favicon. */
  base: string;
  /** Whether the build has news posts: the nav links to the feed only then. */
  feed: boolean;
}

/** The app's header. `current` is the nav page this one is (the news), or null for
 *  a page the nav does not list (a guide), whose own name then labels the phone menu. */
export function appHeader({ lang, file, href, base, feed }: FrameCtx, current: string | null, label: string): string {
  const d = DICTS[lang];
  const groups = NAV.map((g) => g.filter((i) => i.page !== "news" || feed)).map(
    (g) =>
      `<div class="grp"><span class="sep" aria-hidden="true"></span>${g
        .map((i) => `<a class="tab" href="${href(lang, i.file)}"${i.page === current ? ' aria-current="page"' : ""}>${esc(d[`nav.${i.page}`])}</a>`)
        .join("")}</div>`
  ).join("");
  const themes = (["dark", "light", "glass"] as const).map((v) => `<button type="button" data-theme-set="${v}" aria-pressed="false">${esc(d[`theme.${v}`])}</button>`).join("");
  const langs = LANGS.map((l) => `<a href="${href(l, file)}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === lang ? ' aria-current="page"' : ""}>${l.toUpperCase()}</a>`).join("");
  return `<header class="hdr"><div class="hin">
<div class="hrow"><a class="brand" href="${href(lang)}"><img src="${base}favicon.svg" alt="" width="28" height="28"><b>LLMScale</b><span class="badge">${esc(d["header.badge"])}</span></a>
<div class="ctrls"><div class="seg" role="group" aria-label="${THEME_LABEL[lang]}">${themes}</div><div class="seg" role="group" aria-label="${LANG_LABEL[lang]}">${langs}</div></div></div>
<nav class="pnav" aria-label="LLMScale"><div class="navpill">
<div class="mbar"><span class="tab on">${esc(label)}</span><button type="button" class="tab" aria-controls="site-nav" aria-expanded="false">${esc(d["nav.menu"])}${CHEVRON}</button></div>
<div id="site-nav">${groups}</div>
</div></nav>
</div></header>`;
}

export function appFooter({ lang, file, href }: FrameCtx): string {
  const d = DICTS[lang];
  const o = other(lang);
  return `<footer class="ffoot">
<div class="links"><a href="https://github.com/tahircengiz/LLMScale" rel="noreferrer">github.com/tahircengiz/LLMScale</a><a href="https://tr.linkedin.com/in/tahircengiz" rel="noreferrer">linkedin.com/tahircengiz</a><a href="${href(o, file)}" hreflang="${o}" lang="${o}" data-lang="${o}">${LANG_NAME[o]}</a></div>
<nav aria-label="${esc(d["footer.guides"])}"><a href="${href(lang, MODELS_HUB)}">${esc(d["footer.models"])}</a><a href="${href(lang, GPUS_HUB)}">${esc(d["footer.gpus"])}</a><a href="${href(lang, CONCEPTS_HUB)}">${esc(d["footer.concepts"])}</a></nav>
<p>${esc(d["footer.privacy"])}</p>
</footer>`;
}
