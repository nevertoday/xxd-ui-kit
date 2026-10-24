// 图表（优化计划 O7）：ECharts 的小小东主题 + 统计卡的迷你折线。
// 数据可视化规则：
//   · 一条重点线用主色（没设主色就是墨色），其余是墨色的深浅 —— 颜色不是装饰，是「看这条」。
//   · 成功 / 危险色只表达含义（达标、超限），不当分类色。
//   · 网格线是发丝线（--line），坐标轴文字是 --muted，没有渐变、阴影、3D。
//   · 数字用等宽数字（tabular-nums）。
// 用法（原生 ECharts 或 Kumo 的 <Chart options>）：
//   chart.setOption(Xxd.chartOptions({ xAxis: {…}, series: [{ type: "line", data }] }));
//   Xxd.watchChartTheme(chart, () => Xxd.chartOptions(myOption))   // 切主题 / 主色时自动重画

import { tightFormat, gaugeFormat } from "./gauge.js";
import { getLocale, t as say } from "./i18n.js";
import { largestRemainder } from "./viz.js";
import { missingViz, vizLib } from "./viz-dom.js";

const read = (el, name, fallback) => {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
};
const media = (q) => typeof matchMedia === "function" && matchMedia(q).matches;
const FORCED = "(forced-colors: active)";
const STILL = "(prefers-reduced-motion: reduce)";

// 高对比模式（ECHARTS-REVIEW-PLAN D124）：canvas 不会被系统换色，自己换成系统色
function systemColor(name) {
  const probe = document.createElement("span");
  probe.style.cssText = `color:${name};forced-color-adjust:none;display:none`;
  document.body.append(probe);
  const out = getComputedStyle(probe).color;
  probe.remove();
  return out;
}

