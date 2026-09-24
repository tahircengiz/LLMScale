// The Config Decoder engine against real config.json files.
// Run: node scripts/test-config.ts
//
// The fixtures are unmodified config.json files from Hugging Face (September
// 2026), one per layout the page has to explain: GQA with an explicit head_dim,
// MoE, MLA with FP8 and shared experts, MXFP4 with a sliding window, YaRN and
// Llama 3 RoPE scaling, a multimodal model with its language model under
// text_config, two hybrids, AWQ, compressed-tensors, custom modelling code, and
// GPT-2's older spellings. The figures checked are the ones the model cards and
// papers state, not ones this engine produced and then copied here.

import { readFileSync, readdirSync } from "node:fs";
import { DICTS } from "../src/lib/dict.ts";
import { ALIASES, FIELD_GROUPS, GLOSSARY, GROUP_LABEL, PATTERNS, lookupField } from "../src/lib/configGlossary.ts";
import {
  configFromArch,
  explainConfig,
  jsonLines,
  lineCited,
  shortTokens,
  type Answer,
  type ConfigReport,
  type Part,
} from "../src/lib/configExplain.ts";
import type { Lang } from "../src/lib/dict.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const dir = new URL("./fixtures/configs/", import.meta.url);
const load = (name: string) => JSON.parse(readFileSync(new URL(`${name}.json`, dir), "utf8"));
const ans = (r: ConfigReport, id: Answer["id"]) => r.answers.find((a) => a.id === id)!;
const has = (a: Answer, k: string) => a.parts.some((p) => p.k === k);
const part = (a: Answer, k: string) => [...a.parts, ...a.working].find((p) => p.k === k);
const fill = (lang: Lang, p: Part) => {
  let s = DICTS[lang][`config.a.${p.k}`] ?? "";
  for (const [k, v] of Object.entries(p.v ?? {})) s = s.replaceAll(`{${k}}`, String(v));
  return s;
};

console.log("--- Qwen3-32B: GQA with an explicit head_dim ---");
{
  const r = explainConfig({ cfg: load("Qwen_Qwen3-32B"), lang: "en", numParams: 32.76e9 });
  const kv = ans(r, "kvcache");
  // 2 × 64 layers × 8 KV heads × 128 × 2 bytes
  check("KV per token = 262,144 bytes (256 KiB)", part(kv, "kv.perToken")?.v?.b === "256 KiB", String(part(kv, "kv.perToken")?.v?.b));
  const attn = ans(r, "attention");
  check("64 query heads share 8 KV heads, 8:1", part(attn, "attn.gqa")?.v?.r === "8");
  // Qwen3 sets head_dim 128 with 64 heads: 8192, while hidden_size is 5120.
  check("says head_dim × heads ≠ hidden_size", part(attn, "attn.headDimExplicit")?.v?.x === "8,192");
  check("the answer cites head_dim", attn.cites.includes("head_dim"));
  check("40,960 tokens = 40k", part(ans(r, "context"), "context.max")?.v?.s === "40k");
  check("stored in BF16, 2 bytes", part(ans(r, "precision"), "precision.stored")?.v?.d === "BF16");
  check("dense, so no experts", has(ans(r, "experts"), "experts.none"));
  check("native Transformers class, no remote code", has(ans(r, "load"), "load.native"));
}

console.log("\n--- Qwen3-30B-A3B: MoE ---");
{
  const r = explainConfig({ cfg: load("Qwen_Qwen3-30B-A3B"), lang: "en", numParams: 30.53e9 });
  const kind = ans(r, "kind");
  check("routes 8 of 128 experts", part(kind, "kind.moe")?.v?.k === "8" && part(kind, "kind.moe")?.v?.n === "128");
  check("6.25% of routed experts per token", part(ans(r, "experts"), "experts.memory")?.v?.pct === "6.3");
  // The model card: 30.5B total, 3.3B activated.
  const active = String(part(ans(r, "size"), "size.active")?.v?.a ?? "");
  check("≈3.3B active parameters, as the model card states", /^3\.[2-4]B$/.test(active), active);
}

