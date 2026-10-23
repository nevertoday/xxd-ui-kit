# Kumo → 小小东 令牌映射

> 由 `packages/kumo/scripts/theme-generator/xxd-overrides.ts` 生成，改映射请改那个文件，然后运行
> `pnpm --filter @cloudflare/kumo codegen:themes`。上游新增 token 没有映射时 codegen 会报错。

## 颜色（bg-* / border-* / ring-*）

| 组 | Kumo token | 小小东值 |
| --- | --- | --- |
| color | `kumo-canvas` | `var(--bg, #fcfcfc)` |
| color | `kumo-elevated` | `var(--bg, #fcfcfc)` |
| color | `kumo-recessed` | `var(--wash, #f4f4f5)` |
| color | `kumo-base` | `var(--paper, #ffffff)` |
| color | `kumo-tint` | `var(--wash, #f4f4f5)` |
| color | `kumo-contrast` | `var(--ink, #111111)` |
| color | `kumo-overlay` | `var(--paper, #ffffff)` |
| color | `kumo-control` | `var(--paper, #ffffff)` |
| color | `kumo-interact` | `var(--line-strong, #c9c9ce)` |
| color | `kumo-fill` | `var(--wash-strong, #ececee)` |
| color | `kumo-fill-hover` | `var(--wash, #f4f4f5)` |
| color | `kumo-brand` | `var(--action, #111111)` |
| color | `kumo-brand-hover` | `color-mix(in srgb, var(--action, #111111) 84%, var(--paper, #ffffff))` |
| color | `kumo-line` | `var(--line, #e7e7ea)` |
| color | `kumo-hairline` | `var(--line, #e7e7ea)` |
| color | `kumo-focus` | `var(--action, #111111)` |
| color | `kumo-shadow-edge` | `rgba(var(--shadow-rgb, 17, 17, 17), 0.12)` |
| color | `kumo-shadow-drop` | `rgba(var(--shadow-rgb, 17, 17, 17), 0.08)` |
| color | `kumo-arrow-edge` | `var(--line, #e7e7ea)` |
| color | `kumo-arrow-stroke` | `transparent` |
| color | `kumo-info-tint` | `color-mix(in srgb, var(--ink, #111111) 5%, transparent)` |
| color | `kumo-info` | `var(--ink, #111111)` |
| color | `kumo-warning-tint` | `color-mix(in srgb, var(--warning, #b45309) 10%, transparent)` |
| color | `kumo-warning` | `var(--warning-strong, #b45309)` |
| color | `kumo-danger-tint` | `color-mix(in srgb, var(--danger, #b42318) 9%, transparent)` |
| color | `kumo-danger` | `var(--danger-strong, #b42318)` |
| color | `kumo-success-tint` | `color-mix(in srgb, var(--success, #15803d) 9%, transparent)` |
| color | `kumo-success` | `var(--success-strong, #15803d)` |
| color | `kumo-banner-info` | `var(--wash, #f4f4f5)` |
| color | `kumo-banner-warning` | `color-mix(in srgb, var(--warning, #b45309) 10%, var(--paper, #ffffff))` |
| color | `kumo-badge-red` | `var(--danger-strong, #b42318)` |
| color | `kumo-badge-green` | `var(--success-strong, #15803d)` |
| color | `kumo-badge-orange` | `var(--warning-strong, #b45309)` |
| color | `kumo-badge-purple` | `var(--action, #111111)` |
| color | `kumo-badge-teal` | `var(--action, #111111)` |
| color | `kumo-badge-blue` | `var(--action, #111111)` |
| color | `kumo-badge-neutral` | `var(--muted, #6b6b6b)` |
| color | `kumo-badge-inverted` | `var(--ink, #111111)` |

## 文字（text-*）

| 组 | Kumo token | 小小东值 |
| --- | --- | --- |
| text | `kumo-default` | `var(--ink, #111111)` |
| text | `kumo-inverse` | `var(--on-ink, #ffffff)` |
| text | `kumo-strong` | `var(--ink, #111111)` |
| text | `kumo-subtle` | `var(--muted, #6b6b6b)` |
| text | `kumo-inactive` | `var(--muted-2, #9a968d)` |
| text | `kumo-placeholder` | `var(--muted-2, #9a968d)` |
| text | `kumo-brand` | `var(--action-text, #111111)` |
| text | `kumo-link` | `var(--action-text, #111111)` |
| text | `kumo-info` | `var(--ink, #111111)` |
| text | `kumo-success` | `var(--success, #15803d)` |
| text | `kumo-danger` | `var(--danger, #b42318)` |
| text | `kumo-warning` | `var(--warning, #b45309)` |
| text | `kumo-badge-orange-subtle` | `var(--warning, #b45309)` |
| text | `kumo-badge-teal-subtle` | `var(--action-text, #111111)` |
| text | `kumo-badge-neutral-subtle` | `var(--ink, #111111)` |
| text | `kumo-badge-inverted` | `var(--on-ink, #ffffff)` |

## 圆角（packages/kumo/src/styles/kumo-binding.css，@theme inline）

| Tailwind | 小小东 |
| --- | --- |
| `rounded-xs` `rounded-sm` `rounded` | `--r-xs`（小标记） |
| `rounded-md` `rounded-lg` | `--r-sm`（控件） |
| `rounded-xl` | `--r-md`（面） |
| `rounded-2xl` 及以上 | `--r-lg`（大面） |
| `rounded-pill`（新） | `--r-pill`：徽标、开关、进度条、滚动条 —— 跟随圆角开关 |
| `rounded-circle`（新） | `--r-circle`：单选、状态点、图例点、圆形按钮 —— 永远是圆 |
| `rounded-full` | **禁止**（合同测试 `src/xxd-contract.test.ts`） |

## 阴影

`shadow-2xs/xs/sm/shadow` → 无；`shadow-md/lg` → `--shadow-popover`；`shadow-xl/2xl` → `--shadow-dialog`。

## 其他换皮点

- 图标：组件从 `@xxd/icons/phosphor` 引入（Phosphor 同名兼容层），不再依赖 `@phosphor-icons/react`。
- Switch：开 = `--switch-on`（墨色时是灰 `#56565b`，有主色时是主色）；直角模式下是方的。
- Checkbox / Radio / 分段控件：选中用 `kumo-brand`（= `--action`），上面的字/勾用 `--on-action`。
- `--ease-bounce` 改为 ease-out-expo（不弹跳）。
- 字体：`--font-sans` → `--font-body`，`--font-serif` → `--font-title`；文档站不再加载 Inter。
