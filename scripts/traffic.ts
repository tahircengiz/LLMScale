// Turns raw Umami rows into the traffic report.
//
// Why this is not a GROUP BY: the app writes its whole state into the URL, and
// every setting a visitor changes rewrites it, which fires another pageview. One
// person tuning context and concurrency for ten minutes produces dozens of rows.
// Counting rows would make the report describe whoever fiddled most, so
// everything here aggregates per SESSION.
//
// Within a session two events matter and mean different things:
//   - the FIRST is how they arrived — a bare visit carries the app's defaults, a
//     shared link carries someone else's configuration;
//   - the LAST is what they settled on, which is the interesting one.
// A session with a single event never touched a control.
//
// Defaults are the trap. A visitor who does nothing still emits the default
// model and device, indistinguishable from someone who chose them on purpose.
// So a value is only credited as a CHOICE when it differs from the entry state.
//
// React-free so `node scripts/test-traffic.ts` can run it directly.

import { findKnownByHfId } from "../src/lib/models.ts";
import { GPUS } from "../src/lib/gpus.ts";
import { DTYPE_LABELS, type Dtype } from "../src/lib/calc.ts";

/** One row of the Umami export: website_event joined to session. */
export interface Row {
  session_id: string;
  created_at: string;
  url_path: string;
  url_query: string | null;
  referrer_domain?: string | null;
  country?: string | null;
  device?: string | null;
  event_name?: string | null;
}

export interface Tally {
  label: string;
  sessions: number;
}

export interface Report {
  from: string;
  to: string;
  sessions: number;
  events: number;
  /** Sessions that changed at least one setting. */
  engaged: number;
  /** Sessions that arrived on a link carrying someone else's configuration. */
  fromSharedLink: number;
  countries: Tally[];
  referrers: Tally[];
  surfaces: Tally[];
  /** Models a visitor actively selected — defaults and inherited links excluded. */
  modelsChosen: Tally[];
  /** Every model that appeared, chosen or merely arrived with. */
  modelsSeen: Tally[];
  devicesChosen: Tally[];
  precision: Tally[];
  contextBuckets: Tally[];
  concurrencyBuckets: Tally[];
}

const SURFACES: Record<string, string> = {
  "": "VRAM Sizing",
  "index.html": "VRAM Sizing",
  "train.html": "Fine-tune",
  "fit.html": "Task Fit",
  "anatomy.html": "Model Anatomy",
  "compare.html": "Model Compare",
  "decode.html": "Name Decoder",
  "vllm.html": "vLLM Params",
  "learn.html": "LLM 101",
};

export function surfaceOf(urlPath: string): string {
  const file = urlPath.replace(/\/+$/, "").split("/").pop() ?? "";
  return SURFACES[file.endsWith(".html") ? file : ""] ?? "Other";
}

export function modelLabel(hfId: string): string {
  if (!hfId) return "";
  return findKnownByHfId(hfId)?.displayName ?? hfId;
}

export function deviceLabel(id: string): string {
  if (!id) return "";
  return GPUS.find((g) => g.id === id)?.name ?? id;
}

/** Context windows read better in a handful of bands than as 40 distinct values. */
export function contextBucket(tokens: number): string {
  if (tokens <= 8192) return "up to 8k";
  if (tokens <= 32768) return "8k–32k";
  if (tokens <= 131072) return "32k–128k";
  if (tokens <= 524288) return "128k–512k";
  return "512k+";
}

export function concurrencyBucket(n: number): string {
  if (n <= 1) return "single user";
  if (n <= 8) return "2–8";
  if (n <= 32) return "9–32";
  if (n <= 128) return "33–128";
  return "128+";
}

interface Snapshot {
  model: string;
  device: string;
  weightDtype: string;
  context: number;
  concurrency: number;
}

function snapshot(query: string | null): Snapshot {
  const p = new URLSearchParams(query ?? "");
  const num = (v: string | null) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    model: p.get("m") ?? "",
    // The sizing page calls it `g`; the fine-tune and vLLM pages call it `gpu`.
    device: p.get("g") ?? p.get("gpu") ?? "",
    weightDtype: p.get("wd") ?? "",
    context: num(p.get("ctx")),
    concurrency: num(p.get("n")),
  };
}

function rank(counts: Map<string, number>, limit = 10): Tally[] {
  return [...counts.entries()]
    .filter(([label]) => label)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, sessions]) => ({ label, sessions }));
}

/** Count each label at most once per session. */
function counter() {
  const seen = new Map<string, Set<string>>();
  return {
    add(label: string, sessionId: string) {
      if (!label) return;
      const set = seen.get(label) ?? new Set<string>();
      set.add(sessionId);
      seen.set(label, set);
    },
    tally(limit?: number) {
      const counts = new Map<string, number>();
      for (const [label, set] of seen) counts.set(label, set.size);
      return rank(counts, limit);
    },
  };
}

export function buildReport(rows: readonly Row[], defaults: { model: string; device: string }): Report {
  const bySession = new Map<string, Row[]>();
  for (const r of rows) {
    const list = bySession.get(r.session_id) ?? [];
    list.push(r);
    bySession.set(r.session_id, list);
  }

  const countries = counter();
  const referrers = counter();
  const surfaces = counter();
  const modelsChosen = counter();
  const modelsSeen = counter();
  const devicesChosen = counter();
  const precision = counter();
  const contexts = counter();
  const concurrency = counter();

  let engaged = 0;
  let fromSharedLink = 0;
  let earliest = "";
  let latest = "";

  for (const [sessionId, unsorted] of bySession) {
    const events = [...unsorted].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const first = events[0];
    const last = events[events.length - 1];
    if (!earliest || first.created_at < earliest) earliest = first.created_at;
    if (!latest || last.created_at > latest) latest = last.created_at;

    countries.add(first.country ?? "", sessionId);
    referrers.add(first.referrer_domain ?? "", sessionId);
    for (const e of events) surfaces.add(surfaceOf(e.url_path), sessionId);

    const entry = snapshot(first.url_query);
    const final = snapshot(last.url_query);
    if (events.length > 1) engaged++;
    // Arriving on a configuration that is not the app's own default means the
    // link came from someone else.
    if (entry.model && entry.model !== defaults.model) fromSharedLink++;

    modelsSeen.add(modelLabel(final.model), sessionId);
    // A choice is a departure from what they walked in with.
    if (final.model && final.model !== entry.model) modelsChosen.add(modelLabel(final.model), sessionId);
    if (final.device && final.device !== entry.device) devicesChosen.add(deviceLabel(final.device), sessionId);

    if (final.weightDtype) {
      precision.add(DTYPE_LABELS[final.weightDtype as Dtype] ?? final.weightDtype, sessionId);
    }
    if (final.context) contexts.add(contextBucket(final.context), sessionId);
    if (final.concurrency) concurrency.add(concurrencyBucket(final.concurrency), sessionId);
  }

  return {
    from: earliest,
    to: latest,
    sessions: bySession.size,
    events: rows.length,
    engaged,
    fromSharedLink,
    countries: countries.tally(),
    referrers: referrers.tally(),
    surfaces: surfaces.tally(),
    modelsChosen: modelsChosen.tally(),
    modelsSeen: modelsSeen.tally(),
    devicesChosen: devicesChosen.tally(),
    precision: precision.tally(),
    contextBuckets: contexts.tally(),
    concurrencyBuckets: concurrency.tally(),
  };
}
