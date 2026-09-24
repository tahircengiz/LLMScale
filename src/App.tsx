import { useEffect, useRef, useState } from "react";
import {
  DARK_QUERY,
  SWITCHING_CLASS,
  THEMES,
  preferredTheme,
  themeOnSystemChange,
  type Theme,
} from "./lib/theme";
import { useLang, type Lang } from "./lib/i18n";
import { SizingPage } from "./pages/SizingPage";
import { FitPage } from "./pages/FitPage";
import { VllmPage } from "./pages/VllmPage";
import { DecodePage } from "./pages/DecodePage";
import { AnatomyPage } from "./pages/AnatomyPage";
import { ComparePage } from "./pages/ComparePage";
import { TrainPage } from "./pages/TrainPage";
import { ConfigPage } from "./pages/ConfigPage";
import { Badge, Segmented } from "./components/ui";
import { About } from "./components/About";
import { LANG_NAME, pathFor } from "./lib/langPath";
import { CONCEPTS_HUB, GPUS_HUB, MODELS_HUB } from "./lib/staticPages";
import { StaticPageLink } from "./components/StaticPageLink";

// Footer links.
const GITHUB_URL = "https://github.com/tahircengiz/LLMScale";
const LINKEDIN_URL = "https://tr.linkedin.com/in/tahircengiz";

function currentPage(): "fit" | "sizing" | "vllm" | "decode" | "anatomy" | "compare" | "train" | "config" {
  const p = window.location.pathname;
  if (p.endsWith("fit.html")) return "fit";
  if (p.endsWith("vllm.html")) return "vllm";
  if (p.endsWith("decode.html")) return "decode";
  if (p.endsWith("anatomy.html")) return "anatomy";
  if (p.endsWith("compare.html")) return "compare";
  if (p.endsWith("train.html")) return "train";
  if (p.endsWith("config.html")) return "config";
  return "sizing";
}

/** Grouped so the header reads as four intents rather than nine links. */
const NAV_GROUPS: { page: string; href: string }[][] = [
  [
    { page: "sizing", href: "" },
    { page: "config", href: "config.html" },
    { page: "train", href: "train.html" },
  ],
  [
    { page: "fit", href: "fit.html" },
    { page: "anatomy", href: "anatomy.html" },
    { page: "compare", href: "compare.html" },
    { page: "decode", href: "decode.html" },
  ],
  [{ page: "vllm", href: "vllm.html" }],
  [{ page: "learn", href: "learn.html" }],
];

