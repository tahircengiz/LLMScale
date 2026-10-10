// The newsroom's memory: every item it has seen, what the screener made of it,
// and the drafts waiting for review. One SQLite file on the machine that runs the
// newsroom, through Node's built-in driver — drafts never leave it until one is
// approved and committed as a post.

import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { FeedCategory, FeedPost } from "../src/lib/feed.ts";
import type { SourceKind } from "./sources.ts";
import { normalizeUrl } from "./text.ts";

/** new → (skipped | screened | rejected) → drafted | failed */
export type CandidateStatus = "new" | "skipped" | "screened" | "rejected" | "drafted" | "failed";
/** pending → approved → committed → published, or rejected; published → withdrawing → withdrawn.
 *  "committed" is in the site's repository but not deployed — where a post stops
 *  while publishing runs in local mode. */
export type DraftStatus = "pending" | "approved" | "committed" | "published" | "rejected" | "withdrawing" | "withdrawn";
export const DRAFT_STATUSES: readonly DraftStatus[] = ["pending", "approved", "committed", "published", "rejected", "withdrawing", "withdrawn"];

export interface Candidate {
  key: string;
  url: string;
  title: string;
  content: string;
  source: string;
  sourceId: string;
  kind: SourceKind;
  published: string | null;
  hfRepo: string | null;
  meta: string | null;
  collectedAt: string;
  status: CandidateStatus;
  score: number | null;
  category: FeedCategory | null;
  reason: string | null;
  duplicateOf: string | null;
}

export interface Draft {
  id: string;
  candidateKey: string;
  post: FeedPost;
  /** What validatePost and the link check found; a draft with problems cannot be approved as it is. */
  problems: string[];
  /** The writer's notes for the reviewer: what it could not verify. */
  notes: string;
  status: DraftStatus;
  model: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
  updatedAt: string;
  /** The id the post went out under: its date is the day it was published, not drafted. */
  publishedId: string | null;
  publishedAt: string | null;
  /** The last thing publishing said about this draft — an error, or where it went. */
  publishLog: string | null;
}

