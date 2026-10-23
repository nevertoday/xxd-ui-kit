// 读屏属性：微信小程序写 aria-role / aria-label / aria-checked……（基础库 2.7.1 起），H5 写 role / aria-*。
// 微信版要先装 @xxd/mini/taro-plugin：它把这些属性登记进模板，并定义 __XXD_MINI_ARIA__；这里在运行时登记同样的属性，
// 两边一致，Taro 的属性编号才对得上（不一致的话连 hover-class 都会错位）。所以没装插件时不登记、也不传。
import { mergeInternalComponents } from "@tarojs/shared";
import table from "../aria.json";
import { IS_H5 } from "./util";

declare const __XXD_MINI_ARIA__: boolean | undefined;

export const ARIA_READY: boolean = IS_H5 || (typeof __XXD_MINI_ARIA__ !== "undefined" && Boolean(__XXD_MINI_ARIA__));

if (!IS_H5 && ARIA_READY) {
  const attrs = Object.fromEntries(table.attributes.map((a: string) => [a, ""]));
  mergeInternalComponents(Object.fromEntries(table.components.map((c: string) => [c, { ...attrs }])));
} else if (!IS_H5 && process.env.NODE_ENV !== "production") {
  console.warn("[@xxd/mini] 没装 @xxd/mini/taro-plugin：读屏属性（aria-*）不会生效。在 config/index.ts 的 plugins 里加上它。");
}

export interface A11y {
  role?: string;
  label?: string;
  checked?: boolean | "mixed";
  selected?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  pressed?: boolean;
  hidden?: boolean;
  busy?: boolean;
  modal?: boolean;
  live?: "polite" | "assertive" | "off";
  /** 标题的级别（role: "heading" 时要写） */
  level?: number;
  valuenow?: number;
  valuemin?: number;
  valuemax?: number;
}

const OMIT_FALSE = new Set<keyof A11y>(["disabled", "busy", "hidden", "modal"]);
const KEYS: (keyof A11y)[] = ["level", "label", "checked", "selected", "disabled", "expanded", "pressed", "hidden", "busy", "modal", "live", "valuenow", "valuemin", "valuemax"];

/** 读屏属性 → 组件 props（按平台写法） */
export function a11y(o: A11y): Record<string, unknown> {
  if (!ARIA_READY) return {};
  if (o.role === "heading" && o.level == null) o = { ...o, level: 2 };
  const out: Record<string, unknown> = {};
  if (o.role) out[IS_H5 ? "role" : "ariaRole"] = o.role;
  for (const key of KEYS) {
    const value = o[key];
    // 禁用、忙、隐藏、模态：false 就是没有，不写（少一个属性，读屏也不会念「未禁用」）
    if (value == null || (value === false && OMIT_FALSE.has(key))) continue;
    if (IS_H5) out[`aria-${key}`] = typeof value === "boolean" ? String(value) : value;
    else out[`aria${key[0].toUpperCase()}${key.slice(1)}`] = value;
  }
  return out;
}
