// Audit phase 3b (2026-10-16): the speed and overhead model against measurements.
// Run: node scripts/test-audit3.ts
//
// Measured here: vLLM 0.31.0 through `vllm serve` on X570's RTX 4070 Ti, prompts as
// token ids, prefix caching off (scripts/fixtures/vllm/calib-rtx4070ti-2026-10-16.json;
// method and raw figures in docs/audit-2026-10-15/olcum-kampanyasi-2026-10-16.md).
// Published: docs/audit-2026-10-15/hiz-kaynaklari.md (speeds) and vllm-loglari.md
// (startup logs). Every check states its tolerance; where the model is still only an
// upper bound (K13), the check pins how far the measurement may fall below it.

import { readFileSync } from "node:fs";
import { archFromConfig, visionEncoder } from "../src/lib/hf.ts";
import { BYTES_PER_GIB, mxfp4Pad, weightsBytes, weightsOnGpu, type Dtype, type ModelArch } from "../src/lib/calc.ts";
import { decodeStep, prefillTime, REQUEST_MS, stepFloorMs } from "../src/lib/perf.ts";
import { mxfp4Kernel, overheadPerGpu, vllmBatch } from "../src/lib/overhead.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import { computeEfficiency, GPUS } from "../src/lib/gpus.ts";
import { overheadFromLog, parseVllmLog } from "../src/lib/vllmLog.ts";
import { decodeState, encodeState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const GiB = BYTES_PER_GIB;
const known = (id: string) => KNOWN_MODELS.find((m) => m.id === id)!;
const gpu = (id: string) => GPUS.find((g) => g.id === id)!;
const within = (ours: number, theirs: number, tol: number) => Math.abs(ours / theirs - 1) <= tol;
const pct = (ours: number, theirs: number) => `${ours.toFixed(2)} vs ${theirs.toFixed(2)} (${((ours / theirs - 1) * 100).toFixed(0)}%)`;

const cal = JSON.parse(readFileSync(new URL("./fixtures/vllm/calib-rtx4070ti-2026-10-16.json", import.meta.url), "utf8"));
const dev = cal.device as { bandwidthGBs: number; tflops: { bf16: number; fp8: number }; computeEfficiency: number };
type Run = {
  tag: string; id: string; weightDtype: Dtype; kind: "dense" | "moe" | "vl"; params: number; shippedBytes?: number; config: any; startup?: any;
  api?: { ttftMs: Record<string, number>; itlMs: Record<string, number> };
};
const runs = cal.models as Run[];
const archOf = (r: Run): ModelArch => {
  const a = archFromConfig(r.config, r.params)!;
  return r.shippedBytes ? { ...a, shipped: { dtype: r.weightDtype, bytes: r.shippedBytes } } : a;
};
// Sequences of 128 tokens that generate 129: 192 held on average over the steps measured.
const CTX = 192;

console.log("--- E5: gpt-oss as vLLM loads it ---");
{
  const o120 = known("gpt-oss-120b"), o20 = known("gpt-oss-20b");
  check("gpt-oss-120b's files: 60.77 GiB, attention and embeddings in BF16", Math.abs(weightsBytes(o120, "int4") / GiB - 60.77) < 0.01);
  check("…where every weight at 4.25 bits made 59.39", Math.abs(weightsBytes({ ...o120, mxfp4: undefined, shipped: undefined }, "int4") / GiB - 59.39) < 0.01);
  check("MXFP4 kernel per card: TRT-LLM, Triton, Marlin, ROCm",
    mxfp4Kernel("B200 180GB") === "trtllm" && mxfp4Kernel("H100 SXM 80GB") === "triton" && mxfp4Kernel("GH200 96GB") === "triton" &&
    mxfp4Kernel("RTX 5090") === "marlin" && mxfp4Kernel("NVIDIA L40S") === "marlin" && mxfp4Kernel("AMD MI300X") === "rocm" && mxfp4Kernel("Apple M4 Max (128GB)") === undefined);
  // vLLM's "Model loading took" per rank (vllm-loglari.md rows 6, 13, 19); within 2%.
  const logs: [string, ModelArch, string, number, number][] = [
    ["#6 gpt-oss-120b, H100 TP2 (v0.23)", o120, "H100 SXM 80GB", 2, 31.36],
    ["#13 gpt-oss-120b, A100 TP2, Marlin (v0.11)", o120, "A100 80GB", 2, 34.38],
    ["#19 gpt-oss-20b, L40S, Marlin (v0.11)", o20, "NVIDIA L40S", 1, 13.72],
  ];
  for (const [name, a, card, tp, log] of logs) {
    const ours = weightsOnGpu(a, "int4", tp, vllmBatch(80, card)) / GiB;
    check(`${name}: within 2% of the log`, within(ours, log, 0.02), pct(ours, log) + " GiB");
  }
  // Row 9 (GH200, v0.16, 64.38 GiB) predates the Triton path's padding rule in 0.31.
  const gh = weightsOnGpu(o120, "int4", 1, vllmBatch(96, "GH200 96GB")) / GiB;
  check("GH200 at TP1: 0.31's Triton kernel pads nothing at 2880", Math.abs(gh - 60.77) < 0.01, gh.toFixed(2));
  const b200 = weightsOnGpu(o120, "int4", 1, vllmBatch(180, "B200 180GB")) / GiB;
  check("B200 pads hidden to 3072 and experts to 2944: +9% on the experts", b200 > 65.5 && b200 < 66.5, b200.toFixed(2));
  // Expert parallelism holds whole experts, padded as at TP1; tensor parallelism pads
  // each GPU's slice of the expert width, here 1440 to 1536 on B200.
  check("B200: whole experts pad by 3072/2880 × 2944/2880", Math.abs(mxfp4Pad(o120, "trtllm", 1) - (3072 / 2880) * (2944 / 2880)) < 1e-12);
  check("…a TP2 slice by 3072/2880 × 1536/1440", Math.abs(mxfp4Pad(o120, "trtllm", 2) - (3072 / 2880) * (1536 / 1440)) < 1e-12);
  check("…and nothing pads a model without MXFP4", mxfp4Pad(known("llama-3.1-8b"), "trtllm", 2) === 1);
  const url = decodeState(encodeState({ hfId: "", arch: o120, weightDtype: "int4", kvDtype: "bf16", contextLength: 8192, concurrency: 1 } as any));
  check("the MXFP4 flag survives the URL", url.arch?.mxfp4 === true);
}

console.log("\n--- D1: decode on the RTX 4070 Ti, through vllm serve ---");
{
  let worst = 0;
  for (const r of runs.filter((x) => x.api && x.kind !== "vl")) {
    const a = archOf(r);
    for (const [b, ms] of Object.entries(r.api!.itlMs)) {
      const ours = decodeStep({ arch: a, weightDtype: r.weightDtype, kvDtype: "bf16", contextLength: CTX }, +b, dev)!.stepMs;
      const ratio = ours / ms;
      // A MoE's tokens share experts more than uniform routing assumes, so from 4 to
      // 16 sequences the model reads more than vLLM does: allowed 20% slow there.
      const mid = r.kind === "moe" && +b >= 4 && +b <= 16;
      const ok = mid ? ratio >= 0.9 && ratio <= 1.25 : Math.abs(ratio - 1) <= 0.1;
      if (!mid) worst = Math.max(worst, Math.abs(ratio - 1));
      check(`${r.tag}, ${b} seq: ${mid ? "−10%…+25%" : "within 10%"}`, ok, `${ours.toFixed(2)} vs ${ms.toFixed(2)} ms`);
    }
  }
  console.log(`      worst outside the MoE mid-batch range: ${(worst * 100).toFixed(1)}%`);
  // The finding: a pure bandwidth ceiling was up to twice too fast for small and MoE models.
  const g = runs.find((x) => x.tag === "granite-1b-a400m")!;
  const ceiling = decodeStep({ arch: archOf(g), weightDtype: "bf16", kvDtype: "bf16", contextLength: CTX }, 1, dev)!.stepMs - stepFloorMs(archOf(g));
  check("granite-1b-a400m: the reads alone are barely half the measured step", ceiling < g.api!.itlMs["1"] * 0.55, `${ceiling.toFixed(2)} of ${g.api!.itlMs["1"].toFixed(2)} ms`);
}

console.log("\n--- D4: time to first token on the RTX 4070 Ti ---");
{
  for (const r of runs.filter((x) => x.api && x.kind !== "vl")) {
    const a = archOf(r);
    for (const [p, ms] of Object.entries(r.api!.ttftMs)) {
      const ours = prefillTime(a, r.weightDtype, +p, dev).seconds * 1000;
      if (r.kind === "moe") {
        // K13: a MoE's prompt reading stays an upper bound — its expert matmuls run
        // below the dense rate; measured up to 1.7x slower than the model.
        check(`${r.tag}, ${p} tokens: upper bound, measured within 1.8x`, ours <= ms * 1.15 && ms <= ours * 1.8, `${ours.toFixed(1)} vs ${ms.toFixed(1)} ms`);
      } else {
        check(`${r.tag}, ${p} tokens: within 30%`, Math.abs(ours / ms - 1) <= 0.3, `${ours.toFixed(1)} vs ${ms.toFixed(1)} ms`);
      }
    }
  }
  const q = runs.find((x) => x.tag === "qwen3-0.6b")!;
  const t512 = prefillTime(archOf(q), "bf16", 512, dev).seconds * 1000;
  check("Qwen3-0.6B, 512 tokens: no longer 11 ms against vLLM's ~16", t512 > 12 && within(t512, q.api!.ttftMs["512"], 0.2), `${t512.toFixed(1)} vs ${q.api!.ttftMs["512"].toFixed(1)} ms`);
  check("a request's fixed cost is in every first token", prefillTime(archOf(q), "bf16", 1, dev).seconds * 1000 > REQUEST_MS);
}

console.log("\n--- D1/D4 against published single-GPU figures (NVIDIA NIM, TRT-LLM) ---");
{
  const l8 = known("llama-3.1-8b");
  const step = (id: string, wd: Dtype, ctx: number, b = 1, g = 1) => {
    const x = gpu(id);
    return decodeStep({ arch: l8, weightDtype: wd, kvDtype: "bf16", contextLength: ctx }, b, { tflops: x.tflops, bandwidthGBs: x.bandwidthGBs!, computeEfficiency: 0.6 }, g)!.stepMs;
  };
  const pts: [string, number, number][] = [
    ["N1 8B FP8, H100", step("h100-80", "fp8", 1500), 4.53],
    ["N2 8B BF16, H100", step("h100-80", "bf16", 1500), 6.52],
    ["N3 8B FP8, L40S", step("l40s-48", "fp8", 1500), 13.97],
    ["N3 8B BF16, L40S", step("l40s-48", "bf16", 1500), 22.05],
    ["N4 8B FP8, H200", step("h200-141", "fp8", 1500), 4.24],
  ];
  for (const [n, ours, theirs] of pts) check(`${n}, batch 1: within 15%`, within(ours, theirs, 0.15), `${ours.toFixed(2)} vs ${theirs} ms`);
  const h100 = gpu("h100-80");
  const ttft = (wd: Dtype, p: number) => prefillTime(l8, wd, p, { tflops: h100.tflops!, bandwidthGBs: h100.bandwidthGBs!, computeEfficiency: 0.6 }).seconds * 1000;
  check("N2b 8B BF16, H100, 200-token prompt: within 15%", within(ttft("bf16", 200), 11.96, 0.15), `${ttft("bf16", 200).toFixed(1)} vs 11.96 ms`);
  check("N1 8B FP8, H100, 1k prompt: within 15%", within(ttft("fp8", 1000), 19.03, 0.15), `${ttft("fp8", 1000).toFixed(1)} vs 19.03 ms`);
}

console.log("\n--- D2: several GPUs, two all-reduces per layer ---");
{
  const l70 = known("llama-3.3-70b"), l405 = known("llama-3.1-405b");
  const step = (a: ModelArch, id: string, g: number, ctx: number) => {
    const x = gpu(id);
    return decodeStep({ arch: a, weightDtype: "fp8", kvDtype: "bf16", contextLength: ctx }, 1, { tflops: x.tflops, bandwidthGBs: x.bandwidthGBs!, computeEfficiency: 0.6 }, g)!.stepMs;
  };
  const pts: [string, number, number][] = [
    ["N7 70B FP8, 2x H100 (NIM)", step(l70, "h100-80", 2, 1500), 18.67],
    ["N8 70B FP8, 4x H100 (NIM)", step(l70, "h100-80", 4, 1500), 14.24],
    ["A1 70B FP8, 8x MI300X (vLLM)", step(l70, "mi300x-192", 8, 1100), 9.3],
    ["A2 70B FP8, 8x H100 (TRT-LLM)", step(l70, "h100-80", 8, 1100), 10.2],
    ["A3 405B FP8, 8x MI300X (vLLM)", step(l405, "mi300x-192", 8, 1100), 25.3],
    ["A3 405B FP8, 8x H100 (TRT-LLM)", step(l405, "h100-80", 8, 1100), 28.8],
  ];
  for (const [n, ours, theirs] of pts) check(`${n}: within 15%`, within(ours, theirs, 0.15), `${ours.toFixed(2)} vs ${theirs} ms`);
  // The audit's case: 8 GPUs were taken as eight times the bandwidth, 3x too fast.
  check("8x H100 on 70B is no longer three times the measured speed", step(l70, "h100-80", 8, 1100) > 10.2 * 0.85);
}

console.log("\n--- D1: MoE models elsewhere (other engines; a check, not a fit) ---");
{
  const one = (a: ModelArch, id: string, ctx: number) => {
    const x = gpu(id);
    return decodeStep({ arch: a, weightDtype: "int4", kvDtype: "bf16", contextLength: ctx }, 1, { tflops: x.tflops, bandwidthGBs: x.bandwidthGBs! })!.perUser;
  };
  const o20 = known("gpt-oss-20b"), o120 = known("gpt-oss-120b");
  // llama.cpp's tg128 (G1, G3): 649 and 514 tok/s were shown, 282 and 196 measured.
  check("gpt-oss-20b, RTX 5090: within 15% of llama.cpp's 282 tok/s", within(one(o20, "rtx5090-32", 64), 282.51, 0.15), one(o20, "rtx5090-32", 64).toFixed(0));
  check("gpt-oss-120b, RTX PRO 6000: within 15% of 196 tok/s", within(one(o120, "rtxpro6000-96", 64), 196.31, 0.15), one(o120, "rtxpro6000-96", 64).toFixed(0));
}

console.log("\n--- C4: the vision encoder's profiling peak ---");
{
  const vl = runs.find((x) => x.kind === "vl" && x.id === "Qwen/Qwen2.5-VL-3B-Instruct")!;
  const a = archOf(vl);
  check("Qwen2.5-VL reads as one 16,384-token item of 65,536 patches", a.vision?.tokens === 16384 && a.vision.patches === 65536 && a.vision.hidden === 1280);
  // What vLLM's encoder profiling costs: the KV cache it leaves against the same
  // model with --skip-mm-profiling, at the 12 GB card's 2,048 tokens.
  for (const v of cal.vision as { tag: string; id: string; deltaGiB: number; items: string }[]) {
    const ar = archOf(runs.find((x) => x.id === v.id)!);
    const batch = { tokens: 2048, seqs: 256 };
    const delta = overheadPerGpu(ar, batch).totalGiB - overheadPerGpu({ ...ar, vision: undefined }, batch).totalGiB;
    check(`${v.tag} (${v.items}): the encoder's share within 0.25 GiB of vLLM's`, Math.abs(delta - v.deltaGiB) <= 0.25, `${delta.toFixed(2)} vs ${v.deltaGiB} GiB`);
  }
  const g3 = archOf(runs.find((x) => x.id === "unsloth/gemma-3-4b-it")!);
  check("Gemma 3's SigLIP: 4,096 patches pooled to 256 tokens", g3.vision?.patches === 4096 && g3.vision.tokens === 256);
  // The budget holds as many images as max_num_batched_tokens has room for: eight
  // on a 12 GB card, 64 at a B200's 16,384 tokens; Qwen-VL's one video fills any budget.
  const share = (a: ModelArch, t: number) => overheadPerGpu(a, { tokens: t, seqs: 256 }).activationGiB - overheadPerGpu({ ...a, vision: undefined }, { tokens: t, seqs: 256 }).activationGiB;
  check("Gemma 3's share grows with the budget", Math.abs(share(g3, 16384) / share(g3, 2048) - 8) < 1e-9);
  check("Qwen-VL's does not", Math.abs(share(a, 16384) - share(a, 2048)) < 1e-9);
  check("a text-only config has no encoder", visionEncoder({ hidden_size: 4096 }) === undefined);
  const url = decodeState(encodeState({ hfId: "", arch: a, weightDtype: "bf16", kvDtype: "bf16", contextLength: 8192, concurrency: 1 } as any));
  check("the encoder survives the URL", JSON.stringify(url.arch?.vision) === JSON.stringify(a.vision));
}

console.log("\n--- Strix Halo (GTR9): vLLM ROCm, eager, measured 2026-10-17 ---");
{
  const sx = JSON.parse(readFileSync(new URL("./fixtures/vllm/calib-strixhalo-2026-10-17.json", import.meta.url), "utf8"));
  const strix = gpu("amd-strixhalo-128");
  const d = { tflops: strix.tflops!, bandwidthGBs: strix.bandwidthGBs!, computeEfficiency: computeEfficiency(strix), layerMs: strix.layerMs };
  check("the device carries its measured constants", strix.layerMs === 0.36 && computeEfficiency(strix) === 0.34);
  for (const r of sx.models as Run[]) {
    const a = archOf(r);
    const one = decodeStep({ arch: a, weightDtype: r.weightDtype, kvDtype: "bf16", contextLength: CTX }, 1, d)!.stepMs;
    check(`${r.tag}, one sequence: within 15%`, within(one, r.api!.itlMs["1"], 0.15), `${one.toFixed(1)} vs ${r.api!.itlMs["1"].toFixed(1)} ms`);
    // Past four sequences ROCm leaves its skinny GEMV kernels for general GEMMs and
    // the step jumps: still an upper bound (K13), measured within 2.5x.
    for (const b of ["8", "32"]) {
      const ours = decodeStep({ arch: a, weightDtype: r.weightDtype, kvDtype: "bf16", contextLength: CTX }, +b, d)!.stepMs;
      const ms = r.api!.itlMs[b];
      check(`${r.tag}, ${b} sequences: upper bound, measured within 2.5x`, ours <= ms * 1.1 && ms <= ours * 2.5, `${ours.toFixed(1)} vs ${ms.toFixed(1)} ms`);
    }
    const long = prefillTime(a, r.weightDtype, 4096, d).seconds * 1000;
    if (r.kind === "dense") check(`${r.tag}, 4,096-token prompt: within 15%`, within(long, r.api!.ttftMs["4096"], 0.15), `${long.toFixed(0)} vs ${r.api!.ttftMs["4096"].toFixed(0)} ms`);
    for (const p of ["64", "256"]) {
      const ours = prefillTime(a, r.weightDtype, +p, d).seconds * 1000;
      const ms = r.api!.ttftMs[p];
      // Short prompts run slower still on ROCm (and a MoE's more so): an upper bound.
      check(`${r.tag}, ${p}-token prompt: upper bound, measured within 3.2x`, ours <= ms * 1.15 && ms <= ours * 3.2, `${ours.toFixed(0)} vs ${ms.toFixed(0)} ms`);
    }
  }
  // The audit's case: 108 tok/s shown where vLLM-ROCm ran 31.8 (now 32.7 here).
  const awq = (sx.models as Run[]).find((x) => x.kind === "moe")!;
  const perUser = decodeStep({ arch: archOf(awq), weightDtype: "int4", kvDtype: "bf16", contextLength: 512 }, 1, d)!.perUser;
  check("Qwen3-30B-A3B AWQ: no longer three times vLLM-ROCm's speed", perUser < 40, `${perUser.toFixed(1)} tok/s`);
  const overhead = overheadPerGpu(archOf(awq), vllmBatch(96, strix.name)).totalGiB;
  const st = awq.startup;
  const spent = st.requestedGiB - st.weightsGiB - st.kvGiB;
  check("Qwen3-30B-A3B AWQ startup: overhead within 0.5 GiB (no graphs in eager mode)", Math.abs(overhead - spent) <= 0.5, `${overhead.toFixed(2)} vs ${spent.toFixed(2)} GiB`);
}

console.log("\n--- overhead.ts against the 2026-10-16 startups (scripts/fixtures/vllm/1016-*.txt) ---");
{
  // What vLLM spent outside the weights and the KV cache, against overheadPerGpu at
  // the run's batch. Single GPU; MoE and multimodal models new since the 10-13 set.
  const logs: [string, string, number, ModelArch?][] = [
    ["1016-qwen3-1.7b", "qwen3-1.7b", 0.15],
    ["1016-granite-1b-a400m", "granite-1b-a400m", 0.15],
    ["1016-granite-3b-a800m", "granite-3b-a800m", 0.15],
    // Marlin's MoE path holds ~0.2 GiB more than the forward-pass term at 2,048 tokens.
    ["1016-qwen1.5-moe-gptq", "qwen1.5-moe-gptq", 0.25],
    ["1016-qwen2.5-vl-3b", "qwen2.5-vl-3b", 0.3],
  ];
  for (const [file, tag, tol] of logs) {
    const p = parseVllmLog(readFileSync(new URL(`./fixtures/vllm/${file}.txt`, import.meta.url), "utf8"));
    const r = runs.find((x) => x.tag === tag)!;
    const ours = overheadPerGpu(archOf(r), { tokens: p.maxNumBatchedTokens ?? 2048, seqs: 256 }).totalGiB;
    const theirs = overheadFromLog(p)!;
    check(`${file}: within ${tol} GiB`, Math.abs(ours - theirs) <= tol, `${ours.toFixed(2)} vs ${theirs.toFixed(2)} GiB`);
  }
  // Known and left: Gemma 3 4B's language model costs vLLM ~1.1 GiB less than its
  // 262k-entry output layer suggests here (an over-estimate, the safe side).
  const g = parseVllmLog(readFileSync(new URL("./fixtures/vllm/1016-gemma-3-4b-skip.txt", import.meta.url), "utf8"));
  const og = overheadPerGpu({ ...archOf(runs.find((x) => x.tag === "gemma-3-4b")!), vision: undefined }, { tokens: 2048, seqs: 256 }).totalGiB;
  check("Gemma 3 4B without the encoder: an over-estimate, not over 1.3 GiB", og >= overheadFromLog(g)! && og - overheadFromLog(g)! <= 1.3, `${og.toFixed(2)} vs ${overheadFromLog(g)!.toFixed(2)} GiB`);
}

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
