import { FEATURED_GPU_IDS, gpuPageFile } from "../lib/staticPages";
import { StaticPageLink } from "./StaticPageLink";
import { useEffect, useState } from "react";
import { calculate, layoutFor, layoutsOn, maxConcurrency, maxContextLength, typicalConcurrency, DTYPE_BYTES, DTYPE_LABELS, type Dtype, type Layout, type ModelArch, type TypicalLoad } from "../lib/calc";
import { batchFor, GPUS, GPU_CATEGORIES, migMem, migProfilesFor, stepDevice, usableGiB, type Gpu, type GpuCategory } from "../lib/gpus";
import { splitDevices } from "../lib/deviceGrid";
import { formatGiB, formatInt } from "../lib/format";
import { GREEN, RED } from "../lib/palette";
import { BANDWIDTH_EFFICIENCY, decodeStep, LAYER_MS, layoutSpeed } from "../lib/perf";
import { SpeedPanel } from "./SpeedPanel";
import { useLang } from "../lib/i18n";
import { layoutFlags, layoutKey, layoutLabel } from "../lib/parallel";
import { Badge, SectionTitle, Stat } from "./ui";

function ctxLabel(n: number): string {
  return n >= 1048576 ? `${n / 1048576}M` : n >= 1024 ? `${n / 1024}k` : String(n);
}

/** Card counts the selector offers; any other count a link carries is added. */
const COUNTS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24, 32, 64];

const FLAGS_CLASS = "mt-2 block overflow-x-auto whitespace-nowrap rounded-lg bg-ink-900/60 px-2 py-1.5 font-mono text-[11px] text-slate-300";

