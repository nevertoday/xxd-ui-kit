// Sheet（从 dock 升起）与右侧详情面板。都支持 Esc 关闭、点遮罩关闭、关闭后焦点回到打开它的按钮。
import { composing, emit, focusables } from "./dom.js";

const returnTo = new WeakMap();
const stack = [];
const inerted = new WeakMap();

/**
 * 模态：打开时把这一层「外面」的东西设成 inert（点不到、读屏也读不到），关掉再还原。
 * sheet 只管它所在的 .xxd-sheet-host；面板一直往上管到 body（或 ShadowRoot）。遮罩、toast 区、播报区、顶层浮层不动。
 */
const KEEP = ".xxd-scrim, .xxd-panel-scrim, .xxd-toast-region, .xxd-announcer, [popover], script, style";
function setOutsideInert(layer, on) {
  if (!on) {
    for (const el of inerted.get(layer) ?? []) el.removeAttribute("inert");
    inerted.delete(layer);
    return;
  }
  const stopAt = layer.classList.contains("xxd-sheet") ? layer.closest(".xxd-sheet-host") : null;
  const changed = [];
  let node = layer;
  while (node && node.parentNode && node !== stopAt) {
    const parent = node.parentNode;
    for (const sib of parent.children ?? []) {
      if (sib === node || sib.matches?.(KEEP) || sib.hasAttribute("inert") || sib.contains(layer)) continue;
      sib.setAttribute("inert", "");
      changed.push(sib);
    }
    if (parent === stopAt || parent.nodeType === 11 || parent === parent.ownerDocument?.body) break;
    node = parent;
  }
  inerted.set(layer, changed);
}

function scrimFor(layer) {
  if (layer.classList.contains("xxd-sheet")) return layer.closest(".xxd-sheet-host")?.querySelector(":scope > .xxd-scrim");
  let scrim = layer.previousElementSibling;
  if (!scrim || !scrim.classList.contains("xxd-panel-scrim")) {
    scrim = layer.ownerDocument.createElement("div");
    scrim.className = "xxd-panel-scrim";
    layer.before(scrim);
  }
  return scrim;
}

/** 聚焦；聚焦不上（visibility 还在过渡里、刚从隐藏变回来）就接下来几帧再试。still() 不成立就放弃。 */
function focusSoon(el, still = () => true, tries = 8) {
  el.focus({ preventScroll: true });
  if (el.getRootNode().activeElement === el || tries <= 0) return;
  requestAnimationFrame(() => el.isConnected && still() && focusSoon(el, still, tries - 1));
}

export function openLayer(layer) {
  if (!layer || layer.hasAttribute("data-open")) return;
  returnTo.set(layer, layer.getRootNode().activeElement);
  layer.setAttribute("data-open", "");
  layer.setAttribute("aria-hidden", "false");
  // 读屏要知道进了一个对话框：没写 role 的补上
  if (!layer.hasAttribute("role")) layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-modal", "true");
  setOutsideInert(layer, true);
  scrimFor(layer)?.setAttribute("data-open", "");
  layer.closest(".xxd-sheet-host")?.setAttribute("data-sheet-open", "");
  stack.push(layer);
  const target = focusables(layer)[0] || layer;
  if (target === layer && !layer.hasAttribute("tabindex")) layer.tabIndex = -1;
  focusSoon(target, () => layer.hasAttribute("data-open"));
  emit(layer, "xxd:open");
}

export function closeLayer(layer) {
  if (!layer || !layer.hasAttribute("data-open")) return;
  layer.removeAttribute("data-open");
  layer.setAttribute("aria-hidden", "true");
  layer.removeAttribute("aria-modal");
  setOutsideInert(layer, false);
  scrimFor(layer)?.removeAttribute("data-open");
  layer.closest(".xxd-sheet-host")?.removeAttribute("data-sheet-open");
  const i = stack.lastIndexOf(layer);
  if (i >= 0) stack.splice(i, 1);
  // 先关下面那层时，上面那层背后要重新变成 inert（它记的是当时还没 inert 的兄弟）
  const top = stack[stack.length - 1];
  if (top) {
    setOutsideInert(top, false);
    setOutsideInert(top, true);
  }
  const prev = returnTo.get(layer);
  // 打开它的按钮不在了（那一行被删掉了）：焦点放到下面一层或正文，不掉到 body 上
  const fallback = () => stack[stack.length - 1] || layer.closest(".xxd-panel-room, main, [role=main]") || layer.parentElement;
  const back = prev?.isConnected && !prev.closest("[hidden], [inert]") ? prev : fallback();
  if (back) {
    if (!focusables(back).length && back !== prev && !back.hasAttribute("tabindex")) back.tabIndex = -1;
    focusSoon(back === prev ? prev : focusables(back)[0] || back, () => !layer.hasAttribute("data-open"));
  }
  emit(layer, "xxd:close");
}

