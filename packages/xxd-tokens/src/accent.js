// 主色：一个颜色定整个界面的调子。算法移植自 xPoster src/accent-color.js。
// - 空值 = 墨色（默认），什么都不写。
// - 太浅的颜色在亮纸上压暗一点、太深的在暗纸上提亮一点，直到 3:1，保证按钮和标记看得见。
// - 「标记」（开关、tab 下划线、选中、焦点）用原色，只保证在纸上 3:1。
// - 「实心底」（主按钮、实心徽标、勾选框）上面要放字：另算一个 fill，把原色压暗一点直到白字 4.5:1；
//   压暗后在暗纸上不足 3:1 才改用近黑字。hover 色同样保证 4.5:1。
// - 另有一个更深的「文字版」（链接、小标签），在纸上达到 4.5:1。
// - accentMode: "exact"（品牌色原样）时，实心底用原色，白字不够就换近黑字；标记（开关、勾、下划线）用自动模式调过的那一档，
//   保证看得见（COLOR-REVIEW-PLAN D77：原色是亮黄、白、荧光绿时，标记在白纸上只有 1.0–1.4:1）；文字版照样加深。
// tokens.css 根据这些变量推出其余一切：选中底、焦点、灰色和线条里的一点色调（都是色阶里的某一级）。

/**
 * 第一个是默认墨色；其余 10 个在 OKLCH 里明度相同（L 0.60）、彩度相同（C 0.105），色相每隔 36° 一个，
 * 看起来一样「安静」、一样重，哪个都不跳出来（设计师评审 D25：以前 18 个明度从 0.52 到 0.69、彩度从 0.03 到 0.16，
 * 还有两对几乎一样的颜色和一个第三方品牌色）；最后一个是低彩度的雾灰蓝。name 是 i18n key。
 * 想用自己的品牌色：accent 写任意 #rrggbb，不必是预设。
 */
export const ACCENT_PRESETS = Object.freeze(
  [
    { id: "", name: "Ink", zh: "墨色" },
    { id: "#b7665c", name: "Rouge", zh: "胭脂" },
    { id: "#ac7236", name: "Ochre", zh: "赭石" },
    { id: "#8f812d", name: "Mustard", zh: "芥黄" },
    { id: "#638e4d", name: "Moss", zh: "苔绿" },
    { id: "#279479", name: "Teal", zh: "青绿" },
    { id: "#0191a0", name: "Peacock blue", zh: "孔雀蓝" },
    { id: "#4386ba", name: "Lake blue", zh: "湖蓝" },
    { id: "#7478be", name: "Indigo", zh: "靛蓝" },
    { id: "#996caa", name: "Wisteria", zh: "紫藤" },
    { id: "#b06587", name: "Sakura pink", zh: "樱粉" },
    { id: "#718391", name: "Misty slate", zh: "雾灰蓝" },
  ].map((preset) => Object.freeze(preset)),
);

import { generateScale, GRAY_PINS, SEMANTIC_PINS, hexToOklch } from "./scales.js";

export const LIGHT_PAPER = [255, 255, 255];
export const DARK_PAPER = [32, 31, 26];

export function normalizeAccent(value) {
  const hex = String(value || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) return `#${hex.slice(1).split("").map((c) => c + c).join("")}`;
  return "";
}

export function toRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

const clampRgb = (rgb) => rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))));

export function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const mix = (rgb, toward, t) => rgb.map((v, i) => v + (toward[i] - v) * t);

/** 向黑/白一步步靠近，直到在这张纸上达到需要的对比度。 */
export function ensureContrast(rgb, paper, toward, min = 3) {
  let next = rgb;
  for (let t = 0.04; t <= 0.9 && contrast(next, paper) < min; t += 0.04) next = mix(rgb, toward, t);
  return clampRgb(next);
}

const WHITE = [255, 255, 255];
const NEAR_BLACK = [17, 17, 17];

/** 实心底：白字 ≥ 4.5（压暗原色），同时在这张纸上仍是 ≥ 3 的标记；做不到就用近黑字。 */
export function accentFill(mark, paper) {
  if (contrast(mark, WHITE) >= 4.5) return { fill: mark, on: WHITE };
  for (let t = 0.02; t <= 0.4; t += 0.02) {
    const next = clampRgb(mix(mark, [0, 0, 0], t));
    if (contrast(next, WHITE) >= 4.5 && contrast(next, paper) >= 3) return { fill: next, on: WHITE };
  }
  return { fill: mark, on: NEAR_BLACK };
}

/** hover：先试着往纸色淡 10%，字仍 ≥ 4.5 就用；否则往反方向加深 10%。 */
export function accentFillHover(fill, on, paper) {
  const lighter = clampRgb(mix(fill, paper, 0.1));
  if (contrast(lighter, on) >= 4.5) return lighter;
  return clampRgb(mix(fill, on === WHITE ? [0, 0, 0] : WHITE, 0.1));
}

