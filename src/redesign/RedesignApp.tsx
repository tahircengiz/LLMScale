import { useState } from "react";
import { useLang, type Lang } from "../lib/i18n";
import { Badge, Segmented } from "../components/ui";
import { RedesignSizingPage } from "./RedesignSizingPage";

const GITHUB_URL = "https://github.com/tahircengiz/";
const LINKEDIN_URL = "https://tr.linkedin.com/in/tahircengiz";

export default function RedesignApp() {
  const { t, lang, setLang } = useLang();
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

  const nav = [
    { href: `${base}redesign.html`, label: t("nav.sizing"), active: true },
    { href: `${base}fit.html`, label: t("nav.fit") },
    { href: `${base}vllm.html`, label: t("nav.vllm") },
    { href: `${base}decode.html`, label: t("nav.decode") },
    { href: `${base}anatomy.html`, label: t("nav.anatomy") },
    { href: `${base}compare.html`, label: t("nav.compare") },
    { href: `${base}learn.html`, label: t("nav.learn") },
  ];

  const navCls = (active?: boolean) =>
    "rounded-lg px-3 py-2 text-sm no-underline transition whitespace-nowrap " +
    (active ? "bg-ink-850 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200");

  const langOpts = [
    { value: "en" as Lang, label: "EN" },
    { value: "tr" as Lang, label: "TR" },
  ];

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-white/10 md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <img src={`${base}favicon.svg`} alt="" className="h-6 w-6" />
          <span className="text-base font-semibold tracking-tight text-white">LLMScale</span>
          <Badge tone="good">{t("header.badge")}</Badge>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-col md:overflow-visible md:pb-0">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className={navCls(n.active)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-3 border-t border-white/10 px-5 py-4 md:flex">
          <Segmented<Lang> value={lang} onChange={setLang} size="sm" options={langOpts} />
          <button
            type="button"
            onClick={share}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-onbrand transition hover:bg-brand-500"
          >
            {copied ? t("header.shareCopied") : t("header.share")}
          </button>
          <div className="flex flex-col gap-1 text-xs text-slate-500">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white">github.com/tahircengiz</a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="hover:text-white">linkedin.com/tahircengiz</a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
          <div className="mb-7 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">{t("nav.sizing")}</h1>
              <p className="mt-1 max-w-xl text-sm text-slate-400">
                {t("header.subtitle", { ctx: t("header.subtitle.ctx"), users: t("header.subtitle.users") })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <Segmented<Lang> value={lang} onChange={setLang} size="sm" options={langOpts} />
            </div>
          </div>
          <RedesignSizingPage />
        </div>
      </main>
    </div>
  );
}
