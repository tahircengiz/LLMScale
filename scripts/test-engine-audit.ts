// Engine audit (2026-11-17): the sizing page's figures against vLLM 0.31.0's own rules.
// Run: node scripts/test-engine-audit.ts
//
// Every expected byte count below is worked out by hand from vLLM v0.31.0 (tag
// db9527a), in the comment beside it, not read back from the engine. The rules:
//   - a request reserves its blocks up to max_model_len (FullAttentionSpec), a
//     sliding layer window − 1 plus two batches in flight plus one block
//     (SlidingWindowSpec.max_admission_blocks_per_request, VllmConfig.max_in_flight_tokens,
//     async scheduling on by default);
//   - a hybrid keeps two state blocks per request ("align", prefix caching's default),
//     its attention block grows to 16 × cdiv(state, 16 × attention page per token)
//     (_align_hybrid_block_size), and the layers fall in groups of the smallest kind's
//     count (_get_kv_cache_groups_uniform_page_size), the last one padded;
//   - key-value heads split across tensor parallelism down to one per GPU, a GDN or
//     Mamba state splits by tp (MambaStateShapeCalculator), an MLA latent does not;
//   - `vllm serve` batches 16384/1024 at 160 GiB of physical memory, 8192/1024 at 70
//     (not on an A100), 2048/256 below and when it cannot read the card
//     (EngineArgs.get_batch_defaults).
// The overhead's coefficients are a fit to measured startups (overhead.ts), not a vLLM
// rule; where a check needs them, it says so.

import { readFileSync } from "node:fs";
import { archFromConfig, specFileBytes } from "../src/lib/hf.ts";
import {
  BYTES_PER_GIB, calculate, contextShortfall, kvReservedPerSeq, layoutsOn, maxConcurrency, maxContextLength, weightsBytes,
  type CalcInput, type Dtype, type ModelArch,
} from "../src/lib/calc.ts";
import { batchFor, GPUS, MIG_PROFILES, migBandwidthShare, migMem, usableGiB } from "../src/lib/gpus.ts";
import { overheadPerGpu } from "../src/lib/overhead.ts";
import { decodeState, encodeState, type AppState } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const GiB = BYTES_PER_GIB;
const gpu = (id: string) => GPUS.find((g) => g.id === id)!;
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
const cfg = (path: string, params: number): ModelArch =>
  archFromConfig(JSON.parse(readFileSync(new URL(`./fixtures/${path}`, import.meta.url), "utf8")), params)!;

// The page the audit started from: RedHatAI/Qwen3.8-27B-FP8 on an H200 4g.71gb slice,
// 128 users at 262,144 tokens, with mtp.safetensors' size (sx) as the resolver adds it.
const URL_QUERY =
  "?m=RedHatAI%2FQwen3.8-27B-FP8&p=27781427952&L=64&h=5120&a=24&k=4&d=256&mc=262144&ap=27393141319&xp=388286633&v=248320&i=17408&al=16&st=153944064&sn=48&sd=fp8&sb=30866866928&vi=65536.16384.1152&wd=fp8&kd=fp8&ctx=262144&n=128&g=h200-141&mig=4g.71gb";
const SPEC_FILE = 477_202_224; // mtp.safetensors on the Hub: 30,866,866,928 − 30,389,664,704
const page = decodeState(URL_QUERY + `&sx=${SPEC_FILE}`) as AppState;
const q38 = page.arch!;

console.log("--- 1. Weights: what vLLM loads, the MTP file left out ---");
{
  // Qwen3_5 skips every mtp.* tensor (WeightsMapper "mtp.": None); the shard files
  // without mtp.safetensors hold 30,389,664,704 bytes.
  check("Qwen3.8-27B-FP8: 30,389,664,704 bytes with the MTP file's size", weightsBytes(q38, "fp8") === 30_389_664_704,
    `${weightsBytes(q38, "fp8")}`);
  const noSx = (decodeState(URL_QUERY) as AppState).arch!;
  const est = weightsBytes(noSx, "fp8");
  check("…and within 0.2% above it from the parameter share when the size is unknown",
    est > 30_389_664_704 && est / 30_389_664_704 - 1 < 0.002, `${((est / 30_389_664_704 - 1) * 100).toFixed(3)}%`);
  check("the MTP file's size survives the URL", new URLSearchParams(encodeState(page)).get("sx") === String(SPEC_FILE));
  check("specFileBytes: mtp.safetensors and sharded mtp files, nothing else",
    specFileBytes([{ name: "mtp.safetensors", size: 5 }, { name: "model-00001-of-00002.safetensors", size: 9 }]) === 5 &&
    specFileBytes([{ name: "mtp-00001-of-00002.safetensors", size: 2 }, { name: "mtp-00002-of-00002.safetensors", size: 3 }]) === 5 &&
    specFileBytes([{ name: "model.safetensors", size: 9 }, { name: "model.mtp.safetensors", size: 1 }]) === undefined);
}

