import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createAppearanceStore } from "../src/settings.js";
import { mountXxdUI } from "../src/shadow.js";
import { applyI18n, t, uiLocale } from "../src/i18n.js";
import { bindPermission, exportSettings, guardContext, importSettings, showWhatsNew } from "../src/patterns.js";
import { adoptTokens, applyBlocks, buildExtension, create, docComponent, listComponents, dropDeclarations, findFallbackConflicts, status, sync, upsertRegion } from "../scripts/cli.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

function mockChrome() {
  const data = {};
  const listeners = new Set();
  globalThis.chrome = {
    storage: {
      sync: {
        get: vi.fn(async (key) => ({ [key]: data[key] })),
        set: vi.fn(async (obj) => {
          const changes = {};
          for (const [k, v] of Object.entries(obj)) {
            changes[k] = { oldValue: data[k], newValue: v };
            data[k] = v;
          }
          listeners.forEach((fn) => fn(changes, "sync"));
        }),
      },
      onChanged: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) },
    },
  };
  return { data, emit: (changes) => listeners.forEach((fn) => fn(changes, "sync")) };
}

afterEach(() => {
  delete globalThis.chrome;
  localStorage.clear();
  document.documentElement.removeAttribute("data-corners");
});

describe("createAppearanceStore", () => {
  it("从 chrome.storage 读、写镜像、应用到 <html>，默认直角", async () => {
    const { data } = mockChrome();
    data["demo-ui"] = { theme: "dark", accent: "#3b74b8" };
    const store = createAppearanceStore({ key: "demo-ui" });
    await store.load();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-corners")).toBe("square");
    expect(JSON.parse(localStorage.getItem("demo-ui")).accent).toBe("#3b74b8");
  });

  it("set 写 chrome.storage；别的页面改了也能收到", async () => {
    const { data, emit } = mockChrome();
    const store = createAppearanceStore({ key: "demo-ui" });
    await store.load();
    const seen = vi.fn();
    store.subscribe(seen);
    await store.set({ corners: "rounded" });
    expect(data["demo-ui"].corners).toBe("rounded");
    expect(document.documentElement.getAttribute("data-corners")).toBe("rounded");
    emit({ "demo-ui": { newValue: { corners: "square", theme: "light" } } });
    expect(document.documentElement.getAttribute("data-corners")).toBe("square");
    expect(seen).toHaveBeenCalled();
  });

  it("内容脚本里（有 chrome.runtime.id、页面不是 chrome-extension:）不写宿主网页的 localStorage，也不在宿主 window 上派发事件", async () => {
    mockChrome();
    globalThis.chrome.runtime = { id: "abc" };
    const heard = vi.fn();
    window.addEventListener("xxd:settings", heard);
    const store = createAppearanceStore({ key: "cs-ui", apply: false });
    await store.load();
    await store.set({ theme: "dark" });
    expect(localStorage.getItem("cs-ui")).toBeNull();
    expect(heard).not.toHaveBeenCalled();
    window.removeEventListener("xxd:settings", heard);
  });

  it("apply: false 时不碰页面", async () => {
    mockChrome();
    const store = createAppearanceStore({ key: "demo-ui", apply: false });
    await store.load();
    await store.set({ corners: "rounded" });
    expect(document.documentElement.getAttribute("data-corners")).toBeNull();
  });

  it("页面自己的缺省（侧边栏紧凑）不存进共享设置：设置页不会跟着变紧凑", async () => {
    const { data } = mockChrome();
    const panel = createAppearanceStore({ key: "d-ui", defaults: { density: "compact" } });
    await panel.load();
    await panel.set({ theme: "dark" });
    expect(data["d-ui"]).toEqual({ theme: "dark" });
    expect(JSON.parse(localStorage.getItem("d-ui"))).toEqual({ theme: "dark" });
    expect(panel.get().density).toBe("compact");
    const options = createAppearanceStore({ key: "d-ui" });
    await options.load();
    expect(options.get()).toMatchObject({ theme: "dark", density: "comfortable" });
  });

  it("别的页面把设置删了（导入后撤销）：回到这个页面的缺省，镜像也清掉", async () => {
    const { data, emit } = mockChrome();
    data["d-ui"] = { theme: "dark" };
    const store = createAppearanceStore({ key: "d-ui", defaults: { density: "compact" } });
    await store.load();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    emit({ "d-ui": { oldValue: { theme: "dark" }, newValue: undefined } });
    expect(store.get()).toMatchObject({ theme: "light", density: "compact" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("d-ui")).toBeNull();
  });

  it("快速连改两项：自己写入的回声晚到，不把第二项短暂改回去，也不多通知", async () => {
    const { data } = mockChrome();
    const late = [];
    const real = globalThis.chrome.storage.onChanged;
    // 回声延后到两次写入之后才到（真的 Chrome 里 onChanged 是异步的）
    const hold = new Set();
    globalThis.chrome.storage.onChanged = { addListener: (fn) => hold.add(fn), removeListener: (fn) => hold.delete(fn) };
    globalThis.chrome.storage.sync.set = vi.fn(async (obj) => {
      for (const [k, v] of Object.entries(obj)) {
        late.push({ [k]: { oldValue: data[k], newValue: v } });
        data[k] = v;
      }
    });
    const store = createAppearanceStore({ key: "q-ui" });
    await store.load();
    const seen = [];
    store.subscribe((s) => seen.push(`${s.theme}/${s.corners}`));
    await store.set({ theme: "dark" });
    await store.set({ corners: "rounded" });
    for (const c of late) hold.forEach((fn) => fn(c, "sync"));
    expect(seen).toEqual(["dark/square", "dark/rounded"]);
    expect(store.get()).toMatchObject({ theme: "dark", corners: "rounded" });
    globalThis.chrome.storage.onChanged = real;
  });

  it("两个页面：这一页还没收到另一页刚改的那一项，set 也不会把它冲掉", async () => {
    const { data } = mockChrome();
    const a = createAppearanceStore({ key: "two-ui" });
    await a.load();
    data["two-ui"] = { accent: "#3b74b8" }; // 另一页写的，这一页还没收到 onChanged
    await a.set({ theme: "dark" });
    expect(data["two-ui"]).toEqual({ theme: "dark", accent: "#3b74b8" });
  });

  it("内容脚本里 load 之前就 set：不把存着的其余几项清掉", async () => {
    const { data } = mockChrome();
    globalThis.chrome.runtime = { id: "abc" };
    data["cs2-ui"] = { theme: "dark", accent: "#3b74b8" };
    const store = createAppearanceStore({ key: "cs2-ui", apply: false });
    await store.set({ corners: "rounded" });
    expect(data["cs2-ui"]).toEqual({ theme: "dark", corners: "rounded", accent: "#3b74b8" });
  });

  it("写入失败（超出配额）：界面回到存储里真实的样子", async () => {
    const { data } = mockChrome();
    data["f-ui"] = { theme: "light" };
    const store = createAppearanceStore({ key: "f-ui" });
    await store.load();
    globalThis.chrome.storage.sync.set = vi.fn(async () => {
      throw new Error("QUOTA_BYTES_PER_ITEM quota exceeded");
    });
    await expect(store.set({ theme: "dark" })).rejects.toThrow(/quota/);
    expect(store.get().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("没有 chrome 时退回 localStorage", async () => {
    const store = createAppearanceStore({ key: "plain-ui" });
    await store.load();
    await store.set({ theme: "dark" });
    expect(JSON.parse(localStorage.getItem("plain-ui")).theme).toBe("dark");
  });
});

describe("mountXxdUI", () => {
  it("建 Shadow DOM、注入样式、外观写到 host", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    if (!globalThis.CSSStyleSheet.prototype.replaceSync) globalThis.CSSStyleSheet.prototype.replaceSync = function () {};
    const ui = await mountXxdUI(host, { cssText: ":host{--x:1}", settings: { theme: "dark", corners: "rounded" }, install: false });
    expect(ui.root).toBe(host.shadowRoot);
    expect(host.getAttribute("data-theme")).toBe("dark");
    expect(host.getAttribute("data-corners")).toBe("rounded");
    expect(document.documentElement.getAttribute("data-corners")).toBeNull();
    ui.destroy();
    expect(host.isConnected).toBe(false);
  });

  it("调用方写在 host 上的定位不被 all:initial 清掉（真实浏览器里由 site audit 的「冒烟」再查一遍）", async () => {
    const host = document.createElement("div");
    host.dataset.display = "block";
    host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000";
    document.body.append(host);
    const ui = await mountXxdUI(host, { cssText: ":host{}", install: false });
    const style = host.getAttribute("style");
    expect(style.indexOf("all")).toBeLessThan(style.indexOf("position"));
    expect(host.style.position).toBe("fixed");
    expect(host.style.zIndex).toBe("2147483000");
    expect(host.style.display).toBe("block");
    ui.destroy();
  });

  it("登记成默认浮层根（toast 不挂到宿主网页的 body）、host 上写 lang；destroy 后还原", async () => {
    const calls = [];
    globalThis.Xxd = { setDefaultLayerRoot: (r) => calls.push(r), defaultLayerRoot: () => calls.at(-1), install: () => {} };
    const host = document.createElement("div");
    document.body.append(host);
    const ui = await mountXxdUI(host, { cssText: ":host{}", locale: "en" });
    expect(calls[0]).toBe(ui.root);
    expect(host.getAttribute("lang")).toBe("en");
    ui.destroy();
    expect(calls.at(-1)).toBeNull();
    delete globalThis.Xxd;
  });
});

describe("操作之后焦点不掉、结果说实话（FEEDBACK-ALIGN-PLAN D178、D180）", () => {
  const toasts = [];
  const withToasts = () => {
    toasts.length = 0;
    globalThis.Xxd = { toast: (message, opts = {}) => toasts.push({ message, ...opts }) };
  };
  afterEach(() => {
    delete globalThis.Xxd;
    document.body.replaceChildren();
  });

  it("允许了权限：焦点还在按钮上，按钮说已允许、不能再点，原因连在按钮上（D181）", async () => {
    const button = Object.assign(document.createElement("button"), { textContent: "允许读取" });
    const status = document.createElement("p");
    document.body.append(button, status);
    await bindPermission(button, { permissions: ["tabs"], status });
    button.focus();
    button.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(document.getElementById(button.getAttribute("aria-describedby"))?.textContent).toBe(status.textContent);
    expect(status.textContent).not.toBe("");
  });

  it("更新说明点「知道了」：横幅没了，焦点交给后面的东西，不掉到 body", async () => {
    const box = document.createElement("div");
    const after = Object.assign(document.createElement("button"), { textContent: "下一项" });
    box.append(after);
    document.body.append(box);
    const banner = await showWhatsNew(box, { version: "9.9." + Math.random(), notes: ["一条"] });
    const close = banner.querySelector("button");
    close.focus();
    close.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(box.contains(banner)).toBe(false);
    expect(document.activeElement).toBe(after);
  });

  it("导入一个没有设置的文件：不说「已导入 0 项」，也不给撤销", async () => {
    withToasts();
    const file = { text: async () => JSON.stringify({ format: "xxd-settings", version: 1, data: {} }) };
    expect(await importSettings(file)).toBe(0);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].action).toBeUndefined();
    expect(toasts[0].message).not.toMatch(/0/);
  });

  it("写不进存储：说没有导入（出错的），不说已导入", async () => {
    withToasts();
    mockChrome();
    globalThis.chrome.storage.sync.set = vi.fn(async () => {
      throw new Error("QUOTA_BYTES quota exceeded");
    });
    const file = { text: async () => JSON.stringify({ format: "xxd-settings", version: 1, data: { "a-ui": { theme: "dark" } } }) };
    expect(await importSettings(file)).toBe(0);
    expect(toasts.map((t) => t.tone)).toEqual(["danger"]);
  });
});

describe("导出只在知道存好了才说「已导出」（FEEDBACK-ALIGN-PLAN F14）", () => {
  const toasts = [];
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const lang = document.documentElement.lang;
  const withChrome = (extra) => {
    mockChrome();
    Object.assign(globalThis.chrome, extra);
  };
  const fakeDownloads = (download) => {
    const listeners = new Set();
    return {
      api: { download: vi.fn(download), onChanged: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) } },
      emit: (delta) => listeners.forEach((fn) => fn(delta)),
      listening: () => listeners.size,
    };
  };
  const picker = (impl) => Object.defineProperty(globalThis, "showSaveFilePicker", { value: vi.fn(impl), configurable: true, writable: true });
  const clicks = [];
  const realClick = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, "click");
  afterEach(() => {
    delete globalThis.Xxd;
    delete globalThis.showSaveFilePicker;
    if (realClick) Object.defineProperty(HTMLAnchorElement.prototype, "click", realClick);
    else delete HTMLAnchorElement.prototype.click;
    document.documentElement.lang = lang;
  });
  const setup = (l = "zh-CN") => {
    toasts.length = 0;
    clicks.length = 0;
    document.documentElement.lang = l;
    globalThis.Xxd = { toast: (message, opts = {}) => toasts.push({ message, ...opts }) };
    HTMLAnchorElement.prototype.click = function () {
      clicks.push(this.download);
    };
  };

  it("chrome.downloads：下载真的完成才说已导出；还在下载时什么都不说", async () => {
    setup();
    const d = fakeDownloads(async () => 7);
    withChrome({ downloads: d.api });
    const job = exportSettings({ filename: "today.json" });
    await tick();
    expect(d.api.download).toHaveBeenCalledWith(expect.objectContaining({ filename: "today.json" }));
    expect(toasts).toEqual([]);
    d.emit({ id: 8, state: { current: "complete" } });
    d.emit({ id: 7, state: { current: "in_progress" } });
    await tick();
    expect(toasts).toEqual([]);
    d.emit({ id: 7, state: { current: "complete" } });
    expect((await job).format).toBe("xxd-settings");
    expect(toasts.map((t) => [t.message, t.tone])).toEqual([["已导出设置，文件在下载里", "success"]]);
    expect(d.listening()).toBe(0);
  });

  it("chrome.downloads：下载中断说没有导出、给重试，重试再下一次；用户自己取消什么都不说", async () => {
    setup();
    let n = 0;
    const d = fakeDownloads(async () => ++n);
    withChrome({ downloads: d.api });
    const job = exportSettings();
    await tick();
    d.emit({ id: 1, state: { current: "interrupted" }, error: { current: "FILE_NO_SPACE" } });
    expect(await job).toBeNull();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].tone).toBe("danger");
    expect(toasts[0].message).toMatch(/没有导出/);
    expect(toasts[0].action.label).toBe("重试");
    toasts[0].action.onClick();
    await tick();
    expect(d.api.download).toHaveBeenCalledTimes(2);
    d.emit({ id: 2, state: { current: "interrupted" }, error: { current: "USER_CANCELED" } });
    await tick();
    expect(toasts).toHaveLength(1);
  });

  it("chrome.downloads 开始不了（返回出错）：说没有导出、给重试", async () => {
    setup();
    const d = fakeDownloads(async () => {
      throw new Error("Invalid filename");
    });
    withChrome({ downloads: d.api });
    expect(await exportSettings()).toBeNull();
    expect(toasts.map((t) => [t.tone, !!t.action])).toEqual([["danger", true]]);
    expect(clicks).toEqual([]);
  });

  it("存储框：取消什么都不说；存好了说已导出（不说「在下载里」）；写不进去说没有导出、给重试", async () => {
    setup();
    picker(async () => {
      throw Object.assign(new Error("The user aborted a request."), { name: "AbortError" });
    });
    expect(await exportSettings()).toBeNull();
    expect(toasts).toEqual([]);
    expect(clicks).toEqual([]);

    const written = [];
    picker(async () => ({ createWritable: async () => ({ write: async (x) => written.push(x), close: async () => {} }) }));
    expect((await exportSettings()).format).toBe("xxd-settings");
    expect(JSON.parse(written[0]).format).toBe("xxd-settings");
    expect(toasts.map((t) => [t.message, t.tone])).toEqual([["已导出设置", "success"]]);

    toasts.length = 0;
    picker(async () => ({ createWritable: async () => ({ write: async () => { throw new Error("NoModificationAllowedError"); }, close: async () => {} }) }));
    expect(await exportSettings()).toBeNull();
    expect(toasts.map((t) => [t.tone, t.action?.label])).toEqual([["danger", "重试"]]);
    expect(toasts[0].message).not.toMatch(/已导出/);
  });

  it("什么都没有（普通网页）：只能交给浏览器下载，说已开始下载，不说已导出（三种语言）", async () => {
    for (const [l, word] of [["zh-CN", "已开始下载"], ["zh-Hant", "已開始下載"], ["en", "download started"]]) {
      setup(l);
      expect((await exportSettings({ filename: "today.json" })).format).toBe("xxd-settings");
      expect(clicks).toEqual(["today.json"]);
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toContain(word);
      expect(toasts[0].message).not.toMatch(/已导出|已匯出|exported/i);
      expect(toasts[0].tone).not.toBe("success");
    }
  });
});

