// 时间线：先后发生了什么。和网页版 .xxd-timeline 同一套样子（DIAGRAM-PLAN）：时间在左，一根竖线串起每条；
// 重点是主色实心点，还没发生的是空心点、灰字，通到它的那一段是虚线。
import { View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/timeline.mini.css";
import { a11y } from "./aria";
import { cx, mods, warnOnce } from "./util";

export interface TimelineItem {
  /** 看得见的时间（「10月23日」「预计 10-31」） */
  time: ReactNode;
  title: ReactNode;
  /** 一两行说明 */
  text?: ReactNode;
  /** 重点：主色实心点（最多 1–2 条） */
  highlight?: boolean;
  /** 还没发生：空心点、灰字、虚线 */
  upcoming?: boolean;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  if (items.length > 9) warnOnce("timeline", "Timeline 超过 9 条：分页，或者按月份分组（DIAGRAM-PLAN D145）");
  return (
    <View className={cx("xxd-timeline", className)} {...a11y({ role: "list" })}>
      {items.map((item, i) => (
        // 下一条还没发生时，这一条下面的线是虚线（网页版的 :has(+ [data-upcoming])，mini.json 的 has）
        <View key={i} className={cx("xxd-timeline__item", mods({ highlight: item.highlight, upcoming: item.upcoming }), items[i + 1]?.upcoming && "is-before-upcoming")} {...a11y({ role: "listitem" })}>
          <Text className="xxd-timeline__time">{item.time}</Text>
          <View className="xxd-timeline__body">
            <Text className="xxd-timeline__title">{item.title}</Text>
            {item.text != null && <Text className="xxd-timeline__text">{item.text}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}
