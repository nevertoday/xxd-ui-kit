// 步骤：一件事分几步（填资料 → 选套餐 → 付款）。做完的打勾，当前这步用墨色。
import { View, Text } from "@tarojs/components";
import { Check } from "@xxd/icons/each";
import type { ReactNode } from "react";
import "../styles/steps.mini.css";
import { a11y } from "./aria";
import { Icon } from "./icon";
import { useXxd } from "./provider";
import { cx, mods } from "./util";

export interface StepsProps {
  items: { title: ReactNode; description?: ReactNode }[];
  /** 当前第几步，从 0 开始 */
  current: number;
  /** 竖着排（每步有说明时） */
  vertical?: boolean;
  className?: string;
}

export function Steps({ items, current, vertical, className }: StepsProps) {
  const { t } = useXxd();
  return (
    <View className={cx("xxd-steps", mods({ vertical }), className)} {...a11y({ role: "list", label: t.step(current + 1, items.length) })}>
      {items.map((item, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <View key={i} className={cx("xxd-steps__item", mods({ state }))} {...a11y({ role: "listitem" })}>
            <View className="xxd-steps__mark">{state === "done" ? <Icon icon={Check} size={12} /> : <Text>{i + 1}</Text>}</View>
            <View className="xxd-steps__text">
              <Text className="xxd-steps__title">{item.title}</Text>
              {item.description != null && <Text className="xxd-steps__desc">{item.description}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}
