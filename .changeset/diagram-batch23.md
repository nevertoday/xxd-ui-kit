---
"@xxd/css": minor
"@xxd/react": minor
"@xxd/mini": minor
---

图解第二、三批（docs/maintainers/DIAGRAM-PLAN.md 第 9 节）：

- 流程图 `.xxd-flowchart` / `Flowchart`：主线从上往下，一个判断分成 2–3 条，每条前写分支名，合拢（`data-merge`）或者各自结束；箭头指着下一步；容器窄于 480px 时分支上下排、主干在左边。
- 树 `.xxd-tree` / `Tree`：两层以内画成组织图，三层、`data-outline` 或者窄时是缩进的大纲。
- 循环 `.xxd-cycle` / `Cycle`：3–6 步一排，最后一根回头线回到第一步（不画成一圈）；窄时或 `data-vertical` 一步一行，回头线在右边。读屏在最后一步听到「然后回到第 1 步」。
- 分层 `.xxd-layers` / `Layers`：一样宽的横带从上往下叠，上层用下层；重点那一层是选中底加主色线。
- 都是列表，连线是伪元素的边框（高对比、打印、从右往左跟着走），只用 flex 和定位（小程序的 Skyline 也排得对）；超过上限时 React 和小程序提醒一次。
- @xxd/react：Kumo 的 `Flow` 节点去掉阴影、框和连线都换成结构线色（只改样子）。
- 门禁：audit `--only=diagram` 加了逐段量连线（两头接没接上、穿不穿节点、压不压字）。
