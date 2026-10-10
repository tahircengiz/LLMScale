// The review panel: where the owner reads each draft as it will appear on the
// site, next to its source, the screener's reason, the writer's notes and any
// problem found — and approves, edits, rejects or has it rewritten. Approving is
// the go-ahead to publish that post; publish.ts takes it from there.
//
//   node newsroom/panel.ts
//
// It runs behind Traefik's single sign-on and is never published on a port. As
// a second lock, Traefik adds a secret header (NEWSROOM_GATE) that the panel
// requires, so another container on the same network cannot reach it directly.
// Without NEWSROOM_GATE it listens on 127.0.0.1 only, for local use.
//
// Server-rendered HTML and plain forms: no framework, no client-side state.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FEED_CATEGORIES, validatePost, type FeedCategory, type FeedPost } from "../src/lib/feed.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import type { Lang } from "../src/lib/dict.ts";
import { article, CSS as FEED_CSS, type RenderCtx } from "../scripts/feedRender.ts";
import { esc, SHELL_CSS, THEME_BOOT } from "../scripts/shell.ts";
import { runAll, runWrite } from "./pipeline.ts";
import { publishPending, type PublishMode } from "./publish.ts";
import { Store, type Draft, type DraftStatus } from "./store.ts";
import type { Ask } from "./draft.ts";

const PORT = Number(process.env.PORT ?? 8080);
const GATE = process.env.NEWSROOM_GATE ?? "";
const MODE = (["off", "local", "live"].includes(process.env.PUBLISH_MODE ?? "") ? process.env.PUBLISH_MODE : "off") as PublishMode;
const REPO = process.env.REPO_DIR ?? fileURLToPath(new URL("..", import.meta.url));
const BRANCH = process.env.PUBLISH_BRANCH ?? "main";
const SITE = process.env.SITE_URL ?? "https://tahircengiz.github.io/LLMScale/";
const DB = process.env.NEWSROOM_DB ?? fileURLToPath(new URL("./data/newsroom.db", import.meta.url));
/** Claude Opus 5.5 list prices, for the running cost estimate: $ per million tokens. */
const PRICE = { input: Number(process.env.PRICE_INPUT ?? 4), output: Number(process.env.PRICE_OUTPUT ?? 20) };

// A token for this process's forms: a form posted from anywhere else fails.
const CSRF = randomBytes(24).toString("hex");
const KNOWN = new Set(KNOWN_MODELS.map((m) => m.id));

// Previews link to the live site, as the published post will; the avatar comes
// from the panel itself, so the page needs nothing from outside to render.
const RC: RenderCtx = {
  base: "/",
  home: SITE,
  href: (lang, file = "") => `${SITE}${lang === "tr" ? "tr/" : ""}${file}`,
  url: (lang, file = "") => `${SITE}${lang === "tr" ? "tr/" : ""}${file}`,
};

const store = new Store(DB);
const FAVICON = readFileSync(fileURLToPath(new URL("../public/favicon.svg", import.meta.url)), "utf8");

// ── background work ───────────────────────────────────────────────────────────
// One thing at a time: a run, a rewrite or a publish. The page says which.
let busy: string | null = null;
let lastNote = "";
async function exclusive(what: string, job: () => Promise<string>): Promise<void> {
  if (busy) return;
  busy = what;
  try {
    lastNote = `${what}: ${await job()}`;
  } catch (e) {
    lastNote = `${what} failed: ${(e as Error).message}`;
  } finally {
    busy = null;
  }
}

async function claude(): Promise<Ask> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) throw new Error("ANTHROPIC_API_KEY is not set");
  const { claudeAsk } = await import("./claude.ts");
  return claudeAsk();
}

