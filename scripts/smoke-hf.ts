// Live smoke test against the Hugging Face Hub. Run: node scripts/smoke-hf.ts
import { resolveModel, searchModels } from "../src/lib/hf.ts";

async function show(id: string) {
  try {
    const r = await resolveModel(id);
    const a = r.arch;
    console.log(`\n• ${id}`);
    console.log(`   source=${r.source} gated=${r.gated} warn=${r.warningKey ?? "-"} type=${r.modelType ?? "-"}`);
    if (a) {
      console.log(
        `   params=${(a.numParams / 1e9).toFixed(2)}B layers=${a.numLayers} hidden=${a.hiddenSize} heads=${a.numAttentionHeads}/${a.numKeyValueHeads} headDim=${a.headDim ?? "-"} maxCtx=${a.maxContext ?? "-"}`
      );
    } else {
      console.log(
        `   arch=NULL (numParams≈${(r.numParams / 1e9).toFixed(1)}B) → UI seeds Custom tab, no blank-out`
      );
    }
  } catch (e) {
    console.log(`\n• ${id}\n   THREW: ${e instanceof Error ? e.message : e}`);
  }
}

async function search(q: string) {
  try {
    const r = await searchModels(q, 6);
    console.log(`\n🔎 search "${q}": ${r.length} results`);
    for (const m of r) console.log(`   - ${m.id}  gated=${m.gated ?? "-"} dl=${m.downloads ?? "-"}`);
  } catch (e) {
    console.log(`\n🔎 search "${q}" THREW: ${e instanceof Error ? e.message : e}`);
  }
}

console.log("=== SEARCH ===");
await search("Qwen3");
await search("RedHatAI/Qwen"); // quantized repos that the text-generation filter used to hide
await search("redhatai/qwen"); // lowercase
await search("llama 3");

console.log("\n=== RESOLVE ===");
await show("Qwen/Qwen2.5-7B-Instruct"); // public
await show("meta-llama/Llama-3.1-8B-Instruct"); // gated bundled
await show("Qwen/Qwen3-30B-A3B"); // real MoE (if exists)
await show("DevQuasar/Qwen.Qwen3.6-35B-A3B-GGUF"); // the bug case (GGUF)
await show("mistralai/Mixtral-8x7B-Instruct-v0.1"); // gated MoE bundled
await show("definitely/not-a-real-model-xyz123"); // 404

console.log("\ndone");
