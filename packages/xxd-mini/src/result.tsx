// 结果页：提交成功、付款失败、审核中。一个带意义的图标、一句标题、一段说明、下一步做什么。MINI-REVIEW-PLAN D31
//   <Result tone="success" title="提交成功" description="我们会在 1 个工作日内回复" actions={<Button variant="primary" block>返回首页</Button>} />
import { View, Text } from "@tarojs/components";
import { CircleCheck, CircleX, Clock, Info } from "@xxd/icons/each";
import type { ReactNode } from "react";
import "../styles/result.mini.css";
import { a11y } from "./aria";
import { Icon, type IconNode } from "./icon";
import { cx, mods } from "./util";

const TONE_ICON: Record<string, IconNode> = { success: CircleCheck, danger: CircleX, warning: Clock, info: Info };

export interface ResultProps {
  tone?: "success" | "danger" | "warning" | "info";
  /** 不用缺省的图标 */
  icon?: IconNode;
  title: ReactNode;
  description?: ReactNode;
  /** 下一步：按钮竖排、占满一行，主操作放第一个 */
  actions?: ReactNode;
  /** 说明下面放的东西（订单号、金额） */
  children?: ReactNode;
  className?: string;
}

export function Result({ tone = "info", icon, title, description, actions, children, className }: ResultProps) {
  return (
    <View className={cx("xxd-result", mods({ tone }), className)} {...a11y({ role: tone === "danger" ? "alert" : "status" })}>
      <Icon icon={icon ?? TONE_ICON[tone]} size={48} className="xxd-result__icon" />
      <Text className="xxd-result__title" {...a11y({ role: "heading", level: 1 })}>
        {title}
      </Text>
      {description != null && <Text className="xxd-result__desc">{description}</Text>}
      {children != null && <View className="xxd-result__extra">{children}</View>}
      {actions != null && <View className="xxd-result__actions">{actions}</View>}
    </View>
  );
}
