// The phase-2 fixes from the 2026-10-15 data audit
// (docs/audit-2026-10-15-veri-guvenilirligi.md): architectures the sizing did not
// follow, each checked against what the audit measured from vLLM 0.31.0's own
// rules (docs/audit-2026-10-15/kv-vllm-tablolari.md) and the configs as published.
// Run: node scripts/test-audit2.ts
import { readFileSync } from "node:fs";
import { BYTES_PER_GIB, calculate, expertWeightBytes, kvBytesPerSeq, kvBytesPerToken, kvReservedPerSeq, weightsBytes, type ModelArch } from "../src/lib/calc.ts";
import { compareLog } from "../src/lib/vllmLog.ts";
import { archFromConfig, mirrorIds, paramsFromName, parseConfigJson, placeholderArch, resolveModel, unpackedParams } from "../src/lib/hf.ts";
import { batchFor, GPUS } from "../src/lib/gpus.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";
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
const kvBytesPerSeqOf = (a: ModelArch, ctx: number) => kvBytesPerSeq(a, "bf16", ctx);
const b2 = (n: number | undefined) => `${((n ?? 0) / 1e9).toFixed(2)}B`;
const near = (a: number | undefined, lo: number, hi: number) => !!a && a >= lo && a <= hi;
/** vLLM's reservation for one request, in GiB, against the audit's figure to its 3 decimals. */
function reserved(name: string, arch: ModelArch, rows: [ctx: number, batch: number, vllm: number][]) {
  for (const [ctx, batch, vllm] of rows) {
    const ours = gib(kvReservedPerSeq(arch, "bf16", ctx, batch));
    check(`${name} at ${ctx / 1024}k, ${batch}-token batches: ${vllm.toFixed(3)} GiB`, Math.abs(ours - vllm) < 0.0006, ours.toFixed(4));
  }
}

/** resolveModel against the Hub's own answers for the repos in
 *  fixtures/configs-audit (fetched 2026-10-15): the API's record under api/, the
 *  config at the top, anything else a 404 — which is also what a gated repo's
 *  config gives a browser. Returns the real fetch, to put back. */
