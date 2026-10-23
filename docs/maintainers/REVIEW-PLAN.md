# xxd-ui-kit 评审与优化计划（R 阶段）

> 2026-10-12。O1–O11 做完以后，请了一个六人评审团只读审了整个项目，专找不专业、不好用、不够专业的地方。
> 这份文档把 135 条发现去重、复核、分批，作为下一轮优化的依据。
> 开工前读这份和 `DESIGN-PRINCIPLES.md`；每批做完在第 6 节打勾写日期。第 3 节的决定没定的，相关条目先不动。

---

## 0. 结论

1. **底子是好的**。六位评审都认可：令牌和对比度门禁、中英双版、500 个图标的一致性、`doctor`、MV3 的 CSP 与最小权限、
   原生 `<dialog>` / Popover / roving tabindex、减少动效开关、tokens / icons / css 三个包的代码和测试质量。
2. **最弱的是「对外」这一层**。仓库是公开的，但外人照 README 装不上（没写 `git clone`，包没发 npm，GitHub 上没有构建产物）；
   README 没截图、没定位、没写阶段；`@xxd/react` 把 Cloudflare 的商标组件一起导出了；仓库里留着上游的账号 ID、发布脚本和 AI 代理配置；
   插件模板默认带着小小东的登录、会员和定价。
3. **头号场景「插件往网页里注入界面」这条路没在真实插件上跑过，一跑就坏**。注入的浮动按钮定位被清掉，弹层挂到网页的 body 上或被网页盖住，
   外观设置写进了别人网站的 localStorage，语言来源互相打架。两个试点插件都只换了令牌层，所以一直没暴露。
4. **展示站门面有几处一眼可见的错**：对话框贴在左上角、首页图表格是空的、组件墙名字像下一格的标题、状态矩阵里的「聚焦」「按下」是假的、
   纯文字列表行整行靠右。
5. **我们的门禁漏掉了这些**，原因很具体：截图只拍关着的浮层；行为测试跑在 happy-dom（没有布局、层叠层、top layer）；axe 不查焦点去向、
   焦点环对比度和读屏播报。所以 R1 不光要修，还要把门禁补上，防止同类问题再漏。

---

## 1. 评审团

| 评审 | 看什么 | 发现（P0 / P1 / P2） | 一句话 |
| --- | --- | --- | --- |
| 设计系统设计师 | 层次、间距、排版、暗色、状态、一致性、展示站观感 | 25（4 / 12 / 9） | 单个零件干净克制；展示站首页和「文档说的和 CSS 做的对不上」是最大短板 |
| 前端架构师 | 包边界、发布、CSS 架构、JS 健壮性、React 与原生一致、测试 | 18（4 / 8 / 6） | 问题不在代码在接线：发不出去、两套实现在分叉、真浏览器才看得到的 bug 没人测 |
| 无障碍专家 | 键盘、焦点、读屏播报、对比度（axe 查不到的） | 25（1 / 15 / 9） | 原生语义用得对；焦点去向、live region、浮层语义和焦点环对比度要补 |
| 第一次来的开发者 | 30 分钟能不能用起来、文档、术语、命令行 | 23（3 / 11 / 9） | 文档站在作者立场写；普通网页没有路，React 在仓库外装不上，术语要猜 |
| Chrome 插件老手 | MV3、内容脚本注入、popup / 侧边栏、包体积、上架 | 22（2 / 9 / 11） | 基本盘对；内容脚本这条路坏了，插件常用的东西（popup、权限、快捷键、上架图标）基本空白 |
| 开源维护者 | README、许可、隐私、贡献流程、上游残留 | 22（2 / 12 / 8） | 工程纪律好；仓库像作者的私人工作台，公开这一层没做完 |

合计 135 条：P0 16 条、P1 67 条、P2 52 条。去重合并成 72 个条目，下面按批次列出（同一件事被几位评审独立提出的，标在来源里）。

评审都是只读：没有改任何仓库，没有构建或测试。每条发现都带页面地址或文件行号。

---

## 2. 已经复核过的

下面这些是排在前面、影响分批的，我在真实 Chrome（本机预览 :4400）里复现或读代码确认过，都属实：

