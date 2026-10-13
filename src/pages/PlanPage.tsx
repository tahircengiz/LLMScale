import { useEffect, useMemo, useState } from "react";
import type { Dtype, ModelArch } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { findKnownByHfId } from "../lib/models";
import { GPUS, GPU_CATEGORIES, runsVllm, type Gpu } from "../lib/gpus";
import { planOptions, type Limit, type Workload } from "../lib/planner";
import { formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Badge, Card, Field, SectionTitle, Segmented, Stat } from "../components/ui";
import { ChipField, Select, type Choice } from "../components/choice";
import { contextChoices, gpuHint, outputChoices, prefixChoices, promptChoices, rpsChoices, tpotChoices, ttftChoices } from "../lib/choices";
import { PresetChips } from "../components/PresetChips";

// "How many GPUs does my load take?" (planner.ts): requests per second, their
// lengths and latency targets in; replicas, tensor-parallel size and GPU count out.

const HERO = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;
/** Devices the plan can run on: vLLM serves them, and both bounds are known. */
const PLANNABLE = GPUS.filter((g) => runsVllm(g) && g.tflops && g.bandwidthGBs);

const WEIGHT_DTYPES: { value: Dtype; label: string }[] = [
  { value: "bf16", label: "BF16" },
  { value: "fp8", label: "FP8" },
  { value: "int4", label: "INT4" },
];
const KV_DTYPES: { value: Dtype; label: string }[] = [
  { value: "fp16", label: "FP16" },
  { value: "fp8", label: "FP8" },
];

function initial() {
  const p = new URLSearchParams(window.location.search);
  const n = (k: string, d: number) => {
    const v = Number(p.get(k));
    return Number.isFinite(v) && v > 0 ? v : d;
  };
  const wanted = p.get("gpu") || "h100-80";
  return {
    hfId: p.get("m") || HERO.hfId,
    gpuId: PLANNABLE.some((g) => g.id === wanted) ? wanted : "h100-80",
    rps: n("rps", 10),
    prompt: n("ip", 2000),
    output: p.has("op") ? Math.max(0, Number(p.get("op")) || 0) : 256,
    prefix: Math.max(0, Number(p.get("px")) || 0),
    ttft: n("ttft", 1),
    tpot: n("tpot", 50),
    ctx: n("ctx", 8192),
    wd: (p.get("wd") as Dtype) || null,
    kd: (p.get("kd") as Dtype) || "fp16",
  };
}

const ms = (s: number) => (s >= 10 ? `${s.toFixed(0)} s` : s >= 1 ? `${s.toFixed(1)} s` : `${Math.round(s * 1000)} ms`);

