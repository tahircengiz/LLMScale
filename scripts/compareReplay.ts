// The comparison compare.html opens with, resolved at build time from the Hub's
// answers kept in scripts/fixtures/compare/ (written by compare-fixtures.ts) by the
// code the page runs in the browser, fetchAnatomy, with fetch served from those
// files: no network, and the same bytes for the same commit.
//
// A model whose answers are not all kept goes out without values, and so does the
// whole table once the answers are more than MAX_AGE_DAYS older than the commit
// being built: dashes, rather than counts nobody has looked at in months. The build
// says which, and how to refresh them.

import { existsSync, readFileSync } from "node:fs";
import { fetchAnatomy, type Anatomy } from "../src/lib/anatomy.ts";
import { DEFAULT_IDS, SNAPSHOT_ELEMENT, type CompareSnapshot } from "../src/lib/compareSnapshot.ts";
import { replayHub } from "./hub-replay.ts";

/** The kept answers, as a path from the repository root (prerender.ts dates compare.html by it too). */
export const COMPARE_FIXTURES = "scripts/fixtures/compare";
export const MAX_AGE_DAYS = 90;

const dir = new URL("./fixtures/compare/", import.meta.url);
const DAY_MS = 86_400_000;
const REFRESH = "refresh them with node scripts/compare-fixtures.ts";

/** The default comparison as the kept answers give it, judged for age at `asOf` (the
 *  commit's date); undefined when there is nothing current to show. */
export async function replayCompare(
  asOf: string | undefined,
  ids: string[] = DEFAULT_IDS,
  warn: (message: string) => void = (m) => console.warn(`warn  ${m}`),
): Promise<CompareSnapshot | undefined> {
  const stamp = new URL("fetched.json", dir);
  const fetched: string | undefined = existsSync(stamp) ? JSON.parse(readFileSync(stamp, "utf8")).fetched : undefined;
  if (!fetched) {
    warn(`${COMPARE_FIXTURES}/fetched.json is missing: compare.html goes out without values; ${REFRESH}`);
    return undefined;
  }
  if (!asOf) {
    warn(`no commit date to judge the Hub answers of ${fetched} by: compare.html goes out without values`);
    return undefined;
  }
  const age = Math.floor((Date.parse(asOf) - Date.parse(fetched)) / DAY_MS);
  if (age > MAX_AGE_DAYS) {
    warn(`the Hub answers in ${COMPARE_FIXTURES} are ${age} days old (${fetched}): compare.html goes out without values; ${REFRESH}`);
    return undefined;
  }

  const restore = replayHub(dir);
  try {
    const anatomies: Anatomy[] = [];
    for (const id of ids) {
      const a = await fetchAnatomy(id).catch(() => undefined);
      // The API record (counts, licence) and config.json (architecture) both answered.
      if (a?.source === "config" && a.downloads !== undefined) anatomies.push(a);
      else warn(`${COMPARE_FIXTURES} does not hold ${id}: its column goes out without values; ${REFRESH}`);
    }
    return anatomies.length ? { fetched, anatomies } : undefined;
  } finally {
    restore();
  }
}

/** The copy as the page carries it, for src/lib/compareSnapshot.ts to read back. */
export function snapshotTag(s: CompareSnapshot): string {
  return `<script type="application/json" id="${SNAPSHOT_ELEMENT}">${JSON.stringify(s).replace(/</g, "\\u003c")}</script>`;
}
