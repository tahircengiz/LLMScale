// How many GPUs a load takes (E1): requests per second, their prompt and reply
// lengths, and the latency they must meet.
//
// One replica is a vLLM instance on `tp` GPUs. At a request rate r it spends a
// share f = r × prefill time of its GPU time reading prompts; the rest goes to
// decode steps, so both stretch by 1 / (1 − f). Requests in decode follow from
// Little's law, b = r × output tokens × time per output token, and the step time
// at b comes from perf.ts (the slower of bandwidth and tensor throughput). The
// highest r that keeps time per output token, time to first token and the KV
// cache within bounds is the replica's capacity; the load divided by it is the
// replica count. A planning model: steady arrivals, average lengths, no spikes.
//
// React-free: the plan page uses it and scripts/test-planner.ts checks it.

import { calculate, typicalConcurrency, tokensInUse, type Dtype, type ModelArch, type TypicalLoad } from "./calc.ts";
import { batchFor, computeEfficiency, usableGiB, type Gpu } from "./gpus.ts";
import { VLLM_UTIL } from "./overhead.ts";
import { tpValid } from "./parallel.ts";
import { decodeStep, prefillTime, REQUEST_MS, stepFloorMs } from "./perf.ts";

export interface Workload {
  /** Requests arriving per second, across the whole deployment. */
  rps: number;
  promptTokens: number;
  outputTokens: number;
  /** Prompt tokens every request shares (a system prompt): cached once, not recomputed. */
  sharedPrefix: number;
  /** Targets: time to first token in seconds, time per output token in milliseconds. */
  ttftS: number;
  tpotMs: number;
}

export interface ModelSetup {
  arch: ModelArch;
  weightDtype: Dtype;
  kvDtype: Dtype;
  /** --max-model-len: every request must fit it, and memory is sized for one at it. */
  maxModelLen: number;
}

export type Limit = "tpot" | "ttft" | "kv" | "prefill";

export interface PlanOption {
  tp: number;
  /** Requests per second one replica sustains within the targets. */
  replicaRps: number;
  replicas: number;
  gpus: number;
  /** At the replica's share of the load: sequences in decode, and the latencies. */
  batch: number;
  tpotMs: number;
  ttftS: number;
  /** Sequences the KV cache holds at the typical request size. */
  kvSeqs: number;
  /** What stops a replica taking more, at its capacity. */
  limit: Limit;
}

export interface Infeasible {
  tp: number;
  reason: "memory" | "ttft" | "tpot" | "noTflops";
}

interface Operating {
  ok: boolean;
  batch: number;
  tpotMs: number;
  ttftS: number;
  fails?: Limit;
}

/** The plan at one replica's request rate `r`. */
function operate(m: ModelSetup, w: Workload, device: Device, tp: number, prefillS: number, workS: number, kvSeqs: number, inUse: number, r: number): Operating {
  // The GPU spends `workS` of each prompt's `prefillS`; the rest — the request's
  // handling and each pass's kernel floor (perf.ts) — is latency every prompt sees,
  // not time taken from the others: vLLM folds prompts into shared passes and
  // handles requests beside the GPU's work. Counted as GPU time, it had capped a
  // 0.6B embedding model at ~117 req/s on an H100.
  const f = r * workS;
  if (f >= 1) return { ok: false, batch: Infinity, tpotMs: Infinity, ttftS: Infinity, fails: "prefill" };
  const stretch = 1 / (1 - f);
  const ttftS = workS * stretch + (prefillS - workS);
  // An embedding model reads its input and answers with a vector: no decode, so
  // only the prompt side bounds it.
  if (w.outputTokens <= 0) {
    const fails: Limit | undefined = ttftS > w.ttftS ? "ttft" : undefined;
    return { ok: !fails, batch: 0, tpotMs: 0, ttftS, fails };
  }
  const step = (b: number) => decodeStep({ arch: m.arch, weightDtype: m.weightDtype, kvDtype: m.kvDtype, contextLength: inUse }, Math.max(1, Math.ceil(b)), device, tp)!.stepMs * stretch;
  // Little's law, solved by iteration: the step time grows with the batch it serves.
  let b = (r * w.outputTokens * step(1)) / 1000;
  for (let k = 0; k < 40; k++) {
    const next = (r * w.outputTokens * step(b)) / 1000;
    if (Math.abs(next - b) < 0.01 || next > kvSeqs * 4) {
      b = next;
      break;
    }
    b = next;
  }
  const tpotMs = step(b);
  const fails: Limit | undefined = b > kvSeqs ? "kv" : tpotMs > w.tpotMs ? "tpot" : ttftS > w.ttftS ? "ttft" : undefined;
  return { ok: !fails, batch: b, tpotMs, ttftS, fails };
}

