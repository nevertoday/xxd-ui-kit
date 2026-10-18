// 颜色色阶（docs/maintainers/COLOR-SCALE-PLAN.md S1）：生成器的门禁。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCENT_PRESETS } from "../src/accent.js";
import { checkScale, generateFamilies, generateScale, hexToOklch, oklchToHex, SCALE_ROLES } from "../src/scales.js";

test("OKLCH 来回转一圈，颜色不变（每个通道差 ≤ 1）", () => {
  for (const hex of ["#111111", "#fdfcfb", "#b42318", "#4386ba", "#ffcc00", "#279479"]) {
    const back = oklchToHex(...hexToOklch(hex));
    for (let i = 1; i < 7; i += 2) assert.ok(Math.abs(parseInt(back.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16)) <= 1, `${hex} → ${back}`);
  }
});

test("12 级、12 个用途名；1–8 级亮色越来越深、暗色越来越亮", () => {
  assert.equal(SCALE_ROLES.length, 12);
  for (const mode of ["light", "dark"]) {
    const { steps } = generateScale("#4386ba", { mode });
    assert.equal(steps.length, 12);
    const L = steps.slice(0, 8).map((h) => hexToOklch(h)[0]);
    for (let i = 1; i < 8; i += 1) assert.ok(mode === "light" ? L[i] < L[i - 1] : L[i] > L[i - 1], `${mode} 第 ${i + 1} 级`);
  }
});

test("五族 × 亮暗 × 墨色和每个主色预设：对比度门禁都过", () => {
  for (const p of ACCENT_PRESETS) {
    const f = generateFamilies({ accent: p.id });
    for (const mode of ["light", "dark"]) for (const [k, v] of Object.entries(f[mode])) {
      const gray = k === "gray" || (!p.id && k === "accent");
      assert.deepEqual(checkScale(v, { kind: gray ? "gray" : "color" }), [], `${p.name} ${mode} ${k}`);
    }
  }
});

test("灰锚在现有令牌上：--bg、--wash、--line、--muted、--ink 等和 tokens.css 的值差不超过一档", () => {
  const css = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
  const value = (name) => css.match(new RegExp(`${name}: (#[0-9a-f]{6});`))[1];
  const { steps } = generateScale("", { mode: "light", kind: "gray" });
  const map = { "--bg": 1, "--wash": 3, "--wash-strong": 4, "--line": 6, "--line-strong": 7, "--line-control": 9, "--muted": 11, "--ink": 12 };
  for (const [name, step] of Object.entries(map)) {
    const [L1] = hexToOklch(value(name));
    const [L2] = hexToOklch(steps[step - 1]);
    assert.ok(Math.abs(L1 - L2) <= 0.01, `${name} ${value(name)} ↔ 第 ${step} 级 ${steps[step - 1]}`);
  }
});

test("原样：9 级就是原色，上面的字仍然 ≥ 4.5（白字不够换近黑字）", () => {
  for (const hex of ["#ffcc00", "#1d9bf0", "#b7665c"]) {
    const s = generateScale(hex, { exact: true });
    assert.equal(s.steps[8], hex);
    assert.ok(checkScale(s).every((b) => b.startsWith("9 级在")), `${hex}：除了「9 级在纸上 3:1」（原样的代价）都要过`);
  }
});