export function GpuFit({
  hfId,
  arch,
  weightDtype,
  kvDtype,
  contextLength,
  concurrency,
  gpuUtil,
  load,
  totalGiB,
  gpuId,
  migId,
  onGpu,
  onMig,
  gpuCount = 1,
  onGpuCount,
  onWeightDtype,
}: {
  hfId: string;
  arch: ModelArch;
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  gpuUtil: number;
  /** A typical request, when one is set: concurrency as it runs, beside the worst case. */
  load: TypicalLoad | null;
  /** The headline total, for the prompt shown before a device is picked. */
  totalGiB: number;
  gpuId: string;
  migId: string;
  onGpu: (id: string) => void;
  onMig: (id: string) => void;
  /** How many of the selected card there are; above 1 the panel sizes the
   *  deployment on exactly that many. */
  gpuCount?: number;
  onGpuCount?: (n: number) => void;
  onWeightDtype?: (d: Dtype) => void;
}) {
  const { t, lang } = useLang();
  // No device is selected until someone picks one — `gpuId` is empty on a bare
  // visit. The panel describing a device is not rendered while `sel` is null.
  const sel = GPUS.find((g) => g.id === gpuId) ?? null;
  // Which tier the grid is browsing. It follows the selection once there is
  // one; before that it is a view preference, not a choice, and is never
  // written to the URL or to the analytics.
  const [viewCat, setViewCat] = useState<GpuCategory>(sel?.category ?? "datacenter");
  useEffect(() => {
    if (sel) setViewCat(sel.category);
  }, [sel?.category]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeCat: GpuCategory = sel?.category ?? viewCat;
  // Anchor for the arithmetic below, which always needs some device to describe.
  // Everything it feeds sits inside the `sel &&` block, so an unselected visitor
  // never sees a number derived from it.
  const selected: Gpu = sel ?? GPUS.find((g) => g.category === activeCat) ?? GPUS[0];
  const migProfiles = migProfilesFor(selected.id);
  const migSlice = migId ? migMem(selected.id, migId) : null;
  const capGiB = migSlice ?? (selected.unified ? selected.totalGiB ?? selected.vramGiB : selected.vramGiB);
  const usableOf = (g: Gpu, mig = "") => usableGiB(g, mig, gpuUtil);
  const effUsable = usableOf(selected, migId);
  const base = { arch, weightDtype, kvDtype };

  // What a device has to hold differs by device: vLLM profiles a bigger batch on a
  // bigger card, and every extra GPU repeats the overhead (overhead.ts). Each card
  // is sized on its own terms, once per render.
  const cache = new Map<string, ReturnType<typeof measure>>();
  function measure(g: Gpu, mig: string) {
    const usable = usableOf(g, mig);
    const input = { ...base, contextLength, concurrency, batch: batchFor(g, mig) };
    const need = calculate(input).totalGiB;
    const fits = need <= usable;
    // The fewest cards that serve it, and how: replicas of a tensor-parallel group,
    // or for a MoE its experts spread over every card. Never a plain memory ratio:
    // a cache held whole on every card does not shrink as cards are added.
    // vLLM splits no model across MIG slices, and a unified-memory machine takes
    // no second unit: neither gets a layout. Of the layouts on that many cards, the
    // fastest that holds the requests (calc.ts, layoutsOn).
    const layout = fits || g.unified || mig ? null : layoutFor(input, usable, undefined, layoutSpeed(input, stepDevice(g)));
    return { usable, need, pct: need / usable, fits, layout, needed: fits ? 1 : layout?.gpus ?? null };
  }
  function usage(g: Gpu, mig = "") {
    const key = `${g.id}|${mig}`;
    if (!cache.has(key)) cache.set(key, measure(g, mig));
    return cache.get(key)!;
  }

  const selUsage = usage(selected, migId);
  /** The vLLM page for this model on this card, set up with a layout. */
  const vllmLink = (l: Layout) =>
    `${import.meta.env.BASE_URL}${lang === "tr" ? "tr/" : ""}vllm.html?m=${encodeURIComponent(hfId)}&gpu=${selected.id}&n=${l.gpus}&ctx=${contextLength}&lay=${layoutKey(l)}`;
  const kvHeads = arch.numKeyValueHeads ?? arch.numAttentionHeads;
  const heads = arch.numAttentionHeads;
  const layout = selUsage.layout;
  /** What each part of a layout means for this model, one line each. */
  const layoutBullets = (l: Layout, chosen: boolean) => (
    <>
      {l.tp > 1 && <li>{t("gpu.tpHeadsOk", { n: l.tp, h: heads, kv: kvHeads })}</li>}
      {l.pp > 1 && <li>{t("gpu.ppHow", { L: arch.numLayers, pp: l.pp, k: Math.ceil(arch.numLayers / l.pp) })}</li>}
      {l.ep ? (
        <li>{t("gpu.epHow", { n: l.tp * l.dp, dp: l.dp, u: l.usersPerReplica, users: concurrency, e: arch.numExperts ?? 0 })}</li>
      ) : (
        l.dp > 1 && <li>{t(chosen ? "gpu.dpEach" : "gpu.dpHow", { dp: l.dp, tp: l.tp, u: l.usersPerReplica, users: concurrency })}</li>
      )}
      {selected.category === "consumer" && <li>{t("gpu.tpNvlink")}</li>}
      <li>{t(l.dp > 1 || l.pp > 1 ? "gpu.dpOverhead" : "gpu.tpOverhead")}</li>
    </>
  );
  const selBatch = batchFor(selected, migId);
  const maxUsers = maxConcurrency({ ...base, contextLength, batch: selBatch }, effUsable);
  const maxCtx = maxContextLength({ ...base, concurrency, batch: selBatch }, effUsable);
  // Several of the card: every way vLLM can run it on exactly that many, the
  // fastest that holds the requests first, pipeline stages only when nothing else
  // holds them (calc.ts, layoutsOn). One card, a MIG slice or a unified-memory
  // machine keeps the single-card view.
  const count = !selected.unified && !migId ? Math.max(1, gpuCount) : 1;
  const multiIn = { ...base, contextLength, concurrency, batch: selBatch };
  const multi = count > 1 ? layoutsOn(multiIn, effUsable, count, layoutSpeed(multiIn, stepDevice(selected))) : null;
  const best = multi?.[0] ?? null;
  const typical = load && !multi ? typicalConcurrency({ ...base, contextLength, batch: selBatch }, effUsable, load) : null;
  // A MIG slice gets roughly its share of the memory system, so scale the
  // published bandwidth with it. Only estimate where the model actually fits —
  // a speed for a configuration that cannot run is noise.
  // The page already scores every device to draw the grid, so answering "then
  // what should I use?" is a search over the same numbers rather than a chore
  // the reader has to do by clicking through five tiers.
  const bySize = [...GPUS].sort((a, b) => usableOf(a) - usableOf(b));
  const smallestFit = bySize.find((g) => usage(g).fits);
  const smallerAlternative =
    selUsage.fits && smallestFit && smallestFit.id !== selected.id && usableOf(smallestFit) < effUsable
      ? smallestFit
      : null;
  // Precisions strictly lighter than the current one, best quality first.
  const lighter = (["bf16", "fp8", "int8", "int4"] as Dtype[]).filter(
    (d) => DTYPE_BYTES[d] < DTYPE_BYTES[weightDtype]
  );
  const quantFix = selUsage.fits
    ? null
    : lighter
        .map((d) => ({ d, total: calculate({ ...base, weightDtype: d, contextLength, concurrency, batch: selBatch }).totalGiB }))
        .find((x) => x.total <= effUsable) ?? null;

  // A MIG slice gets roughly its share of the memory system and of the SMs.
  const bwScale = migSlice ? migSlice / selected.vramGiB : 1;
  const decodeIn = { arch, weightDtype, kvDtype, contextLength };
  const speedOf = (g: Gpu) => (g.bandwidthGBs ? decodeStep(decodeIn, concurrency, stepDevice(g)) : null);
  const selDevice = stepDevice(selected, bwScale);
  const speed = !multi && selUsage.fits && selected.bandwidthGBs ? decodeStep(decodeIn, concurrency, selDevice) : null;
  // What the panel shows: one card's figures, or the best layout's on all of them.
  const shown = best
    ? { fits: best.fits, pct: best.layout.perGpuGiB / effUsable, users: best.maxUsers, ctx: best.maxContext }
    : { fits: selUsage.fits, pct: selUsage.pct, users: maxUsers, ctx: maxCtx };
  // Stage 2: devices within the selected category, split by whether they fit the model.
  const catGpus = GPUS.filter((g) => g.category === activeCat).sort(
    (a, b) => (a.totalGiB ?? a.vramGiB) - (b.totalGiB ?? b.vramGiB)
  );
  // The selected device rides along in the visible group even when the model has
  // outgrown it, so the card the panel above is describing never leaves the page.
  const grid = splitDevices(
    catGpus,
    (g) => usage(g).fits,
    (g) => g.id === gpuId
  );

  const [showNonFit, setShowNonFit] = useState(false);
  useEffect(() => setShowNonFit(false), [activeCat]);

  // Stage 1: jump to a category — pick its smallest fitting device, else its largest.
  function pickForCat(cat: GpuCategory) {
    const inCat = [...GPUS].filter((g) => g.category === cat).sort((a, b) => usableOf(a) - usableOf(b));
    const fit = inCat.find((g) => usage(g).fits);
    return (fit ?? inCat[inCat.length - 1]).id;
  }

  const renderCard = (g: Gpu) => {
    const u = usage(g);
    // Sitting in the visible group no longer implies "fits", so a selected card
    // that is over budget has to say so on its own — in red and in words.
    const overBudget = g.id === gpuId && !u.fits;
    return (
      <button
        key={g.id}
        type="button"
        onClick={() => onGpu(g.id)}
        // aria-pressed doubles as the styling hook for the glass theme and as the
        // only thing that tells a screen reader which device is selected.
        aria-pressed={g.id === gpuId}
        // The glass theme paints the selection from aria-pressed alone, which
        // would repaint an over-budget card in brand colours; this overrides it.
        data-over-budget={overBudget ? "true" : undefined}
        className={
          "gpu-card rounded-xl p-2.5 text-left ring-1 transition " +
          (overBudget
            ? "ring-bad/50 bg-bad/10"
            : g.id === gpuId
              ? "ring-brand-500/60 bg-brand-600/10"
              : "ring-white/10 bg-ink-850/40 hover:bg-white/5")
        }
      >
        <div className="flex items-center justify-between">
          <span className="truncate text-xs font-medium text-slate-200">{g.name}</span>
          <span className="ml-1 shrink-0 text-[10px] text-slate-500">{g.totalGiB ?? g.vramGiB}GB</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, u.pct * 100)}%`, backgroundColor: u.fits ? GREEN : RED }} />
        </div>
        <div className={"mt-1 text-[10px] " + (overBudget ? "text-bad" : "text-slate-500")}>
          {u.fits
            ? t("gpu.cardFits", { p: Math.round(u.pct * 100) })
            : overBudget
              ? `${t("gpu.cardOverBudget")} · ${u.needed ? t("gpu.cardNeeds", { n: u.needed }) : t(g.unified ? "gpu.noFitSingle" : "gpu.cardNone")}`
              : u.needed ? t("gpu.cardNeeds", { n: u.needed }) : t(g.unified ? "gpu.noFitSingle" : "gpu.cardNone")}
        </div>
      </button>
    );
  };

  return (
    <div>
      <SectionTitle step="3" title={t("gpu.step")} hint={t("gpu.usableHint", { p: Math.round(gpuUtil * 100) })} />

      {/* Stage 1: category */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {GPU_CATEGORIES.map((cat) => {
          const n = GPUS.filter((g) => g.category === cat).length;
          const active = activeCat === cat;
          return (
            <button
              key={cat}
              type="button"
              // Browsing a tier is not choosing a device. Before anything is
              // selected the chip only moves the grid; jumping straight to a
              // device would put a card we picked back into the data.
              onClick={() => (sel ? onGpu(pickForCat(cat)) : setViewCat(cat))}
              className={
                "rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition " +
                (active ? "bg-brand-600/20 text-white ring-brand-500/60" : "bg-ink-850/40 text-slate-400 ring-white/10 hover:text-slate-200")
              }
            >
              {t(`cat.${cat}`)} <span className={active ? "opacity-70" : "opacity-50"}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Nothing is chosen yet: say what the next click buys, and let the ring
          carry the emphasis. A standing highlight, not an animation — this is
          the resting state of the page and it repeats on every visit. */}
      {!sel && (
        <div className="rounded-2xl bg-ink-850/60 p-4 ring-1 ring-brand-500/30">
          <div className="text-sm font-medium text-white">{t("gpu.pickPrompt")}</div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">
            {t("gpu.pickHint", { x: formatGiB(totalGiB) })}
          </p>
        </div>
      )}

      {/* Selected GPU panel — Stage 2: device within category */}
      {sel && (
      <div className="rounded-2xl bg-ink-850/60 p-4 ring-1 ring-white/10">
        <div className="mb-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <select
              value={gpuId}
              onChange={(e) => onGpu(e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-ink-800 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-control outline-none focus:ring-brand-500/60"
            >
              {catGpus.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.totalGiB ?? g.vramGiB} GB
                </option>
              ))}
            </select>
            {/* How many of this card: a MIG slice and a unified-memory machine stay at one. */}
            {onGpuCount && !selected.unified && !migId && (
              <select
                value={count}
                onChange={(e) => onGpuCount(Number(e.target.value))}
                aria-label={t("gpu.countLabel")}
                title={t("gpu.countLabel")}
                className="rounded-lg bg-ink-800 px-2 py-1.5 text-sm font-medium text-white ring-1 ring-control outline-none focus:ring-brand-500/60"
              >
                {[...new Set([...COUNTS, count])].sort((a, b) => a - b).map((n) => (
                  <option key={n} value={n}>
                    ×{n}
                  </option>
                ))}
              </select>
            )}
            {best ? (
              best.fits ? (
                <Badge tone="good">{t("gpu.fitsOn", { n: count })}</Badge>
              ) : (
                <Badge tone="bad">{t("gpu.notOn", { n: count })}</Badge>
              )
            ) : selUsage.fits ? (
              <Badge tone="good">{t("gpu.fits")}</Badge>
            ) : (
              <Badge tone="bad">{selected.unified ? t("gpu.noFitSingle") : migId ? t("gpu.noFitSlice") : selUsage.needed ? t("gpu.needs", { n: selUsage.needed }) : t("gpu.needsNone")}</Badge>
            )}
          </div>
          {FEATURED_GPU_IDS.includes(selected.id) && (
            <StaticPageLink file={gpuPageFile(selected.id)}>{t("gpu.page", { name: selected.name })}</StaticPageLink>
          )}
          {migProfiles.length > 0 && (
            <select
              value={migId}
              onChange={(e) => onMig(e.target.value)}
              className="w-full rounded-lg bg-ink-800 px-3 py-1.5 text-sm text-slate-200 ring-1 ring-control outline-none focus:ring-brand-500/60"
            >
              <option value="">{t("gpu.migOff")}</option>
              {migProfiles.map((m) => (
                <option key={m.id} value={m.id}>
                  MIG {m.id} — {m.memGiB} GB{m.max > 1 ? ` (×${m.max})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, shown.pct * 100)}%`,
              backgroundColor: shown.fits ? GREEN : RED,
            }}
          />
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {best
            ? t("gpu.usageEach", { x: formatGiB(best.layout.perGpuGiB), y: capGiB, p: Math.round(shown.pct * 100), n: count })
            : t("gpu.usage", { x: formatGiB(selUsage.need), y: capGiB, p: Math.round(selUsage.pct * 100) })}
          {migId ? ` · MIG ${migId}` : ""}
        </div>
        {selected.unified && !migId ? (
          <div className="mt-0.5 text-[11px] text-slate-500">
            {t("gpu.unified", { total: selected.totalGiB ?? selected.vramGiB, usable: Math.round(effUsable), bw: selected.bandwidthGBs ?? 0 })}
          </div>
        ) : selected.bandwidthGBs ? (
          <div className="mt-0.5 text-[11px] text-slate-500">{t("gpu.bw", { bw: selected.bandwidthGBs })}</div>
        ) : null}

        {/* Three stats share a row; four sit two by two, since the card is half the page wide. */}
        <div className={"mt-3 grid grid-cols-2 gap-2" + ((speed ? 1 : 0) + (typical ? 1 : 0) === 1 ? " sm:grid-cols-3" : "")}>
          <Stat
            label={t("gpu.maxUsers")}
            value={shown.users > 0 ? formatInt(shown.users) : "0"}
            sub={best ? t("gpu.atCtxOn", { x: ctxLabel(contextLength), n: count }) : t("gpu.atCtx", { x: ctxLabel(contextLength) })}
            accent={shown.users > 0 && !typical}
          />
          {/* The worst case above is what vLLM reports at startup; this is what
              the pool holds when requests are the size the visitor described. */}
          {typical && (
            <Stat
              label={t("gpu.typicalUsers")}
              value={typical.users > 0 ? formatInt(typical.users) : "0"}
              sub={
                typical.capped
                  ? t("gpu.typicalCapped", { n: formatInt(selBatch.seqs) })
                  : t("gpu.typicalAt", { x: formatInt(typical.inUse) })
              }
              accent={typical.users > 0}
            />
          )}
          {/* Mirrors the stat beside it: each holds the other input at its current
              value — max users at this context, max context at this concurrency. */}
          <Stat
            label={t("gpu.maxContext")}
            value={shown.ctx > 0 ? formatInt(shown.ctx) : "0"}
            sub={
              shown.ctx <= 0
                ? t("gpu.weightsNoFit")
                : concurrency === 1
                  ? t("gpu.tokens")
                  : `${t("gpu.tokens")} · ${t("gpu.atUsers", { n: concurrency })}`
            }
          />
          {speed && (
            <Stat
              label={t("gpu.decodeSpeed")}
              value={`≤${Math.round(speed.perUser)}`}
              sub={
                concurrency > 1
                  ? t("gpu.tpsBatch", { total: Math.round(speed.total) })
                  : t("gpu.tpsSingle")
              }
            />
          )}
        </div>

        {speed && (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            {t(selected.tflops ? "gpu.speedNote" : "gpu.speedNoteBw", {
              p: Math.round(BANDWIDTH_EFFICIENCY * 100),
              c: Math.round(selDevice.computeEfficiency * 100),
              // The device's own measured per-layer cost where it has one (Strix Halo).
              l: (selected.layerMs ?? LAYER_MS).toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 3 }),
            })}
          </p>
        )}

        {/* Time to first token and the batch curve, where the device has a bandwidth. */}
        {speed && (
          <SpeedPanel
            arch={arch}
            weightDtype={weightDtype}
            kvDtype={kvDtype}
            tokensPerSeq={typical ? typical.inUse : contextLength}
            promptTokens={load ? Math.min(load.promptTokens, contextLength) : contextLength}
            maxBatch={typical ? Math.max(1, typical.users) : Math.max(1, maxUsers)}
            device={selDevice}
            name={migId ? `${selected.name} MIG ${migId}` : selected.name}
          />
        )}

        {/* Answer "then what?" before explaining the multi-GPU arithmetic. */}
        {!multi && !selUsage.fits && (smallestFit || quantFix) && (
          <div className="mt-3 rounded-xl bg-brand-600/10 p-3 ring-1 ring-brand-500/30">
            <div className="mb-2 text-[11.5px] font-semibold text-white">{t("gpu.recTitle")}</div>
            <div className="flex flex-wrap gap-2">
              {smallestFit && (
                <button
                  type="button"
                  onClick={() => onGpu(smallestFit.id)}
                  className="rounded-lg bg-ink-800 px-2.5 py-1.5 text-left text-[11.5px] ring-1 ring-control transition hover:bg-white/5"
                >
                  <span className="block font-medium text-white">{smallestFit.name}</span>
                  <span className="text-slate-400">
                    {t("gpu.recSmallest")}
                    {(() => {
                      const sp = speedOf(smallestFit);
                      return sp ? ` · ≤${Math.round(sp.perUser)} tok/s` : "";
                    })()}
                  </span>
                </button>
              )}
              {quantFix && (
                <button
                  type="button"
                  onClick={() => onWeightDtype?.(quantFix.d)}
                  disabled={!onWeightDtype}
                  className="rounded-lg bg-ink-800 px-2.5 py-1.5 text-left text-[11.5px] ring-1 ring-control transition enabled:hover:bg-white/5 disabled:opacity-60"
                >
                  <span className="block font-medium text-white">{DTYPE_LABELS[quantFix.d]}</span>
                  <span className="text-slate-400">
                    {t("gpu.recQuant", { gpu: selected.name, x: formatGiB(quantFix.total) })}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
        {!multi && !selUsage.fits && !smallestFit && !quantFix && (
          <p className="mt-3 text-[11.5px] text-slate-400">{t("gpu.recNone")}</p>
        )}
        {!multi && smallerAlternative && (
          <p className="mt-2 text-[11px] text-slate-500">
            {t("gpu.recSmaller", {
              name: smallerAlternative.name,
              mem: smallerAlternative.totalGiB ?? smallerAlternative.vramGiB,
            })}{" "}
            <button
              type="button"
              onClick={() => onGpu(smallerAlternative.id)}
              className="font-medium text-brand-400 hover:underline"
            >
              {t("gpu.recSwitch")}
            </button>
          </p>
        )}

        {/* Say how N cards serve the model — one tensor-parallel group, pipeline
            stages, replicas, or experts spread over all — and the flags that set it up. */}
        {!multi && !selUsage.fits &&
          (selected.unified ? (
            <p className="mt-3 rounded-xl bg-ink-800/60 p-3 text-[11.5px] leading-relaxed text-slate-300">
              {t("gpu.unifiedSingle")}
            </p>
          ) : migId ? (
            <p className="mt-3 rounded-xl bg-ink-800/60 p-3 text-[11.5px] leading-relaxed text-slate-300">
              {t("gpu.migLayout")}
            </p>
          ) : !layout ? (
            <p className="mt-3 rounded-xl bg-ink-800/60 p-3 text-[11.5px] leading-relaxed text-slate-300">
              {t("gpu.layoutNone")}
            </p>
          ) : (
            <div className="mt-3 rounded-xl bg-ink-800/60 p-3">
              <div className="mb-1.5 text-[11.5px] font-semibold text-white">
                {layout.dp === 1 && layout.pp === 1
                  ? t("gpu.tpTitle", { n: layout.gpus })
                  : layout.ep && layout.pp === 1 && layout.tp === 1
                    ? t("gpu.epTitle", { n: layout.gpus })
                    : t("gpu.layoutTitle", { n: layout.gpus, layout: layoutLabel(layout) })}
              </div>
              <ul className="space-y-1 text-[11.5px] leading-relaxed text-slate-400">{layoutBullets(layout, false)}</ul>
              {layoutFlags(layout) && <code className={FLAGS_CLASS}>vllm serve {hfId || "<model>"} {layoutFlags(layout)}</code>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {onGpuCount && (
                  <button type="button" onClick={() => onGpuCount(layout.gpus)} className="text-[11.5px] font-medium text-brand-400 hover:underline">
                    {t("gpu.useCount", { n: layout.gpus })}
                  </button>
                )}
                {/* The vLLM page sets up the same layout on as many GPUs. */}
                {hfId && (
                  <a href={vllmLink(layout)} className="text-[11.5px] font-medium text-brand-400 hover:underline">
                    {t("gpu.tpLink")}
                  </a>
                )}
              </div>
            </div>
          ))}

        {/* Several of the card: the fastest layout that holds the requests, how it
            is set up, and every other way to run it on that many. */}
        {multi && best && (
          <div className="mt-3 rounded-xl bg-ink-800/60 p-3">
            <div className="mb-1.5 text-[11.5px] font-semibold text-white">
              {t("gpu.onTitle", { n: count, name: selected.name, layout: layoutLabel(best.layout) })}
            </div>
            {!best.fits && (
              <p className="mb-1.5 text-[11.5px] leading-relaxed text-bad">
                {best.maxUsers > 0
                  ? t("gpu.onShort", { u: formatInt(best.maxUsers), users: formatInt(concurrency), c: formatInt(best.maxContext) })
                  : t("gpu.onNone")}
              </p>
            )}
            <ul className="space-y-1 text-[11.5px] leading-relaxed text-slate-400">{layoutBullets(best.layout, true)}</ul>
            {layoutFlags(best.layout) && <code className={FLAGS_CLASS}>vllm serve {hfId || "<model>"} {layoutFlags(best.layout)}</code>}
            {hfId && (
              <a href={vllmLink(best.layout)} className="mt-2 inline-block text-[11.5px] font-medium text-brand-400 hover:underline">
                {t("gpu.tpLink")}
              </a>
            )}
            {multi.length > 1 && (
              <div className="mt-3 overflow-x-auto">
                <div className="mb-1 text-[11px] font-medium text-slate-300">{t("gpu.altTitle", { n: count })}</div>
                {/* The rule only picked the first when it holds the load; otherwise it is the one that holds the most. */}
                {best.stepMs !== undefined && best.fits && <p className="mb-1 text-[11px] leading-relaxed text-slate-500">{t("gpu.altHow")}</p>}
                <table className="w-full text-[11px] tabular-nums">
                  <thead className="text-slate-500">
                    <tr>
                      <th scope="col" className="py-1 pr-2 text-left font-medium">{t("gpu.alt.layout")}</th>
                      {best.stepMs !== undefined && <th scope="col" className="py-1 pr-2 text-right font-medium">{t("gpu.alt.speed")}</th>}
                      <th scope="col" className="py-1 pr-2 text-right font-medium">{t("gpu.alt.perGpu")}</th>
                      <th scope="col" className="py-1 pr-2 text-right font-medium">{t("gpu.alt.users", { x: ctxLabel(contextLength) })}</th>
                      <th scope="col" className="py-1 text-right font-medium">{t("gpu.alt.ctx", { n: formatInt(concurrency) })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multi.map((f, i) => (
                      <tr key={layoutLabel(f.layout)} className={i === 0 ? "font-semibold text-white" : f.fits ? "text-slate-300" : "text-slate-500"}>
                        <td className="whitespace-nowrap py-0.5 pr-2">{layoutLabel(f.layout)}</td>
                        {best.stepMs !== undefined && (
                          <td className="py-0.5 pr-2 text-right">{f.fits && f.stepMs && Number.isFinite(f.stepMs) ? formatInt(Math.round(1000 / f.stepMs)) : "—"}</td>
                        )}
                        <td className="py-0.5 pr-2 text-right">{formatGiB(f.layout.perGpuGiB)}</td>
                        <td className="py-0.5 pr-2 text-right">{formatInt(f.maxUsers)}</td>
                        <td className="py-0.5 text-right">{formatInt(f.maxContext)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Devices in this category that fit the model, plus the selected one even
          when it does not (the rest of the non-fitting devices stay behind a toggle) */}
      <div className="mt-4">
        {grid.visible.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{grid.visible.map(renderCard)}</div>
        )}
        {!grid.anyFits && (
          <p className={"text-xs text-slate-500" + (grid.visible.length > 0 ? " mt-2" : "")}>{t("gpu.noneFit")}</p>
        )}
        {grid.hidden.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowNonFit((v) => !v)}
              className="mt-2.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-200"
            >
              {showNonFit ? `▾ ${t("gpu.hideNonFit")}` : `▸ ${t("gpu.showNonFit", { n: grid.hidden.length })}`}
            </button>
            {showNonFit && <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{grid.hidden.map(renderCard)}</div>}
          </>
        )}
      </div>
    </div>
  );
}