console.log("--- 2. A request's reservation, by kind of attention ---");
{
  // Qwen3.8-27B, fp8 KV: 16 attention layers, 4 KV heads of 256 → 2 × 4 × 256 = 2048 B a
  // token a layer; 48 GDN layers of 3,207,168 B (153,944,064 / 48). Groups of 16: one
  // attention group, three state groups. tp1: block 16 × cdiv(3,207,168, 16 × 2048) =
  // 1568, page 1568 × 2048 = 3,211,264; 262,144 tokens = 168 blocks + 3 × 2 state.
  const r = (tp: number, ctx = 262_144) => kvReservedPerSeq(q38, "fp8", ctx, 2048, tp);
  check("Qwen3.8-27B tp1, 262,144 tokens: 174 × 16 × 3,211,264", r(1) === 174 * 16 * 3_211_264, `${r(1)}`);
  // tp2: 1024 B a token, state 1,603,584 → block 1568, page 1,605,632.
  check("…tp2: 174 × 16 × 1,605,632", r(2) === 174 * 16 * 1_605_632, `${r(2)}`);
  // tp4: one KV head each, 512 B; state 801,792 → block 1568, page 802,816.
  check("…tp4: 174 × 16 × 802,816", r(4) === 174 * 16 * 802_816, `${r(4)}`);
  // tp8: the four heads replicated, still 512 B; state 400,896 → block 784, page
  // 401,408; 262,144 tokens = 335 blocks + 6.
  check("…tp8: 341 × 16 × 401,408", r(8) === 341 * 16 * 401_408, `${r(8)}`);
  check("…one token: 7 blocks, 0.335 GiB", r(1, 1) === 7 * 16 * 3_211_264, `${(r(1, 1) / GiB).toFixed(3)} GiB`);

  // Qwen3.5-397B-A17B, bf16 KV: 15 attention layers, 2 KV heads of 256; 45 GDN layers,
  // conv (2 × 16 × 128 + 64 × 128) × 3 × 2 B + SSM 64 × 128 × 128 × 4 B (float32) =
  // 4,268,032 B. tp8: 1024 B a token (heads replicated), state 533,504 → block
  // 16 × cdiv(533,504, 16,384) = 528, page 540,672; 8,192 tokens = 16 blocks + 6.
  const q35 = cfg("configs-audit/Qwen_Qwen3.5-397B-A17B.json", 403_000_000_000);
  const s8 = kvReservedPerSeq(q35, "bf16", 8192, 2048, 8);
  check("Qwen3.5-397B tp8, 8,192 tokens: 22 × 15 × 540,672 (the state split eight ways)", s8 === 22 * 15 * 540_672, `${s8}`);
  // tp1: 2048 B a token, block 16 × cdiv(4,268,032, 32,768) = 2096, page 4,292,608.
  const s1 = kvReservedPerSeq(q35, "bf16", 8192, 2048, 1);
  check("…tp1: 10 × 15 × 4,292,608", s1 === 10 * 15 * 4_292_608, `${s1}`);

  // Llama 3.1 8B, bf16: 32 layers × 8 heads × 128 × 2 × 2 B = 131,072 B a token.
  const llama = cfg("configs/unsloth_Llama-3.1-8B-Instruct.json", 8_030_261_248);
  check("Llama 3.1 8B, 131,072 tokens: 16 GiB, 8 at tp2, 2 at tp8",
    kvReservedPerSeq(llama, "bf16", 131_072, 2048, 1) === 16 * GiB &&
    kvReservedPerSeq(llama, "bf16", 131_072, 2048, 2) === 8 * GiB &&
    kvReservedPerSeq(llama, "bf16", 131_072, 2048, 8) === 2 * GiB);
  check("…1,000 tokens round up to 63 blocks of 16", kvReservedPerSeq(llama, "bf16", 1000) === 63 * 16 * 131_072);

  // Qwen3-30B-A3B, bf16: 48 layers × 4 heads × 128 × 2 × 2 B = 98,304 B; at tp8 each
  // GPU keeps one replicated head, 24,576 B, as at tp4.
  const q30 = cfg("configs/Qwen_Qwen3-30B-A3B.json", 30_532_122_624);
  check("Qwen3-30B-A3B, 40,960 tokens: 40,960 × 98,304, and × 24,576 at tp4 and tp8",
    kvReservedPerSeq(q30, "bf16", 40_960, 2048, 1) === 40_960 * 98_304 &&
    kvReservedPerSeq(q30, "bf16", 40_960, 2048, 4) === 40_960 * 24_576 &&
    kvReservedPerSeq(q30, "bf16", 40_960, 2048, 8) === 40_960 * 24_576);

  // DeepSeek-V3, bf16 MLA: one 512 + 64 latent a layer, 1152 B × 61 = 70,272 B a token,
  // whole on every GPU of a tensor-parallel group.
  const dsv3 = cfg("configs/deepseek-ai_DeepSeek-V3.json", 671_026_419_200);
  check("DeepSeek-V3, 4,096 tokens: 4,096 × 70,272, the same at tp8",
    kvReservedPerSeq(dsv3, "bf16", 4096, 2048, 1) === 4096 * 70_272 && kvReservedPerSeq(dsv3, "bf16", 4096, 2048, 8) === 4096 * 70_272,
    `${kvReservedPerSeq(dsv3, "bf16", 4096, 2048, 1)}`);

  // Gemma 3 27B, bf16: 62 layers, every sixth global → 10 full, 52 sliding of 1,024;
  // 16 heads × 128 × 2 × 2 B = 8192 B a token a layer. Groups of 10: one full, six
  // sliding. At 131,072 tokens: 8192 full blocks; sliding min(1023 + 2 × 2048, …) =
  // 5,119 tokens = 320 blocks + 1, six times. Block page 16 × 8192 × 10 layers.
  const gemma = cfg("configs/unsloth_gemma-3-27b-it.json", 27_432_406_640);
  const g2 = kvReservedPerSeq(gemma, "bf16", 131_072, 2048);
  check("Gemma 3 27B, 131,072 tokens at 2,048 batched: (8192 + 6 × 321) × 10 × 131,072", g2 === (8192 + 6 * 321) * 10 * 131_072, `${g2}`);
  // At 8,192 batched: 1023 + 16,384 = 17,407 tokens = 1,088 blocks + 1.
  const g8 = kvReservedPerSeq(gemma, "bf16", 131_072, 8192);
  check("…at 8,192 batched: (8192 + 6 × 1089) × 10 × 131,072", g8 === (8192 + 6 * 1089) * 10 * 131_072, `${g8}`);

  // gpt-oss-20b, bf16: 12 sliding (128) and 12 full layers, 8 heads × 64 × 2 × 2 B =
  // 2048 B. Groups of 12, one each. 131,072 tokens: 8192 full blocks; sliding
  // 127 + 4,096 = 4,223 tokens = 264 blocks + 1. Page 16 × 2048 × 12.
  const oss = cfg("configs/openai_gpt-oss-20b.json", 20_914_757_184);
  const o = kvReservedPerSeq(oss, "bf16", 131_072, 2048);
  check("gpt-oss-20b, 131,072 tokens: (8192 + 265) × 12 × 32,768", o === (8192 + 265) * 12 * 32_768, `${o}`);
}

