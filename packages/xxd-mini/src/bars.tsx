// 条形榜：少类目比较、排名（CHART-TYPES-PLAN H5）。换算和网页版同一份（viz-core → @xxd/css/viz），结构和类名也一样；样式由 scripts/build-mini.mjs 从网页版改写。
import { Text, View } from "@tarojs/components";
import "../styles/bars.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";
import { barsModel } from "./viz-core";
import { useVizLocale } from "./provider";

interface VizText {
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
}

export interface BarsProps extends VizText {
  /** 每行：名字、数；highlight 标重点；compare 对照值（去年）；note 旁注；total 瀑布的合计行 */
  items: readonly { label: string; value: number; highlight?: boolean; compare?: number; note?: string; total?: boolean }[];
  variant?: "plain" | "diverging" | "funnel" | "waterfall";
  /** 每格代表多少：条按单位切格 */
  step?: number;
  max?: number;
  sort?: boolean;
  /** 参考线（平均、目标）的值和名字 */
  mark?: number;
  markLabel?: string;
  /** 图例里主条、对照条的名字 */
  valueLabel?: string;
  compareLabel?: string;
  /** 下面一行刻度数，条后面是网格线 */
  axis?: boolean;
  className?: string;
}

/** 条形榜：名字 · 条 · 数字；每行的字就是数据 */
export function Bars({ items, variant, step, max, sort, mark, markLabel, valueLabel, compareLabel, axis, className, ...text }: BarsProps) {
  const m = barsModel(items, { ...text, variant, step, max, sort, mark, markLabel, valueLabel, compareLabel, axis, locale: useVizLocale() });
  const vars = [m.rungs ? `--rungs:${m.rungs}` : "", m.axis ? `--tick:${m.axis.tick}` : "", m.mark ? `--mark:${m.mark.at}` : "", m.zero != null ? `--zero:${m.zero}` : ""].filter(Boolean).join(";");
  const swatch = (kind: string, label: string) =>
    label ? (
      <Text>
        <Text className={cx("xxd-bars__swatch", mods({ kind }))} />
        {label}
      </Text>
    ) : null;
  return (
    <View
      className={cx("xxd-bars", mods({ variant: m.variant === "plain" ? null : m.variant, emphasis: m.emphasis, rungs: Boolean(m.rungs), axis: Boolean(m.axis), marked: Boolean(m.mark), zero: m.zero != null }), className)}
      style={vars || undefined}
      {...a11y({ role: "list" })}
    >
      {m.empty ? <Text className="xxd-viz-empty">{m.empty}</Text> : null}
      {m.key ? (
        <View className="xxd-bars__key" {...a11y({ hidden: true })}>
          {swatch("value", m.key.value)}
          {swatch("compare", m.key.compare)}
          {swatch("mark", m.key.mark)}
        </View>
      ) : null}
      {m.rows.map((r, i) => (
        <View
          key={i}
          className={cx("xxd-bars__item", mods({ highlight: r.highlight, total: r.total }))}
          style={[`--value:${r.frac}`, r.compareFrac != null ? `--compare:${r.compareFrac}` : "", r.from != null ? `--from:${r.from};--to:${r.to}` : ""].filter(Boolean).join(";")}
          {...a11y({ role: "listitem" })}
        >
          <Text className="xxd-bars__label">{r.label}</Text>
          <View className="xxd-bars__track" {...a11y({ hidden: true })}>
            <View className="xxd-bars__bar">
              <View className="xxd-bars__fill" />
            </View>
            {r.compareFrac != null ? <View className="xxd-bars__compare" /> : null}
          </View>
          <Text className="xxd-bars__value">
            {r.text}
            {r.note ? <Text className="xxd-bars__note">{r.note}</Text> : null}
          </Text>
        </View>
      ))}
      {m.axis ? (
        <View className="xxd-bars__axis" {...a11y({ hidden: true })}>
          <View className="xxd-bars__ticks">
            {m.axis.ticks.map((t, i) => (
              <Text key={i} className="xxd-bars__tick" style={`left:${Math.round(t.at * 1000) / 10}%`}>
                {t.text}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
