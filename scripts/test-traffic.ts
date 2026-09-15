// Unit test for the traffic report. Run: node scripts/test-traffic.ts
//
// The thing worth testing is not the counting, it is the two ways the raw data
// lies: one visitor tuning settings emits dozens of rows, and a visitor who
// touched nothing still emits the app's defaults as though they had chosen them.
import { buildReport, contextBucket, concurrencyBucket, surfaceOf, type Row } from "./traffic.ts";

let fails = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fails++;
}
const find = (t: { label: string; sessions: number }[], label: string) =>
  t.find((x) => x.label === label)?.sessions ?? 0;

const DEFAULTS = { model: "Qwen/Qwen2.5-32B-Instruct", device: "h200-141" };
// `extra` overrides rather than appends: URLSearchParams.get returns the FIRST
// occurrence, so a trailing `ctx=32768` used to be shadowed by the `ctx=8192`
// already in the string and the row silently described the wrong state.
const q = (model: string, device: string, extra = "") => {
  const p = new URLSearchParams(`m=${encodeURIComponent(model)}&wd=bf16&kd=fp16&ctx=8192&n=1&g=${device}`);
  for (const [k, v] of new URLSearchParams(extra)) p.set(k, v);
  return p.toString();
};

let clock = 0;
const at = () => `2026-09-05T10:${String(clock++).padStart(2, "0")}:00Z`;
const row = (session: string, query: string, over: Partial<Row> = {}): Row => ({
  session_id: session,
  created_at: at(),
  url_path: "/LLMScale/",
  url_query: query,
  country: "TR",
  ...over,
});

console.log("--- one busy visitor must not outvote a quiet one ---");
// A: lands on defaults, then tries Llama 70B over eight fiddling events.
const busy: Row[] = [row("A", q(DEFAULTS.model, DEFAULTS.device))];
for (let i = 0; i < 8; i++) {
  busy.push(row("A", q("meta-llama/Llama-3.3-70B-Instruct", "b200-192", `ctx=${8192 * (i + 1)}`)));
}
// B: lands on defaults, switches to Mixtral once, leaves.
const quiet: Row[] = [
  row("B", q(DEFAULTS.model, DEFAULTS.device), { country: "DE" }),
  row("B", q("mistralai/Mixtral-8x7B-Instruct-v0.1", "a100-80"), { country: "DE" }),
];
const r1 = buildReport([...busy, ...quiet], DEFAULTS);
check("sessions counted, not events", r1.sessions === 2 && r1.events === 11, `${r1.sessions} sessions / ${r1.events} events`);
check("the busy visitor's model counts once", find(r1.modelsChosen, "Llama 3.3 70B Instruct") === 1);
check("the quiet visitor is not drowned out", find(r1.modelsChosen, "Mixtral 8x7B Instruct") === 1);
check("both countries are represented once", find(r1.countries, "TR") === 1 && find(r1.countries, "DE") === 1);

console.log("\n--- a default is not a choice ---");
// C never touches anything: one event, carrying the defaults.
const idle: Row[] = [row("C", q(DEFAULTS.model, DEFAULTS.device))];
const r2 = buildReport(idle, DEFAULTS);
check("the untouched default model is not credited as chosen", r2.modelsChosen.length === 0, JSON.stringify(r2.modelsChosen));
check("but it is still visible in what was seen", find(r2.modelsSeen, "Qwen2.5 32B Instruct") === 1);
check("a single-event session is not engaged", r2.engaged === 0);
check("and it did not come from a shared link", r2.fromSharedLink === 0);

console.log("\n--- an inherited link is not a choice either ---");
// D arrives on someone else's configuration and changes nothing.
const shared: Row[] = [row("D", q("meta-llama/Llama-3.3-70B-Instruct", "b200-192"))];
const r3 = buildReport(shared, DEFAULTS);
check("arriving on a non-default config is flagged as a shared link", r3.fromSharedLink === 1);
check("the inherited model is not credited as chosen", r3.modelsChosen.length === 0, JSON.stringify(r3.modelsChosen));
check("it still shows in models seen", find(r3.modelsSeen, "Llama 3.3 70B Instruct") === 1);

