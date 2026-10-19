// XxdProvider：放在 app.tsx，管外观设置（读写存储、跟随系统）、语言、轻提示。
// 小程序里 App 的 children 就是各个页面，所以所有页面共用这一份：在设置页改了主色，别的页面也跟着变。
import { eventCenter } from "@tarojs/taro";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { XxdSettings } from "@xxd/tokens";
import { DEFAULT_SETTINGS, DEFAULT_STORAGE_KEY, readSettings, resolveAppearance, systemTheme, watchSystemTheme, writeSettings, type Resolved, type Theme } from "./appearance";
import { LABELS, type Labels, type Lang } from "./labels";
import "./aria";

export interface ToastOptions {
  tone?: "success" | "danger" | "warning" | "info";
  /** 毫秒，缺省 2400；有操作按钮时 5000 */
  duration?: number;
  action?: { label: string; onClick: () => void };
}
export interface ToastItem extends ToastOptions {
  id: number;
  message: string;
  leaving?: boolean;
}

export interface XxdContext extends Resolved {
  lang: Lang;
  t: Labels;
  system: Theme;
  update: (patch: XxdSettings) => void;
  toast: (message: string, options?: ToastOptions) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<XxdContext | null>(null);
// 轻提示的列表单独一个 context：弹一条提示，只有显示提示的地方重画，用外观的组件不跟着重画
const ToastCtx = createContext<ToastItem[]>([]);

export interface XxdProviderProps {
  children?: ReactNode;
  lang?: Lang;
  /** 存储键名，缺省和网页版一样是 xxd-ui */
  storageKey?: string;
  /** 产品锁定某一项，用户设置盖不过它，比如 { corners: "square" } */
  lock?: XxdSettings;
  /** 第一次打开、还没存过设置时用 */
  initial?: XxdSettings;
  /** 读写存储，缺省是。嵌在别处展示时写 false：外观完全由 initial 和 update 决定，不留在本机 */
  persist?: boolean;
}

let toastId = 0;

/** 小程序的缺省外观：和网页版一样，只是主题跟随系统 */
export const MINI_DEFAULTS: XxdSettings = { ...DEFAULT_SETTINGS, theme: "system" };

export function XxdProvider({ children, lang = "zh", storageKey = DEFAULT_STORAGE_KEY, lock, initial, persist = true }: XxdProviderProps) {
  // 同步读存储：第一次渲染就是用户选的外观，不会先画缺省的再变
  // 小程序开了 darkmode：缺省跟随系统（网页版缺省是亮）
  const [settings, setSettings] = useState<XxdSettings>(() => ({ ...MINI_DEFAULTS, ...initial, ...(persist ? readSettings(storageKey) : {}) }));
  const [system, setSystem] = useState<Theme>(systemTheme);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => watchSystemTheme(setSystem), []);
  // 自定义标签栏（TabBarHost）不在这棵树下面：设置改了发个事件告诉它
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    eventCenter?.trigger?.("xxd:settings", settings);
  }, [settings]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const update = useCallback(
    (patch: XxdSettings) =>
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (persist) writeSettings(next, storageKey);
        return next;
      }),
    [storageKey, persist],
  );

  const dismissToast = useCallback((id: number) => {
    // 手动关的：自动关的定时器也清掉
    const auto = timers.current.get(id);
    if (auto) clearTimeout(auto);
    timers.current.delete(id);
    if (timers.current.has(-id)) return;
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    const later = setTimeout(() => {
      timers.current.delete(-id);
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 160);
    timers.current.set(-id, later);
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = (toastId += 1);
      // 最多同时三条：多了把最早的收掉
      setToasts((list) => [...list.filter((t) => !t.leaving).slice(-2), { id, message, ...options }]);
      const duration = options.duration ?? (options.action ? 5000 : 2400);
      timers.current.set(id, setTimeout(() => dismissToast(id), duration));
    },
    [dismissToast],
  );

  const lockKey = JSON.stringify(lock ?? {});
  const value = useMemo<XxdContext>(() => {
    const resolved = resolveAppearance(settings, system, lock);
    return { ...resolved, lang, t: LABELS[lang], system, update, toast, dismissToast };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, system, lockKey, lang, update, toast, dismissToast]);

  return (
    <Ctx.Provider value={value}>
      <ToastCtx.Provider value={toasts}>{children}</ToastCtx.Provider>
    </Ctx.Provider>
  );
}

const fallbackCache: { value?: XxdContext } = {};
/** 当前外观、语言和轻提示。没包 XxdProvider 时用缺省外观（不报错，组件照样能画出来） */
export function useXxd(): XxdContext {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  return (fallbackCache.value ??= {
    ...resolveAppearance(MINI_DEFAULTS, "light"),
    lang: "zh",
    t: LABELS.zh,
    system: "light",
    update: () => console.warn("[@xxd/mini] 改外观要先在 app.tsx 里包一层 <XxdProvider>"),
    toast: (message: string) => console.warn(`[@xxd/mini] 轻提示要先在 app.tsx 里包一层 <XxdProvider>：${message}`),
    dismissToast: () => {},
  });
}

/** 现在要显示的轻提示（ToastRegion 用） */
export function useToasts(): ToastItem[] {
  return useContext(ToastCtx);
}

/** 弹轻提示：const toast = useToast(); toast("已保存", { tone: "success" }) */
export function useToast() {
  return useXxd().toast;
}
