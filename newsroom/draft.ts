// Steps two and three: Claude screens the collected items, then writes a post
// for the best few. A written post is checked here before it is stored — by the
// feed's own validatePost(), and against the links the item actually carried —
// and stored as a draft with whatever problems were found, for a person to
// approve, fix or reject.

import { calculate, type Dtype, type ModelArch } from "../src/lib/calc.ts";
import { FEED_CATEGORIES, validatePost, type FeedCategory, type FeedPost } from "../src/lib/feed.ts";
import { GPUS, usableGiB } from "../src/lib/gpus.ts";
import { findKnownByHfId, KNOWN_MODELS } from "../src/lib/models.ts";
import { FEATURED_GPU_IDS } from "../src/lib/staticPages.ts";
import { DEFAULT_STATE } from "../src/lib/urlState.ts";
import { formatGiB, formatParams } from "../src/lib/format.ts";
import { resolveModel } from "../src/lib/hf.ts";
import { fetchText } from "./collect.ts";
import { POST_SCHEMA, SCREEN_SCHEMA, SCREEN_SYSTEM, WRITE_SYSTEM } from "./prompts.ts";
import { PRIMARY_HOSTS } from "./sources.ts";
import type { Candidate, Store } from "./store.ts";
import { clip, hfRepoOf, htmlToText, links, mainHtml, normalizeUrl, slugify } from "./text.ts";

export interface AskRequest {
  system: string;
  user: string;
  schema: object;
  effort: "low" | "medium" | "high";
  maxTokens: number;
}
export interface AskResult {
  json: unknown;
  inputTokens: number;
  outputTokens: number;
  model: string;
}
export type Ask = (req: AskRequest) => Promise<AskResult>;

const isCategory = (s: unknown): s is FeedCategory => typeof s === "string" && (FEED_CATEGORIES as readonly string[]).includes(s);

// ── screening ─────────────────────────────────────────────────────────────────
interface ScreenItem {
  key: string;
  score: number;
  category: string;
  reason: string;
  duplicate_of: string;
}

