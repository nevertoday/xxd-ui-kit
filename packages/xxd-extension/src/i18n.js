// 三语（简 / 繁 / 英）：chrome.i18n 优先，没有时用传入的字典。
//   <span data-i18n="settingsTitle"></span>
//   <input data-i18n-attr="placeholder:searchPlaceholder,aria-label:searchLabel">
import { xxd } from "./xxd.js";

export function t(key, substitutions, fallback = {}) {
  const fromChrome = globalThis.chrome?.i18n?.getMessage?.(key, substitutions);
  if (fromChrome) return fromChrome;
  const raw = fallback[key] ?? key;
  const subs = Array.isArray(substitutions) ? substitutions : substitutions == null ? [] : [substitutions];
  return subs.reduce((text, value, i) => text.replaceAll(`$${i + 1}`, String(value)), raw);
}

/** 找不到翻译时保留 HTML 里原来的文字（不会把 key 写到界面上）。 */
export function applyI18n(root = document, fallback = {}) {
  const lookup = (key) => {
    const text = t(key, undefined, fallback);
    return text === key ? null : text;
  };
  for (const el of root.querySelectorAll("[data-i18n]")) {
    const text = lookup(el.dataset.i18n);
    if (text != null) el.textContent = text;
  }
  for (const el of root.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of el.dataset.i18nAttr.split(",")) {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      const text = attr && key ? lookup(key) : null;
      if (text != null) el.setAttribute(attr, text);
    }
  }
}

const normalize = (lang) => {
  const l = String(lang || "").toLowerCase();
  if (l.startsWith("zh")) return /tw|hk|mo|hant/.test(l) ? "zh-Hant" : "zh-CN";
  return "en";
};

/**
 * 界面用哪种语言（简体 / 繁体 / 英文）。唯一来源是 _locales 里的 xxdLocale 这一条：
 * Chrome 按用户的语言挑了哪份 messages.json，界面文字、<html lang>、组件自带的文字（关闭、取消）就都用那一种，
 * 不会出现「文案是中文、组件是英文」。没有 xxdLocale 时退回 Chrome 的界面语言。
 */
export function uiLocale(lang) {
  if (lang) return normalize(lang);
  const fromMessages = globalThis.chrome?.i18n?.getMessage?.("xxdLocale");
  if (fromMessages) return normalize(fromMessages);
  // 不在插件里（普通网页、展示站）：跟页面的 <html lang>，再退回浏览器语言
  const pageLang = !globalThis.chrome?.i18n && globalThis.document?.documentElement?.lang;
  return normalize(pageLang || globalThis.chrome?.i18n?.getUILanguage?.() || globalThis.navigator?.language || "zh-CN");
}

/** 这个脚本是不是跑在别人的网页里（内容脚本）。 */
export const isContentScript = () => Boolean(globalThis.chrome?.runtime?.id) && globalThis.location?.protocol !== "chrome-extension:";

/**
 * 把语言用到页面上：插件自己的页面写 <html lang>；组件（@xxd/css，见 useXxd）跟着这种语言。
 * 内容脚本里只改组件的语言（它在插件自己的隔离环境里），不碰宿主网页的 <html lang>。extension.js 加载时自动调用。
 */
export function applyLocale(locale = uiLocale()) {
  if (!isContentScript() && globalThis.document?.documentElement) globalThis.document.documentElement.lang = locale;
  xxd()?.setLocale?.(locale);
  return locale;
}
