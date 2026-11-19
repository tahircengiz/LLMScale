import { useLang } from "../lib/i18n";
import { fixUrl } from "../lib/langPath";

/** Where a visitor's "close" is kept, and the class it puts on <html>. Each
 *  entry's inline bootstrap sets the class before first paint, so a closed notice
 *  does not flash in with the prerendered page; index.css hides the notice under
 *  it. scripts/test-invariants.ts pins the entries, index.css and the static
 *  pages (scripts/appLook.ts) to these names. */
export const AINOTE_KEY = "ainote";
export const AINOTE_OFF_CLASS = "ainote-off";

/** One line above the header on every app page: the data, the calculations and
 *  the translations were made with AI and may be wrong. It stands in for the
 *  "translated with AI" line the footer used to carry, and keeps its link to a
 *  new GitHub issue. The static pages draw the same notice (appNote() in
 *  scripts/appLook.ts).
 *
 *  It is part of the prerendered page, so it shows without JavaScript; the
 *  close button needs a script and is hidden without one (index.css). Closing
 *  only sets the class: the notice stays in the markup, the same for everyone. */
export function AiNote() {
  const { t, lang } = useLang();

  function dismiss() {
    try {
      localStorage.setItem(AINOTE_KEY, "off");
    } catch {
      /* localStorage unavailable: closed for this page view only */
    }
    document.documentElement.classList.add(AINOTE_OFF_CLASS);
    // The button that had focus is gone; carry on from the top of the header.
    document.querySelector<HTMLElement>("header a")?.focus();
  }

  return (
    <aside
      aria-label={t("ainote.label")}
      className="ainote shrink-0 border-b border-white/10 bg-ink-850 px-4 py-1.5 text-xs leading-4 text-slate-400 sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2">
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-4 w-4 shrink-0 text-slate-500">
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 7.25v3.5M8 5.1v.01" />
        </svg>
        <p className="m-0 min-w-0 flex-1">
          {t("ainote.text")}{" "}
          <a
            href={fixUrl(lang, window.location.pathname)}
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap font-medium text-brand-400 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            {t("footer.suggestFix")}
          </a>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("ainote.close")}
          className="-my-1 -me-1.5 shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
