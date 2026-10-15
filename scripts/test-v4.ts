// DeepSeek V4's compressed attention, checked against its own sources.
// Run: node scripts/test-v4.ts
//
// A V4 layer does not keep one entry per token. Every layer keeps its last 128
// tokens; on top of that a CSA layer keeps one entry per 4 tokens with an indexer
// key beside it, and an HCA layer one entry per 128 (config `compress_ratios`).
// The figures below come from the model's config.json, vLLM 0.31.0's
// vllm/models/deepseek_v4 (584-byte fp8_ds_mla rows, 576-byte page padding,
// 132-byte fp8 indexer keys, 256-token blocks) and vLLM's DeepSeek V4 blog post.
import { readFileSync } from "node:fs";
import {
  BYTES_PER_GIB,
  calculate,
  kvBytesPerLayerToken,
  kvBytesPerSeq,
  kvBytesPerToken,
  kvReservedPerSeq,
  kvSharedPrefix,
  kvSplit,
  maxConcurrency,
  usesCompressedAttn,
  usesMla,
  type ModelArch,
} from "../src/lib/calc.ts";
import { archFromConfig } from "../src/lib/hf.ts";
import { decodeState, DEFAULT_STATE, encodeState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const gib = (b: number) => (b / BYTES_PER_GIB).toFixed(3);
const cfg = JSON.parse(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V4-Flash-0731.json", import.meta.url), "utf8"));

console.log("--- reading the config ---");
const flash = archFromConfig(cfg, 304.18e9)!;
// The app sizes a quantized checkpoint by its files: the 48 safetensors shards.
flash.shipped = { dtype: "fp8", bytes: 166_886_535_336 };
check("DeepSeek-V4-Flash is read as compressed attention", usesCompressedAttn(flash));
check("not as MLA, though it has qk_rope_head_dim", !usesMla(flash));
const c = flash.compressedAttn!;
// 43 layers: two keep only the window, then CSA and HCA alternate; the three
// entries after the 43rd belong to the speculative-decoding layers.
check("21 CSA, 20 HCA layers, a 128-token window", c.csa === 21 && c.hca === 20 && c.window === 128, JSON.stringify(c));
check("the window is not read as a sliding-window model's", flash.slidingLayers === undefined && flash.attnLayers === undefined);

console.log("\n--- one entry ---");
// fp8_ds_mla: 448 fp8 NoPE values + 64 bf16 RoPE values + 7 UE8M0 scales and a pad byte.
check("an fp8 entry is 584 bytes, as vLLM and FlashMLA lay it out", kvBytesPerLayerToken(flash, "fp8") === 584, `${kvBytesPerLayerToken(flash, "fp8")}`);
check("a 16-bit entry is 512 values, K and V in one", kvBytesPerLayerToken(flash, "bf16") === 1024);

console.log("\n--- vLLM's DeepSeek V4 post: 9.62 GiB a sequence at 1M tokens in bf16 ---");
// The post counts 30 CSA and 31 HCA layers (V4-Pro's 61) and the indexer key at
// bf16, 256 bytes; vLLM stores it at fp8, 132 bytes. Put that back and the
// compressed caches the engine counts come to the post's figure.
const pro: ModelArch = { ...flash, numLayers: 61, compressedAttn: { csa: 30, hca: 31, window: 128, indexDim: 128 } };
const M = 2 ** 20;
const asPosted = kvBytesPerToken(pro, "bf16") * M + 30 * (M / 4) * (256 - 132);
check("the post's 9.62 GiB", Math.abs(asPosted / BYTES_PER_GIB - 9.62) < 0.005, `${gib(asPosted)} GiB`);

console.log("\n--- the screenshot's setup: FP8 cache, 256k tokens, one request, 8,192 batched tokens ---");
const ctx = 262144;
const batch = { tokens: 8192, seqs: 1024 };
const r = calculate({ arch: flash, weightDtype: "fp8", kvDtype: "fp8", contextLength: ctx, concurrency: 1, batch });
// 1,024 blocks of 256 tokens. Per block: 64 entries of 584 B padded to 37,440 B
// and 64 indexer keys of 132 B padded to 8,640 B in each CSA layer; 2 entries
// padded to 1,728 B in each HCA layer.
const grow = 1024 * (21 * (37440 + 8640) + 20 * 1728);
check("the compressed caches", Math.abs(r.compressed!.growGiB * BYTES_PER_GIB - grow) < 1, `${gib(grow)} GiB`);
const oldWay = 2 * 1 * 512 * 1 * 43 * ctx;
check("an eleventh of every layer keeping every token", oldWay / grow > 10.5 && oldWay / grow < 11.5, `${gib(oldWay)} GiB before, ${(oldWay / grow).toFixed(1)}x`);
check("the window and compressor state sit beside it", r.compressed!.fixedGiB > 0 && Math.abs(r.kvPerSeqGiB - r.compressed!.growGiB - r.compressed!.fixedGiB) < 1e-9,
  `${r.compressed!.fixedGiB.toFixed(2)} GiB for ${r.compressed!.inFlight} tokens in flight`);
check("a long context's average is a few KiB a token", r.kvPerTokenBytes > 3000 && r.kvPerTokenBytes < 4500, `${r.kvPerTokenBytes.toFixed(0)} B`);

console.log("\n--- how it grows ---");
const at = (n: number, tokens = 8192) => kvReservedPerSeq(flash, "fp8", n, tokens);
check("only the compressed caches grow past the in-flight tokens", at(2 * ctx) - at(ctx) === 1024 * (21 * (37440 + 8640) + 20 * 1728));
check("a smaller batch holds less window and compressor state", at(ctx, 2048) < at(ctx, 8192));
check("what it holds is never more than what vLLM reserves", kvBytesPerSeq(flash, "fp8", ctx) < at(ctx));
check("a 16-bit cache is larger", kvReservedPerSeq(flash, "bf16", ctx, 8192) > at(ctx));
const shared = kvSharedPrefix(flash, "fp8", 4096);
check("a prefix shares whole 256-token blocks", shared === 16 * (21 * (37440 + 8640) + 20 * 1728) && kvSharedPrefix(flash, "fp8", 255) === 0);
check("…and never more than a request holds", shared < at(4096));

console.log("\n--- across GPUs ---");
check("the single cached vector is held whole on every GPU", kvSplit(flash, 4) === 1);
const one = maxConcurrency({ arch: flash, weightDtype: "fp8", kvDtype: "fp8", contextLength: ctx, batch, gpus: 2 }, 0.92 * 96);
check("two 96 GB cards serve it at 256k", one >= 1, `${one} requests`);

console.log("\n--- a shared link ---");
const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: flash }));
check("the link keeps the compressed layers", !!back.arch && JSON.stringify(back.arch.compressedAttn) === JSON.stringify(c));
check("and the estimate", !!back.arch && kvReservedPerSeq(back.arch, "fp8", ctx, 8192) === at(ctx));
check("a garbled value is dropped", decodeState("p=1&L=2&h=3&a=4&k=1&cx=4.x.128.128").arch?.compressedAttn === undefined);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
