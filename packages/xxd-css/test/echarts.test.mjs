// 图表（ECharts）对抗测试（ECHARTS-REVIEW-PLAN）：chartOptions 的换算。画出来的样子（高对比、图例让行、类目折行）由 audit 的 --only=chart 在浏览器里看。
import { afterEach, describe, expect, it, vi } from "vitest";
import { chartOptions, setLocale, watchChartTheme } from "../src/js/index.js";

const tokens = { dark: false, forced: false, ink: "#111111", muted: "#666666", muted2: "#9a968d", line: "#eeeeee", paper: "#ffffff", accent: "#3b74b8", gray9: "#898681", accent8: "#353433", gray10: "#7e7b77", gray11: "#6d6b67", success: "#2f7d4f", danger: "#c4372c", warning: "#b7791f", font: "sans-serif", mono: "monospace" };
const days = ["1日", "2日", "3日", "4日"];
const opt = (o) => chartOptions(o, { tokens });
const desc = (o) => opt(o).aria.label.description;

afterEach(() => setLocale(null));

describe("按图种套主题（D123）", () => {
  it("饼图每一块按分类色取，不写系列色；没有坐标轴；提示按单个数据", () => {
    const o = opt({ series: [{ type: "pie", data: [{ name: "图片", value: 3 }, { name: "视频", value: 2 }] }] });
    expect(o.series[0].color).toBeUndefined();
    expect(o.color.slice(0, 2)).toEqual(["#3b74b8", "#898681"]);
    expect(o.series[0].itemStyle).toMatchObject({ borderColor: "#ffffff", borderWidth: 1 });
    expect(o.xAxis).toBeUndefined();
    expect(o.yAxis).toBeUndefined();
    expect(o.grid).toBeUndefined();
    expect(o.tooltip.trigger).toBe("item");
  });
  it("折线、柱子按坐标轴提示；散点按单个数据", () => {
    expect(opt({ series: [{ type: "line", data: [1, 2] }] }).tooltip.trigger).toBe("axis");
    expect(opt({ xAxis: {}, yAxis: {}, series: [{ type: "scatter", data: [[1, 2]] }] }).tooltip.trigger).toBe("item");
    expect(opt({ series: [{ type: "line", data: [1] }] }).xAxis).toBeTruthy();
  });
});

describe("类目、刻度、参考线、背景线", () => {
  it("横向条形从上往下是给的顺序；作者写了 inverse 时照作者的（D125）", () => {
    expect(opt({ xAxis: { type: "value" }, yAxis: { type: "category", data: ["a", "b"] }, series: [{ type: "bar", data: [1, 2] }] }).yAxis.inverse).toBe(true);
    expect(opt({ xAxis: { type: "value" }, yAxis: { type: "category", data: ["a", "b"], inverse: false }, series: [{ type: "bar", data: [1, 2] }] }).yAxis.inverse).toBe(false);
  });
  it("刻度数写全了超过 5 个字符才缩写，整根轴一种写法；作者的 formatter 不动（D128）", () => {
    const big = opt({ xAxis: { data: days }, yAxis: { type: "value" }, series: [{ type: "bar", data: [2410000000, 5102000000, 1, 2] }] });
    expect(big.yAxis.axisLabel.formatter(6000000000)).toBe("60亿");
    expect(big.yAxis.axisLabel.formatter(0)).toBe("0");
    const small = opt({ xAxis: { data: days }, yAxis: { type: "value" }, series: [{ type: "bar", data: [10, 20, 30, 40] }] });
    expect(small.yAxis.axisLabel.formatter).toBeUndefined();
    // 堆起来以后才超过
    const stacked = opt({ xAxis: { data: days }, yAxis: { type: "value" }, series: [{ type: "bar", stack: "a", data: [6000, 1, 1, 1] }, { type: "bar", stack: "a", data: [6000, 1, 1, 1] }] });
    expect(stacked.yAxis.axisLabel.formatter(12000)).toBe("1.2万");
    const own = (v) => `${v} 个`;
    expect(opt({ xAxis: { data: days }, yAxis: { type: "value", axisLabel: { formatter: own } }, series: [{ type: "bar", data: [1e9, 1, 1, 1] }] }).yAxis.axisLabel.formatter).toBe(own);
  });
  it("参考线的字在线上方、图里面，写「名字 数」（D129）", () => {
    const o = opt({ xAxis: { data: days }, yAxis: {}, series: [{ type: "line", data: [1, 2, 3, 4], markLine: { data: [{ type: "average", name: "平均" }] } }] });
    expect(o.series[0].markLine.label.position).toBe("insideEndTop");
    expect(o.series[0].markLine.label.formatter({ name: "平均", value: 19.5 })).toBe("平均 19.5");
    expect(o.series[0].markLine.label.fontSize).toBe(12);
  });
  it("第 6 条起是背景线，只提醒一次（D131）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const series = Array.from({ length: 7 }, (_, i) => ({ name: `s${i}`, type: "line", data: [i, i + 1] }));
    const o = opt({ xAxis: { data: ["a", "b"] }, yAxis: {}, series });
    opt({ xAxis: { data: ["a", "b"] }, yAxis: {}, series });
    expect(o.series[5]).toMatchObject({ color: "#9a968d", lineStyle: { width: 1, type: "solid" }, emphasis: { disabled: true } });
    expect(o.series[4].color).toBe("#6d6b67");
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("超过 5 条")).length).toBeLessThanOrEqual(1);
    warn.mockRestore();
  });
  it("没有进场动画；作者写了 animation: true 才动（D130）", () => {
    expect(opt({ series: [{ type: "line", data: [1] }] }).animation).toBe(false);
    expect(opt({ animation: true, series: [{ type: "line", data: [1] }] }).animation).toBe(true);
  });
  it("刻度、图例的字 12px（D134）", () => {
    const o = opt({ legend: {}, xAxis: { data: days }, yAxis: {}, series: [{ name: "a", type: "line", data: [1] }] });
    expect(o.xAxis.axisLabel.fontSize).toBe(12);
    expect(o.legend.textStyle.fontSize).toBe(12);
  });
});

