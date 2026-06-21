import type { Dtype } from "../lib/calc";
import { formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { Field, NumberInput, SectionTitle, Segmented } from "./ui";

const WEIGHT_DTYPES: { value: Dtype; label: string }[] = [
  { value: "fp16", label: "FP16" },
  { value: "bf16", label: "BF16" },
  { value: "fp8", label: "FP8" },
  { value: "int8", label: "INT8" },
  { value: "int4", label: "INT4" },
];

const KV_DTYPES: { value: Dtype; label: string }[] = [
  { value: "fp16", label: "FP16" },
  { value: "bf16", label: "BF16" },
  { value: "fp8", label: "FP8" },
];

const CTX_PRESETS = [2048, 4096, 8192, 16384, 32768, 65536, 131072];
const USER_PRESETS = [1, 4, 8, 16, 32, 64, 128];

export function Controls({
  weightDtype,
  kvDtype,
  contextLength,
  concurrency,
  overheadPct,
  maxContext,
  onChange,
}: {
  weightDtype: Dtype;
  kvDtype: Dtype;
  contextLength: number;
  concurrency: number;
  overheadPct: number;
  maxContext?: number;
  onChange: (patch: {
    weightDtype?: Dtype;
    kvDtype?: Dtype;
    contextLength?: number;
    concurrency?: number;
    overheadPct?: number;
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
        </Field>
        <Field label={t("controls.kvPrecision")}>
          <Segmented<Dtype>
            value={kvDtype}
            options={KV_DTYPES}
            onChange={(v) => onChange({ kvDtype: v })}
            size="sm"
          />
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
                  ? "bg-brand-600 text-white ring-brand-500"
                  : "bg-ink-850 text-slate-300 ring-white/10 hover:bg-white/5")
              }
            >
              {c >= 1024 ? `${c / 1024}k` : c}
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
                  ? "bg-brand-600 text-white ring-brand-500"
                  : "bg-ink-850 text-slate-300 ring-white/10 hover:bg-white/5")
              }
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("controls.overhead")} hint={`${Math.round(overheadPct * 100)}%`}>
        <input
          type="range"
          min={0}
          max={0.3}
          step={0.01}
          value={overheadPct}
          onChange={(e) => onChange({ overheadPct: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
    </div>
  );
}
