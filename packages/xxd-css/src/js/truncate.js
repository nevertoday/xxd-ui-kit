// 截断（TRUNCATION-REVIEW-PLAN D92、D93）：
//   · 按钮、chip、徽标这类弹性布局里的裸文字画不出省略号，放不下时只能被裁掉。这里量一下，放不下就标 data-truncated，
//     CSS 换成画得出省略号的排法（宽高不变）；放得下了再去掉。
//   · 被省略的字悬停、键盘聚焦时提示全文（就是 data-tooltip 那个提示）。读屏念的本来就是全文，提示不连 aria-describedby。
//     作者自己写了 title / data-tooltip 的不动。
export const FIT = ".xxd-btn:not([data-icon-only]), .xxd-chip, .xxd-badge, .xxd-logo, .xxd-toolbar__item";
export const AUTO_TIP = "data-xxd-full";

/** 字被裁掉了没有：横向裁（省略号、clip）或多行截断。滚动区、表单控件、只给读屏的字不算。 */
export function clipped(el) {
  if (!el?.matches || el.matches("input, textarea, select, svg, canvas, .xxd-sr-only")) return false;
  // 只给读屏的 1px 字（别的写法）不算；被挤到 0 宽的标签要算（整个看不见了，更要提示全文）
  const box = el.getBoundingClientRect();
  if (box.width <= 1 && box.height <= 1) return false;
  const s = getComputedStyle(el);
  if ((s.overflowX === "hidden" || s.overflowX === "clip") && el.scrollWidth > el.clientWidth + 1) return true;
  const clamp = s.webkitLineClamp || s.lineClamp;
  return Boolean(clamp && clamp !== "none") && el.scrollHeight > el.clientHeight + 1;
}

/** 量一下这个标签放不放得下，放不下标 data-truncated（标了以后宽度不变，scrollWidth 仍是全文的宽，不会来回跳）。 */
export function fitText(el) {
  if (!el?.matches?.(FIT) || !el.isConnected) return;
  const over = el.scrollWidth > el.clientWidth + 1;
  el.toggleAttribute("data-truncated", over);
  // 放得下了：以前自动加的全文提示也拿掉
  if (!over) clearTip(el);
}

const watching = new WeakMap(); // install 的 signal → { resize, seen }

function watch(state, el) {
  if (state.seen.has(el)) return;
  state.seen.add(el);
  state.resize.observe(el);
}

/** init(root) 时调用：给里面的标签挂上尺寸观察（变窄、字体加载完都会重量一次）；
 *  字变了但尺寸没变（已经到最宽、切换语言）、后来插进来的标签，靠一个文字变化观察补上。 */
export function initTruncation(root, signal) {
  if (typeof ResizeObserver !== "function" || !root.querySelectorAll) return;
  const key = signal ?? root;
  let state = watching.get(key);
  if (!state) {
    state = { resize: new ResizeObserver((entries) => entries.forEach((e) => fitText(e.target))), seen: new WeakSet() };
    watching.set(key, state);
    if (typeof MutationObserver === "function") {
      new MutationObserver((records) => {
        const todo = new Set();
        for (const r of records) {
          const el = r.target.nodeType === 1 ? r.target : r.target.parentElement;
          const fit = el?.closest?.(FIT);
          if (fit) todo.add(fit);
          for (const n of r.addedNodes) if (n.nodeType === 1) [n, ...n.querySelectorAll(FIT)].forEach((x) => x.matches(FIT) && todo.add(x));
        }
        todo.forEach((el) => (watch(state, el), fitText(el)));
      }).observe(root, { subtree: true, childList: true, characterData: true });
    }
  }
  for (const el of root.querySelectorAll(FIT)) watch(state, el);
}

function fullText(el) {
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

function setTip(anchor, text) {
  if (!text || anchor.hasAttribute("title") || (anchor.hasAttribute("data-tooltip") && !anchor.hasAttribute(AUTO_TIP))) return;
  anchor.setAttribute("data-tooltip", text);
  anchor.setAttribute(AUTO_TIP, "");
}

function clearTip(el) {
  if (!el?.hasAttribute?.(AUTO_TIP)) return;
  el.removeAttribute(AUTO_TIP);
  el.removeAttribute("data-tooltip");
}

/** 悬停：从指到的那层往上 4 层，找被裁掉的字；聚焦：聚焦的那个和它里面的（提示挂在聚焦的那个上）。 */
export function markFull(target, deep) {
  if (target && target.nodeType !== 1) target = target.parentElement;
  if (!target?.matches) return;
  const chain = [];
  if (deep) chain.push(target, ...[...target.querySelectorAll("*")].slice(0, 40));
  else for (let a = target, d = 0; a && a.nodeType === 1 && d < 4; a = a.parentElement, d += 1) chain.push(a);
  // 先清掉这条链上以前自动加的提示（字可能已经放得下了），再按现在量的结果加
  chain.forEach(clearTip);
  let hit = null;
  for (const el of chain) {
    if (el.matches(FIT)) fitText(el);
    if (!hit && clipped(el)) hit = el;
  }
  if (hit) setTip(deep ? target : hit, fullText(hit));
}

export function installTruncation(root) {
  // 捕获阶段：赶在 tooltip 自己的监听之前把 data-tooltip 写好
  root.addEventListener("pointerover", (event) => markFull(event.composedPath?.()[0] ?? event.target, false), true);
  root.addEventListener("focusin", (event) => markFull(event.composedPath?.()[0] ?? event.target, true), true);
}
