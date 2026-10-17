// The capacity planner (E1). Run: node scripts/test-planner.ts
//
// No measurement to hold it to yet, so these check that it behaves: more load
// takes more GPUs, a tighter latency target takes more, a model that does not fit
// one card is split, and every option it returns meets the targets it was given.

import { planOptions, type ModelSetup, type Workload } from "../src/lib/planner.ts";
import { findKnownByHfId } from "../src/lib/models.ts";
import type { Gpu } from "../src/lib/gpus.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

// H100 SXM as NVIDIA lists it, dense.
const H100: Gpu = { id: "h100-80", name: "H100", vramGiB: 80, category: "datacenter", vendor: "NVIDIA", bandwidthGBs: 3350, tflops: { bf16: 989, fp8: 1979 } };
const llama8 = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;
const llama70 = findKnownByHfId("meta-llama/Llama-3.3-70B-Instruct")!;
const m8: ModelSetup = { arch: llama8, weightDtype: "bf16", kvDtype: "fp16", maxModelLen: 8192 };
const chat: Workload = { rps: 10, promptTokens: 2048, outputTokens: 256, sharedPrefix: 0, ttftS: 1, tpotMs: 50 };
const best = (m: ModelSetup, w: Workload, g = H100) => planOptions(m, w, g).options[0];

console.log("--- a small model ---");
{
  const p = best(m8, chat);
  // A 2k prompt is ~57 ms of prefill; at ~10 req/s that is 60% of the GPU's time,
  // and decode, stretched by it, reaches the 50 ms per token target. A request's
  // fixed costs (perf.ts) add to its first token, not to the GPU's busy time.
  check("Llama 3.1 8B, 10 req/s on H100s: one GPU", p.tp === 1 && p.replicas === 1, `${p.replicas}× TP${p.tp}, ${p.replicaRps.toFixed(1)} req/s each`);
  check("…and 15 req/s two", best(m8, { ...chat, rps: 15 }).gpus === 2);
  check("…held back by time per token", p.limit === "tpot", p.limit);
  check("…within both targets at its share", p.tpotMs <= 50 && p.ttftS <= 1, `${p.tpotMs.toFixed(1)} ms, ${p.ttftS.toFixed(2)} s`);
  const busy = best(m8, { ...chat, rps: 200 });
  check("twenty times the load takes more GPUs", busy.gpus > p.gpus, `${busy.gpus} GPUs`);
  check("…and the count covers it", busy.replicas * busy.replicaRps >= 200 - 1e-6);
  const tight = best(m8, { ...chat, rps: 200, tpotMs: 20 });
  check("a tighter time per token takes at least as many", tight.gpus >= busy.gpus, `${tight.gpus} vs ${busy.gpus}`);
  check("a shared prefix needs no more GPUs", best(m8, { ...chat, rps: 200, sharedPrefix: 1536 }).gpus <= busy.gpus);
}

console.log("--- a model that does not fit one card ---");
{
  const m70: ModelSetup = { arch: llama70, weightDtype: "bf16", kvDtype: "fp16", maxModelLen: 8192 };
  const r = planOptions(m70, chat, H100);
  check("Llama 3.3 70B at BF16 cannot run on one H100", r.infeasible.some((x) => x.tp === 1 && x.reason === "memory"));
  check("…so every option splits it", r.options.length > 0 && r.options.every((o) => o.tp >= 2), r.options.map((o) => `${o.replicas}×TP${o.tp}`).join(", "));
  const fp8 = planOptions({ ...m70, weightDtype: "fp8" }, chat, H100).options[0];
  check("FP8 weights need no more GPUs than BF16", fp8.gpus <= r.options[0].gpus, `${fp8.gpus} vs ${r.options[0].gpus}`);
}

console.log("--- a request's fixed costs are latency, not GPU time ---");
{
  // An embedding-sized model reading 500-token prompts: the ~6 ms a request costs
  // anyway lengthens each first token but is not time the GPU takes from the next
  // prompt (the phase-3b release review found it capping one H100 at ~117 req/s).
  const tiny: ModelSetup = { arch: findKnownByHfId("Qwen/Qwen2.5-0.5B-Instruct")!, weightDtype: "bf16", kvDtype: "fp16", maxModelLen: 8192 };
  const embed: Workload = { rps: 300, promptTokens: 500, outputTokens: 0, sharedPrefix: 0, ttftS: 1, tpotMs: 50 };
  const p = best(tiny, embed);
  check("a 0.5B model reading 500-token prompts carries 300 req/s on one H100", p?.gpus === 1 && p.replicaRps > 300, `${p?.gpus} GPUs, ${p?.replicaRps.toFixed(0)} req/s`);
  check("…its first token still carries the request's fixed cost", p.ttftS > 0.006, `${(p.ttftS * 1000).toFixed(1)} ms`);
}

console.log("--- targets it cannot meet ---");
{
  // Eight GPUs read a 2k prompt in ~9 ms, on top of ~9 ms a request costs anyway:
  // its handling, every layer's kernels and the all-reduces between the GPUs.
  check("a 20 ms first token takes eight GPUs", best(m8, { ...chat, ttftS: 0.02 })?.tp === 8);
  const r = planOptions(m8, { ...chat, ttftS: 0.01 }, H100);
  check("10 ms is out of reach on any split", r.options.length === 0 && r.infeasible.every((x) => x.reason === "ttft"));
  const slow = planOptions(m8, { ...chat, tpotMs: 0.5 }, H100);
  check("so is 0.5 ms per token", slow.options.length === 0 && slow.infeasible.some((x) => x.reason === "tpot"));
  const noSpec: Gpu = { ...H100, tflops: undefined };
  check("a device without TFLOPS is not planned", planOptions(m8, chat, noSpec).infeasible.every((x) => x.reason === "noTflops"));
}

console.log("--- the limits it names ---");
{
  const longCtx = best(m8, { ...chat, promptTokens: 6000, outputTokens: 1500, rps: 50 });
  check("long requests fill the KV cache or slow the token rate first", longCtx.limit === "kv" || longCtx.limit === "tpot", longCtx.limit);
  const longPrompt = best(m8, { ...chat, promptTokens: 7000, outputTokens: 32, ttftS: 0.3, rps: 50 });
  check("long prompts with short replies run out of first-token time", longPrompt.limit === "ttft" || longPrompt.limit === "prefill", longPrompt.limit);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
