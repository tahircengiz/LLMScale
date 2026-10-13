// The sensible values each setting offers, and what each one means. The hints
// are worked out from the value where a plain equivalent exists — words and pages
// for tokens, words a minute for a token rate, requests a day for a rate — so
// they stay true for every option without a sentence per number.
//
// React-free: pages pass their t(); scripts/test-choices.ts checks every list.

import type { Gpu } from "./gpus.ts";

type T = (key: string, vars?: Record<string, string | number>) => string;
export interface Opt {
  value: number;
  label: string;
  hint: string;
}

/** Roughly 0.75 English words a token, 500 words a page. */
const WORDS_PER_TOKEN = 0.75;
const WORDS_PER_PAGE = 500;

const fmt = (n: number, lang: string) => n.toLocaleString(lang === "tr" ? "tr-TR" : "en-US");
const k = (n: number) => (n >= 1048576 ? `${n / 1048576}M` : n >= 1024 && n % 1024 === 0 ? `${n / 1024}k` : n >= 1000 && n % 1000 === 0 ? `${n / 1000}k` : String(n));
function words(n: number, lang: string): { w: string; p: string } {
  const w = n * WORDS_PER_TOKEN;
  const round = (x: number) => (x >= 1000 ? Math.round(x / 100) * 100 : x >= 100 ? Math.round(x / 10) * 10 : Math.round(x));
  return { w: fmt(round(w), lang), p: fmt(Math.max(1, Math.round(w / WORDS_PER_PAGE)), lang) };
}
/** A token count's plain size: words and, past a page, pages. */
function size(t: T, n: number, lang: string): string {
  const { w, p } = words(n, lang);
  return n * WORDS_PER_TOKEN >= WORDS_PER_PAGE ? t("choice.tokensPages", { w, p }) : t("choice.tokensWords", { w });
}
const band = <B extends string>(n: number, bands: [number, B][], last: B): B => bands.find(([max]) => n <= max)?.[1] ?? last;

