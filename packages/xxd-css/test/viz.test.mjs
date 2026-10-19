// 图型（CHART-TYPES-PLAN H1 / H2）：换算的边界、颜色只走令牌、声明式和读屏。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as lib from "../src/js/viz.js";
import { initViz, useViz, viz, vizFrom } from "../src/js/viz-dom.js";
import { sparkline } from "../src/js/chart.js";

const { barsModel, calendarModel, dumbbellModel, heatLevel, largestRemainder, matrixModel, proportionModel, waffleModel } = lib;
useViz(lib);
const css = readFileSync(join(import.meta.dirname, "../src/css/chart.css"), "utf8");

describe("换算", () => {
  it("最大余数法：加起来正好是总数；全 0、负数、空都不出错", () => {
    expect(largestRemainder([49, 27.4, 13.9, 5, 3.2])).toEqual([50, 28, 14, 5, 3]);
    expect(largestRemainder([1, 1, 1]).reduce((a, b) => a + b)).toBe(100);
    expect(largestRemainder([0, 0])).toEqual([0, 0]);
    expect(largestRemainder([-3, 5])).toEqual([0, 100]);
    expect(largestRemainder([])).toEqual([]);
  });

  it("条形榜：按大小排、比例按最大值、坏数据跳过；漏斗保留顺序并写出留下多少", () => {
    const m = barsModel([{ label: "a", value: 50 }, { label: "b", value: "x" }, { label: "c", value: 100 }]);
    expect(m.rows.map((r) => [r.label, r.frac])).toEqual([["c", 1], ["a", 0.5]]);
    const f = barsModel([{ label: "访问", value: 1000 }, { label: "注册", value: 420 }], { variant: "funnel" });
    expect(f.rows.map((r) => r.note)).toEqual(["", "留下 42%"]);
    expect(barsModel([{ label: "a", value: 0 }]).rows[0].frac).toBe(0);
  });

  it("正负条：−1…1，负数用真正的减号", () => {
    const m = barsModel([{ label: "涨", value: 12 }, { label: "跌", value: -6 }], { variant: "diverging", unit: "%" });
    expect(m.rows.map((r) => [r.frac, r.text])).toEqual([[1, "+12%"], [-0.5, "−6%"]]);
  });

  it("按单位切格：最多 60 格", () => {
    expect(barsModel([{ label: "a", value: 6 }], { step: 1 }).rungs).toBe(6);
    expect(barsModel([{ label: "a", value: 6000 }], { step: 1 }).rungs).toBe(60);
  });

  it("构成、百格：百分比加起来 100；百格正好 100 格；最多 5 段", () => {
    const p = proportionModel([1, 1, 1].map((v, i) => ({ label: `p${i}`, value: v })));
    expect(p.parts.map((x) => parseInt(x.percent)).reduce((a, b) => a + b)).toBe(100);
    const w = waffleModel([{ label: "a", value: 2 }, { label: "b", value: 1 }]);
    expect(w.cells).toHaveLength(100);
    expect(w.cells.filter((c) => c === 0)).toHaveLength(67);
    expect(w.note).toBe("1 格 = 1%");
    expect(proportionModel(Array.from({ length: 8 }, (_, i) => ({ label: `${i}`, value: 1 }))).parts).toHaveLength(5);
  });

  it("热力分档：0 是没有，1–4 按最大值的四分之一", () => {
    expect([0, 1, 25, 26, 100, -1, null].map((v) => heatLevel(v, 100))).toEqual([0, 1, 1, 2, 4, 0, 0]);
  });

  it("日历：一周一列、周一在上；未来的日子不算；跨年的数据合并", () => {
    const m = calendarModel({ "2026-10-19": 5, "2026-01-01": 2, "2026-01-01T09:00": 1, "2024-01-01": 99 }, { end: "2026-10-19", weeks: 53 });
    expect(m.columns).toHaveLength(53);
    expect(m.columns.at(-1)[0]).toMatchObject({ date: "2026-10-19", value: 5 }); // 2026-10-19 是周一
    expect(m.columns.at(-1)[1].level).toBe(-1);
    expect(m.max).toBe(5);
    expect(m.total).toBe(8);
    expect(m.label).toBe("365 天里有 2 天有记录，合计 8，最多一天 5");
    expect(calendarModel({}, { end: "2026-10-19", locale: "en" }).label).toBe("No activity");
  });

  it("矩阵：缺的格子是空，最大那格写进总结", () => {
    const m = matrixModel({ rows: ["一", "二"], cols: ["9", "10"], values: [[1, 4], [null]] }, { label: "时段" });
    expect(m.cells[1][1]).toMatchObject({ value: null, level: 0, text: "" });
    expect(m.label).toBe("时段，一 × 10 4");
  });

  it("前后对比：位置在 0–1，变化带符号", () => {
    const m = dumbbellModel([{ label: "a", from: 14, to: 6 }, { label: "b", from: 9, to: "x" }], { min: 0, max: 20 });
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0]).toMatchObject({ a: 0.7, b: 0.3, delta: "−8" });
  });
});

