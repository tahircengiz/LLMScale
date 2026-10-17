import { useEffect, useMemo, useState } from "react";
import type { ModelArch } from "../lib/calc";
import { placeholderArch, resolveModel } from "../lib/hf";
import { fetchSnapshot } from "../lib/repoFetch";
import { buildBrief, type Parsers } from "../lib/serving";
import { findKnownByHfId } from "../lib/models";
import { extractCaps } from "../lib/fit";
import { recommend, servingDtype, PRIORITIES, VLLM_TASKS, type Priority, type VllmTask } from "../lib/vllm";
import { GPUS, GPU_CATEGORIES, migMem, migProfilesFor, runsVllm } from "../lib/gpus";
import { useLang } from "../lib/i18n";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Card, Field, SectionTitle, Segmented } from "../components/ui";
import { AdvancedToggle, PickField, Select } from "../components/choice";
import { Tip } from "../components/tip";
import { contextChoices, gpuCountChoices, gpuHint } from "../lib/choices";
import { formatGiB, formatInt } from "../lib/format";
import { layoutKey, layoutLabel, parseLayoutKey } from "../lib/parallel";
import { LogCheck } from "../components/LogCheck";

const HERO = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;

function initial() {
  const p = new URLSearchParams(window.location.search);
  const prio = p.get("prio") as Priority | null;
  const task = p.get("task") as VllmTask | null;
  // A shared link can carry a device this page cannot serve on (e.g. an Apple
  // one picked on the sizing page); fall back and say so rather than showing an
  // empty picker.
  const wanted = p.get("gpu") || "h100-80";
  const usable = GPUS.some((g) => g.id === wanted && runsVllm(g));
  return {
    hfId: p.get("m") || HERO.hfId,
    prio: prio && PRIORITIES.includes(prio) ? prio : "balanced",
    task: task && VLLM_TASKS.includes(task) ? task : "chat",
    swappedFrom: usable ? null : GPUS.find((g) => g.id === wanted)?.name ?? null,
    gpuId: usable ? wanted : "h100-80",
    gpuCount: Number(p.get("n")) || 1,
    ctx: Number(p.get("ctx")) || 8192,
    mig: p.get("mig") || "",
    // A layout the calculator or the planner picked (parallel.ts, layoutKey).
    lay: parseLayoutKey(p.get("lay")) ? p.get("lay")! : "",
  };
}

