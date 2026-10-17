// Tensor-parallel sizes vLLM will accept for a model.
//
// vLLM splits the attention heads across the GPUs of a tensor-parallel group, so
// the group size has to divide the attention-head count (vllm/config/model.py:
// "Total number of attention heads … must be divisible by tensor parallel
// size"). The key-value heads are split too, or replicated when there are fewer of
// them than GPUs, so the size must divide them or be a multiple of them. Checking
// only the key-value heads passed TP=8 for Qwen2.5-7B — 28 heads, 4 KV heads —
// which vLLM refuses.
//
// Also the flags and link form of a layout (calc.ts, layoutsOn), so the GPU fit,
// the vLLM page and the planner write one layout the same way.
//
// React-free: GpuFit.tsx, vllm.ts, planner.ts and scripts/test-vllm.ts use it.

import type { Layout } from "./calc.ts";

/** Whether vLLM accepts `n` GPUs of tensor parallelism for these head counts. */
export function tpValid(n: number, attnHeads: number, kvHeads: number): boolean {
  if (!(n >= 1) || !Number.isInteger(n)) return false;
  return attnHeads % n === 0 && (kvHeads % n === 0 || n % kvHeads === 0);
}

/** The smallest tensor-parallel size at or above `needed` that vLLM accepts, or
 *  null when none up to the head count does (pipeline parallelism is then the way). */
export function nearestTp(needed: number, attnHeads: number, kvHeads: number): number | null {
  for (let n = Math.max(1, Math.ceil(needed)); n <= attnHeads; n++) if (tpValid(n, attnHeads, kvHeads)) return n;
  return null;
}

/** The largest tensor-parallel size at or below `n` that vLLM accepts: what to
 *  use when more GPUs were picked than the heads can be split across. */
export function largestTpAtMost(n: number, attnHeads: number, kvHeads: number): number {
  for (let k = Math.floor(n); k > 1; k--) if (tpValid(k, attnHeads, kvHeads)) return k;
  return 1;
}

/** What a layout sets up (calc.ts, Layout): `dp` replicas of `pp` pipeline stages
 *  of `tp` GPUs, and with `ep` the routed experts spread over each stage's GPUs. */
export type LayoutShape = Pick<Layout, "tp" | "pp" | "dp" | "ep">;

/** A layout in the engine's own terms: "TP 2 · PP 3", "DP 4 · EP". */
export function layoutLabel(l: LayoutShape): string {
  const parts = [l.tp > 1 && `TP ${l.tp}`, l.pp > 1 && `PP ${l.pp}`, l.dp > 1 && `DP ${l.dp}`, l.ep && "EP"].filter(Boolean);
  return parts.length ? parts.join(" · ") : "1 GPU";
}

/** The `vllm serve` flags that set a layout up, in the order the vLLM page lists
 *  them (vllm/engine/arg_utils.py, v0.31.0). One GPU takes none. */
export function layoutArgs(l: LayoutShape): { flag: string; value?: string }[] {
  const out: { flag: string; value?: string }[] = [];
  if (l.tp > 1) out.push({ flag: "--tensor-parallel-size", value: String(l.tp) });
  if (l.pp > 1) out.push({ flag: "--pipeline-parallel-size", value: String(l.pp) });
  if (l.dp > 1) out.push({ flag: "--data-parallel-size", value: String(l.dp) });
  if (l.ep) out.push({ flag: "--enable-expert-parallel" });
  return out;
}

/** The flags as one line: "--tensor-parallel-size 2 --pipeline-parallel-size 3". */
export function layoutFlags(l: LayoutShape): string {
  return layoutArgs(l).map((a) => (a.value !== undefined ? `${a.flag} ${a.value}` : a.flag)).join(" ");
}

/** A layout as a link carries it (`lay=`): "tp2.pp3.dp1", "tp1.pp1.dp4.ep". */
export function layoutKey(l: LayoutShape): string {
  return `tp${l.tp}.pp${l.pp}.dp${l.dp}${l.ep ? ".ep" : ""}`;
}

/** The layout a link's `lay=` names, or null when it names none. */
export function parseLayoutKey(s: string | null | undefined): LayoutShape | null {
  const m = /^tp(\d+)\.pp(\d+)\.dp(\d+)(\.ep)?$/.exec(s ?? "");
  if (!m) return null;
  const [tp, pp, dp] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return tp >= 1 && pp >= 1 && dp >= 1 ? { tp, pp, dp, ep: !!m[4] } : null;
}

/** Whether two layouts are the same shape. */
export function sameLayout(a: LayoutShape, b: LayoutShape): boolean {
  return a.tp === b.tp && a.pp === b.pp && a.dp === b.dp && a.ep === b.ep;
}
