// How many GPUs a load takes (E1): requests per second, their prompt and reply
// lengths, and the latency they must meet.
//
// One replica is a vLLM instance laid out as the calculator lays one out (calc.ts,
// layoutsOn): `pp` pipeline stages of `tp` GPUs, or for a MoE `dp` data-parallel
// ranks with its experts spread over them. At a request rate r it spends a share
// f = r × prefill time of its GPU time reading prompts; the rest goes to decode
// steps, so both stretch by 1 / (1 − f). Requests in decode follow from Little's
// law, b = r × output tokens × time per output token, and the step time at b comes
// from perf.ts (the slower of bandwidth and tensor throughput). The highest r that
// keeps time per output token, time to first token and the KV cache within bounds
// is the replica's capacity; the load divided by it is the replica count. A
// planning model: steady arrivals, average lengths, no spikes.
//
// React-free: the plan page uses it and scripts/test-planner.ts checks it.

import { layoutFor, layoutsOn, typicalOnLayout, tokensInUse, type Dtype, type ModelArch, type TypicalLoad } from "./calc.ts";
import { batchFor, computeEfficiency, usableGiB, type Gpu } from "./gpus.ts";
import { VLLM_UTIL } from "./overhead.ts";
import type { LayoutShape } from "./parallel.ts";
import { ALLREDUCE_MS, layoutStep, prefillTime, REQUEST_MS, stepFloorMs } from "./perf.ts";

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

/** One replica's layout: `pp` stages of `tp` GPUs, or with `ep` an instance of `dp`
 *  data-parallel ranks whose experts are spread over all of them (dp is 1 without
 *  ep: replicas are counted apart). `size` is its GPUs, tp × pp × dp. */
export interface ReplicaShape extends LayoutShape {
  size: number;
}

export interface PlanOption extends ReplicaShape {
  /** Requests per second one replica sustains within the targets. */
  replicaRps: number;
  replicas: number;
  gpus: number;
  /** At the replica's share of the load: sequences in decode, and the latencies. */
  batch: number;
  tpotMs: number;
  ttftS: number;
  /** Sequences the replica's KV cache holds at the typical request size. */
  kvSeqs: number;
  /** What stops a replica taking more, at its capacity. */
  limit: Limit;
}

export interface Infeasible extends ReplicaShape {
  reason: "memory" | "ttft" | "tpot" | "noTflops";
}

interface Operating {
  ok: boolean;
  batch: number;
  tpotMs: number;
  ttftS: number;
  fails?: Limit;
}

type Device = { tflops?: Gpu["tflops"]; bandwidthGBs: number; computeEfficiency: number; layerMs?: number };

/** What a replica's prompts cost: `prefillS` from arrival to first token, of which
 *  `workS` is GPU work. */
interface Prefill {
  prefillS: number;
  workS: number;
}

/** The plan at one replica's request rate `r`. `kvSeqs` is a rank's. */
function operate(m: ModelSetup, w: Workload, device: Device, l: ReplicaShape, p: Prefill, kvSeqs: number, inUse: number, r: number): Operating {
  // Expert parallelism splits a replica's requests over its ranks; pipeline stages
  // read a prompt one after another, each its share of the layers, so a replica of
  // `pp` stages reads `pp` prompts at once.
  const ranks = l.ep ? l.dp : 1;
  // The GPU spends `workS` of each prompt's `prefillS`; the rest — the request's
  // handling and each pass's kernel floor (perf.ts) — is latency every prompt sees,
  // not time taken from the others: vLLM folds prompts into shared passes and
  // handles requests beside the GPU's work. Counted as GPU time, it had capped a
  // 0.6B embedding model at ~117 req/s on an H100.
  const f = (r * p.workS) / (l.pp * ranks);
  if (f >= 1) return { ok: false, batch: Infinity, tpotMs: Infinity, ttftS: Infinity, fails: "prefill" };
  const stretch = 1 / (1 - f);
  const ttftS = p.workS * stretch + (p.prefillS - p.workS);
  // An embedding model reads its input and answers with a vector: no decode, so
  // only the prompt side bounds it.
  if (w.outputTokens <= 0) {
    const fails: Limit | undefined = ttftS > w.ttftS ? "ttft" : undefined;
    return { ok: !fails, batch: 0, tpotMs: 0, ttftS, fails };
  }
  const input = { arch: m.arch, weightDtype: m.weightDtype, kvDtype: m.kvDtype, contextLength: inUse };
  const step = (b: number) => layoutStep(input, Math.max(1, Math.ceil(b)), device, l)!.stepMs * stretch;
  // Little's law on one rank, solved by iteration: the step time grows with the batch it serves.
  const rr = r / ranks;
  let b = (rr * w.outputTokens * step(1)) / 1000;
  for (let k = 0; k < 40; k++) {
    const next = (rr * w.outputTokens * step(b)) / 1000;
    if (Math.abs(next - b) < 0.01 || next > kvSeqs * 4) {
      b = next;
      break;
    }
    b = next;
  }
  const tpotMs = step(b);
  const fails: Limit | undefined = b > kvSeqs ? "kv" : tpotMs > w.tpotMs ? "tpot" : ttftS > w.ttftS ? "ttft" : undefined;
  return { ok: !fails, batch: b * ranks, tpotMs, ttftS, fails };
}

