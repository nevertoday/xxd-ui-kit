// 整行可点（MINI-REVIEW-PLAN I4）：Cell 里放开关、复选框时，点整行等于点控件；读屏上整行是一个开关，不是两个东西。
// 控件（choice.tsx）把自己的切换函数和状态登记给外面的 Cell。放在单独的文件里：choice 不用为它引入 Cell 的样式。
import { createContext } from "react";

export interface RowControl {
  toggle: () => void;
  role: "switch" | "checkbox" | "radio";
  checked: boolean | "mixed";
  disabled?: boolean;
}

export const RowCtx = createContext<{ register: (control: RowControl | null) => void } | null>(null);
