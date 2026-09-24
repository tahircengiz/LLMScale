import { useEffect, useMemo, useRef, useState } from "react";
import type { ModelArch } from "../lib/calc";
import { resolveModel, type ArchSource } from "../lib/hf";
import { configFromArch, explainConfig, lineCited, type Answer, type ConfigReport, type ExplainedField, type Part, type QuestionId } from "../lib/configExplain";
import { FIELD_GROUPS, GROUP_LABEL, GROUP_NOTE, type FieldGroup } from "../lib/configGlossary";
import { useLang } from "../lib/i18n";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Badge, Card, Segmented } from "../components/ui";

/** Starting points that between them show every kind of answer the page gives:
 *  GQA, MLA with FP8 and experts, MXFP4 with a sliding window, a hybrid with linear
 *  attention, a vision model, and a gated repo read from the built-in database. */
const EXAMPLES: { id: string; label: string }[] = [
  { id: "Qwen/Qwen3-32B", label: "Qwen3 32B" },
  { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek-V3" },
  { id: "openai/gpt-oss-20b", label: "gpt-oss 20B" },
  { id: "Qwen/Qwen3-Next-80B-A3B-Instruct", label: "Qwen3-Next 80B-A3B" },
  { id: "Qwen/Qwen2.5-VL-7B-Instruct", label: "Qwen2.5-VL 7B" },
  { id: "meta-llama/Llama-3.1-8B-Instruct", label: "Llama 3.1 8B" },
];

const QUESTIONS: QuestionId[] = ["kind", "size", "context", "kvcache", "attention", "experts", "precision", "vocab", "load", "training"];

type Filter = "all" | "serving" | "unexplained";

interface Loaded {
  id: string;
  // Configs are free-form JSON.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cfg: any | null;
  rebuilt: boolean;
  gated: boolean;
  source: ArchSource;
  baseModel?: string;
  numParams: number;
  arch: ModelArch | null;
  meta: ResolvedMeta;
}

function initialHfId(): string {
  return typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("m") ?? "";
}

/** A sentence with its **figure** set in bold. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((s, i) =>
        i % 2 ? (
          <strong key={i} className="font-semibold text-white">
            {s}
          </strong>
        ) : (
          s
        ),
      )}
    </>
  );
}

/** A value short enough for a chip: objects and long lists collapse to a bracket. */
function chipValue(raw: string): string {
  if (raw.length <= 26) return raw;
  if (raw.startsWith("{")) return "{…}";
  if (raw.startsWith("[")) return "[…]";
  return raw.slice(0, 25) + "…";
}

/** The themed focus ring every control on this page carries (DESIGN.md: indigo). */
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const rowId = (path: string) => "cfg-" + path.replace(/[^a-zA-Z0-9_-]/g, "-");
const covers = (cites: readonly string[], path: string) => cites.some((c) => path === c || path.startsWith(c + "."));
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function ConfigPage() {
  const { t, lang } = useLang();
  const [hfId, setHfId] = useState(initialHfId);
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  // What the pointer or keyboard focus is on, and what a click has pinned. The file
  // lights up whatever is under the pointer, falling back to the pinned answer.
  const [hover, setHover] = useState<string[] | null>(null);
  const [pinned, setPinned] = useState<{ key: string; cites: string[] } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  // Bumped by "Try again" to re-run the fetch for the same model.
  const [attempt, setAttempt] = useState(0);
  const active = hover ?? pinned?.cites ?? [];

  useEffect(() => {
    if (!hfId) return;
    let alive = true;
    setLoading(true);
    setHover(null);
    setPinned(null);
    resolveModel(hfId)
      .then((r) => {
        if (!alive) return;
        const rebuilt = !r.cfg && r.source === "bundled" && !!r.arch;
        setData({
          id: hfId,
          cfg: r.cfg ?? (rebuilt && r.arch ? configFromArch(r.arch) : null),
          rebuilt,
          gated: r.gated,
          source: r.source,
          baseModel: r.info?.baseModel,
          numParams: r.numParams,
          arch: r.arch,
          meta: {
            source: r.source,
            gated: r.gated,
            modelType: r.modelType,
            isMoE: r.isMoE,
            tags: r.tags,
            pipelineTag: r.pipelineTag,
            weightDtype: r.weightDtype,
            kvDtype: r.kvDtype,
            warningKey: r.warningKey,
          },
        });
      })
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [hfId, attempt]);

  // The model lives in the address, so a reading can be shared as a link.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = hfId ? `?m=${encodeURIComponent(hfId).replace(/%2F/g, "/")}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${q}`);
  }, [hfId]);

  const report = useMemo<ConfigReport | null>(
    () =>
      data?.cfg
        ? explainConfig({ cfg: data.cfg, lang, numParams: data.numParams, rebuilt: data.rebuilt, isMoE: data.meta.isMoE })
        : null,
    [data, lang],
  );

  /** Jump to a field's plain-language row and pin its lines in the file. */
  function focusField(path: string) {
    setPinned({ key: `field:${path}`, cites: [path] });
    setFlash(path);
    window.setTimeout(() => setFlash((f) => (f === path ? null : f)), 1400);
    const row = document.getElementById(rowId(path));
    row?.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    // Move focus with the view, so the next Tab continues from the field and a
    // screen reader reads where the reader landed.
    row?.focus({ preventScroll: true });
  }

  const current = data && data.id === hfId ? data : null;

  return (
    <div>
      <p className="mb-5 max-w-2xl text-sm text-slate-400">{t("config.subtitle")}</p>

      <Card className="relative z-30 p-3">
        <ModelPicker
          hfId={hfId}
          arch={current?.arch ?? null}
          meta={current?.meta ?? null}
          hideCustom
          compact
          onModel={(id) => {
            if (id) setHfId(id);
          }}
        />
      </Card>

      {!hfId ? (
        <EmptyState onPick={setHfId} />
      ) : loading && !current ? (
        <Loading id={hfId} />
      ) : current && report ? (
        <div className={"transition-opacity duration-200 " + (loading ? "opacity-50" : "opacity-100")}>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-start">
            <div className="flex min-w-0 flex-col gap-3 lg:col-span-7">
              <Portrait data={current} report={report} onRetry={() => setAttempt((n) => n + 1)} />
              <Answers
                report={report}
                active={active}
                pinnedKey={pinned?.key}
                onHover={setHover}
                onPin={(key, cites) => setPinned((p) => (p?.key === key ? null : { key, cites }))}
                onField={focusField}
              />
            </div>
            <div className="min-w-0 lg:sticky lg:top-3 lg:col-span-5">
              <button
                type="button"
                onClick={() => setShowJson((s) => !s)}
                aria-expanded={showJson}
                className="w-full rounded-xl bg-ink-850 px-3 py-2 text-left text-sm font-medium text-slate-200 ring-1 ring-control transition outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
              >
                {showJson ? t("config.json.hide") : t("config.json.show", { n: report.lines.length })}
              </button>
              <div className={(showJson ? "mt-3 block" : "hidden") + " lg:mt-0 lg:block"}>
                <JsonPane data={current} report={report} active={active} onLine={focusField} />
              </div>
            </div>
          </div>
          <Fields report={report} active={active} flash={flash} onHover={setHover} />
        </div>
      ) : (
        <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-slate-300">{t("config.source.none")}</p>
          <RetryButton onRetry={() => setAttempt((n) => n + 1)} />
        </Card>
      )}
    </div>
  );
}

