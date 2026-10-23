// 样式改写（scripts/build-mini.mjs）的门禁：规则一条条对，真的网页版 CSS 改写后 WebView 一列是 0。
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { appearanceVars } from "@xxd/tokens/resolve";
import { audit, buildMini, convertBody, convertSelector, expandIs, HEADER, mixName, printSelector, readRules, SIZE_BUDGET, themeJson, tokensCss } from "../scripts/build-mini.mjs";

const require = createRequire(import.meta.url);
const { transform } = require("lightningcss");
const root = new URL("..", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("mini.json", root), "utf8"));
const modes = JSON.parse(readFileSync(require.resolve("@xxd/tokens/dist/tokens.json"), "utf8"));
const componentsCss = readFileSync(require.resolve("@xxd/css/dist/components.css"), "utf8");

/** 一条选择器文本 → 改写后的文本（或者 drop 原因） */
function convert(text) {
  let sel;
  transform({ filename: "t.css", code: Buffer.from(`${text}{color:red}`), visitor: { Selector(s) { sel ??= s; } } });
  const expanded = expandIs(sel);
  const out = [];
  for (const one of expanded) {
    const r = convertSelector(one, { has: manifest.has });
    if (r.drop) return { drop: r.drop };
    out.push(...r.selectors.map(printSelector));
  }
  return out.join(", ");
}

test("属性选择器 → 类名", () => {
  assert.equal(convert('.xxd-btn[data-variant="primary"]'), ".xxd-btn.is-variant-primary");
  assert.equal(convert(".xxd-sidebar[data-collapsed]"), ".xxd-sidebar.is-collapsed");
  assert.equal(convert('.xxd-chip[aria-pressed="true"]'), ".xxd-chip.is-pressed");
  assert.equal(convert('.xxd-tab[aria-selected="false"]'), ".xxd-tab:not(.is-selected)");
  assert.equal(convert('.xxd-check[aria-checked="mixed"]'), ".xxd-check.is-indeterminate");
  assert.equal(convert(".xxd-list__item[aria-current]"), ".xxd-list__item.is-current");
  assert.equal(convert(".xxd-tabs [role=tab]"), ".xxd-tabs .is-role-tab");
  assert.match(convert('[class*="__title"]').drop, /属性选择器/);
});

test("状态伪类 → 类名；焦点去掉", () => {
  assert.equal(convert(".xxd-btn:hover"), ".xxd-btn.is-hover");
  assert.equal(convert(".xxd-btn:active"), ".xxd-btn.is-active");
  assert.equal(convert(".xxd-switch:checked"), ".xxd-switch.is-checked");
  assert.equal(convert(".xxd-input:disabled"), ".xxd-input.is-disabled");
  assert.match(convert(".xxd-btn:focus-visible").drop, /焦点/);
  // :not(焦点) 在手机上永远成立：去掉这个 :not
  assert.equal(convert(".xxd-btn:not(:focus-visible)"), ".xxd-btn");
});

test(":not(a, b) 拆开；:is / :where 展开", () => {
  assert.equal(convert('.xxd-btn:not(:disabled, [aria-disabled="true"])'), ".xxd-btn:not(.is-disabled)");
  assert.equal(convert(".xxd-btn:is(.a, .b)"), ".xxd-btn.a, .xxd-btn.b");
  assert.equal(convert(":where(.xxd-page) :where(.xxd-btn, .xxd-chip)"), ".xxd-page .xxd-btn, .xxd-page .xxd-chip");
});

test(":root → page；和外观属性写在一起时留类名", () => {
  assert.equal(convert(":root"), "page");
  assert.equal(convert(':root[data-theme="dark"] .xxd-btn'), ".is-theme-dark .xxd-btn");
  assert.equal(convert('[data-finish="material"]'), ".is-finish-material");
});

test("标签：和类名在一起时换成组件会加的类名；只有标签的去掉；* 去掉", () => {
  assert.equal(convert("a.xxd-row"), ".is-link.xxd-row");
  assert.equal(convert("button.xxd-row"), ".is-link.xxd-row");
  assert.equal(convert("body.xxd-page"), ".xxd-page");
  assert.match(convert("li").drop, /标签/);
  assert.match(convert(".xxd-page *").drop, /通配符/);
  assert.equal(convert(".xxd-input::placeholder"), ".is-placeholder");
  assert.match(convert(".xxd-dialog::backdrop").drop, /伪元素/);
});

test("color-mix：全局令牌的 → 派生令牌；局部变量的 → 近似；SVG 地址 → base64；dvh → vh", () => {
  const mixes = new Map();
  const known = new Set(["--action", "--paper"]);
  const approx = [];
  const out = convertBody("color: color-mix(in srgb, var(--action) 24%, transparent); background: color-mix(in srgb, var(--btn-bg) 92%, #000000); height: 100dvh", mixes, { known, approx });
  assert.match(out, /color: var\(--mix-action-24-transparent\)/);
  assert.match(out, /background: var\(--btn-bg\)/);
  assert.match(out, /height: 100vh/);
  assert.equal(mixes.get("--mix-action-24-transparent"), "color-mix(in srgb, var(--action) 24%, transparent)");
  assert.equal(approx.length, 1);
  assert.equal(mixName("color-mix(in srgb, #fcfcfc 97%, var(--action))"), "--mix-fcfcfc-97-action");
  const svg = convertBody(`--x: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E")`, new Map());
  assert.match(svg, /url\("data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+"\)/);
});