function mockHub(): typeof fetch {
  const real = globalThis.fetch;
  const file = (n: string) => new URL(`./fixtures/configs-audit/${n}`, import.meta.url);
  globalThis.fetch = (async (input: string | URL) => {
    const url = String(input);
    const api = /\/api\/models\/([^?]+)/.exec(url);
    const raw = /huggingface\.co\/([^/]+\/[^/]+)\/resolve\/main\/(.+)$/.exec(url);
    const name = (id: string) => id.replace("/", "_");
    try {
      if (api) return new Response(readFileSync(file(`api/${name(api[1])}.json`), "utf8"), { status: 200 });
      if (raw && raw[2] === "config.json") return new Response(readFileSync(file(`${name(raw[1])}.json`), "utf8"), { status: 200 });
      if (raw) return new Response(readFileSync(file(`api/${name(raw[1])}.${raw[2]}`), "utf8"), { status: 200 });
    } catch {
      // not in the fixtures
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
  return real;
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

console.log("\n--- D3: active parameters ---");
{
  const active = (name: string, params: number) => archFromConfig(cfg(name), params)!;
  const b = b2;
  // Before: no top-k key read, so Hunyuan counted all 80.4B and ERNIE read as dense.
  const hy = active("tencent_Hunyuan-A13B-Instruct", 80.39e9);
  check("Hunyuan-A13B: moe_topk 8 of 64, about 13B active", hy.expertsPerToken === 8 && near(hy.activeParams, 12.5e9, 13.5e9), b(hy.activeParams));
  check("…its unrouted experts' three 4,096 × 3,072 projections in 32 layers", hy.activeParams === 80.39e9 - 56 * 3 * 4096 * 3072 * 32);
  const e21 = active("baidu_ERNIE-4.5-21B-A3B-PT", 21.95e9);
  check("ERNIE 4.5 21B-A3B: moe_k 6 of 64 in layers 1–27, about 3B active", e21.expertsPerToken === 6 && near(e21.activeParams, 2.6e9, 3.4e9), b(e21.activeParams));
  const e300 = active("baidu_ERNIE-4.5-300B-A47B-PT", 300.47e9);
  // ERNIE's MTP layer is a dense Llama layer (vllm ernie_mtp.py), not one with experts.
  check("ERNIE 4.5 300B-A47B: about 47B active", near(e300.activeParams, 46e9, 49e9), b(e300.activeParams));
  // The speculative layers are left out whole: V4-Flash-0731's three DSpark layers
  // made it 27.4B active, where its card says about 13B.
  const v4 = archFromConfig(parseConfigJson(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V4-Flash-0731.json", import.meta.url), "utf8")), 304.18e9)!;
  check("DeepSeek-V4-Flash-0731: about 13–14B active, not 27.4", near(v4.activeParams, 12.5e9, 14.5e9), b(v4.activeParams));
  check("…its three draft layers, about 20B, out of the weights", near(v4.specParams, 19e9, 21e9), b(v4.specParams));
  const v4a = active("deepseek-ai_DeepSeek-V4-Flash", 290.94e9);
  check("the first V4-Flash, one MTP layer: the same active count", Math.abs(v4a.activeParams! - v4.activeParams!) < 0.3e9, `${b(v4a.activeParams)} vs ${b(v4.activeParams)}`);
  // Qwen3.8-Flash-Next: a 51.2B n-gram table a token reads 16 rows of.
  const q38 = active("Qwen_Qwen3.8-Flash-Next", 180e9);
  check("Qwen3.8-Flash-Next: the n-gram table is held, not read", q38.lookupParams === 20e6 * 2560, b(q38.lookupParams));
  check("…about 8B active with the embeddings, not 61.6", near(q38.activeParams, 7e9, 9e9), b(q38.activeParams));
  const kimi = active("moonshotai_Kimi-Linear-48B-A3B-Instruct", 49.12e9);
  check("Kimi-Linear: num_experts_per_token 8 of 256, about 3.5B active", kimi.expertsPerToken === 8 && near(kimi.activeParams, 3.3e9, 3.7e9), b(kimi.activeParams));
  const jamba = active("ai21labs_Jamba-v0.1", 51.6e9);
  check("Jamba v0.1: experts in every other layer, about 12B active", near(jamba.activeParams, 11.5e9, 12.5e9), b(jamba.activeParams));
  const e2b = active("google_gemma-4-E2B-it", 5.1e9);
  check("Gemma 4 E2B: its 2.35B per-layer embeddings are held, not read", e2b.lookupParams === 256 * 35 * 262144 && e2b.activeParams === 5.1e9 - 256 * 35 * 262144);
  // Expert parallelism spreads the routed experts only: not the n-gram table, not
  // the speculative layers vLLM leaves unloaded (review of phase 2).
  const share = expertWeightBytes(q38, "bf16") / weightsBytes(q38, "bf16");
  const routed = (180e9 - q38.specParams! - q38.lookupParams! - q38.activeParams!) * 512 / 502 / (180e9 - q38.specParams!);
  check("Qwen3.8-Flash-Next: the experts are 68% of its weights, not 98%", Math.abs(share - routed) < 1e-9 && share < 0.7, share.toFixed(3));
  const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: v4 }))!.arch!;
  check("a link keeps the speculative and lookup counts", back.specParams === Math.round(v4.specParams!) &&
    decodeState(encodeState({ ...DEFAULT_STATE, arch: q38 })).arch?.lookupParams === q38.lookupParams);
}

console.log("\n--- C6: speculative layers out of the weights ---");
{
  const v3 = archFromConfig(parseConfigJson(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V3.json", import.meta.url), "utf8")), 684.53e9)!;
  // One MTP layer of 62: (684.53B − 1.85B of embeddings) / 62.
  check("DeepSeek-V3: its MTP layer, about 11B, is not loaded", near(v3.specParams, 10.8e9, 11.2e9), `${((v3.specParams ?? 0) / 1e9).toFixed(2)}B`);
  check("…so FP8 weights are 11 GB lighter", Math.abs(weightsBytes({ ...v3, specParams: undefined }, "fp8") - weightsBytes(v3, "fp8") - v3.specParams!) < 1e6);
  const shipped = { ...v3, shipped: { dtype: "fp8" as const, bytes: 641.3 * BYTES_PER_GIB } };
  check("…and a shipped checkpoint's files by the same share", Math.abs(gib(weightsBytes(shipped, "fp8")) - 641.3 * (1 - v3.specParams! / 684.53e9)) < 1e-6,
    `${gib(weightsBytes(shipped, "fp8")).toFixed(1)} GiB of 641.3`);
  check("a model with no speculative layers is unchanged", archFromConfig({ num_hidden_layers: 32, hidden_size: 4096, num_attention_heads: 32 }, 8e9)!.specParams === undefined);
}

console.log("\n--- B7: mixed-precision and packed checkpoints ---");
{
  const real = mockHub();
  try {
    const nv = await resolveModel("nvidia/Qwen3.6-35B-A3B-NVFP4");
    // Before: FP8 from its first group, 18.7B parameters, BF16 34.8 GiB.
    check("nvidia Qwen3.6-35B-A3B-NVFP4: NVFP4, not FP8 from its first group", nv.weightDtype === "int4", String(nv.weightDtype));
    check("…35.95B parameters from its base model, not 18.7B packed", nv.numParams === 35951822704, b2(nv.numParams));
    check("…sized by its 21.8 GiB of files", Math.abs(gib(weightsBytes(nv.arch!, "int4")) - 21.82 * (1 - nv.arch!.specParams! / nv.numParams)) < 0.01, gib(weightsBytes(nv.arch!, "int4")).toFixed(2));
    check("…and active parameters counted from that total", (nv.arch!.activeParams ?? 0) > 2.9e9, b2(nv.arch!.activeParams));
    const rh = await resolveModel("RedHatAI/Llama-3.3-70B-Instruct-NVFP4");
    // Its base_model does not exist: the count comes from the stored elements.
    check("RedHatAI Llama-3.3-70B NVFP4: 70.55B unpacked from 34.2B U8, not 40.6B", rh.numParams === 34225520640 * 2 + 2102665216 + 1120, b2(rh.numParams));
    check("…its INT4 weights are its files", Math.abs(gib(weightsBytes(rh.arch!, "int4")) - 39.78) < 0.01);
    const cy = await resolveModel("cyankiwi/Qwen3-Coder-30B-A3B-Instruct-AWQ-4bit");
    // Before: 1.76B, counted from the 5.3B elements the Hub reports.
    check("Qwen3-Coder AWQ: 3.35B active, counted after the base model's total", cy.numParams === 30532122624 && Math.abs(cy.arch!.activeParams! - 3.353e9) < 0.01e9, b2(cy.arch!.activeParams));
  } finally {
    globalThis.fetch = real;
  }
  check("unpacking needs FP4's U8", unpackedParams({ I32: 3.7e9, BF16: 1.5e9 }) === undefined);
}

console.log("\n--- B6: gated models the app does not bundle ---");
{
  const real = mockHub();
  try {
    // Bundled now: Gemma 3 1B had been a 32-layer placeholder, 4.0 GiB at 32k.
    const g1 = await resolveModel("google/gemma-3-1b-it");
    check("Gemma 3 1B: its bundled entry, not a placeholder", g1.source === "bundled" && g1.arch?.numLayers === 26 && !g1.arch.placeholder);
    const was = 32 * 2 * 8 * 128 * 2 * 32768;
    check("…0.14 GiB of cache at 32k, not 4.0", gib(kvBytesPerSeqOf(g1.arch!, 32768)) < 0.14 && gib(was) === 4, `${gib(kvBytesPerSeqOf(g1.arch!, 32768)).toFixed(3)} GiB`);
    // A GGUF of a gated base: the base's bundled entry.
    const gguf = await resolveModel("bartowski/Llama-3.3-70B-Instruct-GGUF");
    check("bartowski's Llama 3.3 70B GGUF: the bundled Llama 3.3 70B", gguf.source === "bundled" && gguf.warningKey === "archFromBase" && gguf.arch?.numLayers === 80 && gguf.weightDtype === "int4",
      `${gguf.source}, ${gguf.arch?.numLayers} layers, ${gguf.weightDtype}`);
    // Not bundled and gated: Unsloth's public copy of the config (decision K15).
    const g3n = await resolveModel("google/gemma-3n-E4B-it");
    check("Gemma 3n E4B: read from unsloth/gemma-3n-E4B-it", g3n.source === "base" && g3n.warningKey === "archFromMirror" && g3n.mirror === "unsloth/gemma-3n-E4B-it",
      `${g3n.source} ${g3n.warningKey} ${g3n.mirror}`);
    check("…with its own 35 layers and the Hub's 7.85B", g3n.arch?.numLayers === 35 && g3n.numParams === 7849978192 && g3n.arch.attnLayers === 20);
    const none = await resolveModel("nobody/Nothing-7B");
    check("nothing to read: no architecture", none.arch === null && none.source === "partial");
  } finally {
    globalThis.fetch = real;
  }
  check("Unsloth's names for Llama 3.1", JSON.stringify(mirrorIds("meta-llama/Llama-3.1-70B-Instruct")) === JSON.stringify(["unsloth/Llama-3.1-70B-Instruct", "unsloth/Meta-Llama-3.1-70B-Instruct"]));
  check("an Unsloth repo has no mirror", mirrorIds("unsloth/gemma-3-1b-it").length === 0);
  const ph = placeholderArch(8e9);
  check("the placeholder says it is one", ph.placeholder === true && ph.numLayers === 32);
  check("…through a link", decodeState(encodeState({ ...DEFAULT_STATE, arch: ph })).arch?.placeholder === true);
  const presets = ["gemma-3-1b", "gemma-3-4b", "gemma-3-12b", "gemma-3-27b", "llama-3.1-70b", "llama-4-scout"];
  check("presets for Gemma 3, Llama 3.1 70B and Llama 4 Scout", presets.every((id) => KNOWN_MODELS.some((m) => m.id === id)));
  // Each preset as its config reads (Unsloth's copies, fetched 2026-10-15).
  const l70 = KNOWN_MODELS.find((m) => m.id === "llama-3.1-70b")!;
  check("Llama 3.1 70B: 320 KiB a token, 2.5x the placeholder's", kvBytesPerToken(l70, "bf16") === 80 * 2 * 8 * 128 * 2 && kvBytesPerToken(l70, "bf16") / kvBytesPerToken(ph, "bf16") === 2.5);
}

console.log("\n--- B11: spellings and nested configs ---");
{
  check("opt-125m names its size in millions", paramsFromName("facebook/opt-125m") === 125e6 && paramsFromName("Qwen/Qwen3-30B-A3B") === 30e9);
  const opt = archFromConfig(cfg("facebook_opt-125m"), 125e6)!;
  check("…and its config reads: 12 layers of 768", opt.numLayers === 12 && opt.hiddenSize === 768 && opt.maxContext === 2048);
  const bloom = archFromConfig(cfg("bigscience_bloomz-560m"), 0.56e9)!;
  check("Bloom's n_embed", bloom?.hiddenSize === 1024 && bloom.numLayers === 24 && bloom.numAttentionHeads === 16);
  const mpt = archFromConfig({ architectures: ["MPTForCausalLM"], model_type: "mpt", n_layers: 32, d_model: 4096, n_heads: 32, max_seq_len: 2048 }, 6.7e9)!;
  check("MPT's n_layers and n_heads, and vLLM 0.31 no longer loads it", mpt?.numLayers === 32 && mpt.numAttentionHeads === 32 && mpt.notInVllm?.until === "0.28.0");
  const omni = archFromConfig(cfg("Qwen_Qwen2.5-Omni-7B"), 10.7e9)!;
  check("Qwen2.5-Omni: its thinker's text config", omni?.numLayers === 28 && omni.numKeyValueHeads === 4 && omni.hiddenSize === 3584);
  const vl2 = archFromConfig(cfg("deepseek-ai_deepseek-vl2-small"), 16.15e9)!;
  check("DeepSeek-VL2 small: its language_config, MLA by DeepseekV2Config's defaults", vl2?.numLayers === 27 && vl2.kvLoraRank === 512 && vl2.qkRopeHeadDim === 64 && vl2.vocabSize === 102400,
    `${vl2?.numLayers} layers, kv_lora_rank ${vl2?.kvLoraRank}`);
  check("…a MoE of 64 experts, 6 a token", vl2.numExperts === 64 && vl2.expertsPerToken === 6);
  const janus = archFromConfig(cfg("deepseek-ai_Janus-Pro-7B"), 7.4e9)!;
  check("Janus-Pro: a Llama of 30 layers, the rest its class's defaults", janus?.numLayers === 30 && janus.hiddenSize === 4096 && janus.numAttentionHeads === 32);
  const llava = archFromConfig(cfg("llava-hf_llava-1.5-7b-hf"), 7.06e9)!;
  check("llava 1.5: a Vicuna text config with its defaults left out", llava?.numLayers === 32 && llava.hiddenSize === 4096 && llava.numKeyValueHeads === 32 && llava.maxContext === 4096);
  const next = archFromConfig(cfg("llava-hf_llava-v1.6-mistral-7b-hf"), 7.57e9)!;
  check("llava-next on Mistral: 8 KV heads, 32,768 tokens", next?.numLayers === 32 && next.numKeyValueHeads === 8 && next.maxContext === 32768);
}

console.log("\n--- C3: the card sets a DSA row ---");
{
  const v32 = archFromConfig(parseConfigJson(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V3.2.json", import.meta.url), "utf8")), 685.4e9)!;
  const gpu = (id: string) => GPUS.find((g) => g.id === id)!;
  check("RTX 5090 and RTX PRO 6000 are SM120, B200 SM100, H100 neither", batchFor(gpu("rtx5090-32")).sparseMla === "sm120" &&
    batchFor(gpu("rtxpro6000-96")).sparseMla === "sm120" && batchFor(gpu("b200-192")).sparseMla === "sm100" && batchFor(gpu("h100-80")).sparseMla === undefined);
  const ctx = 131072;
  const at = (dt: "bf16" | "fp8", family?: "sm100" | "sm120") => kvReservedPerSeq(v32, dt, ctx, 2048, 1, family);
  // 61 layers × (latent row + a 132-byte indexer key).
  check("Hopper, 16-bit: the plain 1,152-byte latent", at("bf16") === ctx * 61 * (1152 + 132));
  check("SM120, 16-bit: the 656-byte fp8_ds_mla row all the same (was 63% high)", at("bf16", "sm120") === ctx * 61 * (656 + 132), `${(at("bf16") / at("bf16", "sm120")).toFixed(2)}x`);
  check("SM100, fp8: the plain 576-byte row (was 11% high)", at("fp8", "sm100") === ctx * 61 * (576 + 132) && at("fp8") === ctx * 61 * (656 + 132),
    `${(at("fp8") / at("fp8", "sm100")).toFixed(3)}x`);
  const pro = calculate({ arch: v32, weightDtype: "fp8", kvDtype: "bf16", contextLength: ctx, concurrency: 1, batch: batchFor(gpu("rtxpro6000-96")) });
  check("…and the calculator takes it from the card", Math.abs(pro.kvPerSeqGiB - gib(at("bf16", "sm120"))) < 1e-9, `${pro.kvPerSeqGiB.toFixed(2)} GiB on an RTX PRO 6000`);
  // The vLLM page's log check builds its batch shape itself: it keeps the family too.
  const log = compareLog({ tp: 1, maxModelLen: ctx, availableKvGiB: 10, maxConcurrency: 1 }, { arch: v32, weightDtype: "fp8", cardGiB: 96, cardName: "RTX PRO 6000 Blackwell" });
  const conc = log.rows.find((r) => r.key === "concurrency");
  check("…and so does the vLLM log check", log.batch.sparseMla === "sm120" && !!conc && Math.abs(conc.ours - (10 * BYTES_PER_GIB) / at("bf16", "sm120")) < 1e-9,
    `${conc?.ours.toFixed(2)}x`);
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
