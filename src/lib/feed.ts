import type { Lang } from "./dict";

// The news feed: short posts about LLM releases, serving engines and hardware,
// written in both languages, each pointing at its sources. A post is one JSON
// file in content/feed/; scripts/genFeed.ts turns them into the feed pages at
// build time, so the site still has no backend.
//
// Posts are drafted elsewhere and reach this repository only once approved, so a
// file here is a published post. validatePost() is the one definition of a valid
// post: the build refuses an invalid one, and the review tool that writes these
// files checks against the same function before it commits.

export const FEED_HUB = "feed/";
export const feedPostFile = (id: string) => `feed/${id}.html`;
export const feedRssFile = "feed.xml";
/** Images a post carries are copied from <feed dir>/media/ to feed/media/. */
export const FEED_MEDIA = "feed/media/";

export const FEED_CATEGORIES = ["model", "release", "hardware", "research", "tooling"] as const;
export type FeedCategory = (typeof FEED_CATEGORIES)[number];

export interface FeedText {
  title: string;
  /** Plain text; a blank line starts a new paragraph. No markup or links — sources go in `refs`. */
  body: string;
}

export interface FeedRef {
  url: string;
  title: string;
  /** Who published it, as a reader would name them: "Hugging Face", "vLLM", "arXiv". */
  source: string;
}

export interface FeedImage {
  /** File name under <feed dir>/media/. */
  file: string;
  width: number;
  height: number;
  alt: Record<Lang, string>;
  /** Who made it and under what licence: an image is only used when its licence allows it. */
  credit: string;
}

export interface FeedPost {
  /** `YYYY-MM-DD-slug`: the file name, the page address, and the date it went out. */
  id: string;
  /** ISO 8601 in UTC, e.g. 2026-10-08T09:30:00Z. */
  published: string;
  updated?: string;
  category: FeedCategory;
  en: FeedText;
  tr: FeedText;
  refs: FeedRef[];
  tags: string[];
  /** A bundled model (src/lib/models.ts): the post shows its memory card and links to the calculator. */
  model?: string;
  /** A Hugging Face repo the calculator can read when the model is not bundled. */
  hf?: string;
  image?: FeedImage;
}

export const FEED_LIMITS = {
  title: 100,
  body: 600,
  refs: { min: 1, max: 3 },
  tags: 5,
  source: 40,
  refTitle: 160,
  alt: 200,
  credit: 160,
} as const;

const ID_RE = /^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/;
const TAG_RE = /^[a-z0-9][a-z0-9-]{0,30}$/;
const HF_RE = /^[\w.-]+\/[\w.-]+$/;
const MEDIA_RE = /^[a-z0-9][a-z0-9-]*\.(png|jpe?g|webp|svg)$/;
const KNOWN_KEYS = new Set(["id", "published", "updated", "category", "en", "tr", "refs", "tags", "model", "hf", "image"]);

