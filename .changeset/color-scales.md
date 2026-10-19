---
"@xxd/tokens": minor
"@xxd/css": minor
"@xxd/react": minor
"@xxd/mini": minor
---

颜色色阶（docs/maintainers/COLOR-SCALE-PLAN.md，借鉴 Radix Colors 的逻辑）：

- 五族（暖灰、主色、成功、危险、警告）× 12 级，每一级用途固定，亮暗各生成一套：数字令牌 `--<族>-1…12`，
  用途名 `--<族>-bg / -tint / -tint-hover / -tint-active / -line / -border / -border-strong / -solid / -solid-hover / -text / -text-strong / -on-solid`。
  现有的灰（`--bg`、`--wash`、`--line`、`--muted`……）和语义色钉在对应的级上，值不变。由 `@xxd/tokens/scripts/scales.mjs` 生成，构建会检查是不是最新的。
- 主色按色阶算：主按钮、开关、焦点用 9 级，链接用 11 级，选中底用 4 级；页面底、淡底、线是带一点主色的灰。`accentPalette()` 多返回 `--accent-<n>-custom*`、`--gray-<n>-custom*`。
- 组件里不再现场混色：`@xxd/css` 的 56 处 `color-mix()` 换成用途名（只剩两处写明原因的例外），加了门禁；React 换皮、Kumo 主题、小程序同样换。
  小程序不再需要预先算的派生色（`--mix-*` 从 17 个降到 0），色阶的数字令牌只写组件用得到的。
- 暗色、墨色时的主按钮比正文的米白暗一档（`#dcd7cd`）。
- 图表的分类色从色阶取：第二条线是灰 9 级、虚线。
- 兼容：`--success-strong` 等旧令牌保留（= `--success-solid`），新代码用用途名。boot.js 体积预算 3.5 → 5 KB（首帧要算色阶）。
