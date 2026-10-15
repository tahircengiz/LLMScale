// The phase-2 fixes from the 2026-10-15 data audit
// (docs/audit-2026-10-15-veri-guvenilirligi.md): architectures the sizing did not
// follow, each checked against what the audit measured from vLLM 0.31.0's own
// rules (docs/audit-2026-10-15/kv-vllm-tablolari.md) and the configs as published.
// Run: node scripts/test-audit2.ts
import { readFileSync } from "node:fs";
import { BYTES_PER_GIB, calculate, kvBytesPerToken, kvReservedPerSeq, type ModelArch } from "../src/lib/calc.ts";
import { archFromConfig, parseConfigJson } from "../src/lib/hf.ts";
import { ssmStateBytes, unmodelledCacheKeys } from "../src/lib/layers.ts";
import { overheadPerGpu } from "../src/lib/overhead.ts";
import { decodeState, DEFAULT_STATE, encodeState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const cfg = (n: string) => parseConfigJson(readFileSync(new URL(`./fixtures/configs-audit/${n}.json`, import.meta.url), "utf8"));
const gib = (b: number) => b / BYTES_PER_GIB;
/** vLLM's reservation for one request, in GiB, against the audit's figure to its 3 decimals. */
function reserved(name: string, arch: ModelArch, rows: [ctx: number, batch: number, vllm: number][]) {
  for (const [ctx, batch, vllm] of rows) {
    const ours = gib(kvReservedPerSeq(arch, "bf16", ctx, batch));
    check(`${name} at ${ctx / 1024}k, ${batch}-token batches: ${vllm.toFixed(3)} GiB`, Math.abs(ours - vllm) < 0.0006, ours.toFixed(4));
  }
}

console.log("--- B1: Gemma 4 ---");
{
  const g31 = archFromConfig(cfg("google_gemma-4-31B-it"), 31.27e9)!;
  check("31B: 50 sliding layers, 10 global ones of 4 heads × 512", g31.slidingLayers === 50 && g31.attnLayers === undefined &&
    g31.globalAttn?.kvHeads === 4 && g31.globalAttn?.headDim === 512, JSON.stringify(g31.globalAttn));
  check("31B: 16 KiB a sliding token, 8 KiB a global one", kvBytesPerToken(g31, "bf16") === 50 * 16384 + 10 * 8192);
  // Before: 3.762, 8.918, 18.293, 23.918, 33.293 GiB (+9% to +72%).
  reserved("31B", g31, [[4096, 2048, 3.45], [32768, 2048, 6.418], [32768, 8192, 15.793], [131072, 2048, 13.918], [131072, 8192, 23.293]]);
  const g26 = archFromConfig(cfg("google_gemma-4-26B-A4B-it"), 25.81e9)!;
  reserved("26B-A4B", g26, [[4096, 2048, 0.862], [32768, 2048, 1.605], [32768, 8192, 3.948], [131072, 2048, 3.48], [131072, 8192, 5.823]]);
  check("26B-A4B: a MoE of 128 experts, 8 a token", g26.numExperts === 128 && g26.expertsPerToken === 8 && g26.moeIntermediateSize === 704);
  // Every unrouted expert's three 2,816 × 704 projections, in 30 layers.
  const active = 25.81e9 - 120 * 3 * 2816 * 704 * 30;
  check("26B-A4B: about 4.4B active, not dense", g26.activeParams === active, `${(g26.activeParams! / 1e9).toFixed(2)}B`);
  const g12 = archFromConfig(cfg("google_gemma-4-12B-it"), 12e9)!;
  check("12B: one global KV head of 512", g12.globalAttn?.kvHeads === 1 && g12.globalAttn?.headDim === 512);
  reserved("12B", g12, [[4096, 2048, 1.317], [32768, 2048, 2.067], [32768, 8192, 5.817], [131072, 2048, 3.567], [131072, 8192, 7.317]]);
  const e2b = archFromConfig(cfg("google_gemma-4-E2B-it"), 5.1e9)!;
  check("E2B: the last 20 of 35 layers keep no cache", e2b.attnLayers === 15 && e2b.slidingLayers === 12, `${e2b.attnLayers} own, ${e2b.slidingLayers} sliding`);
  check("E2B: without attention_k_eq_v the global layers keep their 1 KV head", e2b.globalAttn?.kvHeads === 1 && e2b.globalAttn?.headDim === 512);
  reserved("E2B", e2b, [[4096, 2048, 0.071], [32768, 2048, 0.241], [32768, 8192, 0.381], [131072, 2048, 0.803], [131072, 8192, 0.944]]);
  const e4b = archFromConfig(cfg("google_gemma-4-E4B-it"), 8e9)!;
  check("E4B: the last 18 of 42 layers keep no cache", e4b.attnLayers === 24 && e4b.slidingLayers === 20);
  reserved("E4B", e4b, [[4096, 2048, 0.22], [32768, 2048, 0.677], [32768, 8192, 1.146], [131072, 2048, 2.177], [131072, 8192, 2.646]]);
  check("no Gemma 4 key is flagged as unmodelled any more", [g31, g26, g12, e2b, e4b].every((a) => !a.unmodelled), JSON.stringify(g31.unmodelled));

  // Tensor parallelism splits each kind by its own heads: at TP 8 the sliding
  // layers hold 2 of 16 heads per GPU, the global layers one of 4, replicated.
  const tp8 = kvReservedPerSeq(g31, "bf16", 131072, 2048, 8);
  // Pages equal at 16 tokens (2 heads × 256 = 1 head × 512): 5 sliding groups of 321
  // blocks and one global group of 8,192, 10 layers each, 32 KiB a page.
  const want = (5 * 321 + 8192) * 10 * 16 * (2 * 2 * 256 * 2);
  check("31B at TP 8: each GPU holds a global head whole", tp8 === want, `${gib(tp8).toFixed(3)} GiB, not ${(13.918 / 8).toFixed(3)}`);
  const c8 = calculate({ arch: g31, weightDtype: "bf16", kvDtype: "bf16", contextLength: 131072, concurrency: 1, gpus: 8 });
  const sum = c8.weightsGiB / 8 + gib(tp8) + overheadPerGpu(g31, c8.batch, 8).totalGiB;
  check("…and the per-GPU sum carries it", Math.abs(c8.perGpuGiB - sum) < 1e-9, `${c8.perGpuGiB.toFixed(3)} vs ${sum.toFixed(3)}`);
  const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: g31 }));
  check("a link keeps the global layers' shape", JSON.stringify(back.arch?.globalAttn) === JSON.stringify(g31.globalAttn));
  check("…and its reservation", !!back.arch && kvReservedPerSeq(back.arch, "bf16", 131072) === kvReservedPerSeq(g31, "bf16", 131072));
  check("a plain Gemma 3 has no global shape", unmodelledCacheKeys({ model_type: "gemma3_text", head_dim: 128 }).length === 0 &&
    archFromConfig({ model_type: "gemma3_text", num_hidden_layers: 26, hidden_size: 1152, num_attention_heads: 4, num_key_value_heads: 1, head_dim: 256, global_head_dim: 512 }, 1e9)!.globalAttn === undefined);
}

