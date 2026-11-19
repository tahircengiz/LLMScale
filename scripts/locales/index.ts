// Every language's words for the built guides, by language. Enabling a language
// in src/lib/langs.ts fails the type check here until its file exists.

import type { Lang } from "../../src/lib/langs.ts";
import en from "./en.ts";
import tr from "./tr.ts";
import type { PageText } from "./types.ts";

export const PAGE_TEXT: Record<Lang, PageText> = { en, tr };
