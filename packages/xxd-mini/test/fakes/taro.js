// 测试用的 @tarojs/taro：API 记下调用，存储放在内存里，页面显示 / 隐藏的回调可以手动触发
const calls = [];
const store = new Map();
const pageShow = new Set();
const pageHide = new Set();
const keyboard = new Set();
const resize = new Set();
export const fake = {
  calls,
  store,
  menuRect: { top: 48, height: 32, left: 281, right: 368, bottom: 80, width: 87 },
  win: { statusBarHeight: 44, windowWidth: 375, screenWidth: 375 },
  theme: "light",
  show: () => pageShow.forEach((f) => f()),
  hide: () => pageHide.forEach((f) => f()),
  keyboard: (height) => keyboard.forEach((f) => f({ height })),
  resize: () => resize.forEach((f) => f({})),
  reset() {
    calls.length = 0;
    store.clear();
  },
};
const rec = (name) => (arg) => {
  calls.push([name, arg]);
  return Promise.resolve({});
};
export const setBackgroundColor = rec("setBackgroundColor");
export const setBackgroundTextStyle = rec("setBackgroundTextStyle");
export const setNavigationBarColor = rec("setNavigationBarColor");
export const switchTab = rec("switchTab");
export const redirectTo = rec("redirectTo");
export const navigateBack = rec("navigateBack");
export const reLaunch = rec("reLaunch");
export const previewImage = rec("previewImage");
export const vibrateShort = rec("vibrateShort");
export const chooseMedia = (arg) => {
  calls.push(["chooseMedia", arg]);
  return Promise.resolve(fake.nextMedia ?? { tempFiles: [] });
};
export const getStorageSync = (k) => store.get(k) ?? "";
export const setStorageSync = (k, v) => store.set(k, v);
export const getAppBaseInfo = () => ({ theme: fake.theme });
export const getSystemInfoSync = () => ({ ...fake.win, theme: fake.theme });
export const getWindowInfo = () => fake.win;
export const getMenuButtonBoundingClientRect = () => fake.menuRect;
export const getCurrentPages = () => [{}, {}];
export const onThemeChange = () => {};
export const offThemeChange = () => {};
export const onKeyboardHeightChange = (f) => keyboard.add(f);
export const offKeyboardHeightChange = (f) => keyboard.delete(f);
export const onWindowResize = (f) => resize.add(f);
export const offWindowResize = (f) => resize.delete(f);
export const useRouter = () => ({ params: {} });
const listeners = new Map();
export const eventCenter = {
  on: (name, fn) => (listeners.get(name) ?? listeners.set(name, new Set()).get(name)).add(fn),
  off: (name, fn) => listeners.get(name)?.delete(fn),
  trigger: (name, ...args) => listeners.get(name)?.forEach((fn) => fn(...args)),
};
import { useEffect, useRef } from "react";
const pageHook = (set) => (fn) => {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const f = () => ref.current();
    set.add(f);
    return () => set.delete(f);
  }, []);
};
export const useDidShow = pageHook(pageShow);
export const useDidHide = pageHook(pageHide);
export default { fake };
