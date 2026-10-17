// Unit test for the decode-speed estimate. Run: node scripts/test-perf.ts
import { readFileSync } from "node:fs";
import { archFromConfig } from "../src/lib/hf.ts";
import { estimateDecode, BANDWIDTH_EFFICIENCY, COMPUTE_EFFICIENCY, CONSUMER_COMPUTE_EFFICIENCY, computeTflops, decodeCurve, decodeStep, prefillFlops, prefillTime, REQUEST_MS, stepFloorMs } from "../src/lib/perf.ts";
import type { ModelArch } from "../src/lib/calc.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const llama8b: ModelArch = { numParams: 8.03e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, maxContext: 131072 };
// Mixtral: every expert resident, only a few routed per token.
const mixtral: ModelArch = { numParams: 46.7e9, activeParams: 12.9e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, maxContext: 32768 };

const at = (over: Partial<Parameters<typeof estimateDecode>[0]> = {}) =>
  estimateDecode({ arch: llama8b, weightDtype: "bf16", kvDtype: "fp16", contextLength: 8192, concurrency: 1, bandwidthGBs: 1008, ...over })!;

console.log("--- order of magnitude against measured hardware ---");
const rtx4090 = at();
// 8B in BF16 on an RTX 4090 generates roughly 40-60 tok/s in practice.
check("8B BF16 on RTX 4090 is 35-70 tok/s", rtx4090.perUser > 35 && rtx4090.perUser < 70, rtx4090.perUser.toFixed(0));
const int4 = at({ weightDtype: "int4" });
// Quartering the weights roughly triples the rate once KV is in the read.
check("INT4 is 100-250 tok/s", int4.perUser > 100 && int4.perUser < 250, int4.perUser.toFixed(0));
check("INT4 is faster than BF16", int4.perUser > rtx4090.perUser * 2.5);
// An M3 Ultra holds far more but reads at 819 GB/s.
const m3 = at({ bandwidthGBs: 819 });
check("M3 Ultra is slower than a 4090 on the same model", m3.perUser < rtx4090.perUser, m3.perUser.toFixed(0));

console.log("\n--- the model behaves ---");
check("throughput scales with bandwidth", at({ bandwidthGBs: 2016 }).perUser > rtx4090.perUser * 1.9);
const batched = at({ concurrency: 8 });
check("more users → slower per user", batched.perUser < rtx4090.perUser, batched.perUser.toFixed(1));
check("more users → higher total throughput", batched.total > rtx4090.total, batched.total.toFixed(0));
const long = at({ contextLength: 131072 });
check("long context shifts the read to KV", long.kvShare > 0.5, long.kvShare.toFixed(2));
check("short context is weight-dominated", rtx4090.kvShare < 0.15, rtx4090.kvShare.toFixed(2));
check("FP8 KV reads less than FP16 KV", at({ kvDtype: "fp8", contextLength: 131072 }).perUser > long.perUser);

console.log("\n--- MoE reads active params, not total ---");
const moe = estimateDecode({ arch: mixtral, weightDtype: "bf16", kvDtype: "fp16", contextLength: 8192, concurrency: 1, bandwidthGBs: 1008 })!;
const asDense = estimateDecode({ arch: { ...mixtral, activeParams: undefined }, weightDtype: "bf16", kvDtype: "fp16", contextLength: 8192, concurrency: 1, bandwidthGBs: 1008 })!;
check("Mixtral runs at ~3x its dense-weight rate", moe.perUser > asDense.perUser * 2.5, `${moe.perUser.toFixed(0)} vs ${asDense.perUser.toFixed(0)}`);

console.log("\n--- guards ---");
check("no bandwidth → no estimate", estimateDecode({ arch: llama8b, weightDtype: "bf16", kvDtype: "fp16", contextLength: 8192, concurrency: 1, bandwidthGBs: 0 }) === null);
check("efficiency is applied, not peak", rtx4090.stepMs > (rtx4090.bytesPerStep / (1008 * 1e9)) * 1000);
check("efficiency is a documented fraction", BANDWIDTH_EFFICIENCY > 0.5 && BANDWIDTH_EFFICIENCY <= 1);

