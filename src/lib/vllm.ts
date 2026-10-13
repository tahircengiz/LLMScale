// vLLM serve parameter recommender. Pure & testable (node scripts/test-vllm.ts).
// Rules are grounded in the current vLLM V1 docs (engine args, optimization,
// tool calling, quantized KV cache). Reason/warning strings are i18n keys.

import { calculate, gpusNeeded, maxConcurrency } from "./calc.ts";
import { VLLM_UTIL, vllmBatch, type BatchShape } from "./overhead.ts";
import { largestTpAtMost, tpValid } from "./parallel.ts";
import type { Parsers } from "./serving.ts";
import type { Dtype, ModelArch } from "./calc";

export type Priority = "balanced" | "throughput" | "latency" | "accuracy" | "memory";
export type VllmTask = "chat" | "rag" | "code" | "tool" | "structured" | "vision" | "reasoning";

export const PRIORITIES: Priority[] = ["balanced", "throughput", "latency", "accuracy", "memory"];
export const VLLM_TASKS: VllmTask[] = ["chat", "rag", "code", "tool", "structured", "vision", "reasoning"];

export interface VllmInput {
  hfId: string;
  arch: ModelArch;
  modelType?: string;
  isMoE?: boolean;
  vision?: boolean;
  priority: Priority;
  task: VllmTask;
  gpuVramGiB: number;
  /** The device's name: vLLM keeps an A100 at the small batch defaults. */
  gpuName?: string;
  gpuCount: number;
  maxModelLen: number;
  /** Serving on a single MIG slice (no tensor parallelism across MIG). */
  mig?: boolean;
  /** Config-detected weight precision (e.g. MXFP4 for gpt-oss) — overrides the
   * name-based quant guess for the VRAM-fit sanity check so natively-quantized
   * models aren't sized as bf16. */
  weightDtype?: Dtype;
  /** The tool and reasoning parsers the Serving Brief read from the chat template
   *  (serving.ts). Given, they win over the name-based guess below, so the two
   *  pages cannot name different parsers for one model. */
  parsers?: Parsers;
}

export interface VllmFlag {
  flag: string;
  value?: string;
  reasonKey: string;
  reasonVars?: Record<string, string | number>;
}
export interface VllmWarn {
  key: string;
  vars?: Record<string, string | number>;
}
export interface VllmRec {
  command: string;
  /** Kubernetes-style args: one `--key=value` per line, no serve/model, no indent. */
  k8sArgs: string;
  flags: VllmFlag[];
  warnings: VllmWarn[];
}

/** Detect a pre-applied quantization from the repo id. */
export function detectQuant(hfId: string): string | null {
  const s = hfId.toLowerCase();
  if (/gguf/.test(s)) return "gguf";
  if (/nvfp4/.test(s)) return "nvfp4";
  if (/fp8/.test(s)) return "fp8";
  if (/awq/.test(s)) return "awq";
  if (/gptq/.test(s)) return "gptq";
  if (/w4a16|int4|4bit/.test(s)) return "int4";
  if (/w8a8|w8a16|int8/.test(s)) return "int8";
  return null;
}

function quantToDtype(q: string | null): Dtype {
  if (q === "fp8" || q === "int8" || q === "w8a8") return "fp8";
  if (q === "nvfp4" || q === "awq" || q === "gptq" || q === "int4") return "int4";
  return "bf16";
}

/** The precision vLLM will load a model at: the config's, else the repo name's. */
export function servingDtype(hfId: string, weightDtype?: Dtype): Dtype {
  return weightDtype ?? quantToDtype(detectQuant(hfId));
}

/** Map a model family to its vLLM tool-call parser. `template: true` means a
 * model-specific --chat-template is usually required. */
export function toolParser(hfId: string, modelType?: string): { parser: string; template?: boolean } | null {
  const s = `${hfId} ${modelType ?? ""}`.toLowerCase();
  if (/llama-?4|llama4/.test(s)) return { parser: "llama4_pythonic", template: true };
  if (/llama-?3|llama3|meta-llama/.test(s)) return { parser: "llama3_json", template: true };
  if (/qwen3.*coder|qwen.*coder/.test(s)) return { parser: "qwen3_xml" };
  if (/qwen/.test(s)) return { parser: "hermes" };
  if (/deepseek.*v3\.1|deepseek.*3\.1/.test(s)) return { parser: "deepseek_v31" };
  if (/deepseek/.test(s)) return { parser: "deepseek_v3", template: true };
  if (/mixtral|mistral|ministral|magistral|devstral/.test(s)) return { parser: "mistral", template: true };
  if (/hermes/.test(s)) return { parser: "hermes" };
  if (/granite-?4/.test(s)) return { parser: "granite4" };
  if (/granite/.test(s)) return { parser: "granite" };
  if (/glm-?4|glm4/.test(s)) return { parser: "glm45" };
  if (/internlm/.test(s)) return { parser: "internlm" };
  return null;
}

