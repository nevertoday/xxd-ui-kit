// 底部标签栏：图标 + 字，选中的用墨色。留出底部安全区。
// 推荐的用法（MINI-REVIEW-PLAN D26）：app.json 的 tabBar 开 custom，src/custom-tab-bar/index.tsx 里放 <TabBarHost items={TABS} />，
// 每个标签页写 <XxdPage tabBar={TABS}>。切页是 switchTab：页面不销毁，滚动位置和输入的内容都在。
// （H5 版 Taro 不画自定义标签栏，XxdPage 在 H5 里自己画一个，两边写法一样。）
import { View, Text } from "@tarojs/components";
// 按名字导入 API：Taro 编 H5 时只改写它自己处理过的源码里的 Taro.xxx，组件库在 node_modules 里，默认导出上没有这些 API
import { eventCenter, getCurrentPages, redirectTo, switchTab } from "@tarojs/taro";
import { useEffect, useState, type ReactNode } from "react";
import "../styles/tabbar.mini.css";
import "../styles/badge.mini.css";
import { a11y } from "./aria";
import { readSettings, resolveAppearance, systemTheme, watchSystemTheme } from "./appearance";
import { Icon, type IconNode } from "./icon";
import { cx, mods } from "./util";

export interface TabBarItem {
  value: string;
  label: ReactNode;
  icon?: IconNode;
  /** 角标数字；0 不显示；true 显示一个点 */
  badge?: number | boolean;
  /** 点了切到这一页（switchTab）；不写就只回调 onValueChange */
  url?: string;
}

export interface TabBarProps {
  items: TabBarItem[];
  value: string;
  onValueChange?: (value: string) => void;
  /** 固定在屏幕底部，缺省是 */
  fixed?: boolean;
  className?: string;
}

export function TabBar({ items, value, onValueChange, fixed = true, className }: TabBarProps) {
  return (
    <View className={cx("xxd-tabbar", mods({ fixed }), className)} {...a11y({ role: "tablist" })}>
      {items.map((item) => {
        const on = item.value === value;
        return (
          <View
            key={item.value}
            className={cx("xxd-tabbar__item", mods({ selected: on }))}
            hoverClass="is-hover"
            onClick={() => {
              if (on) return;
              onValueChange?.(item.value);
              if (item.url) switchTab({ url: item.url }).catch(() => redirectTo({ url: item.url! }));
            }}
            {...a11y({ role: "tab", selected: on })}
          >
            <View className="xxd-tabbar__icon">
              {item.icon && <Icon icon={item.icon} size={22} />}
              {item.badge ? <Text className={cx("xxd-badge", "xxd-tabbar__badge", "is-variant-solid", "is-tone-danger", item.badge === true && "is-dot")}>{item.badge === true ? "" : item.badge > 99 ? "99+" : item.badge}</Text> : null}
            </View>
            <Text className="xxd-tabbar__label">{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** 现在这一页的路径（"/pages/index/index"） */
export function currentRoute(): string {
  try {
    const pages = getCurrentPages();
    const route = (pages[pages.length - 1] as { route?: string } | undefined)?.route ?? "";
    return `/${route.replace(/^\//, "")}`;
  } catch {
    return "";
  }
}

/** 按路径找选中的那一项 */
export function tabValueFor(items: TabBarItem[], route = currentRoute()): string | undefined {
  return items.find((i) => i.url && route === i.url.split("?")[0])?.value;
}

/** 外观设置改了的时候 XxdProvider 发这个事件：自定义标签栏不在 App 下面，拿不到 XxdProvider */
export const SETTINGS_EVENT = "xxd:settings";

/**
 * 放在 src/custom-tab-bar/index.tsx 里：小程序自带的自定义标签栏。
 * 它是一棵单独的组件树（不在 XxdProvider 下面），所以自己读外观设置、跟着系统亮暗和设置页的修改变。
 * 微信里每个标签页各有一个它的实例，选中哪一项按所在的页面定。
 */
export function TabBarHost({ items, storageKey, className }: { items: TabBarItem[]; storageKey?: string; className?: string }) {
  const [settings, setSettings] = useState(() => readSettings(storageKey));
  const [system, setSystem] = useState(systemTheme);
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => watchSystemTheme(setSystem), []);
  useEffect(() => {
    const onSettings = (next: Record<string, unknown>) => setSettings(next);
    const onRoute = () => setRoute(currentRoute());
    eventCenter?.on?.(SETTINGS_EVENT, onSettings);
    eventCenter?.on?.("__taroRouterChange", onRoute);
    return () => {
      eventCenter?.off?.(SETTINGS_EVENT, onSettings);
      eventCenter?.off?.("__taroRouterChange", onRoute);
    };
  }, []);
  const look = resolveAppearance({ theme: "system", ...settings }, system);
  return (
    <View className={cx("xxd-tabbar-host", look.className, className)} style={look.style}>
      <TabBar items={items} value={tabValueFor(items, route) ?? items[0]?.value} fixed={false} />
    </View>
  );
}
