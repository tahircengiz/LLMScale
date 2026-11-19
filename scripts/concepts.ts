// The concept guides: how big the KV cache gets, how attention variants change it,
// and what quantization does and does not shrink, in every enabled language.
//
// Built by scripts/genPages.ts, which supplies the page shell and formatting. The
// prose is written by hand, a file per language in scripts/locales/; every number
// in it is computed from the engine and the bundled models when the page is built,
// so a worked example cannot fall out of step with the calculator it explains. A claim beyond LLMScale's own arithmetic
// names its source: the MQA, GQA and DeepSeek-V2 papers, gpt-oss's model card.

import {
  calculate,
  kvBytesPerToken,
  maxConcurrency,
  resolveHeadDim,
  usesMla,
  weightsBytes,
  BYTES_PER_GIB,
  type Dtype,
  type ModelArch,
} from "../src/lib/calc.ts";
import { KNOWN_MODELS, type KnownModel } from "../src/lib/models.ts";
import { batchFor, GPUS, usableGiB, type Gpu } from "../src/lib/gpus.ts";
import type { Lang } from "../src/lib/langs.ts";
import { PAGE_TEXT } from "./locales/index.ts";
import type { ConceptText } from "./locales/types.ts";
import { CONCEPT_FILES, GPUS_HUB, MODELS_HUB } from "../src/lib/staticPages.ts";

/** Formatting and links, bound to one language by genPages.ts. */
export interface Fmt {
  lang: Lang;
  gib(n: number): string;
  int(n: number): string;
  params(n: number): string;
  ratio(r: number): string;
  dec(s: string): string;
  href(file?: string): string;
  modelLink(id: string): string;
  gpuLink(id: string): string;
}

export interface Concept extends ConceptText {
  file: string;
}

const model = (id: string): KnownModel => {
  const m = KNOWN_MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`concepts: no bundled model ${id}`);
  return m;
};
const card = (id: string): Gpu => {
  const g = GPUS.find((x) => x.id === id);
  if (!g) throw new Error(`concepts: no GPU ${id}`);
  return g;
};
const WORK = { kvDtype: "fp16" as Dtype };
const kvTok = (m: ModelArch) => kvBytesPerToken(m, "fp16");
const kvGiB = (m: ModelArch, ctx: number, users = 1) => (kvTok(m) * ctx * users) / BYTES_PER_GIB;
const wGiB = (m: ModelArch, d: Dtype) => weightsBytes(m, d) / BYTES_PER_GIB;
/** The same model with full multi-head attention: one key-value head per query head, no MLA. */
const asMha = (m: KnownModel): ModelArch => ({ ...m, numKeyValueHeads: m.numAttentionHeads, kvLoraRank: undefined, qkRopeHeadDim: undefined });
/** The same model as a calculator that ignores MLA would read it. */
const perHead = (m: KnownModel): ModelArch => ({ ...m, kvLoraRank: undefined, qkRopeHeadDim: undefined });
const kib = (f: Fmt, bytes: number) => `${f.dec((bytes / 1024).toFixed(1))} KiB`;
const attentionType = (m: KnownModel) =>
  usesMla(m) ? "MLA" : m.numKeyValueHeads === 1 ? "MQA" : m.numKeyValueHeads < m.numAttentionHeads ? "GQA" : "MHA";
const link = (f: Fmt, file: string, text: string) => `<a href="${f.href(file)}">${text}</a>`;

