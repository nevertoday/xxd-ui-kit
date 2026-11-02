---
"@xxd/tokens": minor
"@xxd/css": minor
"@xxd/react": patch
---

控件高度只有一把尺（COMPONENT-JURY-PLAN J1）：`data-size` 写同一档，按钮、图标按钮、输入框、搜索、下拉、输入组、自定义下拉、标签输入、分段、chip 就一样高（xs 24 · sm 32 · 缺省 40 · lg 48；紧凑 20 / 26 / 32 / 40；触屏 sm 和缺省 44、lg 52）。新令牌 `--control-h-lg`；输入组、自定义下拉补上 xs / lg，标签输入补上 sm / lg，chip 补上 xs / md / lg；分段控件的缺省高度从 32 改成和按钮一样的 40（要以前的样子写 data-size="sm"）；大号输入框从 44 改成 48。React 的大号输入框、大号图标按钮也跟着这把尺。手机上带 data-size 的对话框也变成整宽的底部抽屉（J2）。
