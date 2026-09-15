// Active parameters of Mixture-of-Experts models, estimated from config.json.
// Run: node scripts/test-moe.ts
//
// Decode speed reads the active parameters (src/lib/perf.ts). The bundled presets
// carry them from model cards, but a model resolved live from its config had none,
// so every live MoE was estimated as if dense — and so was every preset, because a
// readable live config wins over the bundled entry. The configs below are the real
// ones from the Hugging Face Hub, trimmed to the fields that matter, and each
// estimate is held to the active count its model card publishes.
import { archFromConfig } from "../src/lib/hf.ts";
import { activeParamsOf } from "../src/lib/moe.ts";
import { computeParamDist } from "../src/lib/anatomy.ts";
import { estimateDecode } from "../src/lib/perf.ts";
import { decodeState, encodeState, DEFAULT_STATE } from "../src/lib/urlState.ts";
import { resolveHeadDim } from "../src/lib/calc.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const B = (n: number | undefined) => (n === undefined ? "undefined" : `${(n / 1e9).toFixed(2)}B`);
const near = (a: number | undefined, b: number, tol: number) => a !== undefined && Math.abs(a - b) / b <= tol;
const preset = (id: string) => {
  const m = KNOWN_MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`no preset ${id}`);
  return m;
};
/** What resolveModel builds from a config, given the repo's parameter count. */
const live = (id: string, cfg: object) => archFromConfig(cfg, preset(id).numParams)!;

// ── the configs (Qwen/Qwen3-30B-A3B, mistralai/Mixtral-8x7B-Instruct-v0.1,
//    openai/gpt-oss-20b and -120b, deepseek-ai/DeepSeek-V3) ────────────────────
const qwen3 = { model_type: "qwen3_moe", num_hidden_layers: 48, hidden_size: 2048, intermediate_size: 6144, moe_intermediate_size: 768, num_attention_heads: 32, num_key_value_heads: 4, head_dim: 128, num_experts: 128, num_experts_per_tok: 8, decoder_sparse_step: 1, mlp_only_layers: [], tie_word_embeddings: false, vocab_size: 151936, max_position_embeddings: 40960 };
const mixtral = { model_type: "mixtral", num_hidden_layers: 32, hidden_size: 4096, intermediate_size: 14336, num_attention_heads: 32, num_key_value_heads: 8, num_local_experts: 8, num_experts_per_tok: 2, tie_word_embeddings: false, vocab_size: 32000, max_position_embeddings: 32768 };
const oss = (layers: number, experts: number) => ({ model_type: "gpt_oss", num_hidden_layers: layers, hidden_size: 2880, intermediate_size: 2880, num_attention_heads: 64, num_key_value_heads: 8, head_dim: 64, num_local_experts: experts, num_experts_per_tok: 4, experts_per_token: 4, tie_word_embeddings: false, vocab_size: 201088, max_position_embeddings: 131072 });
const deepseek = { model_type: "deepseek_v3", num_hidden_layers: 61, hidden_size: 7168, intermediate_size: 18432, moe_intermediate_size: 2048, num_attention_heads: 128, num_key_value_heads: 128, kv_lora_rank: 512, qk_rope_head_dim: 64, n_routed_experts: 256, n_shared_experts: 1, num_experts_per_tok: 8, first_k_dense_replace: 3, moe_layer_freq: 1, num_nextn_predict_layers: 1, tie_word_embeddings: false, vocab_size: 129280, max_position_embeddings: 163840 };

console.log("--- estimates against model cards ---");
const q = live("qwen3-30b-a3b", qwen3);
check("Qwen3-30B-A3B ≈ 3.3B active", near(q.activeParams, 3.3e9, 0.03), B(q.activeParams));
const mx = live("mixtral-8x7b", mixtral);
check("Mixtral 8x7B ≈ 12.9B active", near(mx.activeParams, 12.9e9, 0.03), B(mx.activeParams));
// The gpt-oss card leaves the input embedding table out of its active count — a
// token reads one row of it, not all of it — so compare with that taken off.
const inputEmbedding = 201088 * 2880;
const o20 = live("gpt-oss-20b", oss(24, 32));
check("gpt-oss-20b ≈ 3.6B active, less the input embedding", near((o20.activeParams ?? 0) - inputEmbedding, 3.6e9, 0.03), B(o20.activeParams));
const o120 = live("gpt-oss-120b", oss(36, 128));
check("gpt-oss-120b ≈ 5.1B active, less the input embedding", near((o120.activeParams ?? 0) - inputEmbedding, 5.1e9, 0.03), B(o120.activeParams));
// DeepSeek's 37B is the main model's; the parameter count also holds the
// multi-token-prediction module, whose non-expert parts are counted here as active.
const ds = live("deepseek-v3", deepseek);
check("DeepSeek-V3 ≈ 37B active, within 10%", near(ds.activeParams, 37e9, 0.1), B(ds.activeParams));
check("DeepSeek-V3's first three dense layers are not counted as sparse", (ds.activeParams ?? 0) > 37e9 * 0.95);

console.log("\n--- what is not a MoE stays unset ---");
const llama = { model_type: "llama", num_hidden_layers: 32, hidden_size: 4096, intermediate_size: 14336, num_attention_heads: 32, num_key_value_heads: 8, vocab_size: 128256 };
check("a dense config has no active count", archFromConfig(llama, 8.03e9)!.activeParams === undefined);
check("one expert is not a mixture", activeParamsOf(mx, { ...mixtral, num_local_experts: 1 }) === undefined);
check("routing through every expert is not sparse", activeParamsOf(mx, { ...mixtral, num_experts_per_tok: 8 }) === undefined);
check("a count larger than the total is refused", activeParamsOf({ ...mx, numParams: 1e9 }, { ...mixtral, intermediate_size: undefined, vocab_size: 0 }) === undefined);

console.log("\n--- without an expert width, the anatomy split ---");
const noWidth = { ...oss(24, 32), intermediate_size: undefined };
const archNoWidth = live("gpt-oss-20b", noWidth);
const dist = computeParamDist({
  numParams: archNoWidth.numParams, numLayers: 24, hidden: 2880, attnHeads: 64, kvHeads: 8, headDim: resolveHeadDim(archNoWidth),
  vocab: 201088, tieEmbeddings: false, isMoE: true, numExperts: 32, expertsPerTok: 4,
});
check("falls back to the same figure the anatomy tab draws", near(archNoWidth.activeParams, dist.embeddings + dist.attention + (dist.ffnActive ?? 0), 1e-9), B(archNoWidth.activeParams));

console.log("\n--- the estimate reaches decode speed, and survives a reload ---");
const at = (arch: typeof q) => estimateDecode({ arch, weightDtype: "bf16", kvDtype: "fp16", contextLength: 8192, concurrency: 1, bandwidthGBs: 1008 })!;
const asDense = at({ ...q, activeParams: undefined });
check("a live Qwen3-30B-A3B decodes several times faster than as dense", at(q).perUser > asDense.perUser * 5, `${at(q).perUser.toFixed(0)} vs ${asDense.perUser.toFixed(0)} tok/s`);
const back = decodeState(encodeState({ ...DEFAULT_STATE, hfId: "Qwen/Qwen3-30B-A3B", arch: q })).arch;
check("the URL carries the active count", back?.activeParams === Math.round(q.activeParams!), B(back?.activeParams));
check("a dense model's URL carries none", decodeState(encodeState({ ...DEFAULT_STATE, hfId: "x", arch: archFromConfig(llama, 8.03e9)! })).arch?.activeParams === undefined);

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
