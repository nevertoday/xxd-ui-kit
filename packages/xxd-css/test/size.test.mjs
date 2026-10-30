// 体积预算（gzip 后）：插件里每个页面都要加载这几个文件。超了先想想是不是该拆，而不是直接调高预算。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

// boot.js 2026-10-18 从 3.5 调到 5：主色改按色阶算（COLOR-SCALE-PLAN），首帧就要用 OKLCH 算出主色和带色调的灰，不然选了主色的人第一帧会闪
// viz.js（量表和图型的换算、HTML；只有用到图的页面加载）：10 KB
// xxd.min.css 2026-10-19 从 22 调到 24：图型计划（CHART-TYPES-PLAN D48）加了条形榜、构成条、百格图、热力格、前后对比和图例，约 1.5 KB
// xxd.shadow.css.js 2026-10-22 从 24 调到 25：圆角和线（SHAPE-LINE-PLAN）给有边的按钮加了悬停加深一档的边，超了 71 字节；它比 xxd.min.css 多一层 JS 外壳
// xxd.min.css 2026-10-22 从 24 调到 25：动效和验收（MOTION-REVIEW-PLAN、ACCEPTANCE-REVIEW）加了按下立即反馈、状态优先级、禁用 / 出错 / 焦点的补全、
//   整行可点的列表行、拖动排序的「上移 / 下移」，约 0.7 KB；xxd.shadow.css.js 同样多了这些，26
// xxd.js 2026-10-22 从 32 调到 33：截断（TRUNCATION-REVIEW-PLAN D92、D93）——放不下的标签换排法、被省略的字提示全文，约 0.6 KB
// xxd.min.css 2026-10-23 从 25 调到 26、xxd.js 从 33 调到 35：表单和出错（FORM-REVIEW-PLAN）——每种控件的出错样子、错误图标、
//   整张表单的校验（data-xxd-validate）、三语的默认错误句子、字数，约 0.3 KB / 1.8 KB
// boot.js 2026-10-23 从 5 调到 5.5、xxd.js 从 35 调到 36：暗黑模式（DARK-REVIEW-PLAN D108–D110）——打印前换成亮色、切主题那一帧不过渡
//   （要在首帧的脚本里，拆不出去），放到最外层的浮层跟着局部主题，约 0.2 KB / 0.1 KB
// xxd.shadow.css.js 2026-10-23 从 26 调到 27：触屏（TOUCH-REVIEW-PLAN D117、D121）——悬停规则包进 @media (hover: hover)、粗指针的点按区和字号，约 0.4 KB
// xxd.js 2026-10-23 从 36 调到 39：图表（ECHARTS-REVIEW-PLAN D123–D132）——按图种套主题、高对比的系统色、读屏的一句话（三语）、图例让行、类目折行、
//   刻度缩写、watchChartTheme 管尺寸和触屏提示，约 2.6 KB。想过拆进 viz.js：Xxd.chartOptions 是 xxd.js 的公开接口，只加载 xxd.js + ECharts 的页面会丢掉这些修正，所以没拆
// xxd.min.css 2026-10-28 从 26 调到 27、xxd.shadow.css.js 从 27 调到 28、viz.js 从 10 调到 11：雷达图和四象限（CHART-TYPES-PLAN 第 7 节）——
//   两种图的样子、高对比和打印约 0.9 KB；换算和 HTML 约 1.7 KB。图的样子和别的图一样放在 xxd.min.css 里（React、小程序共用一份类名），没有单拆
// xxd.min.css 2026-10-30 从 27 调到 28、xxd.shadow.css.js 从 28 调到 29：图解第一批（DIAGRAM-PLAN）——步骤和时间线，约 0.9 KB；
// 连线是边框、窄了换排法靠容器查询，都在 CSS 里，不加 JS
const BUDGET_KB = { "xxd.min.css": 28, "xxd.js": 39, "boot.js": 5.5, "viz.js": 11, "icons.js": 16, "xxd.shadow.css.js": 29 };

describe("体积预算", () => {
  for (const [file, kb] of Object.entries(BUDGET_KB)) {
    it(`${file} ≤ ${kb}KB gzip`, () => {
      const size = gzipSync(readFileSync(join(import.meta.dirname, "../dist", file))).length / 1024;
      expect(Number(size.toFixed(1))).toBeLessThanOrEqual(kb);
    });
  }
});