export function VllmPage() {
  const { t, lang } = useLang();
  const init = initial();
  const [hfId, setHfId] = useState(init.hfId);
  const [arch, setArch] = useState<ModelArch | null>(init.hfId === HERO.hfId ? { ...HERO } : null);
  const [meta, setMeta] = useState<ResolvedMeta | null>(
    init.hfId === HERO.hfId ? { source: "bundled", gated: true, modelType: "llama" } : null
  );
  const [priority, setPriority] = useState<Priority>(init.prio);
  const [task, setTask] = useState<VllmTask>(init.task);
  const [gpuId, setGpuId] = useState(init.gpuId);
  const [gpuCount, setGpuCount] = useState(init.gpuCount);
  const [migId, setMigId] = useState(init.mig);
  const [maxLen, setMaxLen] = useState(init.ctx);
  const [lay, setLay] = useState(init.lay);
  const [copied, setCopied] = useState<string | null>(null);
  // Parsers read from the chat template, the same reading the Serving Brief does.
  const [parsers, setParsers] = useState<{ id: string; p: Parsers } | null>(null);

  useEffect(() => {
    if (!hfId) return;
    let alive = true;
    fetchSnapshot(hfId, { tensors: false })
      .then((snap) => alive && setParsers({ id: hfId, p: buildBrief(snap, "en").facts.parsers.vllm }))
      .catch(() => alive && setParsers(null));
    return () => {
      alive = false;
    };
  }, [hfId]);

  /** Read a model from the Hub (or the bundled list) and put it on the page. */
  function load(id: string) {
    resolveModel(id).then((r) => {
      setHfId(id);
      setMeta({
        source: r.source, gated: r.gated, modelType: r.modelType, isMoE: r.isMoE,
        tags: r.tags, pipelineTag: r.pipelineTag, weightDtype: r.weightDtype, warningKey: r.warningKey,
      });
      setArch(r.arch ?? placeholderArch(r.numParams));
    });
  }

  useEffect(() => {
    if (hfId && !arch) load(hfId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (hfId) p.set("m", hfId);
    p.set("prio", priority);
    p.set("task", task);
    p.set("gpu", gpuId);
    p.set("n", String(gpuCount));
    p.set("ctx", String(maxLen));
    if (migId) p.set("mig", migId);
    if (lay && !migId && gpuCount > 1) p.set("lay", lay);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [hfId, priority, task, gpuId, gpuCount, migId, maxLen, lay]);

  const gpu = GPUS.find((g) => g.id === gpuId) ?? GPUS.find((g) => g.id === "h100-80")!;
  const migProfiles = migProfilesFor(gpu.id);
  // What the runtime reports, as the calculator budgets it (gpus.ts, usableGiB).
  const effVram = (migId && migMem(gpu.id, migId)) || (gpu.visibleGiB ?? gpu.vramGiB);
  const effCount = migId ? 1 : gpuCount;

  const rec = useMemo(() => {
    if (!arch) return null;
    const caps = extractCaps({
      hfId, arch, numParams: arch.numParams, modelType: meta?.modelType,
      isMoE: meta?.isMoE, tags: meta?.tags, pipelineTag: meta?.pipelineTag,
    });
    return recommend({
      hfId, arch, modelType: meta?.modelType, vision: caps.vision,
      weightDtype: meta?.weightDtype,
      parsers: parsers?.id === hfId ? parsers.p : undefined,
      priority, task, gpuVramGiB: effVram, gpuName: gpu.name, gpuCount: effCount, maxModelLen: maxLen, mig: !!migId,
      layout: parseLayoutKey(lay) ?? undefined,
    });
  }, [hfId, arch, meta, parsers, priority, task, effVram, gpu.name, effCount, migId, maxLen, lay]);

  async function copyText(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("vllm.subtitle")}</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Inputs */}
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
            <div>
              <div className="flex items-start justify-between gap-3">
                <SectionTitle step="2" title={t("vllm.pickPriority")} />
                <AdvancedToggle />
              </div>
              <Segmented<Priority>
                value={priority}
                onChange={setPriority}
                size="sm"
                options={PRIORITIES.map((p) => ({ value: p, label: t(`vllm.prio.${p}`), hint: t(`vllm.prioHint.${p}`) }))}
              />
            </div>
            <div>
              <SectionTitle step="3" title={t("vllm.pickTask")} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VLLM_TASKS.map((tid) => (
                  <Tip key={tid} text={t(`vllm.taskHint.${tid}`)} className="flex min-w-0">
                  <button
                    type="button"
                    aria-pressed={task === tid}
                    onClick={() => setTask(tid)}
                    className={
                      "w-full rounded-xl px-3 py-2 text-left text-xs ring-1 transition " +
                      (task === tid ? "bg-brand-600/30 ring-brand-500/50 text-white" : "bg-ink-850 ring-white/10 text-slate-300 hover:bg-white/5")
                    }
                  >
                    {t(`vllm.task.${tid}`)}
                  </button>
                  </Tip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="GPU" info={t("info.gpu")}>
                <Select
                  label="GPU"
                  value={gpuId}
                  options={GPU_CATEGORIES.flatMap((cat) =>
                    GPUS.filter((g) => g.category === cat && runsVllm(g)).map((g) => ({
                      value: g.id,
                      label: `${g.name} — ${g.totalGiB ?? g.vramGiB} GB`,
                      hint: gpuHint(t, g, lang),
                      group: t(`cat.${cat}`),
                    })),
                  )}
                  onChange={(id) => {
                    setGpuId(id);
                    setMigId("");
                  }}
                />
                {init.swappedFrom && (
                  <p className="mt-1 text-[11px] text-warn">
                    {t("vllm.noMetal", { gpu: init.swappedFrom })}
                  </p>
                )}
              </Field>
              <PickField
                label={t("vllm.gpuCount")}
                info={t("info.gpuCount")}
                aside={migId ? "MIG = 1" : undefined}
                value={migId ? 1 : gpuCount}
                options={gpuCountChoices(t)}
                onChange={(v) => {
                  setGpuCount(Math.max(1, Math.min(16, v)));
                  setLay("");
                }}
                min={1}
                max={16}
                custom={(n) => String(n)}
              />
              <PickField
                label={t("vllm.maxlen")}
                info={t("info.maxLen")}
                aside={arch?.maxContext ? t("controls.contextMax", { n: formatInt(arch.maxContext) }) : undefined}
                value={maxLen}
                options={contextChoices(t, lang, arch?.maxContext)}
                onChange={(v) => setMaxLen(Math.max(512, v))}
                min={512}
                step={1024}
                suffix="tok"
                custom={(n) => `${formatInt(n)} tok`}
              />
            </div>
            {/* Several GPUs: every way vLLM can run the model on them, as the
                calculator sizes them; the first holds the most requests. */}
            {rec && rec.layouts.length > 1 && (
              <Field label={t("vllm.layout")} info={t("vllm.layoutInfo")}>
                <Select
                  label={t("vllm.layout")}
                  value={rec.layout ? layoutKey(rec.layout) : ""}
                  options={rec.layouts.map((f) => ({
                    value: layoutKey(f.layout),
                    label: layoutLabel(f.layout),
                    hint: f.fits
                      ? t("vllm.layoutOpt", { u: formatInt(f.maxUsers), g: formatGiB(f.layout.perGpuGiB) })
                      : t("vllm.layoutNoFit"),
                  }))}
                  onChange={setLay}
                />
              </Field>
            )}
            {migProfiles.length > 0 && (
              <Field label={t("gpu.mig")}>
                <Select
                  label={t("gpu.mig")}
                  value={migId}
                  options={[
                    { value: "", label: t("gpu.migOff"), hint: t("gpu.migOffHint") },
                    ...migProfiles.map((m) => ({
                      value: m.id,
                      label: `MIG ${m.id} — ${m.memGiB} GB${m.max > 1 ? ` (×${m.max})` : ""}`,
                      hint: t("gpu.migHint", { gb: m.memGiB, n: m.max }),
                    })),
                  ]}
                  onChange={setMigId}
                />
              </Field>
            )}
          </Card>
        </div>

        {/* Output */}
        <div className="space-y-5">
          <Card className="p-5">
            {rec ? (
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <SectionTitle title={t("vllm.commandTitle")} />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyText(rec.command, "shell")}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-onbrand transition hover:bg-brand-500"
                    >
                      {copied === "shell" ? t("vllm.copied") : t("vllm.copy")}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(rec.k8sArgs, "k8s")}
                      title={t("vllm.k8sHint")}
                      className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-white/5"
                    >
                      {copied === "k8s" ? t("vllm.copied") : `⇄ ${t("vllm.copyK8s")}`}
                    </button>
                  </div>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-ink-950 p-4 text-xs leading-relaxed text-slate-200 ring-1 ring-white/10">
                  <code>{rec.command}</code>
                </pre>

                {/* Model id (selected separately on the K8s platform) */}
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-850/50 px-3 py-2 text-xs ring-1 ring-white/5">
                  <span className="shrink-0 text-slate-500">{t("vllm.model")}</span>
                  <code className="min-w-0 flex-1 truncate text-slate-200">{hfId}</code>
                  <button
                    type="button"
                    onClick={() => copyText(hfId, "model")}
                    className="shrink-0 rounded-md bg-ink-800 px-2 py-1 text-[11px] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/5"
                  >
                    {copied === "model" ? t("vllm.copied") : t("vllm.copy")}
                  </button>
                </div>

                <div className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">{t("vllm.flagsTitle")}</div>
                <ul className="mt-2 space-y-1.5">
                  {rec.flags.map((f, idx) => (
                    <li key={idx} className="flex flex-col gap-0.5 rounded-lg bg-ink-850/50 px-3 py-2 ring-1 ring-white/5 sm:flex-row sm:items-baseline sm:gap-2">
                      <code className="shrink-0 text-xs text-brand-400">
                        {f.flag}
                        {f.value !== undefined ? ` ${f.value}` : ""}
                      </code>
                      <span className="text-xs text-slate-400">{t(f.reasonKey, f.reasonVars)}</span>
                    </li>
                  ))}
                </ul>

                {rec.warnings.length > 0 && (
                  <>
                    <div className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">{t("vllm.warningsTitle")}</div>
                    <ul className="mt-2 space-y-1.5">
                      {rec.warnings.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-2 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn ring-1 ring-warn/20">
                          <span aria-hidden>⚠</span>
                          <span>
                            {t(w.key, w.vars)}
                            {/* The calculator's count, set up here with its layout. */}
                            {w.key === "vllm.w.fit" && !migId && Number(w.vars?.gpus) <= 16 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setGpuCount(Number(w.vars!.gpus));
                                  setLay(String(w.vars!.lay));
                                }}
                                className="ml-1 font-medium underline hover:no-underline"
                              >
                                {t("vllm.useLayout", { n: w.vars!.gpus, layout: w.vars!.layout })}
                              </button>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">{t("vllm.empty")}</p>
            )}
          </Card>
        </div>
      </div>

      {/* Full width: a pasted log is long, and the table reads better wide. */}
      {arch && (
        <Card className="mt-5 p-5">
          <LogCheck
            hfId={hfId}
            arch={arch}
            weightDtype={servingDtype(hfId, meta?.weightDtype)}
            cardGiB={effVram}
            cardName={migId ? `${gpu.name} MIG ${migId}` : gpu.name}
            onUseModel={load}
          />
        </Card>
      )}
    </div>
  );
}
