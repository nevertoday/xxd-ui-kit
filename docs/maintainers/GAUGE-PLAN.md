# 量表计划（G 阶段）

> 2026-10-19。参考开源项目 [gauge-ui](https://github.com/thordursk/gauge-ui)（MIT，React + SVG 的可组合仪表）：
> 学它把一个仪表拆成哪些元素，不学它的样子（霓虹、弹簧、指南针、汽车仪表盘）。代码是我们自己写的。
> 开工前读这份和 `DESIGN-PRINCIPLES.md` §1（不要装饰性仪表盘）、§2、§8、§12；每批做完在第 6 节打勾写日期。

---

## 0. 结论

1. **我们已有的可视化**：图表（ECharts + `Xxd.chartOptions`，Kumo 的 `TimeseriesChart` / `Sankey` / 地图）、
   统计卡和迷你折线（`Stat`、`Xxd.sparkline`）、进度和计量条（`Progress`、`.xxd-meter`、Kumo `Meter`）、
   小程序的 `Chart` / `Sparkline`。**缺的是「一个数在一个范围里的哪儿」的圆形表达**：配额用了多少、得分、目标完成度。
2. **加一个组件「量表」`Gauge`**，三种实现同一个样子：`@xxd/css`（`.xxd-gauge` + `Xxd.gauge()` + 声明式 `data-gauge`）、
   `@xxd/react`（`<Gauge>`）、`@xxd/mini`（`<Gauge>`）。几何和 SVG 只写一份（`@xxd/css/gauge`，纯函数，没有 DOM）。
3. **从 gauge-ui 学来的元素，按我们的原则裁过**（第 2 节）：轨道、填充、区间、分段、分格、超限区、目标线、刻度、细指针、
   中间的数字；同心多环。**不学**：拖动表盘、悬停气泡、指南针 / 时钟、嵌套的小表、弹簧动画、四种指针。
4. **线性的计量条补上同样的元素**（目标线、分格、超限变色），圆的和直的说同一种话。

---

## 1. 现状（2026-10-19）

| 想表达的 | 现在用什么 | 问题 |
| --- | --- | --- |
| 趋势（随时间变化） | `Chart`（折线 / 柱状）、迷你折线 | 够用 |
| 一个数和上期比 | `Stat` | 够用 |
| 一个数占满额的多少 | `.xxd-meter`、`<progress>` | 只有一条细条：没有目标、没有超限的样子，放在概览页的大块里分量不够 |
| 一个数落在哪一档（正常 / 偏高 / 超限） | 没有 | 各项目自己写，颜色和画法不一 |
| 几个部分加起来占满额的多少（空间：图片 / 视频 / 其他） | 没有 | 用柱状图凑，读不出「还剩多少」 |
| 两三个进度并排比较（本周目标：写作 / 阅读 / 运动） | 没有 | — |

---

## 2. 元素：gauge-ui 有什么，我们怎么做

| gauge-ui 的元素 | 我们 | 依据 |
| --- | --- | --- |
| 轨道 `GaugeTrack` + 填充 `GaugeArc` | **做**。轨道 `--wash-strong`，填充 `--action`（主色 9 级，没主色是墨色），和 `.xxd-meter` 同色 | §2 强调靠墨色 |
| 任意起止角度 | **只给三种形状**：`arc`（270°，缺口朝下，缺省）、`half`（180°）、`ring`（整圈） | §1 克制；三种覆盖所有用法 |
| 线头 `cap="round"` | **跟圆角走**：直角模式是平头，圆角模式是圆头（新令牌 `--stroke-cap`） | §3 两态 |
| 区间 `value={[from, to]}` | **做**：目标区间、一天的最低最高 | — |
| 分段 `GaugeStack` | **做**：几部分首尾相接，颜色用图表的分类色（主色 9、灰 9 / 11 / 10、主色 8），段和段之间留一道缝；必须配图例写出数字 | §2 分类色从色阶取；WCAG 1.4.1 不只靠颜色 |
| 区段 `GaugeZones` | **只表意义**：`warning` / `danger`（少数情况 `success`）三种，画成轨道外侧一道细线；数值进了哪一段，填充就换成那一段的实心色，读屏念出段名 | §2 颜色只留给意义 |
| 刻度灯 `GaugeTickFill` | **做成「分格」**：N 格，亮的格是主色，其余是轨道色。适合能数的东西（8 杯水、5 步里的第 3 步） | — |
| 标记 `GaugeMarks` | **做成「目标线」**：一道墨色的径向短线横穿轨道 | §4 线是有意图的 |
| 刻度 `GaugeTicks` + 刻度数字 `GaugeTickLabels` | 刻度**做**（轨道内侧的发丝线，`--muted-2`）；**数字只标两端**（在缺口两侧，HTML 字），中间不写 | §1 密但好读；手机上 SVG 里的字用不了系统字体 |
| 指针 `GaugeNeedle`（line / pointer / compass / arrow） | **只做一种细线指针**（1.5px 墨色 + 圆心），只给 `arc` / `half`；有指针时不画填充，只画轨道和区段 | §7 线宽 1.5；§1 不要装饰 |
| 圆点 `GaugeDot` | 不做（区间的两端已经是填充的两头） | — |
| 数字 `GaugeValue` / 字 `GaugeText` | **做成 HTML**：中间一个等宽数字（600）+ 单位（次要色），下面一行标签 | §6；HTML 字才能用系统字体、能复制、能被读屏 |
| 悬停气泡 `GaugeTooltip` | **不做**：数字已经写在中间 | §12 没有交互依赖悬停 |
| 嵌套 `GaugeInset`（速度表里的油表） | **不做**。只做「同心多环」：最多 3 环，每环一个数，分类色 + 图例 | §1 不要装饰性仪表盘 |
| 拖动表盘 `GaugeControl`（slider / knob） | **不做**：圆形拖动比直线滑块难对准，键盘上也不直观；调数字用 `Range` / `Stepper` | §9、§12 |
| `wrap` / `rotate`、指南针、时钟 | 不做 | 领域太窄 |
| 弹簧 / 缓动动画、进场扫一圈 | **不做进场动画**。值变了：指针用 `transform: rotate` 转过去（220ms ease-out-expo）；填充直接到位（填充改的是 `stroke-dasharray`，不是 opacity / transform） | §8 只动 opacity / transform，不弹跳 |

### 读屏

- 一个数：根元素 `role="meter"` + `aria-valuemin / max / now` + `aria-valuetext`（「72%，偏高」），名字来自标签或 `aria-label`。
- 区间：`role="group"`，`aria-label` 写成「最低 12，最高 26」。
- 分段 / 多环：`role="group"`，图例是普通文字列表（每项名字和数字），SVG 一律 `aria-hidden`。
- Windows 高对比模式：轨道 `GrayText`、填充 `Highlight`、目标线 `CanvasText`。

### 尺寸

- 宽度跟容器，最大 `--gauge-size`（缺省 160px）。中间数字的字号三档：`data-size="sm"`（`--text-lg`）、缺省（`--text-xl`）、`lg`（`--text-xxl`）。
- 线宽是表盘直径的 1/20（160px 时 8px，和计量条 6px 一档），多环每环一样粗、环之间留一个线宽的缝。

---

## 3. 决定

2026-10-19 维护者说「元素类型可以学习这个开源方案，但是用我们自己的设计原则」；下面由 AI 助手按原则定，维护者可以改。

| # | 问题 | 定的 | 为什么 |
| --- | --- | --- | --- |
| D33 | 形状 | 只有 `arc` / `half` / `ring` | 任意角度只会让每个项目画得不一样 |
| D34 | 线头 | 跟圆角模式（新令牌 `--stroke-cap`） | 直角模式下圆头像别家的组件 |
| D35 | 动画 | 只有指针转；填充不动画；没有进场 | §8；数据界面每天看，进场动画是噱头 |
| D36 | 拖动调值 | 不做 | 精确调值用滑块 |
| D37 | 刻度数字 | 只标两端 | 中间的数在小尺寸挤，在小程序里也画不了系统字体 |
| D38 | 多环 | 最多 3 环 | 第 4 环细得读不出来，分类色也只有 5 种 |
| D39 | 区段颜色 | 只有 warning / danger / success | 颜色只表意义 |
| D40 | 共享代码放哪 | `@xxd/css` 导出 `@xxd/css/gauge`（纯函数）；小程序构建时把它打进 `dist`，用户项目不用装 `@xxd/css` | 一份几何，三种实现画出来一样 |

---

## 4. 任务

- **G1 几何和 SVG**（`packages/xxd-css/src/js/gauge.js`）：形状 → viewBox 和圆心；值 → 角度；弧线 path；分格、分段、多环、
  区段、刻度、目标线、指针。输出 SVG 字符串：网页上用类名（颜色由 CSS 从令牌取，换主题不用重画），小程序上传入算好的颜色。
  单元测试：角度、边界（小于最小、大于最大、最小等于最大）、区间倒过来写、分段总和超过满额、分格取整。
- **G2 `@xxd/css`**：`.xxd-gauge` 的样式（`chart.css`）、`Xxd.gauge(el, options)`、`data-gauge` 声明式（`Xxd.init()` 自动画）、
  读屏属性、高对比模式；`registry.json` + `registry.en.js` 登记「量表 Gauge」，示例：配额、得分带区段、分格、区间、分段、多环、指针。
- **G3 线性计量条**：`.xxd-meter` 加 `data-target`（目标线）、`data-segments`（分格）、`data-tone`（超限变色）。
- **G4 `@xxd/react`**：`<Gauge>`，props 和 `Xxd.gauge()` 的选项一一对应；展示站 React 演示和 parity 对照。
- **G5 `@xxd/mini`**：`<Gauge>`：SVG 画成图片（和 `Chart` 一样从当前外观的令牌算颜色），数字和标签是 `Text`；
  `mini.json` 登记、演示页、H5 检查。
- **G6 规则写进文档**：`DESIGN-PRINCIPLES.md` 加一节「数据可视化」（现在只写在 `chart.js` 的注释里）；`AGENTS.md` 指到这份计划。
- **G7 验收**：各包单元测试、Kumo 1456、展示站 audit（axe / polish / parity / spec）、小程序 H5 检查都绿。

## 5. 不在这一轮

- 拖动表盘、指南针、时钟、汽车 / 飞机仪表盘样例。
- Figma 组件（等 Figma 那一轮一起做）。
- ECharts 的 gauge 系列：`Xxd.chartOptions` 不给它配主题，需要量表就用 `Gauge`。

## 6. 进度

- [x] G1 几何和 SVG（2026-10-19）
- [x] G2 `@xxd/css` 量表（2026-10-19）
- [x] G3 线性计量条（2026-10-19）
- [x] G4 `@xxd/react`（2026-10-19）
- [x] G5 `@xxd/mini`（2026-10-19）
- [x] G6 文档（2026-10-19）
- [x] G7 验收（2026-10-19）

## 7. 做的时候定下的细节（2026-10-19）

- **网页版几何单独一个文件**：放进 `xxd.js` 会超 32 KB 的体积预算（+3.9 KB gzip）。改成 `dist/gauge.js`（3.7 KB gzip），
  像图标一样按需加载：经典脚本放在 `xxd.js` 后面；ESM 用 `useGauge(await import("@xxd/css/gauge"))`。没加载时 `Xxd.gauge()` 在控制台提示一次。
  **同一天后来改名**（CHART-TYPES-PLAN D46）：和图型的换算合成一个文件 `dist/viz.js`（`window.XxdViz`），`useGauge` 改名 `useViz(await import("@xxd/css/viz"))`；`@xxd/css/gauge` 这个入口还在。
  React 和小程序直接用 `@xxd/css/gauge`，不需要这一步。
- **小程序里指针不转**：表盘是一张图片，值变了整张重画（和 `Chart` 一样）。真机上要看重画时闪不闪（`MINI-DEVICE-CHECKLIST.md`）。
- **小程序读屏**：表盘整块是一张图（`role=img`），名字是整句；微信不认 `aria-valuetext`。
- **两端刻度数**用类名（`.xxd-gauge__min / __max`），不用标签选择器：小程序的样式改写会丢掉标签选择器。
- **一排量表顶端对齐**：半圆和 270° 弧高度不同，不对齐的话矮的那个会被拉高、两端的数掉下去。
- **对照**：展示站「两种实现对照」加了两对（区段 + 目标、分段），audit 比表盘尺寸、线的颜色和线头、数字和标签的字。
- 小程序样式预算 68 → 72 KB；网页版只在小程序用不到的上色类用 `mini.json` 的 `skip` 去掉了。
