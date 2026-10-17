// Model-parsing regression (audit phase 4, 2026-10-17): the resolver and the
// sizing over 83 real Hugging Face repos, against a checked-in golden file.
// Run: node scripts/test-regression.ts            compare, and list every number that moved
//      node scripts/test-regression.ts --update   accept the current numbers (then read the git diff)
//
// The 2026-10-15 data audit ran the app's resolver over 273 repos and found the
// cache of Gemma 4, Nemotron NAS, the hybrids and GLM-5.3-Flash wrong by up to 17x,
// and Falcon's and ChatGLM's head counts misread; every fix since changed some of
// these numbers on purpose. This test replays the Hub's answers for a subset of
// those repos (scripts/fixtures/configs-regression/, listed in repos.txt; written
// by scripts/regression-fixtures.ts) through resolveModel — the config, the base
// model or an Unsloth mirror, the bundled entry, the quantization a GGUF, AWQ,
// NVFP4 or ModelOpt checkpoint ships in — and pins what it gives: the parsed
// architecture, the KV cache per token and as vLLM reserves it per request at three
// contexts, the weights at each precision, the active parameters and the config keys
// the sizing does not model. A change to any of them fails here with the old and
// new value, so it is made on purpose or not at all.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  expertWeightBytes,
  kvBytesPerToken,
  kvReservedPerSeq,
  resolveHeadDim,
  usesDsa,
  weightsBytes,
  type Dtype,
} from "../src/lib/calc.ts";
import { resolveModel } from "../src/lib/hf.ts";
import { listedRepos, replayHub } from "./hub-replay.ts";

const dir = new URL("./fixtures/configs-regression/", import.meta.url);
const goldenFile = new URL("golden.json", dir);
const update = process.argv.includes("--update");

const CONTEXTS = [4096, 32768, 131072];
const WEIGHT_DTYPES: Dtype[] = ["bf16", "fp8", "int4"];

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Keys in sorted order, undefined dropped: the file diffs line by line however an object was built. */
function canonical(v: unknown): Json {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") {
    const out: { [k: string]: Json } = {};
    for (const k of Object.keys(v).sort()) {
      const x = (v as Record<string, unknown>)[k];
      if (x !== undefined) out[k] = canonical(x);
    }
    return out;
  }
  return v as Json;
}

async function snapshot(id: string) {
  const r = await resolveModel(id);
  const a = r.arch;
  const resolution = {
    source: r.source,
    warningKey: r.warningKey,
    mirror: r.mirror,
    gated: r.gated,
    modelType: r.modelType,
    isMoE: r.isMoE,
    weightDtype: r.weightDtype,
    kvDtype: r.kvDtype,
    numParams: r.numParams,
  };
  if (!a) return canonical({ resolution });
  const reserved: Record<string, number> = {};
  for (const ctx of CONTEXTS) reserved[`bf16@${ctx}`] = kvReservedPerSeq(a, "bf16", ctx);
  reserved["fp8@32768"] = kvReservedPerSeq(a, "fp8", 32768);
  // Per GPU under tensor parallelism: the head split (Gemma 4's per layer kind).
  reserved["bf16@32768,tp2"] = kvReservedPerSeq(a, "bf16", 32768, 2048, 2);
  // DeepSeek Sparse Attention's row depends on the card family (calc.ts, C3).
  if (usesDsa(a)) reserved["fp8@32768,sm100"] = kvReservedPerSeq(a, "fp8", 32768, 2048, 1, "sm100");
  const weights: Record<string, number> = {};
  for (const d of WEIGHT_DTYPES) weights[d] = weightsBytes(a, d);
  if (r.weightDtype && !(r.weightDtype in weights)) weights[r.weightDtype] = weightsBytes(a, r.weightDtype);
  return canonical({
    resolution,
    arch: a,
    headDim: resolveHeadDim(a),
    kvPerToken: { bf16: kvBytesPerToken(a, "bf16"), fp8: kvBytesPerToken(a, "fp8") },
    kvReserved: reserved,
    weights,
    expertWeightsBf16: expertWeightBytes(a, "bf16"),
  });
}

