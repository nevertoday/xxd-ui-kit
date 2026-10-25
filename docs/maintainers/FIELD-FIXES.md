# 用的时候发现的

> 不是一轮对抗测试，是插件用 Kit 时看出来的 Kit 自己的毛病。接着 ECHARTS-REVIEW-PLAN 编号（D137 起）。
> 每条写：哪里看出来的、怎么改的、哪天。

| # | 哪里看出来的 | 毛病 | 怎么改的 | 日期 |
|---|---|---|---|---|
| D137 | 闪电发布的侧边栏（380 宽）设置页 | 12 个主色色块排成 11 + 1 | `.xxd-swatches` 改成行内块 + `text-wrap: balance`：放得下一行就一行，放不下各行一样多（12 个是 6 + 6），什么个数、什么宽度都对；间距改用外边距，容器收回最后一列和最后一行那一份 | 2026-10-24 |
| D138 | 闪电发布的阿拉伯语界面 | `.xxd-error` 的图标写死 `left: 0`，从右往左时图标在字的末尾、压在字上 | 改成 `inset-inline-start: 0`（留白本来就是 `padding-inline-start`） | 2026-10-24 |
| D139 | 同上 | 单个滑块的已填部分写死 `to right`，从右往左时最小值在右边，颜色却从左边长 | 加 `:dir(rtl)` 一条，改成 `to left` | 2026-10-24 |

验证：`pnpm xxd:build && pnpm xxd:test`，`test/contract.test.mjs` 加了「窄面板和从右往左」三条。
用 dist 的 xxd.css + boot.js 截了 `Xxd.mountAppearance` 在 300 / 380 宽、从左往右 / 从右往左，和 400 宽一行放得下的情况。

## 没改的

- `.xxd-table` 的 `data-sticky="start" / "end"` 和几处浮层还写着 `left` / `right`，从右往左时粘住的列在错的一边。没有插件用到，先记下。
- 小程序（`@xxd/mini`）的外观设置有自己的 `Appearance.css`，没跟着改。
