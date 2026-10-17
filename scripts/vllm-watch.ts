// vLLM release watch (audit phase 4). Report only: changes nothing, schedules nothing.
//
// The sizing mirrors vLLM 0.31.0 — how it lays out and reserves the KV cache, its
// batch and memory defaults, its model classes — and cites the source files it
// follows in src/lib (calc.ts, layers.ts, overhead.ts, vllmSupport.ts, …). A vLLM
// release that changes one of those files can make the figures wrong without any
// test noticing. This compares the pinned version with the latest release on
// GitHub (or any ref) and lists, for each file the code cites plus the audit's
// list, whether it changed, by how many lines, the commits that touched it, and
// which of our files follow it. Model directories added or removed upstream are
// listed too: a new architecture to size, or one vLLM stopped loading.
//
// Run (needs Node and the network; on GTR9):
//   node scripts/vllm-watch.ts                  pinned vs the latest release
//   node scripts/vllm-watch.ts --to main        pinned vs what is on main now (the next release)
//   node scripts/vllm-watch.ts --pinned 0.30.0  another baseline, e.g. to see what 0.31.0 changed
//   node scripts/vllm-watch.ts --exit-code      exit 1 when a watched file changed (for a scheduler)
// The pinned version is the one src/lib cites most ("vLLM 0.31.0"). A run takes about
// four GitHub API requests plus one per changed file. Anonymous requests share 60 an
// hour per IP, which other jobs on the network spend too; with GITHUB_TOKEN set (on
// GTR9: GITHUB_TOKEN=$(gh auth token) node scripts/vllm-watch.ts) the limit is 5,000.
// The token is sent to api.github.com only and never printed. Out of requests, the
// report still lists what changed, without the commits.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

process.on("uncaughtException", (e) => {
  console.error(`vllm-watch: ${e.message}`);
  process.exit(2);
});

const REPO = "vllm-project/vllm";
const API = `https://api.github.com/repos/${REPO}`;
const RAW = `https://raw.githubusercontent.com/${REPO}`;

/** The audit's list (phase 4 brief), beside whatever src/lib cites. A path ending in /
 *  is a directory's own files (not its platform subfolders: amd/, nvidia/, ops/…). */
const ALWAYS = [
  "vllm/v1/kv_cache_interface.py",
  "vllm/v1/core/kv_cache_utils.py",
  "vllm/config/model.py",
  "vllm/config/vllm.py",
  "vllm/config/cache.py",
  "vllm/config/scheduler.py",
  "vllm/engine/arg_utils.py",
  "vllm/v1/worker/gpu_worker.py",
  "vllm/utils/mem_utils.py",
  "vllm/model_executor/models/registry.py",
  "vllm/models/deepseek_v4/",
];
/** Where new model code lands: directories added or removed under them are listed. */
const MODEL_ROOTS = ["vllm/models/"];

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const exitCode = args.includes("--exit-code");

const root = new URL("../", import.meta.url).pathname;
const srcFiles: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(tsx?|js)$/.test(f.name) && f.name !== "dict.ts") srcFiles.push(p);
  }
};
walk(join(root, "src"));
const sources = srcFiles.map((p) => ({ rel: p.slice(root.length), text: readFileSync(p, "utf8") }));

// The pinned version: the one the code cites most.
const cited = new Map<string, number>();
for (const { text } of sources) for (const m of text.matchAll(/vLLM (\d+\.\d+\.\d+)/g)) cited.set(m[1], (cited.get(m[1]) ?? 0) + 1);
const mostCited = [...cited].sort((a, b) => b[1] - a[1])[0]?.[0];
const pinned = (opt("--pinned") ?? mostCited ?? "").replace(/^v/, "");
if (!pinned) throw new Error("no pinned version: pass --pinned x.y.z");
const pinnedTag = `v${pinned}`;