// ── empty and loading states ────────────────────────────────────────────────

function EmptyState({ onPick }: { onPick: (id: string) => void }) {
  const { t } = useLang();
  return (
    <Card className="mt-3 p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-white">{t("config.empty.title")}</h2>
      <p className="mt-1 text-sm text-slate-400">{t("config.empty.try")}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onPick(ex.id)}
            className={FOCUS + " rounded-lg bg-ink-850 px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-control transition hover:bg-white/5 hover:text-white"}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-sm text-slate-400">{t("config.empty.preview")}</p>
        <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {QUESTIONS.map((q) => (
            <li key={q} className="text-sm font-medium text-slate-200">
              {t(`config.q.${q}`)}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function Loading({ id }: { id: string }) {
  const { t } = useLang();
  return (
    <Card className="mt-3 p-5" >
      <p className="text-sm text-slate-400" role="status">
        {t("config.loading", { id })}
      </p>
      <div className="mt-4 space-y-2.5" aria-hidden="true">
        {[92, 78, 85, 60].map((wd, i) => (
          <div key={i} className="h-3 animate-pulse rounded-full bg-ink-800" style={{ width: `${wd}%` }} />
        ))}
      </div>
    </Card>
  );
}

// ── the answer, in plain words ─────────────────────────────────────────────

function useSay() {
  const { t } = useLang();
  return (parts: Part[]) => parts.map((p) => t(`config.a.${p.k}`, p.v)).join(" ");
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onRetry}
      className={FOCUS + " shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-control transition hover:bg-white/5 hover:text-white"}
    >
      {t("config.retry")}
    </button>
  );
}

function Portrait({ data, report, onRetry }: { data: Loaded; report: ConfigReport; onRetry: () => void }) {
  const { t, lang } = useLang();
  const say = useSay();
  const home = import.meta.env.BASE_URL + (lang === "tr" ? "tr/" : "");
  const q = `?m=${encodeURIComponent(data.id).replace(/%2F/g, "/")}`;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold tracking-tight text-white">{t("config.portrait.title")}</h2>
        <span className="min-w-0 truncate font-mono text-xs text-slate-400">{data.id}</span>
      </div>
      {data.source === "base" && data.baseModel && (
        <p className="mt-3 rounded-xl bg-ink-850 px-3 py-2 text-xs leading-relaxed text-slate-300 ring-1 ring-white/10">
          {t("config.source.base", { base: data.baseModel })}
        </p>
      )}
      {data.rebuilt && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/30">
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-warn">
            {t(data.gated ? "config.source.bundled" : "config.source.bundledFailed")}
          </p>
          {!data.gated && <RetryButton onRetry={onRetry} />}
        </div>
      )}
      {report.portrait.length > 0 && (
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-slate-300">
          <Rich text={say(report.portrait)} />
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`${home}${q}`}
          className={FOCUS + " rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-onbrand shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"}
        >
          {t("config.link.size")}
        </a>
        <a
          href={`${home}anatomy.html${q}`}
          className={FOCUS + " rounded-xl px-3 py-1.5 text-sm font-medium text-slate-300 ring-1 ring-control transition hover:bg-white/5 hover:text-white"}
        >
          {t("config.link.anatomy")}
        </a>
      </div>
    </Card>
  );
}

function Answers({
  report,
  active,
  pinnedKey,
  onHover,
  onPin,
  onField,
}: {
  report: ConfigReport;
  active: string[];
  pinnedKey?: string;
  onHover: (cites: string[] | null) => void;
  onPin: (key: string, cites: string[]) => void;
  onField: (path: string) => void;
}) {
  const { t } = useLang();
  const values = useMemo(() => new Map(report.fields.map((f) => [f.path, f.raw])), [report]);
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5 pb-2 pt-4">
        <h2 className="text-base font-semibold tracking-tight text-white">{t("config.answers.title")}</h2>
        <span className="text-xs text-slate-400">{t("config.answers.hint")}</span>
      </div>
      <dl className="divide-y divide-white/5">
        {report.answers.map((a) => (
          <AnswerRow
            key={a.id}
            a={a}
            values={values}
            lit={a.cites.length > 0 && a.cites.every((c) => active.includes(c))}
            pinned={pinnedKey === `answer:${a.id}`}
            onHover={onHover}
            onPin={onPin}
            onField={onField}
          />
        ))}
      </dl>
    </Card>
  );
}

