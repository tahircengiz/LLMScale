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
// Defaults WERE the trap. A visitor who did nothing still emitted the default
// model and device, indistinguishable from someone who chose them on purpose —
// and so did every crawler that runs JavaScript. The app now opens on nothing,
// which removes the ambiguity at the source rather than filtering it out here.
//
// Both eras land in the same export, so the rule is decided per session: one
// that arrived carrying neither a model nor a device saw the empty page, and
// everything it ends on is a real choice. One that arrived carrying a value the
// app used to open on is still filtered against the list of past defaults.
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
  /** The host the browser reported. Umami hashes `session_id` without it, so a
   *  localhost preview and real browsing from the same machine land under the
   *  SAME session id — filtering has to happen per event, before anything is
   *  aggregated per session. See `keepHost` in report-traffic.ts. */
  hostname?: string | null;
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
  /** Sessions that moved off whatever model was put in front of them. */
  changedModel: number;
  /** Sessions that moved off the device that was put in front of them. */
  changedDevice: number;
  /** Sessions that ended on a model we had chosen for them. */
  endedOnDefault: number;
  /** Sessions that arrived on a link carrying someone else's configuration. */
  fromSharedLink: number;
  /** Sessions that opened the calculator at all. The honest denominator for the
   *  two figures below: vllm.html and train.html still seed a model and a
   *  device, so total sessions mixes surfaces that can never arrive blank. */
  sizingSessions: number;
  /** Sessions that arrived on the empty page — no model, no device, nothing ours. */
  blankStart: number;
  /** Of those, the ones that went on to pick a model or a device. */
  blankActivated: number;
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

/** The only surface that opens on nothing. vllm.html and train.html still seed
 *  a model and a device, so the blank-start metrics do not describe them. */
export const SIZING_SURFACE = "VRAM Sizing";

export function surfaceOf(urlPath: string): string {
  // The generated guides live in folders of their own (scripts/genPages.ts). Their
  // hubs end in a slash, which the filename rule below would read as the calculator.
  if (/\/models\/[^/]*$/.test(urlPath)) return "Model pages";
  if (/\/gpus\/[^/]*$/.test(urlPath)) return "GPU pages";
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
  /** A hand-entered architecture, shared without a Hugging Face id. The Custom
   *  tab calls `onModel("", arch, …)`, so such a link carries `p`/`L`/`h`/… and
   *  no `m` — the recipient still lands on a populated page, which is the
   *  opposite of a blank arrival even though there is no model id to show. */
  hasArch: boolean;
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
    hasArch: p.has("p") && p.has("L"),
  };
}

/** Whether a row's query carries any of the state `snapshot` reads.
 *
 *  A row that carries none of it describes no configuration: the very first
 *  pageview before the app has booted, every decode.html and learn.html view
 *  (they write no query at all), and fit.html, whose `task` parameter snapshot
 *  does not read. Such a row must not be taken as a session's entry or as what
 *  it settled on — doing so let a trailing nav click erase a whole session's
 *  configuration. */