console.log("--- 3. Batch defaults and MIG slices ---");
{
  const b = (id: string, mig?: string) => { const x = batchFor(gpu(id), mig); return `${x.tokens}/${x.seqs}`; };
  check("H200: 8192/1024 (139.8 GiB, ≥ 70 and < 160)", b("h200-141") === "8192/1024");
  check("H100 SXM: 8192/1024", b("h100-80") === "8192/1024");
  check("A100 80GB: 2048/256 (an A100 keeps the small defaults)", b("a100-80") === "2048/256");
  check("MI300X: 16384/1024", b("mi300x-192") === "16384/1024");
  check("RTX 4090: 2048/256", b("rtx4090-24") === "2048/256");
  check("an H200 MIG slice: 2048/256, where vLLM cannot read the physical card", b("h200-141", "4g.71gb") === "2048/256");
  // The guide's lgip values for the A100 40GB, to the hundredth.
  const a = (id: string) => migMem("a100-40", id);
  check("A100 40GB slices as the MIG guide lists them: 4.75, 9.62, 19.50, 39.25 GiB",
    a("1g.5gb") === 4.75 && a("2g.10gb") === 9.62 && a("3g.20gb") === 19.5 && a("7g.40gb") === 39.25,
    `${a("1g.5gb")}, ${a("2g.10gb")}, ${a("3g.20gb")}, ${a("7g.40gb")}`);
  // 139.76 × 19.5 / 39.38 = 69.21: not its name read as GiB.
  check("H200 4g.71gb: 69.21 GiB, usable 63.67", migMem("h200-141", "4g.71gb") === 69.21 && near(usableGiB(gpu("h200-141"), "4g.71gb"), 63.67, 0.005),
    `${migMem("h200-141", "4g.71gb")}`);
  check("a slice's bandwidth is its share of the memory slices: 4/8, 1/8, 8/8",
    migBandwidthShare("h200-141", "4g.71gb") === 0.5 && migBandwidthShare("h200-141", "1g.18gb") === 0.125 &&
    migBandwidthShare("h200-141", "7g.141gb") === 1 && migBandwidthShare("h200-141") === 1);
  check("every profile holds no more than the whole card's instance",
    Object.entries(MIG_PROFILES).every(([id, ps]) => ps.every((p) => p.memGiB <= (gpu(id).visibleGiB ?? gpu(id).vramGiB))));
}

