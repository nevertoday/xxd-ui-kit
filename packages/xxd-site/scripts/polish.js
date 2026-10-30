// 细节检查（在浏览器里运行）：找「专业的人一眼就看出来」的小毛病。
// 返回 [{ kind, where, detail }]。audit.mjs 的「细节」一项和本地调试都用它。
//   字贴边    按钮 / chip / 徽标里的字离边框太近（被挤得没有内边距）
//   被截断    控件里的字被裁掉了（原文，不是故意测的超长文字）
//   折行      按钮、tab、徽标、chip 这类一行的控件折成了两行
//   孤字      标题、段落最后一行只剩一个字（「篇」）
//   挤成一字一行 文字被旁边的按钮、图挤到不到 3 个字宽，竖着排
//   重叠      文字、按钮、图标互相压住
//   图标没对齐 图标和旁边第一行字的垂直中心差太多
//   行高不在网格（设计师评审 V2-7） 组件里的字，行高不是 --leading-*（16 / 20 / 24 / 28 / 32 / 36），也不是单行控件的「行高 = 字号」
//   同一行文字不齐（V2-7） 表格同一行里各格的字不在一条基线上（差 1.5px 以上）
//   同一行控件高度不一（V2-7） 一排并列的控件（按钮、输入框、下拉、chip、分段）高度不一样
//   差一点没对齐（SPACING-REVIEW-PLAN D57） 一摞竖排的东西，左边差 0.75–3px：要么对齐，要么明显缩进
//   直角模式下的圆（SHAPE-LINE-PLAN D61） 直角时还画出圆角的东西（单选、转圈除外）
//   同一行控件边框不一（D62） 一排里有边的按钮、输入框、下拉、选择器，边框颜色不一样
//   字号不在阶梯上 / 字重越界 / 中文斜体 / 中文小于 12px（TYPE-REVIEW-PLAN D69–D71） 都按算出来的值查，浏览器默认的粗体、斜体也算
globalThis.xxdPolish = function xxdPolish(root = document.body, { orphans = true } = {}) {
  const out = [];
  const HIDE = "[hidden], template, [popover]:not(:popover-open), dialog:not([open]), .xxd-sr-only, .xxd-sheet:not([data-open]), .xxd-panel:not([data-open]), [inert], details:not([open]) > :not(summary), script, style, svg *";
  const shown = (el) => {
    if (el.closest(HIDE)) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) return false;
    }
    return true;
  };
  const name = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
    const owner = el.closest("[data-demo], .site-wall__cell, .site-demo, .site-dodont, .site-template, .cell, section, header, main");
    const tag = owner?.dataset?.name || owner?.dataset?.demo || owner?.querySelector?.(".site-wall__name")?.textContent?.trim() || "";
    return `${tag ? tag + " › " : ""}${el.tagName.toLowerCase()}${cls ? "." + cls : ""}「${(el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 18)}」`;
  };
  const textRects = (el) => {
    const rects = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim() || n.parentElement.closest("svg, .xxd-sr-only, [hidden]")) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 0.5) rects.push(r);
    }
    return rects;
  };
  // 同一行：竖直方向重叠超过较矮那个的一半（字号不同的数字和单位也算同一行）
  const sameLine = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.bottom - a.top, b.bottom - b.top) / 2;
  const groupLines = (rects) => {
    const lines = [];
    for (const r of rects) {
      const line = lines.find((l) => sameLine(l, r));
      if (line) Object.assign(line, { left: Math.min(line.left, r.left), right: Math.max(line.right, r.right), top: Math.min(line.top, r.top), bottom: Math.max(line.bottom, r.bottom) });
      else lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
    }
    return lines.sort((a, b) => a.top - b.top);
  };
  const lineCount = (rects) => groupLines(rects).length;

  // 1. 一行的控件：字贴边、被截断、折行
  const CONTROLS = ".xxd-btn:not([data-icon-only]), .xxd-chip, .xxd-badge, [role='tab'], .xxd-segmented > button, .xxd-menu__item, .xxd-toolbar__item, .xxd-pagination button, .xxd-sidebar__item, .xxd-rail > a";
  for (const el of root.querySelectorAll(CONTROLS)) {
    if (!shown(el) || !el.textContent.trim()) continue;
    const r = el.getBoundingClientRect();
    const rects = textRects(el);
    if (!rects.length) continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const left = Math.min(...rects.map((x) => x.left)) - r.left;
    const right = r.right - Math.max(...rects.map((x) => x.right));
    const isTab = el.matches("[role='tab'], .xxd-rail > a, .xxd-menu__item, .xxd-sidebar__item");
    const minGap = el.matches(".xxd-badge, .xxd-chip, .xxd-segmented > button") ? 4 : 6;
    if (!isTab && Math.min(left, right) < minGap) out.push({ kind: "字贴边", where: name(el), detail: `左 ${Math.round(left)}px / 右 ${Math.round(right)}px` });
    if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== "visible") out.push({ kind: "被截断", where: name(el), detail: `内容 ${el.scrollWidth}px，框 ${el.clientWidth}px` });
    for (const label of el.querySelectorAll(".xxd-label-text, :scope > span")) if (label.scrollWidth > label.clientWidth + 1 && getComputedStyle(label).textOverflow === "ellipsis") out.push({ kind: "被截断", where: name(el), detail: "标签出了省略号" });
    if (!el.matches(".xxd-rail > a") && lineCount(rects) > 1) out.push({ kind: "折行", where: name(el), detail: `${lineCount(rects)} 行` });
    void size;
  }

  // 2. 孤字：最后一行只剩一两个字
  if (orphans) {
    const BLOCKS = "h1, h2, h3, h4, p, li, dt, dd, figcaption, summary, label, td, th, legend, [class*='__title'], [class*='__desc'], [class*='__text'], [class*='__meta'], [class*='__name'], [class*='__line'], .xxd-help, .xxd-plan-line";
    for (const el of root.querySelectorAll(BLOCKS)) {
      if (!shown(el) || el.closest(CONTROLS) || el.closest("pre, code, .xxd-code, .xxd-kbd")) continue;
      if ([...el.children].some((c) => !getComputedStyle(c).display.startsWith("inline") && getComputedStyle(c).display !== "contents")) continue;
      const rects = textRects(el);
      if (rects.length < 2) continue;
      const lines = groupLines(rects);
      if (lines.length < 2) continue;
      const last = lines[lines.length - 1];
      const size = parseFloat(getComputedStyle(el).fontSize);
      const width = last.right - last.left;
      // 中文排版的惯例：最后一行只剩一个字（或一个很短的英文词）才算孤字；两个字可以接受
      if (width < size * 1.6) out.push({ kind: "孤字", where: name(el), detail: `最后一行 ${Math.round(width)}px（约 ${Math.max(1, Math.round(width / size))} 个字）` });
    }
  }

  // 2½. 挤成一字一行：任何有字的块被旁边的东西挤到不到 3 个字宽、却有 4 个字以上（竖着一个字一个字往下排）
  for (const el of root.querySelectorAll("*")) {
    if (el.closest(".xxd-rail, .xxd-glyphs, svg, .xxd-kbd, .xxd-avatar, .xxd-dot, [data-icon-only]")) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue.trim()).join("");
    if ([...own].length < 4 || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (r.width < size * 3 && lineCount(textRects(el)) >= 2) out.push({ kind: "挤成一字一行", where: name(el), detail: `${Math.round(r.width)}px 宽、${lineCount(textRects(el))} 行` });
  }

  // 3. 重叠：有字的元素、按钮、图标互相压住。行内元素按每一行的框算（折行的链接、代码不算重叠）；
  //    被 overflow 裁掉的部分不算（可滚动的代码块）
  const clipRect = (el, r) => {
    let { left, top, right, bottom } = r;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const c = p.getBoundingClientRect();
      left = Math.max(left, c.left); top = Math.max(top, c.top); right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom);
    }
    return { left, top, right, bottom };
  };
  const atoms = [];
  for (const el of root.querySelectorAll("*")) {
    if (el.matches("input, textarea, select, option, html, body, svg *")) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (!own && !el.matches("svg.ui-icon, button, a[href]")) continue;
    if (!shown(el)) continue;
    if (el.closest(".xxd-input-wrap, .xxd-input-group, .xxd-select, .xxd-thumbs, .xxd-card__media, .xxd-qr, .xxd-celebrate, [data-landmark='aside'], .xxd-tooltip, .xxd-toast-region, .xxd-chart")) continue;
    const boxes = getComputedStyle(el).display === "inline" ? [...el.getClientRects()] : [el.getBoundingClientRect()];
    for (const b of boxes) {
      const r = clipRect(el, b);
      if (r.right - r.left > 0.5 && r.bottom - r.top > 0.5) atoms.push({ el, r });
    }
  }
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a = atoms[i];
      const b = atoms[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 2 && h > 2) out.push({ kind: "重叠", where: name(a.el), detail: `压住 ${name(b.el)}（${Math.round(w)}×${Math.round(h)}px）` });
    }
  }

  // 4. 图标和旁边第一行字没对齐（同一行的 flex 里）
  for (const icon of root.querySelectorAll("svg.ui-icon")) {
    const row = icon.parentElement;
    if (!row || !shown(icon) || row.closest(".xxd-btn[data-icon-only], [data-icon-only]")) continue;
    const cs = getComputedStyle(row);
    if (!cs.display.includes("flex") || cs.flexDirection.startsWith("column")) continue;
    const next = [...row.childNodes].find((n) => n !== icon && ((n.nodeType === 3 && n.nodeValue.trim()) || (n.nodeType === 1 && n.textContent.trim() && !n.matches("svg"))));
    if (!next) continue;
    const range = document.createRange();
    range.selectNodeContents(next);
    const first = [...range.getClientRects()].find((x) => x.width > 0.5);
    if (!first) continue;
    const ir = icon.getBoundingClientRect();
    // 图标对齐第一行字，或者（两行的块，比如标题 + 说明）对齐整块的中心，都算对；允许 2.5px
    const diff = ir.top + ir.height / 2 - (first.top + first.height / 2);
    const block = next.nodeType === 1 ? next.getBoundingClientRect() : null;
    const blockDiff = block ? ir.top + ir.height / 2 - (block.top + block.height / 2) : Infinity;
    if (Math.abs(diff) > 2.5 && Math.abs(blockDiff) > 2.5) out.push({ kind: "图标没对齐", where: name(row), detail: `图标中心比第一行字${diff > 0 ? "低" : "高"} ${Math.abs(diff).toFixed(1)}px` });
  }
  // 5. 行高不在网格：只看组件（最近的带类名的祖先是 xxd- 开头，不是展示站自己的 site-）
  const LEADING = new Set([16, 20, 24, 28, 32, 36]);
  for (const el of root.querySelectorAll("*")) {
    if (el.matches("input, textarea, select, option, svg, svg *") || el.closest("pre, code, .xxd-code, .xxd-kbd, svg, .xxd-sr-only")) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) continue;
    const owner = el.closest("[class]");
    const cls = owner && typeof owner.className === "string" ? owner.className : "";
    // 展示站自己的字也要在网格上（TYPE-REVIEW-PLAN D72）：组件（xxd-）和展示站（site-）都看
    if (!/(^|\s)(xxd|site)-/.test(cls) || !shown(el) || el.closest('[data-kind="dont"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "inline") continue; // 行内的字跟着所在的段落走，看段落本身
    const lh = parseFloat(cs.lineHeight);
    const fs = parseFloat(cs.fontSize);
    if (cs.lineHeight === "normal" || Math.abs(lh - fs) < 0.5 || LEADING.has(Math.round(lh * 100) / 100)) continue;
    out.push({ kind: "行高不在网格", where: name(el), detail: `${fs}px / ${Math.round(lh * 100) / 100}px` });
  }

  // 6. 同一行文字不齐：表格同一行，各格第一行字的基线差 1.5px 以上。
  //    基线是真量出来的：在第一段字前面临时放一个 0 × 0、按基线对齐的行内块，它的底边就是这一行的基线（等宽字、不同字号都准）。
  //    只看组件的表格（.xxd-table）；展示站自己的属性表另算
  for (const tr of root.querySelectorAll(".xxd-table tr")) {
    if (!shown(tr) || tr.closest('[data-kind="dont"]')) continue;
    const marks = [];
    for (const cell of tr.cells) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      let first = null;
      // 按钮、chip、徽标（实心的）是居中的盒子，不按字的基线比；像字一样的（排序表头、带点的状态）照样比
      for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeValue.trim() && !n.parentElement.closest("svg, .xxd-sr-only, [hidden], .xxd-btn, .xxd-chip, .xxd-badge:not([data-appearance='dot']), input, select, textarea")) { first = n; break; }
      if (!first) continue;
      // 先用一个临时 span 包住这段字再放探针：字在 flex 容器里时，直接插进去的探针会自己变成一个居中的 flex 项
      const wrap = document.createElement("span");
      const probe = document.createElement("span");
      probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;margin:0;padding:0;border:0";
      first.parentNode.insertBefore(wrap, first);
      wrap.append(probe, first);
      marks.push(probe.getBoundingClientRect().bottom);
      wrap.parentNode.insertBefore(first, wrap);
      wrap.remove();
    }
    if (marks.length < 2) continue;
    const spread = Math.max(...marks) - Math.min(...marks);
    if (spread > 1.5) out.push({ kind: "同一行文字不齐", where: name(tr), detail: `各格基线相差 ${spread.toFixed(1)}px` });
  }

  // 7. 同一行控件高度不一：一个横排的 flex 容器里，并排（竖直方向重叠）的几个控件高度要一样
  const FIELD = ".xxd-btn:not([data-icon-only]), .xxd-input, .xxd-select, .xxd-input-wrap, .xxd-input-group, .xxd-chip, .xxd-segmented, .xxd-picker__trigger, .xxd-search";
  for (const box of root.querySelectorAll("*")) {
    const cs = getComputedStyle(box);
    if (!cs.display.includes("flex") || cs.flexDirection.startsWith("column") || !shown(box) || box.closest('[data-kind="dont"]')) continue;
    const items = [...box.children].filter((c) => c.matches(FIELD) && shown(c));
    if (items.length < 2) continue;
    const rows = groupLines(items.map((c) => c.getBoundingClientRect()));
    for (const line of rows) {
      // 故意并排展示不同尺寸（写了不同的 data-size）不算：同一个 data-size 的才要求一样高
      const inLine = items.filter((c) => sameLine(c.getBoundingClientRect(), line));
      const sized = new Set(inLine.map((c) => c.dataset.size ?? "md"));
      if (sized.size > 1) continue;
      const heights = [...new Set(inLine.map((c) => Math.round(c.getBoundingClientRect().height)))];
      if (heights.length > 1) out.push({ kind: "同一行控件高度不一", where: name(box), detail: inLine.map((c) => `${name(c).split("›").pop().trim()} ${Math.round(c.getBoundingClientRect().height)}px`).join("、") });
    }
  }

  // 8. 差一点没对齐（D57：只有外线和内线两条）：一摞竖排的东西，各项的左边差 0.75–3px。
  //    框（自己画了左边框或底色）按框的边算；没有框的按第一处字 / 图标 / 控件算。居中的不算。
  const LEAF = "svg, img, iframe, input, select, textarea, button, canvas, video, [role=switch], [role=checkbox], [role=radio]";
  const visibleBox = (el) => {
    let l = Infinity, r = -Infinity;
    const add = (x) => { l = Math.min(l, x.left); r = Math.max(r, x.right); };
    for (const x of textRects(el)) add(x);
    for (const c of el.querySelectorAll(LEAF)) if (shown(c) && !c.parentElement.closest("svg")) add(c.getBoundingClientRect());
    if (el.matches(LEAF)) add(el.getBoundingClientRect());
    // 里面画了左边框的东西（手机框、卡片），看得见的边是那条框线
    let n = 0;
    for (const c of el.querySelectorAll("[class]")) {
      if ((n += 1) > 200) break;
      const cs = getComputedStyle(c);
      if (parseFloat(cs.borderLeftWidth) >= 1 && cs.borderLeftStyle !== "none" && shown(c)) add(c.getBoundingClientRect());
    }
    return { l, r };
  };
  const boxed = (el, cs) => (parseFloat(cs.borderLeftWidth) >= 1 && cs.borderLeftStyle !== "none" && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.borderLeftColor)) ||
    (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && el.parentElement && getComputedStyle(el.parentElement).backgroundColor !== cs.backgroundColor);
  for (const stack of root.querySelectorAll("*")) {
    // 表格的格（窄屏上会叠起来）、图（量表的刻度数按字形居中）不算
    if (stack.closest('[data-kind="dont"], svg, pre, .xxd-code, table, [class*="xxd-gauge"]') || !shown(stack)) continue;
    // 只看块：行内的字换行到下一行是排版，不是对齐
    const kids = [...stack.children].filter((k) => shown(k) && !k.matches("script, style, template") && !getComputedStyle(k).display.startsWith("inline"));
    if (kids.length < 2) continue;
    const scs = getComputedStyle(stack);
    if (scs.display.includes("flex") && !scs.flexDirection.startsWith("column")) continue;
    if (scs.display.includes("grid") && scs.gridTemplateColumns.split(" ").length > 1) continue;
    const items = [];
    let prevBottom = -Infinity, vertical = true;
    for (const k of kids) {
      const b = k.getBoundingClientRect();
      if (b.top < prevBottom - 2) { vertical = false; break; }
      prevBottom = b.bottom;
      const cs = getComputedStyle(k);
      if (cs.textAlign === "center" || cs.justifyContent === "center" || cs.position === "absolute") continue;
      if ((cs.display.includes("flex") && cs.flexDirection.startsWith("column") && cs.alignItems === "center") || (cs.display.includes("grid") && cs.justifyItems === "center")) continue; // 竖排居中（侧栏图标 + 字）
      const v = visibleBox(k);
      // 靠右对齐的字（雷达图左边的名字和数）：比的是右边，左边参差是本来就该有的
      const end = !boxed(k, cs) && (cs.textAlign === "right" || (cs.textAlign === "end" && cs.direction === "ltr"));
      const l = boxed(k, cs) ? b.left : end ? v.r : v.l;
      if (!Number.isFinite(l)) continue;
      // 内容在自己的框里居中（演示区、按钮组、图例居中）：左边离多远是凑出来的，不算
      if (!boxed(k, cs) && v.l - b.left > 4 && Math.abs(v.l - b.left - (b.right - v.r)) < 2) continue;
      items.push({ k, l, end });
    }
    if (!vertical) continue;
    for (let i = 1; i < items.length; i++) {
      if (items[i].end !== items[i - 1].end) continue;
      const d = Math.abs(items[i].l - items[i - 1].l);
      if (d > 0.75 && d <= 3) {
        out.push({ kind: "差一点没对齐", where: name(stack), detail: `${name(items[i - 1].k).split("›").pop().trim()} 和 ${name(items[i].k).split("›").pop().trim()} ${items[i].end ? "右" : "左"}边差 ${d.toFixed(1)}px` });
        break;
      }
    }
  }

  // 9. 直角模式下的圆（D61）：这一处的 --r-md 是 0（直角），却画出了圆角。只有单选和转圈可以永远是圆
  // [data-radius-sample]：圆角页上画出每个圆角令牌本身的样品
  const ROUND_OK = ".xxd-radio, .xxd-spinner, [role='radio'] *, [data-kumo-component='Radio'] *, svg, svg *, [data-radius-sample]";
  for (const el of root.querySelectorAll("*")) {
    if (el.closest('[data-kind="dont"]') || el.matches(ROUND_OK) || !shown(el)) continue;
    if (parseFloat(getComputedStyle(el).getPropertyValue("--r-md")) !== 0) continue; // 圆角模式的样品、对照
    for (const pseudo of [null, "::before", "::after"]) {
      const cs = getComputedStyle(el, pseudo);
      if (pseudo && (cs.content === "none" || cs.content === "normal")) continue;
      if (pseudo === "::before" && el.matches("[aria-busy='true']")) continue; // 按钮里的转圈
      if (!(parseFloat(cs.borderTopLeftRadius) > 0)) continue;
      const paints = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") || cs.boxShadow !== "none" || el.tagName === "IMG";
      if (paints) { out.push({ kind: "直角模式下的圆", where: name(el) + (pseudo || ""), detail: `圆角 ${cs.borderTopLeftRadius}` }); break; }
    }
  }

  // 10. 同一行控件边框不一（D62）：一排里有边的控件，边框颜色要一样（主按钮、危险、幽灵、按下的、出错的、禁用的、聚焦的不比）
  const EDGED = ".xxd-btn:not([data-variant='primary'], [data-variant='danger'], [data-variant='danger-outline'], [data-variant='ghost'], .ui-dialog-cancel, [aria-pressed='true'], :disabled), .xxd-input, .xxd-select > select, .xxd-picker__trigger, .xxd-input-group, .xxd-taginput";
  for (const box of root.querySelectorAll("*")) {
    const cs = getComputedStyle(box);
    if (!cs.display.includes("flex") || cs.flexDirection.startsWith("column") || !shown(box) || box.closest('[data-kind="dont"]')) continue;
    const items = [...box.children].map((c) => (c.matches(EDGED) ? c : c.querySelector(":scope > select"))).filter((c) => c && c.matches(EDGED) && shown(c) && !c.matches("[aria-invalid='true'], :focus, :disabled") && !c.closest("[aria-invalid='true']"));
    if (items.length < 2) continue;
    for (const line of groupLines(items.map((c) => c.getBoundingClientRect()))) {
      const inLine = items.filter((c) => sameLine(c.getBoundingClientRect(), line));
      const colors = [...new Set(inLine.map((c) => getComputedStyle(c).borderTopColor))];
      if (colors.length > 1) out.push({ kind: "同一行控件边框不一", where: name(box), detail: inLine.map((c) => `${name(c).split("›").pop().trim()} ${getComputedStyle(c).borderTopColor}`).join("、") });
    }
  }

  // 11. 字（TYPE-REVIEW-PLAN D69–D71）：算出来的字号在阶梯上、字重只有 400 / 500 / 600、中文不斜、中文不小于 12px
  const STEPS = new Set([11, 12, 13, 14, 16, 20, 24, 28]);
  const CJK = /[\u3400-\u9fff]/;
  for (const el of root.querySelectorAll("*")) {
    if (el.closest('[data-kind="dont"], svg, .xxd-sr-only') || el.matches("input, textarea, select, option")) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim()).map((n) => n.nodeValue).join("");
    if (!text.trim() || !shown(el)) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    if (!STEPS.has(Math.round(fs * 100) / 100)) out.push({ kind: "字号不在阶梯上", where: name(el), detail: `${cs.fontSize}` });
    if (!["400", "500", "600"].includes(cs.fontWeight)) out.push({ kind: "字重越界", where: name(el), detail: `字重 ${cs.fontWeight}` });
    if (cs.fontStyle !== "normal" && CJK.test(text)) out.push({ kind: "中文斜体", where: name(el), detail: cs.fontStyle });
    if (fs < 12 && CJK.test(text)) out.push({ kind: "中文小于 12px", where: name(el), detail: cs.fontSize });
  }
  return out;
};
