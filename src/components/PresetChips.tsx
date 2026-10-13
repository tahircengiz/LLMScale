import { useEffect, useState } from "react";
import { formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { hintsFromSnapshot, matchingPreset, presetFor, PRESETS, THINKING_TOKENS, type AppliedPreset, type ModelHints, type PresetId } from "../lib/presets";
import { fetchSnapshot } from "../lib/repoFetch";

// One-click workloads: a kind of work fills the request lengths (and, on the plan
// page, the latency targets), adjusted to what the model's own files say. The
// files are read the way the Serving Brief reads them; a gated or unreadable
// repository just leaves the preset as it is.

export function PresetChips({
  hfId,
  maxContext,
  current,
  onApply,
}: {
  hfId: string;
  maxContext?: number;
  current: { promptTokens: number; outputTokens: number; sharedPrefix: number };
  onApply: (a: AppliedPreset, id: PresetId) => void;
}) {
  const { t } = useLang();
  const [hints, setHints] = useState<{ id: string; h: ModelHints } | null>(null);

  useEffect(() => {
    if (!hfId) return;
    let alive = true;
    fetchSnapshot(hfId, { tensors: false })
      .then((snap) => alive && setHints({ id: hfId, h: hintsFromSnapshot(snap) }))
      .catch(() => alive && setHints(null));
    return () => {
      alive = false;
    };
  }, [hfId]);

  if (!PRESETS.length) return null;
  const h = hints?.id === hfId ? hints.h : null;
  const active = matchingPreset(current, h, maxContext);
  const applied = active ? presetFor(PRESETS.find((p) => p.id === active)!, h, maxContext) : null;
  const preset = active ? PRESETS.find((p) => p.id === active)! : null;

  return (
    <div>
      <div role="group" aria-label={t("preset.label")} className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === active}
            onClick={() => onApply(presetFor(p, h, maxContext), p.id)}
            className={
              "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition " +
              (p.id === active ? "bg-brand-600 text-onbrand ring-brand-500" : "bg-ink-850 text-slate-300 ring-white/10 hover:bg-white/5")
            }
          >
            {t(`preset.${p.id}`)}
          </button>
        ))}
      </div>
      {preset && applied && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          {t(`preset.desc.${preset.id}`)} {t("preset.from", { src: preset.sources.join(", ") })}
          {applied.notes.map((n) => (
            <span key={n}>
              {" "}
              {t(`preset.note.${n}`, { n: formatInt(THINKING_TOKENS), cap: formatInt(h?.maxNewTokens ?? 0), ctx: formatInt(maxContext ?? 0) })}
              {n === "thinking" && h?.thinkToggle ? ` ${t("preset.note.toggle")}` : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