console.log("\n--- engagement, surfaces and the final state ---");
const mixed: Row[] = [
  row("E", q(DEFAULTS.model, DEFAULTS.device)),
  row("E", q("Qwen/Qwen2.5-72B-Instruct", "mi300x-192", "ctx=131072&n=64"), { url_path: "/LLMScale/train.html" }),
];
const r4 = buildReport(mixed, DEFAULTS);
check("a session that changed something is engaged", r4.engaged === 1);
check("the LAST state is what gets credited", find(r4.modelsChosen, "Qwen2.5 72B Instruct") === 1);
check("the device it ended on is credited", r4.devicesChosen.length === 1, JSON.stringify(r4.devicesChosen));
check("every surface the session touched is counted", find(r4.surfaces, "VRAM Sizing") === 1 && find(r4.surfaces, "Fine-tune") === 1);

console.log("\n--- buckets ---");
check("8192 lands in the first band", contextBucket(8192) === "up to 8k");
check("8193 moves up a band", contextBucket(8193) === "8k–32k");
check("1M lands in the top band", contextBucket(1048576) === "512k+");
check("one user is its own band", concurrencyBucket(1) === "single user");
check("128 is not yet the top band", concurrencyBucket(128) === "33–128" && concurrencyBucket(129) === "128+");

console.log("\n--- surfaces map to their page names ---");
check("the bare path is the sizing page", surfaceOf("/LLMScale/") === "VRAM Sizing");
check("train.html is Fine-tune", surfaceOf("/LLMScale/train.html") === "Fine-tune");
check("an unknown path does not throw", surfaceOf("/LLMScale/nope.html") === "Other");
// Turkish pages are the same surfaces under /tr/; they must not fall into "Other".
check("the Turkish home is the sizing page", surfaceOf("/LLMScale/tr/") === "VRAM Sizing");
check("a Turkish page is its own surface", surfaceOf("/LLMScale/tr/train.html") === "Fine-tune");
check("a model page is a model page", surfaceOf("/LLMScale/models/llama-3.3-70b.html") === "Model pages");
check("the models hub is not the calculator", surfaceOf("/LLMScale/models/") === "Model pages");
check("a Turkish GPU page is a GPU page", surfaceOf("/LLMScale/tr/gpus/rtx4090-24.html") === "GPU pages");
check("a concept guide is a concept page", surfaceOf("/LLMScale/concepts/kv-cache.html") === "Concept pages");

console.log("\n--- the first pageview carries no state ---");
// This is what the real export looks like: the tracker fires once before the app
// has written the URL, so the opening row has an empty query. Treating that as
// the baseline credited every visitor with whatever they ended on.
const bare: Row[] = [row("G", ""), row("G", q(DEFAULTS.model, DEFAULTS.device))];
const r7 = buildReport(bare, DEFAULTS);
check("an empty opening row is not the baseline", r7.modelsChosen.length === 0, JSON.stringify(r7.modelsChosen));
check("the default is still counted as seen", find(r7.modelsSeen, "Qwen2.5 32B Instruct") === 1);
// ...but a real change after that empty row must still register.
const bareThenPick: Row[] = [
  row("H", ""),
  row("H", q(DEFAULTS.model, DEFAULTS.device)),
  row("H", q("meta-llama/Llama-3.3-70B-Instruct", "b200-192")),
];
const r8 = buildReport(bareThenPick, DEFAULTS);
check("a change after the empty row is still a choice", find(r8.modelsChosen, "Llama 3.3 70B Instruct") === 1);

console.log("\n--- a value we put in front of people is never a choice ---");
// Switching from the outgoing default to the current one is the exact behaviour
// that used to be credited, and it is why the metric changed meaning the day the
// default moved. Neither end of that switch is a choice we can claim.
const OLD = { model: "meta-llama/Llama-3.1-8B-Instruct", device: "rtx4090-24" };
const BOTH = [DEFAULTS, OLD];
const switched: Row[] = [
  row("I", q(OLD.model, OLD.device)),
  row("I", q(DEFAULTS.model, DEFAULTS.device)),
];
const r9 = buildReport(switched, BOTH);
check("moving between two defaults is not a choice", r9.modelsChosen.length === 0, JSON.stringify(r9.modelsChosen));
check("but the move itself is still counted", r9.changedModel === 1 && r9.changedDevice === 1);
check("and it is reported as ending on a default", r9.endedOnDefault === 1);
check("the old default is not a shared link", r9.fromSharedLink === 0);
// A genuine departure still lands.
const real: Row[] = [
  row("J", q(OLD.model, OLD.device)),
  row("J", q("Qwen/Qwen2.5-72B-Instruct", "mi300x-192")),
];
const r10 = buildReport(real, BOTH);
check("a real departure is still credited", find(r10.modelsChosen, "Qwen2.5 72B Instruct") === 1);
check("and does not count as ending on a default", r10.endedOnDefault === 0);

