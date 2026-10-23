// 小工具：事件目标（穿透 Shadow DOM）、按 id 找元素、可聚焦元素。
export const targetOf = (event) => (event.composedPath ? event.composedPath()[0] : event.target);

export function closestFrom(event, selector) {
  const t = targetOf(event);
  return t && t.closest ? t.closest(selector) : null;
}

export function byId(from, id) {
  if (!id) return null;
  const root = from?.getRootNode ? from.getRootNode() : document;
  // 在 Shadow 里只在这个 Shadow 里找：回退到宿主网页的 document 会误操作宿主上同 id 的元素
  if (root.nodeType === 11) return root.getElementById?.(id) ?? null;
  return (root.getElementById && root.getElementById(id)) || document.getElementById(id);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusables(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest("[hidden]") && el.getClientRects().length);
}

export function emit(el, name, detail) {
  el.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
}

let uid = 0;
export const nextId = (prefix = "xxd") => `${prefix}-${++uid}`;

export function reducedMotion() {
  return Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/** 等 CSS 过渡结束再执行（减少动效或没有过渡时立即执行）。 */
export function afterTransition(el, fn, fallback = 260) {
  if (reducedMotion()) return fn();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.removeEventListener("transitionend", finish);
    fn();
  };
  el.addEventListener("transitionend", finish);
  setTimeout(finish, fallback);
}

/* 默认的浮层根：插件往网页里注入界面时（mountXxdUI），toast、确认框、命令面板、图片查看器、tooltip
 * 没指定 within 就出现在这个 ShadowRoot 里 —— 而不是挂到宿主网页没有样式的 body 上。 */
let defaultRoot = null;
export function setDefaultLayerRoot(root) {
  defaultRoot = root || null;
}
export const defaultLayerRoot = () => (defaultRoot?.host?.isConnected || defaultRoot?.isConnected ? defaultRoot : null) ?? globalThis.document?.body;

/** 浮层挂在哪：锚点在 Shadow 里就是那个 ShadowRoot，否则是默认浮层根（通常是 body）。 */
export function layerRoot(node) {
  const doc = node.ownerDocument || document;
  const root = node.getRootNode?.();
  return root && root !== doc && root.nodeType === 11 ? root : defaultLayerRoot() ?? doc.body;
}