| 问题 | 怎么确认的 |
| --- | --- |
| 对话框贴在左上角 | /components/dialog 点「打开」：`x=0, y=0, margin=0px` |
| 层叠层顺序反了 | 同一个 Kumo Button：`.xxd-page` 外 14px / 500，里面 13px / 400 |
| 注入宿主的定位被清掉 | `position:fixed` 的 host 经过 `all: initial` 后是 `static` / `z-index:auto` |
| 原生分页换页后焦点丢失 | 聚焦页码按 Enter，`activeElement` 是 `BODY` |
| 「跳到正文」聚焦时看不见 | 第一下 Tab 落到 1×1 的 `.site-skip` |
| 首页图表格是空的 | 首页 `window.echarts` 不存在 |
| 纯图标按钮矮 2px | `--icon-button: 38px`，`--control-h: 40px` |
| 纯文字列表行靠右 | `settings.css:139` 的 `justify-content: flex-end` |
| 带撤销的 toast 对读屏隐藏 | `feedback.js:113` 只在 `:hover, :focus-within` 时取消 `aria-hidden`，而 `restack()` 只在 pointer 事件时重算 |
| 内容脚本写宿主 localStorage | `xxd-extension/src/settings.js:23` 不管 `apply` 都 `rememberSettings` |
| 确认框默认挂到宿主 body | `xxd-css/src/js/dialog.js:40` `within = document.body` |
| 输入框边框 1.65:1 | `#c9c9ce` 对白底算出来 1.65:1 |
| `@xxd/react` 导出 Cloudflare 商标组件 | `xxd-react/src/index.ts:8` `export * from "@cloudflare/kumo"`，后者导出 `CloudflareLogo` 等 |
| 上游残留 | `.review.json`、`.opencode/`、23 个上游 changeset、两个 `wrangler.jsonc` 里的 Cloudflare `account_id` |
| Skill 里的本机路径 | `skills/xxd-ui/SKILL.md:8,27` |

其余条目按评审给的证据收录，动手时先复现再改。

---

## 3. 需要你决定

| # | 问题 | 选项 | 建议 |
| --- | --- | --- | --- |
| D8 | 公开仓库里的内部文档（PLAN、OPTIMIZATION-PLAN、本文、member-site、AGENTS 里的个人授权句） | 原样留着 / 留在 `docs/maintainers/` 但删掉私有细节、README 分「使用者 / 维护者」两栏 / 移到私有仓库 | **第二种**。计划本身可以当路线图公开；私有仓库的分支名、已知失败数、会员支付流程这类删掉；AGENTS.md 只留工程约定 |
| D9 | npm 上 `@xxd` 这个 scope 已经存在（没有任何包） | 是你的 / 不是你的 → 改用 `@nevertoday/*` 或 `@xiaoxiaodong/*` | 先请你登录 npm 确认；不是你的就尽早改名，越晚越贵。**2026-10-13 复查**：registry 上 `@xxd` 组织存在、下面 0 个包；`@nevertoday`、`@xiaoxiaodong` 都是「Scope not found」（没人用）。归属只有登录 npm 才看得到 |
| D10 | `@xxd/react` 怎么发布 | 把换皮后的 kumo 打进 `@xxd/react` / 另发一个 `@xxd/kumo` | **打进去**：外部只有一个包，仓库里的内部包名不变，合并上游的成本不变；同时改成显式导出清单 |
| D11 | 控件边界和焦点环对比度（两位评审独立提出） | 保持现在的发丝线 / 只给输入框、复选框、单选、开关加一档 ≥3:1 的 `--line-control`，焦点环改不透明 | **加**。卡片、分隔线、列表线不动，整体仍然安静；这是 WCAG 1.4.11 的硬要求 |
| D12 | 暗色的语义色（现在是冷荧光绿 / 红） | 不动 / 换一组偏暖、低一档饱和的 | 换，先做并排给你看 |
| D13 | `new` 生成的插件默认带登录、会员、¥29 / ¥228（三位评审都提了） | 不动 / 默认最小模板，`--account` 才带 | **默认最小**：大多数工具插件不要账号，带登录还会让商店审核要测试账号、隐私披露变复杂 |
| D14 | secondary 和 outline 按钮看起来一样 | 让它们看起来不同 / 保留 outline 只用在彩色或图片底上，文档写清 / 删掉 outline | **第二种**，外观不变，只补用法说明 |
| D15 | 图标来源 | 你确认 500 个都是原创绘制（没有复制 Lucide / Phosphor 的路径）后写进图标包 README | 需要你一句话确认。**2026-10-13 自查**（`scripts/verify/icon-similarity.mjs`，对比 lucide-static 0.460 的 1539 个图标）：501 个里整个相同的 4 个（ChevronDown、Ellipsis、EllipsisVertical、Minus，都是最简单的几何形），1124 个形状里和 Lucide 某个形状相同的 57 个，全是直线、居中的圆、打勾这类基本笔画；没有复杂路径一样。Phosphor 是 256 网格，坐标体系不同，不会逐点重合。O11 新画的约 300 个有本仓库的提交记录；最早的 201 个来自会员站，要你确认 |
| D16 | 以后提交用的邮箱 | 继续用现在的 / 改用 GitHub 的 noreply 地址 | 你决定；历史不改写 |
| D17 | 上游的 `kumo-docs-astro`、`kumo-figma`、`kumo-screenshot-worker` | 删掉 / 留着但根目录脚本改成 `kumo:*`、去掉 Cloudflare 的账号和发布脚本 | **留着**（删了合并上游会冲突），只做中和 |
| D1 | 纯平还是质感（仍未定） | — | 评审说 /foundations/finish 现在肉眼看不出差别；R5 先把这一页做成能比较的样子再定。**R5 之后**：这一页有 3 倍放大、按下那一帧、亮暗各一组，而且局部开立体终于真的生效了（以前被外层的 flat 盖住）。建议维持**平面为缺省**（按钮无阴影、整体安静），立体作为可选项留在「外观」里；等你看过放大对比再定 |

