// DeepSeek V4.1's shared compressed attention, checked against its own sources.
// Run: node scripts/test-v41.ts
//
// V4.1 reads `compress_ratios` differently from V4: 0 is a layer with only its
// 128-token window, 1 a layer that also reads a compressed cache of one entry per
// token, 2 one of one entry per 2 tokens. Only the kv-source layers
// (`kv_source_layer_ids`) keep that cache, with an indexer key beside it when they
// are index sources too; the layers above a source read its cache. Read as V4, no
// ratio was 4 or 128, so every layer came out a 128-token sliding window and the
// context length changed nothing (2026-11-03, DeepSeek-V4.1-Flash on 4× RTX PRO 6000).
// The figures below come from the model's config.json and vLLM 0.31.0's
// vllm/models/deepseek_v41 (attention.py, compressor.py): V4's 584-byte
// fp8_ds_mla rows in 576-byte pages, V4.1's 528-byte rows in 512-byte pages on
// SM100, 132-byte fp8 indexer keys, 32-token window blocks, and an 8-row ring of
// fp32 compressor state for each ratio-2 source.
import { readFileSync } from "node:fs";
import {
  BYTES_PER_GIB,
  calculate,
  kvBytesPerSeq,
  kvBytesPerToken,
  kvBytesReadPerStep,
  kvReservedPerSeq,
  kvSharedPrefix,
  kvSplit,
  layoutsOn,
  ppAllowed,
  usesCompressedAttn,
  usesMla,
} from "../src/lib/calc.ts";
import { batchFor, GPUS, usableGiB } from "../src/lib/gpus.ts";
import { archFromConfig } from "../src/lib/hf.ts";
import { decodeState, DEFAULT_STATE, encodeState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const gib = (b: number) => (b / BYTES_PER_GIB).toFixed(3);
const cfg = JSON.parse(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V4.1-Flash.json", import.meta.url), "utf8"));

console.log("--- reading the config ---");
const flash = archFromConfig(cfg, 284e9)!;
check("DeepSeek-V4.1-Flash is read as compressed attention", usesCompressedAttn(flash));
check("not as MLA, though it has qk_rope_head_dim", !usesMla(flash));
check("the window is not read as a sliding-window model's", flash.slidingLayers === undefined && flash.slidingWindow === undefined && flash.attnLayers === undefined);
const c = flash.compressedAttn!;
check("no V4 layers, a 128-token window, 512 picked entries", c.csa === 0 && c.hca === 0 && c.window === 128 && c.topk === 512, JSON.stringify(c));
// Sources 2, 8 and 14 keep a ratio-2 cache that layers 2–19 read; source 20 a
// ratio-1 cache that layers 20–39 read. Index sources 2, 8, 14 score the first,
// 20, 24, 28, 32 and 36 the second; every source is an index source too.
check("one ratio-1 source read by 20 layers, three ratio-2 sources read by 18",
  JSON.stringify(c.shared) === JSON.stringify([
    { ratio: 1, sources: 1, keys: 1, readers: 20, indexers: 5 },
    { ratio: 2, sources: 3, keys: 3, readers: 18, indexers: 3 },
  ]), JSON.stringify(c.shared));
// vLLM refuses a pipeline stage that starts between a source and a layer reading it.
check("a stage may start at layer 0, 1, 2, 8, 14 or 20", JSON.stringify(c.cuts) === JSON.stringify([0, 1, 2, 8, 14, 20]), JSON.stringify(c.cuts));
check("two stages (20 + 20 layers) run, four (10 each) do not", ppAllowed(flash, 1) && ppAllowed(flash, 2) && !ppAllowed(flash, 4) && !ppAllowed(flash, 8));
check("V4 keeps every split", ppAllowed({ ...flash, compressedAttn: { csa: 21, hca: 20, window: 128, indexDim: 128 } }, 4));

console.log("\n--- per token ---");
// fp8: an entry of 584 B and a key of 132 B per source, divided by its ratio.
check("each further token adds 1,790 bytes at fp8", kvBytesPerToken(flash, "fp8") === 3 * (584 + 132) / 2 + (584 + 132), `${kvBytesPerToken(flash, "fp8")}`);

console.log("\n--- what vLLM reserves: 256-token blocks, 2,048 batched tokens ---");
const at = (n: number, family?: "sm100" | "sm120") => kvReservedPerSeq(flash, "fp8", n, 2048, 1, family);
// Per block, a ratio-2 source: 128 entries (74,752 B → 74,880) + 128 keys (16,896 B → 17,280);
// the ratio-1 source: 256 entries (149,504 B → 149,760) + 256 keys (33,792 B → 33,984).
const perBlock = 3 * (74_880 + 17_280) + (149_760 + 33_984);
check("past the window, each 256 tokens add the sources' pages", at(2 ** 20) - at(2 ** 19) === 2048 * perBlock, `${at(2 ** 20) - at(2 ** 19)} vs ${2048 * perBlock}`);
check("the context length moves the figure past 64k (the bug)", at(131072) > at(65536) && at(2 ** 20) > 4 * at(131072), `${gib(at(65536))} → ${gib(at(131072))} → ${gib(at(2 ** 20))} GiB`);
// 40 layers × (⌈(127 + 2 × 2,048) / 32⌉ + 1) blocks × 32 rows of 584 B (18,688 → 19,008),
// and three rings of 8 × 1,024 fp32 values.
const fixed = 40 * 133 * 19_008 + 3 * 8 * 1024 * 4;
check("the window and the compressor rings", at(32768) === 128 * perBlock + fixed, `${at(32768)} vs ${128 * perBlock + fixed}`);
// SM100 keeps V4.1's own record: 512 fp8 values and 16 scales, in 512-byte pages.
const perBlock100 = 3 * (128 * 528 + 128 * 132) + (256 * 528 + 256 * 132);
check("SM100's 528-byte rows", at(2 ** 20, "sm100") - at(2 ** 19, "sm100") === 2048 * perBlock100);
check("SM120 keeps the 584-byte rows", at(2 ** 20, "sm120") === at(2 ** 20));
check("a prefix shares whole 256-token blocks", kvSharedPrefix(flash, "fp8", 4096) === 16 * perBlock && kvSharedPrefix(flash, "fp8", 255) === 0);

console.log("\n--- what a request holds and reads ---");
const M = 2 ** 20;
const held = 40 * 128 * 584 + 3 * (M / 2) * (584 + 132) + M * (584 + 132) + 3 * 2 * 1024 * 4;
check("at 1M tokens it holds its window, the sources' caches and the rings", kvBytesPerSeq(flash, "fp8", M) === held, `${kvBytesPerSeq(flash, "fp8", M)} vs ${held}`);
check("…which is never more than vLLM reserves", kvBytesPerSeq(flash, "fp8", M) < at(M));
// Every layer reads its window; every reader the 512 entries its indexer picks;
// every indexer all of its source's keys.
const read = 40 * 128 * 584 + (18 + 20) * 512 * 584 + 3 * (M / 2) * 132 + 5 * M * 132;
check("a decode step at 1M reads the window, the picked entries and every key", kvBytesReadPerStep(flash, "fp8", M) === read, `${kvBytesReadPerStep(flash, "fp8", M)} vs ${read}`);

console.log("\n--- the reported setup: 4× RTX PRO 6000, 16 requests, FP8 cache ---");
const card = GPUS.find((g) => g.id === "rtxpro6000-96")!;
const run = (ctx: number) => calculate({ arch: flash, weightDtype: "fp8", kvDtype: "fp8", contextLength: ctx, concurrency: 16, gpus: 4, batch: batchFor(card) });
check("the single cached vector is held whole on every GPU", kvSplit(flash, 4) === 1);
// 16 requests × (4,096 − 256) blocks more, at 460,224 B a block.
const grown = (run(M).kvCacheGiB - run(65536).kvCacheGiB) * BYTES_PER_GIB;
check("the cache grows from 64k to 1M by the sources' blocks", Math.abs(grown - 16 * 3840 * perBlock) < 1, `${run(65536).kvCacheGiB.toFixed(2)} → ${run(M).kvCacheGiB.toFixed(2)} GiB`);
check("the compressed part is what grows", run(M).compressed!.growGiB > run(65536).compressed!.growGiB && run(M).compressed!.fixedGiB === run(65536).compressed!.fixedGiB);
const layouts = (ctx: number) => layoutsOn({ arch: flash, weightDtype: "int4", kvDtype: "fp8", contextLength: ctx, concurrency: 16, batch: batchFor(card) }, usableGiB(card), 4);
const stages = [65536, 262144, M].flatMap((ctx) => layouts(ctx).map((l) => l.layout.pp));
check("no layout on four cards splits a sharing group", stages.length > 0 && stages.every((pp) => pp === 1 || pp === 2), [...new Set(stages)].join(", "));
const lead = layouts(M)[0].layout;
check("at 1M the first layout runs", ppAllowed(flash, lead.pp), `TP ${lead.tp} · PP ${lead.pp} · DP ${lead.dp}`);

console.log("\n--- a shared link ---");
const back = decodeState(encodeState({ ...DEFAULT_STATE, arch: flash }));
check("the link keeps the shared caches", !!back.arch && JSON.stringify(back.arch.compressedAttn) === JSON.stringify(c), JSON.stringify(back.arch?.compressedAttn));
check("and the estimate", !!back.arch && kvReservedPerSeq(back.arch, "fp8", M, 2048) === at(M));
check("V4.1's layers without their groups are dropped", decodeState("p=1&L=2&h=3&a=4&k=1&cx=0.0.128.128").arch?.compressedAttn === undefined);
check("a garbled group is dropped", decodeState("p=1&L=2&h=3&a=4&k=1&cx=0.0.128.128&cs=1.x.1.20.5").arch?.compressedAttn === undefined);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
