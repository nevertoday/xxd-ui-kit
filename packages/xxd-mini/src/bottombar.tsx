// 底部按钮条：固定在屏幕底部的一排按钮（提交订单、保存、新建）。MINI-REVIEW-PLAN U4、D31
//   <BottomBar><Button variant="primary" block>保存</Button></BottomBar>
// 自动留底部安全区、自动给页面底部留出位置；页面有标签栏时摞在标签栏上面；轻提示会浮在它上面，不盖住按钮。
import { View } from "@tarojs/components";
import { useContext, useEffect, type ReactNode } from "react";
import "../styles/bottombar.mini.css";
import { BottomBarCtx } from "./overlay";
import { cx } from "./util";

export interface BottomBarProps {
  children?: ReactNode;
  /** 按钮条上方的一行说明（合计金额、已选几件） */
  note?: ReactNode;
  className?: string;
}

export function BottomBar({ children, note, className }: BottomBarProps) {
  const page = useContext(BottomBarCtx);
  useEffect(() => {
    if (!page) return;
    page.add();
    return () => page.remove();
  }, [page]);
  return (
    <View className={cx("xxd-bottombar", className)}>
      {note != null && <View className="xxd-bottombar__note">{note}</View>}
      <View className="xxd-bottombar__actions">{children}</View>
    </View>
  );
}
