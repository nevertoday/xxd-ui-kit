// 行为测试（happy-dom）。
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as Xxd from "../src/js/index.js";
import { applySettings, watchPrint } from "../../xxd-tokens/src/theme.js";

beforeAll(() => Xxd.install(document));
afterEach(() => {
  document.body.innerHTML = "";
});

const html = (s) => {
  document.body.insertAdjacentHTML("beforeend", s);
  Xxd.init(document);
};
const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
// 播报是延迟写进去的（先清空再写）：等到文字出现，最多 2 秒（机器忙的时候 1 秒偶尔不够）
const until = async (fn, ms = 2000) => {
  const t0 = Date.now();
  while (!fn() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 10));
};

describe("confirmDialog", () => {
  it("取消在前、主操作在后；点主操作 resolve(true)", async () => {
    if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    const p = Xxd.confirmDialog({ title: "删除这条记录？", message: "删除后不能恢复。", confirmLabel: "删除", tone: "danger" });
    const dialog = document.querySelector("dialog.xxd-dialog");
    const buttons = [...dialog.querySelectorAll(".xxd-dialog__actions button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["取消", "删除"]);
    expect(buttons[0].classList.contains("ui-dialog-cancel")).toBe(true);
    expect(buttons[1].dataset.variant).toBe("danger");
    dialog.close("confirm");
    await expect(p).resolves.toBe(true);
  });

  it("关闭 = 取消", async () => {
    const p = Xxd.confirmDialog({ title: "继续？" });
    document.querySelector("dialog").close("cancel");
    await expect(p).resolves.toBe(false);
  });
});

describe("tabs", () => {
  it("点击和方向键切换，面板跟着显示，派发 xxd:change", () => {
    html(`<div class="xxd-tabs" data-xxd-tabs>
      <button role="tab" id="t1" aria-controls="p1" data-value="write" aria-selected="true">写作</button>
      <button role="tab" id="t2" aria-controls="p2" data-value="history">记录</button>
    </div><div id="p1">A</div><div id="p2">B</div>`);
    const list = document.querySelector("[data-xxd-tabs]");
    const [t1, t2] = list.querySelectorAll('[role="tab"]');
    expect(document.getElementById("p2").hidden).toBe(true);
    expect(list.querySelector(".xxd-tabs__ink")).toBeTruthy();
    const onChange = vi.fn();
    list.addEventListener("xxd:change", (e) => onChange(e.detail.value));
    t2.click();
    expect(t2.getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("p1").hidden).toBe(true);
    expect(onChange).toHaveBeenCalledWith("history");
    key(t2, "ArrowRight");
    expect(t1.getAttribute("aria-selected")).toBe("true");
    expect(t1.tabIndex).toBe(0);
    expect(t2.tabIndex).toBe(-1);
  });
});

describe("分段控件", () => {
  it("选中项 aria-checked，方向键移动", () => {
    html(`<div class="xxd-segmented" data-xxd-segmented><button role="radio" data-value="light">亮</button><button role="radio" data-value="dark">暗</button></div>`);
    const [a, b] = document.querySelectorAll('[role="radio"]');
    expect(a.getAttribute("aria-checked")).toBe("true");
    b.click();
    expect(b.getAttribute("aria-checked")).toBe("true");
    expect(a.getAttribute("aria-checked")).toBe("false");
    key(b, "ArrowLeft");
    expect(a.getAttribute("aria-checked")).toBe("true");
  });
});

describe("toast", () => {
  it("within 时出现在容器里（就地反馈）；念出来走常驻的播报区，错误用 assertive 并加「错误：」", async () => {
    html(`<aside id="panel"></aside>`);
    const panel = document.getElementById("panel");
    Xxd.toast("已保存", { tone: "success", within: panel, duration: 0 });
    const region = panel.querySelector(".xxd-toast-region");
    expect(region?.hasAttribute("data-scoped")).toBe(true);
    expect(region.getAttribute("role")).toBe("region");
    expect(region.textContent).toContain("已保存");
    // 播报区在 install 时就建好了（不是和内容一起插进去）
    const polite = document.querySelector('.xxd-announcer[role="status"]');
    const assertive = document.querySelector('.xxd-announcer[role="alert"]');
    expect(polite && assertive).toBeTruthy();
    await until(() => polite.textContent === "已保存");
    expect(polite.textContent).toBe("已保存");
    Xxd.toast("写入失败", { tone: "danger", within: panel, duration: 0 });
    await until(() => assertive.textContent === "错误：写入失败");
    expect(assertive.textContent).toBe("错误：写入失败");
  });
});

describe("sheet", () => {
  it("打开时 dock 主操作隐藏标记、Esc 关闭、焦点回到按钮", () => {
    html(`<div class="xxd-sheet-host">
      <div class="xxd-scrim"></div>
      <section class="xxd-sheet" id="s1"><button id="inside">x</button></section>
      <footer class="xxd-dock"><button id="opener" data-xxd-sheet-open="s1">封面</button></footer>
    </div>`);
    const opener = document.getElementById("opener");
    opener.focus();
    opener.click();
    const sheet = document.getElementById("s1");
    expect(sheet.hasAttribute("data-open")).toBe(true);
    expect(document.querySelector(".xxd-sheet-host").hasAttribute("data-sheet-open")).toBe(true);
    key(document.getElementById("inside"), "Escape");
    expect(sheet.hasAttribute("data-open")).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it("sheet / 面板是模态：role=dialog + aria-modal，外面的东西 inert，关掉后还原", () => {
    html(`<main id="page"><button id="p-open" data-xxd-panel-open="pd">详情</button></main>
      <div class="xxd-panel" id="pd" aria-labelledby="pd-t"><h2 id="pd-t">详情</h2><button data-xxd-panel-close>关闭</button></div>`);
    const panel = document.getElementById("pd");
    document.getElementById("p-open").click();
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById("page").hasAttribute("inert")).toBe(true);
    // 播报区不能被 inert（不然打开面板时什么都念不出来）
    for (const a of document.querySelectorAll(".xxd-announcer")) expect(a.hasAttribute("inert")).toBe(false);
    panel.querySelector("[data-xxd-panel-close]").click();
    expect(document.getElementById("page").hasAttribute("inert")).toBe(false);
    expect(panel.hasAttribute("aria-modal")).toBe(false);
  });
});

describe("标签输入", () => {
  it("回车添加、去重、退格删除最后一个", () => {
    html(`<div class="xxd-taginput" data-xxd-taginput><input></div>`);
    const box = document.querySelector(".xxd-taginput");
    const input = box.querySelector("input");
    input.value = "海报";
    key(input, "Enter");
    input.value = "海报";
    key(input, "Enter");
    input.value = "封面";
    key(input, ",");
    expect(Xxd.tagValues(box)).toEqual(["海报", "封面"]);
    key(input, "Backspace");
    expect(Xxd.tagValues(box)).toEqual(["海报"]);
  });
});

describe("combobox", () => {
  it("输入过滤，方向键 + 回车选择", () => {
    html(`<div data-xxd-combobox><input class="xxd-input"><ul class="xxd-listbox">
      <li class="xxd-option" data-value="x">X 蓝</li><li class="xxd-option" data-value="lake">湖蓝</li><li class="xxd-option" data-value="moss">苔绿</li>
    </ul></div>`);
    const wrap = document.querySelector("[data-xxd-combobox]");
    const input = wrap.querySelector("input");
    expect(input.getAttribute("role")).toBe("combobox");
    input.value = "蓝";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const visible = [...wrap.querySelectorAll(".xxd-option")].filter((o) => !o.hidden).map((o) => o.dataset.value);
    expect(visible).toEqual(["x", "lake"]);
    key(input, "ArrowDown");
    key(input, "ArrowDown");
    key(input, "Enter");
    expect(wrap.dataset.value).toBe("lake");
    expect(input.value).toBe("湖蓝");
  });
});

describe("搜索高亮", () => {
  it("markMatches 包裹匹配文字，clearMarks 还原", () => {
    html(`<div id="r"><p>暗色主题</p><p>主题与圆角</p></div>`);
    const r = document.getElementById("r");
    expect(Xxd.markMatches(r, "主题")).toBe(2);
    expect(r.querySelectorAll("mark.xxd-hit").length).toBe(2);
    Xxd.clearMarks(r);
    expect(r.querySelectorAll("mark").length).toBe(0);
    expect(r.textContent).toBe("暗色主题主题与圆角");
  });
});

describe("外观设置组", () => {
  it("渲染主题 / 圆角 / 主色；改动通过 set 写出；lockCorners 时没有圆角行", () => {
    let state = { theme: "light", corners: "square", accent: "" };
    const set = vi.fn((patch) => (state = { ...state, ...patch }));
    const presets = [{ id: "", name: "Ink", zh: "墨色" }, { id: "#3b74b8", name: "Lake blue", zh: "湖蓝" }];
    const host = document.createElement("div");
    document.body.append(host);
    Xxd.mountAppearance(host, { get: () => state, set, presets });
    Xxd.init(host);
    const sw = host.querySelector(".xxd-switch");
    sw.checked = true;
    sw.dispatchEvent(new Event("change", { bubbles: true }));
    expect(set).toHaveBeenCalledWith({ corners: "rounded" });
    host.querySelector('.xxd-swatch[data-value="#3b74b8"]').click();
    expect(state.accent).toBe("#3b74b8");
    // 色块是一组单选：← 回到墨色，Tab 只停在选中的那一个
    const lake = host.querySelector('.xxd-swatch[data-value="#3b74b8"]');
    key(lake, "ArrowLeft");
    expect(state.accent).toBe("");
    expect([...host.querySelectorAll(".xxd-swatch")].map((b) => b.tabIndex)).toEqual([0, -1]);
    host.querySelector('[data-name="theme"] [data-value="dark"]').click();
    expect(state.theme).toBe("dark");

    const locked = document.createElement("div");
    Xxd.mountAppearance(locked, { get: () => state, set, presets, lockCorners: true, locale: "en" });
    expect(locked.querySelector(".xxd-switch")).toBeNull();
    expect(locked.querySelector(".xxd-group__title").textContent).toBe("Appearance");
  });
});

describe("复制", () => {
  it("[data-copy] 写入剪贴板并短暂显示完成", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    html(`<button data-copy="hello">${Xxd.ICON.copy(16)}</button>`);
    document.querySelector("[data-copy]").click();
    await new Promise((r) => setTimeout(r, 0));
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(document.querySelector("[data-copy]").hasAttribute("data-done")).toBe(true);
  });
});

describe("O1 交互基础层", () => {
  it("sheet 打开时 Tab 在里面循环（焦点陷阱）", () => {
    html(`<div class="xxd-sheet-host"><div class="xxd-scrim"></div>
      <section class="xxd-sheet" id="s9"><button id="a">a</button><button id="b">b</button></section>
      <footer><button id="open9" data-xxd-sheet-open="s9">open</button></footer></div>`);
    for (const el of document.querySelectorAll("button")) el.getClientRects = () => [{}];
    document.getElementById("open9").click();
    const b = document.getElementById("b");
    b.focus();
    const ev = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    b.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(document.activeElement.id).toBe("a");
    Xxd.closeSheet(document.getElementById("s9"));
  });

  it("tooltip 组：刚关掉 300ms 内显示下一个是立即的（data-instant）", () => {
    html(`<button id="t1" data-tooltip="一">1</button><button id="t2" data-tooltip="二">2</button>`);
    Xxd.showTooltip(document.getElementById("t1"));
    const tip = document.querySelector(".xxd-tooltip");
    expect(tip.hasAttribute("data-instant")).toBe(false);
    Xxd.hideTooltip();
    Xxd.showTooltip(document.getElementById("t2"));
    expect(tip.hasAttribute("data-instant")).toBe(true);
    expect(tip.textContent).toBe("二");
    Xxd.hideTooltip();
  });

  it("runBusy：进行中 aria-busy，完成后图标变勾", async () => {
    html(`<button class="xxd-btn" id="rb">${Xxd.ICON.copy(16)}保存</button>`);
    const btn = document.getElementById("rb");
    let resolve;
    const p = Xxd.runBusy(btn, () => new Promise((r) => (resolve = r)));
    expect(btn.getAttribute("aria-busy")).toBe("true");
    resolve(42);
    await expect(p).resolves.toBe(42);
    expect(btn.hasAttribute("aria-busy")).toBe(false);
    expect(btn.hasAttribute("data-done")).toBe(true);
    expect(btn.innerHTML).toContain("m6 12 4 4 8-8");
  });

  it("菜单：鼠标移进哪一项，焦点就在哪一项（只有一个高亮）", () => {
    html(`<div class="xxd-menu" role="menu"><button class="xxd-menu__item" role="menuitem" id="m1">一</button><button class="xxd-menu__item" role="menuitem" id="m2">二</button></div>`);
    document.getElementById("m2").dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
    expect(document.activeElement.id).toBe("m2");
  });

  it("place 写出缩放原点和箭头位置", () => {
    html(`<button id="anc">a</button><div id="fl" style="position:fixed"></div>`);
    const anc = document.getElementById("anc");
    const fl = document.getElementById("fl");
    anc.getBoundingClientRect = () => ({ left: 100, right: 140, top: 50, bottom: 70, width: 40, height: 20 });
    fl.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 100, width: 200, height: 100 });
    Xxd.place(anc, fl, { placement: "bottom-start" });
    expect(fl.dataset.side).toBe("bottom");
    expect(fl.style.getPropertyValue("--xxd-origin")).toBe("20px 0");
    expect(fl.style.getPropertyValue("--xxd-arrow-x")).toBe("20px");
  });
});

