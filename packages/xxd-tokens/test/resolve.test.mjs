// 令牌求值（src/resolve.js）：小程序没有 color-mix()，由它算；算出来要和浏览器一样，对比度门禁照样过。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCENT_PRESETS, contrast, toRgb } from "../src/accent.js";
import { appearanceVars, formatColor, mixSrgb, parseColor, resolveValue, resolveVars } from "../src/resolve.js";
import { mixExpressions } from "./mix-cases.mjs";

const modes = JSON.parse(readFileSync(new URL("../dist/tokens.json", import.meta.url), "utf8"));
const chrome = JSON.parse(readFileSync(new URL("./fixtures/color-mix.chrome.json", import.meta.url), "utf8"));

test("tokens.json 有主色两块（accent / darkAccent）", () => {
  assert.equal(modes.accent["--action"], "var(--action-custom)");
  assert.equal(modes.darkAccent["--action"], "var(--action-custom-dark)");
});

test("parseColor / formatColor", () => {
  assert.deepEqual(parseColor("#abc"), [170, 187, 204, 1]);
  assert.deepEqual(parseColor("rgba(17, 17, 17, 0.16)"), [17, 17, 17, 0.16]);
  assert.deepEqual(parseColor("rgb(1 2 3 / 50%)"), [1, 2, 3, 0.5]);
  assert.deepEqual(parseColor("transparent"), [0, 0, 0, 0]);
  assert.equal(parseColor("var(--x)"), null);
  assert.equal(formatColor([17, 17, 17, 1]), "#111111");
  assert.equal(formatColor([17, 17, 17, 0.24]), "rgba(17, 17, 17, 0.24)");
});

test("color-mix 的百分比规则：缺一个用 100 减；和不到 100 降透明度", () => {
  assert.deepEqual(mixSrgb([255, 0, 0, 1], 25, [0, 0, 255, 1], null).map(Math.round), [64, 0, 191, 1]);
  assert.deepEqual(mixSrgb([255, 0, 0, 1], 20, [0, 0, 255, 1], 30).map((v) => Math.round(v * 100) / 100), [102, 0, 153, 0.5]);
  assert.deepEqual(mixSrgb([255, 0, 0, 1], null, [0, 0, 255, 1], null).map(Math.round), [128, 0, 128, 1]);
});

test("和 Chrome 算的 color-mix 一样（每个通道差 ≤ 1，透明度差 ≤ 0.005）", () => {
  const list = mixExpressions();
  // 色阶以后令牌里的 color-mix 少了很多（主色的灰和选中底改成了色阶里的某一级），剩下的组件里的照样对
  assert.ok(list.length > 50, `只有 ${list.length} 个表达式`);
  for (const expr of list) {
    const want = chrome[expr];
    assert.ok(want, `对照表里没有 ${expr}：pnpm --filter @xxd/tokens fixture:color-mix`);
    const got = parseColor(resolveValue(expr, {}));
    assert.ok(got, `算不出 ${expr}`);
    for (let i = 0; i < 3; i += 1) assert.ok(Math.abs(got[i] - want[i]) <= 1, `${expr}: ${got.join(",")} ≠ ${want.join(",")}`);
    assert.ok(Math.abs(got[3] - want[3]) <= 0.005, `${expr}: 透明度 ${got[3]} ≠ ${want[3]}`);
  }
});

test("resolveValue：var() 和缺省值、嵌套、循环引用", () => {
  const vars = { "--a": "#111111", "--b": "var(--a)", "--c": "0 0 0 2px color-mix(in srgb, var(--b) 24%, transparent)", "--loop": "var(--loop)" };
  assert.equal(resolveValue("var(--b)", vars), "#111111");
  assert.equal(resolveValue("var(--missing, var(--a))", vars), "#111111");
  assert.equal(resolveValue("var(--c)", vars), "0 0 0 2px rgba(17, 17, 17, 0.24)");
  assert.equal(resolveVars(vars)["--loop"], "var(--loop)");
  assert.equal(resolveValue("var(--nothing)", vars), "var(--nothing)");
});