// ── KV cache size ─────────────────────────────────────────────────────────────
function kvCache(f: Fmt): Concept {
  const C = PAGE_TEXT[f.lang].concepts.kvCache;
  const ex = model("llama-3.1-8b");
  const peer = model("qwen2.5-7b");
  const L = ex.numLayers;
  const k = ex.numKeyValueHeads;
  const d = resolveHeadDim(ex);
  const exMax = ex.maxContext ?? 131072;
  const weights = wGiB(ex, "bf16");
  const kvMax = kvGiB(ex, exMax);
  const h100 = card("h100-80");
  const users = [8192, 32768, 131072].map((c) =>
    maxConcurrency({ arch: ex, weightDtype: "bf16", contextLength: c, ...WORK, batch: batchFor(h100) }, usableGiB(h100))
  );
  const CTX = [8192, 32768, 131072];
  const ids = ["llama-3.2-3b", "qwen2.5-7b", "llama-3.1-8b", "mistral-nemo-12b", "qwen3-32b", "llama-3.3-70b", "qwen2.5-72b", "deepseek-v3"];
  const rows = ids.map(model).map((m) => {
    const shape = usesMla(m) ? "MLA" : `${m.numKeyValueHeads} × ${resolveHeadDim(m)}`;
    const cells = CTX.map((c) => (c <= (m.maxContext ?? 0) ? `<td>${f.gib(kvGiB(m, c))}</td>` : "<td>—</td>")).join("");
    return `<tr><th scope="row">${f.modelLink(m.id)}</th><td>${m.numLayers}</td><td>${shape}</td><td>${kib(f, kvTok(m))}</td>${cells}</tr>`;
  }).join("");
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">Model</th><th scope="col">${C.thLayers}</th><th scope="col">${C.thShape}</th><th scope="col">${C.thPerToken}</th><th scope="col">8k</th><th scope="col">32k</th><th scope="col">128k</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;

  const perTok = kvTok(ex);
  const peerTok = kvTok(peer);
  return {
    file: CONCEPT_FILES.kvCache,
    ...C.text({
      attention: link(f, CONCEPT_FILES.attention, C.attentionLink),
      quant: link(f, CONCEPT_FILES.quantization, C.quantLink),
      home: f.href(),
      quantHref: f.href(CONCEPT_FILES.quantization),
      modelsHref: f.href(MODELS_HUB),
      ex: ex.displayName,
      exLink: f.modelLink(ex.id),
      peer: peer.displayName,
      peerLink: f.modelLink(peer.id),
      layers: L,
      kvHeads: k,
      headDim: d,
      perTokBytes: f.int(perTok),
      perTok: kib(f, perTok),
      peerTok: kib(f, peerTok),
      kv8k: f.gib(kvGiB(ex, 8192)),
      exMax: f.int(exMax),
      kvMax: f.gib(kvMax),
      weights: f.gib(weights),
      kvOverWeights: kvMax > weights,
      peerParams: f.params(peer.numParams),
      exParams: f.params(ex.numParams),
      ratio: f.ratio(perTok / peerTok),
      table,
      h100: f.gpuLink(h100.id),
      h100Usable: f.gib(usableGiB(h100)),
      users: [f.int(users[0]), f.int(users[1]), f.int(users[2])],
    }),
  };
}

// ── GQA, MQA and MLA ──────────────────────────────────────────────────────────
function attention(f: Fmt): Concept {
  const C = PAGE_TEXT[f.lang].concepts.attention;
  const mha = model("phi-3-mini");
  const gqa = model("llama-3.3-70b");
  const mla = model("deepseek-v3");
  const small = model("qwen2.5-7b");
  const big = model("llama-3.1-8b");
  const gqaCount = KNOWN_MODELS.filter((m) => attentionType(m) === "GQA").length;
  const kl = mla.kvLoraRank ?? 0;
  const qr = mla.qkRopeHeadDim ?? 0;
  const mlaVsHead = kvTok(perHead(mla)) / kvTok(mla);
  const pct = Math.round((Math.abs(big.numParams - small.numParams) / Math.max(big.numParams, small.numParams)) * 100);

  const ids = ["phi-3-mini", "llama-3.2-1b", "qwen2.5-7b", "llama-3.1-8b", "mistral-nemo-12b", "mixtral-8x7b", "qwen3-32b", "llama-3.3-70b", "qwen2.5-72b", "deepseek-v3"];
  const rows = ids.map(model).map((m) =>
    `<tr><th scope="row">${f.modelLink(m.id)}</th><td>${m.numAttentionHeads}</td><td>${usesMla(m) ? "—" : m.numKeyValueHeads}</td><td>${attentionType(m)}</td><td>${kib(f, kvTok(m))}</td><td>${f.ratio(kvTok(asMha(m)) / kvTok(m))}</td></tr>`
  ).join("");
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">Model</th><th scope="col">${C.thQueryHeads}</th><th scope="col">${C.thKvHeads}</th><th scope="col">Attention</th><th scope="col">${C.thPerToken}</th><th scope="col">${C.thVsMha}</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;

  return {
    file: CONCEPT_FILES.attention,
    ...C.text({
      kv: link(f, CONCEPT_FILES.kvCache, C.kvLink),
      anatomyHref: f.href("anatomy.html"),
      kvHref: f.href(CONCEPT_FILES.kvCache),
      quantHref: f.href(CONCEPT_FILES.quantization),
      mha: f.modelLink(mha.id),
      mhaHeads: mha.numAttentionHeads,
      mhaLayers: mha.numLayers,
      mhaTok: kib(f, kvTok(mha)),
      gqa: f.modelLink(gqa.id),
      gqaName: gqa.displayName,
      gqaHeads: gqa.numAttentionHeads,
      gqaKvHeads: gqa.numKeyValueHeads,
      gqaTok: kib(f, kvTok(gqa)),
      gqaMhaTok: kib(f, kvTok(asMha(gqa))),
      gqaRatio: f.ratio(kvTok(asMha(gqa)) / kvTok(gqa)),
      gqaCount,
      bundled: KNOWN_MODELS.length,
      mla: f.modelLink(mla.id),
      mlaName: mla.displayName,
      mlaLayers: mla.numLayers,
      kvLoraRank: kl,
      ropeDim: qr,
      mlaTok: kib(f, kvTok(mla)),
      mlaRatio: f.ratio(mlaVsHead),
      mla8k: f.gib(kvGiB(mla, 8192)),
      perHead8k: f.gib(kvGiB(perHead(mla), 8192)),
      table,
      small: f.modelLink(small.id),
      big: f.modelLink(big.id),
      pct,
      sizeRatio: f.ratio(kvTok(big) / kvTok(small)),
      models: ids.length,
    }),
  };
}

