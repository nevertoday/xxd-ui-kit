// 分类与关键词：每个图标恰好在一个分类里、都有关键词
import { test } from "node:test";
import assert from "node:assert/strict";
import { ICON_GROUPS, ICON_KEYWORDS, ICON_GROUP_OF } from "../src/meta.js";
import { ICON_NAMES } from "../src/svg.js";

test("每个图标恰好在一个分类里", () => {
  const count = {};
  for (const g of ICON_GROUPS) for (const n of Object.keys(g.icons)) count[n] = (count[n] || 0) + 1;
  for (const n of ICON_NAMES) assert.equal(count[n], 1, `${n} 出现在 ${count[n] || 0} 个分类里`);
  for (const n of Object.keys(count)) assert.ok(ICON_NAMES.includes(n), `分类里的 ${n} 不是图标`);
  assert.equal(Object.keys(ICON_GROUP_OF).length, ICON_NAMES.length);
});

test("每个图标都有中文关键词", () => {
  for (const n of ICON_NAMES) assert.match(ICON_KEYWORDS[n] || "", /[一-鿿]/, `${n} 没有中文关键词`);
});

test("分类有中英文名", () => {
  for (const g of ICON_GROUPS) assert.ok(g.id && g.zh && g.en && Object.keys(g.icons).length, g.id);
});
