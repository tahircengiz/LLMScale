import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BYTES_PER_GIB, calculate, kvBytesPerToken, weightsBytes } from "../lib/calc";
import { fetchAnatomy, type Anatomy } from "../lib/anatomy";
import { extractCaps, scoreFit, TASKS, type Caps } from "../lib/fit";
import { searchModels, type HfSearchResult } from "../lib/hf";
import { useLang } from "../lib/i18n";
import { AMBER, GREEN, GREEN_DEEP, RED } from "../lib/palette";
import { formatBytes, formatGiB, formatInt, formatParams } from "../lib/format";
import { Badge, Card, SectionTitle } from "../components/ui";

const MAX_COLS = 4;
const DEFAULT_IDS = ["Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2.5-Coder-7B-Instruct"];

interface Entry {
  loading: boolean;
  anatomy?: Anatomy;
  caps?: Caps;
  error?: boolean;
}

function initialIds(): string[] {
  const m = new URLSearchParams(window.location.search).get("m");
  if (m) {
    const arr = m.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_COLS);
    if (arr.length) return arr;
  }
  return DEFAULT_IDS;
}

function scoreColor(o: number): string {
  return o >= 80 ? GREEN : o >= 60 ? GREEN_DEEP : o >= 40 ? AMBER : RED;
}

/** Indices that hold the best value; empty when all equal or <2 comparable. */
function winners(vals: (number | undefined)[], higher = true): boolean[] {
  const nums = vals.filter((v): v is number => typeof v === "number");
  if (nums.length < 2) return vals.map(() => false);
  const allEqual = nums.every((v) => v === nums[0]);
  if (allEqual) return vals.map(() => false);
  const best = higher ? Math.max(...nums) : Math.min(...nums);
  return vals.map((v) => v === best);
}