describe("guardContext", () => {
  it("插件失效后（chrome.i18n 也会抛错）照样放出「请刷新」横幅，不把错误抛给调用方", async () => {
    let dead = false;
    const invalid = () => {
      throw new Error("Extension context invalidated.");
    };
    // 真浏览器里核对过：重新加载插件后 runtime.id 还在，chrome.storage / chrome.i18n 一调用就抛
    globalThis.chrome = { runtime: { id: "abc" }, i18n: { getMessage: (k) => (dead ? invalid() : k === "xxdLocale" ? "en" : "") } };
    const root = document.createElement("div");
    document.body.append(root);
    const safe = guardContext(root);
    expect(await safe(() => 1)).toBe(1);
    await expect(safe(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    dead = true;
    expect(await safe(invalid)).toBeUndefined();
    const banner = root.querySelector(".xxd-banner");
    expect(banner?.getAttribute("role")).toBe("alert");
    expect(banner?.textContent).toMatch(/Reload page/);
    expect(t("anything", undefined, { anything: "fallback" })).toBe("fallback");
    expect(uiLocale()).toMatch(/^(en|zh-CN|zh-Hant)$/);
    root.remove();
  });
});

describe("i18n", () => {
  it("没有 chrome.i18n 时用字典，支持 $1 替换", () => {
    expect(t("count", [3], { count: "今天还能写入 $1 篇" })).toBe("今天还能写入 3 篇");
    document.body.innerHTML = `<span data-i18n="hello"></span><input data-i18n-attr="placeholder:ph">`;
    applyI18n(document, { hello: "你好", ph: "搜索" });
    expect(document.querySelector("span").textContent).toBe("你好");
    expect(document.querySelector("input").placeholder).toBe("搜索");
    document.body.innerHTML = `<span data-i18n="missing">原文</span>`;
    applyI18n(document, {});
    expect(document.querySelector("span").textContent).toBe("原文");
  });

  it("语言只有一个来源：_locales 的 xxdLocale（Chrome 挑了哪份 messages.json 就是哪种）", () => {
    globalThis.chrome = { i18n: { getMessage: (k) => (k === "xxdLocale" ? "zh-Hant" : ""), getUILanguage: () => "ja" } };
    expect(uiLocale()).toBe("zh-Hant");
    globalThis.chrome = { i18n: { getMessage: () => "", getUILanguage: () => "ja" } };
    expect(uiLocale()).toBe("en");
  });

  it("UI 语言映射到三种", () => {
    expect(uiLocale("zh-TW")).toBe("zh-Hant");
    expect(uiLocale("zh-CN")).toBe("zh-CN");
    expect(uiLocale("en-US")).toBe("en");
  });
});

describe("CLI：new / sync / status", () => {
  it("缺省是最小的插件：合法的 MV3，三语齐全，没有登录、内容脚本和 WAR，vendor 拷好，没有残留占位符", async () => {
    await buildExtension();
    const base = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "xxd-cli-"));
    const dir = join(base, "demo");
    try {
      await create(dir, { name: "批量存图", nameEn: "Bulk Save", slug: "bulk-save" });
      const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
      expect(manifest.manifest_version).toBe(3);
      // 找不到用户语言时退回英文（日、德、法用户看到英文，而不是中文）
      expect(manifest.default_locale).toBe("en");
      expect(manifest.content_scripts).toBeUndefined();
      expect(manifest.web_accessible_resources).toBeUndefined();
      expect(manifest.action.default_popup).toBeUndefined();
      const locales = { zh_CN: "zh-CN", zh_TW: "zh-Hant", en: "en" };
      for (const [loc, tag] of Object.entries(locales)) {
        const msgs = JSON.parse(readFileSync(join(dir, "_locales", loc, "messages.json"), "utf8"));
        expect(msgs.appName.message).toBeTruthy();
        expect(msgs.xxdLocale.message).toBe(tag);
        expect(msgs.signinGoogle, "缺省不带登录").toBeUndefined();
      }
      expect(JSON.parse(readFileSync(join(dir, "_locales/zh_TW/messages.json"), "utf8")).appName.message).toBe("批量存圖");
      for (const f of ["tokens.css", "xxd.css", "xxd.shadow.css", "xxd.shadow.css.js", "xxd.js", "boot.js", "icons.js", "extension.js", "tokens.mjs", "VERSION", "LICENSE"]) {
        expect(existsSync(join(dir, "vendor/xxd", f)), f).toBe(true);
      }
      expect(existsSync(join(dir, "account-boot.js"))).toBe(false);
      expect(existsSync(join(dir, "content.js"))).toBe(false);
      const all = readdirSync(dir).filter((f) => /\.(html|js|json|css)$/.test(f)).map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
      expect(all).not.toMatch(/__[A-Z_]+__/);
      expect(all).not.toMatch(/(?:<!--|\/\/|\/\*)\s*\/?xxd:!?\w+/);
      expect(all).not.toMatch(/account|¥|signin/i);
      expect(all).toContain("bulk-save-ui");
      expect(status(dir).state).toBe("current");
      sync(dir, { quiet: true });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }, 60_000);

  it("--popup --content --account：各自的文件、manifest 和文案都加上", async () => {
    const base = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "xxd-cli-"));
    const dir = join(base, "full");
    try {
      await create(dir, { name: "网页摘录", nameEn: "Clipper", slug: "clipper", popup: true, content: "https://*.example.org/*", account: true });
      const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
      expect(manifest.action.default_popup).toBe("popup.html");
      expect(manifest.content_scripts[0].matches).toEqual(["https://*.example.org/*"]);
      expect(manifest.content_scripts[0].js.at(-1)).toBe("content.js");
      expect(manifest.content_scripts[0].js).toContain("vendor/xxd/xxd.shadow.css.js");
      expect(manifest.web_accessible_resources).toBeUndefined();
      for (const f of ["popup.html", "popup.js", "popup.css", "content.js", "account-boot.js"]) expect(existsSync(join(dir, f)), f).toBe(true);
      const msgs = JSON.parse(readFileSync(join(dir, "_locales/en/messages.json"), "utf8"));
      expect(msgs.popupOpenPanel && msgs.contentButton && msgs.signinGoogle).toBeTruthy();
      const bg = readFileSync(join(dir, "background.js"), "utf8");
      expect(bg).toContain("openPanelOnActionClick: false");
      expect(bg).not.toContain("openPanelOnActionClick: true");
      expect(readFileSync(join(dir, "sidepanel.html"), "utf8")).toContain("account-boot.js");
      expect(readFileSync(join(dir, "content.js"), "utf8")).not.toMatch(/__[A-Z_]+__/);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }, 60_000);

  it("--content 不写网址规则会提示", async () => {
    await expect(create(join(tmpdir(), "xxd-nope"), { name: "x", content: true })).rejects.toThrow(/网址规则/);
  });
});

