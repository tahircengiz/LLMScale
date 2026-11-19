import { useEffect, useState } from "react";
import { GPUS, GPU_CATEGORIES, usableGiB, type Gpu, type GpuCategory } from "../lib/gpus";
import { splitDevices } from "../lib/deviceGrid";
import { formatGiB } from "../lib/format";
import { GREEN, RED } from "../lib/palette";
import { useLang } from "../lib/i18n";
import { SectionTitle } from "./ui";

/**
 * The GPU step for a model on its own code (calc.ts, ModelArch.ownRuntime): each card
 * against the weights alone. The cache, the overhead, users, context, speed and a split
 * over several cards that GpuFit works out are vLLM's, so none of them is shown here.
 */
export function WeightsFit({ weightsGiB, gpuId, onGpu }: { weightsGiB: number; gpuId: string; onGpu: (id: string) => void }) {
  const { t } = useLang();
  const sel = GPUS.find((g) => g.id === gpuId) ?? null;
  const [viewCat, setViewCat] = useState<GpuCategory>(sel?.category ?? "datacenter");
  useEffect(() => {
    if (sel) setViewCat(sel.category);
  }, [sel?.category]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showNonFit, setShowNonFit] = useState(false);
  useEffect(() => setShowNonFit(false), [viewCat]);

  // All the memory the runtime reports, not vLLM's budgeted share of it (gpus.ts, usableGiB):
  // this model is not served by vLLM.
  const memOf = (g: Gpu) => usableGiB(g, "", 1);
  const fits = (g: Gpu) => weightsGiB <= memOf(g);
  const catGpus = GPUS.filter((g) => g.category === viewCat).sort(
    (a, b) => (a.totalGiB ?? a.vramGiB) - (b.totalGiB ?? b.vramGiB)
  );
  const grid = splitDevices(catGpus, fits, (g) => g.id === gpuId);

  const renderCard = (g: Gpu) => {
    const ok = fits(g);
    const pct = weightsGiB / memOf(g);
    const overBudget = g.id === gpuId && !ok;
    return (
      <button
        key={g.id}
        type="button"
        onClick={() => onGpu(g.id)}
        aria-pressed={g.id === gpuId}
        data-over-budget={overBudget ? "true" : undefined}
        className={
          "gpu-card rounded-xl p-2.5 text-start ring-1 transition " +
          (overBudget
            ? "ring-bad/50 bg-bad/10"
            : g.id === gpuId
              ? "ring-brand-500/60 bg-brand-600/10"
              : "ring-white/10 bg-ink-850/40 hover:bg-white/5")
        }
      >
        <div className="flex items-center justify-between">
          <span className="truncate text-xs font-medium text-slate-200">{g.name}</span>
          <span className="ms-1 shrink-0 text-[10px] text-slate-500">{g.totalGiB ?? g.vramGiB}GB</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct * 100)}%`, backgroundColor: ok ? GREEN : RED }} />
        </div>
        <div className={"mt-1 text-[10px] " + (overBudget ? "text-bad" : "text-slate-500")}>
          {ok ? t("gpu.w.card", { p: Math.round(pct * 100) }) : t("gpu.w.cardNo")}
        </div>
      </button>
    );
  };

  return (
    <div>
      <SectionTitle step="3" title={t("gpu.step")} hint={t("gpu.w.hint")} />
      <p className="mb-3 text-[11.5px] leading-relaxed text-slate-400">{t("gpu.w.note")}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {GPU_CATEGORIES.map((cat) => {
          const n = GPUS.filter((g) => g.category === cat).length;
          const active = viewCat === cat;
          return (
            <button
              key={cat}
              type="button"
              // Browsing a tier is not choosing a device; only a card click is.
              onClick={() => setViewCat(cat)}
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

      {sel && (
        <p className={"mb-3 rounded-xl bg-ink-800/60 p-3 text-[11.5px] leading-relaxed " + (fits(sel) ? "text-slate-300" : "text-bad")}>
          {fits(sel)
            ? t("gpu.w.sel", {
                name: sel.name,
                x: formatGiB(weightsGiB),
                y: formatGiB(memOf(sel)),
                p: Math.round((weightsGiB / memOf(sel)) * 100),
                r: formatGiB(memOf(sel) - weightsGiB),
              })
            : t("gpu.w.selNo", { name: sel.name, x: formatGiB(weightsGiB), y: formatGiB(memOf(sel)) })}
        </p>
      )}

      {grid.visible.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{grid.visible.map(renderCard)}</div>}
      {!grid.anyFits && (
        <p className={"text-xs text-slate-500" + (grid.visible.length > 0 ? " mt-2" : "")}>{t("gpu.w.none")}</p>
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
  );
}
