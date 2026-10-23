// @xxd/tokens 的令牌求值：var() 换成值，color-mix() 算成颜色（不碰 DOM）
import type { XxdSettings } from "./theme.js";

export type Rgba = [number, number, number, number];
export interface TokenModes {
  base: Record<string, string>;
  dark?: Record<string, string>;
  rounded?: Record<string, string>;
  compact?: Record<string, string>;
  accent?: Record<string, string>;
  darkAccent?: Record<string, string>;
  coarse?: Record<string, string>;
}
export declare function parseColor(text: string): Rgba | null;
export declare function formatColor(rgba: Rgba): string;
export declare function mixSrgb(a: Rgba, pa: number | null, b: Rgba, pb: number | null): Rgba | null;
export declare function resolveValue(value: string, vars: Record<string, string>, seen?: Set<string>): string;
export declare function resolveVars(vars: Record<string, string>): Record<string, string>;
export declare function appearanceVars(
  settings?: XxdSettings,
  options?: { modes: TokenModes; extra?: Record<string, string>; system?: "light" | "dark"; coarse?: boolean; lock?: XxdSettings },
): { theme: "light" | "dark"; accent: string; vars: Record<string, string> };
