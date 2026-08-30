import { useEffect, useMemo, useState } from "react";
import type { ModelArch } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { findKnownByHfId } from "../lib/models";
import { DRIVER_RESERVE, GPUS, GPU_CATEGORIES, usableGiB, type GpuCategory } from "../lib/gpus";
import { estimateTraining, type LoraTarget, type TrainMode } from "../lib/train";
import { formatGiB, formatInt, formatParams } from "../lib/format";
import { useLang } from "../lib/i18n";
import { AMBER, GREY, GREEN, INDIGO, PURPLE, RED } from "../lib/palette";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Badge, Card, Field, NumberInput, SectionTitle, Segmented } from "../components/ui";

const HERO = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;
const OVERHEAD_GIB = 1;

function initial() {
  const p = new URLSearchParams(window.location.search);
  const mode = p.get("mode") as TrainMode | null;
  const tgt = p.get("tgt") as LoraTarget | null;
  return {
    hfId: p.get("m") || HERO.hfId,
    mode: mode === "full" || mode === "lora" || mode === "qlora" ? mode : "lora",
    batchSize: Number(p.get("b")) || 1,
    seqLength: Number(p.get("s")) || 2048,
    ckpt: p.get("ckpt") !== "0",
    rank: Number(p.get("r")) || 16,
    target: tgt === "attn" || tgt === "all" ? tgt : "attn",
    gpuId: p.get("gpu") || "rtx4090-24",
  };
}

