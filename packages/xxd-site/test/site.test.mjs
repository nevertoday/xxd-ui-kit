import { test } from "node:test";
import assert from "node:assert/strict";
import { forceStates } from "../scripts/assets.mjs";
import { embed, extractFunction, withAttr, STATES } from "../src/lib/markup.js";

test("forceStates：把 :hover / :focus-visible / :active 复制成 [data-force] 版本，包在 xxd.components 层里", () => {
  const css = `@layer xxd.components { .xxd-btn:hover { background: red; } .xxd-btn:focus-visible { outline: 1px solid; } @media (max-width: 400px) { .a:active { color: blue; } } @keyframes k { from { opacity: 0 } } .plain { color: x; } }`;
  const out = forceStates(css);
  assert.match(out, /@layer xxd\.components/);
  assert.match(out, /\.xxd-force-scope \.xxd-btn\[data-force~="hover"\] \{ background: red; \}/);
  assert.match(out, /\.xxd-force-scope \.xxd-btn\[data-force~="focus"\]/);
  assert.match(out, /@media \(max-width: 400px\) \{\n\.xxd-force-scope \.a\[data-force~="active"\]/);
  assert.ok(!out.includes(".plain"));
  assert.ok(!out.includes("@keyframes"));
});

test("withAttr 给第一个元素加属性", () => {
  assert.equal(withAttr('<button class="x">a</button><b>c</b>', "disabled"), '<button disabled class="x">a</button><b>c</b>');
  assert.equal(STATES.hover.attrs, 'data-force="hover"');
});

test("extractFunction 抽出某个演示函数的源码", () => {
  const src = "import x from 'y';\nexport function ADemo() {\n  return 1;\n}\n\nexport function BDemo() {\n  return 2;\n}\n";
  assert.equal(extractFunction(src, "ADemo"), "export function ADemo() {\n  return 1;\n}");
  assert.equal(extractFunction(src, "BDemo"), "export function BDemo() {\n  return 2;\n}");
  assert.equal(extractFunction(src, "None"), "");
});

test("embed：示例里的 main / aside 换成 div（不和站点的 main 打架）", () => {
  assert.equal(embed('<main class="a"><aside id="s">x</aside></main>'), '<div data-landmark="main" class="a"><div data-landmark="aside" id="s">x</div></div>');
  assert.equal(embed("<mainly>"), "<mainly>");
});

// ── 英文版 ─────────────────────────────────────────────
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { counterpart, langOf, mdHref, stripLang, withLang } from "../src/i18n/index.js";
import { templates } from "../src/data/templates.js";
import { templates as templatesEn } from "../src/data/templates.en.js";
import { principles } from "../src/data/principles.js";
import { principles as principlesEn } from "../src/data/principles.en.js";

const han = /\p{Script=Han}/u;
// 语言的本名（语言选择器里）按它自己的语言写，允许出现
const ENDONYMS = /简体中文|繁體中文/g;
const hanOutsideEndonyms = (s) => han.test(s.replace(ENDONYMS, ""));

test("语言路径：/en 前缀、去前缀、另一种语言、Markdown 地址", () => {
  assert.equal(langOf("/en"), "en");
  assert.equal(langOf("/en/components/button"), "en");
  assert.equal(langOf("/enterprise"), "zh");
  assert.equal(langOf("/"), "zh");
  assert.equal(withLang("/", "en"), "/en/");
  assert.equal(withLang("/tools#ai", "en"), "/en/tools#ai");
  assert.equal(withLang("/en/start", "en"), "/en/start");
  assert.equal(withLang("https://x.com/a", "en"), "https://x.com/a");
  assert.equal(withLang("/start", "zh"), "/start");
  assert.equal(stripLang("/en"), "/");
  assert.equal(stripLang("/en/components/button"), "/components/button");
  assert.equal(counterpart("/components/button", "zh"), "/en/components/button");
  assert.equal(counterpart("/en/components/button", "en"), "/components/button");
  assert.equal(counterpart("/", "zh"), "/en/");
  assert.equal(counterpart("/en", "en"), "/");
  assert.equal(mdHref("/", "zh"), "/md/index.md");
  assert.equal(mdHref("/en", "en"), "/en/md/index.md");
  assert.equal(mdHref("/en/components/button", "en"), "/en/md/components/button.md");
});

test("每个中文页都有对应的英文页（src/pages/en/ 下同名文件）", () => {
  const root = new URL("../src/pages/", import.meta.url).pathname;
  const files = [];
  (function walk(d) {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else files.push(relative(root, p));
    }
  })(root);
  const zh = files.filter((f) => !f.startsWith("en/"));
  const en = new Set(files.filter((f) => f.startsWith("en/")).map((f) => f.slice(3)));
  assert.deepEqual(zh.filter((f) => !en.has(f)), []);
  assert.deepEqual([...en].filter((f) => !zh.includes(f)), []);
});

test("模板、原则：英文版和中文版一一对应，英文里没有汉字", () => {
  assert.deepEqual(templatesEn.map((t) => t.slug), templates.map((t) => t.slug));
  for (const t of templatesEn) {
    assert.ok(t.title, t.slug);
    for (const k of ["title", "summary", "markup", "where"]) assert.ok(!hanOutsideEndonyms(String(t[k] ?? "")), `${t.slug}.${k}`);
  }
  for (const [i, t] of templates.entries()) assert.equal(templatesEn[i].width, t.width, `${t.slug} 宽度`);
  assert.deepEqual(principlesEn.map((p) => [p.id, p.ref]), principles.map((p) => [p.id, p.ref]));
  for (const p of principlesEn) for (const [k, v] of Object.entries(p)) assert.ok(!han.test(String(v)), `${p.id}.${k}`);
});