const OLD_KEYS = ["action-custom", "action-rgb-custom", "on-action-custom", "on-mark-custom", "action-text-custom", "action-fill-custom", "action-fill-hover-custom"];
/** 主色写到根上的全部变量名（不带 --、不带前缀）：老的 7 个 + 主色族 12 级 + 带色调的灰 12 级，亮暗各一份 */
export const ACCENT_KEYS = Object.freeze(
  ["", "-dark"].flatMap((sfx) => [
    ...OLD_KEYS.map((k) => `${k}${sfx}`),
    ...Array.from({ length: 12 }, (_, i) => `accent-${i + 1}-custom${sfx}`),
    `accent-on-custom${sfx}`,
    ...Array.from({ length: 12 }, (_, i) => `gray-${i + 1}-custom${sfx}`),
  ]),
);

/**
 * 一个主色的全部变量；墨色返回 null。prefix 用于作用域（如注入第三方页面时用 "xxd-"）。
 * 按色阶算（docs/maintainers/COLOR-SCALE-PLAN.md）：主色族 12 级 + 带一点主色的灰 12 级，亮暗各一套。
 * 老的变量也由色阶给值：标记和实心底 = 9 级，悬停 = 10 级，强调字 = 11 级（在 1–4 级上 ≥ 4.5）。
 * exact：9 级就是品牌色原样（白字不够换近黑字）；缺省压暗 / 提亮到实心底上的白字 ≥ 4.5（暗色是在暗纸上 ≥ 3）。
 */
export function accentPalette(value, prefix = "", { exact = false } = {}) {
  const hex = normalizeAccent(value);
  if (!hex) return null;
  const name = (key) => `--${prefix}${key}`;
  const out = {};
  for (const mode of ["light", "dark"]) {
    const sfx = mode === "dark" ? "-dark" : "";
    const gray = generateScale("", { mode, kind: "gray", tint: hex, pins: GRAY_PINS[mode] });
    const acc = generateScale(hex, { mode, exact, grays: gray.steps });
    const [nine, ten, eleven] = [acc.steps[8], acc.steps[9], acc.steps[10]];
    // 原样模式：实心底是品牌色原样，但标记（开关、勾、下划线、当前竖线）要看得见，用自动模式调过的 9 级（COLOR-REVIEW-PLAN D77）
    const auto = exact ? generateScale(hex, { mode, grays: gray.steps }) : acc;
    const mark = auto.steps[8];
    out[name(`action-custom${sfx}`)] = mark;
    // 标记色上的字（热力格 3 级上的数字）：原样模式下标记和实心底不是同一个颜色，字要配标记
    out[name(`on-mark-custom${sfx}`)] = auto.on;
    out[name(`action-rgb-custom${sfx}`)] = toRgb(mark).join(", ");
    out[name(`on-action-custom${sfx}`)] = acc.on;
    out[name(`action-text-custom${sfx}`)] = eleven;
    out[name(`action-fill-custom${sfx}`)] = nine;
    out[name(`action-fill-hover-custom${sfx}`)] = ten;
    acc.steps.forEach((h, i) => (out[name(`accent-${i + 1}-custom${sfx}`)] = h));
    out[name(`accent-on-custom${sfx}`)] = acc.on;
    gray.steps.forEach((h, i) => (out[name(`gray-${i + 1}-custom${sfx}`)] = h));
  }
  return out;
}

/** 写到元素上（页面里是 <html>，Shadow DOM 里是 host）。返回生效的 hex，墨色返回 ""。 */
export function applyAccent(element, value, { attr = "data-accent", prefix = "", exact = false } = {}) {
  if (!element?.style) return "";
  const vars = accentPalette(value, prefix, { exact });
  if (vars && exact) element.setAttribute(`${attr}-exact`, "");
  else element.removeAttribute(`${attr}-exact`);
  if (!vars) {
    element.removeAttribute(attr);
    ACCENT_KEYS.forEach((key) => element.style.removeProperty(`--${prefix}${key}`));
    return "";
  }
  Object.entries(vars).forEach(([key, v]) => element.style.setProperty(key, v));
  element.setAttribute(attr, "");
  return normalizeAccent(value);
}

/**
 * 自定义主色和意义色（危险、成功、警告）是不是太像（COLOR-REVIEW-PLAN D78）：实心底在 OKLab 里距离 < 0.06（亮或暗任一种）。
 * 返回像的那几种（"danger" | "success" | "warning"），不像返回 []。外观设置里用它提示「主按钮会和危险按钮分不开」。
 */
export function accentClash(value) {
  const hex = normalizeAccent(value);
  if (!hex) return [];
  const lab = (h) => { const [L, C, H] = hexToOklch(h); const r = (H * Math.PI) / 180; return [L, C * Math.cos(r), C * Math.sin(r)]; };
  const dist = (a, b) => { const [x, y] = [lab(a), lab(b)]; return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
  const out = [];
  for (const tone of ["danger", "success", "warning"]) {
    const near = ["light", "dark"].some((mode) => dist(generateScale(hex, { mode }).steps[8], SEMANTIC_PINS[tone][mode][9]) < 0.06);
    if (near) out.push(tone);
  }
  return out;
}
