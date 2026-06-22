// Unit test for the task-fit engine. Run: node scripts/test-fit.ts
import { extractCaps, scoreFit, type TaskId } from "../src/lib/fit.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

// Caps built from real HF tag sets (observed live).
const models = {
  qwenInstruct: extractCaps({
    hfId: "Qwen/Qwen2.5-7B-Instruct", arch: { numParams: 7.6e9, numLayers: 28, hiddenSize: 3584, numAttentionHeads: 28, numKeyValueHeads: 4, maxContext: 32768 },
    numParams: 7.6e9, modelType: "qwen2", tags: ["text-generation", "chat", "conversational", "en"], pipelineTag: "text-generation",
  }),
  coder: extractCaps({
    hfId: "Qwen/Qwen2.5-Coder-7B-Instruct", arch: { numParams: 7.6e9, numLayers: 28, hiddenSize: 3584, numAttentionHeads: 28, numKeyValueHeads: 4, maxContext: 32768 },
    numParams: 7.6e9, modelType: "qwen2", tags: ["text-generation", "code", "codeqwen", "qwen-coder", "conversational", "en"], pipelineTag: "text-generation",
  }),
  embed: extractCaps({
    hfId: "Qwen/Qwen3-Embedding-4B", arch: { numParams: 4e9, numLayers: 36, hiddenSize: 2560, numAttentionHeads: 32, numKeyValueHeads: 8, maxContext: 32768 },
    numParams: 4e9, modelType: "qwen3", tags: ["sentence-transformers", "sentence-similarity", "feature-extraction", "text-embeddings-inference"], pipelineTag: "feature-extraction",
  }),
  vl: extractCaps({
    hfId: "Qwen/Qwen2.5-VL-7B-Instruct", arch: { numParams: 8e9, numLayers: 28, hiddenSize: 3584, numAttentionHeads: 28, numKeyValueHeads: 4, maxContext: 128000 },
    numParams: 8e9, modelType: "qwen2_5_vl", tags: ["image-text-to-text", "multimodal", "conversational", "en"], pipelineTag: "image-text-to-text",
  }),
  llamaBase: extractCaps({
    hfId: "meta-llama/Llama-3.1-8B", arch: { numParams: 8.03e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, maxContext: 131072 },
    numParams: 8.03e9, modelType: "llama", tags: ["text-generation", "llama-3", "en", "de", "fr", "it", "pt", "hi", "es", "th"], pipelineTag: "text-generation",
  }),
  r1: extractCaps({
    hfId: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", arch: { numParams: 7.6e9, numLayers: 28, hiddenSize: 3584, numAttentionHeads: 28, numKeyValueHeads: 4, maxContext: 131072 },
    numParams: 7.6e9, modelType: "qwen2", tags: ["text-generation", "conversational"], pipelineTag: "text-generation",
  }),
};

const fit = (m: keyof typeof models, t: TaskId) => scoreFit(models[m], t).overall;

console.log("--- capability extraction ---");
check("instruct detects chat tag", models.qwenInstruct.instruct);
check("code detected", models.coder.code);
check("embedding detected (pipeline)", models.embed.embedding && !models.embed.generative);
check("vision detected", models.vl.vision);
check("base llama multilingual (8 langs)", models.llamaBase.multilingual && !models.llamaBase.instruct);
check("r1 reasoning detected", models.r1.reasoning);

console.log("\n--- fit scores ---");
check("Qwen-Instruct → chat is great", fit("qwenInstruct", "chat") >= 80, String(fit("qwenInstruct", "chat")));
check("Qwen-Instruct → embeddings is a mismatch", fit("qwenInstruct", "embeddings") <= 25, String(fit("qwenInstruct", "embeddings")));
check("Qwen-Instruct → vision is a mismatch", fit("qwenInstruct", "vision") <= 25, String(fit("qwenInstruct", "vision")));
check("Coder → code is great", fit("coder", "code") >= 80, String(fit("coder", "code")));
check("Embedding → embeddings is great", fit("embed", "embeddings") >= 70, String(fit("embed", "embeddings")));
check("Embedding → chat is a mismatch", fit("embed", "chat") <= 25, String(fit("embed", "chat")));
check("VL → vision is great", fit("vl", "vision") >= 80, String(fit("vl", "vision")));
check("Llama-base → multilingual is strong", fit("llamaBase", "multilingual") >= 70, String(fit("llamaBase", "multilingual")));
check("R1-Distill → reasoning is strong", fit("r1", "reasoning") >= 70, String(fit("r1", "reasoning")));
check("Small model → edge beats throughput-of-huge", fit("qwenInstruct", "edge") > 0);

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
