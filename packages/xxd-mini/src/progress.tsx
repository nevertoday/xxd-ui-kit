// 进度：一条进度条（上传、完成度），或者带标题和数字的用量条。网页版 .xxd-progress / .xxd-meter。
import { View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/progress.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";

export interface ProgressProps {
  /** 0–100 */
  value: number;
  label?: ReactNode;
  /** 右边显示的数字，缺省是百分比 */
  valueText?: ReactNode;
  tone?: "action" | "success" | "warning" | "danger";
  /** 目标线（0–100）：横穿轨道的墨色短线；目标要同时写进 valueText */
  target?: number;
  className?: string;
}

export function Progress({ value, label, valueText, tone, target, className }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <View className={cx("xxd-meter", mods({ tone }), className)} {...a11y({ role: "progressbar", valuenow: Math.round(v), valuemin: 0, valuemax: 100, label: typeof label === "string" ? label : undefined })}>
      {(label != null || valueText !== null) && (
        <View className="xxd-meter__head">
          <Text>{label}</Text>
          <Text className="xxd-meter__value">{valueText ?? `${Math.round(v)}%`}</Text>
        </View>
      )}
      <View className="xxd-meter__track">
        <View className="xxd-meter__fill" style={`--value:${v / 100}`} />
      </View>
      {target != null && <View className="xxd-meter__target" style={`--target:${Math.max(0, Math.min(100, target)) / 100}`} />}
    </View>
  );
}
