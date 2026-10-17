// Property sweep of the sizing engine (audit phase 4, from the 2026-10-15 audit's
// sweep-engine.ts and edge.ts). Run: node scripts/test-sweep-engine.ts
//
// Over every preset and the regression fixtures' edge architectures (sweep-kit.ts),
// at each precision, context and load: what the calculator shows is finite and never
// negative, grows with context and users, and its reverse answers agree with its
// forward one — the "max users" N fit and N+1 do not, the "max context" C fits and
// C+1 does not. Decode, prefill, the planner and training memory move the way their
// inputs say. The audit's run took every card and MIG slice (36 s); this one takes
// the cards in sweep-kit.ts, three for the planner, and keeps every property.
//
// Not here, on purpose: the panel's own "past the model's limit" warning (A8), and
// no layout on a MIG slice or a unified device (A6, A7), are the pages' rules
// (Controls.tsx, GpuFit.tsx), not the engine's; the vLLM page's warning is checked
// below. The worst-case "max users" above --max-num-seqs (A10) is an open finding.

import { calculate, DTYPE_BYTES, layoutFor, maxConcurrency, maxContextLength, typicalConcurrency, weightsBytes, type Dtype, type ModelArch } from "../src/lib/calc.ts";
import { batchFor, stepDevice, usableGiB } from "../src/lib/gpus.ts";
import { decodeStep, prefillTime } from "../src/lib/perf.ts";
import { planOptions } from "../src/lib/planner.ts";
import { estimateTraining, TRAIN_MODES } from "../src/lib/train.ts";
import { recommend } from "../src/lib/vllm.ts";
import { f2, fin, finish, Prop, SWEEP_CARDS, SWEEP_MIG, sweepModels } from "./sweep-kit.ts";

const t0 = Date.now();
const models = await sweepModels();

const P = {
  finite: new Prop("calculate(): every output finite and >= 0"),
  totCtx: new Prop("total memory non-decreasing in context"),
  totUsers: new Prop("total memory non-decreasing in users"),
  perSeqCtx: new Prop("KV per sequence non-decreasing in context"),
  mcCtx: new Prop("max users non-increasing in context"),
  mclUsers: new Prop("max context non-increasing in users"),
  mclMax: new Prop("max context never above the model's"),
  mcFwd: new Prop("max users N: N fit by calculate(), N+1 do not"),
  mclFwd: new Prop("max context C: calculate(C) fits, C+1 does not (unless at the model's limit)"),
  typ: new Prop("typical users >= worst-case users, below the --max-num-seqs cap"),
  utilMc: new Prop("higher GPU memory share: max users non-decreasing"),
  utilMcl: new Prop("higher GPU memory share: max context non-decreasing"),
  decCtx: new Prop("decode tok/s per user non-increasing in context"),
  decBatch: new Prop("decode: total tok/s non-decreasing and per-user non-increasing in batch"),
  ttft: new Prop("prefill time non-decreasing in prompt length"),
  plan: new Prop("planner: GPUs non-decreasing in request rate"),
  planTpot: new Prop("planner: a looser TPOT target never lowers a layout's replica capacity"),
  train: new Prop("training: finite, full >= LoRA >= QLoRA, more with longer sequences and batches"),
  wdOrder: new Prop("weights: int4 <= int8 = fp8 <= bf16 = fp16 <= fp32, shipped checkpoints included"),
  quantFix: new Prop("a lighter weight precision never needs more memory"),
  ctxcap: new Prop("vLLM page warns whenever --max-model-len is past the model's limit"),
  tpNone: new Prop("heads no tensor-parallel size divides still get a GPU count"),
  bare: new Prop("custom architecture without head size, vocabulary or limit: finite, non-negative"),
};

const WDS: Dtype[] = ["fp32", "fp16", "bf16", "fp8", "int8", "int4"];
const CTXS = [1, 2048, 8192, 32768, 131072, 262144, 1048576];
const USERS = [1, 2, 4, 8, 16, 32, 64, 128, 256];
const UTILS = [0.5, 0.8, 0.92, 0.99];
const devs = [...SWEEP_CARDS.map((g) => ({ g, mig: "" })), ...SWEEP_MIG];
const BIG_BATCH = { tokens: 16384, seqs: 1024, graphCap: 1024 };

