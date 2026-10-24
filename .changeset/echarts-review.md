---
"@xxd/css": minor
"@xxd/react": patch
---

ECharts 图表（docs/maintainers/ECHARTS-REVIEW-PLAN.md）：

- `Xxd.chartOptions` 按图种套主题：饼图、漏斗这类按数据上色的图每一块按分类色取（以前每块都是主色），没有坐标轴的图不再多画一副空坐标轴，饼和散点的提示能出来。
- 高对比模式：canvas 不会被系统换色，现在自己换成系统色，柱子和饼加花纹（以前暗底高对比下线和柱子看不见）。
- 读屏：容器上的 aria-label 是自己写的一句话（什么图、几条、从多少到多少、最高最低；饼写占比），简体 / 繁体 / 英文；不再念序号、毫秒数、NaN。
- 图例画出线型（虚线就是虚线），换行时图区往下让；柱状图的类目一个不藏、放不下就折行；横向条形从上往下是给的顺序；刻度数太长时缩写（60亿）；参考线的字在图里、不被裁；字 12px。
- 没有进场动画（设计原则 §14），要动画写 `animation: true`，减少动效时一律不放；第 6 条起画成背景线。
- `Xxd.watchChartTheme` 也管尺寸（不用自己写 ResizeObserver）、高对比和减少动效的切换、触屏上点图外面或滚动时收起提示；令牌没变不重画；图销毁后自己解绑。打印时图按纸宽缩。
- @xxd/react：页面上有小小东的令牌时，Kumo 的 `Chart`、`TimeseriesChart`、`SankeyChart`、地图的颜色从令牌取，网格线是发丝实线（以前是 Cloudflare 的蓝黄粉和虚线）。
- 门禁：audit 加 `--only=chart`。
