---
"@xxd/css": minor
"@xxd/react": patch
"@xxd/mini": patch
---

截断和长文字（docs/maintainers/TRUNCATION-REVIEW-PLAN.md）：

- 内容折行，不再省略：
  - 卡片 / 列表 / 面板标题、dock 状态、统计值、量表的数和标签、图例名、条形榜 / 构成条 / 前后对比的类别名；
  - dock 放不下时按钮换到下一行；图例窄了数字换到下一行。
- 标签才省略，而且只在末尾：
  - 按钮、chip、徽标、logo、工具条里的裸文字以前放不下时两边硬裁；现在 xxd.js 量到放不下就标 `data-truncated`，末尾出省略号；
  - 没有 xxd.js 也从开头显示。
- 被省略的字悬停、键盘聚焦时提示全文（不重复播报）。新 API `Xxd.fitText(el)`：字改了、尺寸没变时手动重量。
- 数字不截断；对话框的主操作放不下时整个换到下一行，不把自己挤成省略号。
- React：按钮、徽标、下拉触发器、面包屑可以收缩、出省略号，不再伸出容器。
- 门禁：audit 加 `--only=trunc`。
