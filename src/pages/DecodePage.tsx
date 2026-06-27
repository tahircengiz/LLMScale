import { useMemo, useState } from "react";
import { KIND_INFO, parseModelName } from "../lib/modelName";
import { useLang } from "../lib/i18n";
import { Card, SectionTitle } from "../components/ui";

const EXAMPLES = [
  "RedHatAI/Qwen3.6-35B-A3B-NVFP4",
  "Qwen/Qwen2.5-7B-Instruct",
  "mistralai/Mixtral-8x7B-Instruct-v0.1",
  "bartowski/Llama-3.1-70B-Instruct-GGUF",
  "Qwen/Qwen2.5-Coder-32B-Instruct-AWQ",
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
];

export function DecodePage() {
  const { t, lang } = useLang();
  const [hfId, setHfId] = useState(EXAMPLES[0]);
  const [active, setActive] = useState<number | null>(null);
  const parsed = useMemo(() => parseModelName(hfId), [hfId]);

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-slate-400">{t("decode.subtitle")}</p>

      <Card className="mb-5 p-5">
        <SectionTitle step="1" title={t("decode.input")} />
        <input
          value={hfId}
          onChange={(e) => setHfId(e.target.value)}
          spellCheck={false}
          placeholder="org/Model-Name-7B-Instruct-AWQ"
          className="w-full rounded-xl bg-ink-850 px-3 py-2.5 font-mono text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-brand-500/60"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setHfId(ex)}
              className={
                "rounded-lg px-2.5 py-1 text-[11px] ring-1 transition " +
                (hfId === ex ? "bg-brand-600 text-onbrand ring-brand-500" : "bg-ink-850 text-slate-300 ring-white/10 hover:bg-white/5")
              }
            >
              {ex.split("/").pop()}
            </button>
          ))}
        </div>
      </Card>

      {parsed.tokens.length > 0 ? (
        <Card className="p-5">
          {/* Colour-coded model name */}
          <div className="text-[11px] uppercase tracking-wide text-slate-400">{t("decode.breakdown")}</div>
          <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2 text-base leading-relaxed">
            {parsed.segments.map((s, k) => {
              if (s.type === "sep") {
                return (
                  <span key={k} className="font-mono text-slate-500">
                    {s.text}
                  </span>
                );
              }
              const color = KIND_INFO[s.kind!].color;
              const on = active === s.i;
              return (
                <button
                  key={k}
                  type="button"
                  onMouseEnter={() => setActive(s.i!)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(s.i!)}
                  onBlur={() => setActive(null)}
                  className="rounded-md border px-2 py-1 font-mono text-sm font-semibold transition"
                  style={
                    on
                      ? { backgroundColor: color, color: "#fff", borderColor: color }
                      : { backgroundColor: `${color}22`, color, borderColor: `${color}55` }
                  }
                >
                  {s.text}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{t("decode.hint")}</p>

          {/* Meaning cards */}
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {parsed.tokens.map((tok, i) => {
              const info = KIND_INFO[tok.kind];
              const on = active === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="rounded-xl border bg-ink-850/40 p-3 transition"
                  style={on ? { borderColor: info.color, backgroundColor: `${info.color}14` } : { borderColor: "transparent" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: info.color }} />
                    <code className="font-mono text-sm font-semibold" style={{ color: info.color }}>
                      {tok.text}
                    </code>
                    <span className="text-xs font-medium text-slate-300">{info.title[lang]}</span>
                  </div>
                  <p className={"mt-1 pl-[18px] text-xs transition " + (on ? "text-slate-200" : "text-slate-400")}>
                    {info.desc[lang]}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="py-10 text-center text-sm text-slate-400">{t("decode.empty")}</p>
        </Card>
      )}
    </div>
  );
}
