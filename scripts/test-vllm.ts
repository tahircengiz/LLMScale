// Unit test for the vLLM recommender. Run: node scripts/test-vllm.ts
import { readFileSync } from "node:fs";
import { recommend, toolParser, detectQuant, type VllmInput } from "../src/lib/vllm.ts";
import { layoutFor, layoutsOn, type ModelArch } from "../src/lib/calc.ts";
import { archFromConfig } from "../src/lib/hf.ts";
import { GPUS, batchFor } from "../src/lib/gpus.ts";
import { findKnownByHfId } from "../src/lib/models.ts";
import { layoutFlags, layoutKey, layoutLabel, parseLayoutKey, sameLayout } from "../src/lib/parallel.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const llama8b: ModelArch = { numParams: 8.03e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128, maxContext: 131072 };
const qwen7b: ModelArch = { numParams: 7.6e9, numLayers: 28, hiddenSize: 3584, numAttentionHeads: 28, numKeyValueHeads: 4, headDim: 128, maxContext: 32768 };
const llama405b: ModelArch = { numParams: 405e9, numLayers: 126, hiddenSize: 16384, numAttentionHeads: 128, numKeyValueHeads: 8, headDim: 128, maxContext: 131072 };

const base = (over: Partial<VllmInput>): VllmInput => ({
  hfId: "meta-llama/Llama-3.1-8B-Instruct", arch: llama8b, modelType: "llama",
  priority: "balanced", task: "chat", gpuVramGiB: 80, gpuCount: 1, maxModelLen: 8192, ...over,
});
const has = (cmd: string, frag: string) => cmd.includes(frag);

console.log("--- tool parser mapping ---");
check("Llama3 → llama3_json", toolParser("meta-llama/Llama-3.1-8B-Instruct")?.parser === "llama3_json");
check("Qwen → hermes", toolParser("Qwen/Qwen2.5-7B-Instruct")?.parser === "hermes");
check("Qwen3-Coder → qwen3_xml", toolParser("Qwen/Qwen3-Coder-30B")?.parser === "qwen3_xml");
check("Mistral → mistral", toolParser("mistralai/Mistral-7B-Instruct-v0.3")?.parser === "mistral");
check("DeepSeek → deepseek_v3", toolParser("deepseek-ai/DeepSeek-R1")?.parser === "deepseek_v3");

console.log("\n--- quant detection ---");
check("FP8 detected", detectQuant("RedHatAI/Qwen3-8B-FP8-dynamic") === "fp8");
check("NVFP4 detected", detectQuant("RedHatAI/Qwen3.6-35B-A3B-NVFP4") === "nvfp4");
check("GGUF detected", detectQuant("unsloth/Qwen3-4B-GGUF") === "gguf");

console.log("\n--- recommendations ---");
const tool = recommend(base({ task: "tool" }));
check("tool → enable-auto-tool-choice", has(tool.command, "--enable-auto-tool-choice"), "");
check("tool → llama3_json parser", has(tool.command, "--tool-call-parser llama3_json"));
// vLLM 0.31.0 turns prefix caching and chunked prefill on, and seeds 0, by default.
check("defaults are left out: prefix caching, seed", !has(tool.command, "--enable-prefix-caching") && !has(tool.command, "--seed"));

const thru = recommend(base({ priority: "throughput" }));
check("throughput → batched 8192", has(thru.command, "--max-num-batched-tokens 8192"));
check("throughput → gpu-util 0.95", has(thru.command, "--gpu-memory-utilization 0.95"));
check("balanced leaves vLLM's default 0.92 out", !has(recommend(base({})).command, "--gpu-memory-utilization"));

// --max-num-seqs is a preset capped by what the KV cache can actually hold, so
// the flag must never promise more concurrency than the memory allows.
const seqsOf = (cmd: string) => Number(/--max-num-seqs (\d+)/.exec(cmd)?.[1] ?? 0);
// 8B on one 80 GB card at 8k: 76 GiB at 0.95, less 14.96 of weights and 1.87 of
// vLLM's overhead at 8,192 tokens and 512 sequences, over 1 GiB a sequence.
check("throughput → seqs clamped to the KV budget", seqsOf(thru.command) === 59, String(seqsOf(thru.command)));
check("throughput → says why it was capped", thru.warnings.some((w) => w.key === "vllm.w.seqcap"));
// Eight cards leave room for the whole preset, so nothing is capped.
const roomy = recommend(base({ priority: "throughput", gpuCount: 8 }));
check("throughput → preset kept when memory allows", seqsOf(roomy.command) === 512, String(seqsOf(roomy.command)));
check("throughput → no cap warning when it fits", !roomy.warnings.some((w) => w.key === "vllm.w.seqcap"));
// Regression for the reported case: a 32k context on 2x A100 cannot hold 512.
const long = recommend(base({ priority: "throughput", maxModelLen: 32768, gpuVramGiB: 80, gpuCount: 2 }));
check("throughput → 32k on 2x80GB is far below the preset", seqsOf(long.command) < 200, String(seqsOf(long.command)));