export function contextChoices(t: T, lang: string, modelMax?: number): Opt[] {
  const all = [2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
  const list = modelMax ? all.filter((n) => n <= modelMax) : all;
  if (modelMax && !list.includes(modelMax)) list.push(modelMax);
  return list.map((n) => ({
    value: n,
    label: `${k(n)} · ${fmt(n, lang)}`,
    hint: `${size(t, n, lang)} ${t(`choice.ctx.${band(n, [[4096, "short"], [16384, "medium"], [65536, "long"], [262144, "huge"]], "max")}`)}${n === modelMax ? " " + t("choice.ctx.modelMax") : ""}`,
  }));
}

export function userChoices(t: T, lang: string): Opt[] {
  return [1, 2, 4, 8, 16, 32, 64, 128, 256, 512].map((n) => ({
    value: n,
    label: fmt(n, lang),
    hint: `${t("choice.users", { n: fmt(n, lang) })} ${t(`choice.users.${band(n, [[1, "one"], [8, "team"], [64, "tool"]], "service")}`)}`,
  }));
}

export function utilChoices(t: T): Opt[] {
  return [0.8, 0.85, 0.9, 0.92, 0.95].map((v) => ({
    value: v,
    label: v === 0.92 ? `0.92 · ${t("choice.default")}` : v.toFixed(2),
    hint: t(`choice.util.${String(v).replace(".", "_")}`),
  }));
}

export function gpuCountChoices(t: T): Opt[] {
  return [1, 2, 4, 8, 16].map((n) => ({ value: n, label: String(n), hint: t(`choice.gpus.${n}`) }));
}

export function promptChoices(t: T, lang: string): Opt[] {
  return [128, 256, 512, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000].map((n) => ({
    value: n,
    label: fmt(n, lang),
    hint: `${size(t, n, lang)} ${t(`choice.prompt.${band(n, [[256, "question"], [1000, "chat"], [4000, "rag"], [16000, "doc"]], "book")}`)}`,
  }));
}

export function outputChoices(t: T, lang: string): Opt[] {
  return [0, 16, 32, 64, 128, 256, 512, 1000, 2000, 4000, 8000, 16000].map((n) => ({
    value: n,
    label: fmt(n, lang),
    hint: n === 0 ? t("choice.output.none") : `${size(t, n, lang)} ${t(`choice.output.${band(n, [[32, "line"], [128, "short"], [512, "answer"], [2000, "long"]], "reasoning")}`)}`,
  }));
}

export function prefixChoices(t: T, lang: string): Opt[] {
  return [0, 128, 256, 512, 1000, 2000, 4000, 8000].map((n) => ({
    value: n,
    label: fmt(n, lang),
    hint: n === 0 ? t("choice.prefix.none") : `${size(t, n, lang)} ${t(`choice.prefix.${band(n, [[256, "instruction"], [1000, "system"]], "tools")}`)}`,
  }));
}

export function rpsChoices(t: T, lang: string): Opt[] {
  return [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map((r) => ({
    value: r,
    label: fmt(r, lang),
    hint: t("choice.rps", { m: fmt(Math.round(r * 60), lang), d: fmt(Math.round((r * 86400) / 1000) * 1000 || Math.round(r * 86400), lang) }),
  }));
}

export function ttftChoices(t: T, lang: string): Opt[] {
  return [0.1, 0.2, 0.3, 0.5, 1, 2, 3, 6, 10].map((s) => ({
    value: s,
    label: s < 1 ? `${fmt(Math.round(s * 1000), lang)} ms` : `${fmt(s, lang)} s`,
    hint: t(`choice.ttft.${band(s, [[0.2, "instant"], [0.5, "chat"], [2, "rag"], [6, "doc"]], "batch")}`),
  }));
}

export function tpotChoices(t: T, lang: string): Opt[] {
  return [10, 15, 20, 30, 40, 50, 80, 100, 200].map((ms) => {
    const tps = 1000 / ms;
    return {
      value: ms,
      label: `${ms} ms`,
      hint: t("choice.tpot", { tps: fmt(Math.round(tps), lang), wpm: fmt(Math.round((tps * WORDS_PER_TOKEN * 60) / 10) * 10, lang) }) + " " + t(`choice.tpot.${band(ms, [[20, "fast"], [50, "chat"], [100, "read"]], "slow")}`),
    };
  });
}

export function rankChoices(t: T): Opt[] {
  return [4, 8, 16, 32, 64, 128, 256].map((r) => ({ value: r, label: String(r), hint: t(`choice.rank.${band(r, [[8, "light"], [16, "common"], [64, "heavy"]], "max")}`) }));
}

export function batchChoices(t: T): Opt[] {
  return [1, 2, 4, 8, 16, 32, 64].map((b) => ({ value: b, label: String(b), hint: t(`choice.batch.${band(b, [[1, "one"], [8, "small"]], "large")}`, { n: b }) }));
}

export function seqChoices(t: T, lang: string): Opt[] {
  return [512, 1024, 2048, 4096, 8192, 16384, 32768].map((n) => ({ value: n, label: `${k(n)} · ${fmt(n, lang)}`, hint: `${size(t, n, lang)} ${t(`choice.seq.${band(n, [[1024, "short"], [4096, "common"]], "long")}`)}` }));
}

/** A device's figures in one line, for hovering it in a menu. */
export function gpuHint(t: T, g: Gpu, lang: string): string {
  const parts = [t("choice.gpu.mem", { gb: fmt(g.totalGiB ?? g.vramGiB, lang) })];
  if (g.unified && g.totalGiB) parts.push(t("choice.gpu.usable", { gb: fmt(g.vramGiB, lang) }));
  if (g.bandwidthGBs) parts.push(t("choice.gpu.bw", { bw: fmt(g.bandwidthGBs, lang) }));
  if (g.tflops) parts.push(t("choice.gpu.tflops", { tf: fmt(Math.round(g.tflops.bf16), lang) }));
  return parts.join(" · ");
}
