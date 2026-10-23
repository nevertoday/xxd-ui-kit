export interface IconGroup {
  id: string;
  zh: string;
  en: string;
  /** 图标名 → 空格分开的关键词 */
  icons: Readonly<Record<string, string>>;
}
export declare const ICON_GROUPS: readonly IconGroup[];
export declare const ICON_KEYWORDS: Readonly<Record<string, string>>;
export declare const ICON_GROUP_OF: Readonly<Record<string, string>>;