/** path → leaf value, arrays by index: the unit a difference is reported in. */
function flatten(v: Json, path = "", out = new Map<string, Json>()): Map<string, Json> {
  if (Array.isArray(v)) {
    if (!v.length) out.set(path, []);
    v.forEach((x, i) => flatten(x, `${path}[${i}]`, out));
  } else if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (!keys.length) out.set(path, {});
    for (const k of keys) flatten(v[k], path ? `${path}.${k}` : k, out);
  } else out.set(path, v);
  return out;
}

const same = (a: Json | undefined, b: Json | undefined) =>
  typeof a === "number" && typeof b === "number"
    ? a === b || Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b))
    : JSON.stringify(a) === JSON.stringify(b);

function show(v: Json | undefined): string {
  if (v === undefined) return "(absent)";
  if (typeof v === "number" && Math.abs(v) >= 1e6) return v.toLocaleString("en-US", { maximumFractionDigits: 3 });
  return JSON.stringify(v);
}

/** One line per leaf that differs: old → new, with the relative change for numbers. */
function differences(before: Json, after: Json): string[] {
  const a = flatten(before);
  const b = flatten(after);
  const out: string[] = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(k);
    const y = b.get(k);
    if (same(x, y)) continue;
    const pct = typeof x === "number" && typeof y === "number" && x !== 0 ? ` (${y > x ? "+" : ""}${(((y - x) / Math.abs(x)) * 100).toFixed(2)}%)` : "";
    out.push(`${k}: ${show(x)} → ${show(y)}${pct}`);
  }
  return out;
}

const ids = listedRepos(dir);
const restore = replayHub(dir);
const current: Record<string, Json> = {};
for (const id of ids) current[id] = await snapshot(id);
restore();

const golden: Record<string, Json> = existsSync(goldenFile) ? JSON.parse(readFileSync(goldenFile, "utf8")) : {};
const MAX_LINES = 12;
let changedRepos = 0;
let changedFields = 0;
const label = update ? "UPDATE" : "FAIL";
for (const id of new Set([...ids, ...Object.keys(golden)])) {
  if (!(id in current)) {
    console.log(`${label}  ${id}: in the golden file but no longer in repos.txt`);
    changedRepos++;
    continue;
  }
  if (!(id in golden)) {
    console.log(`${label}  ${id}: no golden entry yet`);
    changedRepos++;
    continue;
  }
  const d = differences(golden[id], current[id]);
  if (!d.length) {
    if (!update) console.log(`PASS  ${id}`);
    continue;
  }
  changedRepos++;
  changedFields += d.length;
  console.log(`${label}  ${id}: ${d.length} value${d.length === 1 ? "" : "s"} moved`);
  for (const line of d.slice(0, MAX_LINES)) console.log(`${label}      ${line}`);
  if (d.length > MAX_LINES) console.log(`${label}      … and ${d.length - MAX_LINES} more`);
}

if (update) {
  const out: Record<string, Json> = {};
  for (const id of ids) out[id] = current[id];
  writeFileSync(goldenFile, JSON.stringify(out, null, 1) + "\n");
  console.log(`\nwrote ${ids.length} repos to ${goldenFile.pathname} (${changedRepos} changed, ${changedFields} values); review: git diff -- scripts/fixtures/configs-regression/golden.json`);
  process.exit(0);
}
if (changedRepos) {
  console.log(`\nFAIL  ${changedRepos} of ${ids.length} repos differ from the golden file (${changedFields} values).`);
  console.log("FAIL  If every change above is intended: node scripts/test-regression.ts --update, and commit golden.json with the reason.");
  process.exit(1);
}
console.log(`\nALL PASS (${ids.length} repos)`);