// A pass that failed is retried, but not every 30 seconds: a new approval goes
// out at once, a retry of what is already committed waits ten minutes.
let retryAfter = 0;
async function publishTick(): Promise<void> {
  if (busy || MODE === "off") return;
  const fresh = store.drafts("approved").length + store.drafts("withdrawing").length;
  const stuck = MODE === "live" ? store.drafts("committed").length : 0;
  if (!fresh && (!stuck || Date.now() < retryAfter)) return;
  await exclusive("publish", async () => {
    const r = await publishPending(store, { mode: MODE, repoDir: REPO, branch: BRANCH, siteUrl: SITE });
    if (r.error) {
      retryAfter = Date.now() + 10 * 60_000;
      throw new Error(r.error);
    }
    retryAfter = 0;
    return MODE === "live" ? `${r.published.length} published, ${r.withdrawn.length} withdrawn` : `committed locally (local mode); ${r.withdrawn.length} withdrawn`;
  });
}
setInterval(() => void publishTick(), 30_000).unref();

// ── forms ─────────────────────────────────────────────────────────────────────
/** A post from the edit form. Sources are one per line: url | source | title. */
export function postFromForm(base: FeedPost, f: URLSearchParams): FeedPost {
  const refs = (f.get("refs") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [url = "", source = "", ...title] = l.split("|").map((x) => x.trim());
      return { url, source, title: title.join(" | ") };
    });
  const tags = (f.get("tags") ?? "")
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const category = f.get("category") ?? base.category;
  const norm = (s: string | null) => (s ?? "").replace(/\r\n/g, "\n").trim();
  return {
    ...base,
    category: (FEED_CATEGORIES as readonly string[]).includes(category) ? (category as FeedCategory) : base.category,
    en: { title: norm(f.get("en_title")), body: norm(f.get("en_body")) },
    tr: { title: norm(f.get("tr_title")), body: norm(f.get("tr_body")) },
    tags,
    refs,
  };
}

