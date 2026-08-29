import { useEffect, useMemo, useRef, useState } from "react";
import { calculate } from "../lib/calc";
import { resolveModel } from "../lib/hf";
import { findKnownByHfId } from "../lib/models";
import { decodeState, encodeState, DEFAULT_STATE, type AppState } from "../lib/urlState";
import { useLang } from "../lib/i18n";
import { ModelPicker, type ResolvedMeta } from "../components/ModelPicker";
import { Controls } from "../components/Controls";
import { Results } from "../components/Results";
import { GpuFit } from "../components/GpuFit";

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

export function RedesignSizingPage() {
  const { t } = useLang();
  const [state, setState] = useState<AppState>(initialState);
  const [meta, setMeta] = useState<ResolvedMeta | null>(
    state.hfId === HERO.hfId ? { source: "bundled", gated: true, modelType: "llama" } : null
  );
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

  // Sections stack in one column (the sidebar owns the left rail). Result first,
  // then the inputs — each sub-component brings its own heading, so we only add
  // whitespace + a hairline, not another label. No glass cards.
  const rule = <div className="h-px w-full bg-white/10" />;

  return (
    <div className="space-y-9">
      <section>
        {result ? (
          <Results result={result} />
        ) : (
          <p className="py-10 text-center text-sm text-slate-400">{t("results.empty")}</p>
        )}
      </section>

      {rule}

      <section className="relative z-30">
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
      </section>

      {rule}

      <section>
        <Controls
          weightDtype={state.weightDtype}
          kvDtype={state.kvDtype}
          contextLength={state.contextLength}
          concurrency={state.concurrency}
          overheadPct={state.overheadPct}
          maxContext={state.arch?.maxContext}
          onChange={patch}
        />
      </section>

      {result && state.arch && (
        <>
          {rule}
          <section>
            <GpuFit
              arch={state.arch}
              weightDtype={state.weightDtype}
              kvDtype={state.kvDtype}
              contextLength={state.contextLength}
              concurrency={state.concurrency}
              overheadPct={state.overheadPct}
              cudaContextGiB={state.cudaContextGiB}
              totalGiB={result.totalGiB}
              gpuId={state.gpuId}
              migId={state.migId}
              onGpu={(id) => patch({ gpuId: id, migId: "" })}
              onMig={(id) => patch({ migId: id })}
            />
          </section>
        </>
      )}

      <Methodology />
    </div>
  );
}

function Methodology() {
  const { t } = useLang();
  const points = [
    { term: t("method.weightsTerm"), text: t("method.weightsText") },
    { term: t("method.kvTerm"), text: t("method.kvText") },
    { term: t("method.overheadTerm"), text: t("method.overheadText") },
  ];
  return (
    <details className="group border-t border-white/10 pt-5 text-sm text-slate-300">
      <summary className="cursor-pointer list-none font-medium text-white">
        {t("method.summary")} <span className="text-slate-500 group-open:hidden">▸</span>
        <span className="hidden text-slate-500 group-open:inline">▾</span>
      </summary>
      <div className="mt-3 space-y-3 text-slate-400">
        {points.map((p) => (
          <p key={p.term}>
            <strong className="text-slate-200">{p.term}</strong> {p.text}
          </p>
        ))}
        <p className="text-xs text-slate-500">{t("method.disclaimer")}</p>
      </div>
    </details>
  );
}
