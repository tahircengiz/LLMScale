// Shared by the property sweeps (scripts/test-sweep-engine.ts, test-sweep-layout.ts,
// test-url-roundtrip.ts), ported from the 2026-10-15 data audit's one-off scripts
// (GTR9 ~/projects/LLMScale-audit-inv/audit/). A property is checked over many
// combinations and fails with its first few counterexamples.

import type { ModelArch } from "../src/lib/calc.ts";
import { placeholderArch, resolveModel } from "../src/lib/hf.ts";
import { GPUS, MIG_PROFILES, type Gpu } from "../src/lib/gpus.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import { replayHub } from "./hub-replay.ts";

export interface NamedArch {
  id: string;
  arch: ModelArch;
  src: "preset" | "repo";
  hfId: string;
}

/** Repos from the regression fixtures whose architecture no preset has: every
 *  cache shape, state, sharing rule and checkpoint format the sizing knows. */
export const EDGE_REPOS = [
  "deepseek-ai/DeepSeek-V4-Flash", // compressed attention, ships FP8 + FP4 experts
  "deepseek-ai/DeepSeek-V3.2", // DeepSeek Sparse Attention
  "zai-org/GLM-5.3-Flash", // KDA state + pooled sparse index
  "moonshotai/Kimi-Linear-48B-A3B-Instruct", // KDA linear attention
  "ibm-granite/granite-4.0-h-small", // Mamba state
  "tiiuae/Falcon-H1-7B-Instruct",
  "ai21labs/AI21-Jamba-Reasoning-3B",
  "Qwen/Qwen3-Next-80B-A3B-Instruct", // gated delta net
  "nvidia/Llama-3_3-Nemotron-Super-49B-v1_5", // NAS blocks
  "nvidia/Llama-3_1-Nemotron-51B-Instruct", // NAS linear blocks vLLM cannot load
  "google/gemma-4-31B-it", // global layers' own KV shape
  "google/gemma-4-26B-A4B-it",
  "google/gemma-3n-E4B-it", // per-layer embeddings, shared KV
  "meta-llama/Llama-3.2-11B-Vision-Instruct", // cross-attention
  "XiaomiMiMo/MiMo-V2-Flash", // value heads narrower than key heads
  "MiniMaxAI/MiniMax-Text-01", // lightning attention
  "Qwen/Qwen3.8-Flash-Next", // n-gram lookup tables
  "RadixArk/Kimi-K3-DSpark", // speculative draft layers
  "openai/gpt-oss-120b", // MXFP4 experts
  "nvidia/Llama-3.3-70B-Instruct-FP4", // ships NVFP4, FP8 KV
  "Qwen/Qwen2.5-VL-7B-Instruct", // vision encoder
  "tiiuae/falcon-7b-instruct", // one KV head
  "mistralai/Mistral-7B-v0.1", // every layer sliding
];

/** Every preset, the edge repos as the resolver reads them, and the placeholder a
 *  page sizes on when nothing could be read. */
export async function sweepModels(): Promise<NamedArch[]> {
  const out: NamedArch[] = KNOWN_MODELS.map((m) => ({ id: m.id, arch: m as ModelArch, src: "preset" as const, hfId: m.hfId }));
  const restore = replayHub(new URL("./fixtures/configs-regression/", import.meta.url));
  try {
    for (const id of EDGE_REPOS) {
      const r = await resolveModel(id);
      if (!r.arch) throw new Error(`sweep model ${id} did not resolve`);
      out.push({ id, arch: r.arch, src: "repo", hfId: id });
    }
  } finally {
    restore();
  }
  out.push({ id: "placeholder-52b", arch: placeholderArch(52e9), src: "repo", hfId: "" });
  return out;
}

const card = (id: string): Gpu => {
  const g = GPUS.find((x) => x.id === id);
  if (!g) throw new Error(`no GPU ${id}`);
  return g;
};

/** Cards the sweeps size on: the smallest and largest of each kind, both vendors,
 *  the unified-memory devices, and the ones the presets' pages feature. */
export const SWEEP_CARDS: Gpu[] = [
  "rtx3060-12", "rtx4090-24", "rtx5090-32", "t4-16", "l4-24", "l40s-48", "a100-40", "a100-80",
  "h100-80", "h200-141", "b200-192", "rtxpro6000-96", "mi300x-192", "b300-288",
  "apple-m4-32", "amd-strixhalo-128", "nv-dgxspark-128",
].map(card);

/** A few MIG slices: the smallest, a middle one, and the RTX PRO 6000's. */
export const SWEEP_MIG: { g: Gpu; mig: string }[] = [
  ["h100-80", "1g.10gb"], ["h100-80", "3g.40gb"], ["a100-40", "2g.10gb"], ["rtxpro6000-96", "1g.24gb"],
].map(([id, mig]) => {
  if (!(MIG_PROFILES[id] ?? []).some((p) => p.id === mig)) throw new Error(`no MIG ${id} ${mig}`);
  return { g: card(id), mig };
});

/** A property counter that keeps its first counterexamples. */
export class Prop {
  checked = 0;
  failed = 0;
  examples: string[] = [];
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  ok(cond: boolean, example: () => string): void {
    this.checked++;
    if (cond) return;
    this.failed++;
    if (this.examples.length < 5) this.examples.push(example());
  }
}

/** Prints each property as PASS or FAIL (counterexamples on FAIL lines, which is
 *  what test:all shows) and exits non-zero when one failed. */
export function finish(props: Prop[], t0: number): void {
  let fails = 0;
  for (const p of props) {
    if (!p.checked) {
      console.log(`FAIL  ${p.name}: nothing was checked`);
      fails++;
      continue;
    }
    console.log(`${p.failed ? "FAIL" : "PASS"}  ${p.name}  — ${p.failed}/${p.checked} violations`);
    for (const e of p.examples) console.log(`FAIL      e.g. ${e}`);
    if (p.failed) fails++;
  }
  console.log(`\n${((Date.now() - t0) / 1000).toFixed(1)} s`);
  console.log(fails ? `${fails} FAILED` : "ALL PASS");
  process.exit(fails ? 1 : 0);
}

export const fin = (x: number) => Number.isFinite(x);
export const f2 = (x: number | undefined) =>
  x === undefined ? "-" : Number.isFinite(x) ? (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2)) : String(x);
