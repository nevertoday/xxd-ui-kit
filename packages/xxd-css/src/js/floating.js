// 把浮层放到锚点旁边：先按指定方向，放不下就翻到另一侧，再夹在视口里。
export function place(anchor, floating, { placement = "bottom-start", offset = 6, padding = 8 } = {}) {
  const a = anchor.getBoundingClientRect();
  // 浮层的尺寸用布局尺寸：打开时有从 96% 放大的动画，getBoundingClientRect 会把缩放算进去，量矮了就不会往上翻、会伸出视口
  const box = floating.getBoundingClientRect();
  const f = { width: floating.offsetWidth || box.width, height: floating.offsetHeight || box.height };
  const vw = globalThis.innerWidth || document.documentElement.clientWidth;
  const vh = globalThis.innerHeight || document.documentElement.clientHeight;
  let [side, align = "center"] = placement.split("-");
  if (side === "right" || side === "left") {
    // 侧向（子菜单）：放不下就翻到另一边
    const roomRight = vw - a.right - offset - padding;
    const roomLeft = a.left - offset - padding;
    if (side === "right" && f.width > roomRight && roomLeft > roomRight) side = "left";
    else if (side === "left" && f.width > roomLeft && roomRight > roomLeft) side = "right";
    let left = side === "right" ? a.right + offset : a.left - offset - f.width;
    let top = align === "end" ? a.bottom - f.height : a.top - 4;
    left = Math.min(Math.max(padding, left), Math.max(padding, vw - f.width - padding));
    top = Math.min(Math.max(padding, top), Math.max(padding, vh - f.height - padding));
    floating.style.top = `${Math.round(top)}px`;
    floating.style.left = `${Math.round(left)}px`;
    floating.dataset.side = side;
    floating.style.setProperty("--xxd-origin", `${side === "right" ? "0" : "100%"} ${Math.round(a.top + a.height / 2 - top)}px`);
    return { top, left, side };
  }
  const room = { bottom: vh - a.bottom - offset - padding, top: a.top - offset - padding };
  if (side === "bottom" && f.height > room.bottom && room.top > room.bottom) side = "top";
  else if (side === "top" && f.height > room.top && room.bottom > room.top) side = "bottom";
  let top = side === "bottom" ? a.bottom + offset : a.top - offset - f.height;
  let left = align === "start" ? a.left : align === "end" ? a.right - f.width : a.left + (a.width - f.width) / 2;
  left = Math.min(Math.max(padding, left), Math.max(padding, vw - f.width - padding));
  top = Math.min(Math.max(padding, top), Math.max(padding, vh - f.height - padding));
  floating.style.top = `${Math.round(top)}px`;
  floating.style.left = `${Math.round(left)}px`;
  floating.dataset.side = side;
  // 从锚点方向长出来（D4）：缩放原点 = 锚点中心在浮层上的位置；箭头也对着锚点。
  const anchorX = Math.min(Math.max(a.left + a.width / 2 - left, 8), Math.max(8, f.width - 8));
  floating.style.setProperty("--xxd-origin", `${Math.round(anchorX)}px ${side === "bottom" ? "0" : "100%"}`);
  floating.style.setProperty("--xxd-arrow-x", `${Math.round(anchorX)}px`);
  return { top, left, side };
}
