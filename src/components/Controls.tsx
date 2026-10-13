import type { Dtype } from "../lib/calc";
import { formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { Field, NumberInput, SectionTitle, Segmented } from "./ui";
import { PresetChips } from "./PresetChips";

const WEIGHT_DTYPES: { value: Dtype; label: string }[] = [
  { value: "fp16", label: "FP16" },
  { value: "bf16", label: "BF16" },
  { value: "fp8", label: "FP8" },
  { value: "int8", label: "INT8" },
  { value: "int4", label: "INT4" },
  { value: "fp32", label: "FP32" },
];

const KV_DTYPES: { value: Dtype; label: string }[] = [
  { value: "fp16", label: "FP16" },
  { value: "bf16", label: "BF16" },
  { value: "fp8", label: "FP8" },
];

const CTX_PRESETS = [2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
const USER_PRESETS = [1, 4, 8, 16, 32, 64, 128];

export function Controls({
  weightDtype,
  kvDtype,
  contextLength,
  concurrency,
  gpuUtil,
  load,
  hfId,
  maxContext,
  onChange,
}: {
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  gpuUtil: number;
  /** The typical request; a prompt of 0 means every user is sized at the full context. */
  load: { prompt: number; output: number; prefix: number };
  /** The model's repository, read for what moves a preset (presets.ts). */
  hfId: string;
  maxContext?: number;
  onChange: (patch: {
    weightDtype?: Dtype;
    kvDtype?: Dtype;
    contextLength?: number;
    concurrency?: number;
    gpuUtil?: number;
    loadPrompt?: number;
    loadOutput?: number;
    loadPrefix?: number;
  }) => void;
}) {
  const { t } = useLang();
  return (
    <div className="space-y-5">
      <SectionTitle step="2" title={t("controls.step")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("controls.weightQuant")}>
          <Segmented<Dtype>
            value={weightDtype}
            options={WEIGHT_DTYPES}
            onChange={(v) => onChange({ weightDtype: v })}
            size="sm"
          />
          {/* The bar shrinks the moment a lighter precision is picked. Name the
              counterweight next to it — the sizes here are exact, the quality
              cost is not something this page can measure. */}
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{t(`quality.wd.${weightDtype}`)}</p>
        </Field>
        <Field label={t("controls.kvPrecision")} hint={t("controls.kvHint")}>
          <Segmented<Dtype>
            value={kvDtype}
            options={KV_DTYPES}
            onChange={(v) => onChange({ kvDtype: v })}
            size="sm"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{t(`quality.kv.${kvDtype}`)}</p>
        </Field>
      </div>

      <Field
        label={t("controls.context")}
        hint={maxContext ? t("controls.contextMax", { n: formatInt(maxContext) }) : undefined}
      >
        <NumberInput
          value={contextLength}
          onChange={(v) => onChange({ contextLength: Math.max(1, v) })}
          min={1}
          step={256}
          suffix={t("controls.tok")}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CTX_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ contextLength: c })}
              className={
                "rounded-lg px-2 py-1 text-[11px] ring-1 transition " +
                (contextLength === c
                  ? "bg-brand-600 text-onbrand ring-brand-500"
                  : "bg-ink-850 text-slate-300 ring-white/10 hover:bg-white/5")
              }
            >
              {c >= 1048576 ? `${c / 1048576}M` : c >= 1024 ? `${c / 1024}k` : c}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("controls.users")} hint={t("controls.usersHint")}>
        <NumberInput
          value={concurrency}
          onChange={(v) => onChange({ concurrency: Math.max(1, v) })}
          min={1}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {USER_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ concurrency: n })}
              className={
                "rounded-lg px-2.5 py-1 text-[11px] ring-1 transition " +
                (concurrency === n
                  ? "bg-brand-600 text-onbrand ring-brand-500"
                  : "bg-ink-850 text-slate-300 ring-white/10 hover:bg-white/5")
              }
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      {/* Users at the full context are the worst case vLLM reports. A typical
          request holds less, and a shared prefix is cached once (calc.ts). */}
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-300">
          <input
            id="typical-load"
            type="checkbox"
            checked={load.prompt > 0}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? {
                      loadPrompt: Math.max(1, Math.min(2048, Math.round(contextLength / 4))),
                      loadOutput: Math.min(512, Math.round(contextLength / 8)),
                      loadPrefix: 0,
                    }
                  : { loadPrompt: 0, loadOutput: 0, loadPrefix: 0 },
              )
            }
            className="h-3.5 w-3.5 accent-brand-500"
          />
          {t("controls.load")}
        </label>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{t("controls.loadNote")}</p>
        {load.prompt > 0 && (
          <div className="mt-2">
            <PresetChips
              hfId={hfId}
              maxContext={maxContext}
              current={{ promptTokens: load.prompt, outputTokens: load.output, sharedPrefix: load.prefix }}
              onApply={(a) =>
                onChange({
                  loadPrompt: a.promptTokens,
                  loadOutput: a.outputTokens,
                  loadPrefix: a.sharedPrefix,
                  // The window has to hold a whole request.
                  contextLength: Math.max(contextLength, a.promptTokens + a.outputTokens),
                })
              }
            />
          </div>
        )}
        {load.prompt > 0 && (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t("controls.loadPrompt")}>
              <NumberInput value={load.prompt} onChange={(v) => onChange({ loadPrompt: Math.max(1, v) })} min={1} step={256} suffix={t("controls.tok")} />
            </Field>
            <Field label={t("controls.loadOutput")}>
              <NumberInput value={load.output} onChange={(v) => onChange({ loadOutput: Math.max(0, v) })} min={0} step={128} suffix={t("controls.tok")} />
            </Field>
            <Field label={t("controls.loadPrefix")}>
              <NumberInput
                value={load.prefix}
                onChange={(v) => onChange({ loadPrefix: Math.max(0, Math.min(v, load.prompt)) })}
                min={0}
                step={256}
                suffix={t("controls.tok")}
              />
            </Field>
          </div>
        )}
      </div>

      {/* The share of each card the engine may fill. The overhead itself is sized
          per GPU from the model (overhead.ts), so this is the one knob left. */}
      <Field label={t("controls.util")} hint={gpuUtil.toFixed(2)}>
        <input
          type="range"
          min={0.7}
          max={0.98}
          step={0.01}
          value={gpuUtil}
          onChange={(e) => onChange({ gpuUtil: Number(e.target.value) })}
          aria-describedby="util-note"
          className="w-full"
        />
        <p id="util-note" className="mt-1 text-[11px] leading-relaxed text-slate-500">
          {t("controls.utilNote")}
        </p>
      </Field>
    </div>
  );
}