describe("O2 组件", () => {
  const pickerHtml = (multi = "") => `<div class="xxd-picker" data-xxd-picker ${multi} data-placeholder="请选择">
    <button class="xxd-picker__trigger"><span class="xxd-picker__value"></span></button>
    <div class="xxd-listbox">
      <div class="xxd-option" data-value="high"><span>高<small>2K，慢一点</small></span></div>
      <div class="xxd-option" data-value="std">标准</div>
      <div class="xxd-option" data-value="no" aria-disabled="true">不可选</div>
    </div></div>`;

  it("Picker：点开、选择、派发 xxd:change、显示选中的字", () => {
    html(pickerHtml());
    const picker = document.querySelector("[data-xxd-picker]");
    const trigger = picker.querySelector(".xxd-picker__trigger");
    expect(picker.querySelector(".xxd-picker__value").textContent).toBe("请选择");
    const seen = vi.fn();
    picker.addEventListener("xxd:change", (e) => seen(e.detail.value));
    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    picker.querySelector('[data-value="std"]').click();
    expect(seen).toHaveBeenCalledWith("std");
    expect(picker.dataset.value).toBe("std");
    expect(picker.querySelector(".xxd-picker__value").textContent).toBe("标准");
    picker.querySelector(".xxd-picker__trigger").click();
    picker.querySelector('[data-value="high"]').click();
    expect(picker.querySelector(".xxd-picker__value").textContent).toBe("高");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("Picker：键盘 ↓ 打开、跳过禁用项、Enter 选择；多选不关", () => {
    html(pickerHtml("data-multiple"));
    const picker = document.querySelector("[data-xxd-picker]");
    const trigger = picker.querySelector(".xxd-picker__trigger");
    key(trigger, "ArrowDown");
    expect(picker.querySelector(".xxd-listbox").hidden).toBe(false);
    key(trigger, "Enter");
    key(trigger, "ArrowDown");
    key(trigger, "ArrowDown");
    expect(picker.querySelector(".xxd-option[data-active]").dataset.value).toBe("high");
    key(trigger, "ArrowDown");
    key(trigger, "Enter");
    expect(picker.dataset.value).toBe("high,std");
    expect(picker.querySelector(".xxd-listbox").hidden).toBe(false);
  });

  it("密钥输入：显示 / 隐藏切换 type 和 aria-pressed", () => {
    html(`<div class="xxd-input-group xxd-secret" data-xxd-secret><input type="password" value="sk_1"><button data-secret-toggle aria-label="显示密钥"></button></div>`);
    const btn = document.querySelector("[data-secret-toggle]");
    btn.click();
    expect(document.querySelector("input").type).toBe("text");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    // 名字固定，状态只靠 aria-pressed（不会念成「隐藏，已按下」）
    expect(btn.getAttribute("aria-label")).toBe("显示密钥");
    btn.click();
    expect(document.querySelector("input").type).toBe("password");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(btn.getAttribute("aria-label")).toBe("显示密钥");
  });

  it("Toast：同一句话不重复加，只动一下；多张时写出叠放序号", () => {
    html(`<aside id="tp"></aside>`);
    const within = document.getElementById("tp");
    Xxd.toast("已保存", { within, duration: 0 });
    Xxd.toast("已保存", { within, duration: 0 });
    expect(within.querySelectorAll(".xxd-toast").length).toBe(1);
    expect(within.querySelector(".xxd-toast").hasAttribute("data-bump")).toBe(true);
    Xxd.toast("第二条", { within, duration: 0 });
    Xxd.toast("第三条", { within, duration: 0 });
    Xxd.toast("第四条", { within, duration: 0 });
    const list = [...within.querySelectorAll(".xxd-toast")];
    expect(list.map((t) => t.style.getPropertyValue("--i"))).toEqual(["3", "2", "1", "0"]);
    expect(list[0].hasAttribute("data-hidden-in-stack")).toBe(true);
  });

  it("菜单：单选组互斥；→ 打开子菜单并聚焦第一项，← 回到父项", () => {
    html(`<div class="xxd-menu" id="pm" role="menu">
      <button class="xxd-menu__item" role="menuitem" id="ex" data-submenu="sm">导出为</button>
      <div class="xxd-menu" id="sm" role="menu"><button class="xxd-menu__item" role="menuitem" id="md">Markdown</button></div>
      <div role="group"><button class="xxd-menu__item" role="menuitemradio" aria-checked="true" id="r1">新</button><button class="xxd-menu__item" role="menuitemradio" aria-checked="false" id="r2">旧</button></div>
    </div>`);
    document.getElementById("r2").click();
    expect(document.getElementById("r1").getAttribute("aria-checked")).toBe("false");
    expect(document.getElementById("r2").getAttribute("aria-checked")).toBe("true");
    const ex = document.getElementById("ex");
    ex.focus();
    key(ex, "ArrowRight");
    expect(ex.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement.id).toBe("md");
    key(document.getElementById("md"), "ArrowLeft");
    expect(ex.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement.id).toBe("ex");
  });
});

describe("O3 组件", () => {
  it("表格：全选 / 半选、排序派发 xxd:sort", () => {
    html(`<table class="xxd-table"><thead><tr><th><input type="checkbox" data-select-all></th><th aria-sort="none" data-key="name"><button class="xxd-th-sort">名</button></th></tr></thead>
      <tbody><tr><td><input type="checkbox" data-select-row></td></tr><tr><td><input type="checkbox" data-select-row></td></tr></tbody></table>`);
    const all = document.querySelector("[data-select-all]");
    const rows = document.querySelectorAll("[data-select-row]");
    rows[0].checked = true;
    rows[0].dispatchEvent(new Event("change", { bubbles: true }));
    expect(all.indeterminate).toBe(true);
    all.checked = true;
    all.dispatchEvent(new Event("change", { bubbles: true }));
    expect([...rows].every((r) => r.checked)).toBe(true);
    expect(all.indeterminate).toBe(false);
    const seen = vi.fn();
    document.querySelector("table").addEventListener("xxd:sort", (e) => seen(e.detail));
    document.querySelector(".xxd-th-sort").click();
    expect(seen).toHaveBeenCalledWith({ key: "name", direction: "ascending" });
    document.querySelector(".xxd-th-sort").click();
    expect(document.querySelector("th[data-key]").getAttribute("aria-sort")).toBe("descending");
  });

  it("分页：页码列表带省略、点击翻页、信息行", () => {
    expect(Xxd.pageList(5, 12)).toEqual([1, "…", 4, 5, 6, "…", 12]);
    html(`<div class="xxd-pagination-bar"><span class="xxd-pagination__info"></span><nav class="xxd-pagination" data-xxd-pagination data-page="1" data-total="45" data-per-page="20"></nav></div>`);
    const nav = document.querySelector("nav");
    expect(document.querySelector(".xxd-pagination__info").textContent).toBe("1–20 / 45");
    nav.querySelector('[data-page-to="3"]').click();
    expect(nav.dataset.page).toBe("3");
    expect(nav.querySelector('[aria-current="page"]').textContent).toBe("3");
    expect(document.querySelector(".xxd-pagination__info").textContent).toBe("41–45 / 45");
    expect(nav.querySelector('[aria-label="下一页"]').disabled).toBe(true);
  });

  it("分页：换页后焦点还在分页里（不掉到 body）", () => {
    html(`<nav class="xxd-pagination" data-xxd-pagination data-page="1" data-total="100" data-per-page="20"></nav>`);
    const nav = document.querySelector("nav");
    const two = nav.querySelector('[data-page-to="2"]');
    two.focus();
    two.click();
    expect(document.activeElement.getAttribute("aria-current")).toBe("page");
    expect(document.activeElement.textContent).toBe("2");
    const next = nav.querySelector('[data-role="next"]');
    next.focus();
    next.click();
    expect(document.activeElement.dataset.role).toBe("next");
    for (let i = 0; i < 3; i += 1) nav.querySelector('[data-role="next"]:not(:disabled)')?.click();
    // 到了最后一页，「下一页」禁用：焦点放到当前页
    expect(document.activeElement.getAttribute("aria-current")).toBe("page");
  });

  it("区间滑块：最低不会超过最高", () => {
    html(`<div class="xxd-range-pair"><input type="range" class="xxd-range" min="0" max="100" value="20"><input type="range" class="xxd-range" min="0" max="100" value="50"></div>`);
    const [a] = document.querySelectorAll(".xxd-range");
    a.value = "80";
    a.dispatchEvent(new Event("input", { bubbles: true }));
    expect(a.value).toBe("50");
  });

  it("代码高亮：关键字、字符串、注释、数字各有标记", () => {
    const out = Xxd.highlightText('const n = 42; // 注释\nlet s = "hi";', "js");
    expect(out).toContain('<span class="tok-k">const</span>');
    expect(out).toContain('<span class="tok-n">42</span>');
    expect(out).toContain('<span class="tok-c">// 注释</span>');
    expect(out).toContain('<span class="tok-s">"hi"</span>');
    expect(Xxd.highlightText("<b>x</b>", "html")).toContain('<span class="tok-t">b</span>');
  });

  it("侧栏：折叠时名字变成 tooltip 和 aria-label；子菜单展开", () => {
    html(`<aside class="xxd-sidebar" data-xxd-sidebar id="sbx"><a class="xxd-sidebar__item" href="#"><span>首页</span></a>
      <button class="xxd-sidebar__item" aria-expanded="false" data-sidebar-sub="subx"><span>库</span></button><div class="xxd-sidebar__sub" id="subx" hidden></div></aside>
      <button data-xxd-sidebar-toggle="sbx">折叠</button>`);
    document.querySelector("[data-xxd-sidebar-toggle]").click();
    const item = document.querySelector(".xxd-sidebar__item");
    expect(document.getElementById("sbx").hasAttribute("data-collapsed")).toBe(true);
    expect(item.getAttribute("data-tooltip")).toBe("首页");
    expect(item.getAttribute("aria-label")).toBe("首页");
    document.querySelector("[data-sidebar-sub]").click();
    expect(document.getElementById("sbx").hasAttribute("data-collapsed")).toBe(false);
    expect(document.getElementById("subx").hidden).toBe(false);
    expect(item.hasAttribute("aria-label")).toBe(false);
  });

  it("工具条：→ 移到下一项，roving tabindex", () => {
    html(`<div class="xxd-toolbar" role="toolbar"><button class="xxd-toolbar__item" id="b1">B</button><button class="xxd-toolbar__item" id="b2">I</button></div>`);
    const b1 = document.getElementById("b1");
    expect(b1.tabIndex).toBe(0);
    b1.focus();
    key(b1, "ArrowRight");
    expect(document.activeElement.id).toBe("b2");
    expect(b1.tabIndex).toBe(-1);
  });

  it("面包屑：太长时中间折叠成菜单", () => {
    html(`<ol class="xxd-breadcrumbs" data-collapse="4">${["a", "b", "c", "d", "e", "f"].map((x) => `<li><a href="#${x}">${x}</a></li>`).join("")}</ol>`);
    const visible = [...document.querySelectorAll(".xxd-breadcrumbs > li:not([hidden])")];
    expect(visible.length).toBe(4);
    expect(document.querySelectorAll(".xxd-breadcrumbs .xxd-menu__item").length).toBe(3);
  });

  it("组合框多选 + 新建：选中变 chip，不存在的可以创建", () => {
    html(`<div data-xxd-combobox data-multiple data-creatable><div class="xxd-taginput"><input></div><ul class="xxd-listbox"><li class="xxd-option">海报</li><li class="xxd-option">封面</li></ul></div>`);
    const wrap = document.querySelector("[data-xxd-combobox]");
    const input = wrap.querySelector("input");
    input.value = "海";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    key(input, "ArrowDown");
    key(input, "ArrowDown");
    key(input, "Enter");
    expect(Xxd.tagValues(wrap.querySelector(".xxd-taginput"))).toEqual(["海报"]);
    input.value = "卡片";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const create = wrap.querySelector(".xxd-option[data-create]");
    expect(create.textContent).toBe("创建「卡片」");
    create.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(Xxd.tagValues(wrap.querySelector(".xxd-taginput"))).toEqual(["海报", "卡片"]);
    key(input, "Backspace");
    expect(Xxd.tagValues(wrap.querySelector(".xxd-taginput"))).toEqual(["海报"]);
  });

  it("命令面板：分组标题、最近使用排最前", () => {
    localStorage.setItem("pal-test", JSON.stringify(["b"]));
    const dialog = Xxd.openCommandPalette({ recentKey: "pal-test", items: [{ id: "a", label: "新建", group: "写作" }, { id: "b", label: "主题", group: "外观" }] });
    const labels = [...dialog.querySelectorAll(".xxd-option-group__label")].map((l) => l.textContent);
    expect(labels).toEqual(["最近使用", "写作"]);
    expect(dialog.querySelector(".xxd-option").textContent).toBe("主题");
    dialog.close();
  });

  it("输入名字确认删除：名字对了才能点删除", async () => {
    const p = Xxd.confirmDelete({ name: "长文发布" });
    const dialog = document.querySelector("dialog.xxd-dialog:last-of-type");
    const ok = dialog.querySelector('button[value="confirm"]');
    const input = dialog.querySelector("input");
    expect(ok.disabled).toBe(true);
    input.value = "长文";
    input.dispatchEvent(new Event("input"));
    expect(ok.disabled).toBe(true);
    input.value = "长文发布";
    input.dispatchEvent(new Event("input"));
    expect(ok.disabled).toBe(false);
    dialog.close("confirm");
    await expect(p).resolves.toBe(true);
  });
});

describe("O4 小小东模式", () => {
  it("两次确认：第一次变成确认文字，第二次才派发 xxd:confirm", () => {
    html(`<button class="xxd-btn" data-confirm-twice="确认删除" id="tw">删除</button>`);
    const b = document.getElementById("tw");
    const seen = vi.fn();
    b.addEventListener("xxd:confirm", seen);
    b.click();
    expect(b.textContent).toBe("确认删除");
    expect(b.hasAttribute("data-confirming")).toBe(true);
    expect(seen).not.toHaveBeenCalled();
    b.click();
    expect(seen).toHaveBeenCalledTimes(1);
    expect(b.textContent).toBe("删除");
  });

  it("登录：「继续」一直在；继续进到密码步、返回回去", () => {
    html(`<div data-xxd-auth><div data-step="email" data-active><input type="email" required><button data-auth-next="password">继续</button></div>
      <div data-step="password"><b data-auth-email></b><input type="password"><button data-auth-back="email">返回</button></div></div>`);
    const email = document.querySelector('input[type="email"]');
    const next = document.querySelector("[data-auth-next]");
    expect(next.hidden).toBe(false);
    email.value = "a@b.co";
    email.dispatchEvent(new Event("input", { bubbles: true }));
    next.click();
    expect(document.querySelector('[data-step="password"]').hasAttribute("data-active")).toBe(true);
    expect(document.querySelector("[data-auth-email]").textContent).toBe("a@b.co");
    document.querySelector("[data-auth-back]").click();
    expect(document.querySelector('[data-step="email"]').hasAttribute("data-active")).toBe(true);
  });

  it("拖放：拖进来出现遮罩，松手交给 onFiles", () => {
    html(`<div id="dz"></div>`);
    const target = document.getElementById("dz");
    const onFiles = vi.fn();
    const off = Xxd.bindDrop(target, { onFiles });
    const file = new File(["x"], "a.png", { type: "image/png" });
    const dt = { types: ["Files"], files: [file], getData: () => "" };
    const ev = (type) => Object.assign(new Event(type, { bubbles: true, cancelable: true }), { dataTransfer: dt });
    target.dispatchEvent(ev("dragenter"));
    expect(target.querySelector(".xxd-dropveil").hasAttribute("data-open")).toBe(true);
    target.dispatchEvent(ev("drop"));
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(target.querySelector(".xxd-dropveil").hasAttribute("data-open")).toBe(false);
    off();
  });

  it("状态行：有字显示、一个动作；空字符串藏起来", () => {
    html(`<div class="xxd-statusline" id="st" hidden></div>`);
    const el = document.getElementById("st");
    const onClick = vi.fn();
    Xxd.setStatus(el, "今天用完了", { tone: "warning", action: { label: "开通会员", onClick } });
    expect(el.hidden).toBe(false);
    expect(el.dataset.tone).toBe("warning");
    el.querySelector("button").click();
    expect(onClick).toHaveBeenCalled();
    Xxd.setStatus(el, "");
    expect(el.hidden).toBe(true);
  });

  it("字的滚动替换：旧字标 data-out，新字 data-in", () => {
    html(`<span id="rl">免费版</span>`);
    const el = document.getElementById("rl");
    Xxd.rollText(el, "会员");
    expect(el.querySelector("[data-out]").textContent).toBe("免费版");
    expect(el.querySelector("[data-in]").textContent).toBe("会员");
  });

  it("设置搜索：按标题和关键词过滤，整组没匹配就藏", () => {
    html(`<div id="box"><section class="xxd-group"><div class="xxd-row" data-keywords="dark 夜间">主题</div><div class="xxd-row">圆角</div></section>
      <section class="xxd-group"><div class="xxd-row">智能标点</div></section></div>`);
    const box = document.getElementById("box");
    expect(Xxd.filterSettings(box, "夜间")).toBe(1);
    const [g1, g2] = box.querySelectorAll(".xxd-group");
    expect(g2.hasAttribute("data-search-hidden")).toBe(true);
    expect(g1.hasAttribute("data-search-hidden")).toBe(false);
    Xxd.filterSettings(box, "");
    expect(box.querySelectorAll("[data-search-hidden]").length).toBe(0);
  });

  it("拖拽排序：键盘空格拿起、↓ 移动、空格放下，派发新顺序", () => {
    html(`<ul data-xxd-sortable><li data-sort-item data-id="a"><button class="xxd-sort-handle" id="ha">a</button></li><li data-sort-item data-id="b"><button class="xxd-sort-handle">b</button></li><li data-sort-item data-id="c"><button class="xxd-sort-handle">c</button></li></ul>`);
    const list = document.querySelector("ul");
    const seen = vi.fn();
    list.addEventListener("xxd:change", (e) => seen(e.detail.order));
    const h = document.getElementById("ha");
    h.focus();
    key(h, " ");
    expect(h.getAttribute("aria-pressed")).toBe("true");
    key(h, "ArrowDown");
    key(h, " ");
    expect(seen).toHaveBeenLastCalledWith(["b", "a", "c"]);
  });

  it("图片查看器：← → 翻、计数、关闭后移除", async () => {
    if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    const v = Xxd.openViewer([{ src: "a.png" }, { src: "b.png" }, { src: "c.png" }], 1);
    expect(v.dialog.querySelector("[data-count]").textContent).toBe("2 / 3");
    v.dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(v.index).toBe(2);
    v.dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(v.index).toBe(0);
    v.dialog.close();
    await new Promise((r) => setTimeout(r, 0));
    expect(v.dialog.isConnected).toBe(false);
  });
});

describe("O7 图表", () => {
  it("chartOptions：重点线用主色，其余墨色深浅；不覆盖你写的值", () => {
    const tokens = { dark: false, ink: "#111111", muted: "#666666", line: "#eeeeee", paper: "#ffffff", accent: "#3b74b8", success: "#2f7d4f", danger: "#c4372c", warning: "#b7791f", font: "sans-serif", mono: "monospace" };
    const o = Xxd.chartOptions({ xAxis: { type: "category" }, yAxis: { type: "value" }, series: [{ type: "line", data: [1, 2] }, { type: "line", data: [2, 3], lineStyle: { width: 3 } }] }, { tokens });
    expect(o.color[0]).toBe("#3b74b8");
    expect(o.series[0].lineStyle.width).toBe(2);
    expect(o.series[1].lineStyle.width).toBe(3);
    expect(o.series[0].symbol).toBe("none");
    expect(o.xAxis.splitLine.lineStyle.color).toBe("#eeeeee");
    expect(o.xAxis.type).toBe("category");
    expect(o.tooltip.backgroundColor).toBe("#ffffff");
  });

  it("柱子是直角，坐标轴可以是数组", () => {
    const tokens = Xxd.chartTokens();
    const o = Xxd.chartOptions({ yAxis: [{ type: "value" }, { type: "value" }], series: [{ type: "bar", data: [1] }] }, { tokens });
    expect(o.series[0].itemStyle.borderRadius).toBe(0);
    expect(o.yAxis).toHaveLength(2);
    expect(o.yAxis[1].axisTick.show).toBe(false);
  });

  it("sparkline：少于两个点不画；data-spark 声明式", () => {
    expect(Xxd.sparkline([1])).toBe("");
    expect(Xxd.sparkline([1, 3, 2])).toMatch(/^<svg[^>]+aria-hidden="true"/);
    html(`<span class="xxd-stat__spark" data-spark="1,2,3"></span>`);
    Xxd.init(document);
    expect(document.querySelector("[data-spark] svg")).toBeTruthy();
  });
});

describe("O8 加固", () => {
  afterEach(() => {
    Xxd.setLocale(null);
    document.documentElement.removeAttribute("lang");
  });

  it("三语：缺省跟 <html lang>，setLocale 可以固定；参数仍然优先", async () => {
    document.documentElement.lang = "en";
    expect(Xxd.getLocale()).toBe("en");
    const p = Xxd.confirmDialog({ title: "Delete?" });
    const dialog = document.querySelector("dialog.xxd-dialog");
    expect([...dialog.querySelectorAll(".xxd-dialog__actions button")].map((b) => b.textContent)).toEqual(["Cancel", "OK"]);
    dialog.close("cancel");
    await p;
    Xxd.setLocale("zh-TW");
    expect(Xxd.t("cancel")).toBe("取消");
    expect(Xxd.t("loading")).toBe("正在載入…");
    expect(Xxd.resolveLocale("zh-HK")).toBe("zh-Hant");
    expect(Xxd.resolveLocale("zh")).toBe("zh-CN");
    expect(Xxd.resolveLocale("fr")).toBe("en");
    const q = Xxd.confirmDialog({ title: "x", confirmLabel: "好的" });
    expect(document.querySelector("dialog.xxd-dialog:last-of-type .xxd-dialog__actions button:last-child").textContent).toBe("好的");
    document.querySelector("dialog.xxd-dialog:last-of-type").close("cancel");
    await q;
  });

  it("两个对话框同时开：标题 id 不重复", async () => {
    const a = Xxd.confirmDialog({ title: "一" });
    const b = Xxd.confirmDialog({ title: "二" });
    const ids = [...document.querySelectorAll("dialog.xxd-dialog")].map((d) => d.getAttribute("aria-labelledby"));
    expect(new Set(ids).size).toBe(2);
    for (const d of document.querySelectorAll("dialog.xxd-dialog")) d.close("cancel");
    await Promise.all([a, b]);
  });

  it("名字里带 $& / $1 时原样显示（不被当成替换模式）", async () => {
    const p = Xxd.confirmDelete({ name: "a$&b$1" });
    const dialog = document.querySelector("dialog.xxd-dialog");
    expect(dialog.querySelector(".xxd-label").textContent).toBe("输入「a$&b$1」确认");
    expect(dialog.querySelector(".xxd-dialog__title").textContent).toBe("删除「a$&b$1」？");
    dialog.close("cancel");
    await p;
    html(`<div data-xxd-combobox data-creatable><input class="xxd-input"><ul class="xxd-listbox"><li class="xxd-option">海报</li></ul></div>`);
    const input = document.querySelector("[data-xxd-combobox] input");
    input.value = "x$&y";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector("[data-create]").textContent).toBe("创建「x$&y」");
  });

  it("图片查看器：空列表返回 null 不报错；按钮文字只当文字", () => {
    expect(Xxd.openViewer([])).toBeNull();
    const v = Xxd.openViewer([{ src: "data:," }], 0, { actions: [{ label: "<img src=x onerror=alert(1)>", icon: "<svg></svg>" }] });
    const btn = v.dialog.querySelector("[data-actions] button");
    expect(btn.querySelector("img")).toBeNull();
    expect(btn.querySelector("svg")).toBeTruthy();
    expect(btn.textContent).toBe("<img src=x onerror=alert(1)>");
    v.dialog.close();
  });

  it("两次确认：只换文字，图标留着；恢复后原样", () => {
    html(`<button class="xxd-btn" data-confirm-twice="确认删除"><svg class="ui-icon"></svg>删除</button>`);
    const btn = document.querySelector("[data-confirm-twice]");
    btn.click();
    expect(btn.querySelector("svg")).toBeTruthy();
    expect(btn.textContent).toBe("确认删除");
    btn.click();
    expect(btn.querySelector("svg")).toBeTruthy();
    expect(btn.textContent).toBe("删除");
  });

  it("Shadow DOM：tooltip 挂在 Shadow 里（id 引用不跨边界）；toast 的 within 可以是 ShadowRoot", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<button class="xxd-btn" data-tooltip="提示">tip</button>`;
    const btn = root.querySelector("button");
    Xxd.showTooltip(btn);
    const tip = root.querySelector(".xxd-tooltip");
    expect(tip).toBeTruthy();
    expect(btn.getAttribute("aria-describedby")).toBe(tip.id);
    expect(document.body.querySelector(":scope > .xxd-tooltip")).toBeNull();
    Xxd.hideTooltip();
    expect(() => Xxd.toast("已保存", { within: root })).not.toThrow();
    expect(root.querySelector(".xxd-toast")).toBeTruthy();
    expect(Xxd.layerRoot(btn)).toBe(root);
    expect(Xxd.layerRoot(document.body)).toBe(document.body);
  });

  it("能横向滚动、里面没有可聚焦元素的代码块 / 表格：键盘能进去", () => {
    html(`<pre class="xxd-code"><code>const a = 1;</code></pre><div class="xxd-table-wrap"><table class="xxd-table"><tr><td>1</td></tr></table></div><div class="xxd-table-wrap" id="w2"><table class="xxd-table"><tr><td><button>x</button></td></tr></table></div>`);
    expect(document.querySelector("pre.xxd-code").tabIndex).toBe(0);
    expect(document.querySelector(".xxd-table-wrap").getAttribute("tabindex")).toBe("0");
    expect(document.getElementById("w2").hasAttribute("tabindex")).toBe(false);
  });
});

describe("O8 焦点与计时", () => {
  it("toast：带操作的缺省停 6 秒；键盘聚焦到里面时暂停", () => {
    vi.useFakeTimers();
    try {
      const plain = Xxd.toast("已保存");
      const undo = Xxd.toast("已删除", { action: { label: "撤销" } });
      vi.advanceTimersByTime(3000);
      expect(plain.element.hasAttribute("data-leaving") || !plain.element.isConnected).toBe(true);
      expect(undo.element.hasAttribute("data-leaving")).toBe(false);
      undo.element.querySelector("button").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      vi.advanceTimersByTime(10000);
      expect(undo.element.hasAttribute("data-leaving")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("toast：Alt+T 跳到最新一张的按钮、聚焦时整摞都不对读屏隐藏；Esc 关掉并回到原处", () => {
    html(`<button id="origin">删除</button>`);
    const origin = document.getElementById("origin");
    origin.focus();
    Xxd.toast("第一条", { duration: 0 });
    const undo = Xxd.toast("已删除", { duration: 0, action: { label: "撤销" } });
    const region = undo.element.parentElement;
    expect(region.getAttribute("role")).toBe("region");
    expect(region.getAttribute("aria-label")).toMatch(/Alt\+T/);
    origin.dispatchEvent(new KeyboardEvent("keydown", { key: "t", code: "KeyT", altKey: true, bubbles: true }));
    expect(document.activeElement.textContent).toBe("撤销");
    for (const el of region.querySelectorAll(".xxd-toast")) expect(el.getAttribute("aria-hidden")).toBe("false");
    key(document.activeElement, "Escape");
    expect(undo.element.hasAttribute("data-leaving")).toBe(true);
    expect(document.activeElement).toBe(origin);
  });

  it("关掉横幅时焦点交给后面的按钮，不掉到 body 上", async () => {
    html(`<div class="xxd-banner"><p>提醒</p><button class="xxd-btn" data-banner-close aria-label="关闭">x</button></div><button id="after">下一个</button>`);
    const close = document.querySelector("[data-banner-close]");
    close.focus();
    close.click();
    await new Promise((r) => setTimeout(r, 160));
    expect(document.activeElement?.id).toBe("after");
  });
});

describe("R4 无障碍", () => {
  it("菜单和说明浮层的按钮：aria-haspopup / aria-expanded=false / aria-controls；浮层补 role 和名字", () => {
    html(`<button data-xxd-menu="m9">更多</button><div class="xxd-menu" id="m9" role="menu" popover><button class="xxd-menu__item" role="menuitem">重命名</button><button class="xxd-menu__item" role="menuitem">删除</button></div>
      <button data-xxd-popover="p9">这是什么？</button><div class="xxd-popover" id="p9" popover>说明</div>`);
    const menuBtn = document.querySelector('[data-xxd-menu="m9"]');
    expect(menuBtn.getAttribute("aria-haspopup")).toBe("menu");
    expect(menuBtn.getAttribute("aria-expanded")).toBe("false");
    expect(menuBtn.getAttribute("aria-controls")).toBe("m9");
    const pop = document.getElementById("p9");
    expect(pop.getAttribute("role")).toBe("dialog");
    expect(document.getElementById(pop.getAttribute("aria-labelledby")).textContent).toBe("这是什么？");
  });

  it("菜单字母跳转：按 s 到「删除」不对，按 删 到「删除」", () => {
    html(`<div class="xxd-menu" id="m8" role="menu"><button class="xxd-menu__item" role="menuitem">重命名</button><button class="xxd-menu__item" role="menuitem">删除</button></div>`);
    const [a, b] = document.querySelectorAll("#m8 [role=menuitem]");
    a.focus();
    key(a, "删");
    expect(document.activeElement).toBe(b);
  });

  it("Picker 是 combobox，名字是字段名 + 当前值", () => {
    html(`<div class="xxd-field"><span class="xxd-label">画质</span><div class="xxd-picker" data-xxd-picker><button class="xxd-picker__trigger"><span class="xxd-picker__value"></span></button><div class="xxd-listbox"><div class="xxd-option" data-value="h" aria-selected="true">高</div></div></div></div>`);
    const trigger = document.querySelector(".xxd-picker__trigger");
    expect(trigger.getAttribute("role")).toBe("combobox");
    const names = trigger.getAttribute("aria-labelledby").split(" ").map((id) => document.getElementById(id).textContent);
    expect(names).toEqual(["画质", "高"]);
  });

  it("setFieldError：写 aria-invalid、错误行连进 aria-describedby（出错时说明让位），传空清掉、说明放回", () => {
    html(`<div class="xxd-field"><input id="em" aria-describedby="em-help"><p class="xxd-help" id="em-help">说明</p></div>`);
    const input = document.getElementById("em");
    const err = Xxd.setFieldError(input, "请输入有效的邮箱");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby").split(" ")).toEqual([err.id]);
    Xxd.setFieldError(input, "");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.getAttribute("aria-describedby")).toBe("em-help");
    expect(document.querySelector(".xxd-error")).toBeNull();
  });

  it("setFieldError：错误放在整个控件下面，不进框、不进 label（FORM-REVIEW-PLAN D97）", () => {
    html(`<div class="xxd-field" id="f1"><label class="xxd-label" for="sd">子域名</label><div class="xxd-input-group"><input id="sd"><span class="xxd-input-group__suffix">.ai</span></div></div>
      <div class="xxd-field" id="f2"><label class="xxd-label" for="q">质量</label><label class="xxd-select"><select id="q"><option>高</option></select></label></div>
      <div class="xxd-field" id="f3"><label class="xxd-choice"><input type="checkbox" class="xxd-check" id="ok">我同意条款</label></div>
      <fieldset class="xxd-choices" id="f4"><legend>方式</legend><label class="xxd-choice"><input type="radio" class="xxd-radio" name="w" id="w1">一篇</label><label class="xxd-choice"><input type="radio" class="xxd-radio" name="w" id="w2">全部</label></fieldset>
      <div class="xxd-field" id="f5"><span class="xxd-label">画质</span><div class="xxd-picker" data-xxd-picker><button class="xxd-picker__trigger"><span class="xxd-picker__value"></span></button><div class="xxd-listbox"><div class="xxd-option" data-value="h">高</div></div></div></div>`);
    for (const [id, target] of [["f1", "#sd"], ["f2", "#q"], ["f3", "#ok"], ["f5", ".xxd-picker"]]) {
      const err = Xxd.setFieldError(document.querySelector(target), "错了");
      expect(err.parentElement.id).toBe(id);
      expect(err.closest("label, .xxd-input-group, .xxd-picker")).toBeNull();
    }
    expect(document.querySelector(".xxd-picker__trigger").getAttribute("aria-invalid")).toBe("true");
    // 单选：整组一起标，错误在组的最后
    const err = Xxd.setFieldError(document.getElementById("w1"), "请选一项");
    expect(err.parentElement.id).toBe("f4");
    expect(document.querySelector("#f4").lastElementChild).toBe(err);
    for (const r of document.querySelectorAll("#f4 input")) {
      expect(r.getAttribute("aria-invalid")).toBe("true");
      expect(r.getAttribute("aria-describedby")).toBe(err.id);
    }
    Xxd.setFieldError(document.getElementById("w2"), "");
    expect(document.querySelector("#f4 .xxd-error")).toBeNull();
    expect(document.getElementById("w1").hasAttribute("aria-invalid")).toBe(false);
  });

  it("setFieldError：设置行里的控件，错误写在左边那一栏；包着控件的别的 label 外面", () => {
    html(`<div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">写入标题</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" id="sw" aria-label="写入标题"></div></div>
      <div id="pg"><label class="xxd-pagination__size">每页 <select id="per"><option>20</option></select></label></div>`);
    expect(Xxd.setFieldError(document.getElementById("sw"), "没保存上").parentElement.className).toBe("xxd-row__text");
    expect(Xxd.setFieldError(document.getElementById("per"), "错了").parentElement.id).toBe("pg");
  });

  it("setFieldError：作者写好的错误就用它，不加第二行；清掉时藏起来、describedby 拿掉", () => {
    html(`<div class="xxd-field"><input id="ea" aria-invalid="true" aria-describedby="ea-err"><p class="xxd-error" id="ea-err">服务器说不行</p></div>`);
    const input = document.getElementById("ea");
    const err = Xxd.setFieldError(input, "新的错");
    expect(err.id).toBe("ea-err");
    expect(document.querySelectorAll(".xxd-error").length).toBe(1);
    Xxd.setFieldError(input, "");
    expect(err.hidden).toBe(true);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("data-xxd-validate：提交时标错、焦点到第一个、作者的提交处理不跑；改对了马上清掉（D101）", () => {
    html(`<form data-xxd-validate id="fm"><div class="xxd-field"><label class="xxd-label" for="nm">名字</label><input id="nm" required></div>
      <div class="xxd-field"><label class="xxd-label" for="ml">邮箱</label><input id="ml" type="email" value="you@example"></div>
      <div class="xxd-field"><label class="xxd-label" for="pw">密码</label><input id="pw" minlength="8" value="abc" data-error-short="密码至少 8 位"></div>
      <button>提交</button></form>`);
    const form = document.getElementById("fm");
    expect(form.noValidate).toBe(true);
    const onSubmit = vi.fn((e) => e.preventDefault());
    form.addEventListener("submit", onSubmit);
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(onSubmit).not.toHaveBeenCalled();
    const nm = document.getElementById("nm");
    const msg = (el) => document.getElementById(el.getAttribute("aria-describedby")).textContent;
    expect(msg(nm)).toBe("请填写名字");
    expect(document.activeElement).toBe(nm);
    expect(msg(document.getElementById("pw"))).toBe("密码至少 8 位");
    nm.value = "小东";
    nm.dispatchEvent(new Event("input", { bubbles: true }));
    expect(nm.hasAttribute("aria-invalid")).toBe(false);
    document.getElementById("ml").value = "you@example.com";
    document.getElementById("pw").value = "abcdefgh";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(form.querySelector(".xxd-error")).toBeNull();
  });

  it("fieldProblem：全角「＠」「。」换成半角再校验；字数按字算（emoji 算一个）", () => {
    html(`<div class="xxd-field"><label class="xxd-label" for="m2">邮箱</label><input id="m2" type="email" value="ｙｏｕ＠example。com"></div>
      <div class="xxd-field"><label class="xxd-label" for="t2">简介</label><textarea id="t2" data-max="3">😀😀😀😀</textarea><p class="xxd-help" data-counter></p></div>`);
    const m2 = document.getElementById("m2");
    expect(Xxd.fieldProblem(m2)).toBe("");
    expect(m2.value).toBe("you@example.com");
    expect(Xxd.fieldProblem(document.getElementById("t2"))).toBe("最多 3 个字，多了 1 个");
    expect(document.querySelector("[data-counter]").textContent).toBe("4 / 3");
    expect(document.querySelector("[data-counter]").hasAttribute("data-over")).toBe(true);
  });

  it("输入法组合中按回车不选中 combobox 的项（D103）", () => {
    html(`<div data-xxd-combobox><input class="xxd-input" aria-label="主色"><ul class="xxd-listbox"><li class="xxd-option" data-value="ink">墨色</li></ul></div>`);
    const input = document.querySelector("[data-xxd-combobox] input");
    input.value = "墨";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    key(input, "ArrowDown");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true }));
    expect(input.value).toBe("墨");
    key(input, "Enter");
    expect(input.value).toBe("墨色");
  });

  it("登录：邮箱格式不对时有看得见的错误、连上 describedby、焦点回到输入框", () => {
    html(`<div class="xxd-auth" data-xxd-auth><div data-step="email" data-active><input type="email" value="not-an-email" aria-label="邮箱"><button data-auth-next="password">继续</button></div><div data-step="password"><input type="password"></div></div>`);
    document.querySelector("[data-auth-next]").click();
    const email = document.querySelector('input[type="email"]');
    expect(email.getAttribute("aria-invalid")).toBe("true");
    const err = document.getElementById(email.getAttribute("aria-describedby"));
    expect(err?.textContent).toMatch(/邮箱/);
    expect(document.activeElement).toBe(email);
  });

  it("排序：把手有操作说明；拿起、移动、放下都念出来", async () => {
    html(`<ul data-xxd-sortable><li data-sort-item data-id="a"><button class="xxd-sort-handle" aria-label="拖动排序：写作"></button>写作</li><li data-sort-item data-id="b"><button class="xxd-sort-handle" aria-label="拖动排序：记录"></button>记录</li></ul>`);
    const handle = document.querySelector(".xxd-sort-handle");
    expect(document.getElementById(handle.getAttribute("aria-describedby")).textContent).toMatch(/空格/);
    const polite = () => document.querySelector('.xxd-announcer[role="status"]').textContent;
    key(handle, " ");
    await until(() => polite() === "已拿起 写作，第 1 项，共 2 项");
    expect(polite()).toBe("已拿起 写作，第 1 项，共 2 项");
    key(handle, "ArrowDown");
    await until(() => polite() === "移到第 2 项，共 2 项");
    expect(polite()).toBe("移到第 2 项，共 2 项");
  });

  it("拖列宽、拖侧栏宽的把手：role=separator、能聚焦、方向键改宽度", () => {
    html(`<table class="xxd-table"><thead><tr><th style="width:120px"><button class="xxd-th-sort">名称</button><span class="xxd-th-resize"></span></th></tr></thead></table>`);
    const h = document.querySelector(".xxd-th-resize");
    expect(h.getAttribute("role")).toBe("separator");
    expect(h.tabIndex).toBe(0);
    expect(h.getAttribute("aria-label")).toMatch(/名称/);
    key(h, "Home");
    expect(h.closest("th").style.width).toBe("48px");
    expect(h.getAttribute("aria-valuenow")).toBe("48");
  });

  it("确认对话框是 alertdialog，正文连进 aria-describedby", async () => {
    if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    const p = Xxd.confirmDialog({ title: "删除？", message: "删除后不能恢复。" });
    const dialog = document.querySelector("dialog.xxd-dialog");
    expect(dialog.getAttribute("role")).toBe("alertdialog");
    expect(document.getElementById(dialog.getAttribute("aria-describedby")).textContent).toBe("删除后不能恢复。");
    dialog.close("cancel");
    await p;
  });

  it("命令面板：分组是 role=group，没结果时没有空的 aria-activedescendant", () => {
    if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    const palette = Xxd.openCommandPalette({ items: [{ label: "新建", group: "文件", run() {} }, { label: "打开", group: "文件", run() {} }] });
    const dialog = document.querySelector("dialog.xxd-palette");
    const group = dialog.querySelector('[role="group"]');
    expect(document.getElementById(group.getAttribute("aria-labelledby")).textContent).toBe("文件");
    expect(group.querySelectorAll('[role="option"]').length).toBe(2);
    const input = dialog.querySelector("input");
    input.value = "zzzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    dialog.close?.();
    void palette;
  });
});


describe("R6 生命周期", () => {
  // document 上的委托会处理冒泡出来的 Shadow 事件：这组只看 Shadow 自己装的那一份
  beforeAll(() => Xxd.uninstall(document));
  afterAll(() => Xxd.install(document));
  const shadowWith = (markup) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = markup;
    return root;
  };
  const SHEET = `<div class="xxd-sheet-host"><div class="xxd-scrim"></div><section class="xxd-sheet" id="lc"><p>x</p></section><button id="lc-open" data-xxd-sheet-open="lc">open</button></div>`;

  it("uninstall 之后点击不再起作用；再 install 又能用", () => {
    const root = shadowWith(SHEET);
    Xxd.install(root);
    root.getElementById("lc-open").click();
    expect(root.getElementById("lc").hasAttribute("data-open")).toBe(true);
    Xxd.closeSheet(root.getElementById("lc"));
    Xxd.uninstall(root);
    root.getElementById("lc-open").click();
    expect(root.getElementById("lc").hasAttribute("data-open")).toBe(false);
    Xxd.install(root);
    root.getElementById("lc-open").click();
    expect(root.getElementById("lc").hasAttribute("data-open")).toBe(true);
    Xxd.uninstall(root);
  });

  it("signal abort 等于 uninstall", () => {
    const root = shadowWith(SHEET);
    const ac = new AbortController();
    Xxd.install(root, { signal: ac.signal });
    ac.abort();
    root.getElementById("lc-open").click();
    expect(root.getElementById("lc").hasAttribute("data-open")).toBe(false);
  });

  it("同一个 root 已经被另一份 @xxd/css 装过：不重复装，提示一次", () => {
    const root = shadowWith(SHEET);
    root[Symbol.for("xxd.installed")] = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    Xxd.install(root);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/两份 @xxd\/css/));
    warn.mockRestore();
    root.getElementById("lc-open").click();
    expect(root.getElementById("lc").hasAttribute("data-open")).toBe(false);
  });

  it("Shadow 里找不到 id 时不去宿主网页找同 id 的元素", () => {
    document.body.insertAdjacentHTML("beforeend", `<section class="xxd-sheet" id="lc-host"></section>`);
    const root = shadowWith(`<div class="xxd-sheet-host"><button id="b" data-xxd-sheet-open="lc-host">open</button></div>`);
    Xxd.install(root);
    root.getElementById("b").click();
    expect(document.getElementById("lc-host").hasAttribute("data-open")).toBe(false);
    Xxd.uninstall(root);
  });

  it("页面里有 data-xxd-icon 但没有图标库：提示一次；useIcons 之后正常换成 SVG", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.insertAdjacentHTML("beforeend", `<i data-xxd-icon="Check"></i>`);
    Xxd.init(document);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/没有图标库/));
    warn.mockRestore();
    Xxd.useIcons(await import("../../xxd-icons/src/svg.js"));
    Xxd.init(document);
    expect(document.querySelector("svg.ui-icon")).toBeTruthy();
    Xxd.useIcons(null);
  });
});

describe("截断（TRUNCATION-REVIEW-PLAN D92、D93）", () => {
  // happy-dom 不排版：直接给出「字比格子宽」的尺寸
  const size = (el, scroll, client) => {
    Object.defineProperty(el, "scrollWidth", { configurable: true, get: () => scroll });
    Object.defineProperty(el, "clientWidth", { configurable: true, get: () => client });
    el.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, width: client, height: 20, right: client, bottom: 20 });
    // 样式表不加载：裁剪写在行内
    el.style.overflowX = "clip";
  };

  it("按钮里的裸文字放不下：标 data-truncated；放得下了再去掉，自动加的全文提示一起拿掉", () => {
    html('<button class="xxd-btn" id="b">删除「长文发布」和里面的全部内容</button>');
    const b = document.getElementById("b");
    size(b, 224, 138);
    Xxd.fitText(b);
    expect(b.hasAttribute("data-truncated")).toBe(true);
    b.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(b.getAttribute("data-tooltip")).toBe("删除「长文发布」和里面的全部内容");
    size(b, 240, 240);
    Xxd.fitText(b);
    expect(b.hasAttribute("data-truncated")).toBe(false);
    expect(b.hasAttribute("data-tooltip")).toBe(false);
  });

  it("纯图标按钮不量；作者写了 title / data-tooltip 的不动", () => {
    html('<button class="xxd-btn" data-icon-only aria-label="设置" id="i">⚙</button><button class="xxd-btn" id="t" data-tooltip="我自己写的">很长很长的字</button>');
    const i = document.getElementById("i"), t = document.getElementById("t");
    size(i, 80, 20);
    Xxd.fitText(i);
    expect(i.hasAttribute("data-truncated")).toBe(false);
    size(t, 200, 60);
    t.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(t.getAttribute("data-tooltip")).toBe("我自己写的");
  });

  it("键盘聚焦：里面被省略的字，全文提示挂在聚焦的那个上；提示不连 aria-describedby（读屏本来念的就是全文）", () => {
    html('<ul class="xxd-list"><li class="xxd-list__item"><button class="xxd-list__main" type="button" id="m"><span class="xxd-list__meta" style="overflow:hidden" id="s">2026 年 10 月 22 日 · 来自 mp.weixin.qq.com 的 24 张图</span></button></li></ul>');
    const m = document.getElementById("m");
    size(document.getElementById("s"), 400, 120);
    m.focus();
    m.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(m.getAttribute("data-tooltip")).toContain("mp.weixin.qq.com");
    Xxd.showTooltip(m);
    expect(m.hasAttribute("aria-describedby")).toBe(false);
    Xxd.hideTooltip();
  });
});

describe("暗黑模式（DARK-REVIEW-PLAN）", () => {
  it("局部暗色里打开、放到最外层的 toast / 确认框跟着那一块（D108）；别处打开的不跟", () => {
    html(`<div data-theme="dark"><button id="dk">按钮</button></div><button id="lt">亮的</button>`);
    document.getElementById("dk").focus();
    const t1 = Xxd.toast("暗的").element;
    expect(t1.getAttribute("data-theme")).toBe("dark");
    Xxd.confirmDialog({ title: "确认？" });
    expect([...document.querySelectorAll("dialog.xxd-dialog")].pop().getAttribute("data-theme")).toBe("dark");
    document.getElementById("lt").focus();
    expect(Xxd.toast("亮的").element.hasAttribute("data-theme")).toBe(false);
  });

  it("打印前整页和暗色的块换成亮色，打印完换回（D110）；换主题时挂一帧 data-xxd-switching（D109）", async () => {
    const root = document.documentElement;
    applySettings({ theme: "light" });
    applySettings({ theme: "dark" });
    expect(root.hasAttribute("data-xxd-switching")).toBe(true);
    await new Promise((r) => setTimeout(r, 80));
    expect(root.hasAttribute("data-xxd-switching")).toBe(false);
    html(`<div data-theme="dark" id="blk"></div>`);
    const off = watchPrint(() => ({ theme: "dark" }));
    dispatchEvent(new Event("beforeprint"));
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(document.getElementById("blk").getAttribute("data-theme")).toBe("light");
    dispatchEvent(new Event("afterprint"));
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(document.getElementById("blk").getAttribute("data-theme")).toBe("dark");
    off();
    applySettings({ theme: "light" });
  });
});