export function screenPrompt(items: Candidate[]): string {
  return items
    .map((c) =>
      [
        `key: ${c.key}`,
        `source: ${c.source} (${c.kind})`,
        `title: ${c.title}`,
        `published: ${c.published ?? "unknown"}`,
        c.meta ? `meta: ${c.meta}` : "",
        c.content ? `excerpt: ${clip(c.content.replace(/\s+/g, " "), 500)}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n---\n");
}

export async function screen(store: Store, ask: Ask, opts: { minScore?: number; batch?: number } = {}) {
  const { minScore = 7, batch = 40 } = opts;
  const items = store.candidates("new");
  const usage = { input: 0, output: 0 };
  let kept = 0;
  for (let i = 0; i < items.length; i += batch) {
    const chunk = items.slice(i, i + batch);
    const res = await ask({ system: SCREEN_SYSTEM, user: screenPrompt(chunk), schema: SCREEN_SCHEMA, effort: "low", maxTokens: 16000 });
    usage.input += res.inputTokens;
    usage.output += res.outputTokens;
    const scored = new Map(((res.json as { items?: ScreenItem[] }).items ?? []).map((s) => [s.key, s]));
    for (const c of chunk) {
      const s = scored.get(c.key);
      if (!s) {
        store.setStatus(c.key, "rejected", "not scored by the screener");
        continue;
      }
      const score = Math.max(0, Math.min(10, Math.round(Number(s.score) || 0)));
      const dup = s.duplicate_of && s.duplicate_of !== c.key && scored.has(s.duplicate_of) ? s.duplicate_of : null;
      const keep = score >= minScore && !dup;
      if (keep) kept++;
      store.setScreened(c.key, { score, category: isCategory(s.category) ? s.category : null, reason: String(s.reason ?? "").slice(0, 300), duplicateOf: dup, status: keep ? "screened" : "rejected" });
    }
  }
  return { screened: items.length, kept, usage };
}

// ── the engine's figures for a model ──────────────────────────────────────────
const PRECISIONS: Dtype[] = ["bf16", "fp8", "int4"];
const FEATURED = FEATURED_GPU_IDS.map((id) => GPUS.find((g) => g.id === id)!).sort((a, b) => usableGiB(a) - usableGiB(b));
const BIGGEST = GPUS.find((g) => g.id === "b200-192")!;

/** What the feed's memory card will show, in words Claude can quote — so a post
 *  cannot state a figure the card beside it contradicts. */
export function engineFigures(name: string, hfId: string, arch: ModelArch, maxContext?: number): string {
  const ctx = Math.min(8192, maxContext ?? arch.maxContext ?? 8192);
  const lines = PRECISIONS.map((d) => {
    const need = calculate({ arch, weightDtype: d, contextLength: ctx, concurrency: 1, kvDtype: "fp16", overheadPct: DEFAULT_STATE.overheadPct, cudaContextGiB: DEFAULT_STATE.cudaContextGiB }).totalGiB;
    const holder = FEATURED.find((g) => need <= usableGiB(g));
    return `- ${d.toUpperCase()}: ${formatGiB(need)} — ${holder ? `smallest single device that holds it: ${holder.name}` : `no single device holds it; by memory, ${Math.ceil(need / usableGiB(BIGGEST))}× ${BIGGEST.name}`}`;
  });
  const active = arch.activeParams ? `, about ${formatParams(arch.activeParams)} active per token (MoE)` : "";
  return [
    `Model: ${name} (${hfId}), ${formatParams(arch.numParams)} parameters${active}, ${arch.numLayers} layers, max context ${arch.maxContext ?? "unknown"} tokens.`,
    `Memory for one user at ${ctx} tokens of context (FP16 KV cache, 10% overhead, 0.75 GiB CUDA context):`,
    ...lines,
  ].join("\n");
}

// ── writing ───────────────────────────────────────────────────────────────────
export interface WriterOutput {
  slug: string;
  category: string;
  en: { title: string; body: string };
  tr: { title: string; body: string };
  tags: string[];
  refs: { url: string; title: string; source: string }[];
  notes: string;
}

export interface Gathered {
  text: string;
  allowed: string[];
  hfRepo?: string;
  knownId?: string;
  figures?: string;
}

const isPrimary = (u: string) => {
  try {
    const h = new URL(u).hostname.replace(/^www\./, "");
    return PRIMARY_HOSTS.some((p) => h === p || h.endsWith(`.${p}`));
  } catch {
    return false;
  }
};

/** The text Claude writes from, the links a post may cite, and the model it is about. */
export async function gather(c: Candidate, fetch: (url: string) => Promise<string> = fetchText): Promise<Gathered> {
  let text = c.content;
  let pageLinks: string[] = [];
  try {
    if (c.kind === "model" && c.hfRepo) {
      const card = await fetch(`https://huggingface.co/${c.hfRepo}/raw/main/README.md`);
      text = card.replace(/^---[\s\S]*?\n---\s*/, "");
    } else if (c.kind === "blog" || (c.kind === "forum" && c.sourceId === "hn")) {
      const html = await fetch(c.url);
      text = htmlToText(html);
      pageLinks = links(mainHtml(html));
    }
  } catch {
    /* keep what the feed gave us */
  }
  const found = [...links(`${c.content}\n${text}`), ...pageLinks].filter(isPrimary).filter((u, i, all) => all.indexOf(u) === i);
  const hfRepo = c.hfRepo ?? found.map(hfRepoOf).find(Boolean);
  // A forum post is a pointer: read the primary page it points to as well.
  if (c.kind === "forum" && found[0]) {
    try {
      text = `${text}\n\nLINKED PAGE (${found[0]}):\n${clip(htmlToText(await fetch(found[0])), 6000)}`;
    } catch {
      /* the post alone will do */
    }
  }
  const allowed = [c.url, ...(hfRepo ? [`https://huggingface.co/${hfRepo}`] : []), ...found]
    .map((u) => normalizeUrl(u))
    .filter((u, i, all) => all.indexOf(u) === i)
    .slice(0, 6);

  const known = hfRepo ? findKnownByHfId(hfRepo) : undefined;
  let figures: string | undefined;
  if (known) figures = engineFigures(known.displayName, known.hfId, known, known.maxContext);
  else if (hfRepo) {
    const r = await resolveModel(hfRepo).catch(() => null);
    if (r?.arch && r.arch.numParams > 0) figures = engineFigures(hfRepo, hfRepo, r.arch, r.arch.maxContext);
  }
  return { text: clip(text, 12_000), allowed, hfRepo, knownId: known?.id, figures };
}

export function writePrompt(c: Candidate, g: Gathered): string {
  return [
    "ITEM",
    `Source: ${c.source} (${c.kind})`,
    `Title: ${c.title}`,
    `URL: ${c.url}`,
    `Published: ${c.published ?? "unknown"}`,
    ...(c.reason ? [`Screener's note: ${c.reason}`] : []),
    "",
    "ALLOWED LINKS",
    ...g.allowed.map((u) => `- ${u}`),
    "",
    "ENGINE FIGURES",
    g.figures ?? "none",
    "",
    "SOURCE TEXT",
    "<<<",
    g.text || "(the feed gave no text beyond the title)",
    ">>>",
  ].join("\n");
}

