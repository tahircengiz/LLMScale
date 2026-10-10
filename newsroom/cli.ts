// The newsroom from the command line. Run from the repository root:
//
//   node newsroom/cli.ts collect [--days 4]   read the sources, remember new items
//   node newsroom/cli.ts screen               Claude scores the new items
//   node newsroom/cli.ts write [--max 4]      Claude drafts posts for the best ones
//   node newsroom/cli.ts run                  all three, in order (the daily timer runs this)
//   node newsroom/cli.ts list [status]        drafts (pending by default) or, with an item status, items
//   node newsroom/cli.ts show <draft-id>      one draft in full, with its problems and notes
//   node newsroom/cli.ts rewrite <draft-id>   discard a pending draft and have Claude write it again
//   node newsroom/cli.ts preview [dir]        pending drafts as feed files, to build the site with
//                                             (FEED_DIR=<dir> npm run build)
//
// screen, write, run and rewrite need ANTHROPIC_API_KEY (and ANTHROPIC_BASE_URL
// to go through a gateway). The database is newsroom/data/newsroom.db unless
// NEWSROOM_DB says otherwise; it holds drafts, which stay on this machine until
// one is approved. The review panel (panel.ts) does the approving.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAll, runCollect, runScreen, runWrite } from "./pipeline.ts";
import { DRAFT_STATUSES, Store, type CandidateStatus, type DraftStatus } from "./store.ts";
import type { Ask } from "./draft.ts";

const DB = process.env.NEWSROOM_DB ?? fileURLToPath(new URL("./data/newsroom.db", import.meta.url));
const [cmd = "help", ...rest] = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const i = rest.indexOf(`--${name}`);
  const v = i >= 0 ? Number(rest[i + 1]) : NaN;
  return Number.isFinite(v) ? v : fallback;
};

async function claude(): Promise<Ask> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error("ANTHROPIC_API_KEY is not set: screening and writing need the Claude API.");
    process.exit(2);
  }
  // Imported here so collect, list and preview run without the SDK installed.
  const { claudeAsk } = await import("./claude.ts");
  return claudeAsk();
}

const store = new Store(DB);
try {
  switch (cmd) {
    case "collect":
      console.log(await runCollect(store, { maxAgeDays: flag("days", 4), log: console.log }));
      break;
    case "screen":
      console.log(await runScreen(store, await claude()));
      break;
    case "write":
      console.log(await runWrite(store, await claude(), { maxDrafts: flag("max", Number(process.env.NEWSROOM_MAX_DRAFTS ?? 4)), log: console.log }));
      break;
    case "run":
      await runAll(store, await claude(), console.log);
      break;
    case "list": {
      const status = rest[0] ?? "pending";
      if ((DRAFT_STATUSES as readonly string[]).includes(status)) {
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
      console.log(`status:   ${d.status}${d.publishLog ? ` — ${d.publishLog}` : ""}`);
      console.log(`cost:     ${d.inputTokens} in / ${d.outputTokens} out tokens (${d.model})`);
      break;
    }
    case "rewrite": {
      const d = store.draft(rest[0] ?? "");
      if (!d || d.status !== "pending") throw new Error(`no pending draft ${rest[0]}`);
      const ask = await claude();
      store.deleteDraft(d.id);
      store.setStatus(d.candidateKey, "screened");
      console.log(await runWrite(store, ask, { keys: [d.candidateKey], log: console.log }));
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
      console.log("usage: node newsroom/cli.ts collect|screen|write|run|list [status]|show <id>|rewrite <id>|preview [dir]");
  }
} finally {
  store.close();
}
