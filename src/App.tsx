import { useEffect, useMemo, useState } from "react";
import { calculate } from "./lib/calc";
import { resolveModel } from "./lib/hf";
import { findKnownByHfId } from "./lib/models";
import { decodeState, encodeState, DEFAULT_STATE, type AppState } from "./lib/urlState";
import { useLang, type Lang } from "./lib/i18n";
import { ModelPicker, type ResolvedMeta } from "./components/ModelPicker";
import { Controls } from "./components/Controls";
import { Results } from "./components/Results";
import { GpuFit } from "./components/GpuFit";
import { Card, Badge, Segmented } from "./components/ui";

// Personal links shown in the footer.
const GITHUB_URL = "https://github.com/tahircengiz";
const LINKEDIN_URL = "https://www.linkedin.com/in/tahircengiz/"; // TODO: confirm exact handle

// Default hero model so the page shows a real result on first load.
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

export default function App() {
  const { t, lang, setLang } = useLang();
  const [state, setState] = useState<AppState>(initialState);
  const [meta, setMeta] = useState<ResolvedMeta | null>(
    state.hfId === HERO.hfId ? { source: "bundled", gated: true, modelType: "llama" } : null
  );
  const [copied, setCopied] = useState(false);

  // If the URL referenced a model id but carried no arch, resolve it live.
  useEffect(() => {
    if (state.hfId && !state.arch) {
      resolveModel(state.hfId).then((r) => {
        setMeta({
          source: r.source,
          gated: r.gated,
          modelType: r.modelType,
          isMoE: r.isMoE,
          warningKey: r.warningKey,
        });
        const arch = r.arch ?? {
          numParams: r.numParams || 7e9,
          numLayers: 32,
          hiddenSize: 4096,
          numAttentionHeads: 32,
          numKeyValueHeads: 8,
        };
        setState((s) => ({ ...s, arch }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync for shareable links.
  useEffect(() => {
    const qs = encodeState(state);
    window.history.replaceState(null, "", `${window.location.pathname}?${qs}`);
  }, [state]);

  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  const result = useMemo(() => {
    if (!state.arch) return null;
    return calculate({
      arch: state.arch,
      weightDtype: state.weightDtype,
      kvDtype: state.kvDtype,
      contextLength: state.contextLength,
      concurrency: state.concurrency,
      overheadPct: state.overheadPct,
      cudaContextGiB: state.cudaContextGiB,
    });
  }, [state]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
            <Badge tone="good">{t("header.badge")}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            LLMScale{" "}
            <span className="text-base font-normal text-slate-500">— LLM VRAM &amp; GPU sizing</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            {t("header.subtitle", {
              ctx: t("header.subtitle.ctx"),
              users: t("header.subtitle.users"),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Segmented<Lang>
            value={lang}
            onChange={setLang}
            size="sm"
            options={[
              { value: "en", label: "EN" },
              { value: "tr", label: "TR" },
            ]}
          />
          <button
            type="button"
            onClick={share}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
          >
            {copied ? t("header.shareCopied") : t("header.share")}
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="p-5 relative z-30">
            <ModelPicker
              hfId={state.hfId}
              arch={state.arch}
              meta={meta}
              onModel={(hfId, arch, m) => {
                patch({ hfId, arch });
                setMeta(m ?? null);
              }}
            />
          </Card>
          <Card className="p-5">
            <Controls
              weightDtype={state.weightDtype}
              kvDtype={state.kvDtype}
              contextLength={state.contextLength}
              concurrency={state.concurrency}
              overheadPct={state.overheadPct}
              maxContext={state.arch?.maxContext}
              onChange={patch}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            {result ? (
              <Results result={result} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">{t("results.empty")}</p>
            )}
          </Card>
          {result && state.arch && (
            <Card className="p-5">
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
                onGpu={(id) => patch({ gpuId: id })}
              />
            </Card>
          )}
        </div>
      </div>

      <Methodology />
      <Footer githubUrl={GITHUB_URL} linkedinUrl={LINKEDIN_URL} />
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
    <details className="group mt-8 rounded-2xl border border-white/10 bg-ink-900/50 p-5 text-sm text-slate-300">
      <summary className="cursor-pointer list-none font-semibold text-white">
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

function Footer({ githubUrl, linkedinUrl }: { githubUrl: string; linkedinUrl: string }) {
  const { t } = useLang();
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
      <p>
        {t("footer.builtBy")} <span className="font-medium text-slate-200">Tahir Cengiz</span> ·{" "}
        {t("footer.privacy")}
      </p>
      <div className="flex gap-4 text-slate-400">
        <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-brand-400">
          {t("link.github")}
        </a>
        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-brand-400">
          {t("link.linkedin")}
        </a>
      </div>
    </footer>
  );
}
