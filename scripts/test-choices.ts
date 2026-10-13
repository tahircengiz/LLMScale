// The option lists every setting picks from (src/lib/choices.ts). Run: node scripts/test-choices.ts
//
// Every option has to say what it means in both languages, with no placeholder
// left unfilled and no key missing; the values have to climb so a menu reads in
// order; and the hints worked out from a value have to say the right thing.

import { DICTS, translate, type Lang } from "../src/lib/dict.ts";
import {
  batchChoices, contextChoices, gpuCountChoices, gpuHint, outputChoices, prefixChoices, promptChoices,
  rankChoices, rpsChoices, seqChoices, tpotChoices, ttftChoices, userChoices, utilChoices, type Opt,
} from "../src/lib/choices.ts";
import { GPUS } from "../src/lib/gpus.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

for (const lang of ["en", "tr"] as Lang[]) {
  const t = (k: string, v?: Record<string, string | number>) => translate(lang, k, v);
  const lists: [string, Opt[]][] = [
    ["context", contextChoices(t, lang)],
    ["context, model max 40,960", contextChoices(t, lang, 40960)],
    ["users", userChoices(t, lang)],
    ["util", utilChoices(t)],
    ["gpu count", gpuCountChoices(t)],
    ["prompt", promptChoices(t, lang)],
    ["output", outputChoices(t, lang)],
    ["prefix", prefixChoices(t, lang)],
    ["rps", rpsChoices(t, lang)],
    ["ttft", ttftChoices(t, lang)],
    ["tpot", tpotChoices(t, lang)],
    ["rank", rankChoices(t)],
    ["batch", batchChoices(t)],
    ["seq", seqChoices(t, lang)],
  ];
  console.log(`--- ${lang} ---`);
  for (const [name, opts] of lists) {
    const bad = opts.filter((o) => !o.hint || /\{\w+\}/.test(o.hint) || /\b(choice|info|hint)\.[a-z]/.test(o.hint) || !o.label);
    check(`${name}: every option explained`, opts.length > 2 && bad.length === 0, bad.map((o) => `${o.value}: ${o.hint}`).join(" | "));
    check(`${name}: values climb`, opts.every((o, i) => i === 0 || o.value > opts[i - 1].value));
    check(`${name}: labels are distinct`, new Set(opts.map((o) => o.label)).size === opts.length);
  }
  for (const key of Object.keys(DICTS.en).filter((k) => /^(info|hint|adv|vllm\.prioHint|vllm\.taskHint|train\.targetHint)\./.test(k)))
    if (!(key in DICTS[lang])) check(`${key} exists in ${lang}`, false);
  const gpuBad = GPUS.filter((g) => !gpuHint(t, g, lang) || /\{\w+\}/.test(gpuHint(t, g, lang)));
  check("every device describes itself", gpuBad.length === 0, gpuBad.map((g) => g.id).join(", "));
}

console.log("--- the worked-out hints ---");
{
  const t = (k: string, v?: Record<string, string | number>) => translate("en", k, v);
  const ctx = contextChoices(t, "en", 40960);
  check("a model's maximum is offered and named", ctx[ctx.length - 1].value === 40960 && /maximum/.test(ctx[ctx.length - 1].hint));
  check("…and nothing longer", ctx.every((o) => o.value <= 40960));
  check("8k tokens is about 6,100 words, 12 pages", /6,100 words, about 12 pages/.test(contextChoices(t, "en").find((o) => o.value === 8192)!.hint));
  check("40 ms a token is 25 tokens a second, about 1,130 words a minute", /25 tokens a second per user, about 1,130 words/.test(tpotChoices(t, "en").find((o) => o.value === 40)!.hint));
  check("10 requests a second is 600 a minute", /600 requests a minute, 864,000 a day/.test(rpsChoices(t, "en").find((o) => o.value === 10)!.hint));
  check("vLLM's default share is marked", utilChoices(t).find((o) => o.value === 0.92)!.label.includes("vLLM default"));
  check("an H100 shows its memory, bandwidth and TFLOPS", gpuHint(t, GPUS.find((g) => g.id === "h100-80")!, "en") === "80 GB · 3,350 GB/s · 990 TFLOPS BF16");
  const tr = (k: string, v?: Record<string, string | number>) => translate("tr", k, v);
  check("Turkish groups thousands with a dot", /6\.100 kelime/.test(contextChoices(tr, "tr").find((o) => o.value === 8192)!.hint));
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
