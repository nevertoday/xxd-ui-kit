// Tabs 与分段控件：点击 / 方向键选择，roving tabindex，派发 xxd:change。
import { byId, emit } from "./dom.js";

function selectTab(list, tab, { focus = false } = {}) {
  const tabs = [...list.querySelectorAll(':scope > [role="tab"]')];
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = byId(t, t.getAttribute("aria-controls"));
    if (panel) panel.hidden = !on;
  }
  if (focus) tab.focus();
  moveInk(list);
  emit(list, "xxd:change", { value: tab.dataset.value ?? tab.id ?? tabs.indexOf(tab), index: tabs.indexOf(tab) });
}

export function moveInk(list) {
  const ink = list.querySelector(":scope > .xxd-tabs__ink");
  const tab = list.querySelector(':scope > [role="tab"][aria-selected="true"]');
  if (!ink || !tab) return;
  list.style.setProperty("--ink-x", `${tab.offsetLeft}px`);
  list.style.setProperty("--ink-w", String(tab.offsetWidth));
}

function selectRadio(group, item, { focus = false } = {}) {
  const items = [...group.querySelectorAll(':scope > [role="radio"]')];
  for (const i of items) {
    const on = i === item;
    i.setAttribute("aria-checked", String(on));
    i.tabIndex = on ? 0 : -1;
  }
  if (focus) item.focus();
  emit(group, "xxd:change", { value: item.dataset.value ?? items.indexOf(item), index: items.indexOf(item) });
}

const step = (list, current, key, vertical) => {
  const prev = vertical ? "ArrowUp" : "ArrowLeft";
  const next = vertical ? "ArrowDown" : "ArrowRight";
  const i = list.indexOf(current);
  if (key === prev) return list[(i - 1 + list.length) % list.length];
  if (key === next) return list[(i + 1) % list.length];
  if (key === "Home") return list[0];
  if (key === "End") return list[list.length - 1];
  return null;
};

/** 初始化：补上 tabindex、墨线和 ARIA。可重复调用。 */
export function initChoices(root) {
  for (const list of root.querySelectorAll("[data-xxd-tabs]")) {
    list.setAttribute("role", "tablist");
    const tabs = [...list.querySelectorAll(':scope > [role="tab"]')];
    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
    tabs.forEach((t) => {
      t.tabIndex = t === selected ? 0 : -1;
      if (!t.hasAttribute("aria-selected")) t.setAttribute("aria-selected", String(t === selected));
      const panel = byId(t, t.getAttribute("aria-controls"));
      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.classList.add("xxd-tabpanel");
        if (t.id) panel.setAttribute("aria-labelledby", t.id);
        panel.hidden = t !== selected;
        // 面板里没有能聚焦的东西：面板本身能聚焦，键盘用户从标签按 Tab 不会跳过正文（APG Tabs）
        const focusable = panel.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable && !panel.hasAttribute("tabindex")) panel.tabIndex = 0;
      }
    });
    if (!list.querySelector(":scope > .xxd-tabs__ink")) {
      const ink = document.createElement("span");
      ink.className = "xxd-tabs__ink";
      ink.setAttribute("aria-hidden", "true");
      list.append(ink);
    }
    moveInk(list);
    if (!list.__xxdResize && typeof ResizeObserver === "function") {
      list.__xxdResize = new ResizeObserver(() => moveInk(list));
      list.__xxdResize.observe(list);
    }
  }
  for (const group of root.querySelectorAll("[data-xxd-segmented]")) {
    group.setAttribute("role", "radiogroup");
    const items = [...group.querySelectorAll(':scope > [role="radio"]')];
    const selected = items.find((i) => i.getAttribute("aria-checked") === "true") || items[0];
    items.forEach((i) => {
      i.tabIndex = i === selected ? 0 : -1;
      i.setAttribute("aria-checked", String(i === selected));
      if (i.tagName === "BUTTON") i.type = "button";
    });
  }
}

export function installChoices(root, closestFrom) {
  root.addEventListener("click", (event) => {
    const tab = closestFrom(event, '[data-xxd-tabs] > [role="tab"]');
    if (tab && !tab.disabled) return selectTab(tab.parentElement, tab);
    const radio = closestFrom(event, '[data-xxd-segmented] > [role="radio"]');
    if (radio && !radio.disabled) selectRadio(radio.parentElement, radio);
  });
  root.addEventListener("keydown", (event) => {
    const tab = closestFrom(event, '[data-xxd-tabs] > [role="tab"]');
    if (tab) {
      const list = [...tab.parentElement.querySelectorAll(':scope > [role="tab"]:not([disabled])')];
      const next = step(list, tab, event.key, tab.parentElement.getAttribute("aria-orientation") === "vertical");
      if (next) {
        event.preventDefault();
        selectTab(tab.parentElement, next, { focus: true });
      }
      return;
    }
    const radio = closestFrom(event, '[data-xxd-segmented] > [role="radio"]');
    if (radio) {
      const list = [...radio.parentElement.querySelectorAll(':scope > [role="radio"]:not([disabled])')];
      const next = step(list, radio, event.key, false) || step(list, radio, event.key, true);
      if (next) {
        event.preventDefault();
        selectRadio(radio.parentElement, next, { focus: true });
      }
    }
  });
}

export { selectTab, selectRadio };
