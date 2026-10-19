// 展示类的小组件：空状态、加载（转圈、骨架、加载条）、徽标、状态点、头像、标签、文字、布局。和网页版同名的类。
import { Image, View, Text as TaroText } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/empty.mini.css";
import "../styles/loading.mini.css";
import "../styles/badge.mini.css";
import "../styles/avatar.mini.css";
import "../styles/tag.mini.css";
import "../styles/text.mini.css";
import "../styles/layout.mini.css";
import { a11y } from "./aria";
import { Icon, type IconNode } from "./icon";
import { useXxd } from "./provider";
import { cx, imgAlt, mods, styleText } from "./util";

/* ── 空状态 ── */
export interface EmptyProps {
  icon?: IconNode;
  title: ReactNode;
  description?: ReactNode;
  /** 下面的按钮 */
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Empty({ icon, title, description, action, size, className }: EmptyProps) {
  return (
    <View className={cx("xxd-empty", mods({ size: size === "md" ? undefined : size }), className)}>
      {icon && <Icon icon={icon} size={size === "sm" ? 24 : size === "lg" ? 40 : 32} />}
      <TaroText className="xxd-empty__title">{title}</TaroText>
      {description != null && <TaroText className="xxd-empty__text">{description}</TaroText>}
      {action != null && <View className="xxd-empty__actions">{action}</View>}
    </View>
  );
}

/* ── 加载 ── */
export function Spinner({ size, label, className }: { size?: "md" | "lg"; label?: string; className?: string }) {
  const { t } = useXxd();
  return <View className={cx("xxd-spinner", mods({ size: size === "lg" ? "lg" : undefined }), className)} {...a11y({ role: "progressbar", label: label ?? t.loading, busy: true })} />;
}

/** 一整块在加载：转圈 + 字，居中 */
export function Loading({ children, className }: { children?: ReactNode; className?: string }) {
  const { t } = useXxd();
  return (
    <View className={cx("xxd-loading", className)} {...a11y({ role: "status", live: "polite" })}>
      <View className="xxd-spinner" />
      <TaroText>{children ?? t.loading}</TaroText>
    </View>
  );
}

/** 骨架：内容的形状先占着。lines 是几行字；width / height 画一块 */
export function Skeleton({ lines, width, height, circle, className }: { lines?: number; width?: string | number; height?: string | number; circle?: boolean; className?: string }) {
  const px = (v?: string | number) => (typeof v === "number" ? `${v}px` : v);
  if (lines) {
    return (
      <View className={cx("xxd-skeleton-lines", className)} {...a11y({ hidden: true })}>
        {Array.from({ length: lines }, (_, i) => (
          <View key={i} className="xxd-skeleton is-line" style={i === lines - 1 && lines > 1 ? "width:60%" : undefined} />
        ))}
      </View>
    );
  }
  return <View className={cx("xxd-skeleton", circle && "is-circle", className)} style={styleText({ width: px(width), height: px(height) })} {...a11y({ hidden: true })} />;
}

/** 页面顶上一条加载条（不知道要多久时） */
export function LoadBar({ className }: { className?: string }) {
  const { t } = useXxd();
  return <View className={cx("xxd-loadbar", className)} {...a11y({ role: "progressbar", label: t.loading })} />;
}

/* ── 徽标、状态点 ── */
export interface BadgeProps {
  children?: ReactNode;
  tone?: "action" | "success" | "danger" | "warning";
  variant?: "soft" | "solid" | "outline" | "new";
  /** 前面一个状态点（运行中、已停止） */
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone, variant, dot, className }: BadgeProps) {
  return <TaroText className={cx("xxd-badge", mods({ tone, variant: variant === "soft" ? undefined : variant, appearance: dot ? "dot" : undefined }), className)}>{children}</TaroText>;
}

