// @xxd/extension：Chrome 插件工具（经典脚本 vendor/xxd/extension.js 里是 window.XxdExtension，内容一样）
import type { XxdSettings } from "@xxd/tokens";

export type XxdLocale = "zh-CN" | "zh-Hant" | "en";

export interface AppearanceStore {
  /** 从 chrome.storage 读，写镜像并应用 */
  load(): Promise<XxdSettings>;
  /** 当前设置（同步） */
  get(): XxdSettings;
  set(patch: XxdSettings): Promise<XxdSettings>;
  /** 本页或别的页面改了设置；返回取消订阅 */
  subscribe(fn: (settings: XxdSettings) => void): () => void;
  destroy(): void;
}
export declare function createAppearanceStore(options?: {
  key?: string;
  area?: "sync" | "local";
  element?: HTMLElement;
  lock?: XxdSettings;
  defaults?: XxdSettings;
  /** false：只读写不应用（内容脚本里外观写到 Shadow host 上） */
  apply?: boolean;
  /** 写不写 localStorage 镜像（缺省：插件自己的页面写，内容脚本不写） */
  mirror?: boolean;
}): AppearanceStore;

export interface XxdUI {
  host: HTMLElement;
  root: ShadowRoot;
  update(settings: XxdSettings): unknown;
  /** 撤掉监听、清空并移除 host */
  destroy(): void;
}
/** 往网页里注入界面：放进 Shadow DOM，样式同步挂上（缺省用 vendor/xxd/xxd.shadow.css.js） */
export declare function mountXxdUI(
  host: HTMLElement,
  options?: {
    cssHref?: string;
    cssText?: string;
    settings?: XxdSettings;
    mode?: ShadowRootMode;
    install?: boolean;
    layerRoot?: boolean;
    locale?: XxdLocale;
    /** 用哪份 @xxd/css（缺省 useXxd 设的那份，或 window.Xxd） */
    xxd?: unknown;
  },
): Promise<XxdUI>;

export declare function t(key: string, substitutions?: string | number | Array<string | number>, fallback?: Record<string, string>): string;
export declare function applyI18n(root?: ParentNode, fallback?: Record<string, string>): void;
export declare function uiLocale(lang?: string): XxdLocale;
export declare function applyLocale(locale?: XxdLocale): XxdLocale;
export declare function isContentScript(): boolean;

export declare function bindPermission(
  button: HTMLButtonElement,
  options?: { permissions?: string[]; origins?: string[]; status?: HTMLElement; onChange?: (granted: boolean) => void },
): Promise<void>;
export declare function mountShortcuts(container: HTMLElement, options?: { names?: Record<string, string> }): Promise<HTMLElement>;
export declare function exportSettings(options?: { keys?: string[] | null; area?: "sync" | "local"; filename?: string }): Promise<File>;
export declare function importSettings(file: Blob, options?: { keys?: string[] | null; area?: "sync" | "local" }): Promise<number>;
export declare function showWhatsNew(
  container: HTMLElement,
  options?: { version?: string; notes?: string[]; title?: string; key?: string },
): Promise<HTMLElement | null>;
export declare function contextAlive(): boolean;
/** 包一层 chrome.* 调用：插件已失效时在 root 里放「请刷新」横幅，而不是抛错 */
export declare function guardContext(root: ParentNode, options?: { onDead?: () => void }): <T>(fn: () => T | Promise<T>) => Promise<T | HTMLElement | undefined>;
/** 用哪份 @xxd/css：ESM 项目 useXxd(await import("@xxd/css"))；经典脚本自动用 window.Xxd */
export declare function useXxd(xxd: unknown): void;
