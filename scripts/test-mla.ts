// Multi-head latent attention, checked against the paper that introduced it.
// Run: node scripts/test-mla.ts
//
// DeepSeek-V2 (arXiv 2405.04434) §2.1.3 states the KV cache per token for MLA is
// (d_c + d_h^R)·l — one compressed latent per token per layer, shared across every
// head — and that this "is equal to GQA with only 2.25 groups". Both claims are
// reproducible from the config alone, so both are tests rather than comments.
import { kvBytesPerToken, usesMla, calculate, type ModelArch } from "../src/lib/calc.ts";
import { encodeState, decodeState, DEFAULT_STATE } from "../src/lib/urlState.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

// Straight from deepseek-ai/DeepSeek-V3's config.json.
const v3: ModelArch = {
  numParams: 684.53e9,
  numLayers: 61,
  hiddenSize: 7168,
  numAttentionHeads: 128,
  numKeyValueHeads: 128,
  kvLoraRank: 512,
  qkRopeHeadDim: 64,
  maxContext: 163840,
};
/**
 * The same model on the old path, exactly as it shipped: no MLA fields, and no
 * explicit head_dim either, so resolveHeadDim derives 7168/128 = 56. Pinning
 * head_dim to something else here would measure a version of the bug that never
 * existed — the first draft of this test did, and claimed 85x instead of 25x.
 */
const asIfGqa: ModelArch = { ...v3, kvLoraRank: undefined, qkRopeHeadDim: undefined };

console.log("--- the paper's own identity ---");
// d_c + d_h^R = 512 + 64 = 576, and the paper writes that as (9/2)·d_h with
// d_h = 128. If this drifts, the formula no longer matches the source.
check("(d_c + d_h^R) equals 4.5 x head dim", 512 + 64 === 4.5 * 128, `${512 + 64}`);
// GQA with n groups caches 2·n·d_h per layer; setting that equal gives n = 2.25.
const mlaPerLayer = (v3.kvLoraRank! + v3.qkRopeHeadDim!);
const groups = mlaPerLayer / (2 * 128);
check("equivalent to GQA with 2.25 groups, as the paper says", Math.abs(groups - 2.25) < 1e-9, `${groups}`);

console.log("\n--- the formula in the engine ---");
check("DeepSeek-V3 is recognised as MLA", usesMla(v3));
check("a plain GQA model is not", !usesMla(asIfGqa));
const perTokMla = kvBytesPerToken(v3, "fp16");
const perTokGqa = kvBytesPerToken(asIfGqa, "fp16");
check("MLA cache is layers x (d_c + d_h^R) x bytes",
  perTokMla === 61 * 576 * 2, `${(perTokMla / 1024).toFixed(1)} KiB/token`);
// The whole point: this is the error the site used to ship.
check("ignoring MLA overstated the cache ~25x",
  perTokGqa / perTokMla > 24 && perTokGqa / perTokMla < 26, `${(perTokGqa / perTokMla).toFixed(1)}x`);
// The exact figure the live site used to display, kept so the regression is named.
check("the old path showed 13.34 GiB at 8k",
  Math.abs(perTokGqa * 8192 / 1024 ** 3 - 13.34) < 0.02, `${(perTokGqa * 8192 / 1024 ** 3).toFixed(2)} GiB`);

console.log("\n--- head count must not matter ---");
// Every head reads the same latent, so doubling the heads cannot change the cache.
const doubled: ModelArch = { ...v3, numAttentionHeads: 256, numKeyValueHeads: 256 };
check("doubling the heads leaves the cache unchanged", kvBytesPerToken(doubled, "fp16") === perTokMla);
// ...but layers and precision still scale it.
check("halving the layers halves it", kvBytesPerToken({ ...v3, numLayers: 30 }, "fp16") * 61 === perTokMla * 30);
check("fp8 KV halves it", kvBytesPerToken(v3, "fp8") * 2 === perTokMla);

console.log("\n--- what it means in GiB ---");
const at = (arch: ModelArch, ctx: number) =>
  calculate({ arch, weightDtype: "fp8", kvDtype: "fp16", contextLength: ctx,
              concurrency: 1, overheadPct: 0.1, cudaContextGiB: 0.75 });
const mla8k = at(v3, 8192), gqa8k = at(asIfGqa, 8192);
check("KV at 8k is well under a GiB", mla8k.kvCacheGiB < 1, `${mla8k.kvCacheGiB.toFixed(2)} GiB`);
check("the old path put it in the tens of GiB", gqa8k.kvCacheGiB > 13, `${gqa8k.kvCacheGiB.toFixed(1)} GiB`);
// At full context the difference decides whether the model is servable at all.
const mla160k = at(v3, 163840);
check("even at 163k context the KV stays modest", mla160k.kvCacheGiB < 12, `${mla160k.kvCacheGiB.toFixed(1)} GiB`);
check("weights still dominate, as they should for a 685B model",
  mla8k.weightsGiB > mla8k.kvCacheGiB * 100, `${mla8k.weightsGiB.toFixed(0)} vs ${mla8k.kvCacheGiB.toFixed(2)} GiB`);

console.log("\n--- a partial config stays on the ordinary path ---");
// A model that carries only one of the two fields is not MLA; guessing the other
// would be inventing an architecture.
check("kv_lora_rank alone is not MLA", !usesMla({ ...asIfGqa, kvLoraRank: 512 }));
check("qk_rope_head_dim alone is not MLA", !usesMla({ ...asIfGqa, qkRopeHeadDim: 64 }));
check("and such a model keeps the GQA cache", kvBytesPerToken({ ...asIfGqa, kvLoraRank: 512 }, "fp16") === perTokGqa);

console.log("\n--- the state survives a round trip through the URL ---");
// The app writes its own URL, so an arch that cannot be encoded is an arch that
// is lost on the next reload — and on every shared estimate. This shipped broken:
// MLA worked when the model was resolved, then reverted to GQA on refresh.
const encoded = encodeState({ ...DEFAULT_STATE, hfId: "deepseek-ai/DeepSeek-V3", arch: v3 });
const back = decodeState(encoded);
check("the URL carries the MLA fields", /[?&]kl=512/.test("?" + encoded) && /[?&]qr=64/.test("?" + encoded),
  encoded.split("&").filter((x) => /^(kl|qr)=/.test(x)).join(" ") || "(absent)");
check("the decoded arch is still MLA", !!back.arch && usesMla(back.arch));
check("and its cache matches the original", !!back.arch && kvBytesPerToken(back.arch, "fp16") === perTokMla,
  back.arch ? `${(kvBytesPerToken(back.arch, "fp16") / 1024).toFixed(1)} KiB` : "no arch");
// A non-MLA model must not pick the fields up from nowhere.
const plain = decodeState(encodeState({ ...DEFAULT_STATE, hfId: "x", arch: asIfGqa }));
check("a GQA model round-trips as GQA", !!plain.arch && !usesMla(plain.arch));

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
