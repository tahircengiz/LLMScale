import { FEATURED_GPU_IDS, gpuPageFile } from "../lib/staticPages";
import { StaticPageLink } from "./StaticPageLink";
import { useEffect, useState } from "react";
import { calculate, gpusNeeded, maxConcurrency, maxContextLength, typicalConcurrency, DTYPE_BYTES, DTYPE_LABELS, type Dtype, type ModelArch, type TypicalLoad } from "../lib/calc";
import { batchFor, GPUS, GPU_CATEGORIES, migMem, migProfilesFor, usableGiB, type Gpu, type GpuCategory } from "../lib/gpus";
import { splitDevices } from "../lib/deviceGrid";
import { formatGiB, formatInt } from "../lib/format";
import { GREEN, RED } from "../lib/palette";
import { BANDWIDTH_EFFICIENCY, COMPUTE_EFFICIENCY, decodeStep } from "../lib/perf";
import { SpeedPanel } from "./SpeedPanel";
import { useLang } from "../lib/i18n";
import { Badge, SectionTitle, Stat } from "./ui";
import { Select } from "./choice";
import { Tip } from "./tip";
import { gpuHint } from "../lib/choices";

function ctxLabel(n: number): string {
  return n >= 1048576 ? `${n / 1048576}M` : n >= 1024 ? `${n / 1024}k` : String(n);
}

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
    // How many cards memory alone asks for, and the fewest vLLM can split the
    // heads across; they differ when the first does not divide the heads.
    const raw = fits ? 1 : gpusNeeded(input, usable, 1024, false) ?? Math.ceil(need / usable);
    const tp = fits ? 1 : gpusNeeded(input, usable);
    return { usable, need, pct: need / usable, fits, raw, tp, needed: tp ?? raw };
  }
  function usage(g: Gpu, mig = "") {
    const key = `${g.id}|${mig}`;
    if (!cache.has(key)) cache.set(key, measure(g, mig));
    return cache.get(key)!;
  }

  const selUsage = usage(selected, migId);
  const kvHeads = arch.numKeyValueHeads ?? arch.numAttentionHeads;
  const heads = arch.numAttentionHeads;
  const tpOk = selUsage.tp;
  const selBatch = batchFor(selected, migId);
  const maxUsers = maxConcurrency({ ...base, contextLength, batch: selBatch }, effUsable);
  const maxCtx = maxContextLength({ ...base, concurrency, batch: selBatch }, effUsable);
  const typical = load ? typicalConcurrency({ ...base, contextLength, batch: selBatch }, effUsable, load) : null;
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
  const deviceOf = (g: Gpu, scale = 1) => ({
    bandwidthGBs: (g.bandwidthGBs ?? 0) * scale,
    tflops: g.tflops ? { bf16: g.tflops.bf16 * scale, fp8: g.tflops.fp8 && g.tflops.fp8 * scale, fp4: g.tflops.fp4 && g.tflops.fp4 * scale } : undefined,
  });
  const decodeIn = { arch, weightDtype, kvDtype, contextLength };
  const speedOf = (g: Gpu) => (g.bandwidthGBs ? decodeStep(decodeIn, concurrency, deviceOf(g)) : null);
  const selDevice = deviceOf(selected, bwScale);
  const speed = selUsage.fits && selected.bandwidthGBs ? decodeStep(decodeIn, concurrency, selDevice) : null;
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
      <Tip key={g.id} text={gpuHint(t, g, lang)} className="flex min-w-0">
      <button
        type="button"
        onClick={() => onGpu(g.id)}
        // aria-pressed doubles as the styling hook for the glass theme and as the
        // only thing that tells a screen reader which device is selected.
        aria-pressed={g.id === gpuId}
        // The glass theme paints the selection from aria-pressed alone, which
        // would repaint an over-budget card in brand colours; this overrides it.
        data-over-budget={overBudget ? "true" : undefined}
        className={
          "gpu-card w-full rounded-xl p-2.5 text-left ring-1 transition " +
          (overBudget
            ? "ring-rose-500/50 bg-rose-500/10"
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
              ? `${t("gpu.cardOverBudget")} · ${t("gpu.cardNeeds", { n: u.needed })}`
              : t("gpu.cardNeeds", { n: u.needed })}
        </div>
      </button>
      </Tip>
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
            <div className="min-w-0 flex-1">
              <Select
                label={t("gpu.step")}
                value={gpuId}
                options={catGpus.map((g) => ({ value: g.id, label: `${g.name} — ${g.totalGiB ?? g.vramGiB} GB`, hint: gpuHint(t, g, lang) }))}
                onChange={onGpu}
              />
            </div>
            {selUsage.fits ? (
              <Badge tone="good">{t("gpu.fits")}</Badge>
            ) : (
              <Badge tone="bad">{selected.unified ? t("gpu.noFitSingle") : t("gpu.needs", { n: selUsage.needed })}</Badge>
            )}
          </div>
          {FEATURED_GPU_IDS.includes(selected.id) && (
            <StaticPageLink file={gpuPageFile(selected.id)}>{t("gpu.page", { name: selected.name })}</StaticPageLink>
          )}
          {migProfiles.length > 0 && (
            <Select
              label={t("gpu.mig")}
              value={migId}
              options={[
                { value: "", label: t("gpu.migOff"), hint: t("gpu.migOffHint") },
                ...migProfiles.map((m) => ({
                  value: m.id,
                  label: `MIG ${m.id} — ${m.memGiB} GB${m.max > 1 ? ` (×${m.max})` : ""}`,
                  hint: t("gpu.migHint", { gb: m.memGiB, n: m.max }),
                })),
              ]}
              onChange={onMig}
            />
          )}
        </div>

        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, selUsage.pct * 100)}%`,
              backgroundColor: selUsage.fits ? GREEN : RED,
            }}
          />
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {t("gpu.usage", { x: formatGiB(selUsage.need), y: capGiB, p: Math.round(selUsage.pct * 100) })}
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
            value={maxUsers > 0 ? formatInt(maxUsers) : "0"}
            sub={t("gpu.atCtx", { x: ctxLabel(contextLength) })}
            accent={maxUsers > 0 && !typical}
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
            value={maxCtx > 0 ? formatInt(maxCtx) : "0"}
            sub={
              maxCtx <= 0
                ? t("gpu.weightsNoFit")
                : concurrency === 1
                  ? t("gpu.tokens")
                  : `${t("gpu.tokens")} · ${t("gpu.atUsers", { n: concurrency })}`
            }
          />
          {speed && (
            <Stat
              label={t("gpu.decodeSpeed")}
              value={`~${Math.round(speed.perUser)}`}
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
              c: Math.round(COMPUTE_EFFICIENCY * 100),
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
        {!selUsage.fits && (smallestFit || quantFix) && (
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
                      return sp ? ` · ~${Math.round(sp.perUser)} tok/s` : "";
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
        {!selUsage.fits && !smallestFit && !quantFix && (
          <p className="mt-3 text-[11.5px] text-slate-400">{t("gpu.recNone")}</p>
        )}
        {smallerAlternative && (
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

        {/* "needs N x GPUs" is only a memory ratio. Say what running one model
            across N cards actually requires, and hand the setup to the vLLM page. */}
        {!selUsage.fits &&
          (selected.unified ? (
            <p className="mt-3 rounded-xl bg-ink-800/60 p-3 text-[11.5px] leading-relaxed text-slate-300">
              {t("gpu.unifiedSingle")}
            </p>
          ) : (
            <div className="mt-3 rounded-xl bg-ink-800/60 p-3">
              <div className="mb-1.5 text-[11.5px] font-semibold text-white">
                {t("gpu.tpTitle", { n: selUsage.needed })}
              </div>
              <ul className="space-y-1 text-[11.5px] leading-relaxed text-slate-400">
                <li>
                  {tpOk !== null && tpOk === selUsage.raw
                    ? t("gpu.tpHeadsOk", { n: tpOk, h: heads, kv: kvHeads })
                    : tpOk !== null
                      ? t("gpu.tpHeads", { h: heads, kv: kvHeads, ok: tpOk })
                      : t("gpu.tpNone", { n: selUsage.raw, h: heads })}
                </li>
                {selected.category === "consumer" && <li>{t("gpu.tpNvlink")}</li>}
                <li>{t("gpu.tpOverhead")}</li>
              </ul>
              <a
                href={`${import.meta.env.BASE_URL}${lang === "tr" ? "tr/" : ""}vllm.html?m=${encodeURIComponent(hfId)}&gpu=${selected.id}&n=${tpOk ?? selUsage.needed}&ctx=${contextLength}`}
                className="mt-2 inline-block text-[11.5px] font-medium text-brand-400 hover:underline"
              >
                {t("gpu.tpLink")}
              </a>
            </div>
          ))}
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
