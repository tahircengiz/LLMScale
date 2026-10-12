// The site's navigation, in one place: the app header (src/components/SiteNav.tsx)
// and the static guides and feed (scripts/appLook.ts) both draw from it, so a new
// tool cannot appear in one and not the other. scripts/test-invariants.ts checks
// that every entry has its words in both languages and leads somewhere real.
//
// One calm row at every width from sm up, in both languages: the calculator is a
// direct link, and everything else sits in three menus by intent — understand the
// model, serve it, learn — each item with a line saying what it is for, and beside
// the list a few lines on what the page under the pointer holds. A menu opens when
// the pointer rests on it, or on a click or Enter. A new tool lengthens a menu,
// never the row. Below sm the row folds to the current page and
// a Menu button, as before.
//
// React-free, so the build-time page generators can import it.

import { CONCEPTS_HUB, GPUS_HUB, MODELS_HUB } from "./staticPages.ts";
import { FEED_HUB } from "./feed.ts";

export interface NavItem {
  /** The page id App.tsx's currentPage() returns, for an app surface or the feed. */
  page?: string;
  /** Dictionary key of its name. */
  label: string;
  /** Dictionary key of its one-line description, shown in the desktop menu. */
  desc?: string;
  /** Dictionary key of what a visitor finds there, shown beside the list for the
   *  entry the pointer or focus is on. */
  more?: string;
  /** Path under the language root: "" for the calculator, "x.html" for a tool. */
  file: string;
  /** Linked only when the build has news posts. */
  feedOnly?: boolean;
}

export interface NavMenu {
  id: "model" | "serve" | "learn";
  /** Dictionary key of the menu's name. */
  label: string;
  /** Item groups, divided by a hairline; a titled group carries its title key. */
  sections: { title?: string; items: NavItem[] }[];
}

const item = (page: string, file: string): NavItem => ({ page, label: `nav.${page}`, desc: `nav.desc.${page}`, more: `nav.more.${page}`, file });

/** The calculator: the product's core, one click from everywhere. */
export const NAV_HOME: NavItem = { ...item("sizing", ""), more: undefined };

export const NAV_MENUS: NavMenu[] = [
  {
    id: "model",
    label: "nav.group.model",
    sections: [
      { items: [item("fit", "fit.html"), item("compare", "compare.html"), item("anatomy", "anatomy.html"), item("config", "config.html"), item("decode", "decode.html")] },
      { items: [item("train", "train.html")] },
    ],
  },
  {
    id: "serve",
    label: "nav.group.serve",
    sections: [{ items: [item("serving", "serving.html"), item("vllm", "vllm.html")] }],
  },
  {
    id: "learn",
    label: "nav.group.learn",
    sections: [
      { items: [item("learn", "learn.html"), { ...item("news", FEED_HUB), feedOnly: true }] },
      {
        title: "nav.guides",
        items: [
          { label: "footer.models", more: "nav.more.models", file: MODELS_HUB },
          { label: "footer.gpus", more: "nav.more.gpus", file: GPUS_HUB },
          { label: "footer.concepts", more: "nav.more.concepts", file: CONCEPTS_HUB },
        ],
      },
    ],
  },
];

/** The menus as a build sees them: the feed only when it has posts. */
export function navMenus(hasFeed: boolean): NavMenu[] {
  return NAV_MENUS.map((m) => ({
    ...m,
    sections: m.sections.map((s) => ({ ...s, items: s.items.filter((i) => hasFeed || !i.feedOnly) })).filter((s) => s.items.length > 0),
  }));
}

/** The menu holding a page, if any. */
export const menuOf = (menus: NavMenu[], page: string): NavMenu | undefined =>
  menus.find((m) => m.sections.some((s) => s.items.some((i) => i.page === page)));

/** Every page the nav names, the calculator first. */
export const navPages = (menus: NavMenu[]): NavItem[] => [NAV_HOME, ...menus.flatMap((m) => m.sections.flatMap((s) => s.items))];
