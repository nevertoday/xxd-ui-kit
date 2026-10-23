// 按钮：实心（primary）/ 次要（缺省）/ 幽灵（ghost）/ 危险（danger）；加载中；整行宽。和网页版 .xxd-btn 同一套样式。
// 用的是小程序原生 button：openType（分享、手机号、客服……）和 formType 照样能用。
import { Button as TaroButton, View, type ButtonProps as TaroButtonProps } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/button.mini.css";
import "../styles/loading.mini.css";
import { a11y } from "./aria";
import { Icon, type IconNode } from "./icon";
import { cx, mods } from "./util";

export interface ButtonProps {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  /** 占满一行（手机上的主操作常用） */
  block?: boolean;
  loading?: boolean;
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

export function Button({ children, variant, size, block, loading, disabled, pressed, icon, label, shape, className, style, openType, formType, onClick, ...rest }: ButtonProps) {
  const iconOnly = !children && Boolean(icon);
  if (iconOnly && !label && process.env.NODE_ENV !== "production") console.warn("[@xxd/mini] 只有图标的按钮要给 label（读屏要念出来）");
  const off = disabled || loading;
  return (
    <TaroButton
      {...(rest as Record<string, unknown>)}
      className={cx("xxd-btn", mods({ variant: variant === "secondary" ? undefined : variant, size: size === "md" ? undefined : size, block, "icon-only": iconOnly, busy: loading, pressed, disabled: off, shape }), className)}
      style={style}
      hoverClass={off ? "none" : "is-hover is-active"}
      hoverStayTime={60}
      disabled={off || undefined}
      openType={openType}
      formType={formType}
      onClick={off ? undefined : onClick}
      {...a11y({ role: "button", label, disabled: off, pressed, busy: loading })}
    >
      {loading ? <View className="xxd-spinner" /> : icon ? <Icon icon={icon} size={size === "xs" ? 14 : 16} /> : null}
      {children}
    </TaroButton>
  );
}

/** 一排按钮：间距固定，手机上可以设 block 让它们平分一行 */
export function ButtonGroup({ children, block, className }: { children?: ReactNode; block?: boolean; className?: string }) {
  return <View className={cx("xxd-cluster xxd-btn-row", block && "is-block", className)}>{children}</View>;
}
