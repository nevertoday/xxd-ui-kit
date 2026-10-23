// 图型的换算（CHART-TYPES-PLAN H1）：纯函数，没有 DOM。网页（Xxd.viz）、React、小程序都用这一份。
// 图型的分类参考了 lieflat-charts 的目录（按「数据形状」选图）；它是非商用许可，这里没有它的任何代码。
// 画法在 CSS 里（条是 transform: scaleX，格子是 grid）；这里只把数据换成「比例、档位、格子、字」。
import { gaugeFormat, tightFormat, withUnit } from "./gauge.js";

export * from "./gauge.js";
export * from "./viz-html.js";

const LABELS = {
  "zh-CN": { keep: "留下 {p}", cell: "1 格 = {p}", less: "少", more: "多", before: "之前", after: "之后", sep: "，", months: "1月 2月 3月 4月 5月 6月 7月 8月 9月 10月 11月 12月", days: "一 二 三 四 五 六 日", calendar: "{days} 天里有 {active} 天有记录，合计 {total}，最多一天 {max}", none: "没有记录", day: "{date}：{v}", heat: "热力格", empty: "没有数据", other: "其他" },
  "zh-TW": { keep: "留下 {p}", cell: "1 格 = {p}", less: "少", more: "多", before: "之前", after: "之後", sep: "，", months: "1月 2月 3月 4月 5月 6月 7月 8月 9月 10月 11月 12月", days: "一 二 三 四 五 六 日", calendar: "{days} 天裡有 {active} 天有記錄，合計 {total}，最多一天 {max}", none: "沒有記錄", day: "{date}：{v}", heat: "熱力格", empty: "沒有資料", other: "其他" },
  en: { keep: "{p} kept", cell: "1 cell = {p}", less: "Less", more: "More", before: "Before", after: "After", sep: ", ", months: "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec", days: "Mon Tue Wed Thu Fri Sat Sun", calendar: "{active} of {days} days with activity, {total} in total, at most {max} in a day", none: "No activity", day: "{date}: {v}", heat: "Heatmap", empty: "No data", other: "Other" },
};
export const vizLabels = (locale = "zh-CN") => LABELS[locale] ?? (/^zh-(TW|HK|Hant)/i.test(locale) ? LABELS["zh-TW"] : /^zh/i.test(locale) ? LABELS["zh-CN"] : LABELS.en);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const finite = (v) => v !== null && v !== "" && v !== undefined && Number.isFinite(Number(v));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r3 = (n) => Math.round(n * 1000) / 1000 || 0;
const formatter = (o) => (typeof o.format === "function" ? o.format : gaugeFormat({ locale: o.locale, decimals: o.decimals, compact: o.compact }));
/** 真正的减号（−），不是连字符 */
const signed = (text, v) => (v > 0 ? `+${text}` : v < 0 ? `−${text}` : text);

/**
 * 最大余数法：把一组非负数按比例分成 total 份整数，加起来正好是 total（D45）。
 * [49, 27.4, 13.9, 5, 3.2] → 百分比 [50, 28, 14, 5, 3]
 */
export function largestRemainder(values, total = 100) {
  const v = values.map((x) => (finite(x) && x > 0 ? Number(x) : 0));
  const sum = v.reduce((a, b) => a + b, 0);
  if (!sum) return v.map(() => 0);
  const exact = v.map((x) => (x / sum) * total);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    if (v[i] > 0) {
      out[i] += 1;
      left -= 1;
    }
  }
  return out;
}

/* ── 条形榜 ── */

/** 刻度的步长：取整到 1 / 2 / 5 × 10ⁿ，大约 n 格 */
export function niceStep(top, n = 4) {
  if (!(top > 0)) return 0;
  const raw = top / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
}

/**
 * items：[{ label, value, highlight?, compare?, note?, total? }]。
 * variant：plain（缺省，按大小排）| diverging（有正有负，从中线往两边）| funnel（分阶段递减，保留顺序）| waterfall（增减分解：total 的行是合计，其余从上一行的末尾接着长）。
 * 选项：step（每格代表多少）、mark + markLabel（参考线：平均、目标）、compare + compareLabel / valueLabel（对照值，比如去年）、axis（下面一行刻度数和网格线）。
 */
