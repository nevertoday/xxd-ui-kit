// 让真的 Chrome 算一遍 color-mix()，存成测试用的对照表（test/fixtures/color-mix.chrome.json）。
// 小程序不能指望 color-mix()，@xxd/mini 在构建时、运行时自己算（src/resolve.js）；这张表用来确认算得和浏览器一样。
// 令牌或主色算法改了以后重新跑：pnpm --filter @xxd/tokens fixture:color-mix
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { mixExpressions } from "../test/mix-cases.mjs";

const require = createRequire(new URL("../../xxd-site/package.json", import.meta.url));
const { chromium } = require("playwright");
const expressions = mixExpressions();
// 需要 Chromium：CHROME_EXE=<Chrome 路径>（缺省用 Playwright 自带的）
const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});
const page = await browser.newPage();
const out = await page.evaluate((list) => {
  const el = document.createElement("div");
  document.body.append(el);
  const result = {};
  for (const expr of list) {
    el.style.color = "";
    el.style.color = expr;
    // Chrome 把 color-mix 的结果写成 color(srgb r g b / a)，0–1 的小数
    const v = getComputedStyle(el).color;
    const m = v.match(/color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/) || v.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);
    if (!m) continue;
    const scale = v.startsWith("color(") ? 255 : 1;
    result[expr] = [Number(m[1]) * scale, Number(m[2]) * scale, Number(m[3]) * scale, m[4] == null ? 1 : Number(m[4])];
  }
  return result;
}, expressions);
await browser.close();
writeFileSync(new URL("../test/fixtures/color-mix.chrome.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`color-mix 对照：${Object.keys(out).length} / ${expressions.length} 个表达式`);
