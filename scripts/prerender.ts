// Writes each page's content into its built HTML, in both languages, so the text
// is there before any JavaScript runs.
//
//   node scripts/prerender.ts [clientOutDir=dist] [ssrOutDir=dist-ssr]
//
// Runs after both build passes (see "build" in package.json). For every entry
// Vite built it writes:
//   - the English page into <entry>.html and the Turkish one into tr/<entry>.html,
//     each rendered in its own language with nothing chosen, the Turkish head
//     taken from src/lib/pageMeta.ts;
//   - hreflang links tying each pair together;
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
import { TR_META } from "../src/lib/pageMeta.ts";
import type { Lang } from "../src/lib/dict.ts";
import type { CompareSnapshot } from "../src/lib/compareSnapshot.ts";
import { COMPARE_FIXTURES, replayCompare, snapshotTag } from "./compareReplay.ts";
import { lastCommitDate, modifiedDate } from "./lastModified.ts";

const [outDir = "dist", ssrDir = "dist-ssr"] = process.argv.slice(2);
const { render } = (await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href)) as {
  render: (lang: Lang, compare?: CompareSnapshot) => string;
};
type Chapter = Partial<Record<Lang, { e: string; h: string; p: string }>>;
// Imported by URL so the type checker does not go looking for types in a .js file.
const { CH } = (await import(new URL("../src/learnChapters.js", import.meta.url).href)) as { CH: Chapter[] };

const LANGS: Lang[] = ["en", "tr"];
const MOUNT = '<div id="root"></div>';
const SCROLL_MOUNT = '<div id="scroll"></div>';
const LD_MARK = "<!-- prerender: language alternates and structured data -->";

// What each entry's page is made from, to date it by: beside the entry itself and
// the Turkish head (pageMeta.ts), its component — and on an app page the
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

/** The Turkish head: language, title, description, social cards and canonical. */
function translateHead(html: string, file: string, trUrl: string): string {
  const tr = TR_META[file];
  if (!tr) throw new Error(`${file}: no Turkish head in src/lib/pageMeta.ts`);
  html = replaceOnce(html, file, '<html lang="en">', '<html lang="tr">');
  html = replaceOnce(html, file, /<title>[^<]*<\/title>/, `<title>${escText(tr.title)}</title>`);
  html = setMeta(html, file, "name", "description", tr.description);
  html = setMeta(html, file, "property", "og:title", tr.ogTitle);
  html = setMeta(html, file, "property", "og:description", tr.ogDescription);
  html = setMeta(html, file, "property", "og:url", trUrl);
  html = setMeta(html, file, "property", "og:locale", "tr_TR");
  html = setMeta(html, file, "property", "og:locale:alternate", "en_US");
  html = setMeta(html, file, "name", "twitter:title", tr.ogTitle);
  html = setMeta(html, file, "name", "twitter:description", tr.ogDescription);
  html = replaceOnce(html, file, /<link rel="canonical" href="[^"]+"/, `<link rel="canonical" href="${trUrl}"`);
  // One folder down, the favicon is the only relative reference an entry has.
  // (learn.html's link to index.html is relative on purpose: it stays in Turkish.)
  html = html.replaceAll('href="favicon.svg"', 'href="../favicon.svg"');
  // index.html's hand-written WebApplication describes the page in English; the
  // Turkish copy gets a generated one instead.
  return html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
}

/** LLM 101 is not React: learn.js builds its cards from src/learnChapters.js and
 *  fills [data-en]/[data-tr] elements at runtime. Write the page's language of
 *  both into the HTML; learn.js reuses the sections it finds. */
function prerenderLearn(html: string, file: string, lang: Lang): { html: string; text: string } {
  if (!html.includes(SCROLL_MOUNT)) throw new Error(`${file}: neither a React entry nor LLM 101`);
  // Every chapter gets its section, card or not, so section indices match CH.
  const sections = CH.map((ch, i) => {
    const c = ch[lang];
    return c
      ? `<section data-i="${i}"><div class="card"><div class="eyebrow">${c.e}</div><h2>${c.h}</h2><p>${c.p}</p></div></section>`
      : `<section data-i="${i}"></section>`;
  }).join("");
  // The attribute already holds escaped HTML text, so it can be used as content as-is.
  const fill = new RegExp(`(<(\\w+)\\b[^>]*\\sdata-${lang}="([^"]*)"[^>]*>)(<\\/\\2>)`, "g");
  html = html.replace(fill, (_m, open: string, _tag: string, value: string, close: string) => open + value + close);
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
  const home: Record<Lang, string> = { en: enUrl.replace(/[^/]*$/, ""), tr: `${enUrl.replace(/[^/]*$/, "")}tr/` };
  const page = file === "index.html" ? "" : file;
  const urls: Record<Lang, string> = { en: home.en + page, tr: home.tr + page };

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

  for (const lang of LANGS) {
    let html = lang === "tr" ? translateHead(pristine, file, urls.tr) : pristine;

    const description = unesc(getMeta(html, "name", "description") ?? "");
    const ogTitle = unesc(getMeta(html, "property", "og:title") ?? "");
    if (!description || !ogTitle) throw new Error(`${file}: missing description or og:title`);
    // "LLMScale — Model ↔ Task Fit" names the page as "Model ↔ Task Fit".
    const name = ogTitle.replace(/^LLMScale\s+—\s+/, "");

    const head: string[] = [
      // Each version names both, itself included; x-default is the English one.
      `<link rel="alternate" hreflang="en" href="${urls.en}" />`,
      `<link rel="alternate" hreflang="tr" href="${urls.tr}" />`,
      `<link rel="alternate" hreflang="x-default" href="${urls.en}" />`,
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
        inLanguage: lang,
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
        inLanguage: lang,
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
      const pathname = (lang === "tr" ? `${base}tr/` : base) + page;
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

    const dir = lang === "tr" ? join(outDir, "tr") : outDir;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, file), html);
    console.log(`ok    ${lang === "tr" ? "tr/" : ""}${file}  ${words(text)} words  ${modified ?? "undated"}`);
  }
}
if (rendered === 0) throw new Error(`no React entry found in ${outDir}`);
