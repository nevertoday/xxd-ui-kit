// 按钮：实心（primary）/ 次要（缺省）/ 幽灵（ghost）/ 危险（danger）；加载中；整行宽。和网页版 .xxd-btn 同一套样式。
// 用的是小程序原生 button：openType（分享、手机号、客服……）和 formType 照样能用。
import { Button as TaroButton, View, type ButtonProps as TaroButtonProps } from "@tarojs/components";
import { Check } from "@xxd/icons/each";
import type { ReactNode } from "react";
import "../styles/button.mini.css";
import { a11y } from "./aria";
import { Icon, type IconNode } from "./icon";
import { cx, mods } from "./util";

export interface ButtonProps {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  /** 占满一行（手机上的主操作常用） */
  block?: boolean;
  /** 进行中：150ms 后字变透明、正中一个转圈（宽度不跳），点了不触发 */
  loading?: boolean;
  /** 刚做完：有图标的换成勾，没有图标的字变透明、中间一个勾（和网页版 Xxd.runBusy 一样）。留 DONE_FOR（1 秒）后由调用的人关掉（FEEDBACK-ALIGN-PLAN D174） */
  done?: boolean;
  disabled?: boolean;
  /** 开关按钮：按下 / 没按下 */
  pressed?: boolean;
  /** 图标在文字前面；只有图标时必须给 label */
  icon?: IconNode;
  /** 读屏说明。只有图标、没有文字的按钮一定要写 */
  label?: string;
  shape?: "round";
  className?: string;
  style?: string;
  openType?: TaroButtonProps["openType"];
  formType?: TaroButtonProps["formType"];
  onClick?: () => void;
  /** openType 的回调原样传给小程序 button（onGetPhoneNumber、onContact……） */
  [key: `on${string}`]: unknown;
}

export function Button({ children, variant, size, block, loading, done, disabled, pressed, icon, label, shape, className, style, openType, formType, onClick, ...rest }: ButtonProps) {
  const iconOnly = !children && Boolean(icon);
  if (iconOnly && !label && process.env.NODE_ENV !== "production") console.warn("[@xxd/mini] 只有图标的按钮要给 label（读屏要念出来）");
  const off = disabled || loading;
  const isDone = done && !loading;
  // 进行中不是禁用（状态优先级：禁用 > 进行中，ACCEPTANCE-REVIEW）：不加 is-disabled，否则禁用的字色盖过透明的字。原生的 disabled 照样写，表单不会再提交一次
  return (
    <TaroButton
      {...(rest as Record<string, unknown>)}
      className={cx("xxd-btn", mods({ variant: variant === "secondary" ? undefined : variant, size: size === "md" ? undefined : size, block, "icon-only": iconOnly, "with-icon": Boolean(icon), busy: loading, done: isDone, pressed, disabled, shape }), className)}
      style={style}
      hoverClass={off ? "none" : "is-hover is-active"}
      hoverStayTime={60}
      disabled={off || undefined}
      openType={openType}
      formType={formType}
      onClick={off ? undefined : onClick}
      {...a11y({ role: "button", label, disabled: off, pressed, busy: loading })}
    >
      {icon ? <Icon icon={isDone ? Check : icon} size={size === "xs" ? 14 : 16} /> : null}
      {children}
    </TaroButton>
  );
}

/** 一排按钮：间距固定，手机上可以设 block 让它们平分一行 */
export function ButtonGroup({ children, block, className }: { children?: ReactNode; block?: boolean; className?: string }) {
  return <View className={cx("xxd-cluster xxd-btn-row", block && "is-block", className)}>{children}</View>;
}
