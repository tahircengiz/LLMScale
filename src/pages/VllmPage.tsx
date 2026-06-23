import { useEffect, useMemo, useState } from "react";
import type { ModelArch } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { findKnownByHfId } from "../lib/models";
import { extractCaps } from "../lib/fit";
import { recommend, PRIORITIES, VLLM_TASKS, type Priority, type VllmTask } from "../lib/vllm";
import { GPUS, migMem, migProfilesFor } from "../lib/gpus";
import { useLang } from "../lib/i18n";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Card, Field, NumberInput, SectionTitle, Segmented } from "../components/ui";

const HERO = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;

function initial() {
  const p = new URLSearchParams(window.location.search);
  const prio = p.get("prio") as Priority | null;
  const task = p.get("task") as VllmTask | null;
  return {
    hfId: p.get("m") || HERO.hfId,
    prio: prio && PRIORITIES.includes(prio) ? prio : "balanced",
    task: task && VLLM_TASKS.includes(task) ? task : "chat",
    gpuId: p.get("gpu") || "h100-80",
    gpuCount: Number(p.get("n")) || 1,
    ctx: Number(p.get("ctx")) || 8192,
    mig: p.get("mig") || "",
  };
}

export function VllmPage() {
  const { t } = useLang();
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
  const [copied, setCopied] = useState<string | null>(null);

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
    p.set("prio", priority);
    p.set("task", task);
    p.set("gpu", gpuId);
    p.set("n", String(gpuCount));
    p.set("ctx", String(maxLen));
    if (migId) p.set("mig", migId);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [hfId, priority, task, gpuId, gpuCount, migId, maxLen]);

  const gpu = GPUS.find((g) => g.id === gpuId) ?? GPUS[0];
  const migProfiles = migProfilesFor(gpu.id);
  const effVram = (migId && migMem(gpu.id, migId)) || gpu.vramGiB;
  const effCount = migId ? 1 : gpuCount;

  const rec = useMemo(() => {
    if (!arch) return null;
    const caps = extractCaps({
      hfId, arch, numParams: arch.numParams, modelType: meta?.modelType,
      isMoE: meta?.isMoE, tags: meta?.tags, pipelineTag: meta?.pipelineTag,
    });
    return recommend({
      hfId, arch, modelType: meta?.modelType, isMoE: caps.isMoE, vision: caps.vision,
      priority, task, gpuVramGiB: effVram, gpuCount: effCount, maxModelLen: maxLen, mig: !!migId,
    });
  }, [hfId, arch, meta, priority, task, effVram, effCount, migId, maxLen]);

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
              <SectionTitle step="2" title={t("vllm.pickPriority")} />
              <Segmented<Priority>
                value={priority}
                onChange={setPriority}
                size="sm"
                options={PRIORITIES.map((p) => ({ value: p, label: t(`vllm.prio.${p}`) }))}
              />
            </div>
            <div>
              <SectionTitle step="3" title={t("vllm.pickTask")} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VLLM_TASKS.map((tid) => (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setTask(tid)}
                    className={
                      "rounded-xl px-3 py-2 text-left text-xs ring-1 transition " +
                      (task === tid ? "bg-brand-600/30 ring-brand-500/50 text-white" : "bg-ink-850 ring-white/10 text-slate-300 hover:bg-white/5")
                    }
                  >
                    {t(`vllm.task.${tid}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="GPU">
                <select
                  value={gpuId}
                  onChange={(e) => {
                    setGpuId(e.target.value);
                    setMigId("");
                  }}
                  className="w-full rounded-xl bg-ink-850 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-brand-500/60"
                >
                  {(["consumer", "workstation", "datacenter", "apple"] as const).map((cat) => (
                    <optgroup key={cat} label={t(`cat.${cat}`)}>
                      {GPUS.filter((g) => g.category === cat).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} — {g.vramGiB} GB
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label={t("vllm.gpuCount")} hint={migId ? "MIG = 1" : undefined}>
                <NumberInput
                  value={migId ? 1 : gpuCount}
                  onChange={(v) => setGpuCount(Math.max(1, Math.min(16, v)))}
                  min={1}
                  max={16}
                />
              </Field>
              <Field label={t("vllm.maxlen")} hint={arch?.maxContext ? String(arch.maxContext) : undefined}>
                <NumberInput value={maxLen} onChange={(v) => setMaxLen(Math.max(512, v))} min={512} step={1024} suffix="tok" />
              </Field>
            </div>
            {migProfiles.length > 0 && (
              <Field label={t("gpu.mig")}>
                <select
                  value={migId}
                  onChange={(e) => setMigId(e.target.value)}
                  className="w-full rounded-xl bg-ink-850 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10 outline-none focus:ring-brand-500/60"
                >
                  <option value="">{t("gpu.migOff")}</option>
                  {migProfiles.map((m) => (
                    <option key={m.id} value={m.id}>
                      MIG {m.id} — {m.memGiB} GB{m.max > 1 ? ` (×${m.max})` : ""}
                    </option>
                  ))}
                </select>
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
                        <li key={idx} className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90 ring-1 ring-amber-500/20">
                          <span aria-hidden>⚠</span>
                          <span>{t(w.key, w.vars)}</span>
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
    </div>
  );
}
