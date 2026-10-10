// Test for the newsroom's publishing (newsroom/publish.ts) and review panel
// (newsroom/panel.ts). Publishing runs real git against throwaway repositories —
// a bare one stands in for GitHub — with the build and deploy steps stubbed.
// The panel is started on a free local port. No network beyond 127.0.0.1.
// Run: node scripts/test-panel.ts
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store, keyOf } from "../newsroom/store.ts";
import { finalPost, publishPending, runCommand, type Runner } from "../newsroom/publish.ts";
import type { FeedPost } from "../src/lib/feed.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + JSON.stringify(detail) : ""}`);
  if (!cond) fails++;
}

for (const [k, v] of Object.entries({ GIT_AUTHOR_NAME: "test", GIT_AUTHOR_EMAIL: "test@example.invalid", GIT_COMMITTER_NAME: "test", GIT_COMMITTER_EMAIL: "test@example.invalid" })) process.env[k] = v;
const sh = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, stdio: "pipe" }).toString().trim();

const post = (id: string, title = "A sample post"): FeedPost => ({
  id,
  published: `${id.slice(0, 10)}T09:00:00Z`,
  category: "model",
  en: { title, body: "First paragraph.\n\nSecond paragraph." },
  tr: { title: `${title} (TR)`, body: "İlk paragraf.\n\nİkinci paragraf." },
  refs: [{ url: "https://huggingface.co/openai/gpt-oss-120b", title: "Model card", source: "Hugging Face" }],
  tags: ["moe"],
});
function seed(store: Store, id: string, title?: string) {
  const url = `https://example.com/${id}`;
  store.addCandidate({ url, title: id, content: "", source: "S", sourceId: "s", kind: "blog", published: "2026-10-09T00:00:00Z", hfRepo: null, meta: null, status: "drafted" });
  store.addDraft({ id, candidateKey: keyOf(url), post: post(id, title), problems: [], notes: "none", model: "stand-in", inputTokens: 1000, outputTokens: 500 });
}

// A remote, a checkout of it on main with content/feed, and a runner that does
// git for real and records the build and deploy steps instead of running them.
const root = mkdtempSync(join(tmpdir(), "newsroom-test-"));
const remote = join(root, "remote.git");
const repo = join(root, "repo");
execFileSync("git", ["init", "-q", "--bare", "-b", "main", remote]);
execFileSync("git", ["clone", "-q", remote, repo], { stdio: "pipe" });
mkdirSync(join(repo, "content/feed"), { recursive: true });
writeFileSync(join(repo, "content/feed/README.md"), "posts\n");
sh(repo, "checkout", "-q", "-B", "main");
sh(repo, "add", "-A");
sh(repo, "commit", "-q", "-m", "init");
sh(repo, "push", "-q", "origin", "main");
const steps: string[] = [];
const runner: Runner = async (cmd, args, opts) => {
  if (cmd === "git") return runCommand(cmd, args, opts);
  steps.push(`${cmd} ${args.join(" ")}`);
  return { code: 0, out: "" };
};
const now = new Date("2026-10-11T05:00:00Z");

console.log("--- the post as it goes out ---");
const fp = finalPost({ post: post("2026-10-09-mistral-large-4") } as Parameters<typeof finalPost>[0], now, (id) => id === "2026-10-11-mistral-large-4");
check("it is dated the day it is published, and its id stays unique", fp.id === "2026-10-11-mistral-large-4-2" && fp.published === "2026-10-11T05:00:00Z", fp.id);

console.log("\n--- publishing, mode off ---");
const store = new Store(join(root, "db.sqlite"));
seed(store, "2026-10-09-first-post", "First post");
store.moveDraft("2026-10-09-first-post", "pending", "approved");
let r = await publishPending(store, { mode: "off", repoDir: repo, branch: "main", siteUrl: "https://site.example/", run: runner }, now);
check("off: nothing is written and the approval waits", r.published.length === 0 && store.draft("2026-10-09-first-post")?.status === "approved" && readdirSync(join(repo, "content/feed")).length === 1);

