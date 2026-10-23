# xxd-ui-kit 开发计划

> 状态：阶段 0–6 已完成，阶段 7 的准备已完成（2026-10-12）。后续每个阶段开工前先读本文件和 `DESIGN-PRINCIPLES.md`，
> 完成后在「进度」里打勾并写日期。计划变了就改这里，不另起文档。

---

## 1. 要解决什么

一套设计系统，同时服务三类产品：

| 产品 | 技术栈（现状） | 数量 | 怎么用这套系统 |
| --- | --- | --- | --- |
| **小小东提示词会员站**（vip.xiaoxiaodong.ai） | 原生 JS 模块 + esbuild，Cloudflare Worker | 1 | 令牌 + 原生 CSS 组件，逐步替换 |
| **Chrome 插件**（长文发布、排序链接、批量存图、OCR、录屏……） | 原生 JS，大多无构建；少数 esbuild | 20+ | 令牌 + 原生 CSS 组件 + 插件套件 |
| **以后的 React 项目**（像 wechat-radar 这类 Next.js） | React + Tailwind | 少 | React 组件（Kumo 换皮） |

现在的问题：同一套审美在 xPoster 的 `xxd-theme.css`、会员站的 `styles.css`、各插件的 `sidepanel.css` 里各写一遍，
值大体一致但已经分叉（例如 muted 是 `#6f6f6f` 还是 `#777`、圆角 token 叫 `--r-*` 还是 `--ui-radius*`）。
每个新插件都从复制粘贴开始。

**目标**：一个仓库、一份令牌、一套组件；新插件 10 分钟内拿到完整的「小小东外观」（亮/暗、直角/圆角、主色、三语、设置页外观组）。

## 2. 关键判断

**为什么不是「把 Kumo 换个颜色」就完事**：你 95% 的项目是原生 JS，Kumo 是 React + Tailwind。
直接用 Kumo 只能覆盖极少数项目。所以 Kumo 是**底子和参照**，不是全部。

**Kumo 里值钱、要留下的**

- 组件清单和 API 设计（40 个组件，复合组件写法、variant 定义 `KUMO_*_VARIANTS`）
- Base UI 带来的无障碍交互：键盘、焦点管理、ARIA —— 这部分自己写最容易出错
- 语义 token 体系 + lint 强制「只能用 token，不许写 `bg-blue-500`」
- 组件注册表 `ai/component-registry.json` + CLI（`kumo ls / doc`）—— 让 Claude/Codex 能查组件 API
- Astro 文档站、单元测试（1450 个，基线全绿）、视觉回归思路

**Kumo 里要换掉的**

| Kumo | 换成 |
| --- | --- |
| 橙色品牌色 `#f6821f`、蓝色链接/info | 墨色 `--action`（主色可选） |
| 中性灰暗色 | 暖黑 `#171612 / #201f1a` |
| 到处 `rounded-lg / rounded-md`（Tailwind 写死） | 映射到 `--r-*`，默认直角 |
| `rounded-full` 31 处混用 | 拆成 `--r-pill`（跟开关）和 `--r-circle`（语义圆） |
| Phosphor 图标（28 个组件依赖） | 小小东线性图标（1.5 线宽、miter、方角） |
| `data-mode="dark"`、`data-theme="fedramp"` | `data-theme="light/dark"` + `data-corners` + `data-accent` |
| 卡片/按钮的阴影、`ease-bounce` | 无阴影；只动 opacity/transform，不弹跳 |
| Cloudflare logo、FedRAMP 主题、GitHub CI、Figma 插件、截图 Worker | 删除或停用 |

**插件的特殊情况**

- MV3 不能加载远程代码 → 组件文件必须**拷进**每个插件（vendor），不能走 CDN。
- 往第三方页面（X、小红书……）注入 UI → 必须 Shadow DOM 隔离；`:root` 在 shadow root 里不生效，令牌要有 `:host` 版本。
- 主题/圆角/主色存在 `chrome.storage`，但必须首帧前生效 → `boot.js` 读 localStorage 镜像（xPoster 的 `theme-boot.js` 已验证可行）。

## 3. 架构

