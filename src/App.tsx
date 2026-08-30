import { useState } from "react";
import { useLang, type Lang } from "./lib/i18n";
import { currentPage } from "./lib/pages";
import { SizingPage } from "./pages/SizingPage";
import { FitPage } from "./pages/FitPage";
import { VllmPage } from "./pages/VllmPage";
import { DecodePage } from "./pages/DecodePage";
import { AnatomyPage } from "./pages/AnatomyPage";
import { ComparePage } from "./pages/ComparePage";
import { Sidebar } from "./components/Sidebar";
import { Badge, Segmented } from "./components/ui";

const GITHUB_URL = "https://github.com/tahircengiz/";
const LINKEDIN_URL = "https://tr.linkedin.com/in/tahircengiz";

export default function App() {
  const { t, lang, setLang } = useLang();
  const page = currentPage();
  const [copied, setCopied] = useState(false);
  const [light, setLight] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("light")
  );

  function toggleTheme() {
    setLight((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("light", next);
      try {
        localStorage.setItem("theme", next ? "light" : "dark");
      } catch {
        /* localStorage unavailable */
      }
      return next;
    });
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="h-dvh p-3 sm:p-5">
      <div className="mx-auto flex h-full max-w-[1440px] overflow-hidden rounded-[22px] border border-ink-700 bg-ink-900 shadow-[0_1px_2px_rgba(20,20,30,.05),0_30px_60px_-34px_rgba(20,20,30,.35)]">
        <div className="hidden md:flex">
          <Sidebar page={page} />
        </div>

        <main className="flex min-w-0 flex-1 flex-col bg-ink-850/60">
          <header className="flex flex-wrap items-start gap-3 px-5 pb-4 pt-5 sm:px-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-[25px] font-semibold tracking-tight text-white">
                  {t(`nav.${page}`)}
                </h1>
                <Badge tone="good">{t("header.badge")}</Badge>
              </div>
              {page === "sizing" && (
                <p className="mt-1 max-w-2xl text-[12.5px] text-slate-400">
                  {t("header.subtitle", { ctx: t("header.subtitle.ctx"), users: t("header.subtitle.users") })}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title="Toggle light / dark"
                className="rounded-[9px] border border-ink-700 px-2.5 py-1.5 text-sm transition hover:bg-white/5"
              >
                {light ? "🌙" : "☀️"}
              </button>
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
                className="rounded-[9px] bg-brand-600 px-3 py-1.5 text-[12.5px] font-semibold text-onbrand transition hover:bg-brand-500"
              >
                {copied ? t("header.shareCopied") : t("header.share")}
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
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
            ) : (
              <SizingPage />
            )}

            {page !== "anatomy" && (
              <footer className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-700 pt-4 text-xs text-slate-500">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-brand-400">
                  github.com/tahircengiz
                </a>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="hover:text-brand-400">
                  linkedin.com/tahircengiz
                </a>
                <span className="ml-auto">{t("footer.privacy")}</span>
              </footer>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
