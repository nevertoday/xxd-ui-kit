# 小程序方案（M1–M6）

状态：M1–M6 已做完（2026-10-14），实际做法和计划不同的地方见 §16。日期：2026-10-13 起草，2026-10-14 定稿（§13 的决定由维护者授权 AI 助手代定，包名由维护者定为 `@xxd/mini`）。
目标：让 xxd-ui-kit 也能做微信小程序，样子和网页版、插件版是同一套（直角、墨色、暖黑、细线、系统字体），写法学 [Taro](https://github.com/NervJS/taro)。

## 1. 结论

- **基于 Taro 4.2 + React 18 做，不自己造编译器。** Taro 把 React 代码编译成微信小程序（以后可以加支付宝、抖音小程序），也能编出 H5。新加一个包 `@xxd/mini`。
- **从 Taro 学它的核心做法：一份源码，按平台出不同的产物。** 令牌、组件样式、图标都从现有的源头生成小程序版，不另写一套、不手抄。
- **网页版的样式不能原样搬进小程序**（§3）：属性选择器、`color-mix()`、`:hover`、`*` 这些在小程序里不能用或不保证能用。由构建脚本自动改写，改写不了的列出来，作为门禁（§6）。
- **组件按手机的习惯重新挑。** 菜单、悬停提示、浮动卡片这类鼠标交互，在手机上换成底部弹出的面板；另外加自定义导航栏、底部标签栏、安全区这些小程序才有的东西（§9）。
- **先只做微信、只保证默认的 WebView 渲染引擎、尺寸用 px 不换算、开关复选单选自己画。** 理由见 §13。
- **试点就是我们自己的演示小程序「小小东 UI」**：它不只是组件目录，还带一个真能用的「待办」页，把表单、列表、底部面板、外观设置都用上（§11）。

## 2. Taro 是什么，学什么

Taro 是京东开源的多端框架（MIT，当前稳定版 4.2.x）。用 React、Vue 或 Solid 写一次，编译成微信、支付宝、抖音、QQ、京东等小程序，以及 H5、React Native、鸿蒙。

| Taro 的做法 | 我们学来做什么 |
| --- | --- |
| 一份源码，构建时按平台出产物；平台差异放在构建插件里（比如 `postcss-pxtransform` 把 px 换成 rpx / rem） | 令牌和组件样式由构建脚本出「小程序版」：改选择器、把颜色算好、处理单位（§6、§7） |
| 一层统一的基础组件（`View`、`Text`、`Button`、`ScrollView`……），上层不碰平台 | `@xxd/mini` 只用 `@tarojs/components` 搭，不写平台专有的东西；非用不可时放进 `*.weapp.tsx` 这类按平台区分的文件 |
| H5 也是一个平台 | 同一份 `@xxd/mini` 编出 H5，直接嵌进展示站，网页上就能看到小程序组件的真样子（§11） |
| 生态里的组件库 NutUI（京东）：组件样式全用 CSS 变量（`--nutui-` 前缀），变量挂在 `page` 根上，暗色是另一份主题文件 | 我们也用 CSS 变量，名字和网页版一样（`--ink`、`--paper`……）。暗色、主色、圆角、密度在运行时切换，不靠另一份文件（§7） |

不学的：不用 Taro UI（已经不怎么维护了），也不直接用 NutUI。它的样子是另一套设计语言，我们要的是自己的。

## 3. 为什么网页版的样式不能直接用

小程序的样式语言叫 WXSS，渲染引擎有两种：默认的 WebView，和微信新的 Skyline。官方文档写明的限制，对照我们现在的 `@xxd/css`（`dist/xxd.css`，901 条规则）：

| 限制 | 出处 | 我们的 CSS 里 | 怎么办 |
| --- | --- | --- | --- |
| 不支持属性选择器 `[...]` | WXSS 文档 | `[data-…]` 320 处、`[aria-…]` 64 处、`[role…]` 32 处 | 构建时改成类名（规则见 §6）。`@xxd/mini` 的组件按属性加上对应类名 |
| 没有 `:root`，页面根节点是 `page` | 微信文档、NutUI | 令牌都挂在 `:root` | 令牌的小程序版挂在 `page` 上 |
| Skyline 不支持 `*`、`currentColor`、`em`；阴影只能一层；没有 `position: sticky`、`overflow: scroll` | Skyline 样式文档 | `*` 65 处、`currentColor` 5 处、`em` 19 处 | 能换的自动换（`em` 按所在字号算成 px），换不了的列进报告；第一版只保证 WebView |
| 颜色函数只列了 rgb / hsl / 十六进制；`color-mix()` 没有保证 | Skyline 样式文档；WebView 取决于手机系统 | 组件里 76 处（去重后 60 种）、令牌里 20 处 | 每种 `color-mix(…)` 换成一个派生令牌，构建时算好缺省值，换主色时运行时重算（§7） |
| 没有鼠标，`:hover` 要用组件的 `hover-class` 属性 | 小程序组件文档 | `:hover` 52 处 | `:hover` 改成 `.is-hover`，组件传 `hoverClass="is-hover"`；`:focus-visible` 去掉（手机没有键盘焦点环） |
| `@layer`、`:has()`、原生 `<dialog>`、popover 都不能指望 | — | `@layer` 23、`:has()` 13、`::backdrop` / `:popover-open` 6 | `@layer` 拍平（小程序里没有别人的样式要让）；`:has()` 改成组件加类名；浮层用小程序的 `root-portal` 重做 |
| 单个主包、分包都不能超过 2 MB，总共 30 MB | 分包文档 | `xxd.css` 135 KB、图标 35 KB | 按需引入：用到哪个组件才带上它的样式；图标按名字单独引入 |
| 暗色：`@media (prefers-color-scheme: dark)` 可用；导航栏、标签栏的颜色要写在 `theme.json` 里；`app.json` 要开 `darkmode` | DarkMode 文档 | 暗色靠 `data-theme` | 令牌小程序版同时出：`page` 上的亮色、媒体查询里的暗色、运行时强制亮 / 暗、一份 `theme.json` |

这张表就是构建脚本的检查清单：每一项要么自动改写，要么报出来，不悄悄留在产物里。

## 4. 方案总览

```
@xxd/tokens   ──→ resolve.js         不碰页面的求值：var() 和 color-mix() 算成具体颜色（appearanceVars）
@xxd/mini 构建 ──→ tokens.mini.css    page 上的变量；暗色媒体查询（派生色要等组件样式改写完才知道有哪些，所以在这里出）
              ──→ theme.json         导航栏 / 标签栏的亮暗颜色
              ──→ vars.js            各外观的令牌表和派生色，运行时算外观用
@xxd/icons    ──→ 每个图标一个 SVG 数据地址，按名字引入
@xxd/css      ──→ 每个组件一份 *.mini.css（构建脚本从网页版 CSS 改写，§6）
@xxd/mini     ──→ React 组件（基于 @tarojs/components）+ XxdProvider / XxdPage（外观、语言、安全区）
@xxd/extension──→ xxd-ui new-mini / doctor 的小程序规则
xxd-mini-demo ──→ 演示小程序「小小东 UI」（也是试点）；它的 H5 版嵌进展示站
```

**改写复用现有工具。** `packages/xxd-tokens/scripts/selectors.mjs` 已经用 lightningcss 改选择器（Shadow DOM 版、layer 版都是它做的）。小程序版就是再加一种改写。网页版改了，小程序版重新生成，样子不会跑偏。

**外观算法复用现有代码。** `@xxd/tokens` 里的 `accentPalette()`（主色 → 一组变量）、`resolveTheme()`、`DEFAULT_SETTINGS` 都是纯函数，不碰 DOM，小程序直接用。只有 `applySettings()`（往 `<html>` 上写属性）和 `readSettings()`（读 `localStorage`）是网页专用的，小程序版另写一个对应的。

## 5. 包长什么样

```
packages/xxd-mini/              @xxd/mini（组件库，private: true，和别的包一样先不发）
  mini.json                     清单：有哪些组件、每个对应网页版的哪些类名、属性怎么变类名
  src/
    provider.tsx                XxdProvider（放在 app.tsx）：外观、语言，存储读写
    page.tsx                    XxdPage（每页的根）：根节点上写变量和外观类名、安全区、导航栏颜色
    button.tsx  cell.tsx  …     每个组件一个文件，自己 import 自己的样式
    icon.tsx
  styles/                       构建产物：tokens.mini.css、button.mini.css……（生成，不手改）
  scripts/build-mini.mjs        改写 + 出报告
  test/                         改写规则的单元测试；组件的 H5 渲染测试

packages/xxd-mini-demo/         演示小程序（Taro 项目，private，不发 npm）
  src/pages/index               组件目录（中英）
  src/pages/todo                待办：真能用，本机存储
  src/pages/settings            外观设置：主题、主色、圆角、密度
  project.config.json           AppID 用测试号；正式 AppID 由维护者填
```

**写法和 `@xxd/react` 对齐。** 同一个组件，属性名和网页 React 版一样：`variant`、`size`、`tone`、`block`；受控组件用 `value` + `onValueChange`；浮层用 `open` + `onOpenChange`。会写网页版的人不用重新学。

```tsx
// app.tsx
import "@xxd/mini/tokens.css";
import { XxdProvider } from "@xxd/mini";
export default function App({ children }) {
  return <XxdProvider lang="zh">{children}</XxdProvider>;
}

// pages/todo/index.tsx
import { XxdPage, NavBar, CellGroup, Cell, Button, Sheet } from "@xxd/mini";
export default function Todo() {
  const [open, setOpen] = useState(false);
  return (
    <XxdPage>
      <NavBar title="今日待办" />
      <CellGroup title="今天">
        <Cell title="交周报" description="下午 5 点前" arrow onClick={() => setOpen(true)} />
      </CellGroup>
      <Button variant="primary" block>新建</Button>
      <Sheet open={open} onOpenChange={setOpen} title="更多操作">…</Sheet>
    </XxdPage>
  );
}
```

样式跟着组件走：`import { Button }` 时 `button.mini.css` 一起进来，没用到的组件不进包（`package.json` 的 `sideEffects` 只标 CSS）。M3 的验收要查这一点。

## 6. 样式改写规则

**产物里只允许这些选择器**：类名、标签名、后代和子代组合、`::before` / `::after`、`:first-child` / `:last-child` / `:nth-child()`、`:not(.类名)`。WebView 实际支持的更多，但只用这一小套，换到 Skyline 时要补的就少。别的一律改写，改写不了的进报告并让构建失败。

| 网页版 | 小程序版 | 例子 |
| --- | --- | --- |
| 有取值的 `data-*` | `.is-<名>-<值>` | `[data-variant="primary"]` → `.is-variant-primary`，`[data-size="sm"]` → `.is-size-sm` |
| 没取值的 `data-*` | `.is-<名>` | `[data-collapsed]` → `.is-collapsed`，`[data-open]` → `.is-open` |
| `aria-*` 状态 | `.is-<状态>` | `[aria-pressed="true"]` → `.is-pressed`，`[aria-selected="true"]` → `.is-selected`，`[aria-invalid="true"]` → `.is-invalid`，`[aria-current]` → `.is-current` |
| `[role=…]` | 组件自己的类名 | `[role=tab]` → `.xxd-tab`，`[role=switch]` → `.xxd-switch` |
| `:checked`、`:disabled`、`:indeterminate`、`:active` | `.is-checked`、`.is-disabled`、`.is-indeterminate`、`.is-active` | 组件按自己的状态加类名 |
| `:hover` | `.is-hover` | 组件传 `hoverClass="is-hover"`，按下时有一层淡色 |
| `:focus`、`:focus-visible`、`:focus-within` | 删掉这条规则 | 手机没有键盘焦点环；读屏的焦点由系统画 |
| `:is()`、`:where()` | 展开成几条 | `:is(.a, .b) .c` → `.a .c, .b .c` |
| `:has()` | 组件加类名 | 13 处每处在 `mini.json` 里写明换成哪个类，没写的报错 |
| `:root` | `page` | |
| `[data-theme=dark]`、`[data-corners]`、`[data-density]`、`[data-finish]` 下的令牌 | 进 `styles/vars.js` 的变量表 | 由 XxdPage 写在每页的根节点上（§7） |
| `@layer` | 拍平，按原来的层顺序排 | |
| `*` | 换成具体的标签或类名，换不了的报告 | |
| `color-mix(in srgb, A p%, B)` | `var(--mix-A-p-B)` | `color-mix(in srgb, var(--action) 24%, transparent)` → `var(--mix-action-24-transparent)` |
| `em` | 按所在规则的字号算成 px | |
| 网页专用组件（Tooltip、CommandPalette……） | 不进产物 | 只输出 `mini.json` 里列了的组件 |

**单位：每个产物文件开头写一行 `/*postcss-pxtransform disable*/`。** 这是 Taro 官方提供的整文件不换算的写法。这样不管用户的 Taro 项目怎么配，我们的 px 都不会被换成 rpx。

**报告**：`build-mini` 每次输出一份 `styles/REPORT.md`，按 §3 的表逐项列出改写了几处、剩几处，另起一列标出哪些在 Skyline 里还不行。WebView 那一列不是 0 就构建失败。

## 7. 令牌和外观

**缺省外观不靠 JS。** `tokens.mini.css` 把缺省外观（亮色、直角、宽松、纯平、墨色）的变量写在 `page` 上，暗色写在 `@media (prefers-color-scheme: dark) { page { … } }` 里。什么都不做，「跟随系统」就是对的；60 种派生色也按缺省主色在构建时算好写进去。

**别的外观写在每页的根节点上。** 用户选了强制暗色、圆角、紧凑、某个主色时，XxdPage 算出和缺省不一样的那些变量，写在页面根节点的行内样式里，同时挂上外观类名（`is-theme-dark`、`is-corners-rounded`……）。行内样式比样式表优先，所以能盖过媒体查询（比如系统是暗色、用户选了亮色）。`root-portal` 把浮层挪到页面最外层，继承不到根节点，所以浮层的根节点上再写一遍。（原计划写进 `page-meta` 的 `page-style`；Taro 要每一页的配置都打开 `enablePageMeta` 它才生效，改成了根节点。）

- **主色**：用 `accentPalette()` 算，和网页版同一套算法、同样 18 个预设；跟主色有关的派生色同时重算。
- **导航栏、标签栏**：跟随系统时用 `theme.json`；强制亮 / 暗时调用 `setNavigationBarColor`、`setTabBarStyle` 跟着换。
- **跟随系统**：监听 `onThemeChange`，系统换了就重算。
- **存储**：用 `Taro.getStorageSync` / `setStorageSync`，键名和网页版一样是 `xxd-ui`。
- **首帧不闪**：`getStorageSync` 是同步的，XxdProvider 第一次渲染就用存好的设置，不会先画缺省样子再变（网页版靠 `boot.js` 做到这一点）。
- **锁定**：和 React 版一样支持 `lock`，比如产品要求永远直角时写 `lock={{ corners: "square" }}`。

**最低基础库定 3.0.0。** 需要的能力里，`root-portal` 的 `enable` 属性要求最晚，从 2.26.1 开始支持；其余的（暗色 2.11.0、无障碍属性 2.7.1）都更早。取整定 3.0.0，写进 `app.json` 和 `new-mini` 的模板。正式上线前，在小程序后台看一眼用户的版本分布再确认。

## 8. 设计原则到小程序

| 原则（`docs/DESIGN-PRINCIPLES.md`） | 小程序里 |
| --- | --- |
| 默认直角；圆角是一个开关 | 同。`--r-*` 令牌照旧 |
| 黑白灰，强调靠墨色；主色 18 个预设 | 同。主色在运行时算，写在页面根节点上，全页面跟着变 |
| 暗色是暖黑 | 同一组颜色。导航栏、标签栏的颜色也跟着变 |
| 只用系统无衬线字；字重 400 / 500 / 600 | 同。小程序本来就用系统字体 |
| 发丝线 1px | 1px 不换算，不会在有的手机上变成 0.5px 发虚或者消失 |
| 卡片、行、按钮不加阴影；只有浮层有一层阴影 | 同，而且 Skyline 本来就只支持一层 |
| 动效只动透明度和位置 | 同 |
| 图标 24 网格、1.5 线宽、方角 | 同一套图标（§10） |

手机上要加的规则，写进设计原则的新一节「小程序和手机」：

- **点得到**：可点的东西至少 44 × 44px（网页控件 40px，小程序里大一档）。在密度令牌里加一档 `--control-touch`，不在组件里写死。
- **避开胶囊按钮**：自定义导航栏按 `getMenuButtonBoundingClientRect()` 给右上角的胶囊让位，标题和胶囊垂直居中对齐。
- **底部安全区**：底部的按钮条、标签栏、底部面板加上 `env(safe-area-inset-bottom)`。
- **鼠标交互换成手机交互**：菜单、浮动卡片换成底部面板；悬停提示不做，说明直接写在界面上；右键换成长按。
- **按下要有反馈**：用 `hover-class` 给一层淡色，不加粗、不放大。
- **返回键关浮层**：底部面板、对话框打开时，按手机的返回键或右滑先关浮层，不直接退出这一页。

## 9. 组件

**第一批（够做一个能用的小程序）**

| 小程序组件 | 来自网页版的 | 说明 |
| --- | --- | --- |
| Button | Button | 实心 / 次要 / 幽灵 / 危险；加载中；整行宽 |
| Cell、CellGroup | List、SettingsGroup | 手机最常用的一行：标题、说明、右边的值和箭头 |
| Field、Input、Textarea | Field | 标签、说明、出错；字数 |
| Switch、Checkbox、Radio | 同名 | 自己画，和网页版一模一样（§13 第 6 条） |
| Segmented、Tabs | 同名 | Tabs 可以左右滑 |
| Sheet（底部面板） | Sheet、Menu、Popover | 手机上一切「更多操作」都放这里 |
| Dialog | Dialog | 用 `root-portal` 盖在页面上 |
| Toast | Toast | 自己画（`wx.showToast` 的样子改不了） |
| NavBar、TabBar | Topbar、Rail | 自定义导航栏（避胶囊）；自定义标签栏 |
| Empty、Skeleton、Loading | Empty、Skeleton、Spinner | |
| Badge、Avatar、Tag | Badge、Avatar、Chip | |
| Card、ImageGrid | Card | 点图用 `previewImage` 放大 |
| Icon | — | 按名字引入 |

**第二批**：SearchBar、下拉加载更多、Progress、Steps、Collapse、Swipe（左滑出删除）、Picker（底部滚轮）、Uploader（选图、上传进度）、Stat、Chart（ECharts 有小程序版，配色沿用 `chartPalette`）。

**不做**：Tooltip、CommandPalette、Sidebar、ColumnResize 这类鼠标和大屏的东西。

**无障碍。** 微信从基础库 2.7.1 起支持 `aria-role`、`aria-label`、`aria-checked`、`aria-selected`、`aria-disabled`、`aria-expanded`、`aria-hidden` 等属性（官方列了 49 个）。每个组件都带上和网页版同样的角色和状态：

- 开关是 `switch` + `aria-checked`，分段选择是 `radio`，标签页是 `tab` + `aria-selected`。
- 只有图标的按钮必须给 `label`，不给就在开发时报警告。
- 对话框打开时页面其余部分 `aria-hidden`。
- 轻提示用 `aria-live` 播报。

官方提醒部分角色在手机上可能无效，所以读屏要真机试：iOS 旁白、安卓 TalkBack 各走一遍主要流程。这一项和网页版一样，等维护者自己在手机上试，AI 助手不改系统设置。

## 10. 图标

- **WebView（第一版）**：图标用 CSS 的 `mask-image` 加一个 SVG 数据地址，颜色是 `background-color: var(--icon-color, var(--ink))`。颜色跟着样式走，按钮按下、换主题、换主色都不用换图。
- **Skyline（以后）**：如果 Skyline 不支持遮罩，就换成 `<Image>` 加运行时按当前颜色生成的 SVG 数据地址。

两种都从 `@xxd/icons` 的同一份路径数据生成，按名字引入（`<Icon name="Trash" />`），没用到的图标不进包。

## 11. 工具、展示、试点和检查

- **新建**：`xxd-ui new-mini ./my-app --name 今日待办` 生成一个 Taro 项目，带上：
  - `@xxd/mini`
  - 开了 `darkmode` 的 `app.json`，写好最低基础库 3.0.0
  - `theme.json`
  - 首页、设置页、底部标签栏
  - 不换算 px 的配置

  生成的项目，微信开发者工具打开就能跑。
- **体检**：`xxd-ui doctor` 加小程序规则：
  - 写死的颜色和圆角
  - 属性选择器、`*`
  - `app.json` 没开暗色、没写最低基础库
  - 主包超过 1.5 MB 提醒（2 MB 是硬上限）
  - 没给胶囊让位的导航栏
  - 只有图标、没有 `label` 的按钮
  - 产物里出现 rpx（说明 px 被换算了）
- **展示站**：演示小程序编一份 H5，构建时放进展示站的 `/mini/`。组件页在「原生 HTML / React」旁边多一个「小程序」标签，放在一个手机大小的框里。另有一页「小程序」总说明，讲怎么开始、手机上的规则；中英两版。
- **试点**：演示小程序「小小东 UI」本身就是试点。除了组件目录，它有一个真能用的「待办」页：新建、勾选、左滑删除、按标签筛选、外观设置，数据存在本机。做 M3 的时候边做边用，用出来的问题回头改组件。以后小小东有了正式的小程序，再接进去用一次。
- **检查**：
  - 改写规则有单元测试，跟 `@xxd/css` 的测试一起跑。
  - H5 版进现有的截图对比和审计（axe、长文字、细节、浮层）。
  - 真机行为用微信官方的自动化工具（`miniprogram-automator`）驱动开发者工具：每页亮暗各截一张；打开每个浮层；切主色、圆角、密度；查每个控件的角色和状态属性。这一项需要本机装开发者工具，放在 CI 之外，像现在的 `visual` 一样本机跑。**还没做**：做的这台机器上没有微信开发者工具（§16）。
  - 没有开发者工具也能查的，都做成了脚本：`pnpm --filter @xxd/mini-demo check:weapp` 查微信版产物（压缩后的 WXSS 再过一遍门禁、主包大小、暗色、最低基础库、模板里的读屏属性、有没有 rpx）；`pnpm --filter @xxd/mini-demo check` 查 H5 版（每个组件 × 两种外观的 axe、两种宽度不溢出、浮层落在屏幕里、待办和外观页真的操作一遍）。
  - 构建报告（§6）里 WebView 那一列不是 0 就失败。
  - 包大小：组件样式加起来不超过 60 KB，演示小程序主包不超过 1 MB，超了就失败。

## 12. 分几步做

| 步 | 内容 | 交付 | 验收 |
| --- | --- | --- | --- |
| M1 | 令牌小程序版 | `tokens.mini.css`、`theme.json`、`mini-vars.js`；`@xxd/tokens` 里加不碰 DOM 的「设置 → 变量表」函数，网页版也改用它 | 亮 / 暗 × 18 个主色，所有文字对比度测试照样过（和网页版同一套测试）；派生色和浏览器里 `color-mix` 算出来的差不超过 1 |
| M2 | 样式改写 | `build-mini.mjs`、`mini.json`、每个组件一份 `*.mini.css`、`REPORT.md` | 产物里只有 §6 允许的选择器；WebView 一列是 0；规则有单元测试 |
| M3 | 第一批组件 | `@xxd/mini` 第一批 + XxdProvider / XxdPage + Icon；演示小程序的目录页和待办页 | H5 版过截图对比和 axe；开发者工具里亮暗、主色、圆角、密度切换正常，首帧不闪；没用到的组件样式不进包 |
| M4 | 工具 | `xxd-ui new-mini`、`doctor` 的小程序规则 | 新建的项目开发者工具里直接跑；`doctor` 对它零问题，对故意写坏的例子每条都报 |
| M5 | 展示 | 展示站「小程序」标签和总说明页（中英）、`/mini/` 的 H5 | 每个小程序组件中英两版都有页面（测试会查）；审计全过 |
| M6 | 扩展 | 第二批组件；Skyline；按需要加支付宝 / 抖音 | Skyline：报告里 Skyline 那一列清零，自动化检查在 Skyline 下再跑一遍；每加一个平台，M3 的检查在那个平台再跑一遍 |

M1、M2 只动这个仓库里的构建脚本和测试，不需要装微信开发者工具；M3 开始需要。

## 13. 已定的事

| # | 事 | 定了什么 | 为什么 |
| --- | --- | --- | --- |
| 1 | 框架 | Taro 4.2.x + React 18，锁小版本 | 和 `@xxd/react` 同是 React，写法能对齐；能出 H5 给展示站用；以后加别的平台不用重写。原生小程序只能微信、展示站看不到真样子；uni-app 是 Vue，和现有的 React 不通 |
| 2 | 单位 | px 不换算 | 和网页版、插件版同一组数字；1px 线不发虚；iPad、电脑版微信上不会放得很大。实现见 §6 |
| 3 | 渲染引擎 | 先只保证 WebView；Skyline 放到 M6 | WebView 兼容最好。Skyline 限制多（没有 `*`、`currentColor`、`em`、`sticky`），一开始两种都保证会慢很多。报告里一直列着 Skyline 那一列，到时候知道还差多少 |
| 4 | 平台 | 先只做微信 | 用户最多；先把一个平台做扎实。代码不写平台专有的东西，以后加支付宝、抖音只补差异 |
| 5 | 试点 | 演示小程序「小小东 UI」，带一个真能用的待办页 | 本机没有小小东自己的小程序；会员站投递风格的那个小程序（ADR 0013 的 `xxd-miniprogram`）不是我们的，不能拿来试 |
| 6 | 开关、复选、单选 | 自己画 | 和网页版一模一样；原生控件的样子由微信定，直角做不出来。代价是要自己补无障碍属性，§9 已经写了 |
| 7 | 包名 | `@xxd/mini` | 维护者定。不绑在 Taro 的名字上，以后底层换了也不用改名 |

## 14. 以后要维护者做的事（不挡 M1–M5）

- **AppID 和上传**：演示小程序开发时用测试号。注册小程序、填正式 AppID、上传审核、发布都要用维护者自己的微信账号，由维护者来做。
- **npm 发布**：`@xxd/mini` 和别的包一样先 `private: true`，`@xxd` 这个 npm 范围归谁和 D9 一起定。
- **真机读屏**：iOS 旁白、安卓 TalkBack 各走一遍（§9）。

## 15. 风险

- **小程序样式能力随微信版本变**：Skyline 的 CSS 变量要 Android 8.0.35、iOS 8.0.38 以上，`position: fixed` 要 8.0.43 以上。WebView 引擎依赖手机系统，老安卓机上 CSS 变量也可能有问题。最低基础库定了 3.0.0（§7），上线前再看用户分布。
- **Taro 版本**：Taro 3 → 4 有过不兼容的改动。我们锁一个小版本，升级时跑完整检查。`@xxd/mini` 跟着 Taro 4.2 用 React 18（M3 开工时再按 Taro 的官方说明确认能不能上 React 19）；仓库里别的包用的是 React 19（`pnpm-workspace.yaml` 的 catalog），小程序的两个包单独写版本，不用 catalog。
- **依赖太重**：Taro 的依赖很多。`@xxd/mini` 和演示小程序放在自己的包里，不进 `@xxd/css`、`@xxd/react` 的依赖，不拖慢现有的构建和测试。
- **组件库在用户项目里怎么被编译**：Taro 会编译 `node_modules` 里的组件库，各版本的打包配置细节不完全一样。M3 用演示小程序和 `new-mini` 生成的项目两边验证，把要的配置写进模板和文档。
- **体积**：组件样式 + 图标一不留神就会把主包吃满。所以按需引入第一版就做，并有体积门禁（§11）。
- **审美会不会被手机习惯带偏**：手机上常见圆角大卡片、渐变按钮、彩色图标，这些设计原则都不要。新加的「小程序和手机」一节只补交互规则（点得到、安全区、底部面板、返回键），不改气质。

## 参考

- Taro：<https://github.com/NervJS/taro>，尺寸说明（大写 `PX`、`onePxTransform`、整文件不换算的注释）<https://docs.taro.zone/docs/size>
- 微信 WXSS：<https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html>
- Skyline 样式支持：<https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/wxss.html>
- 小程序暗色：<https://developers.weixin.qq.com/miniprogram/dev/framework/ability/darkmode.html>
- 分包与大小限制：<https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html>
- `root-portal`（基础库 2.25.2 起，`enable` 2.26.1 起）：<https://developers.weixin.qq.com/miniprogram/dev/component/root-portal.html>
- 无障碍属性（基础库 2.7.1 起）：<https://developers.weixin.qq.com/miniprogram/dev/component/aria-component.html>
- NutUI React（Taro 版）主题：<https://github.com/jdf2e/nutui-react>

## 16. 进度与实际做法（2026-10-14）

| 步 | 状态 | 在哪 |
| --- | --- | --- |
| M1 令牌 | 做完 | `packages/xxd-tokens/src/resolve.js`（和 Chrome 对过 242 个 color-mix 表达式，`test/fixtures/color-mix.chrome.json`）；`tokens.json` 补上主色两块 |
| M2 样式改写 | 做完 | `packages/xxd-mini/scripts/build-mini.mjs`、`mini.json`、`styles/REPORT.md`；WebView 一列 0 |
| M3 第一批组件 | 做完 | `packages/xxd-mini/src/`；演示小程序 `packages/xxd-mini-demo`（组件目录、待办、外观） |
| M4 工具 | 做完 | `xxd-ui new-mini`、`doctor` 的小程序规则（`packages/xxd-extension/scripts/lib/mini.mjs`） |
| M5 展示 | 做完 | 组件页的「小程序」标签、`/miniprogram/` 总说明和每个组件一页（中英）、H5 放在 `/mini/` |
| M6 扩展 | 第二批组件、Skyline 做完；支付宝 / 抖音没做 | Skyline：`scripts/skyline.mjs` 给每条 Skyline 不支持的声明写后备，报告和压缩后的产物里都是 0 |

**和计划不一样的地方**

- **Taro 版本**：用的 4.2.1。动手时 4.3.0 已经出了（2026-09-29），刚出的大版本先不追，等它稳一点再升，升级时跑全部检查。
- **外观写在哪**：根节点，不是 `page-meta`（§7）。
- **读屏属性要一个 Taro 插件**：Taro 4.2 编微信小程序时，view、text、button 等组件的模板里没有 `aria-*`，写了也会被丢掉。`@xxd/mini/taro-plugin` 在构建时把这些属性登记进模板，运行时再登记一遍同样的属性（两边都读 `aria.json`，不一样的话 Taro 的属性编号会错位，连 `hover-class` 都会坏）。没装插件时运行时不登记，组件照样能用，只是读屏属性不生效，开发时会提醒。
- **H5 的几处适配**：Taro 的 H5 没有 `page` 元素，令牌同时写给 `.xxd-h5-root`（运行时挂到 `<html>` 上）；组件库在 `node_modules` 里，Taro 的 H5 不改写里面的 `Taro.xxx`，所以组件库按名字导入 Taro 的 API；H5 的 Image / Input 要经 `nativeProps` 才能给里面真正的 `<img>`、`<input>` 写 alt 和读屏名字。
- **新建项目带着组件**：`new-mini` 把 `@xxd/mini`、`@xxd/tokens`、`@xxd/icons` 打成包放进项目的 `vendor/`（和插件的 `vendor/xxd` 一个道理）。软链到仓库会让 `react`、`@tarojs/shared` 各有两份，读屏属性登记到另一份上。
- **图表**：没用 ECharts，画成 SVG 图片（折线、柱状、迷你折线），配色和网页版 `chartPalette` 同一个算法。主包小，也不用装 ECharts 的小程序版。
- **Skyline 的做法**：同一份 WXSS 两种引擎都用，所以不改原来的写法，而是在每条 Skyline 不支持的声明前面先写一条它认得的（grid → flex 竖排、inline-flex → flex、currentColor → 跟着文字颜色走的变量、em → px、sticky → relative、overflow: auto → hidden、多层阴影 → 第一层）。最低微信 8.0.50（`:nth-child`、兄弟选择器、`:not` 从这一版起都支持）。在 Skyline 里会差一点的：网格退成一列，`overflow: auto` 的地方滚不动（底部面板的内容区已经换成 scroll-view）。
- **体积门禁**按压缩后的大小算（Taro 正式构建会压缩）：现在 57 KB，上限 60 KB。网页版里小程序用不到的修饰（`mini.json` 的 `skip`）和声明（`cursor` 等）不进产物。

**还没验证的（要微信开发者工具或真机）**

- 微信开发者工具里打开演示小程序、`new-mini` 新建的项目；`miniprogram-automator` 的检查（§11）。这台机器上只有微信客户端，没有开发者工具。
- Skyline 引擎下真的跑一遍：页面配置里打开 `renderer: "skyline"`，看后备声明是不是都生效。
- 真机读屏：iOS 旁白、安卓 TalkBack。
- 支付宝、抖音小程序：代码没用微信专有的 API（读屏插件对这几个平台也登记），按 §13 第 4 条，等要用的时候再加平台插件、跑一遍检查。

- 2026-10-15：样式体积预算从 60 KB 调到 64 KB（设计师评审 V2–V4 加了禁用令牌、浮层抬起一层、半档间距和浮层规则，约 2 KB）。
- 2026-10-18：样式体积预算从 64 KB 调到 68 KB（小程序对抗测试加了底部按钮条、数量加减、日期滚轮、结果页和点按区、面板拖动、键盘的规则，约 3.5 KB；见 MINI-REVIEW-PLAN）。