console.log("\n--- DeepSeek-V3: MLA, FP8, shared experts, YaRN ---");
{
  const r = explainConfig({ cfg: load("deepseek-ai_DeepSeek-V3"), lang: "en", numParams: 684.5e9 });
  const kv = ans(r, "kvcache");
  // DeepSeek-V2 §2.1.3: (d_c + d_h^R) · l per token — 61 × (512 + 64) × 2 bytes.
  check("MLA cache = 70,272 bytes per token", part(kv, "kv.w.mla")?.v?.b === "70,272");
  check("cites kv_lora_rank and qk_rope_head_dim, not the heads",
    kv.cites.includes("kv_lora_rank") && kv.cites.includes("qk_rope_head_dim") && !kv.cites.includes("num_key_value_heads"));
  check("attention answer names MLA", has(ans(r, "attention"), "attn.mla"));
  const ctx = ans(r, "context");
  check("YaRN: 4k stretched 40× to 160k", part(ctx, "context.stretched")?.v?.f === "40" && part(ctx, "context.max")?.v?.s === "160k");
  const ex = ans(r, "experts");
  check("256 routed + one shared expert, 8 per token", has(ex, "experts.routedShared1") && part(ex, "experts.routedShared1")?.v?.k === "8");
  check("num_key_value_heads row says it does not size an MLA cache", r.fields.find((f) => f.path === "num_key_value_heads")?.note === "mlaKv");
  check("intermediate_size row says it is the dense layers' width", r.fields.find((f) => f.path === "intermediate_size")?.note === "denseOnlyFfn");
  check("first 3 layers dense", part(ex, "experts.firstDense")?.v?.k === "3");
  const prec = ans(r, "precision");
  check("FP8 in 128×128 blocks, dynamic activations", part(prec, "precision.q.fp8Block")?.v?.block === "128×128" && has(prec, "precision.actDynamic"));
  check("ships custom code: remote-code warning", has(ans(r, "load"), "load.remote") && ans(r, "load").tone === "warn");
}

console.log("\n--- gpt-oss-20b: MXFP4 and a sliding window on half the layers ---");
{
  const r = explainConfig({ cfg: load("openai_gpt-oss-20b"), lang: "en", numParams: 21.51e9 });
  const ctx = ans(r, "context");
  check("12 of 24 layers use the 128-token window", part(ctx, "context.windowSome")?.v?.s === "12" && part(ctx, "context.windowSome")?.v?.w === "128");
  check("YaRN 4k × 32 = 128k", part(ctx, "context.w.stretch")?.v?.n === "131,072");
  check("KV answer flags the window as not modelled", has(ans(r, "kvcache"), "kv.window") && ans(r, "kvcache").tone === "warn");
  check("MXFP4 with 4 module groups kept", part(ans(r, "precision"), "precision.q.fp4")?.v?.kept === 4);
  check("experts_per_token spelling still read: 4 of 32", part(ans(r, "kind"), "kind.moe")?.v?.k === "4");
  check("not a hybrid: sliding layers are still attention", !ans(r, "kind").parts.some((p) => p.k.startsWith("kind.hybrid")));
}

console.log("\n--- Llama 3.1 8B: Llama 3 RoPE scaling ---");
{
  const r = explainConfig({ cfg: load("unsloth_Llama-3.1-8B-Instruct"), lang: "en", numParams: 8.03e9 });
  // Llama 3 scaling does not multiply out: 8,192 × 8 = 65,536, yet the config declares 131,072.
  check("Llama 3 scaling: names 8k and ×8 without multiplying them", part(ans(r, "context"), "context.scaledFrom")?.v?.orig === "8k"
    && !part(ans(r, "context"), "context.w.stretch") && !part(ans(r, "context"), "context.stretched"));
  check("32 query heads share 8 KV heads (4:1)", part(ans(r, "attention"), "attn.gqa")?.v?.r === "4");
  check("untied embeddings", has(ans(r, "vocab"), "vocab.untied"));
  check("unsloth_fixed is recognised as a marker", lookupField("", "unsloth_fixed")?.match === "pattern");
}

