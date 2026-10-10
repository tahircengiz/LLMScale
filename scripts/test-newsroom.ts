// Unit test for the newsroom (newsroom/): parsing, filtering, the store, and the
// screening and writing steps against a stand-in for Claude. No network, no key.
// Run: node scripts/test-newsroom.ts
import { decodeEntities, clip, hfRepoOf, htmlToText, links, normalizeUrl, slugify } from "../newsroom/text.ts";
import { parseFeed, parseHfModels, parseHn } from "../newsroom/feeds.ts";
import { isMajorMinorRelease, passesPrefilter, relevance } from "../newsroom/relevance.ts";
import { collect, select } from "../newsroom/collect.ts";
import { Store, keyOf } from "../newsroom/store.ts";
import { buildPost, engineFigures, gather, screen, write, type Ask, type WriterOutput } from "../newsroom/draft.ts";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import type { Source } from "../newsroom/sources.ts";

// Nothing here may reach the network: a stray fetch fails loudly.
globalThis.fetch = (async () => {
  throw new Error("no network in tests");
}) as typeof fetch;

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

console.log("--- text ---");
check("entities decode, numeric and named", decodeEntities("a &amp; b &#8212; &#x2192; &hellip;") === "a & b — → …");
check("unknown entities stay as they are", decodeEntities("&bogus;") === "&bogus;");
const page = `<html><head><script>alert(1)</script><style>p{}</style></head><body><nav>Home · Blog</nav>
<article><h1>Big release</h1><p>The model has <b>70B</b> parameters.</p><script>track()</script><p>It fits on two GPUs.</p>${"<p>More text here.</p>".repeat(30)}</article><footer>© 2026</footer></body></html>`;
const text = htmlToText(page);
check("page text comes from the <article>", text.startsWith("Big release") && text.includes("70B parameters"), JSON.stringify(text.slice(0, 60)));
check("scripts, styles, nav and footer are gone", !/alert|track\(\)|p\{\}|Home · Blog|© 2026/.test(text));
check("links finds hrefs and bare URLs once each", JSON.stringify(links('<a href="https://a.example/x">x</a> see https://b.example/y. and https://a.example/x')) === JSON.stringify(["https://a.example/x", "https://b.example/y"]));
check("clip cuts at a word and marks it", clip("one two three four five", 12) === "one two …");
check("one URL per page: tracking, www, fragment and trailing slash ignored",
  normalizeUrl("http://www.Example.com/post/?utm_source=x&id=3#top") === normalizeUrl("https://example.com/post?id=3"));
check("slugs fold Turkish letters and keep version numbers", slugify("Qwen3.5 Çıktı: İlk 2.5B model sürümü", 5) === "qwen3-5-cikti-ilk-2-5b-model", slugify("Qwen3.5 Çıktı: İlk 2.5B model sürümü", 5));
check("a model page names its repo", hfRepoOf("https://huggingface.co/openai/gpt-oss-120b") === "openai/gpt-oss-120b");
check("…a blog post does not", hfRepoOf("https://huggingface.co/blog/some-post") === undefined);

