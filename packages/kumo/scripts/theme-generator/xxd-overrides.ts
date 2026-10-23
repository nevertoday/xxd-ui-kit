/**
 * 小小东换皮：把 Kumo 的语义 token 指向 @xxd/tokens 的变量。
 *
 * 小小东的变量本身已经随 <html data-theme> / data-accent 切换，所以 light 和 dark 写同一个值；
 * light-dark() 仍然由 color-scheme 驱动，但两侧相同。每个值都带 Kumo 原来的亮色作为 fallback，
 * 没引入 tokens.css 时组件依旧能显示。
 *
 * 映射说明见 docs/token-map.md。这个文件是换皮的唯一入口 —— 不要改 config.ts 里的条目，
 * 上游合并时就不会冲突。
 */
import type { ThemeConfig } from "./types.js";

const same = (value: string) => ({ light: value, dark: value });

export const XXD_COLOR: Record<string, string> = {
  // 面：纸 / 背景 / 洗色
  "kumo-canvas": "var(--bg, #fdfcfb)",
  "kumo-elevated": "var(--bg, #fdfcfb)",
  "kumo-recessed": "var(--wash, #f6f4f1)",
  "kumo-base": "var(--paper, #ffffff)",
  "kumo-tint": "var(--wash, #f6f4f1)",
  "kumo-contrast": "var(--ink, #111111)",
  "kumo-overlay": "var(--paper, #ffffff)",
  "kumo-control": "var(--paper, #ffffff)",
  "kumo-interact": "var(--line-strong, #ccc9c5)",
  "kumo-fill": "var(--wash-strong, #eeece9)",
  "kumo-fill-hover": "var(--wash, #f6f4f1)",
  // 强调：墨色或主色
  // 实心底（上面放白字）：主色时是压暗到 4.5:1 的 fill
  "kumo-brand": "var(--action-fill, var(--action, #111111))",
  "kumo-brand-hover": "var(--action-fill-hover, var(--accent-solid-hover, #323232))",
  // 线
  "kumo-line": "var(--line, #e9e7e4)",
  "kumo-hairline": "var(--line, #e9e7e4)",
  "kumo-focus": "var(--action, #111111)",
  "kumo-shadow-edge": "rgba(var(--shadow-rgb, 17, 17, 17), 0.12)",
  "kumo-shadow-drop": "rgba(var(--shadow-rgb, 17, 17, 17), 0.08)",
  "kumo-arrow-edge": "var(--line, #e9e7e4)",
  "kumo-arrow-stroke": "transparent",
  // 语义：只表达意义；info 是中性的。color 组会被当作底色用（白字），所以用 *-strong；text 组用普通语义色。
  // 淡底是色阶的 3 级（COLOR-SCALE-PLAN：组件里不现场混色），兜底值是亮色的值
  "kumo-info-tint": "var(--wash, #f6f4f1)",
  "kumo-info": "var(--ink, #111111)",
  "kumo-warning-tint": "var(--warning-tint, #fff0e9)",
  "kumo-warning": "var(--warning-strong, #b45309)",
  "kumo-danger-tint": "var(--danger-tint, #feeeec)",
  "kumo-danger": "var(--danger-strong, #b42318)",
  "kumo-success-tint": "var(--success-tint, #eaf6ec)",
  "kumo-success": "var(--success-strong, #15803d)",
  "kumo-banner-info": "var(--wash, #f6f4f1)",
  "kumo-banner-warning": "var(--warning-bg, #fef8f4)",
  // 徽标：颜色只留给意义；装饰色收敛到强调色或中性
  "kumo-badge-red": "var(--danger-strong, #b42318)",
  "kumo-badge-green": "var(--success-strong, #15803d)",
  "kumo-badge-orange": "var(--warning-strong, #b45309)",
  "kumo-badge-purple": "var(--action-fill, var(--action, #111111))",
  "kumo-badge-teal": "var(--action-fill, var(--action, #111111))",
  "kumo-badge-blue": "var(--action-fill, var(--action, #111111))",
  "kumo-badge-neutral": "var(--muted, #6d6b67)",
  "kumo-badge-inverted": "var(--ink, #111111)",
};

export const XXD_TEXT: Record<string, string> = {
  "kumo-default": "var(--ink, #111111)",
  "kumo-inverse": "var(--on-ink, #ffffff)",
  "kumo-strong": "var(--ink, #111111)",
  "kumo-subtle": "var(--muted, #6d6b67)",
  "kumo-inactive": "var(--muted-2, #9a968d)",
  "kumo-placeholder": "var(--muted, #6d6b67)",
  "kumo-brand": "var(--action-text, #111111)",
  "kumo-link": "var(--action-text, #111111)",
  "kumo-info": "var(--ink, #111111)",
  "kumo-success": "var(--success, #15803d)",
  "kumo-danger": "var(--danger, #b42318)",
  "kumo-warning": "var(--warning, #b45309)",
  "kumo-badge-orange-subtle": "var(--warning, #b45309)",
  "kumo-badge-teal-subtle": "var(--action-text, #111111)",
  "kumo-badge-neutral-subtle": "var(--ink, #111111)",
  "kumo-badge-inverted": "var(--on-ink, #ffffff)",
};

// 行高：和 @xxd/tokens 成对的行高一样（设计师评审 D20，落在 4px 网格上）：12 / 16、13 / 20、14 / 20、16 / 24
const XXD_LEADING: Record<string, string> = {
  "xs--line-height": "var(--leading-xs, 16px)",
  "sm--line-height": "var(--leading-sm, 20px)",
  "base--line-height": "var(--leading-sm, 20px)",
  "lg--line-height": "var(--leading-md, 24px)",
};

/** 就地改写 THEME_CONFIG 的 kumo 主题值。新增的上游 token 没有映射时直接报错，避免漏掉。 */
export function applyXxdOverrides(config: ThemeConfig): ThemeConfig {
  for (const [group, map] of [
    ["color", XXD_COLOR],
    ["text", XXD_TEXT],
  ] as const) {
    const tokens = config[group];
    for (const name of Object.keys(tokens)) {
      const value = map[name];
      if (!value) throw new Error(`xxd-overrides: 上游新增了 ${group} token "${name}"，请在 xxd-overrides.ts 和 docs/token-map.md 里补上映射`);
      tokens[name].theme.kumo = same(value);
    }
  }
  for (const [name, value] of Object.entries(XXD_LEADING)) {
    const token = config.typography?.[name];
    if (!token) throw new Error(`xxd-overrides: 上游没有 typography token "${name}" 了，请更新 XXD_LEADING`);
    token.theme.kumo = value;
  }
  return config;
}