console.log("\n--- Gemma 3 27B: language model under text_config ---");
{
  const r = explainConfig({ cfg: load("unsloth_gemma-3-27b-it"), lang: "en", numParams: 27.43e9 });
  check("reads the language model from text_config", r.prefix === "text_config." && r.arch?.numLayers === 62);
  check("cites text_config paths", ans(r, "kvcache").cites.every((c) => c.startsWith("text_config.")));
  check("vision encoder noticed", has(ans(r, "kind"), "kind.vision"));
  // sliding_window_pattern 6: one global layer in six, so 10 global and 52 local.
  check("52 of 62 layers slide over 1,024 tokens", part(ans(r, "context"), "context.windowSome")?.v?.s === "52");
  check("vision_config fields land in the vision group", r.fields.filter((f) => f.path.startsWith("vision_config.")).every((f) => f.group === "vision"));
}

console.log("\n--- hybrids: Qwen3-Next, Granite 4.0-H, Nemotron-H ---");
{
  const next = explainConfig({ cfg: load("Qwen_Qwen3-Next-80B-A3B-Instruct"), lang: "en", numParams: 81.3e9 });
  // full_attention_interval 4 over 48 layers.
  check("Qwen3-Next: 12 of 48 layers are full attention", part(ans(next, "kind"), "kind.hybrid.linear")?.v?.a === "12");
  check("its KV figure is re-counted over those 12", part(ans(next, "kvcache"), "kv.hybrid")?.v?.a === "12");
  const granite = explainConfig({ cfg: load("ibm-granite_granite-4.0-h-small"), lang: "en", numParams: 32.2e9 });
  check("Granite: 4 of 40 layers are attention, the rest Mamba", part(ans(granite, "kind"), "kind.hybrid.mamba")?.v?.a === "4");
  const nemo = explainConfig({ cfg: load("nvidia_NVIDIA-Nemotron-Nano-9B-v2"), lang: "en", numParams: 8.89e9 });
  check("Nemotron-H: 4 attention layers in its pattern", part(ans(nemo, "kind"), "kind.hybrid.mamba")?.v?.a === "4");
  check("mamba_* fields grouped as state-space settings", nemo.fields.filter((f) => f.key.startsWith("mamba_")).every((f) => f.group === "hybrid"));
}

console.log("\n--- quantized repos and older spellings ---");
{
  const awq = explainConfig({ cfg: load("Qwen_Qwen2.5-7B-Instruct-AWQ"), lang: "en" });
  const q = part(ans(awq, "precision"), "precision.q.group");
  check("AWQ: 4-bit, groups of 128", q?.v?.bits === 4 && q?.v?.g === 128 && q?.v?.m === "AWQ");
  const ct = explainConfig({ cfg: load("RedHatAI_Qwen3-8B-FP8-dynamic"), lang: "en" });
  const w8a8 = part(ans(ct, "precision"), "precision.q.ctWA");
  check("compressed-tensors: FP8 weights and FP8 dynamic activations", w8a8?.v?.w === "FP8" && w8a8?.v?.a === "FP8" && has(ans(ct, "precision"), "precision.actDynamic"));
  const qwen25 = explainConfig({ cfg: load("Qwen_Qwen2.5-7B-Instruct"), lang: "en" });
  check("Qwen2.5: a sliding window that is switched off is not reported", !ans(qwen25, "context").parts.some((p) => p.k.startsWith("context.window")));
  check("…and its sliding_window row says it is off", qwen25.fields.find((f) => f.path === "sliding_window")?.note === "windowOff");
  const phi = explainConfig({ cfg: load("microsoft_Phi-3-mini-4k-instruct"), lang: "en" });
  check("Phi-3: auto_map means remote code", has(ans(phi, "load"), "load.remote"));
  check("Phi-3: 32 heads each with their own KV (MHA)", has(ans(phi, "attention"), "attn.mha"));
  const gpt2 = explainConfig({ cfg: load("openai-community_gpt2"), lang: "en", numParams: 137e6 });
  check("GPT-2 spellings resolve: n_layer, n_embd, n_head, n_positions",
    ["n_layer", "n_embd", "n_head", "n_positions"].every((k) => gpt2.fields.find((f) => f.key === k)?.match === "exact"));
  check("GPT-2: summary_* read as classification-head settings", gpt2.fields.filter((f) => f.key.startsWith("summary_")).every((f) => f.rel === "training"));
  const vl = explainConfig({ cfg: load("Qwen_Qwen2.5-VL-7B-Instruct"), lang: "en" });
  check("Qwen2.5-VL: M-RoPE explained", has(ans(vl, "context"), "context.mrope"));
}

