// Step one: read every source, keep what is recent and on topic, and remember all
// of it, so tomorrow's run does not see today's items as new.

import { parseFeed, parseHfModels, parseHn, type RawItem } from "./feeds.ts";
import { isMajorMinorRelease, passesPrefilter, relevance } from "./relevance.ts";
import { SOURCES, type Source } from "./sources.ts";
import type { Store } from "./store.ts";
import { clip, hfRepoOf, htmlToText } from "./text.ts";

export const USER_AGENT = "LLMScale-newsroom/0.1 (+https://tahircengiz.github.io/LLMScale/feed/)";

export async function fetchText(url: string, timeoutMs = 20_000): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "*/*" }, signal: AbortSignal.timeout(timeoutMs), redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export interface SourceResult {
  source: string;
  read: number;
  recent: number;
  added: number;
  onTopic: number;
  error?: string;
}

export function parseSource(src: Source, body: string): RawItem[] {
  if (src.format === "hf-models") return parseHfModels(body);
  if (src.format === "hn") return parseHn(body);
  return parseFeed(body);
}

/** The items of one source worth remembering this run: recent, newest first, at most `take`. */
export function select(src: Source, items: RawItem[], now: Date, maxAgeDays: number): RawItem[] {
  const since = now.getTime() - maxAgeDays * 86_400_000;
  return items
    .filter((i) => (i.published ? Date.parse(i.published) >= since : true))
    .filter((i) => !src.majorMinorOnly || isMajorMinorRelease(i.url))
    .sort((a, b) => (b.published ?? "").localeCompare(a.published ?? ""))
    .slice(0, src.take);
}

export async function collect(
  store: Store,
  opts: { sources?: Source[]; maxAgeDays?: number; now?: Date; fetch?: (url: string) => Promise<string> } = {}
): Promise<SourceResult[]> {
  const { sources = SOURCES, maxAgeDays = 4, now = new Date(), fetch = fetchText } = opts;
  const results = await Promise.all(
    sources.map(async (src): Promise<SourceResult> => {
      try {
        const all = parseSource(src, await fetch(src.url));
        const recent = select(src, all, now, src.maxAgeDays ?? maxAgeDays);
        let added = 0;
        let onTopic = 0;
        for (const item of recent) {
          const text = clip(htmlToText(item.content), 20_000);
          const topical = src.onTopic || passesPrefilter(relevance(`${item.title}\n${text}`));
          const isNew = store.addCandidate({
            url: item.url,
            title: item.title,
            content: text,
            source: src.name,
            sourceId: src.id,
            kind: src.kind,
            published: item.published,
            hfRepo: item.hfRepo ?? hfRepoOf(item.url) ?? null,
            meta: item.meta ?? null,
            status: topical ? "new" : "skipped",
          });
          if (isNew) {
            added++;
            if (topical) onTopic++;
          }
        }
        return { source: src.id, read: all.length, recent: recent.length, added, onTopic };
      } catch (e) {
        return { source: src.id, read: 0, recent: 0, added: 0, onTopic: 0, error: (e as Error).message };
      }
    })
  );
  return results;
}