console.log("\n--- feeds ---");
const rss = `<rss><channel><title>Blog</title><item><title><![CDATA[Serving MoE models]]></title><link>https://blog.example/moe</link>
<pubDate>Wed, 08 Oct 2026 09:00:00 GMT</pubDate><description><![CDATA[<p>How <b>vLLM</b> serves MoE.</p>]]></description></item></channel></rss>`;
const [r1] = parseFeed(rss);
check("RSS: title from CDATA, link, date, HTML body", r1?.title === "Serving MoE models" && r1.url === "https://blog.example/moe" && r1.published === "2026-10-08T09:00:00.000Z" && r1.content.includes("<b>vLLM</b>"));
const atom = `<feed><entry><id>tag:github.com,2008:Repository/1/v0.31.0</id><updated>2026-10-06T06:49:35Z</updated>
<link rel="alternate" type="text/html" href="https://github.com/vllm-project/vllm/releases/tag/v0.31.0"/><title>v0.31.0</title>
<content type="html">&lt;h2&gt;Highlights&lt;/h2&gt;&lt;p&gt;FP8 KV cache by default&lt;/p&gt;</content></entry></feed>`;
const [a1] = parseFeed(atom);
check("Atom: alternate link, updated date, escaped HTML content", a1?.url.endsWith("/releases/tag/v0.31.0") && a1.published === "2026-10-06T06:49:35.000Z" && a1.content.includes("<p>FP8 KV cache by default</p>"));
const arxiv = `<feed><entry><id>http://arxiv.org/abs/2610.1v1</id><title>Paged KV
  cache for long contexts</title><published>2026-10-08T15:36:56Z</published>
<link href="https://arxiv.org/abs/2610.1v1" rel="alternate" type="text/html"/><link href="https://arxiv.org/pdf/2610.1v1" rel="related" type="application/pdf"/>
<summary>We cut KV cache memory by 4x.</summary></entry></feed>`;
const [x1] = parseFeed(arxiv);
check("arXiv: the abstract page, not the PDF; title on one line", x1?.url === "https://arxiv.org/abs/2610.1v1" && x1.title === "Paged KV cache for long contexts" && x1.content === "We cut KV cache memory by 4x.");
const hf = JSON.stringify([
  { id: "lab/New-Model-32B", likes: 900, downloads: 10, createdAt: "2026-10-07T00:00:00.000Z", tags: ["text-generation", "region:us"] },
  { id: "someone/New-Model-32B-GGUF", likes: 50, createdAt: "2026-10-08T00:00:00.000Z", tags: ["gguf", "base_model:quantized:lab/New-Model-32B"] },
]);
const hfItems = parseHfModels(hf);
check("HF models: quantized copies are left out", hfItems.length === 1 && hfItems[0].hfRepo === "lab/New-Model-32B" && hfItems[0].url === "https://huggingface.co/lab/New-Model-32B");
check("…and region tags do not reach the screener", !hfItems[0].meta?.includes("region:"));
const hn = parseHn(JSON.stringify({ hits: [{ objectID: "1", title: "Running a 70B model on a laptop", url: "https://blog.example/70b", points: 300, num_comments: 120, created_at: "2026-10-08T10:00:00Z" }, { objectID: "2", title: "Ask HN: LLM GPUs?", url: null, points: 90, created_at: "2026-10-08T11:00:00Z" }] }));
check("HN: the story's own URL, or the discussion when there is none", hn[0].url === "https://blog.example/70b" && hn[1].url === "https://news.ycombinator.com/item?id=2");

console.log("\n--- filtering ---");
check("an on-topic post passes the pre-filter", passesPrefilter(relevance("New open-weight MoE model with 30B parameters runs in 24 GB of VRAM with INT4")));
check("\"opensource\" spelled as one word still counts", passesPrefilter(relevance("GLM 5.3 Flash opensource @ the top of the index, 30B MoE")));
check("company news does not", !passesPrefilter(relevance("Company announces new office in London and a hiring push")));
check("release words alone are not enough", !passesPrefilter(relevance("We are excited to announce the launch of our new release")));
check("x.y.0 releases count", isMajorMinorRelease("https://github.com/o/r/releases/tag/v0.31.0") && isMajorMinorRelease("https://github.com/o/r/releases/tag/4.2.0"));
check("patches, candidates and side packages do not",
  !isMajorMinorRelease("https://github.com/o/r/releases/tag/v0.31.1") && !isMajorMinorRelease("https://github.com/o/r/releases/tag/v0.31.0rc1") && !isMajorMinorRelease("https://github.com/o/r/releases/tag/proto-v0.5.0"));
const now = new Date("2026-10-10T08:00:00Z");
const src: Source = { id: "t", name: "T", url: "https://t.example/feed", format: "feed", kind: "blog", take: 2 };
const sel = select(src, [
  { title: "old", url: "https://t.example/1", published: "2026-09-20T00:00:00Z", content: "" },
  { title: "new", url: "https://t.example/2", published: "2026-10-09T00:00:00Z", content: "" },
  { title: "newer", url: "https://t.example/3", published: "2026-10-09T12:00:00Z", content: "" },
  { title: "newest", url: "https://t.example/4", published: "2026-10-10T07:00:00Z", content: "" },
], now, 4);
check("select keeps recent items, newest first, at most `take`", sel.map((i) => i.title).join() === "newest,newer");

console.log("\n--- store ---");
const store = new Store(":memory:");
const base = { title: "t", content: "", source: "S", sourceId: "s", kind: "blog" as const, published: "2026-10-09T00:00:00.000Z", hfRepo: null, meta: null, status: "new" as const };
check("a new URL is recorded", store.addCandidate({ ...base, url: "https://blog.example/a/" }));
check("the same page under another spelling is not", !store.addCandidate({ ...base, url: "http://www.blog.example/a?utm_source=x" }));
check("keys are stable", keyOf("https://blog.example/a") === keyOf("https://blog.example/a/"));

