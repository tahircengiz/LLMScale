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
import type { Lang } from "../src/lib/dict.ts";
import { FEED_HUB, FEED_MEDIA, feedPostFile, feedRssFile, paragraphs, type FeedPost } from "../src/lib/feed.ts";
import { createShell, esc, LANGS, readSite, words } from "./shell.ts";
import { article, CSS, ICON, postLd, script, shortTitle, summary, T } from "./feedRender.ts";
import { FEED_DIR, loadFeed } from "./feedData.ts";
import { modifiedDate } from "./lastModified.ts";

const outDir = process.argv[2] ?? "dist";
const posts = loadFeed();
if (!posts.length) {
  console.log(`ok    feed  no posts in ${FEED_DIR}, nothing written`);
  process.exit(0);
}
const site = readSite(outDir);
// A post page is dated by its post; the stream pages change with every post, as
// each new one moves the rest along a page.
const { href, url, page } = createShell(site, { feed: true, modified: modifiedDate("scripts/genFeed.ts", FEED_DIR) });

/** Posts per stream file; scrolling loads the next file's posts in place. */
const PAGE_SIZE = 20;
/** Other posts shown under a single post, so a shared link leads on into the feed. */
const MORE_UNDER_POST = 5;
const streamFile = (n: number) => (n === 1 ? FEED_HUB : `${FEED_HUB}page-${n}.html`);
const ctx = { base: site.base, home: site.home, href, url };

// ── pages ─────────────────────────────────────────────────────────────────────
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
  const body = `<div class="stream card">
<div class="topbar"><h1>${esc(h1)}</h1><a class="pill" href="${url(lang, feedRssFile)}" title="${t.rssTitle}">${ICON.rss}${t.rss}</a></div>
${bio}${chunk.map((p) => article(ctx, lang, p)).join("\n")}
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
  const body = `<div class="stream card">
<div class="topbar"><a class="back" href="${href(lang, FEED_HUB)}">${ICON.back}${t.back}</a><a class="pill" href="${url(lang, feedRssFile)}" title="${t.rssTitle}">${ICON.rss}${t.rss}</a></div>
${article(ctx, lang, p, { standalone: true })}
${others.length ? `<h2 class="morehead">${t.more}</h2>\n${others.map((o) => article(ctx, lang, o, { level: 3 })).join("\n")}\n` : ""}<nav class="more" aria-label="${t.all}"><a href="${href(lang, FEED_HUB)}">${t.all} →</a></nav>
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
    ld: postLd(ctx, lang, p),
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