console.log("--- 4. The audit's page: H200 4g.71gb, 128 users at 262,144 tokens ---");
{
  const g = gpu("h200-141");
  const batch = batchFor(g, "4g.71gb");
  const usable = usableGiB(g, "4g.71gb");
  const base = { arch: q38, weightDtype: "fp8" as Dtype, kvDtype: "fp8" as Dtype, batch };
  // Overhead at 2048/256 (overhead.ts's fitted coefficients): runtime 0.15 + 4 × 256 ×
  // 248,320 B; forward 8 × 2048 × 17,408 B; vision 24 × 65,536 × 1152 B; graphs 0.07 +
  // 0.18 + 2048 × 64 × 5120 B. 3.2149 GiB.
  check("overhead 3.215 GiB at the slice's 2048/256", near(overheadPerGpu(q38, batch, 1).totalGiB, 3.2149, 0.0005),
    overheadPerGpu(q38, batch, 1).totalGiB.toFixed(4));
  const r = calculate({ ...base, contextLength: 262_144, concurrency: 128 });
  check("KV/token 32 KiB, KV/request 8.33 GiB", r.kvPerTokenBytes === 32 * 1024 && near(r.kvPerSeqGiB, 8.326, 0.001));
  // Room: 63.6732 − 3.2149 − 28.3026 = 32.156 GiB.
  check("3 users fit at 262,144 tokens", maxConcurrency({ ...base, contextLength: 262_144 }, usable) === 3);
  check("no context holds 128 users", maxContextLength({ ...base, concurrency: 128 }, usable) === 0);
  // 32.156 / 0.33496 (one token's 7 blocks) = 95.998.
  const short = contextShortfall({ ...base, concurrency: 128 }, usable);
  check("the reason is the requests, not the weights: 95 of 128 at the shortest context",
    short?.reason === "requests" && short.users === 95, JSON.stringify(short));
  check("…95 users hold some context, 96 none", maxContextLength({ ...base, concurrency: 95 }, usable) > 0 && maxContextLength({ ...base, concurrency: 96 }, usable) === 0);
  const fit = layoutsOn({ ...base, contextLength: 262_144, concurrency: 128 }, usable, 1)[0];
  check("the layout table agrees: room left, 3 users, no context, 95 at the shortest",
    fit.room && fit.maxUsers === 3 && fit.maxContext === 0 && fit.shortUsers === 95 && !fit.fits, JSON.stringify({ ...fit, layout: undefined }));
  check("the full H200 holds 128 users at some context", contextShortfall({ ...base, batch: batchFor(g), concurrency: 128 }, usableGiB(g)) === null);
  const tooBig = contextShortfall({ ...base, concurrency: 1 }, 20);
  check("on 20 GiB it is the weights", tooBig?.reason === "weights" && tooBig.users === 0);
}

