// @xxd/icons/nodes：图标的原始数据（每个图标是一组 [标签, 属性]）
export type IconNode = [tag: string, attrs: Record<string, string | number>];
export declare const ICON_ATTRIBUTES: Readonly<Record<string, string | number>>;
export declare const STAR_PATH: string;
export declare const ICON_NODES: Readonly<Record<string, IconNode[]>>;
export declare const ICON_ALIASES: Readonly<Record<string, string>>;
