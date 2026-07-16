// Dynamic transformer-architecture block diagram — renders the model's stack
// (embedding → N× [norm · attention · norm · FFN/MoE] → final norm → output)
// straight from the fetched Anatomy config, annotated with the real numbers.
// Data flows bottom → top, matching the familiar transformer-diagram convention.

import { useLang } from "../lib/i18n";
import { formatInt, formatParams } from "../lib/format";
import type { Anatomy } from "../lib/anatomy";

// Stage colours are kept in sync with the parameter-distribution donut so the
// diagram and the donut read as the same model (embeddings=emerald, attn=indigo,
// ffn=amber), with cyan for the output head and slate for norms / I/O.
const COL = {
  io: "#64748b",
  embed: "#10b981",
  norm: "#64748b",
  attn: "#6366f1",
  ffn: "#f59e0b",
  out: "#06b6d4",
} as const;

/** 1024-based short label for context lengths (128k = 131072, 1M = 1048576). */
function ctxLabel(n?: number): string {
  if (!n) return "—";
  if (n >= 1_048_576) return `${Math.round(n / 1_048_576)}M`;
  if (n >= 1024) return `${Math.round(n / 1024)}k`;
  return String(n);
}

/** Decimal-based short label for vocab sizes (151936 → "152k"). */
function kLabel(n?: number): string {
  if (!n) return "—";
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

function Stage({
  color,
  title,
  detail,
  residual,
  tight,
}: {
  color: string;
  title: string;
  detail?: string;
  residual?: boolean;
  tight?: boolean;
}) {
  return (
    <div
      className={
        "relative flex items-center gap-3 rounded-xl ring-1 ring-white/10 " +
        (tight ? "px-3 py-2" : "px-4 py-2.5")
      }
      style={{ background: `${color}14` }}
    >
      <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-white">{title}</div>
        {detail && <div className="truncate text-[11px] text-slate-400">{detail}</div>}
      </div>
      {residual && (
        <span
          className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-white/10"
          title="+ residual"
        >
          ⊕
        </span>
      )}
    </div>
  );
}

/** Upward connector (data flows bottom → top). */
function Up() {
  return (
    <div className="flex justify-center py-0.5" aria-hidden>
      <svg width="14" height="12" viewBox="0 0 14 12">
        <path d="M7 2v9" className="stroke-white" strokeOpacity={0.18} strokeWidth={1.5} />
        <path
          d="M3.5 5.5 7 2l3.5 3.5"
          fill="none"
          className="stroke-white"
          strokeOpacity={0.32}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Chip({ big, sub, accent }: { big: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-ink-850/60 px-3 py-2 ring-1 ring-white/5">
      <div className={"text-sm font-bold " + (accent ? "text-accent-400" : "text-white")}>{big}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{sub}</div>
    </div>
  );
}

export function ArchDiagram({ a }: { a: Anatomy }) {
  const { t } = useLang();
  const ar = a.arch;
  const gqa = ar.numKeyValueHeads > 0 && ar.numKeyValueHeads < ar.numAttentionHeads;
  const swa = a.slidingWindow && a.slidingWindow > 0 ? a.slidingWindow : null;

  const attnTitle = gqa ? t("anatomy.diagram.attn") : t("anatomy.diagram.attnMha");
  const attnDetail =
    `${ar.numAttentionHeads}Q · ${ar.numKeyValueHeads}KV · dₕ${a.headDim}` +
    (swa ? ` · SWA ${ctxLabel(swa)}` : "");

  const d = a.paramDist;
  const swiglu = a.intermediateSize ? `SwiGLU ${formatInt(a.intermediateSize)}` : "SwiGLU";
  const ffnTitle = a.isMoE ? t("anatomy.diagram.moe") : t("anatomy.diagram.mlp");
  // For MoE only surface the expert counts / SwiGLU width we actually know — a
  // bundled-DB entry carries neither, so the box degrades to just its title.
  const ffnDetail = a.isMoE
    ? [
        a.numExperts != null
          ? t("anatomy.diagram.expertsDetail", { act: a.expertsPerTok ?? "?", tot: a.numExperts })
          : null,
        a.intermediateSize ? swiglu : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : swiglu;

  const embedDetail = ar.vocabSize
    ? `${kLabel(ar.vocabSize)} → ${formatInt(ar.hiddenSize)}`
    : `→ ${formatInt(ar.hiddenSize)}`;
  const outDetail = ar.vocabSize ? `→ ${kLabel(ar.vocabSize)} logits` : "→ logits";

  // Active params: prefer the bundled-DB figure, else derive it from the live
  // expert ratio (embeddings + attention + active experts). Undefined ⇒ we don't
  // know, so the MoE headline collapses to a single total chip instead of lying.
  const knownActive =
    a.arch.activeParams ??
    (d.ffnActive != null ? d.embeddings + d.attention + d.ffnActive : undefined);

  return (
    <div>
      {/* summary chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {a.isMoE && knownActive != null ? (
          <>
            <Chip big={formatParams(knownActive)} sub={t("anatomy.diagram.activeSub")} accent />
            <Chip big={formatParams(d.total)} sub={t("anatomy.diagram.totalSub")} />
          </>
        ) : (
          <Chip big={formatParams(d.total)} sub={t("anatomy.diagram.totalSub")} />
        )}
        <Chip big={ctxLabel(ar.maxContext)} sub={t("anatomy.arch.context")} />
        <Chip big={String(ar.numLayers)} sub={t("anatomy.arch.layers")} />
      </div>

      {/* block stack */}
      <div className="mx-auto max-w-sm space-y-1.5">
        <Stage color={COL.out} title={t("anatomy.diagram.output")} detail={outDetail} />
        <Up />
        <Stage color={COL.norm} title={t("anatomy.diagram.finalNorm")} />
        <Up />

        <div className="relative rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-3 pb-3 pt-9">
          <div className="absolute left-3 top-2.5 text-[10px] uppercase tracking-wide text-slate-400">
            {t("anatomy.diagram.block")}
          </div>
          <div className="absolute right-3 top-2 rounded-full bg-brand-600/25 px-2 py-0.5 text-[11px] font-bold text-brand-300 ring-1 ring-brand-500/40">
            {t("anatomy.diagram.blockN", { n: ar.numLayers })}
          </div>
          <div className="space-y-1.5">
            <Stage tight color={COL.norm} title="RMSNorm" />
            <Up />
            <Stage tight color={COL.attn} title={attnTitle} detail={attnDetail} residual />
            <Up />
            <Stage tight color={COL.norm} title="RMSNorm" />
            <Up />
            <Stage tight color={COL.ffn} title={ffnTitle} detail={ffnDetail} residual />
          </div>
        </div>

        <Up />
        <Stage color={COL.embed} title={t("anatomy.diagram.embed")} detail={embedDetail} />
        <Up />
        <Stage color={COL.io} title={t("anatomy.diagram.input")} />
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-500">{t("anatomy.diagram.flow")}</p>
    </div>
  );
}
