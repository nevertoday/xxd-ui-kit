// 量表的几何和 SVG（GAUGE-PLAN G1）：纯函数，没有 DOM。网页（Xxd.gauge）、React（<Gauge>）、小程序（<Gauge>）都用这一份，
// 三边画出来一样。元素类型参考了 gauge-ui（MIT），画法按 DESIGN-PRINCIPLES 裁过：
//   · 三种形状：arc（270°，缺口朝下）、half（180°）、ring（整圈）。
//   · 轨道 --wash-strong，填充 --action；区段只表意义（warning / danger / success），数值进了哪一段填充就换成那一段的实心色。
//   · 分格、分段、多环的缝永远是平头；轨道和填充的两头跟圆角模式（--stroke-cap）。
//   · 刻度、目标线、指针是像素线（vector-effect），表盘放大缩小线宽不变。
//   · 字（数字、单位、两端的刻度数）不画进 SVG：交给 HTML，用系统字体、能复制、能读屏。
// 角度：0° 是 12 点钟方向，顺时针为正。坐标：圆心在原点，参考半径 R。

export const GAUGE_R = 50;
/** 轨道和填充的线宽（直径的 1/20 左右） */
export const GAUGE_W = 5;
/** 圆心到 viewBox 边的距离：线宽的一半 + 区段那道细线 + 目标线伸出去的一截 */
const E = 57;
/** 分格、分段之间的缝（SVG 单位） */
const CUT = 1.5;
const SHAPES = {
  arc: { start: -135, end: 135, box: [-E, -E, 2 * E, 100] },
  half: { start: -90, end: 90, box: [-E, -E, 2 * E, 61] },
  ring: { start: 0, end: 360, box: [-E, -E, 2 * E, 2 * E] },
};
export const GAUGE_SHAPES = Object.keys(SHAPES);
export const GAUGE_MAX_RINGS = 3;

/**
 * 每种画的东西用哪个令牌（网页版 CSS 里 .xxd-gauge__<角色> 照这张表写，测试会对；小程序按这张表从当前外观取颜色）。
 * 分段 / 多环的颜色和图表的分类色同一组（chartPalette）。
 */
export const GAUGE_PAINT = {
  track: "--wash-strong",
  fill: "--action",
  "fill-warning": "--warning-solid",
  "fill-danger": "--danger-solid",
  "fill-success": "--success-solid",
  "part-0": "--action",
  "part-1": "--gray-9",
  "part-2": "--gray-11",
  "part-3": "--gray-10",
  "part-4": "--accent-8",
  "zone-warning": "--warning-border-strong",
  "zone-danger": "--danger-border-strong",
  "zone-success": "--success-border-strong",
  target: "--ink",
  tick: "--muted-2",
  needle: "--ink",
};
const TONES = new Set(["warning", "danger", "success"]);

const LABELS = {
  "zh-CN": { warning: "注意", danger: "超限", success: "达标", target: "目标 {v}", range: "{from}–{to}", of: "{v} / {max}", sep: "，" },
  "zh-TW": { warning: "注意", danger: "超限", success: "達標", target: "目標 {v}", range: "{from}–{to}", of: "{v} / {max}", sep: "，" },
  en: { warning: "Warning", danger: "Over limit", success: "On target", target: "target {v}", range: "{from}–{to}", of: "{v} of {max}", sep: ", " },
};
const labelsFor = (locale = "zh-CN") => LABELS[locale] ?? (/^zh-(TW|HK|Hant)/i.test(locale) ? LABELS["zh-TW"] : /^zh/i.test(locale) ? LABELS["zh-CN"] : LABELS.en);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const round = (n) => Math.round(n * 1000) / 1000 || 0;
const num = (n) => String(round(n));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const finite = (v, fallback) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : fallback);

