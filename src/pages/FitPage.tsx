import { useEffect, useMemo, useState } from "react";
import type { ModelArch } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { findKnownByHfId } from "../lib/models";
import { extractCaps, scoreFit, TASKS, type Status, type TaskId } from "../lib/fit";
import { useLang } from "../lib/i18n";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Badge, Card, SectionTitle } from "../components/ui";

const HERO = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;

const STATUS_COLOR: Record<Status, string> = { good: "#10b981", ok: "#f59e0b", bad: "#f43f5e" };

function scoreColor(o: number): string {
  return o >= 80 ? "#10b981" : o >= 60 ? "#34d399" : o >= 40 ? "#f59e0b" : "#f43f5e";
}
function verdictTone(v: string): "good" | "warn" | "bad" {
  return v === "great" || v === "good" ? "good" : v === "weak" ? "warn" : "bad";
}

function initial(): { hfId: string; task: TaskId } {
  const p = new URLSearchParams(window.location.search);
  const m = p.get("m") || HERO.hfId;
  const task = p.get("task") as TaskId | null;
  return { hfId: m, task: task && TASKS.includes(task) ? task : "chat" };
}

export function FitPage() {
  const { t } = useLang();
  const init = initial();
  const [hfId, setHfId] = useState(init.hfId);
  const [arch, setArch] = useState<ModelArch | null>(init.hfId === HERO.hfId ? { ...HERO } : null);
  const [meta, setMeta] = useState<ResolvedMeta | null>(
    init.hfId === HERO.hfId ? { source: "bundled", gated: true, modelType: "llama" } : null
  );
  const [task, setTask] = useState<TaskId>(init.task);

  useEffect(() => {
    if (hfId && !arch) {
      resolveModel(hfId).then((r) => {
        setMeta({
          source: r.source, gated: r.gated, modelType: r.modelType, isMoE: r.isMoE,
          tags: r.tags, pipelineTag: r.pipelineTag, warningKey: r.warningKey,
        });
        setArch(
          r.arch ?? { numParams: r.numParams || 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8 }
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (hfId) p.set("m", hfId);
    p.set("task", task);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [hfId, task]);

  const caps = useMemo(
    () =>
      extractCaps({
        hfId, arch, numParams: arch?.numParams ?? 0,
        modelType: meta?.modelType, isMoE: meta?.isMoE, tags: meta?.tags, pipelineTag: meta?.pipelineTag,
      }),
    [hfId, arch, meta]
  );
  const result = useMemo(() => (arch ? scoreFit(caps, task) : null), [caps, task, arch]);

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("fit.subtitle")}</p>
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
          <Card className="p-5">
            <SectionTitle step="2" title={t("fit.pickTask")} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TASKS.map((tid) => (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setTask(tid)}
                  className={
                    "rounded-xl px-3 py-2 text-left text-xs ring-1 transition " +
                    (task === tid ? "bg-brand-600/30 ring-brand-500/50 text-white" : "bg-ink-850 ring-white/10 text-slate-300 hover:bg-white/5")
                  }
                >
                  {t(`fit.task.${tid}`)}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            {result ? (
              <div>
                <div className="flex items-start justify-between">
                  <SectionTitle title={t("fit.scoreLabel")} />
                  <div className="text-right">
                    <div className="text-3xl font-bold leading-none" style={{ color: scoreColor(result.overall) }}>
                      {result.overall}
                      <span className="text-base font-normal text-slate-500">/100</span>
                    </div>
                    <div className="mt-1">
                      <Badge tone={verdictTone(result.verdict)}>{t(`fit.verdict.${result.verdict}`)}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${result.overall}%`, backgroundColor: scoreColor(result.overall) }}
                  />
                </div>

                <div className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">{t("fit.criteriaTitle")}</div>
                <ul className="mt-2 space-y-2">
                  {result.criteria.map((c, i) => (
                    <li key={i} className="rounded-xl bg-ink-850/50 p-3 ring-1 ring-white/5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[c.status] }} />
                          {t(c.labelKey)}
                        </span>
                        <span className="text-[11px] text-slate-500">{Math.round(c.weight * 100)}%</span>
                      </div>
                      <p className="mt-1 pl-4 text-xs text-slate-400">{t(c.msgKey, c.vars)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">{t("fit.empty")}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
