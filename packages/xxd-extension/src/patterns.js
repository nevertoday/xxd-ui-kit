// 插件专用的几个模式（展示站「模式」里有演示）：
//   bindPermission   需要权限：在用户点击时申请，拒绝了说清楚少了什么、怎么再开
//   mountShortcuts   快捷键：列出 manifest 里的 commands，一个按钮打开 chrome://extensions/shortcuts
//   exportSettings / importSettings   导入导出设置（JSON 文件）
//   showWhatsNew     更新说明：每个版本只出现一次的横幅
//   guardContext     「插件已更新，请刷新页面」：内容脚本里插件被更新 / 重新加载后，chrome.* 全部失效
// 没有 chrome.*（展示站、普通网页里预览）时都有演示行为，不报错。
import { uiLocale } from "./i18n.js";
import { xxd } from "./xxd.js";

const STRINGS = {
  "zh-CN": {
    granted: "已允许",
    denied: "没有允许：用不了这个功能。可以再点一次，或者在插件的详情页里打开。",
    shortcutNone: "没设置",
    shortcutEdit: "改快捷键",
    shortcutWhere: "快捷键在 chrome://extensions/shortcuts 里改",
    exported: "已导出设置，文件在下载里",
    exportSaved: "已导出设置",
    exportStarted: "已开始下载设置文件",
    exportFailed: "没有导出：读不到设置，可以重试",
    exportNotSaved: "没有导出：文件没有存下来，可以重试",
    imported: "已导入 {n} 项设置",
    importNone: "这个文件里没有可导入的设置",
    importFailed: "没有导入：写不进设置，原来的设置没动",
    importBad: "这个文件不是导出的设置",
    importUndo: "撤销",
    retry: "重试",
    importUndone: "已恢复导入前的设置",
    whatsNewClose: "知道了",
    reloadText: "插件刚更新过，刷新这个页面后才能继续用。",
    reloadAction: "刷新页面",
  },
  "zh-Hant": {
    granted: "已允許",
    denied: "沒有允許：用不了這個功能。可以再點一次，或者在擴充功能的詳細資料頁裡開啟。",
    shortcutNone: "未設定",
    shortcutEdit: "修改快捷鍵",
    shortcutWhere: "快捷鍵在 chrome://extensions/shortcuts 裡修改",
    exported: "已匯出設定，檔案在下載項目裡",
    exportSaved: "已匯出設定",
    exportStarted: "已開始下載設定檔",
    exportFailed: "沒有匯出：讀不到設定，可以重試",
    exportNotSaved: "沒有匯出：檔案沒有存下來，可以重試",
    imported: "已匯入 {n} 項設定",
    importNone: "這個檔案裡沒有可匯入的設定",
    importFailed: "沒有匯入：寫不進設定，原本的設定沒有變",
    importBad: "這個檔案不是匯出的設定",
    importUndo: "復原",
    retry: "重試",
    importUndone: "已恢復匯入前的設定",
    whatsNewClose: "知道了",
    reloadText: "擴充功能剛更新過，重新整理這個頁面後才能繼續使用。",
    reloadAction: "重新整理頁面",
  },
  en: {
    granted: "Allowed",
    denied: "Not allowed, so this feature can't work. Click again, or turn it on from the extension's details page.",
    shortcutNone: "Not set",
    shortcutEdit: "Change shortcuts",
    shortcutWhere: "Shortcuts are changed at chrome://extensions/shortcuts",
    exported: "Settings exported to your downloads",
    exportSaved: "Settings exported",
    exportStarted: "Settings download started",
    exportFailed: "Not exported: couldn't read the settings. You can retry.",
    exportNotSaved: "Not exported: the file wasn't saved. You can retry.",
    imported: "Imported {n} settings",
    importNone: "There are no settings to import in this file",
    importFailed: "Not imported: couldn't write the settings. Nothing changed.",
    importBad: "This file isn't exported settings",
    importUndo: "Undo",
    retry: "Retry",
    importUndone: "Settings restored to before the import",
    whatsNewClose: "Got it",
    reloadText: "The extension was just updated. Reload this page to keep using it.",
    reloadAction: "Reload page",
  },
};
const s = (key, vars, locale = uiLocale()) => {
  const text = (STRINGS[locale] ?? STRINGS.en)[key];
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? "")) : text;
};
const chromeApi = () => globalThis.chrome;
const toast = (msg, opts) => xxd()?.toast?.(msg, opts);