const acc = recommend(base({ priority: "accuracy" }));
check("accuracy → dtype bfloat16", has(acc.command, "--dtype bfloat16"));
check("accuracy → no fp8 kv", !has(acc.command, "--kv-cache-dtype fp8"));
check("accuracy → kvfull note", acc.warnings.some((w) => w.key === "vllm.w.kvfull"));

const mem = recommend(base({ priority: "memory", task: "rag", maxModelLen: 131072 }));
check("memory+long → fp8 kv", has(mem.command, "--kv-cache-dtype fp8"));
check("memory+long → fp8 accuracy warning", mem.warnings.some((w) => w.key === "vllm.w.fp8acc"));
check("rag/long → no chunked-prefill flag, it is the default", !has(mem.command, "--enable-chunked-prefill"));

const tp = recommend(base({ hfId: "meta-llama/Llama-3.1-405B-Instruct", arch: llama405b, gpuCount: 8 }));
check("multi-gpu → tensor-parallel-size 8", has(tp.command, "--tensor-parallel-size 8"));

const tight = recommend(base({ hfId: "meta-llama/Llama-3.1-405B-Instruct", arch: llama405b, gpuVramGiB: 24, gpuCount: 1 }));
check("405B on 24GB → fit warning", tight.warnings.some((w) => w.key === "vllm.w.fit"), String(tight.warnings.map((w) => w.key)));

const q = recommend(base({ hfId: "Qwen/Qwen2.5-7B-Instruct", arch: qwen7b, task: "structured" }));
// --guided-decoding-backend no longer exists in vLLM 0.31.0 (vllm/engine/arg_utils.py).
check("structured → structured-outputs xgrammar", has(q.command, "--structured-outputs-config.backend xgrammar") && !has(q.command, "--guided-decoding-backend"));

// vLLM refuses a TP size that does not divide the attention heads (vllm/config/model.py).
const qtp = recommend(base({ hfId: "Qwen/Qwen2.5-7B-Instruct", arch: qwen7b, gpuCount: 8 }));
check("TP 8 on 28 heads → warns, names the layout it runs instead", qtp.warnings.some((w) => w.key === "vllm.w.tp" && w.vars?.layout === layoutLabel(qtp.layout!)), JSON.stringify(qtp.warnings));
// The calculator's ×8 view: TP 4 is the widest split the heads allow, and two
// pipeline stages hold more requests than two replicas of it.
check("…and the command carries 4, which vLLM accepts, with every GPU used", has(qtp.command, "--tensor-parallel-size 4") && !has(qtp.command, "--tensor-parallel-size 8") && qtp.layout?.gpus === 8, layoutLabel(qtp.layout!));
check("TP 8 on 64 heads → no warning", !tp.warnings.some((w) => w.key === "vllm.w.tp"));

const mig = recommend(base({ gpuCount: 4, mig: true, gpuVramGiB: 40 }));
check("MIG → no tensor-parallel", !has(mig.command, "--tensor-parallel-size"));
check("MIG → mig warning", mig.warnings.some((w) => w.key === "vllm.w.mig"));