export const keyOf = (url: string) => createHash("sha256").update(normalizeUrl(url)).digest("hex").slice(0, 16);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS candidates (
  key TEXT PRIMARY KEY, url TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL, source_id TEXT NOT NULL, kind TEXT NOT NULL, published TEXT, hf_repo TEXT, meta TEXT,
  collected_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  score REAL, category TEXT, reason TEXT, duplicate_of TEXT
);
CREATE INDEX IF NOT EXISTS candidates_status ON candidates(status);
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY, candidate_key TEXT NOT NULL REFERENCES candidates(key),
  post TEXT NOT NULL, problems TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS drafts_status ON drafts(status);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, step TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT,
  summary TEXT, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0
);
`;

type Row = Record<string, unknown>;
const candidateOf = (r: Row): Candidate => ({
  key: r.key as string,
  url: r.url as string,
  title: r.title as string,
  content: r.content as string,
  source: r.source as string,
  sourceId: r.source_id as string,
  kind: r.kind as SourceKind,
  published: (r.published as string) ?? null,
  hfRepo: (r.hf_repo as string) ?? null,
  meta: (r.meta as string) ?? null,
  collectedAt: r.collected_at as string,
  status: r.status as CandidateStatus,
  score: (r.score as number) ?? null,
  category: (r.category as FeedCategory) ?? null,
  reason: (r.reason as string) ?? null,
  duplicateOf: (r.duplicate_of as string) ?? null,
});
const draftOf = (r: Row): Draft => ({
  id: r.id as string,
  candidateKey: r.candidate_key as string,
  post: JSON.parse(r.post as string) as FeedPost,
  problems: JSON.parse(r.problems as string) as string[],
  notes: r.notes as string,
  status: r.status as DraftStatus,
  model: r.model as string,
  inputTokens: r.input_tokens as number,
  outputTokens: r.output_tokens as number,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
  publishedId: (r.published_id as string) ?? null,
  publishedAt: (r.published_at as string) ?? null,
  publishLog: (r.publish_log as string) ?? null,
});

export class Store {
  readonly db: DatabaseSync;

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    // The panel and the daily run share the file; a writer waits for the other.
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 10000;");
    this.db.exec(SCHEMA);
    // Columns added after the first release, for databases made before them.
    const have = new Set((this.db.prepare("PRAGMA table_info(drafts)").all() as Row[]).map((c) => c.name as string));
    for (const [col, type] of [["published_id", "TEXT"], ["published_at", "TEXT"], ["publish_log", "TEXT"]]) {
      if (!have.has(col)) this.db.exec(`ALTER TABLE drafts ADD COLUMN ${col} ${type}`);
    }
  }

  /** Records an item once; false when its URL was seen before, under any spelling. */
  addCandidate(c: Omit<Candidate, "key" | "collectedAt" | "score" | "category" | "reason" | "duplicateOf"> & { collectedAt?: string }): boolean {
    const res = this.db
      .prepare(
        `INSERT OR IGNORE INTO candidates (key, url, title, content, source, source_id, kind, published, hf_repo, meta, collected_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(keyOf(c.url), c.url, c.title, c.content, c.source, c.sourceId, c.kind, c.published, c.hfRepo, c.meta, c.collectedAt ?? new Date().toISOString(), c.status);
    return res.changes > 0;
  }

  candidates(status: CandidateStatus, limit = 500): Candidate[] {
    return (this.db.prepare("SELECT * FROM candidates WHERE status = ? ORDER BY published DESC LIMIT ?").all(status, limit) as Row[]).map(candidateOf);
  }

  candidate(key: string): Candidate | undefined {
    const r = this.db.prepare("SELECT * FROM candidates WHERE key = ?").get(key) as Row | undefined;
    return r && candidateOf(r);
  }

  /** The screened items worth writing up, best first. */
  toWrite(minScore: number, limit: number): Candidate[] {
    return (
      this.db.prepare("SELECT * FROM candidates WHERE status = 'screened' AND score >= ? ORDER BY score DESC, published DESC LIMIT ?").all(minScore, limit) as Row[]
    ).map(candidateOf);
  }

  setScreened(key: string, v: { score: number; category: FeedCategory | null; reason: string; duplicateOf: string | null; status: "screened" | "rejected" }): void {
    this.db
      .prepare("UPDATE candidates SET status = ?, score = ?, category = ?, reason = ?, duplicate_of = ? WHERE key = ?")
      .run(v.status, v.score, v.category, v.reason, v.duplicateOf, key);
  }

  setStatus(key: string, status: CandidateStatus, reason?: string): void {
    this.db.prepare("UPDATE candidates SET status = ?, reason = COALESCE(?, reason) WHERE key = ?").run(status, reason ?? null, key);
  }

  addDraft(d: Omit<Draft, "createdAt" | "updatedAt" | "status" | "publishedId" | "publishedAt" | "publishLog"> & { status?: DraftStatus }): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO drafts (id, candidate_key, post, problems, notes, status, model, input_tokens, output_tokens, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(d.id, d.candidateKey, JSON.stringify(d.post), JSON.stringify(d.problems), d.notes, d.status ?? "pending", d.model, d.inputTokens, d.outputTokens, now, now);
  }

  drafts(status?: DraftStatus): Draft[] {
    const rows = status
      ? this.db.prepare("SELECT * FROM drafts WHERE status = ? ORDER BY created_at DESC").all(status)
      : this.db.prepare("SELECT * FROM drafts ORDER BY created_at DESC").all();
    return (rows as Row[]).map(draftOf);
  }

  draft(id: string): Draft | undefined {
    const r = this.db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as Row | undefined;
    return r && draftOf(r);
  }

  /** Replaces a pending draft's post after an edit, with what the checks now find. */
  updateDraftPost(id: string, post: FeedPost, problems: string[]): boolean {
    return (
      this.db
        .prepare("UPDATE drafts SET post = ?, problems = ?, updated_at = ? WHERE id = ? AND status = 'pending'")
        .run(JSON.stringify(post), JSON.stringify(problems), new Date().toISOString(), id).changes > 0
    );
  }

  /** Moves a draft from one status to another; false when it was not in `from` (someone got there first). */
  moveDraft(id: string, from: DraftStatus | DraftStatus[], to: DraftStatus, extra: { publishedId?: string; publishedAt?: string; log?: string | null } = {}): boolean {
    const froms = Array.isArray(from) ? from : [from];
    const res = this.db
      .prepare(
        `UPDATE drafts SET status = ?, updated_at = ?,
           published_id = COALESCE(?, published_id), published_at = COALESCE(?, published_at),
           publish_log = CASE WHEN ? THEN ? ELSE publish_log END
         WHERE id = ? AND status IN (${froms.map(() => "?").join(",")})`
      )
      .run(to, new Date().toISOString(), extra.publishedId ?? null, extra.publishedAt ?? null, extra.log !== undefined ? 1 : 0, extra.log ?? null, id, ...froms);
    return res.changes > 0;
  }

  setPublishLog(id: string, log: string): void {
    this.db.prepare("UPDATE drafts SET publish_log = ?, updated_at = ? WHERE id = ?").run(log, new Date().toISOString(), id);
  }

  lastRuns(limit = 5): { step: string; startedAt: string; finishedAt: string | null; summary: string | null; inputTokens: number; outputTokens: number }[] {
    return (this.db.prepare("SELECT * FROM runs ORDER BY id DESC LIMIT ?").all(limit) as Row[]).map((r) => ({
      step: r.step as string,
      startedAt: r.started_at as string,
      finishedAt: (r.finished_at as string) ?? null,
      summary: (r.summary as string) ?? null,
      inputTokens: r.input_tokens as number,
      outputTokens: r.output_tokens as number,
    }));
  }

  /** Tokens spent since a time, for the panel's running total. */
  tokensSince(iso: string): { input: number; output: number } {
    const r = this.db.prepare("SELECT COALESCE(SUM(input_tokens),0) AS i, COALESCE(SUM(output_tokens),0) AS o FROM runs WHERE started_at >= ?").get(iso) as Row;
    return { input: Number(r.i), output: Number(r.o) };
  }

  /** Removes a draft so its item can be written again; only a draft still waiting for review. */
  deleteDraft(id: string): boolean {
    return this.db.prepare("DELETE FROM drafts WHERE id = ? AND status = 'pending'").run(id).changes > 0;
  }

  hasDraftId(id: string): boolean {
    return this.db.prepare("SELECT 1 FROM drafts WHERE id = ?").get(id) !== undefined;
  }

  startRun(step: string): number {
    return Number(this.db.prepare("INSERT INTO runs (step, started_at) VALUES (?, ?)").run(step, new Date().toISOString()).lastInsertRowid);
  }

  finishRun(id: number, summary: string, usage = { input: 0, output: 0 }): void {
    this.db
      .prepare("UPDATE runs SET finished_at = ?, summary = ?, input_tokens = ?, output_tokens = ? WHERE id = ?")
      .run(new Date().toISOString(), summary, usage.input, usage.output, id);
  }

  close(): void {
    this.db.close();
  }
}
