import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";
import { menuOf, NAV_HOME, navMenus, navPages, type NavItem, type NavMenu } from "../lib/nav";

const MENUS = navMenus(__HAS_FEED__);

const tabCls = (active: boolean) =>
  "rounded-lg px-2.5 py-1 text-sm font-medium transition whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-brand-500 " +
  (active ? "bg-brand-600 text-onbrand shadow" : "text-slate-300 hover:bg-white/5");

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"h-3.5 w-3.5 shrink-0 transition-transform duration-200 " + (open ? "rotate-180" : "")}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

/** The header nav. From sm up: the calculator as a direct link, then three menus
 *  by intent, the current page's menu solid indigo and naming the page. Below sm:
 *  the current page and a Menu button that lists everything. Every link is in the
 *  DOM from the first render, so the prerendered page carries the whole site map. */
export function SiteNav({ page }: { page: string }) {
  const { t, lang } = useLang();
  const home = import.meta.env.BASE_URL + (lang === "tr" ? "tr/" : "");
  const [open, setOpen] = useState<NavMenu["id"] | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const phoneButton = useRef<HTMLButtonElement>(null);
  const current = menuOf(MENUS, page);
  const currentItem = navPages(MENUS).find((i) => i.page === page);

  // A click anywhere else closes the open menu.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!row.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // A page restored from the back/forward cache comes back with the menu the
  // visitor left through still open; greet them with the page instead.
  useEffect(() => {
    const close = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setOpen(null);
        setPhoneOpen(false);
      }
    };
    window.addEventListener("pageshow", close);
    return () => window.removeEventListener("pageshow", close);
  }, []);

  const href = (i: NavItem) => `${home}${i.file}`;

  return (
    <nav
      aria-label="LLMScale"
      className="mt-2 flex justify-center"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        if (open) {
          const id = open;
          setOpen(null);
          document.getElementById(`nav-trigger-${id}`)?.focus();
        } else if (phoneOpen) {
          setPhoneOpen(false);
          phoneButton.current?.focus();
        }
      }}
    >
      <div className="w-full rounded-xl bg-ink-850 p-1 ring-1 ring-white/10 sm:w-auto">
        {/* ── from sm up: one row ── */}
        <div ref={row} className="nav-row hidden items-center gap-1 sm:flex">
          <a href={href(NAV_HOME)} aria-current={page === NAV_HOME.page ? "page" : undefined} className={tabCls(page === NAV_HOME.page)}>
            {t(NAV_HOME.label)}
          </a>
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/15" />
          {MENUS.map((m, mi) => {
            const here = current?.id === m.id;
            const isOpen = open === m.id;
            return (
              <div
                key={m.id}
                className="relative"
                onBlur={(e) => {
                  if (isOpen && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null);
                }}
              >
                <button
                  id={`nav-trigger-${m.id}`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`nav-menu-${m.id}`}
                  onClick={() => setOpen(isOpen ? null : m.id)}
                  className={tabCls(here) + " flex items-center gap-1.5"}
                >
                  {here && currentItem ? (
                    <>
                      <span className="text-onbrand/75">{t(m.label)}</span>
                      <span aria-hidden="true" className="text-onbrand/50">
                        ·
                      </span>
                      <span>{t(currentItem.label)}</span>
                    </>
                  ) : (
                    t(m.label)
                  )}
                  <Chevron open={isOpen} />
                </button>
                <div
                  id={`nav-menu-${m.id}`}
                  className={
                    (isOpen ? "block" : "hidden") +
                    " nav-panel absolute top-full z-50 mt-2 w-72 rounded-xl bg-ink-850 p-1.5 shadow-2xl ring-1 ring-white/10 " +
                    // The last menu opens leftwards so it never runs off a narrow window.
                    (mi === MENUS.length - 1 ? "right-0" : "left-0")
                  }
                >
                  {m.sections.map((s, si) => (
                    <div key={si} className={si > 0 ? "mt-1.5 border-t border-white/10 pt-1.5" : undefined}>
                      {s.title && <p className="px-3 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{t(s.title)}</p>}
                      {s.items.map((i) => {
                        const on = i.page !== undefined && i.page === page;
                        return (
                          <a
                            key={i.file || "home"}
                            href={href(i)}
                            aria-current={on ? "page" : undefined}
                            onClick={() => setOpen(null)}
                            className={
                              "block rounded-lg px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500 " +
                              (on ? "bg-brand-600/10 ring-1 ring-inset ring-brand-500" : "hover:bg-white/5")
                            }
                          >
                            <span className="block text-sm font-medium text-white">{t(i.label)}</span>
                            {i.desc && <span className="mt-0.5 block text-xs leading-snug text-slate-400">{t(i.desc)}</span>}
                          </a>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── below sm: the current page and a Menu button ── */}
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <span className={tabCls(true)}>{t(currentItem?.label ?? NAV_HOME.label)}</span>
          <button
            ref={phoneButton}
            type="button"
            onClick={() => setPhoneOpen((o) => !o)}
            aria-expanded={phoneOpen}
            aria-controls="site-nav"
            className={tabCls(false) + " flex items-center gap-1.5"}
          >
            {t("nav.menu")}
            <Chevron open={phoneOpen} />
          </button>
        </div>
        <div id="site-nav" className={(phoneOpen ? "flex" : "hidden") + " mt-1 flex-col gap-2 sm:hidden"}>
          <div className="flex flex-wrap gap-1">
            <a href={href(NAV_HOME)} aria-current={page === NAV_HOME.page ? "page" : undefined} className={tabCls(page === NAV_HOME.page)}>
              {t(NAV_HOME.label)}
            </a>
          </div>
          {MENUS.map((m) => (
            <div key={m.id} className="border-t border-white/10 pt-2">
              <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{t(m.label)}</p>
              <div className="flex flex-wrap gap-1">
                {m.sections.flatMap((s) => s.items).map((i) => (
                  <a key={i.file || "home"} href={href(i)} aria-current={i.page === page ? "page" : undefined} className={tabCls(i.page === page)}>
                    {t(i.label)}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
