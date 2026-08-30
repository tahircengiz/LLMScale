import { createContext, useContext } from "react";
import type { Lang } from "./dict.ts";

// The dictionaries and the pure lookup live in ./dict.ts; re-exported here
// so every component keeps importing from "../lib/i18n".
export * from "./dict.ts";

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function useLang(): LangCtx {
  return useContext(LanguageContext);
}
