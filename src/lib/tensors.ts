// Tensor names, as a checkpoint's safetensors index (or a single file's header)
// lists them: reduced to templates and per-layer stacks, and read for the layers
// only speculative decoding runs. The Serving Brief reads them (serving.ts), and
// so does the sizing, to leave out only the speculative layers a checkpoint ships
// (hf.ts, resolveModel).

/** Tensor names reduced to what the brief reads: every name with its numbers
 *  replaced by {n}, and how many tensors each numbered stack holds per layer.
 *  DeepSeek-V3's 91,991 names become ~60 templates, small enough for a fixture. */
export interface TensorDigest {
  total: number;
  templates: Record<string, number>;
  /** e.g. { "model.layers": { "0": 12, …, "61": 1564 } } */
  stacks: Record<string, Record<string, number>>;
}

/** A numbered stack and its layer: "model.layers.61." → ["model.layers", "61"]. */
export const STACK = /^((?:[\w-]+\.)*?(?:layers|h|blocks|mtp_layers|mtp_modules))\.(\d+)\./;

export function digestTensors(names: readonly string[]): TensorDigest {
  const templates: Record<string, number> = {};
  const stacks: Record<string, Record<string, number>> = {};
  for (const name of names) {
    const t = name.replace(/\.\d+(?=\.|$)/g, ".{n}");
    templates[t] = (templates[t] ?? 0) + 1;
    const m = STACK.exec(name);
    if (m) {
      const s = (stacks[m[1]] ??= {});
      s[m[2]] = (s[m[2]] ?? 0) + 1;
    }
  }
  return { total: names.length, templates, stacks };
}

const SIDE_STACK = /vision|visual|audio|mtp|nextn|encoder|projector/i;

/** The decoder's own layer stack: the largest numbered stack that is not a vision,
 *  audio or MTP tower. */
function mainStack(d: TensorDigest): string | undefined {
  let best: string | undefined;
  let size = 0;
  for (const [name, layers] of Object.entries(d.stacks)) {
    if (SIDE_STACK.test(name)) continue;
    const n = Object.values(layers).reduce((a, b) => a + b, 0);
    if (n > size) [best, size] = [name, n];
  }
  return best;
}

/** The tensors of the speculative-decoding (MTP) layers a checkpoint ships, for a
 *  decoder of `L` layers, and where they sit; 0 when it ships none. */
export function specTensors(d: TensorDigest, L: number | undefined): { tensors: number; where?: string } {
  let tensors = 0;
  let where: string | undefined;
  // DeepSeek and GLM append the MTP block to the decoder stack as layer N…
  const main = mainStack(d);
  if (main && typeof L === "number") {
    const extra = Object.entries(d.stacks[main]).filter(([i]) => Number(i) >= L);
    tensors = extra.reduce((a, [, n]) => a + n, 0);
    if (tensors) where = `${main}.${extra.map(([i]) => i).join(",")}.*`;
  }
  // …Qwen3-Next and MiMo keep it under a name of its own.
  if (!tensors) {
    const named = Object.keys(d.templates).filter((t) => /(^|\.)(mtp|nextn)([._]|$)/.test(t));
    tensors = named.reduce((a, t) => a + d.templates[t], 0);
    // "model.mtp_layers.{n}." reads better as "model.mtp_layers.*".
    if (tensors) where = commonPrefix(named).replace(/(\.\{n\})+\.$/, ".") + "*";
  }
  return { tensors, where };
}

function commonPrefix(xs: string[]): string {
  if (!xs.length) return "";
  let p = xs[0];
  for (const x of xs) while (!x.startsWith(p)) p = p.slice(0, p.lastIndexOf(".", p.length - 2) + 1);
  return p;
}