test("React 演示：demos.en.tsx 和 demos.tsx 导出同样的函数，函数里没有汉字", () => {
  const src = (f) => readFileSync(new URL(`../src/react/${f}`, import.meta.url), "utf8");
  const names = (s) => [...s.matchAll(/export function (\w+)/g)].map((m) => m[1]);
  const zh = src("demos.tsx");
  const en = src("demos.en.tsx");
  assert.deepEqual(names(en), names(zh));
  const body = en.slice(en.indexOf("export function"));
  const bad = body.split("\n").filter((l) => han.test(l));
  assert.deepEqual(bad, []);
});

test("richText：先转义，再把令牌、类名、属性、标签、调用包成行内代码", async () => {
  const { richText } = await import("../src/lib/markup.js");
  assert.equal(richText("用 --muted，不要更浅"), '用 <code class="xxd-code-inline site-token">--muted</code>，不要更浅');
  assert.match(richText('写 aria-busy="true"'), /<code class="xxd-code-inline site-token">aria-busy="true"<\/code>/);
  assert.match(richText("原生 <select>"), /<code[^>]*>&lt;select&gt;<\/code>/);
  assert.match(richText("a.xxd-row 整行可点"), /<code[^>]*>a\.xxd-row<\/code>/);
  assert.equal(richText("<img onerror=alert(1)>").includes("<img"), false);
  assert.equal(richText("h1–h3 in page order"), "h1–h3 in page order");
});

test("forceStates：输入框的 :focus 也算「聚焦」；「鼠标点时不显示焦点环」的规则不复制（不然矩阵里的键盘聚焦画不出来）", () => {
  const out = forceStates(`@layer xxd.components { .xxd-input:focus { border-color: red; } :root[data-input="pointer"] .x :focus-visible { outline: none; } .x:focus-within { color: blue; } }`);
  assert.match(out, /\.xxd-force-scope \.xxd-input\[data-force~="focus"\]/);
  assert.doesNotMatch(out, /data-input="pointer"/);
  assert.doesNotMatch(out, /focus-within/);
});

test("小程序版（M5）：mini.json 的每个组件中英两版都有页面，说明和名字都齐，英文里没有汉字", async () => {
  const manifest = JSON.parse(readFileSync(new URL("../../xxd-mini/mini.json", import.meta.url), "utf8"));
  const dist = new URL("../dist/", import.meta.url);
  const built = existsSync(new URL("miniprogram/index.html", dist));
  const slug = (n) => n.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  for (const c of manifest.components) {
    assert.ok(c.zh && c.en && c.summary && c.summaryEn, c.name);
    assert.ok(!han.test(c.en) && !han.test(c.summaryEn), `${c.name} 的英文里有汉字`);
    if (built) for (const pre of ["", "en/"]) assert.ok(existsSync(new URL(`${pre}miniprogram/${slug(c.name)}/index.html`, dist)), `${pre}miniprogram/${slug(c.name)} 没有页面（先 pnpm --filter @xxd/site build）`);
  }
  // 演示小程序里每个组件都有演示（组件页的「小程序」标签页和这一页都嵌它）
  const demos = ["batch1", "batch2", "batch3"].map((b) => readFileSync(new URL(`../../xxd-mini-demo/src/demos/${b}.tsx`, import.meta.url), "utf8")).join("\n");
  for (const c of manifest.components) assert.match(demos, new RegExp(`name: "${c.name}"`), `${c.name} 没有演示`);
});

test("两种实现对照（V1）：PARITY 里的每一对，对照页的 HTML 一侧和 React 一侧都有，组件名在注册表里", async () => {
  const { PARITY } = await import("../src/data/parity.js");
  const view = readFileSync(new URL("../src/views/Parity.astro", import.meta.url), "utf8");
  const react = readFileSync(new URL("../src/react/Parity.tsx", import.meta.url), "utf8");
  const names = new Set(JSON.parse(readFileSync(new URL("../../xxd-css/registry.json", import.meta.url), "utf8")).components.map((c) => c.name));
  for (const [name, pairs] of Object.entries(PARITY)) {
    assert.ok(names.has(name), `${name} 不在注册表里`);
    for (const id of pairs) {
      assert.match(view, new RegExp(`\\["${id}",`), `对照页没有 ${id} 的 HTML 一侧`);
      assert.match(react, new RegExp(`["]?${id}["]?: \\(tr\\)`), `对照页没有 ${id} 的 React 一侧`);
    }
  }
});

test("React 属性表：自己写的组件里有中文说明的属性，英文页都有英文（data/react-props.en.js）", async () => {
  const props = JSON.parse(readFileSync(new URL("../../xxd-react/dist/props.json", import.meta.url), "utf8"));
  const { REACT_PROPS_EN } = await import("../src/data/react-props.en.js");
  const missing = [];
  for (const [name, e] of Object.entries(props)) for (const [k, p] of Object.entries(e.props)) if (han.test(p.description ?? "") && !REACT_PROPS_EN[name]?.[k]) missing.push(`${name}.${k}`);
  assert.deepEqual(missing, []);
  for (const v of Object.values(REACT_PROPS_EN).flatMap(Object.values)) assert.ok(!han.test(v), v);
});
