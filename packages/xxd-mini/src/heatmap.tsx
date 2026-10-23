// 热力格：日历和矩阵（CHART-TYPES-PLAN H5）。换算和网页版同一份（viz-core → @xxd/css/viz），结构和类名也一样；样式由 scripts/build-mini.mjs 从网页版改写。
import { ScrollView, Text, View, type CommonEvent } from "@tarojs/components";
import { useState } from "react";
import "../styles/heatmap.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";
import { calendarModel, matrixModel } from "./viz-core";
import { useVizLocale } from "./provider";

interface VizText {
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
}

export interface HeatmapProps extends VizText {
  /** 日历：{ "2026-03-02": 5 }；手机上一屏放得下 20 周左右，缺省 20 */
  values?: Record<string, number> | readonly { date: string; value: number }[];
  end?: string;
  weeks?: number;
  matrix?: { rows: (string | number)[]; cols: (string | number)[]; values: (number | null | undefined)[][] };
  numbers?: boolean;
  label?: string;
  className?: string;
}

/** 色阶那一行；左边写点到的那一格（CHART-REVIEW-PLAN D50：小程序没有悬停提示，点一下就有） */
const Scale = ({ less, more, tip }: { less: string; more: string; tip: string }) => (
  <View className="xxd-heatmap__scale" {...a11y({ hidden: true })}>
    <Text className="xxd-heatmap__readout">{tip}</Text>
    <Text>{less}</Text>
    {[0, 1, 2, 3, 4].map((l) => (
      <View key={l} className={cx("xxd-heatmap__cell", mods({ level: String(l) }))} />
    ))}
    <Text>{more}</Text>
  </View>
);

/** 热力格：日历或矩阵。日历最近的一周在最右边，横着滚 */
export function Heatmap({ values, end, weeks = 20, matrix, numbers, label, className, ...text }: HeatmapProps) {
  const o = { ...text, label, locale: useVizLocale() };
  // 点到的那一格（data-key）：一个监听挂在格子外面
  const [active, setActive] = useState<string | null>(null);
  const tap = (e: CommonEvent) => {
    const key = (e.target as { dataset?: { key?: string } })?.dataset?.key;
    if (key) setActive(key);
  };
  if (matrix) {
    const m = matrixModel(matrix, o);
    if (m.empty)
      return (
        <View className={cx("xxd-heatmap", mods({ variant: "matrix" }), className)}>
          <Text className="xxd-viz-empty">{m.empty}</Text>
        </View>
      );
    return (
      <View className={cx("xxd-heatmap", mods({ variant: "matrix" }), className)}>
        <ScrollView className="xxd-heatmap__scroll" scrollX enhanced showScrollbar={false}>
          <View className="xxd-heatmap__matrix" style={`--cols:${m.cols.length}`} onTap={tap} {...a11y({ role: "img", label: m.label })}>
            <Text />
            {m.cols.map((c, j) => (
              <Text key={`c${j}`} className="xxd-heatmap__col">{c}</Text>
            ))}
            {m.rows.map((r, i) => [
              <Text key={`r${i}`} className="xxd-heatmap__row">{r}</Text>,
              ...m.cells[i].map((c, j) => (
                <View key={`${i}-${j}`} data-key={`${i}-${j}`} className={cx("xxd-heatmap__cell", mods({ level: c.level < 0 ? "none" : String(c.level), active: active === `${i}-${j}` }))}>
                  {numbers ? c.text : null}
                </View>
              )),
            ])}
          </View>
        </ScrollView>
        <Scale less={m.less} more={m.more} tip={active ? (m.cells[Number(active.split("-")[0])]?.[Number(active.split("-")[1])]?.title ?? "") : ""} />
      </View>
    );
  }
  const m = calendarModel(values ?? {}, { ...o, end, weeks });
  const days = m.columns.flat();
  return (
    <View className={cx("xxd-heatmap", className)}>
      <View className="xxd-heatmap__body">
        <View className="xxd-heatmap__days" {...a11y({ hidden: true })}>
          {m.weekdays.map((d, i) => (
            <Text key={i}>{i % 2 === 0 ? d : ""}</Text>
          ))}
        </View>
        <ScrollView className="xxd-heatmap__scroll" scrollX enhanced showScrollbar={false} scrollLeft={99999}>
          <View className="xxd-heatmap__frame" style={`--weeks:${m.columns.length}`}>
            <View className="xxd-heatmap__months" {...a11y({ hidden: true })}>
              {m.months.map((x) => (
                <Text key={x.col} style={`grid-column:${x.col + 1}`}>{x.text}</Text>
              ))}
            </View>
            <View className="xxd-heatmap__grid" onTap={tap} {...a11y({ role: "img", label: m.label })}>
              {days.map((c) => (
                <View key={c.date} data-key={c.level < 0 ? undefined : c.date} className={cx("xxd-heatmap__cell", mods({ level: c.level < 0 ? "none" : String(c.level), active: active === c.date }))} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      <Scale less={m.less} more={m.more} tip={(active && days.find((c) => c.date === active)?.title) || ""} />
    </View>
  );
}
