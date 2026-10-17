// The calculator, the vLLM page and the capacity planner on one setup (audit A3,
// A4). Run: node scripts/test-agreement.ts
//
// The three answer different questions — what fits, how to start it, how many GPUs
// a load takes — but they lay GPUs out with one search (calc.ts, layoutsOn and
// layoutFor), ranked with one device's speed (perf.ts, layoutSpeed). The vLLM page
// used to set up tensor parallelism only and the planner to try tensor-parallel
// replicas only, so the page contradicted the calculator in about half the audit's
// cases and the planner could not reach a count the calculator gave with pipeline
// stages. Here, for five models on H100, H200 and RTX PRO 6000:
//   - one GPU: the page warns exactly when the calculator says it does not fit,
//     and names the calculator's count and layout;
//   - 2, 4 and 8 GPUs: the page sets up the calculator's ×N layout, with pipeline
//     stages only when no layout without them holds a request;
//   - the calculator's link (its count and layout) opens a page that fits;
//   - the planner tries only the calculator's layouts, finds the same memory fit
//     for each, reaches the calculator's count for a light load, and its link opens
//     a page set up as its own best option.
import { readFileSync } from "node:fs";
import { calculate, layoutFor, layoutsOn, type Dtype, type ModelArch } from "../src/lib/calc.ts";
import { archFromConfig } from "../src/lib/hf.ts";
import { batchFor, GPUS, stepDevice, usableGiB } from "../src/lib/gpus.ts";
import { findKnownByHfId } from "../src/lib/models.ts";
import { layoutFlags, layoutKey, layoutLabel, parseLayoutKey, sameLayout, type LayoutShape } from "../src/lib/parallel.ts";
import { layoutSpeed } from "../src/lib/perf.ts";
import { planOptions } from "../src/lib/planner.ts";
import { recommend, type VllmRec } from "../src/lib/vllm.ts";

let fails = 0;
let checks = 0;
function check(name: string, cond: boolean, detail = "") {
  checks++;
  if (!cond) {
    console.log(`FAIL  ${name}${detail ? "  — " + detail : ""}`);
    fails++;
  }
}

const cfg = JSON.parse(readFileSync(new URL("./fixtures/configs/deepseek-ai_DeepSeek-V4-Flash-0731.json", import.meta.url), "utf8"));
const v4 = archFromConfig(cfg, 304.18e9)!;
v4.shipped = { dtype: "fp8", bytes: 166_886_535_336 };
v4.activeParams = 27_356_354_494;

/** The precision each loads at on the vLLM page: the checkpoint's, from its config. */
const MODELS: { name: string; hfId: string; arch: ModelArch; weightDtype: Dtype }[] = [
  { name: "Llama 3.3 70B", hfId: "meta-llama/Llama-3.3-70B-Instruct", arch: findKnownByHfId("meta-llama/Llama-3.3-70B-Instruct")!, weightDtype: "bf16" },
  { name: "Qwen3-30B-A3B", hfId: "Qwen/Qwen3-30B-A3B", arch: findKnownByHfId("Qwen/Qwen3-30B-A3B")!, weightDtype: "bf16" },
  { name: "DeepSeek V3", hfId: "deepseek-ai/DeepSeek-V3", arch: findKnownByHfId("deepseek-ai/DeepSeek-V3")!, weightDtype: "fp8" },
  { name: "DeepSeek-V4-Flash", hfId: "deepseek-ai/DeepSeek-V4-Flash", arch: v4, weightDtype: "fp8" },
  { name: "gpt-oss-120b", hfId: "openai/gpt-oss-120b", arch: findKnownByHfId("openai/gpt-oss-120b")!, weightDtype: "int4" },
];
const CARDS = ["h100-80", "h200-141", "rtxpro6000-96"].map((id) => GPUS.find((g) => g.id === id)!);
const CONTEXTS = [8192, 32768, 131072];
const COUNTS = [2, 4, 8];

const PARALLEL = /^--(tensor|pipeline|data)-parallel-size|^--enable-expert-parallel/;
/** The layout flags of a page's command, in its order. */
const parallelOf = (r: VllmRec) =>
  r.flags.filter((f) => PARALLEL.test(f.flag)).map((f) => (f.value !== undefined ? `${f.flag} ${f.value}` : f.flag)).join(" ");
const fitWarn = (r: VllmRec) => r.warnings.find((w) => w.key === "vllm.w.fit" || w.key === "vllm.w.fitNone");
const label = (l: LayoutShape | null | undefined) => (l ? layoutLabel(l) : "none");

const examples: string[] = [];

