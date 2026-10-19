// 键盘：底部面板里的输入框不再「把整页往上推」，由面板自己跟着键盘升起来（MINI-REVIEW-PLAN I5）。
// 微信缺省的推页面只保证输入框本身露出来，面板底部的「保存」会被键盘盖住。
import { offKeyboardHeightChange, onKeyboardHeightChange } from "@tarojs/taro";
import { createContext, useContext, useEffect, useState } from "react";
import { IS_H5 } from "./util";

/** 在底部面板里：里面的输入框缺省 adjustPosition = false */
export const InSheetCtx = createContext(false);

/** 输入框的 adjustPosition 缺省值：在面板里是 false，其他地方交给微信（undefined） */
export function useAdjustPosition(own?: boolean): boolean | undefined {
  const inSheet = useContext(InSheetCtx);
  return own ?? (inSheet ? false : undefined);
}

/** 键盘高度（px），收起时 0。active 为 false 时不监听 */
export function useKeyboardHeight(active = true): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!active || IS_H5) return;
    const fn = (res: { height: number }) => setHeight(Math.max(0, res.height || 0));
    try {
      onKeyboardHeightChange?.(fn);
      return () => {
        offKeyboardHeightChange?.(fn);
        setHeight(0);
      };
    } catch {
      return undefined;
    }
  }, [active]);
  return height;
}
