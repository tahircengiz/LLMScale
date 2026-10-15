// The phase-1 fixes from the 2026-10-15 data audit
// (docs/audit-2026-10-15-veri-guvenilirligi.md), each checked against what the
// audit measured. Run: node scripts/test-audit.ts
import { readFileSync } from "node:fs";
import { kvBytesPerToken, layoutFor, layoutsOn, usesMla, weightsBytes, type ModelArch } from "../src/lib/calc.ts";
import { archFromConfig, parseConfigJson } from "../src/lib/hf.ts";
import { batchFor, cardsFor, GPUS, runsVllm, usableGiB } from "../src/lib/gpus.ts";
import { unmodelledCacheKeys } from "../src/lib/layers.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import { decodeState, DEFAULT_STATE, encodeState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const raw = (n: string) => readFileSync(new URL(`./fixtures/configs-audit/${n}.json`, import.meta.url), "utf8");
const cfg = (n: string) => parseConfigJson(raw(n));
const gpu = (id: string) => GPUS.find((g) => g.id === id)!;
const preset = (id: string) => KNOWN_MODELS.find((m) => m.id === id)! as ModelArch;

console.log("--- A1, A11: the URL ---");
{
  const qwen = preset("qwen3-30b-a3b");
  const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: qwen }));
  check("a link keeps the model's max context", back.arch?.maxContext === 40960, String(back.arch?.maxContext));
  const bad = decodeState("p=-8e9&L=32&h=4096&a=32&k=8&wd=fp4&kd=garbage&ctx=-8192&n=-3");
  check("a negative parameter count drops the architecture", bad.arch === undefined);
  check("unknown precisions are dropped", bad.weightDtype === undefined && bad.kvDtype === undefined);
  check("a negative context and user count are dropped", bad.contextLength === undefined && bad.concurrency === undefined);
  const zero = decodeState("p=1e9&L=4&h=512&a=8&k=8&kl=512&qr=0");
  check("a positional part of 0 survives the link", zero.arch?.qkRopeHeadDim === 0 && usesMla(zero.arch!));
}

console.log("\n--- A2, A5: one way of counting cards ---");
{
  const v3 = preset("deepseek-v3");
  const input = { arch: v3, weightDtype: "bf16" as const, kvDtype: "fp16" as const, contextLength: 8192, concurrency: 1 };
  const h100 = gpu("h100-80");
  const calc = layoutFor({ ...input, batch: batchFor(h100) }, usableGiB(h100))?.gpus;
  check("the guides count cards as the calculator does", cardsFor(input, h100) === calc, `${cardsFor(input, h100)} vs ${calc}`);
  // The fewest cards that fit is fewest under the ×N selector's own rules too.
  const mixtral = preset("mixtral-8x7b");
  const pro = gpu("rtxpro6000-96");
  const load = { arch: mixtral, weightDtype: "bf16" as const, kvDtype: "fp16" as const, contextLength: 131072, concurrency: 64, batch: batchFor(pro) };
  const n = layoutFor(load, usableGiB(pro))!.gpus;
  const fewer = Array.from({ length: n - 1 }, (_, i) => i + 1).filter((m) => layoutsOn(load, usableGiB(pro), m)[0]?.fits);
  check("no smaller count fits under the selector's rules", fewer.length === 0, `${n} cards; fits at ${fewer.join(", ") || "none smaller"}`);
}

console.log("\n--- E2, E3, F1–F3: the cards ---");
{
  const near = (a: number, b: number) => Math.abs(a - b) < 0.02;
  check("Strix Halo: vLLM's 0.92 of the 96 GiB its GPU reports", near(usableGiB(gpu("amd-strixhalo-128")), 88.32), usableGiB(gpu("amd-strixhalo-128")).toFixed(2));
  check("DGX Spark: 0.92 of 121.63 GiB", near(usableGiB(gpu("nv-dgxspark-128")), 111.9), usableGiB(gpu("nv-dgxspark-128")).toFixed(2));
  check("a Mac keeps Metal's share", usableGiB(gpu("apple-m4max-128")) === 96);
  check("L40S: ECC leaves 44.36 GiB, 40.81 for vLLM", near(usableGiB(gpu("l40s-48")), 40.81), usableGiB(gpu("l40s-48")).toFixed(2));
  check("H100 SXM: 0.92 of 79.15 GiB", near(usableGiB(gpu("h100-80")), 72.82));
  check("H100 PCIe is its own card at 2,000 GB/s", gpu("h100pcie-80")?.bandwidthGBs === 2000 && gpu("h100-80").bandwidthGBs === 3350);
  check("RTX PRO 6000 Server is its own card at 1,597 GB/s", gpu("rtxpro6000s-96")?.bandwidthGBs === 1597);
  check("V100 is not offered for vLLM 0.31", !runsVllm(gpu("v100-32")) && runsVllm(gpu("h100-80")));
}

