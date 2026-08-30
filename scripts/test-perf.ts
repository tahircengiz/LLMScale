// Unit test for the decode-speed estimate. Run: node scripts/test-perf.ts
import { estimateDecode, BANDWIDTH_EFFICIENCY } from "../src/lib/perf.ts";
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

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
