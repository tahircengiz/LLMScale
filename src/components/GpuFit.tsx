import { maxConcurrency, maxContextLength, type Dtype, type ModelArch } from "../lib/calc";
import { GPUS, type Gpu } from "../lib/gpus";
import { formatGiB, formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { Badge, SectionTitle, Stat } from "./ui";

const USABLE = 0.95; // fraction of nominal VRAM usable after driver reserve

function ctxLabel(n: number): string {
  return n >= 1024 ? `${n / 1024}k` : String(n);
}

export function GpuFit({
  arch,
  weightDtype,
  kvDtype,
  contextLength,
  concurrency,
  overheadPct,
  cudaContextGiB,
  totalGiB,
  gpuId,
  onGpu,
}: {
  arch: ModelArch;
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  overheadPct: number;
  cudaContextGiB: number;
  totalGiB: number;
  gpuId: string;
  onGpu: (id: string) => void;
}) {
  const { t } = useLang();
  const selected = GPUS.find((g) => g.id === gpuId) ?? GPUS[0];
  const base = { arch, weightDtype, kvDtype, overheadPct, cudaContextGiB };

  function usage(g: Gpu) {
    const usable = g.vramGiB * USABLE;
    return { usable, pct: totalGiB / usable, fits: totalGiB <= usable, needed: Math.ceil(totalGiB / usable) };
  }

  const selUsage = usage(selected);
  const maxUsers = maxConcurrency({ ...base, contextLength }, selected.vramGiB * USABLE);
  const maxCtx = maxContextLength({ ...base, concurrency }, selected.vramGiB * USABLE);
  const sorted = [...GPUS].sort((a, b) => a.vramGiB - b.vramGiB);

  return (
    <div>
      <SectionTitle step="3" title={t("gpu.step")} hint={t("gpu.usableHint", { p: Math.round(USABLE * 100) })} />

      {/* Selected GPU panel */}
      <div className="rounded-2xl bg-ink-850/60 p-4 ring-1 ring-white/10">
        <div className="mb-2 flex items-center justify-between">
          <select
            value={gpuId}
            onChange={(e) => onGpu(e.target.value)}
            className="rounded-lg bg-ink-800 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/10 outline-none focus:ring-brand-500/60"
          >
            {(["consumer", "workstation", "datacenter", "apple"] as const).map((cat) => (
              <optgroup key={cat} label={t(`cat.${cat}`)}>
                {GPUS.filter((g) => g.category === cat).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.vramGiB} GB
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {selUsage.fits ? (
            <Badge tone="good">{t("gpu.fits")}</Badge>
          ) : (
            <Badge tone="bad">{t("gpu.needs", { n: selUsage.needed })}</Badge>
          )}
        </div>

        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, selUsage.pct * 100)}%`,
              backgroundColor: selUsage.fits ? "#10b981" : "#f43f5e",
            }}
          />
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {t("gpu.usage", {
            x: formatGiB(totalGiB),
            y: selected.vramGiB,
            p: Math.round(selUsage.pct * 100),
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat
            label={t("gpu.maxUsers")}
            value={maxUsers > 0 ? formatInt(maxUsers) : "0"}
            sub={t("gpu.atCtx", { x: ctxLabel(contextLength) })}
            accent={maxUsers > 0}
          />
          <Stat
            label={t("gpu.maxContext")}
            value={maxCtx > 0 ? formatInt(maxCtx) : "0"}
            sub={maxCtx > 0 ? t("gpu.tokens") : t("gpu.weightsNoFit")}
          />
        </div>
      </div>

      {/* All GPUs grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sorted.map((g) => {
          const u = usage(g);
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
                <span className="ml-1 shrink-0 text-[10px] text-slate-500">{g.vramGiB}GB</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, u.pct * 100)}%`,
                    backgroundColor: u.fits ? "#10b981" : "#f43f5e",
                  }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                {u.fits ? t("gpu.cardFits", { p: Math.round(u.pct * 100) }) : t("gpu.cardNeeds", { n: u.needed })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
