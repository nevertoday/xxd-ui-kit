// 颜色色阶（docs/maintainers/COLOR-SCALE-PLAN.md）：借鉴 Radix Colors 的逻辑——每种颜色 12 级，每一级用途固定，亮暗各一套。
// 不碰页面的纯函数：构建时生成默认的五族（暖灰、主色、成功、危险、警告），运行时按用户的主色生成。
//
// 级 → 用途：1 页面底 · 2 浅一层的底 · 3 淡底 · 4 淡底悬停 / 选中 · 5 淡底按下 · 6 安静的线 · 7 边 · 8 边悬停
//            9 实心底（灰：控件的边，≥ 3:1）· 10 实心底悬停 · 11 带颜色的字 / 次要文字（≥ 4.5:1）· 12 正文 / 强调字（≥ 7:1）
// 明度按级固定（不同颜色的同一级看起来一样深），彩度跟着级别升降；灰的明度锚在现有的令牌上（--bg、--wash、--line、--muted、--ink……）。
import { contrast, normalizeAccent, toRgb } from "./accent.js";

/* ── OKLCH ↔ sRGB ── */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const delin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** #rrggbb → [L, C, H] */
export function hexToOklch(hex) {
  const [r, g, b] = toRgb(hex).map((v) => lin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

function oklchToLinear(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

/** [L, C, H] → #rrggbb；超出 sRGB 时只收彩度（明度、色相不变） */
export function oklchToHex(L, C, H) {
  let c = C;
  let rgb = oklchToLinear(L, c, H);
  while (c > 0 && rgb.some((v) => v < -0.0001 || v > 1.0001)) {
    c = Math.max(0, c - 0.002);
    rgb = oklchToLinear(L, c, H);
  }
  return `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, delin(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, "0")).join("")}`;
}

const ratio = (a, b) => contrast(toRgb(a), toRgb(b));
const WHITE = "#ffffff";
const NEAR_BLACK = "#111111";

/* ── 每一级的明度和彩度 ── */
// 灰：锚在现有令牌上（亮：--bg #fdfcfb、--wash、--wash-strong、--line、--line-strong、--muted-2、--line-control、--muted、--ink；
// 暗：--bg #171612、--paper、--wash、--wash-strong、--selected-bg、--line 稍亮一点、--line-strong、--muted-2、--line-control、--muted、--ink）
export const GRAY_L = {
  light: [0.992, 0.982, 0.968, 0.944, 0.936, 0.929, 0.837, 0.69, 0.621, 0.585, 0.528, 0.178],
  dark: [0.196, 0.225, 0.262, 0.287, 0.312, 0.33, 0.39, 0.52, 0.6, 0.64, 0.71, 0.957],
};
// 暖灰的彩度（色相 80°）：很低，肉眼只觉得「不冷」
const GRAY_C = {
  light: [0.002, 0.003, 0.005, 0.005, 0.005, 0.005, 0.006, 0.012, 0.008, 0.008, 0.007, 0.001],
  dark: [0.007, 0.008, 0.009, 0.009, 0.01, 0.01, 0.012, 0.014, 0.016, 0.016, 0.017, 0.008],
};
const GRAY_H = 80;
// 有颜色的族：1–8 级和灰同一个明度（同一级看起来一样深），8 级给颜色多留一点；9 是这个颜色本身，11 / 12 按对比度找
const COLOR_L = {
  light: [0.992, 0.982, 0.962, 0.94, 0.918, 0.895, 0.84, 0.76],
  dark: [0.196, 0.225, 0.268, 0.298, 0.328, 0.36, 0.42, 0.52],
};
// 彩度是这个颜色本身彩度的几分之几
const COLOR_K = {
  light: [0.03, 0.06, 0.14, 0.2, 0.27, 0.35, 0.5, 0.75, 1, 1, 0.9, 0.45],
  dark: [0.1, 0.14, 0.25, 0.32, 0.38, 0.45, 0.55, 0.75, 1, 1, 0.85, 0.3],
};
// 灰带一点主色（C3）：每一级灰在 OKLCH 里转到主色的色相，彩度取主色彩度的这么多（不超过 0.03）
const TINT_K = [0.03, 0.04, 0.06, 0.07, 0.08, 0.09, 0.1, 0.08, 0.06, 0.06, 0.05, 0.02];

/** 从某个明度开始一点点挪，直到和 against 的对比度够了 */
function seek(L, C, H, against, min, dir) {
  let l = L;
  let hex = oklchToHex(l, C, H);
  for (let i = 0; i < 120 && against.some((x) => ratio(hex, x) < min); i += 1) {
    l += dir * 0.005;
    hex = oklchToHex(l, C, H);
  }
  return hex;
}

/** 实心底上的字：白字够 4.5 用白字，不然用近黑字 */
const onSolid = (hex) => (ratio(hex, WHITE) >= 4.5 ? WHITE : NEAR_BLACK);

/**
 * 一个颜色的 12 级。返回 { steps: [12 个 #hex], on: 9 / 10 级上的字 }。
 *   color：#rrggbb（灰族忽略，用 tint 带主色）
 *   mode：light | dark
 *   kind：color（主色、语义色）| gray（暖灰）
 *   exact：9 级就是原色（品牌色原样）；缺省压暗 / 提亮到实心底上的白字 ≥ 4.5
 *   tint：灰族要带的主色（#rrggbb）
 */
export function generateScale(color, { mode = "light", kind = "color", exact = false, tint = "" } = {}) {
  const dark = mode === "dark";
  if (kind === "gray") {
    const t = normalizeAccent(tint);
    const [, tc, th] = t ? hexToOklch(t) : [0, 0, GRAY_H];
    // 带主色：在暖灰的色度上「加」一点主色的方向（OKLab 里向量相加），不是把色相整个换掉——暖黑还是暖黑，只是同调
    const steps = GRAY_L[mode].map((L, i) => {
      const rad = (d) => (d * Math.PI) / 180;
      let a = GRAY_C[mode][i] * Math.cos(rad(GRAY_H));
      let b = GRAY_C[mode][i] * Math.sin(rad(GRAY_H));
      if (t) {
        const k = Math.min(0.02, tc * TINT_K[i]);
        a += k * Math.cos(rad(th));
        b += k * Math.sin(rad(th));
      }
      return oklchToHex(L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360);
    });
    return { steps, on: dark ? NEAR_BLACK : WHITE };
  }
  const hex = normalizeAccent(color);
  if (!hex) throw new Error(`generateScale：不认识的颜色 ${color}`);
  const [L0, C0, H] = hexToOklch(hex);
  const steps = COLOR_L[mode].map((L, i) => oklchToHex(L, C0 * COLOR_K[mode][i], H));
  // 9：实心底
  let nine = hex;
  if (!exact) {
    if (!dark && ratio(nine, WHITE) < 4.5) nine = seek(L0, C0, H, [WHITE], 4.5, -1);
    // 暗色：实心底在暗纸上至少 3:1（看得见），字另配
    if (dark && ratio(nine, steps[1]) < 3) nine = seek(L0, C0, H, [steps[1]], 3, +1);
  }
  const on = onSolid(nine);
  const [L9] = hexToOklch(nine);
  // 10：悬停，往「离字更远」的方向挪一点（白字时变深，近黑字时变浅），保证字仍然 ≥ 4.5
  let ten = oklchToHex(L9 + (on === WHITE ? -0.04 : 0.04), C0, H);
  if (ratio(ten, on) < 4.5) ten = seek(L9, C0, H, [on], 4.5, on === WHITE ? -1 : 1);
  // 11：带颜色的字，在 1–3 级上 ≥ 4.5；12：强调字 ≥ 7
  const bg = steps.slice(0, 3);
  const eleven = seek(dark ? 0.7 : 0.56, C0 * COLOR_K[mode][10], H, bg, 4.5, dark ? 1 : -1);
  const twelve = seek(dark ? 0.9 : 0.33, C0 * COLOR_K[mode][11], H, bg, 7, dark ? 1 : -1);
  return { steps: [...steps, nine, ten, eleven, twelve], on };
}

/** 角色名（第 n 级的用途名）；数字令牌是 --<族>-1 … --<族>-12 */
export const SCALE_ROLES = ["bg-page", "bg", "tint", "tint-hover", "tint-active", "line", "border", "border-hover", "solid", "solid-hover", "text", "text-strong"];

/** 默认的语义色（成功、危险、警告）：亮色取现在的 *-strong（实心底），暗色同一个颜色重新生成 */
export const SEMANTIC_BASE = { success: "#15803d", danger: "#b42318", warning: "#b45309" };

/** 五族 × 亮暗。返回 { light: { gray, accent, success, danger, warning }, dark: {…} }，每族 { steps, on } */
export function generateFamilies({ accent = "", accentMode = "auto" } = {}) {
  const exact = accentMode === "exact";
  const a = normalizeAccent(accent);
  const out = {};
  for (const mode of ["light", "dark"]) {
    out[mode] = {
      gray: generateScale("", { mode, kind: "gray", tint: a }),
      // 墨色（没有主色）时，主色族就是灰族（强调靠墨色）
      accent: a ? generateScale(a, { mode, exact }) : generateScale("", { mode, kind: "gray" }),
      success: generateScale(SEMANTIC_BASE.success, { mode }),
      danger: generateScale(SEMANTIC_BASE.danger, { mode }),
      warning: generateScale(SEMANTIC_BASE.warning, { mode }),
    };
  }
  return out;
}

/** 对比度门禁：一族的 12 级里，哪些用途的对比度不够。返回 [说明] */
export function checkScale({ steps, on }, { kind = "color" } = {}) {
  const bad = [];
  const at = (i) => steps[i - 1];
  for (const b of [1, 2, 3]) {
    if (ratio(at(11), at(b)) < 4.5) bad.push(`11 级在 ${b} 级上 ${ratio(at(11), at(b)).toFixed(2)} < 4.5`);
    if (ratio(at(12), at(b)) < 7) bad.push(`12 级在 ${b} 级上 ${ratio(at(12), at(b)).toFixed(2)} < 7`);
  }
  for (const b of [1, 2]) if (ratio(at(9), at(b)) < 3) bad.push(`9 级在 ${b} 级上 ${ratio(at(9), at(b)).toFixed(2)} < 3`);
  if (kind === "color") {
    if (ratio(at(9), on) < 4.5) bad.push(`9 级上的字 ${ratio(at(9), on).toFixed(2)} < 4.5`);
    if (ratio(at(10), on) < 4.5) bad.push(`10 级上的字 ${ratio(at(10), on).toFixed(2)} < 4.5`);
  }
  return bad;
}