// ── pages ─────────────────────────────────────────────────────────────────────
const PANEL_CSS = `
.wrap{margin:0 auto;padding-inline:1.25rem}
main{padding-block:1.5rem 3rem}
.bar{background:var(--card);border-bottom:1px solid var(--line)}
.bar .wrap,.wrap.wide{max-width:76rem}
.bar .wrap{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem;padding-block:.7rem}
.bar b{font-size:1rem}
.tabs{display:flex;flex-wrap:wrap;gap:.35rem;margin:1rem 0}
.tabs a{border:1px solid var(--line);border-radius:999px;padding:.2rem .75rem;text-decoration:none;color:var(--muted);font-size:.875rem;background:var(--card)}
.tabs a[aria-current=page]{color:var(--brand);border-color:var(--brand)}
.mode{font-size:.78rem;color:var(--faint);margin-left:auto}
.flash{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--brand);border-radius:.6rem;padding:.6rem .85rem;margin:1rem 0;font-size:.9rem}
.dcard{display:grid;grid-template-columns:minmax(0,38rem) minmax(0,1fr);gap:1rem;align-items:start;margin:0 0 1.5rem}
.dcard .stream{margin:0}
@media (max-width:62rem){.dcard{grid-template-columns:1fr}}
.meta{background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:.9rem 1rem;font-size:.875rem}
.meta p{margin:0 0 .5rem;max-width:none}
.meta .k{color:var(--faint);font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;display:block}
.problems{color:var(--bad)}
.problems li{margin:.2rem 0}
.actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
.actions form{margin:0}
.btn{display:inline-block;border:1px solid var(--line);border-radius:.6rem;padding:.4rem .85rem;background:var(--inset);color:var(--text);font:inherit;font-size:.875rem;cursor:pointer;text-decoration:none}
.btn:hover{border-color:var(--brand)}
.btn.primary{background:var(--button,#4a4cd4);border-color:transparent;color:#fff}
.btn:disabled{opacity:.5;cursor:not-allowed}
.edit label{display:block;font-size:.78rem;color:var(--faint);margin:.75rem 0 .25rem}
.edit input,.edit textarea,.edit select{width:100%;font:inherit;font-size:.9rem;color:var(--text);background:var(--inset);border:1px solid var(--line);border-radius:.6rem;padding:.45rem .6rem}
.edit textarea{min-height:9rem;line-height:1.5}
.edit .two{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
@media (max-width:50rem){.edit .two{grid-template-columns:1fr}}
.count{float:right}
.empty{color:var(--faint);padding:2rem 0}
`.trim();

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · Haber masası</title>
<script>${THEME_BOOT}</script>
<style>${SHELL_CSS}
${FEED_CSS}
${PANEL_CSS}</style>
</head>
<body>
<header class="bar"><div class="wrap"><b>LLMScale · Haber masası</b><span class="mode">${modeLine()}</span></div></header>
<main class="wrap wide">
${body}
</main>
<script>document.querySelectorAll("[data-count]").forEach(function(f){var o=document.getElementById(f.getAttribute("data-count"));function u(){o.textContent=[...f.value].length+" / "+f.getAttribute("maxlength")}f.addEventListener("input",u);u()})</script>
</body>
</html>`;
}

function modeLine(): string {
  const mode = { off: "Yayın kapalı: onaylananlar bekler", local: "Yayın modu yerel: onaylananlar commit edilir, siteye gitmez", live: "Yayın modu canlı: onaylanan post ~1 dk içinde sitede" }[MODE];
  return `${mode}${busy ? ` · Şu an: ${busy}…` : ""}`;
}

const TABS: { s: DraftStatus[]; label: string; key: string }[] = [
  { key: "pending", s: ["pending"], label: "Bekleyen" },
  { key: "queue", s: ["approved", "committed", "withdrawing"], label: "Yayın sırası" },
  { key: "published", s: ["published"], label: "Yayında" },
  { key: "rejected", s: ["rejected"], label: "Reddedilen" },
  { key: "withdrawn", s: ["withdrawn"], label: "Geri çekilen" },
];
const STATUS_TR: Record<DraftStatus, string> = { pending: "bekliyor", approved: "onaylandı, sırada", committed: "commit edildi", published: "yayında", rejected: "reddedildi", withdrawing: "geri çekiliyor", withdrawn: "geri çekildi" };

const csrf = `<input type="hidden" name="_csrf" value="${CSRF}">`;
const button = (action: string, label: string, opts: { primary?: boolean; disabled?: boolean; confirm?: string } = {}) =>
  `<form method="post" action="${action}"${opts.confirm ? ` onsubmit="return confirm(${esc(JSON.stringify(opts.confirm))})"` : ""}>${csrf}<button class="btn${opts.primary ? " primary" : ""}"${opts.disabled ? " disabled" : ""}>${label}</button></form>`;

function card(d: Draft, lang: Lang, detail: boolean): string {
  const c = store.candidate(d.candidateKey);
  const post = d.status === "published" || d.status === "committed" ? { ...d.post, id: d.publishedId ?? d.post.id, published: d.publishedAt ?? d.post.published } : d.post;
  const preview = `<div class="stream card">${article(RC, lang, post, { level: 2 })}</div>`;
  const id = encodeURIComponent(d.id);
  const actions =
    d.status === "pending"
      ? [
          button(`/d/${id}/approve`, MODE === "live" ? "Onayla ve yayınla" : "Onayla", { primary: true, disabled: d.problems.length > 0 }),
          detail ? "" : `<a class="btn" href="/d/${id}?lang=${lang}">Düzenle</a>`,
          button(`/d/${id}/rewrite`, "Yeniden yaz", { confirm: "Claude bu haberi yeniden yazsın mı? Bu taslak silinir." }),
          button(`/d/${id}/reject`, "Reddet"),
        ]
      : d.status === "published"
        ? [button(`/d/${id}/withdraw`, "Geri çek", { confirm: "Bu post siteden kaldırılsın mı?" })]
        : d.status === "rejected"
          ? [button(`/d/${id}/restore`, "Beklemeye geri al")]
          : [];
  const cost = (d.inputTokens * PRICE.input + d.outputTokens * PRICE.output) / 1e6;
  const meta = `<div class="meta">
