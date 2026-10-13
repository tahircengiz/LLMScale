import type { Dtype, ModelArch } from "../lib/calc";
import { formatInt } from "../lib/format";
import { useLang } from "../lib/i18n";
import { AMBER, GREEN, INDIGO } from "../lib/palette";
import { BANDWIDTH_EFFICIENCY, COMPUTE_EFFICIENCY, decodeCurve, prefillTime, type DecodePoint, type Tflops } from "../lib/perf";

// How fast one device serves the model: time to the first token for a prompt,
// and decode speed as the batch grows (perf.ts). Bandwidth bounds a small batch,
// tensor throughput a large one; the chart shades where compute binds, so the
// knee in total throughput has a visible cause.

const W = 260;
const H = 100;
const PAD = { l: 34, r: 8, t: 8, b: 20 };

function fmtTok(n: number): string {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

function Chart({ points, pick, color, label }: { points: DecodePoint[]; pick: (p: DecodePoint) => number; color: string; label: string }) {
  const max = Math.max(...points.map(pick)) * 1.1 || 1;
  const n = points.length;
  const x = (k: number) => PAD.l + (n === 1 ? 0 : (k / (n - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const path = points.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  const firstCompute = points.findIndex((p) => p.bound === "compute");
  // Label the ends and, when there is room, the middle.
  const ticks = n > 4 ? [0, Math.floor((n - 1) / 2), n - 1] : points.map((_, k) => k);
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 text-[11px] text-slate-400">{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {firstCompute >= 0 && (
          <rect
            x={firstCompute === 0 ? PAD.l : (x(firstCompute - 1) + x(firstCompute)) / 2}
            y={PAD.t}
            width={W - PAD.r - (firstCompute === 0 ? PAD.l : (x(firstCompute - 1) + x(firstCompute)) / 2)}
            height={H - PAD.t - PAD.b}
            fill={AMBER}
            fillOpacity={0.1}
          />
        )}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className="stroke-white/15" />
        <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t} y2={PAD.t} className="stroke-white/5" strokeDasharray="2 3" />
        <text x={PAD.l - 4} y={PAD.t + 4} textAnchor="end" className="fill-slate-500 text-[9px]">{fmtTok(max / 1.1)}</text>
        <text x={PAD.l - 4} y={H - PAD.b} textAnchor="end" className="fill-slate-500 text-[9px]">0</text>
        {ticks.map((k) => (
          <text key={k} x={x(k)} y={H - 6} textAnchor={k === 0 ? "start" : k === n - 1 ? "end" : "middle"} className="fill-slate-500 text-[9px]">
            {points[k].batch}
          </text>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, k) => (
          <circle key={k} cx={x(k)} cy={y(pick(p))} r={k === n - 1 ? 3 : 2} fill={color} />
        ))}
      </svg>
    </figure>
  );
}

export function SpeedPanel({
  arch,
  weightDtype,
  kvDtype,
  tokensPerSeq,
  promptTokens,
  maxBatch,
  device,
  name,
}: {
  arch: ModelArch;
  weightDtype: Dtype;
  kvDtype: Dtype;
  /** Tokens each sequence holds while decoding: what attention reads per step. */
  tokensPerSeq: number;
  promptTokens: number;
  /** The most sequences the card holds at that size: where the curve ends. */
  maxBatch: number;
  device: { tflops?: Tflops; bandwidthGBs: number };
  name: string;
}) {
  const { t } = useLang();
  const curve = decodeCurve({ arch, weightDtype, kvDtype, contextLength: tokensPerSeq }, Math.max(1, maxBatch), device);
  const ttft = device.tflops ? prefillTime(arch, weightDtype, promptTokens, { tflops: device.tflops, bandwidthGBs: device.bandwidthGBs }) : null;
  if (!curve.length) return null;
  const last = curve[curve.length - 1];
  const knee = curve.find((p) => p.bound === "compute");

  return (
    <div className="mt-3 rounded-xl bg-ink-800/60 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="text-[11.5px] font-semibold text-white">{t("speed.title", { name })}</div>
        {ttft && (
          <div className="text-[11.5px] text-slate-300">
            {t("speed.ttft", { ms: formatInt(Math.round(ttft.seconds * 1000)), n: formatInt(promptTokens) })}{" "}
            <span className="text-slate-500">· {t(ttft.bound === "compute" ? "speed.boundCompute" : "speed.boundMemory")}</span>
          </div>
        )}
      </div>
      {/* One above the other: the card is half the page wide, and side by side the
          axis labels would shrink below reading size. */}
      <div className="grid grid-cols-1 gap-3">
        <Chart points={curve} pick={(p) => p.perUser} color={INDIGO} label={t("speed.perUser")} />
        <Chart points={curve} pick={(p) => p.total} color={GREEN} label={t("speed.total")} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        {t("speed.at", {
          b: formatInt(last.batch),
          ms: last.stepMs.toFixed(1),
          user: formatInt(Math.round(last.perUser)),
          total: formatInt(Math.round(last.total)),
        })}{" "}
        {knee ? t("speed.knee", { b: formatInt(knee.batch) }) : t(device.tflops ? "speed.noKnee" : "speed.noTflops")}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        {t(device.tflops ? "speed.note" : "speed.noteBw", {
          bw: Math.round(BANDWIDTH_EFFICIENCY * 100),
          fl: Math.round(COMPUTE_EFFICIENCY * 100),
          n: formatInt(tokensPerSeq),
        })}
      </p>
    </div>
  );
}