console.log("\n--- publishing, mode local ---");
r = await publishPending(store, { mode: "local", repoDir: repo, branch: "main", siteUrl: "https://site.example/", run: runner }, now);
const local = store.draft("2026-10-09-first-post");
check("local: the post is committed under its publish-day id", local?.status === "committed" && local.publishedId === "2026-10-11-first-post" && existsSync(join(repo, "content/feed/2026-10-11-first-post.json")), JSON.stringify(r));
check("…as valid feed JSON, published at the moment it went out", JSON.parse(readFileSync(join(repo, "content/feed/2026-10-11-first-post.json"), "utf8")).published === "2026-10-11T05:00:00Z");
check("…the site is built to prove it still builds, and nothing is deployed", steps.some((s) => s === "npm run build") && !steps.some((s) => s.startsWith("npx gh-pages")));
check("…and nothing leaves the machine", sh(remote, "log", "--oneline", "main").split("\n").length === 1);
check("the commit says what went out", sh(repo, "log", "-1", "--format=%s") === "Publish news: First post");

console.log("\n--- publishing, mode live ---");
seed(store, "2026-10-10-second-post", "Second post");
store.moveDraft("2026-10-10-second-post", "pending", "approved");
// Someone pushed to main in the meantime: local commits must land on top of it.
const other = join(root, "other");
execFileSync("git", ["clone", "-q", remote, other], { stdio: "pipe" });
writeFileSync(join(other, "README.md"), "changed elsewhere\n");
sh(other, "add", "-A");
sh(other, "commit", "-q", "-m", "elsewhere");
sh(other, "push", "-q", "origin", "main");
steps.length = 0;
r = await publishPending(store, { mode: "live", repoDir: repo, branch: "main", siteUrl: "https://site.example/", run: runner }, now);
check("live: the post committed earlier and the new one both go out", r.published.length === 2 && !r.error, JSON.stringify(r));
check("…both marked published with their address", store.draft("2026-10-10-second-post")?.status === "published" && store.draft("2026-10-09-first-post")?.publishLog === "https://site.example/feed/2026-10-11-first-post.html");
check("…on top of what main gained meanwhile", sh(remote, "log", "--format=%s", "main").split("\n").join(" | ") === "Publish news: Second post | Publish news: First post | elsewhere | init");
check("…and the site is deployed", steps.some((s) => s.startsWith("npx gh-pages -d dist")));

console.log("\n--- withdrawing ---");
store.moveDraft("2026-10-09-first-post", "published", "withdrawing");
r = await publishPending(store, { mode: "live", repoDir: repo, branch: "main", siteUrl: "https://site.example/", run: runner }, now);
check("a withdrawn post's file is removed and the removal deployed", store.draft("2026-10-09-first-post")?.status === "withdrawn" && !existsSync(join(repo, "content/feed/2026-10-11-first-post.json")) && sh(remote, "log", "-1", "--format=%s", "main").startsWith("Withdraw news: First post"));

console.log("\n--- a failed deploy ---");
seed(store, "2026-10-10-third-post", "Third post");
store.moveDraft("2026-10-10-third-post", "pending", "approved");
const failing: Runner = async (cmd, args, opts) => (cmd === "npx" ? { code: 1, out: "remote rejected" } : runner(cmd, args, opts));
r = await publishPending(store, { mode: "live", repoDir: repo, branch: "main", siteUrl: "https://site.example/", run: failing }, now);
check("is reported, and the post stays committed for the next attempt", !!r.error && store.draft("2026-10-10-third-post")?.status === "committed" && /deploy failed/.test(store.draft("2026-10-10-third-post")?.publishLog ?? ""), r.error);
store.close();