---

## 4. 阶段

条目格式：编号 · 问题（严重度 · 工作量 · 来源）· 证据 → 改法。来源：设计 / 工程 / 无障碍 / 上手 / 插件 / 开源。

### R1 · 明显的错和漏掉它们的门禁

起因：这些都是用户一眼能看到、或照着文档做就会坏的问题，改动都小。

- **R1-1 对话框不居中**（P0 · S · 设计）`overlay.css:14-31` 依赖浏览器默认 `margin:auto`，Tailwind 的 reset 把它清成 0 → `.xxd-dialog { margin:auto; inset:0 }`（窄屏的底部抽屉写法保留）。
- **R1-2 层叠层顺序反了**（P0 · S · 工程）`xxd-css/src/index.css:3` 在 Tailwind / Kumo 之后声明，优先级反而更高 → 最前面声明完整的层顺序，或文档改成 `@import … layer(components)`，`standalone.css` 一样处理。
- **R1-3 注入宿主的定位被清掉**（P0 · S · 工程 + 插件）`xxd-extension/src/shadow.js:38` → 先 `all:initial` 再接上调用方原有的 style（或改到 shadow 样式表的 `:host`）。
- **R1-4 首页图表格是空的**（P0 · S · 设计）`Home.astro:28` 没传 `charts` → 传上，或首页用静态 SVG 缩略图。
- **R1-5 纯文字列表行靠右**（P0 · S · 设计）`settings.css:139` → `space-between`，只有换到下一行的操作区靠右。
- **R1-6 纯图标按钮矮 2px**（P1 · S · 设计）→ `--icon-button: var(--control-h)`（紧凑同理）。
- **R1-7 原生分页焦点丢失**（P1 · S · 无障碍）`data.js:76` 整段重建 → 重建后把焦点放回同一个页码，变成禁用时放到当前页。
- **R1-8 「跳到正文」看不见**（P1 · S · 无障碍）→ `.site-skip:focus-visible` 显示出来；`@xxd/css` 提供 `.xxd-sr-only-focusable`。
- **R1-9 展示站手机导航抽屉没有焦点管理**（P1 · S · 无障碍）`Site.astro:191-195` → 复用 `openPanel` / `closePanel`，按钮同步 `aria-expanded`。
- **R1-10 带撤销的 toast 键盘用不了**（P0 · M · 无障碍）要按 23 次 Tab、6 秒就消失、聚焦时还 `aria-hidden` → 带操作的 toast 不自动消失；区域 `role="region"` + 名称；`focusin` / `focusout` 也重算叠放；给一个跳到通知区的快捷键。
- **R1-11 Tooltip 的 Esc 连带关掉对话框**（P1 · S · 无障碍）`feedback.js:77-79` → tooltip 开着时 Esc 只关它。
- **R1-12 「Kumo 负责键盘、焦点、读屏」说法不对**（P1 · S · 上手）`README.md:7` → 改成只指 React 层，原生层自己实现、有 audit 守。
- **R1-13 `@xxd/react` 导出 Cloudflare 商标组件**（P0 · S · 开源）→ 去掉 `CloudflareLogo`、`PoweredByCloudflare`、`generateCloudflareLogoSvg`，合同测试断言没有它们（显式导出清单放 R6）。
- **R1-14 门禁补洞**（工程 + 设计 + 无障碍）
  - audit 打开每个浮层（对话框、sheet、panel、菜单、popover、toast），检查它在视口里、位置正确、焦点进去了、关掉后焦点回来。
  - 加一组真实浏览器冒烟测试（`@vitest/browser-playwright` 已在 catalog）：层叠层顺序、Kumo Button 在 `.xxd-page` 里的字重、`mountXxdUI` 后 host 定位不变、带 `*{margin:0}` reset 时对话框居中。放进 CI。
  - audit 对每个主色预设算焦点环和控件边框的对比度（D11 定了以后生效）。

验收：上面每条都有一个会失败的测试或 audit 项先红后绿；`pnpm xxd:test`、Kumo 测试、audit 全绿。

### R2 · 对外这一层：开源门面与第一次上手

起因：仓库是公开的，外人照 README 走第一步就失败；文档默认读者是作者自己。

