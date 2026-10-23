// 分段选择：两三个选项里选一个（列表 / 网格、按天 / 按周）。网页版 .xxd-segmented。
import { View } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/segmented.mini.css";
import { a11y } from "./aria";
import { cx, mods } from "./util";

export interface SegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  /** 读屏念的组名 */
  label: string;
  /** 占满一行 */
  block?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string>({ value, onValueChange, options, label, block, size, className }: SegmentedProps<T>) {
  return (
    <View className={cx("xxd-segmented", mods({ block, size: size === "sm" ? "sm" : undefined }), className)} {...a11y({ role: "radiogroup", label })}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <View
            key={o.value}
            className={cx("xxd-segmented__item", mods({ "role-radio": true, checked: on, disabled: o.disabled }))}
            hoverClass={o.disabled ? "none" : "is-hover"}
            onClick={o.disabled || on ? undefined : () => onValueChange(o.value)}
            {...a11y({ role: "radio", checked: on, disabled: o.disabled })}
          >
            {o.label}
          </View>
        );
      })}
    </View>
  );
}