/** 焦点在 el 里、el 马上要被删掉或藏起来：交给 to（没有能聚焦的就让它 tabindex=-1），不掉到 body（D178）。 */
function keepFocus(el, to) {
  if (!to || !el.contains(el.ownerDocument.activeElement)) return;
  if (!to.matches("a[href], button:not([disabled]), input, select, textarea, [tabindex]")) to.tabIndex = -1;
  to.focus({ preventScroll: true });
}

/* ── 需要权限 ── */
/**
 * bindPermission(button, { permissions: ["tabs"], origins: ["https://*.example.com/*"], status, onChange })
 * 权限必须在用户点击里申请（Chrome 的要求）；已经有了就把按钮标成「已允许」并禁用。status 是旁边写结果的元素（role=status）。
 */
export async function bindPermission(button, { permissions = [], origins = [], status, onChange } = {}) {
  const api = chromeApi()?.permissions;
  const want = { permissions, origins };
  // 允许了不写 disabled：焦点留在按钮上（以前掉到 body，F8），aria-disabled 让读屏知道不用再点
  // 不能再点的原因就是「已允许」：连到 status 上（D181）
  if (status && !status.id) status.id = `xxd-perm-${Math.random().toString(36).slice(2, 8)}`;
  const show = (granted, denied = false) => {
    if (granted) button.setAttribute("aria-disabled", "true");
    else button.removeAttribute("aria-disabled");
    if (granted && status) button.setAttribute("aria-describedby", status.id);
    else if (status && button.getAttribute("aria-describedby") === status.id) button.removeAttribute("aria-describedby");
    button.setAttribute("aria-pressed", String(granted));
    if (status) status.textContent = granted ? s("granted") : denied ? s("denied") : "";
    onChange?.(granted);
  };
  if (api?.contains) show(await api.contains(want));
  button.addEventListener("click", async () => {
    if (button.getAttribute("aria-disabled") === "true") return;
    // 演示：没有 chrome.permissions 时假装用户同意了
    const granted = api?.request ? await api.request(want) : true;
    show(granted, !granted);
  });
}

/* ── 快捷键 ── */
/**
 * mountShortcuts(container, { names: { _execute_action: "打开侧边栏" } })
 * 列出 manifest 里的 commands（chrome.commands.getAll），最后一个按钮打开 chrome://extensions/shortcuts（快捷键只能在那里改）。
 */
export async function mountShortcuts(container, { names = {} } = {}) {
  const api = chromeApi()?.commands;
  const list = api?.getAll ? await api.getAll() : [{ name: "_execute_action", shortcut: "Alt+Shift+L", description: "" }, { name: "save", shortcut: "", description: "" }];
  const doc = container.ownerDocument;
  container.replaceChildren();
  for (const cmd of list) {
    const row = doc.createElement("div");
    row.className = "xxd-row";
    const text = doc.createElement("div");
    text.className = "xxd-row__text";
    const title = doc.createElement("div");
    title.className = "xxd-row__title";
    title.textContent = names[cmd.name] ?? cmd.description ?? cmd.name;
    text.append(title);
    const control = doc.createElement("div");
    control.className = "xxd-row__control";
    if (cmd.shortcut) {
      for (const [i, key] of cmd.shortcut.split("+").entries()) {
        if (i) control.append("+");
        const kbd = doc.createElement("kbd");
        kbd.className = "xxd-kbd";
        kbd.textContent = key;
        control.append(kbd);
      }
    } else {
      const none = doc.createElement("span");
      none.className = "xxd-text";
      none.dataset.variant = "secondary";
      none.textContent = s("shortcutNone");
      control.append(none);
    }
    row.append(text, control);
    container.append(row);
  }
  const edit = doc.createElement("div");
  edit.className = "xxd-row";
  const btn = doc.createElement("button");
  btn.className = "xxd-btn";
  btn.dataset.size = "sm";
  btn.type = "button";
  btn.textContent = s("shortcutEdit");
  btn.addEventListener("click", () => {
    if (chromeApi()?.tabs?.create) chromeApi().tabs.create({ url: "chrome://extensions/shortcuts" });
    // 不在插件里（展示站、普通网页）：打不开那一页，说一声在哪儿改，别点了没反应
    else toast(s("shortcutWhere"), { tone: "info" });
  });
  edit.append(btn);
  container.append(edit);
  return list;
}

/* ── 导入导出设置 ── */
const storageArea = (area) => chromeApi()?.storage?.[area] ?? null;

/* 把文件存下来，说的是知道的那么多（F14：以前下载还没开始就说「已导出」）：
 *   chrome.downloads（插件有 downloads 权限）：等下载真的完成才算存好，中断了算失败，用户在另存为里取消就算了；
 *   showSaveFilePicker（网页、没有 downloads 权限的插件页）：用户选好位置、写完才算存好，取消就算了；打不开（不在点击里、被策略禁了）退到下一条；
 *   都没有：交给浏览器下载（<a download>），拿不到结果，只能说「已开始下载」。
 * 返回 "saved"（在下载里）、"picked"（存在用户选的位置）、"started" 或 "cancelled"；存不下来就抛错。 */