- **R2-1 写清怎么装**（P0 · S · 上手 + 开源）README 和 /start 最前面「0. 准备」：`git clone` → `pnpm install` → `pnpm xxd:build`；Node 和 pnpm 版本；明写「npm 还没发布，目前从源码用」；`pnpm xxd link` 之后用 `xxd-ui`。
- **R2-2 普通网页这条路**（P0 · S · 上手）/start 加「普通网页 / Vite 站」三档：一行 `<link>` + `<script>` 先试（展示站提供带版本号的 `/v0.1.0/xxd.css` 这类路径，或 GitHub Release 附压缩包）；`xxd-ui init`；打包工具里 `import`。
- **R2-3 React 在仓库外怎么用**（P0 · M · 上手）先如实写现状和一个能跑通的办法（`pnpm pack` 出 tgz），D10 定了再改。
- **R2-4 README 第一屏**（P1 · S · 开源 + 上手）一句外人能懂的定位；四宫格截图（亮 / 暗 × 直角 / 圆角）；CI、License、alpha 徽章；「适合 / 不适合」和与 shadcn / Ant Design 的对比；「基于 Cloudflare Kumo（MIT），与 Cloudflare 无关联」；解释 contributors 列表是保留上游历史的结果。
- **R2-5 上游残留中和**（P1 · M · 开源 + 工程，按 D17）根目录 `dev` / `build` / `test` 默认指向 XXD，Kumo 的改名 `kumo:*`；删 `.review.json`、`.opencode/`、上游 changesets、Cloudflare 的发布和部署脚本、`account_id`；`packages/kumo/README.md` 顶部注明「内部包，请用 @xxd/react」；`ci/` 里没被引用的文件清掉或说明。
- **R2-6 私有内容和本机习惯**（P1 · S · 开源 + 上手，按 D8）Skill 里的本机路径改成「仓库根目录」或环境变量；示例路径 `~/js/…`、私有项目名改成 `./my-extension`；文档里私人工具（发布、打包 skill）改成通用说法；图标源码头注释去掉私有仓库路径；会员站一节改写成「已经有一套 CSS 变量的网站」。
- **R2-7 社区文件**（P1 · S · 开源）`SECURITY.md` 并开启私密漏洞报告；`CODE_OF_CONDUCT.md`；issue 模板（bug / 功能）和 PR 模板（四种外观截图、对应原则第几条、测试）；`CONTRIBUTING` 去掉「改 PLAN 进度」的要求，写明欢迎什么、视觉改动先开 issue，加英文版。
- **R2-8 元数据**（P2 · S · 开源）engines 改 `>=24.12.0`，写明支持的浏览器；GitHub 描述中英都写、加 topics、关掉没用的 wiki / projects；版权人写法统一；`OPEN-SOURCE-CHECKLIST.md` 更新或转成 issue；图标来源写进 `xxd-icons/README.md`（按 D15）。
- **R2-9 给 AI 看的入门页是空的**（P1 · M · 上手）`/md/start.md`、`tools.md`、`foundations/*.md` 只有一句「完整内容见…」→ 这几页生成正文；`tools.md` 标题和页面对齐。
- **R2-10 站内搜索只认标题**（P1 · S · 上手）`Site.astro:22` → 每页加关键词和常见别名（Modal→Dialog、Drawer→Sheet、Upload→Dropzone、Loading、Dark mode…），中文站也能搜英文名。
- **R2-11 命令行只有中文**（P1 · M · 上手）`--en` 只对 `open` 有效 → 按 `LANG` / `--en` / `XXD_UI_LANG` 切换输出，数据（`commands.mjs`、`registry.en.js`）现成。
- **R2-12 命令行的误导**（P2 · S · 上手）空目录 `doctor` 说「没发现问题」→ 说「还没接入，先跑 init」；缺 vendor 又没 config 时提示 `init` 不是 `sync`；拼错命令的联想加编辑距离上限、句末问号；文档主推 `xxd-ui`（`pnpm xxd` 会多打印一行脚本）。

验收：一个没见过项目的人只看 README，能在三种场景（普通网页、插件、React）各自跑起来；开源审计脚本（`scripts/open-source-audit.mjs`）零命中并进 CI；GitHub community profile 100%。

### R3 · 插件套件：把内容脚本这条路走通

起因：头号场景。基本盘对，但注入网页的界面一跑就坏，插件常用的东西缺。

