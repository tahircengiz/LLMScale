import type { ReactNode } from "react";
import {
  calculate,
  maxConcurrency,
  type CalcResult,
  type Dtype,
  type ModelArch,
} from "../lib/calc";
import { GPUS, migProfilesFor, usableGiB, type Gpu, type GpuCategory } from "../lib/gpus";
import { formatGiB, formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { AMBER, GREEN, GREY, INDIGO, RED } from "../lib/palette";
import type { AppState } from "../lib/urlState";
import { Badge } from "./ui";

const CATS: GpuCategory[] = ["consumer", "workstation", "datacenter", "apple", "apu"];

/** Short precision labels — the shared DTYPE_LABELS carry byte counts that wrap here. */
export const SHORT_DTYPE: Record<Dtype, string> = {
  fp32: "FP32", fp16: "FP16", bf16: "BF16", fp8: "FP8", int8: "INT8", int4: "INT4",
};

/** Everything the console cards need, derived once by the page. */
export interface ConsoleModel {
  arch: ModelArch;
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  overheadPct: number;
  cudaContextGiB: number;
  result: CalcResult;
  gpu: Gpu;
  migId: string;
  usable: number;
  patch: (p: Partial<AppState>) => void;
}

function ctxLabel(n: number): string {
  return n >= 1048576 ? `${n / 1048576}M` : n >= 1024 ? `${n / 1024}k` : String(n);
}

/** Recompute the total for a variant of the current settings. */
function totalFor(m: ConsoleModel, over: Partial<AppState>): number {
  return calculate({
    arch: m.arch,
    weightDtype: (over.weightDtype ?? m.weightDtype) as Dtype,
    kvDtype: (over.kvDtype ?? m.kvDtype) as Dtype,
    contextLength: over.contextLength ?? m.contextLength,
    concurrency: over.concurrency ?? m.concurrency,
    overheadPct: m.overheadPct,
    cudaContextGiB: m.cudaContextGiB,
  }).totalGiB;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={"rounded-2xl border border-ink-700 bg-ink-900 " + className}>{children}</section>
  );
}

function CardHead({ icon, title, note }: { icon: ReactNode; title: string; note?: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-white text-ink-900">
        {icon}
      </span>
      <span className="text-sm font-semibold text-white">{title}</span>
      {note && <span className="truncate text-xs text-slate-500">{note}</span>}
    </div>
  );
}

const ico = (d: string) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/* ─────────────────────────── scenario tabs ─────────────────────────── */

const SCENARIOS = [
  { key: "single", ctx: 8192, users: 1 },
  { key: "chat", ctx: 8192, users: 32 },
  { key: "long", ctx: 131072, users: 4 },
  { key: "batch", ctx: 4096, users: 128 },
] as const;

