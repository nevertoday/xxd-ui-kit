// 读屏播报：每个根（document / 每个 ShadowRoot）常驻两个看不见的 live region（polite / assertive）。
// install 时就建好 —— 新插进去的 live region 里的第一句话，很多读屏不念；常驻的只换文字就一定会念。
// toast、复制、状态行、拖拽排序、命令面板的结果条数、图片查看器的翻页都走这里。
const regions = new WeakMap();

function containerOf(root) {
  if (!root) return globalThis.document?.body ?? null;
  if (root.nodeType === 9) return root.body;
  if (root.nodeType === 11) return root;
  const r = root.getRootNode?.();
  return r && r.nodeType === 11 ? r : (root.ownerDocument ?? document).body;
}

function regionsFor(root) {
  const container = containerOf(root);
  if (!container) return null;
  let r = regions.get(container);
  if (r?.polite.isConnected && r?.assertive.isConnected) return r;
  const doc = container.ownerDocument ?? container;
  const make = (role, live) => {
    const el = doc.createElement("div");
    el.className = "xxd-sr-only xxd-announcer";
    el.setAttribute("role", role);
    el.setAttribute("aria-live", live);
    el.setAttribute("aria-atomic", "true");
    container.append(el);
    return el;
  };
  r = { polite: make("status", "polite"), assertive: make("alert", "assertive") };
  regions.set(container, r);
  return r;
}

/** install(root) 时调用：先把播报区建好。 */
export function installAnnouncer(root) {
  const doc = root.nodeType === 9 ? root : null;
  if (doc && !doc.body) doc.addEventListener("DOMContentLoaded", () => regionsFor(doc), { once: true });
  else regionsFor(root);
}

/**
 * announce("已复制")；announce("写入失败", { assertive: true })；within：在哪个根里念（Shadow 里的界面传它里面的元素或 ShadowRoot）。
 * 同一句话连着说两次也会念（先清空再写）。
 */
export function announce(message, { assertive = false, within } = {}) {
  const r = regionsFor(within);
  if (!r) return;
  const el = assertive ? r.assertive : r.polite;
  el.textContent = "";
  setTimeout(() => {
    el.textContent = String(message ?? "");
  }, 30);
}
