---
"@xxd/css": minor
"@xxd/react": minor
"@xxd/mini": minor
---

图解第一批（docs/maintainers/DIAGRAM-PLAN.md）：说明「怎么运作」的图，新分类「图解」。

- 步骤 `.xxd-steps` / `Steps`：一件事分几步，做完的打勾，当前这步是选中底加主色线，还没到的是灰字；横排看进度、竖排（`data-vertical`）带说明，
  容器窄于 480px 自己变竖排，不横向滚动。做完的步可以点回去（`.xxd-steps__link`，React 的 `onStepClick`），当多步表单的步骤条用。
- 时间线 `.xxd-timeline` / `Timeline`：时间在左，一根竖线串起每条；重点（`data-highlight`）主色，还没发生的（`data-upcoming`）空心点、灰字，通到它的那一段是虚线；窄于 360px 时时间写到标题上面。
- 两个都是有序列表，连线是伪元素的边框：高对比模式下换成系统色，打印、从右往左都跟着走；只用 flex 和定位，小程序的 Skyline 也排得对。
- @xxd/mini：原来的 `Steps` 改成和网页版一样的样子（横排也有编号和勾，当前这步有记号），读屏名字写出「已完成」「当前」；新加 `Timeline`。
- 超过 9 步 / 9 条时 React 和小程序提醒一次，不截掉。
- 门禁：audit 加 `--only=diagram`。
