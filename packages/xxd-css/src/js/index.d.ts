export type Tone = "neutral" | "success" | "danger" | "warning";

export interface IconsLike { hydrateIcons?(root?: ParentNode): number }
/** 装好事件委托并初始化。signal abort 时等于 uninstall(root)；icons 同 useIcons。可重复调用。 */
export declare function install(root?: Document | ShadowRoot, options?: { signal?: AbortSignal; icons?: IconsLike }): Document | ShadowRoot;
/** 撤掉 install(root) 装的监听和观察者。 */
export declare function uninstall(root?: Document | ShadowRoot): void;
/** 图标渲染用哪份 @xxd/icons（ESM 项目用；经典脚本自动用 window.XxdIcons）。 */
export declare function useIcons(icons: IconsLike | null): void;
export declare function init(root?: ParentNode): void;

export declare function openDialog(dialog: HTMLDialogElement): void;
export declare function closeDialog(dialog: HTMLDialogElement, value?: string): void;
export declare function confirmDialog(options?: {
  title?: string;
  message?: string | Node;
  confirmLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  tone?: "danger";
  within?: HTMLElement | ShadowRoot;
}): Promise<boolean>;

export declare function showFloating(trigger: HTMLElement, floating: HTMLElement, options?: { placement?: string; focusFirst?: boolean }): void;
export declare function hideFloating(floating: HTMLElement, options?: { restoreFocus?: boolean }): void;
export declare function openSubmenu(item: HTMLElement, options?: { focusFirst?: boolean }): HTMLElement | null;
export declare function closeSubmenu(item: HTMLElement, options?: { focusItem?: boolean }): void;
export declare function openPicker(picker: HTMLElement): void;
export declare function closePicker(picker: HTMLElement, options?: { focus?: boolean }): void;
export declare function choosePickerOption(picker: HTMLElement, option: HTMLElement): void;
export declare function place(anchor: Element, floating: HTMLElement, options?: { placement?: string; offset?: number; padding?: number }): { top: number; left: number; side: string };

export declare function selectTab(list: HTMLElement, tab: HTMLElement, options?: { focus?: boolean }): void;
export declare function selectRadio(group: HTMLElement, item: HTMLElement, options?: { focus?: boolean }): void;
export declare function moveInk(list: HTMLElement): void;

export declare function toast(
  message: string,
  options?: { tone?: Tone | "info"; within?: HTMLElement | ShadowRoot; duration?: number; action?: { label: string; onClick?: () => void }; stack?: boolean },
): { element: HTMLElement; dismiss: () => void };
export declare function copyText(text: string): Promise<boolean>;
export declare function showTooltip(anchor: HTMLElement): void;
/** 按钮、chip、徽标的字改了以后重量一次：放不下时标 data-truncated，末尾出省略号（尺寸变化时会自己量，字变了但尺寸没变时调用）。 */
export declare function fitText(el: HTMLElement): void;
export declare function hideTooltip(): void;
export declare function showBubble(anchor: Element, text: string, options?: { duration?: number }): HTMLElement;
export declare function runBusy<T>(button: HTMLElement, task: () => T | Promise<T>, options?: { doneFor?: number }): Promise<T | undefined>;

export declare function openLayer(layer: HTMLElement): void;
export declare function closeLayer(layer: HTMLElement): void;
export declare const openSheet: typeof openLayer;
export declare const closeSheet: typeof closeLayer;
export declare const openPanel: typeof openLayer;
export declare const closePanel: typeof closeLayer;

export declare function bindSearch(input: HTMLInputElement, options?: { onQuery?: (q: string) => void; hotkey?: boolean; scope?: EventTarget }): () => void;
export declare function markMatches(root: Element, query: string): number;
export declare function clearMarks(root: Element): void;
export declare function addTag(box: HTMLElement, value: string): boolean;
export declare function tagValues(box: HTMLElement): string[];

export interface CommandItem { id?: string; label: string; hint?: string; keywords?: string; group?: string; run?: () => void }
export declare function openCommandPalette(options?: { items?: CommandItem[]; placeholder?: string; empty?: string; within?: HTMLElement | ShadowRoot; recentKey?: string; recentLabel?: string; loading?: boolean; loadingLabel?: string }): HTMLDialogElement & { setItems(items: CommandItem[]): void };
export declare function bindCommandPalette(items: CommandItem[] | (() => CommandItem[]), options?: { key?: string; placeholder?: string; empty?: string }): () => void;

