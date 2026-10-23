/** 量表的几何和 SVG（纯函数，网页 / React / 小程序共用）。见 docs/maintainers/GAUGE-PLAN.md。 */
export type XxdGaugeShape = "arc" | "half" | "ring";
export type XxdGaugeTone = "warning" | "danger" | "success";
export type XxdGaugePaint =
  | "track" | "fill" | "fill-warning" | "fill-danger" | "fill-success"
  | "part-0" | "part-1" | "part-2" | "part-3" | "part-4"
  | "zone-warning" | "zone-danger" | "zone-success"
  | "target" | "tick" | "needle";

export interface XxdGaugeZone {
  /** 缺省是最小值 */
  from?: number | string;
  /** 缺省是最大值 */
  to?: number | string;
  tone: XxdGaugeTone;
  /** 数值落在这一段时显示和读出的字；缺省「注意 / 超限 / 达标」 */
  label?: string;
}

export interface XxdGaugeOptions {
  /** 一个数，或者 [最低, 最高] 一段区间（分段、多环不用写） */
  value?: number | string | readonly [number | string, number | string];
  min?: number | string;
  max?: number | string;
  /** arc：270°，缺口朝下（缺省）；half：半圆；ring：整圈 */
  shape?: XxdGaugeShape;
  unit?: string;
  /** 标签：显示在数字下面，也是读屏念的名字 */
  label?: string;
  locale?: string;
  /** 小数位（缺省最多一位） */
  decimals?: number;
  format?: (n: number) => string;
  /** 填充从这个值往两边长（偏差、盈亏，比如 0）；缺省从最小值长 */
  origin?: number | string;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  /** 目标线（一条或几条） */
  target?: number | string | readonly (number | string)[];
  /** 区段：只表意义；数值进了哪一段，填充换成那一段的颜色 */
  zones?: readonly XxdGaugeZone[];
  /** 刻度（把整个弧分成几份） */
  ticks?: number | string;
  /** 分格：N 格，整格才亮 */
  segments?: number | string;
  /** 细线指针（只给 arc / half；有指针时不画填充） */
  needle?: boolean;
  /** 分段：几部分首尾相接（数值是各部分自己的量） */
  parts?: readonly { label: string; value: number | string }[];
  /** 同心多环：最多 3 环，每环可以有自己的满额 */
  rings?: readonly { label: string; value: number | string; min?: number | string; max?: number | string; unit?: string }[];
  /** 两端的刻度数（缺省：arc / half 显示，ring 不显示） */
  ends?: boolean;
  /** 小程序：颜色写进 SVG（role → 颜色）；不传就写类名，由 CSS 从令牌取色 */
  colors?: Partial<Record<XxdGaugePaint, string>>;
  /** 小程序：轨道和填充的线头（网页版由 --stroke-cap 决定） */
  cap?: "butt" | "round";
}

export interface XxdGaugeModel {
  shape: XxdGaugeShape;
  viewBox: string;
  center: { x: number; y: number };
  ends: { x: number; min: string; max: string } | null;
  svg: string;
  svgBody: string;
  needle: { angle: number; length: number } | null;
  display: { value: string; unit: string; label: string; state: { tone: XxdGaugeTone; text: string } | null } | null;
  legend: { label: string; text: string; part: number }[];
  aria: Record<string, string | number>;
  valueText: string;
  label: string;
}

export declare const GAUGE_R: number;
export declare const GAUGE_W: number;
export declare const GAUGE_SHAPES: XxdGaugeShape[];
export declare const GAUGE_MAX_RINGS: number;
export declare const GAUGE_PAINT: Record<XxdGaugePaint, string>;
export declare function gaugeModel(options: XxdGaugeOptions): XxdGaugeModel;
export declare function needleSvg(needle: { angle: number; length: number }, options?: { viewBox?: string; colors?: Partial<Record<XxdGaugePaint, string>>; inline?: boolean }): string;
export declare function gaugeColors(vars: Record<string, string>): Record<XxdGaugePaint, string>;
export declare function gaugeFormat(options?: { locale?: string; decimals?: number; compact?: boolean }): (n: number) => string;
/** 地方小的数字：写全了超过 max 个字就缩写；给了 format 或明说了 compact 时照作者的 */
export declare function tightFormat(options: { locale?: string; decimals?: number; compact?: boolean; format?: (n: number) => string }, max: number): (n: number) => string;
export declare function withUnit(text: string, unit?: string): string;
export declare function polar(r: number, a: number): { x: number; y: number };
export declare function arcPath(r: number, a0: number, a1: number): string;
export declare function ratio(v: number, min: number, max: number): number;
export declare function zoneOf<Z extends { from: number; to: number }>(zones: Z[], v: number): Z | null;
