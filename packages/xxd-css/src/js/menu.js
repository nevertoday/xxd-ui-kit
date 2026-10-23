// 菜单与 popover：Popover API（顶层、点外面自动关闭）+ 定位 + 键盘。
//   <button data-xxd-menu="m1">更多</button>
//   <div class="xxd-menu" id="m1" role="menu" popover>
//     <button class="xxd-menu__item" role="menuitem">重命名</button>
//   </div>
//   <button data-xxd-popover="p1">说明</button> <div class="xxd-popover" id="p1" popover>…</div>
import { place } from "./floating.js";
import { byId, emit, nextId } from "./dom.js";

const ITEM = '[role="menuitem"]:not([disabled]):not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([disabled]), [role="menuitemradio"]:not([disabled])';
const openers = new WeakMap();
const POPOVER_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isOpen(el) {
  try {
    return el.matches(":popover-open");
  } catch {
    return el.hasAttribute("data-open");
  }
}

export function showFloating(trigger, floating, { placement, focusFirst = false } = {}) {
  if (!floating) return;
  openers.set(floating, trigger);
  if (typeof floating.showPopover === "function") {
    if (!isOpen(floating)) floating.showPopover();
  } else {
    floating.setAttribute("data-open", "");
  }
  trigger?.setAttribute("aria-expanded", "true");
  place(trigger, floating, { placement: placement || floating.dataset.placement || "bottom-start" });
  if (focusFirst) floating.querySelector(ITEM)?.focus();
  // 说明浮层里有可交互的东西（小表单、链接）：焦点移进去，否则键盘用户够不着
  else if (floating.classList.contains("xxd-popover")) floating.querySelector(POPOVER_FOCUSABLE)?.focus({ preventScroll: true });
}

export function hideFloating(floating, { restoreFocus = false } = {}) {
  if (!floating) return;
  if (typeof floating.hidePopover === "function") {
    if (isOpen(floating)) floating.hidePopover();
  } else {
    floating.removeAttribute("data-open");
  }
  const trigger = openers.get(floating);
  trigger?.setAttribute("aria-expanded", "false");
  if (restoreFocus) trigger?.focus();
}

/**
 * 触发按钮告诉读屏会弹出什么：菜单 aria-haspopup="menu"、说明浮层 "dialog"；没打开时 aria-expanded="false"；aria-controls 指过去。
 * 说明浮层没写 role 的补成 dialog，名字取触发按钮。init 时调用（可以重复调用）。
 */