// ── quantization ──────────────────────────────────────────────────────────────
function quantization(f: Fmt): Concept {
  const C = PAGE_TEXT[f.lang].concepts.quantization;
  const cols = ["llama-3.1-8b", "qwen2.5-32b", "llama-3.3-70b", "llama-3.1-405b"].map(model);
  const precisions: [string, Dtype, number][] = [
    ["FP32", "fp32", 4],
    ["BF16 / FP16", "bf16", 2],
    ["FP8", "fp8", 1],
    ["INT8", "int8", 1],
    // 4.25 bits: a 4-bit weight plus its share of the group or block scales.
    ["INT4", "int4", 0.53],
  ];
  const table = `<div class="scroll"><table>
<thead><tr><th scope="col">${C.thPrecision}</th><th scope="col">${C.thBytes}</th>${cols.map((m) => `<th scope="col">${f.modelLink(m.id)}</th>`).join("")}</tr></thead>
<tbody>${precisions.map(([label, d, bytes]) => `<tr><th scope="row">${label}</th><td>${f.dec(String(bytes))}</td>${cols.map((m) => `<td>${f.gib(wGiB(m, d))}</td>`).join("")}</tr>`).join("")}</tbody>
</table></div>`;

  const oss = model("gpt-oss-120b");
  const h100 = card("h100-80");
  const ossNeed = calculate({ arch: oss, weightDtype: "int4", contextLength: 8192, concurrency: 1, ...WORK, batch: batchFor(h100) }).totalGiB;
  const long = model("llama-3.3-70b");
  const longKv = kvGiB(long, 131072);
  const longInt4 = wGiB(long, "int4");
  const moe = model("mixtral-8x7b");

  return {
    file: CONCEPT_FILES.quantization,
    ...C.text({
      kv: link(f, CONCEPT_FILES.kvCache, C.kvLink),
      home: f.href(),
      kvHref: f.href(CONCEPT_FILES.kvCache),
      attentionHref: f.href(CONCEPT_FILES.attention),
      gpusHref: f.href(GPUS_HUB),
      table,
      oss: f.modelLink(oss.id),
      ossNeed: f.gib(ossNeed),
      h100: f.gpuLink(h100.id),
      h100Usable: f.gib(usableGiB(h100)),
      long: f.modelLink(long.id),
      longBf16: f.gib(wGiB(long, "bf16")),
      longInt4: f.gib(longInt4),
      longKv: f.gib(longKv),
      kvOverInt4: longKv > longInt4,
      moe: f.modelLink(moe.id),
      moeParams: f.params(moe.numParams),
      moeBf16: f.gib(wGiB(moe, "bf16")),
      moeInt4: f.gib(wGiB(moe, "int4")),
      moeActive: f.params(moe.activeParams ?? 0),
    }),
  };
}

export const CONCEPTS: ((f: Fmt) => Concept)[] = [kvCache, attention, quantization];
