// 小程序自带的自定义标签栏（app.config 的 tabBar.custom）：切页是 switchTab，页面不销毁（MINI-REVIEW-PLAN D26）。
// 它不在 App 下面，拿不到 XxdProvider 和语言：外观由 TabBarHost 自己读，语言从存储里读。
import { TabBarHost } from "@xxd/mini";
import "@xxd/mini/tokens.css";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { LANG_EVENT, readLang } from "../i18n";
import { MAIN_TABS } from "../tabs";

export default function CustomTabBar() {
  const [lang, setLang] = useState(readLang);
  useEffect(() => {
    Taro.eventCenter.on(LANG_EVENT, setLang);
    return () => Taro.eventCenter.off(LANG_EVENT, setLang);
  }, []);
  return <TabBarHost items={MAIN_TABS((zh, en) => (lang === "en" ? en : zh))} />;
}
