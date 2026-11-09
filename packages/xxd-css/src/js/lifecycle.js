// 生命周期：install 期间同步注册的事件监听都挂上同一个 AbortSignal，建的观察者都记下来；uninstall 一次撤掉。
// 做法是在同步的 install 调用期间临时包一层 addEventListener / observe —— 不用改每个组件模块，
// 以后新加的 install* 也自动算在内。调用结束立刻还原，install 之外注册的监听不受影响。
const OBSERVERS = ["MutationObserver", "ResizeObserver", "IntersectionObserver"];

/** 沿原型链找到真正持有 addEventListener 的原型（不同环境里 DOM 节点和 window 可能不是同一个 EventTarget）。 */
function ownerOf(obj) {
  for (let p = obj && Object.getPrototypeOf(obj); p; p = Object.getPrototypeOf(p)) {
    if (Object.prototype.hasOwnProperty.call(p, "addEventListener")) return p;
  }
  return null;
}

// 正在跑的那次 install 的 signal（firstTime 用）
let current = null;
const FOREVER = { aborted: false };

/**
 * 每个元素「在这次 install 里」只做一次。只记 WeakSet 的话，uninstall 撤掉了监听和观察者、记号却还在，
 * 再 install 时以为做过了：tab 下划线不跟尺寸、表格边缘不渐隐、热力格读数没了。记下当时的 signal，它 abort 了就重新做。
 */
export function firstTime(map, obj) {
  const done = map.get(obj);
  if (done && !done.aborted) return false;
  map.set(obj, current ?? FOREVER);
  return true;
}

export function collect(signal, fn, root) {
  const outer = current;
  current = signal;
  const owners = [...new Set([root, root?.ownerDocument, globalThis.document, globalThis].map(ownerOf).filter(Boolean))];
  const adds = owners.map((p) => p.addEventListener);
  const kinds = OBSERVERS.map((n) => globalThis[n]?.prototype).filter(Boolean);
  const observe = kinds.map((p) => p.observe);
  const observers = new Set();
  owners.forEach((p, i) => {
    const add = adds[i];
    p.addEventListener = function (type, listener, options) {
      // AbortSignal 自己的监听不挂（实现里登记 signal 时会在 signal 上再 addEventListener，挂了会无限递归）
      if (globalThis.AbortSignal && this instanceof globalThis.AbortSignal) return add.call(this, type, listener, options);
      const opts =
        options == null || typeof options === "boolean"
          ? { capture: Boolean(options), signal }
          : options.signal
            ? options
            : { ...options, signal };
      return add.call(this, type, listener, opts);
    };
  });
  kinds.forEach((p, i) => {
    p.observe = function (...args) {
      observers.add(this);
      return observe[i].apply(this, args);
    };
  });
  try {
    return fn();
  } finally {
    current = outer;
    owners.forEach((p, i) => (p.addEventListener = adds[i]));
    kinds.forEach((p, i) => (p.observe = observe[i]));
    signal.addEventListener("abort", () => observers.forEach((o) => o.disconnect()), { once: true });
  }
}