for (const { id, arch } of models) {
  // Forward: sanity and monotonicity over context × users, at the default batch and a big card's.
  for (const wd of WDS) for (const kd of ["fp16", "fp8"] as Dtype[]) for (const batch of [undefined, BIG_BATCH]) {
    let prevByUser: number[] = [];
    let prevSeq = -Infinity;
    for (const ctx of CTXS) {
      let prevTot = -Infinity;
      const row: number[] = [];
      for (const users of USERS) {
        const r = calculate({ arch, weightDtype: wd, kvDtype: kd, contextLength: ctx, concurrency: users, batch });
        const vals = [r.weightsGiB, r.kvCacheGiB, r.kvPerSeqGiB, r.kvPerTokenBytes, r.activationsGiB, r.runtimeGiB, r.perGpuGiB, r.totalGiB];
        P.finite.ok(vals.every((v) => fin(v) && v >= 0), () => `${id} ${wd}/${kd} ctx ${ctx} users ${users}: ${vals.map(f2).join(", ")}`);
        P.totUsers.ok(r.totalGiB >= prevTot - 1e-9, () => `${id} ${wd}/${kd} ctx ${ctx} users ${users}: ${f2(prevTot)} -> ${f2(r.totalGiB)} GiB`);
        prevTot = r.totalGiB;
        row.push(r.totalGiB);
        if (users === 1) {
          P.perSeqCtx.ok(r.kvPerSeqGiB >= prevSeq - 1e-12, () => `${id} ${kd} ctx ${ctx}: ${prevSeq} -> ${r.kvPerSeqGiB} GiB`);
          prevSeq = r.kvPerSeqGiB;
        }
      }
      if (prevByUser.length) row.forEach((v, i) => P.totCtx.ok(v >= prevByUser[i] - 1e-9, () => `${id} ${wd}/${kd} users ${USERS[i]} ctx ${ctx}: ${f2(prevByUser[i])} -> ${f2(v)} GiB`));
      prevByUser = row;
    }
  }

  // Reverse: max users and max context on each card and slice, against the forward answer.
  for (const { g, mig } of devs) for (const [wd, kd] of [["bf16", "fp16"], ["fp8", "fp8"], ["int4", "fp16"]] as [Dtype, Dtype][]) {
    const batch = batchFor(g, mig);
    const usable = usableGiB(g, mig);
    const base = { arch, weightDtype: wd, kvDtype: kd, batch };
    const tag = `${id} on ${g.id}${mig ? "/" + mig : ""} ${wd}/${kd}`;
    let prevMc = Infinity;
    for (const ctx of CTXS) {
      const mc = maxConcurrency({ ...base, contextLength: ctx }, usable);
      P.mcCtx.ok(mc <= prevMc, () => `${tag} ctx ${ctx}: ${prevMc} -> ${mc}`);
      prevMc = mc;
      if (mc > 0 && mc < 5000) {
        const fitN = calculate({ ...base, contextLength: ctx, concurrency: mc }).totalGiB <= usable;
        const fitN1 = calculate({ ...base, contextLength: ctx, concurrency: mc + 1 }).totalGiB <= usable;
        P.mcFwd.ok(fitN && !fitN1, () => `${tag} ctx ${ctx}: max users ${mc}, fits(N) ${fitN}, fits(N+1) ${fitN1}`);
      }
      const load = { promptTokens: Math.max(1, Math.round(ctx * 0.5)), outputTokens: Math.round(ctx * 0.2), sharedPrefix: Math.round(ctx * 0.1) };
      const ty = typicalConcurrency({ ...base, contextLength: ctx }, usable, load);
      // The typical figure stops at --max-num-seqs; the worst case does not (A10).
      P.typ.ok(ty.users >= Math.min(mc, batch.seqs), () => `${tag} ctx ${ctx}: typical ${ty.users} < worst-case ${mc} (cap ${batch.seqs})`);
    }
    let prevMcl = Infinity;
    for (const users of USERS) {
      const mcl = maxContextLength({ ...base, concurrency: users }, usable);
      P.mclUsers.ok(mcl <= prevMcl, () => `${tag} users ${users}: ${prevMcl} -> ${mcl}`);
      P.mclMax.ok(!arch.maxContext || mcl <= arch.maxContext, () => `${tag} users ${users}: ${mcl} > ${arch.maxContext}`);
      prevMcl = mcl;
      if (mcl > 0 && (users === 1 || users === 16)) {
        const fit = calculate({ ...base, contextLength: mcl, concurrency: users }).totalGiB <= usable;
        const capped = arch.maxContext !== undefined && mcl === arch.maxContext;
        const fit1 = capped ? false : calculate({ ...base, contextLength: mcl + 1, concurrency: users }).totalGiB <= usable;
        P.mclFwd.ok(fit && !fit1, () => `${tag} users ${users}: max context ${mcl}, fits(C) ${fit}, fits(C+1) ${fit1}`);
      }
    }
    if (!mig && wd === "bf16") for (const ctx of [8192, 131072]) {
      let pm = -1;
      let pl = -1;
      for (const u of UTILS) {
        const us = usableGiB(g, undefined, u);
        const mc = maxConcurrency({ ...base, contextLength: ctx }, us);
        const ml = maxContextLength({ ...base, concurrency: 4 }, us);
        P.utilMc.ok(mc >= pm, () => `${tag} ctx ${ctx} share ${u}: ${pm} -> ${mc}`);
        P.utilMcl.ok(ml >= pl, () => `${tag} share ${u}: ${pl} -> ${ml}`);
        pm = mc;
        pl = ml;
      }
    }
  }

  // Decode and prefill on cards with a bandwidth (and compute, for prefill).
  for (const g of SWEEP_CARDS.filter((x) => x.bandwidthGBs)) for (const wd of ["bf16", "int4"] as Dtype[]) for (const kd of ["fp16", "fp8"] as Dtype[]) {
    const dev = stepDevice(g);
    for (const gpus of [1, 4]) {
      for (const b of [1, 8, 64]) {
        let prev = Infinity;
        for (const ctx of CTXS) {
          const p = decodeStep({ arch, weightDtype: wd, kvDtype: kd, contextLength: ctx }, b, dev, gpus)!;
          P.decCtx.ok(fin(p.perUser) && p.perUser <= prev * (1 + 1e-12), () => `${id} ${g.id} ×${gpus} batch ${b} ctx ${ctx}: ${f2(prev)} -> ${f2(p.perUser)}`);
          prev = p.perUser;
        }
      }
      for (const ctx of [2048, 32768]) {
        let pt = 0;
        let pu = Infinity;
        for (const b of [1, 2, 3, 4, 8, 16, 32, 64, 128, 256, 512, 1024]) {
          const p = decodeStep({ arch, weightDtype: wd, kvDtype: kd, contextLength: ctx }, b, dev, gpus)!;
          P.decBatch.ok(p.total >= pt * (1 - 1e-9) && p.perUser <= pu * (1 + 1e-9), () => `${id} ${g.id} ×${gpus} ctx ${ctx} batch ${b}: total ${f2(pt)} -> ${f2(p.total)}, per user ${f2(pu)} -> ${f2(p.perUser)}`);
          pt = p.total;
          pu = p.perUser;
        }
      }
    }
    if (dev.tflops && kd === "fp16") {
      const compute = { ...dev, tflops: dev.tflops };
      let prev = 0;
      for (const tok of [1, 16, 256, 2048, 8192, 32768, 131072, 1048576]) {
        const s = prefillTime(arch, wd, tok, compute).seconds;
        P.ttft.ok(fin(s) && s >= prev, () => `${id} ${g.id} ${wd} ${tok} tokens: ${prev} -> ${s} s`);
        prev = s;
      }
    }
  }

  // Training memory.
  for (const seq of [512, 2048, 8192]) for (const bs of [1, 4]) {
    const t = (mode: (typeof TRAIN_MODES)[number], b: number, s: number) =>
      estimateTraining({ arch, mode, batchSize: b, seqLength: s, gradientCheckpointing: true, loraRank: 16, loraTarget: "all", overheadGiB: 1 }).totalGiB;
    const r = TRAIN_MODES.map((m) => t(m, bs, seq));
    const bigger = t("lora", bs * 2, seq * 2);
    P.train.ok(r.every(fin) && r[0] >= r[1] && r[1] >= r[2] && bigger >= r[1], () => `${id} seq ${seq} batch ${bs}: full ${f2(r[0])}, LoRA ${f2(r[1])}, QLoRA ${f2(r[2])}, bigger LoRA ${f2(bigger)}`);
  }

  // Weight precisions, and the "try a lighter precision" button's promise.
  const b = (d: Dtype) => weightsBytes(arch, d);
  const order: Dtype[][] = [["int4"], ["int8", "fp8"], ["bf16", "fp16"], ["fp32"]];
  let ordered = true;
  for (let i = 1; i < order.length; i++) for (const lo of order[i - 1]) for (const hi of order[i]) if (b(lo) > b(hi) * (1 + 1e-12)) ordered = false;
  P.wdOrder.ok(ordered, () => `${id}${arch.shipped ? ` (ships ${arch.shipped.dtype})` : ""}: ${["int4", "int8", "fp8", "bf16", "fp32"].map((d) => `${d} ${f2(b(d as Dtype) / 2 ** 30)}`).join(", ")} GiB`);
  for (const wd of ["fp32", "bf16", "fp8", "int8"] as Dtype[]) {
    const cur = calculate({ arch, weightDtype: wd, kvDtype: "fp16", contextLength: 8192, concurrency: 1 }).totalGiB;
    for (const d of (["bf16", "fp8", "int8", "int4"] as Dtype[]).filter((x) => DTYPE_BYTES[x] < DTYPE_BYTES[wd])) {
      const nxt = calculate({ arch, weightDtype: d, kvDtype: "fp16", contextLength: 8192, concurrency: 1 }).totalGiB;
      P.quantFix.ok(nxt <= cur, () => `${id}: ${wd} ${f2(cur)} GiB, lighter ${d} ${f2(nxt)} GiB`);
    }
  }

  // The vLLM page's context warning (A8's counterpart there).
  if (arch.maxContext) for (const len of [arch.maxContext, arch.maxContext + 1, arch.maxContext * 2]) {
    const rec = recommend({ hfId: "x/sweep", arch, priority: "balanced", task: "chat", gpuVramGiB: 80, gpuName: "H100", gpuCount: 1, maxModelLen: len });
    const warned = rec.warnings.some((w) => w.key === "vllm.w.ctxcap");
    P.ctxcap.ok(warned === len > arch.maxContext, () => `${id}: --max-model-len ${len} vs limit ${arch.maxContext}, warned ${warned}`);
  }
}

