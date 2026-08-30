import { useEffect, useState } from "react";
import { maxConcurrency, maxContextLength, type Dtype, type ModelArch } from "../lib/calc";
import { GPUS, GPU_CATEGORIES, migMem, migProfilesFor, type Gpu, type GpuCategory } from "../lib/gpus";
import { formatGiB, formatInt } from "../lib/format";
import { GREEN, RED } from "../lib/palette";
import { useLang } from "../lib/i18n";
import { Badge, SectionTitle, Stat } from "./ui";

const USABLE = 0.95; // fraction of nominal VRAM usable after driver reserve

// Usable memory budget (GiB) for the fit test. A selected MIG slice wins; for a
// unified-memory device vramGiB is already the usable slice; discrete boards take
// the driver-reserve haircut.
function usableGiB(g: Gpu, mig: string): number {
  const slice = mig ? migMem(g.id, mig) : null;
  if (slice) return slice * USABLE;
  if (g.unified) return g.vramGiB;
  return g.vramGiB * USABLE;
}

function ctxLabel(n: number): string {
  return n >= 1048576 ? `${n / 1048576}M` : n >= 1024 ? `${n / 1024}k` : String(n);
}

/** vLLM shards the KV heads across the tensor-parallel ranks, so the TP size has
 *  to divide the head count (or be a multiple of it, where heads are replicated). */
function tpValid(n: number, kvHeads: number): boolean {
  return kvHeads % n === 0 || n % kvHeads === 0;
}

/** The smallest workable TP size at or above the raw card count. */
function nearestTp(needed: number, kvHeads: number): number {
  for (let n = needed; n <= kvHeads * 8; n++) if (tpValid(n, kvHeads)) return n;
  return needed;
}

