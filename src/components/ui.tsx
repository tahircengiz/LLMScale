import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-white/10 bg-ink-900/70 backdrop-blur-sm shadow-xl shadow-black/30 " +
        className
      }
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  step,
  title,
  hint,
}: {
  step?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-2">
      {step && (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-400 ring-1 ring-brand-500/40">
          {step}
        </span>
      )}
      <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-ink-850 p-1 ring-1 ring-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            (size === "sm" ? "px-2.5 py-1 text-xs " : "px-3 py-1.5 text-sm ") +
            "rounded-lg font-medium transition " +
            (value === o.value
              ? "bg-brand-600 text-white shadow"
              : "text-slate-300 hover:bg-white/5")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center rounded-xl bg-ink-850 ring-1 ring-white/10 focus-within:ring-brand-500/60">
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none"
      />
      {suffix && <span className="pr-3 text-xs text-slate-500">{suffix}</span>}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-ink-850/60 p-3 ring-1 ring-white/5">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={"mt-0.5 text-lg font-semibold " + (accent ? "text-accent-400" : "text-white")}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones = {
    neutral: "bg-white/5 text-slate-300 ring-white/10",
    good: "bg-accent-500/15 text-accent-400 ring-accent-500/30",
    warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    bad: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  } as const;
  return (
    <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 " + tones[tone]}>
      {children}
    </span>
  );
}
