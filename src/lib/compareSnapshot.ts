// The comparison compare.html opens with, and the copy of it the page carries.
//
// The browser asks the Hugging Face Hub for every column, so the built page used
// to hold a table of dashes: a crawler that runs no JavaScript found no numbers in
// it at all. The build now resolves the default columns from Hub answers kept in
// the repository (scripts/compareReplay.ts), renders the table with them and
// writes the same data into the page beside it. The page starts from that copy, so
// its first render is the table the build wrote, and swaps in the Hub's live
// answers as they arrive; until then the table says what day the copy is from.

import type { Anatomy } from "./anatomy.ts";

export const DEFAULT_IDS = ["Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2.5-Coder-7B-Instruct"];

export interface CompareSnapshot {
  /** The day the kept answers were fetched from the Hub, YYYY-MM-DD. */
  fetched: string;
  anatomies: Anatomy[];
}

/** The id of the <script type="application/json"> that carries the copy. */
export const SNAPSHOT_ELEMENT = "compare-snapshot";

let primed: CompareSnapshot | undefined;

/** The prerender has no page to read the copy from; entry-server.tsx hands it over. */
export function primeSnapshot(s: CompareSnapshot | undefined): void {
  primed = s;
}

/** The copy this page carries, if it carries one. */
export function pageSnapshot(): CompareSnapshot | undefined {
  if (primed || typeof document === "undefined") return primed;
  const text = document.getElementById(SNAPSHOT_ELEMENT)?.textContent;
  try {
    return text ? (JSON.parse(text) as CompareSnapshot) : undefined;
  } catch {
    return undefined;
  }
}
