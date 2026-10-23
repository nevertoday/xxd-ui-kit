// 外观（主题 / 圆角 / 主色 / 密度 / 质感）在小程序里怎么生效（docs/maintainers/MINIPROGRAM-PLAN.md §7）：
//   - 缺省外观写死在 tokens.mini.css 的 page 上，暗色在媒体查询里，不靠 JS；
//   - 别的外观：算出和缺省不一样的那些变量，写在每页的根节点（XxdPage）和浮层的根节点上；
//   - 根节点上还挂外观类名（is-theme-dark、is-corners-rounded……），网页版的 [data-theme=dark] 这类选择器改写成了它们。
// 按名字导入 API：Taro 编 H5 时只改写它自己处理过的源码里的 Taro.xxx，组件库在 node_modules 里，默认导出上没有这些 API
import { getAppBaseInfo, getStorageSync, getSystemInfoSync, offThemeChange, onThemeChange, setStorageSync } from "@tarojs/taro";
import { appearanceVars, DEFAULT_SETTINGS, DEFAULT_STORAGE_KEY, normalizeAccent, type XxdSettings } from "@xxd/tokens";
import { MIXES, MODES, USED } from "../styles/vars.js";
import { IS_H5 } from "./util";

// H5（Taro 编出来的网页）：没有 page 元素，令牌挂在 <html class="xxd-h5-root"> 上；
// Taro 的组件是 taro-view-core 这类自定义元素，样式表里不写它们的标签名（微信版不认），这里补一条 box-sizing
if (IS_H5 && typeof document !== "undefined") {
  document.documentElement.classList.add("xxd-h5-root");
  if (!document.getElementById("xxd-mini-h5")) {
    const style = document.createElement("style");
    style.id = "xxd-mini-h5";
    style.textContent = [
      "taro-view-core,taro-text-core,taro-button-core,taro-input-core,taro-textarea-core,taro-image-core,taro-scroll-view-core{box-sizing:border-box}",
      // Taro H5 的按钮自带按下变灰、禁用变淡：交给 .xxd-btn 自己的样式
      "taro-button-core.xxd-btn:not([disabled]):active{color:var(--btn-fg);background-color:var(--btn-bg-active,var(--wash-strong))}",
      "taro-button-core.xxd-btn[disabled]{color:var(--btn-fg);background-color:var(--btn-bg)}",
      // 输入框里真正的 <input> / <textarea> 占满外壳，字的样式跟外壳走
      "taro-input-core.xxd-input>input,taro-textarea-core.xxd-textarea>textarea{display:block;width:100%;height:100%;margin:0;padding:0;border:0;background:transparent;color:inherit;font:inherit;line-height:inherit;outline:0;resize:none}",
      "taro-input-core.xxd-input{display:flex;align-items:center}",
    ].join("");
    document.head.appendChild(style);
  }
}

export type Theme = "light" | "dark";
export type Settings = Required<XxdSettings>;
export { DEFAULT_SETTINGS, DEFAULT_STORAGE_KEY };

export interface Resolved {
  settings: Settings;
  theme: Theme;
  accent: string;
  /** 这一外观下所有令牌的值（已经算成具体的颜色） */
  vars: Record<string, string>;
  /** 根节点上要写的行内变量：只写和缺省不一样的 */
  style: string;
  /** 根节点上的外观类名 */
  className: string;
}

const staticCache: Partial<Record<Theme, Record<string, string>>> = {};
// 色阶的数字令牌只写组件样式里用得到的（大多用不到，写上去只会让每页根节点的行内样式变长）；别的令牌都写
const USED_SET = new Set<string>(USED);
const SCALE_NUMERIC = /^--(gray|accent|success|danger|warning)-(\d+|on)$/;
/** tokens.mini.css 里写死的那一套（亮：page 上；暗：媒体查询里） */
function staticVars(theme: Theme) {
  return (staticCache[theme] ??= appearanceVars({ theme }, { modes: MODES, extra: MIXES, coarse: true }).vars);
}

export function resolveAppearance(settings: XxdSettings, system: Theme, lock: XxdSettings = {}): Resolved {
  const s = { ...DEFAULT_SETTINGS, ...settings, ...lock } as Settings;
  const { theme, accent, vars } = appearanceVars(s, { modes: MODES, extra: MIXES, system, coarse: true });
  const base = staticVars(system);
  const style = Object.entries(vars)
    .filter(([k, v]) => base[k] !== v && (USED_SET.has(k) || !SCALE_NUMERIC.test(k)))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  const className = [
    `is-theme-${theme}`,
    s.corners === "rounded" ? "is-corners-rounded" : "is-corners-square",
    s.density === "compact" ? "is-density-compact" : "is-density-comfortable",
    s.finish === "material" ? "is-finish-material" : "is-finish-flat",
    accent ? "is-accent" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return { settings: s, theme, accent: normalizeAccent(accent), vars, style: theme !== system ? `color-scheme:${theme};${style}` : style, className };
}

/** 系统现在是亮还是暗（微信要在 app.json 里开 darkmode 才拿得到） */
export function systemTheme(): Theme {
  if (IS_H5) return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  try {
    const info = (getAppBaseInfo?.() ?? getSystemInfoSync()) as { theme?: string };
    return info.theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** 系统换亮暗时回调；返回取消函数 */
export function watchSystemTheme(cb: (theme: Theme) => void): () => void {
  if (IS_H5) {
    const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return () => {};
    const fn = () => cb(mq.matches ? "dark" : "light");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }
  const fn = (res: { theme: string }) => cb(res.theme === "dark" ? "dark" : "light");
  try {
    onThemeChange?.(fn);
    return () => offThemeChange?.(fn);
  } catch {
    return () => {};
  }
}

/** 读存好的设置：同步读，第一次渲染就是对的（不闪）。和网页版同一个键名、同样存 JSON 文本 */
export function readSettings(key = DEFAULT_STORAGE_KEY): XxdSettings {
  try {
    const raw = getStorageSync(key);
    const value = typeof raw === "string" ? (raw ? JSON.parse(raw) : {}) : raw;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function writeSettings(settings: XxdSettings, key = DEFAULT_STORAGE_KEY): void {
  try {
    setStorageSync(key, JSON.stringify(settings));
  } catch {
    /* 存储满了或被禁用：这次照样生效，只是下次打开回到缺省 */
  }
}
