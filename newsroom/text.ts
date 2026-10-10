// Text helpers for the newsroom: feed markup and web pages into plain text, and
// the small normalisations that let two copies of one story be told apart.
// No dependencies — feeds and pages are messy, but what Claude needs from them is
// readable text, not a faithful DOM.

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©", reg: "®", trade: "™" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

/** CDATA sections hold their text verbatim; everything else is entity-encoded. */
export const unwrapCdata = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

/** Readable text from a web page or an HTML fragment: the <article> or <main>
 *  when there is one, without scripts, styles, navigation or footers, with block
 *  boundaries kept as line breaks. */
export function htmlToText(html: string): string {
  let s = html.replace(/<!--[\s\S]*?-->/g, " ");
  const main = s.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ?? s.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (main && main.length > 400) s = main;
  s = s
    .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|section|article|li|ul|ol|h[1-6]|tr|table|blockquote|pre|figure|figcaption)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(s)
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Every absolute http(s) link in an HTML fragment or in plain text, in order, once each. */
export function links(s: string): string[] {
  const found = [
    ...[...s.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => decodeEntities(m[1])),
    ...[...s.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)].map((m) => m[0]),
  ];
  const out: string[] = [];
  for (const raw of found) {
    try {
      const u = new URL(raw.replace(/[.,;:]+$/, ""));
      if ((u.protocol === "https:" || u.protocol === "http:") && !out.includes(u.href)) out.push(u.href);
    } catch {
      /* not a URL */
    }
  }
  return out;
}

/** At most `n` characters, cut at a word, marked when cut. */
export function clip(s: string, n: number): string {
  const chars = [...s];
  if (chars.length <= n) return s;
  const cut = chars.slice(0, n).join("");
  const at = cut.lastIndexOf(" ");
  return `${cut.slice(0, at > n * 0.5 ? at : n)} …`;
}

/** One URL for one page: no tracking parameters, fragment or trailing slash, lowercase host. */
export function normalizeUrl(raw: string): string {
  const u = new URL(raw);
  u.hash = "";
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref$|ref_src$|source$|fbclid$|gclid$)/i.test(k)) u.searchParams.delete(k);
  if (u.protocol === "http:" && !/^(localhost|127\.)/.test(u.hostname)) u.protocol = "https:";
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.href;
}

const TR_FOLD: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u" };
/** A file-name slug from a headline: lowercase ASCII words joined by hyphens. */
export function slugify(s: string, maxWords = 6): string {
  return s
    .replace(/[çğıİöşü]/g, (c) => TR_FOLD[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/(\d)\.(\d)/g, "$1-$2")
    .replace(/\./g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join("-");
}

/** The Hugging Face repo a URL points at, if it is a model page: huggingface.co/org/name. */
export function hfRepoOf(raw: string): string | undefined {
  try {
    const u = new URL(raw);
    if (u.hostname.replace(/^www\./, "") !== "huggingface.co") return undefined;
    const [org, name, ...rest] = u.pathname.split("/").filter(Boolean);
    const reserved = ["blog", "datasets", "spaces", "docs", "papers", "collections", "models", "api", "organizations", "posts", "learn", "tasks"];
    if (!org || !name || reserved.includes(org) || (rest.length && !["tree", "blob", "resolve", "discussions"].includes(rest[0]))) return undefined;
    return `${org}/${name}`;
  } catch {
    return undefined;
  }
}
