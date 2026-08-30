// Unit test for the fine-tuning memory model. Run: node scripts/test-train.ts
import { estimateTraining, loraParams, type TrainInput } from "../src/lib/train.ts";
import type { ModelArch } from "../src/lib/calc.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const llama8b: ModelArch = { numParams: 8.03e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, maxContext: 131072 };

const base = (over: Partial<TrainInput> = {}): TrainInput => ({
  arch: llama8b, mode: "full", batchSize: 1, seqLength: 2048,
  gradientCheckpointing: true, loraRank: 16, loraTarget: "attn", overheadGiB: 1, ...over,
});

console.log("--- full fine-tune matches the 16 bytes/param rule ---");
const full = estimateTraining(base());
const perParam = ((full.baseWeightsGiB + full.gradientsGiB + full.optimizerGiB) * 1024 ** 3) / 8.03e9;
check("weights + grads + optimizer is 16 bytes/param", Math.abs(perParam - 16) < 0.01, perParam.toFixed(2));
// The well-known consequence: an 8B you can serve on one 24 GB card needs >100 GB to train.
check("8B full fine-tune is 115-135 GiB", full.totalGiB > 115 && full.totalGiB < 135, full.totalGiB.toFixed(1));
check("optimizer is the biggest single term", full.optimizerGiB > full.baseWeightsGiB && full.optimizerGiB > full.activationsGiB);

console.log("\n--- LoRA and QLoRA land where they do in practice ---");
const lora = estimateTraining(base({ mode: "lora" }));
const qlora = estimateTraining(base({ mode: "qlora" }));
check("LoRA 8B fits a 24 GB card", lora.totalGiB < 22, lora.totalGiB.toFixed(1));
check("QLoRA 8B fits comfortably in 24 GB", qlora.totalGiB < 8, qlora.totalGiB.toFixed(1));
check("QLoRA base is ~4x lighter than LoRA base", lora.baseWeightsGiB / qlora.baseWeightsGiB > 3.4);
check("LoRA cuts optimizer state by orders of magnitude", full.optimizerGiB / lora.optimizerGiB > 100, (full.optimizerGiB / lora.optimizerGiB).toFixed(0));

console.log("\n--- adapters are a fraction of a percent ---");
const attnParams = loraParams(llama8b, 16, "attn");
const allParams = loraParams(llama8b, 16, "all");
check("r=16 on attention is 0.05-0.5% of the model", attnParams / 8.03e9 > 0.0005 && attnParams / 8.03e9 < 0.005, `${((attnParams / 8.03e9) * 100).toFixed(2)}%`);
check("targeting every linear adds more", allParams > attnParams * 2);
check("rank scales the adapter linearly", Math.abs(loraParams(llama8b, 32, "attn") / attnParams - 2) < 0.01);

console.log("\n--- activations behave ---");
const noCkpt = estimateTraining(base({ gradientCheckpointing: false }));
check("checkpointing cuts activations by ~17x", noCkpt.activationsGiB / full.activationsGiB > 16, (noCkpt.activationsGiB / full.activationsGiB).toFixed(1));
check("activations scale with batch", estimateTraining(base({ batchSize: 4 })).activationsGiB > full.activationsGiB * 3.9);
check("activations scale with sequence length", estimateTraining(base({ seqLength: 4096 })).activationsGiB > full.activationsGiB * 1.9);
// A frozen base does not make the backward pass cheaper — the common surprise.
check("LoRA does not reduce activation memory", Math.abs(lora.activationsGiB - full.activationsGiB) < 1e-9);

console.log("\n--- parts add up ---");
const sum = full.baseWeightsGiB + full.gradientsGiB + full.optimizerGiB + full.activationsGiB + full.overheadGiB;
check("breakdown sums to the total", Math.abs(sum - full.totalGiB) < 1e-9);
check("full fine-tune trains every parameter", full.trainableParams === 8.03e9);

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
