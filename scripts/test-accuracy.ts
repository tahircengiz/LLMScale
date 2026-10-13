// The sizing engine against real checkpoints, for the errors the 2026-10-12 audit
// measured. Run: node scripts/test-accuracy.ts
//
// Each check holds the engine to something a repository or an engine's source
// states, not to a number this engine produced: the bytes of a quantized
// checkpoint's weight files, the layer layout in a config, the state shapes vLLM
// allocates (vllm/model_executor/layers/mamba/mamba_utils.py), and the head
// divisibility vLLM enforces (vllm/config/model.py).

import { readFileSync } from "node:fs";
import { archFromConfig, weightFileBytes } from "../src/lib/hf.ts";
import { BYTES_PER_GIB, calculate, kvBytesPerLayerToken, kvBytesPerSeq, maxContextLength, weightsBytes, type ModelArch } from "../src/lib/calc.ts";
import { estimateDecode, paramsReadPerStep } from "../src/lib/perf.ts";
import { largestTpAtMost, nearestTp, tpValid } from "../src/lib/parallel.ts";
import { decodeState, encodeState, DEFAULT_STATE } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const cfg = (n: string) => JSON.parse(readFileSync(new URL(`./fixtures/configs/${n}.json`, import.meta.url), "utf8"));
const repo = (n: string) => JSON.parse(readFileSync(new URL(`./fixtures/repos/${n}.json`, import.meta.url), "utf8"));
const GiB = (b: number) => b / BYTES_PER_GIB;
const within = (a: number, b: number, tol: number) => Math.abs(a - b) / b <= tol;
const fmt = (b: number) => `${GiB(b).toFixed(2)} GiB`;

console.log("--- Y1: quantized weights ---");
{
  // Quantizing a 16-bit model: the transformer layers at the format's bits, the
  // embedding and the output head kept in 16-bit, as these checkpoints keep them.
  const fp8Repo = repo("RedHatAI_Qwen3-8B-FP8-dynamic");
  const q3 = archFromConfig({ ...fp8Repo.config, quantization_config: undefined }, 8_190_735_360)!;
  const fp8Files = weightFileBytes(fp8Repo.files)!;
  // The quantization guide says these match to the hundredth of a GiB and within 2%.
  check("Qwen3-8B at FP8 = RedHatAI's FP8-dynamic files to 0.01 GiB", Math.abs(GiB(weightsBytes(q3, "fp8")) - GiB(fp8Files)) < 0.01, `${fmt(weightsBytes(q3, "fp8"))} vs ${fmt(fp8Files)}`);

  const awqRepo = repo("Qwen_Qwen2.5-7B-Instruct-AWQ");
  const q25 = archFromConfig(cfg("Qwen_Qwen2.5-7B-Instruct"), 7_615_616_512)!;
  const awqFiles = weightFileBytes(awqRepo.files)!;
  check("Qwen2.5-7B at INT4 within 2% of Qwen's AWQ files", within(weightsBytes(q25, "int4"), awqFiles, 0.02), `${fmt(weightsBytes(q25, "int4"))} vs ${fmt(awqFiles)}`);
  check("…where 0.5 bytes a parameter was 32% short", GiB(q25.numParams * 0.5) < GiB(awqFiles) * 0.7);

  const nv = repo("nvidia_Llama-3.3-70B-Instruct-FP4");
  const nvFiles = weightFileBytes(nv.files)!;
  const l70 = archFromConfig(nv.config, 70_553_706_496)!;
  // NVFP4 is 4.5 bits with its scales; the generic 4-bit figure assumes 4.25.
  check("Llama 3.3 70B at INT4 within 6% of the NVFP4 files", within(weightsBytes(l70, "int4"), nvFiles, 0.06), `${fmt(weightsBytes(l70, "int4"))} vs ${fmt(nvFiles)}`);
  check("the Hub counts NVFP4's packed bytes as parameters", nv.numParams < 45e9, `${(nv.numParams / 1e9).toFixed(1)}B`);

  // A checkpoint that ships quantized is sized by its own files.
  const shipped: ModelArch = { ...l70, shipped: { dtype: "int4", bytes: nvFiles } };
  check("shipped bytes win at the shipped precision", weightsBytes(shipped, "int4") === nvFiles);
  check("…and only there", weightsBytes(shipped, "bf16") === l70.numParams * 2);
  check("39.8 GiB of NVFP4 70B no longer fits one 32 GB card at 8k",
    calculate({ arch: shipped, weightDtype: "int4", kvDtype: "fp16", contextLength: 8192, concurrency: 1 }).totalGiB > 32 * 0.92);

  // Which files hold the weights.
  const oss = repo("openai_gpt-oss-20b");
  check("gpt-oss: original/ is another copy, not counted", weightFileBytes(oss.files) === oss.files.filter((f: { name: string }) => /^model-.*\.safetensors$/.test(f.name)).reduce((a: number, f: { size: number }) => a + f.size, 0));
  const mis = repo("mistralai_Mistral-Small-3.2-24B-Instruct-2506");
  const misBytes = weightFileBytes(mis.files)!;
  check("Mistral ships both layouts; one is counted", misBytes < mis.files.filter((f: { name: string }) => f.name.endsWith(".safetensors")).reduce((a: number, f: { size: number }) => a + f.size, 0) * 0.6, fmt(misBytes));
  check("an adapter's weights are not the model's", weightFileBytes(repo("lucylq_qwen3_06B_lora_math").files) === undefined);
}