- **R3-1 内容脚本里的浮层**（P0 · M · 插件）toast / 确认框 / 命令面板 / 查看器默认挂到宿主 body（没样式），挂进 Shadow 又被宿主 z-index 盖住 → `mountXxdUI` 登记「默认浮层根」，`within` 缺省时用它；toast 区和 tooltip 用 `popover="manual"` 进顶层（菜单已经这样做）。
- **R3-2 不碰宿主网页**（P1 · S · 插件）内容脚本里不写 localStorage 镜像（`settings.js:23`，加 `mirror` 选项，默认跟 `isContentScript`）；`xxd:settings` 事件在 host 上派发；内容脚本里默认不注册 ⌘F / ⌘K（`inputs.js:441-447`）。
- **R3-3 一个语言来源**（P1 · S–M · 插件）每个 `messages.json` 加 `xxdLocale`，由它设 `<html lang>`、`Xxd.setLocale()` 和 `uiLocale()`；`mountXxdUI` 在 Shadow 顶层写 `lang`；修正 EXTENSION-KIT 里「i18n.js 已写好 lang」的说法；考虑模板 `default_locale` 改 `en`。
- **R3-4 模板里写死的中文**（P1 · S · 插件）aria-label、确认文字、日期、条数全部走 i18n；日期用 `Intl.DateTimeFormat`；快捷键提示按平台显示；`doctor` 加规则：有 `_locales` 时 aria-label / title / placeholder / JS 字符串里出现中文就报。
- **R3-5 模板拆成可选块**（P1 · M · 插件 + 上手 + 开源，按 D13）`new` 默认最小（侧边栏 + 设置页 + 外观）；`--account` 加登录和会员（价格用占位）；`--popup` 加 popup（固定宽 360，不写 `height:100%`，写明 800×600 上限）；`--content <match>` 才加内容脚本和 WAR（默认不再带 example.com）。
- **R3-6 `doctor` 加 MV3 规则组**（P1 · M · 插件）内联脚本、`on*=`、`javascript:`、远程脚本、`eval` / `new Function` 报错；用了 `mountXxdUI` 时检查 shadow 样式在 WAR 里、内容脚本先加载 xxd.js / extension.js / icons.js；`data-i18n` 的键都存在；名称和描述的商店字数；`<all_urls>` 提示改 `activeTab` / 可选权限；图标 PNG 实际尺寸。
- **R3-7 插件专用模式**（P1 · M–L · 插件）需要权限（在点击时请求，拒绝后有说明）、快捷键行（`chrome.commands` + 打开 `chrome://extensions/shortcuts`）、导入 / 导出设置、安装后欢迎和更新说明、「插件已更新，请刷新页面」、内容脚本的浮动入口。
- **R3-8 上架图标**（P1 · M · 插件）`xxd-ui icons <dir> --glyph Name` 用无头 Chrome 渲染 16 / 32 / 48 / 128 PNG（16px 用加粗版），写进 manifest；EXTENSION-KIT 加「上架」一节。
- **R3-9 注入宿主更稳**（P2 · S · 插件）host 用自定义元素（不吃宿主的 `div{}` 规则）；防重复注入；调用 `chrome.*` 前查 `chrome.runtime?.id`（插件更新后的 context invalidated）；`mountXxdUI` 跟随系统主题变化；内容脚本里图标能显示。
- **R3-10 体积与加载**（P2 · S–M · 插件 + 工程）vendor 拷压缩版；`xxd.config.json` 支持 `vendorFiles`；另出 `xxd.shadow.css.js`（CSS 字符串经 `cssText` 传入：不要 WAR、不要 fetch、同步挂载、网站也没法借它识别插件）；service worker 能用的 `tokens.mjs` 和 `setBadge(text, tone)`。
- **R3-11 小修**（P2 · S · 插件）`init` 的 data-key 读 manifest 或 `--key`，提示沿用旧 key（不然用户外观设置丢失）；`doctor` 的 data-key 提示文案改正（插件 origin 本来就隔离）。
- **R3-12 真实试点**（P1 · M · 插件）挑一个真实插件的内容脚本界面改用 `mountXxdUI`，在真实网站上验证层级、语言、主题；仍然走 worktree + 新分支，不合并、不推。

暂缓：插件内切换语言（`loadMessages(locale)`）、繁体名字用 opencc。

验收：用模板 `new --content` 生成的插件在 Chromium 里加载：浮动按钮在右下角、toast 和确认框在 z-index 9999 的宿主头部之上、宿主 localStorage 没有新键、日 / 德系统语言下整屏一种语言；`doctor` 对评审造的不合规插件报出全部硬伤。

### R4 · 无障碍：axe 查不到的那一半

起因：原生语义用得对，但焦点去向、读屏播报、浮层语义还有缺口；示例代码会被 `doc` 和 AI 照抄到每个插件里。

