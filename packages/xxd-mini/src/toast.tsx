// 轻提示：自己画（wx.showToast 的样子改不了）。用 useToast() 弹，XxdPage 里放着显示的地方。
import { Button, View, Text } from "@tarojs/components";
import { Check, CircleAlert, Info, TriangleAlert } from "@xxd/icons/each";
import "../styles/button.mini.css";
import "../styles/toast.mini.css";
import { a11y } from "./aria";
import { Icon, type IconNode } from "./icon";
import { Portal } from "./overlay";
import { useToasts, useXxd, type ToastItem } from "./provider";
import { cx, mods } from "./util";

const TONE_ICON: Record<string, IconNode> = { success: Check, danger: CircleAlert, warning: TriangleAlert, info: Info };

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const icon = item.tone ? TONE_ICON[item.tone] : undefined;
  return (
    <View className={cx("xxd-toast", mods({ tone: item.tone, leaving: item.leaving }))} {...a11y({ role: item.tone === "danger" ? "alert" : "status", live: item.tone === "danger" ? "assertive" : "polite" })}>
      {icon && <Icon icon={icon} />}
      <Text className="xxd-toast__text">{item.message}</Text>
      {item.action && (
        <Button
          className="xxd-btn xxd-toast__action is-variant is-variant-ghost is-size is-size-sm"
          hoverClass="is-hover is-active"
          onClick={() => {
            item.action?.onClick();
            onDismiss(item.id);
          }}
        >
          {item.action.label}
        </Button>
      )}
    </View>
  );
}

/** 这一页的轻提示（XxdPage 里已经放了一个，不用自己放）。页面栈里看不见的页面不画（active 为 false） */
export function ToastRegion({ active = true }: { active?: boolean }) {
  const toasts = useToasts();
  const { dismissToast } = useXxd();
  if (!active || !toasts.length) return null;
  return (
    <Portal>
      <View className="xxd-toast-region">
        {toasts.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={dismissToast} />
        ))}
      </View>
    </Portal>
  );
}
