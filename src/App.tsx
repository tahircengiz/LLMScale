import { useState } from "react";
import { useLang, type Lang } from "./lib/i18n";
import { SizingPage } from "./pages/SizingPage";
import { FitPage } from "./pages/FitPage";
import { Badge, Segmented } from "./components/ui";

// Footer links.
const GITHUB_URL = "https://github.com/tahircengiz/";
const LINKEDIN_URL = "https://tr.linkedin.com/in/tahircengiz";

function currentPage(): "fit" | "sizing" {
  return window.location.pathname.endsWith("fit.html") ? "fit" : "sizing";
}

export default function App() {
  const { t, lang, setLang } = useLang();
  const page = currentPage();
  const [copied, setCopied] = useState(false);
  const base = import.meta.env.BASE_URL;

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
    (active ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:bg-white/5");

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
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
            >
              {copied ? t("header.shareCopied") : t("header.share")}
            </button>
          </div>
        </div>
        <nav className="mt-4 inline-flex gap-1 rounded-xl bg-ink-850 p-1 ring-1 ring-white/10">
          <a href={base} className={tabCls(page === "sizing")}>
            {t("nav.sizing")}
          </a>
          <a href={`${base}fit.html`} className={tabCls(page === "fit")}>
            {t("nav.fit")}
          </a>
        </nav>
      </header>

      {page === "fit" ? <FitPage /> : <SizingPage />}

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
