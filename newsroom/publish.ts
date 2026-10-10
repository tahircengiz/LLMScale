// Publishing: an approved draft becomes content/feed/<id>.json in a checkout of
// the site's repository, is committed, and — in live mode — pushed and deployed.
// Approving in the panel is the go-ahead for that post (the owner's decision,
// 2026-10-10); nothing else reaches the site this way.
//
//   off    approvals wait; nothing is written
//   local  approved posts are committed to the checkout and the site is built to
//          prove it still builds — nothing leaves the machine
//   live   as local, then the commit is pushed to main and the build deployed to
//          GitHub Pages; commits made in local mode go out with it
//
// All approvals waiting at one moment go out in one commit and one deploy.

import { spawn } from "node:child_process";
import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validatePost, type FeedPost } from "../src/lib/feed.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import { isoSecond } from "./draft.ts";
import type { Draft, Store } from "./store.ts";

export type PublishMode = "off" | "local" | "live";

export interface PublishConfig {
  mode: PublishMode;
  /** A git checkout of the site, on the branch posts are committed to. */
  repoDir: string;
  branch: string;
  /** The live site, for the log line a published draft keeps. */
  siteUrl: string;
  run?: Runner;
}

export type Runner = (cmd: string, args: string[], opts: { cwd: string; timeoutMs?: number }) => Promise<{ code: number; out: string }>;

export const runCommand: Runner = (cmd, args, { cwd, timeoutMs = 600_000 }) =>
  new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const keep = (b: Buffer) => {
      out = (out + b.toString()).slice(-8000);
    };
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, out });
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ code: 1, out: String(e) });
    });
  });

const FEED = "content/feed";
const KNOWN = new Set(KNOWN_MODELS.map((m) => m.id));

/** The post as it goes out: dated the day it is published, under an id no other post has. */
export function finalPost(draft: Draft, now: Date, taken: (id: string) => boolean): FeedPost {
  const slug = draft.post.id.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const day = isoSecond(now).slice(0, 10);
  let id = `${day}-${slug}`;
  for (let n = 2; taken(id); n++) id = `${day}-${slug}-${n}`;
  return { ...draft.post, id, published: isoSecond(now) };
}

async function git(cfg: PublishConfig, ...args: string[]) {
  const r = await (cfg.run ?? runCommand)("git", args, { cwd: cfg.repoDir, timeoutMs: 120_000 });
  if (r.code !== 0) throw new Error(`git ${args[0]} failed: ${r.out.trim().split("\n").slice(-3).join(" / ")}`);
  return r.out.trim();
}

async function step(cfg: PublishConfig, cmd: string, args: string[], what: string, timeoutMs = 900_000): Promise<void> {
  const r = await (cfg.run ?? runCommand)(cmd, args, { cwd: cfg.repoDir, timeoutMs });
  if (r.code !== 0) throw new Error(`${what} failed: ${r.out.trim().split("\n").slice(-4).join(" / ")}`);
}

async function build(cfg: PublishConfig): Promise<void> {
  // The panel runs from this same checkout: reinstall only when what is installed
  // no longer matches the lockfile (after a pull that changed dependencies).
  if ((await (cfg.run ?? runCommand)("npm", ["ls", "--depth=0"], { cwd: cfg.repoDir, timeoutMs: 60_000 })).code !== 0) {
    await step(cfg, "npm", ["ci", "--no-audit", "--no-fund", "--loglevel=error"], "npm ci");
  }
  await step(cfg, "npm", ["run", "build"], "build");
}

/** gh-pages pushes to the remote's fetch address unless told otherwise; the
 *  checkout reads over public HTTPS and writes over SSH with the deploy key, so
 *  it is given the push address. */
async function deploy(cfg: PublishConfig, message: string): Promise<void> {
  const repo = await git(cfg, "remote", "get-url", "--push", "origin");
  await step(cfg, "npx", ["gh-pages", "-d", "dist", "--dotfiles", "--repo", repo, "-m", message], "deploy");
}

/** Sends the waiting approvals and withdrawals out. One pass; safe to call often. */
export async function publishPending(store: Store, cfg: PublishConfig, now = new Date()): Promise<{ published: string[]; withdrawn: string[]; error?: string }> {
  const approved = store.drafts("approved");
  const withdrawing = store.drafts("withdrawing");
  const committed = cfg.mode === "live" ? store.drafts("committed") : [];
  if (cfg.mode === "off" || (!approved.length && !withdrawing.length && !committed.length)) return { published: [], withdrawn: [] };

  const dir = join(cfg.repoDir, FEED);
  const files = () => new Set(existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : []);
  try {
    // Commits made in local mode sit on top of whatever main has gained since.
    if (cfg.mode === "live") await git(cfg, "pull", "--rebase", "origin", cfg.branch);

    const titles: string[] = [];
    const newlyCommitted: { draft: Draft; post: FeedPost }[] = [];
    for (const d of approved) {
      const existing = files();
      const post = finalPost(d, now, (id) => existing.has(id));
      const problems = validatePost(post, { knownModels: KNOWN, fileStem: post.id });
      if (problems.length) {
        store.moveDraft(d.id, "approved", "pending", { log: `not published: ${problems.join("; ")}` });
        continue;
      }
      writeFileSync(join(dir, `${post.id}.json`), `${JSON.stringify(post, null, 2)}\n`);
      newlyCommitted.push({ draft: d, post });
      titles.push(post.en.title);
    }
    const removed: Draft[] = [];
    for (const d of withdrawing) {
      if (d.publishedId && existsSync(join(dir, `${d.publishedId}.json`))) rmSync(join(dir, `${d.publishedId}.json`));
      removed.push(d);
    }
    const changed = newlyCommitted.length + removed.length;
    if (changed) {
      await git(cfg, "add", "-A", FEED);
      const parts = [
        newlyCommitted.length ? `Publish news: ${titles[0]}${titles.length > 1 ? ` and ${titles.length - 1} more` : ""}` : "",
        removed.length ? `Withdraw news: ${removed.map((d) => d.post.en.title).join("; ")}` : "",
      ].filter(Boolean);
      await git(cfg, "commit", "-q", "-m", parts.join("\n\n"));
    }
    const sha = await git(cfg, "rev-parse", "--short", "HEAD");
    for (const { draft, post } of newlyCommitted) store.moveDraft(draft.id, "approved", "committed", { publishedId: post.id, publishedAt: post.published, log: `committed ${sha}` });
    for (const d of removed) if (cfg.mode !== "live") store.moveDraft(d.id, "withdrawing", "withdrawn", { log: `removed in ${sha} (local mode, not deployed)` });

    await build(cfg);
    if (cfg.mode !== "live") return { published: [], withdrawn: removed.map((d) => d.id) };
    // main first, then the site: main is the record, and a deploy that fails after
    // it is retried from the same commit on the next pass.
    await git(cfg, "push", "origin", `HEAD:${cfg.branch}`);
    await deploy(cfg, `Deploy: news (${sha})`);
    const goingOut = [...committed, ...newlyCommitted.map((x) => store.draft(x.draft.id)!)];
    for (const d of goingOut) store.moveDraft(d.id, "committed", "published", { log: `${cfg.siteUrl}feed/${d.publishedId}.html` });
    for (const d of removed) store.moveDraft(d.id, "withdrawing", "withdrawn", { log: `removed in ${sha}` });
    return { published: goingOut.map((d) => d.id), withdrawn: removed.map((d) => d.id) };
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500);
    for (const d of [...approved, ...withdrawing, ...committed]) store.setPublishLog(d.id, msg);
    return { published: [], withdrawn: [], error: msg };
  }
}
