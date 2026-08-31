import { useEffect, useState } from "react";
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
import { Badge, Segmented } from "./components/ui";

// Footer links.
const GITHUB_URL = "https://github.com/tahircengiz/";
const LINKEDIN_URL = "https://tr.linkedin.com/in/tahircengiz";

function currentPage(): "fit" | "sizing" | "vllm" | "decode" | "anatomy" | "compare" | "train" {
  const p = window.location.pathname;
  if (p.endsWith("fit.html")) return "fit";
  if (p.endsWith("vllm.html")) return "vllm";
  if (p.endsWith("decode.html")) return "decode";
  if (p.endsWith("anatomy.html")) return "anatomy";
  if (p.endsWith("compare.html")) return "compare";
  if (p.endsWith("train.html")) return "train";
  return "sizing";
}

/** Grouped so the header reads as four intents rather than eight links. */
const NAV_GROUPS: { page: string; href: string }[][] = [
  [
    { page: "sizing", href: "" },
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
  // Each entry's inline bootstrap has already put the theme class on <html> before
  // React ran, so read it back instead of deciding the default a second time here.
  // Dark alone leaves no class: it is the :root baseline the tokens are defined on.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return preferredTheme();
    const c = document.documentElement.classList;
    return c.contains("glass") ? "glass" : c.contains("light") ? "light" : "dark";
  });
  const base = import.meta.env.BASE_URL;

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
            <a href={base} className="flex items-center gap-2 no-underline">
              <img src={`${base}favicon.svg`} alt="" className="h-7 w-7" />
              <span className="text-lg font-bold tracking-tight text-white">LLMScale</span>
              <Badge tone="good">{t("header.badge")}</Badge>
            </a>
            <div className="flex items-center gap-2">
              <Segmented<Theme>
                value={theme}
                onChange={applyTheme}
                size="sm"
                options={THEMES.map((v) => ({ value: v, label: t(`theme.${v}`) }))}
              />
              <Segmented<Lang>
                value={lang}
                onChange={setLang}
                size="sm"
                options={[
                  { value: "en", label: "EN" },
                  { value: "tr", label: "TR" },
                ]}
              />
              <button
                type="button"
                onClick={share}
                className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-onbrand shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
              >
                {copied ? t("header.shareCopied") : t("header.share")}
              </button>
            </div>
          </div>
          {/* Eight destinations is too many to read as one run, so they sit in
              four groups — plan the memory, choose the model, serve it, learn
              how it works — divided by a hairline and centred under the brand. */}
          <nav className="mt-2 flex justify-center">
            <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 overflow-x-auto rounded-xl bg-ink-850 p-1 ring-1 ring-white/10">
              {NAV_GROUPS.map((group, gi) => (
                <div key={gi} className="flex items-center gap-1">
                  {gi > 0 && <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/15" />}
                  {group.map((item) => (
                    <a
                      key={item.page}
                      href={`${base}${item.href}`}
                      className={tabCls(page === item.page)}
                    >
                      {t(`nav.${item.page}`)}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
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
          ) : (
            <SizingPage />
          )}

          {!isFit && <Footer githubUrl={GITHUB_URL} linkedinUrl={LINKEDIN_URL} />}
        </div>
      </main>
    </div>
  );
}

function Footer({ githubUrl, linkedinUrl }: { githubUrl: string; linkedinUrl: string }) {
  const { t } = useLang();
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
      <div className="flex gap-4 text-slate-400">
        <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-brand-400">
          github.com/tahircengiz
        </a>
        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-brand-400">
          linkedin.com/tahircengiz
        </a>
      </div>
      <p className="text-xs text-slate-500">{t("footer.privacy")}</p>
    </footer>
  );
}
