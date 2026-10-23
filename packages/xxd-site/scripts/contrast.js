// 颜色和对比度（COLOR-REVIEW-PLAN D81，在浏览器里运行）。audit 的「对比度」一项用它。
//   1. xxdContrast：每段字的真实对比度。底色自己合成（从字往上一层层叠半透明的底），不靠 axe——axe 遇到背景图（表格的滚动阴影）、
//      半透明层就标「待定」跳过，全站的表格从来没被它查过。禁用的、进行中（aria-busy，字故意透明）的不算。
//   2. xxdStates：选中 / 当前 / 按下的东西至少有一个 ≥ 3:1 的记号（底色、边框、描边环、左边的线、画出来的记号），不能只靠淡底（D76）。
globalThis.xxdContrast = function (opts = {}) {
  const out = [];
  const c2 = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  const rgba = (v) => { c2.clearRect(0, 0, 1, 1); c2.fillStyle = "rgba(0,0,0,0)"; c2.fillStyle = v; c2.fillRect(0, 0, 1, 1); const d = c2.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); if (!a) return [0, 0, 0, 0]; return [0, 1, 2].map((i) => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat(a); };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const cls = (el) => (typeof el.className === "string" ? el.className : "").trim().split(/\s+/).filter(Boolean);
  const owner = (el) => { for (let p = el; p && p !== document.body; p = p.parentElement) { const k = cls(p).find((x) => /^(xxd|site)-/.test(x)); if (k) return k; } return el.tagName.toLowerCase(); };
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let p = el; p && p !== document.documentElement; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === "none" || cs.visibility === "hidden") return false; } return true; };
  const pageBg = rgba(getComputedStyle(document.body).backgroundColor)[3] ? rgba(getComputedStyle(document.body).backgroundColor) : rgba(getComputedStyle(document.documentElement).backgroundColor);
  function background(el) {
    // 从自己往上收集底色，遇到不透明的就停；背景图、渐变、透明度记下来
    const layers = []; let unknown = "";
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.backgroundImage !== "none" && !/^url\(.*\.svg/.test(cs.backgroundImage)) unknown ||= `背景图 ${owner(p)}`;
      if (parseFloat(cs.opacity) < 1) unknown ||= `透明度 ${cs.opacity} ${owner(p)}`;
      const bg = rgba(cs.backgroundColor);
      if (bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) break; }
      if (p === document.documentElement) layers.push(pageBg[3] ? pageBg : [255, 255, 255, 1]);
    }
    let col = [255, 255, 255, 1];
    for (const l of layers.reverse()) col = over(l, col);
    return { col, unknown };
  }
  for (const el of document.querySelectorAll(opts.scope || "main *")) {
    if (el.closest("[data-kind=dont], svg, .xxd-sr-only, [aria-hidden=true], [inert]")) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim()).map((n) => n.nodeValue.trim()).join(" ");
    if (!own || !vis(el)) continue;
    if (el.closest("[aria-busy=true]")) continue;
    const disabled = el.closest(":disabled, [aria-disabled=true], fieldset:disabled") || el.closest("label")?.querySelector("input:disabled");
    const cs = getComputedStyle(el);
    const fg0 = rgba(cs.color);
    const { col: bg, unknown } = background(el);
    const fg = over(fg0, bg);
    const r = ratio(fg, bg);
    const fs = parseFloat(cs.fontSize), fw = Number(cs.fontWeight);
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const need = disabled ? 0 : large ? 3 : 4.5;
    if (r < need || unknown) out.push({ where: `${owner(el)}>${el.tagName.toLowerCase()}${cls(el)[0] ? "." + cls(el)[0] : ""}`, t: own.slice(0, 18), r: +r.toFixed(2), need, fs, unknown, fg: cs.color, bg: `rgb(${bg.slice(0, 3).map(Math.round).join(",")})` });
  }
  return out;
};