// The planner (presets; a consumer card, an NVLink HBM card and AMD's: each search
// takes ~4 ms, the most expensive step here).
const plannable = SWEEP_CARDS.filter((g) => ["rtx4090-24", "h100-80", "mi300x-192"].includes(g.id));
const wl = { promptTokens: 1000, outputTokens: 250, sharedPrefix: 200, ttftS: 2, tpotMs: 50 };
for (const { id, arch } of models.filter((m) => m.src === "preset")) for (const g of plannable) {
  const m = { arch, weightDtype: "bf16" as Dtype, kvDtype: "fp16" as Dtype, maxModelLen: Math.min(8192, arch.maxContext ?? 8192) };
  let prevG = 0;
  for (const rps of [0.1, 1, 10, 100, 1000]) {
    const best = planOptions(m, { ...wl, rps }, g).options[0];
    if (!best) break;
    P.plan.ok(best.gpus >= prevG, () => `${id} ${g.id} ${rps} req/s: ${prevG} -> ${best.gpus} GPUs`);
    prevG = best.gpus;
  }
  // By layout: since A4 the planner tries pipeline and expert-parallel layouts of one TP size too.
  const prevCap: Record<string, number> = {};
  for (const tpot of [20, 50, 200]) {
    for (const o of planOptions(m, { ...wl, rps: 10, tpotMs: tpot }, g).options) {
      const k = `${o.size} GPUs tp${o.tp} pp${o.pp} dp${o.dp}${o.ep ? " ep" : ""}`;
      P.planTpot.ok(o.replicaRps >= (prevCap[k] ?? 0) * (1 - 1e-6), () => `${id} ${g.id} ${k} TPOT ${tpot} ms: ${f2(prevCap[k])} -> ${f2(o.replicaRps)} req/s`);
      prevCap[k] = o.replicaRps;
    }
  }
}

