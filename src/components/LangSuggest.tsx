import { useEffect, useState } from "react";
import { useLang, type Lang } from "../lib/i18n";
import { SUGGEST, pathFor, preferredLang, rememberLang } from "../lib/langPath";
import { track } from "../lib/analytics";

/** Offers the other language version to a visitor whose preference differs from
 *  the page's. It never switches for them: the URL decides what a page is in, and
 *  search engines must find each version where its hreflang says it is.
 *
 *  Rendered only after mount — the preference lives in the browser, and the
 *  prerendered page must be the same for everyone. It floats, so appearing late
 *  moves nothing on the page. */
export function LangSuggest() {
  const { lang } = useLang();
  const [offer, setOffer] = useState<Lang | null>(null);

  useEffect(() => {
    const pref = preferredLang();
    setOffer(pref !== lang ? pref : null);
  }, [lang]);

  if (!offer) return null;
  const s = SUGGEST[offer];
  const href = pathFor(window.location.pathname, offer) + window.location.search + window.location.hash;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        lang={offer}
        role="region"
        aria-label={s.text}
        className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-2.5 text-sm text-slate-300 shadow-xl shadow-black/30 backdrop-blur-sm"
      >
        <span>{s.text}</span>
        <a
          href={href}
          hrefLang={offer}
          onClick={() => {
            rememberLang(offer);
            track("lang-suggest", { action: "switch", to: offer });
          }}
          className="rounded-lg bg-brand-600 px-3 py-1 text-sm font-medium text-onbrand no-underline transition hover:bg-brand-500"
        >
          {s.go}
        </a>
        <button
          type="button"
          onClick={() => {
            // Staying is a choice too: remember this page's language so the offer
            // does not follow them to every page.
            rememberLang(lang);
            track("lang-suggest", { action: "dismiss", to: offer });
            setOffer(null);
          }}
          aria-label={s.dismiss}
          className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