test("appearanceVars：缺省就是亮色、直角、墨色；算完不剩 var() 和 color-mix()", () => {
  const { theme, accent, vars } = appearanceVars({}, { modes });
  assert.equal(theme, "light");
  assert.equal(accent, "");
  assert.equal(vars["--action"], "#111111");
  assert.equal(vars["--r-md"], "0px");
  for (const [name, value] of Object.entries(vars)) assert.ok(!/var\(|color-mix\(/.test(value), `${name}: ${value}`);
});

test("appearanceVars：跟随系统、圆角、紧凑、手机、lock", () => {
  assert.equal(appearanceVars({ theme: "system" }, { modes, system: "dark" }).vars["--paper"], "#201f1a");
  assert.equal(appearanceVars({ theme: "light" }, { modes, system: "dark" }).vars["--paper"], "#ffffff");
  assert.equal(appearanceVars({ corners: "rounded" }, { modes }).vars["--r-md"], "10px");
  assert.equal(appearanceVars({ corners: "rounded" }, { modes, lock: { corners: "square" } }).vars["--r-md"], "0px");
  assert.equal(appearanceVars({ density: "compact" }, { modes }).vars["--control-h"], "32px");
  assert.equal(appearanceVars({}, { modes, coarse: true }).vars["--hit-min"], "44px");
});

test("appearanceVars：派生色（extra）跟着主色和亮暗走", () => {
  const extra = { "--mix-action-24-transparent": "color-mix(in srgb, var(--action) 24%, transparent)" };
  assert.equal(appearanceVars({}, { modes, extra }).vars["--mix-action-24-transparent"], "rgba(17, 17, 17, 0.24)");
  assert.equal(appearanceVars({ theme: "dark" }, { modes, extra }).vars["--mix-action-24-transparent"], "rgba(243, 240, 234, 0.24)");
  const blue = appearanceVars({ accent: "#1d9bf0" }, { modes, extra }).vars;
  assert.match(blue["--mix-action-24-transparent"], /^rgba\(\d+, \d+, \d+, 0\.24\)$/);
  assert.notEqual(blue["--mix-action-24-transparent"], "rgba(17, 17, 17, 0.24)");
});

test("算好的值照样过对比度门禁：亮 / 暗 × 墨色 + 18 个主色", () => {
  for (const theme of ["light", "dark"]) {
    for (const preset of ACCENT_PRESETS) {
      const { vars } = appearanceVars({ theme, accent: preset.id }, { modes });
      const rgb = (name) => toRgb(vars[name]);
      const label = `${theme} ${preset.zh}`;
      for (const surface of ["--paper", "--bg", "--wash", "--wash-strong", "--selected-bg"]) assert.ok(contrast(rgb("--ink"), rgb(surface)) >= 4.5, `${label}: --ink on ${surface}`);
      // 主色的文字版保证在纸上和选中底上 ≥ 4.5（accent.js 的约定，和网页版同一条）
      for (const surface of ["--paper", "--selected-bg"]) assert.ok(contrast(rgb("--action-text"), rgb(surface)) >= 4.5, `${label}: --action-text on ${surface}`);
      for (const surface of ["--paper", "--bg"]) assert.ok(contrast(rgb("--muted"), rgb(surface)) >= 4.5, `${label}: --muted on ${surface}`);
      assert.ok(contrast(rgb("--on-action"), rgb("--action-fill")) >= 4.5, `${label}: 实心底上的字`);
      assert.ok(contrast(rgb("--on-action"), rgb("--action-fill-hover")) >= 4.5, `${label}: 实心底按下时的字`);
      assert.ok(contrast(rgb("--action"), rgb("--paper")) >= 3, `${label}: 强调标记`);
    }
  }
});
