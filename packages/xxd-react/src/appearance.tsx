import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ACCENT_PRESETS,
  DEFAULT_SETTINGS,
  DEFAULT_STORAGE_KEY,
  applySettings,
  readSettings,
  rememberSettings,
  watchSystemTheme,
  type XxdSettings,
} from "@xxd/tokens";

type Ctx = { settings: Required<XxdSettings>; update: (patch: XxdSettings) => void; presets: typeof ACCENT_PRESETS };
const AppearanceContext = createContext<Ctx | null>(null);

/**
 * 外观（主题 / 圆角 / 主色 / 密度）。首帧仍建议在 <head> 里放 @xxd/tokens/dist/boot.js 防闪；
 * 这个 Provider 负责 React 里的读写与同步。lock 用于产品锁定某项（会员站 { corners: "square" }）。
 */
// 服务端没有 useLayoutEffect（会警告）；浏览器里用它，读存储发生在第一次绘制之前，不闪
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const NO_LOCK: XxdSettings = {};

export function XxdAppearanceProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
  lock = NO_LOCK,
  initial,
}: {
  children: ReactNode;
  storageKey?: string;
  lock?: XxdSettings;
  initial?: XxdSettings;
}) {
  // 第一次渲染服务端和浏览器一样（缺省 + initial），水合不会对不上；挂载后再读存储
  const [state, setState] = useState<{ settings: Required<XxdSettings>; loaded: boolean }>(() => ({
    settings: { ...DEFAULT_SETTINGS, ...initial },
    loaded: false,
  }));
  const { settings, loaded } = state;

  // 存进去的只有用户自己选过的（DEFAULT_SETTINGS 和 initial 是这个页面的缺省，不写进共享的设置：
  // 以前改一项就把整份缺省存进去，用同一个 storageKey 的另一个页面从此跟着这个页面的缺省走）
  const base = useRef<Required<XxdSettings>>(state.settings);
  base.current = { ...DEFAULT_SETTINGS, ...initial } as Required<XxdSettings>;
  const fromStorage = useCallback(() => ({ settings: { ...base.current, ...readSettings(storageKey) } as Required<XxdSettings>, loaded: true }), [storageKey]);

  // 换了 storageKey：从这个 key 重新读，不带上一个 key 的值
  useIsoLayoutEffect(() => setState(fromStorage()), [fromStorage]);

  // 别的标签页改了同一个 key：跟着变
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === storageKey && setState(fromStorage());
    globalThis.addEventListener?.("storage", onStorage);
    return () => globalThis.removeEventListener?.("storage", onStorage);
  }, [storageKey, fromStorage]);

  // lock 常常写成字面量（lock={{ corners: "square" }}）：按内容比较，不是每次渲染都重新套一遍
  const lockKey = JSON.stringify(lock);
  const stableLock = useMemo(() => lock, [lockKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loaded) return; // 还没读存储：页面上是 boot.js 按存储套好的外观，别用缺省值盖掉
    applySettings(settings, { lock: stableLock });
    return watchSystemTheme(() => settings, { lock: stableLock });
  }, [settings, stableLock, loaded]);

  const update = useCallback(
    (patch: XxdSettings) => {
      rememberSettings(patch, storageKey);
      setState(fromStorage());
    },
    [storageKey, fromStorage],
  );

  const value = useMemo(() => ({ settings, update, presets: ACCENT_PRESETS }), [settings, update]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useXxdAppearance(): Ctx {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useXxdAppearance 需要放在 <XxdAppearanceProvider> 里");
  return ctx;
}
