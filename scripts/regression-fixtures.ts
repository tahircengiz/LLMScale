// Writes the Hub answers scripts/test-regression.ts replays: for each repo, every
// API record and resolve/main/ file the app's resolver (hf.ts, resolveModel) asks
// for — its own, its base model's, an Unsloth mirror's — kept under
// scripts/fixtures/configs-regression/ (names from scripts/hub-replay.ts). Configs and
// metadata only, never weights; an API record keeps just the fields fetchModelInfo
// reads, so the files stay small and do not churn with download counts.
//
// Run:
//   node scripts/regression-fixtures.ts                     every repo in repos.txt, from the Hub
//   node scripts/regression-fixtures.ts owner/name …        just these (add them to repos.txt too)
//   node scripts/regression-fixtures.ts --cache <dir> [--mirrors <dir>] [--live] [ids…]
// --cache reads a cache the 2026-10-15 audit runner wrote (sha1(url).json holding
// {url, status, body}); --mirrors a folder of owner_name.api.json / .config.json;
// --live fetches what neither holds from the Hub (anonymous GETs). Without --cache,
// everything comes from the Hub. Every answer is treated as data: parsed, never run.
// Afterwards: node scripts/test-regression.ts --update, and read the golden diff.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { textConfig } from "../src/lib/layers.ts";
import { digestTensors, specTensors, STACK } from "../src/lib/tensors.ts";
import { hubFile, listedRepos } from "./hub-replay.ts";

const dir = new URL("./fixtures/configs-regression/", import.meta.url);
mkdirSync(dir, { recursive: true });

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const cacheDir = opt("--cache");
const mirrorsDir = opt("--mirrors");
const liveIdx = args.indexOf("--live");
const live = !cacheDir || liveIdx >= 0;
if (liveIdx >= 0) args.splice(liveIdx, 1);
const ids = args.length ? args : listedRepos(dir);

/** The fields fetchModelInfo (hf.ts) reads from an API record. */
function trimApi(d: any): any {
  const card = d?.cardData && typeof d.cardData === "object" ? { base_model: d.cardData.base_model } : undefined;
  return {
    id: d?.id,
    gated: d?.gated,
    pipeline_tag: d?.pipeline_tag,
    tags: d?.tags,
    config: d?.config?.model_type !== undefined ? { model_type: d.config.model_type } : undefined,
    cardData: card,
    safetensors: d?.safetensors,
    gguf: d?.gguf?.total !== undefined ? { total: d.gguf.total } : undefined,
    siblings: Array.isArray(d?.siblings) ? d.siblings.map((s: any) => ({ rfilename: s.rfilename, size: s.size })) : undefined,
  };
}

/** A safetensors index cut to what the resolver reads from it (hf.ts,
 *  specLayersMissing): each numbered stack's layers once, and every other name once
 *  by its template, so Qwen3.5-9B's 80 kB come down to a few. The cut keeps the
 *  answer the full index gives for the config's speculative layers, or nothing is
 *  written. */
function trimIndex(d: any, cfg: any): any {
  const all: string[] = Object.keys(d?.weight_map ?? {});
  const seen = new Set<string>();
  const weight_map: Record<string, string> = {};
  for (const name of all) {
    const m = STACK.exec(name);
    const key = m ? `${m[1]}#${m[2]}` : name.replace(/\.\d+(?=\.|$)/g, ".{n}");
    if (seen.has(key)) continue;
    seen.add(key);
    weight_map[name] = d.weight_map[name];
  }
  const L = textConfig(cfg)?.num_hidden_layers;
  const ships = (names: string[]) => specTensors(digestTensors(names), L).tensors > 0;
  if (ships(all) !== ships(Object.keys(weight_map))) throw new Error("the trimmed index answers the speculative layers differently");
  return { metadata: d?.metadata, weight_map };
}

type Answer = { status: number; body: string; from: string };

function fromCache(url: string): Answer | null {
  if (!cacheDir) return null;
  const f = resolve(cacheDir, createHash("sha1").update(url).digest("hex") + ".json");
  if (!existsSync(f)) return null;
  const c = JSON.parse(readFileSync(f, "utf8"));
  return { status: c.status, body: c.body ?? "", from: "cache" };
}

function fromMirrors(url: string): Answer | null {
  if (!mirrorsDir) return null;
  const name = hubFile(url);
  if (!name) return null;
  // The mirror folder spells owner/name with one underscore and keeps error bodies too.
  const f = resolve(mirrorsDir, name.replace("--", "_"));
  if (!existsSync(f)) return null;
  const body = readFileSync(f, "utf8");
  try {
    JSON.parse(body);
    return { status: 200, body, from: "mirrors" };
  } catch {
    return { status: 401, body, from: "mirrors" };
  }
}

async function fromHub(url: string): Promise<Answer | null> {
  if (!live) return null;
  await new Promise((r) => setTimeout(r, 150));
  const res = await realFetch(url, { headers: { "user-agent": "llmscale-regression-fixtures/1.0" } });
  return { status: res.status, body: await res.text(), from: "hub" };
}

const realFetch = globalThis.fetch;
const kept = new Map<string, string>();
const misses: string[] = [];
let current = "";

globalThis.fetch = (async (input: string | URL | Request) => {
  const url = input instanceof Request ? input.url : String(input);
  const a = fromCache(url) ?? fromMirrors(url) ?? (await fromHub(url));
  if (!a) {
    misses.push(`${current}: ${url}`);
    return new Response("not found", { status: 404 });
  }
  const name = hubFile(url);
  let body = a.body;
  if (a.status === 200 && name) {
    if (name.endsWith(".api.json")) body = JSON.stringify(trimApi(JSON.parse(a.body)), null, 1) + "\n";
    if (name.endsWith(".model.safetensors.index.json")) {
      const cfg = kept.get(name.replace(/\.model\.safetensors\.index\.json$/, ".config.json"));
      body = JSON.stringify(trimIndex(JSON.parse(a.body), cfg ? JSON.parse(cfg) : null), null, 1) + "\n";
    }
    kept.set(name, body);
  }
  return new Response(body, { status: a.status });
}) as typeof fetch;

const { resolveModel } = await import("../src/lib/hf.ts");
for (const id of ids) {
  current = id;
  const before = kept.size;
  const r = await resolveModel(id);
  console.log(`${id}: ${r.source}${r.warningKey ? ` (${r.warningKey})` : ""}, ${r.arch ? `${r.arch.numLayers} layers` : "no arch"}, ${kept.size - before} new files`);
}
for (const [name, body] of kept) writeFileSync(new URL(name, dir), body);
console.log(`${kept.size} files written to ${dir.pathname}`);
if (misses.length) {
  console.log(`${misses.length} answers neither the cache nor the Hub gave (replayed as 404):`);
  for (const m of misses) console.log("  " + m);
}
