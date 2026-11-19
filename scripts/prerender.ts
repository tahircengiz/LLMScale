// Writes each page's content into its built HTML, in every language the site is
// in (src/lib/langs.ts), so the text is there before any JavaScript runs.
//
//   node scripts/prerender.ts [clientOutDir=dist] [ssrOutDir=dist-ssr]
//
// Runs after both build passes (see "build" in package.json). For every entry
// Vite built it writes:
//   - the English page into <entry>.html and each other language's into its
//     folder (tr/<entry>.html), each rendered in its own language with nothing
//     chosen, the other languages' heads taken from src/lib/pageMeta.ts;
//   - hreflang links tying each set together;
//   - structured data generated from each page's own title, description and
//     canonical URL — hand copies drift: train.html once described itself to
//     search engines as the task-fit page;
//   - the date the page last changed, as dateModified (see lastModified.ts);
//   - on compare.html, the default comparison's values from the Hub answers kept
//     in the repository, and a copy of them the page starts from (compareReplay.ts).
//
// Before this, every entry shipped an empty <div id="root">, and Turkish existed
// only after JavaScript switched a page in place, at an address search engines
// had indexed in English.
//
// main.tsx replaces the prerendered markup rather than hydrating it — see the
// comment there — and each entry's bootstrap hides it from a visitor whose link
// carries its own state, who would otherwise watch it swap.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PAGE_META } from "../src/lib/pageMeta.ts";
import { DEFAULT_LANG, ENABLED_LANGS, LANG_META, htmlLangAttrs, type Lang } from "../src/lib/langs.ts";
import type { CompareSnapshot } from "../src/lib/compareSnapshot.ts";
import { COMPARE_FIXTURES, replayCompare, snapshotTag } from "./compareReplay.ts";
import { lastCommitDate, modifiedDate } from "./lastModified.ts";

const [outDir = "dist", ssrDir = "dist-ssr"] = process.argv.slice(2);
const { render } = (await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href)) as {
  render: (lang: Lang, compare?: CompareSnapshot) => string;
};
type Chapter = { text?: Partial<Record<Lang, { e: string; h: string; p: string }>> };
// Imported by URL so the type checker does not go looking for types in a .js file.
const { CH, UI } = (await import(new URL("../src/learnChapters.js", import.meta.url).href)) as {
  CH: Chapter[];
  UI: Partial<Record<Lang, Record<string, string>>>;
};
const MOUNT = '<div id="root"></div>';
const SCROLL_MOUNT = '<div id="scroll"></div>';
const LD_MARK = "<!-- prerender: language alternates and structured data -->";

// What each entry's page is made from, to date it by: beside the entry itself and
// the other languages' heads (pageMeta.ts), its component — and on an app page the
// explainer App.tsx puts under every one (About.tsx) — with everything they
// import. Every entry loads the whole app, so the bundle cannot tell one page's
// files from another's. compare.html also shows the kept Hub answers.
const PAGE_SOURCES: Record<string, string | string[]> = {
  "index.html": "src/pages/SizingPage.tsx",
  "anatomy.html": "src/pages/AnatomyPage.tsx",
  "compare.html": ["src/pages/ComparePage.tsx", COMPARE_FIXTURES],
  "config.html": "src/pages/ConfigPage.tsx",
  "decode.html": "src/pages/DecodePage.tsx",
  "fit.html": "src/pages/FitPage.tsx",
  "gpu-compare.html": "src/pages/GpuComparePage.tsx",
  "learn.html": "src/learn.js",
  "plan.html": "src/pages/PlanPage.tsx",
  "serving.html": "src/pages/ServingPage.tsx",
  "train.html": "src/pages/TrainPage.tsx",
  "vllm.html": "src/pages/VllmPage.tsx",
};

const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const escAttr = (s: string) => escText(s).replace(/"/g, "&quot;");
const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&amp;/g, "&");
const words = (markup: string) =>
  markup.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;
