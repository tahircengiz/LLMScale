import type { CalcResult } from "../lib/calc";
import { formatBytes, formatGiB } from "../lib/format";
import { useLang } from "../lib/i18n";
import { SectionTitle, Stat } from "./ui";

const SEGMENTS = [
  { key: "weights", i18n: "seg.weights", color: "#6366f1" },
  { key: "kv", i18n: "seg.kv", color: "#10b981" },
  { key: "act", i18n: "seg.act", color: "#f59e0b" },
  { key: "cuda", i18n: "seg.cuda", color: "#64748b" },
] as const;

export function Results({ result }: { result: CalcResult }) {
  const { t } = useLang();
  const parts = {
    weights: result.weightsGiB,
    kv: result.kvCacheGiB,
    act: result.activationsGiB,
    cuda: result.cudaOverheadGiB,
  };
  const total = result.totalGiB || 1;

  return (
    <div>
      <div className="flex items-end justify-between">
        <SectionTitle title={t("results.title")} />
        <div className="text-right">
          <div className="text-3xl font-bold tracking-tight text-white">
            {formatGiB(result.totalGiB)}
          </div>
          <div className="text-xs text-slate-500">{t("results.totalRequired")}</div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="mt-2 flex h-5 w-full overflow-hidden rounded-full ring-1 ring-white/10">
        {SEGMENTS.map((s) => {
          const v = parts[s.key];
          const pct = (v / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              title={`${t(s.i18n)}: ${formatGiB(v)} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {t(s.i18n)} — {formatGiB(parts[s.key])}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t("stat.weights")} value={formatGiB(result.weightsGiB)} />
        <Stat label={t("stat.kvTotal")} value={formatGiB(result.kvCacheGiB)} accent />
        <Stat label={t("stat.kvSeq")} value={formatGiB(result.kvPerSeqGiB)} />
        <Stat
          label={t("stat.kvToken")}
          value={formatBytes(result.kvPerTokenBytes)}
          sub={t("stat.headDim", { n: result.headDim })}
        />
      </div>
    </div>
  );
}