console.log("\n--- the empty start needs no filtering ---");
// What a bare visit looks like now: the app writes its workload settings but no
// model and no device, because it has none to write.
const blankQuery = "wd=bf16&kd=fp16&ctx=8192&n=1&ov=0.1";
const passive: Row[] = [row("K", ""), row("K", blankQuery)];
const r11 = buildReport(passive, [DEFAULTS]);
check("a blank arrival is counted", r11.blankStart === 1);
check("touching nothing is not activation", r11.blankActivated === 0);
// This is the row a JS-running crawler leaves behind. It used to arrive carrying
// our hero model and our H200; now it carries no opinion at all.
check("and it contributes no model", r11.modelsChosen.length === 0 && r11.modelsSeen.length === 0);
check("nor a device", r11.devicesChosen.length === 0);
check("a second pageview alone is not engagement", r11.engaged === 0, String(r11.engaged));

// The payoff: picking the model that used to be the default is a real choice
// again, because there is no longer a default it could be confused with.
const blankThenHero: Row[] = [
  row("L", ""),
  row("L", blankQuery),
  row("L", q(DEFAULTS.model, DEFAULTS.device)),
];
const r12 = buildReport(blankThenHero, [DEFAULTS]);
check("the retired default is creditable again", find(r12.modelsChosen, "Qwen2.5 32B Instruct") === 1,
  JSON.stringify(r12.modelsChosen));
check("its device is too", r12.devicesChosen.length === 1, JSON.stringify(r12.devicesChosen));
check("a blank start that picks something is activated", r12.blankActivated === 1);
check("and it is not filed as ending on a default", r12.endedOnDefault === 0);

// A session from before the change still arrives carrying the old default, and
// must still be filtered — otherwise the two eras are not comparable.
const legacy: Row[] = [
  row("M", q(DEFAULTS.model, DEFAULTS.device)),
  row("M", q(DEFAULTS.model, DEFAULTS.device, "ctx=32768")),
];
const r13 = buildReport(legacy, [DEFAULTS]);
check("an old-style arrival is not a blank start", r13.blankStart === 0);
check("and its default is still not a choice", r13.modelsChosen.length === 0, JSON.stringify(r13.modelsChosen));
check("but the visitor did change something", r13.engaged === 1);

// A shared link carries a model on entry, so it is not blank either.
const sharedLink: Row[] = [row("N", q("google/gemma-2-27b-it", "a100-80"))];
const r14 = buildReport(sharedLink, [DEFAULTS]);
check("a shared link is not a blank start", r14.blankStart === 0);
check("and is still recognised as shared", r14.fromSharedLink === 1);

console.log("\n--- the blank metrics belong to the sizing page alone ---");
// Every one of these was counted as "saw the empty calculator and walked away"
// before, which diluted the only number the blank start exists to produce.
const elsewhere: Row[] = [
  row("P", "", { url_path: "/LLMScale/learn.html" }),          // writes no query at all
  row("P", "", { url_path: "/LLMScale/decode.html" }),         // no replaceState anywhere
  row("P", "task=chat", { url_path: "/LLMScale/fit.html" }),   // a query, but no model or device
];
const r15 = buildReport(elsewhere, [DEFAULTS]);
check("a session that never opened the calculator is not a blank arrival", r15.blankStart === 0);
// The denominator has to exclude it too, or the activation rate is computed
// against traffic that could never have activated.
check("nor does it count as a calculator visit", r15.sizingSessions === 0);
check("nor does it count against activation", r15.blankActivated === 0);
check("and reading a page is not engagement", r15.engaged === 0);

// Leaving by the header nav must not erase what the visitor configured. The nav
// is on every page, so this is ordinary browsing.
const wandered: Row[] = [
  row("Q", ""),
  row("Q", blankQuery),
  row("Q", q("meta-llama/Llama-3.3-70B-Instruct", "b200-192")),
  row("Q", "", { url_path: "/LLMScale/decode.html" }),
];
const r16 = buildReport(wandered, [DEFAULTS]);
check("the session counts as a calculator visit", r16.sizingSessions === 1);
check("the settled state survives a trailing nav click", r16.blankActivated === 1);
check("and the model is still credited", find(r16.modelsChosen, "Llama 3.3 70B Instruct") === 1,
  JSON.stringify(r16.modelsChosen));
