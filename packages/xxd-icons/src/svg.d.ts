import type { IconName } from "./names.js";
export type { IconName };
export type IconNode = [tag: string, attrs: Record<string, string | number>];
export declare const ICON_NODES: Readonly<Record<string, IconNode[]>>;
export declare const ICON_ALIASES: Readonly<Record<string, string>>;
export declare const ICON_ATTRIBUTES: Readonly<Record<string, string | number>>;
export declare const ICON_NAMES: readonly string[];
/** 名字（含别名，写错时编辑器会补全提示）或 @xxd/icons/each 的图标数据 */
export type IconRef = IconName | (string & {}) | readonly IconNode[];
export declare function resolveIcon(name: IconRef): IconNode[] | null;
export declare function warnUnknownIcon(name: string): void;
export declare function iconSVG(name: IconRef, options?: { size?: number; className?: string; label?: string }): string;
export declare function hydrateIcons(root?: ParentNode): number;
