// 滚轮选择：底部面板里一到几列滚轮（日期、地区、数量）。用小程序原生的 picker-view，手感和系统一样。
import { PickerView, PickerViewColumn, View, Text } from "@tarojs/components";
import { useEffect, useState, type ReactNode } from "react";
import { IS_H5 } from "./util";
import "../styles/picker.mini.css";
import { Button } from "./button";
import { Sheet } from "./sheet";
import { useXxd } from "./provider";

export interface PickerOption {
  value: string;
  label: ReactNode;
}

export interface PickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  /** 每一列的选项 */
  columns: PickerOption[][];
  /** 每一列选中的值 */
  value: string[];
  onConfirm: (value: string[]) => void;
  /** 滚轮停下时回调（还没点确定）。联动（选了省，城市跟着变）：在这里改 columns */
  onChange?: (value: string[]) => void;
  confirmLabel?: string;
}

export function Picker({ open, onOpenChange, title, columns, value, onConfirm, onChange, confirmLabel }: PickerProps) {
  const { t } = useXxd();
  const toIndex = (v: string[]) => columns.map((col, i) => Math.max(0, col.findIndex((o) => o.value === v[i])));
  const [rawIndex, setIndex] = useState<number[]>(() => toIndex(value));
  // 列变短了（联动：2 月只有 28 天）：选中的位置收进范围里
  const index = columns.map((col, c) => Math.min(rawIndex[c] ?? 0, Math.max(0, col.length - 1)));
  const valueAt = (idx: number[]) => idx.map((i, c) => columns[c]?.[i]?.value);
  // 每次打开都从当前的值开始
  useEffect(() => {
    if (open) setIndex(toIndex(value));
    // H5：滚轮的每一列是能滚的区域，要能用键盘停上去（Taro 的 picker-view 没给 tabindex）
    if (open && IS_H5) {
      const t = setTimeout(() => document.querySelectorAll(".xxd-wheel taro-picker-view-column-core").forEach((el) => el.setAttribute("tabindex", "0")), 60);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button
          variant="primary"
          onClick={() => {
            onConfirm(valueAt(index));
            onOpenChange(false);
          }}
        >
          {confirmLabel ?? t.confirm}
        </Button>
      }
    >
      <PickerView className="xxd-wheel" indicatorClass="xxd-wheel__indicator" indicatorStyle="height:44px" maskClass="xxd-wheel__mask" value={index} immediateChange onChange={(e) => {
          const next = e.detail.value as number[];
          setIndex(next);
          onChange?.(valueAt(next));
        }}>
        {columns.map((col, c) => (
          <PickerViewColumn key={c}>
            {col.map((o) => (
              <View key={o.value} className="xxd-wheel__option">
                <Text>{o.label}</Text>
              </View>
            ))}
          </PickerViewColumn>
        ))}
      </PickerView>
    </Sheet>
  );
}