/** 圆上一点（角度 0 在 12 点钟，顺时针） */
export function polar(r, a) {
  const t = (a * Math.PI) / 180;
  return { x: round(r * Math.sin(t)), y: round(-r * Math.cos(t)) };
}

/** 从 a0 到 a1 的弧线 path；超过 180° 分段画（一整圈也画得出来） */
export function arcPath(r, a0, a1) {
  const sweep = Math.min(a1 - a0, 360);
  if (!(sweep > 0) || r <= 0) return "";
  const pieces = Math.ceil(sweep / 180);
  const step = sweep / pieces;
  const p0 = polar(r, a0);
  let d = `M${num(p0.x)} ${num(p0.y)}`;
  for (let i = 1; i <= pieces; i += 1) {
    const p = polar(r, a0 + step * i);
    d += `A${num(r)} ${num(r)} 0 0 1 ${num(p.x)} ${num(p.y)}`;
  }
  return d;
}

/** 值在 [min, max] 里的比例（0–1）；min 等于 max 时是 0 */
export function ratio(v, min, max) {
  const span = max - min;
  return span ? clamp((v - min) / span, 0, 1) : 0;
}

/** 数字格式：缺省最多一位小数，按语言加千分位；compact 时缩写（「1.2万」「12K」） */
export function gaugeFormat({ locale = "zh-CN", decimals, compact = false } = {}) {
  let nf;
  try {
    nf = new Intl.NumberFormat(locale, compact ? { notation: "compact", maximumFractionDigits: decimals ?? 1 } : { maximumFractionDigits: decimals ?? 1, minimumFractionDigits: decimals ?? 0 });
  } catch {
    nf = { format: (n) => String(round(n)) };
  }
  return (n) => nf.format(n);
}

/** 数字和单位：% ° 这类符号紧挨着，其余（GB、篇、分钟）隔一个空格 */
export const withUnit = (text, unit) => (unit ? `${text}${/^[%°‰′″]/.test(unit) ? "" : " "}${unit}` : text);

/** 选项整理成确定的值（不合法的值退回缺省，不抛错：数据界面上一个坏数据不该让整页挂掉） */
export function normalizeGauge(o = {}) {
  const shape = SHAPES[o.shape] ? o.shape : "arc";
  let min = finite(o.min, 0);
  let max = finite(o.max, 100);
  if (max < min) [min, max] = [max, min];
  const isRange = Array.isArray(o.value);
  const pair = isRange ? o.value.map((v) => clamp(finite(v, min), min, max)).sort((a, b) => a - b) : null;
  const value = isRange ? pair[1] : clamp(finite(o.value, min), min, max);
  const raw = isRange ? null : finite(o.value, min);
  // origin：填充从这个值往两边长（偏差、盈亏）；缺省从最小值长
  const origin = !isRange && o.origin != null && o.origin !== "" && Number.isFinite(Number(o.origin)) ? clamp(Number(o.origin), min, max) : null;
  const from = isRange ? pair[0] : origin ?? min;
  const zones = (o.zones ?? [])
    .filter((z) => z && TONES.has(z.tone))
    .map((z) => ({ tone: z.tone, label: z.label, from: clamp(finite(z.from, min), min, max), to: clamp(finite(z.to, max), min, max) }))
    .filter((z) => z.to > z.from)
    .sort((a, b) => a.from - b.from);
  const targets = (Array.isArray(o.target) ? o.target : o.target == null || o.target === "" ? [] : [o.target]).map((t) => finite(t, NaN)).filter(Number.isFinite).map((t) => clamp(t, min, max));
  const parts = (o.parts ?? []).filter(Boolean).map((p) => ({ label: p.label ?? "", value: Math.max(0, finite(p.value, 0)) }));
  const rings = (o.rings ?? [])
    .filter(Boolean)
    .slice(0, GAUGE_MAX_RINGS)
    .map((r) => {
      const rmin = finite(r.min, min);
      const rmax = Math.max(rmin, finite(r.max, max));
      return { label: r.label ?? "", min: rmin, max: rmax, value: clamp(finite(r.value, rmin), rmin, rmax), unit: r.unit ?? o.unit ?? "" };
    });
  const segments = Math.max(0, Math.min(60, Math.round(finite(o.segments, 0))));
  const ticks = Math.max(0, Math.min(60, Math.round(finite(o.ticks, 0))));
  // 指针只给 arc / half；有分格、分段、多环时不画指针
  const needle = Boolean(o.needle) && shape !== "ring" && !segments && !parts.length && !rings.length;
  return { shape, min, max, value, raw, from, origin, isRange, zones, targets, parts, rings, segments, ticks, needle, unit: o.unit ?? "", label: o.label ?? "", locale: o.locale ?? "zh-CN", decimals: o.decimals, compact: o.compact, format: o.format, ends: o.ends ?? (shape !== "ring" && !rings.length) };
}