// Heads that no tensor-parallel size divides, and a custom architecture with only the required fields.
const odd: ModelArch[] = [
  { numParams: 70e9, numLayers: 80, hiddenSize: 8000, numAttentionHeads: 25, numKeyValueHeads: 5 },
  { numParams: 70e9, numLayers: 80, hiddenSize: 7000, numAttentionHeads: 7, numKeyValueHeads: 7 },
  { numParams: 30e9, numLayers: 61, hiddenSize: 6100, numAttentionHeads: 61, numKeyValueHeads: 1 },
];
for (const a of odd) for (const g of SWEEP_CARDS.filter((x) => !x.unified)) for (const users of [1, 32]) {
  const input = { arch: a, weightDtype: "bf16" as Dtype, kvDtype: "fp16" as Dtype, contextLength: 8192, concurrency: users, batch: batchFor(g) };
  const usable = usableGiB(g);
  if (calculate(input).totalGiB <= usable) continue;
  P.tpNone.ok(!!layoutFor(input, usable), () => `heads ${a.numAttentionHeads}/${a.numKeyValueHeads} on ${g.name}, ${users} users: no layout`);
}
const bare: ModelArch = { numParams: 8e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8 };
for (const wd of ["bf16", "int4", "fp8"] as Dtype[]) for (const g of SWEEP_CARDS) for (const ctx of [1, 8192, 1048576]) for (const n of [1, 1024]) {
  const input = { arch: bare, weightDtype: wd, kvDtype: "fp16" as Dtype, contextLength: ctx, concurrency: n, batch: batchFor(g) };
  const us = usableGiB(g);
  const vals = [calculate(input).totalGiB, calculate(input).perGpuGiB, maxConcurrency(input, us), maxContextLength(input, us), layoutFor(input, us)?.gpus ?? 0];
  P.bare.ok(vals.every((v) => fin(v) && v >= 0), () => `${wd} ${g.id} ctx ${ctx} users ${n}: ${vals.join(", ")}`);
}

console.log(`${models.length} models, ${devs.length} cards and slices`);
finish(Object.values(P), t0);
