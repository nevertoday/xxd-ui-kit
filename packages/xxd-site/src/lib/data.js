// 展示站的数据：全部来自各个包的「唯一来源」，页面不手抄。英文版从 registry.en.js / patterns.en.js 叠上去。
import registry from "../../../xxd-css/registry.json";
import cssPkg from "../../../xxd-css/package.json";
import * as registryEn from "../../../xxd-css/registry.en.js";
import tokens from "../../../xxd-tokens/dist/tokens.json";
import { ACCENT_PRESETS, accentPalette, contrast, toRgb } from "@xxd/tokens";
import { ICON_NAMES, ICON_ALIASES, iconSVG } from "@xxd/icons";
import { ICON_GROUPS, ICON_KEYWORDS } from "@xxd/icons/meta";

export { registry, tokens, ACCENT_PRESETS, accentPalette, contrast, toRgb, ICON_NAMES, ICON_ALIASES, ICON_GROUPS, ICON_KEYWORDS, iconSVG };

/** 展示站上带版本号的构建文件 /v/<版本>/（scripts/assets.mjs 拷过去） */
export const CDN_VERSION = cssPkg.version;

export const slug = (name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

const CATEGORY_ORDER = ["基础", "操作", "表单", "导航", "设置", "浮层", "反馈", "内容", "展示"];
const byCategory = (a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99);

/**
 * 某种语言的组件列表。每项多出：slug、label（这种语言的名字）、categoryLabel；
 * 英文版用 registry.en.js 里的字段覆盖（没写的字段沿用中文版，比如本来就是英文的类名、示例）。
 */
export function componentsFor(lang = "zh") {
  return registry.components.map((c) => {
    const base = { ...c, slug: slug(c.name), label: c.zh, categoryLabel: c.category };
    if (lang !== "en") return base;
    const { title, ...en } = registryEn.components[c.name] ?? {};
    return { ...base, ...en, label: title ?? c.name, categoryLabel: registryEn.categories[c.category] ?? c.category };
  });
}

/** 分类（按固定顺序），带这种语言的名字 */
export function categoriesFor(lang = "zh") {
  return [...new Set(registry.components.map((c) => c.category))].sort(byCategory).map((key) => ({ key, label: lang === "en" ? registryEn.categories[key] ?? key : key }));
}

/** 英文版的注册表（/en/api/registry.json）：字段和中文版一样，文字换成英文 */
export function registryFor(lang = "zh") {
  if (lang !== "en") return registry;
  return { ...registry, components: componentsFor("en").map(({ slug: _s, label, categoryLabel, ...c }) => ({ ...c, en: label, category: categoryLabel })) };
}

export const components = componentsFor("zh");
export const categories = categoriesFor("zh").map((c) => c.key);
export const componentBySlug = (s, lang = "zh") => componentsFor(lang).find((c) => c.slug === s);

export const icon = (name, size = 16) => iconSVG(name, { size });
