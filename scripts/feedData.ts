// Reads the news feed's posts from disk for the build: every content/feed/*.json,
// validated by src/lib/feed.ts and sorted newest first.
//
// FEED_DIR points the build somewhere else — a preview reads the sample posts in
// scripts/fixtures/feed/ this way, without them ever sitting where the live
// build would publish them.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import { byNewest, validatePost, type FeedPost } from "../src/lib/feed.ts";

export const FEED_DIR = process.env.FEED_DIR ?? "content/feed";
const KNOWN = new Set(KNOWN_MODELS.map((m) => m.id));

/** The posts in `dir`, newest first. Throws with every problem in every file, so
 *  one build shows them all instead of one per attempt. */
export function loadFeed(dir = FEED_DIR): FeedPost[] {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const posts: FeedPost[] = [];
  const problems: string[] = [];
  for (const file of files) {
    const stem = file.slice(0, -".json".length);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, file), "utf8"));
    } catch (e) {
      problems.push(`${file}: not valid JSON (${(e as Error).message})`);
      continue;
    }
    const errs = validatePost(raw, { knownModels: KNOWN, fileStem: stem, mediaExists: (f) => existsSync(join(dir, "media", f)) });
    if (errs.length) problems.push(...errs.map((e) => `${file}: ${e}`));
    else posts.push(raw as FeedPost);
  }
  if (problems.length) throw new Error(`${dir}: ${problems.length} problem(s) in the feed\n  ${problems.join("\n  ")}`);
  return posts.sort(byNewest);
}
