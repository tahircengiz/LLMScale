// vLLM serve parameter recommender. Pure & testable (node scripts/test-vllm.ts).
// Rules are grounded in the current vLLM V1 docs (engine args, optimization,
// tool calling, quantized KV cache). Reason/warning strings are i18n keys.

import { weightsBytes, kvBytesPerToken, BYTES_PER_GIB } from "./calc.ts";
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
  gpuCount: number;
  maxModelLen: number;
  /** Serving on a single MIG slice (no tensor parallelism across MIG). */
  mig?: boolean;
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
  if (i.mig) {
    warnings.push({ key: "vllm.w.mig" });
  } else if (i.gpuCount > 1) {
    flags.push({ flag: "--tensor-parallel-size", value: String(i.gpuCount), reasonKey: "vllm.r.tp" });
    if (i.isMoE) flags.push({ flag: "--enable-expert-parallel", reasonKey: "vllm.r.ep" });
  }

  // --- gpu memory utilization ---
  const util = i.priority === "throughput" || i.priority === "memory" ? 0.95 : 0.9;
  flags.push({ flag: "--gpu-memory-utilization", value: util.toFixed(2), reasonKey: "vllm.r.gpuutil" });

  // --- KV cache precision ---
  let kvDtype: Dtype = "fp16";
  if (i.priority === "accuracy") {
    warnings.push({ key: "vllm.w.kvfull" });
  } else if (wantFp8Kv && longCtx) {
    flags.push({ flag: "--kv-cache-dtype", value: "fp8", reasonKey: "vllm.r.kvfp8" });
    warnings.push({ key: "vllm.w.fp8acc" });
    kvDtype = "fp8";
  }

  // --- batching / scheduling ---
  if (i.priority === "throughput") {
    flags.push({ flag: "--max-num-batched-tokens", value: "8192", reasonKey: "vllm.r.maxbatched" });
    flags.push({ flag: "--max-num-seqs", value: "512", reasonKey: "vllm.r.maxseqs" });
  } else if (i.priority === "latency") {
    flags.push({ flag: "--max-num-batched-tokens", value: "2048", reasonKey: "vllm.r.maxbatchedLat" });
    flags.push({ flag: "--max-num-seqs", value: "32", reasonKey: "vllm.r.maxseqsLat" });
  } else if (i.priority === "memory") {
    flags.push({ flag: "--max-num-seqs", value: "64", reasonKey: "vllm.r.maxseqsMem" });
  }

  // --- prefill / caching ---
  if (longCtx) flags.push({ flag: "--enable-chunked-prefill", reasonKey: "vllm.r.chunked" });
  if (i.task === "chat" || i.task === "rag" || i.task === "tool" || i.task === "reasoning")
    flags.push({ flag: "--enable-prefix-caching", reasonKey: "vllm.r.prefix" });

  // --- task specifics ---
  if (i.task === "tool") {
    flags.push({ flag: "--enable-auto-tool-choice", reasonKey: "vllm.r.tool" });
    const p = toolParser(i.hfId, i.modelType);
    if (p) {
      flags.push({ flag: "--tool-call-parser", value: p.parser, reasonKey: "vllm.r.toolparser", reasonVars: { parser: p.parser } });
      if (p.template) warnings.push({ key: "vllm.w.template" });
    } else {
      warnings.push({ key: "vllm.w.parserUnknown" });
    }
  }
  if (i.task === "structured") flags.push({ flag: "--guided-decoding-backend", value: "xgrammar", reasonKey: "vllm.r.guided" });
  if (i.task === "vision" || i.vision) {
    flags.push({ flag: "--limit-mm-per-prompt", value: `'{"image":1}'`, reasonKey: "vllm.r.mm" });
    warnings.push({ key: "vllm.w.trust" });
  }

  // --- accuracy emphasis ---
  if (i.priority === "accuracy" && !quant) {
    flags.push({ flag: "--dtype", value: "bfloat16", reasonKey: "vllm.r.dtype" });
  }

  // --- reproducibility / reliability ---
  flags.push({ flag: "--seed", value: "0", reasonKey: "vllm.r.seed" });

  // --- quantization notes ---
  if (quant === "gguf") warnings.push({ key: "vllm.w.gguf" });
  else if (quant) warnings.push({ key: "vllm.w.quant", vars: { q: quant.toUpperCase() } });

  // --- VRAM fit sanity (reuses the sizing engine) ---
  const wDtype = quantToDtype(quant);
  const weightsGiB = weightsBytes(i.arch, wDtype) / BYTES_PER_GIB;
  const kvSeqGiB = (kvBytesPerToken(i.arch, kvDtype) * i.maxModelLen) / BYTES_PER_GIB;
  const required = (weightsGiB + kvSeqGiB) * 1.1 + 1; // +overhead +CUDA ctx
  const budget = i.gpuCount * i.gpuVramGiB * util;
  if (required > budget) {
    warnings.push({
      key: "vllm.w.fit",
      vars: { need: required.toFixed(1), have: budget.toFixed(1), gpus: Math.max(2, Math.ceil(required / (i.gpuVramGiB * util))) },
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