console.log("\n--- the panel ---");
const dbFile = join(root, "panel.sqlite");
const pstore = new Store(dbFile);
seed(pstore, "2026-10-10-pending-one", "Pending one");
seed(pstore, "2026-10-10-pending-two", "Pending two");
seed(pstore, "2026-10-10-pending-three", "<script>alert(1)</script>");
pstore.close();
process.env.NEWSROOM_DB = dbFile;
process.env.NEWSROOM_GATE = "gate-secret";
process.env.PUBLISH_MODE = "off";
const { handle } = await import("../newsroom/panel.ts");
const server: Server = createServer((req, res) => void handle(req, res));
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
const gate = { "x-newsroom-gate": "gate-secret" };
const get = (path: string, headers: Record<string, string> = gate) => fetch(base + path, { headers, redirect: "manual" });
const post_ = (path: string, form: Record<string, string>, headers: Record<string, string> = gate) =>
  fetch(base + path, { method: "POST", headers: { ...headers, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form).toString(), redirect: "manual" });

check("without the gate header the panel refuses", (await get("/", {})).status === 403);
check("…the health check answers regardless", (await get("/healthz", {})).status === 200);
const home = await (await get("/")).text();
check("the list shows pending drafts rendered as feed posts", home.includes("Pending one (TR)") && home.includes('class="post"') && home.includes("Bekleyen (3)"));
const token = home.match(/name="_csrf" value="([0-9a-f]+)"/)?.[1] ?? "";
check("forms carry a token", token.length === 48);
let res = await post_("/d/2026-10-10-pending-one/approve", {});
check("a form without the token does nothing", res.status === 303 && decodeURIComponent(res.headers.get("location") ?? "").includes("Form süresi doldu"));
res = await post_("/d/2026-10-10-pending-one/approve", { _csrf: token }, { ...gate, "sec-fetch-site": "cross-site" });
check("a cross-site form is refused", res.status === 403);
res = await post_("/d/2026-10-10-pending-one/save", { _csrf: token, en_title: "Edited title", en_body: "x ".repeat(400), tr_title: "Başlık", tr_body: "Metin.", category: "research", tags: "MoE, kv-cache", refs: "https://huggingface.co/openai/gpt-oss-120b | Hugging Face | Model card" });
const detail = await (await get("/d/2026-10-10-pending-one")).text();
check("an edit is saved and re-checked", detail.includes("Edited title") && detail.includes("en.body is"));
res = await post_("/d/2026-10-10-pending-one/approve", { _csrf: token });
check("a draft with problems cannot be approved", decodeURIComponent(res.headers.get("location") ?? "").includes("Sorunlar düzeltilmeden onaylanamaz"));
await post_("/d/2026-10-10-pending-one/save", { _csrf: token, en_title: "Edited title", en_body: "Short and fine.", tr_title: "Başlık", tr_body: "Metin.", category: "research", tags: "MoE, kv-cache", refs: "https://huggingface.co/openai/gpt-oss-120b | Hugging Face | Model card" });
res = await post_("/d/2026-10-10-pending-one/approve", { _csrf: token });
const after = new Store(dbFile);
check("once fixed, it is approved", after.draft("2026-10-10-pending-one")?.status === "approved" && after.draft("2026-10-10-pending-one")?.post.tags.join() === "moe,kv-cache", decodeURIComponent(res.headers.get("location") ?? ""));
await post_("/d/2026-10-10-pending-two/reject", { _csrf: token });
check("a rejected draft leaves the queue", after.draft("2026-10-10-pending-two")?.status === "rejected");
await post_("/d/2026-10-10-pending-two/restore", { _csrf: token });
check("…and can be brought back", after.draft("2026-10-10-pending-two")?.status === "pending");
const page = await (await get("/")).text();
check("text from a draft is escaped, never markup", !page.includes("<script>alert") && page.includes("&lt;script&gt;alert(1)"));
after.close();
server.close();

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
