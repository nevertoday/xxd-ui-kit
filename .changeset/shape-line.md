---
"@xxd/tokens": minor
"@xxd/css": patch
"@xxd/react": patch
"@xxd/mini": patch
---

圆角和线（docs/maintainers/SHAPE-LINE-PLAN.md）：

- 直角就是直角：头像、主色色块、状态点、徽标的点、前后对比图的端点、小程序的骨架屏圆块和步骤序号都跟圆角开关走（`--r-pill`），直角时是方的。只有单选和转圈永远是圆。
- 线的颜色只看用途：容器 `--line`，结构线 `--line-strong`，控件 `--line-control`（悬停 `--line-control-hover`），当前 `--action`，出错 `--danger`。
  - 次要、描边按钮的边和输入框一样深（以前浅一档，同一行一深一浅）；有边的按钮悬停时边深一档。
  - 按下的按钮、chip、聚焦的输入框和下拉都用 `--action`；危险描边按钮用 `--danger`；正文表格的表头线改成灰的结构线。
- 环：头像的会员环和色块选中环一样（隔 2px + 环 1.5px）；卡片角标不再写死白色；新令牌 `--swatch-edge`。
