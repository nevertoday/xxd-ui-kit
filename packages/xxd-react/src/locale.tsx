import { createContext, useContext, useMemo, type ReactNode } from "react";
import { KumoLocaleProvider, type KumoTranslationsPartial } from "@cloudflare/kumo";
import { APPEARANCE_LABELS } from "@xxd/css/labels";

export type XxdLocale = "zh-CN" | "zh-Hant" | "en";

/** 小小东组件自己的文案（Kumo 组件的文案走 KumoLocaleProvider）。 */
export interface XxdStrings {
  clear: string;
  close: string;
  confirm: string;
  cancel: string;
  confirmDelete: string;
  search: string;
  appearance: string;
  theme: string;
  light: string;
  dark: string;
  system: string;
  corners: string;
  cornersDesc: string;
  accent: string;
  density: string;
  comfortable: string;
  compact: string;
  finish: string;
  flat: string;
  material: string;
  dropVeil: string;
  mainNav: string;
  /** 步骤条的 aria-label：「第 {n} 步，共 {total} 步」 */
  stepOf: string;
  /** 做完的步在标题后面加的一句（读屏） */
  stepDone: string;
  /** 做完、能点回去的步 */
  stepBack: string;
  /** 循环最后一步后面给读屏的一句 */
  cycleBack: string;
}

// 外观设置的叫法和原生版共用一份（@xxd/css/labels），两边不会各说各的
const appearance = (locale: XxdLocale) => {
  const L = APPEARANCE_LABELS[locale];
  return {
    appearance: L.group, theme: L.theme, light: L.light, dark: L.dark, system: L.system, corners: L.corners, cornersDesc: L.cornersDesc,
    accent: L.accent, density: L.density, comfortable: L.comfortable, compact: L.compact, finish: L.finish, flat: L.flat, material: L.material,
  };
};

const XXD: Record<XxdLocale, XxdStrings> = {
  "zh-CN": {
    clear: "清空", close: "关闭", confirm: "确定", cancel: "取消", confirmDelete: "确认删除", search: "搜索",
    ...appearance("zh-CN"),
    dropVeil: "松手，放进来", mainNav: "主导航",
    stepOf: "第 {n} 步，共 {total} 步", stepDone: "（已完成）", stepBack: "（已完成，回到这一步）", cycleBack: "（然后回到第 1 步）",
  },
  "zh-Hant": {
    clear: "清除", close: "關閉", confirm: "確定", cancel: "取消", confirmDelete: "確認刪除", search: "搜尋",
    ...appearance("zh-Hant"),
    dropVeil: "放開，放進來", mainNav: "主導覽",
    stepOf: "第 {n} 步，共 {total} 步", stepDone: "（已完成）", stepBack: "（已完成，回到這一步）", cycleBack: "（然後回到第 1 步）",
  },
  en: {
    clear: "Clear", close: "Close", confirm: "OK", cancel: "Cancel", confirmDelete: "Confirm delete", search: "Search",
    ...appearance("en"),
    dropVeil: "Drop to add", mainNav: "Main navigation",
    stepOf: "Step {n} of {total}", stepDone: " (done)", stepBack: " (done, go back)", cycleBack: " (then back to step 1)",
  },
};

/** Kumo 内置文案的中文 / 繁体（英文用 Kumo 自己的默认值）。 */
export const KUMO_TRANSLATIONS: Record<Exclude<XxdLocale, "en">, KumoTranslationsPartial> = {
  "zh-CN": {
    label: { optional: "（可选）", tooltip: "更多说明" },
    layerDialog: { close: "关闭", cancel: "取消", moreActions: "更多操作" },
    common: {
      copy: "复制", copied: "已复制", copyToClipboard: "复制到剪贴板", copiedToClipboard: "已复制到剪贴板", clickToCopy: "点击复制", copyCommand: "复制命令",
      close: "关闭", loading: "加载中", loadingChart: "图表加载中", noResults: "没有找到", clearSelection: "清空选择", showOptions: "显示选项", remove: "移除",
      breadcrumb: "面包屑", resizeColumn: "调整列宽", hideValue: "隐藏", revealValue: "显示", valueHidden: "已隐藏", previousMonth: "上个月", nextMonth: "下个月", editMonthYear: "选择年月",
    },
    pagination: { navigation: "分页", firstPage: "第一页", previousPage: "上一页", nextPage: "下一页", lastPage: "最后一页", pageNumber: "页码", pageSize: "每页条数" },
  },
  "zh-Hant": {
    label: { optional: "（選填）", tooltip: "更多說明" },
    layerDialog: { close: "關閉", cancel: "取消", moreActions: "更多操作" },
    common: {
      copy: "複製", copied: "已複製", copyToClipboard: "複製到剪貼簿", copiedToClipboard: "已複製到剪貼簿", clickToCopy: "點擊複製", copyCommand: "複製指令",
      close: "關閉", loading: "載入中", loadingChart: "圖表載入中", noResults: "沒有找到", clearSelection: "清除選擇", showOptions: "顯示選項", remove: "移除",
      breadcrumb: "麵包屑", resizeColumn: "調整欄寬", hideValue: "隱藏", revealValue: "顯示", valueHidden: "已隱藏", previousMonth: "上個月", nextMonth: "下個月", editMonthYear: "選擇年月",
    },
    pagination: { navigation: "分頁", firstPage: "第一頁", previousPage: "上一頁", nextPage: "下一頁", lastPage: "最後一頁", pageNumber: "頁碼", pageSize: "每頁筆數" },
  },
};

const LocaleContext = createContext<{ locale: XxdLocale; t: XxdStrings }>({ locale: "zh-CN", t: XXD["zh-CN"] });

/** 把浏览器 / 插件给的语言代码归到三种之一（zh-TW / zh-HK → 繁体，其他 zh → 简体，其余 → 英文）。 */
export function resolveLocale(input?: string | null): XxdLocale {
  const v = String(input ?? "").toLowerCase();
  if (/^zh[-_](tw|hk|mo|hant)/.test(v)) return "zh-Hant";
  if (v.startsWith("zh")) return "zh-CN";
  return v ? "en" : "zh-CN";
}

/**
 * 三种语言：小小东组件 + Kumo 组件内置文案一起切换。
 *   <XxdLocaleProvider locale="zh-CN">…</XxdLocaleProvider>
 * overrides 可以覆盖个别 Kumo 文案。
 */
export function XxdLocaleProvider({ locale = "zh-CN", overrides, children }: { locale?: string; overrides?: KumoTranslationsPartial; children: ReactNode }) {
  const resolved = resolveLocale(locale);
  const value = useMemo(() => ({ locale: resolved, t: XXD[resolved] }), [resolved]);
  const kumo = useMemo<KumoTranslationsPartial>(() => {
    const base = resolved === "en" ? {} : KUMO_TRANSLATIONS[resolved];
    if (!overrides) return base;
    const merged: Record<string, object> = { ...base };
    for (const [k, v] of Object.entries(overrides)) merged[k] = { ...(merged[k] ?? {}), ...v };
    return merged as KumoTranslationsPartial;
  }, [resolved, overrides]);
  return (
    <LocaleContext.Provider value={value}>
      <KumoLocaleProvider translations={kumo}>{children}</KumoLocaleProvider>
    </LocaleContext.Provider>
  );
}

export function useXxdLocale() {
  return useContext(LocaleContext);
}
