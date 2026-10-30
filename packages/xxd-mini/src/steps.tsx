// 步骤：一件事分几步（填资料 → 选套餐 → 付款）。和网页版 .xxd-steps 同一套样子（DIAGRAM-PLAN）：
// 做完的打勾，当前这步是选中底加主色线，还没到的是灰字；横排看进度，竖排带说明。
import { View, Text } from "@tarojs/components";
import { Check } from "@xxd/icons/each";
import type { ReactNode } from "react";
import "../styles/steps.mini.css";
import { a11y } from "./aria";
import { Icon } from "./icon";
import { useXxd } from "./provider";
import { cx, mods, warnOnce } from "./util";

export interface StepsProps {
  items: { title: ReactNode; description?: ReactNode }[];
  /** 当前第几步，从 0 开始；等于 items.length 表示全部做完 */
  current: number;
  /** 竖着排（每步有说明时） */
  vertical?: boolean;
  className?: string;
}

export function Steps({ items, current, vertical, className }: StepsProps) {
  const { t } = useXxd();
  if (items.length > 9) warnOnce("steps", "Steps 超过 9 步：分组，或者拆成几段（DIAGRAM-PLAN D145）");
  return (
    <View className={cx("xxd-steps", mods({ vertical }), className)} {...a11y({ role: "list", label: t.step(Math.min(current + 1, items.length), items.length) })}>
      {items.map((item, i) => {
        const state = i < current ? "done" : i === current ? "current" : undefined;
        const note = state === "done" ? t.stepDone : state === "current" ? t.stepCurrent : "";
        return (
          <View key={i} className={cx("xxd-steps__item", mods({ state }))} {...a11y({ role: "listitem", label: typeof item.title === "string" ? item.title + note : undefined })}>
            <View className="xxd-steps__mark" {...a11y({ hidden: true })}>
              {state === "done" ? <Icon icon={Check} size={14} /> : <Text>{i + 1}</Text>}
            </View>
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