console.log("\n--- B3: Nemotron NAS ---");
{
  const s49 = archFromConfig(cfg("nvidia_Llama-3_3-Nemotron-Super-49B-v1_5"), 49.87e9)!;
  check("Super-49B v1.5: 49 attention layers of 8 KV heads, 31 with none", s49.attnLayers === 49 && s49.numKeyValueHeads === 8, `${s49.attnLayers} × ${s49.numKeyValueHeads}`);
  const at32 = gib(kvReservedPerSeq(s49, "bf16", 32768));
  // Before: 80 layers × 64 heads, 80 GiB at 32k.
  check("…6.125 GiB at 32k, not 80", at32 === 6.125, at32.toFixed(3));
  check("its MLP width is the widest block's (ffn_mult 5.25 → 28,672)", s49.intermediateSize === 28672, String(s49.intermediateSize));
  check("nothing flagged, and vLLM loads it", !s49.unmodelled && !s49.notInVllm, JSON.stringify(s49.unmodelled));
  const n51 = archFromConfig(cfg("nvidia_Llama-3_1-Nemotron-51B-Instruct"), 51.5e9)!;
  // 44 blocks of 8 KV heads, 6 of 2, 3 of 1, 1 of 4: 371 heads, as 46.375 layers of 8.
  check("51B: its blocks' heads add up to 371", n51.numKeyValueHeads === 8 && n51.attnLayers === 46.375 && kvBytesPerToken(n51, "bf16") === 371 * 2 * 128 * 2,
    `${n51.attnLayers} layers × 8`);
  check("51B: vLLM 0.31 cannot build its linear blocks", n51.notInVllm?.linear === true && n51.notInVllm.arch === "DeciLMForCausalLM");
  const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: n51 }));
  check("a link keeps the layer count and the warning", back.arch?.attnLayers === 46.375 && JSON.stringify(back.arch?.notInVllm) === JSON.stringify(n51.notInVllm));
}