export function initMenus(root = document) {
  for (const trigger of root.querySelectorAll("[data-xxd-menu], [data-xxd-popover]")) {
    const isMenu = trigger.hasAttribute("data-xxd-menu");
    const id = trigger.getAttribute(isMenu ? "data-xxd-menu" : "data-xxd-popover");
    if (!trigger.hasAttribute("aria-haspopup")) trigger.setAttribute("aria-haspopup", isMenu ? "menu" : "dialog");
    if (!trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", "false");
    if (id && !trigger.hasAttribute("aria-controls")) trigger.setAttribute("aria-controls", id);
    if (isMenu) continue;
    const pop = byId(trigger, id);
    if (!pop) continue;
    if (!pop.hasAttribute("role")) pop.setAttribute("role", "dialog");
    if (!pop.hasAttribute("aria-label") && !pop.hasAttribute("aria-labelledby")) {
      if (!trigger.id) trigger.id = nextId("xxd-pop-trigger");
      pop.setAttribute("aria-labelledby", trigger.id);
    }
  }
}

function moveFocus(menu, step) {
  // 只在这一层里移动（子菜单嵌在父菜单里面，它的项不算）
  const items = [...menu.querySelectorAll(ITEM)].filter((el) => el.closest(".xxd-menu") === menu);
  if (!items.length) return;
  const root = menu.getRootNode();
  const index = items.indexOf(root.activeElement);
  const next = step === "first" ? 0 : step === "last" ? items.length - 1 : (index + step + items.length) % items.length;
  items[next].focus();
}

/* ── 子菜单：<button class="xxd-menu__item" role="menuitem" data-submenu="id">；
 *    子菜单本身是 <div class="xxd-menu" id popover="manual">，**放在父菜单里面**（顶层渲染，不影响布局；
 *    这样点子菜单不会被当成「点了外面」把父菜单关掉）。 ── */
const subTimers = new WeakMap();

export function openSubmenu(item, { focusFirst = false } = {}) {
  const sub = item.getRootNode().getElementById?.(item.dataset.submenu) || document.getElementById(item.dataset.submenu);
  if (!sub) return null;
  // 同一层只开一个
  for (const sib of item.closest(".xxd-menu").querySelectorAll('[data-submenu][aria-expanded="true"]')) if (sib !== item) closeSubmenu(sib);
  if (typeof sub.showPopover === "function" && !isOpen(sub)) sub.showPopover();
  else sub.setAttribute("data-open", "");
  item.setAttribute("aria-expanded", "true");
  openers.set(sub, item);
  place(item, sub, { placement: "right-start", offset: 2 });
  if (focusFirst) sub.querySelector(ITEM)?.focus();
  return sub;
}

export function closeSubmenu(item, { focusItem = false } = {}) {
  const sub = document.getElementById(item.dataset.submenu) || item.getRootNode().getElementById?.(item.dataset.submenu);
  if (sub) {
    for (const inner of sub.querySelectorAll('[data-submenu][aria-expanded="true"]')) closeSubmenu(inner);
    if (typeof sub.hidePopover === "function" && isOpen(sub)) sub.hidePopover();
    else sub.removeAttribute("data-open");
  }
  item.setAttribute("aria-expanded", "false");
  if (focusItem) item.focus();
}

function closeAllSubmenus(menu) {
  for (const item of menu.querySelectorAll('[data-submenu][aria-expanded="true"]')) closeSubmenu(item);
}

export function installMenus(root, byId, closestFrom) {
  // 鼠标停在有子菜单的项上 120ms 打开；移到同一层别的项上就关
  root.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") return;
    const item = closestFrom(event, '.xxd-menu [role^="menuitem"]');
    if (!item) return;
    const menu = item.closest(".xxd-menu");
    clearTimeout(subTimers.get(menu));
    subTimers.set(menu, setTimeout(() => {
      if (item.dataset.submenu) openSubmenu(item);
      else for (const sib of menu.querySelectorAll(':scope [data-submenu][aria-expanded="true"]')) if (sib.closest(".xxd-menu") === menu) closeSubmenu(sib);
    }, 120));
  });
  root.addEventListener("click", (event) => {
    const trigger = closestFrom(event, "[data-xxd-menu], [data-xxd-popover]");
    if (trigger) {
      const id = trigger.getAttribute("data-xxd-menu") || trigger.getAttribute("data-xxd-popover");
      const floating = byId(trigger, id);
      if (!floating) return;
      // 点同一个按钮：Popover 的 light dismiss 已经在 pointerdown 时关掉了，这里不要再打开。
      if (floating.dataset.justClosed) return;
      if (isOpen(floating)) hideFloating(floating);
      else showFloating(trigger, floating, { focusFirst: event.detail === 0 && trigger.hasAttribute("data-xxd-menu") });
      return;
    }
    const item = closestFrom(event, '.xxd-menu [role^="menuitem"]');
    if (item?.dataset.submenu) {
      openSubmenu(item, { focusFirst: event.detail === 0 });
      return;
    }
    if (item && !item.disabled && item.getAttribute("aria-disabled") !== "true") {
      const role = item.getAttribute("role");
      if (role === "menuitemcheckbox") item.setAttribute("aria-checked", String(item.getAttribute("aria-checked") !== "true"));
      if (role === "menuitemradio") {
        const group = item.closest('[role="group"]') || item.closest(".xxd-menu");
        for (const r of group.querySelectorAll('[role="menuitemradio"]')) r.setAttribute("aria-checked", String(r === item));
        emit(group, "xxd:change", { value: item.dataset.value ?? item.textContent.trim() });
      }
      if (item.closest("[data-keep-open]")) return;
      // 关掉整条菜单链（子菜单与它的父菜单）
      let menu = item.closest(".xxd-menu");
      let top = menu;
      while (menu) {
        const opener = openers.get(menu);
        if (opener?.dataset?.submenu) {
          closeSubmenu(opener);
          top = opener.closest(".xxd-menu");
          menu = top;
        } else menu = null;
      }
      hideFloating(top, { restoreFocus: true });
    }
  });

  root.addEventListener("pointerdown", (event) => {
    const trigger = closestFrom(event, "[data-xxd-menu], [data-xxd-popover]");
    if (!trigger) return;
    const floating = byId(trigger, trigger.getAttribute("data-xxd-menu") || trigger.getAttribute("data-xxd-popover"));
    if (floating && isOpen(floating)) {
      floating.dataset.justClosed = "1";
      setTimeout(() => delete floating.dataset.justClosed, 0);
    }
  });

  root.addEventListener("keydown", (event) => {
    const trigger = closestFrom(event, "[data-xxd-menu]");
    if (trigger && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const menu = byId(trigger, trigger.getAttribute("data-xxd-menu"));
      showFloating(trigger, menu);
      moveFocus(menu, event.key === "ArrowDown" ? "first" : "last");
      return;
    }
    const menu = closestFrom(event, ".xxd-menu");
    if (!menu) return;
    const keys = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
    const parentItem = openers.get(menu)?.dataset?.submenu ? openers.get(menu) : null;
    const focused = closestFrom(event, '[role^="menuitem"]');
    if (event.key in keys) {
      event.preventDefault();
      moveFocus(menu, keys[event.key]);
    } else if (event.key === "ArrowRight" && focused?.dataset.submenu) {
      event.preventDefault();
      openSubmenu(focused, { focusFirst: true });
    } else if ((event.key === "ArrowLeft" || event.key === "Escape") && parentItem) {
      event.preventDefault();
      closeSubmenu(parentItem, { focusItem: true });
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAllSubmenus(menu);
      hideFloating(menu, { restoreFocus: true });
    } else if (event.key === "Tab") {
      hideFloating(menu);
    } else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // 字母跳转：按 r 跳到下一个以 r 开头的项（APG 推荐）
      const items = [...menu.querySelectorAll(ITEM)].filter((el) => el.closest(".xxd-menu") === menu);
      const at = items.indexOf(menu.getRootNode().activeElement);
      const k = event.key.toLowerCase();
      const next = [...items.slice(at + 1), ...items.slice(0, at + 1)].find((el) => el.textContent.trim().toLowerCase().startsWith(k));
      if (next) {
        event.preventDefault();
        next.focus();
      }
    }
  });

  // 说明浮层：焦点离开它（和它的按钮）就关掉，免得挡住别的东西（WCAG 2.4.11）
  root.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;
    if (!next) return;
    const target = event.target;
    const pop = target.closest?.(".xxd-popover") ?? (target.matches?.("[data-xxd-popover]") ? byId(target, target.getAttribute("data-xxd-popover")) : null);
    if (!pop || !isOpen(pop)) return;
    const opener = openers.get(pop);
    if (pop.contains(next) || opener === next || opener?.contains?.(next)) return;
    hideFloating(pop);
  });

  // 键盘高亮和鼠标悬停是同一个高亮（I4）：鼠标移进哪一项，焦点就移过去
  root.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const item = closestFrom(event, '.xxd-menu [role^="menuitem"]');
    if (item && !item.disabled && item.getRootNode().activeElement !== item) item.focus({ preventScroll: true });
  });

  // Popover 自己关闭时（点外面、Esc）同步 aria-expanded
  root.addEventListener(
    "toggle",
    (event) => {
      const el = event.target;
      if (event.newState === "closed" && el?.classList && (el.classList.contains("xxd-menu") || el.classList.contains("xxd-popover"))) {
        openers.get(el)?.setAttribute("aria-expanded", "false");
        // 焦点在里面时（Esc 关掉）还给触发按钮
        const active = el.getRootNode().activeElement;
        if (active && el.contains(active)) openers.get(el)?.focus({ preventScroll: true });
        // 父菜单关了，子菜单一起关
        if (el.classList.contains("xxd-menu")) closeAllSubmenus(el);
      }
    },
    true,
  );

  const reposition = () => {
    for (const el of root.querySelectorAll(".xxd-menu, .xxd-popover")) {
      if (isOpen(el) && openers.get(el)) place(openers.get(el), el, { placement: el.dataset.placement || "bottom-start" });
    }
  };
  globalThis.addEventListener?.("resize", reposition);
  globalThis.addEventListener?.("scroll", reposition, true);
}