/** ISO time to the second, as posts carry it. */
export const isoSecond = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

/** A post from the writer's reply, with every problem found on the way. Links
 *  the item did not carry are dropped, never trusted. */
export function buildPost(out: WriterOutput, c: Candidate, g: Gathered, ctx: { now: Date; idTaken: (id: string) => boolean }): { post: FeedPost; problems: string[] } {
  const problems: string[] = [];
  const allowed = new Set(g.allowed.map((u) => normalizeUrl(u)));
  const refs: FeedPost["refs"] = [];
  for (const r of out.refs ?? []) {
    let norm: string | null = null;
    try {
      norm = normalizeUrl(r.url);
    } catch {
      norm = null;
    }
    if (!norm || !allowed.has(norm)) {
      problems.push(`dropped a link the item did not carry: ${r.url}`);
      continue;
    }
    if (refs.some((x) => normalizeUrl(x.url) === norm) || refs.length >= 3) continue;
    refs.push({ url: norm, title: String(r.title ?? "").trim(), source: String(r.source ?? "").trim() });
  }
  if (!refs.length) {
    refs.push({ url: normalizeUrl(c.url), title: c.title, source: c.source });
    problems.push("the writer cited no usable source; the item's own link was used");
  }

  const day = isoSecond(ctx.now).slice(0, 10);
  const base = `${day}-${slugify(out.slug || out.en?.title || c.title) || "post"}`;
  let id = base;
  for (let n = 2; ctx.idTaken(id); n++) id = `${base}-${n}`;

  const tags = [...new Set((out.tags ?? []).map((t) => slugify(String(t), 4)).filter(Boolean))].slice(0, 5);
  const category = isCategory(out.category) ? out.category : (c.category ?? "model");
  const post: FeedPost = {
    id,
    published: isoSecond(ctx.now),
    category,
    en: { title: String(out.en?.title ?? "").trim(), body: String(out.en?.body ?? "").trim() },
    tr: { title: String(out.tr?.title ?? "").trim(), body: String(out.tr?.body ?? "").trim() },
    refs,
    tags,
    ...(g.knownId ? { model: g.knownId } : g.hfRepo && g.figures ? { hf: g.hfRepo } : {}),
  };
  problems.push(...validatePost(post, { knownModels: new Set(KNOWN_MODELS.map((m) => m.id)), fileStem: id }));
  return { post, problems };
}

export async function write(
  store: Store,
  ask: Ask,
  opts: { minScore?: number; maxDrafts?: number; maxAgeDays?: number; now?: Date; fetch?: (url: string) => Promise<string>; keys?: string[] } = {}
) {
  const { minScore = 7, maxDrafts = 4, maxAgeDays = 7, now = new Date(), fetch = fetchText, keys } = opts;
  const usage = { input: 0, output: 0 };
  const results: { key: string; id?: string; problems?: number; error?: string }[] = [];
  // Screened items wait for a slot; one that waited too long is no longer news.
  for (const c of store.candidates("screened")) {
    if (c.published && Date.parse(c.published) < now.getTime() - maxAgeDays * 86_400_000) store.setStatus(c.key, "rejected", "stale before it was written up");
  }
  const queue = keys ? keys.map((k) => store.candidate(k)).filter((c): c is Candidate => !!c) : store.toWrite(minScore, maxDrafts);
  for (const c of queue) {
    try {
      const g = await gather(c, fetch);
      const res = await ask({ system: WRITE_SYSTEM, user: writePrompt(c, g), schema: POST_SCHEMA, effort: "medium", maxTokens: 16000 });
      usage.input += res.inputTokens;
      usage.output += res.outputTokens;
      const out = res.json as WriterOutput;
      const { post, problems } = buildPost(out, c, g, { now, idTaken: (id) => store.hasDraftId(id) });
      store.addDraft({ id: post.id, candidateKey: c.key, post, problems, notes: String(out.notes ?? ""), model: res.model, inputTokens: res.inputTokens, outputTokens: res.outputTokens });
      store.setStatus(c.key, "drafted");
      results.push({ key: c.key, id: post.id, problems: problems.length });
    } catch (e) {
      store.setStatus(c.key, "failed", `writing failed: ${(e as Error).message}`.slice(0, 300));
      results.push({ key: c.key, error: (e as Error).message });
    }
  }
  return { results, usage };
}
