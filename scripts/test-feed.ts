// Unit test for the news feed's post format. Run: node scripts/test-feed.ts
//
// validatePost() is the gate a post passes twice — in the review tool before it
// is committed, and in the build — so what it accepts is what can go live.
import { readdirSync } from "node:fs";
import { KNOWN_MODELS } from "../src/lib/models.ts";
import { FEED_LIMITS, byNewest, paragraphs, validatePost, type FeedPost } from "../src/lib/feed.ts";
import { FEED_DIR, loadFeed } from "./feedData.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}

const knownModels = new Set(KNOWN_MODELS.map((m) => m.id));
const good: FeedPost = {
  id: "2026-10-08-sample-post",
  published: "2026-10-08T09:30:00Z",
  category: "model",
  en: { title: "A sample post", body: "First paragraph.\n\nSecond paragraph." },
  tr: { title: "Örnek bir post", body: "İlk paragraf.\n\nİkinci paragraf." },
  refs: [{ url: "https://huggingface.co/openai/gpt-oss-120b", title: "Model card", source: "Hugging Face" }],
  tags: ["moe", "gpt-oss"],
  model: "gpt-oss-120b",
};
const errors = (patch: Record<string, unknown>, opts: Partial<Parameters<typeof validatePost>[1]> = {}) =>
  validatePost({ ...structuredClone(good), ...patch }, { knownModels, fileStem: good.id, ...opts });
const rejects = (name: string, patch: Record<string, unknown>, mention: string, opts = {}) => {
  const e = errors(patch, opts);
  check(name, e.some((x) => x.includes(mention)), e.join(" | ") || "accepted");
};

console.log("--- a valid post ---");
check("the sample post is valid", errors({}).length === 0, errors({}).join(" | "));
check("updated, hf and image are optional", errors({ model: undefined }).length === 0);
check("a post may name a Hugging Face repo instead of a bundled model", errors({ model: undefined, hf: "Qwen/Qwen3-Next-80B-A3B-Instruct" }).length === 0);

console.log("\n--- identity and dates ---");
rejects("an id must be dated and lowercase", { id: "Sample Post" }, "id must look like");
rejects("the id must match the file name", {}, "must match the file name", { fileStem: "2026-10-08-other" });
rejects("the id's date must be the published date", { published: "2026-10-09T09:30:00Z" }, "must be the published date");
rejects("published must be UTC ISO 8601", { published: "2026-10-08 09:30" }, "published must be an ISO 8601");
rejects("updated cannot precede published", { updated: "2026-10-07T09:30:00Z" }, "earlier than published");
rejects("the category is a closed set", { category: "gossip" }, "category must be one of");
rejects("an unknown field is refused, not dropped", { draft: true }, 'unknown field "draft"');

console.log("\n--- text ---");
rejects("both languages are required", { tr: undefined }, "tr must hold");
rejects("an empty body is refused", { en: { title: "T", body: "  " } }, "en.body is empty");
rejects("the body has a length limit", { en: { title: "T", body: "x".repeat(FEED_LIMITS.body + 1) } }, "the limit is");
rejects("Turkish letters count as one character each", { tr: { title: "ı".repeat(FEED_LIMITS.title + 1), body: "b" } }, "tr.title is");
check("…so a title at the limit in Turkish letters passes", errors({ tr: { title: "ğ".repeat(FEED_LIMITS.title), body: "b" } }).length === 0);
rejects("the body is plain text", { en: { title: "T", body: "<b>bold</b>" } }, "without HTML");
rejects("links belong in refs, not the body", { en: { title: "T", body: "See https://example.com" } }, "must not carry links");
rejects("a title is one line", { en: { title: "One\nTwo", body: "b" } }, "one line");
check("paragraphs split on blank lines and drop empties", JSON.stringify(paragraphs("a\n\n\n b \n\n")) === JSON.stringify(["a", "b"]));

console.log("\n--- sources ---");
rejects("a post needs at least one source", { refs: [] }, "refs must list");
rejects("and at most three", { refs: [1, 2, 3, 4].map((i) => ({ url: `https://a.example/${i}`, title: "t", source: "s" })) }, "refs must list");
rejects("sources are https", { refs: [{ url: "http://example.com", title: "t", source: "s" }] }, "https address");
rejects("javascript: is not a source", { refs: [{ url: "javascript:alert(1)", title: "t", source: "s" }] }, "https address");
rejects("credentials in a URL are refused", { refs: [{ url: "https://u:p@example.com/", title: "t", source: "s" }] }, "https address");
rejects("a source is listed once", { refs: [good.refs[0], good.refs[0]] }, "repeats");
rejects("a source names its publisher", { refs: [{ url: "https://example.com/", title: "t", source: "" }] }, "source must be");

console.log("\n--- tags, model, image ---");
rejects("tags are lowercase kebab-case", { tags: ["MoE"] }, "lowercase letters");
rejects("tags do not repeat", { tags: ["moe", "moe"] }, "repeat");
rejects("at most five tags", { tags: ["a", "b", "c", "d", "e", "f"] }, "at most");
rejects("model must be a bundled id", { model: "not-a-model" }, "not a bundled model");
rejects("model and hf together are ambiguous", { hf: "openai/gpt-oss-120b" }, "either model or hf");
rejects("hf must be org/name", { model: undefined, hf: "gpt-oss" }, "repo id");
const image = { file: "chart.png", width: 1200, height: 630, alt: { en: "A chart", tr: "Bir grafik" }, credit: "LLMScale" };
check("an image with alt text in both languages and a credit passes", errors({ image }, { mediaExists: () => true }).length === 0);
rejects("an image must exist in the media folder", { image }, "not in the feed's media folder", { mediaExists: () => false });
rejects("an image needs alt text in both languages", { image: { ...image, alt: { en: "A chart" } } }, "image.alt.tr");
rejects("an image needs a credit", { image: { ...image, credit: "" } }, "image.credit");
rejects("an image file name cannot climb out of the folder", { image: { ...image, file: "../secret.png" } }, "image.file must be");
rejects("an image has whole-pixel dimensions", { image: { ...image, width: 12.5 } }, "image.width");

console.log("\n--- order ---");
const a = { ...good, id: "2026-10-08-a", published: "2026-10-08T09:30:00Z" };
const b = { ...good, id: "2026-10-08-b", published: "2026-10-08T09:30:00Z" };
const c = { ...good, id: "2026-10-09-c", published: "2026-10-09T08:00:00Z" };
check("newest first, ties broken by id", [a, c, b].sort(byNewest).map((p) => p.id).join() === "2026-10-09-c,2026-10-08-b,2026-10-08-a");

console.log("\n--- the posts on disk ---");
let published: FeedPost[] = [];
try {
  published = loadFeed(FEED_DIR);
  check(`every post in ${FEED_DIR} is valid`, true, `${published.length} post(s)`);
} catch (e) {
  check(`every post in ${FEED_DIR} is valid`, false, (e as Error).message);
}
check("published post ids are unique", new Set(published.map((p) => p.id)).size === published.length);
const fixtures = loadFeed("scripts/fixtures/feed");
check("the sample posts used for previews are valid", fixtures.length === readdirSync("scripts/fixtures/feed").filter((f) => f.endsWith(".json")).length);
check("the samples cover a memory card, an image and a post without a model",
  fixtures.some((p) => p.model) && fixtures.some((p) => p.image) && fixtures.some((p) => !p.model && !p.hf));

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
