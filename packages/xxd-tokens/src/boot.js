// 首帧前同步执行（<head> 里的经典 <script>，在样式表之前或之后都可以）。
// <script src="vendor/xxd/boot.js" data-key="my-extension-ui" data-lock-corners="square"></script>
// 暴露 window.XxdTheme。
import * as accent from "./accent.js";
import * as theme from "./theme.js";

const script = globalThis.document?.currentScript;
const key = script?.dataset?.key || theme.DEFAULT_STORAGE_KEY;
const lock = {};
if (script?.dataset?.lockCorners) lock.corners = script.dataset.lockCorners;
if (script?.dataset?.lockTheme) lock.theme = script.dataset.lockTheme;

// 页面自己的默认值（用户没设置过时用）：data-default-density="compact" 等
const defaults = {};
for (const name of ["theme", "corners", "density", "accent", "accentMode", "finish"]) {
  const value = script?.dataset?.[`default${name[0].toUpperCase()}${name.slice(1)}`];
  if (value !== undefined) defaults[name] = value;
}

const current = () => ({ ...defaults, ...theme.readSettings(key) });

theme.applySettings(current(), { lock });
theme.watchSystemTheme(current, { lock });
theme.trackInputModality();

const api = Object.freeze({
  key,
  lock: Object.freeze({ ...lock }),
  defaults: Object.freeze({ ...defaults }),
  read: current,
  /** 更新设置：写镜像并立即应用。返回最终设置。 */
  set(patch) {
    const next = { ...defaults, ...theme.rememberSettings(patch, key) };
    theme.applySettings(next, { lock });
    globalThis.dispatchEvent?.(new CustomEvent("xxd:settings", { detail: next }));
    return next;
  },
  apply: (settings, options) => theme.applySettings(settings, { lock, ...options }),
  resolveTheme: theme.resolveTheme,
  accent,
  ACCENT_PRESETS: accent.ACCENT_PRESETS,
  DEFAULT_SETTINGS: theme.DEFAULT_SETTINGS,
});

globalThis.XxdTheme = api;