<p><span class="k">Durum</span>${STATUS_TR[d.status]}${d.publishLog ? ` — ${esc(d.publishLog)}` : ""}</p>
<p><span class="k">Kaynak</span>${c ? `${esc(c.source)} · <a href="${esc(c.url)}" rel="noopener noreferrer">${esc(c.title)}</a>` : "—"}</p>
<p><span class="k">Eleme</span>${c?.score ?? "—"}/10${c?.reason ? ` — ${esc(c.reason)}` : ""}</p>
<p><span class="k">Yazarın notu</span>${esc(d.notes || "—")}</p>
${d.problems.length ? `<p><span class="k">Sorunlar (onaydan önce düzeltilmeli)</span></p><ul class="problems">${d.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : `<p><span class="k">Sorunlar</span>yok</p>`}
<p><span class="k">Maliyet</span>${d.inputTokens.toLocaleString("tr-TR")} girdi / ${d.outputTokens.toLocaleString("tr-TR")} çıktı token · ~${cost.toFixed(2).replace(".", ",")} $ (${esc(d.model)})</p>
<p><span class="k">Önizleme dili</span><a href="?lang=tr${detail ? "" : `&s=${tabOf(d.status)}`}">Türkçe</a> · <a href="?lang=en${detail ? "" : `&s=${tabOf(d.status)}`}">English</a></p>
<div class="actions">${actions.join("")}</div>
</div>`;
  return `<section class="dcard" id="${esc(d.id)}">${preview}${meta}</section>`;
}

const tabOf = (s: DraftStatus) => TABS.find((t) => t.s.includes(s))?.key ?? "pending";

function editForm(d: Draft): string {
  const p = d.post;
  const f = (name: string, label: string, value: string, max: number, area = false) =>
    `<label for="${name}">${label} <span class="count" id="${name}_n"></span></label>${
      area
        ? `<textarea id="${name}" name="${name}" maxlength="${max}" data-count="${name}_n">${esc(value)}</textarea>`
        : `<input id="${name}" name="${name}" value="${esc(value)}" maxlength="${max}" data-count="${name}_n">`
    }`;
  return `<form class="edit meta" method="post" action="/d/${encodeURIComponent(d.id)}/save">${csrf}
<div class="two"><div>${f("tr_title", "Başlık (TR)", p.tr.title, 100)}${f("tr_body", "Metin (TR)", p.tr.body, 600, true)}</div>
<div>${f("en_title", "Başlık (EN)", p.en.title, 100)}${f("en_body", "Metin (EN)", p.en.body, 600, true)}</div></div>
<div class="two"><div><label for="category">Kategori</label><select id="category" name="category">${FEED_CATEGORIES.map((c) => `<option${c === p.category ? " selected" : ""}>${c}</option>`).join("")}</select></div>
<div><label for="tags">Etiketler (virgülle)</label><input id="tags" name="tags" value="${esc(p.tags.join(", "))}"></div></div>
<label for="refs">Kaynaklar — her satıra bir tane: url | yayıncı | başlık</label><textarea id="refs" name="refs" style="min-height:6rem">${esc(p.refs.map((r) => `${r.url} | ${r.source} | ${r.title}`).join("\n"))}</textarea>
<div class="actions"><button class="btn primary">Kaydet</button><a class="btn" href="/">Vazgeç</a></div>
</form>`;
}

