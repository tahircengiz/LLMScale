import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

// ── hover explanations ─────────────────────────────────────────────────────

const DELAY = 250;
const WIDTH = 280;

/** A short explanation shown when the pointer rests on, or focus reaches, the
 *  wrapped element. The text is also wired to it for screen readers. */
export function Tip({ text, children, className = "inline-flex max-w-full" }: { text?: string; children: ReactElement; className?: string }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (!text) return children;

  const show = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - WIDTH - 8));
      // Below the element, or above it when the bottom of the screen is near.
      const above = r.bottom + 90 > window.innerHeight;
      setPos({ top: above ? r.top - 6 : r.bottom + 6, left, above });
    }, DELAY);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setPos(null);
  };
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, { "aria-describedby": id })
    : children;

  return (
    <span ref={ref} className={className} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {child}
      <span id={id} className="sr-only">
        {text}
      </span>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            aria-hidden
            style={{ position: "fixed", top: pos.top, left: pos.left, maxWidth: WIDTH, transform: pos.above ? "translateY(-100%)" : undefined }}
            className="pointer-events-none z-[60] rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-slate-200 shadow-2xl"
          >
            {text}
          </div>,
          document.body,
        )}
    </span>
  );
}

/** The ⓘ beside a label: what the setting is. */
export function InfoTip({ text }: { text: string }) {
  return (
    <Tip text={text}>
      <span
        tabIndex={0}
        role="img"
        aria-label="ⓘ"
        // Inside a <label>, a click would also press the control it labels.
        onClick={(e) => e.preventDefault()}
        className="cursor-help select-none text-[11px] leading-none text-slate-500 outline-none transition-colors hover:text-brand-400 focus-visible:text-brand-400"
      >
        ⓘ
      </span>
    </Tip>
  );
}

