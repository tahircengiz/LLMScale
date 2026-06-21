import { useEffect, useRef, useState } from "react";
import type { ModelArch } from "../lib/calc";
import {
  resolveModel,
  searchModels,
  type ArchSource,
  type HfSearchResult,
  type WarningKey,
} from "../lib/hf";
import { KNOWN_MODELS } from "../lib/models";
import { formatParams } from "../lib/format";
import { useLang } from "../lib/i18n";
import { Badge, Field, NumberInput, SectionTitle, Segmented } from "./ui";

type Tab = "search" | "presets" | "custom";

export interface ResolvedMeta {
  source: ArchSource;
  gated: boolean;
  modelType?: string;
  isMoE?: boolean;
  warningKey?: WarningKey;
}

export function ModelPicker({
  hfId,
  arch,
  meta,
  onModel,
}: {
  hfId: string;
  arch: ModelArch | null;
  meta: ResolvedMeta | null;
  onModel: (hfId: string, arch: ModelArch | null, meta?: ResolvedMeta) => void;
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HfSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  // Debounced HF search.
  useEffect(() => {
    if (tab !== "search") return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const id = ++seq.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const r = await searchModels(q);
        if (id === seq.current) setResults(r);
      } catch {
        if (id === seq.current) setResults([]);
      } finally {
        if (id === seq.current) setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query, tab]);

  async function pick(id: string) {
    setLoadingId(id);
    setError(null);
    try {
      const r = await resolveModel(id);
      const m: ResolvedMeta = {
        source: r.source,
        gated: r.gated,
        modelType: r.modelType,
        isMoE: r.isMoE,
        warningKey: r.warningKey,
      };
      if (r.arch) {
        onModel(id, r.arch, m);
      } else {
        // Architecture couldn't be auto-detected (e.g. a GGUF repo or an
        // unknown model). Seed the Custom tab with the best-known param count
        // so the result panel stays populated instead of blanking out.
        const seeded: ModelArch = {
          numParams: r.numParams || 7e9,
          numLayers: 32,
          hiddenSize: 4096,
          numAttentionHeads: 32,
          numKeyValueHeads: 8,
        };
        onModel(id, seeded, m);
        setTab("custom");
      }
      setResults([]);
      setQuery(id);
    } catch {
      setError(t("model.search.error"));
    } finally {
      setLoadingId(null);
    }
  }

  function setCustom(patch: Partial<ModelArch>) {
    const base: ModelArch = arch ?? {
      numParams: 7e9,
      numLayers: 32,
      hiddenSize: 4096,
      numAttentionHeads: 32,
      numKeyValueHeads: 8,
    };
    const next = { ...base, ...patch };
    const m: ResolvedMeta = { source: "partial", gated: false };
    onModel("", next, m);
  }

  const sourceBadge =
    meta?.source === "config" ? (
      <Badge tone="good">{t("model.badge.config")}</Badge>
    ) : meta?.source === "bundled" ? (
      <Badge tone="warn">{t("model.badge.bundled")}</Badge>
    ) : meta?.source === "partial" ? (
      <Badge tone="neutral">{t("model.badge.manual")}</Badge>
    ) : null;

  return (
    <div>
      <SectionTitle step="1" title={t("model.step")} />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "search", label: t("model.tab.search") },
          { value: "presets", label: t("model.tab.presets") },
          { value: "custom", label: t("model.tab.custom") },
        ]}
      />

      {tab === "search" && (
        <div className="mt-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("model.search.placeholder")}
              className="w-full rounded-xl bg-ink-850 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-brand-500/60"
            />
            {searching && (
              <span className="absolute right-3 top-3 text-xs text-slate-500">
                {t("model.search.searching")}
              </span>
            )}
            {results.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-ink-850 shadow-2xl">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => pick(r.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-brand-600/20"
                    >
                      <span className="truncate text-slate-200">{r.id}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {r.gated && <Badge tone="warn">gated</Badge>}
                        {typeof r.downloads === "number" && (
                          <span className="text-[11px] text-slate-500">
                            ↓ {formatParams(r.downloads)}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {loadingId && (
            <p className="mt-2 text-xs text-slate-400">{t("model.search.loading", { id: loadingId })}</p>
          )}
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
        </div>
      )}

      {tab === "presets" && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KNOWN_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m.hfId)}
              className={
                "rounded-xl px-3 py-2 text-left text-xs ring-1 transition " +
                (hfId === m.hfId
                  ? "bg-brand-600/30 ring-brand-500/50"
                  : "bg-ink-850 ring-white/10 hover:bg-white/5")
              }
            >
              <div className="font-medium text-slate-100">{m.displayName}</div>
              <div className="text-[11px] text-slate-500">
                {formatParams(m.numParams)}
                {m.isMoE ? " · MoE" : ""}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "custom" && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t("field.params")}>
            <NumberInput
              value={arch?.numParams ? arch.numParams / 1e9 : 7}
              onChange={(v) => setCustom({ numParams: v * 1e9 })}
              min={0}
              step={0.1}
              suffix="B"
            />
          </Field>
          <Field label={t("field.layers")}>
            <NumberInput value={arch?.numLayers ?? 32} onChange={(v) => setCustom({ numLayers: v })} min={1} />
          </Field>
          <Field label={t("field.hidden")}>
            <NumberInput value={arch?.hiddenSize ?? 4096} onChange={(v) => setCustom({ hiddenSize: v })} min={1} />
          </Field>
          <Field label={t("field.attnHeads")}>
            <NumberInput
              value={arch?.numAttentionHeads ?? 32}
              onChange={(v) => setCustom({ numAttentionHeads: v })}
              min={1}
            />
          </Field>
          <Field label={t("field.kvHeads")} hint={t("common.gqa")}>
            <NumberInput
              value={arch?.numKeyValueHeads ?? 8}
              onChange={(v) => setCustom({ numKeyValueHeads: v })}
              min={1}
            />
          </Field>
          <Field label={t("field.headDim")} hint={t("common.optional")}>
            <NumberInput
              value={arch?.headDim ?? 0}
              onChange={(v) => setCustom({ headDim: v || undefined })}
              min={0}
            />
          </Field>
        </div>
      )}

      {/* Resolved summary */}
      {arch && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-ink-850/50 p-3 text-xs ring-1 ring-white/5">
          {sourceBadge}
          {meta?.gated && <Badge tone="warn">gated</Badge>}
          {meta?.isMoE && <Badge tone="neutral">MoE</Badge>}
          {meta?.modelType && <Badge>{meta.modelType}</Badge>}
          <span className="text-slate-300">{t("model.params", { n: formatParams(arch.numParams) })}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            {arch.numLayers}L · {arch.hiddenSize}d · {arch.numAttentionHeads}/{arch.numKeyValueHeads}{" "}
            {t("model.heads")}
          </span>
          {arch.numKeyValueHeads < arch.numAttentionHeads && <Badge tone="good">{t("common.gqa")}</Badge>}
        </div>
      )}
      {meta?.warningKey && (
        <p className="mt-2 text-xs text-amber-300/90">{t(`warning.${meta.warningKey}`)}</p>
      )}
    </div>
  );
}
