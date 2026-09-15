import { useEffect } from "react";
import App from "./App.tsx";
import { LangSuggest } from "./components/LangSuggest.tsx";
import { LanguageContext, translate, type Lang } from "./lib/i18n";
import { pathFor, rememberLang } from "./lib/langPath";
import { track } from "./lib/analytics";

/** Put on <html> by each entry's inline bootstrap when the prerendered page in
 *  #root is not what this visitor is about to see — a link carrying its own state.
 *  index.css hides #root while it is set; Root lifts it once the real page is on
 *  screen. scripts/test-invariants.ts pins the entries' copies of this name to this one. */
export const PRERENDER_STALE_CLASS = "prerender-stale";

/** The app with its language context. Shared by the browser entry (main.tsx) and
 *  the build-time prerender (entry-server.tsx). The language comes from the URL —
 *  /tr/… is Turkish — so both pass it in rather than detecting it here. */
export default function Root({ lang }: { lang: Lang }) {
  // Switching language is navigating to the other version's address, keeping
  // whatever the page has in its query. The choice is remembered, so the other
  // version is not offered back to them.
  const setLang = (l: Lang) => {
    if (l === lang) return;
    rememberLang(l);
    track("lang-switch", { to: l });
    window.location.assign(pathFor(window.location.pathname, l) + window.location.search + window.location.hash);
  };
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  // Effects run after the commit, so the page React rendered has already replaced
  // the prerendered one by now and it is safe to show.
  useEffect(() => {
    document.documentElement.classList.remove(PRERENDER_STALE_CLASS);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <App />
      <LangSuggest />
    </LanguageContext.Provider>
  );
}
