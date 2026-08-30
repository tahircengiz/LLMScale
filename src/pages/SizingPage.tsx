import { useEffect, useMemo, useRef, useState } from "react";
import { calculate } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { findKnownByHfId } from "../lib/models";
import { GPUS, usableGiB } from "../lib/gpus";
import { decodeState, encodeState, DEFAULT_STATE, type AppState } from "../lib/urlState";
import { useLang } from "../lib/i18n";
import { formatParams } from "../lib/format";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import {
  CapacityRail,
  ConfigCard,
  GaugeCard,
  HardwareRail,
  InsightBand,
  PrecisionCard,
  SavingsCard,
  type ConsoleModel,
} from "../components/SizingConsole";

const HERO = findKnownByHfId("meta-llama/Llama-3.1-8B-Instruct")!;

function initialState(): AppState {
  const fromUrl = decodeState(window.location.search);
  const base: AppState = { ...DEFAULT_STATE, ...fromUrl };
  if (!base.arch && !base.hfId) {
    base.hfId = HERO.hfId;
    base.arch = { ...HERO };
  }
  return base;
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
      {model && (
        <ConfigCard
          m={model}
          modelName={state.hfId || t("con.noModel")}
          modelMeta={
            state.arch && (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-slate-500">
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
            )
          }
          pickerOpen={pickerOpen}
          onTogglePicker={() => setPickerOpen((v) => !v)}
          picker={
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
          }
        />
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