```
xxd-ui-kit/
├── packages/
│   ├── xxd-tokens/        L0  令牌唯一来源：tokens.css（已有种子）→ 生成 tokens.shadow.css / tokens.json / tokens.ts
│   │                          + boot.js（首帧前写 data-theme/corners/accent）+ accent.js（18 预设 + 对比度提亮）
│   ├── xxd-icons/         L0  图标：SVG 源 → 字符串导出（原生 JS）+ React 组件；规则测试
│   ├── xxd-css/           L1  原生组件：.xxd-btn / .xxd-field / .xxd-tabs …… 纯 CSS + 极少行为 JS
│   │                          （dialog / menu / tabs / toast / segmented），不依赖任何框架
│   ├── xxd-react/         L2  React 入口：薄包装，重导出 packages/kumo 的组件 + 引入小小东主题
│   ├── kumo/              L2  上游 React 组件库（在这里换皮；目录名不改，方便合并上游）
│   ├── xxd-extension/     L3  Chrome 插件套件：MV3 模板（sidepanel / popup / options / content UI）、
│   │                          「外观」设置组、chrome.storage 同步、三语 i18n、Shadow DOM 挂载器、vendor 同步脚本
│   ├── kumo-docs-astro/   文档站 → 改造成 xxd 文档站：每个组件展示 直角/圆角 × 亮/暗 × 墨色/主色
│   ├── kumo-figma/        停用（不删，避免和上游冲突）
│   └── kumo-screenshot-worker/  停用
├── docs/
│   ├── PLAN.md            本文件
│   ├── DESIGN-PRINCIPLES.md   审美宪法
│   ├── UPSTREAM.md        如何同步 Kumo 上游
│   └── upstream/          Kumo 原版 README / AGENTS
└── LICENSE                MIT；Kumo 部分的 MIT 原文在 LICENSE-KUMO
```

依赖方向只能往下：L3 → L1/L2 → L0。L1 和 L2 互不依赖，但**同一个组件的视觉必须一致**，文档站并排展示两者。

**分发方式（不发 npm）**

- 有构建的项目（会员站、esbuild 插件、React 项目）：`"@xxd/tokens": "file:../xxd-ui-kit/packages/xxd-tokens"` 或 `link:`。
- 无构建的插件：`pnpm xxd sync <插件目录>` 把编译好的 `xxd.css / xxd.js / icons` 拷进 `<插件>/vendor/xxd/`，
  并写 `vendor/xxd/VERSION`（版本 + commit），这样每个插件锁定自己用的版本，打包上架不依赖本仓库。
- 要给别人的 React 项目用时，再决定发不发 npm。

## 4. 阶段

每个阶段都有：任务、产出、验收标准。验收没过不进下一阶段。

### 阶段 0 · 地基 ✅ 2026-10-11

- [x] 克隆 Kumo 完整历史（`upstream` 远端，push 已禁用），本地 `main` 分支
- [x] 许可：根 `LICENSE` 写小小东的部分，Kumo 的 MIT 原文移到 `LICENSE-KUMO`；所有 package `private: true`（防止误发 npm）；changeset `access: restricted`。2026-10-12 根 `LICENSE` 定为 MIT，各包 `license` 字段改为 `MIT`
- [x] 删除 `.github/`（Cloudflare 的 CI、npm 发布、bonk 机器人）
- [x] 基线：`pnpm install` + `pnpm --filter @cloudflare/kumo build` 成功；`test` 64 文件 / 1450 测试全绿（Node 26.11 / pnpm 12.3.4）
- [x] `packages/xxd-tokens/tokens.css` 种子：从 xPoster `xxd-theme.css` + 会员站移植，补上字号、间距、控件尺寸、图标尺寸、动效、层级
- [x] `docs/DESIGN-PRINCIPLES.md`、本计划、`docs/UPSTREAM.md`、根 `README.md` / `AGENTS.md` / `CLAUDE.md`

### 阶段 1 · 令牌与图标（L0）✅ 2026-10-11

目标：所有项目都能用的地基，先在一个静态页面里看到效果。

1. **令牌生成器**：`tokens.css` 保持人写的唯一来源；脚本生成
   - `tokens.shadow.css`（`:root` → `:host`，`html[data-*]` → `:host([data-*])`）
   - `tokens.json`（给文档站、Figma、对比度检查用）
   - `tokens.ts`（类型化的 token 名，给 React/TS 项目）
