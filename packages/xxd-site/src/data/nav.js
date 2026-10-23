import { categoriesFor, componentsFor } from "../lib/data.js";
import { patternsFor } from "./patterns.js";
import { templatesFor } from "./templates.js";
import { miniFor } from "../lib/mini.js";
import { t, withLang } from "../i18n/index.js";
import { PAGE_KEYWORDS, SEARCH_ALIASES } from "./search.js";

// 左侧导航。顺序就是阅读顺序。地址按语言加前缀（英文在 /en/ 下）。
export function navFor(lang = "zh") {
  const L = t(lang);
  const components = componentsFor(lang);
  // 搜索关键词：两种语言的名字、类名、React 名字、别的库里的叫法（中文站搜 Modal 也能找到对话框）
  const other = Object.fromEntries(componentsFor(lang === "en" ? "zh" : "en").map((c) => [c.name, c.label]));
  const kw = (c) => [c.name, other[c.name], c.react, ...(c.classes ?? []).slice(0, 3), SEARCH_ALIASES[c.name]].filter(Boolean).join(" ");
  const groups = [
    {
      title: L.navStart,
      items: [
        { label: L.pageHome, href: "/" },
        { label: L.pageStart, href: "/start" },
        { label: L.pageDesigners, href: "/designers" },
        { label: L.pagePrinciples, href: "/principles" },
      ],
    },
    {
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
    ...categoriesFor(lang).map((cat) => ({
      title: `${L.navComponents} · ${cat.label}`,
      // 英文版的名字本身就是英文，不再在右边重复一遍组件名
      items: components.filter((c) => c.category === cat.key).map((c) => ({ label: c.label, sub: lang === "en" ? undefined : c.name, href: `/components/${c.slug}`, keywords: kw(c) })),
    })),
    { title: L.navPatterns, items: patternsFor(lang).map((p) => ({ label: p.label, href: `/patterns/${p.slug}`, keywords: [p.name, SEARCH_ALIASES[p.name]].filter(Boolean).join(" ") })) },
    { title: L.navTemplates, items: templatesFor(lang).map((x) => ({ label: x.label, href: `/templates/${x.slug}` })) },
    {
      title: L.navMini,
      items: [{ label: L.pageMini, href: "/miniprogram", keywords: "miniprogram weapp taro 小程序 微信" }, ...miniFor(lang).map((c) => ({ label: c.label, sub: lang === "en" ? undefined : c.name, href: `/miniprogram/${c.slug}`, keywords: `${c.name} 小程序 mini` }))],
    },
    {
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

export const flatPagesFor = (lang = "zh") => navFor(lang).flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));

// 中文版（老代码直接用）
export const nav = navFor("zh");
export const flatPages = flatPagesFor("zh");
