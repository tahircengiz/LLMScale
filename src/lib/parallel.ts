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
// React-free: GpuFit.tsx, vllm.ts and scripts/test-vllm.ts use it.

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