function carriesState(query: string | null): boolean {
  const s = snapshot(query);
  return Boolean(s.model || s.device || s.hasArch || s.weightDtype || s.context || s.concurrency);
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

/**
 * Every configuration the app has ever opened on, newest first. A report can
 * span a change of default — this one already does — so "did they arrive on
 * someone else's link?" has to be asked against all of them, not just today's.
 * Otherwise every visitor from before the change is counted as a shared link.
 */
export interface DefaultState {
  model: string;
  device: string;
  /** Which page opened on this pair, as `surfaceOf` names it. A seed can only
   *  contaminate the page that writes it: `h100-80` is the vLLM helper's own
   *  default, but on the sizing page it is an ordinary card someone chose.
   *  Omit to match every surface (only sensible for a value no page seeds). */
  surface?: string;
}

export function buildReport(rows: readonly Row[], defaults: DefaultState | DefaultState[]): Report {
  const knownDefaults = Array.isArray(defaults) ? defaults : [defaults];

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
  let sizingSessions = 0;
  let blankStart = 0;
  let blankActivated = 0;
  let changedModel = 0;
  let changedDevice = 0;
  let endedOnDefault = 0;
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

    // A session's entry and its settled state are the first and last events that
    // actually carry configuration — not its first and last rows.
    //
    // At the front: the very first pageview fires before the app has written
    // anything, so its query is empty. Taking it as the baseline made every
    // session look like it had chosen whatever it ended on, visitors who
    // touched nothing included.
    //
    // At the back: decode.html and learn.html write no query at all and
    // fit.html writes only `task`, so taking the literal last row threw the
    // whole configuration away whenever someone finished by clicking a nav
    // link — and the nav is on every page.
    const stateful = events.filter((e) => carriesState(e.url_query));
    const baseline = stateful[0] ?? first;
    const settled = stateful[stateful.length - 1] ?? last;
    const entry = snapshot(baseline.url_query);
    const final = snapshot(settled.url_query);
    // Which page the settled state came from. It decides whether a seeded
    // default could be responsible for it — see `isOurs` below.
    const settledSurface = surfaceOf(settled.url_path);
    const isOurs = (pick: (d: DefaultState) => string, value: string) =>
      knownDefaults.some(
        (d) => pick(d) === value && (!d.surface || d.surface === settledSurface)
      );
    // Not "more than one row": the app rewrites the URL as soon as it boots, so
    // even a visitor who touches nothing produces a second pageview. Engagement
    // is a state that actually moved.
    if (
      final.model !== entry.model ||
      final.device !== entry.device ||
      final.weightDtype !== entry.weightDtype ||
      final.context !== entry.context ||
      final.concurrency !== entry.concurrency
    ) {
      engaged++;
    }

    // Only the sizing page opens on nothing, so only it can produce a blank
    // arrival. Scoping this matters: learn.html and decode.html write no query
    // and fit.html writes only `task`, so without the filter every LLM-101
    // reader counted as someone who saw the empty calculator and walked away,
    // and the activation rate — the one number this measurement exists to
    // produce — was diluted by traffic that never opened the calculator.
    const onSizing = events.filter((e) => surfaceOf(e.url_path) === SIZING_SURFACE);
    const sizingStateful = onSizing.filter((e) => carriesState(e.url_query));
    const sizingEntry = snapshot(sizingStateful[0]?.url_query ?? null);
    const sizingFinal = snapshot(sizingStateful[sizingStateful.length - 1]?.url_query ?? null);
    // A crawler that renders the page once and leaves has no stateful row at
    // all, which is exactly a blank arrival that never activated.
    if (onSizing.length > 0) sizingSessions++;
    const blankOnSizing =
      onSizing.length > 0 && !sizingEntry.model && !sizingEntry.device && !sizingEntry.hasArch;
    if (blankOnSizing) {
      blankStart++;
      if (sizingFinal.model || sizingFinal.device) blankActivated++;
    }

    // The exclusion list is bypassed only for a value that was settled on the
    // sizing page by a session that opened it blank: nothing was put in front
    // of that visitor, so nothing they ended on can be our own default. A
    // session that drifts on to vllm.html or train.html is settling on a page
    // that still seeds, so those values stay filtered.
    const startedBlank = blankOnSizing && settledSurface === SIZING_SURFACE;
    // Arriving on a configuration that matches none of the app's own defaults
    // means the link came from someone else. An architecture with no model id
    // is one too: the app never seeds one, so it can only have been shared.
    const arrivedOnSomeoneElses = entry.model
      ? !knownDefaults.some((d) => d.model === entry.model)
      : entry.hasArch;
    if (arrivedOnSomeoneElses) fromSharedLink++;


    modelsSeen.add(modelLabel(final.model), sessionId);
    if (final.model && final.model !== entry.model) changedModel++;
    if (final.device && final.device !== entry.device) changedDevice++;

    // A value we put in front of people is never credited as a choice, even when
    // the session technically moved onto it. 60% of sessions end on whatever the
    // app opened with, and a deliberate pick of that value is indistinguishable
    // from inertia. Excluding every default — past ones too — also keeps the
    // metric stable when the default moves: otherwise changing it silently
    // reclassifies the same visitor behaviour and makes periods incomparable.
    // Matched per surface: `h100-80` is the vLLM helper's seed, but a visitor
    // who picks an H100 80GB on the sizing page chose it, and listing it
    // globally silently deleted one of the most plausible real answers from
    // the report.
    const modelIsOurs = !startedBlank && isOurs((d) => d.model, final.model);
    const deviceIsOurs = !startedBlank && isOurs((d) => d.device, final.device);
    if (final.model && modelIsOurs) endedOnDefault++;
    if (final.model && final.model !== entry.model && !modelIsOurs) {
      modelsChosen.add(modelLabel(final.model), sessionId);
    }
    if (final.device && final.device !== entry.device && !deviceIsOurs) {
      devicesChosen.add(deviceLabel(final.device), sessionId);
    }

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
    changedModel,
    changedDevice,
    endedOnDefault,
    fromSharedLink,
    sizingSessions,
    blankStart,
    blankActivated,
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
