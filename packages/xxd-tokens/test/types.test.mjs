// 每个 JS 导出都要在 .d.ts 里有声明（发到 npm 以后 TypeScript 用户靠它）
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const names = (js) => [...js.matchAll(/^export (?:const|function|let|class) (\w+)/gm)].map((m) => m[1]);
const declared = (dts) => new Set([...dts.matchAll(/^export (?:declare )?(?:const|function|type|interface|class) (\w+)/gm)].map((m) => m[1]));

for (const mod of ["accent", "theme"]) {
  test(`src/${mod}.js 的导出都有类型`, () => {
    const js = readFileSync(new URL(`../src/${mod}.js`, import.meta.url), "utf8");
    const dts = declared(readFileSync(new URL(`../src/${mod}.d.ts`, import.meta.url), "utf8"));
    assert.deepEqual(names(js).filter((n) => !dts.has(n)), []);
  });
}
