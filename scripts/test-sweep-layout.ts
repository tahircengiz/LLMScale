// Property sweep of the multi-GPU layouts (audit phase 4, from the 2026-10-15
// audit's sweep-layout.ts and layout-gap.ts). Run: node scripts/test-sweep-layout.ts
//
// The calculator answers "how many GPUs" with layoutFor (the badge, "needs N") and
// "what do N of them hold" with layoutsOn (the ×N view), ranked by the card's speed
// as the page ranks them. The audit found the two disagreeing: the badge said 8 where
// ×5 already fit, and the count fell as users grew. Here, over every preset and the
// regression fixtures' edge architectures (sweep-kit.ts), on single cards and
// unified devices, three precisions and two memory shares (each model on a third of
// the cards, in rotation, at BF16 and one of the other combinations — 5 s where the
// audit's every-card run took 6 minutes):
//   - one GPU is the single-card view, and "needs 1" exactly when it fits;
//   - the count's layout fits, and no smaller count the ×N view calls a fit exists;
//   - the count never falls as users or context grow;
//   - ×N lists the layouts that hold the load first (phase 3c), the one holding the
//     most first when none does, never past the model's context, and k·m GPUs hold
//     at least k times what m hold.
// test-layout.ts pins the particular layouts; this checks the rules everywhere.

import { calculate, layoutFor, layoutsOn, maxConcurrency, maxContextLength, type CalcInput, type Dtype } from "../src/lib/calc.ts";
import { batchFor, stepDevice, usableGiB } from "../src/lib/gpus.ts";
import { layoutSpeed } from "../src/lib/perf.ts";
import { finish, Prop, SWEEP_CARDS, sweepModels } from "./sweep-kit.ts";

const t0 = Date.now();
const models = await sweepModels();
const P = {
  one: new Prop("×1 is the single-card view (fits, max users, max context)"),
  forOne: new Prop("'needs 1' exactly when calculate() fits one card"),
  forFits: new Prop("the count's layout fits every GPU, and ×N at that count has a fitting layout"),
  fewer: new Prop("no smaller count that ×m calls a fit ('needs N' vs '×m fits', N <= 16)"),
  mono: new Prop("the count never falls as users or context grow"),
  order: new Prop("×N: every layout that holds the load before any that does not"),
  noneMost: new Prop("×N when none holds the load: the first holds the most"),
  ctxCap: new Prop("×N max context never above the model's"),
  scale: new Prop("k·m GPUs hold at least k times the requests m hold (best layout of each)"),
};
const CTXS = [1, 2048, 8192, 32768, 131072, 1048576];
const USERS = [1, 4, 16, 64, 256];
const COMBOS: [Dtype, Dtype, number][] = [["bf16", "fp16", 0.92], ["bf16", "fp16", 0.6], ["fp8", "fp8", 0.92], ["int4", "fp16", 0.92]];
const COUNTS = [1, 2, 3, 4, 6, 8, 12, 16];
const describe = (l: { tp: number; pp: number; dp: number; ep: boolean }) => `tp${l.tp} pp${l.pp} dp${l.dp}${l.ep ? " ep" : ""}`;