check("as is the device", find(r16.devicesChosen, "B200 192GB") === 1, JSON.stringify(r16.devicesChosen));

console.log("\n--- a seed only contaminates the page that writes it ---");
// h100-80 is the vLLM helper's own default. On the sizing page it is an
// ordinary card, and listing it globally deleted a very plausible real answer.
const SURFACED = [
  { model: DEFAULTS.model, device: "h200-141", surface: "VRAM Sizing" },
  { model: DEFAULTS.model, device: "h100-80", surface: "vLLM Params" },
];
const sharedThenH100: Row[] = [
  row("R", q("google/gemma-2-27b-it", "b200-192")),
  row("R", q("google/gemma-2-27b-it", "h100-80")),
];
const r17 = buildReport(sharedThenH100, SURFACED);
check("an H100 picked on the sizing page is a real choice",
  find(r17.devicesChosen, "H100 (SXM/PCIe) 80GB") === 1, JSON.stringify(r17.devicesChosen));
// ...but the same value on the page that seeds it is not.
const onVllm: Row[] = [
  row("S", q(DEFAULTS.model, "h100-80").replace("g=", "gpu="), { url_path: "/LLMScale/vllm.html" }),
  row("S", q(DEFAULTS.model, "h100-80").replace("g=", "gpu=") + "&ctx=32768", { url_path: "/LLMScale/vllm.html" }),
];
const r18 = buildReport(onVllm, SURFACED);
check("the vLLM seed is still never a choice", r18.devicesChosen.length === 0,
  JSON.stringify(r18.devicesChosen));
check("and a vLLM visit is not a blank arrival", r18.blankStart === 0);
check("nor a calculator visit", r18.sizingSessions === 0);
// It is still reported as someone taking what we put in front of them — the
// vLLM and fine-tune pages keep their seeds on purpose, so this stays non-zero.
check("it is reported as taking our seed", r18.endedOnDefault === 1);

console.log("\n--- a shared custom architecture is not a blank page ---");
// The Custom tab shares `p`/`L`/... with no model id. The recipient still lands
// on a populated page, so the report must agree with isBlankStart() in the app.
const customLink = "p=7000000000&L=32&h=4096&a=32&k=8&wd=bf16&kd=fp16&ctx=8192&n=1";
const r19 = buildReport([row("T", customLink)], [DEFAULTS]);
check("an architecture without a model id is not a blank arrival", r19.blankStart === 0);
check("it is recognised as someone else's configuration", r19.fromSharedLink === 1);

console.log("\n--- non-production rows are filtered per event, not per session ---");
// Umami derives session_id without the hostname, so a localhost preview and
// real browsing from the same machine share one session id. Dropping the whole
// session would throw away the real half with the noise.
const PROD = "tahircengiz.github.io";
const blended: Row[] = [
  row("U", blankQuery, { hostname: "localhost" }),
  row("U", q("meta-llama/Llama-3.2-1B-Instruct", "rtx3060-12"), { hostname: "localhost" }),
  row("U", blankQuery, { hostname: PROD }),
  row("U", q("google/gemma-2-27b-it", "a100-80"), { hostname: PROD }),
];
const keep = (rs: Row[]) => rs.filter((r) => r.hostname == null || r.hostname === PROD);
const r20 = buildReport(keep(blended), [DEFAULTS]);
check("the real half of a blended session survives",
  find(r20.modelsChosen, "Gemma 2 27B IT") === 1, JSON.stringify(r20.modelsChosen));
check("and the preview half is gone", find(r20.modelsChosen, "Llama 3.2 1B Instruct") === 0);
check("it is still one calculator visit", r20.sizingSessions === 1);
// An export that does not select the column must keep working.
const r21 = buildReport(keep([row("V", blankQuery), row("V", q("google/gemma-2-27b-it", "a100-80"))]), [DEFAULTS]);
check("rows with no hostname are kept", r21.sizingSessions === 1 && r21.blankActivated === 1);

console.log("\n--- degenerate input ---");
const r5 = buildReport([], DEFAULTS);
check("an empty export produces an empty report", r5.sessions === 0 && r5.modelsChosen.length === 0);
const r6 = buildReport([row("F", "")], DEFAULTS);
check("a row with no query does not throw", r6.sessions === 1 && r6.modelsSeen.length === 0);

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
