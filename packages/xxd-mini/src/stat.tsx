// 统计：一个数字和它的变化（本周写入 1,284 篇，↑ 12.4%）。网页版 .xxd-stats / .xxd-stat。
import { View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/stat.mini.css";
import "../styles/chart.mini.css";
import { Sparkline } from "./chart";
import { cx, mods } from "./util";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  /** 变化：up 用成功色、down 用危险色，不写是中性 */
  delta?: ReactNode;
  trend?: "up" | "down";
  /** 小趋势图的数据 */
  spark?: number[];
  className?: string;
}

export function Stat({ label, value, unit, delta, trend, spark, className }: StatProps) {
  return (
    <View className={cx("xxd-stat", className)}>
      <Text className="xxd-stat__label">{label}</Text>
      <View className="xxd-stat__value">
        <Text>{value}</Text>
        {unit != null && <Text className="xxd-stat__unit">{unit}</Text>}
      </View>
      {delta != null && <Text className={cx("xxd-stat__delta", mods({ tone: trend }))}>{delta}</Text>}
      {spark && <Sparkline data={spark} className="xxd-stat__spark" />}
    </View>
  );
}

/** 几个统计排成一排：手机上两列 */
export function Stats({ children, columns = 2, className }: { children?: ReactNode; columns?: number; className?: string }) {
  return (
    <View className={cx("xxd-stats", className)} style={`--stat-cols:${columns}`}>
      {children}
    </View>
  );
}
