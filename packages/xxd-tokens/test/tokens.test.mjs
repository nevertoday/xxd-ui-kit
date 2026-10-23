// 令牌门禁：对比度（DESIGN-PRINCIPLES §2）、圆角两态（§3）、生成器。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCENT_PRESETS, DARK_PAPER, LIGHT_PAPER, accentPalette, contrast, toRgb } from "../src/accent.js";
import { applySettings, resolveTheme } from "../src/theme.js";
import { parseBlocks, toLayered, toShadow } from "../scripts/build.mjs";

const css = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
const blocks = parseBlocks(css);
const base = blocks[":root"];
// 暗色块写成「:root[data-theme="dark"], [data-theme="dark"]」（整页或页面里的一块都生效）
const dark = blocks[':root[data-theme="dark"],\n[data-theme="dark"]'] ?? blocks[':root[data-theme="dark"]'];
// 圆角块写成「:root[data-corners="rounded"], [data-corners="rounded"]」（整页或页面里的一块都生效）
const rounded = blocks[':root[data-corners="rounded"],\n[data-corners="rounded"]'] ?? blocks[':root[data-corners="rounded"]'];
const rgb = (hex) => toRgb(hex);
const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
};

test("正文与次要文字对比度 ≥ 4.5（亮/暗，paper / bg / wash / wash-strong / 选中底上）", () => {
  for (const [name, mode] of [["light", base], ["dark", { ...base, ...dark }]]) {
    for (const surface of ["--paper", "--bg", "--wash", "--wash-strong", "--selected-bg"]) {
      for (const text of ["--ink", "--muted"]) {
        const ratio = contrast(rgb(mode[text]), rgb(mode[surface]));
        assert.ok(ratio >= 4.5, `${name}: ${text} on ${surface} = ${ratio.toFixed(2)}`);
      }
    }
  }
});

test("语义色在纸上 ≥ 4.5（亮/暗）", () => {
  for (const [name, mode] of [["light", base], ["dark", { ...base, ...dark }]]) {
    for (const color of ["--success", "--danger", "--warning"]) {
      const ratio = contrast(rgb(mode[color]), rgb(mode["--paper"]));
      assert.ok(ratio >= 4.5, `${name}: ${color} = ${ratio.toFixed(2)}`);
    }
  }
});

test("语义色做底：白字 ≥ 4.5，暗纸上做标记 ≥ 3", () => {
  for (const [name, mode, paper] of [["light", base, "#ffffff"], ["dark", { ...base, ...dark }, "#201f1a"]]) {
    for (const color of ["--success-strong", "--danger-strong", "--warning-strong"]) {
      assert.ok(contrast(rgb(mode[color]), [255, 255, 255]) >= 4.5, `${name}: white on ${color}`);
      if (name === "dark") assert.ok(contrast(rgb(mode[color]), rgb(paper)) >= 3, `${name}: ${color} mark`);
    }
  }
});

test("12 个主色 × 亮/暗：标记 ≥ 3，文字版 ≥ 4.5，实心底（含 hover）上的字 ≥ 4.5", () => {
  assert.equal(ACCENT_PRESETS.length, 12);
  assert.equal(ACCENT_PRESETS[0].id, "", "第一个是墨色");
  for (const preset of ACCENT_PRESETS.slice(1)) {
    const p = accentPalette(preset.id);
    const checks = [
      [p["--action-custom"], LIGHT_PAPER, 3, "light mark"],
      [p["--action-text-custom"], LIGHT_PAPER, 4.5, "light text"],
      [p["--action-custom-dark"], DARK_PAPER, 3, "dark mark"],
      [p["--action-text-custom-dark"], DARK_PAPER, 4.5, "dark text"],
    ];
    for (const [hex, paper, min, label] of checks) {
      const ratio = contrast(rgb(hex), paper);
      assert.ok(ratio >= min - 0.01, `${String(preset.name)} ${String(label)}: ${ratio.toFixed(2)}`);
    }
    for (const [bg, on] of [
      ["--action-fill-custom", "--on-action-custom"],
      ["--action-fill-hover-custom", "--on-action-custom"],
      ["--action-fill-custom-dark", "--on-action-custom-dark"],
      ["--action-fill-hover-custom-dark", "--on-action-custom-dark"],
    ]) {
      const ratio = contrast(rgb(p[bg]), rgb(p[on]));
      assert.ok(ratio >= 4.5, `${preset.name} ${on} on ${bg}: ${ratio.toFixed(2)}`);
    }
    // 文字版放在选中底（主色的 4 级：chip、选中的导航项）上也 ≥ 4.5
    assert.ok(contrast(rgb(p["--action-text-custom"]), rgb(p["--accent-4-custom"])) >= 4.5, `${preset.name} light text on selected`);
    assert.ok(contrast(rgb(p["--action-text-custom-dark"]), rgb(p["--accent-4-custom-dark"])) >= 4.5, `${preset.name} dark text on selected`);
    // 实心底仍是同一个颜色：在纸上 ≥ 3，压暗不超过 25%
    assert.ok(contrast(rgb(p["--action-fill-custom-dark"]), DARK_PAPER) >= 3 - 0.01, `${preset.name} dark fill mark`);
  }
  assert.equal(accentPalette(""), null);
  // 任意颜色（不只是预设）也成立：扫一圈色相 × 明度
  for (let h = 0; h < 360; h += 15) for (const l of [35, 50, 65, 80]) {
    const c = hsl(h, 70, l);
    const p = accentPalette(c);
    for (const [bg, on] of [["--action-fill-custom", "--on-action-custom"], ["--action-fill-custom-dark", "--on-action-custom-dark"], ["--action-fill-hover-custom", "--on-action-custom"], ["--action-fill-hover-custom-dark", "--on-action-custom-dark"]])
      assert.ok(contrast(rgb(p[bg]), rgb(p[on])) >= 4.5, `${c} ${bg}`);
  }
});