- **R4-1 live region 常驻**（P1 · S）toast 区、复制气泡、`setStatus`、React `StatusLine` 在 install 时就创建好，只换文字（新插入的 live region 第一条常常不播报）；danger 的 toast 走 `role=alert` 或文字前加「错误：」。
- **R4-2 Sheet 和 Panel 是真正的模态**（P1 · M）打开时 `role="dialog"` + `aria-modal` + 背景 `inert`（或 Panel 直接用 `<dialog>`）；React `Sheet` 补焦点陷阱，没有可聚焦元素时焦点给面板本身，并写 `data-sheet-open`。
- **R4-3 弹出类触发器说清会弹出什么**（P1 · S）菜单 `aria-haspopup="menu"` + 初始 `aria-expanded="false"` + `aria-controls`；popover 同理，浮层补 role 和名称；面包屑「…」一样；popover 焦点离开时关闭。
- **R4-4 Picker 改成仅可选择的 combobox 并有字段名**（P1 · M）`role="combobox"` + listbox；示例带 label。
- **R4-5 表单错误能抄到对的写法**（P1 · S–M）Field 示例连上 `aria-describedby`，加错误状态示例；登录模式邮箱错误时显示文字、关联、焦点回输入框；加 `Xxd.setFieldError(input, msg)`；audit：有 `.xxd-error` 就必须被引用。
- **R4-6 键盘排序要播报**（P1 · S）拿起、移动、放下、取消都播报位置；把手说明「按空格拿起…」。
- **R4-7 拖宽把手能用键盘**（P1 · M）列宽和侧栏宽改成 `role="separator"` + 方向键 ±16px + Home / End，双击恢复。
- **R4-8 图表有文字替代**（P1 · S–M）`chartOptions` 默认开 ECharts `aria`；示例附一句结论或数据表；第 4 色以后用线型或标记区分，最浅一档提到 ≥3:1。
- **R4-9 Tooltip 鼠标能移上去**（P1 · S）WCAG 1.4.13：可悬停、可关闭。
- **R4-10 对比度**（P1 · S，按 D11）焦点环改用不透明的 `--action-text` 或双色环；控件边框 `--line-control` ≥3:1。
- **R4-11 零碎**（P2 · S）菜单字母跳转；面包屑无链接项可聚焦；命令面板 / combobox 的分组语义、结果条数播报、多选 `aria-multiselectable`、无结果时去掉空的 `aria-activedescendant`；`confirmDialog` 关联正文并用 `alertdialog`；密钥显示按钮、侧栏折叠按钮、ConfirmTwice 的状态念对；查看器翻页播报、缺省 alt；减少动效时 spinner / 加载条不要定住；标签页面板 `tabindex="0"`；顶栏外观组 `role="group"`；搜索框示例有名称。

验收：用 VoiceOver（Safari）和 NVDA（Firefox，能借到的话）走一遍：toast 撤销、sheet、菜单、picker、表单错误、排序；audit 加对应的自动检查；注册表测试检查示例里的 `aria-describedby` 都指向存在的元素。

### R5 · 视觉与展示站

起因：组件干净，但官网门面和「说的与做的对不上」拉低了专业感。

- **R5-1 首页组件墙重做**（P0 + P1 · M · 设计 + 上手）名字放格子顶部、整格可点；浮层类组件用静态展开形态（`data-static`：对话框外壳、展开的菜单、叠起的 toast、带箭头的 popover）；格子统一高度，大组件占两格；Card 用真实缩略图；修 Sidebar 演示「内 / 容 / 区」；看不懂的工具类组件不上墙。
- **R5-2 状态矩阵画真的状态**（P1 · M · 设计）矩阵容器强制键盘输入模式；`:focus` 也转成强制状态；纯平按钮补按下态（底色深一档）；只读输入框给 `--wash` 底。
- **R5-3 间距和尺寸真正令牌化**（P1 · L · 设计）组件 CSS 里写死的 padding 44 处、gap 60 处，大量 14 / 10 / 6 / 5 / 3px → 加组件级令牌（`--pad-control-x`、`--row-h`、`--tab-h`…）挂到 4px 刻度，紧凑密度一起变；`doctor` 和合同测试拦写死的 padding / gap。先做按钮、输入、列表、标签页，看过再铺开。
- **R5-4 层次和距离**（P1 · S · 设计）标题到说明 `--space-1`～`--space-2`，说明到操作区 `--space-5`；对话框里说明到字段至少 `--space-4`。
- **R5-5 模板像真产品**（P1 · M · 设计）中性的真实示例图；真实二维码图案；登录用官方 Google 标志并补「继续」；删除确认静态展开；状态点按语义统一；模板复制出去不带预览专用的写死值（`doctor` 不该报自家模板）。
- **R5-6 示例代码**（P1 · M · 设计 + 上手）生成时格式化缩进、不再一整行；去掉示例里的内联样式（换成 `xxd-stack` / `xxd-cluster`，新增 `xxd-link[data-tone="danger"]`）；注册表测试加「示例不含 style」；React 示例补 import 行。
- **R5-7 组件页信息补全**（P1 · M · 上手 + 设计）注册表加 `use` / `avoid`；每个变体一句用途（按 D14 写清 outline）；React 属性表（从 Kumo 注册表生成）；标题下固定一行「类名 `xxd-…` · React `<…>`」；「键盘与读屏」和「规则」用正文色；手机上属性表上下排。
- **R5-8 名字和术语**（P1 · S · 上手）术语表：「令牌」首次出现括注「设计变量 / token」，「模式」写成「模式（patterns）」；英文 Panel 改 "Details panel"（不和 Chrome 的 side panel 撞）；一个组件一套名字。
- **R5-9 英文文案**（P1 · S–M · 上手）去翻译腔（"emphasis in ink"、"button finish"、"Write progress pill"…），漏掉的全角括号；能找到英语母语者的话请人过一遍。
- **R5-10 暗色语义色**（P1 · S · 设计，按 D12）偏暖、低一档饱和，三个 `*-strong` 都在暗色里定义，过对比度门禁。
- **R5-11 D1 的比较页**（P2 · S · 设计）/foundations/finish 加 3～4 倍放大局部、按下那一帧、亮暗各一组。
- **R5-12 打磨**（P2 · S–M · 设计）字号阶梯补 24px 一档、加 `--leading-*` 令牌、统一正文行高；菜单项统一前置槽；按天分组记录对齐；展示站首次访问跟随系统主题；「主色」按钮改名「外观」并平铺三项；按钮 lg 拉开（48px / 15px）或删掉；图标 File 加折角、MessageCircle 改名或补方形版、Square2 / Dot / Ratio 统一视觉尺寸。

