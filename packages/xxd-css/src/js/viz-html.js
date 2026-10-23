// 图的 HTML（CHART-TYPES-PLAN D46）：模型 → HTML 字符串，纯函数，没有 DOM。
// 放在 dist/viz.js 里（xxd.js 只负责放进页面）；也能在服务端出 HTML。
import { needleSvg } from "./gauge.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** 图例：色块 · 名字 · 数字（· 占比） */
export function legendHtml(items) {
  return `<ul class="xxd-legend">${items
    .map((l) => `<li class="xxd-legend__item"><span class="xxd-legend__key" data-part="${l.part}"></span><span class="xxd-legend__name">${esc(l.label)}</span><span class="xxd-legend__num">${esc(l.num)}</span>${l.share ? `<span class="xxd-legend__share">${esc(l.share)}</span>` : ""}</li>`)
    .join("")}</ul>`;
}

const r100 = (x) => Math.round(x * 1000) / 10;
/** 没有数据：一行字（列表里是 <li>） */
export const emptyHtml = (text, tag = "p") => `<${tag} class="xxd-viz-empty">${esc(text)}</${tag}>`;

/** 色阶那一行；左边的 readout 写指到 / 点到的那一格（D50） */
const scaleHtml = (m) =>
  `<div class="xxd-heatmap__scale" aria-hidden="true"><span class="xxd-heatmap__readout"></span><span>${esc(m.less)}</span>${[0, 1, 2, 3, 4].map((l) => `<i class="xxd-heatmap__cell" data-level="${l}"></i>`).join("")}<span>${esc(m.more)}</span></div>`;

