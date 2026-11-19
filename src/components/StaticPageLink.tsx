import type { ReactNode } from "react";
import { useLang } from "../lib/i18n";
import { langHome } from "../lib/langPath";

/** A link to one of the static guides scripts/genPages.ts builds, in the language
 *  of the page it sits on. */
export function StaticPageLink({ file, children }: { file: string; children: ReactNode }) {
  const { lang } = useLang();
  return (
    <a
      href={`${langHome(import.meta.env.BASE_URL, lang)}${file}`}
      className="text-xs font-medium text-brand-400 hover:underline"
    >
      {children}
    </a>
  );
}
