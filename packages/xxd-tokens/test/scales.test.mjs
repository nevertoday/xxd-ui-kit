// 颜色色阶（docs/maintainers/COLOR-SCALE-PLAN.md S1）：生成器的门禁。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCENT_PRESETS } from "../src/accent.js";
import { checkScale, generateFamilies, generateScale, GRAY_PINS, hexToOklch, oklchToHex, SCALE_ROLES } from "../src/scales.js";

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

// COLOR-REVIEW-PLAN D74–D78：极端的自定义主色也不能让东西看不见
import { accentPalette, accentClash, contrast as _c, toRgb as _rgb } from "../src/accent.js";
const ratio = (a, b) => _c(_rgb(a), _rgb(b));
const EXTREME = ["#ffff00", "#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#808080", "#f0f0f0", "#111111", "#ff69b4", "#1d9bf0", "#ffd700", "#00ffff", "#b42318", "#15803d", "#b45309"];
const ALL_ACCENTS = [...ACCENT_PRESETS.filter((p) => p.id).map((p) => p.id), ...EXTREME];
const MUTED = { light: GRAY_PINS.light[11], dark: GRAY_PINS.dark[11] };
const PAPER = { light: "#ffffff", dark: "#201f1a" };

test("极端自定义主色 × 自动 / 原样 × 亮暗：标记在纸、页面底、wash、选中底上 ≥ 3；实心底上的字 ≥ 4.5", () => {
  const bad = [];
  for (const accent of ALL_ACCENTS) for (const exact of [false, true]) {
    const p = accentPalette(accent, "", { exact });
    for (const mode of ["light", "dark"]) {
      const d = mode === "dark" ? "-dark" : "";
      const mark = p[`--action-custom${d}`];
      const bgs = { 纸: PAPER[mode], 页面底: p[`--gray-1-custom${d}`], wash: p[`--gray-3-custom${d}`], 选中底: p[`--accent-4-custom${d}`] };
      for (const [n, bg] of Object.entries(bgs)) if (ratio(mark, bg) < 3) bad.push(`${accent} ${exact ? "原样" : "自动"} ${mode} 标记在${n}上 ${ratio(mark, bg).toFixed(2)}`);
      if (ratio(p[`--on-action-custom${d}`], p[`--action-fill-custom${d}`]) < 4.5) bad.push(`${accent} ${mode} 实心底上的字`);
      if (ratio(p[`--on-mark-custom${d}`], mark) < 4.5) bad.push(`${accent} ${mode} 标记色上的字`);
    }
  }
  assert.deepEqual(bad, []);
});

test("灰的次要文字（--muted）在每个主色的页面底、wash、wash-strong、选中底上 ≥ 4.5（D75）", () => {
  const bad = [];
  for (const accent of ALL_ACCENTS) {
    const p = accentPalette(accent);
    for (const mode of ["light", "dark"]) {
      const d = mode === "dark" ? "-dark" : "";
      for (const k of ["gray-1", "gray-3", "gray-4", "accent-3", "accent-4"]) { const r = ratio(MUTED[mode], p[`--${k}-custom${d}`]); if (r < 4.5) bad.push(`${accent} ${mode} --muted 在 ${k} 上 ${r.toFixed(2)}`); }
    }
  }
  assert.deepEqual(bad, []);
});

test("热力格每一级上的数字 ≥ 4.5（D74）：墨色亮暗 + 每个主色", () => {
  const bad = [];
  // 墨色：tokens.css 里的值
  const fam = generateFamilies({});
  const ink = { light: [fam.light.gray.steps[6], fam.light.gray.steps[8], fam.light.gray.steps[10], fam.light.accent.steps[8]], dark: [fam.dark.gray.steps[6], fam.dark.gray.steps[9], fam.dark.gray.steps[10], fam.dark.accent.steps[10]] };
  const inkOn = { light: [GRAY_PINS.light[12], GRAY_PINS.light[12], "#ffffff", "#ffffff"], dark: [GRAY_PINS.dark[12], "#171612", "#171612", "#171612"] };
  for (const mode of ["light", "dark"]) ink[mode].forEach((cell, i) => { if (ratio(cell, inkOn[mode][i]) < 4.5) bad.push(`墨色 ${mode} ${i + 1} 级 ${ratio(cell, inkOn[mode][i]).toFixed(2)}`); });
  for (const accent of ALL_ACCENTS) for (const exact of [false, true]) {
    const p = accentPalette(accent, "", { exact });
    for (const mode of ["light", "dark"]) {
      const d = mode === "dark" ? "-dark" : "";
      const cells = [p[`--accent-5-custom${d}`], p[`--accent-7-custom${d}`], p[`--action-custom${d}`], p[`--accent-11-custom${d}`]];
      const on = [GRAY_PINS[mode][12], GRAY_PINS[mode][12], p[`--on-mark-custom${d}`], p[`--gray-1-custom${d}`]];
      cells.forEach((cell, i) => { if (ratio(cell, on[i]) < 4.5) bad.push(`${accent} ${exact ? "原样" : "自动"} ${mode} ${i + 1} 级 ${ratio(cell, on[i]).toFixed(2)}`); });
    }
  }
  assert.deepEqual(bad, []);
});

test("主色和意义色撞色能认出来（D78）", () => {
  assert.deepEqual(accentClash("#b42318"), ["danger"]);
  assert.deepEqual(accentClash("#15803d"), ["success"]);
  assert.deepEqual(accentClash("#b45309"), ["warning"]);
  assert.deepEqual(accentClash("#4386ba"), []);
  assert.deepEqual(accentClash(""), []);
});