const headers: Record<string, string> = { accept: "application/vnd.github+json", "user-agent": "llmscale-vllm-watch/1.0" };
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
let apiCalls = 0;
class RateLimited extends Error {}
async function api<T>(path: string): Promise<T> {
  apiCalls++;
  const res = await fetch(API + path, { headers: token ? { ...headers, authorization: `Bearer ${token}` } : headers });
  if ((res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    throw new RateLimited(`GitHub's ${token ? "" : "anonymous "}API limit is spent until ${new Date(reset).toISOString().slice(11, 16)} UTC${token ? "" : "; set GITHUB_TOKEN (on GTR9: GITHUB_TOKEN=$(gh auth token))"}`);
  }
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}
async function raw(ref: string, path: string): Promise<string> {
  const res = await fetch(`${RAW}/${ref}/${path}`, { headers: { "user-agent": headers["user-agent"] } });
  if (!res.ok) throw new Error(`raw ${res.status} for ${ref}/${path}`);
  return res.text();
}

const semver = (t: string) => t.replace(/^v/, "").split(".").map((x) => parseInt(x, 10) || 0);
const newer = (a: string, b: string) => {
  const [x, y] = [semver(a), semver(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

type Release = { tag_name: string; published_at: string; prerelease: boolean; draft: boolean };
const releases = (await api<Release[]>("/releases?per_page=40")).filter((r) => !r.prerelease && !r.draft && /^v\d+\.\d+\.\d+$/.test(r.tag_name));
const latest = releases.reduce((a, r) => (newer(r.tag_name, a.tag_name) ? r : a), releases[0]);
const target = opt("--to") ?? latest.tag_name;
const pinnedRelease = releases.find((r) => r.tag_name === pinnedTag);
const since = releases.filter((r) => newer(r.tag_name, pinnedTag)).sort((a, b) => (newer(a.tag_name, b.tag_name) ? 1 : -1));

const out: string[] = [];
const line = (s = "") => out.push(s);
line(`vLLM watch, ${new Date().toISOString().slice(0, 10)}`);
line(`Pinned: ${pinnedTag}${pinnedRelease ? ` (released ${pinnedRelease.published_at.slice(0, 10)})` : ""}; src cites it ${cited.get(pinned) ?? 0} times${cited.size > 1 ? ` (also ${[...cited].filter(([v]) => v !== pinned).map(([v, n]) => `${v} ×${n}`).join(", ")})` : ""}.`);
line(`Latest release: ${latest.tag_name} (${latest.published_at.slice(0, 10)})${since.length ? `; ${since.length} release${since.length === 1 ? "" : "s"} since the pin: ${since.map((r) => r.tag_name).join(", ")}` : ", the pinned one"}.`);

if (target === pinnedTag) {
  line("");
  line(`Up to date: nothing to compare. (\`--to main\` shows what the next release may bring.)`);
  console.log(out.join("\n"));
  process.exit(0);
}
line(`Comparing ${pinnedTag} → ${target}.`);

// Both trees in one request each: every path with its blob hash.
type Tree = { tree: { path: string; type: string; sha: string }[]; truncated: boolean };
const [treeA, treeB] = await Promise.all([api<Tree>(`/git/trees/${pinnedTag}?recursive=1`), api<Tree>(`/git/trees/${encodeURIComponent(target)}?recursive=1`)]);
if (treeA.truncated || treeB.truncated) line("(GitHub truncated a tree listing; some paths may be missing.)");
const blobs = (t: Tree) => new Map(t.tree.filter((e) => e.type === "blob").map((e) => [e.path, e.sha]));
const [a, b] = [blobs(treeA), blobs(treeB)];

// The files the code cites: full vllm/… paths, and bare file names that name one file upstream.
const byName = new Map<string, string[]>();
for (const p of a.keys()) if (p.startsWith("vllm/") && p.endsWith(".py")) byName.set(p.split("/").pop()!, [...(byName.get(p.split("/").pop()!) ?? []), p]);
const citedBy = new Map<string, Set<string>>();
const cite = (path: string, rel: string) => citedBy.set(path, (citedBy.get(path) ?? new Set()).add(rel.replace(/^src\//, "")));
const unresolved = new Set<string>();
for (const { rel, text } of sources) {
  for (const m of text.matchAll(/\bvllm\/[\w/]+\.py\b/g)) cite(m[0], rel);
  for (const m of text.matchAll(/(?<![\w/.])([a-z][a-z0-9_]*\.py)\b/g)) {
    const all = byName.get(m[1]);
    if (!all) {
      unresolved.add(m[1]);
      continue;
    }
    // A name used in several places (qwen3.py is a model and a parser): the model file.
    const models = all.filter((h) => /^vllm\/(model_executor\/models|models)\//.test(h));
    const hits = all.length === 1 ? all : models.length === 1 ? models : [];
    for (const h of hits) cite(h, rel);
  }
}
const watched = new Set<string>([...citedBy.keys()]);
for (const p of ALWAYS) {
  if (!p.endsWith("/")) watched.add(p);
  else for (const q of new Set([...a.keys(), ...b.keys()])) if (q.startsWith(p) && q.endsWith(".py") && !q.slice(p.length).includes("/")) watched.add(q);
}

/** Lines added and removed, as a multiset difference (a count, not a diff). */
function lineDelta(before: string, after: string): [number, number] {
  const count = (s: string) => {
    const m = new Map<string, number>();
    for (const l of s.split("\n")) m.set(l, (m.get(l) ?? 0) + 1);
    return m;
  };
  const [x, y] = [count(before), count(after)];
  let added = 0;
  let removed = 0;
  for (const [l, n] of y) added += Math.max(0, n - (x.get(l) ?? 0));
  for (const [l, n] of x) removed += Math.max(0, n - (y.get(l) ?? 0));
  return [added, removed];
}

type Commit = { sha: string; commit: { message: string; committer: { date: string } } };
const pinnedDate = (await api<Commit>(`/commits/${pinnedTag}`)).commit.committer.date;

// Files our code follows first, then the rest of the audit's list.
const rows = [...watched].sort((x, y) => Number(!citedBy.has(x)) - Number(!citedBy.has(y)) || x.localeCompare(y));
let limited = "";
const changed: string[] = [];
const missing: string[] = [];
const detail: string[] = [];
let same = 0;
for (const p of rows) {
  const [x, y] = [a.get(p), b.get(p)];
  const users = [...(citedBy.get(p) ?? [])].sort();
  const followed = users.length ? `  (followed in ${users.join(", ")})` : "";
  if (!x && !y) {
    missing.push(`  ${p}: in neither tree${followed}`);
    continue;
  }
  if (x === y) {
    same++;
    continue;
  }
  if (!changed.length || (!citedBy.has(p) && citedBy.has(changed[changed.length - 1]))) {
    detail.push(citedBy.has(p) ? "  Followed by src/:" : "  On the audit's list only:");
  }
  changed.push(p);
  let what: string;
  if (!x) what = "added";
  else if (!y) what = "removed";
  else {
    const [add, del] = lineDelta(await raw(pinnedTag, p), await raw(target, p));
    what = `changed +${add} −${del}`;
  }
  detail.push(`    ${what.padEnd(18)} ${p}${followed}`);
  if (limited) continue;
  try {
    const commits = await api<Commit[]>(`/commits?sha=${encodeURIComponent(target)}&path=${encodeURIComponent(p)}&since=${pinnedDate}&per_page=8`);
    for (const c of commits) detail.push(`        ${c.commit.committer.date.slice(0, 10)} ${c.sha.slice(0, 9)} ${c.commit.message.split("\n")[0].slice(0, 110)}`);
    if (commits.length === 8) detail.push(`        … more: https://github.com/${REPO}/commits/${target}/${p}`);
  } catch (e) {
    if (!(e instanceof RateLimited)) throw e;
    limited = (e as Error).message;
  }
}

line("");
line(`Watched: ${rows.length} files (${citedBy.size} cited in src/, the rest from the audit's list); ${changed.length} changed, ${same} the same, ${missing.length} missing.`);
if (detail.length) {
  line("");
  line("Changed (lines are a count of added and removed lines, not a diff):");
  out.push(...detail);
  line(`  Full diff: https://github.com/${REPO}/compare/${pinnedTag}...${target}`);
}
if (missing.length) {
  line("");
  line("Cited but in neither tree (a moved file, or a citation to fix):");
  out.push(...missing);
}

// Model directories added or removed.
const dirs = (m: Map<string, string>, base: string) => new Set([...m.keys()].filter((p) => p.startsWith(base)).map((p) => p.slice(base.length).split("/")[0]).filter((d) => d && !d.endsWith(".py")));
for (const base of MODEL_ROOTS) {
  const [da, db] = [dirs(a, base), dirs(b, base)];
  const added = [...db].filter((d) => !da.has(d));
  const removed = [...da].filter((d) => !db.has(d));
  if (added.length || removed.length) {
    line("");
    line(`${base}: ${added.length ? `added ${added.join(", ")}` : ""}${added.length && removed.length ? "; " : ""}${removed.length ? `removed ${removed.join(", ")}` : ""} — new architectures to size, or ones vLLM no longer loads (vllmSupport.ts).`);
  }
}
const registry = "vllm/model_executor/models/registry.py";
if (a.get(registry) && b.get(registry) && a.get(registry) !== b.get(registry)) {
  const names = (s: string) => new Set([...s.matchAll(/^\s*"(\w+(?:ForCausalLM|ForConditionalGeneration|Model)\w*)"\s*:/gm)].map((m) => m[1]));
  const [ra, rb] = [names(await raw(pinnedTag, registry)), names(await raw(target, registry))];
  const add = [...rb].filter((n) => !ra.has(n));
  const del = [...ra].filter((n) => !rb.has(n));
  if (add.length || del.length) {
    line("");
    line(`Model classes in registry.py: ${add.length ? `added ${add.join(", ")}` : ""}${add.length && del.length ? "; " : ""}${del.length ? `removed ${del.join(", ")}` : ""}.`);
  }
}
if (unresolved.size) {
  line("");
  line(`File names src/ cites that are not in vLLM (Transformers or other repos): ${[...unresolved].sort().join(", ")}.`);
}
line("");
line(changed.length
  ? `Next: read each change against the file that follows it; where vLLM's rule moved, update the sizing, its tests and the "vLLM ${pinned}" citations together.`
  : "No watched file changed.");
if (limited) line(`Commits left out after the API limit: ${limited}.`);
line(`(${apiCalls} GitHub API requests${token ? ", authenticated" : ""}.)`);
console.log(out.join("\n"));
process.exit(exitCode && changed.length ? 1 : 0);