describe("applyBlocks", () => {
  it("选了留下、没选删掉、xxd:!name 反过来；三种注释都认", () => {
    const text = "a\n<!-- xxd:acc -->\nA\n<!-- /xxd:acc -->\n// xxd:!pop\nB\n// /xxd:!pop\n/* xxd:pop */\nC\n/* /xxd:pop */\nz\n";
    expect(applyBlocks(text, { acc: true, pop: false })).toBe("a\nA\nB\nz\n");
    expect(applyBlocks(text, { acc: false, pop: true })).toBe("a\nC\nz\n");
  });
});

describe("upsertRegion", () => {
  it("第一次插在开头（@import 之后），再次运行替换同一段，不重复", () => {
    const css = `@import url("a.css");\n:root { --bg: #fff; }\n`;
    const once = upsertRegion(css, "@layer xxd.tokens { :root { --r-sm: 0px; } }");
    expect(once.indexOf("@import")).toBe(0);
    expect(once.indexOf("xxd:tokens:start")).toBeGreaterThan(once.indexOf("@import"));
    expect(once.indexOf("xxd:tokens:end")).toBeLessThan(once.indexOf("--bg"));
    const twice = upsertRegion(once, "@layer xxd.tokens { :root { --r-sm: 2px; } }");
    expect(twice.match(/xxd:tokens:start/g).length).toBe(1);
    expect(twice).toContain("--r-sm: 2px");
    expect(twice).not.toContain("--r-sm: 0px");
    expect(twice.endsWith(":root { --bg: #fff; }\n")).toBe(true);
  });

  it("标记里的说明文字变过（项目改名前写的 xxd-ui-ki）也认得出来：替换那一段，不重复", () => {
    const old = `/* xxd:tokens:start —— 由 xxd-ui-ki 生成（pnpm xxd sync），这一段请勿手改 */\n@layer xxd.tokens { :root { --r-sm: 0px; } }\n/* xxd:tokens:end */\n:root { --bg: #fff; }\n`;
    const next = upsertRegion(old, "@layer xxd.tokens { :root { --r-sm: 2px; } }");
    expect(next.match(/xxd:tokens:start/g).length).toBe(1);
    expect(next).toContain("xxd-ui-kit");
    expect(next).not.toContain("--r-sm: 0px");
    expect(next.endsWith(":root { --bg: #fff; }\n")).toBe(true);
  });
});