function AnswerRow({
  a,
  values,
  lit,
  pinned,
  onHover,
  onPin,
  onField,
}: {
  a: Answer;
  values: Map<string, string>;
  lit: boolean;
  pinned: boolean;
  onHover: (cites: string[] | null) => void;
  onPin: (key: string, cites: string[]) => void;
  onField: (path: string) => void;
}) {
  const { t } = useLang();
  const say = useSay();
  const enter = () => onHover(a.cites);
  const leave = () => onHover(null);
  return (
    <div
      onMouseEnter={enter}
      onMouseLeave={leave}
      className={
        "px-5 py-4 transition-colors duration-150 " +
        // Pinned is a selection: ring and fill, as DESIGN.md's selected card. Hover
        // is only the fill, so the two never look alike.
        (pinned ? "bg-brand-600/10 ring-2 ring-inset ring-brand-500" : lit ? "bg-brand-600/10" : "hover:bg-white/[0.03]")
      }
    >
      <dt className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={pinned}
          onClick={() => onPin(`answer:${a.id}`, a.cites)}
          onFocus={enter}
          onBlur={leave}
          className="rounded-md text-left text-sm font-semibold tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {t(`config.q.${a.id}`)}
        </button>
        {a.tone === "warn" && <Badge tone="warn">{t("config.caution")}</Badge>}
      </dt>
      <dd className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-slate-300 tabular-nums">
        <Rich text={say(a.parts)} />
      </dd>
      {a.working.length > 0 && (
        <dd className="mt-2.5 flex gap-2 rounded-lg bg-ink-850/70 px-2.5 py-1.5 ring-1 ring-white/5">
          <span className="shrink-0 pt-px text-[11px] font-medium uppercase tracking-wide text-slate-500">{t("config.working")}</span>
          <span className="min-w-0 space-y-0.5 font-mono text-[11px] leading-relaxed text-slate-300 tabular-nums">
            {a.working.map((wk) => (
              <span key={wk.k} className="block break-words">
                {t(`config.a.${wk.k}`, wk.v)}
              </span>
            ))}
          </span>
        </dd>
      )}
      {a.cites.length > 0 && (
        <dd className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t("config.cites")}</span>
          {a.cites.map((path) => {
            const raw = values.get(path) ?? "";
            return (
              <button
                key={path}
                type="button"
                onClick={() => onField(path)}
                onMouseEnter={() => onHover([path])}
                onMouseLeave={enter}
                onFocus={() => onHover([path])}
                onBlur={leave}
                className="max-w-full truncate rounded-full bg-ink-850 px-2 py-0.5 font-mono text-[11px] text-slate-300 tabular-nums ring-1 ring-control transition hover:text-white hover:ring-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {path.split(".").pop()}
                <span className="text-slate-500">: </span>
                <span className="text-white">{chipValue(raw)}</span>
              </button>
            );
          })}
        </dd>
      )}
    </div>
  );
}

