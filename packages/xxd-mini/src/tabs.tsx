// 标签页：一排标签，选中的下面一条墨色线；标签多了可以左右滑，选中的自动滑进来。网页版 .xxd-tabs。
import { ScrollView, View, Text } from "@tarojs/components";
import { useState, type ReactNode } from "react";
import "../styles/tabs.mini.css";
import { a11y } from "./aria";
import { cx, mods, nextId } from "./util";

export interface TabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  items: { value: T; label: ReactNode; count?: number; disabled?: boolean }[];
  size?: "sm" | "md";
  /** 标签平分一行（两三个标签时） */
  block?: boolean;
  label?: string;
  className?: string;
}

export function Tabs<T extends string>({ value, onValueChange, items, size, block, label, className }: TabsProps<T>) {
  const [prefix] = useState(() => nextId("tabs"));
  return (
    // 用序号做 id（值里有空格、中文时 scroll-into-view 会失效）；滑到选中的前一个，选中的就不贴着左边
    <ScrollView className={cx("xxd-tabs-scroll", className)} scrollX enableFlex showScrollbar={false} scrollIntoView={`${prefix}-${Math.max(0, items.findIndex((i) => i.value === value) - 1)}`} scrollWithAnimation>
      <View className={cx("xxd-tabs", mods({ size: size === "sm" ? "sm" : undefined, block }))} {...a11y({ role: "tablist", label })}>
        {items.map((item, index) => {
          const on = item.value === value;
          return (
            <View
              key={item.value}
              id={`${prefix}-${index}`}
              className={cx("xxd-tab", mods({ "role-tab": true, selected: on, disabled: item.disabled }))}
              hoverClass={item.disabled ? "none" : "is-hover"}
              onClick={item.disabled || on ? undefined : () => onValueChange(item.value)}
              {...a11y({ role: "tab", selected: on, disabled: item.disabled })}
            >
              <Text>{item.label}</Text>
              {item.count != null && <Text className="xxd-count">{item.count}</Text>}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** 标签页下面的内容：只画选中的那一块 */
export function TabPanel({ when, value, children, className }: { when: string; value: string; children?: ReactNode; className?: string }) {
  if (when !== value) return null;
  return (
    <View className={cx("xxd-tabpanel", "is-role-tabpanel", className)} {...a11y({ role: "tabpanel" })}>
      {children}
    </View>
  );
}
