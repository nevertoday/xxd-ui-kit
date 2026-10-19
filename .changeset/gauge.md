---
"@xxd/tokens": minor
"@xxd/css": minor
"@xxd/react": minor
"@xxd/mini": minor
---

量表 Gauge（docs/maintainers/GAUGE-PLAN.md，元素类型参考 gauge-ui，画法按设计原则）：

- 一个数在一个范围里的哪儿：三种形状（`arc` 270°、`half`、`ring`），区段（只表意义，进了区段填充换色并写出状态）、目标线、刻度、分格、区间、分段、同心多环（最多 3 环）、细线指针。
- 三种实现同一份几何（`@xxd/css/gauge`，纯函数）：`@xxd/css` 的 `.xxd-gauge` + `Xxd.gauge()` + 声明式 `data-gauge`；`@xxd/react` 的 `<Gauge>`；`@xxd/mini` 的 `<Gauge>`（表盘画成图片，几何打进 dist）。
- 网页版的几何单独一个经典脚本 `dist/gauge.js`（3.7 KB gzip，像图标一样按需加载）；ESM 用 `useGauge(await import("@xxd/css/gauge"))`。
- 读屏：一个数是 `role=meter` + 整句的 `aria-valuetext`；区间、分段、多环是 `role=group`，图例是文字。高对比模式用系统色重画。
- 计量条 `.xxd-meter` 加目标线（`.xxd-meter__target`）、超限变色（`data-tone`）、分格（`data-segments`）；小程序 `Progress` 加 `target`。
- 新令牌 `--stroke-cap`：图上粗线的线头，直角模式平头、圆角模式圆头。
- 设计原则加 §14「数据可视化」。小程序样式预算 68 → 72 KB。