console.log("\n--- E4, B13, B14: the presets ---");
check("Qwen3-30B-A3B's experts are 768 wide", preset("qwen3-30b-a3b").moeIntermediateSize === 768);
check("DeepSeek V3's experts are 2,048 wide", preset("deepseek-v3").moeIntermediateSize === 2048);
check("Mistral repos are no longer gated", KNOWN_MODELS.filter((m) => /^mistralai\//.test(m.hfId)).every((m) => !m.gated));
check("Mistral Nemo reads 131,072 tokens", KNOWN_MODELS.find((m) => m.id === "mistral-nemo-12b")?.maxContext === 131072);

console.log("\n--- B9: a bare Infinity in a config ---");
{
  const text = raw("nvidia_NVIDIA-Nemotron-Nano-12B-v2");
  let strict = true;
  try {
    JSON.parse(text);
  } catch {
    strict = false;
  }
  check("JSON.parse rejects the Nemotron Nano 12B v2 config", !strict);
  const c = parseConfigJson(text);
  check("…and it now reads", !!archFromConfig(c, 12.3e9), JSON.stringify(c.time_step_limit));
}

console.log("\n--- B4: key-value heads under other names ---");
{
  const base = { num_hidden_layers: 32, hidden_size: 4544, num_attention_heads: 71 };
  check("Falcon's multi_query is one KV head", archFromConfig({ ...base, multi_query: true }, 7e9)!.numKeyValueHeads === 1);
  check("Falcon's n_head_kv", archFromConfig({ ...base, n_head_kv: 8 }, 7e9)!.numKeyValueHeads === 8);
  const glm = archFromConfig({ num_layers: 40, hidden_size: 4096, num_attention_heads: 32, multi_query_attention: true, multi_query_group_num: 2, seq_length: 131072 }, 9.4e9)!;
  check("ChatGLM's multi_query_group_num and seq_length", glm.numKeyValueHeads === 2 && glm.maxContext === 131072, `${glm.numKeyValueHeads}, ${glm.maxContext}`);
  check("Step's num_attention_groups", archFromConfig({ ...base, num_attention_heads: 64, num_attention_groups: 8 }, 7e9)!.numKeyValueHeads === 8);
}

console.log("\n--- B8: a window for every layer ---");
{
  const mistral = archFromConfig({ model_type: "mistral", num_hidden_layers: 32, hidden_size: 4096, num_attention_heads: 32, num_key_value_heads: 8, sliding_window: 4096, max_position_embeddings: 32768 }, 7.2e9)!;
  check("Mistral-7B v0.1 slides on all 32 layers", mistral.slidingLayers === 32 && mistral.slidingWindow === 4096);
  const g2 = archFromConfig({ model_type: "gemma2", num_hidden_layers: 42, hidden_size: 3584, num_attention_heads: 16, num_key_value_heads: 8, head_dim: 256, sliding_window: 4096, max_position_embeddings: 8192 }, 9.2e9)!;
  check("Gemma 2 without layer_types alternates", g2.slidingLayers === 21);
  const qwen = archFromConfig({ model_type: "qwen2", num_hidden_layers: 28, hidden_size: 3584, num_attention_heads: 28, num_key_value_heads: 4, sliding_window: 131072, use_sliding_window: false, max_position_embeddings: 32768 }, 7.6e9)!;
  check("Qwen2 with the window off has none", qwen.slidingLayers === undefined);
}

console.log("\n--- B10: tied embeddings by family ---");
{
  const g2 = archFromConfig({ model_type: "gemma2", num_hidden_layers: 42, hidden_size: 3584, num_attention_heads: 16, num_key_value_heads: 8, vocab_size: 256000 }, 9.2e9)!;
  const llama = archFromConfig({ model_type: "llama", num_hidden_layers: 32, hidden_size: 4096, num_attention_heads: 32, num_key_value_heads: 8, vocab_size: 128256 }, 8e9)!;
  check("Gemma 2 with no flag is tied", g2.tieEmbeddings === true);
  check("Llama with no flag is untied", llama.tieEmbeddings === false);
  check("…which lowers Gemma 2's INT4 estimate", weightsBytes(g2, "int4") < weightsBytes({ ...g2, tieEmbeddings: false }, "int4"));
}

console.log("\n--- B2: MLA with no positional part (GLM-5.3-Flash) ---");
{
  const glm = archFromConfig(cfg("zai-org_GLM-5.3-Flash"), 120e9)!;
  check("read as MLA", usesMla(glm), `kv_lora_rank ${glm.kvLoraRank}, rope ${glm.qkRopeHeadDim}`);
  check("only its sparse-attention layers keep a cache", glm.attnLayers === 11, String(glm.attnLayers));
  const per = kvBytesPerToken(glm, "bf16");
  // 11 layers × 512 × 2 bytes of latent, and an fp8 indexer key of 132 bytes each.
  check("about 12.7 KiB a token, not 176 KiB", per === 11 * 512 * 2 + 11 * 132, `${per} B`);
  check("its linear-attention state is flagged as not modelled", (glm.unmodelled ?? []).includes("linear_attn_config"));
}

console.log("\n--- K14: configs the sizing does not follow yet ---");
{
  const g4 = archFromConfig(cfg("google_gemma-4-31B-it"), 31e9)!;
  check("Gemma 4's global head shape is modelled now (test-audit2.ts), not flagged", !g4.unmodelled && !!g4.globalAttn, JSON.stringify(g4.unmodelled));
  check("Nemotron-H's float32 SSM state is modelled now (test-audit2.ts), not flagged", unmodelledCacheKeys(cfg("nvidia_NVIDIA-Nemotron-Nano-12B-v2")).length === 0);
  check("a plain Llama is not", unmodelledCacheKeys({ model_type: "llama", num_hidden_layers: 32 }).length === 0);
  const flagged = { ...g4, unmodelled: ["block_configs"] };
  const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: flagged }));
  check("the flag survives a link", JSON.stringify(back.arch?.unmodelled) === JSON.stringify(flagged.unmodelled));
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