验收：四种外观 × 桌面 / 390px 截图人工过一遍首页、组件页、模板页；polish 和 audit 全绿；截图回归的差异逐张确认。

### R6 · 工程与发布

起因：只能在本仓库里拷 vendor 用；React 和原生是两套实现；真浏览器才看得到的问题没人测。

- **R6-1 先让 tokens / icons / css 能发**（P0 · M · 工程 + 开源，按 D9）每个包 `prepack` 构建；补 repository / homepage / bugs / keywords / LICENSE；通配导出收窄；types 补全（`./accent`、`./theme`、`./nodes`）；发出去以后 jsDelivr / unpkg 自然可用。仍然等你说了再真正发布。
- **R6-2 `@xxd/react` 发布方案**（P0 · L · 工程 + 开源，按 D10）kumo 打进产物；显式导出清单 + 导出快照测试。
- **R6-3 版本和变更记录**（P1 · S–M · 工程 + 开源）changesets 忽略 `@cloudflare/kumo*`，`@xxd/*` 统一版本；从现在起每次改动带 changeset、生成 CHANGELOG；打 `v0.1.0` 和 Release；展示站更新日志改读 CHANGELOG（现在会混进「本机文件夹改名」这类提交）；`status` 改比较包版本和 dist 的 hash（现在只提交文档也显示「落后」）。
- **R6-4 构建可复现**（P1 · M · 工程）`xxd-css/scripts/build.mjs:21-23`、`xxd-site/scripts/assets.mjs:18` 还是「没有 dist 才构建依赖」（O11 只修了 CLI）→ 去掉捷径，按 workspace 依赖拓扑构建；测试构建到临时目录，不再 `rm -rf` 别的包的 dist；`npx tsc` 改 `pnpm exec tsc`。
- **R6-5 测试有真实浏览器这一层**（P1 · M · 工程）在 R1-14 基础上扩展：shadow 挂载、install / uninstall、computed style 对照；site 的 audit 进 CI；挑十几个关键页的截图基线提交或存成 CI artifact；lint 覆盖全部 xxd 包。
- **R6-6 行为 JS 的生命周期**（P1 · M · 工程）`install(root, { signal })` 返回 `uninstall`，监听都带 signal，observer 回收；window 级监听按 root 计数；tooltip 等状态按 root 存；防 IIFE 和 ESM 重复加载；`byId` 在 Shadow 里不回退到宿主 document（会误操作宿主同 id 元素）；`spyToc` 去重。
- **R6-7 去掉隐式全局耦合**（P1 · S · 工程）`globalThis.XxdIcons`、`globalThis.Xxd` → 显式传入，缺依赖时开发环境警告。
- **R6-8 tokens.css 只放变量**（P1 · M · 工程）全局的减少动效、`::selection`、caret 移到可选的 base.css（现在靠正则去掉，注释改一个字就失效）；主题选择器也作用于任意子树；加 `prefers-color-scheme` 的纯 CSS 兜底（没有 JS 时暗色也生效）。
- **R6-9 React 和原生收成一份**（P1 · L · 工程）`kumo-binding.css` 的控件高度和内边距映射到 `--control-h*` / `--space-*`（紧凑密度对 React 也生效，按钮都是 40px）；共用文案一份 JSON（外观设置两边的叫法现在不一样）；React 独有组件复用原生行为或共用测试用例；加对照测试比较两种实现的尺寸、字重和 ARIA。
- **R6-10 图标**（P1 · M · 工程）生成 `IconName` 联合类型和具名导出（可 tree-shake），未知名字开发环境警告；`icons-min.js` 从 `nodes.js` 生成或加一致性测试。
- **R6-11 打磨**（P2 · S–M · 工程）`XxdAppearanceProvider` 的 `lock` 默认值每次渲染都新建、SSR 读存储不一致；CSS 用 postcss / lightningcss 代替正则；`adopt` / `sync` 加 `--dry-run` 和 diff；体积预算（size-limit）；CLI 改命令表。

