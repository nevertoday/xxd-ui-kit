// 体积预算（gzip 后）：插件里每个页面都要加载这几个文件。超了先想想是不是该拆，而不是直接调高预算。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

// boot.js 2026-10-18 从 3.5 调到 5：主色改按色阶算（COLOR-SCALE-PLAN），首帧就要用 OKLCH 算出主色和带色调的灰，不然选了主色的人第一帧会闪
// viz.js（量表和图型的换算、HTML；只有用到图的页面加载）：10 KB
// xxd.min.css 2026-10-19 从 22 调到 24：图型计划（CHART-TYPES-PLAN D48）加了条形榜、构成条、百格图、热力格、前后对比和图例，约 1.5 KB
const BUDGET_KB = { "xxd.min.css": 24, "xxd.js": 32, "boot.js": 5, "viz.js": 10, "icons.js": 16, "xxd.shadow.css.js": 24 };

describe("体积预算", () => {
  for (const [file, kb] of Object.entries(BUDGET_KB)) {
    it(`${file} ≤ ${kb}KB gzip`, () => {
      const size = gzipSync(readFileSync(join(import.meta.dirname, "../dist", file))).length / 1024;
      expect(Number(size.toFixed(1))).toBeLessThanOrEqual(kb);
    });
  }
});
