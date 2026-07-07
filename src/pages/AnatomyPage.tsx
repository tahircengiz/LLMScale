import { useEffect, useState, type ReactNode } from "react";
import { BYTES_PER_GIB, DTYPE_BYTES, kvBytesPerToken, type ModelArch } from "../lib/calc";
import { fetchAnatomy, tierOf, type Anatomy, type DtypeTier } from "../lib/anatomy";
import { useLang } from "../lib/i18n";
import { formatGiB, formatInt, formatParams } from "../lib/format";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Donut, HBars, LineChart, GqaDiagram, Spec, type DonutSeg } from "../components/charts";
import { Badge, Card, SectionTitle } from "../components/ui";

const DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct";

const TIER_COLOR: Record<DtypeTier, string> = {
  full: "#06b6d4",
  half: "#6366f1",
  fp8: "#f59e0b",
  int8: "#f43f5e",
  int4: "#ec4899",
  other: "#64748b",
};

function initialHfId(): string {
  return new URLSearchParams(window.location.search).get("m") || DEFAULT_MODEL;
}

function ymd(iso?: string): string {
  return iso ? iso.slice(0, 10) : "—";
}
function gb(bytes?: number): string {
  return bytes ? `${(bytes / 1e9).toFixed(1)} GB` : "—";
}

export function AnatomyPage() {
  const { t } = useLang();
  const [hfId, setHfId] = useState(initialHfId);
  const [arch, setArch] = useState<ModelArch | null>(null);
  const [meta, setMeta] = useState<ResolvedMeta | null>(null);
  const [anatomy, setAnatomy] = useState<Anatomy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAnatomy(hfId)
      .then((a) => {
        if (!alive) return;
        setAnatomy(a);
        setArch(a.arch);
        setMeta({
          source: a.source as ResolvedMeta["source"],
          gated: a.gated,
          modelType: a.modelType,
          isMoE: a.isMoE,
          tags: a.tags,
          pipelineTag: a.pipelineTag,
          weightDtype: a.weightDtype,
          kvDtype: a.kvDtype,
          warningKey: a.warningKey,
        });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [hfId]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (hfId) p.set("m", hfId);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [hfId]);

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("anatomy.subtitle")}</p>

      <Card className="mb-5 p-5 relative z-30">
        <ModelPicker
          hfId={hfId}
          arch={arch}
          meta={meta}
          hideCustom
          onModel={(id, a, m) => {
            if (id) setHfId(id);
            setArch(a);
            setMeta(m ?? null);
          }}
        />
      </Card>

      {loading && !anatomy ? (
        <Card className="p-5">
          <p className="py-10 text-center text-sm text-slate-400">{t("anatomy.loading")}</p>
        </Card>
      ) : anatomy ? (
        <div className="space-y-5">
          {loading && <div className="text-xs font-medium text-brand-400">{t("anatomy.loading")}</div>}
          <div className={"space-y-5 transition-opacity " + (loading ? "opacity-50" : "")}>
            <MetaStrip a={anatomy} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ParamCard a={anatomy} />
              <PrecisionCard a={anatomy} />
              <ArchCard a={anatomy} />
              <KvCard a={anatomy} />
            </div>
          </div>
          <p className="text-xs text-slate-500">{t("anatomy.disclaimer")}</p>
        </div>
      ) : (
        <Card className="p-5">
          <p className="py-10 text-center text-sm text-slate-400">{t("anatomy.empty")}</p>
        </Card>
      )}
    </div>
  );
}