const ld = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const metaRe = (attr: string, key: string) => new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")([^"]*)(")`);
const getMeta = (html: string, attr: string, key: string) => html.match(metaRe(attr, key))?.[2];
function setMeta(html: string, file: string, attr: string, key: string, value: string): string {
  if (!metaRe(attr, key).test(html)) throw new Error(`${file}: no <meta ${attr}="${key}"> to translate`);
  return html.replace(metaRe(attr, key), (_m, open: string, _old: string, close: string) => open + escAttr(value) + close);
}
function replaceOnce(html: string, file: string, from: string | RegExp, to: string): string {
  const hits = typeof from === "string" ? html.split(from).length - 1 : (html.match(new RegExp(from, "g")) ?? []).length;
  if (hits !== 1) throw new Error(`${file}: expected one ${from} to replace, found ${hits}`);
  return html.replace(from, () => to);
}

/** Every page's language, direction and other-language social locales: the
 *  entry is written as `<html lang="en">` with one og:locale:alternate. */
function setLangHead(html: string, file: string, lang: Lang): string {
  html = replaceOnce(html, file, '<html lang="en">', `<html ${htmlLangAttrs(lang)}>`);
  const alt = /([ \t]*)<meta property="og:locale:alternate" content="[^"]*" \/>\n/;
  const indent = html.match(alt)?.[1];
  if (indent === undefined) throw new Error(`${file}: no <meta property="og:locale:alternate"> to translate`);
  const alts = ENABLED_LANGS.filter((l) => l !== lang).map((l) => `${indent}<meta property="og:locale:alternate" content="${LANG_META[l].og}" />\n`);
  return replaceOnce(html, file, alt, alts.join(""));
}

/** Another language's head: title, description, social cards and canonical. */
function translateHead(html: string, file: string, lang: Exclude<Lang, typeof DEFAULT_LANG>, langUrl: string): string {
  const m = PAGE_META[lang][file];
  if (!m) throw new Error(`${file}: no ${lang} head in src/lib/pageMeta.ts`);
  html = replaceOnce(html, file, /<title>[^<]*<\/title>/, `<title>${escText(m.title)}</title>`);
  html = setMeta(html, file, "name", "description", m.description);
  html = setMeta(html, file, "property", "og:title", m.ogTitle);
  html = setMeta(html, file, "property", "og:description", m.ogDescription);
  html = setMeta(html, file, "property", "og:url", langUrl);
  html = setMeta(html, file, "property", "og:locale", LANG_META[lang].og);
  html = setMeta(html, file, "name", "twitter:title", m.ogTitle);
  html = setMeta(html, file, "name", "twitter:description", m.ogDescription);
  html = replaceOnce(html, file, /<link rel="canonical" href="[^"]+"/, `<link rel="canonical" href="${langUrl}"`);
  // One folder down, the favicon is the only relative reference an entry has.
  // (learn.html's link to index.html is relative on purpose: it stays in the language.)
  html = html.replaceAll('href="favicon.svg"', 'href="../favicon.svg"');
  // index.html's hand-written WebApplication describes the page in English; the
  // other languages get a generated one instead.
  return html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
}

/** LLM 101 is not React: learn.js builds its cards from src/learnChapters.js and
 *  fills its [data-i18n] elements from the same file at runtime. Write the page's
 *  language of both into the HTML; learn.js reuses the sections it finds. */
