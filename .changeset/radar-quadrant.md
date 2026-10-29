---
"@xxd/css": minor
"@xxd/react": minor
---

雷达图和四象限（docs/maintainers/CHART-TYPES-PLAN.md 第 9 节）：

- 雷达图 `Radar`（`data-viz="radar"`、`Xxd.viz(el, "radar", …)`、`radarModel`）：只给轴的顺序本身有意义的数据（霍兰德六边形），
  网格是发丝线，自己的面积是主色描边加实色 8%，对照是虚线空心；名字和数字是 HTML 字。设计原则 §14 写明它是放射图里唯一的例外。
- 四象限 `Quadrant`（`data-viz="quadrant"`、`quadrantModel`）：两个维度各有切分点，四格有名字，当前格是选中底色加主色线，重点的点实心。
- 两种图的图形都是 `role=img` 加一句话；高对比、打印都有。`xxd.min.css` 预算 26 → 27 KB，`xxd.shadow.css.js` 27 → 28 KB，`viz.js` 10 → 11 KB。
- 小程序版还没有。
