// 量表（GAUGE-PLAN G1 / G2）：几何、边界、颜色表和 CSS 对得上、声明式和读屏属性。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as lib from "../src/js/gauge.js";
import { gauge, gaugeOptionsFrom, initGauges, useGauge } from "../src/js/chart.js";

const { GAUGE_PAINT, arcPath, gaugeColors, gaugeModel, polar, withUnit, zoneOf } = lib;
useGauge(lib);

const css = readFileSync(join(import.meta.dirname, "../src/css/chart.css"), "utf8");
const paths = (svg) => [...svg.matchAll(/<path d="([^"]+)"[^>]*class="xxd-gauge__([\w-]+)"/g)].map((m) => ({ d: m[1], role: m[2] }));

describe("几何", () => {
  it("角度 0 在 12 点钟，顺时针", () => {
    expect(polar(10, 0)).toEqual({ x: 0, y: -10 });
    expect(polar(10, 90)).toEqual({ x: 10, y: 0 });
    expect(polar(10, 180)).toEqual({ x: 0, y: 10 });
  });

  it("超过 180° 的弧分段画，一整圈也画得出来；空弧不画", () => {
    expect(arcPath(50, 0, 360).match(/A/g)).toHaveLength(2);
    expect(arcPath(50, -135, 135).match(/A/g)).toHaveLength(2);
    expect(arcPath(50, 0, 90).match(/A/g)).toHaveLength(1);
    expect(arcPath(50, 10, 10)).toBe("");
  });

  it("三种形状的 viewBox 和圆心", () => {
    expect(gaugeModel({ value: 1, shape: "ring" }).center).toEqual({ x: 50, y: 50 });
    expect(gaugeModel({ value: 1, shape: "half" }).viewBox).toBe("-57 -57 114 61");
    expect(gaugeModel({ value: 1, shape: "nope" }).shape).toBe("arc");
  });
});

describe("边界不出错", () => {
  it("小于最小、大于最大：夹到两头；读屏念原来的数", () => {
    const over = gaugeModel({ value: 130, label: "x" });
    expect(over.aria["aria-valuenow"]).toBe(100);
    expect(over.display.value).toBe("130");
    expect(gaugeModel({ value: -5, label: "x" }).svg).not.toContain("xxd-gauge__fill");
  });

  it("最小等于最大、最大小于最小、不是数字", () => {
    expect(() => gaugeModel({ value: 5, min: 10, max: 10 })).not.toThrow();
    expect(gaugeModel({ value: 5, min: 10, max: 0 }).aria["aria-valuemin"]).toBe(0);
    expect(gaugeModel({ value: "abc" }).aria["aria-valuenow"]).toBe(0);
  });

  it("区间倒过来写也一样", () => {
    const a = gaugeModel({ value: [26, 12], min: -10, max: 40, unit: "°C" });
    expect(a.display.value).toBe("12–26");
    expect(a.aria).toMatchObject({ role: "group", "aria-label": "12–26°C" });
  });

  it("分段加起来超过满额：截掉，不画出圈", () => {
    const m = gaugeModel({ shape: "ring", max: 50, parts: [{ label: "a", value: 40 }, { label: "b", value: 40 }] });
    const parts = paths(m.svg).filter((p) => p.role.startsWith("part"));
    expect(parts).toHaveLength(2);
    expect(m.legend.map((l) => l.text)).toEqual(["40", "40"]);
  });

  it("分格整格才亮；多环最多 3 环", () => {
    const lit = (value) => paths(gaugeModel({ shape: "ring", segments: 8, max: 8, value }).svg).filter((p) => p.role === "fill").length;
    expect([lit(0), lit(4.9), lit(5), lit(8)]).toEqual([0, 4, 5, 8]);
    const rings = gaugeModel({ shape: "ring", rings: [1, 2, 3, 4].map((v) => ({ label: `r${v}`, value: v, max: 4 })) });
    expect(rings.legend).toHaveLength(3);
  });
});

