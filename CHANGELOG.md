# 更新日志

[English](CHANGELOG.en.md) · **中文**

这里记对用的人有影响的改动。`@xxd/tokens`、`@xxd/icons`、`@xxd/css`、`@xxd/react`、`@xxd/extension` 用同一个版本号。
0.x 期间小版本也可能有不兼容的改动，会在「要改的地方」里写清楚。以后每次改动带一个 changeset（见 `.changeset/README.md`），发版时合进这里。

## 0.1.0 · 未发布

第一个公开版本：还没上 npm，从源码用（见 README）。

### 新增

- 原生组件 59 个、模式 18 个（其中插件专用 5 个：权限请求、快捷键、导入导出、更新说明、插件已更新）、整页模板，全部中英两版。
- 图标 500 多个：24 网格、1.5 线宽、方角，按中文关键词搜。
- 命令行 `xxd-ui`：`new`（默认最小插件，`--popup` / `--content` / `--account` 按需加）、`init`、`sync`、`status`、`doctor`、`pack`、`store-icons`、`adopt --dry-run`、`doc`、`icon`、`tokens`；中英两种输出。
- 内容脚本：`mountXxdUI` 把界面放进 Shadow DOM，样式同步挂上（不需要 `web_accessible_resources`），浮层和 toast 进浏览器顶层。
- 无障碍：统一的读屏播报（toast、排序、计数、翻页）；原生浮层是模态的（外面 inert）；菜单、下拉、拖动排序、分栏拖拽都能用键盘；表单错误用 `setFieldError` 关联到字段。
- 令牌：控件边框 `--line-control`（和底色 ≥ 3:1）、实心焦点环 `--focus-color`、字号 24px 一档和 `--leading-*` 行高、紧凑密度的内边距令牌；暗色、紧凑可以只用在页面里的一块（`data-theme` / `data-density` 写在任何元素上）；没有 JS 时跟随系统暗色。
- 质感：离按钮最近的 `data-finish` 说了算，局部 `material`、里面再局部 `flat` 都行。
- 展示站：每页有 `.md` 版本、`llms.txt`；组件页有「什么时候用 / 别用」、React 属性表；带版本号的 CDN 路径 `/v/0.1.0/`。
- 生命周期：`install(root, { signal })` 和 `uninstall(root)`；`mountXxdUI` 的 `destroy()` 会撤掉装在 Shadow 上的监听。同一页面加载了两份 `@xxd/css` 时只装一份。
- 显式传依赖：`useIcons(icons)`（`@xxd/css`）、`useXxd(Xxd)`（`@xxd/extension`）；经典脚本照旧自动用 `window.XxdIcons` / `window.Xxd`。
- 图标：`IconName` 类型；`@xxd/icons/each` 每个图标一个具名导出，打包器只带用到的。
- 类型声明：`@xxd/extension`、`@xxd/tokens/accent`、`@xxd/tokens/theme`、`@xxd/icons/nodes` 都有了。
- React 和原生的控件一样高（标准 40 / 紧凑 32px），外观设置两边叫法一样。
- `xxd-ui pack` 打出来的包能装进仓库外的项目（CI 里有一步真的装进空 Vite 项目检查）。
- 小小东自己写的 React 组件也有属性表（展示站「React 属性」和 `xxd-ui doc <组件> --react`）。
- Shadow DOM 版：`:root:not(…)` 这类选择器现在也正确地变成 `:host(…)`（以前没有 JS 时的暗色兜底在 Shadow 里不生效）。

### 要改的地方

- 修正：`.xxd-page` 里伪元素（`::before` / `::after`）现在也是 `box-sizing: border-box`（以前写在 `:where()` 里，按规范被忽略了）。自己用伪元素画的东西尺寸可能差 1–2px。

- `tokens.css` 现在只有变量：减少动效、主色的选中色和输入光标挪到了 `@xxd/tokens/base.css`。用 `xxd.css` 或 `@xxd/react` 的不用改；只引 `tokens.css` 又想要这几条的，多引一个 `base.css`。
- ESM 里用 `@xxd/css` 并且页面上有 `<i data-xxd-icon>`：调一次 `useIcons(await import("@xxd/icons"))`（以前靠全局的 `window.XxdIcons`）。
- `@xxd/react` 把 Kumo 带在包里，不用（也不要）再装 `@cloudflare/kumo`；Tailwind 项目不用再写 `@source` 指向 Kumo。
- `@xxd/icons/each` 里 `Infinity` 图标叫 `InfinityIcon`（不遮住全局的 Infinity）。
- 质感：`data-finish` 改成离按钮最近的那个说了算（以前外层写了 `flat`，里面的 `material` 不生效）。

- 层叠层顺序改成 `@layer theme, base, xxd, components, utilities;`：和 Tailwind 一起用时，把这一行放在 CSS 最前面。
- `@xxd/react` 只导出列出来的组件（不再整包转出 Kumo），Cloudflare 品牌组件不导出。
- 暗色语义色调暖了一档：如果你截过图做对比，基线要更新。
- 英文名：Panel → Details panel、Confirm twice → Two-step confirm、Write progress pill → Progress pill、Rolling text → Text swap、Glyph grid → Symbol picker；中文名：自绘选择 → 自定义下拉、从底部升起的面板 → 底部面板、右侧详情面板 → 详情面板。类名不变。