2. **`boot.js`**：移植 xPoster `theme-boot.js`。读 localStorage 镜像，首帧前写 `data-theme / data-corners / data-accent / data-density`；
   支持「跟随系统」主题；同时写 `data-mode`（桥接 Kumo 的少量 `[data-mode=dark]` 选择器）。
3. **`accent.js`**：移植 xPoster `accent-color.js`（18 预设 + 自定义色），输出 `--action-custom*` 亮暗两套；
   提亮/加深算法保证标记 ≥ 3:1、文字 ≥ 4.5:1。
4. **对比度门禁**：测试遍历 18 预设 × 亮/暗 × {文字、标记、on-action}，全部达标才通过；muted/muted-2 在 paper/wash 上的对比度也测。
5. **`xxd-icons`**：
   - 合并会员站 `src/lib/site-icons.js`（245 行）和 xPoster 用到的图标，统一成 `icons/*.svg`
   - 构建出 `icons.js`（SVG 字符串，`class="ui-icon"`）和 React 组件
   - 规则测试：viewBox 24、stroke-width 1.5、linecap round、linejoin miter、无 fill、`<rect>` 无 `rx`、除白名单（clock / play / search）外无 `<circle>` 弧线
6. **`tokens-preview.html`**：一个静态页，展示颜色、圆角、字体、间距、图标、动效；顶部三个开关切换主题/圆角/主色，用来目测。

验收：预览页在亮/暗 × 直角/圆角 × 18 主色下没有对比度问题；刷新无闪烁；对比度和图标测试通过。

### 阶段 2 · Kumo 换皮（L2）✅ 2026-10-11

目标：Kumo 的 40 个组件长成小小东的样子，文档站可以直接看。先做这个，是因为改的主要是 token 映射，速度快，
而且换完的文档站就是阶段 3 原生组件的**视觉规格书**。

1. **颜色映射**：改 `scripts/theme-generator/config.ts`（不要手改生成的 `theme-kumo.css`），54 个颜色 token 逐个指向小小东令牌：
   `kumo-base → --paper`、`kumo-elevated → --bg`、`kumo-recessed → --wash`、`kumo-line → --line`、
   `text-kumo-default → --ink`、`subtle → --muted`、`brand → --action`、`link → --action-text`、
   `success / danger / warning → 同名`、`info → 中性（墨色）`；badge 的 orange/teal 收敛成中性 + 语义色。
   把映射表写进 `docs/token-map.md`。
2. **暗色桥接**：Kumo 用 `light-dark()`，靠 `color-scheme` 切换 —— 我们的 `[data-theme=dark]` 已设 `color-scheme: dark`，只需在主题文件里确认 light-dark 两侧都指向我们的变量。去掉 fedramp 主题的构建入口。
3. **圆角映射**：在 Tailwind 主题里用 `@theme inline` 把 `--radius-xs/sm/md/lg/xl` 指向 `--r-*`（inline 保证局部 `data-corners` 也能生效）；
   审计 31 处 `rounded-full`：开关、pill 标签 → `rounded-pill`（新工具类 = `--r-pill`），头像/状态点/色块 → `rounded-circle`；
   日期选择器的 `--rdp-*-border-radius: 0.375rem` 和 `kumo-binding.css` 里的 `2px` 也改走 token。
   加 lint：组件里禁止 `rounded-[*px]` 和写死的 `border-radius`。
4. **图标替换**：新增 `IconProvider` 或直接把 28 个组件里的 Phosphor 引用换成 `@xxd/icons/react`；
   `@phosphor-icons/react` 从 peer 依赖移除。
5. **形态规则**：去掉卡片/按钮/行的阴影；`--ease-bounce` 删除；按钮、输入框、Select、Tabs、Switch、SegmentedControl、Dialog
   逐个对照 `DESIGN-PRINCIPLES.md` 第 4–10 节调整（例如 Select 是「值 + chevron」、Tabs 是基线文字 + 滑动墨线、Dialog 取消在前且内容宽度）。
6. **字体**：typography token 改成 `--font-body / --font-title`、字号刻度、字重 400/500/600。
7. **`packages/xxd-react`**：`@xxd/react` 薄包装 —— 重导出 `@cloudflare/kumo`，`@xxd/react/styles` 引入 tokens + 主题。消费者只认 `@xxd/react`，
   内部包名不改，上游合并零冲突。
8. 每改一个组件跑一次测试；Kumo 原有测试里断言具体 class（如 `rounded-lg`）的，改断言而不是删测试。