const runs: { id: string; arch: (typeof models)[number]["arch"]; g: (typeof SWEEP_CARDS)[number]; combo: [Dtype, Dtype, number] }[] = [];
models.forEach(({ id, arch }, mi) =>
  SWEEP_CARDS.forEach((g, ci) => {
    if ((mi + ci) % 3) return;
    for (const combo of [COMBOS[0], COMBOS[1 + (Math.floor((mi + ci) / 3) % 3)]]) runs.push({ id, arch, g, combo });
  }),
);
for (const { id, arch, g, combo: [wd, kd, util] } of runs) {
  const usable = usableGiB(g, undefined, util);
  const batch = batchFor(g);
  const dev = stepDevice(g);
  const grid: number[][] = [];
  for (const ctx of CTXS) {
    const row: number[] = [];
    for (const u of USERS) {
      const input: CalcInput = { arch, weightDtype: wd, kvDtype: kd, contextLength: ctx, concurrency: u, batch };
      const speed = layoutSpeed(input, dev);
      const tag = `${id} ${wd}/${kd} ${g.id} share ${util} ctx ${ctx} users ${u}`;
      const fits1 = calculate(input).totalGiB <= usable;
      const lf = layoutFor(input, usable, undefined, speed);
      const n = lf?.gpus ?? Infinity;
      row.push(fits1 ? 1 : n);
      P.forOne.ok((n === 1) === fits1, () => `${tag}: fits one ${fits1}, count ${n}`);
      const on1 = layoutsOn(input, usable, 1, speed)[0];
      const mc = maxConcurrency(input, usable);
      const mcl = maxContextLength(input, usable);
      P.one.ok(on1.fits === fits1 && on1.maxUsers === mc && on1.maxContext === mcl, () => `${tag}: ×1 fits ${on1.fits}/${fits1}, users ${on1.maxUsers}/${mc}, context ${on1.maxContext}/${mcl}`);
      if (lf) {
        const on = layoutsOn(input, usable, lf.gpus, speed);
        P.forFits.ok(lf.perGpuGiB <= usable + 1e-9 && on.some((f) => f.fits), () => `${tag}: count ${lf.gpus} (${describe(lf)}) ${lf.perGpuGiB.toFixed(1)}/${usable.toFixed(1)} GiB, ×${lf.gpus} fits ${on.some((f) => f.fits)}`);
        if (lf.gpus > 1 && lf.gpus <= 16 && util === 0.92 && !g.unified) {
          let found = 0;
          for (let m = 1; m < lf.gpus && !found; m++) if (layoutsOn(input, usable, m, speed).some((f) => f.fits)) found = m;
          P.fewer.ok(!found, () => `${tag}: needs ${lf.gpus} (${describe(lf)}) but ×${found} fits`);
        }
      }
      // ×N on a few counts, at two contexts.
      if ((u === 4 || u === 64) && (ctx === 8192 || ctx === 131072) && !g.unified) {
        const most = new Map<number, number>();
        for (const c of COUNTS) {
          const on = layoutsOn(input, usable, c, speed);
          if (!on.length) continue;
          const firstMiss = on.findIndex((f) => !f.fits);
          P.order.ok(firstMiss < 0 || on.slice(firstMiss).every((f) => !f.fits), () => `${tag} ×${c}: ${on.map((f) => `${describe(f.layout)} ${f.fits ? "fits" : "no"}`).join(", ")}`);
          const top = Math.max(...on.map((f) => f.maxUsers));
          if (!on.some((f) => f.fits)) P.noneMost.ok(on[0].maxUsers === top, () => `${tag} ×${c}: first ${describe(on[0].layout)} holds ${on[0].maxUsers}, best ${top}`);
          P.ctxCap.ok(!arch.maxContext || on.every((f) => f.maxContext <= arch.maxContext!), () => `${tag} ×${c}: ${Math.max(...on.map((f) => f.maxContext))} > ${arch.maxContext}`);
          most.set(c, top);
        }
        for (const [m, um] of most) for (const [c, uc] of most) {
          if (c > m && c % m === 0) P.scale.ok(uc >= (c / m) * um, () => `${tag}: ×${m} holds ${um}, ×${c} only ${uc}`);
        }
      }
    }
    grid.push(row);
  }
  for (let i = 0; i < CTXS.length; i++) for (let j = 0; j < USERS.length; j++) {
    const down = (j > 0 && grid[i][j] < grid[i][j - 1]) || (i > 0 && grid[i][j] < grid[i - 1][j]);
    P.mono.ok(!down, () => `${id} ${wd}/${kd} ${g.id} share ${util} ctx ${CTXS[i]} users ${USERS[j]}: ${grid[i][j - 1] ?? "-"} (fewer users), ${grid[i - 1]?.[j] ?? "-"} (shorter context) -> ${grid[i][j]}`);
  }
}

console.log(`${models.length} models, ${SWEEP_CARDS.length} cards, ${COMBOS.length} precision/share combinations: ${runs.length} runs`);
finish(Object.values(P), t0);
