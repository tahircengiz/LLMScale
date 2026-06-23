// Unit test for the vLLM recommender. Run: node scripts/test-vllm.ts
import { recommend, toolParser, detectQuant, type VllmInput } from "../src/lib/vllm.ts";
import type { ModelArch } from "../src/lib/calc";

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
check("chat/tool → prefix caching", has(tool.command, "--enable-prefix-caching"));
check("always → seed", has(tool.command, "--seed 0"));

const thru = recommend(base({ priority: "throughput" }));
check("throughput → max-num-seqs 512", has(thru.command, "--max-num-seqs 512"));
check("throughput → batched 8192", has(thru.command, "--max-num-batched-tokens 8192"));
check("throughput → gpu-util 0.95", has(thru.command, "--gpu-memory-utilization 0.95"));

const acc = recommend(base({ priority: "accuracy" }));
check("accuracy → dtype bfloat16", has(acc.command, "--dtype bfloat16"));
check("accuracy → no fp8 kv", !has(acc.command, "--kv-cache-dtype fp8"));
check("accuracy → kvfull note", acc.warnings.some((w) => w.key === "vllm.w.kvfull"));

const mem = recommend(base({ priority: "memory", task: "rag", maxModelLen: 131072 }));
check("memory+long → fp8 kv", has(mem.command, "--kv-cache-dtype fp8"));
check("memory+long → fp8 accuracy warning", mem.warnings.some((w) => w.key === "vllm.w.fp8acc"));
check("rag/long → chunked prefill", has(mem.command, "--enable-chunked-prefill"));

const tp = recommend(base({ hfId: "meta-llama/Llama-3.1-405B-Instruct", arch: llama405b, gpuCount: 8 }));
check("multi-gpu → tensor-parallel-size 8", has(tp.command, "--tensor-parallel-size 8"));

const tight = recommend(base({ hfId: "meta-llama/Llama-3.1-405B-Instruct", arch: llama405b, gpuVramGiB: 24, gpuCount: 1 }));
check("405B on 24GB → fit warning", tight.warnings.some((w) => w.key === "vllm.w.fit"), String(tight.warnings.map((w) => w.key)));

const q = recommend(base({ hfId: "Qwen/Qwen2.5-7B-Instruct", arch: qwen7b, task: "structured" }));
check("structured → guided xgrammar", has(q.command, "--guided-decoding-backend xgrammar"));

const mig = recommend(base({ gpuCount: 4, mig: true, gpuVramGiB: 40 }));
check("MIG → no tensor-parallel", !has(mig.command, "--tensor-parallel-size"));
check("MIG → mig warning", mig.warnings.some((w) => w.key === "vllm.w.mig"));

console.log("\n--- sample command (tool, balanced) ---\n" + tool.command);
console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