describe("颜色只走令牌", () => {
  it("分类色和图表一样（主色 9、灰 9 / 11 / 10、主色 8），热力只用 --heat-*", () => {
    for (const [i, t] of ["--gray-9", "--gray-11", "--gray-10", "--accent-8"].entries()) {
      for (const k of ["legend__key", "proportion__part", "waffle__cell"]) expect(css).toMatch(new RegExp(`\\.xxd-${k}\\[data-part="${i + 1}"\\] \\{ background: var\\(${t}\\); \\}`));
    }
    for (const l of [1, 2, 3, 4]) expect(css).toMatch(new RegExp(`\\.xxd-heatmap__cell\\[data-level="${l}"\\] \\{ background: var\\(--heat-${l}\\); \\}`));
  });
});

describe("页面里", () => {
  it("声明式条形榜：有序列表、比例写在 --value、重点和单位", () => {
    document.body.innerHTML = '<ol class="xxd-bars" style="max-width:400px" data-viz="bars" data-unit="人" data-highlight="b" data-step="1000" data-items="a:2000;b:5000"></ol>';
    initViz(document);
    const el = document.querySelector(".xxd-bars");
    expect([...el.querySelectorAll(".xxd-bars__item")].map((li) => [li.style.getPropertyValue("--value"), li.textContent])).toEqual([["1", "b5,000 人"], ["0.4", "a2,000 人"]]);
    expect(el.hasAttribute("data-emphasis")).toBe(true);
    expect(el.style.getPropertyValue("--rungs")).toBe("5");
    expect(el.style.maxWidth).toBe("400px");
  });

  it("百格、构成：role=group 和整句；格子 aria-hidden", () => {
    const el = document.createElement("div");
    viz(el, "waffle", [{ label: "推荐", value: 46 }, { label: "搜索", value: 54 }], { label: "来源" });
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("来源，推荐 46%，搜索 54%");
    expect(el.querySelectorAll(".xxd-waffle__cell")).toHaveLength(100);
    expect(el.querySelector(".xxd-waffle__grid").getAttribute("aria-hidden")).toBe("true");
  });

  it("解析 data-*：日历的 JSON、矩阵、前后对比", () => {
    const el = document.createElement("div");
    Object.assign(el.dataset, { viz: "heatmap", variant: "matrix", rows: "一,二", cols: "9,10", values: "1,4;0,8", numbers: "" });
    expect(vizFrom(el)).toEqual(["matrix", { rows: ["一", "二"], cols: ["9", "10"], values: [["1", "4"], ["0", "8"]] }, expect.objectContaining({ numbers: true })]);
    const d = document.createElement("div");
    Object.assign(d.dataset, { viz: "dumbbell", rows: "写第一篇:14>6" });
    expect(vizFrom(d)[1]).toEqual([{ label: "写第一篇", from: "14", to: "6" }]);
  });

  it("迷你柱：0 不画、柱从底边长", () => {
    const svg = sparkline([3, 0, 6], { type: "bar", width: 30, height: 12 });
    expect(svg.match(/<rect/g)).toHaveLength(2);
    expect(svg).toContain('y="0.0" width="9.0" height="12.0"');
  });
});

