---
"@xxd/tokens": minor
"@xxd/css": minor
"@xxd/react": patch
---

手机和触屏（docs/maintainers/TOUCH-REVIEW-PLAN.md）：

- 手机、平板（粗指针）上控件 44 高；能打字的框字号 16px（iOS 一聚焦就放大整页的问题没了），React 一样。
- 点按区：按钮按自己的大小往四周补到 44（以前小按钮只有 34、超小 26，纯图标按钮也窄）；触屏上分段、chip、tab、分页、色块、开关、复选这些小东西补到 44，
  侧栏项、分页、小号的框 44 高，文字链接、文字按钮补到 24。
- 手指点过以后悬停的样子不再留在那儿：构建时把悬停规则包进 `@media (hover: hover)`（源码照旧写 `:hover`；React 的绑定层也一样）。
- 浮层里滚到头不接着滚后面的页面；dock、toast、底部抽屉、图片查看器让出 iPhone 的安全区（页面写 `viewport-fit=cover` 时生效）；手指点按不弹提示。
- 门禁：audit 加 `--only=touch`。
