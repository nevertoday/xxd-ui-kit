/** 图型的换算（纯函数，网页 / React / 小程序共用）。见 docs/maintainers/CHART-TYPES-PLAN.md。量表的几何也从这里导出。 */
export * from "./gauge";

export interface XxdVizCommon {
  unit?: string;
  /** 标题：也是读屏念的名字 */
  label?: string;
  locale?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
}
export interface XxdVizItem {
  label: string;
  value: number | string;
}

export interface XxdBarsItem extends XxdVizItem {
  highlight?: boolean;
  /** 对照值（去年）：主条下面一根细灰条 */
  compare?: number | string;
  /** 旁注：写在数字下面（「历史最高」） */
  note?: string;
  /** 瀑布：这一行是合计（从 0 起） */
  total?: boolean;
}
export interface XxdBarsOptions extends XxdVizCommon {
  variant?: "plain" | "diverging" | "funnel" | "waterfall";
  /** 满格的值（缺省是最大值；漏斗是第一步） */
  max?: number | string;
  /** 每格代表多少（条按单位切格） */
  step?: number | string;
  /** 缺省按大小排；漏斗、瀑布保留顺序 */
  sort?: boolean;
  /** 参考线（平均、目标）的值和名字 */
  mark?: number | string;
  markLabel?: string;
  /** 图例里主条和对照条的名字（「今年」「去年」） */
  valueLabel?: string;
  compareLabel?: string;
  /** 下面一行刻度数，条后面是网格线 */
  axis?: boolean;
}
export interface XxdBarsModel {
  variant: "plain" | "diverging" | "funnel" | "waterfall";
  rows: { label: string; value: number; highlight: boolean; total: boolean; compare: number | null; frac: number; text: string; note: string; compareFrac?: number; from?: number; to?: number }[];
  rungs: number;
  emphasis: boolean;
  axis: { tick: number; ticks: { at: number; text: string }[] } | null;
  mark: { at: number; text: string } | null;
  key: { value: string; compare: string; mark: string } | null;
  /** 没有数据时的字；有数据时是空字符串 */
  empty: string;
}

export interface XxdProportionModel {
  parts: { label: string; value: number; part: number; share: number; percent: string; text: string }[];
  total: number;
  totalText: string;
  /** 条长（max 时是合计 ÷ max） */
  scale: number;
  label: string;
  empty: string;
}
export interface XxdWaffleModel extends XxdProportionModel {
  /** 每格是第几部分，-1 是空 */
  cells: number[];
  note: string;
}

export interface XxdCalendarOptions extends XxdVizCommon {
  /** 最后一天 YYYY-MM-DD（缺省今天） */
  end?: string;
  /** 几周（缺省 53） */
  weeks?: number | string;
}
export interface XxdCalendarModel {
  columns: { date: string; value: number | null; level: number; title: string }[][];
  months: { col: number; text: string }[];
  weekdays: string[];
  max: number;
  total: number;
  active: number;
  label: string;
  /** 滚动区的名字（读屏、键盘能聚焦到它再左右滚） */
  title: string;
  less: string;
  more: string;
}
export interface XxdMatrixData {
  rows: (string | number)[];
  cols: (string | number)[];
  values: (number | string | null | undefined)[][];
}
export interface XxdMatrixModel {
  rows: string[];
  cols: string[];
  cells: { value: number | null; level: number; text: string; title: string }[][];
  max: number;
  label: string;
  title: string;
  less: string;
  more: string;
  empty: string;
}

export interface XxdDumbbellRow {
  label: string;
  from: number | string;
  to: number | string;
}
export interface XxdDumbbellOptions extends XxdVizCommon {
  min?: number | string;
  max?: number | string;
  fromLabel?: string;
  toLabel?: string;
}
export interface XxdDumbbellModel {
  rows: { label: string; from: number; to: number; a: number; b: number; fromText: string; toText: string; delta: string }[];
  fromLabel: string;
  toLabel: string;
  empty: string;
}

export declare function largestRemainder(values: (number | string)[], total?: number): number[];
export declare function vizLabels(locale?: string): Record<string, string>;
export declare function barsModel(items: readonly XxdBarsItem[], options?: XxdBarsOptions): XxdBarsModel;
export declare function proportionModel(parts: readonly XxdVizItem[], options?: XxdVizCommon & { max?: number | string }): XxdProportionModel;
export declare function niceStep(top: number, n?: number): number;
export declare const VIZ_HTML: Record<"bars" | "proportion" | "waffle" | "calendar" | "matrix" | "dumbbell", (model: any, options?: any) => { attrs: Record<string, string | number | null>; html: string }>;
export declare function gaugeInnerHtml(model: import("./gauge").XxdGaugeModel): string;
export declare function legendHtml(items: { label: string; num: string; share?: string; part: number }[]): string;
export declare function emptyHtml(text: string, tag?: string): string;
export declare function waffleModel(parts: readonly XxdVizItem[], options?: XxdVizCommon & { cells?: number | string }): XxdWaffleModel;
export declare function heatLevel(value: number | string | null | undefined, max: number): number;
export declare function calendarModel(values: Record<string, number> | readonly { date: string; value: number }[], options?: XxdCalendarOptions): XxdCalendarModel;
export declare function matrixModel(data: XxdMatrixData, options?: XxdVizCommon): XxdMatrixModel;
export declare function dumbbellModel(rows: readonly XxdDumbbellRow[], options?: XxdDumbbellOptions): XxdDumbbellModel;