console.log("\n--- cases the source check raised ---");
{
  const base = { architectures: ["X"], num_hidden_layers: 16, hidden_size: 2048, num_attention_heads: 32, num_key_value_heads: 8, vocab_size: 65536, max_position_embeddings: 131072 };
  // GPTQ's group_size -1 is one scale per output channel (TheBloke/Llama-2-70B-GPTQ).
  const gptq = explainConfig({ cfg: { ...base, quantization_config: { quant_method: "gptq", bits: 4, group_size: -1 } }, lang: "en" });
  check("GPTQ group_size -1 reads as per-channel, never 'every -1 weights'", has(ans(gptq, "precision"), "precision.q.channel"));
  const mlx = explainConfig({ cfg: { ...base, quantization_config: { bits: 4, group_size: 64 } }, lang: "en" });
  check("an MLX config with only bits and group_size is not 'quantized with ?'", has(ans(mlx, "precision"), "precision.q.groupPlain"));
  // Phi-3.5-mini: sliding_window 262144 over a 131072-token context can never bind.
  const phi35 = explainConfig({ cfg: { ...base, sliding_window: 262144 }, lang: "en" });
  check("a window longer than the context is not reported", !ans(phi35, "context").parts.some((p) => p.k.startsWith("context.window")) && !has(ans(phi35, "kvcache"), "kv.window"));
  // LFM2 lists its attention layers; the rest are convolutions.
  const lfm2 = explainConfig({ cfg: { ...base, full_attn_idxs: [2, 5, 8, 10, 12, 14] }, lang: "en" });
  check("LFM2: 6 of 16 layers are attention", part(ans(lfm2, "kind"), "kind.hybrid.linear")?.v?.a === "6");
  const v5 = explainConfig({ cfg: { ...base, layers_block_type: ["mamba", "moe", "mamba", "attention", "mamba", "moe"] }, lang: "en" });
  check("Nemotron-H re-saved by v5: moe entries are not counted as attention", part(ans(v5, "kind"), "kind.hybrid.mamba")?.v?.a === "1");
  const rope5 = explainConfig({ cfg: { ...base, rope_parameters: { rope_type: "yarn", factor: 4, original_max_position_embeddings: 32768, rope_theta: 1000000 } }, lang: "en" });
  check("Transformers v5 rope_parameters are read like rope_scaling", part(ans(rope5, "context"), "context.stretched")?.v?.f === "4");
  check("…and its children are explained", rope5.fields.find((f) => f.path === "rope_parameters.factor")?.match === "exact");
  const kv8 = explainConfig({ cfg: { ...base, quantization_config: { quant_method: "compressed-tensors", config_groups: { group_0: { weights: { num_bits: 8, type: "float" } } }, kv_cache_scheme: { num_bits: 8, type: "float" } } }, lang: "en" });
  check("the KV scheme sentence takes its bits from the file", part(ans(kv8, "precision"), "precision.kvScheme")?.v?.bits === 8);
  check("an FFN-width multiplier is not called a harmless constant", lookupField("", "block_ffn_dim_multiplier") === null && lookupField("", "embedding_multiplier")?.match === "pattern");
  // The portrait and the KV answer must agree on a hybrid.
  const next = explainConfig({ cfg: load("Qwen_Qwen3-Next-80B-A3B-Instruct"), lang: "en", numParams: 81.3e9 });
  check("Qwen3-Next: the portrait's cache matches the KV answer's hybrid figure",
    next.portrait.find((p) => p.k === "portrait.context")?.v?.b === part(ans(next, "kvcache"), "kv.hybrid")?.v?.b);
  // Nemotron-H is a dense hybrid: 4 attention layers among 56 — never "a 56-layer dense transformer".
  const nemo = explainConfig({ cfg: load("nvidia_NVIDIA-Nemotron-Nano-9B-v2"), lang: "en", numParams: 8.89e9 });
  check("Nemotron-H's portrait calls it a hybrid with 4 attention layers", nemo.portrait[0].k === "portrait.hybrid" && nemo.portrait[0].v?.a === "4");
}