export default function App() {
  const { t, lang, setLang } = useLang();
  const page = currentPage();
  const [copied, setCopied] = useState(false);
  // Below sm the nav folds to the current page and a Menu button (see the <nav>).
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  // A page restored from the back/forward cache comes back with the menu the
  // visitor left through still open; greet them with the page instead.
  useEffect(() => {
    const close = (e: PageTransitionEvent) => {
      if (e.persisted) setMenuOpen(false);
    };
    window.addEventListener("pageshow", close);
    return () => window.removeEventListener("pageshow", close);
  }, []);
  // From sm up, a group the pill wraps onto a new row would lead with a hairline
  // that divides nothing. Mark row-starting groups so theirs can go invisible —
  // invisible, not removed, so the freed width cannot pull the group back up.
  const navList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = navList.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const groups = [...list.children] as HTMLElement[];
    const mark = () => {
      let top = NaN;
      for (const g of groups) {
        g.toggleAttribute("data-row-start", g.offsetTop !== top);
        top = g.offsetTop;
      }
    };
    const ro = new ResizeObserver(mark);
    ro.observe(list);
    groups.forEach((g) => ro.observe(g));
    return () => ro.disconnect();
  }, []);
  // Each entry's inline bootstrap has already put the theme class on <html> before
  // React ran, so read it back instead of deciding the default a second time here.
  // Dark alone leaves no class: it is the :root baseline the tokens are defined on.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return preferredTheme();
    const c = document.documentElement.classList;
    return c.contains("glass") ? "glass" : c.contains("light") ? "light" : "dark";
  });
  const base = import.meta.env.BASE_URL;
  // Links stay in the language the page is in: /tr/ pages link to /tr/ pages.
  const home = base + (lang === "tr" ? "tr/" : "");

  function showTheme(next: Theme) {
    setTheme(next);
    const root = document.documentElement;
    root.classList.add(SWITCHING_CLASS);
    root.classList.toggle("light", next === "light");
    root.classList.toggle("glass", next === "glass");
    // Reading a computed style forces the new colours to be resolved while
    // transitions are still off, so re-enabling them below animates nothing.
    void getComputedStyle(root).transitionProperty;
    root.classList.remove(SWITCHING_CLASS);
  }

  /** Picking a theme records it, which is also what stops the OS being followed. */
  function applyTheme(next: Theme) {
    showTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage unavailable */
    }
  }

  // Until the visitor picks one, keep following their OS: someone who flips their
  // machine to dark at sunset expects an open tab to come with them. A stored
  // choice outranks this, so the listener no-ops from the moment they choose.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(DARK_QUERY);
    const follow = (e: MediaQueryListEvent) => {
      let chosen: string | null = null;
      try {
        chosen = localStorage.getItem("theme");
      } catch {
        /* localStorage unavailable */
      }
      const next = themeOnSystemChange(chosen, e.matches);
      if (next) showTheme(next);
    };
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, []);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  const tabCls = (active: boolean) =>
    "rounded-lg px-2.5 py-1 text-sm font-medium transition whitespace-nowrap " +
    (active ? "bg-brand-600 text-onbrand shadow" : "text-slate-300 hover:bg-white/5");

  // "Fit" pages fill exactly one viewport (dashboard, no page scroll); other
  // pages keep the classic scrolling document inside the content area.
  const isFit = page === "anatomy";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-white/10 px-4 py-2 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href={home} className="flex items-center gap-2 no-underline">
              <img src={`${base}favicon.svg`} alt="" className="h-7 w-7" />
              <span className="text-lg font-bold tracking-tight text-white">LLMScale</span>
              <Badge tone="good">{t("header.badge")}</Badge>
            </a>
            {/* On a phone the controls drop below the brand and have to hold one
                line: the groups keep their natural width, Share shortens below
                sm, and gap and padding trim below 360px. The wrap is only a
                safety net — a wider system font drops Share whole onto the next
                line rather than pushing the row off-screen. */}
            <div className="flex flex-wrap items-center gap-2 max-[360px]:gap-1.5">
              <Segmented<Theme>
                value={theme}
                onChange={applyTheme}
                size="sm"
                nowrap
                options={THEMES.map((v) => ({ value: v, label: t(`theme.${v}`) }))}
              />
              <Segmented<Lang>
                value={lang}
                onChange={setLang}
                size="sm"
                nowrap
                options={[
                  { value: "en", label: "EN" },
                  { value: "tr", label: "TR" },
                ]}
              />
              {/* Both labels sit in one grid cell and the idle one only turns
                  invisible, so the button keeps its width while it confirms the
                  copy and nothing beside it moves. A phone has no room for the
                  words, so it shows the tick and leaves them to screen readers. */}
              <button
                type="button"
                onClick={share}
                className="grid shrink-0 whitespace-nowrap rounded-xl bg-brand-600 px-3 py-1.5 text-center text-sm font-medium text-onbrand shadow-lg shadow-brand-600/30 transition hover:bg-brand-500 max-[360px]:px-2.5"
              >
                <span className={"col-start-1 row-start-1" + (copied ? " invisible" : "")}>
                  <span className="sm:hidden">{t("header.shareShort")}</span>
                  <span className="max-sm:hidden">{t("header.share")}</span>
                </span>
                <span className={"col-start-1 row-start-1" + (copied ? "" : " invisible")}>
                  <span aria-hidden="true" className="sm:hidden">✓</span>
                  <span className="max-sm:sr-only">{t("header.shareCopied")}</span>
                </span>
              </button>
            </div>
          </div>
          {/* Nine destinations is too many to read as one run, so they sit in
              four groups — plan the memory, choose the model, serve it, learn
              how it works — divided by a hairline and centred under the brand.
              From sm up the pill wraps whole groups onto rows. Below sm a single
              group is wider than the screen, so the pill folds to the current
              page and a Menu button; opened, each group takes rows of its own
              and the hairlines turn horizontal. Nothing scrolls sideways. */}
          <nav
            className="mt-2 flex justify-center"
            onKeyDown={(e) => {
              if (e.key === "Escape" && menuOpen) {
                setMenuOpen(false);
                menuButton.current?.focus();
              }
            }}
          >
            <div className="w-full rounded-xl bg-ink-850 p-1 ring-1 ring-white/10 sm:w-auto sm:max-w-full">
              <div className="flex items-center justify-between gap-2 sm:hidden">
                <span className={tabCls(true)}>{t(`nav.${page}`)}</span>
                <button
                  ref={menuButton}
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-controls="site-nav"
                  className={tabCls(false) + " flex items-center gap-1.5"}
                >
                  {t("nav.menu")}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={"h-3.5 w-3.5 transition-transform " + (menuOpen ? "rotate-180" : "")}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
              </div>
              <div
                id="site-nav"
                ref={navList}
                className={
                  (menuOpen ? "flex" : "hidden") +
                  " mt-1 flex-col gap-1 sm:mt-0 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
                }
              >
                {NAV_GROUPS.map((group, gi) => (
                  <div key={gi} className="group flex flex-wrap items-center gap-1">
                    <span
                      aria-hidden="true"
                      className={
                        "h-px basis-full bg-white/15 sm:mx-1 sm:h-4 sm:w-px sm:basis-auto sm:group-data-[row-start]:invisible" +
                        (gi === 0 ? " sm:hidden" : "")
                      }
                    />
                    {group.map((item) => (
                      <a
                        key={item.page}
                        href={`${home}${item.href}`}
                        aria-current={page === item.page ? "page" : undefined}
                        className={tabCls(page === item.page)}
                      >
                        {t(`nav.${item.page}`)}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {/* Every page needs one h1 naming what it is. The design has no room for a
            visible one — the surfaces open straight into their first card — but a
            document without a top-level heading is a gap for a screen reader as
            much as for a crawler, and there were none on any of the eight. */}
        <h1 className="sr-only">{t(`h1.${page}`)}</h1>
        <div className={"mx-auto max-w-6xl px-4 sm:px-6 " + (isFit ? "flex h-full flex-col py-3" : "py-6")}>
          {page === "vllm" ? (
            <VllmPage />
          ) : page === "fit" ? (
            <FitPage />
          ) : page === "decode" ? (
            <DecodePage />
          ) : page === "anatomy" ? (
            <AnatomyPage />
          ) : page === "compare" ? (
            <ComparePage />
          ) : page === "train" ? (
            <TrainPage />
          ) : page === "config" ? (
            <ConfigPage />
          ) : (
            <SizingPage />
          )}

          {!isFit && <About page={page} />}
          {!isFit && <Footer githubUrl={GITHUB_URL} linkedinUrl={LINKEDIN_URL} />}
        </div>
        {/* Anatomy fills the first screen as a dashboard, so its explainer sits
            below the fold instead of squeezing the panels. */}
        {isFit && (
          <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
            <About page={page} />
          </div>
        )}
      </main>
    </div>
  );
}

function Footer({ githubUrl, linkedinUrl }: { githubUrl: string; linkedinUrl: string }) {
  const { t, lang } = useLang();
  const other: Lang = lang === "tr" ? "en" : "tr";
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-400">
        <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-brand-400">
          github.com/tahircengiz/LLMScale
        </a>
        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-brand-400">
          linkedin.com/tahircengiz
        </a>
        {/* A plain link to this page in the other language, so the two versions
            link to each other in the HTML itself, not only through hreflang. */}
        <a href={pathFor(window.location.pathname, other)} hrefLang={other} lang={other} className="hover:text-brand-400">
          {LANG_NAME[other]}
        </a>
      </div>
      <nav aria-label={t("footer.guides")} className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <StaticPageLink file={MODELS_HUB}>{t("footer.models")}</StaticPageLink>
        <StaticPageLink file={GPUS_HUB}>{t("footer.gpus")}</StaticPageLink>
        <StaticPageLink file={CONCEPTS_HUB}>{t("footer.concepts")}</StaticPageLink>
      </nav>
      <p className="text-xs text-slate-500">{t("footer.privacy")}</p>
    </footer>
  );
}
