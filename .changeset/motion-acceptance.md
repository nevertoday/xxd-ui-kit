---
"@xxd/tokens": minor
"@xxd/css": patch
"@xxd/react": patch
"@xxd/mini": patch
"@xxd/extension": patch
---

动效和交互反馈（docs/maintainers/MOTION-REVIEW-PLAN.md）、7 条验收指标核查（docs/maintainers/ACCEPTANCE-REVIEW.md）：

- 按下立即有反馈：
  - 按钮按下的底色不再淡入 140ms（快点一下以前看不到）；
  - 菜单项、选项、工具条、侧栏、分页、chip、可点的行和卡片等按下深一档；链接按下下划线变字色。
- 进行中晚 150ms 才露出来（快的操作不闪）；减少动效下按钮里的转圈慢淡入淡出，不定住；没图标的按钮完成时中间一个勾；`runBusy` 进行中再点返回正在跑的那个任务。
- toast 时长按内容算（2.6–8 秒，出错至少 6 秒，带撤销 10 秒），页面在后台时暂停；模态对话框开着时 toast 放进对话框里。
- 状态优先级：禁用 > 进行中 > 出错 > 选中 > 焦点 > 按下 > 悬停。
  - 选中的行 / 卡片悬停不再丢选中样式；
  - 幽灵按钮的 `aria-pressed` 看得出来了；
  - 分段、tab、chip、链接、输入组有了禁用；出错又聚焦是 2px 红边；
  - 能打字的框聚焦是 2px 的边；裸下拉聚焦和出错看得见了。
- 嵌套的层：
  - 面板 / sheet 上再开确认框，键盘和 Esc 归确认框；面板里的下拉、拖动排序先拿到 Esc；
  - 打开浮层的按钮被删了，焦点回到下面一层；
  - 模态对话框开着时背后不滚。
- 焦点环不再被裁（tab、面包屑、代码块）；可点的列表行用 `<button class="xxd-list__main">`，键盘到得了。
- 拖动排序：单击把手拿起、出现「上移 / 下移」（WCAG 2.5.7）；拖动中 Esc 放回；拿起后 Tab 走了当作放下。两次确认双击不算、Esc 退回。导入设置可以撤销。
- 令牌和外观：
  - React 组件、tooltip 跟着页面里局部的亮 / 暗；主色 + 局部暗色的开关、主色 + 高对比的线修好；
  - `--icon-button` 跟 `--control-h`，菜单项跟密度；局部 `data-corners` 生效；新令牌 `--motion-out`。
- 分段控件加 `data-size="sm | lg"`，头像加 `data-size`，`data-optional` 不写值时显示「可选」，图卡在网格里不被拉开。
