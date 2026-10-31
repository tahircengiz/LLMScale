// When a built page last changed: the newest commit touching any file it is made
// from — the files its generator names and everything those import. The page's
// structured data carries it as dateModified, and sitemap.ts reads it back from
// there as <lastmod>, so the two cannot disagree.
//
// Commit dates, never the build's: the site is rebuilt for every news post, and
// a date that moves on every build says nothing (search engines learn to ignore
// it). Without the history to date a page by — no git, or a shallow clone, whose
// one commit would date every file alike — a page carries no date rather than a
// wrong one.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const isFile = (p: string) => existsSync(p) && statSync(p).isFile();

/** An import's file: as written, or with the extension the code leaves off. */
function resolveImport(path: string): string | undefined {
  return [path, `${path}.ts`, `${path}.tsx`, `${path}.js`].find(isFile);
}

/** These files and every file they import, transitively, as paths from the
 *  repository root. Packages are left out — a dependency bump is not an edit —
 *  and so is `import type`, which changes no page. */
export function sourcesOf(...roots: string[]): string[] {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (!/\.[jt]sx?$/.test(file)) return;
    for (const m of readFileSync(file, "utf8").matchAll(/\b(?:import|export)\s+(type\s+)?(?:[^;'"]*?\bfrom\s*)?["'](\.\.?\/[^"']+)["']/g)) {
      if (m[1]) continue;
      const target = resolveImport(join(dirname(file), m[2]));
      if (target) visit(target);
    }
  };
  for (const root of roots) {
    if (!existsSync(root)) throw new Error(`${root}: no such file to date a page by`);
    visit(root);
  }
  return [...seen];
}

let fullHistory: boolean | undefined;
function hasFullHistory(): boolean {
  if (fullHistory === undefined) {
    try {
      fullHistory = execFileSync("git", ["rev-parse", "--is-shallow-repository"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() === "false";
    } catch {
      fullHistory = false;
    }
    if (!fullHistory) console.warn("warn  no full git history here: pages go out undated (no dateModified, no <lastmod>)");
  }
  return fullHistory;
}

/** The commit date (ISO 8601) of the newest commit touching any of these paths. */
export function lastCommitDate(paths: string[]): string | undefined {
  if (!hasFullHistory()) return undefined;
  try {
    return execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || undefined;
  } catch {
    // A path outside the repository, such as a FEED_DIR elsewhere for a preview.
    return undefined;
  }
}

/** When the page made from these files last changed; undefined if that cannot be told. */
export const modifiedDate = (...roots: string[]) => lastCommitDate(sourcesOf(...roots));