/** 数值落在哪个区段：两头都算在内，落在两段交界上算后一段（区段按起点排好） */
export function zoneOf(zones, v) {
  let hit = null;
  for (const z of zones) if (v >= z.from && v <= z.to) hit = z;
  return hit;
}

/**
 * 量表的完整模型：SVG（不含字）+ 中间的字 + 两端的刻度数 + 图例 + 读屏属性。
 * options.colors：传了就把颜色写成属性（小程序画成图片用，值是 role → 颜色），不传就写类名（网页版用 CSS 从令牌取色）。
 * options.cap：小程序里轨道和填充的线头（网页版由 CSS 的 --stroke-cap 决定）。
 */
export function gaugeModel(options = {}) {
  const g = normalizeGauge(options);
  const L = labelsFor(g.locale);
  const fmt = typeof g.format === "function" ? g.format : gaugeFormat({ locale: g.locale, decimals: g.decimals, compact: g.compact });
  const { start, end, box } = SHAPES[g.shape];
  const sweep = end - start;
  const ring = g.shape === "ring";
  const angleOf = (v, lo = g.min, hi = g.max) => start + ratio(v, lo, hi) * sweep;
  const colors = options.colors;
  const cap = options.cap ?? "butt";
  const paint = (role, kind = "stroke") => (colors ? `${kind}="${colors[role] ?? colors[role.replace(/-.*/, "")] ?? "currentColor"}"` : `class="xxd-gauge__${role}"`);
  const capAttr = colors ? ` stroke-linecap="${cap}"` : "";
  const cutDeg = (r) => ((CUT / r) * 180) / Math.PI;
  const out = [];
  const arc = (r, a0, a1, role, { width = GAUGE_W, cut = false } = {}) => {
    const d = arcPath(r, a0, a1);
    if (d) out.push(`<path d="${d}" fill="none" ${paint(role)} stroke-width="${width}"${cut ? ' stroke-linecap="butt"' : capAttr}/>`);
  };
  const hairline = (a, r0, r1, role, width) => {
    const p0 = polar(r0, a);
    const p1 = polar(r1, a);
    out.push(`<line x1="${num(p0.x)}" y1="${num(p0.y)}" x2="${num(p1.x)}" y2="${num(p1.y)}" ${paint(role)} stroke-width="${width}" stroke-linecap="butt" vector-effect="non-scaling-stroke"/>`);
  };
  /** 一段整圈 / 整个弧均分成 n 格，第 i 格的起止角度 */
  const cell = (n, i, r) => {
    const gap = cutDeg(r);
    const len = ring ? (360 - n * gap) / n : (sweep - (n - 1) * gap) / n;
    const a0 = start + (ring ? gap / 2 : 0) + i * (len + gap);
    return [a0, a0 + len];
  };

  // 区段：轨道外侧一道细线（只表意义）
  const zoneR = GAUGE_R + GAUGE_W / 2 + 2.5;
  if (!g.rings.length) for (const z of g.zones) arc(zoneR, angleOf(z.from), angleOf(z.to), `zone-${z.tone}`, { width: 2, cut: true });

  const zone = g.isRange || g.parts.length || g.rings.length ? null : zoneOf(g.zones, g.value);
  const fillRole = zone ? `fill-${zone.tone}` : "fill";
  const legend = [];

  if (g.rings.length) {
    // 同心多环：外面是第一环，每环一样粗，环之间留一个线宽
    g.rings.forEach((rg, i) => {
      const r = GAUGE_R - i * GAUGE_W * 2;
      arc(r, start, end, "track");
      if (rg.value > rg.min) arc(r, start, start + ratio(rg.value, rg.min, rg.max) * sweep, `part-${i}`);
      legend.push({ label: rg.label, text: fill(L.of, { v: withUnit(fmt(rg.value), ""), max: withUnit(fmt(rg.max), rg.unit) }), part: i });
    });
  } else if (g.segments) {
    // 分格：整格才亮
    const n = g.segments;
    const t0 = g.isRange ? ratio(g.from, g.min, g.max) : 0;
    const t1 = ratio(g.value, g.min, g.max);
    for (let i = 0; i < n; i += 1) {
      const [a0, a1] = cell(n, i, GAUGE_R);
      const lit = i / n >= t0 - 1e-9 && (i + 1) / n <= t1 + 1e-9;
      arc(GAUGE_R, a0, a1, lit ? fillRole : "track", { cut: true });
    }
  } else if (g.parts.length) {
    // 分段：首尾相接，超过满额的部分截掉；段和段之间留缝
    arc(GAUGE_R, start, end, "track");
    let at = g.min;
    const gap = cutDeg(GAUGE_R);
    g.parts.forEach((p, i) => {
      const lo = at;
      const hi = Math.min(g.max, at + p.value);
      at = hi;
      legend.push({ label: p.label, text: withUnit(fmt(p.value), g.unit), part: i % 5 });
      if (hi <= lo) return;
      const a0 = angleOf(lo) + (lo > g.min ? gap / 2 : 0);
      const a1 = angleOf(hi) - (hi < g.max && i < g.parts.length - 1 ? gap / 2 : 0);
      if (a1 > a0) arc(GAUGE_R, a0, a1, `part-${i % 5}`, { cut: true });
    });
  } else {
    arc(GAUGE_R, start, end, "track");
    // 有指针时只画轨道和区段，数值由指针指
    if (!g.needle && g.value !== g.from) arc(GAUGE_R, angleOf(Math.min(g.from, g.value)), angleOf(Math.max(g.from, g.value)), fillRole);
  }

  // 刻度：轨道内侧的发丝线
  if (g.ticks && !g.rings.length) {
    const r0 = GAUGE_R - GAUGE_W / 2 - 1.5;
    const count = ring ? g.ticks : g.ticks + 1;
    for (let i = 0; i < count; i += 1) hairline(start + (sweep * i) / g.ticks, r0, r0 - 3, "tick", 1);
  }
  // 原点：从这里往两边长时，画一道横穿轨道的次要色刻度
  if (g.origin != null && !g.rings.length) hairline(angleOf(g.origin), GAUGE_R - GAUGE_W / 2 - 1.5, GAUGE_R + GAUGE_W / 2 + 1.5, "tick", 1);
  // 目标线：横穿轨道的墨色短线
  if (!g.rings.length) for (const t of g.targets) hairline(angleOf(t), GAUGE_R - GAUGE_W / 2 - 1.5, GAUGE_R + GAUGE_W / 2 + 1.5, "target", 1.5);

  const needle = g.needle ? { angle: round(angleOf(g.value)), length: GAUGE_R - GAUGE_W / 2 - 2 } : null;
  if (needle && colors) out.push(needleSvg(needle, { colors, inline: true }));

  // 中间的字、读屏
  const total = g.parts.reduce((s, p) => s + p.value, 0);
  const shown = g.isRange ? fill(L.range, { from: fmt(g.from), to: fmt(g.value) }) : g.parts.length ? fmt(total) : fmt(g.raw ?? g.value);
  const state = zone ? { tone: zone.tone, text: zone.label || L[zone.tone] } : null;
  const spoken = [withUnit(shown, g.unit)];
  if (g.parts.length) spoken[0] = fill(L.of, { v: fmt(total), max: withUnit(fmt(g.max), g.unit) });
  if (state) spoken.push(state.text);
  for (const t of g.targets) spoken.push(fill(L.target, { v: withUnit(fmt(t), g.unit) }));
  const valueText = g.rings.length ? legend.map((l) => `${l.label} ${l.text}`).join(L.sep) : spoken.join(L.sep);
  const single = !g.isRange && !g.parts.length && !g.rings.length;
  // 名字：一个数时是标签（读屏先念名字再念 valuetext）；区间、分段是标签加整句；多环只要标签（图例是文字，会接着念）
  const name = single || g.rings.length ? g.label : `${g.label ? `${g.label}${L.sep}` : ""}${valueText}`;
  const aria = single
    ? { role: "meter", "aria-valuemin": g.min, "aria-valuemax": g.max, "aria-valuenow": round(g.value), "aria-valuetext": valueText }
    : { role: "group" };
  if (name) aria["aria-label"] = name;
  const [bx, by, bw, bh] = box;
  const endsAt = g.shape === "half" ? polar(GAUGE_R, 90) : polar(GAUGE_R, 135);
  return {
    shape: g.shape,
    viewBox: box.join(" "),
    /** 圆心在表盘里的位置（百分比），中间的字以它为准 */
    center: { x: round(((0 - bx) / bw) * 100), y: round(((0 - by) / bh) * 100) },
    /** 两端刻度数的水平位置（左端，百分比；右端对称） */
    ends: g.ends ? { x: round(((-endsAt.x - bx) / bw) * 100), min: withUnit(fmt(g.min), ""), max: withUnit(fmt(g.max), "") } : null,
    svg: `<svg class="xxd-gauge__svg" viewBox="${box.join(" ")}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${out.join("")}</svg>`,
    /** svg 里面的内容（React 自己写外面那层 <svg>） */
    svgBody: out.join(""),
    needle,
    display: g.rings.length ? null : { value: shown, unit: g.unit, label: g.label, state },
    legend,
    aria,
    valueText,
    label: g.label,
  };
}

