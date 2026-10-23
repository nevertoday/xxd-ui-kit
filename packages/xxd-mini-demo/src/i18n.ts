// 演示小程序的中英文：设置页切换，存在本机
import Taro from "@tarojs/taro";
import { createContext, useContext } from "react";
import type { Lang } from "@xxd/mini";

const KEY = "xxd-mini-demo-lang";
export function readLang(): Lang {
  try {
    const v = Taro.getStorageSync(KEY);
    if (v === "en" || v === "zh") return v;
  } catch {
    /* 没存过 */
  }
  // H5 嵌在展示站里时，地址上带 lang=en
  if (process.env.TARO_ENV === "h5" && /[?&#]lang=en\b/.test(globalThis.location?.href ?? "")) return "en";
  return "zh";
}
/** 换语言时发的事件：自带的自定义标签栏不在 App 下面，靠它知道 */
export const LANG_EVENT = "xxd-demo:lang";
export function saveLang(lang: Lang) {
  try {
    Taro.setStorageSync(KEY, lang);
  } catch {
    /* 存不了就只这一次 */
  }
  Taro.eventCenter?.trigger?.(LANG_EVENT, lang);
}

export const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "zh", setLang: () => {} });
/** tr("中文", "English") */
export function useTr() {
  const { lang } = useContext(LangCtx);
  return (zh: string, en: string) => (lang === "en" ? en : zh);
}