export function PlanPage() {
  const { t, lang } = useLang();
  const init = useMemo(initial, []);
  const [hfId, setHfId] = useState(init.hfId);
  const [arch, setArch] = useState<ModelArch | null>(init.hfId === HERO.hfId ? { ...HERO } : null);
  const [meta, setMeta] = useState<ResolvedMeta | null>(init.hfId === HERO.hfId ? { source: "bundled", gated: true, modelType: "llama" } : null);
  const [gpuId, setGpuId] = useState(init.gpuId);
  const [weightDtype, setWeightDtype] = useState<Dtype>(init.wd ?? "bf16");
  const [kvDtype, setKvDtype] = useState<Dtype>(init.kd);
  const [w, setW] = useState<Workload>({
    rps: init.rps,
    promptTokens: init.prompt,
    outputTokens: init.output,
    sharedPrefix: Math.min(init.prefix, init.prompt),
    ttftS: init.ttft,
    tpotMs: init.tpot,
  });
  const [ctx, setCtx] = useState(init.ctx);
  const patch = (p: Partial<Workload>) => setW((x) => ({ ...x, ...p }));

  useEffect(() => {
    if (hfId && !arch)
      resolveModel(hfId).then((r) => {
        setMeta({ source: r.source, gated: r.gated, modelType: r.modelType, isMoE: r.isMoE, weightDtype: r.weightDtype, warningKey: r.warningKey });
        setArch(r.arch ?? null);
        if (r.weightDtype && !init.wd) setWeightDtype(r.weightDtype);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (hfId) p.set("m", hfId);
    p.set("gpu", gpuId);
    p.set("rps", String(w.rps));
    p.set("ip", String(w.promptTokens));
    p.set("op", String(w.outputTokens));
    if (w.sharedPrefix) p.set("px", String(w.sharedPrefix));
    p.set("ttft", String(w.ttftS));
    p.set("tpot", String(w.tpotMs));
    p.set("ctx", String(ctx));
    p.set("wd", weightDtype);
    p.set("kd", kvDtype);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [hfId, gpuId, w, ctx, weightDtype, kvDtype]);

  const gpu: Gpu | undefined = PLANNABLE.find((g) => g.id === gpuId) ?? PLANNABLE[0];
  // Every request has to fit --max-model-len, prompt and reply together.
  const maxLen = Math.max(ctx, w.promptTokens + w.outputTokens);
  const plan = useMemo(
    () => (arch && gpu ? planOptions({ arch, weightDtype, kvDtype, maxModelLen: maxLen }, w, gpu) : null),
    [arch, weightDtype, kvDtype, maxLen, w, gpu],
  );
  const best = plan?.options[0];
  const home = import.meta.env.BASE_URL + (lang === "tr" ? "tr/" : "");
  const vllmLink = best && gpu
    ? `${home}vllm.html?m=${encodeURIComponent(hfId)}&gpu=${gpu.id}&n=${best.tp}&ctx=${maxLen}`
    : null;
  const limitText = (l: Limit) => t(`plan.limit.${l}`);
  /** The chips: a few common values out of each setting's options. */
  const pick = (opts: Choice<number>[], values: number[]) => opts.filter((o) => values.includes(o.value));
  const kTok = (n: number) => (n >= 1024 && n % 1024 === 0 ? `${n / 1024}k` : n >= 1000 && n % 1000 === 0 ? `${n / 1000}k` : String(n));

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("plan.subtitle")}</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="relative z-30 p-5">
            <ModelPicker
              hfId={hfId}
              arch={arch}
              meta={meta}
              onModel={(id, a, m) => {
                setHfId(id);
                setArch(a);
                setMeta(m ?? null);
                if (m?.weightDtype) setWeightDtype(m.weightDtype);
              }}
            />
          </Card>
          <Card className="space-y-5 p-5">
            <SectionTitle step="2" title={t("plan.loadTitle")} />
            <PresetChips
              hfId={hfId}
              maxContext={arch?.maxContext}
              current={w}
              onApply={(a) => {
                setW((x) => ({ ...x, promptTokens: a.promptTokens, outputTokens: a.outputTokens, sharedPrefix: a.sharedPrefix, ttftS: a.ttftS, tpotMs: a.tpotMs }));
                // --max-model-len has to hold the request.
                setCtx((c) => Math.max(c, a.promptTokens + a.outputTokens));
              }}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ChipField label={t("plan.rps")} info={t("info.rps")} aside={t("plan.rpsHint")} value={w.rps}
                chips={pick(rpsChoices(t, lang), [1, 2, 5, 10, 20, 50, 100])}
                onChange={(v) => patch({ rps: Math.max(0.01, v) })} min={0.01} step={1} />
              <ChipField label={t("plan.ctx")} info={t("info.maxLen")} aside="--max-model-len" value={ctx}
                chips={pick(contextChoices(t, lang, arch?.maxContext), [4096, 8192, 16384, 32768, 65536, 131072])} chipLabel={kTok}
                onChange={(v) => setCtx(Math.max(256, v))} min={256} step={1024} suffix={t("controls.tok")} />
              <ChipField label={t("controls.loadPrompt")} info={t("info.loadPrompt")} value={w.promptTokens}
                chips={pick(promptChoices(t, lang), [512, 1000, 2000, 4000, 8000, 16000])} chipLabel={kTok}
                onChange={(v) => patch({ promptTokens: Math.max(1, v), sharedPrefix: Math.min(w.sharedPrefix, Math.max(1, v)) })} min={1} step={256} suffix={t("controls.tok")} />
              <ChipField label={t("controls.loadOutput")} info={t("info.loadOutput")} value={w.outputTokens}
                chips={pick(outputChoices(t, lang), [64, 128, 256, 512, 1000, 4000])} chipLabel={kTok}
                onChange={(v) => patch({ outputTokens: Math.max(0, v) })} min={0} step={64} suffix={t("controls.tok")} />
              <ChipField label={t("controls.loadPrefix")} info={t("info.loadPrefix")} aside={t("plan.prefixHint")} value={w.sharedPrefix}
                chips={pick(prefixChoices(t, lang), [0, 256, 512, 1000, 2000, 4000]).filter((o) => o.value <= w.promptTokens)} chipLabel={kTok}
                onChange={(v) => patch({ sharedPrefix: Math.max(0, Math.min(v, w.promptTokens)) })} min={0} step={256} suffix={t("controls.tok")} />
            </div>
            <SectionTitle step="3" title={t("plan.targetsTitle")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ChipField label={t("plan.ttft")} info={t("info.ttft")} aside={t("plan.ttftHint")} value={w.ttftS}
                chips={pick(ttftChoices(t, lang), [0.2, 0.5, 1, 2, 6])}
                onChange={(v) => patch({ ttftS: Math.max(0.001, v) })} min={0.001} step={0.1} suffix="s" />
              <ChipField label={t("plan.tpot")} info={t("info.tpot")} aside={t("plan.tpotHint", { n: formatInt(Math.round(1000 / Math.max(1, w.tpotMs))) })}
                value={w.tpotMs} chips={pick(tpotChoices(t, lang), [20, 30, 40, 50, 100])}
                onChange={(v) => patch({ tpotMs: Math.max(0.1, v) })} min={0.1} step={5} suffix="ms" />
            </div>
            <SectionTitle step="4" title={t("plan.hwTitle")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="GPU" info={t("info.gpu")}>
                <Select
                  id="plan-gpu"
                  label="GPU"
                  value={gpu?.id ?? ""}
                  options={GPU_CATEGORIES.flatMap((c) =>
                    PLANNABLE.filter((g) => g.category === c).map((g) => ({
                      value: g.id,
                      label: `${g.name} — ${g.totalGiB ?? g.vramGiB} GB`,
                      hint: gpuHint(t, g, lang),
                      group: t(`cat.${c}`),
                    })),
                  )}
                  onChange={setGpuId}
                />
              </Field>
              <div className="space-y-3">
                <Field label={t("controls.weightQuant")} info={t("info.weightQuant")}>
                  <Segmented<Dtype> value={weightDtype} options={WEIGHT_DTYPES.map((o) => ({ ...o, hint: t(`hint.wd.${o.value}`) }))} onChange={setWeightDtype} size="sm" />
                </Field>
                <Field label={t("controls.kvPrecision")} info={t("info.kvPrecision")}>
                  <Segmented<Dtype> value={kvDtype} options={KV_DTYPES.map((o) => ({ ...o, hint: t(`hint.kv.${o.value}`) }))} onChange={setKvDtype} size="sm" />
                </Field>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle title={t("plan.resultTitle")} />
            {!arch ? (
              <p className="py-10 text-center text-sm text-slate-400">{t("vllm.empty")}</p>
            ) : best ? (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-white">
                      {best.gpus} × {gpu?.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t(best.tp === 1 ? "plan.shape1" : "plan.shape", { r: best.replicas, tp: best.tp, rps: best.replicaRps.toFixed(1) })}
                    </div>
                  </div>
                  <Badge tone="neutral">{limitText(best.limit)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Stat label={t("plan.statTtft")} value={ms(best.ttftS)} sub={t("plan.target", { x: ms(w.ttftS) })} />
                  <Stat label={t("plan.statTpot")} value={`${best.tpotMs.toFixed(1)} ms`} sub={t("plan.target", { x: `${w.tpotMs} ms` })} />
                  <Stat label={t("plan.statBatch")} value={formatInt(Math.round(best.batch))} sub={t("plan.statBatchSub")} />
                  <Stat label={t("plan.statKv")} value={formatInt(best.kvSeqs)} sub={t("plan.statKvSub")} />
                </div>
                {vllmLink && (
                  <a href={vllmLink} className="mt-3 inline-block text-[11.5px] font-medium text-brand-400 hover:underline">
                    {t("plan.toVllm", { tp: best.tp })}
                  </a>
                )}

                <div className="mt-5 text-[11px] uppercase tracking-wide text-slate-400">{t("plan.optionsTitle")}</div>
                <div className="mt-2 overflow-x-auto rounded-xl ring-1 ring-white/10">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] text-slate-400">
                        <th scope="col" className="px-3 py-2 font-medium">TP</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">{t("plan.col.replicas")}</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">GPU</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">{t("plan.col.rps")}</th>
                        <th scope="col" className="px-3 py-2 font-medium">{t("plan.col.limit")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {plan!.options.map((o) => (
                        <tr key={o.tp} className={o === best ? "bg-brand-600/10" : undefined}>
                          <th scope="row" className="px-3 py-2 font-medium text-white">{o.tp}</th>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-200">{o.replicas}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-white">{o.gpus}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-200">{o.replicaRps.toFixed(1)}</td>
                          <td className="px-3 py-2 text-slate-400">{limitText(o.limit)}</td>
                        </tr>
                      ))}
                      {plan!.infeasible.map((x) => (
                        <tr key={`x${x.tp}`}>
                          <th scope="row" className="px-3 py-2 font-medium text-slate-500">{x.tp}</th>
                          <td colSpan={4} className="px-3 py-2 text-slate-500">{t(`plan.no.${x.reason}`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <p className="text-sm text-warn">{t("plan.none")}</p>
                <ul className="space-y-1 text-xs text-slate-400">
                  {plan?.infeasible.map((x) => (
                    <li key={x.tp}>
                      TP {x.tp}: {t(`plan.no.${x.reason}`)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{t("plan.note")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
