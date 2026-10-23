// 外观设置：主题 / 圆角 / 主色 / 密度。首帧前从 localStorage 镜像读取并写到 <html>。
// 插件里真正的来源是 chrome.storage（见 @xxd/extension），这里只负责「不闪」。
import { applyAccent, normalizeAccent } from "./accent.js";

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "light", // light | dark | system
  corners: "square", // square | rounded
  accent: "", // "" = 墨色，或 #rrggbb
  accentMode: "auto", // auto（自动提亮或加深，保证对比度）| exact（品牌色原样出现在按钮和标记上）
  density: "comfortable", // comfortable | compact
  finish: "flat", // flat | material（实心按钮的质感）
});

export const DEFAULT_STORAGE_KEY = "xxd-ui";

const storage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export function readSettings(key = DEFAULT_STORAGE_KEY) {
  try {
    const value = JSON.parse(storage()?.getItem(key) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/** 合并后写回镜像。存储被禁用时静默失败：页面拿到 chrome.storage 后仍会应用。 */
export function rememberSettings(patch = {}, key = DEFAULT_STORAGE_KEY) {
  const next = { ...readSettings(key), ...patch };
  try {
    storage()?.setItem(key, JSON.stringify(next));
  } catch {
    /* blocked */
  }
  return next;
}

const systemDark = () => Boolean(globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches);

export function resolveTheme(mode) {
  if (mode === "dark" || mode === "light") return mode;
  if (mode === "system") return systemDark() ? "dark" : "light";
  return "light";
}

/**
 * 把设置写到元素上。element 缺省为 <html>。
 * lock 可锁定某项（例如会员站 { corners: "square" }），用户设置不覆盖它。
 */
export function applySettings(settings = {}, { element = globalThis.document?.documentElement, lock = {} } = {}) {
  if (!element) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings, ...lock };
  const theme = resolveTheme(s.theme);
  element.setAttribute("data-theme", theme);
  // 桥接 Kumo 的 [data-mode=dark] 选择器。
  element.setAttribute("data-mode", theme);
  element.setAttribute("data-corners", s.corners === "rounded" ? "rounded" : "square");
  element.setAttribute("data-density", s.density === "compact" ? "compact" : "comfortable");
  element.setAttribute("data-finish", s.finish === "material" ? "material" : "flat");
  const accent = applyAccent(element, normalizeAccent(s.accent), { exact: s.accentMode === "exact" });
  return { ...s, theme: s.theme, resolvedTheme: theme, accent };
}

let systemListener = null;

/** 「跟随系统」时监听系统主题变化。 */
export function watchSystemTheme(getSettings, options) {
  const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return () => {};
  if (systemListener) mq.removeEventListener("change", systemListener);
  systemListener = () => {
    const current = getSettings();
    if (current.theme === "system") applySettings(current, options);
  };
  mq.addEventListener("change", systemListener);
  return () => mq.removeEventListener("change", systemListener);
}

/** 焦点环只给键盘：鼠标点击/触摸后不留焦点环（<html data-input="pointer|keyboard">）。 */
export function trackInputModality(root = globalThis.document?.documentElement) {
  const doc = globalThis.document;
  if (!root || !doc) return;
  root.setAttribute("data-input", "pointer");
  doc.addEventListener("pointerdown", () => root.setAttribute("data-input", "pointer"), true);
  doc.addEventListener(
    "keydown",
    (event) => {
      if (/^(Tab|Arrow|Home|End|PageUp|PageDown)/.test(event.key)) root.setAttribute("data-input", "keyboard");
    },
    true,
  );
}
