// 查找：图标（名字、别名、中文关键词）、组件和模式（英文名、中文名、类名）、令牌、展示站页面地址。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ICON_ALIASES, ICON_NAMES, iconSVG, resolveIcon } from "../../../xxd-icons/src/svg.js";
import { ICON_GROUPS, ICON_KEYWORDS } from "../../../xxd-icons/src/meta.js";
import { suggest } from "./term.mjs";
import { isEn } from "./lang.mjs";

export const SITE = "https://ui.xiaoxiaodong.ai";
const repo = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const readJson = (rel) => JSON.parse(readFileSync(join(repo, rel), "utf8"));
// 英文版的注册表（展示站 /en/ 用的那份）：命令行说英文时，名字、说明、示例、规则都用它
const EN = await import(pathToFileURL(join(repo, "packages/xxd-css/registry.en.js")).href);
const EN_PATTERNS = await import(pathToFileURL(join(repo, "packages/xxd-css/patterns.en.js")).href);

const GROUP_ZH = Object.fromEntries(ICON_GROUPS.flatMap((g) => Object.keys(g.icons).map((n) => [n, g.zh])));
const GROUP_EN = Object.fromEntries(ICON_GROUPS.flatMap((g) => Object.keys(g.icons).map((n) => [n, g.en])));
const ALIASES_OF = {};
for (const [alias, target] of Object.entries(ICON_ALIASES)) (ALIASES_OF[target] ||= []).push(alias);

/** 图标名（含别名）→ 正式名；找不到返回 null。 */
export const iconName = (name) => (ICON_NAMES.includes(name) ? name : ICON_ALIASES[name] || null);

/**
 * 搜图标：空格分开的每个词都要命中。排序：名字 / 别名完全一样 > 名字开头 > 名字包含 > 关键词。
 * 返回 [{ name, keywords, group, aliases }]。
 */
export function searchIcons(query) {
  const words = String(query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const all = ICON_NAMES.map((name) => ({ name, keywords: ICON_KEYWORDS[name] || "", group: GROUP_ZH[name] || "", groupEn: GROUP_EN[name] || "", aliases: ALIASES_OF[name] || [] }));
  if (!words.length) return all;
  const scoreOf = (icon) => {
    let total = 0;
    for (const w of words) {
      const names = [icon.name, ...icon.aliases].map((n) => n.toLowerCase());
      const kws = `${icon.keywords} ${icon.group} ${icon.groupEn}`.toLowerCase().split(/\s+/);
      let s = 0;
      if (names.includes(w)) s = 100;
      else if (names.some((n) => n.startsWith(w))) s = 60;
      else if (names.some((n) => n.includes(w))) s = 40;
      else if (kws[0] === w) s = 35;
      else if (kws.includes(w)) s = 30;
      else if (kws.some((k) => k.includes(w))) s = 20;
      if (!s) return 0;
      total += s;
    }
    return total;
  };
  return all.map((i) => [scoreOf(i), i]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0] || a[1].name.length - b[1].name.length).map(([, i]) => i);
}

/** 一个图标的几种写法。 */
export function iconAs(name, format = "html", size = 24) {
  const real = iconName(name);
  if (!real) throw new Error(isEn() ? `There's no icon called ${name}` : `没有叫 ${name} 的图标`);
  if (format === "svg") return iconSVG(real, { size });
  if (format === "react") return `<Icon name="${real}" />`;
  if (format === "js") return `XxdIcons.iconSVG("${real}", { size: 16 })`;
  if (format === "name") return real;
  return `<i data-xxd-icon="${real}"></i>`;
}

export const iconSuggestions = (name) => suggest(name, [...ICON_NAMES, ...Object.keys(ICON_ALIASES)]).map((n) => iconName(n)).filter((n, i, a) => a.indexOf(n) === i);
export { resolveIcon };