describe("老项目保护", () => {
  it("找出用了但没声明的令牌名，并能从 CSS 里去掉它们", () => {
    const base = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "xxd-legacy-"));
    try {
      mkdirSync(join(base, "public"));
      writeFileSync(join(base, "public/styles.css"), ":root{--bg:#fff}.a{color:var(--danger,#b91c1c)}.b{outline-color:var(--focus-ring, red)}.c{color:var(--bg)}");
      const found = findFallbackConflicts(base, ["--bg", "--danger", "--focus-ring", "--r-sm"]);
      expect(found.sort()).toEqual(["--danger", "--focus-ring"]);
      // 我们自己写进项目的文件（组件目录不叫 vendor、tokensTargets）声明了全部令牌，不能算项目自己的声明
      mkdirSync(join(base, "lib/xxd"), { recursive: true });
      writeFileSync(join(base, "lib/xxd/xxd.css"), ":root{--danger:#b42318;--focus-ring:#000}");
      writeFileSync(join(base, "theme.css"), ":root{--danger:#b42318;--focus-ring:#000}");
      expect(findFallbackConflicts(base, ["--danger", "--focus-ring"], { skip: ["lib/xxd", "theme.css"] }).sort()).toEqual(["--danger", "--focus-ring"]);
      const css = ":root {\n  --danger: #b42318;\n  --danger-rgb: 1, 2, 3;\n  --r-sm: 0px;\n}";
      expect(dropDeclarations(css, found)).toBe(":root {\n  --danger-rgb: 1, 2, 3;\n  --r-sm: 0px;\n}");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});

describe("ls / doc", () => {
  it("列出原生和 React 组件；doc 给出类名、示例和规则", () => {
    const list = listComponents();
    expect(list).toContain("Dialog");
    expect(list).toContain("React 组件");
    const doc = docComponent("dialog");
    expect(doc).toContain("ui-dialog-cancel");
    expect(doc).toContain("取消在前");
    expect(docComponent("Button", { react: true })).toContain('import { Button } from "@xxd/react"');
    expect(() => docComponent("Nope")).toThrow();
  });
});

describe("adopt", () => {
  it("只删亮暗都相同的声明；亮色同而暗色不同的保留；旧名改别名；令牌区域不动", async () => {
    const { parseBlocks } = await import("../../xxd-tokens/scripts/build.mjs");
    const tokensCss = `:root {\n  --bg: #fcfcfc;\n  --paper: #ffffff;\n  --r-md: 0px;\n  --z-popover: 50;\n}\n:root[data-theme="dark"] {\n  --bg: #171612;\n  --paper: #201f1a;\n}`;
    const legacy = `/* xxd:tokens:start */\n:where(:root){--bg:#fcfcfc}\n/* xxd:tokens:end */\n:root {\n  --bg: #fcfcfc;\n  --paper: #ffffff;\n  --z-popover: 50;\n  --ui-radius: 0;\n  --own: 1px;\n}\n.x { color: red; }\n:root[data-theme="dark"] {\n  --bg: #171612;\n  --paper: #222222;\n}\n`;
    const r = adoptTokens(legacy, { tokensCss, parseBlocks, aliases: { "--ui-radius": "var(--r-md)" } });
    expect(r.removed.sort()).toEqual(["--bg", "--z-popover"]);
    expect(r.aliased).toEqual(["--ui-radius"]);
    expect(r.css).toContain("--paper: #ffffff;");
    expect(r.css).toContain("--paper: #222222;");
    expect(r.css).toContain("--ui-radius: var(--r-md);");
    expect(r.css).toContain("--own: 1px;");
    expect(r.css).toContain(":where(:root){--bg:#fcfcfc}");
    expect(r.css.split(":root[data-theme").pop()).not.toContain("--bg");
  });
});