console.log("\n--- collect (stand-in sources) ---");
const feedA = `<rss><channel><item><title>New 32B open-weight MoE model, INT4 fits 24 GB VRAM</title><link>https://lab.example/news/moe</link><pubDate>Thu, 09 Oct 2026 10:00:00 GMT</pubDate><description>Weights on https://huggingface.co/lab/Moe-32B</description></item>
<item><title>Our new office</title><link>https://lab.example/news/office</link><pubDate>Thu, 09 Oct 2026 11:00:00 GMT</pubDate><description>We moved.</description></item></channel></rss>`;
const cstore = new Store(":memory:");
const res = await collect(cstore, {
  now,
  sources: [{ ...src, id: "a", url: "https://a.example/feed", take: 10 }, { ...src, id: "broken", url: "https://broken.example/feed" }],
  fetch: async (u) => {
    if (u.includes("broken")) throw new Error("HTTP 503");
    return feedA;
  },
});
check("one failing source does not stop the others", res.find((r) => r.source === "a")?.added === 2 && res.find((r) => r.source === "broken")?.error === "HTTP 503");
check("off-topic items are remembered but skipped", cstore.candidates("new").length === 1 && cstore.candidates("skipped").length === 1);
const feedLinks = `<rss><channel><item><title>New MoE model weights, INT4 fits 24 GB VRAM</title><link>https://reddit.example/r/x/1</link><pubDate>Thu, 09 Oct 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>See <a href="https://huggingface.co/lab/Moe-32B">the weights</a>.</p>]]></description></item></channel></rss>`;
const lstore = new Store(":memory:");
await collect(lstore, { now, sources: [{ ...src, id: "l", kind: "forum", take: 5 }], fetch: async () => feedLinks });
check("links in an item's markup survive into its stored text", lstore.candidates("new")[0]?.content.includes("- https://huggingface.co/lab/Moe-32B"));
const again = await collect(cstore, { now, sources: [{ ...src, id: "a", url: "https://a.example/feed", take: 10 }], fetch: async () => feedA });
check("a second run adds nothing it has seen", again[0].added === 0);

console.log("\n--- screen (stand-in for Claude) ---");
const sstore = new Store(":memory:");
for (const [i, t] of ["Model A released", "Model A covered by a blog", "Funding news"].entries()) sstore.addCandidate({ ...base, url: `https://s.example/${i}`, title: t });
const [k0, k1, k2] = [0, 1, 2].map((i) => keyOf(`https://s.example/${i}`));
let seenPrompt = "";
const screenAsk: Ask = async (req) => {
  seenPrompt = req.user;
  return { json: { items: [{ key: k0, score: 9, category: "model", reason: "new open model", duplicate_of: "" }, { key: k1, score: 8, category: "model", reason: "same story", duplicate_of: k0 }] }, inputTokens: 100, outputTokens: 20, model: "stand-in" };
};
const sres = await screen(sstore, screenAsk);
check("the screener sees every new item by key", seenPrompt.includes(`key: ${k0}`) && seenPrompt.includes(`key: ${k2}`));
check("a high score is kept", sstore.candidate(k0)?.status === "screened" && sstore.candidate(k0)?.score === 9);
check("a duplicate is rejected even with a high score", sstore.candidate(k1)?.status === "rejected" && sstore.candidate(k1)?.duplicateOf === k0);
check("an item the screener skipped is rejected, not retried forever", sstore.candidate(k2)?.status === "rejected");
check("usage is counted", sres.usage.input === 100 && sres.kept === 1);

console.log("\n--- engine figures ---");
const oss = KNOWN_MODELS.find((m) => m.id === "gpt-oss-120b")!;
const fig = engineFigures(oss.displayName, oss.hfId, oss, oss.maxContext);
check("figures match the feed's memory card", fig.includes("BF16: 240.7 GiB") && fig.includes("Apple M3 Ultra (512GB)") && fig.includes("INT4: 61.21 GiB") && fig.includes("A100 80GB"), fig.split("\n")[2]);
check("…and name the context they assume", fig.includes("one user at 8192 tokens"));