/** 当前外观下的图表颜色（从令牌读；高对比模式下是系统色）。 */
export function chartTokens(el = document.documentElement) {
  const dark = el.closest?.("[data-theme]")?.getAttribute("data-theme") === "dark" || el.getAttribute?.("data-theme") === "dark";
  const ink = read(el, "--ink", dark ? "#f2f0ea" : "#111111");
  const t = {
    dark,
    forced: false,
    ink,
    muted: read(el, "--muted", dark ? "#a29d92" : "#6b675f"),
    muted2: read(el, "--muted-2", dark ? "#837d72" : "#9a968d"),
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
  if (typeof document !== "undefined" && document.body && media(FORCED)) {
    const text = systemColor("CanvasText");
    const gray = systemColor("GrayText");
    Object.assign(t, { forced: true, ink: text, muted: text, muted2: gray, line: gray, paper: systemColor("Canvas"), accent: text, gray9: text, gray10: text, gray11: text, accent8: text, success: text, danger: text, warning: text });
  }
  return t;
}

/**
 * 分类色（色阶里取，MINI-REVIEW-PLAN A2）：第一条是主色 9 级，第二条灰 9 级，再是主色 8 级、灰 10 / 11 级——每一种和纸色都 ≥ 3:1（WCAG 1.4.11）；深浅交替，相邻两类分得开（CHART-REVIEW-PLAN D51）。
 * 第二条起折线换线型（虚线、点线、点划线），不只靠颜色分（WCAG 1.4.1）：两条线一深一浅、一实一虚，一眼分得开。
 */
export function chartPalette(tokens = chartTokens()) {
  return [tokens.accent, tokens.gray9, tokens.accent8, tokens.gray10, tokens.gray11];
}

const LINE_TYPES = ["solid", "dashed", "dotted", [6, 3, 1, 3], "dashed"];
// 一个系列一个颜色、画在直角坐标系里的图；别的（饼、漏斗、旭日、矩形树图、桑基……）按数据上色（D123）
const BY_SERIES = new Set(["line", "bar", "scatter", "effectScatter", "pictorialBar"]);
const CARTESIAN = new Set([...BY_SERIES, "candlestick", "boxplot", "heatmap"]);
const onGrid = (s) => CARTESIAN.has(s.type) && (!s.coordinateSystem || s.coordinateSystem === "cartesian2d");

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
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const finite = (v) => v !== null && v !== "" && v !== undefined && Number.isFinite(Number(v));
// 一个数据点的数：42、"42"、{ value: 42 }、[x, 42]
const valueOf = (d) => {
  const v = isObj(d) ? d.value : d;
  return Array.isArray(v) ? v.at(-1) : v;
};
const labelOf = (d) => String(isObj(d) ? d.value ?? "" : d ?? "");

// 量文字宽（图例让行、类目折行用）；没有 canvas 时按每个字 12px 算
let pen;
function textWidth(s, font) {
  pen ??= typeof document !== "undefined" ? document.createElement("canvas").getContext?.("2d") : null;
  if (!pen) return String(s).length * 12;
  pen.font = `12px ${font}`;
  return pen.measureText(String(s)).width;
}

// 图例有几行（D127）：按图的宽度一行一行排，和 ECharts 的排法一样（图标 + 5px + 字，项和项隔 10px）
function legendRows(names, iconW, width, font) {
  let rows = 1;
  let x = 0;
  for (const n of names) {
    const w = iconW + 5 + textWidth(n, font);
    if (x && x + w > width) {
      rows += 1;
      x = 0;
    }
    x += w + 10;
  }
  return rows;
}

let warnedMany = false;
// watchChartTheme 重画时把图的 DOM 交给 chartOptions（作者不传 el 也能读局部主题、量宽度）
let building = null;

/** 给一个 ECharts option 套上小小东主题（不改你写的值）。 */
export function chartOptions(option = {}, { el, tokens } = {}) {
  const host = el ?? building ?? (typeof document !== "undefined" ? document.documentElement : null);
  const t = tokens ?? chartTokens(host);
  const locale = getLocale(host);
  const width = el || building ? host.clientWidth || 360 : 360;
  const color = chartPalette(t).map(resolveColor);
  const raw = list(option.series);
  const grid = Boolean(option.xAxis || option.yAxis) || raw.some(onGrid);
  const horizontal = list(option.yAxis)[0]?.type === "category";
  const full = gaugeFormat({ locale });
  const label = { color: t.muted, fontFamily: t.font, fontSize: 12 };
  const series = raw.map((s, i) => {
    const c = color[i % color.length];
    // 参考线（平均、目标；CHART-TYPES-PLAN 8.1）：墨色实线 1px；字在线的上方、图区里面的右端，不会被裁（D129）
    const markLine = s.markLine
      ? { markLine: merge({ symbol: "none", silent: true, lineStyle: { color: t.ink, width: 1, type: "solid" }, label: { ...label, position: "insideEndTop", formatter: (p) => [p.name, finite(p.value) ? full(Number(p.value)) : ""].filter(Boolean).join(" ") } }, s.markLine) }
      : {};
    // 第 6 条起是背景线（D131）
    if (i >= 5 && BY_SERIES.has(s.type)) {
      if (!warnedMany) console.warn("[xxd] 图表超过 5 条：第 6 条起画成背景线。拆成几张图，或者只高亮一条");
      warnedMany = true;
      return merge({ color: t.muted2, z: 1, emphasis: { disabled: true }, ...(s.type === "line" ? { symbol: "none", lineStyle: { width: 1, type: "solid" } } : {}), ...markLine }, s);
    }
    let base = {};
    // 面积：实色 8% 不透明，不用渐变
    if (s.type === "line") base = { symbol: "none", lineStyle: { width: i === 0 ? 2 : 1.5, type: LINE_TYPES[i % LINE_TYPES.length] }, emphasis: { focus: "series" }, color: c, ...(s.areaStyle ? { areaStyle: { color: c, opacity: 0.08 } } : {}) };
    else if (s.type === "bar") base = { barMaxWidth: 28, itemStyle: { borderRadius: 0 }, emphasis: { focus: "series" }, color: c };
    // 散点：6px 实心点
    else if (s.type === "scatter") base = { symbolSize: 6, itemStyle: { color: c, opacity: 1 }, emphasis: { focus: "series" } };
    else if (BY_SERIES.has(s.type)) base = { color: c };
    // 饼：每块之间 1px 纸色的缝；字是墨色
    else if (s.type === "pie") base = { itemStyle: { borderColor: t.paper, borderWidth: 1 }, label: { color: t.ink, fontFamily: t.font, fontSize: 12, overflow: "break" } };
    return merge({ ...base, ...markLine }, s);
  });
  const lines = series.some((s) => s.type === "line");
  const iconW = lines ? 24 : 10;
  const legendNames = raw.flatMap((s) => (BY_SERIES.has(s.type) ? [s.name ?? ""] : list(s.data).map((d) => d?.name ?? "")));
  const rows = option.legend === undefined ? 0 : legendRows(legendNames, iconW, width - 8, t.font);
  return {
    ...option,
    color,
    // 不放进场动画（设计原则 §14，D130）：作者要动画可以写 animation: true；减少动效时一律不放
    animation: media(STILL) ? false : (option.animation ?? false),
    // 读屏：一句话描述（D126）写到图表容器的 aria-label 上；高对比时柱子和饼加花纹（D124）
    aria: merge({ enabled: true, label: { enabled: true, description: describe(option, raw, horizontal, locale, host) }, decal: { show: t.forced } }, option.aria),
    backgroundColor: "transparent",
    textStyle: merge({ color: t.ink, fontFamily: t.font }, option.textStyle),
    ...(grid
      ? {
          // 图例换行时图区往下让（D127）
          grid: merge({ left: 8, right: 16, top: rows ? rows * 14 + (rows - 1) * 10 + 16 : 16, bottom: 8, containLabel: true }, option.grid),
          xAxis: axis(t, option.xAxis, { raw, which: "xAxis", width, locale }),
          yAxis: axis(t, option.yAxis, { raw, which: "yAxis", width, locale }),
        }
      : {}),
    legend:
      option.legend === undefined
        ? undefined
        : merge(
            // 折线的图例画出线型（24px 长、不画点），柱子和饼是方块
            { top: 0, left: 0, itemWidth: iconW, itemHeight: 10, itemGap: 10, ...(option.legend?.data ? {} : { data: legendData(raw) }), textStyle: { color: t.muted, fontFamily: t.font, fontSize: 12 } },
            option.legend,
          ),
    tooltip: merge(
      {
        // 有折线、柱子时按坐标轴，否则按一个数据（饼、散点）
        trigger: series.some((s) => s.type === "line" || s.type === "bar") ? "axis" : "item",
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

// 图例的每一项（D127）：折线只画线（看得出实线、虚线），不画点；别的是方块
function legendData(raw) {
  return raw.flatMap((s) => {
    if (!BY_SERIES.has(s.type)) return list(s.data).filter((d) => d?.name != null).map((d) => ({ name: d.name, icon: "rect" }));
    if (s.name == null) return [];
    return [s.type === "line" ? { name: s.name, itemStyle: { opacity: 0 } } : { name: s.name, icon: "rect" }];
  });
}

function axis(t, extra, ctx) {
  const style = (a = {}, index = 0) => {
    const type = a.type ?? (ctx.which === "xAxis" ? "category" : "value");
    const own = a.axisLabel ?? {};
    const out = {
      axisLine: { lineStyle: { color: t.line } },
      axisTick: { show: false },
      axisLabel: { color: t.muted, fontFamily: t.font, fontSize: 12 },
      splitLine: { lineStyle: { color: t.line, width: 1 } },
      nameTextStyle: { color: t.muted, fontFamily: t.font, fontSize: 12 },
    };
    const mine = ctx.raw.filter((s) => onGrid(s) && (s[`${ctx.which}Index`] ?? 0) === index);
    if (type === "value" && !own.formatter) {
      // 刻度数写全了超过 5 个字符就缩写（D128，和 D52 一样）；整根轴用同一种写法
      let top = 0;
      const stacks = {};
      for (const s of mine)
        list(s.data).forEach((d, i) => {
          const v = Math.abs(Number(valueOf(d)));
          if (!Number.isFinite(v)) return;
          if (s.stack != null) top = Math.max(top, (stacks[`${s.stack}:${i}`] = (stacks[`${s.stack}:${i}`] ?? 0) + v));
          else top = Math.max(top, v);
        });
      const long = gaugeFormat({ locale: ctx.locale })(top).length > 5;
      if (long) out.axisLabel.formatter = tightFormat({ locale: ctx.locale, compact: true }, 5);
    }
    if (type === "category" && mine.some((s) => s.type === "bar")) {
      const n = (a.data ?? list(mine[0]?.data)).length || 1;
      if (ctx.which === "yAxis") {
        // 横向条形图：从上往下是作者给的顺序（D125）；名字最宽占四成，再长就折行
        Object.assign(out, { inverse: true });
        out.axisLabel = { ...out.axisLabel, width: Math.round(ctx.width * 0.4), overflow: "break" };
      } else {
        // 柱子的名字一个不藏，放不下在自己那一格里折行（D125）；一格窄到放不下两个字时照 ECharts 的
        const band = (ctx.width - 64) / n - 4;
        if (band >= 24) out.axisLabel = { ...out.axisLabel, interval: 0, width: Math.floor(band), overflow: "break" };
      }
    }
    return merge(out, a);
  };
  if (Array.isArray(extra)) return extra.map((a, i) => style(a, i));
  return style(extra ?? {}, 0);
}

const end = (parts, host) => parts.map((p) => p.trim()).filter(Boolean).join(say("chartStop", null, host)).trim() + say("chartEnd", null, host);

/* ── 读屏的一句话（D126）：什么图、几条、叫什么、横轴从哪到哪、每条从多少到多少、最高最低；饼写每块的数和占比 ── */
function describe(option, raw, horizontal, locale, host) {
  if (!raw.length) return say("chartEmpty", null, host);
  const num = gaugeFormat({ locale });
  const types = new Set(raw.map((s) => s.type));
  const kind = types.size > 1 ? "chartAny" : { line: "chartLine", bar: horizontal ? "chartHBar" : "chartBar", pie: "chartPie", scatter: "chartScatter" }[raw[0].type] ?? "chartAny";
  const catAxis = list(horizontal ? option.yAxis : option.xAxis)[0] ?? {};
  const time = catAxis.type === "time";
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const cats = (catAxis.data ?? []).map(labelOf);
  const xOf = (d, i) => {
    const v = isObj(d) ? d.value : d;
    const x = Array.isArray(v) ? v[0] : cats[i];
    // 「2026-10-08」按本地时间算（和 ECharts 一样），不按 UTC
    const when = typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? new Date(`${x}T00:00`) : new Date(x);
    return time && x != null && !Number.isNaN(when.getTime()) ? day.format(when) : x == null ? "" : String(x);
  };
  const parts = [say(kind, null, host)];
  const named = raw.filter((s) => s.name);
  if (named.length) parts.push(say("chartSeries", { n: raw.length, names: named.slice(0, 5).map((s) => s.name).join(say("chartSep", null, host)) }, host));
  else if (raw.length > 1) parts.push(say("chartCount", { n: raw.length }, host));
  if (raw[0].type === "pie" || !BY_SERIES.has(raw[0].type)) {
    const data = list(raw[0].data).filter((d) => finite(valueOf(d)));
    const pct = largestRemainder(data.map((d) => Number(valueOf(d))));
    parts.push(data.map((d, i) => say("chartShare", { name: d.name ?? "", value: num(Number(valueOf(d))), pct: `${pct[i]}%` }, host)).join(say("chartSep", null, host)));
    return end(parts, host);
  }
  if (cats.length) parts.push(say(horizontal ? "chartAxisY" : "chartAxis", { from: cats[0], to: cats.at(-1) }, host));
  let any = false;
  for (const s of raw.slice(0, 5)) {
    const pts = list(s.data)
      .map((d, i) => [valueOf(d), xOf(d, i)])
      .filter(([v]) => finite(v))
      .map(([v, x]) => [Number(v), x]);
    if (!pts.length) continue;
    any = true;
    if (s.type === "scatter") {
      parts.push(say("chartPoints", { name: s.name ?? "", n: pts.length }, host));
      continue;
    }
    const hi = pts.reduce((a, b) => (b[0] > a[0] ? b : a));
    const lo = pts.reduce((a, b) => (b[0] < a[0] ? b : a));
    const at = (p) => (p[1] ? say("chartAt", { x: p[1] }, host) : "");
    // 折线说从多少到多少；柱子只说最高最低
    parts.push(say(s.type === "line" ? "chartTrend" : "chartRange", { name: s.name ?? "", first: num(pts[0][0]), last: num(pts.at(-1)[0]), max: num(hi[0]) + at(hi), min: num(lo[0]) + at(lo) }, host));
  }
  if (!any) return say("chartEmpty", null, host);
  if (raw.length > 5) parts.push(say("chartMore", { n: raw.length - 5 }, host));
  return end(parts, host);
}

/**
 * 看着一张图（D132）：主题、主色、圆角、局部主题、高对比、减少动效变了就重画（令牌真的变了才画）；
 * 图的大小变了就 resize，和宽度有关的选项（图例让行、类目折行）重算；触屏上点图外面、滚动时收起提示；图销毁后自己解绑。返回解绑函数。
 */
export function watchChartTheme(chart, build, { el = document.documentElement } = {}) {
  const dom = chart.getDom?.() ?? null;
  const make = () => {
    building = dom;
    try {
      return build();
    } finally {
      building = null;
    }
  };
  const key = () => JSON.stringify(chartTokens(dom ?? el)) + media(STILL);
  let last = key();
  let width = dom?.clientWidth ?? 0;
  const off = [];
  const stop = () => off.splice(0).forEach((f) => f());
  const alive = () => (chart.isDisposed?.() ? (stop(), false) : true);
  const apply = () => {
    if (!alive()) return;
    const k = key();
    if (k === last) return;
    last = k;
    chart.setOption(make(), { notMerge: true });
  };
  // 第一次也经过这里：作者没传 el 时，宽度和局部主题从图的 DOM 来
  if (dom) chart.setOption(make(), { notMerge: true });
  const mo = new MutationObserver(apply);
  mo.observe(el, { attributes: true, attributeFilter: ["data-theme", "data-accent", "style", "data-corners"] });
  // 页面里某一块换了主题也重画（D112）：只看 data-theme，不看 style
  const local = new MutationObserver((records) => records.some((r) => r.target !== el) && apply());
  local.observe(el.ownerDocument?.documentElement ?? el, { attributes: true, subtree: true, attributeFilter: ["data-theme"] });
  off.push(() => mo.disconnect(), () => local.disconnect());
  for (const q of [FORCED, STILL]) {
    const m = typeof matchMedia === "function" ? matchMedia(q) : null;
    m?.addEventListener?.("change", apply);
    off.push(() => m?.removeEventListener?.("change", apply));
  }
  if (dom && typeof ResizeObserver === "function") {
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!alive() || !dom.isConnected) return;
        chart.resize();
        if (Math.abs(dom.clientWidth - width) < 1) return;
        width = dom.clientWidth;
        chart.setOption(make());
      });
    });
    ro.observe(dom);
    off.push(() => ro.disconnect());
  }
  if (dom) {
    // 触屏上提示不走（D132）：点图外面、滚动页面时收起
    let touch = false;
    const down = (e) => {
      touch = e.pointerType !== "mouse";
      if (touch && !dom.contains(e.target) && alive()) chart.dispatchAction({ type: "hideTip" });
    };
    const scroll = () => touch && alive() && chart.dispatchAction({ type: "hideTip" });
    document.addEventListener("pointerdown", down, true);
    // 手指划的时候提示跟着手指出来，划完（scrollend）再收一次
    for (const type of ["scroll", "scrollend"]) {
      document.addEventListener(type, scroll, { capture: true, passive: true });
      off.push(() => document.removeEventListener(type, scroll, true));
    }
    off.push(() => document.removeEventListener("pointerdown", down, true));
  }
  return stop;
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
