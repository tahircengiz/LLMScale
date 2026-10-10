// Reading the sources: RSS 2.0 and Atom (which covers GitHub releases, arXiv and
// Reddit), the Hugging Face models API and the Hacker News search API, each into
// the same flat item. Parsing is by pattern, not by a full XML parser: a feed
// item is a handful of known elements, and a feed that breaks the pattern costs
// one source one run, never the run.

import { decodeEntities, unwrapCdata } from "./text.ts";

export interface RawItem {
  title: string;
  url: string;
  /** ISO 8601, or null when the item carries no date. */
  published: string | null;
  /** The item's HTML or text body as the feed gives it. */
  content: string;
  /** The Hugging Face repo, for items from the models API. */
  hfRepo?: string;
  /** Extra context for the screener — likes, points, tags. */
  meta?: string;
}

const tagText = (block: string, ...names: string[]): string | undefined => {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`, "i"));
    if (m) return decodeEntities(unwrapCdata(m[1])).trim();
  }
  return undefined;
};

function linkOf(block: string): string | undefined {
  // Atom: the alternate link (or the first link without a rel); RSS: <link>text</link>.
  const atom = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  const attr = (a: string, k: string) => a.match(new RegExp(`\\b${k}\\s*=\\s*"([^"]*)"`, "i"))?.[1];
  const alt = atom.find((a) => attr(a, "href") && (attr(a, "rel") ?? "alternate") === "alternate" && !/pdf/i.test(attr(a, "type") ?? ""));
  if (alt) return decodeEntities(attr(alt, "href")!);
  const rss = tagText(block, "link");
  if (rss && /^https?:\/\//.test(rss)) return rss;
  const guid = tagText(block, "guid", "id");
  return guid && /^https?:\/\//.test(guid) ? guid : undefined;
}

function isoOf(s: string | undefined): string | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function parseFeed(xml: string): RawItem[] {
  const out: RawItem[] = [];
  for (const m of xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const block = m[2];
    const title = tagText(block, "title");
    const url = linkOf(block);
    if (!title || !url) continue;
    out.push({
      title: title.replace(/\s+/g, " "),
      url,
      published: isoOf(tagText(block, "published", "pubDate", "dc:date", "updated")),
      content: tagText(block, "content:encoded", "content", "description", "summary") ?? "",
    });
  }
  return out;
}

interface HfModel {
  id: string;
  likes?: number;
  downloads?: number;
  trendingScore?: number;
  createdAt?: string;
  tags?: string[];
  pipeline_tag?: string;
}

/** Trending text models. Quantized copies, adapters and merges of another model
 *  are left out: the news is the model they derive from. */
export function parseHfModels(json: string): RawItem[] {
  const list = JSON.parse(json) as HfModel[];
  return list
    .filter((m) => !(m.tags ?? []).some((t) => /^base_model:(quantized|adapter|merge):/.test(t)))
    .map((m) => ({
      title: m.id,
      url: `https://huggingface.co/${m.id}`,
      published: isoOf(m.createdAt),
      content: "",
      hfRepo: m.id,
      meta: `likes ${m.likes ?? 0}, downloads ${m.downloads ?? 0}, tags: ${(m.tags ?? []).filter((t) => !t.startsWith("region:")).slice(0, 14).join(", ")}`,
    }));
}

interface HnHit {
  objectID: string;
  title?: string;
  url?: string | null;
  created_at?: string;
  points?: number;
  num_comments?: number;
}

export function parseHn(json: string): RawItem[] {
  const { hits } = JSON.parse(json) as { hits: HnHit[] };
  return hits
    .filter((h) => h.title)
    .map((h) => {
      const discussion = `https://news.ycombinator.com/item?id=${h.objectID}`;
      return {
        title: h.title!,
        url: h.url || discussion,
        published: isoOf(h.created_at),
        content: h.url ? `Discussion: ${discussion}` : "",
        meta: `${h.points ?? 0} points, ${h.num_comments ?? 0} comments`,
      };
    });
}