describe("区段和目标", () => {
  const zones = [{ from: 80, to: 90, tone: "warning" }, { from: 90, tone: "danger" }];
  it("落在交界上算后一段；进了区段填充换色、写出状态", () => {
    expect(zoneOf([{ from: 80, to: 90, tone: "warning" }, { from: 90, to: 100, tone: "danger" }], 90).tone).toBe("danger");
    const m = gaugeModel({ value: 94, unit: "%", zones, target: 80, label: "额度" });
    expect(paths(m.svg).map((p) => p.role)).toContain("fill-danger");
    expect(m.display.state).toEqual({ tone: "danger", text: "超限" });
    expect(m.aria["aria-valuetext"]).toBe("94%，超限，目标 80%");
    expect(m.aria["aria-label"]).toBe("额度");
  });

  it("英文", () => {
    const m = gaugeModel({ value: 94, unit: "%", zones, target: 80, locale: "en" });
    expect(m.aria["aria-valuetext"]).toBe("94%, Over limit, target 80%");
    expect(withUnit("3", "GB")).toBe("3 GB");
  });

  it("有指针时不画填充，指针角度对", () => {
    const m = gaugeModel({ value: 50, needle: true });
    expect(m.svg).not.toContain("xxd-gauge__fill");
    expect(m.needle.angle).toBe(0);
    expect(gaugeModel({ value: 50, needle: true, shape: "ring" }).needle).toBeNull();
  });
});

describe("颜色只走令牌", () => {
  it("CSS 里每个 .xxd-gauge__<角色> 的颜色和 GAUGE_PAINT 一致", () => {
    for (const [role, token] of Object.entries(GAUGE_PAINT)) {
      const cls = role === "needle" ? "needle-line" : role;
      const rule = new RegExp(`\\.xxd-gauge__${cls} \\{ stroke: var\\(${token}\\); \\}`);
      expect(css, role).toMatch(rule);
    }
  });

  it("小程序模式把颜色写成属性，线头按传进来的", () => {
    const vars = Object.fromEntries(Object.values(GAUGE_PAINT).map((t, i) => [t, `#00000${i % 10}`]));
    const m = gaugeModel({ value: 40, colors: gaugeColors(vars), cap: "round" });
    expect(m.svg).not.toContain("class=\"xxd-gauge__track");
    expect(m.svg).toContain('stroke-linecap="round"');
  });
});

describe("页面里", () => {
  it("声明式：data-* 画出来，有 role=meter 和名字", () => {
    document.body.innerHTML = '<div class="xxd-gauge" data-gauge data-value="72" data-unit="%" data-label="空间已用" data-target="80" data-zones="80-90:warning,90:danger"></div>';
    initGauges(document);
    const el = document.querySelector(".xxd-gauge");
    expect(el.getAttribute("role")).toBe("meter");
    expect(el.getAttribute("aria-label")).toBe("空间已用");
    expect(el.getAttribute("aria-valuetext")).toBe("72%，目标 80%");
    expect(el.querySelector(".xxd-gauge__value").textContent).toBe("72%");
    expect(el.querySelector(".xxd-gauge__ends").textContent).toBe("0100");
  });

  it("解析 data-parts / data-rings / 负数区段", () => {
    const el = document.createElement("div");
    el.dataset.parts = "图片:38;视频:22";
    el.dataset.rings = "写作:3/5";
    el.dataset.zones = "-10-0:danger:冰点以下";
    const o = gaugeOptionsFrom(el);
    expect(o.parts).toEqual([{ label: "图片", value: "38" }, { label: "视频", value: "22" }]);
    expect(o.rings).toEqual([{ label: "写作", value: "3", max: "5" }]);
    expect(o.zones).toEqual([{ from: "-10", to: "0", tone: "danger", label: "冰点以下" }]);
  });

  it("作者自己写的 aria-label 保留；重画不丢", () => {
    const el = document.createElement("div");
    el.setAttribute("aria-label", "磁盘");
    gauge(el, { value: 10 });
    gauge(el, { value: 20 });
    expect(el.getAttribute("aria-label")).toBe("磁盘");
    expect(el.getAttribute("aria-valuenow")).toBe("20");
  });
});