export interface ValidateOptions {
  /** Ids of the bundled models a post may name in `model`. */
  knownModels: ReadonlySet<string>;
  /** The file's name without `.json`, which must equal the id. */
  fileStem?: string;
  /** Whether <feed dir>/media/<file> exists. Skipped when not given. */
  mediaExists?: (file: string) => boolean;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === "string";
const chars = (s: string) => [...s].length;

/** Every problem with `raw` as a post, in words a reviewer can act on; empty when it is valid. */
export function validatePost(raw: unknown, opts: ValidateOptions): string[] {
  const errs: string[] = [];
  if (!isObj(raw)) return ["a post must be a JSON object"];
  const p = raw;

  for (const k of Object.keys(p)) if (!KNOWN_KEYS.has(k)) errs.push(`unknown field "${k}"`);

  const id = p.id;
  if (!str(id) || !ID_RE.test(id)) errs.push(`id must look like 2026-10-08-short-slug (lowercase, hyphens)`);
  else if (opts.fileStem !== undefined && opts.fileStem !== id) errs.push(`id "${id}" must match the file name "${opts.fileStem}.json"`);

  for (const field of ["published", "updated"] as const) {
    const v = p[field];
    if (v === undefined && field === "updated") continue;
    if (!str(v) || !ISO_UTC_RE.test(v) || Number.isNaN(Date.parse(v))) errs.push(`${field} must be an ISO 8601 UTC time like 2026-10-08T09:30:00Z`);
  }
  if (str(id) && str(p.published) && ID_RE.test(id) && ISO_UTC_RE.test(p.published) && id.slice(0, 10) !== p.published.slice(0, 10)) {
    errs.push(`the id's date ${id.slice(0, 10)} must be the published date ${p.published.slice(0, 10)}`);
  }
  if (str(p.updated) && str(p.published) && Date.parse(p.updated) < Date.parse(p.published)) errs.push("updated is earlier than published");

  if (!str(p.category) || !(FEED_CATEGORIES as readonly string[]).includes(p.category)) {
    errs.push(`category must be one of ${FEED_CATEGORIES.join(", ")}`);
  }

  for (const lang of ["en", "tr"] as const) {
    const t = p[lang];
    if (!isObj(t)) {
      errs.push(`${lang} must hold the post's title and body`);
      continue;
    }
    for (const k of Object.keys(t)) if (k !== "title" && k !== "body") errs.push(`${lang}: unknown field "${k}"`);
    if (!str(t.title) || !t.title.trim()) errs.push(`${lang}.title is empty`);
    else if (chars(t.title) > FEED_LIMITS.title) errs.push(`${lang}.title is ${chars(t.title)} characters; the limit is ${FEED_LIMITS.title}`);
    else if (t.title !== t.title.trim() || /\n/.test(t.title)) errs.push(`${lang}.title must be one line without surrounding spaces`);
    if (!str(t.body) || !t.body.trim()) errs.push(`${lang}.body is empty`);
    else {
      if (chars(t.body) > FEED_LIMITS.body) errs.push(`${lang}.body is ${chars(t.body)} characters; the limit is ${FEED_LIMITS.body}`);
      if (/<[a-z/!]/i.test(t.body)) errs.push(`${lang}.body must be plain text, without HTML`);
      if (/https?:\/\//i.test(t.body)) errs.push(`${lang}.body must not carry links; put sources in refs`);
    }
  }

  const refs = p.refs;
  if (!Array.isArray(refs) || refs.length < FEED_LIMITS.refs.min || refs.length > FEED_LIMITS.refs.max) {
    errs.push(`refs must list ${FEED_LIMITS.refs.min} to ${FEED_LIMITS.refs.max} sources`);
  } else {
    const seen = new Set<string>();
    refs.forEach((r, i) => {
      if (!isObj(r)) return void errs.push(`refs[${i}] must be an object with url, title and source`);
      for (const k of Object.keys(r)) if (!["url", "title", "source"].includes(k)) errs.push(`refs[${i}]: unknown field "${k}"`);
      let url: URL | null = null;
      try {
        url = str(r.url) ? new URL(r.url) : null;
      } catch {
        url = null;
      }
      if (!url || url.protocol !== "https:" || url.username || url.password) errs.push(`refs[${i}].url must be an https address`);
      else if (seen.has(url.href)) errs.push(`refs[${i}].url repeats an earlier source`);
      else seen.add(url.href);
      if (!str(r.title) || !r.title.trim() || chars(r.title) > FEED_LIMITS.refTitle) errs.push(`refs[${i}].title must be 1–${FEED_LIMITS.refTitle} characters`);
      if (!str(r.source) || !r.source.trim() || chars(r.source) > FEED_LIMITS.source) errs.push(`refs[${i}].source must be 1–${FEED_LIMITS.source} characters`);
    });
  }

  const tags = p.tags;
  if (!Array.isArray(tags) || tags.length > FEED_LIMITS.tags) errs.push(`tags must be a list of at most ${FEED_LIMITS.tags}`);
  else {
    tags.forEach((t, i) => {
      if (!str(t) || !TAG_RE.test(t)) errs.push(`tags[${i}] must be lowercase letters, digits and hyphens`);
    });
    if (new Set(tags).size !== tags.length) errs.push("tags repeat");
  }

  if (p.model !== undefined && (!str(p.model) || !opts.knownModels.has(p.model))) errs.push(`model "${String(p.model)}" is not a bundled model id`);
  if (p.hf !== undefined && (!str(p.hf) || !HF_RE.test(p.hf))) errs.push("hf must be a Hugging Face repo id like org/name");
  if (p.model !== undefined && p.hf !== undefined) errs.push("give either model or hf, not both: a bundled model already knows its repo");

  const img = p.image;
  if (img !== undefined) {
    if (!isObj(img)) errs.push("image must be an object");
    else {
      for (const k of Object.keys(img)) if (!["file", "width", "height", "alt", "credit"].includes(k)) errs.push(`image: unknown field "${k}"`);
      if (!str(img.file) || !MEDIA_RE.test(img.file)) errs.push("image.file must be a lowercase file name ending in .png, .jpg, .webp or .svg");
      else if (opts.mediaExists && !opts.mediaExists(img.file)) errs.push(`image.file ${img.file} is not in the feed's media folder`);
      for (const d of ["width", "height"] as const) {
        const n = img[d];
        if (typeof n !== "number" || !Number.isInteger(n) || n < 16 || n > 4096) errs.push(`image.${d} must be a whole number of pixels`);
      }
      const alt = img.alt;
      for (const lang of ["en", "tr"] as const) {
        const a = isObj(alt) ? alt[lang] : undefined;
        if (!str(a) || !a.trim() || chars(a) > FEED_LIMITS.alt) errs.push(`image.alt.${lang} must describe the image in 1–${FEED_LIMITS.alt} characters`);
      }
      if (!str(img.credit) || !img.credit.trim() || chars(img.credit) > FEED_LIMITS.credit) errs.push(`image.credit must name who made it and its licence`);
    }
  }

  return errs;
}

/** Paragraphs of a body, for rendering. */
export const paragraphs = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Newest first; a tie falls back to the id so the order never depends on the file system. */
export const byNewest = (a: FeedPost, b: FeedPost) => b.published.localeCompare(a.published) || b.id.localeCompare(a.id);