test("audit 认得出不允许的写法", () => {
  const bad = audit(':root{--a:1} .a[data-x]{color:color-mix(in srgb, red 50%, blue)} * {margin:0} .a:hover{color:red} li{color:red}');
  assert.ok(bad.webview.some((p) => p.startsWith("属性选择器")));
  assert.ok(bad.webview.some((p) => p.startsWith("通配符")));
  assert.ok(bad.webview.some((p) => p.startsWith("伪类 :hover")));
  assert.ok(bad.webview.some((p) => p.startsWith("标签 li")));
  assert.ok(bad.webview.includes("color-mix()"));
  assert.ok(bad.webview.includes(":root"));
  assert.deepEqual(audit("page,.xxd-h5-root{--a:1} view.xxd-x .y:first-child::after{color:red}").webview, []);
});

test("真的 @xxd/css：改写后每个文件 WebView、Skyline 两列都是 0，开头不换算 px，压缩后不超过体积上限", async () => {
  const extraCss = {};
  const { readdirSync } = await import("node:fs");
  for (const f of readdirSync(new URL("src/styles/", root))) extraCss[f.replace(/\.css$/, "")] = readFileSync(new URL(`src/styles/${f}`, root), "utf8");
  const { files, tokens } = buildMini({ componentsCss, modes, manifest, extraCss });
  const { transformSync } = require("esbuild");
  let total = 0;
  for (const [name, css] of [["tokens", tokens], ...files]) {
    assert.ok(css.startsWith(HEADER), `${name} 开头要写 ${HEADER}`);
    assert.deepEqual(audit(css).webview, [], name);
    assert.deepEqual(audit(css).skyline, [], `${name}：Skyline 不支持、又没有后备的写法`);
    total += Buffer.byteLength(transformSync(css, { loader: "css", minify: true }).code);
  }
  assert.ok(total <= SIZE_BUDGET, `压缩后 ${total} 字节`);
  assert.equal(files.size, manifest.components.length);
});

test("令牌小程序版：page 上是亮色、媒体查询里是暗色，都已经算成具体的值", () => {
  const mixes = new Map([["--mix-action-24-transparent", "color-mix(in srgb, var(--action) 24%, transparent)"]]);
  const css = tokensCss(modes, mixes);
  assert.ok(!/var\(|color-mix\(/.test(css.replace(/--font-title: [^;]+;/, "")), "还有没算掉的 var() / color-mix()");
  const light = appearanceVars({ theme: "light" }, { modes, coarse: true }).vars;
  assert.match(css, new RegExp(`--paper: ${light["--paper"]};`));
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n {2}page,\n {2}\.xxd-h5-root \{[\s\S]*--paper: #201f1a;/);
  assert.match(css, /--mix-action-24-transparent: rgba\(17, 17, 17, 0\.24\);/);
  assert.match(css, /--hit-min: 44px;/);
});

test("theme.json：亮暗两套，导航栏字色只能是 black / white", () => {
  const t = themeJson(modes);
  for (const mode of ["light", "dark"]) {
    for (const key of ["navBg", "navText", "bg", "bgText", "tabColor", "tabSelected", "tabBg", "tabBorder"]) assert.ok(t[mode][key], `${mode}.${key}`);
    assert.ok(["black", "white"].includes(t[mode].navText));
  }
  assert.equal(t.dark.navBg, "#171612");
});

test("mini.json：组件名不重复，每个都有中英文名；网页版的类名前缀不重复归属", () => {
  const names = new Set();
  const blocks = new Map();
  for (const c of manifest.components) {
    assert.ok(!names.has(c.name), c.name);
    names.add(c.name);
    assert.ok(c.zh && c.en, c.name);
    for (const b of c.blocks) {
      assert.ok(!blocks.has(b), `${b} 同时属于 ${blocks.get(b)} 和 ${c.name}`);
      blocks.set(b, c.name);
    }
  }
});

test("readRules 认得出 @keyframes 和外面套的 @media", () => {
  const rules = readRules("@media (max-width: 640px) { .a { color: red } } @keyframes spin { to { transform: rotate(1turn) } }");
  assert.equal(rules[0].wrappers[0].prelude, "@media (max-width: 640px)");
  assert.equal(rules[1].kind, "keyframes");
});

test("产物已经构建，而且和源码一致（改了 @xxd/css 或 src/styles 要重新 pnpm --filter @xxd/mini build）", () => {
  for (const c of manifest.components) assert.ok(existsSync(new URL(`styles/${c.name.toLowerCase()}.mini.css`, root)), c.name);
  assert.ok(existsSync(new URL("styles/tokens.mini.css", root)));
});