export function TrainPage() {
  const { t } = useLang();
  const init = initial();
  const [hfId, setHfId] = useState(init.hfId);
  const [arch, setArch] = useState<ModelArch | null>(init.hfId === HERO.hfId ? { ...HERO } : null);
  const [meta, setMeta] = useState<ResolvedMeta | null>(
    init.hfId === HERO.hfId ? { source: "bundled", gated: true, modelType: "llama" } : null
  );
  const [mode, setMode] = useState<TrainMode>(init.mode);
  const [batchSize, setBatchSize] = useState(init.batchSize);
  const [seqLength, setSeqLength] = useState(init.seqLength);
  const [ckpt, setCkpt] = useState(init.ckpt);
  const [rank, setRank] = useState(init.rank);
  const [target, setTarget] = useState<LoraTarget>(init.target);
  const [gpuId, setGpuId] = useState(init.gpuId);

  useEffect(() => {
    if (hfId && !arch) {
      resolveModel(hfId).then((r) => {
        setMeta({
          source: r.source, gated: r.gated, modelType: r.modelType, isMoE: r.isMoE,
          tags: r.tags, pipelineTag: r.pipelineTag, warningKey: r.warningKey,
        });
        setArch(r.arch ?? { numParams: r.numParams || 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (hfId) p.set("m", hfId);
    p.set("mode", mode);
    p.set("b", String(batchSize));
    p.set("s", String(seqLength));
    if (!ckpt) p.set("ckpt", "0");
    if (mode !== "full") {
      p.set("r", String(rank));
      p.set("tgt", target);
    }
    p.set("gpu", gpuId);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [hfId, mode, batchSize, seqLength, ckpt, rank, target, gpuId]);

  const result = useMemo(
    () =>
      arch
        ? estimateTraining({
            arch, mode, batchSize, seqLength,
            gradientCheckpointing: ckpt, loraRank: rank, loraTarget: target, overheadGiB: OVERHEAD_GIB,
          })
        : null,
    [arch, mode, batchSize, seqLength, ckpt, rank, target]
  );

  const gpu = GPUS.find((g) => g.id === gpuId) ?? GPUS[0];
  const usable = usableGiB(gpu);
  const fits = result ? result.totalGiB <= usable : false;
  const needed = result ? Math.ceil(result.totalGiB / usable) : 0;
  const smallestFit = result
    ? [...GPUS].sort((a, b) => usableGiB(a) - usableGiB(b)).find((g) => result.totalGiB <= usableGiB(g))
    : undefined;

  const segments = result
    ? [
        { key: "base", v: result.baseWeightsGiB, c: INDIGO },
        { key: "grads", v: result.gradientsGiB, c: GREEN },
        { key: "optim", v: result.optimizerGiB, c: PURPLE },
        { key: "act", v: result.activationsGiB, c: AMBER },
        { key: "overhead", v: result.overheadGiB, c: GREY },
      ].filter((s) => s.v > 0)
    : [];

  function jump(cat: GpuCategory) {
    const list = GPUS.filter((g) => g.category === cat).sort((a, b) => usableGiB(a) - usableGiB(b));
    const fit = result ? list.find((g) => result.totalGiB <= usableGiB(g)) : undefined;
    setGpuId((fit ?? list[list.length - 1]).id);
  }

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("train.subtitle")}</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="p-5 relative z-30">
            <ModelPicker
              hfId={hfId}
              arch={arch}
              meta={meta}
              onModel={(id, a, m) => {
                setHfId(id);
                setArch(a);
                setMeta(m ?? null);
              }}
            />
          </Card>

          <Card className="p-5 space-y-5">
            <SectionTitle step="2" title={t("train.setup")} />

            <Field label={t("train.mode")}>
              <Segmented<TrainMode>
                value={mode}
                onChange={setMode}
                size="sm"
                options={[
                  { value: "qlora", label: "QLoRA" },
                  { value: "lora", label: "LoRA" },
                  { value: "full", label: t("train.mode.full") },
                ]}
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{t(`train.modeNote.${mode}`)}</p>
            </Field>

            {mode !== "full" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("train.rank")} hint={result ? formatParams(result.trainableParams) : undefined}>
                  <NumberInput value={rank} onChange={(v) => setRank(Math.max(1, Math.min(512, v)))} min={1} max={512} />
                </Field>
                <Field label={t("train.target")}>
                  <Segmented<LoraTarget>
                    value={target}
                    onChange={setTarget}
                    size="sm"
                    options={[
                      { value: "attn", label: t("train.target.attn") },
                      { value: "all", label: t("train.target.all") },
                    ]}
                  />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("train.batch")}>
                <NumberInput value={batchSize} onChange={(v) => setBatchSize(Math.max(1, Math.min(512, v)))} min={1} />
              </Field>
              <Field label={t("train.seq")} hint={arch?.maxContext ? formatInt(arch.maxContext) : undefined}>
                <NumberInput value={seqLength} onChange={(v) => setSeqLength(Math.max(128, v))} min={128} step={512} suffix="tok" />
              </Field>
            </div>

            <Field label={t("train.ckpt")} hint={t("train.ckptHint")}>
              <Segmented<string>
                value={ckpt ? "on" : "off"}
                onChange={(v) => setCkpt(v === "on")}
                size="sm"
                options={[
                  { value: "on", label: t("train.on") },
                  { value: "off", label: t("train.off") },
                ]}
              />
            </Field>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            {result ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <SectionTitle step="3" title={t("train.results")} />
                  <div className="text-right">
                    <div className="text-3xl font-bold leading-none text-white">{formatGiB(result.totalGiB)}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{t("train.totalRequired")}</div>
                  </div>
                </div>

                <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
                  {segments.map((s) => (
                    <span key={s.key} style={{ width: `${(s.v / result.totalGiB) * 100}%`, backgroundColor: s.c }} />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-slate-400">
                  {segments.map((s) => (
                    <span key={s.key} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.c }} />
                      {t(`train.seg.${s.key}`)} — <b className="font-semibold text-white">{formatGiB(s.v)}</b>
                    </span>
                  ))}
                </div>

                {/* The point people miss: freezing the base does not make the
                    backward pass cheaper, so activations stay where they are. */}
                <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
                  {mode === "full" ? t("train.noteFull") : t("train.noteAdapter")}
                </p>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">{t("results.empty")}</p>
            )}
          </Card>

          {result && (
            <Card className="p-5">
              <SectionTitle step="4" title={t("train.gpuFit")} hint={t("gpu.usableHint", { p: Math.round(DRIVER_RESERVE * 100) })} />

              <div className="mb-3 flex flex-wrap gap-1.5">
                {GPU_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => jump(cat)}
                    className={
                      "rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition " +
                      (gpu.category === cat
                        ? "bg-brand-600/20 text-white ring-brand-500/60"
                        : "bg-ink-850/40 text-slate-400 ring-white/10 hover:text-slate-200")
                    }
                  >
                    {t(`cat.${cat}`)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <select
                  value={gpuId}
                  onChange={(e) => setGpuId(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg bg-ink-800 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-control outline-none focus:ring-brand-500/60"
                >
                  {GPUS.filter((g) => g.category === gpu.category).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.totalGiB ?? g.vramGiB} GB
                    </option>
                  ))}
                </select>
                {fits ? (
                  <Badge tone="good">{t("gpu.fits")}</Badge>
                ) : (
                  <Badge tone="bad">{t("gpu.needs", { n: needed })}</Badge>
                )}
              </div>

              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (result.totalGiB / usable) * 100)}%`,
                    backgroundColor: fits ? GREEN : RED,
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {t("gpu.usage", {
                  x: formatGiB(result.totalGiB),
                  y: gpu.totalGiB ?? gpu.vramGiB,
                  p: Math.round((result.totalGiB / usable) * 100),
                })}
              </div>

              {!fits && (
                <div className="mt-3 rounded-xl bg-ink-800/60 p-3">
                  {/* Sharding is the norm in training and ZeRO-3 / FSDP really
                      does divide these terms, unlike inference weights. */}
                  <p className="text-[11.5px] leading-relaxed text-slate-400">{t("train.shardNote")}</p>
                  {smallestFit && (
                    <button
                      type="button"
                      onClick={() => setGpuId(smallestFit.id)}
                      className="mt-2 rounded-lg bg-ink-850 px-2.5 py-1.5 text-left text-[11.5px] ring-1 ring-control transition hover:bg-white/5"
                    >
                      <span className="block font-medium text-white">{smallestFit.name}</span>
                      <span className="text-slate-400">{t("gpu.recSmallest")}</span>
                    </button>
                  )}
                </div>
              )}

              <p className="mt-3 border-t border-ink-700 pt-3 text-[11px] leading-relaxed text-slate-500">
                {t("train.method")}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
