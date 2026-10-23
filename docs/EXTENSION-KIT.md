# Chrome 插件套件

`@xxd/extension` 让每个插件用同一套外观：亮/暗、直角/圆角、主色、三语，以及同样的组件。
插件不能加载远程代码（MV3），所以组件文件**拷进**每个插件的 `vendor/xxd/`，每个插件锁定自己用的版本。

## 新建一个插件

```bash
xxd-ui new ./today --name 今日待办 --name-en "Today" --slug today
```

缺省是最小的、能直接「加载已解压的扩展程序」的 MV3 插件：

- `sidepanel.html`：tab 在最上面（没有顶栏）、内容、底部 dock；侧边栏默认紧凑密度
- `options.html`：设置页（搜索 + 外观组）
- `background.js`：点工具栏图标打开侧边栏（`type: module`，可以 `import` vendor 里的 `tokens.mjs`）
- `_locales/en · zh_CN · zh_TW`：界面上的字全在这里；`default_locale` 是 `en`（日、德、法等用户看到英文，而不是中文）
- `vendor/xxd/`：`tokens.css` `xxd.css` `xxd.shadow.css` `xxd.shadow.css.js` `xxd.js` `boot.js` `icons.js` `extension.js` `tokens.mjs` `VERSION` `LICENSE`

需要时再加（可以一起用）：

| 选项 | 加什么 |
| --- | --- |
| `--popup` | `popup.html`：点工具栏图标弹出的小窗（宽 360，高度跟内容走，上限 600），里面一个按钮打开侧边栏 |
| `--content "https://*.example.com/*"` | `content.js`：往匹配的网页里放一个按钮（Shadow DOM），manifest 的 `content_scripts` 写好依赖顺序 |
| `--account` | 登录页和账号、会员一组（样板：登录、支付都是假的，价格是占位） |

上架前：`xxd-ui store-icons ./today --glyph ListChecks` 生成 16 / 32 / 48 / 128 的 PNG 并写进 manifest。名字用几个朴素的字说清它做什么。

## 更新和体检

```bash
xxd-ui sync ./today ./my-extension     # 拷最新构建，写 VERSION
xxd-ui status                          # 谁落后了（new / init / sync 过的项目都记着；按文件内容比较，只改了文档不算落后）
xxd-ui sync --all                      # 全部更新
xxd-ui doctor ./today                  # 体检，有错误时退出码是 1
```

`doctor` 查：引用的文件在不在、manifest 和 `_locales` 对不对得上、**MV3 规则**（内联脚本、`on*=`、远程脚本、`eval`、商店字数、覆盖所有网站的权限、图标尺寸、内容脚本的依赖顺序）、**写死的中文**（有 `_locales` 时，`aria-label`、页面文字、JS 字符串里的中文）、图标名和类名拼写、写死的颜色 / 阴影 / 字重 / 圆角 / 动效 / 字体。某一行是有意的例外就在那一行写 `xxd-ignore`。

`vendor/xxd/` 不要手改。打包插件时，只要打包工具按引用带上用到的文件就行，`vendor/xxd/LICENSE` 让许可检查通过。

### `xxd.config.json`

放在项目根目录（插件或网站都行），都可以不写：

| 字段 | 作用 |
| --- | --- |
| `vendorDir` | 组件拷到哪；插件默认 `vendor/xxd`，网站写 `false` 不拷 |
| `vendorFiles` | 只拷这几个，比如 `["tokens.css", "boot.js", "xxd.css", "xxd.js"]` |
| `vendorMinify` | `xxd.css`、`xxd.shadow.css` 拷压缩版（缺省 `true`） |
| `tokensTargets` | 把 `tokens.css` 原样写到这些路径（老路径被测试、网站引用，不想改时），比如 `["src/xxd-theme.css"]` |
| `layeredTokensRegions` | 把 layered 令牌写进这些 CSS 文件开头的标记区域：项目已有的变量永远优先（见 [已有网站怎么接入](existing-site.md)） |
| `layeredTokensExclude` | 额外跳过的令牌名（`sync` 已经会自动跳过「项目用了但没声明」的名字） |
| `iconNodesTargets` | 把图标数据写到这些路径（比如 `src/lib/xxd-icon-nodes.js`） |
| `adopt` | `xxd-ui adopt <目录>`：`{ file, aliases }`。删掉和令牌亮暗值都相同的 `:root` 声明，`aliases` 把旧名换成 `var(--令牌)`；先加 `--dry-run` 看会改什么 |
| `doctor.ignore` | 整条规则不查，比如 `["color"]` |

老插件接入：`xxd-ui init ./my-extension`。页面里已经有 `boot.js` 的 `data-key` 就沿用（用户的外观设置不会丢），也可以 `--key` 指定。

## 每种页面用什么

| 页面 | 尺寸、密度 | 适合放什么 | 注意 |
| --- | --- | --- | --- |
| 侧边栏 | 宽 320–400，紧凑 | 主要功能、列表、记录、设置入口 | tab 在最上面；浮层用 sheet，从底部升起 |
| popup | 宽 360、高不超过 600，紧凑 | 一两个最常用的操作 | 不写 `height:100%`（会塌成一条）；不放 modal 对话框，用 sheet 或直接去侧边栏 |
| 设置页 | 阅读列 680，标准 | 外观、快捷键、导入导出、关于 | 设置组 + 搜索 |
| 注入网页 | 跟着网页，紧凑 | 一个入口按钮、小面板 | 一律 Shadow DOM（见下面） |

插件常用的几件事，展示站「模式」里有现成的：需要权限、快捷键、导入导出设置、更新说明、插件已更新请刷新。

## 页面里怎么接

