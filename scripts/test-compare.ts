// The comparison the build writes into compare.html (scripts/compareReplay.ts):
// both default models resolved from the kept Hub answers with every value the
// table shows, pinned to a golden file and the same bytes on every run, and no
// values at all when the answers are missing or too old.
// Run: node scripts/test-compare.ts            compare with the golden file
//      node scripts/test-compare.ts --update   accept the current copy (then read the git diff)
//
// Before this the built page held 70 dashes in 109 cells: the values came only
// from the Hub, in the browser, and a crawler that runs no JavaScript saw none.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_IDS, type CompareSnapshot } from "../src/lib/compareSnapshot.ts";
import { COMPARE_FIXTURES, MAX_AGE_DAYS, replayCompare, snapshotTag } from "./compareReplay.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const root = new URL("../", import.meta.url);
const dir = new URL(`${COMPARE_FIXTURES}/`, root);
const goldenFile = new URL("golden.json", dir);
const update = process.argv.includes("--update");
const { fetched } = JSON.parse(readFileSync(new URL("fetched.json", dir), "utf8")) as { fetched: string };
const daysAfter = (n: number) => new Date(Date.parse(fetched) + n * 86_400_000).toISOString();
const warnings: string[] = [];
const quiet = (m: string) => warnings.push(m);

console.log("--- the default pair, from the kept answers ---");
const s = await replayCompare(daysAfter(1), DEFAULT_IDS, quiet);
check("both default models resolve", s?.anatomies.map((a) => a.hfId).join() === DEFAULT_IDS.join(), s?.anatomies.map((a) => a.hfId).join(", "));
check("with nothing to warn about", warnings.length === 0, warnings.join(" | "));
check("dated by the day they were fetched", s?.fetched === fetched, fetched);
// Every value a row of the table reads (ComparePage.tsx); one missing is a dash.
for (const a of s?.anatomies ?? []) {
  const missing = Object.entries({
    numParams: a.numParams, context: a.arch.maxContext, license: a.license, downloads: a.downloads,
    likes: a.likes, lastModified: a.lastModified, baseModel: a.baseModel, layers: a.arch.numLayers,
    hidden: a.arch.hiddenSize, heads: a.arch.numAttentionHeads, kvHeads: a.arch.numKeyValueHeads,
    headDim: a.headDim, vocab: a.arch.vocabSize, tags: a.tags?.length,
  }).filter(([, v]) => v === undefined || v === 0).map(([k]) => k);
  check(`${a.hfId}: every cell has a value`, missing.length === 0, missing.join(", ") || `from ${a.source}`);
}

console.log("\n--- the same bytes every build ---");
const again = await replayCompare(daysAfter(1), DEFAULT_IDS, quiet);
check("a second run writes the same tag", !!s && !!again && snapshotTag(s) === snapshotTag(again));
const text = s ? JSON.stringify(s, null, 1) + "\n" : "";
if (update) {
  writeFileSync(goldenFile, text);
  console.log(`golden.json written (${s?.anatomies.length ?? 0} models)`);
} else {
  const golden = existsSync(goldenFile) ? readFileSync(goldenFile, "utf8") : "";
  check("the copy matches golden.json", text === golden, text === golden ? "" : "run with --update if the change is intended, then read the diff");
}
const evil: CompareSnapshot = { fetched, anatomies: [{ ...s!.anatomies[0], license: "</script><script>alert(1)</script>" }] };
check("a value cannot close the tag early", snapshotTag(evil).split("</script").length === 2);

console.log("\n--- nothing shown that cannot be stood behind ---");
warnings.length = 0;
check(`answers ${MAX_AGE_DAYS} days old still go out`, (await replayCompare(daysAfter(MAX_AGE_DAYS), DEFAULT_IDS, quiet)) !== undefined);
check(`answers ${MAX_AGE_DAYS + 1} days old do not`, (await replayCompare(daysAfter(MAX_AGE_DAYS + 1), DEFAULT_IDS, quiet)) === undefined);
check("and the build says so", warnings.some((w) => w.includes(`${MAX_AGE_DAYS + 1} days old`)), warnings.at(-1));
check("no commit date, no values", (await replayCompare(undefined, DEFAULT_IDS, quiet)) === undefined);
warnings.length = 0;
const partial = await replayCompare(daysAfter(1), [DEFAULT_IDS[0], "example/not-kept"], quiet);
check("a model with no kept answers goes out empty, the rest do not", partial?.anatomies.map((a) => a.hfId).join() === DEFAULT_IDS[0]);
check("and the build names it", warnings.some((w) => w.includes("example/not-kept")), warnings.join(" | "));

console.log("\n--- the build uses it ---");
const prerender = readFileSync(new URL("scripts/prerender.ts", root), "utf8");
check("prerender writes the tag into compare.html", /snapshotTag\(/.test(prerender) && /"compare\.html"/.test(prerender));
// A refreshed copy changes what the page says, so it moves the page's date.
check("compare.html is dated by the kept answers too", /"compare\.html":\s*\[[^\]]*COMPARE_FIXTURES/.test(prerender));

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