// ── the file ───────────────────────────────────────────────────────────────

function JsonPane({
  data,
  report,
  active,
  onLine,
}: {
  data: Loaded;
  report: ConfigReport;
  active: string[];
  onLine: (path: string) => void;
}) {
  const { t } = useLang();
  const scroller = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const lit = useMemo(() => report.lines.map((ln) => lineCited(ln, active)), [report, active]);
  const repo = data.source === "base" && data.baseModel ? data.baseModel : data.id;
  const href = data.rebuilt ? `https://huggingface.co/${repo}` : `https://huggingface.co/${repo}/blob/main/config.json`;

  // Bring the first lit line into view inside the pane — only the pane scrolls,
  // never the page, so pointing at an answer does not yank the reader away from it.
  useEffect(() => {
    const box = scroller.current;
    const first = lit.indexOf(true);
    if (!box || first < 0) return;
    const el = box.querySelector<HTMLElement>(`[data-line="${first}"]`);
    if (!el) return;
    const top = el.offsetTop;
    if (top < box.scrollTop + 8 || top + el.offsetHeight > box.scrollTop + box.clientHeight - 8) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }, [lit]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data.cfg, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden p-0 lg:max-h-[calc(100dvh-8.5rem)]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-sm font-semibold text-white">{t("config.json.title")}</h2>
          <span className="text-[11px] text-slate-400">{t("config.json.lines", { n: report.lines.length })}</span>
          {data.rebuilt && <Badge tone="warn">{t("config.json.rebuilt")}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={FOCUS + " rounded-lg px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"}
          >
            {t("config.json.hf")}
          </a>
          <button
            type="button"
            onClick={copy}
            className={FOCUS + " rounded-lg px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-control transition hover:bg-white/5 hover:text-white"}
          >
            <span aria-live="polite">{copied ? t("config.json.copied") : t("config.json.copy")}</span>
          </button>
        </div>
      </div>
      <div ref={scroller} className="relative min-h-0 max-h-[28rem] flex-1 overflow-auto py-2 lg:max-h-none">
        <ol className="font-mono text-xs leading-[1.65]">
          {report.lines.map((ln, i) => {
            const on = lit[i];
            const clickable = !!ln.path && ln.kind !== "close";
            return (
              <li
                key={i}
                data-line={i}
                onClick={clickable ? () => onLine(ln.path) : undefined}
                className={
                  "grid grid-cols-[2.75rem_minmax(0,1fr)] pr-3 transition-colors duration-150 " +
                  (on ? "bg-brand-500/20" : "")
                }
              >
                <span className={"select-none pr-3 text-right tabular-nums " + (on ? "text-brand-400" : "text-slate-500")}>{i + 1}</span>
                <span className="break-words" style={{ paddingLeft: `${ln.depth * 2}ch` }}>
                  {ln.key !== undefined && (
                    <>
                      <span className={on ? "font-semibold text-brand-400" : "text-slate-400"}>"{ln.key}"</span>
                      <span className="text-slate-500">: </span>
                    </>
                  )}
                  <span className={ln.kind === "open" || ln.kind === "close" ? "text-slate-500" : "text-white"}>{ln.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

// ── every field ────────────────────────────────────────────────────────────

function Fields({
  report,
  active,
  flash,
  onHover,
}: {
  report: ConfigReport;
  active: string[];
  flash: string | null;
  onHover: (cites: string[] | null) => void;
}) {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const counts = useMemo(
    () => ({
      all: report.fields.length,
      serving: report.fields.filter((f) => f.rel === "core").length,
      unexplained: report.fields.filter((f) => f.match === "none").length,
    }),
    [report],
  );
  const q = query.trim().toLowerCase();
  const shown = report.fields.filter(
    (f) =>
      (filter === "all" || (filter === "serving" ? f.rel === "core" : f.match === "none")) &&
      (!q || f.path.toLowerCase().includes(q) || (f.title ?? "").toLowerCase().includes(q) || (f.meaning ?? "").toLowerCase().includes(q)),
  );
  const groups = FIELD_GROUPS.map((g) => [g, shown.filter((f) => f.group === g)] as [FieldGroup, ExplainedField[]]).filter(([, fs]) => fs.length > 0);

  return (
    <Card className="mt-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-white">{t("config.fields.title")}</h2>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            size="sm"
            options={[
              { value: "all", label: t("config.fields.all", { n: counts.all }) },
              { value: "serving", label: t("config.fields.serving", { n: counts.serving }) },
              ...(counts.unexplained > 0 ? [{ value: "unexplained" as Filter, label: t("config.fields.unexplained", { n: counts.unexplained }) }] : []),
            ]}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("config.fields.search")}
            aria-label={t("config.fields.search")}
            spellCheck={false}
            className="w-full min-w-0 rounded-xl bg-ink-850 px-3 py-1.5 text-sm text-white ring-1 ring-control outline-none placeholder:text-slate-500 focus:ring-brand-500/60 sm:w-60"
          />
        </div>
      </div>

      {groups.length === 0 && <p className="mt-6 text-sm text-slate-400">{t("config.fields.none")}</p>}

      {groups.map(([g, fs]) => (
        <section key={g} aria-labelledby={`grp-${g}`} className="mt-7 first-of-type:mt-5">
          <h3 id={`grp-${g}`} className="text-sm font-semibold tracking-tight text-white">
            {GROUP_LABEL[g][lang]}
          </h3>
          {GROUP_NOTE[g] && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">{GROUP_NOTE[g]![lang]}</p>}
          <dl className="mt-2.5 divide-y divide-white/5 overflow-hidden rounded-xl bg-ink-850/40 ring-1 ring-white/5">
            {fs.map((f) => {
              const on = covers(active, f.path);
              return (
                <div
                  key={f.path}
                  id={rowId(f.path)}
                  tabIndex={-1}
                  onMouseEnter={() => onHover([f.path])}
                  onMouseLeave={() => onHover(null)}
                  className={
                    "grid scroll-mt-24 gap-x-6 gap-y-1 px-3 py-2.5 outline-none transition-colors duration-150 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] " +
                    (on ? "bg-brand-600/10 " : "") +
                    (flash === f.path ? "ring-2 ring-inset ring-brand-500" : "")
                  }
                >
                  <dt className="min-w-0">
                    <code className="break-all font-mono text-xs font-semibold text-white">{f.path}</code>
                    <div className="mt-0.5 break-all font-mono text-xs text-slate-400">{f.raw}</div>
                  </dt>
                  <dd className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium text-slate-200">{f.title ?? f.key.replace(/_/g, " ")}</span>
                      {f.human && <span className="text-xs text-slate-400">{f.human}</span>}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{f.meaning ?? t("config.fields.unknown")}</p>
                    {f.note && <p className="mt-1 text-xs leading-relaxed text-slate-300">{t(`config.note.${f.note}`)}</p>}
                    {f.match === "pattern" && <p className="mt-0.5 text-[11px] text-slate-500">{t("config.fields.pattern")}</p>}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </Card>
  );
}
