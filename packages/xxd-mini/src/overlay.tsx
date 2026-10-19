// 浮层的公共部分：开关动画（关的时候先播完再卸载）、挂到页面最外层（root-portal）、手机返回键先关浮层。
import { PageContainer, RootPortal, View } from "@tarojs/components";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useXxd } from "./provider";
import { cx, IS_H5 } from "./util";

/** open 变 false 以后再留 ms 毫秒（播收起动画）。返回 [还挂着, 已经展开] */
export function usePresence(open: boolean, ms = 200): [boolean, boolean] {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // 先挂上（收起的样子），下一帧再展开，过渡才有起点
      const t = setTimeout(() => setShown(true), 20);
      return () => clearTimeout(t);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  return [mounted, shown];
}

/* ── 浮层栈：一页一个 ──
 * 微信的 page-container 一页最多一个（再加一个不生效），所以面板里再开对话框时，不能每个浮层各放一个。
 * XxdPage 放一个栈：打开的浮层按顺序进栈，返回键 / 右滑关最上面那层；栈不空时，页面其余部分对读屏隐藏。 */
interface Layer {
  id: number;
  close: () => void;
}
interface LayerApi {
  push: (layer: Layer) => void;
  remove: (id: number) => void;
}
const LayerCtx = createContext<LayerApi | null>(null);
export const LayerProvider = LayerCtx.Provider;

let layerId = 0;

/** XxdPage 用：浮层栈的状态、给浮层的接口、拦返回键的那个节点 */
export function useLayerStack(): { open: boolean; api: LayerApi; guard: ReactNode } {
  const [layers, setLayers] = useState<Layer[]>([]);
  const latest = useRef(layers);
  latest.current = layers;
  const api = useMemo<LayerApi>(
    () => ({
      push: (layer) => setLayers((list) => [...list.filter((l) => l.id !== layer.id), layer]),
      remove: (id) => setLayers((list) => list.filter((l) => l.id !== id)),
    }),
    [],
  );
  const back = useCallback(() => latest.current[latest.current.length - 1]?.close(), []);
  // 返回一次，page-container 就退场了；栈里还有浮层时换一个新的再拦下一次
  const [round, setRound] = useState(0);
  const open = layers.length > 0;
  const guard = IS_H5 ? (
    <H5BackGuard open={open} onBack={back} />
  ) : (
    <PageContainer
      key={round}
      show={open}
      duration={0}
      overlay={false}
      position="center"
      customStyle="width:0;height:0;background:transparent;overflow:hidden"
      onBeforeLeave={() => {
        back();
        setRound((r) => r + 1);
      }}
    />
  );
  return { open, api, guard };
}

/** H5：浮层打开时往历史里压一条，浏览器的返回键先关浮层 */
function H5BackGuard({ open, onBack }: { open: boolean; onBack: () => void }) {
  const pushed = useRef(false);
  const backRef = useRef(onBack);
  backRef.current = onBack;
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      backRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (open && !pushed.current) {
      window.history.pushState({ ...(window.history.state ?? {}), xxdLayer: true }, "", window.location.href);
      pushed.current = true;
    } else if (!open && pushed.current) {
      // 浮层是点按钮关的：把压进去的那条退掉，不然要多按一次返回
      pushed.current = false;
      window.history.back();
    }
  }, [open]);
  return null;
}

/**
 * 浮层组件用：打开时进栈，关了出栈。返回 true 表示有 XxdPage 的栈在管返回键；
 * 没包在 XxdPage 里时返回 false，浮层自己放一个 BackGuard（只能管一个）。
 */
export function useLayer(open: boolean, close: () => void): boolean {
  const api = useContext(LayerCtx);
  const [id] = useState(() => (layerId += 1));
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!api || !open) return;
    api.push({ id, close: () => closeRef.current() });
    return () => api.remove(id);
  }, [api, open, id]);
  return api != null;
}

/**
 * 单个浮层拦返回键（没有 XxdPage 的栈时的后备）。
 * 微信里借 page-container（基础库 2.16 起）：它本身不画任何东西，只拦返回。
 */
export function BackGuard({ open, onBack }: { open: boolean; onBack: () => void }) {
  if (IS_H5) return null;
  return (
    <PageContainer
      show={open}
      duration={0}
      overlay={false}
      position="center"
      customStyle="width:0;height:0;background:transparent;overflow:hidden"
      onBeforeLeave={() => onBack()}
    />
  );
}

/** 浮层的根：root-portal 把浮层挪到页面最外层，继承不到 XxdPage 上的变量和类名，这里再写一遍 */
export function useOverlayRoot() {
  const x = useXxd();
  return { className: cx("xxd-overlay", x.className), style: x.style };
}

/** 挂到页面最外层，并带上外观变量（root-portal 里继承不到 XxdPage 上的） */
export function Portal({ children, className }: { children?: ReactNode; className?: string }) {
  const root = useOverlayRoot();
  const body = (
    <View className={`${root.className}${className ? ` ${className}` : ""}`} style={root.style}>
      {children}
    </View>
  );
  // H5 没有 root-portal（浮层本来就是 fixed 定位，直接放在原地就行）
  return IS_H5 ? body : <RootPortal>{body}</RootPortal>;
}
