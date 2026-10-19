// 自定义导航栏（页面配置里 navigationStyle: "custom" 时用）：给右上角的胶囊按钮让位，标题和胶囊垂直居中对齐（§5）。
// 用小程序自带的导航栏就不需要它：XxdPage 会让自带导航栏跟着亮暗换颜色。
import { View, Text } from "@tarojs/components";
// 按名字导入 API：Taro 编 H5 时只改写它自己处理过的源码里的 Taro.xxx，组件库在 node_modules 里，默认导出上没有这些 API
import { getCurrentPages, getMenuButtonBoundingClientRect, getSystemInfoSync, getWindowInfo, navigateBack, offWindowResize, onWindowResize, reLaunch } from "@tarojs/taro";
import { ChevronLeft } from "@xxd/icons/each";
import { useEffect, useState, type ReactNode } from "react";
import "../styles/navbar.mini.css";
import { a11y } from "./aria";
import { Button } from "./button";
import { useXxd } from "./provider";
import { cx, IS_H5 } from "./util";

interface Capsule {
  top: number;
  height: number;
  /** 胶囊左边到屏幕右边的距离：导航栏右边要留这么多 */
  right: number;
  statusBar: number;
}

/** 状态栏高度、胶囊按钮的位置（H5 里没有胶囊） */
export function capsuleRect(): Capsule {
  if (IS_H5) return { top: 6, height: 32, right: 16, statusBar: 0 };
  let statusBar = 20;
  let width = 375;
  try {
    const win = (getWindowInfo?.() ?? getSystemInfoSync()) as { statusBarHeight?: number; windowWidth?: number; screenWidth?: number };
    statusBar = win.statusBarHeight ?? 20;
    width = win.windowWidth ?? win.screenWidth ?? 375;
    const rect = getMenuButtonBoundingClientRect();
    // 电脑版微信、冷启动的头几毫秒可能读到全 0：这时按状态栏估一个（胶囊 32 高、上下各留 4px、宽 87）
    if (rect && rect.height > 0 && rect.top >= statusBar && rect.left > 0) {
      return { top: rect.top, height: rect.height, right: width - rect.left + 8, statusBar };
    }
  } catch {
    /* 用下面的估计值 */
  }
  return { top: statusBar + 4, height: 32, right: Math.min(104, Math.round(width * 0.28)), statusBar };
}

export interface NavBarProps {
  title?: ReactNode;
  /** 返回按钮：缺省在不是第一页时出现 */
  back?: boolean | (() => void);
  /** 标题左边的东西（返回按钮后面） */
  leading?: ReactNode;
  /** 胶囊左边的东西 */
  trailing?: ReactNode;
  /** 底下一条线，缺省有 */
  divider?: boolean;
  className?: string;
}

export function NavBar({ title, back, leading, trailing, divider = true, className }: NavBarProps) {
  const { t } = useXxd();
  const [rect, setRect] = useState(capsuleRect);
  // 横屏、iPad 分屏、电脑版微信拖窗口：重新量
  useEffect(() => {
    if (IS_H5) return;
    const fn = () => setRect(capsuleRect());
    try {
      onWindowResize?.(fn);
      return () => offWindowResize?.(fn);
    } catch {
      return undefined;
    }
  }, []);
  const canBack = back === undefined ? !IS_H5 && getCurrentPages().length > 1 : Boolean(back);
  const onBack = typeof back === "function" ? back : () => navigateBack().catch(() => reLaunch({ url: "/pages/index/index" }));
  // 导航栏这一条的高度：胶囊上下各留同样的空
  const barHeight = Math.max(rect.height + (rect.top - rect.statusBar) * 2, 40);
  return (
    <View className={cx("xxd-topbar", "xxd-navbar", divider && "is-divider", className)} style={`padding-top:${rect.statusBar}px;height:${rect.statusBar + barHeight}px;padding-right:${rect.right}px;--nav-side:${rect.right}px;--status-bar:${rect.statusBar}px`} {...a11y({ role: "navigation" })}>
      {canBack && <Button variant="ghost" icon={ChevronLeft} label={t.back} onClick={onBack} className="xxd-navbar__back" />}
      {leading}
      <Text className="xxd-topbar__title" {...a11y({ role: "heading", level: 1 })}>
        {title}
      </Text>
      {trailing != null && <View className="xxd-navbar__trailing">{trailing}</View>}
    </View>
  );
}
