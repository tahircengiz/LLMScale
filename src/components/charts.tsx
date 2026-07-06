// Dependency-free, theme-aware chart primitives (inline SVG / HTML).
// Shapes use explicit hex colours; text/grid use Tailwind fill-*/stroke-*
// utilities so they flip with the light/dark CSS variables.

import type { ReactNode } from "react";

export interface DonutSeg {
  label: string;
  value: number;
  color: string;
  sub?: string;
}

export function Donut({
  segments,
  size = 172,
  thickness = 24,
  centerTop,
  centerBottom,
}: {
  segments: DonutSeg[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              className="stroke-white"
              strokeOpacity={0.08}
              strokeWidth={thickness}
            />
            {segments.map((s, i) => {
              const len = (s.value / total) * C;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
          </g>
        </svg>
        {(centerTop || centerBottom) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerTop && <span className="text-lg font-bold text-white">{centerTop}</span>}
            {centerBottom && <span className="text-[11px] text-slate-400">{centerBottom}</span>}
          </div>
        )}
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="truncate text-slate-300">{s.label}</span>
            {s.sub && <span className="ml-auto shrink-0 text-xs text-slate-500">{s.sub}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface BarItem {
  label: string;
  value: number;
  valueLabel: string;
  color: string;
  highlight?: boolean;
}

export function HBars({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className={it.highlight ? "font-semibold text-white" : "text-slate-300"}>
              {it.label}
              {it.highlight && <span className="ml-1.5 text-[10px] text-accent-400">●</span>}
            </span>
            <span className="tabular-nums text-slate-400">{it.valueLabel}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(it.value / max) * 100}%`, backgroundColor: it.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface LineSeries {
  points: { x: number; y: number }[];
  color: string;
  dashed?: boolean;
}

export function LineChart({
  series,
  xMax,
  yMax,
  height = 200,
  formatX,
  formatY,
  xTicks = [],
}: {
  series: LineSeries[];
  xMax: number;
  yMax: number;
  height?: number;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  xTicks?: number[];
}) {
  const W = 460;
  const H = height;
  const padL = 46;
  const padB = 26;
  const padT = 8;
  const padR = 8;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const sx = (x: number) => padL + (xMax > 0 ? (x / xMax) * plotW : 0);
  const sy = (y: number) => padT + plotH - (yMax > 0 ? (y / yMax) * plotH : 0);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="text-slate-400" role="img">
      {/* y grid + labels */}
      {yTicks.map((yt, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={sy(yt)}
            x2={W - padR}
            y2={sy(yt)}
            className="stroke-white"
            strokeOpacity={0.08}
          />
          <text x={padL - 6} y={sy(yt) + 3} textAnchor="end" className="fill-slate-400" style={{ fontSize: 10 }}>
            {formatY(yt)}
          </text>
        </g>
      ))}
      {/* x ticks */}
      {xTicks.map((xt, i) => (
        <text
          key={i}
          x={sx(xt)}
          y={H - 8}
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: 10 }}
        >
          {formatX(xt)}
        </text>
      ))}
      {/* series */}
      {series.map((s, i) => (
        <polyline
          key={i}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
          strokeDasharray={s.dashed ? "5 4" : undefined}
          points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
        />
      ))}
    </svg>
  );
}

/** Group Ah query heads into Kh KV groups (GQA visual). Caps drawn heads. */
export function GqaDiagram({ attnHeads, kvHeads }: { attnHeads: number; kvHeads: number }) {
  const GROUP_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#14b8a6", "#ec4899"];
  const perGroup = Math.max(1, Math.round(attnHeads / Math.max(1, kvHeads)));
  const maxGroups = Math.min(kvHeads, 8);
  const capped = kvHeads > maxGroups;
  const groups = Array.from({ length: maxGroups });

  return (
    <div className="flex flex-wrap gap-2.5">
      {groups.map((_, g) => (
        <div
          key={g}
          className="flex items-center gap-1 rounded-lg p-1.5 ring-1 ring-white/10"
          style={{ backgroundColor: `${GROUP_COLORS[g % GROUP_COLORS.length]}14` }}
        >
          <span
            className="h-4 w-4 rounded-sm"
            title="KV head"
            style={{ backgroundColor: GROUP_COLORS[g % GROUP_COLORS.length] }}
          />
          <span className="text-slate-500">→</span>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(perGroup, 8) }).map((__, q) => (
              <span
                key={q}
                className="h-4 w-2 rounded-[2px]"
                title="query head"
                style={{ backgroundColor: `${GROUP_COLORS[g % GROUP_COLORS.length]}88` }}
              />
            ))}
          </div>
        </div>
      ))}
      {capped && <span className="self-center text-xs text-slate-500">+{kvHeads - maxGroups} more</span>}
    </div>
  );
}

/** A compact labelled spec cell. */
export function Spec({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl bg-ink-850/60 p-3 ring-1 ring-white/5">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
