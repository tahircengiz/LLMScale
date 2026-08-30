import { useEffect, useMemo, useRef, useState } from "react";
import { calculate, type Dtype } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { findKnownByHfId } from "../lib/models";
import { GPUS, usableGiB } from "../lib/gpus";
import { decodeState, encodeState, DEFAULT_STATE, type AppState } from "../lib/urlState";
import { useLang } from "../lib/i18n";
import { formatParams } from "../lib/format";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import {
  CapacityRail,
  GaugeCard,
  HardwareRail,
  InsightBand,
  PrecisionCard,
  SavingsCard,
  ScenarioTabs,
  SHORT_DTYPE,
  type ConsoleModel,
} from "../components/SizingConsole";

const HERO = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;
const CTX_OPTIONS = [2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
const USER_OPTIONS = [1, 2, 4, 8, 16, 32, 64, 128];
const KV_OPTIONS: Dtype[] = ["fp16", "bf16", "fp8"];

function ctxLabel(n: number): string {
  return n >= 1048576 ? `${n / 1048576}M` : n >= 1024 ? `${n / 1024}k` : String(n);
}

function initialState(): AppState {
  const fromUrl = decodeState(window.location.search);
  const base: AppState = { ...DEFAULT_STATE, ...fromUrl };
  if (!base.arch && !base.hfId) {
    base.hfId = HERO.hfId;
    base.arch = { ...HERO };
  }
  return base;
}

/** Compact labelled select used across the workload bar. */
function Pick({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-[9px] border border-ink-700 bg-ink-900 px-2.5 py-1.5">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent text-[12.5px] font-medium text-white outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export function SizingPage() {
  const { t } = useLang();
  const [state, setState] = useState<AppState>(initialState);
  const [meta, setMeta] = useState<ResolvedMeta | null>(
    state.hfId === HERO.hfId ? { source: "bundled", gated: true, modelType: "llama" } : null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const urlPinned = useRef({
    wd: new URLSearchParams(window.location.search).has("wd"),
    kd: new URLSearchParams(window.location.search).has("kd"),
  }).current;

  useEffect(() => {
    if (state.hfId && !state.arch) {
      resolveModel(state.hfId).then((r) => {
        setMeta({
          source: r.source, gated: r.gated, modelType: r.modelType, isMoE: r.isMoE,
          tags: r.tags, pipelineTag: r.pipelineTag, weightDtype: r.weightDtype, kvDtype: r.kvDtype, warningKey: r.warningKey,
        });
        const arch = r.arch ?? {
          numParams: r.numParams || 7e9, numLayers: 32, hiddenSize: 4096, numAttentionHeads: 32, numKeyValueHeads: 8,
        };
        setState((s) => ({
          ...s,
          arch,
          ...(r.weightDtype && !urlPinned.wd ? { weightDtype: r.weightDtype } : {}),
          ...(r.kvDtype && !urlPinned.kd ? { kvDtype: r.kvDtype } : {}),
        }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const qs = encodeState(state);
    window.history.replaceState(null, "", `${window.location.pathname}?${qs}`);
  }, [state]);

  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  const result = useMemo(() => {
    if (!state.arch) return null;
    return calculate({
      arch: state.arch, weightDtype: state.weightDtype, kvDtype: state.kvDtype,
      contextLength: state.contextLength, concurrency: state.concurrency,
      overheadPct: state.overheadPct, cudaContextGiB: state.cudaContextGiB,
    });
  }, [state]);

  const gpu = GPUS.find((g) => g.id === state.gpuId) ?? GPUS[0];

  const model: ConsoleModel | null =
    state.arch && result
      ? {
          arch: state.arch,
          weightDtype: state.weightDtype,
          kvDtype: state.kvDtype,
          contextLength: state.contextLength,
          concurrency: state.concurrency,
          overheadPct: state.overheadPct,
          cudaContextGiB: state.cudaContextGiB,
          result,
          gpu,
          migId: state.migId,
          usable: usableGiB(gpu, state.migId),
          patch,
        }
      : null;

  return (
    <div className="space-y-3.5">
      {/* model bar — collapsed to a summary until you change it */}
      <div className="rounded-2xl border border-ink-700 bg-ink-900 p-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-white text-ink-900">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1.8l5.6 3.1v6.2L8 14.2 2.4 11.1V4.9z" />
            </svg>
          </span>
          <span className="truncate text-[13.5px] font-semibold text-white">{state.hfId || t("con.noModel")}</span>
          {state.arch && (
            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-slate-500">
              <span>{formatParams(state.arch.numParams)}</span>
              <span>·</span>
              <span>{state.arch.numLayers}L</span>
              <span>·</span>
              <span>{state.arch.hiddenSize}d</span>
              {state.arch.numKeyValueHeads && state.arch.numKeyValueHeads < state.arch.numAttentionHeads && (
                <>
                  <span>·</span>
                  <span>GQA {state.arch.numAttentionHeads}/{state.arch.numKeyValueHeads}</span>
                </>
              )}
            </span>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="ml-auto rounded-[9px] border border-ink-700 px-3 py-1.5 text-[12.5px] font-medium text-slate-300 transition hover:bg-white/5"
          >
            {pickerOpen ? t("con.close") : t("con.changeModel")}
          </button>
        </div>
        {pickerOpen && (
          <div className="relative z-30 mt-3.5 border-t border-ink-700 pt-3.5">
            <ModelPicker
              hfId={state.hfId}
              arch={state.arch}
              meta={meta}
              onModel={(hfId, arch, m) => {
                patch({
                  hfId,
                  arch,
                  ...(m?.weightDtype ? { weightDtype: m.weightDtype } : {}),
                  ...(m?.kvDtype ? { kvDtype: m.kvDtype } : {}),
                });
                setMeta(m ?? null);
              }}
            />
          </div>
        )}
      </div>

      {/* workload bar */}
      {model && (
        <div className="flex flex-wrap items-center gap-2">
          <ScenarioTabs m={model} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Pick label={t("con.col.ctx")} value={state.contextLength} onChange={(v) => patch({ contextLength: Number(v) })}>
              {CTX_OPTIONS.map((c) => (
                <option key={c} value={c}>{ctxLabel(c)}</option>
              ))}
            </Pick>
            <Pick label={t("con.col.users")} value={state.concurrency} onChange={(v) => patch({ concurrency: Number(v) })}>
              {USER_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Pick>
            <Pick label={t("con.col.kv")} value={state.kvDtype} onChange={(v) => patch({ kvDtype: v as Dtype })}>
              {KV_OPTIONS.map((d) => (
                <option key={d} value={d}>{SHORT_DTYPE[d]}</option>
              ))}
            </Pick>
            <Pick label={t("con.col.overhead")} value={Math.round(state.overheadPct * 100)} onChange={(v) => patch({ overheadPct: Number(v) / 100 })}>
              {[0, 5, 10, 15, 20, 25, 30].map((o) => (
                <option key={o} value={o}>%{o}</option>
              ))}
            </Pick>
          </div>
        </div>
      )}

      {model ? (
        <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[294px_minmax(0,1fr)_316px]">
          <GaugeCard m={model} />
          <PrecisionCard m={model} />
          <HardwareRail m={model} />
          <div className="xl:col-span-2">
            <SavingsCard m={model} />
          </div>
          <CapacityRail m={model} />
          <div className="xl:col-span-2">
            <InsightBand m={model} />
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-slate-400">{t("results.empty")}</p>
      )}
    </div>
  );
}