export function recommend(i: VllmInput): VllmRec {
  const flags: VllmFlag[] = [];
  const warnings: VllmWarn[] = [];
  const quant = detectQuant(i.hfId);
  const longCtx = i.maxModelLen >= 32768 || i.task === "rag";
  const wantFp8Kv = i.priority === "memory" || i.priority === "throughput";

  // --- context length ---
  const modelMax = i.arch.maxContext ?? 0;
  if (modelMax && i.maxModelLen > modelMax) warnings.push({ key: "vllm.w.ctxcap", vars: { max: modelMax } });
  flags.push({ flag: "--max-model-len", value: String(i.maxModelLen), reasonKey: "vllm.r.maxlen" });

  // --- parallelism ---
  let tp = 1;
  if (i.mig) {
    warnings.push({ key: "vllm.w.mig" });
  } else if (i.gpuCount > 1) {
    // vLLM refuses a size that does not divide the heads, so the command never
    // carries one: it uses the largest that works and the warning says so.
    const heads = i.arch.numAttentionHeads;
    const kv = i.arch.numKeyValueHeads ?? heads;
    tp = tpValid(i.gpuCount, heads, kv) ? i.gpuCount : largestTpAtMost(i.gpuCount, heads, kv);
    if (tp !== i.gpuCount) warnings.push({ key: "vllm.w.tp", vars: { n: i.gpuCount, h: heads, ok: tp } });
    if (tp > 1) flags.push({ flag: "--tensor-parallel-size", value: String(tp), reasonKey: "vllm.r.tp" });
    if (i.isMoE) flags.push({ flag: "--enable-expert-parallel", reasonKey: "vllm.r.ep" });
  }

  // --- gpu memory utilization ---
  // 0.92 is vLLM's default (CacheConfig), so only the leaner priorities say it.
  const util = i.priority === "throughput" || i.priority === "memory" ? 0.95 : VLLM_UTIL;
  if (util !== VLLM_UTIL) flags.push({ flag: "--gpu-memory-utilization", value: util.toFixed(2), reasonKey: "vllm.r.gpuutil" });

  // --- KV cache precision ---
  let kvDtype: Dtype = "fp16";
  if (i.priority === "accuracy") {
    warnings.push({ key: "vllm.w.kvfull" });
  } else if (wantFp8Kv && longCtx) {
    flags.push({ flag: "--kv-cache-dtype", value: "fp8", reasonKey: "vllm.r.kvfp8" });
    warnings.push({ key: "vllm.w.fp8acc" });
    kvDtype = "fp8";
  }

  // --- memory budget ---
  // Sized before the scheduler flags, because the KV cache is what decides how
  // many sequences can actually be resident. The sizing page's engine (calc.ts),
  // at the batch these flags set: each GPU holds util × its memory, its share of
  // the weights and the cache, and vLLM's overhead (overhead.ts).
  // Prefer the config-detected precision (handles MXFP4 / config-only FP8 that
  // the name-based detectQuant misses); fall back to the name-based guess.
  const wDtype = servingDtype(i.hfId, i.weightDtype);
  const card = vllmBatch(i.gpuVramGiB, i.gpuName);
  const preset = i.priority === "throughput" ? 512 : i.priority === "latency" ? 32 : i.priority === "memory" ? 64 : undefined;
  const batch: BatchShape = {
    tokens: i.priority === "throughput" ? 8192 : i.priority === "latency" ? 2048 : card.tokens,
    seqs: preset ?? card.seqs,
    graphCap: card.graphCap,
  };
  const sizing = { arch: i.arch, weightDtype: wDtype, kvDtype, contextLength: i.maxModelLen, batch, gpus: tp };
  const usableGiB = i.gpuVramGiB * util;
  /** Full-length sequences the KV cache can hold once the weights are resident. */
  const seqCap = Math.max(1, maxConcurrency(sizing, usableGiB));
  // A sliding layer holds its window plus every token in flight, two batches of
  // --max-num-batched-tokens (kvReservedPerSeq in calc.ts), so the batch, not the
  // window, sets what Gemma-style models keep.
  if (i.arch.slidingWindow && i.arch.slidingLayers) {
    const held = Math.min(i.arch.slidingWindow - 1 + 2 * batch.tokens, i.maxModelLen);
    if (held >= 2 * i.arch.slidingWindow)
      warnings.push({
        key: "vllm.w.sliding",
        vars: { w: i.arch.slidingWindow.toLocaleString("en-US"), held: held.toLocaleString("en-US"), t: batch.tokens.toLocaleString("en-US") },
      });
  }

  /** A preset is an upper bound — clamp it to what the KV cache can hold. */
  let seqsClamped = false;
  function seqs(preset: number): string {
    const v = Math.min(preset, seqCap);
    if (v < preset) seqsClamped = true;
    return String(v);
  }

  // --- batching / scheduling ---
  if (i.priority === "throughput") {
    flags.push({ flag: "--max-num-batched-tokens", value: "8192", reasonKey: "vllm.r.maxbatched" });
    flags.push({ flag: "--max-num-seqs", value: seqs(512), reasonKey: "vllm.r.maxseqs" });
  } else if (i.priority === "latency") {
    flags.push({ flag: "--max-num-batched-tokens", value: "2048", reasonKey: "vllm.r.maxbatchedLat" });
    flags.push({ flag: "--max-num-seqs", value: seqs(32), reasonKey: "vllm.r.maxseqsLat" });
  } else if (i.priority === "memory") {
    flags.push({ flag: "--max-num-seqs", value: seqs(64), reasonKey: "vllm.r.maxseqsMem" });
  }
  if (seqsClamped) {
    warnings.push({
      key: "vllm.w.seqcap",
      vars: { fit: seqCap, ctx: i.maxModelLen.toLocaleString("en-US") },
    });
  }

  // Chunked prefill, prefix caching and seed 0 are vLLM 0.31.0's defaults
  // (SchedulerConfig, CacheConfig, ModelConfig), so the command leaves them out.

  // --- task specifics ---
  if (i.task === "tool") {
    flags.push({ flag: "--enable-auto-tool-choice", reasonKey: "vllm.r.tool" });
    if (i.parsers?.tool) {
      flags.push({ flag: "--tool-call-parser", value: i.parsers.tool, reasonKey: "vllm.r.toolparser", reasonVars: { parser: i.parsers.tool } });
      if (i.parsers.template) flags.push({ flag: "--chat-template", value: i.parsers.template, reasonKey: "vllm.r.chatTemplate" });
    } else {
      // No chat template read (a gated repo, or the Hub did not answer): fall back to the name.
      const p = toolParser(i.hfId, i.modelType);
      if (p) {
        flags.push({ flag: "--tool-call-parser", value: p.parser, reasonKey: "vllm.r.toolparser", reasonVars: { parser: p.parser } });
        if (p.template) warnings.push({ key: "vllm.w.template" });
      } else {
        warnings.push({ key: "vllm.w.parserUnknown" });
      }
    }
  }
  // A model that thinks puts its reasoning in the reply unless vLLM separates it.
  if (i.parsers?.reasoning) flags.push({ flag: "--reasoning-parser", value: i.parsers.reasoning, reasonKey: "vllm.r.reasoningParser" });
  // --guided-decoding-backend is gone; structured output is configured here now.
  if (i.task === "structured") flags.push({ flag: "--structured-outputs-config.backend", value: "xgrammar", reasonKey: "vllm.r.guided" });
  if (i.task === "vision" || i.vision) {
    flags.push({ flag: "--limit-mm-per-prompt", value: `'{"image":1}'`, reasonKey: "vllm.r.mm" });
    warnings.push({ key: "vllm.w.trust" });
  }

  // --- accuracy emphasis ---
  if (i.priority === "accuracy" && !quant) {
    flags.push({ flag: "--dtype", value: "bfloat16", reasonKey: "vllm.r.dtype" });
  }

  // --- quantization notes ---
  if (quant === "gguf") warnings.push({ key: "vllm.w.gguf" });
  else if (quant) warnings.push({ key: "vllm.w.quant", vars: { q: quant.toUpperCase() } });

  // --- VRAM fit sanity (same budget the scheduler caps were sized against) ---
  // One sequence at the full length, on each GPU of the group.
  const one = calculate({ ...sizing, concurrency: 1 });
  if (one.perGpuGiB > usableGiB) {
    // A GPU count vLLM can split the heads across, not just enough memory.
    const enough = gpusNeeded({ ...sizing, concurrency: 1 }, usableGiB);
    warnings.push({
      key: "vllm.w.fit",
      vars: {
        need: one.perGpuGiB.toFixed(1),
        have: usableGiB.toFixed(1),
        gpus: enough ?? Math.max(2, Math.ceil(one.totalGiB / usableGiB)),
      },
    });
  }

  // --- assemble shell command ---
  const lines = [`vllm serve ${i.hfId}`];
  for (const f of flags) lines.push(`  ${f.flag}${f.value !== undefined ? " " + f.value : ""}`);
  const command = lines.join(" \\\n");

  // --- assemble Kubernetes args (one --key=value per line, no serve/model) ---
  const stripQuotes = (v: string) => v.replace(/^['"]|['"]$/g, "");
  const k8sArgs = flags
    .map((f) => `${f.flag}${f.value !== undefined ? "=" + stripQuotes(f.value) : ""}`)
    .join("\n");

  return { command, k8sArgs, flags, warnings };
}
