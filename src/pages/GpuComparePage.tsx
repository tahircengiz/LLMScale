import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CATEGORY_LABELS, GPUS, GPU_CATEGORIES, type Gpu } from "../lib/gpus";
import { MAX_GPUS, bestOf, migMax, parseGpuIds, servedBy } from "../lib/gpuCompare";
import { gpuHint } from "../lib/choices";
import { specOf, type GpuSpec } from "../lib/gpuSpecs";
import { useLang } from "../lib/i18n";
import { Card, Field } from "../components/ui";
import { Select, type Choice } from "../components/choice";
import { InfoTip } from "../components/tip";

// Two to four devices side by side, as their datasheets have them (gpus.ts for
// memory, bandwidth and tensor throughput; gpuSpecs.ts for the rest). The best
// value of a row is highlighted only where more is plainly better and the
// columns differ.

export function GpuComparePage() {
  const { t, lang } = useLang();
  const initialIds = useMemo(() => parseGpuIds(new URLSearchParams(window.location.search).get("g"), GPUS), []);
  const [ids, setIds] = useState<string[]>(initialIds);

  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}?g=${encodeURIComponent(ids.join(",")).replace(/%2C/g, ",")}`);
  }, [ids]);

  const gpus = ids.map((id) => GPUS.find((g) => g.id === id)).filter((g): g is Gpu => !!g);
  const specs = gpus.map((g) => specOf(g.id));

  const n = (v: number) => v.toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 0 });
  const month = (ym: string) => new Date(`${ym}-15T00:00:00Z`).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const power = (s: GpuSpec) => {
    if (!s.powerW) return undefined;
    const w = s.powerMaxW ? `${n(s.powerW)}–${n(s.powerMaxW)} W` : `${n(s.powerW)} W`;
    return s.powerScope ? t(`gpucmp.power.${s.powerScope}`, { w }) : w;
  };
  const none = <span className="text-slate-500">{t("gpucmp.none")}</span>;
  const dash = <span className="text-slate-500">—</span>;
  const tflops = (v?: number) => (v ? `${n(v)} TFLOPS` : none);

  const addOptions: Choice<string>[] = GPU_CATEGORIES.flatMap((c) =>
    GPUS.filter((g) => g.category === c && !ids.includes(g.id)).map((g) => ({
      value: g.id,
      label: g.name,
      hint: gpuHint(t, g, lang),
      group: t(`cat.${c}`) || CATEGORY_LABELS[c],
    })),
  );
  const add = (id: string) => setIds((prev) => (prev.includes(id) || prev.length >= MAX_GPUS ? prev : [...prev, id]));
  const remove = (id: string) => setIds((prev) => prev.filter((x) => x !== id));
  const span = gpus.length;

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("gpucmp.subtitle")}</p>

      <Card className="relative z-30 mb-5 p-4">
        <div className="max-w-md">
          <Field label={t("gpucmp.addTitle")} hint={t("gpucmp.count", { n: ids.length, max: MAX_GPUS })}>
            {ids.length >= MAX_GPUS ? (
              <p className="rounded-xl bg-ink-850 px-3 py-2 text-sm text-slate-500 ring-1 ring-white/10">{t("gpucmp.max", { max: MAX_GPUS })}</p>
            ) : (
              <Select<string> value="" options={addOptions} onChange={add} custom={() => t("gpucmp.add")} label={t("gpucmp.addTitle")} />
            )}
          </Field>
        </div>
      </Card>

      {gpus.length === 0 ? (
        <Card className="p-5">
          <p className="py-10 text-center text-sm text-slate-400">{t("gpucmp.empty")}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 z-10 bg-ink-900 px-3 py-3" />
                  {gpus.map((g) => (
                    <th key={g.id} scope="col" className="min-w-[150px] px-3 py-3 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white">{g.name}</div>
                          <div className="text-[10px] font-normal text-slate-500">
                            {t(`cat.${g.category}`)} · {g.vendor}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(g.id)}
                          title={t("gpucmp.remove")}
                          aria-label={`${t("gpucmp.remove")}: ${g.name}`}
                          className="shrink-0 rounded-md px-1.5 text-slate-500 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-bad"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <Section title={t("gpucmp.sec.chip")} span={span} />
                <SpecRow label={t("gpucmp.row.arch")} tip={t("gpucmp.tip.arch")} vals={specs.map((s) => [s.arch, s.chip, s.process].filter(Boolean).join(" · ") || undefined)} />
                <SpecRow
                  label={t("gpucmp.row.cores")}
                  tip={t("gpucmp.tip.cores")}
                  vals={specs.map((s) => (s.cores && s.coreUnit ? t(`gpucmp.core.${s.coreUnit}`, { n: s.coresAlt ? `${n(s.cores)} / ${n(s.coresAlt)}` : n(s.cores) }) : undefined))}
                />
                <SpecRow label={t("gpucmp.row.launch")} tip={t("gpucmp.tip.launch")} vals={specs.map((s) => (s.launch ? month(s.launch) : undefined))} />

                <Section title={t("gpucmp.sec.memory")} span={span} />
                <Row
                  label={t("gpucmp.row.memory")}
                  tip={t("gpucmp.tip.memory")}
                  wins={bestOf(gpus.map((g) => g.totalGiB ?? g.vramGiB))}
                  cells={gpus.map((g) =>
                    g.unified && g.totalGiB ? (
                      <>
                        {t("gpucmp.unified", { gb: n(g.totalGiB) })}
                        <span className="block text-[11px] font-normal text-slate-500">{t("gpucmp.gpuShare", { gb: n(g.vramGiB) })}</span>
                      </>
                    ) : (
                      `${n(g.vramGiB)} GB`
                    ),
                  )}
                />
                <SpecRow
                  label={t("gpucmp.row.memType")}
                  tip={t("gpucmp.tip.memType")}
                  vals={specs.map((s) => [s.memType, s.busBits ? t("gpucmp.bus", { n: n(s.busBits) }) : undefined].filter(Boolean).join(" · ") || undefined)}
                />
                <Row
                  label={t("gpucmp.row.bandwidth")}
                  tip={t("gpucmp.tip.bandwidth")}
                  wins={bestOf(gpus.map((g) => g.bandwidthGBs))}
                  cells={gpus.map((g) => (g.bandwidthGBs ? t("gpucmp.gbps", { n: n(g.bandwidthGBs) }) : dash))}
                />

                <Section title={t("gpucmp.sec.tensor")} span={span} hint={t("gpucmp.sec.tensorHint")} />
                <Row label={t("gpucmp.row.bf16")} tip={t("gpucmp.tip.bf16")} wins={bestOf(gpus.map((g) => g.tflops?.bf16))} cells={gpus.map((g) => (g.tflops ? tflops(g.tflops.bf16) : dash))} />
                <Row label={t("gpucmp.row.fp8")} tip={t("gpucmp.tip.fp8")} wins={bestOf(gpus.map((g) => g.tflops?.fp8))} cells={gpus.map((g) => (g.tflops ? tflops(g.tflops.fp8) : dash))} />
                <Row label={t("gpucmp.row.fp4")} tip={t("gpucmp.tip.fp4")} wins={bestOf(gpus.map((g) => g.tflops?.fp4))} cells={gpus.map((g) => (g.tflops ? tflops(g.tflops.fp4) : dash))} />

                <Section title={t("gpucmp.sec.platform")} span={span} />
                <SpecRow label={t("gpucmp.row.power")} tip={t("gpucmp.tip.power")} vals={specs.map(power)} />
                <SpecRow label={t("gpucmp.row.host")} tip={t("gpucmp.tip.host")} vals={specs.map((s) => s.host)} />
                <SpecRow label={t("gpucmp.row.link")} tip={t("gpucmp.tip.link")} vals={specs.map((s) => (s.link === "none" ? t("gpucmp.linkNone") : s.link))} />
                <Row label={t("gpucmp.row.mig")} tip={t("gpucmp.tip.mig")} cells={gpus.map((g) => (migMax(g) ? t("gpucmp.migUpTo", { n: migMax(g)! }) : none))} />
                <Row label={t("gpucmp.row.engine")} tip={t("gpucmp.tip.engine")} cells={gpus.map((g) => t(`gpucmp.engine.${servedBy(g)}`))} />
              </tbody>
            </table>
          </div>
          <p className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-slate-500">{t("gpucmp.note")}</p>
        </Card>
      )}
    </div>
  );
}

function Section({ title, span, hint }: { title: string; span: number; hint?: string }) {
  return (
    <tr>
      <th colSpan={span + 1} scope="colgroup" className="bg-ink-850/70 px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
        {hint && <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">{hint}</span>}
      </th>
    </tr>
  );
}

/** A datasheet fact from gpuSpecs.ts; the row is left out while no column has it. */
function SpecRow({ label, tip, vals }: { label: string; tip?: string; vals: (string | undefined)[] }) {
  if (vals.every((v) => !v)) return null;
  return <Row label={label} tip={tip} cells={vals.map((v) => v ?? <span className="text-slate-500">—</span>)} />;
}

function Row({ label, tip, cells, wins }: { label: string; tip?: string; cells: ReactNode[]; wins?: boolean[] }) {
  return (
    <tr className="group transition-colors hover:bg-white/5">
      <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-ink-900 px-3 py-2 text-left text-xs font-medium text-slate-400 transition-colors group-hover:bg-ink-850">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {tip && <InfoTip text={tip} />}
        </span>
      </th>
      {cells.map((c, i) => (
        <td key={i} className={"px-3 py-2 text-sm tabular-nums " + (wins?.[i] ? "bg-accent-500/10 font-semibold text-accent-400" : "text-slate-200")}>
          {c}
        </td>
      ))}
    </tr>
  );
}
