// 百格图：1 格 = 1%（CHART-TYPES-PLAN H5）。换算和网页版同一份（viz-core → @xxd/css/viz），结构和类名也一样；样式由 scripts/build-mini.mjs 从网页版改写。
import { Text, View } from "@tarojs/components";
import "../styles/proportion.mini.css";
import "../styles/waffle.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";
import { Legend } from "./legend";
import { waffleModel } from "./viz-core";
import { useVizLocale } from "./provider";

interface VizText {
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
}

export interface WaffleProps extends VizText {
  parts: readonly { label: string; value: number }[];
  label?: string;
  cells?: number;
  className?: string;
}

/** 百格图：10 × 10，1 格 = 1% */
export function Waffle({ parts, label, cells, className, ...text }: WaffleProps) {
  const m = waffleModel(parts, { ...text, label, cells, locale: useVizLocale() });
  if (m.empty)
    return (
      <View className={cx("xxd-waffle", className)}>
        <Text className="xxd-viz-empty">{m.empty}</Text>
      </View>
    );
  return (
    <View className={cx("xxd-waffle", className)} {...a11y({ role: "group", label: m.label })}>
      <View className="xxd-waffle__grid" {...a11y({ hidden: true })}>
        {m.cells.map((c, i) => (
          <View key={i} className={cx("xxd-waffle__cell", c >= 0 && mods({ part: String(c) }))} />
        ))}
      </View>
      <View className="xxd-waffle__side">
        <Legend items={m.parts.map((p) => ({ label: p.label, num: p.percent, part: p.part }))} />
        <Text className="xxd-waffle__note">{m.note}</Text>
      </View>
    </View>
  );
}
