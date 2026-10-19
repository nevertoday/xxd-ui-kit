// XxdPage：每一页的根。写外观变量和外观类名、留出底部安全区、放这一页的轻提示和浮层栈。
//   导航栏用小程序自带的：强制亮 / 暗时跟着换颜色（跟随系统时由 theme.json 管）。用自定义导航栏（NavBar）时设 customNav。
import { View } from "@tarojs/components";
// 按名字导入 API：Taro 编 H5 时只改写它自己处理过的源码里的 Taro.xxx，组件库在 node_modules 里，默认导出上没有这些 API
import { setBackgroundColor, setBackgroundTextStyle, setNavigationBarColor, useDidHide, useDidShow } from "@tarojs/taro";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "../styles/layout.mini.css";
import { a11y } from "./aria";
import { IconTableCtx, iconVars } from "./icon";
import { BottomBarCtx, BottomInsetCtx, LayerProvider, useLayerStack } from "./overlay";
import { useXxd } from "./provider";
import { TabBar, tabValueFor, type TabBarItem } from "./tabbar";
import { ToastRegion } from "./toast";
import { cx, IS_H5, nextId, styleText } from "./util";

export interface XxdPageProps {
  children?: ReactNode;
  className?: string;
  style?: string | Record<string, string | number>;
  /** 底部留出安全区（全面屏的横条）。页面底部有 TabBar 或固定按钮条时由它们自己留，这里设 false */
  safeArea?: boolean;
  /** 用了自定义导航栏（app.json 的 navigationStyle: custom）：不去改小程序自带导航栏的颜色 */
  customNav?: boolean;
  /** 页面底色：bg（缺省，网页版的页面底）或 paper（白纸，表单页常用） */
  surface?: "bg" | "paper";
  /**
   * 底部标签栏。传标签的列表（推荐）：微信里由自带的自定义标签栏（custom-tab-bar 里的 TabBarHost）来画，
   * 页面不用管；H5 里 Taro 不画自定义标签栏，这里画一个。传 true：页面里自己放了固定的 TabBar，这里只留出它的高度
   */
  tabBar?: boolean | TabBarItem[];
}

