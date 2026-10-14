// GPU Compare (gpu-compare.html): two to four devices side by side, as their
// datasheets have them. Nothing here sizes a model — the calculator does that.
// React-free, so the tests and the build-time page generators can import it.

import { migProfilesFor, runsVllm, type Gpu } from "./gpus.ts";

export const MAX_GPUS = 4;
export const DEFAULT_GPU_IDS = ["rtx5090-32", "h100-80", "nv-dgxspark-128"];

/** Largest number of MIG instances, when the device can be partitioned. */
export function migMax(g: Gpu): number | undefined {
  const mig = migProfilesFor(g.id);
  return mig.length ? Math.max(...mig.map((p) => p.max)) : undefined;
}

/** The engine that serves models on it: vLLM on CUDA or ROCm, otherwise llama.cpp / MLX. */
export function servedBy(g: Gpu): "cuda" | "rocm" | "metal" {
  return !runsVllm(g) ? "metal" : g.vendor === "AMD" ? "rocm" : "cuda";
}

/** Which columns hold a row's best value: none when fewer than two columns have
 *  one or all of them tie, so a highlight always means a difference. */
export function bestOf(vals: (number | undefined)[], higher = true): boolean[] {
  const nums = vals.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length < 2 || nums.every((v) => v === nums[0])) return vals.map(() => false);
  const best = higher ? Math.max(...nums) : Math.min(...nums);
  return vals.map((v) => v === best);
}

/** The ids a link asks for, known and unique, at most MAX_GPUS; the default
 *  set when it names none. */
export function parseGpuIds(param: string | null, known: readonly Gpu[]): string[] {
  const ids = (param ?? "").split(",").map((s) => s.trim()).filter((id) => known.some((g) => g.id === id));
  const unique = [...new Set(ids)].slice(0, MAX_GPUS);
  return unique.length ? unique : DEFAULT_GPU_IDS;
}