function viaDownloads(api, url, filename) {
  return new Promise((resolve, reject) => {
    let id = null;
    const early = [];
    const stop = () => api.onChanged?.removeListener(listen);
    const settle = (delta) => {
      if (delta.id !== id) return;
      const state = delta.state?.current;
      if (state !== "complete" && state !== "interrupted") return;
      stop();
      const error = delta.error?.current;
      if (state === "complete") resolve("saved");
      else if (error === "USER_CANCELED") resolve("cancelled");
      else reject(new Error(error || "interrupted"));
    };
    // 小文件可能在 download() 回来之前就下完了：先听着，拿到 id 再对
    const listen = (delta) => (id === null ? early.push(delta) : settle(delta));
    api.onChanged?.addListener(listen);
    Promise.resolve(api.download({ url, filename, conflictAction: "uniquify" }))
      .then((got) => {
        if (got == null) throw new Error(chromeApi()?.runtime?.lastError?.message || "download failed");
        id = got;
        if (api.onChanged) early.splice(0).forEach(settle);
        else resolve("started");
      })
      .catch((error) => {
        stop();
        reject(error);
      });
  });
}

async function saveFile(text, filename) {
  const downloads = chromeApi()?.downloads;
  if (downloads?.download) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    try {
      return await viaDownloads(downloads, url, filename);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (typeof globalThis.showSaveFilePicker === "function") {
    let handle = null;
    try {
      handle = await globalThis.showSaveFilePicker({ suggestedName: filename, types: [{ description: "JSON", accept: { "application/json": [".json"] } }] });
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
    if (handle) {
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return "picked";
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "started";
}

/** 把这些键的设置存成 JSON 文件。keys 不写就是这个区域的全部。返回导出的内容；取消了、没存下来返回 null。 */
export async function exportSettings({ keys = null, area = "sync", filename = "settings.json" } = {}) {
  const retry = { label: s("retry"), onClick: () => exportSettings({ keys, area, filename }) };
  const storage = storageArea(area);
  let data;
  try {
    if (storage) data = await storage.get(keys);
    else data = Object.fromEntries((keys ?? Object.keys(localStorage)).map((k) => [k, localStorage.getItem(k)]));
  } catch {
    // 读不到（插件刚更新过、存储被禁用）：以前什么都不说，也没有文件（F14）
    toast(s("exportFailed"), { tone: "danger", action: retry });
    return null;
  }
  const file = { format: "xxd-settings", version: 1, exportedAt: new Date().toISOString(), data };
  let result;
  try {
    result = await saveFile(JSON.stringify(file, null, 2), filename);
  } catch {
    toast(s("exportNotSaved"), { tone: "danger", action: retry });
    return null;
  }
  if (result === "cancelled") return null;
  if (result === "started") toast(s("exportStarted"), { tone: "info" });
  else toast(s(result === "saved" ? "exported" : "exportSaved"), { tone: "success" });
  return file;
}

/** 读一个导出的 JSON 文件写回存储；只收 keys 里的（不写就全收）。返回写入了几项。 */
export async function importSettings(file, { keys = null, area = "sync" } = {}) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    parsed = null;
  }
  if (parsed?.format !== "xxd-settings" || typeof parsed.data !== "object") {
    toast(s("importBad"), { tone: "danger" });
    return 0;
  }
  const entries = Object.entries(parsed.data).filter(([k]) => !keys || keys.includes(k));
  // 一项都没有：不说「已导入 0 项」，也不给撤销（F14）
  if (!entries.length) {
    toast(s("importNone"), { tone: "warning" });
    return 0;
  }
  const storage = storageArea(area);
  const names = entries.map(([k]) => k);
  // 覆盖前先存一份，toast 里给「撤销」（ACCEPTANCE-REVIEW：以前直接覆盖，没有回头路）
  let before;
  try {
    before = storage ? await storage.get(names) : Object.fromEntries(names.filter((k) => localStorage.getItem(k) !== null).map((k) => [k, localStorage.getItem(k)]));
    if (storage) await storage.set(Object.fromEntries(entries));
    else for (const [k, v] of entries) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  } catch {
    // 写不进去（超出配额、插件刚更新过）：以前抛错没人接，用户以为导入了
    toast(s("importFailed"), { tone: "danger" });
    return 0;
  }
  const undo = async () => {
    const gone = names.filter((k) => !(k in before));
    if (storage) {
      if (gone.length) await storage.remove(gone);
      await storage.set(before);
    } else {
      gone.forEach((k) => localStorage.removeItem(k));
      for (const [k, v] of Object.entries(before)) localStorage.setItem(k, v);
    }
    toast(s("importUndone"), { tone: "success" });
  };
  toast(s("imported", { n: entries.length }), { tone: "success", action: { label: s("importUndo"), onClick: undo } });
  return entries.length;
}

/* ── 更新说明 ── */
/**
 * showWhatsNew(container, { version, notes: ["…", "…"], title })
 * 这个版本第一次打开时在 container 最上面放一条横幅（Banner），点「知道了」以后这个版本不再出现。
 * 版本缺省取 manifest 的 version；记在 chrome.storage.local（没有时用 localStorage）。
 */
export async function showWhatsNew(container, { version = chromeApi()?.runtime?.getManifest?.().version ?? "0.0.0", notes = [], title, key = "xxd-whats-new" } = {}) {
  const local = storageArea("local");
  const seen = local ? (await local.get(key))[key] : localStorage.getItem(key);
  if (seen === version || !notes.length) return null;
  const doc = container.ownerDocument;
  const banner = doc.createElement("div");
  banner.className = "xxd-banner";
  banner.dataset.tone = "info";
  banner.setAttribute("role", "status");
  const body = doc.createElement("div");
  if (title) {
    const h = doc.createElement("p");
    h.className = "xxd-banner__title";
    h.textContent = title;
    body.append(h);
  }
  const ul = doc.createElement("ul");
  ul.className = "xxd-banner__text xxd-banner__list";
  for (const n of notes) ul.append(Object.assign(doc.createElement("li"), { textContent: n }));
  body.append(ul);
  const close = doc.createElement("button");
  close.className = "xxd-btn";
  close.dataset.size = "sm";
  close.type = "button";
  close.textContent = s("whatsNewClose");
  close.addEventListener("click", async () => {
    if (local) await local.set({ [key]: version });
    else localStorage.setItem(key, version);
    // 横幅没了，焦点交给它后面的东西（或者放它的容器），不掉到 body（F9）
    const next = [...container.querySelectorAll("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])")].find((el) => !banner.contains(el));
    keepFocus(banner, next ?? container);
    banner.remove();
  });
  const actions = doc.createElement("div");
  actions.className = "xxd-banner__actions";
  actions.append(close);
  banner.append(body, actions);
  container.prepend(banner);
  return banner;
}

/* ── 插件已更新，请刷新页面 ── */
/** 内容脚本里：插件还活着吗（被更新、停用、重新加载以后 chrome.runtime.id 就没了）。 */
export const contextAlive = () => {
  try {
    return Boolean(chromeApi()?.runtime?.id);
  } catch {
    return false;
  }
};

/**
 * 包一层 chrome.* 调用：插件已经失效时不抛 "Extension context invalidated"，而是在 root（Shadow）里放一条
 * 「插件刚更新过，刷新这个页面」的横幅和刷新按钮。
 *   const safe = guardContext(ui.root);
 *   button.onclick = () => safe(() => chrome.runtime.sendMessage({ type: "save" }));
 */
export function guardContext(root, { onDead } = {}) {
  let shown = false;
  // 语言现在就定下来：插件失效以后 chrome.i18n 也问不到了（以前在这里再抛一次，横幅出不来）
  const locale = uiLocale();
  const showBanner = () => {
    if (shown) return;
    shown = true;
    onDead?.();
    const doc = root.ownerDocument || document;
    const banner = doc.createElement("div");
    banner.className = "xxd-banner";
    banner.dataset.tone = "warning";
    banner.setAttribute("role", "alert");
    const body = doc.createElement("div");
    const text = doc.createElement("p");
    text.className = "xxd-banner__text";
    text.textContent = s("reloadText", null, locale);
    body.append(text);
    const btn = doc.createElement("button");
    btn.className = "xxd-btn";
    btn.dataset.size = "sm";
    btn.dataset.variant = "primary";
    btn.type = "button";
    btn.textContent = s("reloadAction", null, locale);
    btn.addEventListener("click", () => globalThis.location?.reload());
    const actions = doc.createElement("div");
    actions.className = "xxd-banner__actions";
    actions.append(btn);
    banner.append(body, actions);
    (root.querySelector?.(".xxd-page") ?? root).prepend(banner);
    btn.focus({ preventScroll: true });
  };
  return async (fn) => {
    if (!contextAlive()) return showBanner();
    try {
      return await fn();
    } catch (err) {
      if (/context invalidated/i.test(String(err?.message))) return showBanner();
      throw err;
    }
  };
}
