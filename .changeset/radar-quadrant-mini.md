---
"@xxd/css": patch
"@xxd/react": patch
"@xxd/mini": minor
---

小程序版的雷达图和四象限（CHART-TYPES-PLAN 第 9 节）：

- `@xxd/mini` 加 `Radar`（网格和面积画成一张 SVG 图片，颜色从当前外观算；`radarSvg`、`RADAR_PAINT`）和 `Quadrant`，换算和网页版同一份。
- 网页版一起改：四象限的四格改成按切分点绝对定位（不用 grid）；`translate:` 改成 `transform`、`em` 改成 `--text-sm` 的倍数；
  雷达图的名字不再从英文单词中间断开，有对照时（`data-compare`）上下多留一行。
- 小程序样式预算 89 → 93 KB。