console.log("\n--- Y3: sliding windows ---");
{
  const g3 = archFromConfig(cfg("unsloth_gemma-3-27b-it"), 27.4e9)!;
  // Transformers' Gemma 3: a layer is global when (index + 1) % 6 == 0.
  check("Gemma 3 27B: 52 of 62 layers slide over 1,024 tokens", g3.slidingLayers === 52 && g3.slidingWindow === 1024, `${g3.slidingLayers}/${g3.numLayers} @ ${g3.slidingWindow}`);
  const per = kvBytesPerLayerToken(g3, "bf16");
  const at32k = kvBytesPerSeq(g3, "bf16", 32768);
  check("its 32k cache counts 10 full layers and 52 windows", at32k === per * (10 * 32768 + 52 * 1024));
  check("…5.3x less than every layer at full context", within((per * 62 * 32768) / at32k, 5.33, 0.01), ((per * 62 * 32768) / at32k).toFixed(2));
  check("below the window every layer counts", kvBytesPerSeq(g3, "bf16", 512) === per * 62 * 512);
  const oss = archFromConfig(repo("openai_gpt-oss-20b").config, 20.9e9)!;
  check("gpt-oss-20b: 12 of 24 layers slide over 128 tokens", oss.slidingLayers === 12 && oss.slidingWindow === 128);
  const q3 = archFromConfig(cfg("Qwen_Qwen3-32B"), 32.8e9)!;
  check("a model with no window is untouched", q3.slidingLayers === undefined && q3.attnLayers === undefined);
}

console.log("\n--- Y4: hybrid layers ---");
{
  const next = archFromConfig(repo("Qwen_Qwen3-Next-80B-A3B-Instruct").config, 81.3e9)!;
  check("Qwen3-Next: 12 of 48 layers keep a KV cache", next.attnLayers === 12, String(next.attnLayers));
  // Gated DeltaNet per layer: conv (128·16·2 + 128·32)·3 + state 32·128·128, BF16.
  check("…36 linear layers hold 39.5 MB of state a sequence", next.stateBytesPerSeq === 36 * ((128 * 16 * 2 + 128 * 32) * 3 + 32 * 128 * 128) * 2, String(next.stateBytesPerSeq));
  const gr = archFromConfig(cfg("ibm-granite_granite-4.0-h-small"), 32e9)!;
  // Mamba2 per layer: conv (128·64 + 2·1·128)·3 + state 128·64·128, BF16.
  check("Granite 4.0-H small: 4 attention layers, 36 Mamba states", gr.attnLayers === 4 && gr.stateBytesPerSeq === 36 * ((128 * 64 + 2 * 128) * 3 + 128 * 64 * 128) * 2, `${gr.attnLayers} · ${gr.stateBytesPerSeq}`);
  const nh = cfg("nvidia_NVIDIA-Nemotron-Nano-9B-v2");
  const nem = archFromConfig(nh, 8.9e9)!;
  const p: string[] = [...nh.hybrid_override_pattern];
  check("Nemotron-H: attention from *, state from M, MLP layers neither", nem.attnLayers === p.filter((c) => c === "*").length && nem.stateBytesPerSeq === p.filter((c) => c === "M").length * ((128 * 80 + 2 * 8 * 128) * 3 + 128 * 80 * 128) * 2);
  // The state is per sequence, whatever the context.
  check("state does not grow with context", kvBytesPerSeq(next, "bf16", 65536) - kvBytesPerSeq(next, "bf16", 32768) === kvBytesPerLayerToken(next, "bf16") * 12 * 32768);
}

