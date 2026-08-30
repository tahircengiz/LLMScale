import { useLang } from "../lib/i18n";
import type { PageId } from "../lib/pages";

/** Stroke icons on a 20px grid — one weight, one style, no emoji. */
const ICONS: Record<string, string> = {
  sizing: "M2.8 2.8h14.4v14.4H2.8zM6.4 7.6h7.2M6.4 11h4.4M6.4 14h2.4",
  fit: "M3 16.4V9.6M8.4 16.4V4M13.8 16.4v-4.6M17.4 16.4H2.6",
  vllm: "M5.6 7.4L2.8 10l2.8 2.6M14.4 7.4L17.2 10l-2.8 2.6M11.6 5l-3.2 10",
  decode: "M12.4 3.4H5.6A1.8 1.8 0 003.8 5.2v9.6a1.8 1.8 0 001.8 1.8h8.8a1.8 1.8 0 001.8-1.8V7zM12.2 3.4V7h4",
  anatomy: "M10 2.6l7 3.9v7l-7 3.9-7-3.9v-7zM3 6.5l7 3.9 7-3.9M10 10.4v7",
  compare: "M3 7h11l-3.2-3.2M17 13H6l3.2 3.2",
  learn: "M10 3.2v1.8M10 15v1.8M3.2 10h1.8M15 10h1.8M5.4 5.4l1.3 1.3M13.3 13.3l1.3 1.3M14.6 5.4l-1.3 1.3M6.7 13.3l-1.3 1.3",
  github: "M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7z",
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"shrink-0 " + className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const GROUPS: { key: string; items: { page: PageId; href: string; icon: string; badge?: string }[] }[] = [
  {
    key: "nav.group.sizing",
    items: [
      { page: "sizing", href: "", icon: "sizing" },
      { page: "fit", href: "fit.html", icon: "fit" },
    ],
  },
  { key: "nav.group.serve", items: [{ page: "vllm", href: "vllm.html", icon: "vllm" }] },
  {
    key: "nav.group.model",
    items: [
      { page: "decode", href: "decode.html", icon: "decode" },
      { page: "anatomy", href: "anatomy.html", icon: "anatomy" },
      { page: "compare", href: "compare.html", icon: "compare" },
    ],
  },
  { key: "nav.group.learn", items: [{ page: "learn", href: "learn.html", icon: "learn" }] },
];

const GITHUB_URL = "https://github.com/tahircengiz/";

export function Sidebar({ page }: { page: PageId }) {
  const { t } = useLang();
  const base = import.meta.env.BASE_URL;

  const itemCls = (active: boolean) =>
    "flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13.5px] no-underline transition " +
    (active
      ? "bg-brand-500 font-semibold text-onbrand"
      : "text-slate-300 hover:bg-white/5 hover:text-slate-200");

  return (
    <aside className="flex w-[228px] shrink-0 flex-col border-r border-ink-700 px-3.5 py-5">
      <a href={base} className="flex items-center gap-2.5 px-2 pb-5 no-underline">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="text-white">
          <rect x="2.5" y="2.5" width="15" height="15" rx="4.5" />
          <path d="M6.5 13V8.5M10 13V5.5M13.5 13v-3" />
        </svg>
        <span className="text-[15px] font-bold tracking-tight text-white">LLMScale</span>
      </a>

      {GROUPS.map((g) => (
        <div key={g.key} className="mb-3.5">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold text-slate-500">{t(g.key)}</div>
          {g.items.map((it) => (
            <a key={it.page} href={`${base}${it.href}`} className={itemCls(it.page === page)}>
              <Icon name={it.icon} className={it.page === page ? "opacity-90" : "text-slate-500"} />
              <span className="flex-1">{t(`nav.${it.page}`)}</span>
              {it.badge && <span className="text-[11px] font-semibold text-slate-500">{it.badge}</span>}
            </a>
          ))}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-px">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={itemCls(false)}>
          <Icon name="github" className="text-slate-500" />
          <span>GitHub</span>
        </a>
      </div>
    </aside>
  );
}
