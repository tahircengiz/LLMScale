// Every language's words for the built guides, by language. Enabling a language
// in src/lib/langs.ts fails the type check here until its file exists.

import type { Lang } from "../../src/lib/langs.ts";
import en from "./en.ts";
import tr from "./tr.ts";
import es from "./es.ts";
import hi from "./hi.ts";
import zh from "./zh.ts";
import fr from "./fr.ts";
import pt from "./pt.ts";
import id from "./id.ts";
import bn from "./bn.ts";
import ru from "./ru.ts";
import de from "./de.ts";
import ja from "./ja.ts";
import type { PageText } from "./types.ts";

export const PAGE_TEXT: Record<Lang, PageText> = { en, tr, zh, hi, es, fr, pt, id, bn, ru, de, ja };