test("默认直角：五档矩形圆角都是 0；圆角模式 4/6/10/14/999；语义圆不跟开关", () => {
  for (const key of ["--r-xs", "--r-sm", "--r-md", "--r-lg", "--r-pill"]) assert.equal(base[key], "0px", key);
  assert.deepEqual(
    ["--r-xs", "--r-sm", "--r-md", "--r-lg", "--r-pill"].map((k) => rounded[k]),
    ["4px", "6px", "10px", "14px", "999px"],
  );
  assert.equal(base["--r-circle"], "50%");
  assert.ok(!("--r-circle" in rounded));
});

test("字重只有 400 / 500 / 600", () => {
  const weights = Object.entries(base).filter(([k]) => k.startsWith("--weight-")).map(([, v]) => v);
  assert.deepEqual(weights.sort((a, b) => a.localeCompare(b)), ["400", "500", "600"]);
});

test("字体：只用无衬线；标题和正文同一家族；先英文字体再中文字体；繁体页面换繁体字形", () => {
  const stacks = { body: base["--font-body"], mono: base["--font-mono"] };
  assert.equal(base["--font-title"], "var(--font-body)");
  for (const [name, stack] of Object.entries(stacks)) {
    assert.doesNotMatch(stack, /(^|[\s,"])serif\b|Song|STSong|Serif|Georgia|Mincho/, `${name} 里不能有衬线 / 宋体`);
  }
  const fonts = stacks.body.split(",").map((f) => f.trim().replace(/"/g, ""));
  const latin = Math.max(fonts.indexOf("Avenir Next"), fonts.indexOf("Segoe UI"));
  const firstCjk = fonts.findIndex((f) => /PingFang|YaHei|Hiragino|Noto Sans SC|Source Han/.test(f));
  assert.ok(latin >= 0 && latin < firstCjk, `英文字体要排在中文字体前面：${fonts.join(", ")}`);
  const hant = blocks[":root:lang(zh-Hant),\n:root:lang(zh-TW),\n:root:lang(zh-HK)"] ?? Object.entries(blocks).find(([k]) => k.includes("zh-Hant"))?.[1];
  assert.match(hant?.["--font-body"] ?? "", /PingFang TC.*Microsoft JhengHei/);
  // Shadow 里写在 host 上：:host(:lang(zh-Hant))，并在顶层元素上再声明一次
  const shadow = toShadow(css);
  assert.match(shadow, /:host\(:lang\(zh-Hant\)\),\n:host\(:lang\(zh-Hant\)\) > \*/);
  // layered 版本：老项目自己在 :root 上的字体优先（不写到每个元素上）
  assert.match(toLayered(css), /:where\(:root:lang\(zh-Hant\)\)/);
});

test("暗色是暖黑", () => {
  assert.equal(dark["--bg"], "#171612");
  assert.equal(dark["--paper"], "#201f1a");
});

test("Shadow 版本：:root → :host", () => {
  const shadow = toShadow(css);
  assert.ok(!/:root/.test(shadow.replace(/\/\*[\s\S]*?\*\//g, "")));
  assert.match(shadow, /:host\(\[data-theme="dark"\]\[data-accent\]\)/);
  assert.match(shadow, /:host\(\[data-corners="rounded"\]\)/);
});

test("Shadow 版本：宿主页面打不进来（O8）", () => {
  const shadow = toShadow(css);
  // 令牌在 Shadow 内部的顶层元素上再声明一次（宿主页面的 `div { --ink: … }` 会打到 host 上）
  assert.match(shadow, /:host,\n:host > \* \{/);
  assert.match(shadow, /:host\(\[data-theme="dark"\]\),\n:host\(\[data-theme="dark"\]\) > \*(,\n\[data-theme="dark"\])? \{/);
  // 继承属性在最先声明的 layer 里重置
  assert.ok(shadow.startsWith("@layer xxd.reset {"));
  for (const prop of ["text-transform: none", "letter-spacing: normal", "text-align: start", "word-spacing: normal", "cursor: auto"]) assert.ok(shadow.includes(prop), prop);
  // 写在 host 上的外观属性：后代选择器多一个 :host() 版本；:is() 里的逗号不切
  const out = toShadow('@layer x { [data-finish="material"] .b:not([data-finish="flat"] *, .c):active, .d { color: red; } @keyframes k { from { opacity: 0 } to { opacity: 1 } } }');
  assert.match(out, /:host\(\[data-finish="material"\]\) \.b:not\(\[data-finish="flat"\] \*, \.c\):active/);
  assert.match(out, /\[data-finish="material"\] \.b:not\(\[data-finish="flat"\] \*, \.c\):active,\n/);
  assert.match(out, /from \{ opacity: 0 \}/);
  assert.ok(!/:host\(from/.test(out));
});

function fakeElement() {
  const attrs = new Map();
  const style = new Map();
  return {
    attrs,
    style: { setProperty: (k, v) => style.set(k, v), removeProperty: (k) => style.delete(k), map: style },
    setAttribute: (k, v) => attrs.set(k, String(v)),
    removeAttribute: (k) => attrs.delete(k),
    getAttribute: (k) => attrs.get(k) ?? null,
  };
}

test("applySettings：默认直角、墨色；lock 覆盖用户设置", () => {
  const el = fakeElement();
  applySettings({}, { element: el });
  assert.equal(el.getAttribute("data-corners"), "square");
  assert.equal(el.getAttribute("data-theme"), "light");
  assert.equal(el.getAttribute("data-mode"), "light");
  assert.equal(el.getAttribute("data-accent"), null);

  applySettings({ theme: "dark", corners: "rounded", accent: "#3b74b8", density: "compact" }, { element: el, lock: { corners: "square" } });
  assert.equal(el.getAttribute("data-theme"), "dark");
  assert.equal(el.getAttribute("data-corners"), "square");
  assert.equal(el.getAttribute("data-density"), "compact");
  assert.equal(el.getAttribute("data-accent"), "");
  assert.ok(el.style.map.get("--action-custom"));

  applySettings({ accent: "" }, { element: el });
  assert.equal(el.getAttribute("data-accent"), null);
  assert.equal(el.style.map.size, 0);
});

test("resolveTheme", () => {
  assert.equal(resolveTheme("dark"), "dark");
  assert.equal(resolveTheme(undefined), "light");
  assert.ok(["light", "dark"].includes(resolveTheme("system")));
});

test("layered 版本：整份放进 @layer xxd.tokens，不带全局减少动效规则", () => {
  const layered = toLayered(css);
  assert.match(layered, /^\/\*[^\n]*\*\/\n@layer xxd\.tokens \{/);
  assert.ok(!layered.includes("prefers-reduced-motion"));
  assert.ok(layered.includes(':where(:root[data-theme="dark"])'));
  assert.ok(!/(^|[^(]):root\[data-theme="dark"\] \{/m.test(layered), "不留下和老项目同形的 :root[...] 块");
  assert.equal((layered.match(/\{/g) || []).length, (layered.match(/\}/g) || []).length);
});

test("prefers-contrast: more：控件边框 ≥ 3（纸 / wash / 选中底），次要文字 ≥ 4.5", () => {
  const more = css.slice(css.indexOf("@media (prefers-contrast: more)"));
  const light = parseBlocks(more.slice(0, more.indexOf(':root[data-theme="dark"],')))[":root,\n  :root[data-accent]"] ?? Object.values(parseBlocks(more.slice(0, more.indexOf(':root[data-theme="dark"],'))))[0];
  const darkMore = Object.values(parseBlocks(more.slice(more.indexOf(':root[data-theme="dark"],'), more.indexOf("/* 减少动效"))))[0];
  for (const [name, mode] of [["light", { ...base, ...light }], ["dark", { ...base, ...dark, ...darkMore }]]) {
    for (const surface of ["--paper", "--bg", "--wash", "--selected-bg"]) {
      assert.ok(contrast(rgb(mode["--line-strong"]), rgb(mode[surface])) >= 3, `${name} line-strong on ${surface}`);
      assert.ok(contrast(rgb(mode["--muted"]), rgb(mode[surface])) >= 4.5, `${name} muted on ${surface}`);
    }
  }
});

test("控件的边（--line-control）和底色 ≥ 3（WCAG 1.4.11）；卡片、分隔线的 --line 不受影响", () => {
  for (const [name, mode] of [["light", base], ["dark", { ...base, ...dark }]]) {
    for (const surface of ["--paper", "--bg"]) {
      const ratio = contrast(rgb(mode["--line-control"]), rgb(mode[surface]));
      assert.ok(ratio >= 3, `${name}: --line-control on ${surface} = ${ratio.toFixed(2)}`);
    }
  }
});

test("键盘焦点环（--focus-color = --action-text）在每个主色、亮暗两种下都 ≥ 3", () => {
  assert.equal(base["--focus-color"], "var(--action-text)");
  for (const preset of ACCENT_PRESETS) {
    const p = accentPalette(preset.id);
    if (!p) continue;
    assert.ok(contrast(rgb(p["--action-text-custom"]), LIGHT_PAPER) >= 3, `${preset.name} light ring`);
    assert.ok(contrast(rgb(p["--action-text-custom-dark"]), DARK_PAPER) >= 3, `${preset.name} dark ring`);
  }
});

test("暗色和紧凑可以只用在页面里的一块；dist 里有「没有 JS 时跟随系统暗色」的兜底", () => {
  assert.ok(dark && dark["--bg"], "暗色块");
  assert.ok(blocks[':root[data-density="compact"],\n[data-density="compact"]']?.["--control-h"], "紧凑块");
  const built = readFileSync(new URL("../dist/tokens.css", import.meta.url), "utf8");
  assert.match(built, /@media \(prefers-color-scheme: dark\) \{\n  :root:not\(\[data-theme\]\) \{/);
  assert.match(built.slice(built.lastIndexOf("prefers-color-scheme")), new RegExp(`--bg: ${dark["--bg"]};`));
});


test("页面里的一块亮 / 暗：派生的强调令牌重新声明；亮色块和 :root 的值一致", () => {
  const light = blocks['[data-theme="light"]'];
  assert.ok(light, "亮色块");
  for (const [k, v] of Object.entries(light)) {
    if (k in base) assert.equal(v, base[k], `[data-theme=light] ${k} 和 :root 不一样`);
  }
  for (const k of ["--action", "--on-action", "--action-text", "--action-fill", "--action-fill-hover", "--focus-ring", "--focus-color"]) {
    assert.ok(dark[k], `暗色块要重新声明 ${k}`);
    assert.ok(light[k], `亮色块要重新声明 ${k}`);
  }
  assert.ok(blocks[':root[data-theme="dark"][data-accent],\n:root[data-accent] [data-theme="dark"]'], "开了主色的页面里，暗色的一块也用主色");
});

test("tokens.css 只放变量；减少动效、选中色、光标在 base.css", () => {
  const vars = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const re of [/prefers-reduced-motion/, /::selection/, /caret-color/]) assert.doesNotMatch(vars, re);
  for (const block of vars.matchAll(/\{([^{}]*)\}/g)) {
    for (const decl of block[1].split(";").map((d) => d.trim()).filter(Boolean)) {
      assert.match(decl, /^(--[\w-]+|color-scheme)\s*:/, `tokens.css 里有不是变量的声明：${decl}`);
    }
  }
  const base = readFileSync(new URL("../base.css", import.meta.url), "utf8");
  assert.match(base, /prefers-reduced-motion: reduce/);
  assert.match(base, /:root\[data-accent\] ::selection/);
});

// OKLCH（明度、彩度、色相）：预设看起来一样重（设计师评审 D25）
function oklch(hex) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

test("主色预设：明度差 ≤ 0.04、有彩色的彩度差 ≤ 0.01、色相两两隔开 ≥ 25°，没有第三方品牌色", () => {
  const colored = ACCENT_PRESETS.slice(1).map((p) => ({ ...p, lch: oklch(p.id) }));
  const Ls = colored.map((p) => p.lch[0]);
  assert.ok(Math.max(...Ls) - Math.min(...Ls) <= 0.04, `明度 ${Math.min(...Ls).toFixed(3)}–${Math.max(...Ls).toFixed(3)}`);
  const vivid = colored.filter((p) => p.lch[1] > 0.05);
  const Cs = vivid.map((p) => p.lch[1]);
  assert.ok(Math.max(...Cs) - Math.min(...Cs) <= 0.01, `彩度 ${Math.min(...Cs).toFixed(3)}–${Math.max(...Cs).toFixed(3)}`);
  for (const a of vivid) for (const b of vivid) {
    if (a === b) continue;
    const d = Math.abs(a.lch[2] - b.lch[2]);
    assert.ok(Math.min(d, 360 - d) >= 25, `${a.name} 和 ${b.name} 色相只差 ${Math.min(d, 360 - d).toFixed(0)}°`);
  }
  assert.ok(!ACCENT_PRESETS.some((p) => /\bX\b|twitter/i.test(p.name)), "预设里不放第三方品牌色");
});

test("原样（accentMode: exact）：实心底就是原色；标记用调过的那一档（在纸上 ≥ 3，COLOR-REVIEW-PLAN D77）；底上的字 ≥ 4.5；文字版照样 ≥ 4.5", () => {
  for (const hex of ["#1d9bf0", "#ffcc00", "#b7665c", "#0f172a"]) {
    const p = accentPalette(hex, "", { exact: true });
    assert.equal(p["--action-fill-custom"], hex);
    assert.equal(p["--action-fill-custom-dark"], hex);
    assert.ok(contrast(rgb(p["--action-custom"]), LIGHT_PAPER) >= 3, `${hex} 标记`);
    assert.ok(contrast(rgb(p["--on-action-custom"]), rgb(hex)) >= 4.5, `${hex} 上的字`);
    assert.ok(contrast(rgb(p["--action-text-custom"]), LIGHT_PAPER) >= 4.5 - 0.01, `${hex} 文字版`);
  }
  const el = fakeElement();
  applySettings({ accent: "#1d9bf0", accentMode: "exact" }, { element: el });
  assert.equal(el.getAttribute("data-accent-exact"), "");
  applySettings({ accent: "#1d9bf0" }, { element: el });
  assert.equal(el.getAttribute("data-accent-exact"), null);
});

test("抬起来的一层（浮层）：暗色比纸亮一档；上面的正文、次要文字、控件边的对比度照样够", () => {
  const blocks = parseBlocks(readFileSync(new URL("../tokens.css", import.meta.url), "utf8"));
  const base = blocks[":root"];
  const dark = { ...base, ...blocks[':root[data-theme="dark"],\n[data-theme="dark"]'] };
  for (const [mode, v] of [["亮", base], ["暗", dark]]) {
    for (const bg of ["--paper-raised", "--wash-raised", "--wash-strong-raised"]) {
      assert.ok(contrast(toRgb(v["--ink"]), toRgb(v[bg])) >= 4.5, `${mode} --ink on ${bg}`);
      assert.ok(contrast(toRgb(v["--muted"]), toRgb(v[bg])) >= 4.5, `${mode} --muted on ${bg}`);
    }
    assert.ok(contrast(toRgb(v["--line-control"]), toRgb(v["--paper-raised"])) >= 3, `${mode} --line-control on --paper-raised`);
  }
  assert.equal(base["--paper-raised"], base["--paper"], "亮色的浮层和纸一样（靠阴影托起）");
  assert.notEqual(dark["--paper-raised"], dark["--paper"], "暗色的浮层亮一档");
});

test("tokens.resolved.json：8 种外观，每个令牌都是具体值，和 tokens.css 对得上", () => {
  const resolved = JSON.parse(readFileSync(new URL("../dist/tokens.resolved.json", import.meta.url), "utf8"));
  const modes = JSON.parse(readFileSync(new URL("../dist/tokens.json", import.meta.url), "utf8"));
  const keys = Object.keys(resolved).filter((k) => !k.startsWith("$"));
  assert.equal(keys.length, 8);
  for (const k of keys) {
    for (const name of Object.keys(modes.base)) assert.ok(resolved[k][name] !== undefined, `${k} 缺 ${name}`);
    for (const [name, v] of Object.entries(resolved[k])) assert.ok(!/var\(|color-mix\(/.test(v), `${k} ${name} 还没算完：${v}`);
  }
  assert.equal(resolved["light-square-comfortable"]["--paper"], modes.base["--paper"]);
  assert.equal(resolved["dark-square-comfortable"]["--paper"], modes.dark["--paper"]);
  assert.equal(resolved["light-rounded-comfortable"]["--r-md"], modes.rounded["--r-md"]);
  assert.equal(resolved["light-square-compact"]["--control-h"], modes.compact["--control-h"]);
});