function MetaStrip({ a }: { a: Anatomy }) {
  const { t } = useLang();
  const cells: { label: string; value: ReactNode }[] = [
    { label: t("anatomy.meta.downloads"), value: a.downloads != null ? formatParams(a.downloads) : "—" },
    { label: t("anatomy.meta.likes"), value: a.likes != null ? formatInt(a.likes) : "—" },
    { label: t("anatomy.meta.license"), value: a.license ? a.license.toUpperCase() : "—" },
    { label: t("anatomy.meta.updated"), value: ymd(a.lastModified) },
    { label: t("anatomy.meta.size"), value: gb(a.usedStorage) },
  ];
  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cells.map((c, i) => (
          <div key={i}>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{c.label}</div>
            <div className="mt-0.5 text-sm font-semibold text-white">{c.value}</div>
          </div>
        ))}
      </div>
      {a.baseModel && (
        <div className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">
          {t("anatomy.meta.base")}{" "}
          <a
            href={`https://huggingface.co/${a.baseModel}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-400 hover:underline"
          >
            {a.baseModel}
          </a>
        </div>
      )}
    </Card>
  );
}

function ParamCard({ a }: { a: Anatomy }) {
  const { t } = useLang();
  const d = a.paramDist;
  const ffnLabel = d.ffnLabel === "experts" ? t("anatomy.params.experts") : t("anatomy.params.mlp");
  const segs: DonutSeg[] = [
    { label: t("anatomy.params.embeddings"), value: d.embeddings, color: "#10b981", sub: formatParams(d.embeddings) },
    { label: t("anatomy.params.attention"), value: d.attention, color: "#6366f1", sub: formatParams(d.attention) },
    { label: ffnLabel, value: d.ffn, color: "#f59e0b", sub: formatParams(d.ffn) },
  ].filter((s) => s.value > 0);

  return (
    <Card className="p-5">
      <SectionTitle title={t("anatomy.params.title")} />
      <Donut segments={segs} centerTop={formatParams(d.total)} centerBottom={t("anatomy.params.totalSub")} />
      {d.ffnActive != null && (
        <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90 ring-1 ring-amber-500/20">
          {t("anatomy.params.activeNote", {
            active: formatParams(d.ffnActive),
            experts: a.numExperts ?? 0,
            perTok: a.expertsPerTok ?? 0,
          })}
        </p>
      )}
    </Card>
  );
}

function PrecisionCard({ a }: { a: Anatomy }) {
  const { t } = useLang();
  const p = a.numParams;
  const rows: { label: string; bytes: number; tiers: DtypeTier[] }[] = [
    { label: "BF16 / FP16", bytes: DTYPE_BYTES.fp16, tiers: ["half"] },
    { label: "FP8 / INT8", bytes: DTYPE_BYTES.fp8, tiers: ["fp8", "int8"] },
    { label: "INT4", bytes: DTYPE_BYTES.int4, tiers: ["int4"] },
  ];
  // Only surface the FP32 row for an fp32-native model, so it can be highlighted.
  if (a.weightDtype === "fp32") rows.unshift({ label: "FP32", bytes: DTYPE_BYTES.fp32, tiers: ["full"] });
  const bars = rows.map((b) => {
    const gib = (p * b.bytes) / BYTES_PER_GIB;
    const native = a.weightDtype ? b.tiers.includes(tierOf(a.weightDtype)) : false;
    return { label: b.label, value: gib, valueLabel: formatGiB(gib), color: "#6366f1", highlight: native };
  });

  const dtypeSegs: DonutSeg[] = a.dtypeParts.map((d) => ({
    label: d.dtype,
    value: d.count,
    color: TIER_COLOR[d.tier],
    sub: formatParams(d.count),
  }));

  return (
    <Card className="p-5">
      <SectionTitle title={t("anatomy.precision.title")} />
      {dtypeSegs.length > 0 ? (
        <>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
            {t("anatomy.precision.mix")}
          </div>
          <Donut segments={dtypeSegs} centerTop={a.weightDtype ? a.weightDtype.toUpperCase() : ""} centerBottom={t("anatomy.precision.native")} />
        </>
      ) : (
        <p className="mb-3 text-xs text-slate-500">{t("anatomy.precision.mixNA")}</p>
      )}
      <div className="mt-4 mb-2 text-[11px] uppercase tracking-wide text-slate-400">
        {t("anatomy.precision.memTitle")}
      </div>
      <HBars items={bars} />
    </Card>
  );
}

function ArchCard({ a }: { a: Anatomy }) {
  const { t } = useLang();
  const ar = a.arch;
  const gqa = ar.numKeyValueHeads > 0 && ar.numKeyValueHeads < ar.numAttentionHeads;
  const gqaRatio = ar.numKeyValueHeads > 0 ? Math.round(ar.numAttentionHeads / ar.numKeyValueHeads) : 1;
  const mlpRatio = a.intermediateSize ? (a.intermediateSize / ar.hiddenSize).toFixed(1) + "×" : "—";
  const ctxK = ar.maxContext ? (ar.maxContext >= 1024 ? `${Math.round(ar.maxContext / 1024)}k` : String(ar.maxContext)) : "—";

  return (
    <Card className="p-5">
      <SectionTitle title={t("anatomy.arch.title")} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Spec label={t("anatomy.arch.layers")} value={ar.numLayers} />
        <Spec label={t("anatomy.arch.hidden")} value={ar.hiddenSize} />
        <Spec label={t("anatomy.arch.headDim")} value={a.headDim} />
        <Spec label={t("anatomy.arch.heads")} value={`${ar.numAttentionHeads} / ${ar.numKeyValueHeads}`} sub={gqa ? "GQA" : "MHA"} />
        {!a.isMoE && (
          <Spec label={t("anatomy.arch.mlpRatio")} value={mlpRatio} sub={a.intermediateSize ? formatInt(a.intermediateSize) : undefined} />
        )}
        <Spec label={t("anatomy.arch.context")} value={ctxK} />
        <Spec label={t("anatomy.arch.vocab")} value={ar.vocabSize ? formatInt(ar.vocabSize) : "—"} />
        {a.numExperts != null && (
          <Spec label={t("anatomy.arch.experts")} value={`${a.expertsPerTok ?? "?"} / ${a.numExperts}`} sub={t("anatomy.arch.expertsSub")} />
        )}
        {a.ropeTheta != null && <Spec label="RoPE θ" value={formatInt(a.ropeTheta)} />}
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">{t("anatomy.arch.gqaTitle")}</div>
      <p className="mb-2 mt-0.5 text-xs text-slate-400">
        {gqa
          ? t("anatomy.arch.gqaNote", { q: ar.numAttentionHeads, kv: ar.numKeyValueHeads, ratio: gqaRatio })
          : t("anatomy.arch.mhaNote", { n: ar.numAttentionHeads })}
      </p>
      <GqaDiagram attnHeads={ar.numAttentionHeads} kvHeads={ar.numKeyValueHeads} />
    </Card>
  );
}

function KvCard({ a }: { a: Anatomy }) {
  const { t } = useLang();
  const ar = a.arch;
  const maxCtx = Math.min(ar.maxContext || 131072, 131072);
  const N = 24;
  const perTokenGQA = kvBytesPerToken(ar, "fp16");
  const mhaFactor = ar.numKeyValueHeads > 0 ? ar.numAttentionHeads / ar.numKeyValueHeads : 1;
  const pts = Array.from({ length: N + 1 }, (_, i) => (maxCtx * i) / N);
  const gqaSeries = pts.map((x) => ({ x, y: (perTokenGQA * x) / BYTES_PER_GIB }));
  const mhaSeries = pts.map((x) => ({ x, y: (perTokenGQA * mhaFactor * x) / BYTES_PER_GIB }));
  const yMax = mhaSeries[mhaSeries.length - 1].y || 1;
  const gqa = ar.numKeyValueHeads < ar.numAttentionHeads;
  const series = gqa
    ? [
        { points: mhaSeries, color: "#64748b", dashed: true },
        { points: gqaSeries, color: "#6366f1" },
      ]
    : [{ points: gqaSeries, color: "#6366f1" }];
  const ticks = [0, maxCtx / 2, maxCtx];
  const fmtX = (x: number) => (x >= 1024 ? `${Math.round(x / 1024)}k` : String(Math.round(x)));

  return (
    <Card className="p-5">
      <SectionTitle title={t("anatomy.kv.title")} />
      <LineChart
        series={series}
        xMax={maxCtx}
        yMax={yMax}
        formatX={fmtX}
        formatY={(y) => formatGiB(y)}
        xTicks={ticks}
      />
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full" style={{ backgroundColor: "#6366f1" }} />
          {t("anatomy.kv.gqaLegend")}
        </span>
        {gqa && (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ backgroundColor: "#64748b" }} />
            {t("anatomy.kv.mhaLegend")}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {gqa ? t("anatomy.kv.noteGqa", { ratio: Math.round(mhaFactor) }) : t("anatomy.kv.noteMha")}
        {" "}
        <Badge tone="neutral">{formatGiB(gqaSeries[gqaSeries.length - 1].y)} @ {fmtX(maxCtx)}</Badge>
      </p>
    </Card>
  );
}