console.log("\n--- the file as lines ---");
{
  const cfg = load("deepseek-ai_DeepSeek-V3");
  const lines = jsonLines(cfg);
  const parsed = JSON.parse(lines.map((l) => (l.key !== undefined ? `"${l.key}": ` : "") + l.text).join("\n"));
  check("the lines re-parse to the same config", JSON.stringify(parsed) === JSON.stringify(cfg));
  const factor = lines.find((l) => l.path === "rope_scaling.factor");
  check("a nested field keeps its full path", !!factor && factor.depth === 2);
  const block = lines.filter((l) => lineCited(l, ["rope_scaling"]));
  check("citing an object lights its whole block", block.length === Object.keys(cfg.rope_scaling).length + 2, String(block.length));
  check("citing a field does not light its neighbours", lines.filter((l) => lineCited(l, ["rope_theta"])).length === 1);
  check("arrays of plain values stay on one line", lines.filter((l) => l.path.startsWith("quantization_config.weight_block_size")).length === 1);
}

console.log("\n--- a gated repo, rebuilt from the database ---");
{
  const cfg = configFromArch({ numParams: 70.6e9, numLayers: 80, hiddenSize: 8192, numAttentionHeads: 64, numKeyValueHeads: 8, headDim: 128, vocabSize: 128256, maxContext: 131072 });
  const r = explainConfig({ cfg, lang: "en", numParams: 70.6e9, rebuilt: true, isMoE: false });
  check("answers still come out", ans(r, "kvcache").parts.length > 0 && ans(r, "attention").parts.length > 0);
  check("every rebuilt field is one the glossary explains", r.fields.every((f) => f.match === "exact"));
  check("with no class name to quote, the sentence does without one", has(ans(r, "kind"), "kind.denseUnnamed"));
  check("no precision, loading or training answer is made up for it",
    !r.answers.some((a) => a.id === "precision" || a.id === "load" || a.id === "training"));
  // DeepSeek-V3 rebuilt: the database knows it is MoE, the rebuilt fields do not.
  const ds = configFromArch({ numParams: 684.5e9, numLayers: 61, hiddenSize: 7168, intermediateSize: 18432, numAttentionHeads: 128, numKeyValueHeads: 128, kvLoraRank: 512, qkRopeHeadDim: 64, vocabSize: 129280, maxContext: 163840 });
  const dr = explainConfig({ cfg: ds, lang: "en", numParams: 684.5e9, rebuilt: true, isMoE: true });
  check("a rebuilt MoE is never called dense", !has(ans(dr, "experts"), "experts.none") && !has(ans(dr, "kind"), "kind.denseUnnamed") && dr.portrait[0].k === "portrait.moeUncounted");
  check("nor told its dense-layer width is its feed-forward width", !has(ans(dr, "size"), "size.ffn"));
  check("and cites no field it did not use", !ans(dr, "experts").cites.length && !ans(dr, "size").cites.includes("intermediate_size"));
  check("its intermediate_size row says the width's role is unknown", dr.fields.find((f) => f.path === "intermediate_size")?.note === "moeUnknownFfn");
}

