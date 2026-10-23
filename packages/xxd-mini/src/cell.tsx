// 列表行：手机上最常用的一行——标题、说明，右边是值、控件或箭头。网页版的设置组（.xxd-group / .xxd-row）。
//   <CellGroup title="通知"><Cell title="完成音效" control={<Switch …/>} /></CellGroup>
import { View, Text } from "@tarojs/components";
import { useMemo, useRef, useState, type ReactNode } from "react";
import "../styles/cell.mini.css";
import { a11y } from "./aria";
import { RowCtx, type RowControl } from "./row";
import { cx, mods } from "./util";

export interface CellGroupProps {
  title?: ReactNode;
  /** 组下面的说明 */
  note?: ReactNode;
  children?: ReactNode;
  /** 两边留白、带边框和圆角的一块（缺省贴着屏幕两边） */
  inset?: boolean;
  className?: string;
}

export function CellGroup({ title, note, children, inset, className }: CellGroupProps) {
  return (
    <View className={cx("xxd-group", inset && "is-inset", className)}>
      {title != null && (
        <Text className="xxd-group__title" {...a11y({ role: "heading", level: 2 })}>
          {title}
        </Text>
      )}
      <View className="xxd-group__body">{children}</View>
      {note != null && <Text className="xxd-group__note">{note}</Text>}
    </View>
  );
}

export interface CellProps {
  title: ReactNode;
  description?: ReactNode;
  /** 右边的值（文字） */
  value?: ReactNode;
  /** 右边的控件。放开关、复选框时点整行就是点它（读屏上整行是一个开关）；放别的控件时点整行不会触发 onClick */
  control?: ReactNode;
  /** 行首的图标或头像 */
  leading?: ReactNode;
  /** 点了去别的页：显示右箭头 */
  arrow?: boolean;
  /** 危险操作（退出登录、删除账号）：标题用危险色 */
  danger?: boolean;
  /** 控件放到标题下面一整行（长输入框、分段选择） */
  stack?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Cell({ title, description, value, control, leading, arrow, danger, stack, disabled, onClick, className }: CellProps) {
  // 控件登记上来的切换函数和状态
  const ctl = useRef<RowControl | null>(null);
  const [state, setState] = useState<Omit<RowControl, "toggle"> | null>(null);
  const rowApi = useMemo(
    () => ({
      register: (c: RowControl | null) => {
        ctl.current = c;
        setState((prev) => (c == null ? null : prev && prev.role === c.role && prev.checked === c.checked && prev.disabled === c.disabled ? prev : { role: c.role, checked: c.checked, disabled: c.disabled }));
      },
    }),
    [],
  );
  const toggleRow = state != null && !state.disabled && !disabled;
  const tappable = (Boolean(onClick) && !control && !disabled) || toggleRow;
  const label = typeof title === "string" ? title : undefined;
  return (
    <View
      className={cx("xxd-row", "xxd-cell", tappable && "is-link", mods({ chevron: arrow, tone: danger ? "danger" : undefined, stack, disabled: disabled || state?.disabled }), className)}
      hoverClass={tappable ? "is-hover" : "none"}
      hoverStayTime={60}
      onClick={toggleRow ? () => ctl.current?.toggle() : tappable ? onClick : undefined}
      {...a11y(state ? { role: state.role, checked: state.checked, disabled: disabled || state.disabled, label } : tappable ? { role: arrow ? "link" : "button", disabled } : {})}
    >
      {leading != null && <View className="xxd-cell__leading">{leading}</View>}
      <View className="xxd-row__text">
        <View className="xxd-row__title">{title}</View>
        {description != null && <View className="xxd-row__desc">{description}</View>}
      </View>
      {(value != null || control != null) && (
        <View className="xxd-row__control">
          {value != null && <Text className="xxd-cell__value">{value}</Text>}
          <RowCtx.Provider value={rowApi}>{control}</RowCtx.Provider>
        </View>
      )}
    </View>
  );
}
