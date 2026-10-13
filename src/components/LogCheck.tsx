import { useMemo, useState } from "react";
import type { Dtype, ModelArch } from "../lib/calc";
import { formatGiB, formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { compareLog, parseVllmLog, type LogRow } from "../lib/vllmLog";
import { Badge, SectionTitle } from "./ui";

// A vLLM startup log, pasted, read beside this engine's estimate for the model
// and card the page is set to. Parsing happens here, in the browser; the log
// goes nowhere.

const fmt = (r: LogRow, v: number) =>
  r.unit === "GiB" ? formatGiB(v) : r.unit === "x" ? `${v.toFixed(2)}×` : formatInt(Math.round(v));

/** How far apart the two figures are, and whether that is close enough to trust. */
function gap(r: LogRow): { text: string; tone: "good" | "warn" | "bad" } {
  const d = r.ours - r.vllm;
  const rel = r.vllm !== 0 ? Math.abs(d / r.vllm) : Infinity;
  // A memory figure is judged in GiB as well: 0.1 GiB on a 1 GiB overhead is noise.
  const abs = r.unit === "GiB" ? Math.abs(d) : Infinity;
  const tone = rel <= 0.05 || abs <= 0.25 ? "good" : rel <= 0.15 || abs <= 0.75 ? "warn" : "bad";
  const sign = d > 0 ? "+" : d < 0 ? "−" : "±";
  const text = r.unit === "GiB" ? `${sign}${Math.abs(d).toFixed(2)} GiB` : `${sign}${(rel * 100).toFixed(1)}%`;
  return { text, tone };
}

export function LogCheck({
  hfId,
  arch,
  weightDtype,
  cardGiB,
  cardName,
  onUseModel,
}: {
  hfId: string;
  arch: ModelArch;
  weightDtype: Dtype;
  cardGiB: number;
  cardName: string;
  onUseModel: (id: string) => void;
}) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const log = useMemo(() => (text.trim() ? parseVllmLog(text) : null), [text]);
  const check = useMemo(
    () => (log ? compareLog(log, { arch, weightDtype, cardGiB, cardName }) : null),
    [log, arch, weightDtype, cardGiB, cardName],
  );
  const otherModel = log?.model && log.model !== hfId ? log.model : null;

  return (
    <div>
      <SectionTitle title={t("logcheck.title")} />
      <p className="-mt-1 mb-3 max-w-3xl text-xs leading-relaxed text-slate-400">{t("logcheck.lede")}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        spellCheck={false}
        aria-label={t("logcheck.label")}
        placeholder={t("logcheck.placeholder")}
        className="w-full rounded-xl bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200 ring-1 ring-control outline-none placeholder:text-slate-500 focus:ring-brand-500/60"
      />

      {log && check && check.rows.length === 0 && (
        <p className="mt-2 text-xs text-warn">{t("logcheck.nothing")}</p>
      )}

      {otherModel && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn ring-1 ring-warn/20">
          <span>{t("logcheck.otherModel", { log: otherModel, page: hfId })}</span>
          <button
            type="button"
            onClick={() => onUseModel(otherModel)}
            className="rounded-md bg-ink-800 px-2 py-1 text-[11px] font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-white/5"
          >
            {t("logcheck.useModel")}
          </button>
        </div>
      )}

      {check && check.rows.length > 0 && (
        <>
          <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-white/10">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-slate-400">
                  <th scope="col" className="px-3 py-2 font-medium">{t("logcheck.col.figure")}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">vLLM {log?.version ?? ""}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">LLMScale</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t("logcheck.col.gap")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {check.rows.map((r) => {
                  const g = gap(r);
                  return (
                    <tr key={r.key}>
                      <th scope="row" className="px-3 py-2 font-normal text-slate-300">
                        {t(`logcheck.row.${r.key}`)}
                      </th>
                      <td className="px-3 py-2 text-right tabular-nums text-white">{fmt(r, r.vllm)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-white">{fmt(r, r.ours)}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge tone={g.tone}>{g.text}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            {t("logcheck.basis", {
              tokens: formatInt(check.batch.tokens),
              seqs: formatInt(check.batch.seqs),
              tp: check.tp,
            })}{" "}
            {check.budgetFrom === "log"
              ? t("logcheck.budgetLog")
              : check.budgetFrom === "card"
                ? t("logcheck.budgetCard", { card: cardName, gb: cardGiB })
                : ""}{" "}
            {t("logcheck.layoutNote")}
          </p>
        </>
      )}
    </div>
  );
}
