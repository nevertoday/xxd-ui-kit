// 图表（优化计划 O7）：ECharts 的小小东主题 + 统计卡的迷你折线。
// 数据可视化规则：
//   · 一条重点线用主色（没设主色就是墨色），其余是墨色的深浅 —— 颜色不是装饰，是「看这条」。
//   · 成功 / 危险色只表达含义（达标、超限），不当分类色。
//   · 网格线是发丝线（--line），坐标轴文字是 --muted，没有渐变、阴影、3D。
//   · 数字用等宽数字（tabular-nums）。
// 用法（原生 ECharts 或 Kumo 的 <Chart options>）：
//   chart.setOption(Xxd.chartOptions({ xAxis: {…}, series: [{ type: "line", data }] }));
//   Xxd.watchChartTheme(chart, () => Xxd.chartOptions(myOption))   // 切主题 / 主色时自动重画

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
 * 分类色（色阶里取，MINI-REVIEW-PLAN A2）：第一条是主色 9 级，第二条灰 9 级，再是灰 11 / 10 级、主色 8 级——每一种和纸色都 ≥ 3:1（WCAG 1.4.11）。
 * 第二条起折线换线型（虚线、点线、点划线），不只靠颜色分（WCAG 1.4.1）：两条线一深一浅、一实一虚，一眼分得开。
 */
export function chartPalette(tokens = chartTokens()) {
  return [tokens.accent, tokens.gray9, tokens.gray11, tokens.gray10, tokens.accent8];
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
    if (s.type === "line") return merge({ symbol: "none", lineStyle: { width: i === 0 ? 2 : 1.5, type: LINE_TYPES[i % LINE_TYPES.length] }, emphasis: { focus: "series" }, color: c }, s);
    if (s.type === "bar") return merge({ barMaxWidth: 28, itemStyle: { borderRadius: 0 }, emphasis: { focus: "series" }, color: c }, s);
    return merge({ color: c }, s);
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
export function sparkline(values, { width = 120, height = 32, strokeWidth = 1.5, area = true } = {}) {
  const nums = values.map(Number).filter((v) => Number.isFinite(v));
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

/** 声明式：<span class="xxd-stat__spark" data-spark="3,5,4,8,7,9"></span> */
export function initSparklines(root = document) {
  for (const el of root.querySelectorAll("[data-spark]")) {
    if (el.dataset.sparkDone) continue;
    el.innerHTML = sparkline(el.dataset.spark.split(","));
    el.dataset.sparkDone = "1";
  }
}
