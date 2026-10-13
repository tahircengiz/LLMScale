import { useEffect, useMemo, useState } from "react";
import type { ModelArch } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { fetchSnapshot, READ_FILES } from "../lib/repoFetch";
import {
  buildBrief,
  commandText,
  ENGINE_VERSIONS,
  type Cite,
  type Command,
  type Part,
  type RepoSnapshot,
  type SectionId,
  type ServingBrief,
} from "../lib/serving";
import { fmtBytes } from "../lib/configExplain";
import { useLang } from "../lib/i18n";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Badge, Card, Segmented } from "../components/ui";

/** Starting points that between them show what the page catches: parsers for a
 *  thinking model, MTP that ships and MTP that a quantized copy dropped, harmony
 *  and MXFP4, NVFP4 declared outside config.json, an XML tool format, and
 *  Mistral's own layout. */
const EXAMPLES: { id: string; label: string }[] = [
  { id: "Qwen/Qwen3-32B", label: "Qwen3 32B" },
  { id: "deepseek-ai/DeepSeek-V3.1", label: "DeepSeek-V3.1" },
  { id: "QuixiAI/DeepSeek-V3-AWQ", label: "DeepSeek-V3 AWQ" },
  { id: "openai/gpt-oss-20b", label: "gpt-oss 20B" },
  { id: "nvidia/Llama-3.3-70B-Instruct-NVFP4", label: "Llama 3.3 70B NVFP4" },
  { id: "Qwen/Qwen3-Coder-30B-A3B-Instruct", label: "Qwen3-Coder 30B-A3B" },
  { id: "mistralai/Mistral-Small-3.2-24B-Instruct-2506", label: "Mistral Small 3.2" },
];

const QUESTIONS: SectionId[] = ["repo", "chat", "sampling", "weights", "mtp", "context", "load"];

/** The themed focus ring every control on this page carries (DESIGN.md: cobalt). */
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

interface Loaded {
  id: string;
  snap: RepoSnapshot;
  arch: ModelArch | null;
  meta: ResolvedMeta | null;
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

function useSay() {
  const { t } = useLang();
  return (parts: Part[]) => parts.map((p) => t(`serve.a.${p.k}`, p.v)).join(" ");
}

export function ServingPage() {
  const { t, lang } = useLang();
  const [hfId, setHfId] = useState(initialHfId);
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The file a citation is pointing at, lit in the file list.
  const [litFile, setLitFile] = useState<string | null>(null);

  useEffect(() => {
    if (!hfId) return;
    let alive = true;
    setLoading(true);
    setFailed(false);
    Promise.all([fetchSnapshot(hfId), resolveModel(hfId).catch(() => null)])
      .then(([snap, r]) => {
        if (!alive) return;
        setData({
          id: hfId,
          snap,
          arch: r?.arch ?? null,
          meta: r
            ? {
                source: r.source,
                gated: r.gated,
                modelType: r.modelType,
                isMoE: r.isMoE,
                tags: r.tags,
                pipelineTag: r.pipelineTag,
                weightDtype: r.weightDtype,
                kvDtype: r.kvDtype,
                warningKey: r.warningKey,
              }
            : null,
        });
      })
      .catch(() => alive && (setData(null), setFailed(true)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [hfId, attempt]);

  // The model lives in the address, so a brief can be shared as a link.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = hfId ? `?m=${encodeURIComponent(hfId).replace(/%2F/g, "/")}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${q}`);
  }, [hfId]);

  const current = data && data.id === hfId ? data : null;
  const brief = useMemo<ServingBrief | null>(() => (current ? buildBrief(current.snap, lang) : null), [current, lang]);

  return (
    <div>
      <p className="mb-5 max-w-2xl text-sm text-slate-400">{t("serve.subtitle")}</p>

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
      ) : current && brief ? (
        <div className={"transition-opacity duration-200 " + (loading ? "opacity-50" : "opacity-100")}>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-start">
            <div className="flex min-w-0 flex-col gap-3 lg:col-span-7">
              <Portrait id={current.snap.id} brief={brief} />
              <Gotchas brief={brief} />
              <Sections brief={brief} onCite={setLitFile} />
            </div>
            <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-3 lg:col-span-5">
              <Commands brief={brief} />
              <Files snap={current.snap} brief={brief} lit={litFile} />
            </div>
          </div>
        </div>
      ) : failed ? (
        <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-slate-300">{t("serve.error")}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className={FOCUS + " shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-control transition hover:bg-white/5 hover:text-white"}
          >
            {t("serve.retry")}
          </button>
        </Card>
      ) : null}
    </div>
  );
}

// ── empty and loading states ────────────────────────────────────────────────

