// 外观设置的存储：chrome.storage 是真正的来源，localStorage 镜像只为首帧不闪（boot.js 读它）。
// 多个页面（侧边栏、设置页、popup）通过 storage.onChanged 实时同步。
import { DEFAULT_SETTINGS, applySettings, readSettings } from "@xxd/tokens";
import { isContentScript } from "./i18n.js";

const chromeStorage = (area) => globalThis.chrome?.storage?.[area] ?? null;
const FIELDS = ["theme", "corners", "accent", "density", "finish"];
/** 只留外观的这几项，而且只留写了值的。 */
const pick = (s) => Object.fromEntries(FIELDS.filter((k) => s?.[k] !== undefined && s[k] !== null).map((k) => [k, s[k]]));

/**
 * const store = createAppearanceStore({ key: "picsort-ui" });
 * await store.load();           // 从 chrome.storage 读，写镜像并应用到 <html>
 * store.get();                  // 当前设置（同步）
 * await store.set({ accent: "#3b74b8" });
 * store.subscribe((s) => …);    // 本页或别的页面改了设置
 * apply: false —— 只读写不应用（content script 里，外观写到 Shadow host 上而不是宿主页面的 <html>）
 * mirror: 写不写 localStorage 镜像（缺省：插件自己的页面写，内容脚本不写）
 */
export function createAppearanceStore({ key = "xxd-ui", area = "sync", element, lock = {}, defaults = {}, apply = true, mirror } = {}) {
  const storage = chromeStorage(area);
  // localStorage 镜像只为插件自己页面的首帧（boot.js 读它）。内容脚本里的 localStorage 是宿主网页的：不写、不读，
  // 免得污染别人的站点、让网站借此认出插件。
  mirror ??= !isContentScript();
  const target = () => element ?? globalThis;
  // 存下来的只有用户自己选过的（saved）；defaults 是这个页面自己的缺省（侧边栏紧凑、设置页标准），不写进共享的设置，
  // 否则侧边栏一改主题，它的「紧凑」就跟着存进去，设置页也变紧凑了。
  const base = { ...DEFAULT_SETTINGS, ...defaults };
  let saved = mirror ? pick(readSettings(key)) : {};
  let current = { ...base, ...saved };
  const listeners = new Set();

  const writeMirror = () => {
    if (!mirror) return;
    try {
      // 整个替换（不是合并）：别的页面删掉了一项，镜像里也要没有
      if (Object.keys(saved).length) globalThis.localStorage?.setItem(key, JSON.stringify(saved));
      else globalThis.localStorage?.removeItem(key);
    } catch {
      /* 存储被禁用 */
    }
  };
  const commit = (nextSaved, { notify = true } = {}) => {
    saved = nextSaved;
    current = { ...base, ...saved };
    writeMirror();
    if (apply) applySettings(current, { element, lock });
    if (notify) listeners.forEach((fn) => fn(current));
    // 内容脚本里不在宿主网页的 window 上派发事件（网页能听见）；传了 element 就派发在它上面
    if (element || !isContentScript()) target().dispatchEvent?.(new CustomEvent("xxd:settings", { detail: current }));
    return current;
  };

  // 别的页面改了（或者导入、撤销把这一项删了）：以存储里的为准，删了就回到这个页面的缺省
  const onChanged = (changes, changedArea) => {
    if (changedArea !== area || !changes[key]) return;
    commit(pick(changes[key].newValue || {}));
  };
  if (storage) globalThis.chrome?.storage?.onChanged?.addListener(onChanged);

  return {
    key,
    async load() {
      if (!storage) return commit(saved, { notify: false });
      const stored = await storage.get(key);
      return commit(pick(stored?.[key] || {}), { notify: false });
    },
    get: () => current,
    async set(patch) {
      const next = commit({ ...saved, ...pick(patch) });
      if (storage) await storage.set({ [key]: saved });
      return next;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    destroy() {
      listeners.clear();
      if (storage) globalThis.chrome?.storage?.onChanged?.removeListener(onChanged);
    },
  };
}