/** A prompt alone on a replica: read on `tp` GPUs stage after stage, paced by the
 *  busiest stage, handed between stages, and under expert parallelism dispatched
 *  to the experts' GPUs and back in every layer (perf.ts, layoutStep). */
function prefillOn(m: ModelSetup, w: Workload, device: Device, l: ReplicaShape): Prefill {
  // A cached prefix is not recomputed; the rest of the prompt is.
  const tokens = Math.max(1, w.promptTokens - w.sharedPrefix);
  const layers = Math.max(1, m.arch.numLayers);
  const pace = (l.pp * Math.ceil(layers / l.pp)) / layers;
  const floorMs = stepFloorMs(m.arch, l.tp, device.layerMs);
  const alone = prefillTime(m.arch, m.weightDtype, tokens, { tflops: device.tflops!, bandwidthGBs: device.bandwidthGBs, computeEfficiency: device.computeEfficiency, layerMs: device.layerMs }, l.tp).seconds;
  const work = Math.max(1e-6, (alone - (floorMs + REQUEST_MS) / 1000) * pace);
  const hops = (l.pp - 1 + (l.ep && l.dp > 1 ? 2 * layers : 0)) * ALLREDUCE_MS;
  return { prefillS: work + (floorMs * pace + REQUEST_MS + hops) / 1000, workS: work };
}

/** Largest replica the plan tries on its own; a model that needs more is tried at
 *  the calculator's count for it as well. */
const MAX_REPLICA = 8;

/** Every replica layout the calculator has for this model on this card (calc.ts,
 *  layoutsOn: tensor parallel where the heads allow, pipeline stages, and for a MoE
 *  data-parallel ranks with the experts spread) on up to `maxSize` GPUs, and on the
 *  calculator's fewest when it is more; with what it takes to carry the load.
 *  Cheapest first; at the same cost, the one with the most headroom. */
export function planOptions(
  m: ModelSetup,
  w: Workload,
  g: Gpu,
  util: number = VLLM_UTIL,
  maxSize: number = MAX_REPLICA,
): { options: PlanOption[]; infeasible: Infeasible[] } {
  const options: PlanOption[] = [];
  const infeasible: Infeasible[] = [];
  const usable = usableGiB(g, undefined, util);
  const batch = batchFor(g);
  const load: TypicalLoad = { promptTokens: w.promptTokens, outputTokens: w.outputTokens, sharedPrefix: w.sharedPrefix };
  const inUse = tokensInUse(load, m.maxModelLen);
  const device: Device = { tflops: g.tflops, bandwidthGBs: g.bandwidthGBs ?? 0, computeEfficiency: computeEfficiency(g), layerMs: g.layerMs };
  // Memory is sized for one request at --max-model-len, as the calculator sizes it.
  const sizing = { arch: m.arch, weightDtype: m.weightDtype, kvDtype: m.kvDtype, contextLength: m.maxModelLen, batch };
  const one = { ...sizing, concurrency: 1 };
  const sizes = Array.from({ length: Math.max(1, maxSize) }, (_, k) => k + 1);
  const fewest = layoutFor(one, usable, 64)?.gpus;
  if (fewest && fewest > maxSize) sizes.push(fewest);

  for (const n of sizes) {
    for (const fit of layoutsOn(one, usable, n)) {
      // Replicas without expert parallelism are counted below, not laid out.
      if (!fit.layout.ep && fit.layout.dp > 1) continue;
      const { tp, pp, dp, ep } = fit.layout;
      const l: ReplicaShape = { tp, pp, dp, ep, size: n };
      if (!fit.fits) {
        infeasible.push({ ...l, reason: "memory" });
        continue;
      }
      if (!g.tflops || !g.bandwidthGBs) {
        infeasible.push({ ...l, reason: "noTflops" });
        continue;
      }
      const ranks = ep ? dp : 1;
      const kvSeqs = typicalOnLayout(sizing, usable, load, l);
      const p = prefillOn(m, w, device, l);
      const at = (r: number) => operate(m, w, device, l, p, kvSeqs, inUse, r);
      const idle = at(1e-9);
      if (!idle.ok) {
        infeasible.push({ ...l, reason: idle.fails === "ttft" ? "ttft" : "tpot" });
        continue;
      }
      // The highest rate that still meets every bound, by bisection: each bound only
      // tightens as the rate rises.
      let lo = 0;
      let hi = (pp * ranks) / p.workS;
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
        ...l,
        replicaRps: lo,
        replicas,
        gpus: replicas * n,
        batch: share.ok ? share.batch : cap.batch,
        tpotMs: share.ok ? share.tpotMs : cap.tpotMs,
        ttftS: share.ok ? share.ttftS : cap.ttftS,
        kvSeqs: kvSeqs * ranks,
        limit,
      });
    }
  }
  options.sort(
    (a, b) => a.gpus - b.gpus || b.replicas * b.replicaRps - a.replicas * a.replicaRps || a.pp - b.pp || a.dp - b.dp || a.tp - b.tp,
  );
  return { options, infeasible };
}
