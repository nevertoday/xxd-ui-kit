---
"@xxd/mini": minor
"@xxd/tokens": minor
"@xxd/extension": minor
---

小程序对抗测试（docs/maintainers/MINI-REVIEW-PLAN.md）：

- 稳定性：一页一个浮层栈管返回键（`page-container` 一页只能有一个）；轻提示单独的 context、只在看得见的页面画；
  对话框异步确认自动加载中、防连点、出错不关；输入框打字时不写回（不打断中文输入法）、超长截掉并提醒；导航栏读不到胶囊时有兜底；
  上传排队（缺省同时 3 张）、移除时取消、`maxSize`；浮层打开时页面对读屏隐藏。
- 手指和键盘：所有能点的东西点按区 ≥ 44 × 44；`Cell` 放开关、复选框时整行可点；底部面板跟着键盘升起、按住把手往下拖可以关；
  左滑每 16ms 最多更新一次、`SwipeGroup` 一次只开一行、读屏有「更多操作」；`useLongPress` 轻震。
- 底部：令牌 `--tabbar-h`、`--bottombar-h`、`--text-tab`；`XxdPage` 算 `--bottom-inset`；新组件 `BottomBar`、`Stepper`、`DatePicker`、`Result`；
  标签栏用小程序自带的（`custom: true` + `TabBarHost`），`new-mini` 模板一起改；`doctor` 报页面里自己放的 `<TabBar>`。
- 好看：一行字的列表行 52px、手机上的字 ≥ 12px、导航栏标题居中、说明和字数一行、空状态放大、主色色块 6 × 2、选中的标签满色边。
- 图标的数据一页只写一次（`--xi-n` 变量）。样式体积预算 64 → 68 KB（四个新组件）。