export function barsModel(items = [], o = {}) {
  const variant = ["diverging", "funnel", "waterfall"].includes(o.variant) ? o.variant : "plain";
  const fmt = formatter(o);
  const L = vizLabels(o.locale);
  let rows = items
    .filter((it) => it && finite(it.value))
    .map((it) => ({ label: String(it.label ?? ""), value: Number(it.value), highlight: Boolean(it.highlight), total: Boolean(it.total), compare: finite(it.compare) ? Number(it.compare) : null, note: it.note ? String(it.note) : "" }));
  if (variant === "plain" && o.sort !== false) rows = rows.sort((a, b) => b.value - a.value);
  if (variant === "diverging" && o.sort !== false) rows = rows.sort((a, b) => b.value - a.value);
  const unit = (v) => withUnit(fmt(v), o.unit);

  // 瀑布：先算每行从哪到哪（合计行从 0 起）
  let run = 0;
  const spans = rows.map((r) => {
    if (variant !== "waterfall") return null;
    const a = r.total ? 0 : run;
    const b = r.total ? r.value : run + r.value;
    run = b;
    return [Math.min(a, b), Math.max(a, b)];
  });
  const lo = variant === "waterfall" ? Math.min(0, ...spans.map((s) => s[0])) : 0;
  const values = rows.flatMap((r) => (variant === "diverging" ? [Math.abs(r.value), Math.abs(r.compare ?? 0)] : [r.value, r.compare ?? 0]));
  const top =
    finite(o.max) && Number(o.max) > 0
      ? Number(o.max)
      : variant === "funnel"
        ? rows[0]?.value || 0
        : variant === "waterfall"
          ? Math.max(0, ...spans.map((s) => s[1]))
          : Math.max(0, ...values, finite(o.mark) ? Number(o.mark) : 0);
  const range = top - lo;
  const at = (v) => (range > 0 ? r3(clamp((v - lo) / range, 0, 1)) : 0);
  const out = rows.map((r, i) => {
    const frac = top ? (variant === "diverging" ? clamp(r.value / top, -1, 1) : clamp(r.value / top, 0, 1)) : 0;
    const text = variant === "diverging" || (variant === "waterfall" && !r.total) ? withUnit(signed(fmt(Math.abs(r.value)), r.value), o.unit) : unit(r.value);
    const prev = rows[i - 1]?.value;
    const keep = variant === "funnel" && i > 0 && prev > 0 ? fill(L.keep, { p: `${fmt((r.value / prev) * 100)}%` }) : "";
    const compareText = r.compare != null ? `${o.compareLabel ? `${o.compareLabel} ` : ""}${unit(r.compare)}` : "";
    const row = { ...r, frac: r3(frac), text, note: [keep, compareText, r.note].filter(Boolean).join(L.sep) };
    // 对照值：正负条从中线往两边（和主条一样）；瀑布没有对照
    if (r.compare != null && variant !== "waterfall") row.compareFrac = top ? r3(clamp(r.compare / top, variant === "diverging" ? -1 : 0, 1)) : 0;
    if (spans[i]) [row.from, row.to] = [at(spans[i][0]), at(spans[i][1])];
    return row;
  });
  const step = finite(o.step) && Number(o.step) > 0 ? Number(o.step) : 0;
  const rungs = step && top && variant === "plain" ? Math.min(60, Math.round(top / step)) : 0;
  // 刻度：只给「从 0 起」的条（plain、funnel、waterfall 在 0 以上时）
  let axis = null;
  if (o.axis && top > 0 && variant !== "diverging" && lo === 0) {
    const s = niceStep(top);
    const vs = [];
    for (let v = 0; v <= top + 1e-9; v += s) vs.push(v);
    // 刻度数地方小：最大的那个写全了太长就一起缩写（D52）
    const tf = tightFormat(o, 5);
    const short = typeof o.format !== "function" && o.compact == null && fmt(vs.at(-1)).length > 5;
    const ticks = vs.map((v) => ({ at: r3(v / top), text: short ? tf(v) : fmt(v) }));
    axis = { tick: r3((s / top) * 100), ticks };
  }
  const mark = finite(o.mark) && top > 0 && variant !== "diverging" ? { at: at(Number(o.mark)), text: o.markLabel ? `${o.markLabel} ${unit(Number(o.mark))}` : unit(Number(o.mark)) } : null;
  const hasCompare = out.some((r) => r.compareFrac != null);
  const key = hasCompare || mark ? { value: o.valueLabel || "", compare: hasCompare ? o.compareLabel || "" : "", mark: mark?.text || "" } : null;
  // 瀑布落到 0 以下：画一道 0 线
  const zero = variant === "waterfall" && lo < 0 ? at(0) : null;
  return { variant, rows: out, rungs, emphasis: out.some((r) => r.highlight), axis, mark, zero, key, empty: out.length ? "" : L.empty };
}