console.log("\n--- maximum context with windows and states ---");
for (const [name, arch] of [
  ["Gemma 3 27B", archFromConfig(cfg("unsloth_gemma-3-27b-it"), 27.4e9)!],
  ["Qwen3-Next", archFromConfig(repo("Qwen_Qwen3-Next-80B-A3B-Instruct").config, 81.3e9)!],
  ["Llama 3.1 8B", archFromConfig(cfg("unsloth_Llama-3.1-8B-Instruct"), 8.03e9)!],
] as const) {
  const input = { arch, weightDtype: "fp8" as const, kvDtype: "fp16" as const, concurrency: 4 };
  const budget = 141 * 0.95;
  const ctx = maxContextLength(input, budget);
  const at = (c: number) => calculate({ ...input, contextLength: c }).totalGiB;
  check(`${name}: the longest context fits and one more token does not`, ctx > 0 && at(ctx) <= budget && at(ctx + 1) > budget, `${ctx} tokens`);
}

console.log("\n--- Y2: MoE reads per decode step ---");
{
  const moe = archFromConfig(cfg("Qwen_Qwen3-30B-A3B"), 30_532_122_624)!;
  moe.activeParams = 3.3e9; // model card
  check("Qwen3-30B-A3B: 128 experts, 8 per token", moe.numExperts === 128 && moe.expertsPerToken === 8);
  check("one sequence reads the active parameters", paramsReadPerStep(moe, 1) === 3.3e9);
  const r32 = paramsReadPerStep(moe, 32);
  check("32 sequences touch ~87% of the experts", within(r32, 26.7e9, 0.03), `${(r32 / 1e9).toFixed(1)}B`);
  const one = estimateDecode({ arch: moe, weightDtype: "bf16", kvDtype: "bf16", contextLength: 4096, concurrency: 32, bandwidthGBs: 3350 })!;
  check("…so 32 users on an H100 get ~1,300 tok/s, not 4,400", one.total > 1100 && one.total < 1500, one.total.toFixed(0));
  const dense = archFromConfig(cfg("Qwen_Qwen3-32B"), 32.8e9)!;
  check("a dense model reads everything at any batch", paramsReadPerStep(dense, 64) === dense.numParams);
}

console.log("\n--- Y6: tensor-parallel sizes vLLM accepts ---");
check("Qwen2.5-7B (28 heads, 4 KV) refuses TP 8", !tpValid(8, 28, 4));
check("…and takes TP 4 (and 2)", tpValid(4, 28, 4) && tpValid(2, 28, 4) && largestTpAtMost(8, 28, 4) === 4);
check("Llama 3.1 70B (64 heads, 8 KV) takes TP 8", tpValid(8, 64, 8));
check("TP 16 on 8 KV heads replicates them, still valid with 64 heads", tpValid(16, 64, 8));
check("TP 3 never divides 64 heads; the next is 4", !tpValid(3, 64, 8) && nearestTp(3, 64, 8) === 4);

console.log("\n--- the URL keeps all of it ---");
{
  // A reload or a shared link rebuilds the arch from the URL; anything it drops,
  // the estimate silently loses.
  const next = archFromConfig(repo("Qwen_Qwen3-Next-80B-A3B-Instruct").config, 81.3e9)!;
  const g3 = archFromConfig(cfg("unsloth_gemma-3-27b-it"), 27.4e9)!;
  const nv: ModelArch = { ...archFromConfig(repo("nvidia_Llama-3.3-70B-Instruct-FP4").config, 70.55e9)!, shipped: { dtype: "int4", bytes: 42_713_000_000 } };
  for (const [name, a] of [["Qwen3-Next", next], ["Gemma 3", g3], ["NVFP4 70B", nv]] as const) {
    const back = decodeState(encodeState({ ...DEFAULT_STATE, hfId: "x/y", arch: a })).arch!;
    const same = (["vocabSize", "attnLayers", "slidingLayers", "slidingWindow", "stateBytesPerSeq", "numExperts", "expertsPerToken"] as const).every((k) => back[k] === a[k]) &&
      !!back.tieEmbeddings === !!a.tieEmbeddings && JSON.stringify(back.shipped) === JSON.stringify(a.shipped);
    check(`${name}: every sizing field survives the URL`, same);
    check(`${name}: and so does the estimate`, kvBytesPerSeq(back, "bf16", 32768) === kvBytesPerSeq(a, "bf16", 32768) && weightsBytes(back, "int4") === weightsBytes(a, "int4"));
  }
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