```html
<head>
  <!-- 首帧前应用外观（读 localStorage 镜像）；data-key 每个插件一个 -->
  <script src="vendor/xxd/boot.js" data-key="today-ui" data-default-density="compact"></script>
  <link rel="stylesheet" href="vendor/xxd/xxd.css">
  <script src="vendor/xxd/icons.js"></script>
  <script src="vendor/xxd/xxd.js"></script>        <!-- window.Xxd，自动 install(document) -->
  <script src="vendor/xxd/extension.js"></script>  <!-- window.XxdExtension；按 _locales 定好语言 -->
</head>
<body class="xxd-page">
```

只想换令牌、界面暂时不动：只引 `vendor/xxd/tokens.css` 和 `boot.js`。

## 语言：只有一个来源

每份 `messages.json` 里有一条 `xxdLocale`（`en` / `zh-CN` / `zh-Hant`）。Chrome 按用户的语言挑了哪份，界面就用哪种：

- `extension.js` 加载时写好 `<html lang>`，组件自带的文字（关闭、取消、上一页……）也用这种语言；
- `XxdExtension.uiLocale()` 返回它，日期用 `Intl.DateTimeFormat(uiLocale())`；
- 内容脚本里只改组件的语言，不碰宿主网页的 `<html lang>`；Shadow 的 host 上写 `lang`，读屏按这种语言念。

```html
<span data-i18n="tabSettings">Settings</span>
<input data-i18n-attr="placeholder:searchPlaceholder,aria-label:searchPlaceholder">
```

`XxdExtension.applyI18n(document)` 用 `chrome.i18n` 替换；找不到翻译时保留 HTML 里原来的文字。JS 里用 `XxdExtension.t("key", [替换值])`。

## 外观设置

真正的来源是 `chrome.storage.sync`，localStorage 镜像只为首帧不闪；侧边栏、设置页、popup 之间实时同步。

```js
const { createAppearanceStore, uiLocale } = window.XxdExtension;
const store = createAppearanceStore({ key: "today-ui" });
await store.load();
Xxd.mountAppearance(document.getElementById("settings"), {
  locale: uiLocale(),            // zh-CN | zh-Hant | en
  get: store.get,
  set: (patch) => store.set(patch),
  showDensity: false,
  lockCorners: false,            // 产品要锁直角时 true
});
```

## 往网页里放 UI

一律放进 Shadow DOM，样式互不污染；外观属性写到 host 上，不碰宿主页面的 `<html>`，也不写宿主页面的 localStorage。

```js
// manifest.json：content_scripts 的 js 依次是
//   vendor/xxd/xxd.js、vendor/xxd/extension.js、vendor/xxd/icons.js、vendor/xxd/xxd.shadow.css.js、content.js
(async () => {
  if (document.querySelector("xxd-root[data-ext='today']")) return; // 防重复注入
  const store = XxdExtension.createAppearanceStore({ key: "today-ui", apply: false });
  await store.load();
  const host = document.createElement("xxd-root");          // 自定义元素：宿主的 div { … } 打不到它
  host.dataset.ext = "today";
  host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000";
  document.documentElement.append(host);
  const ui = await XxdExtension.mountXxdUI(host, { settings: store.get() });
  ui.root.innerHTML = `<button class="xxd-btn" data-variant="primary" data-size="sm">导出 MD</button>`;
  store.subscribe((s) => ui.update(s));
})();
```

- 样式来自 `xxd.shadow.css.js`（`globalThis.XxdShadowCSS`）：同步挂上，不用 fetch，**不需要 `web_accessible_resources`**（网站也就没法借它认出插件）。还想用 `cssHref` 也行，那就要把 `xxd.shadow.css` 放进 WAR。
- host 上写的定位、`z-index` 不会被清掉（`all: initial` 在最前面）。
- toast、确认框、命令面板、图片查看器、tooltip 没指定 `within` 时出现在这个 Shadow 里；toast 和 tooltip 进浏览器顶层，宿主页面 z-index 再高也盖不住。
- 主题「跟随系统」时，系统切换亮 / 暗会跟着变。
- 插件更新以后，旧脚本调用 `chrome.*` 会抛「Extension context invalidated」：用 `XxdExtension.guardContext(ui.root)` 包一层（见「插件已更新，请刷新」模式）。
- `xxd.js` 作为内容脚本加载时不会自动接管宿主页面。
- `ui.destroy()` 撤掉装在这个 Shadow 上的所有监听和观察者，再移除 host。
- 内容脚本用打包工具（ESM）写的话：`import * as Xxd from "@xxd/css"; useXxd(Xxd)`（或 `mountXxdUI(host, { xxd: Xxd })`），不依赖全局的 `window.Xxd`。

只想换变量、不想改页面行为：`tokens.css` 里只有变量；减少动效、主色的选中色和输入光标这几条全局规则在 `@xxd/tokens/base.css`（`xxd.css` 已经带上）。

`xxd.shadow.css` 自己就挡得住宿主页面（`pnpm --filter @xxd/site run audit` 里有一张恶意宿主页做门禁）：宿主页面的继承样式在 Shadow 的顶层元素上重置；令牌在 Shadow 内部再声明一次，宿主写了 `div { --ink: … }` 也改不了；`data-theme` / `data-corners` / `data-finish` 写在 host 上都生效。

## service worker 里

`vendor/xxd/tokens.mjs` 是纯数据，service worker、OffscreenCanvas、通知也能用令牌的颜色：

```js
import { TOKENS, setBadge } from "./vendor/xxd/tokens.mjs";
await setBadge("3", "danger");   // 工具栏图标上的徽章
TOKENS.light["--ink"];           // "#111111"
```
