// 流程图（DIAGRAM-PLAN 第二批）：主线从上往下，一个判断分成 2–3 条，合拢或者各自结束。和网页版 .xxd-flowchart 同一套类名；
// 只用 flex 和定位画线（Skyline 不认 grid）。小程序里没有容器查询：分支一直并排，分支名要短。
import { View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/flowchart.mini.css";
import { a11y } from "./aria";
import { cx, mods, warnOnce } from "./util";

const desc = (block: string, d?: ReactNode) => (d != null ? <Text className={`${block}__desc`}>{d}</Text> : null);

export interface FlowchartStep {
  title: ReactNode;
  description?: ReactNode;
  highlight?: boolean;
  /** 这一步是判断：分成 2–3 条（只分一层） */
  branches?: { label: ReactNode; steps: Omit<FlowchartStep, "branches" | "merge">[]; highlight?: boolean }[];
  /** 分支走完合拢，接主线的下一步 */
  merge?: boolean;
}

function FlowStep({ step }: { step: FlowchartStep }) {
  return (
    <View className="xxd-flowchart__step" {...a11y({ role: "listitem" })}>
      <View className={cx("xxd-flowchart__node", mods({ highlight: step.highlight }))}>
        <Text>{step.title}</Text>
        {desc("xxd-flowchart", step.description)}
      </View>
      {step.branches && (
        <View className={cx("xxd-flowchart__branches", mods({ merge: step.merge }))} {...a11y({ role: "list" })}>
          {step.branches.map((b, i) => (
            <View key={i} className={cx("xxd-flowchart__branch", mods({ highlight: b.highlight }))} {...a11y({ role: "listitem" })}>
              <Text className="xxd-flowchart__label">{b.label}</Text>
              <View className="xxd-flowchart__path" {...a11y({ role: "list" })}>
                {b.steps.map((s, j) => (
                  <FlowStep key={j} step={s} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export interface FlowchartProps {
  steps: FlowchartStep[];
  className?: string;
}

export function Flowchart({ steps, className }: FlowchartProps) {
  const count = steps.reduce((n, s) => n + 1 + (s.branches ?? []).reduce((m, b) => m + b.steps.length, 0), 0);
  if (count > 9) warnOnce("flowchart-nodes", "Flowchart 超过 9 个节点：拆成总览加细节（DIAGRAM-PLAN D145）");
  if (steps.some((s) => (s.branches?.length ?? 0) > 3)) warnOnce("flowchart-branches", "Flowchart 一个判断最多 3 条分支（D145）");
  if (steps.some((s, i) => s.branches && !s.merge && i < steps.length - 1)) warnOnce("flowchart-dangling", "Flowchart 分支不合拢（merge）时主线到这里为止，后面的步骤接不上");
  return (
    <View className={cx("xxd-flowchart", className)} {...a11y({ role: "list" })}>
      {steps.map((s, i) => (
        <FlowStep key={i} step={s} />
      ))}
    </View>
  );
}
