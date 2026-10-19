---
"@xxd/tokens": minor
"@xxd/css": minor
"@xxd/react": minor
"@xxd/mini": minor
---

图型（docs/maintainers/CHART-TYPES-PLAN.md，图型分类参考 lieflat-charts 的「按数据形状选图」；它是非商用许可，没有用它的任何代码）：

- 五个新组件，网页（`@xxd/css`）、React、小程序样子一样：条形榜 `Bars`（重点、按单位切格、正负、漏斗）、构成条 `Proportion`、
  百格图 `Waffle`（1 格 = 1%，最大余数法取整）、热力格 `Heatmap`（日历 / 矩阵）、前后对比 `Dumbbell`。HTML + CSS 画，数字是 HTML 字。
- 换算是纯函数 `@xxd/css/viz`（量表的几何也在里面）；网页版的经典脚本 `dist/gauge.js` 改名 `dist/viz.js`，`useGauge` 改名 `useViz`。
  声明式 `data-viz="bars|proportion|waffle|heatmap|dumbbell"`，`Xxd.viz(el, kind, data, options)`。
- 图例统一成 `.xxd-legend`（量表的图例一起换）；图卡加说明 / 来源行 `.xxd-chart-card__note`；`Xxd.sparkline(values, { type: "bar" })` 迷你柱，小程序 `Sparkline type="bar"`。
- 新令牌 `--heat-1…4`（热力 4 档：墨色时取灰阶，有主色时取主色的色阶，3、4 档上的字用 `--on-action` ≥ 4.5:1）、`--bars-h`。
- 设计原则 §14 加「按数据形状选图」表。`xxd.min.css` 预算 22 → 24 KB，小程序样式 72 → 80 KB。
- 查漏补缺（CHART-TYPES-PLAN 8.1）：条形榜加对照值（`compare`，细灰条）、参考线（`mark`）、刻度和网格（`axis`）、每行旁注（`note`）、瀑布（`variant="waterfall"`）；
  所有图加「没有数据」（`.xxd-viz-empty`）；大数字缩写（`compact`）；构成条 `max`（并排时条长按总量）；量表 `origin`（从某个值往两边长）；
  `chartOptions` 给面积（实色 8%）、散点、`markLine` 配好样子。条形榜和前后对比的所有行共用一套列（subgrid），条长在行和行之间可比。
- 图的 HTML 拼接（`VIZ_HTML`、`gaugeInnerHtml`）挪进 `dist/viz.js`（纯函数，服务端也能用）；`xxd.js` 回到 30 KB，`viz.js` 预算 10 KB，小程序样式 84 KB。
