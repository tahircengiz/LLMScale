// Writes sitemap.xml from the built site.
//
//   node scripts/sitemap.ts [outDir=dist]
//
// Runs last in the build. Every page carries a canonical URL and hreflang links to
// its English and Turkish versions, so the sitemap is read off the pages rather
// than listed by hand — a hand list is how a new page goes unsubmitted. It also
// refuses to write one if a page points at a version that was never built. Each
// URL's <lastmod> is read off the page too: its structured data's dateModified
// (see lastModified.ts); a page without one goes without.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const outDir = process.argv[2] ?? "dist";

function* htmlFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith(".html")) yield path;
  }
}

type Page = { rel: string; canonical: string; alternates: Record<string, string>; modified?: string };
const pages: Page[] = [];
for (const path of htmlFiles(outDir)) {
  const html = readFileSync(path, "utf8");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const alternates = Object.fromEntries(
    [...html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]])
  );
  if (!canonical || !alternates.en || !alternates.tr || !alternates["x-default"]) {
    throw new Error(`${path}: needs a canonical URL and hreflang for en, tr and x-default`);
  }
  if (alternates.en !== canonical && alternates.tr !== canonical) {
    throw new Error(`${path}: its canonical ${canonical} is neither of its own language versions`);
  }
  const modified = html.match(/"dateModified":"([^"]+)"/)?.[1];
  pages.push({ rel: relative(outDir, path).replaceAll("\\", "/"), canonical, alternates, modified });
}

const built = new Set(pages.map((p) => p.canonical));
for (const p of pages) {
  for (const target of Object.values(p.alternates)) {
    if (!built.has(target)) throw new Error(`${p.canonical} names ${target} as a version, but no such page was built`);
  }
}

// The home page first, then the rest in address order, each language beside the other.
// The home page is the root index.html — told by its file, since every hub's
// address ends in a slash too (guessing from the address once put the concepts
// hub first).
const home = pages.find((p) => p.rel === "index.html")?.canonical;
if (!home) throw new Error(`${outDir}/index.html: no home page to list first`);
pages.sort((a, b) =>
  a.canonical === home ? -1 : b.canonical === home ? 1 : a.alternates.en.localeCompare(b.alternates.en) || a.canonical.localeCompare(b.canonical)
);

const links = (a: Record<string, string>) =>
  ["en", "tr", "x-default"].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${a[l]}"/>`).join("");
writeFileSync(
  join(outDir, "sitemap.xml"),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...pages.map((p) => `  <url><loc>${p.canonical}</loc>${p.modified ? `<lastmod>${p.modified}</lastmod>` : ""}${links(p.alternates)}</url>`),
    "</urlset>",
    "",
  ].join("\n")
);
console.log(`ok    sitemap.xml  ${pages.length} URLs, ${pages.filter((p) => p.modified).length} with <lastmod>`);