export interface AppearanceSettings { theme?: "light" | "dark" | "system"; corners?: "square" | "rounded"; accent?: string; density?: "comfortable" | "compact"; finish?: "flat" | "material" }
export declare const APPEARANCE_LABELS: Record<"zh-CN" | "zh-Hant" | "en", Record<string, string>>;
export declare function mountAppearance(
  container: HTMLElement,
  options?: {
    locale?: "zh-CN" | "zh-Hant" | "en";
    labels?: Record<string, string>;
    get?: () => AppearanceSettings;
    set?: (patch: AppearanceSettings) => void;
    presets?: { id: string; name: string; zh?: string }[];
    lockCorners?: boolean;
    showDensity?: boolean;
    showFinish?: boolean;
    languages?: { value: string; label: string }[];
    language?: string;
    onLanguage?: (value: string) => void;
  },
): { element: HTMLElement; sync: () => void; destroy: () => void };

export declare const ICON: Record<"close" | "check" | "copy" | "search" | "success" | "danger" | "warning" | "info", (size?: number) => string>;

export declare function confirmDelete(options: { name: string; what?: string; title?: string; confirmLabel?: string; cancelLabel?: string; hint?: string; within?: HTMLElement | ShadowRoot }): Promise<boolean>;
export declare function toggleSidebar(sidebar: HTMLElement, collapsed?: boolean): void;
export declare function collapseBreadcrumbs(crumbs: HTMLElement): void;
export declare function spyToc(toc: HTMLElement): void;
export declare function watchTabsOverflow(list: HTMLElement): void;
export declare function renderPagination(nav: HTMLElement, options?: { page?: number; total?: number; perPage?: number }): { page: number; pages: number };
export declare function pageList(page: number, pages: number, around?: number): (number | "…")[];
export declare function syncSelectAll(table: HTMLElement): number;
export declare function syncRangePair(pair: HTMLElement, moved?: HTMLInputElement): [number, number] | null;
export declare function highlight(el: HTMLElement, lang?: "js" | "ts" | "json" | "css" | "html" | "bash"): HTMLElement;
export declare function highlightText(text: string, lang?: string): string;

export declare function bindDrop(target: HTMLElement, options?: { onFiles?: (files: File[]) => void; onText?: (text: string) => void; veil?: string; zone?: HTMLElement }): () => void;
export declare function openViewer(items: { src: string; alt?: string }[], start?: number, options?: { actions?: { label: string; icon?: string; run?: (item: { src: string; alt?: string }, index: number) => void }[]; within?: HTMLElement | ShadowRoot; labels?: Record<string, string> }): { dialog: HTMLDialogElement; show(i: number): void; readonly index: number } | null;
export declare function flip(container: Element, mutate: () => void, options?: { duration?: number; easing?: string; selector?: string }): Promise<void>;
export declare function setStatus(el: HTMLElement, text: string, options?: { tone?: "danger" | "warning" | "success"; action?: { label: string; onClick?: () => void } }): HTMLElement;
export declare function rollText(el: HTMLElement, text: string): void;
export declare function celebrate(anchor: Element, options?: { colors?: string[]; count?: number }): void;
export declare function filterSettings(container: Element, query: string): number;
export declare function bindSettingsSearch(input: HTMLInputElement, container: Element, options?: { hotkey?: boolean }): () => void;

