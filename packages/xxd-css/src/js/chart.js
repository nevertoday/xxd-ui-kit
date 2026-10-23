// 图表（优化计划 O7）：ECharts 的小小东主题 + 统计卡的迷你折线。
// 数据可视化规则：
//   · 一条重点线用主色（没设主色就是墨色），其余是墨色的深浅 —— 颜色不是装饰，是「看这条」。
//   · 成功 / 危险色只表达含义（达标、超限），不当分类色。
//   · 网格线是发丝线（--line），坐标轴文字是 --muted，没有渐变、阴影、3D。
//   · 数字用等宽数字（tabular-nums）。
// 用法（原生 ECharts 或 Kumo 的 <Chart options>）：
//   chart.setOption(Xxd.chartOptions({ xAxis: {…}, series: [{ type: "line", data }] }));
//   Xxd.watchChartTheme(chart, () => Xxd.chartOptions(myOption))   // 切主题 / 主色时自动重画

import { getLocale } from "./i18n.js";
import { missingViz, vizLib } from "./viz-dom.js";

const read = (el, name, fallback) => {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
};

/** 当前外观下的图表颜色（从令牌读）。 */
export function chartTokens(el = document.documentElement) {
  const dark = el.closest?.("[data-theme]")?.getAttribute("data-theme") === "dark" || el.getAttribute?.("data-theme") === "dark";
  const ink = read(el, "--ink", dark ? "#f2f0ea" : "#111111");
  return {
    dark,
    ink,
    muted: read(el, "--muted", dark ? "#a29d92" : "#6b675f"),
    line: read(el, "--line", dark ? "#34312c" : "#e6e3dc"),
    paper: read(el, "--paper", dark ? "#1c1b19" : "#ffffff"),
    accent: read(el, "--action", ink),
    // 色阶里的几级（COLOR-SCALE-PLAN）：分类色从这里取，不现场混色
    gray9: read(el, "--gray-9", dark ? "#807a6e" : "#898681"),
    gray10: read(el, "--gray-10", dark ? "#918b82" : "#7e7b77"),
    gray11: read(el, "--gray-11", dark ? "#a7a194" : "#6d6b67"),
    accent8: read(el, "--accent-8", dark ? "#c2beb6" : "#353433"),
    success: read(el, "--success", "#2f7d4f"),
    danger: read(el, "--danger", "#c4372c"),
    warning: read(el, "--warning", "#b7791f"),
    font: read(el, "--font-body", "system-ui, sans-serif"),
    mono: read(el, "--font-mono", "ui-monospace, monospace"),
  };
}

/**
 * 分类色（色阶里取，MINI-REVIEW-PLAN A2）：第一条是主色 9 级，第二条灰 9 级，再是主色 8 级、灰 10 / 11 级——每一种和纸色都 ≥ 3:1（WCAG 1.4.11）；深浅交替，相邻两类分得开（CHART-REVIEW-PLAN D51）。
 * 第二条起折线换线型（虚线、点线、点划线），不只靠颜色分（WCAG 1.4.1）：两条线一深一浅、一实一虚，一眼分得开。
 */
export function chartPalette(tokens = chartTokens()) {
  return [tokens.accent, tokens.gray9, tokens.accent8, tokens.gray10, tokens.gray11];
}

const LINE_TYPES = ["solid", "dashed", "dotted", [6, 3, 1, 3], "dashed"];

// ECharts 的 canvas 不认 color-mix()：在浏览器里把它算成 rgb()
function resolveColor(value) {
  if (!/color-mix|var\(/.test(value) || typeof document === "undefined") return value;
  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  document.body.append(probe);
  const out = getComputedStyle(probe).color || value;
  probe.remove();
  return out;
}

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
function merge(base, extra) {
  if (!isObj(extra)) return extra ?? base;
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) out[k] = isObj(v) && isObj(base?.[k]) ? merge(base[k], v) : v;
  return out;
}

function axis(t, extra) {
  const style = {
    axisLine: { lineStyle: { color: t.line } },
    axisTick: { show: false },
    axisLabel: { color: t.muted, fontFamily: t.font, fontSize: 11 },
    splitLine: { lineStyle: { color: t.line, width: 1 } },
    nameTextStyle: { color: t.muted },
  };
  if (Array.isArray(extra)) return extra.map((a) => merge(style, a));
  return merge(style, extra ?? {});
}

