// Unit test for the device-grid split. The grid once dropped the selected device
// into the collapsed "non-fitting" group the moment the model outgrew it, so the
// page described a card the reader could no longer see.
// Run: node scripts/test-devicegrid.ts
import { splitDevices } from "../src/lib/deviceGrid.ts";
import { GPUS, usableGiB } from "../src/lib/gpus.ts";
import { calculate } from "../src/lib/calc.ts";
import { DEFAULT_STATE } from "../src/lib/urlState.ts";
import { HERO_MODEL_ID, findKnownByHfId } from "../src/lib/models.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

// ── 1. the split itself, on a toy list ────────────────────────────────────
// Capacity in arbitrary units; the model needs 10.
const toy = [
  { id: "a", cap: 4 },
  { id: "b", cap: 8 },
  { id: "c", cap: 16 },
  { id: "d", cap: 32 },
];
const need = 10;
const split = (selId: string) =>
  splitDevices(toy, (d) => need <= d.cap, (d) => d.id === selId);
const ids = (ds: { id: string }[]) => ds.map((d) => d.id).join(",");

console.log("--- the split ---");
const fitSel = split("c");
check("a fitting selection leaves the groups alone", ids(fitSel.visible) === "c,d" && ids(fitSel.hidden) === "a,b",
  `visible ${ids(fitSel.visible)} | hidden ${ids(fitSel.hidden)}`);
check("a fitting selection is not flagged over budget", !fitSel.selectedOverBudget);

const overSel = split("a");
check("an over-budget selection stays visible", overSel.visible.some((d) => d.id === "a"), ids(overSel.visible));
check("and is not also counted as hidden", !overSel.hidden.some((d) => d.id === "a"), ids(overSel.hidden));
check("the hidden count drops to what is really hidden", overSel.hidden.length === 1, ids(overSel.hidden));
check("the promotion is reported", overSel.selectedOverBudget);
check("input order survives in both groups", ids(overSel.visible) === "a,c,d" && ids(overSel.hidden) === "b",
  `visible ${ids(overSel.visible)} | hidden ${ids(overSel.hidden)}`);
check("something still fits on its own merit", overSel.anyFits);

// Nothing in the tier fits: the selection is the only visible card, and the
// caller still has to be told to print "none in this tier fit this model".
const noneFit = splitDevices(toy, () => false, (d) => d.id === "b");
check("with nothing fitting, only the selection shows", ids(noneFit.visible) === "b", ids(noneFit.visible));
check("and anyFits stays false", !noneFit.anyFits);
check("the rest are hidden", ids(noneFit.hidden) === "a,c,d", ids(noneFit.hidden));

// A selection outside the list (a category switch mid-render) must not invent one.
const absent = splitDevices(toy, (d) => need <= d.cap, (d) => d.id === "zzz");
check("an absent selection promotes nothing", ids(absent.visible) === "c,d" && !absent.selectedOverBudget,
  ids(absent.visible));

const empty = splitDevices([] as { id: string }[], () => true, () => true);
check("an empty tier splits into nothing", empty.visible.length === 0 && empty.hidden.length === 0 && !empty.anyFits);

// ── 2. the real regression: crank the load until the selection stops fitting ─
console.log("\n--- the regression, on real devices ---");
const hero = findKnownByHfId(HERO_MODEL_ID);
const selected = GPUS.find((g) => g.id === DEFAULT_STATE.gpuId);
if (!hero || !selected) {
  check("hero model and default GPU resolve", false, `${HERO_MODEL_ID} / ${DEFAULT_STATE.gpuId}`);
} else {
  const sizeAt = (contextLength: number, concurrency: number) =>
    calculate({
      arch: hero,
      weightDtype: DEFAULT_STATE.weightDtype,
      kvDtype: DEFAULT_STATE.kvDtype,
      contextLength,
      concurrency,
      overheadPct: DEFAULT_STATE.overheadPct,
      cudaContextGiB: DEFAULT_STATE.cudaContextGiB,
    }).totalGiB;

  const catGpus = GPUS.filter((g) => g.category === selected.category).sort(
    (a, b) => (a.totalGiB ?? a.vramGiB) - (b.totalGiB ?? b.vramGiB)
  );
  const gridAt = (totalGiB: number) =>
    splitDevices(catGpus, (g) => totalGiB <= usableGiB(g, ""), (g) => g.id === selected.id);

  // The default view: the pairing is chosen so the selection fits.
  const atDefaults = sizeAt(DEFAULT_STATE.contextLength, DEFAULT_STATE.concurrency);
  const gridDefault = gridAt(atDefaults);
  check("on load the selected device is visible and fits",
    gridDefault.visible.some((g) => g.id === selected.id) && !gridDefault.selectedOverBudget,
    `${atDefaults.toFixed(1)} GiB of ${usableGiB(selected, "").toFixed(1)}`);

  // Now raise the concurrency the way a reader would, until it no longer fits.
  const cap = usableGiB(selected, "");
  let users = DEFAULT_STATE.concurrency;
  while (users < 4096 && sizeAt(DEFAULT_STATE.contextLength, users) <= cap) users *= 2;
  const overflow = sizeAt(DEFAULT_STATE.contextLength, users);
  check("raising concurrency can push the selection over budget", overflow > cap,
    `${users} users → ${overflow.toFixed(1)} GiB of ${cap.toFixed(1)}`);

  const gridOver = gridAt(overflow);
  check("the selected device is still on screen", gridOver.visible.some((g) => g.id === selected.id),
    gridOver.visible.map((g) => g.id).join(", "));
  check("it is not double-counted in the collapsed group", !gridOver.hidden.some((g) => g.id === selected.id));
  check("the toggle counts exactly what is hidden",
    gridOver.hidden.length === catGpus.filter((g) => overflow > usableGiB(g, "") && g.id !== selected.id).length,
    String(gridOver.hidden.length));
  check("every device is in exactly one group",
    gridOver.visible.length + gridOver.hidden.length === catGpus.length,
    `${gridOver.visible.length} + ${gridOver.hidden.length} of ${catGpus.length}`);

  // Nothing in the tier can hold it: the selection alone remains, and anyFits
  // stays false so the "none in this tier fit" line is still printed.
  const huge = Math.max(...catGpus.map((g) => usableGiB(g, ""))) * 10;
  const gridHuge = gridAt(huge);
  check("with nothing fitting, the selection is the only card",
    gridHuge.visible.length === 1 && gridHuge.visible[0].id === selected.id && !gridHuge.anyFits,
    gridHuge.visible.map((g) => g.id).join(", "));
}

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