export function XxdPage({ children, className, style, safeArea = true, customNav = false, surface = "bg", tabBar = false }: XxdPageProps) {
  const tabItems = Array.isArray(tabBar) ? tabBar : null;
  // 页面自己要给标签栏留位置吗：传 true 时是；传列表时只有 H5 是（微信的自带标签栏不占页面的地方）
  const ownTabBar = tabBar === true || (tabItems != null && IS_H5);
  // 底部按钮条（BottomBar）登记上来
  const [bars, setBars] = useState(0);
  const barApi = useMemo(() => ({ add: () => setBars((n) => n + 1), remove: () => setBars((n) => n - 1) }), []);
  const x = useXxd();
  const bg = surface === "paper" ? x.vars["--paper"] : x.vars["--bg"];
  const layers = useLayerStack();
  const [id] = useState(() => nextId("page"));
  // 页面栈里被盖住的页面不画轻提示（每一页都有一个 ToastRegion，同一条提示只在看得见的那页出现）
  const [active, setActive] = useState(true);
  useDidShow(() => setActive(true));
  useDidHide(() => setActive(false));
  // 图标表：子组件渲染时登记，登记了新的就在 layout effect 里再画一次页面根（和第一次渲染一起发出去，不会先空一帧）
  const iconMap = useRef(new Map<string, string>());
  const [iconCount, setIconCount] = useState(0);
  const icons = useMemo(() => ({ map: iconMap.current, version: iconCount, sync: () => setIconCount(iconMap.current.size) }), [iconCount]);
  useLayoutEffect(() => {
    if (iconMap.current.size !== iconCount) setIconCount(iconMap.current.size);
  });

  // layout effect：和第一次渲染一起发出去，强制亮 / 暗时导航栏不先闪一下系统的颜色
  useLayoutEffect(() => {
    if (IS_H5) {
      // H5：整页的底色和滚动条颜色
      const html = document.documentElement;
      html.style.colorScheme = x.theme;
      document.body.style.background = bg;
      return;
    }
    // 窗口底色（下拉露出来的那块）、导航栏颜色跟着外观走
    setBackgroundColor?.({ backgroundColor: bg, backgroundColorTop: bg, backgroundColorBottom: bg })?.catch?.(() => {});
    setBackgroundTextStyle?.({ textStyle: x.theme === "dark" ? "light" : "dark" })?.catch?.(() => {});
    if (!customNav) setNavigationBarColor?.({ frontColor: x.theme === "dark" ? "#ffffff" : "#000000", backgroundColor: bg, animation: { duration: 0, timingFunc: "linear" } })?.catch?.(() => {});
  }, [x.theme, bg, customNav]);

  // H5 里浮层原地渲染（没有 root-portal）：浮层打开时，把一路上不含浮层的兄弟节点对读屏隐藏
  useEffect(() => {
    if (!IS_H5 || !layers.open || typeof document === "undefined") return;
    const hidden: Element[] = [];
    const t = setTimeout(() => {
      const root = document.getElementById(id);
      if (!root) return;
      const overlays = [...root.querySelectorAll(".xxd-overlay")];
      for (const overlay of overlays) {
        let node: Element | null = overlay;
        while (node && node !== root && node.parentElement) {
          for (const sib of node.parentElement.children) {
            if (sib === node || overlays.some((o) => sib.contains(o)) || sib.getAttribute("aria-hidden") === "true") continue;
            sib.setAttribute("aria-hidden", "true");
            hidden.push(sib);
          }
          node = node.parentElement;
        }
      }
    }, 0);
    return () => {
      clearTimeout(t);
      hidden.forEach((el) => el.removeAttribute("aria-hidden"));
    };
  }, [layers.open, id]);

  // 底部要留多少（MINI-REVIEW-PLAN U4）：标签栏 + 底部按钮条 + 安全区。页面底部的留白、轻提示、浮动按钮都用 --bottom-inset
  const safe = "env(safe-area-inset-bottom)";
  const hasBar = bars > 0;
  const inset = `calc(${ownTabBar ? "var(--tabbar-h) + " : ""}${hasBar ? "var(--bottombar-h) + " : ""}${safe})`;
  const insetVars = `--bottom-inset:${inset};--xxd-bar-bottom:${ownTabBar ? `calc(var(--tabbar-h) + ${safe})` : "0px"};--xxd-bar-safe:${ownTabBar ? "0px" : safe};`;
  const reserve = ownTabBar || hasBar;
  return (
    <View
      id={id}
      className={cx("xxd-page", x.className, surface === "paper" && "is-surface-paper", safeArea && !reserve && "is-safe-bottom", reserve && "is-has-bottom", className)}
      style={`${x.style};${insetVars}${iconVars(icons)}${styleText(style)}`}
      {...a11y({ role: "main" })}
    >
      <IconTableCtx.Provider value={icons}>
      <BottomInsetCtx.Provider value={insetVars}>
      <BottomBarCtx.Provider value={barApi}>
      <LayerProvider value={layers.api}>
        {/* 微信里浮层在 root-portal 里，不在这一层下面：浮层打开时这一层对读屏隐藏 */}
        <View className="xxd-page__body" {...(IS_H5 ? {} : a11y({ hidden: layers.open }))}>
          {children}
        </View>
        {layers.guard}
      </LayerProvider>
      </BottomBarCtx.Provider>
      {tabItems && IS_H5 && <TabBar items={tabItems} value={tabValueFor(tabItems) ?? tabItems[0]?.value} />}
      <ToastRegion active={active} />
      </BottomInsetCtx.Provider>
      </IconTableCtx.Provider>
    </View>
  );
}

export { useOverlayRoot } from "./overlay";
