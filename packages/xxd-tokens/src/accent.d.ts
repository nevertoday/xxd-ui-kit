// @xxd/tokens/accent：主色的调色和对比度计算
export interface AccentPreset { id: string; name: string; zh: string }
export declare const ACCENT_PRESETS: readonly AccentPreset[];
export declare const ACCENT_KEYS: readonly string[];
export declare const LIGHT_PAPER: number[];
export declare const DARK_PAPER: number[];
export declare function normalizeAccent(value: unknown): string;
export declare function toRgb(hex: string): [number, number, number];
export declare function luminance(rgb: number[]): number;
export declare function contrast(a: number[], b: number[]): number;
export declare function ensureContrast(rgb: number[], paper: number[], toward: number[], min?: number): number[];
export declare function accentPalette(value: unknown, prefix?: string, options?: { exact?: boolean }): Record<string, string> | null;
export declare function applyAccent(element: HTMLElement, value: unknown, options?: { attr?: string; prefix?: string; exact?: boolean }): string;
export declare function accentFill(mark: number[], paper: number[]): { fill: number[]; on: number[] };
export declare function accentFillHover(fill: number[], on: number[], paper: number[]): number[];
/** 自定义主色和意义色太像（实心底 OKLab 距离 < 0.06）：返回像的那几种，不像返回 []（COLOR-REVIEW-PLAN D78） */
export declare function accentClash(value: unknown): Array<"danger" | "success" | "warning">;
