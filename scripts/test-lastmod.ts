// When a page last changed (scripts/lastModified.ts): the files it is dated by
// and the commit date they give.
// Run: node scripts/test-lastmod.ts
//
// The date goes out twice — dateModified in each page's structured data and
// <lastmod> in the sitemap — and a wrong one is worse than none: a date that
// moves with every build, or one that misses the file a page's text lives in,
// teaches search engines to ignore the site's dates altogether.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lastCommitDate, sourcesOf } from "./lastModified.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

console.log("--- the files a page is made from ---");
const dir = mkdtempSync(join(tmpdir(), "lastmod-"));
const put = (name: string, code: string) => writeFileSync(join(dir, name), code);
put("page.tsx", `import { useState } from "react";
import {
  a,
  b,
} from "./multi.ts";
import { c } from "./bare";
import type { T } from "./typeonly.ts";
import { type U, d } from "./mixed.ts";
import "./side.css";
export * from "./reexport.ts";
export const s = "./not-an-import.ts";
`);
put("multi.ts", `import { s } from "./page.tsx";\nexport const a = 1, b = 2;`);
put("bare.ts", "export const c = 3;");
put("typeonly.ts", "export type T = number;");
put("mixed.ts", "export type U = number; export const d = 4;");
put("side.css", "body{}");
put("reexport.ts", "export const e = 5;");
put("not-an-import.ts", "");
const got = new Set(sourcesOf(join(dir, "page.tsx")).map((p) => p.slice(dir.length + 1)));
const want = ["page.tsx", "multi.ts", "bare.ts", "mixed.ts", "side.css", "reexport.ts"];
check("follows imports across lines, without extensions, re-exports and side effects", want.every((f) => got.has(f)), [...got].join(" "));
check("leaves out type-only imports, packages and strings that only look like paths", got.size === want.length, [...got].join(" "));
rmSync(dir, { recursive: true });

const fit = sourcesOf("fit.html", "src/pages/FitPage.tsx");
check("the task-fit page is dated by its entry and its component", fit.includes("fit.html") && fit.includes("src/pages/FitPage.tsx"));
check("…by the scoring it shows", fit.includes("src/lib/fit.ts"));
check("…and by the dictionary its words come from, re-exported through i18n.ts", fit.includes("src/lib/dict.ts"));
check("…but not by the app's other pages", !fit.some((f) => f.startsWith("src/pages/") && f !== "src/pages/FitPage.tsx"), fit.filter((f) => f.startsWith("src/pages/")).join(" "));
let missing = "";
try {
  sourcesOf("src/pages/NoSuchPage.tsx");
} catch (e) {
  missing = String(e);
}
check("a page named after a file that does not exist is an error, not an undated page", missing.includes("NoSuchPage"));

console.log("\n--- the date ---");
let shallow = "unknown";
try {
  shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {}
if (shallow !== "false") {
  check("without full history there is no date to give", lastCommitDate(fit) === undefined);
  console.log("SKIP  commit dates: no full git history here");
} else {
  const own = (f: string) => execFileSync("git", ["log", "-1", "--format=%cI", "--", f], { encoding: "utf8" }).trim();
  const date = lastCommitDate(fit);
  const newest = fit.map(own).filter(Boolean).sort((x, y) => Date.parse(x) - Date.parse(y)).at(-1);
  check("a page's date is the newest of its files' commit dates", !!date && date === newest, `${date} vs ${newest}`);
  check("…an ISO 8601 date with its offset, as the sitemap wants", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/.test(date ?? ""), date);
  check("…and the same on every run, not the build's clock", lastCommitDate(fit) === date);
  check("a file no commit has touched gives no date", lastCommitDate(["scripts/no-such-file.ts"]) === undefined);
  check("a path outside the repository gives no date rather than stopping the build", lastCommitDate([tmpdir()]) === undefined);
}

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
