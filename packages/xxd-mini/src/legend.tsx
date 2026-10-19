// 图例：量表、构成条、百格图共用（CHART-TYPES-PLAN H5）。换算和网页版同一份（viz-core → @xxd/css/viz），结构和类名也一样；样式由 scripts/build-mini.mjs 从网页版改写。
import { Text, View } from "@tarojs/components";
import "../styles/proportion.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";

/** 图例：色块 · 名字 · 数字（· 占比）；量表也用它 */
export function Legend({ items }: { items: { label: string; num: string; share?: string; part: number }[] }) {
  return (
    <View className="xxd-legend">
      {items.map((l, i) => (
        <View key={i} className="xxd-legend__item">
          <View className={cx("xxd-legend__key", mods({ part: String(l.part) }))} {...a11y({ hidden: true })} />
          <Text className="xxd-legend__name">{l.label}</Text>
          <Text className="xxd-legend__num">{l.num}</Text>
          {l.share ? <Text className="xxd-legend__share">{l.share}</Text> : null}
        </View>
      ))}
    </View>
  );
}