globalThis.xxdStates = function () {
  const out = [];
  const c2 = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  const rgba = (v) => { c2.clearRect(0, 0, 1, 1); c2.fillStyle = "rgba(0,0,0,0)"; c2.fillStyle = v; c2.fillRect(0, 0, 1, 1); const d = c2.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (t, b) => { const a = t[3] + b[3] * (1 - t[3]); return a ? [0, 1, 2].map((i) => (t[i] * t[3] + b[i] * b[3] * (1 - t[3])) / a).concat(a) : [0, 0, 0, 0]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => { const layers = []; for (let p = el; p; p = p.parentElement) { const c = rgba(getComputedStyle(p).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let col = [255, 255, 255, 1]; for (const l of layers.reverse()) col = over(l, col); return col; };
  const cls = (el) => (typeof el.className === "string" ? el.className : "").trim().split(/\s+/).filter(Boolean);
  // tab 有自己的下划线（.xxd-tabs__ink 或 ::after），表格 / 列表的选中行里有勾上的复选或单选：控件已经说了选了哪个
  const SEL = "main [aria-selected=true]:not([role=tab]), main [aria-current=page], main [aria-current=true], main [aria-pressed=true], main [aria-checked=true]:not(input), main .xxd-option[data-active]";
  for (const el of document.querySelectorAll(SEL)) {
    if (el.closest("[data-kind=dont]") || el.querySelector("input:checked")) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el);
    const parent = el.parentElement;
    const mine = bgOf(el), around = bgOf(parent);
    const cues = [];
    const tint = ratio(mine, around);
    if (tint >= 3) cues.push(`底色 ${tint.toFixed(2)}`);
    for (const s of ["Top", "Right", "Bottom", "Left"]) { const w = parseFloat(cs[`border${s}Width`]); const c = rgba(cs[`border${s}Color`]); if (w && c[3] > 0 && ratio(over(c, around), around) >= 3) { cues.push(`边框 ${s}`); break; } }
    if (cs.boxShadow !== "none") { const m = cs.boxShadow.match(/rgba?\([^)]*\)/); if (m && ratio(over(rgba(m[0]), around), around) >= 3) cues.push("描边环"); }
    if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) cues.push("轮廓");
    for (const ps of ["::before", "::after"]) { const p = getComputedStyle(el, ps); if (p.content !== "none" && p.content !== "normal") { const c = rgba(p.backgroundColor); const bc = rgba(p.borderTopColor); if ((c[3] > 0 && ratio(over(c, mine), mine) >= 3) || (parseFloat(p.borderTopWidth) && ratio(over(bc, mine), mine) >= 3) || (p.maskImage && p.maskImage !== "none") || /[✓✔]/.test(p.content)) cues.push(`记号 ${ps}`); } }
    if (el.querySelector("svg, .ui-icon, [data-xxd-icon]") && /checked|selected/.test(el.getAttribute("aria-checked") + el.getAttribute("aria-selected"))) cues.push("图标?");
    // 字：和同组没选中的兄弟比字重、颜色
    const sib = [...(parent?.children || [])].find((s) => s !== el && s.tagName === el.tagName && !s.matches("[aria-selected=true],[aria-current],[aria-pressed=true],[aria-checked=true],[data-active]"));
    if (sib) { const a = getComputedStyle(sib); if (a.fontWeight !== cs.fontWeight) cues.push(`字重 ${a.fontWeight}→${cs.fontWeight}`); const tc = ratio(rgba(a.color), rgba(cs.color)); if (tc >= 1.5) cues.push(`字色差 ${tc.toFixed(2)}`); }
    const strong = cues.filter((c) => !/^字色差|^图标\?/.test(c));
    out.push({ el: `${el.tagName.toLowerCase()}.${cls(el).slice(0, 2).join(".")}`, attr: ["aria-selected", "aria-current", "aria-pressed", "aria-checked", "data-active", "aria-expanded"].filter((a) => el.hasAttribute(a)).join(","), tint: +tint.toFixed(2), cues: cues.join("、") || "（只有淡底色）", weak: strong.length === 0, t: el.textContent.trim().slice(0, 12) });
  }
  return out;
};
