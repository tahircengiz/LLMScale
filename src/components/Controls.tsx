import type { Dtype } from "../lib/calc";
import { formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { Field, SectionTitle, Segmented } from "./ui";
import { PresetChips } from "./PresetChips";
import { AdvancedToggle, PickField } from "./choice";
import { contextChoices, outputChoices, prefixChoices, promptChoices, userChoices, utilChoices } from "../lib/choices";

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
  const { t, lang } = useLang();
  const wd = WEIGHT_DTYPES.map((o) => ({ ...o, hint: t(`hint.wd.${o.value}`) }));
  const kd = KV_DTYPES.map((o) => ({ ...o, hint: t(`hint.kv.${o.value}`) }));
  const tok = (n: number) => `${formatInt(n)} ${t("controls.tok")}`;
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle step="2" title={t("controls.step")} />
        <AdvancedToggle />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("controls.weightQuant")} info={t("info.weightQuant")}>
          <Segmented<Dtype> value={weightDtype} options={wd} onChange={(v) => onChange({ weightDtype: v })} size="sm" />
          {/* The bar shrinks the moment a lighter precision is picked. Name the
              counterweight next to it — the sizes here are exact, the quality
              cost is not something this page can measure. */}
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{t(`quality.wd.${weightDtype}`)}</p>
        </Field>
        <Field label={t("controls.kvPrecision")} info={t("info.kvPrecision")}>
          <Segmented<Dtype> value={kvDtype} options={kd} onChange={(v) => onChange({ kvDtype: v })} size="sm" />
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{t(`quality.kv.${kvDtype}`)}</p>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PickField
          label={t("controls.context")}
          info={t("info.context")}
          aside={maxContext ? t("controls.contextMax", { n: formatInt(maxContext) }) : undefined}
          value={contextLength}
          options={contextChoices(t, lang, maxContext)}
          onChange={(v) => onChange({ contextLength: Math.max(1, v) })}
          min={1}
          step={256}
          suffix={t("controls.tok")}
          custom={tok}
        />
        <PickField
          label={t("controls.users")}
          info={t("info.users")}
          value={concurrency}
          options={userChoices(t, lang)}
          onChange={(v) => onChange({ concurrency: Math.max(1, v) })}
          min={1}
          custom={(n) => formatInt(n)}
        />
      </div>

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
                      loadPrompt: Math.max(1, Math.min(2000, Math.round(contextLength / 4))),
                      loadOutput: Math.min(256, Math.round(contextLength / 8)),
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
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PickField
              label={t("controls.loadPrompt")}
              info={t("info.loadPrompt")}
              value={load.prompt}
              options={promptChoices(t, lang)}
              onChange={(v) => onChange({ loadPrompt: Math.max(1, v), loadPrefix: Math.min(load.prefix, Math.max(1, v)) })}
              min={1}
              step={256}
              suffix={t("controls.tok")}
              custom={tok}
            />
            <PickField
              label={t("controls.loadOutput")}
              info={t("info.loadOutput")}
              value={load.output}
              options={outputChoices(t, lang)}
              onChange={(v) => onChange({ loadOutput: Math.max(0, v) })}
              min={0}
              step={128}
              suffix={t("controls.tok")}
              custom={tok}
            />
            <PickField
              label={t("controls.loadPrefix")}
              info={t("info.loadPrefix")}
              value={load.prefix}
              options={prefixChoices(t, lang).filter((o) => o.value <= load.prompt)}
              onChange={(v) => onChange({ loadPrefix: Math.max(0, Math.min(v, load.prompt)) })}
              min={0}
              step={256}
              suffix={t("controls.tok")}
              custom={tok}
            />
          </div>
        )}
      </div>

      {/* The share of each card the engine may fill. The overhead itself is sized
          per GPU from the model (overhead.ts), so this is the one knob left. */}
      <PickField
        label={t("controls.util")}
        info={t("info.util")}
        value={gpuUtil}
        options={utilChoices(t)}
        onChange={(v) => onChange({ gpuUtil: Math.min(1, Math.max(0.5, v)) })}
        min={0.5}
        max={1}
        step={0.01}
        custom={(v) => v.toFixed(2)}
      />
    </div>
  );
}