export function ComparePage() {
  const { t } = useLang();
  const [ids, setIds] = useState<string[]>(initialIds);
  const [entries, setEntries] = useState<Record<string, Entry>>({});

  useEffect(() => {
    for (const id of ids) {
      if (entries[id]) continue; // already fetched / fetching (cached across removes)
      setEntries((e) => ({ ...e, [id]: { loading: true } }));
      fetchAnatomy(id)
        .then((a) => {
          const caps = extractCaps({
            hfId: a.hfId, arch: a.arch, numParams: a.numParams,
            modelType: a.modelType, isMoE: a.isMoE, tags: a.tags, pipelineTag: a.pipelineTag,
          });
          setEntries((e) => ({ ...e, [id]: { loading: false, anatomy: a, caps } }));
        })
        .catch(() => setEntries((e) => ({ ...e, [id]: { loading: false, error: true } })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (ids.length) p.set("m", ids.join(","));
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [ids]);

  const add = (id: string) =>
    setIds((prev) => (prev.includes(id) || prev.length >= MAX_COLS ? prev : [...prev, id]));
  const remove = (id: string) => setIds((prev) => prev.filter((x) => x !== id));

  const cols = ids.map((id) => ({ id, entry: entries[id] as Entry | undefined }));

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("compare.subtitle")}</p>

      <Card className="mb-5 p-4 relative z-30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title={t("compare.pickTitle")} hint={t("compare.count", { n: ids.length, max: MAX_COLS })} />
          <AddSearch onPick={add} disabled={ids.length >= MAX_COLS} />
        </div>
      </Card>

      {ids.length === 0 ? (
        <Card className="p-5">
          <p className="py-10 text-center text-sm text-slate-400">{t("compare.empty")}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 z-10 bg-ink-900 px-3 py-3" />
                  {cols.map((c) => (
                    <th key={c.id} className="min-w-[150px] px-3 py-3 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white" title={c.id}>
                            {c.id.split("/").pop()}
                          </div>
                          <div className="truncate text-[10px] text-slate-500" title={c.id}>{c.id}</div>
                          {c.entry?.error && <Badge tone="bad">{t("compare.err")}</Badge>}
                          {c.entry?.loading && <span className="text-[10px] text-slate-500">{t("compare.loadingCol")}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          title={t("compare.remove")}
                          className="shrink-0 rounded-md px-1.5 text-slate-500 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-bad"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <Section title={t("compare.sec.identity")} span={cols.length} />
                <NumRow label={t("compare.row.params")} tip={t("compare.tip.params")} cols={cols} get={(a) => a.numParams} fmt={formatParams} />
                <TxtRow label={t("compare.row.moe")} tip={t("compare.tip.moe")} cols={cols} get={(a) => (a.isMoE ? `${a.expertsPerTok ?? "?"} / ${a.numExperts ?? "?"}` : t("compare.dense"))} />
                <NumRow label={t("compare.row.context")} tip={t("compare.tip.context")} cols={cols} get={(a) => a.arch.maxContext} fmt={(n) => (n >= 1024 ? `${Math.round(n / 1024)}k` : String(n))} highlight />
                <TxtRow label={t("compare.row.license")} tip={t("compare.tip.license")} cols={cols} get={(a) => a.license?.toUpperCase() ?? "—"} />
                <NumRow label={t("compare.row.downloads")} tip={t("compare.tip.downloads")} cols={cols} get={(a) => a.downloads} fmt={formatParams} highlight />
                <NumRow label={t("compare.row.likes")} tip={t("compare.tip.likes")} cols={cols} get={(a) => a.likes} fmt={formatInt} highlight />
                <TxtRow label={t("compare.row.updated")} tip={t("compare.tip.updated")} cols={cols} get={(a) => a.lastModified?.slice(0, 10) ?? "—"} />
                <TxtRow label={t("compare.row.base")} tip={t("compare.tip.base")} cols={cols} get={(a) => a.baseModel ?? "—"} />

                <Section title={t("compare.sec.arch")} span={cols.length} />
                <TxtRow label={t("compare.row.precision")} tip={t("compare.tip.precision")} cols={cols} get={(a) => (a.weightDtype ?? "bf16").toUpperCase()} />
                <NumRow label={t("compare.row.layers")} tip={t("compare.tip.layers")} cols={cols} get={(a) => a.arch.numLayers} fmt={String} />
                <NumRow label={t("compare.row.hidden")} tip={t("compare.tip.hidden")} cols={cols} get={(a) => a.arch.hiddenSize} fmt={formatInt} />
                <TxtRow label={t("compare.row.heads")} tip={t("compare.tip.heads")} cols={cols} get={(a) => `${a.arch.numAttentionHeads} / ${a.arch.numKeyValueHeads}${a.arch.numKeyValueHeads < a.arch.numAttentionHeads ? " (GQA)" : ""}`} />
                <NumRow label={t("compare.row.headDim")} tip={t("compare.tip.headDim")} cols={cols} get={(a) => a.headDim} fmt={String} />
                <NumRow label={t("compare.row.vocab")} tip={t("compare.tip.vocab")} cols={cols} get={(a) => a.arch.vocabSize} fmt={formatInt} />
                <TxtRow label={t("compare.row.weights")} tip={t("compare.tip.weights")} cols={cols} get={(a) => formatGiB(weightsBytes(a.arch, a.weightDtype ?? "bf16") / BYTES_PER_GIB)} />
                <TxtRow label={t("compare.row.kvtoken")} tip={t("compare.tip.kvtoken")} cols={cols} get={(a) => formatBytes(kvBytesPerToken(a.arch, "fp16"))} />
                <TxtRow label={t("compare.row.vram8k")} tip={t("compare.tip.vram8k")} cols={cols} get={(a) => formatGiB(vram8k(a))} />

                <Section title={t("compare.sec.caps")} span={cols.length} />
                {CAP_ROWS.map((cap) => (
                  <CapRow key={cap} label={t(`compare.cap.${cap}`)} tip={t("compare.tip.capGeneric", { cap: t(`compare.cap.${cap}`) })} cols={cols} get={(c) => c[cap]} />
                ))}

                <Section title={t("compare.sec.fit")} span={cols.length} hint={t("compare.fitHint")} />
                {TASKS.map((task) => (
                  <TaskRow key={task} label={t(`fit.task.${task}`)} tip={t("compare.tip.taskGeneric", { task: t(`fit.task.${task}`) })} cols={cols} task={task} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

const CAP_ROWS = ["instruct", "code", "math", "reasoning", "vision", "multilingual", "embedding"] as const;

function vram8k(a: Anatomy): number {
  return calculate({
    arch: a.arch, weightDtype: a.weightDtype ?? "bf16", kvDtype: "fp16",
    contextLength: 8192, concurrency: 1, overheadPct: 0.1, cudaContextGiB: 0.75,
  }).totalGiB;
}

type Col = { id: string; entry?: Entry };

// Hover delay before the info tooltip opens — roughly half the browser's
// native `title` delay, for a snappier feel.
const TIP_DELAY_MS = 250;

/** Info icon with a custom tooltip. Rendered via a body-level portal + fixed
 * positioning so it isn't clipped by the table's overflow / the Card. */
function InfoTip({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const W = 260;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
      setPos({ top: r.bottom + 6, left });
    }, TIP_DELAY_MS);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setPos(null);
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        aria-label={text}
        className="cursor-help select-none text-[11px] leading-none text-slate-600 outline-none transition-colors hover:text-brand-400 focus-visible:text-brand-400"
      >
        ⓘ
      </span>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", top: pos.top, left: pos.left, maxWidth: 260 }}
            className="z-50 rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-xs font-normal leading-snug text-slate-200 shadow-2xl"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

function LabelCell({ children, tip }: { children: ReactNode; tip?: string }) {
  return (
    <td className="sticky left-0 z-10 whitespace-nowrap bg-ink-900 px-3 py-2 text-xs font-medium text-slate-400 transition-colors group-hover:bg-ink-850">
      <span className="inline-flex items-center gap-1.5">
        {children}
        {tip && <InfoTip text={tip} />}
      </span>
    </td>
  );
}

function DataCell({ children, win }: { children: ReactNode; win?: boolean }) {
  return (
    <td className={"px-3 py-2 text-sm " + (win ? "bg-accent-500/10 font-semibold text-accent-400" : "text-slate-200")}>
      {children}
    </td>
  );
}

function Placeholder({ entry }: { entry?: Entry }) {
  if (entry?.loading) return <span className="text-slate-600">…</span>;
  return <span className="text-slate-600">—</span>;
}

function Section({ title, span, hint }: { title: string; span: number; hint?: string }) {
  return (
    <tr>
      <td colSpan={span + 1} className="bg-ink-850/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
        {hint && <span className="ml-2 font-normal normal-case text-slate-500">{hint}</span>}
      </td>
    </tr>
  );
}

function NumRow({
  label, cols, get, fmt, highlight = false, tip,
}: {
  label: string; cols: Col[]; get: (a: Anatomy) => number | undefined; fmt: (n: number) => string; highlight?: boolean; tip?: string;
}) {
  const vals = cols.map((c) => (c.entry?.anatomy ? get(c.entry.anatomy) : undefined));
  const wins = highlight ? winners(vals, true) : vals.map(() => false);
  return (
    <tr className="group transition-colors hover:bg-white/5">
      <LabelCell tip={tip}>{label}</LabelCell>
      {cols.map((c, i) => (
        <DataCell key={c.id} win={wins[i]}>
          {vals[i] != null ? fmt(vals[i]!) : <Placeholder entry={c.entry} />}
        </DataCell>
      ))}
    </tr>
  );
}

function TxtRow({ label, cols, get, tip }: { label: string; cols: Col[]; get: (a: Anatomy) => string; tip?: string }) {
  return (
    <tr className="group transition-colors hover:bg-white/5">
      <LabelCell tip={tip}>{label}</LabelCell>
      {cols.map((c) => (
        <DataCell key={c.id}>{c.entry?.anatomy ? get(c.entry.anatomy) : <Placeholder entry={c.entry} />}</DataCell>
      ))}
    </tr>
  );
}

function CapRow({ label, cols, get, tip }: { label: string; cols: Col[]; get: (c: Caps) => boolean; tip?: string }) {
  return (
    <tr className="group transition-colors hover:bg-white/5">
      <LabelCell tip={tip}>{label}</LabelCell>
      {cols.map((c) => (
        <DataCell key={c.id}>
          {c.entry?.caps ? (
            get(c.entry.caps) ? <span className="text-accent-400">✓</span> : <span className="text-slate-600">✗</span>
          ) : (
            <Placeholder entry={c.entry} />
          )}
        </DataCell>
      ))}
    </tr>
  );
}

function TaskRow({ label, cols, task, tip }: { label: string; cols: Col[]; task: (typeof TASKS)[number]; tip?: string }) {
  const scores = cols.map((c) => (c.entry?.caps ? scoreFit(c.entry.caps, task).overall : undefined));
  const wins = winners(scores, true);
  return (
    <tr className="group transition-colors hover:bg-white/5">
      <LabelCell tip={tip}>{label}</LabelCell>
      {cols.map((c, i) => {
        const s = scores[i];
        return (
          <td key={c.id} className={"px-3 py-2 " + (wins[i] ? "bg-accent-500/10" : "")}>
            {s != null ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-full max-w-[90px] overflow-hidden rounded-full bg-ink-800">
                  <div className="h-full rounded-full" style={{ width: `${s}%`, backgroundColor: scoreColor(s) }} />
                </div>
                <span className="w-6 shrink-0 text-xs tabular-nums" style={{ color: scoreColor(s) }}>{s}</span>
              </div>
            ) : (
              <Placeholder entry={c.entry} />
            )}
          </td>
        );
      })}
    </tr>
  );
}

/** Compact HF search box for adding a model column. Dropdown renders above the
 * comparison table (this card is outside the table's horizontal scroll). */
function AddSearch({ onPick, disabled }: { onPick: (id: string) => void; disabled?: boolean }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<HfSearchResult[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const r = await searchModels(query);
        if (id === seq.current) setResults(r);
      } catch {
        if (id === seq.current) setResults([]);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="relative w-full sm:w-72">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? t("compare.max") : t("compare.search")}
        className="w-full rounded-xl bg-ink-850 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-brand-500/60 disabled:opacity-50"
      />
      {results.length > 0 && (
        <ul className="absolute right-0 z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-ink-850 shadow-2xl">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(r.id);
                  setQ("");
                  setResults([]);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-brand-600/20"
              >
                <span className="truncate text-slate-200">{r.id}</span>
                {typeof r.downloads === "number" && (
                  <span className="shrink-0 text-[11px] text-slate-500">↓ {formatParams(r.downloads)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