export const openSheet = openLayer;
export const closeSheet = closeLayer;
export const openPanel = openLayer;
export const closePanel = closeLayer;

export function installLayers(root, byId, closestFrom) {
  root.addEventListener("click", (event) => {
    const opener = closestFrom(event, "[data-xxd-sheet-open], [data-xxd-panel-open]");
    if (opener) {
      const layer = byId(opener, opener.getAttribute("data-xxd-sheet-open") || opener.getAttribute("data-xxd-panel-open"));
      if (layer?.hasAttribute("data-open")) closeLayer(layer);
      else openLayer(layer);
      return;
    }
    const closer = closestFrom(event, "[data-xxd-sheet-close], [data-xxd-panel-close]");
    if (closer) return closeLayer(closer.closest(".xxd-sheet, .xxd-panel"));
    const scrim = closestFrom(event, ".xxd-scrim[data-open], .xxd-panel-scrim[data-open]");
    if (scrim) {
      const layer = scrim.classList.contains("xxd-panel-scrim")
        ? scrim.nextElementSibling
        : scrim.closest(".xxd-sheet-host")?.querySelector(".xxd-sheet[data-open]");
      closeLayer(layer);
    }
  });
  // 焦点陷阱（I15）：sheet / 面板打开时，Tab 在里面循环
  // 面板 / sheet 上面又开了原生模态对话框（确认框）：键盘和 Esc 都归对话框管，这里让开（ACCEPTANCE-REVIEW P0）
  const modalOnTop = (target) => Boolean(target?.closest?.("dialog[open]") || (target?.ownerDocument || document).querySelector("dialog:modal"));
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !stack.length || modalOnTop(event.target)) return;
    const top = stack[stack.length - 1];
    const items = focusables(top);
    if (!items.length) return;
    const active = top.getRootNode().activeElement;
    const first = items[0];
    const last = items[items.length - 1];
    if (!top.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !stack.length || composing(event)) return;
    if (event.defaultPrevented || modalOnTop(event.target)) return;
    const top = stack[stack.length - 1];
    if (top.contains(event.target) || top.getRootNode().activeElement === event.target || event.target === document.body) {
      event.preventDefault();
      closeLayer(top);
    }
  });
}

/* ── 窄屏抽屉（I12）：.xxd-dialog / .xxd-panel 在窄屏变成底部抽屉；下滑超过 1/3 或甩得够快就关 ── */
export function installDrawerSwipe(root, closestFrom) {
  let drag = null;
  root.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || !globalThis.matchMedia?.("(max-width: 640px)").matches) return;
    const layer = closestFrom(event, ".xxd-dialog[open], .xxd-panel[data-open]");
    if (!layer) return;
    const handleZone = event.target.closest?.(".xxd-drawer-handle, .xxd-dialog__head, .xxd-panel__head");
    if (!handleZone && layer.scrollTop > 0) return;
    drag = { layer, y: event.clientY, t: event.timeStamp, dy: 0 };
  });
  root.addEventListener("pointermove", (event) => {
    if (!drag) return;
    drag.dy = Math.max(0, event.clientY - drag.y);
    drag.layer.style.transform = `translateY(${drag.dy}px)`;
    drag.layer.style.transition = "none";
  });
  const end = (event) => {
    if (!drag) return;
    const { layer, dy, t } = drag;
    drag = null;
    layer.style.transition = "";
    layer.style.transform = "";
    const fast = dy / Math.max(1, event.timeStamp - t) > 0.6;
    if (dy > layer.getBoundingClientRect().height / 3 || (fast && dy > 24)) {
      if (layer instanceof HTMLDialogElement) layer.close("cancel");
      else closeLayer(layer);
    }
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
}
