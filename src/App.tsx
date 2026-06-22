import { useState } from "react";
import { useLang, type Lang } from "./lib/i18n";
import { SizingPage } from "./pages/SizingPage";
import { FitPage } from "./pages/FitPage";
import { VllmPage } from "./pages/VllmPage";
import { Badge, Segmented } from "./components/ui";

// Footer links.
const GITHUB_URL = "https://github.com/tahircengiz/";
const LINKEDIN_URL = "https://tr.linkedin.com/in/tahircengiz";

function currentPage(): "fit" | "sizing" | "vllm" {
  const p = window.location.pathname;
  if (p.endsWith("fit.html")) return "fit";
  if (p.endsWith("vllm.html")) return "vllm";
  return "sizing";
}

export default function App() {
  const { t, lang, setLang } = useLang();
  const page = currentPage();
  const [copied, setCopied] = useState(false);
  const [light, setLight] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("light")
  );
  const base = import.meta.env.BASE_URL;

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

  const tabCls = (active: boolean) =>
    "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
    (active ? "bg-brand-600 text-onbrand shadow" : "text-slate-300 hover:bg-white/5");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a href={base} className="flex items-center gap-2 no-underline">
            <img src={`${base}favicon.svg`} alt="" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-white">LLMScale</span>
            <Badge tone="good">{t("header.badge")}</Badge>
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle light / dark"
              className="rounded-xl bg-ink-850 px-3 py-2 text-sm ring-1 ring-white/10 transition hover:bg-white/5"
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
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-onbrand shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
            >
              {copied ? t("header.shareCopied") : t("header.share")}
            </button>
          </div>
        </div>
        <nav className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-ink-850 p-1 ring-1 ring-white/10">
          <a href={base} className={tabCls(page === "sizing")}>
            {t("nav.sizing")}
          </a>
          <a href={`${base}fit.html`} className={tabCls(page === "fit")}>
            {t("nav.fit")}
          </a>
          <a href={`${base}vllm.html`} className={tabCls(page === "vllm")}>
            {t("nav.vllm")}
          </a>
        </nav>
      </header>

      {page === "vllm" ? <VllmPage /> : page === "fit" ? <FitPage /> : <SizingPage />}

      <Footer githubUrl={GITHUB_URL} linkedinUrl={LINKEDIN_URL} />
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
