// 左滑出操作（删除、置顶）：列表行常用。滑过一半松手就停在打开的位置，点这一行或者点操作就收回。
// 只动 transform（动效规则）；竖着滑（滚页面）不会误打开。同一个 SwipeGroup 里一次只开一行。
// 用读屏的人滑不了：每行多一个只给读屏的「更多操作」按钮，点了把操作亮出来。
import { View, Text } from "@tarojs/components";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import "../styles/swipe.mini.css";
import "../styles/layout.mini.css";
import { a11y } from "./aria";
import { useDrag } from "./drag";
import { useXxd } from "./provider";
import { cx, mods, nextId } from "./util";

export interface SwipeAction {
  label: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export interface SwipeProps {
  children?: ReactNode;
  actions: SwipeAction[];
  /** 每个操作按钮的宽，缺省 72px */
  actionWidth?: number;
  disabled?: boolean;
  className?: string;
}

// 同一组里现在开着的是哪一行
const GroupCtx = createContext<{ openId: string | null; setOpenId: (id: string | null) => void } | null>(null);

/** 一组可以左滑的行：一行打开时，别的行收回 */
export function SwipeGroup({ children }: { children?: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <GroupCtx.Provider value={{ openId, setOpenId }}>{children}</GroupCtx.Provider>;
}

export function Swipe({ children, actions, actionWidth = 72, disabled, className }: SwipeProps) {
  const { t } = useXxd();
  const width = actions.length * actionWidth;
  const group = useContext(GroupCtx);
  const [id] = useState(() => nextId("swipe"));
  const [open, setOpenState] = useState(false);
  const setOpen = (v: boolean) => {
    setOpenState(v);
    if (group) group.setOpenId(v ? id : group.openId === id ? null : group.openId);
  };
  // 别的行打开了：这一行收回
  useEffect(() => {
    if (group && group.openId !== id && open) setOpenState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.openId]);

  const drag = useDrag({
    axis: "x",
    base: () => (open ? -width : 0),
    clamp: (v) => Math.max(-width, Math.min(0, v)),
    disabled,
    onEnd: (x, v) => setOpen(x < -width / 2 || v < -0.6),
  });
  const x = drag.pos ?? (open ? -width : 0);
  const shown = x !== 0;
  const close = () => setOpen(false);

  return (
    <View className={cx("xxd-swipe", mods({ open: shown }), className)}>
      <View className="xxd-swipe__actions" style={`width:${width}px`} {...a11y({ hidden: !open })}>
        {actions.map((a, i) => (
          <View
            key={i}
            className={cx("xxd-swipe__action", mods({ tone: a.danger ? "danger" : undefined }))}
            style={`width:${actionWidth}px`}
            hoverClass="is-hover"
            onClick={() => {
              close();
              a.onClick();
            }}
            {...a11y({ role: "button" })}
          >
            <Text>{a.label}</Text>
          </View>
        ))}
      </View>
      <View
        className={cx("xxd-swipe__content", drag.dragging && "is-dragging")}
        style={`transform:translateX(${x}px)`}
        {...drag.handlers}
        onTouchStart={(e) => {
          // 按下别的行时，开着的那行先收回
          if (group && group.openId && group.openId !== id) group.setOpenId(null);
          drag.handlers.onTouchStart(e);
        }}
        onClick={open ? close : undefined}
      >
        {children}
        {!disabled && !open && (
          <View className="xxd-sr-only" onClick={() => setOpen(true)} {...a11y({ role: "button", label: t.actions })}>
            {t.actions}
          </View>
        )}
      </View>
    </View>
  );
}