function EmptyState({ onPick }: { onPick: (id: string) => void }) {
  const { t } = useLang();
  return (
    <Card className="mt-3 p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-white">{t("serve.empty.title")}</h2>
      <p className="mt-1 text-sm text-slate-400">{t("serve.empty.try")}</p>
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
        <p className="text-sm text-slate-400">{t("serve.empty.preview")}</p>
        <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {QUESTIONS.map((q) => (
            <li key={q} className="text-sm font-medium text-slate-200">
              {t(`serve.q.${q}`)}
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
    <Card className="mt-3 p-5">
      <p className="text-sm text-slate-400" role="status">
        {t("serve.loading", { id })}
      </p>
      <div className="mt-4 space-y-2.5" aria-hidden="true">
        {[92, 78, 85, 60].map((wd, i) => (
          <div key={i} className="h-3 animate-pulse rounded-full bg-ink-800" style={{ width: `${wd}%` }} />
        ))}
      </div>
    </Card>
  );
}

// ── in short, and what to check ─────────────────────────────────────────────

function Portrait({ id, brief }: { id: string; brief: ServingBrief }) {
  const { t, lang } = useLang();
  const say = useSay();
  const home = import.meta.env.BASE_URL + (lang === "tr" ? "tr/" : "");
  const q = `?m=${encodeURIComponent(id).replace(/%2F/g, "/")}`;
  const sizable = brief.facts.role !== "adapter" && brief.facts.role !== "draft" && brief.facts.format !== "none";
  const SECOND = FOCUS + " rounded-xl px-3 py-1.5 text-sm font-medium text-slate-300 ring-1 ring-control transition hover:bg-white/5 hover:text-white";
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold tracking-tight text-white">{t("serve.portrait.title")}</h2>
        <span className="min-w-0 truncate font-mono text-xs text-slate-400">{id}</span>
      </div>
      <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-slate-300">
        <Rich text={say(brief.portrait)} />
      </p>
      {sizable && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={`${home}${q}`}
            className={FOCUS + " rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-onbrand shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"}
          >
            {t("serve.link.size")}
          </a>
          <a href={`${home}vllm.html${q}`} className={SECOND}>
            {t("serve.link.vllm")}
          </a>
          <a href={`${home}config.html${q}`} className={SECOND}>
            {t("serve.link.config")}
          </a>
        </div>
      )}
    </Card>
  );
}

function Gotchas({ brief }: { brief: ServingBrief }) {
  const { t } = useLang();
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold tracking-tight text-white">{t("serve.gotchas.title")}</h2>
      {brief.gotchas.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">{t("serve.gotchas.none")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {brief.gotchas.map((g, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
              <span className="mt-0.5 shrink-0">
                <Badge tone={g.severity === "warn" ? "warn" : "neutral"}>{t(`serve.sev.${g.severity}`)}</Badge>
              </span>
              <span className="min-w-0">{t(`serve.a.${g.k}`, g.v)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ── what the files say ─────────────────────────────────────────────────────

const citeFile = (c: Cite, t: (k: string) => string) => (c.file === "api" ? t("serve.api") : c.file);

function Sections({ brief, onCite }: { brief: ServingBrief; onCite: (file: string | null) => void }) {
  const { t } = useLang();
  const say = useSay();
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5 pb-2 pt-4">
        <h2 className="text-base font-semibold tracking-tight text-white">{t("serve.sections.title")}</h2>
        <span className="text-xs text-slate-400">{t("serve.sections.hint")}</span>
      </div>
      <dl className="divide-y divide-white/5">
        {brief.sections.map((s) => (
          <div key={s.id} className="px-5 py-4">
            <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold tracking-tight text-white">
              {t(`serve.q.${s.id}`)}
              {s.tone === "warn" && <Badge tone="warn">{t("serve.sev.warn")}</Badge>}
            </dt>
            <dd className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-slate-300 tabular-nums">
              <Rich text={say(s.parts)} />
            </dd>
            {s.cites.length > 0 && (
              <dd className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t("serve.cites")}</span>
                {s.cites.map((c, i) => (
                  <span
                    key={i}
                    tabIndex={0}
                    onMouseEnter={() => onCite(c.file)}
                    onMouseLeave={() => onCite(null)}
                    onFocus={() => onCite(c.file)}
                    onBlur={() => onCite(null)}
                    className={FOCUS + " max-w-full truncate rounded-full bg-ink-850 px-2 py-0.5 font-mono text-[11px] text-slate-300 tabular-nums ring-1 ring-control"}
                  >
                    {citeFile(c, t)}
                    {c.key && (
                      <>
                        <span className="text-slate-500"> · </span>
                        {c.key}
                      </>
                    )}
                    {c.value && (
                      <>
                        <span className="text-slate-500">: </span>
                        <span className="text-white">{c.value.length > 28 ? c.value.slice(0, 27) + "…" : c.value}</span>
                      </>
                    )}
                  </span>
                ))}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </Card>
  );
}

// ── the command ────────────────────────────────────────────────────────────

type Engine = "vllm" | "sglang";

function Commands({ brief }: { brief: ServingBrief }) {
  const { t } = useLang();
  const [engine, setEngine] = useState<Engine>("vllm");
  const [copied, setCopied] = useState(false);
  const cmd: Command = brief.commands[engine];
  const text = commandText(cmd);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-white">{t("serve.cmd.title")}</h2>
        <div className="flex items-center gap-2">
          <Segmented<Engine>
            value={engine}
            onChange={setEngine}
            size="sm"
            nowrap
            options={[
              { value: "vllm", label: "vLLM" },
              { value: "sglang", label: "SGLang" },
            ]}
          />
          {text && (
            <button
              type="button"
              onClick={copy}
              className={FOCUS + " rounded-lg px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-control transition hover:bg-white/5 hover:text-white"}
            >
              <span aria-live="polite">{copied ? t("serve.cmd.copied") : t("serve.cmd.copy")}</span>
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        {text ? (
          <pre className="overflow-x-auto rounded-lg bg-ink-850 p-3 font-mono text-xs leading-relaxed text-slate-200 ring-1 ring-white/5">{text}</pre>
        ) : null}
        {text && cmd.flags.length === 0 && <p className="mt-2 text-xs text-slate-400">{t("serve.cmd.plain")}</p>}
        {cmd.flags.length > 0 && (
          <div className="mt-3">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t("serve.cmd.why")}</h3>
            <dl className="mt-1.5 space-y-1.5">
              {cmd.flags.map((f, i) => (
                <div key={i} className="grid gap-x-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
                  <dt className="break-all font-mono text-[11px] text-white">{f.flag}</dt>
                  <dd className="text-xs leading-relaxed text-slate-400">{t(`serve.a.${f.why.k}`, f.why.v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {cmd.notes.length > 0 && (
          <ul className="mt-3 space-y-1">
            {cmd.notes.map((n, i) => (
              <li key={i} className="text-xs leading-relaxed text-slate-300">
                {t(`serve.a.${n.k}`, n.v)}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          {t("serve.cmd.checked", { vllm: ENGINE_VERSIONS.vllm, sglang: ENGINE_VERSIONS.sglang })}
        </p>
      </div>
    </Card>
  );
}

// ── the files ──────────────────────────────────────────────────────────────

const SHOWN = 12;

function Files({ snap, brief, lit }: { snap: RepoSnapshot; brief: ServingBrief; lit: string | null }) {
  const { t, lang } = useLang();
  const [all, setAll] = useState(false);
  const unread = new Set(snap.unreadable ?? []);
  const read = new Set(snap.files.map((f) => f.name).filter((n) => (READ_FILES.has(n) || n === snap.tensorFile) && !unread.has(n)));
  const cited = new Set(brief.sections.flatMap((s) => s.cites.map((c) => c.file)));
  // The files the brief read come first, then the rest by size: the weights.
  const files = [...snap.files].sort(
    (a, b) =>
      Number(read.has(b.name) || unread.has(b.name)) - Number(read.has(a.name) || unread.has(a.name)) ||
      (b.size ?? 0) - (a.size ?? 0) ||
      a.name.localeCompare(b.name),
  );
  const shown = all ? files : files.slice(0, SHOWN);
  const litMatch = (name: string) => !!lit && (lit === name || (lit === "*.gguf" && name.endsWith(".gguf")));

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-white">{t("serve.files.title")}</h2>
          <span className="text-[11px] text-slate-400">{t("serve.files.count", { n: snap.files.length })}</span>
        </div>
        <a
          href={`https://huggingface.co/${snap.id}/tree/main`}
          target="_blank"
          rel="noreferrer"
          className={FOCUS + " rounded-lg px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"}
        >
          {t("serve.files.hf")}
        </a>
      </div>
      <ul className="divide-y divide-white/5 py-1">
        {shown.map((f) => (
          <li
            key={f.name}
            className={
              "flex items-center justify-between gap-3 px-4 py-1.5 transition-colors duration-150 " +
              (litMatch(f.name) ? "bg-brand-500/20" : "")
            }
          >
            <span className={"min-w-0 truncate font-mono text-xs " + (cited.has(f.name) ? "text-white" : "text-slate-400")}>{f.name}</span>
            <span className="flex shrink-0 items-center gap-2">
              {read.has(f.name) && <Badge tone="good">{t("serve.files.read")}</Badge>}
              {unread.has(f.name) && <Badge tone="warn">{t("serve.files.unread")}</Badge>}
              {f.size !== undefined && <span className="text-[11px] tabular-nums text-slate-500">{fmtBytes(f.size, lang)}</span>}
            </span>
          </li>
        ))}
      </ul>
      {files.length > SHOWN && (
        <div className="border-t border-white/10 px-4 py-2">
          <button
            type="button"
            onClick={() => setAll((x) => !x)}
            aria-expanded={all}
            className={FOCUS + " rounded-lg text-xs font-medium text-slate-300 transition hover:text-white"}
          >
            {all ? t("serve.files.less") : t("serve.files.more", { n: files.length })}
          </button>
        </div>
      )}
    </Card>
  );
}