export function ScenarioTabs({ m }: { m: ConsoleModel }) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap gap-1">
      {SCENARIOS.map((s) => {
        const on = m.contextLength === s.ctx && m.concurrency === s.users;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => m.patch({ contextLength: s.ctx, concurrency: s.users })}
            className={
              "rounded-[9px] border px-3.5 py-1.5 text-[12.5px] transition " +
              (on
                ? "border-ink-700 bg-ink-900 font-semibold text-white shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200")
            }
          >
            {t(`scen.${s.key}`)}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── gauge card ──────────────────────────── */

export function GaugeCard({ m }: { m: ConsoleModel }) {
  const { t } = useLang();
  const total = m.result.totalGiB;
  const pct = total / m.usable;
  const fits = total <= m.usable;
  const maxUsers = maxConcurrency(
    {
      arch: m.arch,
      weightDtype: m.weightDtype,
      kvDtype: m.kvDtype,
      contextLength: m.contextLength,
      overheadPct: m.overheadPct,
      cudaContextGiB: m.cudaContextGiB,
    },
    m.usable
  );

  return (
    <Card className="p-4">
      <CardHead icon={ico("M2.5 2.5h11v11h-11zM5.6 5.6h4.8v4.8H5.6z")} title={t("con.total")} note={t("con.estimated")} />

      <div className="relative pt-1">
        <svg viewBox="0 0 200 116" className="block w-full">
          <path d="M18 106 A82 82 0 0 1 182 106" fill="none" stroke="currentColor" className="text-ink-800" strokeWidth="15" strokeLinecap="round" />
          <path
            d="M18 106 A82 82 0 0 1 182 106"
            fill="none"
            stroke={fits ? INDIGO : RED}
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray="258"
            strokeDashoffset={258 * (1 - Math.min(1, pct))}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-3 text-center">
          <div className="text-[31px] font-bold leading-none tracking-tight text-white">{formatGiB(total)}</div>
          <div className="mt-0.5 text-[11.5px] text-slate-500">{t("con.gibNeeded")}</div>
        </div>
      </div>

      <div className="mb-3 text-center text-xs text-slate-400">
        {t("con.gaugeCaption", { p: Math.round(pct * 100), usable: m.usable.toFixed(1) })}
      </div>

      <div className="grid grid-cols-2 border-t border-ink-700 pt-3">
        <div className="border-r border-ink-700 pr-3">
          <div className="text-[11px] text-slate-500">{t("con.headroom")}</div>
          <div className="mt-0.5 text-[15px] font-bold" style={{ color: fits ? GREEN : RED }}>
            {fits ? "+" : "−"}
            {Math.abs(m.usable - total).toFixed(1)} GiB
          </div>
          <div className="truncate text-[11px] text-slate-500">{m.gpu.name}</div>
        </div>
        <div className="pl-3.5">
          <div className="text-[11px] text-slate-500">{t("con.maxUsers")}</div>
          <div className="mt-0.5 text-[15px] font-bold text-white">{formatInt(maxUsers)}</div>
          <div className="text-[11px] text-slate-500">{t("con.atCtx", { x: ctxLabel(m.contextLength) })}</div>
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────── precision comparison ────────────────────── */

const PRECISIONS: Dtype[] = ["bf16", "fp8", "int8", "int4"];

export function PrecisionCard({ m }: { m: ConsoleModel }) {
  const { t } = useLang();
  const totals = PRECISIONS.map((d) => totalFor(m, { weightDtype: d }));
  const scale = Math.max(...totals, m.usable) * 1.06;
  const tick = Math.min(99, (m.usable / scale) * 100);

  return (
    <Card className="p-4 px-4.5">
      <CardHead
        icon={ico("M2.5 11.5h11M2.5 8h7M2.5 4.5h4")}
        title={t("con.precision")}
        note={t("con.againstCapacity", { gpu: m.gpu.name })}
      />

      {PRECISIONS.map((d, i) => {
        const total = totals[i];
        const fits = total <= m.usable;
        const on = d === m.weightDtype;
        return (
          <button
            key={d}
            type="button"
            onClick={() => m.patch({ weightDtype: d })}
            className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-[9px] border-t border-ink-700 px-3 py-2.5 text-left transition first:border-t-0 hover:bg-white/5"
          >
            <span className="w-[104px] shrink-0">
              <b className="block text-[13px] font-semibold text-white">{SHORT_DTYPE[d]}</b>
              <span className="text-[11px] text-slate-500">{on ? t("con.selected") : t(`con.dt.${d}`)}</span>
            </span>
            <span className="relative h-[11px] flex-1">
              <span className="absolute inset-0 rounded-md bg-ink-800" />
              <span
                className="absolute left-0 top-0 h-[11px] rounded-md"
                style={{
                  width: `${Math.min(100, (total / scale) * 100).toFixed(1)}%`,
                  backgroundColor: fits ? (on ? INDIGO : "#8b8cf5") : RED,
                }}
              />
              <span className="absolute -top-0.5 h-[15px] w-0.5 rounded-sm bg-white" style={{ left: `${tick}%` }} />
            </span>
            <span className="w-[68px] shrink-0 text-right text-[12.5px] font-semibold text-white">
              {formatGiB(total)} GiB
            </span>
            <Badge tone={fits ? "good" : "bad"}>
              {fits ? t("con.fits") : t("con.nCards", { n: Math.ceil(total / m.usable) })}
            </Badge>
          </button>
        );
      })}

      <p className="mt-3 text-[11.5px] text-slate-500">{t("con.tickHint")}</p>
    </Card>
  );
}

/* ─────────────────────────── hardware rail ─────────────────────────── */

export function HardwareRail({ m }: { m: ConsoleModel }) {
  const { t } = useLang();
  // Fitting devices lead, each group smallest-first, so the useful ones are on screen.
  const need = m.result.totalGiB;
  const inCat = GPUS.filter((g) => g.category === m.gpu.category).sort((a, b) => {
    const fa = need <= usableGiB(a) ? 0 : 1;
    const fb = need <= usableGiB(b) ? 0 : 1;
    return fa - fb || usableGiB(a) - usableGiB(b);
  });
  const migProfiles = migProfilesFor(m.gpu.id);

  function jump(cat: GpuCategory) {
    const list = GPUS.filter((g) => g.category === cat).sort((a, b) => usableGiB(a) - usableGiB(b));
    const fit = list.find((g) => m.result.totalGiB <= usableGiB(g));
    m.patch({ gpuId: (fit ?? list[list.length - 1]).id, migId: "" });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 text-sm font-semibold text-white">{t("con.hardware")}</div>

      <div className="mb-3 flex flex-wrap gap-1">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => jump(c)}
            className={
              "rounded-md px-2 py-1 text-[11px] font-medium transition " +
              (c === m.gpu.category ? "bg-brand-500 text-onbrand" : "bg-ink-850 text-slate-400 hover:text-slate-200")
            }
          >
            {t(`cat.${c}`)}
          </button>
        ))}
      </div>

      <div className="max-h-[248px] overflow-y-auto">
        {inCat.map((g) => {
          const u = usableGiB(g);
          const p = m.result.totalGiB / u;
          const fits = m.result.totalGiB <= u;
          const tight = fits && p > 0.85;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => m.patch({ gpuId: g.id, migId: "" })}
              className={
                "-mx-2 flex w-[calc(100%+1rem)] items-start gap-2.5 rounded-[9px] border-t border-ink-700 px-2 py-2.5 text-left transition first:border-t-0 " +
                (g.id === m.gpu.id ? "bg-brand-500/10 ring-1 ring-brand-500/40" : "hover:bg-white/5")
              }
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <b className="truncate text-[13px] font-semibold text-white">{g.name}</b>
                  <Badge tone={fits ? (tight ? "warn" : "good") : "bad"}>
                    {fits ? (tight ? t("con.tight") : t("con.fits")) : t("con.short")}
                  </Badge>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                  {g.totalGiB ? `${g.totalGiB} GB → ${g.vramGiB}` : `${g.vramGiB} GB`}
                  {g.bandwidthGBs ? ` · ${g.bandwidthGBs} GB/s` : ""}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <b className="block text-[13px] font-semibold" style={{ color: fits ? undefined : RED }}>
                  {fits ? `%${Math.round(p * 100)}` : `${Math.ceil(p)}×`}
                </b>
                <span className="text-[11px] text-slate-500">
                  {fits ? `${(u - m.result.totalGiB).toFixed(1)} GiB` : `+${(m.result.totalGiB - u).toFixed(1)}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {migProfiles.length > 0 && (
        <select
          value={m.migId}
          onChange={(e) => m.patch({ migId: e.target.value })}
          className="mt-3 w-full rounded-lg border border-ink-700 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500"
        >
          <option value="">{t("gpu.migOff")}</option>
          {migProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              MIG {p.id} — {p.memGiB} GB{p.max > 1 ? ` (×${p.max})` : ""}
            </option>
          ))}
        </select>
      )}

      <p className="mt-3 border-t border-ink-700 pt-3 text-[11.5px] leading-relaxed text-slate-400">
        {t("con.hwNote")}
      </p>
    </Card>
  );
}

/* ───────────────────────────── savings card ────────────────────────── */

interface Saving {
  key: string;
  patch: Partial<AppState>;
  total: number;
  gain: number;
  applied: boolean;
}

function buildSavings(m: ConsoleModel): Saving[] {
  const cur = m.result.totalGiB;
  const opts: { key: string; patch: Partial<AppState> }[] = [
    { key: "kvFp8", patch: { kvDtype: "fp8" } },
    { key: "wInt4", patch: { weightDtype: "int4" } },
    { key: "ctxHalf", patch: { contextLength: Math.max(2048, Math.floor(m.contextLength / 2)) } },
    { key: "usersHalf", patch: { concurrency: Math.max(1, Math.floor(m.concurrency / 2)) } },
  ];
  return opts.map((o) => {
    const total = totalFor(m, o.patch);
    return { ...o, total, gain: cur - total, applied: Math.abs(cur - total) < 0.005 };
  });
}

export function SavingsCard({ m }: { m: ConsoleModel }) {
  const { t } = useLang();
  const rows = buildSavings(m);
  const best = rows.reduce((a, b) => (b.gain > a.gain ? b : a), rows[0]);
  const fits = m.result.totalGiB <= m.usable;

  return (
    <Card className="p-4 px-4.5">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-white text-ink-900">
          {ico("M8 2.5v11M4.5 6L8 2.5 11.5 6")}
        </span>
        <span className="text-sm font-semibold text-white">{t("con.savings")}</span>
        <span className="text-xs text-slate-500">{t("con.savingsNote")}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="rounded-md bg-ink-850 px-2 py-1 text-[11.5px] font-semibold text-slate-400">
            {fits ? t("con.currentlyFits") : t("con.needFree", { x: (m.result.totalGiB - m.usable).toFixed(1) })}
          </span>
          {best.gain > 0 && (
            <button
              type="button"
              onClick={() => m.patch(best.patch)}
              className="flex items-center gap-1.5 rounded-[9px] bg-brand-600 px-3 py-1.5 text-[12.5px] font-semibold text-onbrand transition hover:bg-brand-500"
            >
              {t("con.applyBest")}
              {ico("M3 8h9M8.5 4.5L12 8l-3.5 3.5")}
            </button>
          )}
        </span>
      </div>

      <div className="grid grid-cols-[1.7fr_.7fr_1.4fr_1fr_.8fr_.8fr] items-center gap-2.5 pb-2 text-[11px] font-semibold text-slate-500">
        <span>{t("con.col.change")}</span>
        <span>{t("con.col.gain")}</span>
        <span>{t("con.col.what")}</span>
        <span>{t("con.col.cost")}</span>
        <span className="text-right">{t("con.col.newTotal")}</span>
        <span className="text-right">{t("con.col.result")}</span>
      </div>

      {rows.map((r) => {
        const ok = r.total <= m.usable;
        return (
          <button
            key={r.key}
            type="button"
            disabled={r.applied}
            onClick={() => m.patch(r.patch)}
            className="-mx-3 grid w-[calc(100%+1.5rem)] grid-cols-[1.7fr_.7fr_1.4fr_1fr_.8fr_.8fr] items-center gap-2.5 rounded-[9px] border-t border-ink-700 px-3 py-2.5 text-left transition enabled:hover:bg-white/5 disabled:opacity-55"
          >
            <span>
              <b className="block text-[13px] font-semibold text-white">{t(`con.sv.${r.key}`)}</b>
              <span className="text-[11px] text-slate-500">{t(`con.svCode.${r.key}`)}</span>
            </span>
            <span className="text-[13px] font-bold" style={{ color: r.applied ? GREY : r.gain > 0 ? GREEN : RED }}>
              {r.applied ? "—" : `${r.gain > 0 ? "−" : "+"}${Math.abs(r.gain).toFixed(2)}`}
            </span>
            <span className="text-[12.5px] text-slate-300">{t(`con.svWhat.${r.key}`)}</span>
            <span className="text-[12.5px] text-slate-300">{t(`con.svCost.${r.key}`)}</span>
            <span className="text-right text-[13px] font-semibold text-white">{formatGiB(r.total)}</span>
            <span className="text-right">
              <Badge tone={r.applied ? "neutral" : ok ? "good" : "bad"}>
                {r.applied ? t("con.applied") : ok ? t("con.fits") : t("con.short")}
              </Badge>
            </span>
          </button>
        );
      })}
    </Card>
  );
}

/* ──────────────────────────── capacity rail ────────────────────────── */

export function CapacityRail({ m }: { m: ConsoleModel }) {
  const { t } = useLang();
  const r = m.result;
  const parts = [
    { label: t("seg.weights"), v: r.weightsGiB, c: INDIGO },
    { label: t("seg.kv"), v: r.kvCacheGiB, c: GREEN },
    { label: t("seg.act"), v: r.activationsGiB, c: AMBER },
    { label: t("seg.cuda"), v: r.cudaOverheadGiB, c: GREY },
  ];
  const maxUsers = maxConcurrency(
    {
      arch: m.arch,
      weightDtype: m.weightDtype,
      kvDtype: m.kvDtype,
      contextLength: m.contextLength,
      overheadPct: m.overheadPct,
      cudaContextGiB: m.cudaContextGiB,
    },
    m.usable
  );

  return (
    <Card className="p-4">
      <div className="mb-2.5 text-sm font-semibold text-white">{t("con.capacity")}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-[31px] font-bold leading-none tracking-tight text-white">{formatInt(maxUsers)}</span>
        <span className="text-[13px] text-slate-400">{t("con.concurrentUsers")}</span>
      </div>

      <div className="my-3 flex h-2 overflow-hidden rounded-md bg-ink-800">
        {parts.map((p) => (
          <span key={p.label} style={{ width: `${(p.v / r.totalGiB) * 100}%`, backgroundColor: p.c }} />
        ))}
      </div>
      <div className="mb-2.5 text-[11.5px] text-slate-500">
        {t("con.usageLine", {
          x: formatGiB(r.totalGiB),
          y: m.usable.toFixed(1),
          ctx: ctxLabel(m.contextLength),
          n: m.concurrency,
        })}
      </div>

      {parts.map((p) => (
        <div key={p.label} className="flex items-center gap-2.5 py-1">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: p.c }} />
          <span className="flex-1 text-[12.5px] text-slate-300">{p.label}</span>
          <span className="text-[12.5px] font-semibold text-white">{formatGiB(p.v)}</span>
        </div>
      ))}

      <p className="mt-3 border-t border-ink-700 pt-3 text-[11.5px] leading-relaxed text-slate-400">
        {t("con.capNote")}
      </p>
    </Card>
  );
}

/* ───────────────────────────── insight band ────────────────────────── */

export function InsightBand({ m }: { m: ConsoleModel }) {
  const { t } = useLang();
  const r = m.result;
  const fits = r.totalGiB <= m.usable;
  const kvShare = r.kvCacheGiB / r.totalGiB;
  const best = buildSavings(m).reduce((a, b) => (b.gain > a.gain ? b : a));

  let line1: string;
  let line2: string;
  if (!fits) {
    line1 = t("con.ins.overTitle", { gpu: m.gpu.name, x: (r.totalGiB - m.usable).toFixed(1) });
    line2 =
      best.gain > 0
        ? t("con.ins.overBody", { action: t(`con.sv.${best.key}`), x: best.gain.toFixed(2), total: formatGiB(best.total) })
        : t("con.ins.overNoFix");
  } else if (kvShare > 0.45) {
    line1 = t("con.ins.kvTitle", { p: Math.round(kvShare * 100) });
    line2 = t("con.ins.kvBody", { x: (r.kvCacheGiB / 2).toFixed(2) });
  } else {
    line1 = t("con.ins.okTitle", { gpu: m.gpu.name, x: (m.usable - r.totalGiB).toFixed(1) });
    line2 = t("con.ins.okBody", { ctx: ctxLabel(m.contextLength) });
  }

  return (
    <div className="flex gap-3 rounded-2xl bg-brand-500/10 p-4">
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-brand-500 text-onbrand">
        {ico("M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6")}
      </span>
      <p className="m-0 text-[13px] leading-relaxed text-slate-200">
        <b className="font-semibold text-white">{line1}</b>
        <br />
        {line2}
      </p>
    </div>
  );
}