function listPage(tab: string, lang: Lang, flash: string): string {
  const t = TABS.find((x) => x.key === tab) ?? TABS[0];
  const drafts = t.s.flatMap((s) => store.drafts(s));
  const tabs = TABS.map((x) => `<a href="/?s=${x.key}&lang=${lang}"${x.key === t.key ? ' aria-current="page"' : ""}>${x.label} (${x.s.reduce((n, s) => n + store.drafts(s).length, 0)})</a>`).join("");
  const month = new Date().toISOString().slice(0, 7);
  const spent = store.tokensSince(`${month}-01`);
  const dollars = (spent.input * PRICE.input + spent.output * PRICE.output) / 1e6;
  const runs = store.lastRuns(3).map((r) => `${r.startedAt.slice(0, 16).replace("T", " ")} ${r.step}: ${esc(r.summary ?? "sürüyor")}`).join("<br>");
  const body = `${flash ? `<div class="flash">${esc(flash)}</div>` : ""}${lastNote && !flash ? `<div class="flash">${esc(lastNote)}</div>` : ""}
<nav class="tabs" aria-label="Taslaklar">${tabs}</nav>
${drafts.length ? drafts.map((d) => card(d, lang, false)).join("\n") : `<p class="empty">Burada taslak yok.</p>`}
<section class="meta" style="margin-top:2rem"><p><span class="k">Son çalışmalar</span>${runs || "—"}</p>
<p><span class="k">Bu ay</span>${spent.input.toLocaleString("tr-TR")} girdi / ${spent.output.toLocaleString("tr-TR")} çıktı token · ~${dollars.toFixed(2).replace(".", ",")} $</p>
<div class="actions">${button("/run", "Şimdi topla ve yaz", { disabled: !!busy, confirm: "Haberler şimdi toplanıp Claude'a yazdırılsın mı? (~0,35 $)" })}</div></section>`;
  return layout(t.label, body);
}

function detailPage(d: Draft, lang: Lang, flash: string): string {
  return layout(d.post.tr.title, `${flash ? `<div class="flash">${esc(flash)}</div>` : ""}<p><a href="/?s=${tabOf(d.status)}&lang=${lang}">← Listeye dön</a></p>${card(d, lang, true)}${d.status === "pending" ? editForm(d) : ""}`);
}

// ── http ──────────────────────────────────────────────────────────────────────
function send(res: ServerResponse, status: number, body: string, type = "text/html; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' https:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  });
  res.end(body);
}
const redirect = (res: ServerResponse, to: string) => {
  res.writeHead(303, { location: to, "cache-control": "no-store" });
  res.end();
};
const back = (res: ServerResponse, path: string, msg: string) => redirect(res, `${path}${path.includes("?") ? "&" : "?"}m=${encodeURIComponent(msg)}`);

function gateOk(req: IncomingMessage): boolean {
  if (!GATE) return true;
  const got = Buffer.from(String(req.headers["x-newsroom-gate"] ?? ""));
  const want = Buffer.from(GATE);
  return got.length === want.length && timingSafeEqual(got, want);
}