console.log("--- 5. Max users and max context say the same thing ---");
{
  // maxConcurrency(ctx) ≥ n exactly when maxContextLength(n) ≥ ctx, for ctx within the
  // model's own; the layout table's one-GPU row repeats both; a shortfall's reason
  // matches the room. Across seven models and seven cards, tp 1 to 8.
  const llama = cfg("configs/unsloth_Llama-3.1-8B-Instruct.json", 8_030_261_248);
  const models: [string, ModelArch, Dtype, Dtype][] = [
    ["Qwen3.8-27B-FP8", q38, "fp8", "fp8"],
    ["Qwen3.5-397B", cfg("configs-audit/Qwen_Qwen3.5-397B-A17B.json", 403_000_000_000), "fp8", "bf16"],
    ["Llama 3.1 8B", llama, "bf16", "bf16"],
    ["Qwen3-30B-A3B", cfg("configs/Qwen_Qwen3-30B-A3B.json", 30_532_122_624), "bf16", "fp8"],
    ["DeepSeek-V3", cfg("configs/deepseek-ai_DeepSeek-V3.json", 671_026_419_200), "fp8", "bf16"],
    ["Gemma 3 27B", cfg("configs/unsloth_gemma-3-27b-it.json", 27_432_406_640), "bf16", "bf16"],
    ["gpt-oss-20b", cfg("configs/openai_gpt-oss-20b.json", 20_914_757_184), "int4", "bf16"],
  ];
  const cards: [string, string?][] = [["h200-141"], ["h200-141", "4g.71gb"], ["h100-80"], ["a100-80"], ["rtx4090-24"], ["mi300x-192"], ["amd-strixhalo-128"]];
  let cases = 0, bad: string[] = [];
  for (const [name, arch, wd, kd] of models) {
    for (const [id, mig] of cards) {
      const g = gpu(id);
      for (const tp of mig ? [1] : [1, 2, 4, 8]) {
        const batch = batchFor(g, mig);
        const usable = usableGiB(g, mig);
        const base: Omit<CalcInput, "contextLength" | "concurrency"> = { arch, weightDtype: wd, kvDtype: kd, batch, gpus: tp };
        const ctxs = [1, 2048, 8192, 32_768, 131_072, arch.maxContext ?? 131_072].filter((c) => c <= (arch.maxContext ?? Infinity));
        for (const n of [1, 3, 8, 32, 128, 512]) {
          const mcl = maxContextLength({ ...base, concurrency: n }, usable);
          for (const ctx of ctxs) {
            cases++;
            const users = maxConcurrency({ ...base, contextLength: ctx }, usable);
            if (users >= n !== mcl >= ctx) bad.push(`${name} ${id}${mig ? " " + mig : ""} tp${tp} n${n} ctx${ctx}: users ${users}, maxContext ${mcl}`);
          }
          const s = contextShortfall({ ...base, concurrency: n }, usable);
          const least = maxConcurrency({ ...base, contextLength: 1 }, usable);
          const ok = mcl > 0 ? s === null : s !== null && (s.reason === "weights" ? least === 0 && s.users === 0 : s.users === least && least < n);
          if (!ok) bad.push(`${name} ${id} tp${tp} n${n}: shortfall ${JSON.stringify(s)}, maxContext ${mcl}, shortest ${least}`);
          // The table's row for this tensor-parallel group alone, no pipeline or replicas.
          const f = layoutsOn({ ...base, contextLength: 8192, concurrency: n }, usable, tp)
            .find((x) => x.layout.tp === tp && x.layout.pp === 1 && x.layout.dp === 1);
          const u = maxConcurrency({ ...base, contextLength: 8192 }, usable);
          if (f && (f.maxUsers !== u || f.maxContext !== mcl || (f.room && f.shortUsers !== least)))
            bad.push(`${name} ${id} tp${tp} n${n}: layout ${f.maxUsers}/${f.maxContext}/${f.shortUsers} vs ${u}/${mcl}/${least}`);
        }
      }
    }
  }
  check(`${cases} cases: users ≥ n exactly when the context for n reaches ctx; the table and the labels agree`, bad.length === 0,
    bad.slice(0, 5).join(" | "));
}

if (fails) {
  console.log(`\n${fails} FAILED`);
  process.exit(1);
}
console.log("\nALL PASS");
