// 开关、复选、单选：自己画，和网页版一模一样（微信原生控件做不出直角，§13 第 6 条）。
// 自己画就要自己补读屏：开关是 switch、复选是 checkbox、单选是 radio，都带 checked。
import { View, Text } from "@tarojs/components";
import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import "../styles/switch.mini.css";
import "../styles/checkbox.mini.css";
import "../styles/radio.mini.css";
import { a11y } from "./aria";
import { RowCtx, type RowControl } from "./row";
import { cx, mods } from "./util";

interface ToggleBase {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** 旁边的文字；没有文字时给 label 当读屏说明 */
  children?: ReactNode;
  label?: string;
  className?: string;
}

function useChecked(checked: boolean | undefined, defaultChecked: boolean | undefined, onChange?: (v: boolean) => void) {
  const [inner, setInner] = useState(Boolean(defaultChecked));
  const current = checked ?? inner;
  const set = (v: boolean) => {
    if (checked == null) setInner(v);
    onChange?.(v);
  };
  return [current, set] as const;
}

/** 控件和文字一起点：整块都是点按区（手机上点得到）。放在 Cell 里时把自己登记给那一行：点整行也能切换 */
function Choice({ children, control, onTap, disabled, a11yProps, state, className }: { children?: ReactNode; control: ReactNode; onTap: () => void; disabled?: boolean; a11yProps: Record<string, unknown>; state: Omit<RowControl, "toggle">; className?: string }) {
  // 单选组一行里有好几个，不登记（点整行不知道该选哪个）
  const rowCtx = useContext(RowCtx);
  const row = state.role === "radio" ? null : rowCtx;
  useLayoutEffect(() => {
    row?.register({ ...state, toggle: onTap });
  });
  useLayoutEffect(() => () => row?.register(null), [row]);
  return (
    <View
      className={cx("xxd-choice", mods({ disabled, "in-row": Boolean(row) }), className)}
      onClick={
        disabled
          ? undefined
          : (e: { stopPropagation?: () => void }) => {
              // 在 Cell 里：别让这一下再冒泡到行上，切换两次
              e?.stopPropagation?.();
              onTap();
            }
      }
      hoverClass="none"
      {...(row ? a11y({ hidden: true }) : a11yProps)}
    >
      {control}
      {children != null && <Text className="xxd-choice__text">{children}</Text>}
    </View>
  );
}

export interface SwitchProps extends ToggleBase {
  size?: "sm" | "md" | "lg";
}

export function Switch({ checked, defaultChecked, onCheckedChange, disabled, children, label, size, className }: SwitchProps) {
  const [on, set] = useChecked(checked, defaultChecked, onCheckedChange);
  const control = <View className={cx("xxd-switch", mods({ checked: on, disabled, size: size === "md" ? undefined : size }))} />;
  return (
    <Choice className={className} control={control} disabled={disabled} onTap={() => set(!on)} state={{ role: "switch", checked: on, disabled }} a11yProps={a11y({ role: "switch", checked: on, disabled, label: label ?? (typeof children === "string" ? children : undefined) })}>
      {children}
    </Choice>
  );
}

export interface CheckboxProps extends ToggleBase {
  /** 半选（全选框里选了一部分） */
  indeterminate?: boolean;
  invalid?: boolean;
}

export function Checkbox({ checked, defaultChecked, onCheckedChange, disabled, children, label, indeterminate, invalid, className }: CheckboxProps) {
  const [on, set] = useChecked(checked, defaultChecked, onCheckedChange);
  const control = <View className={cx("xxd-check", mods({ checked: on && !indeterminate, indeterminate, disabled, invalid }))} />;
  return (
    <Choice className={className} control={control} disabled={disabled} onTap={() => set(!on)} state={{ role: "checkbox", checked: indeterminate ? "mixed" : on, disabled }} a11yProps={a11y({ role: "checkbox", checked: indeterminate ? "mixed" : on, disabled, label: label ?? (typeof children === "string" ? children : undefined) })}>
      {children}
    </Choice>
  );
}

const RadioCtx = createContext<{ value?: string; select: (v: string) => void; disabled?: boolean } | null>(null);

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 读屏念的组名 */
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
  /** 横着排 */
  inline?: boolean;
  className?: string;
}

export function RadioGroup({ value, defaultValue, onValueChange, label, disabled, children, inline, className }: RadioGroupProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const select = (v: string) => {
    if (value == null) setInner(v);
    onValueChange?.(v);
  };
  return (
    <RadioCtx.Provider value={{ value: current, select, disabled }}>
      <View className={cx("xxd-choices", inline && "is-inline", className)} {...a11y({ role: "radiogroup", label })}>
        {children}
      </View>
    </RadioCtx.Provider>
  );
}

export interface RadioProps {
  value: string;
  children?: ReactNode;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Radio({ value, children, label, disabled, className }: RadioProps) {
  const group = useContext(RadioCtx);
  const on = group?.value === value;
  const off = disabled || group?.disabled;
  const control = <View className={cx("xxd-radio", mods({ checked: on, disabled: off }))} />;
  return (
    <Choice className={className} control={control} disabled={off} onTap={() => group?.select(value)} state={{ role: "radio", checked: on, disabled: off }} a11yProps={a11y({ role: "radio", checked: on, disabled: off, label: label ?? (typeof children === "string" ? children : undefined) })}>
      {children}
    </Choice>
  );
}