// —— 组件与模式 ——
const slugOf = (name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

/** 组件和模式。每项有 label（这种语言的名字）、categoryLabel；说英文时说明、示例、规则换成英文版。 */
export function catalog({ en = isEn() } = {}) {
  const comps = readJson("packages/xxd-css/registry.json").components.map((c) => {
    const base = { ...c, kind: "component", slug: slugOf(c.name), path: `/components/${slugOf(c.name)}`, label: c.zh, categoryLabel: c.category };
    if (!en) return base;
    const { title, ...rest } = EN.components[c.name] ?? {};
    return { ...base, ...rest, label: title ?? c.name, categoryLabel: EN.categories[c.category] ?? c.category };
  });
  const pats = readJson("packages/xxd-css/patterns.json").patterns.map((p) => {
    const base = { ...p, kind: "pattern", category: "模式", path: `/patterns/${p.slug}`, label: p.zh, categoryLabel: "模式" };
    if (!en) return base;
    const { title, ...rest } = EN_PATTERNS.patterns[p.name] ?? {};
    return { ...base, ...rest, label: title ?? p.name, categoryLabel: "Patterns" };
  });
  return [...comps, ...pats];
}

/** 按英文名 / 中文名 / 类名 / 别名找组件或模式。返回 { exact, matches }。 */
export function findComponent(query, list = catalog()) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return { exact: null, matches: [] };
  const exact = list.find((c) => c.name.toLowerCase() === q || c.zh === query || c.label?.toLowerCase() === q || c.slug === q || c.classes?.includes(q) || c.classes?.includes(`xxd-${q}`));
  if (exact) return { exact, matches: [exact] };
  const matches = list.filter((c) => c.name.toLowerCase().includes(q) || c.zh.includes(query) || c.classes?.some((x) => x.includes(q)) || (c.summary || "").includes(query));
  if (matches.length === 1) return { exact: matches[0], matches };
  if (!matches.length) {
    const near = suggest(query, list.map((c) => c.name));
    return { exact: null, matches: list.filter((c) => near.includes(c.name)), near: true };
  }
  return { exact: null, matches };
}

/** 全部类名（注册表 + 构建出来的 xxd.css 里出现的），检查拼写用。 */
export function knownClasses() {
  const set = new Set(catalog().flatMap((c) => c.classes || []));
  try {
    const css = readFileSync(join(repo, "packages/xxd-css/dist/xxd.css"), "utf8");
    for (const m of css.matchAll(/\.(xxd-[a-z0-9_-]+)/g)) set.add(m[1]);
  } catch {
    // 没构建也能用注册表里的
  }
  return set;
}

// —— 令牌 ——
/** 令牌列表：[{ name, light, dark, rounded, compact }]，query 按名字或值过滤。 */
export function listTokens(query = "") {
  const t = readJson("packages/xxd-tokens/dist/tokens.json");
  const q = String(query).toLowerCase();
  return Object.keys(t.base)
    .filter((n) => !/-custom|-rgb$/.test(n))
    .map((name) => ({ name, light: t.base[name], dark: t.dark[name], rounded: t.rounded[name], compact: t.compact[name] }))
    .filter((x) => !q || x.name.includes(q) || String(x.light).toLowerCase().includes(q));
}

// —— 展示站页面 ——
const PAGES = {
  "": "/", home: "/", start: "/start", principles: "/principles", colors: "/foundations/colors", color: "/foundations/colors", radius: "/foundations/radius",
  type: "/foundations/type", font: "/foundations/type", spacing: "/foundations/spacing", motion: "/foundations/motion", finish: "/foundations/finish",
  icons: "/foundations/icons", icon: "/foundations/icons", tools: "/tools", cli: "/tools", changelog: "/changelog",
  首页: "/", 开始: "/start", 原则: "/principles", 设计原则: "/principles", 颜色: "/foundations/colors", 圆角: "/foundations/radius", 字体: "/foundations/type",
  间距: "/foundations/spacing", 动效: "/foundations/motion", 质感: "/foundations/finish", 图标: "/foundations/icons", 工具: "/tools", 命令行: "/tools", 更新: "/changelog",
};

/** 关键词 → 展示站地址（组件、模式、基础页）。找不到返回 null。 */
export function pageUrl(query = "", { en = false } = {}) {
  const q = String(query).trim();
  let path = PAGES[q.toLowerCase()] ?? PAGES[q];
  if (!path) {
    const { exact } = findComponent(q);
    if (exact) path = exact.path;
  }
  if (!path) {
    const icon = iconName(q);
    if (icon) path = `/foundations/icons?q=${encodeURIComponent(icon)}`;
  }
  if (!path) return null;
  return SITE + (en ? (path === "/" ? "/en/" : `/en${path}`) : path);
}
