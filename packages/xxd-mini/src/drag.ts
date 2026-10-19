// 跟手的拖动（左滑出操作、下拖关面板）：还是走 React，但每 16ms 最多更新一次位置，松手时再定终点。
// 微信版每次 setState 都要跨线程 setData，逐个 touchmove 都更新会跟不上手指（MINI-REVIEW-PLAN S1）。
// 不用 movable-area：它要写死高度，列表行的高度跟着内容走（D27 的实际做法）。
import { useRef, useState } from "react";

type Touch = { clientX: number; clientY: number };
type TouchLike = { touches?: Touch[]; changedTouches?: Touch[]; timeStamp?: number };
export const touchPoint = (e: unknown) => {
  const t = e as TouchLike;
  return (t.touches?.[0] ?? t.changedTouches?.[0]) as Touch | undefined;
};

export interface DragOptions {
  /** 哪个方向的拖动算数；另一个方向的（比如滚页面）不管 */
  axis: "x" | "y";
  /** 开始拖时的位置 */
  base: () => number;
  /** 把位置限制在范围里 */
  clamp: (v: number) => number;
  /** 松手：最后的位置和速度（px/ms，正数是往右 / 往下） */
  onEnd: (pos: number, velocity: number) => void;
  disabled?: boolean;
}

/** 返回 [拖动中的位置（没在拖时是 null）, 绑到元素上的触摸事件] */
export function useDrag({ axis, base, clamp, onEnd, disabled }: DragOptions) {
  const [pos, setPos] = useState<number | null>(null);
  const s = useRef<{ x: number; y: number; base: number; dir: "x" | "y" | null; last: number; cur: number; samples: { t: number; p: number }[] } | null>(null);

  const onTouchStart = (e: unknown) => {
    if (disabled) return;
    const p = touchPoint(e);
    if (!p) return;
    const b = base();
    s.current = { x: p.clientX, y: p.clientY, base: b, dir: null, last: 0, cur: b, samples: [{ t: Date.now(), p: b }] };
  };
  const onTouchMove = (e: unknown) => {
    const st = s.current;
    const p = touchPoint(e);
    if (!st || !p) return;
    const dx = p.clientX - st.x;
    const dy = p.clientY - st.y;
    if (!st.dir) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      st.dir = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (st.dir !== axis) return;
    const next = clamp(st.base + (axis === "x" ? dx : dy));
    const now = Date.now();
    st.cur = next;
    st.samples.push({ t: now, p: next });
    if (st.samples.length > 12) st.samples.shift();
    // 每 16ms 最多一次，差不到 1px 不更新
    if (now - st.last >= 16 && Math.abs(next - (pos ?? st.base)) >= 1) {
      st.last = now;
      setPos(next);
    }
  };
  const onTouchEnd = () => {
    const st = s.current;
    s.current = null;
    setPos(null);
    if (!st || st.dir !== axis) return;
    // 速度按最近 100ms 算（甩一下就关 / 就开）
    const now = Date.now();
    const from = st.samples.find((x) => now - x.t <= 100) ?? st.samples[st.samples.length - 1];
    onEnd(st.cur, (st.cur - from.p) / Math.max(16, now - from.t));
  };
  /** 正在按这个方向拖：外层用它决定要不要拦住页面滚动 */
  const dragging = pos != null;
  return { pos, dragging, handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd } };
}
