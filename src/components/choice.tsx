import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useLang } from "../lib/i18n";
import { InfoTip, Tip } from "./tip";
import { NumberInput } from "./ui";

// Choosing instead of typing. Every setting on the site picks from sensible
// options by default, each option saying on hover what it means; advanced mode,
// one switch shared by every page, swaps the menus for number fields.

// ── advanced mode ──────────────────────────────────────────────────────────

const KEY = "advanced";
const listeners = new Set<() => void>();
function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function subscribe(f: () => void) {
  listeners.add(f);
  const onStorage = (e: StorageEvent) => e.key === KEY && f();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(f);
    window.removeEventListener("storage", onStorage);
  };
}

/** Whether the visitor asked to type numbers instead of picking them. One
 *  preference for the whole site, kept in this browser. */
export function useAdvanced(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => false);
  const set = (v: boolean) => {
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {
      /* storage unavailable: the switch still works for this page view */
    }
    listeners.forEach((f) => f());
  };
  return [on, set];
}

export function AdvancedToggle() {
  const { t } = useLang();
  const [on, set] = useAdvanced();
  return (
    <Tip text={t("adv.hint")}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(!on)}
        className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-200"
      >
        <span className={"relative h-4 w-7 rounded-full ring-1 transition " + (on ? "bg-brand-600 ring-brand-500" : "bg-ink-850 ring-white/15")}>
          <span className={"absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all " + (on ? "left-3.5" : "left-0.5")} />
        </span>
        {t("adv.label")}
      </button>
    </Tip>
  );
}

// ── the menu ───────────────────────────────────────────────────────────────

export interface Choice<T> {
  value: T;
  label: string;
  /** What picking it means, shown while the option is hovered or highlighted. */
  hint?: string;
  /** Options with a group are listed under its heading. */
  group?: string;
}

/**
 * A dropdown whose options explain themselves: the highlighted option's hint
 * shows at the foot of the open list, so the explanation sits where the eye
 * already is. Keyboard: arrows move, Enter or Space picks, Escape closes.
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  custom,
  id,
}: {
  value: T;
  options: Choice<T>[];
  onChange: (v: T) => void;
  /** Accessible name, when the visible label is not wired to it. */
  label?: string;
  /** How to show a value that is not among the options (set in advanced mode
   *  or by a shared link). */
  custom?: (v: T) => string;
  id?: string;
}) {
  const auto = useId();
  const listId = `${id ?? auto}-list`;
  const [open, setOpen] = useState(false);
  const selected = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(Math.max(0, selected));
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, selected));
    const away = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const pick = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };
  const key = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") setActive((a) => Math.min(options.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(options.length - 1);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape" || e.key === "Tab") return setOpen(false);
    else return;
    e.preventDefault();
  };

  const current = selected >= 0 ? options[selected].label : custom ? custom(value) : String(value);
  const hint = options[active]?.hint;
  let lastGroup: string | undefined;

  return (
    <div ref={wrap} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={key}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-ink-850 px-3 py-2 text-left text-sm text-white ring-1 ring-control outline-none transition focus-visible:ring-brand-500/60 hover:bg-white/5"
      >
        <span className="min-w-0 truncate">{current}</span>
        <span aria-hidden className={"text-xs text-slate-500 transition " + (open ? "rotate-180" : "")}>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl bg-ink-850 shadow-2xl ring-1 ring-white/15">
          <ul ref={list} id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto py-1">
            {options.map((o, i) => {
              const head = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              return (
                <li key={String(o.value)} role="presentation">
                  {head && <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{head}</div>}
                  <div
                    id={`${listId}-${i}`}
                    data-i={i}
                    role="option"
                    aria-selected={i === selected}
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    // Inside a <label>, a click would also press the button it labels and reopen the list.
                    onClick={(e) => {
                      e.preventDefault();
                      pick(i);
                    }}
                    className={
                      "flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm " +
                      (i === active ? "bg-brand-600/20 text-white" : "text-slate-300") +
                      (i === selected ? " font-semibold" : "")
                    }
                  >
                    <span className="min-w-0 truncate">{o.label}</span>
                    {i === selected && <span aria-hidden className="text-brand-400">✓</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          {hint && (
            <p aria-live="polite" className="border-t border-white/10 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A number the visitor picks from sensible options, or types in advanced mode.
 * The label carries what the setting is; each option what picking it means.
 */
export function PickField({
  label,
  info,
  value,
  options,
  onChange,
  min,
  max,
  step,
  suffix,
  custom,
  aside,
}: {
  label: string;
  info?: string;
  value: number;
  options: Choice<number>[];
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  custom?: (v: number) => string;
  /** Short text at the right of the label row (a model's maximum, a unit). */
  aside?: ReactNode;
}) {
  const [advanced] = useAdvanced();
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center gap-1.5">
          <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </label>
          {info && <InfoTip text={info} />}
        </span>
        {aside && <span className="text-xs text-slate-500">{aside}</span>}
      </div>
      {advanced ? (
        <NumberInput id={id} value={value} onChange={onChange} min={min} max={max} step={step} suffix={suffix} />
      ) : (
        <Select id={id} value={value} options={options} onChange={onChange} custom={custom} />
      )}
    </div>
  );
}

/** Wraps a control that only appears in advanced mode. */
export function AdvancedOnly({ children }: { children: ReactNode }) {
  const [advanced] = useAdvanced();
  return advanced ? <>{children}</> : null;
}