console.log("\n--- gather and build ---");
const cand = { ...base, key: "k", url: "https://huggingface.co/openai/gpt-oss-120b", title: "openai/gpt-oss-120b", kind: "model" as const, hfRepo: "openai/gpt-oss-120b", collectedAt: "", score: 9, category: "model" as const, reason: "new model", duplicateOf: null };
const g = await gather(cand, async (u) => {
  if (u.endsWith("/raw/main/README.md")) return "---\nlicense: apache-2.0\n---\n# gpt-oss-120b\nSee https://openai.com/index/introducing-gpt-oss/ and https://evil.example/x";
  throw new Error("unexpected fetch " + u);
});
check("a model's text is its card, without front matter", g.text.startsWith("# gpt-oss-120b"));
check("a bundled model is recognised and gets its figures", g.knownId === "gpt-oss-120b" && !!g.figures?.includes("240.7 GiB"));
check("allowed links: the item and primary sources, not other hosts", g.allowed.includes("https://huggingface.co/openai/gpt-oss-120b") && g.allowed.includes("https://openai.com/index/introducing-gpt-oss") && !g.allowed.some((u) => u.includes("evil")));

const out: WriterOutput = {
  slug: "gpt-oss-120b one GPU",
  category: "model",
  en: { title: "gpt-oss-120b fits one 80 GB GPU at INT4", body: "OpenAI's gpt-oss-120b routes each token through about 5.1B of its 117B parameters.\n\nAt INT4 it needs 61.21 GiB for one user at 8k context." },
  tr: { title: "gpt-oss-120b INT4'te tek 80 GB GPU'ya sığıyor", body: "OpenAI'ın gpt-oss-120b modeli her token'ı 117B parametresinin yaklaşık 5,1B'lik kısmından geçiriyor.\n\nINT4'te 8k context'te tek kullanıcı için 61,21 GiB istiyor." },
  tags: ["MoE", "gpt oss"],
  refs: [
    { url: "https://huggingface.co/openai/gpt-oss-120b", title: "Model card", source: "Hugging Face" },
    { url: "https://evil.example/x", title: "Click", source: "Evil" },
  ],
  notes: "none",
};
const built = buildPost(out, cand, g, { now, idTaken: (id) => id === "2026-10-10-gpt-oss-120b-one-gpu" });
check("a link the item did not carry is dropped and reported", built.post.refs.length === 1 && built.problems.some((p) => p.includes("evil.example")));
check("an id already taken gets a suffix", built.post.id === "2026-10-10-gpt-oss-120b-one-gpu-2", built.post.id);
check("tags are normalised", built.post.tags.join() === "moe,gpt-oss");
check("the bundled model is attached, so the card shows", built.post.model === "gpt-oss-120b" && built.post.hf === undefined);
check("published is to the second, as posts require", built.post.published === "2026-10-10T08:00:00Z");
check("apart from the dropped link, the post passes the feed's own check", built.problems.length === 1, built.problems.join(" | "));
const hfG = { ...g, knownId: undefined, hfRepo: "Qwen/Qwen3-14B", allowed: ["https://huggingface.co/Qwen/Qwen3-14B"],
  arch: { numParams: 14768307200.4, numLayers: 40, hiddenSize: 5120, numAttentionHeads: 40, numKeyValueHeads: 8, headDim: 128, vocabSize: 151936, maxContext: 40960 } };
const hfPost = buildPost({ ...out, refs: [{ url: "https://huggingface.co/Qwen/Qwen3-14B", title: "Model card", source: "Hugging Face" }] }, { ...cand, url: "https://huggingface.co/Qwen/Qwen3-14B", hfRepo: "Qwen/Qwen3-14B" }, hfG, { now, idTaken: () => false });
check("a model the site does not bundle carries its architecture, so the card shows", hfPost.post.hf === "Qwen/Qwen3-14B" && hfPost.post.arch?.numLayers === 40 && hfPost.post.model === undefined, hfPost.problems.join(" | "));
check("…only the fields the card needs, whole parameter counts", hfPost.post.arch?.numParams === 14768307200 && !("vocabSize" in (hfPost.post.arch ?? {})) && hfPost.problems.length === 0);
const long = buildPost({ ...out, refs: out.refs.slice(0, 1), en: { ...out.en, body: "x ".repeat(400) } }, cand, g, { now, idTaken: () => false });
check("an over-long body is reported, not silently cut", long.problems.some((p) => p.includes("en.body is")));
const none = buildPost({ ...out, refs: [] }, cand, g, { now, idTaken: () => false });
check("with no usable source, the item's own link stands in, flagged", none.post.refs[0].url === "https://huggingface.co/openai/gpt-oss-120b" && none.problems.some((p) => p.includes("no usable source")));

