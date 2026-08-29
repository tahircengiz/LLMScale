// Dynamic transformer-architecture infographic — an annotated block diagram
// (embedding → N× [norm · attention · norm · FFN/MoE] → final norm → output)
// generated from the fetched config, with leader-line callouts carrying the
// real dimensions. Data flows bottom → top, matching the reference style.

import { useLang } from "../lib/i18n";
import { AMBER, BLUE, GREEN, GREY, INDIGO } from "../lib/palette";
import { formatInt, formatParams } from "../lib/format";
import type { Anatomy } from "../lib/anatomy";

const COL = {
  io: GREY,
  embed: GREEN,
  norm: GREY,
  attn: INDIGO,
  ffn: AMBER,
  out: BLUE,
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

function Box({
  x,
  y,
  w,
  h,
  color,
  title,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  title: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={9} fill={`${color}24`} stroke={`${color}99`} strokeWidth={1.2} />
      <rect x={x + 1.2} y={y + 1.2} width={4} height={h - 2.4} rx={2} fill={color} />
      <text
        x={x + w / 2 + 3}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white"
        style={{ fontSize: 12.5, fontWeight: 600 }}
      >
        {title}
      </text>
    </g>
  );
}

/** Up-pointing chevron centred at (x, y) — reinforces bottom → top flow. */
function Chevron({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x - 4} ${y + 4} L${x} ${y} L${x + 4} ${y + 4}`}
      fill="none"
      className="stroke-white"
      strokeOpacity={0.3}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** A leader-line callout: dot on the box edge, line out to the margin, value + label. */
function Callout({
  x,
  y,
  side,
  value,
  label,
  accent,
}: {
  x: number;
  y: number;
  side: "l" | "r";
  value: string;
  label?: string;
  accent?: boolean;
}) {
  const len = 34;
  const end = side === "r" ? x + len : x - len;
  const tx = side === "r" ? end + 7 : end - 7;
  const anchor = side === "r" ? "start" : "end";
  return (
    <g>
      <circle cx={x} cy={y} r={2.4} fill={COL.attn} className={accent ? "" : "fill-white"} fillOpacity={accent ? 1 : 0.45} />
      <line x1={x} y1={y} x2={end} y2={y} className="stroke-white" strokeOpacity={0.28} strokeWidth={1} />
      <text
        x={tx}
        y={y - 2}
        textAnchor={anchor}
        className={accent ? "" : "fill-white"}
        fill={accent ? COL.attn : undefined}
        style={{ fontSize: 12.5, fontWeight: 700 }}
      >
        {value}
      </text>
      {label && (
        <text x={tx} y={y + 10} textAnchor={anchor} className="fill-slate-400" style={{ fontSize: 9.5 }}>
          {label}
        </text>
      )}
    </g>
  );
}

export function ArchDiagram({ a }: { a: Anatomy }) {
  const { t } = useLang();
  const ar = a.arch;
  const gqa = ar.numKeyValueHeads > 0 && ar.numKeyValueHeads < ar.numAttentionHeads;
  const swa = a.slidingWindow && a.slidingWindow > 0 ? a.slidingWindow : null;
  const d = a.paramDist;
  const knownActive =
    a.arch.activeParams ??
    (d.ffnActive != null ? d.embeddings + d.attention + d.ffnActive : undefined);

  // ---- geometry: place boxes top→bottom, but ordered for bottom→top flow ----
  const W = 760;
  const colX = 250;
  const colW = 210;
  const colR = colX + colW; // 460
  const cx = colX + colW / 2; // 355
  const gap = 22;
  const bGap = 12;
  const hOut = 42, hFinal = 32, hNorm = 30, hAttn = 46, hFfn = 46, hEmbed = 44, hIn = 34;

  let cy = 46;
  const place = (h: number) => {
    const top = cy;
    cy += h;
    return top;
  };
  const outT = place(hOut); cy += gap;
  const fnT = place(hFinal); cy += gap;
  const blkTop = cy; cy += 26; // container label row
  const ffT = place(hFfn); cy += bGap;
  const nBT = place(hNorm); cy += bGap;
  const atT = place(hAttn); cy += bGap;
  const nAT = place(hNorm); cy += 12;
  const blkBot = cy; cy += gap;
  const embT = place(hEmbed); cy += gap;
  const inT = place(hIn);
  const H = cy + 34;

  const mid = (top: number, h: number) => top + h / 2;

  const attnTitle = gqa ? t("anatomy.diagram.attn") : t("anatomy.diagram.attnMha");
  const ffnTitle = a.isMoE ? t("anatomy.diagram.moe") : t("anatomy.diagram.mlp");

  const ffnVal = a.isMoE
    ? a.numExperts != null
      ? `${a.expertsPerTok ?? "?"}/${a.numExperts}`
      : "MoE"
    : a.intermediateSize
      ? formatInt(a.intermediateSize)
      : "SwiGLU";
  const ffnLabel = a.isMoE
    ? a.numExperts != null
      ? t("anatomy.diagram.expertsLabel")
      : t("anatomy.diagram.moeLabel")
    : t("anatomy.diagram.swigluLabel");

  return (
    <div className="flex w-full justify-center overflow-x-auto lg:h-full lg:overflow-visible">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Transformer architecture diagram"
        preserveAspectRatio="xMidYMid meet"
        className="block w-full min-w-[600px] max-w-[760px] shrink-0 lg:h-full lg:w-auto lg:min-w-0 lg:max-w-full"
      >
        {/* summary header */}
        <text x={cx} y={26} textAnchor="middle" style={{ fontSize: 13 }}>
          {a.isMoE && knownActive != null ? (
            <>
              <tspan fill={COL.attn} style={{ fontWeight: 700 }}>{formatParams(knownActive)}</tspan>
              <tspan className="fill-slate-400"> {t("anatomy.diagram.activeSub")} · </tspan>
              <tspan className="fill-white" style={{ fontWeight: 700 }}>{formatParams(d.total)}</tspan>
              <tspan className="fill-slate-400"> {t("anatomy.diagram.totalSub")}</tspan>
            </>
          ) : (
            <>
              <tspan className="fill-white" style={{ fontWeight: 700 }}>{formatParams(d.total)}</tspan>
              <tspan className="fill-slate-400"> {t("anatomy.diagram.totalSub")}</tspan>
            </>
          )}
          <tspan className="fill-slate-500"> · </tspan>
          <tspan className="fill-white" style={{ fontWeight: 700 }}>{ctxLabel(ar.maxContext)}</tspan>
          <tspan className="fill-slate-400"> {t("anatomy.arch.context")}</tspan>
        </text>

        {/* outer connectors (data flows bottom → top; chevrons point up) */}
        {[
          [outT + hOut, fnT],
          [fnT + hFinal, blkTop],
          [blkBot, embT],
          [embT + hEmbed, inT],
        ].map(([y1, y2], i) => (
          <g key={i}>
            <line x1={cx} y1={y1} x2={cx} y2={y2} className="stroke-white" strokeOpacity={0.18} strokeWidth={1.2} />
            <Chevron x={cx} y={(y1 + y2) / 2 - 2} />
          </g>
        ))}
        {/* inner block connectors */}
        {[
          [ffT + hFfn, nBT],
          [nBT + hNorm, atT],
          [atT + hAttn, nAT],
        ].map(([y1, y2], i) => (
          <g key={`b${i}`}>
            <line x1={cx} y1={y1} x2={cx} y2={y2} className="stroke-white" strokeOpacity={0.16} strokeWidth={1.2} />
            <Chevron x={cx} y={(y1 + y2) / 2 - 1} />
          </g>
        ))}

        {/* block container */}
        <rect
          x={colX - 14}
          y={blkTop}
          width={colW + 28}
          height={blkBot - blkTop}
          rx={14}
          fill="#ffffff"
          fillOpacity={0.02}
          stroke="#ffffff"
          strokeOpacity={0.14}
          strokeDasharray="4 4"
        />
        <text x={colX - 6} y={blkTop + 16} className="fill-slate-400" style={{ fontSize: 9.5, letterSpacing: 0.5 }}>
          {t("anatomy.diagram.block").toUpperCase()}
        </text>
        <g>
          <rect x={colR - 46} y={blkTop + 5} width={52} height={17} rx={8.5} fill={`${COL.attn}33`} stroke={`${COL.attn}88`} />
          <text x={colR - 20} y={blkTop + 13.5} textAnchor="middle" dominantBaseline="central" fill={COL.attn} style={{ fontSize: 10.5, fontWeight: 700 }}>
            {t("anatomy.diagram.blockN", { n: ar.numLayers })}
          </text>
        </g>

        {/* boxes */}
        <Box x={colX} y={outT} w={colW} h={hOut} color={COL.out} title={t("anatomy.diagram.output")} />
        <Box x={colX} y={fnT} w={colW} h={hFinal} color={COL.norm} title={t("anatomy.diagram.finalNorm")} />
        <Box x={colX} y={ffT} w={colW} h={hFfn} color={COL.ffn} title={ffnTitle} />
        <Box x={colX} y={nBT} w={colW} h={hNorm} color={COL.norm} title="RMSNorm" />
        <Box x={colX} y={atT} w={colW} h={hAttn} color={COL.attn} title={attnTitle} />
        <Box x={colX} y={nAT} w={colW} h={hNorm} color={COL.norm} title="RMSNorm" />
        <Box x={colX} y={embT} w={colW} h={hEmbed} color={COL.embed} title={t("anatomy.diagram.embed")} />
        <Box x={colX} y={inT} w={colW} h={hIn} color={COL.io} title={t("anatomy.diagram.input")} />

        {/* callouts */}
        <Callout x={colR} y={mid(outT, hOut)} side="r" value={kLabel(ar.vocabSize)} label={t("anatomy.diagram.logitsLabel")} />
        <Callout x={colR} y={mid(atT, hAttn)} side="r" value={`${ar.numAttentionHeads}Q · ${ar.numKeyValueHeads}KV`} label={gqa ? "GQA" : "MHA"} accent />
        <Callout x={colX} y={mid(atT, hAttn)} side="l" value={`dₕ ${a.headDim}`} label={swa ? `SWA ${ctxLabel(swa)}` : t("anatomy.diagram.headDimLabel")} />
        <Callout x={colR} y={mid(ffT, hFfn)} side="r" value={ffnVal} label={ffnLabel} />
        <Callout x={colX} y={mid(embT, hEmbed)} side="l" value={kLabel(ar.vocabSize)} label={t("anatomy.diagram.vocabLabel")} />
        <Callout x={colR} y={mid(embT, hEmbed)} side="r" value={formatInt(ar.hiddenSize)} label={t("anatomy.diagram.dimLabel")} />

        {/* footer */}
        <text x={cx} y={H - 10} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 10 }}>
          {t("anatomy.diagram.flow")}
        </text>
      </svg>
    </div>
  );
}
