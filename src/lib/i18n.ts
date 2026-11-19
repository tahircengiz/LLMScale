import { createContext, useContext } from "react";
import type { Lang } from "./langs.ts";

// The lookup lives in ./dict.ts and the dictionaries in src/locales/;
// re-exported here so every component keeps importing from "../lib/i18n".
export * from "./dict.ts";

export interface LangCtx {
  lang: Lang;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LangCtx>({
  lang: "en",
  t: (k) => k,
});

export function useLang(): LangCtx {
  return useContext(LanguageContext);
}
