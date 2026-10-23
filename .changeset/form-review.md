---
"@xxd/css": minor
"@xxd/react": patch
"@xxd/mini": patch
---

表单和出错（docs/maintainers/FORM-REVIEW-PLAN.md）：

- `Xxd.setFieldError` 认识所有表单控件：错误放在整个控件下面，不再塞进输入组、标签输入的框里，也不再塞进选择、复选、单选的 `<label>` 里（读屏会把它念成名字）；
  - 单选按组标错；设置行里的控件，错误写在左边那一栏；作者已经写好的 `.xxd-error` 直接复用，不再多出第二行。
- 每种控件都有出错的样子：开关、标签输入、输入组、自定义下拉出错是红边；出错又聚焦是红边 2px。
- 出错不只靠颜色：错误前面一个危险图标；高对比度下出错的框加粗、聚焦有一圈 Highlight。出错时错误顶替说明（字数留着）。
- 新：`<form data-xxd-validate>` / `Xxd.validateForm(form)` / `Xxd.fieldProblem(control)`：用原生约束校验，不冒浏览器的气泡；
  - 三语默认错误句子（带字段名、差多少），`data-error-*` 可以自己写；焦点到第一个错，改对了马上清掉；邮箱、网址里的全角字符先换成半角。
- 新：`.xxd-help[data-counter]` 会跟着输入数字（emoji 算一个），`data-max` 是软上限。
- 输入法拼字时按的回车、Esc 不再被 combobox、命令面板、搜索框、浮层当成操作。暗色下日期框的日历图标看得见了。
- React：出错的输入框和复选框写 `aria-invalid`；字段标签、说明、错误文字的字号和图标、出错的边和 HTML 一样；能打字的框聚焦时 2px。
- 门禁：audit 加 `--only=form`。