const blogCand = { ...cand, url: "https://simonwillison.net/2026/Oct/6/le-chonk/", kind: "blog" as const, hfRepo: null, title: "Introducing Mistral Large 4" };
const gb = await gather(blogCand, async () => `<html><nav><a href="https://github.com/simonw/llm">llm</a></nav><article><p>Mistral announced <a href="https://mistral.ai/news/mistral-large-4">Mistral Large 4</a> today.</p>${"<p>Text about the model.</p>".repeat(30)}</article></html>`);
check("a blog post's own links are allowed, read from its markup", gb.allowed.includes("https://mistral.ai/news/mistral-large-4"));
check("…but not the site's navigation", !gb.allowed.some((u) => u.includes("github.com/simonw")));
const fetched: string[] = [];
const gl = await gather(blogCand, async (u) => {
  fetched.push(u);
  if (u.includes("mistral.ai")) return `<article><h1>Mistral Large 4</h1><p>1T total parameters, 49B active.</p>${"<p>Details.</p>".repeat(80)}</article>`;
  return `<article><p>Mistral announced <a href="https://mistral.ai/news/mistral-large-4">Mistral Large 4</a>.</p>${"<p>Short note.</p>".repeat(40)}</article>`;
});
check("a short link-blog entry has its primary page read too", fetched.includes("https://mistral.ai/news/mistral-large-4") && gl.text.includes("LINKED PAGE (https://mistral.ai/news/mistral-large-4)") && gl.text.includes("49B active"));
const fetchedLong: string[] = [];
await gather(blogCand, async (u) => {
  fetchedLong.push(u);
  return `<article><p>See <a href="https://mistral.ai/news/x">this</a>.</p>${"<p>A long first-hand write-up with its own measurements and method.</p>".repeat(80)}</article>`;
});
check("…a long first-hand post is read on its own", fetchedLong.length === 1);

console.log("\n--- write (stand-in for Claude) ---");
const wstore = new Store(":memory:");
wstore.addCandidate({ ...base, url: cand.url, title: cand.title, kind: "model", hfRepo: cand.hfRepo, published: "2026-10-09T00:00:00Z" });
wstore.setScreened(keyOf(cand.url), { score: 9, category: "model", reason: "new model", duplicateOf: null, status: "screened" });
wstore.addCandidate({ ...base, url: "https://s.example/stale", published: "2026-09-01T00:00:00Z" });
wstore.setScreened(keyOf("https://s.example/stale"), { score: 9, category: "model", reason: "", duplicateOf: null, status: "screened" });
let writeReq = "";
const writeAsk: Ask = async (req) => {
  writeReq = req.user;
  return { json: { ...out, refs: out.refs.slice(0, 1) }, inputTokens: 1200, outputTokens: 300, model: "stand-in" };
};
const wres = await write(wstore, writeAsk, { now, fetch: async () => "# card" });
const drafts = wstore.drafts("pending");
check("a screened item becomes a pending draft", drafts.length === 1 && wres.results[0].problems === 0);
check("the writer saw the engine's figures and the allowed links", writeReq.includes("ENGINE FIGURES\nModel: gpt-oss 120B") && writeReq.includes("ALLOWED LINKS\n- https://huggingface.co/openai/gpt-oss-120b"));
check("a screened item that waited too long is dropped", wstore.candidate(keyOf("https://s.example/stale"))?.status === "rejected");
const failStore = new Store(":memory:");
failStore.addCandidate({ ...base, url: "https://s.example/f" });
failStore.setScreened(keyOf("https://s.example/f"), { score: 9, category: "research", reason: "", duplicateOf: null, status: "screened" });
await write(failStore, async () => {
  throw new Error("declined (cyber)");
}, { now, fetch: async () => "<p>text</p>" });
const kstore = new Store(":memory:");
for (const u of ["https://s.example/k1", "https://s.example/k2"]) {
  kstore.addCandidate({ ...base, url: u });
  kstore.setScreened(keyOf(u), { score: 9, category: "research", reason: "", duplicateOf: null, status: "screened" });
}
await write(kstore, writeAsk, { now, keys: [keyOf("https://s.example/k2")], fetch: async () => "<p>text</p>" });
check("rewriting one item writes that item only", kstore.candidate(keyOf("https://s.example/k2"))?.status === "drafted" && kstore.candidate(keyOf("https://s.example/k1"))?.status === "screened");
check("a failed write marks the item failed with the reason", failStore.candidate(keyOf("https://s.example/f"))?.status === "failed" && /declined/.test(failStore.candidate(keyOf("https://s.example/f"))?.reason ?? ""));

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
