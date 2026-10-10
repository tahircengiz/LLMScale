// The daily run, step by step, each step recorded in the runs table: used by the
// command line (cli.ts) and by the panel's "run now" button (panel.ts).

import { collect } from "./collect.ts";
import { screen, write, type Ask } from "./draft.ts";
import type { Store } from "./store.ts";

export const MIN_SCORE = Number(process.env.NEWSROOM_MIN_SCORE ?? 7);
export const MAX_DRAFTS = Number(process.env.NEWSROOM_MAX_DRAFTS ?? 4);

export const tokens = (u: { input: number; output: number }) =>
  `${u.input.toLocaleString("en-US")} in / ${u.output.toLocaleString("en-US")} out tokens`;

type Log = (line: string) => void;

export async function runCollect(store: Store, opts: { maxAgeDays?: number; log?: Log } = {}): Promise<string> {
  const log = opts.log ?? (() => {});
  const run = store.startRun("collect");
  const res = await collect(store, { maxAgeDays: opts.maxAgeDays ?? 4 });
  for (const r of res) log(`${r.error ? "FAIL" : "ok  "}  ${r.source.padEnd(14)} ${r.error ?? `${r.read} read, ${r.recent} recent, ${r.added} new, ${r.onTopic} on topic`}`);
  const summary = `${res.reduce((n, r) => n + r.added, 0)} new items, ${res.reduce((n, r) => n + r.onTopic, 0)} on topic, ${res.filter((r) => r.error).length} sources failed`;
  store.finishRun(run, summary);
  return `collect: ${summary}`;
}

export async function runScreen(store: Store, ask: Ask): Promise<string> {
  const run = store.startRun("screen");
  const res = await screen(store, ask, { minScore: MIN_SCORE });
  const summary = `${res.screened} screened, ${res.kept} kept at ${MIN_SCORE}+`;
  store.finishRun(run, summary, res.usage);
  return `screen: ${summary}; ${tokens(res.usage)}`;
}

export async function runWrite(store: Store, ask: Ask, opts: { maxDrafts?: number; keys?: string[]; log?: Log } = {}): Promise<string> {
  const log = opts.log ?? (() => {});
  const run = store.startRun(opts.keys ? "rewrite" : "write");
  const res = await write(store, ask, { minScore: MIN_SCORE, maxDrafts: opts.maxDrafts ?? MAX_DRAFTS, keys: opts.keys });
  for (const r of res.results) log(r.error ? `FAIL  ${r.key}  ${r.error}` : `ok    ${r.id}${r.problems ? `  (${r.problems} problem${r.problems > 1 ? "s" : ""})` : ""}`);
  const summary = `${res.results.filter((r) => r.id).length} drafts, ${res.results.filter((r) => r.error).length} failed`;
  store.finishRun(run, summary, res.usage);
  return `${opts.keys ? "rewrite" : "write"}: ${summary}; ${tokens(res.usage)}`;
}

/** Collect, screen and write, in order; a step that fails stops the run and says where. */
export async function runAll(store: Store, ask: Ask, log: Log = () => {}): Promise<string[]> {
  const out = [await runCollect(store, { log })];
  log(out[0]);
  out.push(await runScreen(store, ask));
  log(out[1]);
  out.push(await runWrite(store, ask, { log }));
  log(out[2]);
  return out;
}
