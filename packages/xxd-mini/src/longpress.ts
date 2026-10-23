// 长按：生效时轻震一下（手机上的习惯，用户知道长按起作用了）。MINI-REVIEW-PLAN I10
//   <View onLongPress={useLongPress(() => setMenuFor(item))}>
import { vibrateShort } from "@tarojs/taro";
import { IS_H5 } from "./util";

export function useLongPress(fn: () => void, { vibrate = true }: { vibrate?: boolean } = {}) {
  return () => {
    if (vibrate && !IS_H5) vibrateShort?.({ type: "light" })?.catch?.(() => {});
    fn();
  };
}