验收：`pnpm dev` 打开文档站，所有组件在四种组合（亮/暗 × 直角/圆角）下符合原则；1450 个测试仍然全绿（或改断言后全绿）；lint 通过。

### 阶段 3 · 原生 CSS 组件（L1）✅ 2026-10-11

目标：插件和会员站真正要用的那一层。以阶段 2 的文档站为视觉规格，写不依赖框架的版本。

**P0 —— 插件高频，先做**

| 组件 | 要点 |
| --- | --- |
| Button | primary（--action 实心）/ secondary / ghost / danger / icon；loading；`aria-pressed` 切换态 |
| Field + Input / Textarea | 标签、帮助文字、错误；聚焦只变深边框一次 |
| Select | 「值 + chevron」；原生 `<select>` 美化，不重写下拉 |
| Switch / Checkbox / Radio | 直角下开关是方的 |
| Segmented | 托盘 + 选中段像纸浮出 |
| Tabs | 基线文字 + 滑动短墨线；切换原地淡入 |
| Settings group | 灰色小标题 + 框住的主体 + 行间细线；行 = 标题 / 说明 / 控件 |
| List rows | 只在行之间画线；选中 = 淡色 |
| Tooltip | 11px，小阴影 |
| Toast | 就地出现（面板内 / dock 上方 8px） |
| Dialog | 按钮层级合同（取消在前、内容宽度、`ui-dialog-cancel`）；`<dialog>` 原生实现 |
| Menu | 菜单 + 键盘导航 |
| Dock + Sheet | 底部任务控制台；sheet 从 dock 升起 10px / 200ms |
| Empty / Loader / Progress / Badge | |

**P1**：Combobox、搜索框（⌘F / Esc）、Popover、Banner、Pagination、轻量 Table、Collapsible、复制按钮、代码块、Kbd、
头像（圆）、主色色块选择器、**外观设置行**（主题 · 圆角 · 主色 · 语言 —— 每个插件都要的那一组）。

**P2**：阅读排版（会员站文章 prose）、右侧详情面板壳、瀑布流提示词卡片（角标规则）、侧栏 rail、Breadcrumbs、Slider、TagInput、DatePicker、CommandPalette。

做法：

- 类名前缀 `xxd-`，状态用属性（`[aria-pressed]`、`[data-state]`），不用 `.is-active` 之类。
- 行为 JS 每个组件一个小模块（ESM，无依赖），可选加载；没有 JS 也能看、能用基础功能。
- 产出 `dist/xxd.css`（全量）和按组件拆分的 CSS，`dist/xxd.js`。
- 合同测试（像会员站 `*-contract.test.mjs`）：对话框按钮顺序、圆角只走 token、无卡片阴影、字重三档、减少动效。

验收：文档站每个组件「React / 原生」并排、视觉一致；合同测试通过；`xxd.css` 全量 gzip < 25KB（提议目标）。

### 阶段 4 · Chrome 插件套件（L3）+ 试点 ✅ 2026-10-12

1. **`xxd-extension` 模板**：MV3 `manifest.json`、`sidepanel.html / popup.html / options.html` 骨架，已接好 tokens + xxd.css + boot.js；
   `_locales` 三语（简 / 繁 / 英）。
2. **设置同步**：`chrome.storage.sync` 存主题/圆角/主色/语言，写 localStorage 镜像给 boot.js；多页面实时同步（`storage.onChanged`）。
3. **Shadow DOM 挂载器**：`mountXxdUI(hostElement)` —— 建 shadow root、注入 `tokens.shadow.css + xxd.css`、把 data 属性同步到 host。
4. **`pnpm xxd sync <插件目录>`**：拷贝到 `vendor/xxd/` + 写 VERSION；`pnpm xxd new <名字>` 从模板新建插件。
5. **试点迁移**：选一个小插件（建议 `插件chrome-排序链接`，有 DESIGN.md、体量小）完整迁移；然后迁移 xPoster 的设计令牌部分（只替换 `xxd-theme.css` 为 vendor 版本，验证零视觉差异）。
6. 和现有技能衔接：`cx-chrome-zip` / `xxd-chrome-publish` 打包时确认 `vendor/xxd/` 被带上。

