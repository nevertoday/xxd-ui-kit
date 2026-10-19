// 对话框：确认、提醒。盖在页面中间（root-portal）；按返回键先关它。网页版 .xxd-dialog。
//   <Dialog open … title="删除这篇？" description="删除后找不回来" confirm={{ label: "删除", danger: true, onClick }} />
import { View, Text } from "@tarojs/components";
import { useState, type ReactNode } from "react";
import "../styles/dialog.mini.css";
import "../styles/sheet.mini.css";
import { a11y } from "./aria";
import { Button } from "./button";
import { BackGuard, Portal, useLayer, usePresence } from "./overlay";
import { useXxd } from "./provider";
import { cx, mods } from "./util";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /**
   * 主操作（在右边）。不给就只有一个「确定」。
   * onClick 返回 false 不关；返回 Promise 时按钮自动进入「加载中」并锁住，完了再关；出错时不关，弹一条危险色轻提示（errorText）。
   */
  confirm?: { label?: string; danger?: boolean; loading?: boolean; errorText?: string; onClick?: () => void | boolean | Promise<void | boolean> };
  /** 取消按钮的字；写 false 不要取消（只是告知时） */
  cancel?: string | false;
  /** 点遮罩关：缺省不关（确认类的对话框不该一碰就没） */
  dismissible?: boolean;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, confirm, cancel, dismissible = false, className }: DialogProps) {
  const [mounted, shown] = usePresence(open, 220);
  const { t, toast } = useXxd();
  const [busy, setBusy] = useState(false);
  const close = () => {
    if (!busy) onOpenChange(false);
  };
  const managed = useLayer(open, close);
  if (!mounted) return null;
  const onConfirm = async () => {
    if (busy) return;
    const result = confirm?.onClick?.();
    if (result && typeof (result as Promise<unknown>).then === "function") {
      // 异步：锁住按钮，等它完成；网络慢时连点也只提交一次
      setBusy(true);
      try {
        const value = await result;
        setBusy(false);
        // 返回 false 表示别关（比如校验没过）
        if (value !== false) onOpenChange(false);
      } catch (error) {
        setBusy(false);
        toast(confirm?.errorText ?? t.failed, { tone: "danger" });
        if (process.env.NODE_ENV !== "production") console.error("[@xxd/mini] Dialog 的 confirm.onClick 出错：", error);
      }
      return;
    }
    if (result !== false) onOpenChange(false);
  };
  return (
    <Portal>
      {!managed && <BackGuard open={open} onBack={close} />}
      <View className={cx("xxd-scrim", mods({ open: shown }))} onClick={dismissible ? close : undefined} catchMove />
      <View className={cx("xxd-dialog", mods({ open: shown, role: "alertdialog" }), className)} catchMove {...a11y({ role: "alertdialog", modal: true, label: typeof title === "string" ? title : undefined })}>
        <View className="xxd-dialog__head">
          <Text className="xxd-dialog__title">{title}</Text>
        </View>
        {(description != null || children != null) && (
          <View className="xxd-dialog__body">
            {description != null && <Text className="xxd-dialog__desc">{description}</Text>}
            {children}
          </View>
        )}
        <View className="xxd-dialog__actions">
          {cancel !== false && (
            <Button className="ui-dialog-cancel" disabled={busy} onClick={close}>
              {cancel || t.cancel}
            </Button>
          )}
          <Button variant={confirm?.danger ? "danger" : "primary"} loading={confirm?.loading || busy} onClick={onConfirm}>
            {confirm?.label ?? t.confirm}
          </Button>
        </View>
      </View>
    </Portal>
  );
}
