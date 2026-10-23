// 前后对比（CHART-TYPES-PLAN H5）。换算和网页版同一份（viz-core → @xxd/css/viz），结构和类名也一样；样式由 scripts/build-mini.mjs 从网页版改写。
import { Text, View } from "@tarojs/components";
import "../styles/dumbbell.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";
import { dumbbellModel } from "./viz-core";
import { useVizLocale } from "./provider";

interface VizText {
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
}

export interface DumbbellProps extends VizText {
  rows: readonly { label: string; from: number; to: number }[];
  fromLabel?: string;
  toLabel?: string;
  min?: number;
  max?: number;
  className?: string;
}

/** 前后对比：之前空心、之后实心 */
export function Dumbbell({ rows, fromLabel, toLabel, min, max, className, ...text }: DumbbellProps) {
  const m = dumbbellModel(rows, { ...text, fromLabel, toLabel, min, max, locale: useVizLocale() });
  if (m.empty)
    return (
      <View className={cx("xxd-dumbbell", className)}>
        <Text className="xxd-viz-empty">{m.empty}</Text>
      </View>
    );
  return (
    <View className={cx("xxd-dumbbell", className)}>
      <View className="xxd-dumbbell__key">
        <View className="xxd-dumbbell__from" {...a11y({ hidden: true })} />
        <Text>{m.fromLabel}</Text>
        <View className="xxd-dumbbell__to" {...a11y({ hidden: true })} />
        <Text>{m.toLabel}</Text>
      </View>
      <View className="xxd-dumbbell__list" {...a11y({ role: "list" })}>
        {m.rows.map((r, i) => (
          <View key={i} className="xxd-dumbbell__item" {...a11y({ role: "listitem" })}>
            <Text className="xxd-dumbbell__label">{r.label}</Text>
            <View className="xxd-dumbbell__track" style={`--a:${r.a};--b:${r.b};--lo:${Math.min(r.a, r.b)};--hi:${Math.max(r.a, r.b)}`} {...a11y({ hidden: true })}>
              <View className="xxd-dumbbell__line" />
              <View className="xxd-dumbbell__from" />
              <View className="xxd-dumbbell__to" />
            </View>
            <Text className="xxd-dumbbell__value">
              {r.fromText} → {r.toText}
              <Text className="xxd-dumbbell__delta">{r.delta}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