验收：`pnpm xxd new 测试插件` 生成的插件能直接「加载已解压的扩展程序」，四种外观组合切换无闪烁；试点插件迁移后功能无回归。

### 阶段 5 · 会员站接入 ✅ 2026-10-12

会员站体量大、有大量门禁测试，所以渐进：

1. 把会员站 `:root` 里的通用 token 改为引入 `@xxd/tokens`，旧名（`--ui-radius*`、`--active-*` 等）先做别名，保证零视觉变化；会员站锁死 `data-corners` 为直角。
2. 新功能用 xxd-css 组件；旧组件按页面逐步替换，每次一个模块。
3. 会员站的 site-icons 改为从 `@xxd/icons` 取，保留现有图标测试作为门禁。

验收：会员站现有测试全过；桌面/移动截图对比无意外变化。

### 阶段 6 · 文档站与 AI 可查 ✅ 2026-10-12

1. 文档站改造：首页讲原则；每个组件页有四种外观切换、React 与原生两份代码、注意事项（对应原则条目）。
2. 组件注册表覆盖原生组件；CLI 改名 `xxd ls / doc / add`，Claude/Codex 写插件时可以直接查 API。
3. 写一个 `xxd-ui` Skill：新插件、新页面时自动用这套系统、遵守原则、跑合同测试。
4. 展示站 2026-10-12 部署到 <https://ui.xiaoxiaodong.ai>（见 `docs/DOCS-SITE.md`）。

### 阶段 7 · 开源准备 ✅ 准备完成 2026-10-12

清理内部引用、重新确认许可证、写贡献指南、决定是否与 Kumo 上游脱钩并改内部包名。

## 5. 上游同步策略

见 `docs/UPSTREAM.md`。要点：阶段 2 期间每两周看一次上游；改动尽量放在主题配置、新文件和薄包装里，少改组件内部；
当换皮改动大到合并成本高于收益时，在本文件记录「脱钩」决定。

## 6. 风险

| 风险 | 对策 |
| --- | --- |
| Kumo 组件内部写死 class，换皮改动多、上游合并冲突多 | 优先改 token 和 Tailwind 主题映射；组件内部改动集中、有记录；必要时脱钩 |
| 原生组件和 React 组件视觉漂移 | 文档站并排展示 + 共用同一份 tokens + 视觉回归截图（阶段 3 后期） |
| 插件 vendor 拷贝导致版本散落 | `VERSION` 文件 + `pnpm xxd status` 列出每个插件用的版本 |
| Node/pnpm 版本：Kumo 要求 Node ^24.12，本机是 26.11 | 目前构建和测试都能过；出问题时用 `.node-version` 固定 24 |
| 会员站迁移影响线上 | 别名过渡 + 现有门禁测试 + 只在 Cloudflare 预览环境验证后再上线 |

## 7. 决定（2026-10-12 按默认处理，可以改）

1. 包名前缀 `@xxd/*`；目录名 `xxd-ui-kit` 不改。
2. GitHub 仓库：2026-10-12 按你的要求建了**公开**仓库并推送 `main`：<https://github.com/nevertoday/xxd-ui-kit>（`upstream` 的推送仍然禁用）。
3. 三条提议都采纳：密度两档（`data-density`）、Shadow DOM 注入（`mountXxdUI`）、规则做成门禁（各包的合同测试）。
4. 试点：图片排序（排序链接）+ xPoster 的令牌层。

## 8. 进度

| 阶段 | 状态 | 日期 |
| --- | --- | --- |
| 0 地基 | ✅ 完成 | 2026-10-11 |
| 1 令牌与图标 | ✅ 完成 | 2026-10-11 |
| 2 Kumo 换皮 | ✅ 完成 | 2026-10-11 |
| 3 原生组件 | ✅ 完成 | 2026-10-11 |
| 4 插件套件 + 试点 | ✅ 完成 | 2026-10-12 |
| 5 会员站接入 | ✅ 完成（在会员站仓库的分支上，未合并、未部署） | 2026-10-12 |
| 6 文档站与 AI | ✅ 完成 | 2026-10-12 |
| 7 开源准备 | ✅ 完成（清理自查、许可、贡献指南、上游决定）；2026-10-12 定为 MIT 开源 | 2026-10-12 |

## 9. 各阶段做了什么（摘要）

