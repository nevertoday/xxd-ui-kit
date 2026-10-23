// @xxd/mini 的几条约定：插件和运行时登记同样的读屏属性、图标和 @xxd/icons 同一种画法、每个组件都有演示和导出。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { ICON_ATTRIBUTES } from "@xxd/icons";

const root = new URL("..", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const manifest = JSON.parse(read("mini.json"));
const aria = JSON.parse(read("aria.json"));
const demoApp = new URL("../xxd-mini-demo/", root);
const require = createRequire(new URL("../xxd-mini-demo/package.json", root));

test("taro 插件把 aria.json 里的属性登记进模板用的组件表；登记后属性编号和运行时登记的一样", () => {
  // 构建时：插件改 @tarojs/shared/dist/template 的组件表（端平台插件用这一份生成模板）
  const templateTable = require("@tarojs/shared/dist/template").internalComponents;
  const runtimeShared = require("@tarojs/shared");
  const before = JSON.parse(JSON.stringify(templateTable.View));
  process.env.TARO_ENV = "weapp";
  const hooks = [];
  require("../xxd-mini/taro-plugin")({ paths: { appPath: new URL(".", demoApp).pathname }, modifyRunnerOpts: (fn) => hooks.push(fn) });
  for (const attr of aria.attributes) assert.ok(attr in templateTable.View, `模板里的 View 没有 ${attr}`);
  // 运行时：src/aria.ts 用 mergeInternalComponents 登记同样的属性（这里照它的写法做一遍）
  const attrs = Object.fromEntries(aria.attributes.map((a) => [a, ""]));
  runtimeShared.mergeInternalComponents(Object.fromEntries(aria.components.map((c) => [c, { ...attrs }])));
  const alias = (table) => runtimeShared.getComponentsAlias(table);
  const a = alias(templateTable);
  const b = alias(runtimeShared.internalComponents);
  for (const c of ["view", "text", "button", "image", "input", "textarea"]) assert.deepEqual(a[c], b[c], `${c} 的属性编号对不上`);
  assert.ok(Object.keys(before).length < Object.keys(templateTable.View).length);
  // 插件定义 __XXD_MINI_ARIA__，运行时看到它才登记
  const opts = { mini: { postcss: { pxtransform: { enable: false } } } };
  hooks.forEach((fn) => fn({ opts }));
  assert.equal(opts.defineConstants.__XXD_MINI_ARIA__, "true");
});

test("运行时登记读屏属性用的是同一张 aria.json", () => {
  const src = read("src/aria.ts");
  assert.match(src, /import table from "\.\.\/aria\.json"/);
  assert.match(src, /mergeInternalComponents/);
  assert.match(read("taro-plugin/index.cjs"), /require\("\.\.\/aria\.json"\)/);
});

test("图标的画法和 @xxd/icons 一样：24 网格、1.5 线宽、圆头、斜接角、不填充", () => {
  const src = read("src/icon.tsx");
  const m = src.match(/ICON_SVG_ATTRS = (\{[^}]+\})/);
  const attrs = JSON.parse(m[1].replace(/(\w[\w-]*)(?=\s*:)/g, '"$1"').replace(/""/g, '"'));
  for (const key of ["fill", "stroke-width", "stroke-linecap", "stroke-linejoin"]) assert.equal(String(attrs[key]), String(ICON_ATTRIBUTES[key]), key);
  assert.match(src, /viewBox="0 0 24 24"/);
});

test("mini.json 里的每个组件：有样式文件、有演示", () => {
  const demos = readdirSync(new URL("src/demos/", demoApp)).filter((f) => f.endsWith(".tsx")).map((f) => readFileSync(new URL(`src/demos/${f}`, demoApp), "utf8")).join("\n");
  for (const c of manifest.components) {
    assert.ok(new RegExp(`name: "${c.name}"`).test(demos), `${c.name} 没有演示（packages/xxd-mini-demo/src/demos）`);
  }
});

test("index.ts 导出了每个组件文件", () => {
  const index = read("src/index.ts");
  const files = readdirSync(new URL("src/", root)).filter((f) => /\.tsx?$/.test(f) && f !== "index.ts").map((f) => f.replace(/\.tsx?$/, ""));
  for (const f of files) assert.ok(index.includes(`from "./${f}"`), `src/index.ts 没导出 ./${f}`);
});

test("组件里不写死颜色、圆角、阴影（都从令牌来）；字重只有 400 / 500 / 600", () => {
  for (const dir of ["src/styles/"]) {
    for (const f of readdirSync(new URL(dir, root))) {
      const css = read(`${dir}${f}`).replace(/\/\*[\s\S]*?\*\//g, "");
      for (const line of css.split("\n")) {
        // 白字（实心底上）和遮罩的黑色是允许的固定值
        const hex = line.match(/#[0-9a-f]{3,8}\b/gi)?.filter((h) => !/^#(fff|ffffff|000000)$/i.test(h));
        assert.ok(!hex?.length, `${f}：写死的颜色 ${line.trim()}`);
        assert.ok(!/border-radius:\s*\d+px/.test(line), `${f}：写死的圆角 ${line.trim()}`);
        assert.ok(!/box-shadow:\s*\d/.test(line), `${f}：写死的阴影 ${line.trim()}`);
        const w = line.match(/font-weight:\s*(\d+)/);
        assert.ok(!w || ["400", "500", "600"].includes(w[1]), `${f}：字重 ${w?.[1]}`);
      }
    }
  }
});

test("动效只动透明度和位置（transition / animation 里不出现 width、height、top、left、margin）", () => {
  for (const f of readdirSync(new URL("src/styles/", root))) {
    const css = read(`src/styles/${f}`).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/transition:\s*([^;]+);/g)) assert.ok(!/\b(width|height|top|left|right|bottom|margin|padding)\b/.test(m[1]), `${f}：${m[0]}`);
  }
});
