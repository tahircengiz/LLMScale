// Unit test for the Model Anatomy engine. Run: node scripts/test-anatomy.ts
import { computeParamDist, classifyDtype, dtypePartsOf } from "../src/lib/anatomy.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const near = (a: number, b: number, tolFrac = 0.02) => Math.abs(a - b) <= Math.abs(b) * tolFrac;
const B = (n: number) => (n / 1e9).toFixed(2) + "B";

console.log("--- param distribution: Qwen2.5-7B (dense) ---");
const qwen = computeParamDist({
  numParams: 7.6156e9, numLayers: 28, hidden: 3584, attnHeads: 28, kvHeads: 4, headDim: 128,
  vocab: 152064, tieEmbeddings: false, isMoE: false,
});
check("Qwen embeddings ≈ 1.09B", near(qwen.embeddings, 1.09e9), B(qwen.embeddings));
check("Qwen attention ≈ 0.82B", near(qwen.attention, 0.822e9, 0.03), B(qwen.attention));
check("Qwen mlp (remainder) ≈ 5.70B", near(qwen.ffn, 5.70e9), B(qwen.ffn));
check("Qwen ffnLabel = mlp", qwen.ffnLabel === "mlp");
check("Qwen parts sum to total", near(qwen.embeddings + qwen.attention + qwen.ffn, 7.6156e9, 1e-6));

console.log("\n--- param distribution: gpt-oss-20b (MoE) ---");
const oss = computeParamDist({
  numParams: 21.511e9, numLayers: 24, hidden: 2880, attnHeads: 64, kvHeads: 8, headDim: 64,
  vocab: 201088, tieEmbeddings: false, isMoE: true, numExperts: 32, expertsPerTok: 4,
});
check("gpt-oss experts (remainder) ≈ 19.7B", near(oss.ffn, 19.7e9, 0.03), B(oss.ffn));
check("gpt-oss ffnLabel = experts", oss.ffnLabel === "experts");
check("gpt-oss active ≈ experts×4/32", near(oss.ffnActive ?? 0, oss.ffn * 4 / 32, 1e-6), B(oss.ffnActive ?? 0));
check("gpt-oss parts sum to total", near(oss.embeddings + oss.attention + oss.ffn, 21.511e9, 1e-6));

console.log("\n--- edge cases ---");
const noVocab = computeParamDist({ numParams: 7e9, numLayers: 32, hidden: 4096, attnHeads: 32, kvHeads: 8, headDim: 128 });
check("missing vocab → embeddings 0, rest sums", noVocab.embeddings === 0 && near(noVocab.attention + noVocab.ffn, 7e9, 1e-6), B(noVocab.ffn));
const tiny = computeParamDist({ numParams: 1e6, numLayers: 2, hidden: 4096, attnHeads: 32, kvHeads: 8, headDim: 128, vocab: 152064 });
check("tiny total → no negative slices, clamped to total", tiny.embeddings >= 0 && tiny.attention >= 0 && tiny.ffn >= 0 && near(tiny.embeddings + tiny.attention + tiny.ffn, 1e6, 1e-6));

console.log("\n--- dtype classification ---");
check("BF16 → half", classifyDtype("BF16") === "half");
check("U8 → int4 (packed)", classifyDtype("U8") === "int4");
check("F8_E4M3 → fp8", classifyDtype("F8_E4M3") === "fp8");
check("F32 → full", classifyDtype("F32") === "full");
check("I8 → int8", classifyDtype("I8") === "int8");
check("I32 → other", classifyDtype("I32") === "other");

const parts = dtypePartsOf({ BF16: 1804459584, U8: 19707494400 });
check("dtypeParts sorted desc (U8 first for gpt-oss)", parts[0].dtype === "U8" && parts[0].tier === "int4");
check("dtypeParts drops zero counts", dtypePartsOf({ BF16: 100, I32: 0 }).length === 1);

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
