// 循环（DIAGRAM-PLAN 第三批）：3–6 步一排，最后一根回头线回到第一步；vertical 时一步一行。和网页版 .xxd-cycle 同一套类名。
import { View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/cycle.mini.css";
import { a11y } from "./aria";
import { useXxd } from "./provider";
import { cx, mods, styleText, warnOnce } from "./util";

const desc = (block: string, d?: ReactNode) => (d != null ? <Text className={`${block}__desc`}>{d}</Text> : null);

export interface CycleProps {
  steps: { title: ReactNode; description?: ReactNode; highlight?: boolean }[];
  /** 一步一行（窄的地方）；网页版按容器宽度自己换，小程序里自己选 */
  vertical?: boolean;
  className?: string;
}

export function Cycle({ steps, vertical, className }: CycleProps) {
  const { t } = useXxd();
  if (steps.length < 3 || steps.length > 6) warnOnce("cycle", "Cycle 要 3–6 步：少了不成圈，多了合并几步（DIAGRAM-PLAN）");
  return (
    // 回头线的两头按步数算（网页版用 :has 数子元素，小程序直接写 --n）
    <View className={cx("xxd-cycle", mods({ vertical }), className)} style={styleText({ "--n": steps.length })} {...a11y({ role: "list" })}>
      {steps.map((s, i) => (
        <View key={i} className="xxd-cycle__item" {...a11y({ role: "listitem", label: typeof s.title === "string" ? s.title + (i === steps.length - 1 ? t.cycleBack : "") : undefined })}>
          <View className={cx("xxd-cycle__node", mods({ highlight: s.highlight }))}>
            <Text>{s.title}</Text>
            {desc("xxd-cycle", s.description)}
          </View>
        </View>
      ))}
    </View>
  );
}
