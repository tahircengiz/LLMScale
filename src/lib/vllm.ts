// vLLM serve parameter recommender. Pure & testable (node scripts/test-vllm.ts).
// Rules are grounded in the current vLLM V1 docs (engine args, optimization,
// tool calling, quantized KV cache). Reason/warning strings are i18n keys.

import { calculate, expertWeightBytes, layoutFor, layoutsOn, maxConcurrency, usesCompressedAttn, type Layout, type LayoutFit } from "./calc.ts";
import { VLLM_UTIL, vllmBatch, type BatchShape } from "./overhead.ts";
import { layoutArgs, layoutKey, layoutLabel, sameLayout, tpValid, type LayoutShape } from "./parallel.ts";
import { layoutSpeed, type StepDevice } from "./perf.ts";
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
  /** One of the layouts on `gpuCount` GPUs (VllmRec.layouts), as a link from the
   *  calculator or the planner names it; any other falls back to the first. */
  layout?: LayoutShape;
  /** The device's speed (gpus.ts, stepDevice): the layouts that hold a request are
   *  ranked by it, as the calculator ranks them. Without it, by memory alone. */
  device?: StepDevice;
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
  /** The layout the command sets up, and every one on these GPUs, best first
   *  (calc.ts, layoutsOn); null and empty on one GPU or a MIG slice. */
  layout: Layout | null;
  layouts: LayoutFit[];
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
  // DeepSeek V4: its compressed caches as the calculator sizes them (calc.ts, v4Reserved).
  const v4 = usesCompressedAttn(i.arch);

  // --- context length ---
  const modelMax = i.arch.maxContext ?? 0;
  if (modelMax && i.maxModelLen > modelMax) warnings.push({ key: "vllm.w.ctxcap", vars: { max: modelMax } });
  flags.push({ flag: "--max-model-len", value: String(i.maxModelLen), reasonKey: "vllm.r.maxlen" });

  // --- gpu memory utilization ---
  // 0.92 is vLLM's default (CacheConfig), so only the leaner priorities say it.
  const util = i.priority === "throughput" || i.priority === "memory" ? 0.95 : VLLM_UTIL;
  const usableGiB = i.gpuVramGiB * util;

  // --- KV cache precision ---
  // V4 keeps DeepSeek's fp8_ds_mla rows: --kv-cache-dtype auto resolves to them on
  // that layout, and 16-bit is refused there (vllm/models/deepseek_v4/attention.py,
  // _resolve_dsv4_kv_cache_dtype); its vLLM recipe sets fp8 outright.
  let kvDtype: Dtype = "fp16";
  if (v4) {
    kvDtype = "fp8";
  } else if (i.priority === "accuracy") {
    warnings.push({ key: "vllm.w.kvfull" });
  } else if (wantFp8Kv && longCtx) {
    warnings.push({ key: "vllm.w.fp8acc" });
    kvDtype = "fp8";
  }

  // --- memory budget ---
  // Sized before the parallelism and scheduler flags, because the KV cache is what
  // decides how the GPUs are laid out and how many sequences can be resident. The
  // sizing page's engine (calc.ts), at the batch these flags set: each GPU holds
  // util × its memory, its share of the weights and the cache, and vLLM's overhead
  // (overhead.ts). Prefer the config-detected precision (handles MXFP4 /
  // config-only FP8 that the name-based detectQuant misses); fall back to the
  // name-based guess.
  const wDtype = servingDtype(i.hfId, i.weightDtype);
  const card = vllmBatch(i.gpuVramGiB, i.gpuName);
  const preset = i.priority === "throughput" ? 512 : i.priority === "latency" ? 32 : i.priority === "memory" ? 64 : undefined;
  const batch: BatchShape = {
    tokens: i.priority === "throughput" ? 8192 : i.priority === "latency" ? 2048 : card.tokens,
    seqs: preset ?? card.seqs,
    graphCap: card.graphCap,
    // The card's sparse-MLA row and MXFP4 kernel, as the calculator has them.
    ...(card.sparseMla ? { sparseMla: card.sparseMla } : {}),
    ...(card.mxfp4 ? { mxfp4: card.mxfp4 } : {}),
  };
  const sizing = { arch: i.arch, weightDtype: wDtype, kvDtype, contextLength: i.maxModelLen, batch };
  /** One sequence at the full length: what the layouts and the fit check are sized for. */
  const one = { ...sizing, concurrency: 1 };

  // --- parallelism ---
  // The calculator's layout (calc.ts, layoutsOn): of every way vLLM can run the
  // model on these GPUs — tensor parallel where the heads allow, pipeline stages,
  // replicas, and for a MoE its experts spread over the GPUs — the fastest that
  // holds a request at --max-model-len, pipeline stages only when nothing else
  // does, unless a link asked for another of them. Tensor parallelism alone had
  // the page contradict the calculator in half the audit's cases.
  const n = i.mig ? 1 : Math.max(1, Math.floor(i.gpuCount));
  if (i.mig) warnings.push({ key: "vllm.w.mig" });
  const speed = layoutSpeed(one, i.device);
  const layouts = n > 1 ? layoutsOn(one, usableGiB, n, speed) : [];
  const picked = (i.layout && layouts.find((f) => sameLayout(f.layout, i.layout!))) || layouts[0];
  const layout = picked?.layout ?? null;
  if (layout) {
    const heads = i.arch.numAttentionHeads;
    const kv = i.arch.numKeyValueHeads ?? heads;
    // vLLM refuses a TP size that does not divide the heads, so the command never
    // carries one; the warning says why the GPUs are split another way.
    if (!tpValid(n, heads, kv) && layout.tp < n) warnings.push({ key: "vllm.w.tp", vars: { n, h: heads, layout: layoutLabel(layout) } });
    // A MoE on tensor parallelism without replicas: vLLM's DeepSeek recipes add
    // expert parallelism to it (TP+EP), which takes the same memory here, so it is
    // not a layout of its own; the reason says so. With replicas, DP+EP is one.
    const tpOnlyMoe = !layout.ep && layout.dp === 1 && expertWeightBytes(i.arch, wDtype) > 0;
    const why: Record<string, Pick<VllmFlag, "reasonKey" | "reasonVars">> = {
      "--tensor-parallel-size": { reasonKey: tpOnlyMoe ? "vllm.r.tpMoe" : "vllm.r.tp", reasonVars: { n: layout.tp } },
      "--pipeline-parallel-size": { reasonKey: "vllm.r.pp", reasonVars: { L: i.arch.numLayers, pp: layout.pp, k: Math.ceil(i.arch.numLayers / layout.pp) } },
      "--data-parallel-size": { reasonKey: layout.ep ? "vllm.r.dpEp" : "vllm.r.dp", reasonVars: { dp: layout.dp } },
      "--enable-expert-parallel": { reasonKey: "vllm.r.ep", reasonVars: { e: i.arch.numExperts ?? 0, n: layout.tp * layout.dp } },
    };
    for (const a of layoutArgs(layout)) flags.push({ ...a, ...why[a.flag] });
  }

  if (util !== VLLM_UTIL) flags.push({ flag: "--gpu-memory-utilization", value: util.toFixed(2), reasonKey: "vllm.r.gpuutil" });
  if (v4) {
    flags.push({ flag: "--kv-cache-dtype", value: "fp8", reasonKey: "vllm.r.kvV4" });
    // The recipe's block size: the one V4's sparse-MLA kernel takes (vllm/models/
    // deepseek_v4/sparse_mla.py) and the sizing assumes (calc.ts, V4_BLOCK). Without
    // it vLLM picks a size its backends share; the flag holds 256 on every platform.
    flags.push({ flag: "--block-size", value: "256", reasonKey: "vllm.r.blockV4" });
  } else if (kvDtype === "fp8") {
    flags.push({ flag: "--kv-cache-dtype", value: "fp8", reasonKey: "vllm.r.kvfp8" });
  }

  /** Full-length sequences the KV cache holds once the weights are resident, on one
   *  replica: --max-num-seqs counts per data-parallel rank (data_parallel_deployment.md). */
  const seqCap = Math.max(1, picked ? Math.floor(picked.maxUsers / picked.layout.dp) : maxConcurrency({ ...sizing, gpus: 1 }, usableGiB));
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
  // One sequence at the full length, on each GPU of the layout. Too big, the
  // count is the calculator's (layoutFor): the fewest of these GPUs, laid out.
  const needGiB = picked ? picked.layout.perGpuGiB : calculate({ ...one, gpus: 1 }).perGpuGiB;
  if (needGiB > usableGiB) {
    const enough = layoutFor(one, usableGiB, undefined, speed);
    const vars = { need: needGiB.toFixed(1), have: usableGiB.toFixed(1), ctx: i.maxModelLen.toLocaleString("en-US") };
    warnings.push(
      enough
        ? { key: "vllm.w.fit", vars: { ...vars, gpus: enough.gpus, layout: layoutLabel(enough), lay: layoutKey(enough) } }
        : { key: "vllm.w.fitNone", vars },
    );
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

  return { command, k8sArgs, flags, warnings, layout, layouts };
}