console.log("\n--- layouts: the calculator's (A3) ---");
{
  const gpu = (id: string) => GPUS.find((g) => g.id === id)!;
  const on = (id: string) => ({ gpuVramGiB: gpu(id).visibleGiB ?? gpu(id).vramGiB, gpuName: gpu(id).name });
  const cfg = JSON.parse(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V4-Flash-0731.json", import.meta.url), "utf8"));
  const v4 = archFromConfig(cfg, 304.18e9)!;
  v4.shipped = { dtype: "fp8", bytes: 166_886_535_336 };
  v4.activeParams = 27_356_354_494;
  const v4in = (over: Partial<VllmInput>) =>
    base({ hfId: "deepseek-ai/DeepSeek-V4-Flash", arch: v4, modelType: "deepseek_v4", weightDtype: "fp8", maxModelLen: 262144, ...on("h200-141"), ...over });
  const parallel = (cmd: string) => cmd.split(" \\\n").map((l) => l.trim()).filter((l) => /^--(tensor|pipeline|data)-parallel-size|^--enable-expert-parallel/.test(l)).join(" ");

  // The audit's case: V4 on 4× H200 got --tensor-parallel-size 4. TP holds V4's one
  // cached vector whole on every GPU, so it holds the fewest requests of the
  // layouts on four; the calculator's ×4 view runs the one that holds the most.
  const four = recommend(v4in({ gpuCount: 4 }));
  const calc = layoutsOn({ arch: v4, weightDtype: "fp8", kvDtype: "fp8", contextLength: 262144, concurrency: 1, batch: batchFor(gpu("h200-141")) }, (gpu("h200-141").visibleGiB ?? 0) * 0.92, 4)[0].layout;
  check("V4 on 4× H200: the calculator's layout, not TP 4", parallel(four.command) === layoutFlags(calc) && !(calc.tp === 4 && calc.dp === 1), `${parallel(four.command)} vs ${layoutFlags(calc)}`);
  const tp4 = four.layouts.find((f) => f.layout.tp === 4)!;
  check("…which holds more requests at 256k than TP 4", four.layouts[0].maxUsers > tp4.maxUsers, `${layoutLabel(four.layout!)} ${four.layouts[0].maxUsers} vs TP 4 ${tp4.maxUsers}`);
  // vLLM's V4 recipe (vllm-project/recipes, DeepSeek-V4-Flash.yaml, base_args).
  check("V4 → --kv-cache-dtype fp8 and --block-size 256", has(four.command, "--kv-cache-dtype fp8") && has(four.command, "--block-size 256"));
  check("V4 at max accuracy keeps fp8: vLLM refuses 16-bit on fp8_ds_mla", has(recommend(v4in({ gpuCount: 4, priority: "accuracy" })).command, "--kv-cache-dtype fp8"));
  check("V4 → no --trust-remote-code: vLLM 0.31 registers DeepseekV4Config itself", !has(four.command, "--trust-remote-code"));
  check("a model without V4's caches gets no --block-size", !has(tp.command, "--block-size") && !has(qtp.command, "--block-size"));

  // A layout a link names is the one set up; one the GPUs cannot make falls back.
  const asked = recommend(v4in({ gpuCount: 4, layout: { tp: 4, pp: 1, dp: 1, ep: false } }));
  check("a layout the link names is set up", parallel(asked.command) === "--tensor-parallel-size 4", parallel(asked.command));
  const wrong = recommend(v4in({ gpuCount: 4, layout: { tp: 8, pp: 1, dp: 1, ep: false } }));
  check("…one that is not on these GPUs falls back to the first", parallel(wrong.command) === parallel(four.command));
  check("layout keys round-trip", layoutKey(parseLayoutKey("tp2.pp3.dp1")!) === "tp2.pp3.dp1" && parseLayoutKey("tp1.pp1.dp4.ep")!.ep && parseLayoutKey("tp0.pp1.dp1") === null && parseLayoutKey("x") === null);

  // --max-num-seqs counts per data-parallel rank, so its cap is one replica's share.
  const dpEp = { tp: 1, pp: 1, dp: 4, ep: true };
  const thr = recommend(v4in({ gpuCount: 4, priority: "throughput", layout: dpEp }));
  const ranks = thr.layouts.find((f) => sameLayout(f.layout, dpEp));
  const per = Math.floor((ranks?.maxUsers ?? 0) / 4);
  check("throughput on DP 4 · EP: --max-num-seqs is capped at one rank's share", !!ranks && sameLayout(thr.layout!, dpEp) && seqsOf(thr.command) === Math.min(512, per) && per > 0 && per < ranks.maxUsers, `${thr.layout && layoutLabel(thr.layout)}: ${seqsOf(thr.command)} vs ${per} per rank of ${ranks?.maxUsers}`);

  // Too big for one GPU: the warning gives the calculator's count and layout.
  const l70 = findKnownByHfId("meta-llama/Llama-3.3-70B-Instruct")!;
  const one = recommend(base({ hfId: l70.hfId, arch: l70, maxModelLen: 32768, ...on("h100-80") }));
  const need = layoutFor({ arch: l70, weightDtype: "bf16", kvDtype: "fp16", contextLength: 32768, concurrency: 1, batch: batchFor(gpu("h100-80")) }, (gpu("h100-80").visibleGiB ?? 0) * 0.92)!;
  const fit = one.warnings.find((w) => w.key === "vllm.w.fit");
  check("70B on one H100: the fit warning gives the calculator's count", fit?.vars?.gpus === need.gpus && fit.vars.layout === layoutLabel(need), JSON.stringify(fit?.vars));
  const there = recommend(base({ hfId: l70.hfId, arch: l70, maxModelLen: 32768, ...on("h100-80"), gpuCount: need.gpus, layout: parseLayoutKey(String(fit?.vars?.lay))! }));
  check("…and that many, laid out so, fit", !there.warnings.some((w) => w.key === "vllm.w.fit") && parallel(there.command) === layoutFlags(need), parallel(there.command));
  const none = recommend(base({ maxModelLen: 100_000_000, ...on("t4-16") }));
  check("no count of GPUs holds it → says so, with no count", none.warnings.some((w) => w.key === "vllm.w.fitNone") && !none.warnings.some((w) => w.key === "vllm.w.fit"));
}

console.log("\n--- k8s args format ---");
const k8s = recommend(base({ task: "tool" }));
check("k8s uses --key=value", k8s.k8sArgs.includes("--max-model-len=8192"));
check("k8s no leading whitespace", k8s.k8sArgs.split("\n").every((l) => l === l.trimStart()));
check("k8s omits 'vllm serve' + model", !k8s.k8sArgs.includes("vllm serve") && !k8s.k8sArgs.includes("Llama-3.1-8B"));
check("k8s keeps bare boolean flags", k8s.k8sArgs.split("\n").includes("--enable-auto-tool-choice"));
console.log("\n--- sample k8s args ---\n" + k8s.k8sArgs);

console.log("\n--- sample command (tool, balanced) ---\n" + tool.command);
console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