/** 每种图：模型 → 根元素上的属性 + 里面的 HTML */
export const VIZ_HTML = {
  bars(m) {
    const attrs = {
      "data-variant": m.variant === "plain" ? null : m.variant,
      "data-emphasis": m.emphasis ? "" : null,
      "data-rungs": m.rungs ? "" : null,
      "--rungs": m.rungs || null,
      "data-axis": m.axis ? "" : null,
      "--tick": m.axis ? m.axis.tick : null,
      "data-marked": m.mark ? "" : null,
      "--mark": m.mark ? m.mark.at : null,
      "data-zero": m.zero != null ? "" : null,
      "--zero": m.zero,
    };
    if (m.empty) return { attrs, html: emptyHtml(m.empty, "li") };
    const sw = (kind, text) => (text ? `<span><span class="xxd-bars__swatch" data-kind="${kind}"></span>${esc(text)}</span>` : "");
    const key = m.key ? `<li class="xxd-bars__key" aria-hidden="true">${sw("value", m.key.value)}${sw("compare", m.key.compare)}${sw("mark", m.key.mark)}</li>` : "";
    const rows = m.rows
      .map((r) => {
        const style = [`--value:${r.frac}`, r.compareFrac != null ? `--compare:${r.compareFrac}` : "", r.from != null ? `--from:${r.from};--to:${r.to}` : ""].filter(Boolean).join(";");
        const compare = r.compareFrac != null ? `<span class="xxd-bars__compare"></span>` : "";
        return `<li class="xxd-bars__item"${r.highlight ? " data-highlight" : ""}${r.total ? " data-total" : ""} style="${style}"><span class="xxd-bars__label">${esc(r.label)}</span><span class="xxd-bars__track" aria-hidden="true"><span class="xxd-bars__bar"><span class="xxd-bars__fill"></span></span>${compare}</span><span class="xxd-bars__value">${esc(r.text)}${r.note ? `<span class="xxd-bars__note">${esc(r.note)}</span>` : ""}</span></li>`;
      })
      .join("");
    const axis = m.axis ? `<li class="xxd-bars__axis" aria-hidden="true"><span class="xxd-bars__ticks">${m.axis.ticks.map((t) => `<span class="xxd-bars__tick" style="left:${r100(t.at)}%">${esc(t.text)}</span>`).join("")}</span></li>` : "";
    return { attrs, html: key + rows + axis };
  },
  proportion(m, o) {
    if (m.empty) return { attrs: { role: null, "aria-label": null }, html: (o.label ? `<p class="xxd-proportion__head"><span class="xxd-proportion__label">${esc(o.label)}</span></p>` : "") + emptyHtml(m.empty) };
    const head = o.label ? `<p class="xxd-proportion__head"><span class="xxd-proportion__label">${esc(o.label)}</span><span class="xxd-proportion__total">${esc(m.totalText)}</span></p>` : "";
    const bar = `<div class="xxd-proportion__bar" aria-hidden="true"${m.scale < 1 ? ` style="--scale:${m.scale}"` : ""}>${m.parts.filter((p) => p.share > 0).map((p) => `<span class="xxd-proportion__part" data-part="${p.part}" style="--v:${p.share}"></span>`).join("")}</div>`;
    const legend = o.legend === false ? "" : legendHtml(m.parts.map((p) => ({ label: p.label, num: p.text, share: p.percent, part: p.part })));
    return { attrs: { role: "group", "aria-label": m.label }, html: head + bar + legend };
  },
  waffle(m) {
    if (m.empty) return { attrs: { role: null, "aria-label": null }, html: emptyHtml(m.empty) };
    const grid = `<div class="xxd-waffle__grid" aria-hidden="true">${m.cells.map((c) => `<i class="xxd-waffle__cell"${c >= 0 ? ` data-part="${c}"` : ""}></i>`).join("")}</div>`;
    const legend = legendHtml(m.parts.map((p) => ({ label: p.label, num: p.percent, part: p.part })));
    return { attrs: { role: "group", "aria-label": m.label }, html: `${grid}<div class="xxd-waffle__side">${legend}<p class="xxd-waffle__note">${esc(m.note)}</p></div>` };
  },
  calendar(m) {
    const months = `<div class="xxd-heatmap__months" aria-hidden="true">${m.months.map((x) => `<span style="grid-column:${x.col + 1}">${esc(x.text)}</span>`).join("")}</div>`;
    const days = `<div class="xxd-heatmap__days" aria-hidden="true">${m.weekdays.map((d, i) => `<span>${i % 2 === 0 ? esc(d) : ""}</span>`).join("")}</div>`;
    const cells = m.columns.flat().map((c) => `<i class="xxd-heatmap__cell" data-level="${c.level < 0 ? "none" : c.level}"${c.title ? ` data-tip="${esc(c.title)}"` : ""}></i>`).join("");
    const grid = `<div class="xxd-heatmap__grid" role="img" aria-label="${esc(m.label)}">${cells}</div>`;
    // 星期在滚动区外面：滚到最近一周时也看得见
    return { attrs: { "data-variant": null }, html: `<div class="xxd-heatmap__body">${days}<div class="xxd-heatmap__scroll" role="region" aria-label="${esc(m.title)}" tabindex="0"><div class="xxd-heatmap__frame" style="--weeks:${m.columns.length}">${months}${grid}</div></div></div>${scaleHtml(m)}` };
  },
  matrix(m, o) {
    if (m.empty) return { attrs: { "data-variant": "matrix" }, html: emptyHtml(m.empty) };
    const head = `<span></span>${m.cols.map((c) => `<span class="xxd-heatmap__col">${esc(c)}</span>`).join("")}`;
    const body = m.rows.map((r, i) => `<span class="xxd-heatmap__row">${esc(r)}</span>${m.cells[i].map((c) => `<i class="xxd-heatmap__cell" data-level="${c.level < 0 ? "none" : c.level}" data-tip="${esc(c.title)}">${o.numbers ? esc(c.text) : ""}</i>`).join("")}`).join("");
    return { attrs: { "data-variant": "matrix" }, html: `<div class="xxd-heatmap__scroll" role="region" aria-label="${esc(m.title)}" tabindex="0"><div class="xxd-heatmap__matrix" role="img" aria-label="${esc(m.label)}" style="--cols:${m.cols.length}">${head}${body}</div></div>${scaleHtml(m)}` };
  },
  dumbbell(m) {
    if (m.empty) return { attrs: {}, html: emptyHtml(m.empty) };
    const key = `<p class="xxd-dumbbell__key"><span class="xxd-dumbbell__from"></span>${esc(m.fromLabel)}<span class="xxd-dumbbell__to"></span>${esc(m.toLabel)}</p>`;
    const rows = m.rows
      .map(
        (r) =>
          `<li class="xxd-dumbbell__item"><span class="xxd-dumbbell__label">${esc(r.label)}</span><span class="xxd-dumbbell__track" aria-hidden="true" style="--a:${r.a};--b:${r.b};--lo:${Math.min(r.a, r.b)};--hi:${Math.max(r.a, r.b)}"><span class="xxd-dumbbell__line"></span><span class="xxd-dumbbell__from"></span><span class="xxd-dumbbell__to"></span></span><span class="xxd-dumbbell__value">${esc(r.fromText)} → ${esc(r.toText)}<span class="xxd-dumbbell__delta">${esc(r.delta)}</span></span></li>`,
      )
      .join("");
    return { attrs: {}, html: `${key}<ol class="xxd-dumbbell__list">${rows}</ol>` };
  },
};

/** 量表的 HTML（除了根元素本身）：表盘（SVG + 指针 + 中间的字）、两端的刻度数、图例。React 版渲染同一个结构。 */
export function gaugeInnerHtml(m) {
  const d = m.display;
  const center = d
    ? `<div class="xxd-gauge__center" aria-hidden="true"><span class="xxd-gauge__value">${esc(d.value)}${d.unit ? `<span class="xxd-gauge__unit">${esc(d.unit)}</span>` : ""}</span>${d.label ? `<span class="xxd-gauge__label">${esc(d.label)}</span>` : ""}${d.state ? `<span class="xxd-gauge__state" data-tone="${d.state.tone}">${esc(d.state.text)}</span>` : ""}</div>`
    : "";
  const pointer = m.needle ? needleSvg(m.needle, { viewBox: m.viewBox }) : "";
  const ends = m.ends ? `<div class="xxd-gauge__ends" aria-hidden="true" style="--gauge-ends-x:${m.ends.x}%"><span class="xxd-gauge__min">${esc(m.ends.min)}</span><span class="xxd-gauge__max">${esc(m.ends.max)}</span></div>` : "";
  const legend = m.legend.length ? legendHtml(m.legend.map((l) => ({ label: l.label, num: l.text, part: l.part }))) : "";
  return `<div class="xxd-gauge__dial" style="--gauge-cx:${m.center.x}%;--gauge-cy:${m.center.y}%">${m.svg}${pointer}${center}</div>${ends}${legend}`;
}

