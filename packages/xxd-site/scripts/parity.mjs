// 两种实现对照（设计师评审 V1）：读 /tools/parity/，同一对的 HTML 和 React 逐项比较。以 HTML 为准（D19）。
// 比较的是看得见的东西：尺寸、字号、字重、文字颜色、底色、边（border 或 Kumo 用的 ring）、圆角、内边距、对齐。
// 用法：audit 的 --only=parity，也可以单独 node scripts/parity.mjs <origin>。

/** 每一对：[部位, HTML 里的选择器, React 里的选择器, 要比的属性] */
export const PARTS = {
  button: [["按钮", "button", "button", ["height", "paddingLeft", "fontSize", "fontWeight", "color", "background", "edge", "radius", "highlight", "opacity"]]],
  input: [["输入框", "input", "input", ["height", "paddingLeft", "fontSize", "fontWeight", "color", "background", "edge", "radius", "opacity"]]],
  select: [["选择框", ".xxd-select select", "[data-kumo-component=Select], button", ["height", "fontSize", "fontWeight", "color", "background", "edge", "radius"]]],
  checkbox: [
    ["方框", "input", "[role=checkbox]", ["width", "height", "background", "edge", "radius", "opacity"]],
    ["文字", "label", "label", ["fontSize", "fontWeight", "color"]],
  ],
  switch: [
    ["开关", "input", "[role=switch]", ["width", "height", "background", "edge", "radius", "opacity"]],
    ["文字", "label", "label", ["fontSize", "fontWeight", "color"]],
  ],
  radio: [
    ["圆点", "input", "[role=radio]", ["width", "height", "edge", "radius"]],
    // 选中的中心点：原生是 input 的底色（外面一圈 inset 的纸色），React 是里面那个小圆
    ["中心点", "input:checked", "[role=radio][data-checked] > span > span", ["background"]],
    ["文字", "label", "label", ["fontSize", "fontWeight", "color"]],
    ["标题", "legend", "legend, [id$=legend], fieldset > div:first-child", ["fontSize", "fontWeight", "color"]],
  ],
  tabs: [
    ["选中的标签", "[role=tab][aria-selected=true]", "[role=tab][aria-selected=true]", ["height", "fontSize", "fontWeight", "color"]],
    ["没选中的标签", "[role=tab]:not([aria-selected=true])", "[role=tab]:not([aria-selected=true])", ["fontSize", "fontWeight", "color"]],
    ["下划线", "__ink", "__ink", ["inkHeight", "inkWidth"]],
  ],
  badge: [["徽标", ".xxd-badge", "span", ["height", "paddingLeft", "fontSize", "fontWeight", "color", "background", "edge", "radius"]]],
  table: [
    // 外框只比底色：原生的 .xxd-table-wrap 另有「还能横向滑」的渐隐提示（背景图），React 的表格外框是用的人自己写的
    ["外框", ".xxd-table-wrap", "div:has(> table)", ["edge", "radius", "backgroundColor"]],
    ["表头", "th", "th", ["height", "paddingLeft", "fontSize", "fontWeight", "color", "background"]],
    ["单元格", "td", "td", ["height", "paddingLeft", "fontSize", "fontWeight", "color"]],
    ["数字列", "td:last-child", "td:last-child", ["textAlign", "numeric"]],
    ["行线", "tbody tr", "tbody tr", ["rowLine"]],
  ],
  // 条形榜、构成条（CHART-TYPES-PLAN H4）：比条的粗细、颜色和圆角，名字和数字的字
  bars: [
    ["重点的条", "[data-highlight] .xxd-bars__fill", "[data-highlight] .xxd-bars__fill", ["height", "background", "radius"]],
    ["其余的条", ".xxd-bars__item:not([data-highlight]) .xxd-bars__fill", ".xxd-bars__item:not([data-highlight]) .xxd-bars__fill", ["background"]],
    ["名字", ".xxd-bars__label", ".xxd-bars__label", ["fontSize", "color"]],
    ["数字", ".xxd-bars__value", ".xxd-bars__value", ["fontSize", "fontWeight", "color", "numeric"]],
  ],
  proportion: [
    ["第一段", ".xxd-proportion__part", ".xxd-proportion__part", ["height", "background"]],
    ["第二段", ".xxd-proportion__part[data-part='1']", ".xxd-proportion__part[data-part='1']", ["background"]],
    ["图例", ".xxd-legend__name", ".xxd-legend__name", ["fontSize", "color"]],
    ["合计", ".xxd-proportion__total", ".xxd-proportion__total", ["fontSize", "color"]],
  ],
  // 量表（GAUGE-PLAN G4）：两边都用 @xxd/css/gauge 画，比表盘大小、线的颜色和中间的字
  gauge: [
    ["表盘", ".xxd-gauge__dial", ".xxd-gauge__dial", ["width", "height"]],
    ["轨道", ".xxd-gauge__track", ".xxd-gauge__track", ["stroke", "cap"]],
    ["填充", "[class^=xxd-gauge__fill], [class^=xxd-gauge__part-0]", "[class^=xxd-gauge__fill], [class^=xxd-gauge__part-0]", ["stroke", "cap"]],
    ["数字", ".xxd-gauge__value", ".xxd-gauge__value", ["fontSize", "fontWeight", "color", "numeric"]],
    ["标签", ".xxd-gauge__label, .xxd-legend__name", ".xxd-gauge__label, .xxd-legend__name", ["fontSize", "color"]],
  ],
};