export function GpuFit({
  hfId,
  arch,
  weightDtype,
  kvDtype,
  contextLength,
  concurrency,
  overheadPct,
  cudaContextGiB,
  totalGiB,
  gpuId,
  migId,
  onGpu,
  onMig,
}: {
  hfId: string;
  arch: ModelArch;
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  overheadPct: number;
  cudaContextGiB: number;
  totalGiB: number;
  gpuId: string;
  migId: string;
  onGpu: (id: string) => void;
  onMig: (id: string) => void;
}) {
  const { t } = useLang();
  const selected = GPUS.find((g) => g.id === gpuId) ?? GPUS[0];
  const migProfiles = migProfilesFor(selected.id);
  const migSlice = migId ? migMem(selected.id, migId) : null;
  const capGiB = migSlice ?? (selected.unified ? selected.totalGiB ?? selected.vramGiB : selected.vramGiB);
  const effUsable = usableGiB(selected, migId);
  const base = { arch, weightDtype, kvDtype, overheadPct, cudaContextGiB };

  function usage(usable: number) {
    return { usable, pct: totalGiB / usable, fits: totalGiB <= usable, needed: Math.ceil(totalGiB / usable) };
  }

  const selUsage = usage(effUsable);
  const kvHeads = arch.numKeyValueHeads ?? arch.numAttentionHeads;
  const maxUsers = maxConcurrency({ ...base, contextLength }, effUsable);
  const maxCtx = maxContextLength({ ...base, concurrency }, effUsable);
  // Stage 2: devices within the selected category, split by whether they fit the model.
  const catGpus = GPUS.filter((g) => g.category === selected.category).sort(
    (a, b) => (a.totalGiB ?? a.vramGiB) - (b.totalGiB ?? b.vramGiB)
  );
  const fitting = catGpus.filter((g) => totalGiB <= usableGiB(g, ""));
  const nonFitting = catGpus.filter((g) => totalGiB > usableGiB(g, ""));

  const [showNonFit, setShowNonFit] = useState(false);
  useEffect(() => setShowNonFit(false), [selected.category]);

  // Stage 1: jump to a category — pick its smallest fitting device, else its largest.
  function pickForCat(cat: GpuCategory) {
    const inCat = [...GPUS].filter((g) => g.category === cat).sort((a, b) => usableGiB(a, "") - usableGiB(b, ""));
    const fit = inCat.find((g) => totalGiB <= usableGiB(g, ""));
    return (fit ?? inCat[inCat.length - 1]).id;
  }

  const renderCard = (g: Gpu) => {
    const u = usage(usableGiB(g, ""));
    return (
      <button
        key={g.id}
        type="button"
        onClick={() => onGpu(g.id)}
        className={
          "rounded-xl p-2.5 text-left ring-1 transition " +
          (g.id === gpuId ? "ring-brand-500/60 bg-brand-600/10" : "ring-white/10 bg-ink-850/40 hover:bg-white/5")
        }
      >
        <div className="flex items-center justify-between">
          <span className="truncate text-xs font-medium text-slate-200">{g.name}</span>
          <span className="ml-1 shrink-0 text-[10px] text-slate-500">{g.totalGiB ?? g.vramGiB}GB</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, u.pct * 100)}%`, backgroundColor: u.fits ? GREEN : RED }} />
        </div>
        <div className="mt-1 text-[10px] text-slate-500">
          {u.fits ? t("gpu.cardFits", { p: Math.round(u.pct * 100) }) : t("gpu.cardNeeds", { n: u.needed })}
        </div>
      </button>
    );
  };

  return (
    <div>
      <SectionTitle step="3" title={t("gpu.step")} hint={t("gpu.usableHint", { p: Math.round(USABLE * 100) })} />

      {/* Stage 1: category */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {GPU_CATEGORIES.map((cat) => {
          const n = GPUS.filter((g) => g.category === cat).length;
          const active = selected.category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onGpu(pickForCat(cat))}
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

      {/* Selected GPU panel — Stage 2: device within category */}
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
            {selUsage.fits ? (
              <Badge tone="good">{t("gpu.fits")}</Badge>
            ) : (
              <Badge tone="bad">{selected.unified ? t("gpu.noFitSingle") : t("gpu.needs", { n: selUsage.needed })}</Badge>
            )}
          </div>
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
              width: `${Math.min(100, selUsage.pct * 100)}%`,
              backgroundColor: selUsage.fits ? GREEN : RED,
            }}
          />
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {t("gpu.usage", { x: formatGiB(totalGiB), y: capGiB, p: Math.round(selUsage.pct * 100) })}
          {migId ? ` · MIG ${migId}` : ""}
        </div>
        {selected.unified && !migId ? (
          <div className="mt-0.5 text-[11px] text-slate-500">
            {t("gpu.unified", { total: selected.totalGiB ?? selected.vramGiB, usable: Math.round(effUsable), bw: selected.bandwidthGBs ?? 0 })}
          </div>
        ) : selected.bandwidthGBs ? (
          <div className="mt-0.5 text-[11px] text-slate-500">{t("gpu.bw", { bw: selected.bandwidthGBs })}</div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat
            label={t("gpu.maxUsers")}
            value={maxUsers > 0 ? formatInt(maxUsers) : "0"}
            sub={t("gpu.atCtx", { x: ctxLabel(contextLength) })}
            accent={maxUsers > 0}
          />
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
        </div>

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
                  {tpValid(selUsage.needed, kvHeads)
                    ? t("gpu.tpHeadsOk", { n: selUsage.needed, kv: kvHeads })
                    : t("gpu.tpHeads", { kv: kvHeads, ok: nearestTp(selUsage.needed, kvHeads) })}
                </li>
                {selected.category === "consumer" && <li>{t("gpu.tpNvlink")}</li>}
                <li>{t("gpu.tpOverhead")}</li>
              </ul>
              <a
                href={`${import.meta.env.BASE_URL}vllm.html?m=${encodeURIComponent(hfId)}&gpu=${selected.id}&n=${nearestTp(selUsage.needed, kvHeads)}&ctx=${contextLength}`}
                className="mt-2 inline-block text-[11.5px] font-medium text-brand-400 hover:underline"
              >
                {t("gpu.tpLink")}
              </a>
            </div>
          ))}
      </div>

      {/* Devices in this category that fit the model (non-fitting behind a toggle) */}
      <div className="mt-4">
        {fitting.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{fitting.map(renderCard)}</div>
        ) : (
          <p className="text-xs text-slate-500">{t("gpu.noneFit")}</p>
        )}
        {nonFitting.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowNonFit((v) => !v)}
              className="mt-2.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-200"
            >
              {showNonFit ? `▾ ${t("gpu.hideNonFit")}` : `▸ ${t("gpu.showNonFit", { n: nonFitting.length })}`}
            </button>
            {showNonFit && <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{nonFitting.map(renderCard)}</div>}
          </>
        )}
      </div>
    </div>
  );
}
