import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";
import { ENABLED_LANGS, LANG_META } from "../lib/langs";
import { pathFor, rememberLang } from "../lib/langPath";
import { track } from "../lib/analytics";

/** A globe: the language menu's mark, since no flag stands for a language. */
export function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5M8 1.75c1.7 1.75 2.55 3.83 2.55 6.25S9.7 12.5 8 14.25M8 1.75C6.3 3.5 5.45 5.58 5.45 8S6.3 12.5 8 14.25" />
    </svg>
  );
}

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

/** The header's language switch: a button naming the page's language in its
 *  own words, and a list of this page in every language the site is in. Each
 *  entry is a plain link with hreflang, and the list is in the DOM from the first
 *  render — the prerendered page carries it, so crawlers follow it — only hidden
 *  until the button opens it. Following one is the switch; it is remembered, so
 *  that version is not offered back (LangSuggest). */
export function LangMenu() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // A click anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Back from the next page through the back/forward cache, it comes back closed.
  useEffect(() => {
    const close = (e: PageTransitionEvent) => {
      if (e.persisted) setOpen(false);
    };
    window.addEventListener("pageshow", close);
    return () => window.removeEventListener("pageshow", close);
  }, []);

  const here = LANG_META[lang];
  // The query and hash carry what the page is showing, so they travel along.
  const tail = window.location.search + window.location.hash;

  return (
    <div
      ref={box}
      className="relative shrink-0"
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        setOpen(false);
        button.current?.focus();
      }}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className="flex rounded-xl bg-ink-850 p-1 ring-1 ring-white/10">
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls="lang-menu"
          aria-label={`${t("lang.label")}: ${here.name}`}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowDown") return;
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => document.querySelector<HTMLElement>("#lang-menu a")?.focus());
          }}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5 max-[360px]:px-1.5"
        >
          <GlobeIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{here.name}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={"h-3 w-3 shrink-0 transition-transform duration-200 " + (open ? "rotate-180" : "")}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>
      {/* pt-2 is a transparent bridge, as in the nav's panels. */}
      <div id="lang-menu" className={(open ? "block" : "hidden") + " absolute end-0 top-full z-50 min-w-[10rem] pt-2"}>
        <ul className="rounded-xl bg-ink-850 p-1.5 shadow-2xl ring-1 ring-white/10">
          {ENABLED_LANGS.map((l) => {
            const m = LANG_META[l];
            const on = l === lang;
            return (
              <li key={l}>
                <a
                  href={pathFor(window.location.pathname, l) + tail}
                  hrefLang={m.hreflang}
                  lang={m.hreflang}
                  dir={m.dir}
                  aria-current={on ? "page" : undefined}
                  onClick={() => {
                    setOpen(false);
                    if (on) return;
                    rememberLang(l);
                    track("lang-switch", { to: l });
                  }}
                  className={
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm font-medium no-underline outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 " +
                    (on ? "bg-brand-600 text-onbrand shadow" : "text-white hover:bg-white/5")
                  }
                >
                  <span>{m.name}</span>
                  {on && <Check />}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