console.log("\n--- prefill (E2) ---");
// H100 SXM: 989 dense BF16 TFLOPS, 1,979 FP8, 3,350 GB/s (NVIDIA's datasheet, halved from the sparse figures).
const H100 = { tflops: { bf16: 989, fp8: 1979 }, bandwidthGBs: 3350 };
{
  const short = prefillFlops(llama8b, 128);
  check("a short prompt is two FLOPs per parameter per token", Math.abs(short / (2 * llama8b.numParams * 128) - 1) < 0.01);
  const long = prefillFlops(llama8b, 32768);
  check("a long prompt adds attention's P² term", long > 2 * llama8b.numParams * 32768 * 1.2, (long / (2 * llama8b.numParams * 32768)).toFixed(2));
  const windowed = { ...llama8b, slidingLayers: 16, slidingWindow: 4096 };
  check("sliding layers cap attention at the window", prefillFlops(windowed, 32768) < long);
  const p2k = prefillTime(llama8b, "bf16", 2048, H100);
  // 2 × 8.03B × 2048 + attention ≈ 3.4e13 FLOPs at 60% of 989 TFLOPS.
  check("Llama 3.1 8B, 2k prompt on an H100: ~60 ms, compute-bound", p2k.bound === "compute" && p2k.seconds > 0.045 && p2k.seconds < 0.075, `${(p2k.seconds * 1000).toFixed(0)} ms`);
  const tiny = prefillTime(llama8b, "bf16", 16, H100);
  check("a 16-token prompt is one read of the weights", tiny.bound === "memory", `${(tiny.seconds * 1000).toFixed(1)} ms`);
  check("FP8 weights run on FP8 tensor cores", computeTflops(H100.tflops, "fp8") === 1979 && computeTflops(H100.tflops, "int4") === 989);
  check("…and halve the compute-bound prefill", prefillTime(llama8b, "fp8", 8192, H100).seconds < prefillTime(llama8b, "bf16", 8192, H100).seconds * 0.6);
  // Each pass and each request also cost a fixed time, which more GPUs do not split.
  const pass = (g: number) => prefillTime(llama8b, "bf16", 8192, H100, g).seconds - (stepFloorMs(llama8b, g) + REQUEST_MS) / 1000;
  check("two GPUs halve the pass", Math.abs((pass(2) * 2) / pass(1) - 1) < 1e-9);
  check("…but not the fixed cost, which grows with the all-reduces", stepFloorMs(llama8b, 2) > stepFloorMs(llama8b, 1));
  check("efficiency is a documented fraction", COMPUTE_EFFICIENCY > 0.2 && COMPUTE_EFFICIENCY <= 1);
}

console.log("\n--- decode against compute (E3) ---");
{
  const base = { arch: llama8b, weightDtype: "bf16" as const, kvDtype: "fp16" as const, contextLength: 2048 };
  const one = decodeStep(base, 1, H100)!;
  check("one sequence is bandwidth-bound", one.bound === "memory");
  check("…and is the bandwidth estimate plus the step's fixed cost",
    Math.abs(one.stepMs - estimateDecode({ ...base, concurrency: 1, bandwidthGBs: 3350 })!.stepMs - stepFloorMs(llama8b)) < 1e-9);
  // At 2k tokens each, 512 sequences read 137 GB of KV a step: attention keeps
  // decode on bandwidth. With short sequences the matrix multiplies take over.
  const big = decodeStep(base, 512, H100)!;
  check("512 sequences at 2k stay bandwidth-bound on their KV reads", big.bound === "memory", `${big.stepMs.toFixed(1)} ms`);
  const short = decodeStep({ ...base, contextLength: 128 }, 512, H100)!;
  check("512 short sequences are compute-bound", short.bound === "compute", `${short.stepMs.toFixed(1)} ms`);
  const curve = decodeCurve({ ...base, contextLength: 128 }, 512, H100);
  check("the curve doubles from 1 to 512", curve.map((p) => p.batch).join(",") === "1,2,4,8,16,32,64,128,256,512");
  check("per-user speed only falls", curve.every((p, k) => k === 0 || p.perUser <= curve[k - 1].perUser));
  const last = curve[curve.length - 1], prev = curve[curve.length - 2];
  check("total throughput levels off once compute binds", last.total / prev.total < 1.3, `${prev.total.toFixed(0)} → ${last.total.toFixed(0)}`);
  check("without TFLOPS it stays the bandwidth estimate", decodeStep(base, 512, { bandwidthGBs: 3350 })!.bound === "memory");
  check("an odd batch size ends the curve", decodeCurve(base, 48, H100).map((p) => p.batch).join(",") === "1,2,4,8,16,32,48");
}

