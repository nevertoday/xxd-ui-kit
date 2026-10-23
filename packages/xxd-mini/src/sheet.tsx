// 底部面板：手机上一切「更多操作」都放这里——网页版的菜单、浮动卡片在小程序里都换成它（§5）。
//   <Sheet open={open} onOpenChange={setOpen} title="封面">…</Sheet>
//   <ActionSheet open … actions={[{ label: "删除", danger: true, onClick }]} />   一列操作 + 取消
import { ScrollView, View, Text } from "@tarojs/components";
import { X } from "@xxd/icons/each";
import type { ReactNode } from "react";
import "../styles/sheet.mini.css";
import { a11y } from "./aria";
import { Button } from "./button";
import { useDrag } from "./drag";
import { InSheetCtx, useKeyboardHeight } from "./keyboard";
import { BackGuard, Portal, useLayer, usePresence } from "./overlay";
import { useXxd } from "./provider";
import { cx, mods } from "./util";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  children?: ReactNode;
  /** 右上角的关闭按钮，缺省有 */
  closable?: boolean;
  /** 点遮罩关，缺省可以 */
  dismissible?: boolean;
  /** 面板底部固定的一排按钮 */
  footer?: ReactNode;
  /** 按住顶上的把手和标题往下拖可以关，缺省跟着 dismissible */
  draggable?: boolean;
  className?: string;
}

export function Sheet({ open, onOpenChange, title, children, closable = true, dismissible = true, footer, draggable, className }: SheetProps) {
  const [mounted, shown] = usePresence(open, 200);
  const { t } = useXxd();
  const close = () => onOpenChange(false);
  const managed = useLayer(open, close);
  // 键盘弹出时整个面板跟着升起来（面板里的输入框不再推页面，见 keyboard.ts）
  const keyboard = useKeyboardHeight(open);
  // 往下拖：拖过 96px 或者甩得够快就关（D28）
  const canDrag = draggable ?? dismissible;
  const drag = useDrag({
    axis: "y",
    base: () => 0,
    clamp: (v) => Math.max(0, v),
    disabled: !canDrag,
    onEnd: (y, v) => {
      if (y > 96 || v > 0.6) close();
    },
  });
  if (!mounted) return null;
  const style = [drag.pos != null ? `transform:translateY(${drag.pos}px)` : "", keyboard ? `--kb:${keyboard}px` : ""].filter(Boolean).join(";");
  return (
    <Portal>
      {!managed && <BackGuard open={open} onBack={close} />}
      <View className={cx("xxd-scrim", mods({ open: shown }))} onClick={dismissible ? close : undefined} catchMove />
      <View
        className={cx("xxd-sheet", mods({ open: shown, dragging: drag.dragging, keyboard: keyboard > 0, draggable: canDrag }), className)}
        style={style || undefined}
        catchMove
        {...a11y({ role: "dialog", modal: true, label: typeof title === "string" ? title : undefined })}
      >
        {/* 把手和标题：按住往下拖可以关 */}
        <View className="xxd-sheet__grip" {...drag.handlers} {...a11y({ hidden: true })} />
        {(title != null || closable) && (
          <View className="xxd-sheet__head" {...drag.handlers}>
            <Text className="xxd-sheet__title">{title}</Text>
            {closable && <Button variant="ghost" size="sm" icon={X} label={t.close} onClick={close} />}
          </View>
        )}
        {/* 内容多了在面板里滚：用 scroll-view（Skyline 没有 overflow: auto） */}
        <InSheetCtx.Provider value>
          <ScrollView className="xxd-sheet__body" scrollY enhanced showScrollbar={false}>
            {children}
          </ScrollView>
          {footer != null && <View className="xxd-sheet__foot">{footer}</View>}
        </InSheetCtx.Provider>
      </View>
    </Portal>
  );
}

export interface SheetAction {
  label: ReactNode;
  description?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  actions: SheetAction[];
  cancelLabel?: string;
}

/** 一列操作 + 取消：手机上的「更多」菜单 */
export function ActionSheet({ open, onOpenChange, title, actions, cancelLabel }: ActionSheetProps) {
  const { t } = useXxd();
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} closable={false} className="is-actions">
      <View className="xxd-sheet__actions" {...a11y({ role: "menu" })}>
        {actions.map((a, i) => (
          <View
            key={i}
            className={cx("xxd-sheet__action", mods({ tone: a.danger ? "danger" : undefined, disabled: a.disabled }))}
            hoverClass={a.disabled ? "none" : "is-hover"}
            onClick={
              a.disabled
                ? undefined
                : () => {
                    close();
                    a.onClick();
                  }
            }
            {...a11y({ role: "menuitem", disabled: a.disabled })}
          >
            <Text className="xxd-sheet__action-label">{a.label}</Text>
            {a.description != null && <Text className="xxd-sheet__action-desc">{a.description}</Text>}
          </View>
        ))}
      </View>
      <View className="xxd-sheet__action is-cancel" hoverClass="is-hover" onClick={close} {...a11y({ role: "button" })}>
        <Text className="xxd-sheet__action-label">{cancelLabel ?? t.cancel}</Text>
      </View>
    </Sheet>
  );
}