for (const m of MODELS) {
  for (const g of CARDS) {
    for (const ctx of CONTEXTS.filter((c) => c <= (m.arch.maxContext ?? c))) {
      const tag = `${m.name} @${ctx / 1024}k on ${g.name}`;
      // The vLLM page, balanced and for chat, as VllmPage feeds it.
      const page = (gpuCount: number, layout?: LayoutShape) =>
        recommend({
          hfId: m.hfId, arch: m.arch, priority: "balanced", task: "chat", weightDtype: m.weightDtype,
          gpuVramGiB: g.visibleGiB ?? g.vramGiB, gpuName: g.name, gpuCount, maxModelLen: ctx, layout, device: stepDevice(g),
        });
      const one = page(1);
      // The calculator set to the cache precision the page sets: fp8 for V4 (its
      // recipe), else vLLM's auto. At its 16-bit default the calculator sizes V4's
      // plain bf16 rows, which FlashInfer's backends serve; that is another command.
      const kvDtype: Dtype = one.flags.some((f) => f.flag === "--kv-cache-dtype" && f.value === "fp8") ? "fp8" : "fp16";
      // The calculator's GPU fit for one request at --max-model-len (GpuFit.tsx).
      const input = { arch: m.arch, weightDtype: m.weightDtype, kvDtype, contextLength: ctx, concurrency: 1, batch: batchFor(g) };
      const usable = usableGiB(g);
      const speed = layoutSpeed(input, stepDevice(g));
      const fitsOne = calculate(input).totalGiB <= usable;
      const fewest = fitsOne ? null : layoutFor(input, usable, undefined, speed);
      const count = fitsOne ? 1 : fewest?.gpus ?? null;

      // One GPU: the same verdict, and the calculator's count and layout.
      const w = fitWarn(one);
      check(`${tag}, 1 GPU: the page warns exactly when the calculator does not fit it`, !w === fitsOne, `page ${w?.key ?? "fits"}, calculator ${count ?? "none"}`);
      if (fewest) check(`${tag}, 1 GPU: the page's count and layout are the calculator's`, w?.key === "vllm.w.fit" && w.vars?.gpus === fewest.gpus && w.vars.layout === layoutLabel(fewest), `${JSON.stringify(w?.vars)} vs ${fewest.gpus} ${layoutLabel(fewest)}`);

      // Several GPUs: the calculator's ×N view.
      for (const n of COUNTS) {
        const all = layoutsOn(input, usable, n, speed);
        const calc = all[0];
        const r = page(n);
        check(`${tag}, ${n} GPUs: pipeline stages only when no layout without them holds a request`, calc.layout.pp === 1 || !all.some((f) => f.fits && f.layout.pp === 1), layoutLabel(calc.layout));
        check(`${tag}, ${n} GPUs: the page sets up the calculator's layout`, !!r.layout && sameLayout(r.layout, calc.layout) && parallelOf(r) === layoutFlags(calc.layout), `${parallelOf(r)} vs ${layoutFlags(calc.layout)}`);
        check(`${tag}, ${n} GPUs: the page warns exactly when that layout does not fit`, !fitWarn(r) === calc.fits);
        if (n === 4) examples.push(`${tag}, 4 GPUs: ${label(r.layout)} (${parallelOf(r) || "no flags"}) · ${calc.maxUsers} requests fit · ${calc.stepMs?.toFixed(1)} ms a token`);
      }

      // The calculator's link: its count, with its layout.
      if (fewest) {
        const r = page(fewest.gpus, fewest);
        check(`${tag}: the calculator's ${fewest.gpus} GPUs, laid out as it says, fit on the page`, !fitWarn(r) && parallelOf(r) === layoutFlags(fewest), parallelOf(r));
      }

      // The planner, under a load light enough that only memory decides.
      const light = { rps: 0.01, promptTokens: Math.min(1000, ctx / 2), outputTokens: 100, sharedPrefix: 0, ttftS: 1e3, tpotMs: 1e5 };
      const plan = planOptions({ arch: m.arch, weightDtype: m.weightDtype, kvDtype, maxModelLen: ctx }, light, g);
      const listed = [...plan.options.map((o) => ({ ...o, fits: true })), ...plan.infeasible.filter((x) => x.reason === "memory").map((x) => ({ ...x, fits: false }))];
      const foreign = listed.filter((o) => {
        const there = layoutsOn(input, usable, o.size).find((f) => sameLayout(f.layout, o));
        return !there || there.fits !== o.fits;
      });
      check(`${tag}: every planner layout is the calculator's, with its memory fit`, foreign.length === 0, foreign.slice(0, 3).map((o) => `${o.size}: ${layoutLabel(o)}`).join(", "));
      const best = plan.options[0];
      check(`${tag}: a light load takes the calculator's count on the planner`, (best?.gpus ?? null) === count, `planner ${best ? `${best.gpus} (${layoutLabel(best)})` : "none"} vs calculator ${count}`);
      if (best) {
        // The planner's link: one replica, laid out as the plan has it.
        const r = page(best.size, parseLayoutKey(layoutKey(best))!);
        check(`${tag}: the planner's link sets up its replica`, (best.size === 1 ? !r.layout : !!r.layout && sameLayout(r.layout, best)) && !fitWarn(r), `${parallelOf(r)} vs ${layoutLabel(best)}`);
      }
      if (ctx === 32768 && !fitsOne) examples.push(`${tag}, 1 GPU: needs ${count} (${label(fewest)}); planner, light load: ${best ? `${best.gpus} × ${layoutLabel(best)}` : "none"}`);
    }
  }
}

console.log("--- examples ---\n" + examples.join("\n"));
console.log(fails ? `\n${fails} of ${checks} FAILED` : `\nALL PASS (${checks} checks)`);
process.exit(fails ? 1 : 0);