暂缓：CLI 支持 Windows（自用为主，发包时再说）。

验收：从干净的 clone 跑 `pnpm pack` 得到能用的 tokens / icons / css 包；在仓库外的空 Vite 项目里装上能用；CI 跑真实浏览器测试和 audit；React 与原生对照测试通过。

---

## 5. 没收进来的

- 改写 git 历史去掉邮箱：公开后改写代价大，不做（以后用什么邮箱见 D16）。
- 「把视觉规则本身改掉」类的意见：评审按要求没有挑战直角、无阴影、三档字重、系统字体这些原则。D11 只针对必须识别的控件边界，D12 只针对暗色语义色。

---

## 6. 进度

| 阶段 | 状态 | 日期 |
| --- | --- | --- |
| R1 明显的错和门禁 | ✅ 完成 | 2026-10-12 |
| R2 对外这一层 | ✅ 完成 | 2026-10-12 |
| R3 插件套件 | ✅ 完成（试点在 xPoster 的 xxd-ui-content-pilot 分支，未合并） | 2026-10-12 |
| R4 无障碍 | ✅ 完成（真读屏软件没测，见下） | 2026-10-12 |
| R5 视觉与展示站 | ✅ 完成（截图 768 张逐页对比后更新了本机基线） | 2026-10-13 |
| R6 工程与发布 | ✅ 完成（发版、打 tag 等维护者决定，见下） | 2026-10-13 |

R4–R6 的几处说明：

- **R4**：axe、键盘、播报都有自动检查；审计的「读屏」一节（`packages/xxd-site/scripts/sr.mjs`）用键盘走 8 个关键流程，每一步读 Chrome 无障碍树里的焦点（角色、名字、展开 / 选中 / 按下 / 模态）和播报区，文字稿在 `visual/sr-transcript.txt`。读屏软件念的就是这些，但 VoiceOver / NVDA 真机朗读（语速、重复播报、虚拟光标）仍要人工试一次：开 VoiceOver 要改系统设置、会在这台电脑上出声，AI 助手不替你做。
- **R6-1 / R6-3**：包都能 `pnpm pack`，元数据、LICENSE、`prepack` 齐了，但仍是 `private: true`；npm 发布、打 `v0.1.0` tag、GitHub Release 等维护者说了再做。CHANGELOG 先手写 0.1.0（中英两份），展示站「更新日志」读它。
- **R6-2**：Kumo 不是内联成一个大文件，而是按原来的模块结构拷进 `@xxd/react/dist/kumo/`（内联会让用的人没法按需打包：一个按钮加对话框的应用从 442 KB 涨到 1.17 MB）。
- **R6-5**：CI 加了浏览器那一组（audit + `scripts/pack-check.mjs` 发包验收）；截图基线是 macOS 上截的，不进 CI。
- **R6-6**：install 期间注册的监听统一挂一个 AbortSignal（不用逐个改模块）；window 级监听按 root 各装一份，处理函数都是幂等的；tooltip 同一时刻只有一个，状态没有按 root 拆。
- **R6-9**：控件高度和内边距的映射写在 `kumo-binding.css`（认 Kumo 的尺寸类），没有改上游组件源码，合并上游不冲突。
- **R6-11**：选择器的改写（Shadow 版 `:root → :host(…)`、layered 版 `:where(:root…)`、`parseBlocks`、展示站状态矩阵的 `forceStates`）都改由 lightningcss 解析和打印（`xxd-tokens/scripts/selectors.mjs`）。声明部分原样保留，因为 lightningcss 1.33 写回带 `var()` 的声明会出错。换过来以后顺带修好三处：`:root:not([data-theme])` 以前在 Shadow 里写成了无效的 `:host:not(…)`；状态矩阵漏掉了一条 `[data-input="pointer"]` 规则；base.css 里 `:where(*, *::before, *::after)` 的伪元素按规范会被忽略，从来没生效（合同测试现在会拦）。另外，构建产物逐个用 lightningcss 解析做门禁（`xxd-css/test/css-parse.test.mjs`），体积预算见 `xxd-css/test/size.test.mjs`。

建议顺序：先定 D8–D17（D9、D15 只要你确认一下）→ **R1**（小、立刻见效，并补上门禁）→ **R2**（仓库已经公开，门面最急）→ **R3**（头号场景）→ R4 → R5 → R6。
R6-1 / R6-2 和 R2-3 互相依赖：npm 发布之前，R2 先如实写「从源码用」。
