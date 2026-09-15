import { useEffect, useState } from "react";
import App from "./App.tsx";
import { LanguageContext, translate, type Lang } from "./lib/i18n";

/** Put on <html> by each entry's inline bootstrap when the prerendered page in
 *  #root is not what this visitor is about to see — they arrived in Turkish, or on
 *  a link carrying its own state. index.css hides #root while it is set; Root lifts
 *  it once the real page is on screen. scripts/test-invariants.ts pins the entries'
 *  copies of this name to this one. */
export const PRERENDER_STALE_CLASS = "prerender-stale";

/** The app with its language context. Shared by the browser entry (main.tsx) and
 *  the build-time prerender (entry-server.tsx), which is why the starting language
 *  is passed in rather than detected here: at build time there is no visitor to
 *  detect, and the build machine's own locale must not leak into the page. */
export default function Root({ initialLang }: { initialLang: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* localStorage unavailable */
    }
  };
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  // The HTML ships lang="en"; keep it in step with what is actually on screen, so
  // screen readers pronounce Turkish as Turkish and CSS uppercase maps i → İ.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Effects run after the commit, so the page React rendered has already replaced
  // the prerendered one by now and it is safe to show.
  useEffect(() => {
    document.documentElement.classList.remove(PRERENDER_STALE_CLASS);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <App />
    </LanguageContext.Provider>
  );
}