/** 给一个 ECharts option 套上小小东主题（不改你写的值）。 */
export function chartOptions(option = {}, { el, tokens } = {}) {
  const t = tokens ?? chartTokens(el ?? document.documentElement);
  const color = chartPalette(t).map(resolveColor);
  const series = (Array.isArray(option.series) ? option.series : option.series ? [option.series] : []).map((s, i) => {
    const c = color[i % color.length];
    // 参考线（平均、目标；CHART-TYPES-PLAN 8.1）：墨色实线 1px，字是次要色；不用虚线、不画两头的箭头
    const markLine = s.markLine ? { markLine: merge({ symbol: "none", silent: true, lineStyle: { color: t.ink, width: 1, type: "solid" }, label: { color: t.muted, fontFamily: t.font, fontSize: 11 } }, s.markLine) } : {};
    let base = { color: c };
    // 面积：实色 8% 不透明，不用渐变
    if (s.type === "line") base = { symbol: "none", lineStyle: { width: i === 0 ? 2 : 1.5, type: LINE_TYPES[i % LINE_TYPES.length] }, emphasis: { focus: "series" }, color: c, ...(s.areaStyle ? { areaStyle: { color: c, opacity: 0.08 } } : {}) };
    else if (s.type === "bar") base = { barMaxWidth: 28, itemStyle: { borderRadius: 0 }, emphasis: { focus: "series" }, color: c };
    // 散点：6px 实心点
    else if (s.type === "scatter") base = { symbolSize: 6, itemStyle: { color: c, opacity: 1 }, emphasis: { focus: "series" } };
    return merge({ ...base, ...markLine }, s);
  });
  return {
    ...option,
    color,
    // 读屏：ECharts 按数据自动生成一段描述，写到图表容器的 aria-label 上（canvas 本身读屏什么都读不到）
    aria: merge({ enabled: true, label: { enabled: true } }, option.aria),
    backgroundColor: "transparent",
    textStyle: merge({ color: t.ink, fontFamily: t.font }, option.textStyle),
    grid: merge({ left: 8, right: 16, top: option.legend === undefined ? 16 : 40, bottom: 8, containLabel: true }, option.grid),
    xAxis: axis(t, option.xAxis),
    yAxis: axis(t, option.yAxis),
    legend: option.legend === undefined ? undefined : merge({ top: 0, left: 0, icon: "rect", itemWidth: 10, itemHeight: 2, textStyle: { color: t.muted, fontFamily: t.font } }, option.legend),
    tooltip: merge(
      {
        trigger: "axis",
        backgroundColor: t.paper,
        borderColor: t.line,
        borderWidth: 1,
        padding: [6, 10],
        textStyle: { color: t.ink, fontFamily: t.font, fontSize: 12 },
        axisPointer: { type: "line", lineStyle: { color: t.muted, width: 1, type: "solid" } },
        extraCssText: "border-radius: var(--r-sm); box-shadow: var(--shadow-popover); font-variant-numeric: tabular-nums;",
      },
      option.tooltip,
    ),
    series,
  };
}

/** 主题 / 主色 / 圆角变化时重新 setOption。返回解绑函数。 */
export function watchChartTheme(chart, build, { el = document.documentElement } = {}) {
  const apply = () => chart.setOption(build(), { notMerge: true });
  const mo = new MutationObserver(apply);
  mo.observe(el, { attributes: true, attributeFilter: ["data-theme", "data-accent", "style", "data-corners"] });
  return () => mo.disconnect();
}

/**
 * 统计卡的迷你折线：返回 SVG 字符串（currentColor，跟着 .xxd-stat__spark 的颜色）。
 *   el.innerHTML = Xxd.sparkline([3, 5, 4, 8, 7, 9])
 */