type Device = { tflops?: Gpu["tflops"]; bandwidthGBs: number; computeEfficiency: number; layerMs?: number };

/** Every tensor-parallel size from `sizes` the model fits on and the heads allow,
 *  with what it takes to carry the load; cheapest first. */
export function planOptions(
  m: ModelSetup,
  w: Workload,
  g: Gpu,
  util: number = VLLM_UTIL,
  sizes: number[] = [1, 2, 4, 8],
): { options: PlanOption[]; infeasible: Infeasible[] } {
  const options: PlanOption[] = [];
  const infeasible: Infeasible[] = [];
  const usable = usableGiB(g, undefined, util);
  const batch = batchFor(g);
  const load: TypicalLoad = { promptTokens: w.promptTokens, outputTokens: w.outputTokens, sharedPrefix: w.sharedPrefix };
  const inUse = tokensInUse(load, m.maxModelLen);
  const device: Device = { tflops: g.tflops, bandwidthGBs: g.bandwidthGBs ?? 0, computeEfficiency: computeEfficiency(g), layerMs: g.layerMs };
  const heads = m.arch.numAttentionHeads;
  const kvHeads = m.arch.numKeyValueHeads || heads;

  for (const tp of sizes) {
    if (tp > 1 && !tpValid(tp, heads, kvHeads)) continue;
    const sizing = { arch: m.arch, weightDtype: m.weightDtype, kvDtype: m.kvDtype, contextLength: m.maxModelLen, batch, gpus: tp };
    if (calculate({ ...sizing, concurrency: 1 }).perGpuGiB > usable) {
      infeasible.push({ tp, reason: "memory" });
      continue;
    }
    if (!g.tflops || !g.bandwidthGBs) {
      infeasible.push({ tp, reason: "noTflops" });
      continue;
    }
    const kvSeqs = typicalConcurrency(sizing, usable, load).users;
    // A cached prefix is not recomputed; the rest of the prompt is.
    const prefillS = prefillTime(m.arch, m.weightDtype, Math.max(1, w.promptTokens - w.sharedPrefix), { tflops: g.tflops, bandwidthGBs: g.bandwidthGBs, computeEfficiency: device.computeEfficiency, layerMs: device.layerMs }, tp).seconds;
    const workS = Math.max(1e-6, prefillS - (stepFloorMs(m.arch, tp, device.layerMs) + REQUEST_MS) / 1000);
    const at = (r: number) => operate(m, w, device, tp, prefillS, workS, kvSeqs, inUse, r);
    const idle = at(1e-9);
    if (!idle.ok) {
      infeasible.push({ tp, reason: idle.fails === "ttft" ? "ttft" : "tpot" });
      continue;
    }
    // The highest rate that still meets every bound, by bisection: each bound only
    // tightens as the rate rises.
    let lo = 0;
    let hi = 1 / workS;
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (at(mid).ok) lo = mid;
      else hi = mid;
    }
    const cap = at(lo);
    const limit = at(lo * 1.02 + 1e-9).fails ?? "prefill";
    const replicas = Math.max(1, Math.ceil(w.rps / lo));
    // What each replica sees at its share of the load, not at its capacity.
    const share = at(w.rps / replicas);
    options.push({
      tp,
      replicaRps: lo,
      replicas,
      gpus: replicas * tp,
      batch: share.ok ? share.batch : cap.batch,
      tpotMs: share.ok ? share.tpotMs : cap.tpotMs,
      ttftS: share.ok ? share.ttftS : cap.ttftS,
      kvSeqs,
      limit,
    });
  }
  options.sort((a, b) => a.gpus - b.gpus || a.tp - b.tp);
  return { options, infeasible };
}
