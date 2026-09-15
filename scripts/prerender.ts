// Writes each page's content into its built HTML, so the text is there before any
// JavaScript runs.
//
//   node scripts/prerender.ts [clientOutDir=dist] [ssrOutDir=dist-ssr]
//
// Runs after both build passes (see "build" in package.json). Before this, every
// entry shipped an empty <div id="root">: nine words to a crawler that does not
// execute JavaScript, and the questions people search for are exactly the ones
// the pages answer.
//
// What is rendered is the page as a first-time English visitor sees it, with
// nothing chosen. main.tsx then replaces it rather than hydrating it — see the
// comment there — and each entry's bootstrap hides it from visitors who would
// otherwise watch it swap.
//
// It also adds structured data. That is generated here from each page's own
// title, description and canonical URL instead of being copied into every entry
// by hand, because hand copies drift: train.html once described itself to search
// engines as the task-fit page.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [outDir = "dist", ssrDir = "dist-ssr"] = process.argv.slice(2);
const { render } = (await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href)) as {
  render: () => string;
};

const MOUNT = '<div id="root"></div>';
const SCROLL_MOUNT = '<div id="scroll"></div>';

type Chapter = { en?: { e: string; h: string; p: string } };
// Imported by URL so the type checker does not go looking for types in a .js file.
const learnChapters = new URL("../src/learnChapters.js", import.meta.url).href;

/** LLM 101 is not React: learn.js builds its cards from src/learnChapters.js and
 *  fills every [data-en] element at runtime. Write the English of both into the
 *  HTML. learn.js reuses the sections it finds, so nothing is built twice. */
async function prerenderLearn(html: string): Promise<{ html: string; text: string }> {
  const { CH } = (await import(learnChapters)) as { CH: Chapter[] };
  // Every chapter gets its section, card or not, so section indices match CH.
  const sections = CH.map((ch, i) =>
    ch.en
      ? `<section data-i="${i}"><div class="card"><div class="eyebrow">${ch.en.e}</div><h2>${ch.en.h}</h2><p>${ch.en.p}</p></div></section>`
      : `<section data-i="${i}"></section>`
  ).join("");
  // The attribute already holds escaped HTML text, so it can be used as content as-is.
  const filled = html.replace(/(<(\w+)\b[^>]*\sdata-en="([^"]*)"[^>]*>)(<\/\2>)/g, (_m, open, _tag, en, close) => open + en + close);
  if (!filled.includes(SCROLL_MOUNT)) throw new Error("learn.html: no #scroll to fill");
  const text = sections + filled.slice(filled.indexOf("<body"));
  return { html: filled.replace(SCROLL_MOUNT, () => `<div id="scroll">${sections}</div>`), text };
}
const LD_MARK = "<!-- prerender: structured data -->";

const meta = (html: string, attr: string, key: string) =>
  html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`))?.[1];
const canonicalOf = (html: string) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const words = (markup: string) =>
  markup.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;
const ld = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

let rendered = 0;
for (const file of readdirSync(outDir).filter((f) => f.endsWith(".html")).sort()) {
  const path = join(outDir, file);
  let html = readFileSync(path, "utf8");
  if (html.includes(LD_MARK)) throw new Error(`${file}: already prerendered — run a fresh build`);

  const canonical = canonicalOf(html);
  const description = meta(html, "name", "description");
  const ogTitle = meta(html, "property", "og:title");
  if (!canonical || !description || !ogTitle) throw new Error(`${file}: missing canonical, description or og:title`);
  // "LLMScale — Model ↔ Task Fit" names the page as "Model ↔ Task Fit".
  const name = ogTitle.replace(/^LLMScale\s+—\s+/, "");
  const home = canonical.replace(/[^/]*$/, "");

  const blocks: object[] = [];
  if (file !== "index.html") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "LLMScale", item: home },
        { "@type": "ListItem", position: 2, name, item: canonical },
      ],
    });
  }
  // index.html carries its own, fuller WebApplication; the tools get one each.
  const isApp = html.includes(MOUNT);
  if (isApp && !html.includes("application/ld+json")) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `LLMScale ${name}`,
      url: canonical,
      description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any — runs entirely in the browser",
      browserRequirements: "Requires JavaScript",
      inLanguage: ["en", "tr"],
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isPartOf: { "@type": "WebSite", name: "LLMScale", url: home },
      author: { "@type": "Person", name: "Tahir Cengiz", url: "https://github.com/tahircengiz" },
    });
  }
  if (blocks.length) {
    html = html.replace("</head>", () => `  ${LD_MARK}\n    ${blocks.map(ld).join("\n    ")}\n  </head>`);
  }

  if (!isApp) {
    if (!html.includes(SCROLL_MOUNT)) throw new Error(`${file}: neither a React entry nor LLM 101`);
    const learn = await prerenderLearn(html);
    writeFileSync(path, learn.html);
    console.log(`ok    ${file}  ${words(learn.text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ""))} words`);
    continue;
  }

  // The asset URLs already carry the base path Vite built for (/LLMScale/ on
  // GitHub Pages, / elsewhere), so read it back instead of deciding it twice.
  const base = html.match(/src="([^"]*)assets\//)?.[1];
  if (base === undefined) throw new Error(`${file}: cannot find the asset base path`);
  const pathname = file === "index.html" ? base : base + file;

  // The pages read the URL while rendering (which surface, which model); nothing
  // else of the browser is touched before effects, and effects do not run here.
  (globalThis as { window?: unknown }).window = {
    location: { pathname, search: "", href: `https://prerender.invalid${pathname}` },
    history: { replaceState() {} },
  };
  const body = render();
  delete (globalThis as { window?: unknown }).window;

  html = html.replace(MOUNT, () => `<div id="root">${body}</div>`);
  writeFileSync(path, html);
  rendered++;
  console.log(`ok    ${file}  ${words(body)} words`);
}
if (rendered === 0) throw new Error(`no React entry found in ${outDir}`);