console.log("\n--- against vLLM on an RTX 4070 Ti ---");
{
  // scripts/fixtures/vllm/calib-rtx4070ti.json: vLLM 0.31.0, timed generate() calls.
  const cal = JSON.parse(readFileSync(new URL("./fixtures/vllm/calib-rtx4070ti.json", import.meta.url), "utf8"));
  const repo = (n: string) => JSON.parse(readFileSync(new URL(`./fixtures/repos/${n}.json`, import.meta.url), "utf8"));
  const dev = { ...cal.device, computeEfficiency: CONSUMER_COMPUTE_EFFICIENCY };
  const q4 = archFromConfig(repo("Qwen_Qwen3-4B").config, repo("Qwen_Qwen3-4B").numParams)!;
  const r4 = cal.runs.find((r: { model: string }) => r.model === "Qwen/Qwen3-4B");
  for (const p of [512, 1024, 2048, 3968]) {
    const ours = prefillTime(q4, "bf16", p, dev).seconds;
    const theirs = r4.prefill[p];
    check(`Qwen3-4B, ${p}-token prompt: within 12% of vLLM`, Math.abs(ours / theirs - 1) <= 0.12, `${(ours * 1000).toFixed(0)} vs ${(theirs * 1000).toFixed(0)} ms`);
  }
  const rate = prefillFlops(q4, 2048) / r4.prefill[2048] / 1e12;
  // Without the embedding lookup and with the output head for the last token only.
  check("…which runs at 85–100% of the card's rated BF16 peak", rate / cal.device.tflops.bf16 > 0.85 && rate / cal.device.tflops.bf16 <= 1.05, `${rate.toFixed(1)} of ${cal.device.tflops.bf16} TFLOPS`);
  for (const b of [1, 2, 4, 8, 16, 32]) {
    // Each sequence holds 128 to 256 tokens over the 128 steps: 192 on average.
    const ours = decodeStep({ arch: q4, weightDtype: "bf16", kvDtype: "fp16", contextLength: 192 }, b, dev)!.stepMs;
    const theirs = r4.decode[b].stepMs;
    check(`Qwen3-4B decode, ${b} sequences: within 8% of vLLM`, Math.abs(ours / theirs - 1) <= 0.08, `${ours.toFixed(1)} vs ${theirs.toFixed(1)} ms`);
  }
  // A 0.6B model's step is short enough for its fixed cost to be half of it
  // (perf.ts, LAYER_MS). The Hub's count, 751.6M, includes a stored copy of the tied
  // output head that vLLM does not load; the model it runs has 596.0M.
  const q06 = archFromConfig(repo("Qwen_Qwen3-0.6B").config, 596049920)!;
  const r06 = cal.runs.find((r: { model: string }) => r.model === "Qwen/Qwen3-0.6B");
  for (const b of [1, 16, 128, 256]) {
    const ours = decodeStep({ arch: q06, weightDtype: "bf16", kvDtype: "fp16", contextLength: 192 }, b, dev)!.stepMs;
    const theirs = r06.decode[b].stepMs;
    check(`Qwen3-0.6B decode, ${b} sequences: within 20%`, Math.abs(ours / theirs - 1) <= 0.2, `${ours.toFixed(1)} vs ${theirs.toFixed(1)} ms`);
  }
}

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
