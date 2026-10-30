// 分层（DIAGRAM-PLAN 第三批）：一样宽的横带从上往下叠，上层用下层。和网页版 .xxd-layers 同一套类名。
import { View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/layers.mini.css";
import { a11y } from "./aria";
import { cx, mods, warnOnce } from "./util";

export interface LayersProps {
  items: { title: ReactNode; description?: ReactNode; highlight?: boolean }[];
  className?: string;
}

export function Layers({ items, className }: LayersProps) {
  if (items.length > 6) warnOnce("layers", "Layers 超过 6 层：合并几层（DIAGRAM-PLAN）");
  return (
    <View className={cx("xxd-layers", className)} {...a11y({ role: "list" })}>
      {items.map((x, i) => (
        <View key={i} className={cx("xxd-layers__item", mods({ highlight: x.highlight }))} {...a11y({ role: "listitem" })}>
          <Text className="xxd-layers__title">{x.title}</Text>
          {x.description != null && <Text className="xxd-layers__desc">{x.description}</Text>}
        </View>
      ))}
    </View>
  );
}
