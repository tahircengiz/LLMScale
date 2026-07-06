// Cross-tab + edge-case smoke test. Hits the live HF API (like smoke-hf.ts).
// Run: node scripts/smoke-cross.ts
//
// Verifies that the three model-driven tabs stay consistent for a diverse,
// popular model set: the sizing engine (calc), the task-fit engine (fit) and
// the vLLM recommender (vllm) must all agree on the model's basic nature
// (quant, MoE, modality). Also exercises calc engine edge cases.

import { calculate, maxConcurrency, maxContextLength, type Dtype, type ModelArch } from "../src/lib/calc.ts";
import { resolveModel } from "../src/lib/hf.ts";
import { extractCaps, scoreFit } from "../src/lib/fit.ts";
import { detectQuant, recommend } from "../src/lib/vllm.ts";

let fails = 0;
let warns = 0;
function check(name: string, cond: boolean, detail = "") {
  if (!cond) fails++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function warn(name: string, detail = "") {
  warns++;
  console.log(`WARN  ${name}${detail ? "  — " + detail : ""}`);
}

// ---------- A. calc engine edge cases (no network) ----------
console.log("===== A. calc engine edge cases =====");
const D = { weightDtype: "bf16" as Dtype, kvDtype: "fp16" as Dtype, overheadPct: 0.1, cudaContextGiB: 0.75 };
const a7b: ModelArch = { numParams: 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8, headDim: 128 };

// zero params
const zp = calculate({ arch: { ...a7b, numParams: 0 }, contextLength: 8192, concurrency: 1, ...D });
check("zero params → weights 0, total finite", zp.weightsGiB === 0 && Number.isFinite(zp.totalGiB), zp.totalGiB.toFixed(2));

// weights exceed budget → 0 users, 0 context
const mcZero = maxConcurrency({ arch: { ...a7b, numParams: 400e9 }, contextLength: 8192, ...D }, 24);
check("weights > budget → maxConcurrency 0", mcZero === 0, String(mcZero));
const mctZero = maxContextLength({ arch: { ...a7b, numParams: 400e9 }, concurrency: 1, ...D }, 24);
check("weights > budget → maxContext 0", mctZero === 0, String(mctZero));

// headDim derived when missing
const noHd = calculate({ arch: { numParams: 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8 }, contextLength: 1024, concurrency: 1, ...D });
check("headDim derived = hidden/attnHeads", noHd.headDim === 128, String(noHd.headDim));

// degenerate KV (0 kv heads) should not silently return Infinity users
const degen = maxConcurrency({ arch: { ...a7b, numKeyValueHeads: 0 }, contextLength: 8192, ...D }, 80);
check("0 kv-heads → maxConcurrency is finite (not Infinity)", Number.isFinite(degen), String(degen));

// huge concurrency stays finite
const huge = calculate({ arch: a7b, contextLength: 8192, concurrency: 100000, ...D });
check("huge concurrency → finite total", Number.isFinite(huge.totalGiB), huge.totalGiB.toFixed(0) + " GiB");

// fp8 KV halves KV vs fp16
const kv16 = calculate({ arch: a7b, contextLength: 8192, concurrency: 1, ...D });
const kv8 = calculate({ arch: a7b, contextLength: 8192, concurrency: 1, ...D, kvDtype: "fp8" });
check("fp8 KV ≈ ½ fp16 KV", Math.abs(kv8.kvPerSeqGiB * 2 - kv16.kvPerSeqGiB) < 1e-6, `${kv8.kvPerSeqGiB.toFixed(3)} vs ${kv16.kvPerSeqGiB.toFixed(3)}`);

// ---------- B. cross-tab consistency on real models ----------
console.log("\n===== B. cross-tab consistency (live HF) =====");
// expectation flags: q=expected weight bucket, moe, modality
const MODELS: { id: string; expectQuant?: Dtype | "any4" | "any8"; moe?: boolean; modality?: "gen" | "embed" | "vision" }[] = [
  { id: "openai/gpt-oss-20b", expectQuant: "int4", moe: true, modality: "gen" },
  { id: "openai/gpt-oss-120b", expectQuant: "int4", moe: true, modality: "gen" },
  { id: "Qwen/Qwen3.6-27B", expectQuant: "bf16", moe: false, modality: "gen" },
  { id: "Qwen/Qwen3.6-35B-A3B", moe: true, modality: "gen" },
  { id: "Qwen/Qwen2.5-7B-Instruct", expectQuant: "bf16", moe: false, modality: "gen" },
  { id: "Qwen/Qwen2.5-7B-Instruct-AWQ", expectQuant: "int4", modality: "gen" },
  { id: "RedHatAI/Qwen3-8B-FP8-dynamic", expectQuant: "fp8", modality: "gen" },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", moe: true, modality: "gen" },
  { id: "BAAI/bge-m3", modality: "embed" },
  { id: "Qwen/Qwen2.5-VL-7B-Instruct", modality: "vision" },
];

for (const m of MODELS) {
  let r;
  try {
    r = await resolveModel(m.id);
  } catch (e) {
    warn(`resolve failed: ${m.id}`, String((e as Error).message));
    continue;
  }
  const caps = extractCaps({ hfId: m.id, arch: r.arch, numParams: r.numParams, modelType: r.modelType, isMoE: r.isMoE, tags: r.tags, pipelineTag: r.pipelineTag });
  const nameQuant = detectQuant(m.id);
  const tag = `${m.id}  [w=${r.weightDtype ?? "-"} moe=${r.isMoE ?? false} emb=${caps.embedding} vis=${caps.vision}]`;

  // quant expectation
  if (m.expectQuant) {
    const w = r.weightDtype;
    const ok =
      m.expectQuant === "any4" ? w === "int4" :
      m.expectQuant === "any8" ? w === "int8" || w === "fp8" :
      w === m.expectQuant;
    check(`quant ${m.id} → ${m.expectQuant}`, ok, `got ${w}`);
  }
  // MoE expectation
  if (m.moe !== undefined) check(`MoE ${m.id} = ${m.moe}`, Boolean(r.isMoE) === m.moe, `got ${r.isMoE}`);
  // modality expectation via fit caps
  if (m.modality === "embed") check(`modality ${m.id} = embed`, caps.embedding, tag);
  if (m.modality === "vision") check(`modality ${m.id} = vision`, caps.vision, tag);
  if (m.modality === "gen") check(`modality ${m.id} = generative`, caps.generative && !caps.embedding, tag);

  // CROSS-TAB: when sizing detects a quant that the name-based detectQuant
  // misses (gpt-oss MXFP4), the vLLM recommender must still size it correctly
  // via the weightDtype override — otherwise it emits a spurious fit warning.
  if (r.arch && r.weightDtype && (r.weightDtype === "int4" || r.weightDtype === "fp8") && !nameQuant) {
    const g = { hfId: m.id, arch: r.arch, priority: "balanced" as const, task: "chat" as const, gpuVramGiB: 80, gpuCount: 1, maxModelLen: 8192 };
    const withDt = recommend({ ...g, weightDtype: r.weightDtype });
    const withoutDt = recommend(g);
    const fitKey = (x: { warnings: { key: string }[] }) => x.warnings.some((w) => w.key === "vllm.w.fit");
    check(`vLLM sizes ${m.id} via weightDtype (no spurious fit warn)`, !fitKey(withDt), `w/dtype fit-warn=${fitKey(withDt)}, w/o=${fitKey(withoutDt)}`);
  }

  // sanity: fit score for chat should be a number 0..100
  if (r.arch) {
    const f = scoreFit(caps, "chat");
    check(`fit chat score in 0..100 ${m.id}`, f.overall >= 0 && f.overall <= 100, `${f.overall}`);
  }
}

console.log(`\n${fails === 0 ? "ALL PASS ✅" : fails + " FAILURE(S) ❌"}  (${warns} warning(s))`);
process.exit(fails === 0 ? 0 : 1);
