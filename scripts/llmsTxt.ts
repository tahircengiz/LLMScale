// Writes llms.txt: a plain-Markdown map of the site for language models
// (https://llmstxt.org).
//
//   node scripts/llmsTxt.ts [outDir=dist]
//
// Runs last in the build, from the built pages, the same way sitemap.ts does: the
// title, description and canonical URL of every English page, grouped by what the
// page is. A hand-written list is how a new page goes missing from it. Turkish
// pages are not listed one by one; the header says where they live.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const outDir = process.argv[2] ?? "dist";

function* htmlFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith(".html")) yield path;
  }
}

const unescape = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

interface Entry { rel: string; url: string; title: string; description: string }
const entries: Entry[] = [];
for (const path of htmlFiles(outDir)) {
  const rel = relative(outDir, path).replaceAll("\\", "/");
  if (rel.startsWith("tr/")) continue;
  const html = readFileSync(path, "utf8");
  const url = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1];
  if (!url || !title || !description) throw new Error(`${rel}: needs a canonical URL, a title and a description`);
  entries.push({ rel, url, title: unescape(title).replace(/\s*\|\s*LLMScale$/, ""), description: unescape(description) });
}

const home = entries.find((e) => e.rel === "index.html");
if (!home) throw new Error(`${outDir}/index.html not found`);
const isHub = (e: Entry) => /(^|\/)index\.html$/.test(e.rel) && e.rel !== "index.html";
const section = (test: (e: Entry) => boolean) =>
  entries.filter((e) => test(e) && !isHub(e)).sort((a, b) => (a === home ? -1 : b === home ? 1 : a.title.localeCompare(b.title)));
const list = (items: Entry[]) => items.map((e) => `- [${e.title}](${e.url}): ${e.description}`).join("\n");
const hubUrl = (folder: string) => entries.find((e) => e.rel === `${folder}/index.html`)?.url;

const tools = section((e) => !e.rel.includes("/"));
const concepts = section((e) => e.rel.startsWith("concepts/"));
const models = section((e) => e.rel.startsWith("models/"));
const gpus = section((e) => e.rel.startsWith("gpus/"));
if (!tools.length || !concepts.length || !models.length || !gpus.length) throw new Error("llms.txt: a section came out empty");

const text = `# LLMScale

> LLMScale works out how much GPU memory a large language model needs — weights, KV cache, context window and concurrent users — from each model's own architecture, and which GPUs hold it. It runs entirely in the browser, with no account and no backend. Every page also exists in Turkish under ${home.url}tr/.

Every figure comes from one engine. Weights are parameters × bytes per parameter (FP32 4, BF16/FP16 2, FP8/INT8 1, INT4 0.5). The KV cache is 2 × layers × key-value heads × head dimension × bytes × context × concurrent sequences, read from each model's config.json; models with multi-head latent attention (DeepSeek) cache layers × (kv_lora_rank + qk_rope_head_dim) × bytes per token instead. Overhead is a stated share of weights and cache plus a fixed CUDA context. A discrete GPU is budgeted at 95% of its memory; a unified-memory device at the share its GPU can address. Mixture-of-Experts models need memory for every expert but decode through the active ones. The engine is checked against published results: ZeRO's 16 bytes per parameter for mixed-precision Adam, QLoRA fine-tuning a 65B model on one 48 GB GPU, DeepSeek-V2's MLA cache formula, gpt-oss-120b fitting one 80 GB GPU, and MoE model cards' active parameter counts. The figures are for capacity planning; serving engines, paged attention, prefill and sliding-window layers are not modelled.

## Tools

${list(tools)}

## Concepts

${hubUrl("concepts") ? `Overview: ${hubUrl("concepts")}\n\n` : ""}${list(concepts)}

## Models

${hubUrl("models") ? `Overview: ${hubUrl("models")}\n\n` : ""}${list(models)}

## GPUs

${hubUrl("gpus") ? `Overview: ${hubUrl("gpus")}\n\n` : ""}${list(gpus)}

## Optional

- [Source code](https://github.com/tahircengiz/LLMScale): the calculator, its engine and its tests, under the GNU AGPL-3.0-only licence.
`;

writeFileSync(join(outDir, "llms.txt"), text);
console.log(`ok    llms.txt  ${tools.length} tools, ${concepts.length} concepts, ${models.length} models, ${gpus.length} GPUs`);