function prerenderLearn(html: string, file: string, lang: Lang): { html: string; text: string } {
  if (!html.includes(SCROLL_MOUNT)) throw new Error(`${file}: neither a React entry nor LLM 101`);
  const ui = UI[lang];
  if (!ui) throw new Error(`${file}: no ${lang} words in src/learnChapters.js`);
  // Every chapter gets its section, card or not, so section indices match CH.
  const sections = CH.map((ch, i) => {
    if (!ch.text) return `<section data-i="${i}"></section>`;
    const c = ch.text[lang];
    if (!c) throw new Error(`${file}: chapter ${i} has no ${lang} card in src/learnChapters.js`);
    return `<section data-i="${i}"><div class="card"><div class="eyebrow">${c.e}</div><h2>${c.h}</h2><p>${c.p}</p></div></section>`;
  }).join("");
  const fill = /(<(\w+)\b[^>]*\sdata-i18n="([\w.]+)"[^>]*>)(<\/\2>)/g;
  html = html.replace(fill, (_m, open: string, _tag: string, key: string, close: string) => {
    if (!(key in ui)) throw new Error(`${file}: no ${lang} text for data-i18n="${key}"`);
    return open + escText(ui[key]) + close;
  });
  html = html.replace(SCROLL_MOUNT, () => `<div id="scroll">${sections}</div>`);
  const text = html.slice(html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
  return { html, text };
}

const entries = readdirSync(outDir)
  .filter((f) => f.endsWith(".html"))
  .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
let rendered = 0;
// compare.html opens on two models the browser asks the Hub about; the kept
// answers fill them in, judged for age at this commit's date.
const compare = await replayCompare(lastCommitDate(["."]));
if (compare) console.log(`ok    compare.html  ${compare.anatomies.length} models from the Hub answers of ${compare.fetched}`);

for (const file of entries) {
  const pristine = readFileSync(join(outDir, file), "utf8");
  if (pristine.includes(LD_MARK)) throw new Error(`${file}: already prerendered — run a fresh build`);

  const enUrl = pristine.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!enUrl) throw new Error(`${file}: no canonical URL`);
  const root = enUrl.replace(/[^/]*$/, "");
  const page = file === "index.html" ? "" : file;
  const home = Object.fromEntries(ENABLED_LANGS.map((l) => [l, root + LANG_META[l].prefix])) as Record<Lang, string>;
  const urls = Object.fromEntries(ENABLED_LANGS.map((l) => [l, home[l] + page])) as Record<Lang, string>;

  // The asset URLs already carry the base path Vite built for (/LLMScale/ on
  // GitHub Pages, / elsewhere), so read it back instead of deciding it twice.
  const base = pristine.match(/src="([^"]*)assets\//)?.[1];
  if (base === undefined) throw new Error(`${file}: cannot find the asset base path`);
  const isApp = pristine.includes(MOUNT);
  if (isApp) rendered++;
  const source = PAGE_SOURCES[file];
  if (!source) throw new Error(`${file}: no PAGE_SOURCES entry to date the page by`);
  const modified = modifiedDate(file, "src/lib/pageMeta.ts", ...[source].flat(), ...(isApp ? ["src/components/About.tsx"] : []));
  const dated = modified ? { dateModified: modified } : {};

  for (const lang of ENABLED_LANGS) {
    let html = setLangHead(pristine, file, lang);
    if (lang !== DEFAULT_LANG) html = translateHead(html, file, lang, urls[lang]);

    const description = unesc(getMeta(html, "name", "description") ?? "");
    const ogTitle = unesc(getMeta(html, "property", "og:title") ?? "");
    if (!description || !ogTitle) throw new Error(`${file}: missing description or og:title`);
    // "LLMScale — Model ↔ Task Fit" names the page as "Model ↔ Task Fit".
    const name = ogTitle.replace(/^LLMScale\s+—\s+/, "");

    const head: string[] = [
      // Each version names them all, itself included; x-default is the English one.
      ...ENABLED_LANGS.map((l) => `<link rel="alternate" hreflang="${LANG_META[l].hreflang}" href="${urls[l]}" />`),
      `<link rel="alternate" hreflang="x-default" href="${urls[DEFAULT_LANG]}" />`,
    ];
    if (file !== "index.html") {
      head.push(ld({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "LLMScale", item: home[lang] },
          { "@type": "ListItem", position: 2, name, item: urls[lang] },
        ],
      }));
    }
    if (isApp && !html.includes("application/ld+json")) {
      head.push(ld({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: file === "index.html" ? "LLMScale" : `LLMScale ${name}`,
        url: urls[lang],
        description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any — runs entirely in the browser",
        browserRequirements: "Requires JavaScript",
        inLanguage: LANG_META[lang].hreflang,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        isPartOf: { "@type": "WebSite", name: "LLMScale", url: home[lang] },
        author: { "@type": "Person", name: "Tahir Ali Cengiz", url: "https://github.com/tahircengiz" },
        ...dated,
      }));
    } else if (!html.includes("application/ld+json")) {
      // LLM 101 is a page to read, not an app; it needs structured data of its own
      // to carry its date.
      head.push(ld({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name,
        url: urls[lang],
        description,
        inLanguage: LANG_META[lang].hreflang,
        isPartOf: { "@type": "WebSite", name: "LLMScale", url: home[lang] },
        author: { "@type": "Person", name: "Tahir Ali Cengiz", url: "https://github.com/tahircengiz" },
        ...dated,
      }));
    } else if (modified) {
      // A hand-written block: index.html's WebApplication, which the English page keeps.
      html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_m, open: string, json: string, close: string) =>
        open + JSON.stringify({ ...JSON.parse(json), dateModified: modified }).replace(/</g, "\\u003c") + close);
    }
    html = replaceOnce(html, file, "</head>", `  ${LD_MARK}\n    ${head.join("\n    ")}\n  </head>`);

    let text: string;
    if (isApp) {
      const pathname = base + LANG_META[lang].prefix + page;
      // The pages read the URL while rendering (which surface and language, which
      // model); nothing else of the browser is touched before effects, and effects
      // do not run here.
      (globalThis as { window?: unknown }).window = {
        location: { pathname, search: "", hash: "", href: `https://prerender.invalid${pathname}` },
        history: { replaceState() {} },
      };
      const data = file === "compare.html" ? compare : undefined;
      text = render(lang, data);
      delete (globalThis as { window?: unknown }).window;
      html = replaceOnce(html, file, MOUNT, `<div id="root">${text}</div>${data ? snapshotTag(data) : ""}`);
    } else {
      ({ html, text } = prerenderLearn(html, file, lang));
    }

    const dir = join(outDir, LANG_META[lang].prefix);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, file), html);
    console.log(`ok    ${LANG_META[lang].prefix}${file}  ${words(text)} words  ${modified ?? "undated"}`);
  }
}
if (rendered === 0) throw new Error(`no React entry found in ${outDir}`);
