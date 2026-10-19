// @xxd/css 行为层：每个组件一个小模块，没有依赖。没有 JS 时组件也能看、基础功能能用。
//   ESM： import { install, toast, confirmDialog } from "@xxd/css";
//   经典脚本：<script src="vendor/xxd/xxd.js"></script> → window.Xxd，DOM 就绪后自动 install(document)
//   Shadow DOM：Xxd.install(shadowRoot)
import { byId, closestFrom } from "./dom.js";
import { installDialogs } from "./dialog.js";
import { initMenus, installMenus } from "./menu.js";
import { initChoices, installChoices } from "./choice.js";
import { installCopy, installToasts, installTooltips } from "./feedback.js";
import { installLayers } from "./layers.js";
import { initComboboxes, installComboboxes, installTagInputs } from "./inputs.js";
import { initPickers, installPickers, installSecrets } from "./picker.js";
import { initStructure, installStructure } from "./structure.js";
import { initData, installData } from "./data.js";
import { installDrawerSwipe } from "./layers.js";
import { initSortable, installAuth, installConfirmTwice, installSortable } from "./patterns.js";
import { initGauges, initSparklines } from "./chart.js";
import { installAnnouncer } from "./announce.js";
import { collect } from "./lifecycle.js";

export { openDialog, closeDialog, confirmDialog, confirmDelete } from "./dialog.js";
export { toggleSidebar, collapseBreadcrumbs, spyToc, watchTabsOverflow } from "./structure.js";
export { renderPagination, pageList, syncSelectAll, syncRangePair, highlight, highlightText } from "./data.js";
export { showFloating, hideFloating, openSubmenu, closeSubmenu } from "./menu.js";
export { openPicker, closePicker, choose as choosePickerOption } from "./picker.js";
export { place } from "./floating.js";
export { selectTab, selectRadio, moveInk } from "./choice.js";
export { toast, copyText, showTooltip, hideTooltip, showBubble, runBusy } from "./feedback.js";
export { openSheet, closeSheet, openPanel, closePanel, openLayer, closeLayer } from "./layers.js";
export { bindSearch, markMatches, clearMarks, addTag, tagValues, openCommandPalette, bindCommandPalette, setFieldError } from "./inputs.js";
export { mountAppearance, APPEARANCE_LABELS } from "./appearance.js";
export { chartTokens, chartPalette, chartOptions, watchChartTheme, sparkline, initSparklines, gauge, initGauges, gaugeOptionsFrom, useGauge } from "./chart.js";
export { bindDrop, openViewer, flip, setStatus, rollText, celebrate, filterSettings, bindSettingsSearch } from "./patterns.js";
export { ICON } from "./icons-min.js";
export { setLocale, getLocale, resolveLocale, t } from "./i18n.js";
export { layerRoot, setDefaultLayerRoot, defaultLayerRoot } from "./dom.js";
export { announce } from "./announce.js";

const installed = new WeakMap(); // root → AbortController
// 写在 root 上（不是模块里）：同一页面同时加载了经典脚本 xxd.js 和 ESM 两份时，第二份认得出来，不重复装
const MARK = Symbol.for("xxd.installed");
let warnedTwice = false;

let iconsImpl = null;
/** 图标渲染用哪份 @xxd/icons：ESM 项目 useIcons(await import("@xxd/icons"))；经典脚本自动用 window.XxdIcons。 */
export function useIcons(icons) {
  iconsImpl = icons || null;
}
const iconLib = () => iconsImpl ?? globalThis.XxdIcons ?? null;
let warnedIcons = false;

/**
 * 在 root（document 或 ShadowRoot）上装好事件委托，并初始化已有的 tabs / 分段 / combobox。可重复调用。
 * options.signal：abort 时等于 uninstall(root)；options.icons：同 useIcons。
 */
export function install(root = document, { signal, icons } = {}) {
  if (icons) useIcons(icons);
  if (!installed.has(root) && root[MARK]) {
    if (!warnedTwice) console.warn("[xxd] 这个页面加载了两份 @xxd/css（经典脚本 xxd.js 和 ESM 各一份？），只用先装上的那一份");
    warnedTwice = true;
    return root;
  }
  if (!installed.has(root)) {
    const controller = new AbortController();
    installed.set(root, controller);
    root[MARK] = true;
    if (signal?.aborted) queueMicrotask(() => uninstall(root));
    else signal?.addEventListener("abort", () => uninstall(root), { once: true });
    collect(controller.signal, () => installAll(root), root);
  }
  collect(installed.get(root).signal, () => init(root), root);
  return root;
}

/** 撤掉 install(root) 装的监听和观察者（插件把注入的界面拿掉时用）。之后可以再 install。 */
export function uninstall(root = document) {
  const controller = installed.get(root);
  if (!controller) return;
  installed.delete(root);
  delete root[MARK];
  controller.abort();
}

function installAll(root) {
  installAnnouncer(root);
  installDialogs(root, byId, closestFrom);
  installMenus(root, byId, closestFrom);
  installChoices(root, closestFrom);
  installTooltips(root, closestFrom);
  installToasts(root);
  installCopy(root, closestFrom);
  installLayers(root, byId, closestFrom);
  installTagInputs(root, closestFrom);
  installComboboxes(root, closestFrom);
  installPickers(root, closestFrom);
  installSecrets(root, closestFrom);
  installStructure(root, byId, closestFrom);
  installData(root, closestFrom);
  installDrawerSwipe(root, closestFrom);
  installSortable(root, closestFrom);
  installConfirmTwice(root, closestFrom);
  installAuth(root, closestFrom);
}

/** 新插入的内容里有 tabs / 分段 / combobox 时调用（事件委托不需要重新绑）。 */
export function init(root = document) {
  initChoices(root);
  initComboboxes(root);
  initPickers(root);
  initStructure(root);
  initData(root);
  initSparklines(root);
  initGauges(root);
  initMenus(root);
  initSortable(root);
  const lib = iconLib();
  if (lib?.hydrateIcons) lib.hydrateIcons(root);
  else if (!warnedIcons && root.querySelector?.("[data-xxd-icon]")) {
    warnedIcons = true;
    console.warn('[xxd] 页面里有 data-xxd-icon，但没有图标库：经典脚本先加载 icons.js；ESM 里 useIcons(await import("@xxd/icons"))');
  }
}
