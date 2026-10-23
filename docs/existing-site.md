# 已经有一套 CSS 变量的网站怎么接入

**中文** · [English](en/existing-site.md)

适合这种项目：网站已经上线，有自己的 `:root { --bg: …; --ink: … }`，你想用上小小东的令牌、图标和组件，但**不想改动现在的样子**。
（全新的网页不需要这一篇：看 [README 的「先试一下」](../README.md#先试一下不用装)。）

做法分三步，每一步都可以单独停下。

## 1. 写配置

在网站根目录放一个 `xxd.config.json`：

```json
{
  "vendorDir": false,
  "layeredTokensRegions": ["public/styles.css"],
  "iconNodesTargets": ["src/lib/xxd-icon-nodes.js"]
}
```

| 字段 | 意思 |
| --- | --- |
| `vendorDir` | 组件文件（xxd.css、xxd.js…）拷到哪。`false` 表示不拷（只要令牌和图标）；写路径就拷进去，比如 `"public/vendor/xxd"` |
| `layeredTokensRegions` | 把令牌写进这些 CSS 文件的开头 |
| `iconNodesTargets` | 把图标数据（`@xxd/icons` 的 `nodes.js`）同步到这些路径，你自己的图标函数从这里取 |
| `adopt` | 可选，第 3 步用 |

`xxd-ui init ./my-site` 会帮你写一个最基本的配置，并打印要放进 `<head>` 的几行。

## 2. 同步：老变量永远优先

```bash
xxd-ui sync ./my-site
```

`public/styles.css` 开头会多出一段 `/* xxd:tokens:start */ … /* xxd:tokens:end */`，里面是 `@layer xxd.tokens { … }` 包着的令牌
（选择器写成 `:where(:root…)`）。

- **没进 layer 的样式永远赢过 layer 里的**，所以你的网站已有的变量一个都不会变，只多出还没有的那些（`--r-*` 圆角、`--space-*`、`--motion-*`、`--control-h`、`--text-*`、`--z-*`……）。
- 这段里只有变量：全局的「减少动效」等规则在 `@xxd/tokens/base.css`，不会带进来，你自己的动效处理照旧。
- 你的网站没有设 `data-corners` / `data-accent` 时，就一直是直角、墨色。
- 以后再跑 `sync`，只替换标记之间的这一段。

**会自动跳过的变量**：如果你的网站**用了但没有声明**某个令牌同名的变量（靠 `var(--danger, #c33)` 这种后备值，或者干脆没有后备值），
一旦声明，样子就会变。`sync` 会发现这种情况并跳过它，在那一段开头写一行注释列出跳过了哪些。
要统一它们是一次有意的视觉改动，不属于接入本身。

## 3. 可选：相同的声明改由令牌提供

如果你的 `:root` 里有些变量和令牌的亮色、暗色值都完全相同，可以把它们删掉，改由令牌提供；旧名字可以做成别名：

```json
{
  "adopt": {
    "file": "public/styles.css",
    "aliases": { "--old-backdrop": "var(--backdrop)" }
  }
}
```

```bash
xxd-ui adopt ./my-site
```

只删「值完全相同」的；值不同的保留你的。改之前先提交一次，方便对比。

## 怎么证明「零视觉变化」

接入前后各存一份 CSS，用无头 Chrome 逐个比较亮、暗两种主题下每个变量的最终值：

```bash
CHROME_EXE=… node scripts/verify/css-vars-diff.cjs before.css after.css
```

应当只多出新令牌，已有变量一个都不变。再把网站自己的测试在改动前后各跑一遍，`scripts/verify/tap-fail-diff.py` 可以逐条比较两次 TAP 输出。

## 之后

- 改令牌：在 xxd-ui-kit 改 `packages/xxd-tokens/tokens.css` → `xxd-ui sync ./my-site` → 跑网站的测试 → 提交。
- 改图标：在 xxd-ui-kit 改 `packages/xxd-icons/src/nodes.js` → 同上。
- 新页面可以直接用 `@xxd/css` 的类（`vendorDir` 写上路径，组件就会拷进来），旧页面按需逐个替换。
- `xxd-ui doctor ./my-site` 会查写死的颜色、阴影、字重、圆角，以及图标名、类名拼错。