export interface XxdChartTokens { dark: boolean; ink: string; muted: string; line: string; paper: string; accent: string; success: string; danger: string; warning: string; font: string; mono: string }
export declare function chartTokens(el?: Element): XxdChartTokens;
export declare function chartPalette(tokens?: XxdChartTokens): string[];
export declare function chartOptions<T extends Record<string, any>>(option?: T, options?: { el?: Element; tokens?: XxdChartTokens }): T & Record<string, any>;
export declare function watchChartTheme(chart: { setOption(option: any, opts?: any): void }, build: () => any, options?: { el?: Element }): () => void;
export declare function sparkline(values: (number | string)[], options?: { width?: number; height?: number; strokeWidth?: number; area?: boolean; type?: "line" | "bar" }): string;
export declare function initSparklines(root?: ParentNode): void;
export type { XxdGaugeOptions, XxdGaugeModel, XxdGaugeShape, XxdGaugeTone, XxdGaugeZone } from "./gauge";
/** 量表的几何和图的换算用哪份：ESM 项目 useViz(await import("@xxd/css/viz"))；经典脚本自动用 window.XxdViz（dist/viz.js）。 */
export declare function useViz(lib: typeof import("./viz") | null): void;
export type { XxdBarsItem, XxdBarsOptions, XxdVizItem, XxdVizCommon, XxdCalendarOptions, XxdMatrixData, XxdDumbbellRow, XxdDumbbellOptions } from "./viz";
/**
 * 画一张图（或者数据变了重画）：Xxd.viz(el, "bars", [{ label, value }], { unit })。
 * kind：bars | proportion | waffle | calendar | matrix | dumbbell。
 */
export declare function viz(el: Element, kind: "bars" | "proportion" | "waffle" | "calendar" | "matrix" | "dumbbell", data: unknown, options?: Record<string, unknown>): unknown;
/** 元素上的 data-*（data-viz、data-items、data-parts、data-values…）→ [kind, data, options] */
export declare function vizFrom(el: Element): [string | null, unknown?, Record<string, unknown>?];
/** 声明式：[data-viz] 的元素都画出来（Xxd.init 会调用） */
export declare function initViz(root?: ParentNode): void;
/** 画一个量表（或者值变了重画）：el 是 .xxd-gauge。 */
export declare function gauge(el: Element, options: import("./gauge").XxdGaugeOptions): import("./gauge").XxdGaugeModel;
/** 元素上的 data-*（data-value、data-zones="70-90:warning,90:danger"、data-parts="图片:30;视频:20"、data-rings="写作:3/5"…）→ 选项 */
export declare function gaugeOptionsFrom(el: Element): import("./gauge").XxdGaugeOptions;
/** 声明式：[data-gauge] 的元素都画出来（Xxd.init 会调用） */
export declare function initGauges(root?: ParentNode): void;

/** 行为 JS 自己生成的文字用哪种语言（缺省跟 <html lang>）。传空值恢复成跟 <html lang>。 */
export type XxdLocale = "zh-CN" | "zh-Hant" | "en";
export declare function setLocale(locale?: string | null): XxdLocale;
export declare function getLocale(node?: Element): XxdLocale;
export declare function resolveLocale(input?: string | null): XxdLocale;
export declare function t(key: string, vars?: Record<string, string | number> | null, node?: Element): string;
/** 浮层挂在哪：节点在 Shadow 里就是那个 ShadowRoot，否则是 body。 */
export declare function layerRoot(node: Node): HTMLElement | ShadowRoot;
/** 注入到别人网页里时（mountXxdUI 会调用）：toast、确认框、命令面板、图片查看器、tooltip 默认出现在这个 ShadowRoot 里。传 null 恢复成 body。 */
export declare function setDefaultLayerRoot(root: ShadowRoot | HTMLElement | null): void;
export declare function defaultLayerRoot(): HTMLElement | ShadowRoot;

/** 读屏播报：常驻的 live region（install 时建好），只换文字。assertive 打断当前朗读（错误用）。 */
export declare function announce(message: string, options?: { assertive?: boolean; within?: Node }): void;
/**
 * 表单错误：写 aria-invalid、在整个控件下面放一行 .xxd-error 并连上 aria-describedby（出错时说明让位）；message 为空就清掉。
 * 可以传输入组、标签输入、自定义下拉外面的框；单选传组里任意一个，整组一起标；设置行里的控件，错误写在左边那一栏。
 */
export declare function setFieldError(control: Element, message: string, options?: { focus?: boolean }): HTMLElement | null;
/** 校验整张表单（原生约束 + data-max）：错误标在字段下面，焦点到第一个错。返回出错的控件。<form data-xxd-validate> 提交时自动调。 */
export declare function validateForm(form: HTMLFormElement, options?: { focus?: boolean }): Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
/** 这个控件现在哪里不对：返回要显示的话（data-error-* 优先，否则三语默认句子），没问题返回 ""。邮箱、网址、电话里的全角字符先换成半角。 */
export declare function fieldProblem(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, options?: { normalize?: boolean }): string;