console.log("\n--- numbers read the way each language writes them ---");
{
  check("131072 → 128k", shortTokens(131072, "en") === "128k");
  check("2047 → ≈2k", shortTokens(2047, "en") === "≈2k");
  const tr = explainConfig({ cfg: load("Qwen_Qwen3-32B"), lang: "tr", numParams: 32.76e9 });
  check("Turkish groups thousands with a dot", part(ans(tr, "attention"), "attn.headDimExplicit")?.v?.x === "8.192");
}

console.log("\n--- the glossary ---");
{
  const entries = [...Object.entries(GLOSSARY), ...PATTERNS.map((p, i) => [`pattern ${i}`, p.entry] as const)];
  const thin = entries.filter(([, e]) => !(e.title.en && e.title.tr && e.meaning.en && e.meaning.tr)).map(([k]) => k);
  check("every entry is written in both languages", thin.length === 0, thin.join(", ") || `${entries.length} entries`);
  const same = entries.filter(([, e]) => e.meaning.en === e.meaning.tr).map(([k]) => k);
  check("no Turkish meaning is a copy of the English", same.length === 0, same.join(", "));
  const orphans = Object.entries(ALIASES).filter(([, to]) => !(to in GLOSSARY)).map(([from]) => from);
  check("every alias points at an entry", orphans.length === 0, orphans.join(", "));
  check("every group is labelled in both languages", FIELD_GROUPS.every((g) => GROUP_LABEL[g]?.en && GROUP_LABEL[g]?.tr));
  // Across the fixtures, how much of what real configs carry the page can explain.
  const all = readdirSync(dir).filter((f) => f.endsWith(".json")).flatMap((f) => explainConfig({ cfg: load(f.slice(0, -5)), lang: "en" }).fields);
  const explained = all.filter((f) => f.match !== "none").length;
  check("explains at least 90% of the fields real configs carry", explained / all.length >= 0.9, `${explained} of ${all.length}`);
}

console.log("\n--- every sentence the engine can produce exists in both dictionaries ---");
{
  const keys = new Set<string>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    for (const lang of ["en", "tr"] as const) {
      const r = explainConfig({ cfg: load(f.slice(0, -5)), lang, numParams: 7e9 });
      for (const a of r.answers) {
        keys.add(`config.q.${a.id}`);
        for (const p of [...a.parts, ...a.working]) keys.add(`config.a.${p.k}`);
      }
      for (const p of r.portrait) keys.add(`config.a.${p.k}`);
    }
  }
  const missing = [...keys].filter((k) => !(k in DICTS.en) || !(k in DICTS.tr));
  check("no answer points at a missing template", missing.length === 0, missing.join(", ") || `${keys.size} templates`);
  // Every template the engine names in source, not only the ones these fixtures reach.
  const src = readFileSync(new URL("../src/lib/configExplain.ts", import.meta.url), "utf8");
  const named = [...src.matchAll(/k: "([a-zA-Z.]+)"/g)].map((m) => `config.a.${m[1]}`);
  const unwritten = named.filter((k) => !(k in DICTS.en) || !(k in DICTS.tr));
  check("every template named in the engine is written", unwritten.length === 0, unwritten.join(", "));
  // And no filled sentence is left with a {placeholder} the engine forgot to supply.
  const r = explainConfig({ cfg: load("deepseek-ai_DeepSeek-V3"), lang: "tr", numParams: 684.5e9 });
  const unfilled = r.answers.flatMap((a) => [...a.parts, ...a.working]).map((p) => fill("tr", p)).filter((s) => /\{[a-z]+\}/i.test(s));
  check("no sentence keeps an unfilled placeholder", unfilled.length === 0, unfilled.join(" | "));
}

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
