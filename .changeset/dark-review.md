---
"@xxd/tokens": minor
"@xxd/css": minor
"@xxd/react": patch
---

暗黑模式（docs/maintainers/DARK-REVIEW-PLAN.md）：

- 页面里写了 `data-theme="dark"`（或 `light`）的一块是一张完整的面：字色、底色跟着换。以前亮页面里一块暗色，没自己写颜色的字是暗底上的黑字。
- 放到页面最外层的浮层跟着打开它的那一块走：toast、确认框、删除确认、命令面板、图片查看器、复制气泡。
- 切主题那一下不过渡：以前整页一下子暗了，按钮、输入框还亮着慢慢变过去。
- 打印永远是亮色：以前暗色页面打出来是白纸上的浅灰字。新 API `watchPrint`（boot.js 自动装）。
- 图表：`watchChartTheme` 也看页面里某一块的主题变化；示例给 `chartOptions` 传 `el`。
- React：Kumo 的代码块、日期选择、骨架屏在 `data-theme="dark"` 的一块里也是暗色。
- 门禁：audit 加 `--only=dark`。