console.log("\n--- C1: a float32 recurrent state ---");
{
  // [config, parameters, vLLM's reservation at 4k, 32k and 128k (the 8B reads 8k)]; before
  // the fix the app was 28–40% short at 4k, as the audit measured.
  const models: [string, number, number[]][] = [
    ["Qwen_Qwen3.5-27B", 27.8e9, [0.574, 2.297, 8.326]],
    ["Qwen_Qwen3.5-35B-A3B", 35.95e9, [0.201, 0.765, 2.639]],
    ["Qwen_Qwen3.5-397B-A17B", 397e9, [0.48, 1.319, 4.138]],
    ["nvidia_NVIDIA-Nemotron-3-Nano-30B-A3B-BF16", 31.6e9, [0.12, 0.288, 0.852]],
    ["nvidia_NVIDIA-Nemotron-Nano-12B-v2", 12.3e9, [0.42, 1.051, 3.303]],
    ["nvidia_NVIDIA-Nemotron-Nano-9B-v2", 8.9e9, [0.36, 0.781, 2.282]],
    ["nvidia_Nemotron-H-8B-Base-8K", 8.1e9, [0.254]],
  ];
  for (const [name, params, vllm] of models) {
    const a = archFromConfig(cfg(name), params)!;
    reserved(name, a, vllm.map((v, i) => [[4096, 32768, 131072][i], 2048, v] as [number, number, number]));
    check(`${name}: nothing flagged`, !a.unmodelled, JSON.stringify(a.unmodelled));
  }
  const q = cfg("Qwen_Qwen3.5-27B").text_config;
  check("Qwen3.5: 16-bit when the config does not ask for float32", ssmStateBytes({ ...q, mamba_ssm_dtype: undefined }) === 2 && ssmStateBytes(q) === 4);
  check("Nemotron-H: float32 unless its config says otherwise", ssmStateBytes({ model_type: "nemotron_h" }) === 4 && ssmStateBytes({ model_type: "nemotron_h", mamba_ssm_cache_dtype: "bfloat16" }) === 2);
  check("Granite 4.0-H and Qwen3-Next keep the model's dtype", ssmStateBytes({ model_type: "granitemoehybrid", mamba_ssm_dtype: "float32" }) === 2 && ssmStateBytes({ model_type: "qwen3_next" }) === 2);
}

