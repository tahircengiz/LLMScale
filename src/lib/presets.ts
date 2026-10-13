// Workload presets: a typical request for a kind of work, and the latency people
// hold it to. The lengths come from the kind of work, not the model; the model
// only moves them where its own files say it must (presetFor).
//
// Every figure cites where it comes from (scripts/test-presets.ts checks each has
// a source); docs/workload-presets.md holds the evidence behind them.
//
// React-free: the sizing and plan pages use it, and the tests run it.

import { buildBrief, type RepoSnapshot } from "./serving.ts";

export type PresetId = "chat" | "rag" | "code" | "agent" | "summarization" | "reasoning";

export interface WorkloadPreset {
  id: PresetId;
  promptTokens: number;
  outputTokens: number;
  /** Prompt tokens every request shares: a system prompt, tool schemas, instructions. */
  sharedPrefix: number;
  ttftS: number;
  tpotMs: number;
  /** Short names of the sources, shown beside the preset. */
  sources: string[];
}

/** Means of production traces where they exist, benchmarks where they do not;
 *  latency targets from MLPerf Inference's p99 limits, which are benchmark gates,
 *  not product SLOs. The evidence and the spread behind each: docs/workload-presets.md. */
export const PRESETS: WorkloadPreset[] = [
  { id: "chat", promptTokens: 1000, outputTokens: 250, sharedPrefix: 500, ttftS: 0.5, tpotMs: 40, sources: ["Azure LLM inference traces", "BurstGPT", "Alibaba ServeGen", "Mooncake (Kimi)", "MLPerf Llama 2 70B Interactive"] },
  { id: "rag", promptTokens: 4000, outputTokens: 200, sharedPrefix: 200, ttftS: 2, tpotMs: 40, sources: ["CacheBlend", "RAGCache", "MLPerf E2E-RAG", "MLPerf Llama 2 70B Interactive"] },
  { id: "code", promptTokens: 2000, outputTokens: 25, sharedPrefix: 0, ttftS: 0.3, tpotMs: 30, sources: ["Azure LLM inference traces (coding)", "Meta CodeCompose", "MLPerf Llama 3.1 8B Interactive"] },
  { id: "agent", promptTokens: 10000, outputTokens: 200, sharedPrefix: 4000, ttftS: 2, tpotMs: 20, sources: ["Mooncake (Kimi) tool & agent trace", "TraceLab", "MLPerf GPT-OSS-120B Interactive"] },
  { id: "summarization", promptTokens: 8000, outputTokens: 250, sharedPrefix: 50, ttftS: 6, tpotMs: 100, sources: ["Sarathi-Serve", "Mooncake", "MLPerf Llama 3.1 405B"] },
  { id: "reasoning", promptTokens: 1000, outputTokens: 4000, sharedPrefix: 100, ttftS: 2, tpotMs: 40, sources: ["MLPerf DeepSeek-R1", "Alibaba ServeGen"] },
];

/** Reasoning tokens a thinking model adds to a reply: Alibaba's production
 *  DeepSeek-R1 traffic averages 1,527 output tokens, about 70% of them reasoning
 *  (ServeGen). Hard math runs far longer; the reasoning preset covers that. */
export const THINKING_TOKENS = 1000;

/** What a model's own files say that moves a preset. */
export interface ModelHints {
  /** The chat template thinks before it answers. */
  thinks: boolean;
  /** The template can turn thinking off. */
  thinkToggle: boolean;
  /** An embedding or reranker model: it reads, it does not generate. */
  noDecode: boolean;
  /** generation_config.json's max_new_tokens: vLLM caps every reply at it. */
  maxNewTokens?: number;
}

export function hintsFromSnapshot(snap: RepoSnapshot): ModelHints {
  const f = buildBrief(snap, "en").facts;
  const mnt = snap.generationConfig?.max_new_tokens;
  return {
    thinks: !!f.template?.reasoning,
    thinkToggle: !!f.template?.thinkToggle,
    noDecode: f.role === "embedding" || f.role === "reranker",
    maxNewTokens: typeof mnt === "number" && mnt > 0 ? mnt : undefined,
  };
}

export type PresetNote = "thinking" | "capped" | "context" | "noDecode";

export interface AppliedPreset {
  promptTokens: number;
  outputTokens: number;
  sharedPrefix: number;
  ttftS: number;
  tpotMs: number;
  /** What was changed for this model, in order. */
  notes: PresetNote[];
}

/** A preset as it applies to one model: a thinking model's reply grows by its
 *  reasoning, a reply never exceeds max_new_tokens, prompt and reply fit the
 *  context, and an embedding model has no reply at all. */
export function presetFor(p: WorkloadPreset, hints: ModelHints | null, maxContext?: number): AppliedPreset {
  const notes: PresetNote[] = [];
  let { promptTokens, outputTokens, sharedPrefix } = p;
  if (hints?.noDecode) {
    outputTokens = 0;
    notes.push("noDecode");
  } else {
    // The reasoning preset already counts the thinking.
    if (hints?.thinks && p.id !== "reasoning" && THINKING_TOKENS > 0) {
      outputTokens += THINKING_TOKENS;
      notes.push("thinking");
    }
    if (hints?.maxNewTokens && outputTokens > hints.maxNewTokens) {
      outputTokens = hints.maxNewTokens;
      notes.push("capped");
    }
  }
  if (maxContext && promptTokens + outputTokens > maxContext) {
    // Keep the reply, shorten the prompt: the reply is what was asked for.
    promptTokens = Math.max(1, maxContext - outputTokens);
    sharedPrefix = Math.min(sharedPrefix, promptTokens);
    notes.push("context");
  }
  return { promptTokens, outputTokens, sharedPrefix, ttftS: p.ttftS, tpotMs: p.tpotMs, notes };
}

/** The preset a load matches, if any: so the page can mark it as chosen. */
export function matchingPreset(load: { promptTokens: number; outputTokens: number; sharedPrefix: number }, hints: ModelHints | null, maxContext?: number): PresetId | null {
  for (const p of PRESETS) {
    const a = presetFor(p, hints, maxContext);
    if (a.promptTokens === load.promptTokens && a.outputTokens === load.outputTokens && a.sharedPrefix === load.sharedPrefix) return p.id;
  }
  return null;
}
