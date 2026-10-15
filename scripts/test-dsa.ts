// DeepSeek Sparse Attention (DeepSeek-V3.2, GLM-5), checked against its own sources.
// Run: node scripts/test-dsa.ts
//
// A DSA layer keeps MLA's latent and, beside it, a lightning-indexer key for every
// token; a query reads only the index_topk tokens the indexer picks. The figures
// below come from the models' config.json files (deepseek-ai/DeepSeek-V3.2 at
// a7e62ac, zai-org/GLM-5 at c183ef8), vLLM 0.31.0 and FlashMLA's README at ba89a34:
//   - the indexer key: head_dim = index_head_dim + index_head_dim // 128 * 4 bytes of
//     uint8, fp8 values and an fp32 scale (Indexer in vllm/models/deepseek_v32/
//     attention.py, DeepseekV32IndexerCache in vllm/model_executor/models/deepseek_v2.py);
//   - the latent at fp8: state_content_bytes {"fp8_ds_mla": 656} in
//     MLAAttention.get_kv_cache_spec (vllm/model_executor/layers/attention/
//     mla_attention.py), FlashMLA's "FP8 with scale" row of 512 fp8 NoPE values,
//     4 fp32 scales and 64 bf16 RoPE values;
//   - one KV cache group of 64-token blocks with no padding (UniformTypeKVCacheSpecs
//     in vllm/v1/kv_cache_interface.py; FlashMLA sparse's kernel block size).
import { readFileSync } from "node:fs";
import {
  BYTES_PER_GIB,
  calculate,
  kvBytesPerLayerToken,
  kvBytesPerSeq,
  kvBytesPerToken,
  kvBytesReadPerStep,
  kvReservedPerSeq,
  kvSharedPrefix,
  kvSplit,
  maxContextLength,
  usesCompressedAttn,
  usesDsa,
  usesMla,
  type ModelArch,
} from "../src/lib/calc.ts";
import { estimateDecode } from "../src/lib/perf.ts";
import { archFromConfig } from "../src/lib/hf.ts";
import { sparseIndexer } from "../src/lib/layers.ts";
import { configFromArch, explainConfig } from "../src/lib/configExplain.ts";
import { decodeState, DEFAULT_STATE, encodeState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const gib = (b: number) => (b / BYTES_PER_GIB).toFixed(3);
const load = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/configs/${name}.json`, import.meta.url), "utf8"));
const cfg = load("deepseek-ai_DeepSeek-V3.2");

console.log("--- reading the config ---");
// 685,355,329,792 parameters in the repository's safetensors, the MTP layer included.
const v32 = archFromConfig(cfg, 685.36e9)!;
check("DeepSeek-V3.2 is read as MLA with sparse attention", usesMla(v32) && usesDsa(v32));
check("index_topk 2048, a 128-wide indexer key in all 61 layers",
  JSON.stringify(v32.sparseAttn) === JSON.stringify({ topk: 2048, indexDim: 128, indexLayers: 61 }), JSON.stringify(v32.sparseAttn));
const v3 = archFromConfig(load("deepseek-ai_DeepSeek-V3"), 684.53e9)!;
check("DeepSeek-V3 has no indexer", usesMla(v3) && !usesDsa(v3) && v3.sparseAttn === undefined);
const v4 = archFromConfig(load("deepseek-ai_DeepSeek-V4-Flash-0731"), 304.18e9)!;
check("DeepSeek V4's index_topk stays with its compressed layers", !usesDsa(v4) && usesCompressedAttn(v4) && v4.compressedAttn!.topk === 512);

console.log("\n--- one token ---");
// 512 fp8 NoPE values + 4 fp32 scales + 64 bf16 RoPE values.
check("an fp8 latent is FlashMLA's 656-byte row", kvBytesPerLayerToken(v32, "fp8") === 512 + 4 * 4 + 64 * 2, `${kvBytesPerLayerToken(v32, "fp8")}`);
check("a 16-bit latent is 576 values", kvBytesPerLayerToken(v32, "bf16") === 1152);
// 128 fp8 values + one fp32 scale, at any cache dtype.
check("the indexer key is 132 bytes at fp8", kvBytesPerToken(v32, "fp8") === 61 * (656 + 132), `${kvBytesPerToken(v32, "fp8")}`);
check("…and at 16-bit too", kvBytesPerToken(v32, "bf16") === 61 * (1152 + 132), `${kvBytesPerToken(v32, "bf16")}`);
const plain: ModelArch = { ...v32, sparseAttn: undefined };
check("without the indexer it is DeepSeek-V3's cache", kvBytesPerToken(plain, "fp8") === kvBytesPerToken(v3, "fp8"));

console.log("\n--- DeepSeek-V3.2 at 128k tokens, one request ---");
const ctx = 131072;
for (const dt of ["bf16", "fp8"] as const) {
  const before = kvReservedPerSeq(plain, dt, ctx);
  const after = kvReservedPerSeq(v32, dt, ctx);
  check(`${dt}: the latent and the indexer keys of every token in every layer`, after === ctx * kvBytesPerToken(v32, dt),
    `${gib(before)} GiB before, ${gib(after)} GiB now (+${((after / before - 1) * 100).toFixed(1)}%)`);
}
check("the latent alone was 10% short at 16-bit", Math.abs(kvReservedPerSeq(plain, "bf16", ctx) / kvReservedPerSeq(v32, "bf16", ctx) - 0.897) < 0.001);
check("…and 27% short at fp8", Math.abs(kvReservedPerSeq(plain, "fp8", ctx) / kvReservedPerSeq(v32, "fp8", ctx) - 0.731) < 0.001);
const r = calculate({ arch: v32, weightDtype: "fp8", kvDtype: "fp8", contextLength: ctx, concurrency: 1 });
check("calculate() reports it", Math.abs(r.kvPerSeqGiB * BYTES_PER_GIB - 61 * 788 * ctx) < 1 && r.kvPerTokenBytes === 61 * 788, `${r.kvPerSeqGiB.toFixed(3)} GiB`);

console.log("\n--- blocks and prefixes ---");
const per = kvBytesPerToken(v32, "fp8");
check("vLLM reserves whole 64-token blocks", kvReservedPerSeq(v32, "fp8", 100) === 128 * per && kvReservedPerSeq(v32, "fp8", 128) === 128 * per);
check("what attention holds is the tokens themselves", kvBytesPerSeq(v32, "fp8", 100) === 100 * per);
check("a prefix shares whole blocks", kvSharedPrefix(v32, "fp8", 4100) === 4096 * per && kvSharedPrefix(v32, "fp8", 63) === 0);
check("the latent and the indexer are held whole on every GPU", kvSplit(v32, 8) === 1);
// Eight 141 GB H200s at 92%, FP8 weights: the longest context each of 8 requests gets.
const ctxOf = (arch: ModelArch) => maxContextLength({ arch, weightDtype: "fp8", kvDtype: "fp8", concurrency: 8, gpus: 8 }, 0.92 * 141);
check("the context bound counts the indexer too", ctxOf(v32) > 0 && ctxOf(v32) < ctxOf(plain),
  `${ctxOf(v32).toLocaleString("en-US")} tokens each on 8 x H200, ${ctxOf(plain).toLocaleString("en-US")} counting the latent alone`);

console.log("\n--- IndexCache: layers that reuse an earlier layer's picks ---");
// vLLM: skip = max(layer − index_skip_topk_offset + 1, 0) % index_topk_freq != 0, or "S" in index_topk_pattern.
const base = { num_hidden_layers: 8, kv_lora_rank: 512, index_topk: 2048 };
check("index_topk_freq 2 keeps layers 0, 1, 3, 5 and 7", sparseIndexer({ ...base, index_topk_freq: 2 })?.indexLayers === 5);
check("a pattern keeps the layers not marked S", sparseIndexer({ ...base, index_topk_pattern: "FFSFSSFS" })?.indexLayers === 4);
check("a freq of 1 keeps every layer", sparseIndexer(base)?.indexLayers === 8);
check("no kv_lora_rank, no DSA", sparseIndexer({ ...base, kv_lora_rank: undefined }) === undefined);
const sparser: ModelArch = { ...v32, sparseAttn: { ...v32.sparseAttn!, indexLayers: 16 } };
check("fewer indexers, fewer keys", kvBytesPerToken(sparser, "fp8") === 61 * 656 + 16 * 132);

console.log("\n--- GLM-5 ---");
const glm = archFromConfig(load("zai-org_GLM-5"), 753.86e9)!;
check("GLM-5 is DSA: 78 layers, each with an indexer", usesDsa(glm) && glm.sparseAttn!.indexLayers === 78 && glm.sparseAttn!.topk === 2048);
check("the same 656 + 132 bytes a layer at fp8", kvBytesPerToken(glm, "fp8") === 78 * 788, `${kvBytesPerToken(glm, "fp8")}`);

console.log("\n--- what a decode step reads ---");
const read = kvBytesReadPerStep(v32, "fp8", ctx);
check("2,048 latents a layer and every indexer key", read === 61 * 2048 * 656 + 61 * ctx * 132, `${gib(read)} GiB of ${gib(kvBytesPerSeq(v32, "fp8", ctx))} GiB held`);
check("up to 2,048 tokens it reads all it holds", kvBytesReadPerStep(v32, "fp8", 2048) === kvBytesPerSeq(v32, "fp8", 2048));
check("a model without sparse attention reads all it holds", kvBytesReadPerStep(v3, "fp8", ctx) === kvBytesPerSeq(v3, "fp8", ctx));
const step = estimateDecode({ arch: v32, weightDtype: "fp8", kvDtype: "fp8", contextLength: ctx, concurrency: 1, bandwidthGBs: 8 * 4800 })!;
check("the decode estimate reads that, not the whole cache", Math.abs(step.kvShare * step.bytesPerStep - read) < 1);
// V4: a window in every layer, every HCA entry, and in each CSA layer every
// indexer key and the 512 entries picked out of ctx/4.
const v4ctx = 262144;
const v4read = kvBytesReadPerStep(v4, "fp8", v4ctx);
check("V4 reads its window, 512 CSA entries, every indexer key and HCA entry",
  v4read === 43 * 128 * 584 + 21 * (512 * 584 + (v4ctx / 4) * 132) + 20 * (v4ctx / 128) * 584, `${gib(v4read)} GiB of ${gib(kvBytesPerSeq(v4, "fp8", v4ctx))} GiB held`);
check("…all its CSA entries while there are no more than 512", kvBytesReadPerStep(v4, "fp8", 2048) === 43 * 128 * 584 + 21 * 512 * (584 + 132) + 20 * 16 * 584);

console.log("\n--- the config explainer ---");
const rep = explainConfig({ cfg, lang: "en", numParams: 685.36e9 });
const kv = rep.answers.find((a) => a.id === "kvcache")!;
const w = kv.working.find((p) => p.k === "kv.w.dsa");
check("it counts the indexer key in the per-token figure", w?.v?.b === "78,324" && w?.v?.i === "132", JSON.stringify(w?.v));
check("and says what the key and the FP8 row are", kv.parts.some((p) => p.k === "kv.dsa" && p.v?.f === "656" && p.v?.p === "576"));
check("citing index_head_dim", kv.cites.includes("index_head_dim"));
const context = rep.answers.find((a) => a.id === "context")!;
check("the context answer names the top-k", context.parts.some((p) => p.k === "context.sparse" && p.v?.k === "2,048") && context.cites.includes("index_topk"));
const rebuilt = configFromArch(v32);
check("a rebuilt config keeps it DSA", usesDsa(archFromConfig(rebuilt, v32.numParams)!) && rebuilt.index_topk === 2048);

console.log("\n--- a shared link ---");
const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: v32 }));
check("the link keeps the indexer", !!back.arch && JSON.stringify(back.arch.sparseAttn) === JSON.stringify(v32.sparseAttn));
check("and the estimate", !!back.arch && kvReservedPerSeq(back.arch, "fp8", ctx) === kvReservedPerSeq(v32, "fp8", ctx));
check("a garbled value is dropped", decodeState("p=1&L=2&h=3&a=4&k=1&kl=512&qr=64&dx=2048.x.61").arch?.sparseAttn === undefined);
const v4back = decodeState(encodeState({ ...DEFAULT_STATE, arch: v4 }));
check("V4's top-k rides along", v4back.arch?.compressedAttn?.topk === 512);
check("a V4 link from before it still reads", decodeState("p=1&L=2&h=3&a=4&k=1&cx=21.20.128.128").arch?.compressedAttn?.csa === 21);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