console.log("\n--- B5: hybrid and local layouts ---");
{
  // Jamba: an attention layer every 8 (every 14 in the 3B), Mamba v1 elsewhere, its
  // state 16-bit. Before: every layer as attention, 5–12x the cache.
  const jamba = archFromConfig(cfg("ai21labs_Jamba-v0.1"), 51.6e9)!;
  check("Jamba v0.1: 4 attention layers, 28 Mamba states of 8,192 × (3 + 16)", jamba.attnLayers === 4 && jamba.stateLayers === 28 &&
    jamba.stateBytesPerSeq === 28 * 8192 * (3 + 16) * 2, `${jamba.attnLayers} · ${jamba.stateLayers}`);
  reserved("Jamba v0.1", jamba, [[4096, 2048, 0.081], [32768, 2048, 0.518], [131072, 2048, 2.018]]);
  const j3 = archFromConfig(cfg("ai21labs_AI21-Jamba-Reasoning-3B"), 3.2e9)!;
  reserved("Jamba Reasoning 3B", j3, [[4096, 2048, 0.014], [32768, 2048, 0.041], [131072, 2048, 0.135]]);
  // Falcon-H1: attention and Mamba2 in all 44 (72) layers. Before: no state, 48% short at 4k.
  const f7 = archFromConfig(cfg("tiiuae_Falcon-H1-7B-Instruct"), 7.6e9)!;
  check("Falcon-H1 7B: attention and a Mamba2 state in each of 44 layers", (f7.attnLayers ?? f7.numLayers) === 44 && f7.stateLayers === 44);
  reserved("Falcon-H1 7B", f7, [[4096, 2048, 0.329], [32768, 2048, 1.513], [131072, 2048, 5.658]]);
  const f34 = archFromConfig(cfg("tiiuae_Falcon-H1-34B-Instruct"), 34e9)!;
  reserved("Falcon-H1 34B", f34, [[4096, 2048, 0.857], [32768, 2048, 4.856], [131072, 2048, 18.424]]);

  // Kimi-Linear: 7 MLA layers, 20 KDA layers whose 32 × 128² state is float32. Under
  // MLA a hybrid's block is a multiple of 128 tokens: 1,920 holds a 2.07 MiB state.
  const kimi = archFromConfig(cfg("moonshotai_Kimi-Linear-48B-A3B-Instruct"), 49.1e9)!;
  const kda = 32 * 128 * 3 * 3 * 2 + 32 * 128 * 128 * 4;
  check("Kimi-Linear: 7 MLA layers, 20 KDA states of 2.07 MiB", kimi.attnLayers === 7 && kimi.stateLayers === 20 && kimi.stateBytesPerSeq === 20 * kda);
  const kimiPage = 1920 * 576 * 2;
  check("…at 4k: 3 attention blocks and 3 × 2 state blocks, 7 layers each", kvReservedPerSeq(kimi, "bf16", 4096) === (3 + 6) * 7 * kimiPage,
    `${gib(kvReservedPerSeq(kimi, "bf16", 4096)).toFixed(3)} GiB; before ${(4096 * 27 * 2 * 32 * 72 * 2 / BYTES_PER_GIB).toFixed(3)}`);
  check("Kimi-Linear reads 1,048,576 tokens (model_max_length)", kimi.maxContext === 1048576);

  // GLM-5.3-Flash: its KDA state (64 × 128², float32: 4.1 MiB) is padded to the MLA
  // page, so a block holds 4,352 tokens; each block spans 11 latent and 11 pooled
  // indexer pages; a request takes the context's blocks, one tail block and 2 for
  // each of 4 KDA groups.
  const glm = archFromConfig(cfg("zai-org_GLM-5.3-Flash"), 321e9)!;
  const perBlock = 11 * 4352 * 1024 + 11 * (4352 / 4) * 132;
  const glmAt = (ctx: number) => (Math.ceil(ctx / 4352) + 1 + 8) * perBlock;
  check("GLM-5.3-Flash at 4k: 10 blocks of 48.3 MiB", kvReservedPerSeq(glm, "bf16", 4096) === glmAt(4096), `${gib(glmAt(4096)).toFixed(3)} GiB`);
  check("…at 128k: 40 blocks", kvReservedPerSeq(glm, "bf16", 131072) === glmAt(131072), `${gib(glmAt(131072)).toFixed(3)} GiB`);
  check("…smaller blocks as tensor parallelism splits the state", kvReservedPerSeq(glm, "bf16", 4096, 2048, 8) < kvReservedPerSeq(glm, "bf16", 4096));

  // MiMo-V2: no layer_types, so vLLM's 128-token window reaches all 48 layers; the 39
  // sliding ones keep 8 heads, the 9 global ones 4, keys 192 and values 128 wide.
  const mimo = archFromConfig(cfg("XiaomiMiMo_MiMo-V2-Flash"), 309.8e9)!;
  const sum = 39 * 8 * (192 + 128) * 2 + 9 * 4 * (192 + 128) * 2;
  check("MiMo-V2-Flash: 218 KiB a token across its layers", kvBytesPerToken(mimo, "bf16") === sum, `${kvBytesPerToken(mimo, "bf16")} vs ${sum}`);
  check("…every layer kept to the window: 265 blocks at any long context", kvReservedPerSeq(mimo, "bf16", 131072) === 265 * 16 * sum &&
    kvReservedPerSeq(mimo, "bf16", 1048576) === 265 * 16 * sum, `${gib(265 * 16 * sum).toFixed(3)} GiB`);

  // MiniMax-Text-01: 10 softmax layers, 70 lightning ones with a 64 × 128² state. vLLM
  // 0.31 does not load it (B15); this is how the model caches.
  const mm = archFromConfig(cfg("MiniMaxAI_MiniMax-Text-01"), 456e9)!;
  check("MiniMax-Text-01: 10 attention layers, 70 states of 2 MiB", mm.attnLayers === 10 && mm.stateBytesPerSeq === 70 * 64 * 128 * 128 * 2);
  check("…and flagged as not loaded by vLLM 0.31", mm.notInVllm?.until === "0.23.0");
  check("…0.43 GiB a request at 4k, not 1.25", kvReservedPerSeq(mm, "bf16", 4096) === (8 + 14) * 10 * 2 * 1024 ** 2, gib(kvReservedPerSeq(mm, "bf16", 4096)).toFixed(3));

  // Gemma 3n E4B: the last 15 of 35 layers reuse a cache; of the first 20, 16 slide.
  const g3n = archFromConfig(cfg("unsloth_gemma-3n-E4B-it"), 7.85e9)!;
  check("Gemma 3n E4B: 20 layers keep a cache, 16 of them sliding", g3n.attnLayers === 20 && g3n.slidingLayers === 16);
  check("…and its per-layer FFN widths are no longer NaN", g3n.intermediateSize === 16384);
  check("…1,284 blocks of 4 layers at 4k", kvReservedPerSeq(g3n, "bf16", 4096) === (4 * 257 + 256) * 4 * 16 * 2048);

  // Llama 3.2 Vision: 32 self-attention layers; 8 cross-attention layers keep one
  // image, 4 tiles of 1,601 patches. vLLM 0.31 does not load it.
  const ml = archFromConfig(cfg("unsloth_Llama-3.2-11B-Vision-Instruct"), 10.67e9)!;
  check("mllama: 32 self-attention layers, 8 holding 6,404 image tokens", ml.attnLayers === 32 && ml.crossAttn?.layers === 8 && ml.crossAttn.tokens === 6404);
  check("…the image's cache is fixed", kvReservedPerSeq(ml, "bf16", 8192) - kvReservedPerSeq(ml, "bf16", 4096) === 32 * 4096 * 4096);
  check("no hybrid is flagged as unmodelled", [jamba, j3, f7, f34, kimi, glm, mimo, mm, g3n, ml].every((a) => !a.unmodelled));
  for (const [name, a] of [["Jamba", jamba], ["Kimi-Linear", kimi], ["GLM-5.3-Flash", glm], ["MiMo-V2", mimo], ["mllama", ml]] as const) {
    const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: a }))!.arch!;
    check(`${name}: a link keeps the reservation`, kvReservedPerSeq(back, "bf16", 32768) === kvReservedPerSeq(a, "bf16", 32768),
      `${kvReservedPerSeq(back, "bf16", 32768)} vs ${kvReservedPerSeq(a, "bf16", 32768)}`);
  }
}

console.log("\n--- B15: models vLLM 0.31 does not load ---");
{
  const mllama = archFromConfig({ architectures: ["MllamaForConditionalGeneration"], text_config: { num_hidden_layers: 40, hidden_size: 4096, num_attention_heads: 32, num_key_value_heads: 8 } }, 10.6e9)!;
  check("Llama 3.2 Vision: dropped after v0.10.2", mllama.notInVllm?.until === "0.10.2");
  const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: mllama }));
  check("…and a link keeps it", back.arch?.notInVllm?.until === "0.10.2" && back.arch.notInVllm.arch === "MllamaForConditionalGeneration");
  check("a Llama loads", !archFromConfig({ architectures: ["LlamaForCausalLM"], num_hidden_layers: 32, hidden_size: 4096, num_attention_heads: 32 }, 8e9)!.notInVllm);
  check("a forged value is dropped", decodeState("p=1e9&L=4&h=512&a=8&k=8&nv=%3Cscript%3E").arch?.notInVllm === undefined);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