export function sparkline(values, { width = 120, height = 32, strokeWidth = 1.5, area = true, type = "line" } = {}) {
  const nums = values.map(Number).filter((v) => Number.isFinite(v));
  if (type === "bar") return sparkBars(nums, { width, height });
  if (nums.length < 2) return "";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pad = strokeWidth;
  const pts = nums.map((v, i) => [(i / (nums.length - 1)) * width, pad + (1 - (v - min) / span) * (height - pad * 2)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const fill = area ? `<path d="${d} L${width} ${height} L0 ${height} Z" fill="currentColor" opacity="0.08"/>` : "";
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none" aria-hidden="true">${fill}<path d="${d}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/**
 * 迷你柱（CHART-TYPES-PLAN：每天一个数、看哪天多）：从 0 起，柱和柱之间留 1 个单位的缝；没有数的那天不画。
 *   Xxd.sparkline([3, 0, 5, 8], { type: "bar" })；声明式 data-spark-type="bar"
 */
function sparkBars(nums, { width, height }) {
  if (!nums.length) return "";
  const max = Math.max(...nums, 0) || 1;
  const step = width / nums.length;
  const w = Math.max(1, step - 1);
  const bars = nums.map((v, i) => {
    const h = v > 0 ? Math.max(1, (v / max) * height) : 0;
    return h ? `<rect x="${(i * step).toFixed(1)}" y="${(height - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>` : "";
  });
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none" aria-hidden="true"><g fill="currentColor">${bars.join("")}</g></svg>`;
}

/** 声明式：<span class="xxd-stat__spark" data-spark="3,5,4,8,7,9"></span>（data-spark-type="bar" 画成柱） */
export function initSparklines(root = document) {
  for (const el of root.querySelectorAll("[data-spark]")) {
    if (el.dataset.sparkDone) continue;
    el.innerHTML = sparkline(el.dataset.spark.split(","), { type: el.dataset.sparkType === "bar" ? "bar" : "line" });
    el.dataset.sparkDone = "1";
  }
}

/* ── 量表（GAUGE-PLAN G2）：几何在 gauge.js（三种实现共用），这里只管放进页面。几何从 dist/viz.js 来（见 viz-dom.js 的 useViz） ── */
const GAUGE_ARIA = ["role", "aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-valuetext"];

/**
 * 画一个量表（或者值变了重画）。el 是 .xxd-gauge；options 见 index.d.ts 的 XxdGaugeOptions。
 *   Xxd.gauge(el, { value: 72, unit: "%", label: "已用", zones: [{ from: 90, tone: "danger" }], target: 80 })
 * 有指针时只改指针的 transform（转过去有过渡），其余部分整个换掉。
 */
export function gauge(el, options = {}) {
  const lib = vizLib();
  if (!lib) return missingViz();
  const m = lib.gaugeModel({ locale: getLocale(el), ...options });
  const turn = el.querySelector(".xxd-gauge__needle");
  const before = turn?.style.transform;
  el.innerHTML = lib.gaugeInnerHtml(m);
  el.classList.add("xxd-gauge");
  el.dataset.shape = m.shape;
  el.toggleAttribute("data-needle", Boolean(m.needle));
  for (const k of GAUGE_ARIA) el.removeAttribute(k);
  // 没有标签时保留作者自己写的 aria-label
  if (!el.dataset.gaugeOwnLabel) el.dataset.gaugeOwnLabel = el.hasAttribute("aria-label") ? "1" : "0";
  if (el.dataset.gaugeOwnLabel !== "1") el.removeAttribute("aria-label");
  for (const [k, v] of Object.entries(m.aria)) if (k !== "aria-label" || el.dataset.gaugeOwnLabel !== "1") el.setAttribute(k, String(v));
  if (m.aria.role === "meter" && !el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby")) console.warn("[xxd] 量表要有名字：传 label，或者在元素上写 aria-label", el);
  // 指针从上一次的角度转到这一次（innerHTML 换掉了元素，先放回旧角度，下一帧再转）
  const next = el.querySelector(".xxd-gauge__needle");
  if (next && before && before !== next.style.transform) {
    const target = next.style.transform;
    next.style.transform = before;
    next.getBoundingClientRect();
    next.style.transform = target;
  }
  return m;
}

const numList = (s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
/** 「图片:30;视频:20」→ [{ label, value }] */
const pairs = (s) =>
  (s ? s.split(";") : []).map((x) => {
    const at = x.lastIndexOf(":");
    return { label: x.slice(0, at).trim(), value: x.slice(at + 1).trim() };
  });

/** 元素上的 data-* → Xxd.gauge 的选项 */
export function gaugeOptionsFrom(el) {
  const d = el.dataset;
  const value = d.from != null ? [d.from, d.value] : d.value;
  const zones = numList(d.zones).map((z) => {
    // 「70-90:warning」「90:danger」「0-20:danger:电量低」
    const [span, tone, label] = z.split(":");
    const [from, to] = span.split(/(?<=\d)-/);
    return { from, to, tone, label };
  });
  return {
    value,
    min: d.min,
    max: d.max,
    shape: d.shape,
    unit: d.unit,
    label: d.label,
    decimals: d.decimals != null ? Number(d.decimals) : undefined,
    compact: d.compact == null ? undefined : d.compact !== "false",
    origin: d.origin,
    target: numList(d.target),
    zones,
    ticks: d.ticks,
    segments: d.segments,
    needle: d.needle != null && d.needle !== "false",
    parts: pairs(d.parts),
    // 「写作:3/5;阅读:40/60」：每环自己的满额
    rings: pairs(d.rings).map((r) => {
      const [value, max] = r.value.split("/");
      return { label: r.label, value, max };
    }),
  };
}

/** 声明式：<div class="xxd-gauge" data-gauge data-value="72" data-unit="%" data-label="已用"></div>；data-* 变了再调一次就重画 */
export function initGauges(root = document) {
  for (const el of root.querySelectorAll?.("[data-gauge]") ?? []) gauge(el, gaugeOptionsFrom(el));
}