- **1 令牌与图标**：`@xxd/tokens`（tokens.css 唯一来源 → shadow / layered / json / d.ts；boot.js 首帧外观；主色 18 预设与对比度提亮；对比度门禁）；`@xxd/icons`（201 个图标，会员站画法，规则门禁，SVG 字符串 / React / Phosphor 兼容层）；`packages/xxd-tokens/preview.html`。
- **2 Kumo 换皮**：`xxd-overrides.ts` 把 54 个颜色 + 16 个文字 token 指向小小东变量（`docs/token-map.md`）；Tailwind 圆角与阴影映射到令牌；`rounded-full` 拆成 `rounded-pill` / `rounded-circle`；图标换成 `@xxd/icons`；开关 / 复选 / 单选 / 分段选中跟主色；`@xxd/react` 包；合同测试；文档站外观开关与 `/xxd/showcase`。Kumo 1456 个测试全过。
- **3 原生组件**：`@xxd/css`，43 个组件（P0 / P1 / P2，注册表 `registry.json`），行为 JS（对话框、菜单、tabs、分段、toast、sheet、面板、combobox、标签、搜索、命令面板、外观组），合同测试（圆角、阴影、字重、动效、颜色、对话框层级）+ 行为测试；gzip CSS 9KB、JS 9KB；`packages/xxd-css/playground.html`。
- **4 插件套件**：`@xxd/extension`（MV3 模板、`chrome.storage` 外观同步、Shadow DOM 挂载、三语 i18n、`pnpm xxd new / sync / status`、`xxd.config.json`）。试点：图片排序插件的分支（330 个元素样式指纹：暗色全同、亮色只有 muted 对比度修正；16 组对抗探针在原版和分支上逐项相同；打包检查通过）；xPoster 的分支（89 个令牌值全同，`npm test` 前后都通过）。
- **5 会员站**：在会员站仓库的分支上：layered 令牌（老变量永远优先，自动跳过 4 个有后备值冲突的名字）、`pnpm xxd adopt` 把 8 个相同的声明改由令牌提供、旧名 `--ui-backdrop` 做别名（`--ui-radius*` 按直角硬规则保持字面 0）、图标改由 `@xxd/icons` 同步。验证：404 个变量亮暗最终值全同；220 个图标渲染逐个相同；全量测试与 main 逐条一致。通用做法见 `docs/existing-site.md`。
- **6 文档站与 AI**：`/xxd`（原则）、`/xxd/native`（由注册表生成）、`/xxd/extension`；`pnpm xxd ls / doc / add`；`xxd-ui` Skill（`skills/xxd-ui`）。部署说明见 `docs/DOCS-SITE.md`（没有部署）。
- **7 开源准备**：
  - 清理内部引用：`scripts/open-source-audit.mjs` 自查，提交的文件里没有本机路径、邮箱、微信号、商店 ID；许可声明已换成 MIT，剩下的上游品牌见清单。
  - 许可：根 `LICENSE`（MIT）+ `LICENSE-KUMO`（Kumo 的 MIT 原文）；`packages/kumo` 和文档站补上了随包的 `LICENSE`（MIT 原文 + 改动的版权）；各包 `license` 字段逐个核对。
  - 贡献指南：`CONTRIBUTING.md`（上游的移到 `docs/upstream/KUMO-CONTRIBUTING.md`）。
  - 上游决定：继续同步、内部包名不改，量化依据和脱钩条件见 `docs/UPSTREAM.md`。
  - 推到公开仓库前的收尾：`docs/maintainers/OPEN-SOURCE-CHECKLIST.md`。

## 10. 不在计划范围内、留给你决定的事

计划的 0–7 阶段都已完成（各阶段的验收见上）。下面这些不是计划的任务，而是需要你本人决定的对外 / 不可逆操作：
**你的决定（2026-10-12）：三个试点分支先不合并，由你看过后自己合并；项目定为 MIT 开源。**

项目以 MIT 许可开源，公开在 <https://github.com/nevertoday/xxd-ui-kit>；试点的验收是「在分支上迁移并用测试证明无回归」，合并进你正在工作的分支、推送、部署都由你来做。

- 合并三个试点分支（都没推送；分支在各自的仓库里，不在这里记录）。
- （可选，属于新的视觉改动，不是接入的一部分）会员站几个有冲突的变量（`--danger` 五种红等）要不要统一。
- 是否发 npm。