describe("查漏补缺（CHART-TYPES-PLAN 8.1）", () => {
  it("条形榜：对照值、参考线、刻度、旁注、空数据", () => {
    const m = barsModel([{ label: "a", value: 2400, compare: 2000, note: "历史最高" }, { label: "b", value: 1000 }], { axis: true, mark: 1800, markLabel: "平均", compareLabel: "去年", valueLabel: "今年", unit: "人" });
    expect(m.rows[0]).toMatchObject({ compareFrac: 0.833, note: "去年 2,000 人，历史最高" });
    expect(m.mark).toEqual({ at: 0.75, text: "平均 1,800 人" });
    expect(m.axis.ticks.map((t) => t.text)).toEqual(["0", "1,000", "2,000"]);
    expect(m.key).toEqual({ value: "今年", compare: "去年", mark: "平均 1,800 人" });
    expect(barsModel([]).empty).toBe("没有数据");
    expect(barsModel([], { locale: "en" }).empty).toBe("No data");
  });

  it("瀑布：合计从 0 起，增减接着上一行；增减带符号", () => {
    const m = barsModel([{ label: "毛收入", value: 100, total: true }, { label: "退款", value: -20 }, { label: "净收入", value: 80, total: true }], { variant: "waterfall" });
    expect(m.rows.map((r) => [r.from, r.to, r.text])).toEqual([[0, 1, "100"], [0.8, 1, "−20"], [0, 0.8, "80"]]);
  });

  it("大数字缩写、构成条按总量比长短、量表从原点往两边长", () => {
    expect(barsModel([{ label: "a", value: 12480 }], { compact: true }).rows[0].text).toBe("1.2万");
    expect(barsModel([{ label: "a", value: 12480 }], { compact: true, locale: "en" }).rows[0].text).toBe("12.5K");
    expect(proportionModel([{ label: "a", value: 30 }], { max: 60 }).scale).toBe(0.5);
    const g = lib.gaugeModel({ value: -12, min: -50, max: 50, origin: 0 });
    expect(g.svg).toContain("xxd-gauge__fill");
    expect(g.svg).toContain("xxd-gauge__tick");
  });

  it("声明式：data-items 里的对照值、data-total、空数据写成一行字", () => {
    document.body.innerHTML = '<ol class="xxd-bars" data-viz="bars" data-variant="waterfall" data-total="毛收入,净收入" data-items="毛收入:100;退款:-20;净收入:80"></ol><ol class="xxd-bars" data-viz="bars" data-items=""></ol>';
    initViz(document);
    const [w, e] = document.querySelectorAll(".xxd-bars");
    expect([...w.querySelectorAll("[data-total]")].length).toBe(2);
    expect(w.querySelector(".xxd-bars__item:nth-child(2)").style.getPropertyValue("--from")).toBe("0.8");
    expect(e.textContent).toBe("没有数据");
    const el = document.createElement("ol");
    Object.assign(el.dataset, { viz: "bars", items: "a:2400/2000", compareLabel: "去年" });
    expect(vizFrom(el)[1][0]).toMatchObject({ value: "2400", compare: "2000" });
  });
});

it("声明式画两次（xxd.js 和 viz.js 各调一次 initViz）结果一样：作者写的 data-* 不被画出来的属性盖掉", () => {
  document.body.innerHTML = '<ol class="xxd-bars" data-viz="bars" data-mark="1800" data-mark-label="平均" data-axis data-items="a:2400;b:1000"></ol>';
  initViz(document);
  const first = document.body.innerHTML;
  initViz(document);
  expect(document.body.innerHTML).toBe(first);
  expect(document.querySelector(".xxd-bars").hasAttribute("data-marked")).toBe(true);
});