/* ── 构成条、百格图 ── */

/** parts：[{ label, value }]。比例按总和算，百分比用最大余数法取整（加起来 100）。 */
export function proportionModel(parts = [], o = {}) {
  const fmt = formatter(o);
  const L = vizLabels(o.locale);
  let list = parts.filter((p) => p && finite(p.value) && Number(p.value) >= 0).map((p) => ({ label: String(p.label ?? ""), value: Number(p.value) }));
  // 颜色只有 5 种：超过 5 类时前 4 类 + 「其他」（D49），合计按全部算
  if (list.length > 5) list = [...list.slice(0, 4), { label: L.other, value: list.slice(4).reduce((a, p) => a + p.value, 0) }];
  const sum = list.reduce((a, p) => a + p.value, 0);
  const pct = largestRemainder(list.map((p) => p.value), 100);
  // 不是 0 但取整成 0 的写「<1%」
  const items = list.map((p, i) => ({ ...p, part: i, share: sum ? r3(p.value / sum) : 0, percent: pct[i] || !p.value ? `${pct[i]}%` : "<1%", text: withUnit(fmt(p.value), o.unit) }));
  const label = items.map((p) => `${p.label} ${p.percent}`).join(L.sep);
  // max：几根并排时条长按合计 ÷ max（既看构成也看总量）
  const scale = finite(o.max) && Number(o.max) > 0 ? r3(clamp(sum / Number(o.max), 0, 1)) : 1;
  return { parts: items, total: sum, totalText: withUnit(fmt(sum), o.unit), scale, label: o.label ? `${o.label}${L.sep}${label}` : label, empty: sum > 0 ? "" : L.empty };
}

/** 百格图：cells 个格子（缺省 100），每格是第几部分（-1 是空）。 */
export function waffleModel(parts = [], o = {}) {
  const cells = Math.max(10, Math.min(400, Math.round(finite(o.cells) ? Number(o.cells) : 100)));
  const base = proportionModel(parts, o);
  const counts = largestRemainder(base.parts.map((p) => p.value), cells);
  const grid = counts.flatMap((n, i) => Array(n).fill(i));
  while (grid.length < cells) grid.push(-1);
  const L = vizLabels(o.locale);
  const per = 100 / cells;
  return { ...base, cells: grid, note: fill(L.cell, { p: `${Number.isInteger(per) ? per : per.toFixed(1)}%` }) };
}

/* ── 热力格 ── */

/** 0 档是没有（0 或空），1–4 档按最大值的四分之一分（D44） */
export function heatLevel(v, max) {
  if (!finite(v) || Number(v) <= 0 || !(max > 0)) return 0;
  return clamp(Math.ceil((Number(v) / max) * 4), 1, 4);
}

const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const parseDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
};

/**
 * 日历热力：values 是 { "2026-03-02": 5, … } 或 [{ date, value }]；end 是最后一天（缺省今天）；weeks 周（缺省 53）。
 * 一周一列，周一在最上面。返回 columns（每列 7 格）、月份标签（在哪一列）、星期标签、一句话总结。
 */
