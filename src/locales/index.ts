// Every dictionary at once, for the build (entry-server.tsx, scripts/) and the
// tests. Importing this also hands them to translate() (src/lib/dict.ts). The
// browser bundle must not import it: a page loads only its own language.
import { setDict, type Dict } from "../lib/dict.ts";
import { ENABLED_LANGS, type Lang } from "../lib/langs.ts";
import en from "./en.ts";
import tr from "./tr.ts";
import es from "./es.ts";
import hi from "./hi.ts";
import zh from "./zh.ts";
import fr from "./fr.ts";
import pt from "./pt.ts";
import id from "./id.ts";
import bn from "./bn.ts";

export const DICTS: Record<Lang, Dict> = { en, tr, zh, hi, es, fr, pt, id, bn };

for (const lang of ENABLED_LANGS) setDict(lang, DICTS[lang]);