/** 对照跑三种外观：亮直角墨色、暗圆角主色紧凑、亮圆角质感 */
export const PARITY_LOOKS = [
  { theme: "light", corners: "square", accent: "", density: "comfortable", finish: "flat" },
  { theme: "dark", corners: "rounded", accent: "#2a8a7a", density: "compact", finish: "flat" },
  { theme: "light", corners: "rounded", accent: "#c4495a", density: "comfortable", finish: "material" },
];

const kindOf = (id) => id.split("-")[0];

/** 在页面里读一个部位的样式（序列化成字符串好比较） */
function measure([cellSel, sel, props]) {
  const cell = document.querySelector(cellSel);
  if (!cell) return { missing: "cell" };
  const canvas = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  // 颜色一律画到画布上读回像素（color-mix / oklch / color(srgb) 和十六进制才比得了）；每个通道差 2 以内算一样
  const norm = (c) => {
    if (!c || c === "transparent") return "transparent";
    canvas.clearRect(0, 0, 1, 1);
    canvas.fillStyle = "#000";
    canvas.fillStyle = c;
    canvas.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
    if (a === 0) return "transparent";
    const q = (v) => Math.round(v / 3) * 3;
    return `rgb(${q(r)},${q(g)},${q(b)}${a < 255 ? `,${(a / 255).toFixed(2)}` : ""})`;
  };
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  let el;
  if (sel === "__ink") {
    const tab = cell.querySelector("[role=tab][aria-selected=true]");
    const tr = tab?.getBoundingClientRect();
    // 下划线：标签下面、2px 以内高、横着的那一块（伪元素或单独的元素）
    const cands = [...cell.querySelectorAll("*")].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.height <= 4 && r.width > 4 && tr && r.top >= tr.bottom - 6; });
    let ink = cands[0]?.getBoundingClientRect();
    if (!ink && tab) {
      const a = getComputedStyle(tab, "::after");
      if (a.content !== "none") ink = { height: parseFloat(a.height), width: parseFloat(a.width) || tr.width };
      const b = getComputedStyle(tab);
      if (!ink && parseFloat(b.borderBottomWidth) > 0) ink = { height: parseFloat(b.borderBottomWidth), width: tr.width };
    }
    return ink ? { inkHeight: `${Math.round(ink.height)}px`, inkWidth: `${Math.round(ink.width)}px` } : { missing: "下划线" };
  }
  el = [...cell.querySelectorAll(sel)].find(visible) ?? [...cell.querySelectorAll(sel)][0];
  if (!el) return { missing: sel };
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const out = {};
  for (const p of props) {
    if (p === "height") out.height = `${Math.round(r.height)}px`;
    else if (p === "width") out.width = `${Math.round(r.width)}px`;
    else if (p === "paddingLeft") out.paddingLeft = s.paddingLeft;
    else if (p === "fontSize") out.fontSize = s.fontSize;
    else if (p === "fontWeight") out.fontWeight = s.fontWeight;
    else if (p === "color") out.color = norm(s.color);
    else if (p === "highlight") {
      // 质感的内高光：box-shadow 里有一层 inset、颜色不透明度 > 0
      const layers = s.boxShadow === "none" ? [] : s.boxShadow.split(/,(?![^(]*\))/);
      out.highlight = layers.some((l) => /inset/.test(l) && norm(l.match(/(?:rgba?|color|oklch|oklab)\([^)]*\)|#\w+/)?.[0]) !== "transparent") ? "有" : "无";
    }
    else if (p === "backgroundColor") out.backgroundColor = norm(s.backgroundColor);
    else if (p === "stroke") out.stroke = norm(s.stroke);
    else if (p === "cap") out.cap = s.strokeLinecap;
    else if (p === "background") out.background = s.backgroundImage !== "none" ? `image ${s.backgroundImage.slice(0, 30)}` : norm(s.backgroundColor);
    else if (p === "radius") out.radius = s.borderTopLeftRadius;
    else if (p === "opacity") { let o = 1; for (let e = el; e && e !== cell; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); out.opacity = o.toFixed(2); }
    else if (p === "textAlign") { const range = document.createRange(); range.selectNodeContents(el); const tr = range.getBoundingClientRect(); out.textAlign = Math.abs(tr.right - (r.right - parseFloat(s.paddingRight))) < 2 ? "右" : "左"; }
    else if (p === "numeric") out.numeric = s.fontVariantNumeric.includes("tabular") ? "等宽" : "比例";
    else if (p === "rowLine") { const cells = [...el.children]; const c = getComputedStyle(cells[0] ?? el); const w = Math.max(parseFloat(s.borderBottomWidth) || 0, parseFloat(c.borderBottomWidth) || 0, parseFloat(s.borderTopWidth) || 0, parseFloat(c.borderTopWidth) || 0); out.rowLine = w > 0 ? "有" : "无"; }
    else if (p === "edge") {
      // 边：border 优先；没有就看 box-shadow 里的 0 0 0 Npx（Tailwind ring）或者 inset
      const bw = parseFloat(s.borderTopWidth);
      if (bw > 0 && s.borderTopStyle !== "none" && norm(s.borderTopColor) !== "transparent") out.edge = `${Math.round(bw)}px ${norm(s.borderTopColor)}`;
      else {
        // Tailwind 的 ring 是好几层 box-shadow 叠在一起（前面几层是透明的 0px）：找第一层看得见的「0 0 0 Npx 颜色」
        const layers = s.boxShadow === "none" ? [] : s.boxShadow.split(/,(?![^(]*\))/);
        const ring = layers.map((l) => {
          const c = l.match(/(?:rgba?|color|oklch|oklab)\([^)]*\)|#\w+/)?.[0];
          const n = l.replace(c ?? "", "").trim().split(/\s+/).map(parseFloat);
          return n.length >= 4 && n[0] === 0 && n[1] === 0 && n[2] === 0 && n[3] > 0 && norm(c) !== "transparent" ? `${Math.round(n[3])}px ${norm(c)}` : null;
        }).find(Boolean);
        out.edge = ring ?? "无";
      }
    }
  }
  return out;
}

/** 比一页（已经打开的 /tools/parity/）。返回 [差异说明] */
export async function compareParity(tab) {
  await tab.waitForFunction(() => [...document.querySelectorAll('[data-impl="react"]')].every((c) => c.querySelector("astro-island:not([ssr])") || c.textContent.trim()), null, { timeout: 15000 }).catch(() => {});
  await tab.waitForTimeout(300);
  const ids = await tab.$$eval('[data-impl="html"]', (cells) => cells.map((c) => c.dataset.pair));
  const diffs = [];
  for (const id of ids) {
    for (const [part, hsel, rsel, props] of PARTS[kindOf(id)] ?? []) {
      const h = await tab.evaluate(measure, [`[data-pair="${id}"][data-impl="html"]`, hsel, props]);
      const r = await tab.evaluate(measure, [`[data-pair="${id}"][data-impl="react"]`, rsel, props]);
      if (h.missing || r.missing) { diffs.push(`${id} ${part}：找不到（HTML ${h.missing ?? "有"} / React ${r.missing ?? "有"}）`); continue; }
      for (const k of Object.keys(h)) if (h[k] !== r[k]) diffs.push(`${id} ${part} ${k}：HTML ${h[k]} ↔ React ${r[k]}`);
    }
  }
  return diffs;
}

/** 浮层（对话框、菜单）放不进对照页的格子：到组件页上把两种实现各打开一次再比。返回 [差异说明] */
export const OVERLAYS = [
  {
    slug: "dialog",
    html: { open: '[data-xxd-dialog-open="d1"]', parts: { 外框: "dialog[open]", 标题: "dialog[open] .xxd-dialog__title", 正文: "dialog[open] .xxd-dialog__body p", 主按钮: "dialog[open] .xxd-dialog__actions .xxd-btn:last-child", 取消: "dialog[open] .ui-dialog-cancel" } },
    // 只认打开着的那个（组件页的规格样品也是 role="dialog"）
    react: { parts: { 外框: "[role=dialog][data-open]", 标题: "[role=dialog][data-open] h2", 正文: "[role=dialog][data-open] p", 主按钮: "[role=dialog][data-open] [data-xxd-part=dialog-actions] > :last-child", 取消: "[role=dialog][data-open] [data-xxd-cancel]" } },
    props: { 外框: ["width", "radius", "edge", "background"], 标题: ["fontSize", "fontWeight", "color"], 正文: ["fontSize", "color"], 主按钮: ["height", "fontSize", "fontWeight", "color", "background"], 取消: ["height", "fontSize", "color"] },
    centered: true,
  },
  {
    slug: "menu",
    html: { open: '[data-xxd-menu="m1"]', parts: { 外框: ".xxd-menu:popover-open", 菜单项: ".xxd-menu:popover-open .xxd-menu__item" } },
    react: { parts: { 外框: "[role=menu]", 菜单项: "[role=menu] [role=menuitem]" } },
    props: { 外框: ["paddingLeft", "radius", "edge", "background"], 菜单项: ["height", "paddingLeft", "fontSize", "fontWeight", "color"] },
  },
];

export async function compareOverlays(browser, origin, look) {
  const diffs = [];
  for (const o of OVERLAYS) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), look);
    const tab = await ctx.newPage();
    await tab.goto(`${origin}/components/${o.slug}/`, { waitUntil: "networkidle" });
    const read = async (parts) => {
      const out = {};
      for (const [k, sel] of Object.entries(parts)) out[k] = await tab.evaluate(measure, ["body", sel, o.props[k]]);
      out.__center = await tab.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); const dx = Math.round(r.left + r.width / 2 - innerWidth / 2), dy = Math.round(r.top + r.height / 2 - innerHeight / 2); return Math.abs(dx) < 2 && Math.abs(dy) < 2 ? "居中" : `偏 ${dx},${dy}`; }, parts.外框);
      return out;
    };
    await tab.locator(o.html.open).first().click();
    await tab.waitForTimeout(250);
    const h = await read(o.html.parts);
    await tab.keyboard.press("Escape");
    await tab.waitForTimeout(200);
    await tab.getByRole("tab", { name: "React" }).first().click();
    // React 演示是 client:visible 的岛：切到标签页以后才水合，按钮能点了再点
    const trigger = tab.locator(".site-demo").first().locator(".site-demo__stage").nth(1).getByRole("button").first();
    await trigger.waitFor({ timeout: 10000 });
    for (let i = 0; i < 10; i += 1) {
      await trigger.click();
      const opened = await tab.locator(o.react.parts.外框.includes("[data-open]") ? o.react.parts.外框 : `${o.react.parts.外框}[data-open]`).first().waitFor({ timeout: 1000 }).then(() => true, () => false);
      if (opened) break;
    }
    await tab.waitForTimeout(350);
    const r = await read(o.react.parts);
    for (const k of Object.keys(o.html.parts)) {
      if (h[k].missing || r[k].missing) { diffs.push(`${o.slug} ${k}：找不到（HTML ${h[k].missing ?? "有"} / React ${r[k].missing ?? "有"}）`); continue; }
      for (const p of Object.keys(h[k])) if (h[k][p] !== r[k][p]) diffs.push(`${o.slug} ${k} ${p}：HTML ${h[k][p]} ↔ React ${r[k][p]}`);
    }
    if (o.centered && h.__center !== r.__center) diffs.push(`${o.slug} 居中：HTML ${h.__center} ↔ React ${r.__center}`);
    await ctx.close();
  }
  return diffs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { chromium } = await import("playwright");
  const origin = process.argv[2] ?? "http://localhost:4400";
  const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});
  for (const look of PARITY_LOOKS) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), look);
    const tab = await ctx.newPage();
    await tab.goto(`${origin}/tools/parity/`, { waitUntil: "networkidle" });
    const d = await compareParity(tab);
    d.push(...(await compareOverlays(browser, origin, look)));
    console.log(`── ${look.theme} ${look.corners} ${look.density}：${d.length} 处不一样`);
    for (const x of d) console.log("  " + x);
    await ctx.close();
  }
  await browser.close();
}