/**
 * 指针单独一层（网页版）：值变了只改 transform，转过去有过渡；SVG 主体换掉也不影响它。
 * 里面那个看不见的圆让指针这一组的包围盒以圆心为中心（transform-box: fill-box 的转轴就在圆心）。
 */
export function needleSvg(needle, { viewBox, colors, inline } = {}) {
  const stroke = colors ? `stroke="${colors.needle}"` : 'class="xxd-gauge__needle-line"';
  const hub = colors ? `fill="${colors.needle}"` : 'class="xxd-gauge__hub"';
  const turn = inline ? `transform="rotate(${needle.angle})"` : `class="xxd-gauge__needle" style="transform:rotate(${needle.angle}deg)"`;
  const g = `<g ${turn}><circle r="${needle.length}" fill="none" stroke="none"/><line x1="0" y1="0" x2="0" y2="${-needle.length}" ${stroke} stroke-width="1.5" stroke-linecap="butt" vector-effect="non-scaling-stroke"/><circle r="2.5" ${hub}/></g>`;
  return inline ? g : `<svg class="xxd-gauge__pointer" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${g}</svg>`;
}

/** 小程序：GAUGE_PAINT 的令牌名 → 当前外观的颜色 */
export function gaugeColors(vars) {
  return Object.fromEntries(Object.entries(GAUGE_PAINT).map(([role, token]) => [role, vars[token]]));
}