export function Dot({ tone, label, className }: { tone?: "action" | "success" | "danger" | "warning"; label?: string; className?: string }) {
  return <View className={cx("xxd-dot", mods({ tone }), className)} {...a11y(label ? { role: "img", label } : { hidden: true })} />;
}

/* ── 头像 ── */
export interface AvatarProps {
  /** 图片地址；没有时显示 name 的第一个字 */
  src?: string;
  name?: string;
  size?: number;
  /** 会员：外面一圈主色 */
  member?: boolean;
  className?: string;
}

export function Avatar({ src, name, size = 36, member, className }: AvatarProps) {
  const initial = name ? Array.from(name.trim())[0] : "";
  return (
    <View className={cx("xxd-avatar", mods({ member }), className)} style={`--avatar-size:${size}px;font-size:${Math.round(size * 0.42)}px`} {...a11y({ role: "img", label: name })}>
      {src ? <Image className="xxd-avatar__img" src={src} mode="aspectFill" {...imgAlt("")} /> : <TaroText>{initial}</TaroText>}
    </View>
  );
}

/* ── 标签（可选的小块：筛选、分类） ── */
export interface TagProps {
  children?: ReactNode;
  /** 能点选：按下 / 没按下 */
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Tag({ children, pressed, onPressedChange, disabled, className }: TagProps) {
  const interactive = Boolean(onPressedChange);
  return (
    <View
      className={cx("xxd-chip", mods({ pressed, disabled, interactive }), className)}
      hoverClass={interactive && !disabled ? "is-hover" : "none"}
      onClick={interactive && !disabled ? () => onPressedChange?.(!pressed) : undefined}
      {...a11y(interactive ? { role: "button", pressed: Boolean(pressed), disabled } : {})}
    >
      {children}
    </View>
  );
}

/* ── 文字 ── */
export interface TextProps {
  children?: ReactNode;
  variant?: "display" | "heading1" | "heading2" | "heading3" | "body" | "secondary" | "caption" | "mono" | "success" | "danger" | "warning";
  size?: "xs" | "sm" | "base" | "lg";
  /** 一行放不下就省略 */
  truncate?: boolean;
  /** 能长按选中复制 */
  selectable?: boolean;
  /** 和别的字排在同一行（缺省自成一段，像网页版的 <p>） */
  inline?: boolean;
  className?: string;
}

export function Text({ children, variant, size, truncate, selectable, inline, className }: TextProps) {
  const level = variant === "display" || variant === "heading1" ? 1 : variant === "heading2" ? 2 : variant === "heading3" ? 3 : 0;
  return (
    <TaroText className={cx("xxd-text", mods({ variant: variant === "body" ? undefined : variant, size, truncate, inline }), className)} userSelect={selectable} {...a11y(level ? { role: "heading", level } : {})}>
      {children}
    </TaroText>
  );
}

/* ── 布局 ── */
export function Stack({ children, gap, className, style }: { children?: ReactNode; gap?: number; className?: string; style?: string }) {
  return (
    <View className={cx("xxd-stack", className)} style={`${gap != null ? `--stack-gap:${gap}px;gap:${gap}px;` : ""}${style ?? ""}`}>
      {children}
    </View>
  );
}

export function Cluster({ children, gap, className, style }: { children?: ReactNode; gap?: number; className?: string; style?: string }) {
  return (
    <View className={cx("xxd-cluster", className)} style={`${gap != null ? `gap:${gap}px;` : ""}${style ?? ""}`}>
      {children}
    </View>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={cx("xxd-divider", className)} {...a11y({ role: "separator" })} />;
}

/** 页面的一段：左右留出页边距 */
export function Section({ children, title, className }: { children?: ReactNode; title?: ReactNode; className?: string }) {
  return (
    <View className={cx("xxd-section", className)}>
      {title != null && (
        <TaroText className="xxd-section__title" {...a11y({ role: "heading", level: 2 })}>
          {title}
        </TaroText>
      )}
      {children}
    </View>
  );
}
