import { categoriesFor, componentsFor } from "../lib/data.js";
import { patternsFor } from "./patterns.js";
import { templatesFor } from "./templates.js";
import { miniFor } from "../lib/mini.js";
import { stripLang, t, withLang } from "../i18n/index.js";
import { PAGE_KEYWORDS, SEARCH_ALIASES } from "./search.js";

// 左侧导航。顺序就是阅读顺序。地址按语言加前缀（英文在 /en/ 下）。
export function navFor(lang = "zh") {
  const L = t(lang);
  const components = componentsFor(lang);
  // 搜索关键词：两种语言的名字、类名、React 名字、别的库里的叫法（中文站搜 Modal 也能找到对话框）
  const other = Object.fromEntries(componentsFor(lang === "en" ? "zh" : "en").map((c) => [c.name, c.label]));
  const kw = (c) => [c.name, other[c.name], c.react, ...(c.classes ?? []).slice(0, 3), SEARCH_ALIASES[c.name]].filter(Boolean).join(" ");
  // 每组属于一个栏目（DOCS-NAV-PLAN G1）：顶栏切栏目，左栏只列当前栏目的组
  const groups = [
    {
      section: "start",
      title: L.navStart,
      items: [
        { label: L.pageHome, href: "/" },
        { label: L.pageStart, href: "/start" },
        { label: L.pageDesigners, href: "/designers" },
        { label: L.pagePrinciples, href: "/principles" },
        { label: L.pageLicense, href: "/license" },
      ],
    },
    {
      section: "foundations",
      title: L.navFoundations,
      items: [
        { label: L.pageColors, href: "/foundations/colors" },
        { label: L.pageRadius, href: "/foundations/radius" },
        { label: L.pageType, href: "/foundations/type" },
        { label: L.pageSpacing, href: "/foundations/spacing" },
        { label: L.pageMotion, href: "/foundations/motion" },
        { label: L.pageFinish, href: "/foundations/finish" },
        { label: L.pageIcons, href: "/foundations/icons" },
      ],
    },
    { section: "components", title: L.navComponents, items: [{ label: L.pageComponents, href: "/components", keywords: "components overview status 组件 总览 状态 全部" }] },
    ...categoriesFor(lang).map((cat) => ({
      section: "components",
      title: cat.label,
      // 英文版的名字本身就是英文，不再在右边重复一遍组件名
      items: components.filter((c) => c.category === cat.key).map((c) => ({ label: c.label, sub: lang === "en" ? undefined : c.name, href: `/components/${c.slug}`, keywords: kw(c) })),
    })),
    { section: "patterns", title: L.navPatterns, items: patternsFor(lang).map((p) => ({ label: p.label, href: `/patterns/${p.slug}`, keywords: [p.name, SEARCH_ALIASES[p.name]].filter(Boolean).join(" ") })) },
    { section: "patterns", title: L.navTemplates, items: templatesFor(lang).map((x) => ({ label: x.label, href: `/templates/${x.slug}` })) },
    {
      section: "mini",
      title: L.navMini,
      items: [{ label: L.pageMini, href: "/miniprogram", keywords: "miniprogram weapp taro 小程序 微信" }, ...miniFor(lang).map((c) => ({ label: c.label, sub: lang === "en" ? undefined : c.name, href: `/miniprogram/${c.slug}`, keywords: `${c.name} 小程序 mini` }))],
    },
    {
      section: "tools",
      title: L.navTools,
      items: [
        { label: L.pageTools, href: "/tools" },
        { label: L.pageVisual, href: "/tools#visual" },
        { label: L.pageAi, href: "/tools#ai" },
        { label: L.pageParity, href: "/tools/parity" },
        { label: L.pageChangelog, href: "/changelog" },
      ],
    },
  ];
  return groups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, keywords: i.keywords ?? PAGE_KEYWORDS[i.href.split("#")[0]], href: withLang(i.href, lang) })) }));
}

// 顶栏的栏目（G1）。链接到栏目的第一页
export const SECTIONS = ["start", "foundations", "components", "patterns", "mini", "tools"];
const SECTION_LABEL = { start: "navStart", foundations: "navFoundations", components: "navComponents", patterns: "navPatterns", mini: "navMini", tools: "navTools" };
export function sectionsFor(lang = "zh") {
  const L = t(lang);
  const groups = navFor(lang);
  return SECTIONS.map((key) => ({ key, label: L[SECTION_LABEL[key]], href: groups.find((g) => g.section === key).items[key === "start" ? 1 : 0].href }));
}

/** 这一页属于哪个栏目：看地址（G2），其余都算「开始」 */
export function sectionOf(path) {
  const p = stripLang(path);
  if (/^\/components(\/|$)/.test(p)) return "components";
  if (/^\/foundations(\/|$)/.test(p)) return "foundations";
  if (/^\/(patterns|templates)(\/|$)/.test(p)) return "patterns";
  if (/^\/miniprogram(\/|$)/.test(p)) return "mini";
  if (/^\/(tools|changelog)(\/|$)/.test(p)) return "tools";
  return "start";
}

export const flatPagesFor = (lang = "zh") => navFor(lang).flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));

// 中文版（老代码直接用）
export const nav = navFor("zh");
export const flatPages = flatPagesFor("zh");
