// 图型放进页面（CHART-TYPES-PLAN H2）：换算在 viz.js（纯函数，三种实现共用），这里只拼 HTML。
// 换算那部分单独一个文件（dist/viz.js），像图标一样按需加载，不用图的页面不背：
//   经典脚本：xxd.js 后面加 <script src="vendor/xxd/viz.js"></script>（window.XxdViz）
//   ESM：     useViz(await import("@xxd/css/viz"))
// 声明式：<ol class="xxd-bars" data-viz="bars" data-items="长文发布:2410;排序链接:830"></ol>，Xxd.init() 画出来；data-* 改了再调 Xxd.initViz()。
import { getLocale } from "./i18n.js";

let vizImpl = null;
/** 图的换算用哪份：ESM 项目 useViz(await import("@xxd/css/viz"))；经典脚本自动用 window.XxdViz。 */
export function useViz(lib) {
  vizImpl = lib || null;
}
export const vizLib = () => vizImpl ?? globalThis.XxdViz ?? null;
let warned = false;
export const missingViz = () => {
  if (!warned) console.warn('[xxd] 页面里有量表或图，但没有加载 viz.js：经典脚本在 xxd.js 后面加 viz.js；ESM 里 useViz(await import("@xxd/css/viz"))');
  warned = true;
  return null;
};

/** 图的种类 → 用哪个换算函数 */
function modelOf(lib, kind, data, o) {
  if (kind === "bars") return lib.barsModel(data, o);
  if (kind === "proportion") return lib.proportionModel(data, o);
  if (kind === "waffle") return lib.waffleModel(data, o);
  if (kind === "calendar") return lib.calendarModel(data, o);
  if (kind === "matrix") return lib.matrixModel(data, o);
  if (kind === "dumbbell") return lib.dumbbellModel(data, o);
  return null;
}
const ROOT = { bars: "xxd-bars", proportion: "xxd-proportion", waffle: "xxd-waffle", calendar: "xxd-heatmap", matrix: "xxd-heatmap", dumbbell: "xxd-dumbbell" };

/**
 * 画一张图（或者数据变了重画）。kind：bars | proportion | waffle | calendar | matrix | dumbbell。
 *   Xxd.viz(el, "bars", [{ label: "长文发布", value: 2410 }], { unit: "篇" })
 * data 的样子见 viz.d.ts（条形榜、构成条、百格图是 [{ label, value }]；日历是 { "2026-03-02": 5 }；矩阵是 { rows, cols, values }；前后对比是 [{ label, from, to }]）。
 */
export function viz(el, kind, data, options = {}) {
  const lib = vizLib();
  if (!lib) return missingViz();
  const o = { locale: getLocale(el), ...options };
  const m = modelOf(lib, kind, data, o);
  if (!m) throw new Error(`[xxd] 不认识的图：${kind}`);
  const { attrs, html } = lib.VIZ_HTML[kind](m, o);
  el.classList.add(ROOT[kind]);
  for (const [k, v] of Object.entries(attrs)) {
    // 自定义属性写在 style 上（不动作者自己写的 style）
    if (k.startsWith("--")) v == null ? el.style.removeProperty(k) : el.style.setProperty(k, String(v));
    else if (v == null) el.removeAttribute(k);
    else el.setAttribute(k, v);
  }
  el.innerHTML = html;
  // 日历：最近的一周在最右边；窄屏上横着滚，先滚到最右
  const scroll = el.querySelector(".xxd-heatmap__scroll");
  if (scroll && kind === "calendar") scroll.scrollLeft = scroll.scrollWidth;
  return m;
}

/** 「名字:数;名字:数」→ [{ label, value }]（名字里可以有冒号，按最后一个冒号切） */
export const pairs = (s) =>
  (s ? s.split(";") : []).filter((x) => x.trim()).map((x) => {
    const at = x.lastIndexOf(":");
    return { label: x.slice(0, at).trim(), value: x.slice(at + 1).trim() };
  });
const list = (s) => (s ? s.split(",").map((x) => x.trim()) : []);

/** 元素上的 data-* → [kind, data, options] */
export function vizFrom(el) {
  const d = el.dataset;
  const o = { unit: d.unit, label: d.label, decimals: d.decimals != null ? Number(d.decimals) : undefined, compact: d.compact != null && d.compact !== "false" };
  const kind = d.viz === "heatmap" ? (d.variant === "matrix" ? "matrix" : "calendar") : d.viz;
  if (kind === "bars") {
    // 「名字:数」；对照值写成「名字:数/对照」；合计行（瀑布）的名字写在 data-total 里
    const hi = new Set(list(d.highlight));
    const totals = new Set(list(d.total));
    const items = pairs(d.items).map((p) => {
      const [value, compare] = p.value.split("/");
      return { label: p.label, value, compare, highlight: hi.has(p.label), total: totals.has(p.label) };
    });
    return [kind, items, { ...o, variant: d.variant, step: d.step, max: d.max, sort: d.sort !== "false", axis: d.axis != null && d.axis !== "false", mark: d.mark, markLabel: d.markLabel, compareLabel: d.compareLabel, valueLabel: d.valueLabel }];
  }
  if (kind === "proportion") return [kind, pairs(d.parts), { ...o, legend: d.legend !== "false", max: d.max }];
  if (kind === "waffle") return [kind, pairs(d.parts), { ...o, cells: d.cells }];
  if (kind === "calendar") {
    let values = {};
    try {
      values = JSON.parse(d.values || "{}");
    } catch {
      console.warn("[xxd] data-values 要是 JSON：{\"2026-03-02\": 5}", el);
    }
    return [kind, values, { ...o, end: d.end, weeks: d.weeks }];
  }
  if (kind === "matrix") return [kind, { rows: list(d.rows), cols: list(d.cols), values: (d.values || "").split(";").map(list) }, { ...o, numbers: d.numbers != null && d.numbers !== "false" }];
  if (kind === "dumbbell") {
    // 「入门:32>45;进阶:51>58」
    const rows = pairs(d.rows).map((p) => {
      const [from, to] = p.value.split(">");
      return { label: p.label, from, to };
    });
    return [kind, rows, { ...o, min: d.min, max: d.max, fromLabel: d.fromLabel, toLabel: d.toLabel }];
  }
  return [null];
}

/** 声明式：[data-viz] 的元素都画出来（Xxd.init 会调用） */
export function initViz(root = document) {
  for (const el of root.querySelectorAll?.("[data-viz]") ?? []) {
    const [kind, data, o] = vizFrom(el);
    if (kind) viz(el, kind, data, o);
  }
}
