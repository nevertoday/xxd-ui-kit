// 每个 JS 导出都要在 .d.ts 里有声明（发到 npm 以后 TypeScript 用户靠它）
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const names = (js) => [...js.matchAll(/^export (?:const|function|let|class) (\w+)/gm)].map((m) => m[1]);
const declared = (dts) => new Set([...dts.matchAll(/^export (?:declare )?(?:const|function|type|interface|class) (\w+)/gm)].map((m) => m[1]));

for (const mod of ["svg", "react", "phosphor", "nodes", "meta", "each"]) {
  test(`src/${mod}.js 的导出都有类型`, () => {
    const js = readFileSync(new URL(`../src/${mod}.js`, import.meta.url), "utf8");
    const dts = declared(readFileSync(new URL(`../src/${mod}.d.ts`, import.meta.url), "utf8"));
    assert.deepEqual(names(js).filter((n) => !dts.has(n)), []);
  });
}

test("src/names.d.ts、each.js、each.d.ts 是最新的（改了 nodes.js 要重新构建）", async () => {
  const { generated } = await import("../scripts/generate.mjs");
  for (const [file, text] of Object.entries(generated())) {
    assert.equal(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), text, `src/${file} 过期了：pnpm --filter @xxd/icons build`);
  }
});

test("IconName 包含每个图标和别名", async () => {
  const { ICON_NAMES, ICON_ALIASES } = await import("../src/svg.js");
  const dts = readFileSync(new URL("../src/names.d.ts", import.meta.url), "utf8");
  for (const n of [...ICON_NAMES, ...Object.keys(ICON_ALIASES)]) assert.ok(dts.includes(`| "${n}"`), n);
});
