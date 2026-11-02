// 组件做到哪一步（DOCS-NAV-PLAN G6）：总览页的状态表和组件页的页头共用。每格只有 yes / partial / no 三种。
import * as reactDemos from "../react/demos.tsx";
import { PARITY } from "../data/parity.js";
import { miniOfWeb } from "./mini.js";

export const STATUS_KEYS = ["web", "react", "mini", "parity", "docs"];

/** 说明齐不齐：什么时候用 / 别用、键盘与读屏、规则、对错对照，四样 */
export function docsParts(c) {
  return [Boolean(c.use?.length && c.avoid?.length), Boolean(c.a11y?.length), Boolean(c.rules?.length), Boolean(c.dos?.length)];
}

export function statusOf(c, lang = "zh") {
  const hasReactDemo = `${c.name}Demo` in reactDemos;
  const react = c.react ? (hasReactDemo ? "yes" : "partial") : "no";
  const mini = miniOfWeb(c.name, lang);
  const done = docsParts(c).filter(Boolean).length;
  return {
    web: "yes",
    react,
    mini: mini ? "yes" : "no",
    parity: hasReactDemo ? (PARITY[c.name] ? "yes" : "partial") : "no",
    docs: done === 4 ? "yes" : done ? "partial" : "no",
    miniSlug: mini?.slug,
    miniName: mini?.name,
  };
}

export const STATUS_TEXT = {
  zh: {
    cols: { web: "网页", react: "React", mini: "小程序", parity: "两种实现对照", docs: "说明" },
    values: { yes: "有", partial: "部分", no: "没有" },
    legend: [
      ["web", "原生 HTML + CSS（@xxd/css）。每个组件都有，这是唯一来源。"],
      ["react", "有：@xxd/react 里有，展示站有 React 演示。部分：有 React 组件（多半来自 Kumo），还没有和网页版并排的演示。"],
      ["mini", "@xxd/mini 里有对应的小程序组件。"],
      ["parity", "有：两种实现逐项量过，样子一致。部分：有 React 演示，还没对照。"],
      ["docs", "四样都写了才算有：什么时候用 / 别用、键盘与读屏、规则、对错对照。"],
    ],
  },
  en: {
    cols: { web: "Web", react: "React", mini: "Mini program", parity: "Side-by-side check", docs: "Guidance" },
    values: { yes: "Yes", partial: "Partial", no: "No" },
    legend: [
      ["web", "Native HTML + CSS (@xxd/css). Every component has it; it is the single source."],
      ["react", "Yes: in @xxd/react, with a React demo on this site. Partial: a React component exists (mostly from Kumo) but has no demo next to the web version yet."],
      ["mini", "A matching component exists in @xxd/mini."],
      ["parity", "Yes: both implementations were measured property by property and match. Partial: there is a React demo, not checked yet."],
      ["docs", "Yes only when all four are written: when to use / not, keyboard and screen readers, rules, do and don't."],
    ],
  },
};