describe("图例（D127）", () => {
  it("折线只画线（看得出线型），柱子是方块；作者写了 data 时不动", () => {
    const o = opt({ legend: {}, xAxis: { data: days }, yAxis: {}, series: [{ name: "线", type: "line", data: [1] }, { name: "柱", type: "bar", data: [1] }] });
    expect(o.legend.data).toEqual([{ name: "线", itemStyle: { opacity: 0 } }, { name: "柱", icon: "rect" }]);
    expect(o.legend.itemWidth).toBe(24);
    expect(opt({ legend: { data: ["线"] }, series: [{ name: "线", type: "line", data: [1] }] }).legend.data).toEqual(["线"]);
  });
  it("图例换行时图区往下让", () => {
    const one = opt({ legend: {}, xAxis: { data: days }, yAxis: {}, series: [{ name: "a", type: "line", data: [1] }] });
    const many = opt({ legend: {}, xAxis: { data: days }, yAxis: {}, series: Array.from({ length: 5 }, (_, i) => ({ name: `一个很长很长的系列名字 ${i}`, type: "line", data: [1] })) });
    expect(one.grid.top).toBe(30);
    expect(many.grid.top).toBeGreaterThan(one.grid.top);
    expect(opt({ series: [{ type: "line", data: [1] }] }).grid.top).toBe(16);
  });
});

describe("读屏的一句话（D126）", () => {
  it("折线：几条、叫什么、横轴、从多少到多少、最高最低；不念序号、不念 NaN", () => {
    const s = desc({ xAxis: { data: days }, yAxis: {}, series: [{ name: "长文", type: "line", data: [42, null, "-", 96] }, { name: "图片", type: "line", data: [20, 22, 25, 40] }] });
    expect(s).toBe("折线图。2 条：长文、图片。横轴从 1日 到 4日。长文从 42 到 96，最高 96（4日），最低 42（1日）。图片从 20 到 40，最高 40（4日），最低 20（1日）。");
    expect(s).not.toMatch(/NaN|第0/);
  });
  it("柱子只说最高最低，大数加千分位、负数用减号", () => {
    expect(desc({ xAxis: { data: ["a", "b"] }, yAxis: {}, series: [{ type: "bar", data: [5102000000, -45] }] })).toBe("柱状图。横轴从 a 到 b。最高 5,102,000,000（a），最低 −45（b）。");
  });
  it("饼图写每块的数和占比（加起来 100%）", () => {
    expect(desc({ series: [{ type: "pie", data: [{ name: "图片", value: 1 }, { name: "视频", value: 1 }, { name: "文字", value: 1 }] }] })).toBe("饼图。图片 1（34%）、视频 1（33%）、文字 1（33%）。");
  });
  it("时间轴写日期，不写毫秒数", () => {
    const s = desc({ xAxis: { type: "time" }, yAxis: {}, series: [{ type: "line", data: [["2026-10-01", 3], ["2026-10-08", 5]] }] });
    expect(s).toContain("2026年10月8日");
    expect(s).not.toMatch(/\d{12}/);
  });
  it("没有数据；英文；作者自己写的描述优先", () => {
    expect(desc({ xAxis: { data: [] }, yAxis: {}, series: [{ type: "line", data: [] }] })).toBe("图表，没有数据");
    setLocale("en");
    expect(desc({ xAxis: { data: days }, yAxis: {}, series: [{ name: "Posts", type: "line", data: [1, 3] }] })).toBe("Line chart. 1 series: Posts. X axis 1日 to 4日. Posts goes from 1 to 3, highest 3 (2日), lowest 1 (1日).");
    expect(desc({ aria: { label: { description: "自己写的" } }, series: [{ type: "line", data: [1] }] })).toBe("自己写的");
  });
});

describe("watchChartTheme（D132）", () => {
  const fake = () => {
    const dom = document.createElement("div");
    document.body.append(dom);
    let disposed = false;
    const chart = { setOption: vi.fn(), resize: vi.fn(), dispatchAction: vi.fn(), getDom: () => dom, isDisposed: () => disposed, dispose: () => (disposed = true) };
    return { dom, chart };
  };
  it("令牌没变时不重画；换主题时重画", async () => {
    const { chart } = fake();
    const stop = watchChartTheme(chart, () => chartOptions({ series: [{ type: "line", data: [1] }] }));
    const first = chart.setOption.mock.calls.length;
    document.documentElement.style.setProperty("--probe", "1");
    await new Promise((r) => setTimeout(r, 0));
    expect(chart.setOption.mock.calls.length).toBe(first);
    document.documentElement.setAttribute("data-theme", "dark");
    await new Promise((r) => setTimeout(r, 0));
    expect(chart.setOption.mock.calls.length).toBe(first + 1);
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-theme");
    stop();
  });
  it("触屏上点图外面收起提示；图销毁后自己解绑", async () => {
    const { chart } = fake();
    watchChartTheme(chart, () => ({}));
    document.body.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }));
    expect(chart.dispatchAction).toHaveBeenCalledWith({ type: "hideTip" });
    chart.dispose();
    chart.dispatchAction.mockClear();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }));
    document.body.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }));
    expect(chart.dispatchAction).not.toHaveBeenCalled();
  });
});
