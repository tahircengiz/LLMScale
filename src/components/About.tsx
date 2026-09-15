import { DICTS, useLang } from "../lib/i18n";
import { Card } from "./ui";
import { StaticPageLink } from "./StaticPageLink";
import { CONCEPT_FILES } from "../lib/staticPages";

export type AboutPage = "sizing" | "train" | "fit" | "anatomy" | "compare" | "decode" | "vllm";

/** The concept guides worth reading after each tool (scripts/concepts.ts). */
const DEEPER: Partial<Record<AboutPage, (keyof typeof CONCEPT_FILES)[]>> = {
  sizing: ["kvCache", "attention", "quantization"],
  train: ["quantization"],
  anatomy: ["attention", "kvCache"],
  compare: ["quantization"],
  decode: ["quantization", "attention"],
  vllm: ["kvCache", "quantization"],
};

/** How many numbered keys of one kind a page has — about.<page>.p1, p2, … — so a
 *  page's text can grow or shrink in the dictionary without touching this file.
 *  Counted on English; scripts/test-invariants.ts keeps Turkish in step. */
function numbered(page: AboutPage, kind: "p" | "f" | "q"): number[] {
  const out: number[] = [];
  while (`about.${page}.${kind}${out.length + 1}` in DICTS.en) out.push(out.length + 1);
  return out;
}

/** What a page calculates and assumes, and the questions people search for, as
 *  visible text below the tool. It is written from the engine, not around it:
 *  every figure here is one the code produces or a published result it is tested
 *  against. It also gives search engines something to read — the tool itself is
 *  mostly controls and numbers. */
export function About({ page }: { page: AboutPage }) {
  const { t } = useLang();
  const [first, ...rest] = numbered(page, "p");
  const formulas = numbered(page, "f");
  const questions = numbered(page, "q");
  const id = `about-${page}`;

  return (
    <section aria-labelledby={id} className="mt-8">
      <Card className="p-5 sm:p-6">
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <h2 id={id} className="text-base font-semibold tracking-tight text-white">
              {t(`about.${page}.title`)}
            </h2>
            {first && <p>{t(`about.${page}.p${first}`)}</p>}
            {formulas.length > 0 && (
              <ul className="space-y-1.5 rounded-xl bg-ink-850 p-3 ring-1 ring-white/10">
                {formulas.map((i) => (
                  <li key={i} className="font-mono text-xs leading-relaxed text-slate-300">
                    {t(`about.${page}.f${i}`)}
                  </li>
                ))}
              </ul>
            )}
            {rest.map((i) => (
              <p key={i}>{t(`about.${page}.p${i}`)}</p>
            ))}
          </div>

          {questions.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("about.faq")}</h3>
              <dl className="mt-3 space-y-4">
                {questions.map((i) => (
                  <div key={i}>
                    <dt className="text-sm font-medium text-white">{t(`about.${page}.q${i}`)}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-300">{t(`about.${page}.a${i}`)}</dd>
                  </div>
                ))}
              </dl>
              {(DEEPER[page] ?? []).length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("about.deeper")}</h3>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {(DEEPER[page] ?? []).map((k) => (
                      <li key={k}>
                        <StaticPageLink file={CONCEPT_FILES[k]}>{t(`concept.${k}`)}</StaticPageLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
