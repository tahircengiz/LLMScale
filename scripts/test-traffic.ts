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
const q = (model: string, device: string, extra = "") =>
  `m=${encodeURIComponent(model)}&wd=bf16&kd=fp16&ctx=8192&n=1&g=${device}${extra ? "&" + extra : ""}`;

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

console.log("\n--- degenerate input ---");
const r5 = buildReport([], DEFAULTS);
check("an empty export produces an empty report", r5.sessions === 0 && r5.modelsChosen.length === 0);
const r6 = buildReport([row("F", "")], DEFAULTS);
check("a row with no query does not throw", r6.sessions === 1 && r6.modelsSeen.length === 0);

console.log(fails === 0 ? "\nALL PASS ✅" : `\n${fails} FAILURE(S) ❌`);
process.exit(fails === 0 ? 0 : 1);
