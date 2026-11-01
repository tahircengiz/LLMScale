// Keeps the Hugging Face Hub's answers for the comparison compare.html opens with
// (DEFAULT_IDS in src/lib/compareSnapshot.ts) in scripts/fixtures/compare/, so the
// build can write that table's values into the page without the network
// (scripts/compareReplay.ts). Like regression-fixtures.ts it keeps whatever the
// app's resolver asks for, under the names hub-replay.ts serves; unlike it, an API
// record keeps the counts the table shows (downloads, likes, licence, last change),
// and fetched.json the day they were fetched, which the page shows beside them.
// JSON answers only, never weights; every answer is parsed as data, never run.
//
// Run: node scripts/compare-fixtures.ts     (anonymous GETs to huggingface.co)
// Afterwards: node scripts/test-compare.ts --update, and read the golden diff.

import { mkdirSync, writeFileSync } from "node:fs";
import { DEFAULT_IDS } from "../src/lib/compareSnapshot.ts";
import { hubFile } from "./hub-replay.ts";

const dir = new URL("./fixtures/compare/", import.meta.url);
mkdirSync(dir, { recursive: true });

/** The fields fetchModelInfo (src/lib/hf.ts) reads from an API record, counts included. */
function trimApi(d: any): any {
  const card = d?.cardData && typeof d.cardData === "object" ? { base_model: d.cardData.base_model, license: d.cardData.license } : undefined;
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
    downloads: d?.downloads,
    likes: d?.likes,
    createdAt: d?.createdAt,
    lastModified: d?.lastModified,
    usedStorage: d?.usedStorage,
  };
}

const realFetch = globalThis.fetch;
const kept = new Map<string, string>();

globalThis.fetch = (async (input: string | URL | Request) => {
  const url = input instanceof Request ? input.url : String(input);
  const name = hubFile(url);
  if (!name?.endsWith(".json")) return new Response("not kept", { status: 404 });
  const res = await realFetch(url, { headers: { "user-agent": "llmscale-compare-fixtures/1.0" } });
  let body = await res.text();
  if (res.ok) {
    if (name.endsWith(".api.json")) body = JSON.stringify(trimApi(JSON.parse(body)), null, 1) + "\n";
    kept.set(name, body);
  }
  return new Response(body, { status: res.status });
}) as typeof fetch;

const { fetchAnatomy } = await import("../src/lib/anatomy.ts");
for (const id of DEFAULT_IDS) {
  const a = await fetchAnatomy(id);
  console.log(`${id}: ${a.source}, ${a.arch.numLayers} layers, ${a.downloads ?? "no"} downloads`);
}
const fetched = new Date().toISOString().slice(0, 10);
for (const [name, body] of kept) writeFileSync(new URL(name, dir), body);
writeFileSync(new URL("fetched.json", dir), JSON.stringify({ fetched }) + "\n");
console.log(`${kept.size} files written to ${dir.pathname}, fetched ${fetched}`);
