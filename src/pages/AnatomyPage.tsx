import { useEffect, useState, type ReactNode } from "react";
import { BYTES_PER_GIB, DTYPE_BYTES, kvBytesPerToken, type ModelArch } from "../lib/calc";
import { fetchAnatomy, tierOf, type Anatomy, type DtypeTier } from "../lib/anatomy";
import { useLang } from "../lib/i18n";
import { formatGiB, formatInt, formatParams } from "../lib/format";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Donut, HBars, LineChart, type DonutSeg } from "../components/charts";
import { ArchDiagram } from "../components/ArchDiagram";
import { Card } from "../components/ui";

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
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Card className="relative z-30 shrink-0 p-3">
        <ModelPicker
          hfId={hfId}
          arch={arch}
          meta={meta}
          hideCustom
          compact
          onModel={(id, a, m) => {
            if (id) setHfId(id);
            setArch(a);
            setMeta(m ?? null);
          }}
        />
      </Card>

      {loading && !anatomy ? (
        <Card className="flex flex-1 items-center justify-center p-5">
          <p className="text-sm text-slate-400">{t("anatomy.loading")}</p>
        </Card>
      ) : anatomy ? (
        <div className={"min-h-0 flex-1 transition-opacity " + (loading ? "opacity-50" : "opacity-100")}>
          <div className="grid grid-cols-1 gap-3 lg:h-full lg:grid-cols-12">
            {/* left — annotated architecture diagram, fills the column */}
            <Card className="flex min-h-0 flex-col p-3 lg:col-span-7 lg:h-full">
              <div className="mb-1 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-white">{t("anatomy.arch.title")}</h2>
                <span className="hidden text-[11px] text-slate-400 sm:inline">{t("anatomy.arch.hint")}</span>
              </div>
              <div className="mt-1 flex min-h-0 flex-1 items-center justify-center overflow-auto lg:overflow-hidden">
                <ArchDiagram a={anatomy} />
              </div>
            </Card>

            {/* right — meta + charts, scrolls only if the viewport is short */}
            <div className="flex min-h-0 flex-col gap-2 lg:col-span-5 lg:h-full lg:overflow-y-auto">
              <MetaStrip a={anatomy} />
              <ParamCard a={anatomy} />
              <PrecisionCard a={anatomy} />
              <KvCard a={anatomy} />
            </div>
          </div>
        </div>
      ) : (
        <Card className="flex flex-1 items-center justify-center p-5">
          <p className="text-sm text-slate-400">{t("anatomy.empty")}</p>
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
    <Card className="shrink-0 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {cells.map((c, i) => (
          <span key={i} className="inline-flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">{c.label}</span>
            <span className="font-semibold text-white">{c.value}</span>
          </span>
        ))}
      </div>
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
    <Card className="shrink-0 px-3 py-2">
      <h3 className="mb-1 text-sm font-semibold tracking-tight text-white">{t("anatomy.params.title")}</h3>
      <Donut segments={segs} size={96} thickness={16} centerTop={formatParams(d.total)} centerBottom={t("anatomy.params.totalSub")} />
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
  if (a.weightDtype === "fp32") rows.unshift({ label: "FP32", bytes: DTYPE_BYTES.fp32, tiers: ["full"] });
  const bars = rows.map((b) => {
    const gib = (p * b.bytes) / BYTES_PER_GIB;
    const native = a.weightDtype ? b.tiers.includes(tierOf(a.weightDtype)) : false;
    return { label: b.label, value: gib, valueLabel: formatGiB(gib), color: "#6366f1", highlight: native };
  });

  return (
    <Card className="shrink-0 px-3 py-2">
      <div className="mb-1.5 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-white">{t("anatomy.precision.title")}</h3>
        {a.weightDtype && (
          <span className="text-[11px] text-slate-400">
            {t("anatomy.precision.native")}{" "}
            <span className="font-semibold" style={{ color: TIER_COLOR[tierOf(a.weightDtype)] }}>
              {a.weightDtype.toUpperCase()}
            </span>
          </span>
        )}
      </div>
      <HBars items={bars} />
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
    <Card className="shrink-0 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-white">{t("anatomy.kv.title")}</h3>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
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
      </div>
      <LineChart
        series={series}
        xMax={maxCtx}
        yMax={yMax}
        height={88}
        formatX={fmtX}
        formatY={(y) => formatGiB(y)}
        xTicks={ticks}
      />
    </Card>
  );
}
