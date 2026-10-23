// @xxd/tokens/theme：外观设置的读写和应用
export type ThemeMode = "light" | "dark" | "system";
export interface XxdSettings {
  theme?: ThemeMode;
  corners?: "square" | "rounded";
  accent?: string;
  /** auto（缺省）：自动提亮或加深保证对比度；exact：品牌色原样出现在按钮和标记上 */
  accentMode?: "auto" | "exact";
  density?: "comfortable" | "compact";
  finish?: "flat" | "material";
}
export declare const DEFAULT_SETTINGS: Readonly<Required<XxdSettings>>;
export declare const DEFAULT_STORAGE_KEY: string;
export declare function readSettings(key?: string): XxdSettings;
export declare function rememberSettings(patch?: XxdSettings, key?: string): XxdSettings;
export declare function resolveTheme(mode?: string): "light" | "dark";
export declare function applySettings(
  settings?: XxdSettings,
  options?: { element?: HTMLElement; lock?: XxdSettings },
): (Required<XxdSettings> & { resolvedTheme: "light" | "dark" }) | null;
export declare function watchSystemTheme(getSettings: () => XxdSettings, options?: { element?: HTMLElement; lock?: XxdSettings }): () => void;
/** 打印永远是亮色：打印前整页和页面里 data-theme="dark" 的块换成亮色，打印完换回（boot.js 自动装）。 */
export declare function watchPrint(getSettings: () => XxdSettings, options?: { element?: HTMLElement; lock?: XxdSettings }): () => void;
export declare function trackInputModality(root?: HTMLElement): void;
