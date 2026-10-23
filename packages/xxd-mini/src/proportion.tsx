// 构成条：一个整体分成几部分（CHART-TYPES-PLAN H5）。换算和网页版同一份（viz-core → @xxd/css/viz），结构和类名也一样；样式由 scripts/build-mini.mjs 从网页版改写。
import { Text, View } from "@tarojs/components";
import "../styles/proportion.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";
import { Legend } from "./legend";
import { proportionModel } from "./viz-core";
import { useVizLocale } from "./provider";

interface VizText {
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
}

export interface ProportionProps extends VizText {
  parts: readonly { label: string; value: number }[];
  label?: string;
  legend?: boolean;
  /** 几根并排时，条长按合计 ÷ max */
  max?: number;
  className?: string;
}

/** 构成条：一根横条按比例分段 */
export function Proportion({ parts, label, legend = true, max, className, ...text }: ProportionProps) {
  const m = proportionModel(parts, { ...text, label, max, locale: useVizLocale() });
  if (m.empty)
    return (
      <View className={cx("xxd-proportion", className)}>
        {label ? (
          <View className="xxd-proportion__head">
            <Text className="xxd-proportion__label">{label}</Text>
          </View>
        ) : null}
        <Text className="xxd-viz-empty">{m.empty}</Text>
      </View>
    );
  return (
    <View className={cx("xxd-proportion", className)} {...a11y({ role: "group", label: m.label })}>
      {label ? (
        <View className="xxd-proportion__head">
          <Text className="xxd-proportion__label">{label}</Text>
          <Text className="xxd-proportion__total">{m.totalText}</Text>
        </View>
      ) : null}
      <View className="xxd-proportion__bar" style={m.scale < 1 ? `--scale:${m.scale}` : undefined} {...a11y({ hidden: true })}>
        {m.parts.filter((p) => p.share > 0).map((p) => (
          <View key={p.part} className={cx("xxd-proportion__part", mods({ part: String(p.part) }))} style={`--v:${p.share}`} />
        ))}
      </View>
      {legend ? <Legend items={m.parts.map((p) => ({ label: p.label, num: p.text, share: p.percent, part: p.part }))} /> : null}
    </View>
  );
}
