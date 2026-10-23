---
"@xxd/tokens": minor
"@xxd/css": minor
"@xxd/react": minor
---

设计师评审（docs/maintainers/DESIGNER-REVIEW-PLAN.md）：

- React 和原生 HTML 长得一样：按钮、表单、标签页、徽标、表格、对话框、菜单都对齐到原生，React 主按钮不再默认带渐变。
- 令牌：字号和行高成对（去掉 15px 一档）；间距加两个半档 `--space-0-5`、`--space-1-5`；禁用 `--disabled-ink/-bg/-line`；
  浮层抬起一层 `--paper-raised` 等；三个断点 `--bp-*`；组件尺寸 `--choice-size`、`--switch-w/-h`、`--field-icon-slot` 和标准密度下的内边距令牌。
- 亮色的灰都换成暖灰；开关「开」是墨色；开关 36 × 20；chip 28px，`data-size="sm"` 32px。
- 主色：预设改成 12 个等明度的颜色（去掉 X 蓝）；新设置 `accentMode: "exact"` 让品牌色原样出现在按钮和标记上。
- 图标的线宽在任何尺寸下都是 1.5px；`@xxd/tokens/dist/tokens.resolved.json` 是 8 种外观下每个令牌的具体值。
