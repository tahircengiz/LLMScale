// The newsroom from the command line. Run from the repository root:
//
//   node newsroom/cli.ts collect [--days 4]   read the sources, remember new items
//   node newsroom/cli.ts screen               Claude scores the new items
//   node newsroom/cli.ts write [--max 4]      Claude drafts posts for the best ones
//   node newsroom/cli.ts run                  all three, in order
//   node newsroom/cli.ts list [status]        drafts (pending by default) or, with an item status, items
//   node newsroom/cli.ts show <draft-id>      one draft in full, with its problems and notes
//   node newsroom/cli.ts preview [dir]        pending drafts as feed files, to build the site with
//                                             (FEED_DIR=<dir> npm run build)
//
// screen and write need ANTHROPIC_API_KEY (and ANTHROPIC_BASE_URL to go through
// a gateway). The database is newsroom/data/newsroom.db unless NEWSROOM_DB says
// otherwise; it holds drafts, which stay on this machine until one is approved.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { collect } from "./collect.ts";
import { screen, write } from "./draft.ts";
import { Store, type CandidateStatus, type DraftStatus } from "./store.ts";

const DB = process.env.NEWSROOM_DB ?? fileURLToPath(new URL("./data/newsroom.db", import.meta.url));
const [cmd = "help", ...rest] = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const i = rest.indexOf(`--${name}`);
  const v = i >= 0 ? Number(rest[i + 1]) : NaN;
  return Number.isFinite(v) ? v : fallback;
};
const MIN_SCORE = Number(process.env.NEWSROOM_MIN_SCORE ?? 7);

async function claude() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error("ANTHROPIC_API_KEY is not set: screening and writing need the Claude API.");
    process.exit(2);
  }
  // Imported here so collect, list and preview run without the SDK installed.
  const { claudeAsk } = await import("./claude.ts");
  return claudeAsk();
}

const tokens = (u: { input: number; output: number }) => `${u.input.toLocaleString("en-US")} in / ${u.output.toLocaleString("en-US")} out tokens`;

async function doCollect(store: Store) {
  const run = store.startRun("collect");
  const res = await collect(store, { maxAgeDays: flag("days", 4) });
  for (const r of res) console.log(`${r.error ? "FAIL" : "ok  "}  ${r.source.padEnd(14)} ${r.error ?? `${r.read} read, ${r.recent} recent, ${r.added} new, ${r.onTopic} on topic`}`);
  const summary = `${res.reduce((n, r) => n + r.added, 0)} new items, ${res.reduce((n, r) => n + r.onTopic, 0)} on topic, ${res.filter((r) => r.error).length} sources failed`;
  store.finishRun(run, summary);
  console.log(`collect: ${summary}`);
}

async function doScreen(store: Store) {
  const ask = await claude();
  const run = store.startRun("screen");
  const res = await screen(store, ask, { minScore: MIN_SCORE });
  const summary = `${res.screened} screened, ${res.kept} kept at ${MIN_SCORE}+`;
  store.finishRun(run, summary, res.usage);
  console.log(`screen: ${summary}; ${tokens(res.usage)}`);
}

async function doWrite(store: Store) {
  const ask = await claude();
  const run = store.startRun("write");
  const res = await write(store, ask, { minScore: MIN_SCORE, maxDrafts: flag("max", Number(process.env.NEWSROOM_MAX_DRAFTS ?? 4)) });
  for (const r of res.results) console.log(r.error ? `FAIL  ${r.key}  ${r.error}` : `ok    ${r.id}${r.problems ? `  (${r.problems} problem${r.problems > 1 ? "s" : ""})` : ""}`);
  const summary = `${res.results.filter((r) => r.id).length} drafts, ${res.results.filter((r) => r.error).length} failed`;
  store.finishRun(run, summary, res.usage);
  console.log(`write: ${summary}; ${tokens(res.usage)}`);
}

const store = new Store(DB);
try {
  switch (cmd) {
    case "collect":
      await doCollect(store);
      break;
    case "screen":
      await doScreen(store);
      break;
    case "write":
      await doWrite(store);
      break;
    case "run":
      await doCollect(store);
      await doScreen(store);
      await doWrite(store);
      break;
    case "list": {
      const status = rest[0] ?? "pending";
      if (["pending", "approved", "rejected", "published", "withdrawn"].includes(status)) {
        for (const d of store.drafts(status as DraftStatus)) console.log(`${d.id}  ${d.problems.length ? `[${d.problems.length} problems] ` : ""}${d.post.en.title}`);
      } else {
        for (const c of store.candidates(status as CandidateStatus, 200)) console.log(`${c.key}  ${c.score ?? "-"}  ${c.source.padEnd(14)} ${c.title}${c.reason ? `  — ${c.reason}` : ""}`);
      }
      break;
    }
    case "show": {
      const d = store.draft(rest[0] ?? "");
      if (!d) throw new Error(`no draft ${rest[0]}`);
      const c = store.candidate(d.candidateKey);
      console.log(JSON.stringify(d.post, null, 2));
      console.log(`\nfrom:     ${c?.source} — ${c?.url}`);
      console.log(`screener: ${c?.score} — ${c?.reason}`);
      console.log(`notes:    ${d.notes}`);
      console.log(`problems: ${d.problems.length ? `\n  ${d.problems.join("\n  ")}` : "none"}`);
      console.log(`cost:     ${d.inputTokens} in / ${d.outputTokens} out tokens (${d.model})`);
      break;
    }
    case "preview": {
      const dir = rest[0] ?? fileURLToPath(new URL("./data/preview-feed", import.meta.url));
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const drafts = store.drafts("pending");
      for (const d of drafts) writeFileSync(join(dir, `${d.post.id}.json`), `${JSON.stringify(d.post, null, 2)}\n`);
      console.log(`preview: ${drafts.length} pending drafts in ${dir}\n  FEED_DIR=${dir} npm run build`);
      break;
    }
    default:
      console.log("usage: node newsroom/cli.ts collect|screen|write|run|list [status]|show <id>|preview [dir]");
  }
} finally {
  store.close();
}
