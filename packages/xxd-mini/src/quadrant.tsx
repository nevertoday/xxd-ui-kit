// 四象限（CHART-TYPES-PLAN 第 9 节）：两个维度各切一刀，看点落在哪一格。换算和网页版同一份（viz-core → @xxd/css/viz），结构和类名也一样；
// 样式由 scripts/build-mini.mjs 从网页版改写。
import { Text, View } from "@tarojs/components";
import "../styles/quadrant.mini.css";
import { a11y } from "./aria";
import { useVizLocale } from "./provider";
import { cx, mods } from "./util";
import { quadrantModel } from "./viz-core";

type Axis = { label?: string; min?: number; max?: number; cut?: number; low?: string; high?: string };

export interface QuadrantProps {
  points: readonly { label: string; x: number; y: number; highlight?: boolean }[];
  /** 横轴：名字、范围、切分点（缺省在中间，等于切分点算高）、两端的名字 */
  x?: Axis;
  /** 竖轴：同上 */
  y?: Axis;
  /** 四格的名字，键是「x 的高低-y 的高低」 */
  names?: Partial<Record<"low-high" | "high-high" | "low-low" | "high-low", string>>;
  label?: string;
  unit?: string;
  decimals?: number;
  compact?: boolean;
  format?: (n: number) => string;
  className?: string;
}

/** 四象限：当前那一格是选中底色加主色线，重点的点实心 */
export function Quadrant({ points, x, y, names, label, className, ...text }: QuadrantProps) {
  const m = quadrantModel(points, { ...text, x, y, names, label, locale: useVizLocale() });
  if (m.empty)
    return (
      <View className={cx("xxd-quadrant", className)}>
        <Text className="xxd-viz-empty">{m.empty}</Text>
      </View>
    );
  const end = (k: string, t: string) => (t ? <Text className={cx("xxd-quadrant__end", mods({ end: k }))}>{t}</Text> : null);
  return (
    <View className={cx("xxd-quadrant", mods({ emphasis: m.emphasis }), className)}>
      <View className="xxd-quadrant__plot" style={`--cx:${m.cut.x};--cy:${m.cut.y}`} {...a11y({ role: "img", label: m.label })}>
        <View className="xxd-quadrant__cells" {...a11y({ hidden: true })}>
          {m.cells.map((c) => (
            <View key={c.key} className={cx("xxd-quadrant__cell", mods({ cell: c.key, current: c.current }))}>
              {c.name ? <Text className="xxd-quadrant__name">{c.name}</Text> : null}
            </View>
          ))}
        </View>
        <View {...a11y({ hidden: true })}>
          {end("x-low", m.x.low)}
          {end("x-high", m.x.high)}
          {end("y-high", m.y.high)}
          {end("y-low", m.y.low)}
        </View>
        <View className="xxd-quadrant__points" {...a11y({ hidden: true })}>
          {m.points.map((p, i) => (
            <View key={i} className={cx("xxd-quadrant__point", mods({ highlight: p.highlight, flip: p.fx > 0.7 }))} style={`--x:${p.fx};--y:${p.fy}`}>
              <View className="xxd-quadrant__dot" />
              <Text className="xxd-quadrant__label">{p.label}</Text>
            </View>
          ))}
        </View>
      </View>
      {m.caption ? <Text className="xxd-quadrant__caption">{m.caption}</Text> : null}
    </View>
  );
}
