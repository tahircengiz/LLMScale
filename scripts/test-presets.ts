// Workload presets. Run: node scripts/test-presets.ts
//
// Each preset must carry its sources and sane targets, and presetFor must move it
// only where a model's own files say so: a thinking model's reply grows, a
// generation_config cap holds, the context is respected, and an embedding model
// generates nothing. The hints come from real repositories (scripts/fixtures/repos/).

import { readFileSync } from "node:fs";
import { hintsFromSnapshot, matchingPreset, presetFor, PRESETS, THINKING_TOKENS, type WorkloadPreset } from "../src/lib/presets.ts";
import type { RepoSnapshot } from "../src/lib/serving.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const repo = (n: string): RepoSnapshot => JSON.parse(readFileSync(new URL(`./fixtures/repos/${n}.json`, import.meta.url), "utf8"));

console.log("--- the presets ---");
check("six kinds of work", PRESETS.map((p) => p.id).join(",") === "chat,rag,code,agent,summarization,reasoning", PRESETS.map((p) => p.id).join(","));
for (const p of PRESETS) {
  check(`${p.id}: cites a source`, p.sources.length > 0 && p.sources.every((s) => s.trim().length > 2));
  check(`${p.id}: lengths and targets are positive, the prefix inside the prompt`,
    p.promptTokens > 0 && p.outputTokens > 0 && p.sharedPrefix >= 0 && p.sharedPrefix <= p.promptTokens && p.ttftS > 0 && p.tpotMs > 0);
}
const by = (id: string) => PRESETS.find((p) => p.id === id)!;
if (PRESETS.length === 6) {
  check("RAG reads more than chat", by("rag").promptTokens > by("chat").promptTokens);
  check("summaries read more than they write", by("summarization").promptTokens > 4 * by("summarization").outputTokens);
  check("reasoning writes the most", PRESETS.every((p) => p.id === "reasoning" || p.outputTokens < by("reasoning").outputTokens));
  check("agents share the most prefix", PRESETS.every((p) => p.id === "agent" || p.sharedPrefix <= by("agent").sharedPrefix));
  check("thinking adds the reasoning preset's extra over a chat reply", THINKING_TOKENS > 0 && THINKING_TOKENS < by("reasoning").outputTokens);
}

console.log("--- what a model's files move ---");
const p: WorkloadPreset = { id: "chat", promptTokens: 1000, outputTokens: 400, sharedPrefix: 200, ttftS: 1, tpotMs: 50, sources: ["x"] };
{
  const qwen = hintsFromSnapshot(repo("Qwen_Qwen3-32B"));
  check("Qwen3-32B thinks, and can be told not to", qwen.thinks && qwen.thinkToggle && !qwen.noDecode);
  const a = presetFor(p, qwen);
  check("…so its reply grows by the thinking", a.outputTokens === 400 + THINKING_TOKENS && a.notes.includes("thinking"));
  check("…except in the reasoning preset, which counts it already", presetFor({ ...p, id: "reasoning" }, qwen).outputTokens === 400);

  const emb = hintsFromSnapshot(repo("Qwen_Qwen3-Embedding-0.6B"));
  check("an embedding model is recognised", emb.noDecode);
  const e = presetFor(p, emb);
  check("…and generates nothing", e.outputTokens === 0 && e.notes.join() === "noDecode");

  const llama = hintsFromSnapshot(repo("unsloth_Llama-3.1-8B-Instruct"));
  check("Llama 3.1 8B does not think", !llama.thinks);
  check("…and leaves the preset alone", JSON.stringify(presetFor(p, llama)) === JSON.stringify({ promptTokens: 1000, outputTokens: 400, sharedPrefix: 200, ttftS: 1, tpotMs: 50, notes: [] }));
}
{
  const capped = presetFor(p, { thinks: false, thinkToggle: false, noDecode: false, maxNewTokens: 256 });
  check("max_new_tokens caps the reply", capped.outputTokens === 256 && capped.notes.includes("capped"));
  const ctx = presetFor(p, null, 1024);
  check("the prompt gives way to fit the context", ctx.promptTokens === 624 && ctx.outputTokens === 400 && ctx.notes.includes("context"));
  check("…and the prefix stays inside it", presetFor({ ...p, sharedPrefix: 900 }, null, 1024).sharedPrefix === 624);
  check("no hints, no change", JSON.stringify(presetFor(p, null)) === JSON.stringify({ promptTokens: 1000, outputTokens: 400, sharedPrefix: 200, ttftS: 1, tpotMs: 50, notes: [] }));
}
if (PRESETS.length) {
  const chat = presetFor(by("chat"), null);
  check("a load set from a preset is recognised as it", matchingPreset(chat, null) === "chat");
  check("…and an edited one is not", matchingPreset({ ...chat, promptTokens: chat.promptTokens + 1 }, null) === null);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