export function calendarModel(values = {}, o = {}) {
  const L = vizLabels(o.locale);
  const fmt = formatter(o);
  const map = new Map();
  for (const [d, v] of Array.isArray(values) ? values.map((x) => [x.date, x.value]) : Object.entries(values)) {
    const t = parseDay(d);
    if (Number.isFinite(t) && finite(v)) map.set(t, (map.get(t) ?? 0) + Number(v));
  }
  const weeks = Math.max(1, Math.min(60, Math.round(finite(o.weeks) ? Number(o.weeks) : 53)));
  // 缺省是本地的今天（不是 UTC 的今天：北京时间早上 8 点前 UTC 还是昨天）
  const now = new Date();
  const endT = Number.isFinite(parseDay(o.end)) ? parseDay(o.end) : Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const endDow = (new Date(endT).getUTCDay() + 6) % 7; // 周一 = 0
  const start = endT - (endDow + (weeks - 1) * 7) * DAY;
  let max = 0;
  for (const [t, v] of map) if (t >= start && t <= endT) max = Math.max(max, v);
  const months = L.months.split(" ");
  const columns = [];
  const monthLabels = [];
  let total = 0;
  let active = 0;
  let days = 0;
  let lastMonth = -1;
  for (let w = 0; w < weeks; w += 1) {
    const col = [];
    for (let d = 0; d < 7; d += 1) {
      const t = start + (w * 7 + d) * DAY;
      const future = t > endT;
      const v = future ? null : map.get(t) ?? 0;
      if (!future) {
        days += 1;
        total += v;
        if (v > 0) active += 1;
      }
      const date = iso(t);
      col.push({ date, value: v, level: future ? -1 : heatLevel(v, max), title: future ? "" : fill(L.day, { date, v: withUnit(fmt(v), o.unit) }) });
    }
    const month = new Date(start + w * 7 * DAY).getUTCMonth();
    if (month !== lastMonth) {
      // 第一列不满一周时不标（标签会挤到下一个月上）
      if (w > 0 || new Date(start).getUTCDate() <= 7) monthLabels.push({ col: w, text: months[month] });
      lastMonth = month;
    }
    columns.push(col);
  }
  const label = active ? fill(L.calendar, { days, active, total: withUnit(fmt(total), o.unit), max: withUnit(fmt(max), o.unit) }) : L.none;
  return { columns, months: monthLabels, weekdays: L.days.split(" "), max, total, active, label: o.label ? `${o.label}${L.sep}${label}` : label, title: o.label || L.heat, less: L.less, more: L.more };
}

/** 矩阵热力：rows × cols 的 values（二维数组）。格子够大时直接写数（numbers）。 */
export function matrixModel({ rows = [], cols = [], values = [] } = {}, o = {}) {
  const fmt = formatter(o);
  // 格子里地方小：太长就缩写（D52）；提示和读屏是全数
  const cellFmt = tightFormat(o, 5);
  const L = vizLabels(o.locale);
  let max = 0;
  let maxAt = null;
  rows.forEach((r, i) => cols.forEach((c, j) => {
    const v = values[i]?.[j];
    if (finite(v) && Number(v) > max) {
      max = Number(v);
      maxAt = `${r} × ${c}`;
    }
  }));
  const cells = rows.map((r, i) => cols.map((c, j) => {
    const v = values[i]?.[j];
    // 缺数据和 0 不一样：缺的是 -1 档（空心），写「—」
    const ok = finite(v);
    return { value: ok ? Number(v) : null, level: ok ? heatLevel(v, max) : -1, text: ok ? cellFmt(Number(v)) : "—", title: `${r} × ${c}${L.sep}${ok ? withUnit(fmt(Number(v)), o.unit) : "—"}` };
  }));
  const summary = maxAt ? `${String(maxAt)} ${withUnit(fmt(max), o.unit)}` : L.none;
  return { empty: rows.length && cols.length ? "" : L.empty, rows: rows.map(String), cols: cols.map(String), cells, max, label: o.label ? `${o.label}${L.sep}${summary}` : summary, title: o.label || L.heat, less: L.less, more: L.more };
}

/* ── 前后对比 ── */

/** rows：[{ label, from, to }]。位置按 [min, max]（缺省是数据的范围，两头留一点空）。 */
export function dumbbellModel(rows = [], o = {}) {
  const fmt = formatter(o);
  const L = vizLabels(o.locale);
  const list = rows.filter((r) => r && finite(r.from) && finite(r.to)).map((r) => ({ label: String(r.label ?? ""), from: Number(r.from), to: Number(r.to) }));
  const all = list.flatMap((r) => [r.from, r.to]);
  let lo = finite(o.min) ? Number(o.min) : Math.min(...all, Infinity);
  let hi = finite(o.max) ? Number(o.max) : Math.max(...all, -Infinity);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) [lo, hi] = [0, 1];
  if (!finite(o.min) && !finite(o.max)) {
    const pad = (hi - lo || Math.abs(hi) || 1) * 0.08;
    lo -= pad;
    hi += pad;
  }
  const at = (v) => r3(hi > lo ? clamp((v - lo) / (hi - lo), 0, 1) : 0.5);
  return {
    rows: list.map((r) => ({ ...r, a: at(r.from), b: at(r.to), fromText: withUnit(fmt(r.from), o.unit), toText: withUnit(fmt(r.to), o.unit), delta: signed(fmt(Math.abs(r.to - r.from)), r.to - r.from) })),
    fromLabel: o.fromLabel ?? L.before,
    toLabel: o.toLabel ?? L.after,
    empty: list.length ? "" : L.empty,
  };
}