async function readForm(req: IncomingMessage): Promise<URLSearchParams> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 64 * 1024) throw new Error("form too large");
    chunks.push(c as Buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

export async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://panel");
  if (url.pathname === "/healthz") return send(res, 200, "ok", "text/plain");
  if (url.pathname === "/favicon.svg") return send(res, 200, FAVICON, "image/svg+xml");
  if (!gateOk(req)) return send(res, 403, "forbidden", "text/plain");
  const lang: Lang = url.searchParams.get("lang") === "en" ? "en" : "tr";
  const flash = url.searchParams.get("m") ?? "";

  if (req.method === "GET") {
    if (url.pathname === "/") return send(res, 200, listPage(url.searchParams.get("s") ?? "pending", lang, flash));
    const m = url.pathname.match(/^\/d\/([^/]+)$/);
    const d = m && store.draft(decodeURIComponent(m[1]));
    if (d) return send(res, 200, detailPage(d, lang, flash));
    return send(res, 404, layout("Bulunamadı", `<p class="empty">Böyle bir taslak yok. <a href="/">Listeye dön</a></p>`));
  }
  if (req.method !== "POST") return send(res, 405, "method not allowed", "text/plain");

  // A form from this page carries the token; a cross-site one does not, and says so.
  if (req.headers["sec-fetch-site"] === "cross-site") return send(res, 403, "cross-site form", "text/plain");
  const form = await readForm(req).catch(() => null);
  if (!form || form.get("_csrf") !== CSRF) return back(res, "/", "Form süresi doldu, sayfayı yenileyip tekrar dene.");

  if (url.pathname === "/run") {
    if (busy) return back(res, "/", `Şu an başka bir iş sürüyor: ${busy}.`);
    void exclusive("run", async () => (await runAll(store, await claude())).join(" · "));
    return back(res, "/", "Toplama ve yazım başladı; birkaç dakika sonra sayfayı yenile.");
  }

  const m = url.pathname.match(/^\/d\/([^/]+)\/(approve|reject|restore|rewrite|withdraw|save)$/);
  const d = m && store.draft(decodeURIComponent(m[1]));
  if (!m || !d) return send(res, 404, "not found", "text/plain");
  const [, , action] = m;
  const here = `/d/${encodeURIComponent(d.id)}`;

  switch (action) {
    case "approve": {
      const problems = validatePost(d.post, { knownModels: KNOWN, fileStem: d.post.id });
      if (problems.length || d.problems.length) return back(res, here, "Sorunlar düzeltilmeden onaylanamaz.");
      if (!store.moveDraft(d.id, "pending", "approved", { log: null })) return back(res, "/", "Bu taslak artık beklemede değil.");
      void publishTick();
      return back(res, "/", MODE === "off" ? "Onaylandı; yayın kapalı olduğu için sırada bekleyecek." : MODE === "local" ? "Onaylandı; yerel modda commit edilecek, siteye gitmeyecek." : "Onaylandı; ~1 dakika içinde sitede.");
    }
    case "reject":
      store.moveDraft(d.id, "pending", "rejected");
      return back(res, "/", "Reddedildi.");
    case "restore":
      store.moveDraft(d.id, "rejected", "pending");
      return back(res, "/?s=rejected", "Beklemeye geri alındı.");
    case "withdraw":
      if (!store.moveDraft(d.id, "published", "withdrawing")) return back(res, "/?s=published", "Bu post yayında değil.");
      void publishTick();
      return back(res, "/?s=queue", "Geri çekiliyor; ~1 dakika içinde siteden kalkar.");
    case "rewrite": {
      if (d.status !== "pending") return back(res, "/", "Yalnız bekleyen taslak yeniden yazılabilir.");
      if (busy) return back(res, here, `Şu an başka bir iş sürüyor: ${busy}.`);
      store.deleteDraft(d.id);
      store.setStatus(d.candidateKey, "screened");
      void exclusive("rewrite", async () => runWrite(store, await claude(), { keys: [d.candidateKey] }));
      return back(res, "/", "Yeniden yazılıyor; bir dakika sonra sayfayı yenile.");
    }
    case "save": {
      if (d.status !== "pending") return back(res, here, "Yalnız bekleyen taslak düzenlenebilir.");
      const post = postFromForm(d.post, form);
      const problems = validatePost(post, { knownModels: KNOWN, fileStem: post.id });
      store.updateDraftPost(d.id, post, problems);
      return back(res, here, problems.length ? `Kaydedildi; ${problems.length} sorun var.` : "Kaydedildi; sorun yok.");
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = GATE ? "0.0.0.0" : "127.0.0.1";
  createServer((req, res) => {
    handle(req, res).catch((e) => {
      console.error(e);
      if (!res.headersSent) send(res, 500, "error", "text/plain");
    });
  }).listen(PORT, host, () => console.log(`panel on http://${host}:${PORT} · publish mode ${MODE} · repo ${REPO}`));
}
