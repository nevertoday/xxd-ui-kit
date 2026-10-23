// 数量加减：− 数字 +（购物车的件数、份数、人数）。MINI-REVIEW-PLAN D31
//   <Stepper value={n} onValueChange={setN} min={1} max={99} label="份数" />
import { View, Text } from "@tarojs/components";
import { Minus, Plus } from "@xxd/icons/each";
import "../styles/stepper.mini.css";
import { a11y } from "./aria";
import { Button } from "./button";
import { useXxd } from "./provider";
import { cx } from "./util";

export interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** 读屏念的名字（「份数」） */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function Stepper({ value, onValueChange, min = 0, max = Infinity, step = 1, label, disabled, className }: StepperProps) {
  const { t } = useXxd();
  const set = (v: number) => onValueChange(Math.min(max, Math.max(min, Math.round(v / step) * step)));
  return (
    <View className={cx("xxd-stepper", disabled && "is-disabled", className)} {...a11y({ role: "group", label })}>
      <Button variant="ghost" size="sm" icon={Minus} label={`${t.decrease}：${label}`} disabled={disabled || value <= min} onClick={() => set(value - step)} />
      <Text className="xxd-stepper__value" {...a11y({ live: "polite", label: `${label} ${value}` })}>
        {value}
      </Text>
      <Button variant="ghost" size="sm" icon={Plus} label={`${t.increase}：${label}`} disabled={disabled || value >= max} onClick={() => set(value + step)} />
    </View>
  );
}
