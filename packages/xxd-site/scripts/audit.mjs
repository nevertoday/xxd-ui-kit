// 对抗门禁（优化计划 O8）：截图回归看「长得对不对」，这里看「打得坏打不坏」。
//   1. axe：每一页 × 两种外观（亮直角墨色 / 暗圆角 X 蓝），WCAG 2.1 AA + best-practice，零违规。
//      原则页「不好」的示例（[data-kind="dont"]）是故意做错的，不扫。
//   2. 长内容：注册表里每个组件、每个小小东模式的示例放进 320px 宽的格子，文字换成长中文 / 长链接，任何元素都不许伸出格子。
//   3. 恶意宿主页：Shadow DOM 里的组件不受宿主页继承样式和同名变量影响；tooltip / toast 留在 Shadow 里。
//   4. 高对比模式（forced-colors）：开关、勾选、分段、tab 的选中态和未选中态看得出差别。
//   5. 英文版：/en/ 下每一页 <html lang="en">，看得见的字和 aria-label / placeholder / title / tooltip 里没有汉字
//      （标了 lang="zh…" 的地方除外：切换语言的按钮、中文提交记录、语言本名），中文页和英文页互相链到对方。
//   6. 细节（scripts/polish.js）：专业的人一眼看出来的小毛病 —— 字贴边、控件被截断或折行、最后一行只剩一个字、
//      字被挤成一字一行、元素互相压住、图标和字没对齐。扫两处：全站每一页（1280 / 390 宽），
//      以及每个组件、模式的中英文示例放进 260 / 360 / 560px 宽的演示格子。
//   7. 浮层（评审 R1）：每个演示里会弹出东西的按钮都真的点一下 —— 对话框 / sheet / 面板 / 菜单 / popover / toast
//      要整个在视口里（桌面上对话框居中，手机上贴底），对话框类焦点要进去、Esc 关得掉、关掉后焦点回到按钮；
//      toast 不被别的东西盖住。以前截图只拍关着的浮层，对话框跑到左上角也没人发现。
//   8. 真实浏览器冒烟（评审 R1）：happy-dom 看不到的东西 —— 层叠层顺序（Tailwind 的工具类能盖住 xxd）、
//      带 *{margin:0} reset 时对话框仍居中、mountXxdUI 之后 host 的定位不被清掉。
//   10. 对照（设计师评审 V1）：/tools/parity 上同一组件的原生 HTML 和 React 逐项比较（尺寸、字号、字重、颜色、边、圆角、底色），以 HTML 为准。
//   11. 规格（设计师评审 V5-1）：组件页的规格表（样品 × 4 种外观量出来的尺寸、内边距、圆角、字号）每一格都对得上一个令牌。
//   12. 看得见的内边距（SPACING-REVIEW-PLAN D55）：容器截图量墨迹，上下不比左右宽、上下差不多（标准 / 紧凑密度）。
//       「差一点没对齐」（D57）在第 6 项「细节」里。
//   13. 对比度（COLOR-REVIEW-PLAN D81）：自己合成底色量每段字（axe 跳过的表格、半透明层），选中 / 当前要有 ≥ 3:1 的记号；
//       墨色亮暗、芥黄亮、自定义纯蓝暗。
//   14. 焦点（ACCEPTANCE-REVIEW）：每个能 Tab 到的东西的焦点环不被祖先的 overflow 裁掉。
//   15. 动效（MOTION-REVIEW-PLAN D90）：按下的同一刻就有看得见的变化；减少动效下只剩慢淡入淡出，进行中的按钮不定住。
//   16. 状态（ACCEPTANCE-REVIEW）：选中 / 禁用 / 出错叠上悬停、聚焦后按优先级不变。
//   17. 截断（TRUNCATION-REVIEW-PLAN D96）：长文字不硬裁、内容和数字不省略、省略的悬停能看到全文、字不互相压；React 不伸出格子。
// 用法：pnpm --filter @xxd/site build && pnpm --filter @xxd/site run audit [--only=axe|long|shadow|forced|en|polish|overlay|smoke|sr|parity|spec|inset|contrast|focus|motion|states|trunc|form|dark|touch|chart|diagram]
// 需要 Chromium：CHROME_EXE=<chrome-headless-shell 路径>（缺省用 Playwright 自带的）。
import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { chromium, devices } from "playwright";
import { srAudit } from "./sr.mjs";
import { compareOverlays, compareParity, OVERLAYS, PARITY_LOOKS } from "./parity.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const pkgs = join(root, "..");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

if (!existsSync(join(dist, "index.html"))) {
  console.error("先构建：pnpm --filter @xxd/site build");
  process.exit(1);
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8" };
const PAGES = {
  "/__audit/long": () => longPage(),
  "/__audit/hostile": () => hostilePage(),
  "/__audit/cells": (q) => cellsPage(q.get("lang"), Number(q.get("w"))),
  "/__audit/smoke": () => smokePage(),
};
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (PAGES[p]) {
    Promise.resolve(PAGES[p](new URL(req.url, "http://x").searchParams)).then((html) => res.writeHead(200, { "content-type": TYPES[".html"] }).end(html));
    return;
  }
  // /@pkg/xxd-css/dist/… → 仓库里的构建产物（不进展示站）
  let file = p.startsWith("/@pkg/") ? join(pkgs, p.slice(6)) : join(dist, p);
  if (!file.startsWith(pkgs)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end("not found");
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});
const failures = [];
const fail = (section, msg) => failures.push(`[${section}] ${msg}`);

const pages = [];
(function walk(d) {
  for (const name of readdirSync(d)) {
    const f = join(d, name);
    // /mini/ 是演示小程序编出的 H5（Taro 的页面，不是展示站的页）：它有自己的检查（pnpm --filter @xxd/mini-demo check）
    if (d === dist && name === "mini") continue;
    if (statSync(f).isDirectory()) walk(f);
    else if (name === "index.html") pages.push(`/${relative(dist, d).split("\\").join("/")}/`.replace(/^\/\/$/, "/"));
  }
})(dist);

/* ── 1. axe ── */
async function axeAudit() {
  const modes = [
    { id: "亮·直角·墨色", s: { theme: "light", corners: "square", accent: "", density: "comfortable", finish: "flat" } },
    { id: "暗·圆角·自定义蓝", s: { theme: "dark", corners: "rounded", accent: "#1d9bf0", density: "comfortable", finish: "material" } },
  ];
  let count = 0;
  for (const mode of modes) {
    for (const page of pages) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
      await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), mode.s);
      const tab = await ctx.newPage();
      await tab.goto(origin + page, { waitUntil: "networkidle" });
      await tab.waitForTimeout(120);
      await tab.addScriptTag({ content: AXE });
      const violations = await tab.evaluate(async () => {
        const r = await axe.run({ exclude: [['[data-kind="dont"]']] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
        return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => `${n.target.join(" ")} ${n.any?.[0]?.data?.contrastRatio ? `(${n.any[0].data.fgColor} on ${n.any[0].data.bgColor} = ${n.any[0].data.contrastRatio})` : ""}`) }));
      });
      for (const v of violations) for (const n of v.nodes.slice(0, 3)) fail("axe", `${mode.id} ${page} ${v.id}: ${n}`);
      count += 1;
      await ctx.close();
    }
  }
  console.log(`axe：${count} 次扫描`);
}

/* ── 2. 长内容 ── */
function longPage() {
  return `<!doctype html><html lang="zh-CN" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/xxd/xxd.css"><style>.cell{width:var(--cell,320px);margin:0 0 24px}</style></head>
<body class="xxd-page" style="margin:0"><div id="app"></div><script src="/xxd/icons.js"></script><script src="/xxd/viz.js"></script><script src="/xxd/xxd.js"></script><script src="/xxd/extension.js"></script></body></html>`;
}

// 只有一个字形的格子（字形表）和故意定宽的东西不算
const LONG_EXEMPT = new Set(["Glyphs"]);
const TEXTS = {
  长中文: "这是一段非常非常长的中文文字用来测试换行和截断是否正确处理而且还要再长一点点才行",
  长链接: "https://vip.xiaoxiaodong.ai/prompts/2026/very-long-slug-without-any-spaces-at-all",
};

async function longAudit() {
  const registry = [
    ...JSON.parse(readFileSync(join(pkgs, "xxd-css/registry.json"), "utf8")).components,
    ...JSON.parse(readFileSync(join(pkgs, "xxd-css/patterns.json"), "utf8")).patterns.map((p) => ({ ...p, name: `模式 ${p.name}` })),
  ].filter((c) => typeof c.markup === "string");
  for (const [label, text, cellWidth] of [["原文", null, 320], ["原文 · 260px", null, 260], ...Object.entries(TEXTS).map(([k, v]) => [k, v, 320])]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" });
    const tab = await ctx.newPage();
    const errors = [];
    tab.on("pageerror", (e) => errors.push(e.message));
    await tab.goto(`${origin}/__audit/long`);
    const bad = await tab.evaluate(({ registry, text, exempt, cellWidth }) => {
      const app = document.getElementById("app");
      app.style.setProperty("--cell", `${cellWidth}px`);
      for (const c of registry) {
        if (exempt.includes(c.name)) continue;
        // 侧栏本身就是 232px 的桌面组件：比它还窄的地方应当折叠（data-collapsed），不在 260px 格子里测
        if (cellWidth < 300 && c.name === "Sidebar") continue;
        const cell = document.createElement("section");
        cell.className = "cell";
        cell.dataset.name = c.name;
        cell.innerHTML = c.markup;
        if (text) {
          const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
          const nodes = [];
          while (walker.nextNode()) if (walker.currentNode.nodeValue.trim() && !walker.currentNode.parentElement.closest("script, style, pre, code, kbd, .xxd-kbd, [data-spark]")) nodes.push(walker.currentNode);
          for (const n of nodes) n.nodeValue = text;
        }
        app.append(cell);
      }
      Xxd.install(document);
      globalThis.XxdIcons?.hydrateIcons?.(document);
      const out = [];
      for (const cell of app.children) {
        const box = cell.getBoundingClientRect();
        for (const el of cell.querySelectorAll("*")) {
          if (el.closest("[popover]:not(:popover-open), dialog:not([open]), [hidden], template, .xxd-sr-only, svg")) continue;
          // 收起的侧面板 / sheet 本来就在屏幕外
          let fixedAncestor = false;
          for (let p = el; p && p !== cell; p = p.parentElement) if (getComputedStyle(p).position === "fixed") fixedAncestor = true;
          if (fixedAncestor) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.position === "fixed") continue;
          const r = el.getBoundingClientRect();
          if (!r.width) continue;
          let clipped = false;
          for (let p = el.parentElement; p && p !== cell; p = p.parentElement) {
            if (getComputedStyle(p).overflowX !== "visible") {
              clipped = true;
              break;
            }
          }
          const tag = `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""}`;
          if (!clipped && r.right > box.right + 1) {
            out.push(`${cell.dataset.name}: ${tag} 伸出 ${Math.round(r.right - box.right)}px`);
            break;
          }
          // 被挤窄：标题、名字、按钮的字被旁边的东西挤到不到 3 个字宽，折成好几行（一字一行）
          if (!text && el.matches("h1, h2, h3, h4, [class*='__title'], [class*='__name'], .xxd-btn, .xxd-chip, .xxd-badge")) {
            const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue.trim()).join("");
            const size = parseFloat(cs.fontSize);
            const lines = Math.round(r.height / (parseFloat(cs.lineHeight) || size * 1.4));
            if ([...own].length >= 4 && r.width < size * 3 && lines >= 2) {
              out.push(`${cell.dataset.name}: ${tag} 被挤成 ${Math.round(r.width)}px 宽、${lines} 行`);
              break;
            }
          }
        }
      }
      return out;
    }, { registry, text, exempt: [...LONG_EXEMPT], cellWidth });
    for (const b of bad) fail("长内容", `${label} · ${b}`);
    for (const e of errors) fail("长内容", `${label} · 脚本错误 ${e}`);
    await ctx.close();
  }
  console.log(`长内容：${registry.length - LONG_EXEMPT.size} 个组件和模式 × 3 种文字（另加 260px 窄格子），不溢出、不被挤成一字一行`);
}

/* ── 3. 恶意宿主页 ── */
function hostilePage() {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<style>
  * { box-sizing: content-box; }
  body { font: 20px/2.4 Georgia, serif; color: #e11d48; letter-spacing: 2px; text-transform: uppercase; word-spacing: 6px; text-align: center; cursor: crosshair; }
  div, xxd-host { --ink: #00ff00; --r-sm: 40px; --paper: #ffff00; --font-body: Georgia; }
  button { all: unset; background: red !important; }
  dialog { background: yellow !important; }
  .xxd-tooltip, .xxd-toast { display: none !important; }
</style></head><body>
<p>宿主页</p><div id="host" data-finish="material"></div>
<script src="/xxd/icons.js"></script>
<script type="module">
  const css = await (await fetch("/@pkg/xxd-css/dist/xxd.shadow.css")).text();
  const X = await import("/@pkg/xxd-css/dist/xxd.esm.js");
  const host = document.getElementById("host");
  const root = host.attachShadow({ mode: "open" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  root.adoptedStyleSheets = [sheet];
  root.innerHTML = \`<div class="xxd-page" id="pg">
    <button class="xxd-btn" id="b">保存</button>
    <button class="xxd-btn" id="p" data-variant="primary">写入</button>
    <p id="t">正文 text</p>
    <button class="xxd-btn" id="tt" data-tooltip="提示">tip</button>
  </div>\`;
  X.install(root);
  window.X = X; window.root = root; window.ready = true;
</script></body></html>`;
}

async function hostileAudit() {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, reducedMotion: "reduce" });
  const tab = await ctx.newPage();
  const errors = [];
  tab.on("pageerror", (e) => errors.push(e.message));
  await tab.goto(`${origin}/__audit/hostile`);
  await tab.waitForFunction(() => window.ready);
  const r = await tab.evaluate(async () => {
    const $ = (id) => root.getElementById(id);
    const b = getComputedStyle($("b"));
    const t = getComputedStyle($("t"));
    const p = getComputedStyle($("p"));
    const out = {
      圆角: b.borderTopLeftRadius,
      按钮底色: b.backgroundColor,
      正文颜色: t.color,
      大写: t.textTransform,
      字距: t.letterSpacing,
      对齐: t.textAlign,
      词距: t.wordSpacing,
      光标: t.cursor,
      字体: t.fontFamily.includes("Georgia"),
      质感: p.boxShadow,
    };
    X.showTooltip($("tt"));
    out.tooltip在Shadow里 = !!root.querySelector(".xxd-tooltip") && !document.querySelector(".xxd-tooltip");
    try {
      X.toast("已保存", { within: root });
      out.toast在Shadow里 = !!root.querySelector(".xxd-toast") && !document.querySelector(".xxd-toast");
    } catch (e) {
      out.toast在Shadow里 = "报错 " + e.message;
    }
    return out;
  });
  const expect = {
    圆角: "0px",
    按钮底色: "rgb(255, 255, 255)",
    正文颜色: "rgb(17, 17, 17)",
    大写: "none",
    字距: "normal",
    对齐: "start",
    词距: "0px",
    光标: "auto",
    字体: false,
    tooltip在Shadow里: true,
    toast在Shadow里: true,
  };
  for (const [k, v] of Object.entries(expect)) if (r[k] !== v) fail("宿主页", `${k}：期望 ${JSON.stringify(v)}，实际 ${JSON.stringify(r[k])}`);
  if (!/inset/.test(r.质感)) fail("宿主页", `host 上的 data-finish="material" 没生效（box-shadow: ${r.质感}）`);
  for (const e of errors) fail("宿主页", `脚本错误 ${e}`);
  await ctx.close();
  console.log("宿主页：Shadow DOM 隔离 12 项");
}

/* ── 4. 高对比模式 ── */
async function forcedAudit() {
  const ctx = await browser.newContext({ viewport: { width: 600, height: 400 }, forcedColors: "active", reducedMotion: "reduce" });
  const tab = await ctx.newPage();
  await tab.goto(`${origin}/__audit/long`);
  await tab.evaluate(() => {
    document.getElementById("app").innerHTML = `<div style="display:grid;gap:12px;padding:12px;width:320px">
      <div data-pair="开关"><input type="checkbox" class="xxd-switch" aria-label="a"> <input type="checkbox" class="xxd-switch" checked aria-label="b"></div>
      <div data-pair="勾选"><input type="checkbox" class="xxd-check" aria-label="a"> <input type="checkbox" class="xxd-check" checked aria-label="b"></div>
      <div data-pair="单选"><input type="radio" class="xxd-radio" name="r" aria-label="a"> <input type="radio" class="xxd-radio" name="r2" checked aria-label="b"></div>
      <div data-pair="分段"><div class="xxd-segmented" role="radiogroup" aria-label="s"><button role="radio" aria-checked="false">文本</button></div> <div class="xxd-segmented" role="radiogroup" aria-label="s2"><button role="radio" aria-checked="true">文本</button></div></div>
      <div data-pair="tab"><div class="xxd-tabs" role="tablist"><button role="tab" aria-selected="false">写作</button></div> <div class="xxd-tabs" role="tablist"><button role="tab" aria-selected="true">写作</button></div></div>
      <div data-pair="进度"><progress class="xxd-progress" value="0" max="100"></progress> <progress class="xxd-progress" value="60" max="100"></progress></div>
      <div data-pair="chip"><button class="xxd-chip" aria-pressed="false">海报</button> <button class="xxd-chip" aria-pressed="true">海报</button></div>
    </div>`;
  });
  for (const pair of await tab.$$("[data-pair]")) {
    const name = await pair.getAttribute("data-pair");
    const [a, b] = await pair.$$(":scope > *");
    const [sa, sb] = [await a.screenshot(), await b.screenshot()];
    if (sa.equals(sb)) fail("高对比", `${name}：选中和未选中看起来一样`);
  }
  await ctx.close();
  console.log("高对比：7 组状态");
}

/* ── 5. 英文版 ── */
async function englishAudit() {
  const enPages = pages.filter((p) => p.startsWith("/en/"));
  const zhPages = pages.filter((p) => !p.startsWith("/en/"));
  if (enPages.length !== zhPages.length) fail("英文", `中文 ${zhPages.length} 页、英文 ${enPages.length} 页，数量不一样`);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const tab = await ctx.newPage();
  for (const page of enPages) {
    await tab.goto(origin + page, { waitUntil: "networkidle" });
    await tab.waitForTimeout(100);
    const r = await tab.evaluate(() => {
      const han = /\p{Script=Han}/u;
      const found = [];
      const skip = "[lang|=zh], script, style, template, [hidden]";
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.parentElement && !n.parentElement.closest(skip) && han.test(n.textContent)) found.push(n.textContent.trim().slice(0, 30));
      for (const el of document.querySelectorAll("[aria-label],[placeholder],[title],[data-tooltip]")) {
        if (el.closest("[lang|=zh]")) continue;
        for (const a of ["aria-label", "placeholder", "title", "data-tooltip"]) if (han.test(el.getAttribute(a) ?? "")) found.push(`${a}="${el.getAttribute(a).slice(0, 20)}"`);
      }
      return { lang: document.documentElement.lang, found: [...new Set(found)], other: document.querySelector(".site-lang")?.getAttribute("href") };
    });
    if (r.lang !== "en") fail("英文", `${page} <html lang="${r.lang}">`);
    for (const f of r.found.slice(0, 3)) fail("英文", `${page} 有汉字：${f}`);
    const zh = page.replace(/^\/en/, "") || "/";
    if ((r.other ?? "").replace(/\/$/, "") !== zh.replace(/\/$/, "")) fail("英文", `${page} 的语言切换指向 ${r.other}，应当是 ${zh}`);
  }
  await ctx.close();
  console.log(`英文：${enPages.length} 页`);
}

/* ── 6. 细节 ── */
const POLISH = readFileSync(join(root, "scripts/polish.js"), "utf8");
// 侧栏本身是 232px 的桌面组件，比它窄的格子里本来就该折叠；图表要 ECharts，格子里没有
const POLISH_EXEMPT = new Set(["Sidebar", "Chart"]);

async function cellsPage(lang, w) {
  const reg = JSON.parse(readFileSync(join(pkgs, "xxd-css/registry.json"), "utf8")).components;
  const pat = JSON.parse(readFileSync(join(pkgs, "xxd-css/patterns.json"), "utf8")).patterns;
  const en = await import(pathToFileURL(join(pkgs, "xxd-css/registry.en.js")).href);
  const enp = await import(pathToFileURL(join(pkgs, "xxd-css/patterns.en.js")).href);
  // 每个格子里的 id 加上序号，几个示例放在一页上也不会互相抢（对话框、tab、sheet 都按 id 找）
  const uniq = (m, i) => m.replace(/\b(id|for|aria-controls|aria-labelledby|data-sidebar-sub|data-submenu|data-xxd-dialog-open|data-xxd-sheet-open|data-xxd-panel-open|data-xxd-menu|data-xxd-popover|data-xxd-sidebar-toggle|data-copy-target)="([^"]+)"/g, (_, a, v) => `${a}="${v.split(" ").map((x) => (x.startsWith("#") ? x.replace(/^#([\w-]+)/, `#$1-${i}`) : `${x}-${i}`)).join(" ")}"`).replace(/getElementById\("([\w-]+)"\)/g, `getElementById("$1-${i}")`);
  const cells = [...reg, ...pat].filter((c) => !POLISH_EXEMPT.has(c.name)).map((c, i) => {
    const isPat = pat.includes(c);
    const e = (isPat ? enp.patterns : en.components)[c.name] ?? {};
    const markup = lang === "en" ? e.markup ?? c.markup : c.markup;
    return `<div class="site-demo cell" data-name="${c.name}" style="width:${w}px;margin:0 0 12px"><div class="site-demo__stage" data-align="${c.align ?? (isPat ? "start" : "center")}" ${c.block ?? isPat ? "data-block" : ""}>${uniq(markup, i)}</div></div>`;
  });
  return `<!doctype html><html lang="${lang === "en" ? "en" : "zh-CN"}" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/xxd/xxd.css"><link rel="stylesheet" href="/site.css"><script src="/xxd/boot.js"></script><script src="/xxd/icons.js"></script><script src="/xxd/xxd.js"></script><script src="/xxd/extension.js"></script></head>
<body class="xxd-page" style="padding:12px">${cells.join("")}</body></html>`;
}

async function polishAudit() {
  const seen = new Set();
  const report = (where, x) => {
    const key = `${x.kind}|${x.where}`;
    if (seen.has(key)) return;
    seen.add(key);
    fail("细节", `${where} ${x.kind}：${x.where} —— ${x.detail}`);
  };
  // 全站每一页
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const tab = await ctx.newPage();
    for (const page of pages) {
      await tab.goto(origin + page, { waitUntil: "networkidle" });
      await tab.waitForTimeout(80);
      await tab.addScriptTag({ content: POLISH });
      for (const x of await tab.evaluate(() => xxdPolish(document.querySelector("main") || document.body))) report(`[${w}] ${page}`, x);
      // 模板预览框 overflow:hidden：里面的东西超出左右边会被悄悄裁掉（不算「溢出」，上面查不到）
      if (/\/templates\//.test(page)) {
        const clipped = await tab.evaluate(() => {
          const out = [];
          for (const frame of document.querySelectorAll(".site-template")) {
            const box = frame.getBoundingClientRect();
            for (const el of frame.querySelectorAll("*")) {
              if (el.closest("[hidden], dialog:not([open]), [popover]:not(:popover-open), svg") || !el.getClientRects().length) continue;
              // 能横向滚动的容器（表格、标签栏）里面不算
              let scroller = false;
              for (let p = el.parentElement; p && p !== frame; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) scroller = true;
              if (scroller) continue;
              const r = el.getBoundingClientRect();
              if (r.width && (r.left < box.left - 1 || r.right > box.right + 1)) out.push({ kind: "被预览框裁掉", where: `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/)[0] : ""}「${(el.textContent || "").trim().slice(0, 16)}」`, detail: `左 ${Math.round(r.left - box.left)}px / 右 ${Math.round(box.right - r.right)}px` });
            }
          }
          return out.slice(0, 5);
        });
        for (const x of clipped) report(`[${w}] ${page}`, x);
      }
    }
    await ctx.close();
  }
  // 首页组件墙：每格按组件大小占几列几行（Home.astro 的脚本）。格子 overflow:hidden，被裁掉的东西上面查不到，单独查：
  // 不截（内容超出格子）、不挤（一个元素比它的自然宽度窄，而墙上明明还有更宽的位置）、不留空洞（格子拼满整面墙）
  for (const lang of ["", "/en"]) {
    for (const [w, look] of [[1440, ""], [1100, ""], [820, ""], [1280, "rounded-compact"], [390, ""]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
      const tab = await ctx.newPage();
      await tab.goto(`${origin}${lang}/`, { waitUntil: "networkidle" });
      if (look) {
        await tab.evaluate(() => {
          document.documentElement.setAttribute("data-corners", "rounded");
          document.documentElement.setAttribute("data-density", "compact");
          document.dispatchEvent(new CustomEvent("xxd:appearance"));
        });
      }
      await tab.waitForTimeout(250);
      const problems = await tab.evaluate(() => {
        const out = [];
        const wall = document.querySelector(".site-wall");
        const cols = getComputedStyle(wall).gridTemplateColumns.split(" ").filter(Boolean).length;
        const name = (c) => c.querySelector(".site-wall__name")?.textContent.trim().split(/\s+/).pop();
        let area = 0;
        for (const cell of wall.querySelectorAll(".site-wall__cell")) {
          const st = cell.querySelector(".site-wall__stage");
          const r = cell.getBoundingClientRect();
          area += r.width * r.height;
          if (st.scrollHeight > st.clientHeight + 1 || st.scrollWidth > st.clientWidth + 1) out.push(`${name(cell)} 被格子截掉（高 ${st.scrollHeight - st.clientHeight}px / 宽 ${st.scrollWidth - st.clientWidth}px）`);
          if (st.hasAttribute("data-block")) continue;
          const cs = getComputedStyle(st);
          const inner = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          const probe = document.createElement("div");
          probe.className = st.className;
          probe.style.cssText = "position:absolute;left:-10000px;top:0;width:max-content;display:block;padding:0;visibility:hidden";
          document.body.appendChild(probe);
          for (const child of st.children) {
            probe.replaceChildren(child.cloneNode(true));
            const need = probe.firstChild.getBoundingClientRect().width;
            if (need > inner + 1 && need < wall.clientWidth - 64) out.push(`${name(cell)} 被挤窄：要 ${Math.round(need)}px，格子里只有 ${Math.round(inner)}px`);
          }
          probe.remove();
        }
        if (cols > 1) {
          const wr = wall.getBoundingClientRect();
          const inside = (wr.width - wall.clientLeft) * (wr.height - wall.clientTop);
          if (inside - area > 2000) out.push(`墙上有空洞：约 ${Math.round((inside - area) / 1000)}k 平方像素没有格子`);
        }
        return out;
      });
      for (const x of problems) fail("细节", `[首页${lang || ""} ${w}${look ? " " + look : ""}] 组件墙 ${x}`);
      await ctx.close();
    }
  }
  // 每个示例放进窄 / 中 / 宽的格子
  for (const lang of ["zh", "en"]) {
    for (const w of [260, 360, 560]) {
      const ctx = await browser.newContext({ viewport: { width: w + 40, height: 900 }, reducedMotion: "reduce" });
      const tab = await ctx.newPage();
      const errors = [];
      tab.on("pageerror", (e) => errors.push(e.message));
      await tab.goto(`${origin}/__audit/cells?lang=${lang}&w=${w}`, { waitUntil: "networkidle" });
      await tab.waitForTimeout(150);
      await tab.addScriptTag({ content: POLISH });
      const found = await tab.evaluate(() => [...document.querySelectorAll(".cell")].flatMap((c) => xxdPolish(c).map((x) => ({ ...x, cell: c.dataset.name }))));
      for (const x of found) report(`[${lang} ${w}px] ${x.cell}`, x);
      for (const e of errors) fail("细节", `[${lang} ${w}px] 脚本错误 ${e}`);
      await ctx.close();
    }
  }
  console.log(`细节：${pages.length} 页 × 2 种宽度，每个组件和模式 × 中英 × 3 种格子宽，首页组件墙 × 中英 × 5 种宽度 / 外观`);
}

/* ── 7. 浮层：真的打开每一个 ── */
const OPENERS = "[data-xxd-dialog-open], [data-xxd-sheet-open], [data-xxd-panel-open], [data-xxd-menu], [data-xxd-popover], button[onclick]";
async function overlayAudit() {
  const targets = pages.filter((p) => /^\/(en\/)?(components|patterns|templates)\//.test(p) && (!process.env.AUDIT_PAGE || p.includes(process.env.AUDIT_PAGE)));
  let opened = 0;
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const tab = await ctx.newPage();
    for (const page of targets) {
      await tab.goto(origin + page, { waitUntil: "networkidle" });
      const count = await tab.evaluate((sel) => {
        const list = [...document.querySelectorAll(".site-demo__stage, .site-template")].flatMap((stage) => [...stage.querySelectorAll(sel)]).filter((b) => !b.closest("form") && b.getClientRects().length);
        list.forEach((b, i) => b.setAttribute("data-audit-opener", String(i)));
        return list.length;
      }, OPENERS);
      for (let i = 0; i < count; i += 1) {
        const opener = tab.locator(`[data-audit-opener="${i}"]`);
        if (!(await opener.isVisible())) continue;
        await opener.scrollIntoViewIfNeeded();
        const label = `[${w}] ${page} 「${((await opener.textContent()) || (await opener.getAttribute("aria-label")) || "").trim().slice(0, 16)}」`;
        await tab.evaluate(() => (window.__toastsBefore = document.querySelectorAll(".xxd-toast").length));
        // 用键盘打开（菜单用鼠标打开时焦点留在按钮上是有意的；键盘打开必须进去）
        await opener.focus();
        await tab.keyboard.press("Enter");
        await tab.waitForTimeout(260);
        const r = await tab.evaluate(() => {
          const vw = innerWidth;
          const vh = innerHeight;
          const box = (el) => el.getBoundingClientRect();
          const inView = (b) => b.left >= -1 && b.top >= -1 && b.right <= vw + 1 && b.bottom <= vh + 1;
          // 演示区里「打开后的样子」是静态的（inert，只给看），不算打开的浮层
          const layers = [...document.querySelectorAll("dialog[open], .xxd-sheet[data-open], .xxd-panel[data-open]")].filter((el) => !el.closest("[inert]"));
          const pops = [...document.querySelectorAll(":popover-open")].filter((p) => !p.classList.contains("xxd-tooltip") && !p.classList.contains("xxd-bubble"));
          const toasts = [...document.querySelectorAll(".xxd-toast:not([data-leaving])")].slice(window.__toastsBefore);
          const active = document.activeElement;
          const out = [];
          for (const el of layers) {
            const b = box(el);
            const kind = el.tagName === "DIALOG" ? "对话框" : el.classList.contains("xxd-sheet") ? "sheet" : "面板";
            out.push({
              kind,
              inView: inView(b),
              rect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
              centered: kind !== "对话框" || vw <= 640 ? true : Math.abs(b.left + b.width / 2 - vw / 2) <= 2 && b.top > 0,
              bottom: kind === "对话框" && vw <= 640 && !el.classList.contains("xxd-palette") ? Math.abs(b.bottom - vh) <= 2 : true,
              focus: el.contains(active) || el === active,
              active: active ? active.tagName + "." + active.className : "",
            });
          }
          for (const el of pops) {
            const b = box(el);
            const kind = el.classList.contains("xxd-menu") || el.getAttribute("role") === "menu" ? "菜单" : "popover";
            out.push({ kind, inView: inView(b), rect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], centered: true, bottom: true, focus: kind === "菜单" ? el.contains(active) : true });
          }
          for (const el of toasts) {
            const b = box(el);
            const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            out.push({ kind: "toast", inView: inView(b), rect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], centered: true, bottom: true, focus: true, covered: !el.contains(hit) });
          }
          return out;
        });
        for (const o of r) {
          opened += 1;
          if (!o.inView) fail("浮层", `${label} ${o.kind}伸出视口 ${JSON.stringify(o.rect)}`);
          if (!o.centered) fail("浮层", `${label} ${o.kind}没有居中 ${JSON.stringify(o.rect)}`);
          if (!o.bottom) fail("浮层", `${label} 窄屏对话框没有贴底 ${JSON.stringify(o.rect)}`);
          if (!o.focus) fail("浮层", `${label} 打开${o.kind}后焦点没进去（在 ${o.active}）`);
          if (o.covered) fail("浮层", `${label} toast 被别的东西盖住`);
        }
        const modal = r.filter((o) => o.kind !== "toast");
        if (!modal.length) continue;
        // Esc 关掉；对话框类关掉后焦点回到按钮（嵌套的再按一次）
        for (let n = 0; n < 3; n += 1) {
          await tab.keyboard.press("Escape");
          await tab.waitForTimeout(160);
          if (!(await tab.evaluate(() => [...document.querySelectorAll("dialog[open], .xxd-sheet[data-open], .xxd-panel[data-open], .xxd-menu:popover-open")].some((e) => !e.closest("[inert]"))))) break;
        }
        const after = await tab.evaluate(() => ({
          still: !![...document.querySelectorAll("dialog[open], .xxd-sheet[data-open], .xxd-panel[data-open], .xxd-menu:popover-open")].some((e) => !e.closest("[inert]")),
          back: !!document.activeElement?.closest("[data-audit-opener]"),
        }));
        if (after.still) fail("浮层", `${label} Esc 关不掉`);
        else if (!after.back && modal.some((o) => o.kind !== "popover")) fail("浮层", `${label} 关掉后焦点没回到按钮`);
        // 万一还开着：清理干净再试下一个
        await tab.evaluate(() => {
          for (const d of document.querySelectorAll("dialog[open]")) d.close();
          for (const p of document.querySelectorAll(":popover-open")) p.hidePopover?.();
          for (const l of document.querySelectorAll(".xxd-sheet[data-open], .xxd-panel[data-open]")) if (!l.closest("[inert]")) window.Xxd?.closeLayer?.(l);
        });
      }
    }
    await ctx.close();
  }
  console.log(`浮层：${targets.length} 页 × 2 种宽度，打开并检查了 ${opened} 个浮层`);
}

/* ── 8. 真实浏览器冒烟 ── */
function smokePage() {
  // 和 @xxd/react 的 standalone.css 一样：先声明层顺序，再 Kumo（含 Tailwind preflight 和工具类），再 xxd
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<style>@layer properties, theme, base, xxd, components, utilities;</style>
<link rel="stylesheet" href="/xxd/kumo.css"><link rel="stylesheet" href="/xxd/xxd.css">
<script src="/xxd/xxd.js"></script><script src="/@pkg/xxd-extension/dist/extension.js"></script></head>
<body class="xxd-page">
  <button id="kumo" class="font-medium">Kumo 风格的按钮</button>
  <dialog class="xxd-dialog" id="dlg"><div class="xxd-dialog__body">居中？</div></dialog>
</body></html>`;
}

async function smokeAudit() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const tab = await ctx.newPage();
  const errors = [];
  tab.on("pageerror", (e) => errors.push(e.message));
  await tab.goto(`${origin}/__audit/smoke`, { waitUntil: "networkidle" });
  const r = await tab.evaluate(async () => {
    const out = {};
    out.工具类盖得住xxd = getComputedStyle(document.getElementById("kumo")).fontWeight;
    const d = document.getElementById("dlg");
    d.showModal();
    const b = d.getBoundingClientRect();
    out.对话框居中 = Math.abs(b.left + b.width / 2 - innerWidth / 2) <= 2 && b.top > 0;
    d.close();
    const host = document.createElement("div");
    host.dataset.display = "block";
    host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000";
    document.documentElement.append(host);
    await window.XxdExtension.mountXxdUI(host, { cssText: ":host{}", install: false });
    const s = getComputedStyle(host);
    out.host定位 = `${s.position} ${s.right} ${s.zIndex} ${s.display}`;
    return out;
  });
  const expect = { 工具类盖得住xxd: "500", 对话框居中: true, host定位: "fixed 16px 2147483000 block" };
  for (const [k, v] of Object.entries(expect)) if (r[k] !== v) fail("冒烟", `${k}：期望 ${JSON.stringify(v)}，实际 ${JSON.stringify(r[k])}`);
  for (const e of errors) fail("冒烟", `脚本错误 ${e}`);
  await ctx.close();
  // 首页组件墙的排版在每种窗口宽度下都要排完（2026-10-23 线上 1680 / 1728 / 2560 宽时补洞的循环停不下来，整页卡死）
  const hung = [];
  for (const page of ["/", "/en/"]) {
    for (let w = 1000; w <= 2600; w += 40) {
      const c = await browser.newContext({ viewport: { width: w, height: 900 } });
      const tab = await c.newPage();
      const t0 = Date.now();
      const ok = await tab.goto(origin + page, { waitUntil: "load", timeout: 15000 }).then(() => Promise.race([tab.evaluate(() => true), new Promise((r) => setTimeout(() => r(false), 3000))])).catch(() => false);
      if (!ok || Date.now() - t0 > 8000) hung.push(`${page} ${w}px`);
      await c.close();
    }
  }
  for (const x of hung) fail("冒烟", `首页在 ${x} 宽时卡住（组件墙排版停不下来）`);
  console.log("冒烟：层叠层顺序、reset 下的对话框、注入宿主的定位；首页 1000–2600 宽都排得完");
}

/* ── 9. 读屏：键盘走关键流程，读无障碍树和播报区（scripts/sr.mjs） ── */
const srSection = () => srAudit({ browser, origin, fail, transcriptFile: join(root, "visual/sr-transcript.txt") });

/* ── 10. 对照（设计师评审 V1）：/tools/parity 上同一组件的 HTML 和 React 逐项比较，以 HTML 为准（scripts/parity.mjs） ── */
async function paritySection() {
  let pairs = 0;
  for (const look of PARITY_LOOKS) {
    for (const lang of ["", "/en"]) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), look);
      const tab = await ctx.newPage();
      await tab.goto(`${origin}${lang}/tools/parity/`, { waitUntil: "networkidle" });
      for (const d of await compareParity(tab)) fail("对照", `${look.theme}·${look.corners}·${look.density}·${look.finish}${lang} ${d}`);
      pairs += await tab.$$eval('[data-impl="html"]', (c) => c.length);
      await ctx.close();
    }
    for (const d of await compareOverlays(browser, origin, look)) fail("对照", `${look.theme}·${look.corners}·${look.density}·${look.finish} ${d}`);
  }
  console.log(`对照：${pairs} 对 × 逐项（${PARITY_LOOKS.length} 种外观 × 中英），另外打开 ${OVERLAYS.length} 种浮层比较`);
}

/* ── 11. 规格（设计师评审 V5-1）：组件页的规格表在浏览器里量出来、反查令牌；每一格都要对得上一个令牌 ── */
async function specSection() {
  const { SPECS } = await import("../src/data/specs.js");
  const slug = (n) => n.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  let cells = 0;
  for (const name of Object.keys(SPECS)) {
    for (const lang of ["", "/en"]) {
      const tab = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await tab.goto(`${origin}${lang}/components/${slug(name)}/`, { waitUntil: "load" });
      await tab.waitForFunction(() => document.querySelector(".site-spec td[data-mode]") && ![...document.querySelectorAll(".site-spec td[data-mode]")].some((td) => td.textContent.trim() === "…"), null, { timeout: 10000 }).catch(() => {});
      const r = await tab.evaluate(() => ({
        cells: document.querySelectorAll(".site-spec td[data-mode]").length,
        left: [...document.querySelectorAll(".site-spec td[data-mode]")].filter((td) => ["…", "—"].includes(td.textContent.trim())).length,
        bad: [...document.querySelectorAll(".site-spec [data-untokened]")].map((u) => `${u.closest("tr").dataset.sel} ${u.closest("tr").dataset.prop} ${u.closest("td").dataset.mode}：${u.closest("td").textContent.trim()}`),
      }));
      if (!r.cells) fail("规格", `${lang}/components/${slug(name)}/ 没有规格表`);
      if (r.left) fail("规格", `${lang}/components/${slug(name)}/ 有 ${r.left} 格没量出来（选择器在样品里找不到）`);
      for (const b of r.bad) fail("规格", `${lang}/components/${slug(name)}/ ${b}`);
      cells += r.cells;
      await tab.close();
    }
  }
  console.log(`规格：${Object.keys(SPECS).length} 个组件 × 中英，${cells} 格都对得上令牌`);
}

/* ── 12. 看得见的内边距（SPACING-REVIEW-PLAN D55、D60）──
 * 给容器截图，去掉它自己的边框和横穿 / 竖穿的分隔线，找第一处不是底色的像素：这才是看得见的上、下、左边距。
 * 文字开头的容器上下比左右小一档，半行距补上以后看起来一样；量出来上下差不超过 5px，上下都不比左边大 3px 以上。 */
const INSETS = [
  ["/components/banner/", ".xxd-banner"],
  ["/components/card/", ".xxd-card__body"],
  ["/components/chart/", ".xxd-chart-card"],
  ["/components/stat/", ".xxd-stat"],
  ["/components/dialog/", ".xxd-dialog"],
  ["/components/sheet/", ".xxd-sheet"],
  ["/components/panel/", ".xxd-panel"],
  ["/components/popover/", ".xxd-popover"],
  ["/components/toast/", ".xxd-toast"],
  ["/components/settings-group/", ".xxd-row"],
  ["/components/menu/", ".xxd-menu"],
];
async function insetAudit() {
  let n = 0;
  for (const compact of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
    const tab = await ctx.newPage();
    for (const [page, sel] of INSETS) {
      await tab.goto(`${origin}${page}`, { waitUntil: "load" });
      if (compact) await tab.evaluate(() => document.documentElement.setAttribute("data-density", "compact"));
      const el = tab.locator(sel).locator("visible=true").first();
      if (!(await el.count())) { fail("内边距", `${page} 找不到 ${sel}`); continue; }
      await el.scrollIntoViewIfNeeded();
      const bw = await el.evaluate((e) => { e.style.setProperty("border-color", "transparent", "important"); const c = getComputedStyle(e); return [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].map(parseFloat); });
      const png = (await el.screenshot({ animations: "disabled" })).toString("base64");
      const ink = await tab.evaluate(async ({ png, bw }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + png;
        await img.decode();
        const c = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
        const x = c.getContext("2d");
        x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data;
        const W = c.width, s = 2;
        const t0 = Math.ceil(bw[0] * s) + 1, r0 = W - Math.ceil(bw[1] * s) - 2, b0 = c.height - Math.ceil(bw[2] * s) - 2, l0 = Math.ceil(bw[3] * s) + 1;
        const at = (i, j) => { const k = (j * W + i) * 4; return [d[k], d[k + 1], d[k + 2]]; };
        const bg = at(l0 + 2, t0 + 2);
        const ink = (p) => Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > 60;
        const rowLine = new Set(), colLine = new Set();
        for (let j = t0; j <= b0; j += 1) { let k = 0; for (let i = l0; i <= r0; i += 1) if (ink(at(i, j))) k += 1; if (k > (r0 - l0) * 0.7) rowLine.add(j); }
        for (let i = l0; i <= r0; i += 1) { let k = 0; for (let j = t0; j <= b0; j += 1) if (ink(at(i, j))) k += 1; if (k > (b0 - t0) * 0.7) colLine.add(i); }
        let T = Infinity, B = -1, L = Infinity;
        for (let j = t0; j <= b0; j += 1) if (!rowLine.has(j)) for (let i = l0; i <= r0; i += 1) if (!colLine.has(i) && ink(at(i, j))) { T = Math.min(T, j); B = Math.max(B, j); L = Math.min(L, i); }
        return { top: (T - t0 + 1) / s, bottom: (b0 - B + 1) / s, left: (L - l0 + 1) / s };
      }, { png, bw });
      n += 1;
      const where = `${page} ${sel}${compact ? "（紧凑）" : ""}`;
      const v = `上 ${ink.top} / 下 ${ink.bottom} / 左 ${ink.left}`;
      if (Math.abs(ink.top - ink.bottom) > 5) fail("内边距", `${where} 看起来上下不一样：${v}`);
      if (ink.top > ink.left + 3 || ink.bottom > ink.left + 3) fail("内边距", `${where} 看起来上下比左右宽：${v}`);
    }
    await ctx.close();
  }
  console.log(`内边距：${n} 个容器（标准 / 紧凑）量了看得见的上下左边距`);
}

/* ── 13. 对比度（COLOR-REVIEW-PLAN D81）──
 * 自己合成底色量每段字（axe 跳过的表格、半透明层也量）；选中 / 当前要有 ≥ 3:1 的记号。
 * 外观：墨色亮暗、芥黄（最难的预设）亮、自定义纯蓝（极端主色）暗；组件、模式、模板、首页。 */
const CONTRAST = readFileSync(join(root, "scripts/contrast.js"), "utf8");
async function contrastAudit() {
  const looks = [
    { id: "墨色·亮", s: { theme: "light", accent: "" } },
    { id: "墨色·暗", s: { theme: "dark", accent: "" } },
    { id: "芥黄·亮", s: { theme: "light", accent: "#8f812d" } },
    { id: "纯蓝·暗", s: { theme: "dark", accent: "#0000ff" } },
  ];
  const list = pages.filter((p) => /^\/(components|patterns|templates)\/|^\/$/.test(p));
  let n = 0;
  const seen = new Set();
  for (const { id, s } of looks) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify({ corners: "square", density: "comfortable", finish: "flat", ...s })), s);
    for (const page of list) {
      const tab = await ctx.newPage();
      await tab.goto(origin + page, { waitUntil: "load" });
      await tab.addScriptTag({ content: CONTRAST });
      const { text, states } = await tab.evaluate(() => ({ text: xxdContrast().filter((x) => !x.unknown || !/透明度/.test(x.unknown)).filter((x) => x.r < x.need), states: xxdStates().filter((x) => x.weak) }));
      for (const x of text) { const k = `${id}|${x.where}`; if (!seen.has(k)) { seen.add(k); fail("对比度", `${id} ${page} ${x.where}「${x.t}」${x.r} < ${x.need}（${x.fg} 在 ${x.bg} 上）`); } }
      for (const x of states) { const k = `${id}|${x.el}`; if (!seen.has(k)) { seen.add(k); fail("对比度", `${id} ${page} ${x.el}「${x.t}」[${x.attr}] 选中只靠淡底（${x.cues}）`); } }
      n += 1;
      await tab.close();
    }
    await ctx.close();
  }
  console.log(`对比度：${n} 页次（${looks.length} 种外观）量了每段字和每个选中 / 当前的记号`);
}

/* ── 14. 焦点环不被裁（ACCEPTANCE-REVIEW）──
 * 每页每个能 Tab 到的东西聚焦一下，算 outline 有没有被祖先的 overflow 裁掉两边以上（tab 的横向滚动、面包屑的省略号以前就是这样把焦点吃掉的）。 */
async function focusAudit() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  let n = 0;
  for (const page of pages.filter((p) => !p.startsWith("/en/"))) {
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "load" });
    await tab.keyboard.press("Tab");
    const found = await tab.evaluate(() => {
      const out = [];
      const sel = 'main a[href],main button,main input:not([type=hidden]),main select,main textarea,main [tabindex]:not([tabindex="-1"]),main summary';
      for (const e of document.querySelectorAll(sel)) {
        if (e.closest("[inert],[data-kind=dont],.site-matrix") || e.disabled || !e.getClientRects().length || e.tabIndex < 0) continue;
        e.focus({ preventScroll: true });
        if (document.activeElement !== e) continue;
        // 减少动效下还剩 0.01ms 的过渡：先让它走完再量，不然量到的是起点
        for (const an of e.getAnimations()) an.finish();
        const cs = getComputedStyle(e);
        const w = parseFloat(cs.outlineWidth) || 0;
        if (cs.outlineStyle === "none" || !w) continue;
        const o = parseFloat(cs.outlineOffset) || 0;
        if (o + w <= 0) continue;
        const r = e.getBoundingClientRect();
        const ring = { l: r.left - o - w, t: r.top - o - w, r: r.right + o + w, b: r.bottom + o + w };
        for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
          const st = getComputedStyle(a);
          if (st.overflowX === "visible" && st.overflowY === "visible") continue;
          const q = a.getBoundingClientRect();
          const c = { l: q.left + parseFloat(st.borderLeftWidth), t: q.top + parseFloat(st.borderTopWidth), r: q.right - parseFloat(st.borderRightWidth), b: q.bottom - parseFloat(st.borderBottomWidth) };
          const sides = (ring.l < c.l - 0.5) + (ring.t < c.t - 0.5) + (ring.r > c.r + 0.5) + (ring.b > c.b + 0.5);
          if (sides >= 2) { out.push(`${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 2).join(".")}「${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 12)}」被 ${a.tagName.toLowerCase()}.${[...a.classList][0] || ""} 裁掉 ${sides} 边`); break; }
        }
      }
      return [...new Set(out)];
    });
    for (const x of found) fail("焦点", `${page} ${x}`);
    n += 1;
    await tab.close();
  }
  await ctx.close();
  console.log(`焦点：${n} 页，每个能 Tab 到的东西的焦点环都没被裁`);
}

/* ── 15. 按下的反馈和减少动效（MOTION-REVIEW-PLAN D90）──
 * 组件、模式页演示里每个能点的东西强制 :active：同一刻就要有看得见的变化（以前按钮的按下底色要淡入 140ms，快点一下看不到；
 * 很多东西根本没有按下样式）。开关、复选、单选、分段、tab 按下后状态立刻变，不查。
 * 减少动效下：还在跑的动画只能是慢淡入淡出；进行中的按钮不能是定住的弧。 */
async function motionAudit() {
  const SEL = "main .site-demo__stage :is(.xxd-btn, .xxd-chip, .xxd-menu__item, .xxd-option, .xxd-toolbar__item, .xxd-sidebar__item, .xxd-pagination > button, .xxd-th-sort, .xxd-inline-copy, .xxd-glyphs > button, .xxd-sort-handle, .xxd-picker__trigger, a.xxd-row, a.xxd-card, .xxd-link, .xxd-list__main)";
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let n = 0;
  for (const page of pages.filter((p) => /^\/(components|patterns)\//.test(p))) {
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "load" });
    const cdp = await ctx.newCDPSession(tab);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: SEL });
    const read = () => tab.evaluate(() => {
      const el = document.querySelector("[data-audit-press]");
      // 选中 / 当前的按下时选中说了算（状态优先级），点了状态会变，不在这里查；不能点的 div 也不查
      if (!el || !el.getClientRects().length || el.matches(":disabled, [aria-disabled=true], [aria-busy=true], [aria-pressed=true], [aria-current]:not([aria-current=false]), [aria-selected=true], [data-selected], :not(a, button, [role=button], [role=menuitem], [role=option], [tabindex])") || el.closest("[aria-selected=true], [aria-current]:not([aria-current=false]), [data-selected]")) return null;
      const cs = getComputedStyle(el), b = getComputedStyle(el, "::before");
      return { k: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")}${el.dataset.variant ? `[${el.dataset.variant}]` : ""}`, s: [cs.backgroundColor, cs.color, cs.borderTopColor, cs.boxShadow, cs.transform, cs.textDecorationColor, b.backgroundColor, (el.closest(".xxd-list__item") ? getComputedStyle(el.closest(".xxd-list__item")).backgroundColor : "")].join("|") };
    });
    const seen = new Set();
    for (const nodeId of nodeIds.slice(0, 40)) {
      await cdp.send("DOM.setAttributeValue", { nodeId, name: "data-audit-press", value: "" });
      const base = await read();
      if (base && !seen.has(base.k)) {
        await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["active"] });
        const now = await read();
        await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
        if (now && now.s === base.s) { seen.add(base.k); fail("动效", `${page} ${base.k} 按下的同一刻没有看得见的变化`); }
        else seen.add(base.k);
      }
      await cdp.send("DOM.removeAttribute", { nodeId, name: "data-audit-press" });
    }
    n += 1;
    await tab.close();
  }
  await ctx.close();
  const rm = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  for (const page of ["/", "/components/progress/", "/components/button/"]) {
    const tab = await rm.newPage();
    await tab.goto(origin + page, { waitUntil: "load" });
    await tab.waitForTimeout(300);
    const r = await tab.evaluate(() => {
      const bad = document.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "xxd-breathe").map((a) => `${a.animationName || a.transitionProperty} 在 ${a.effect?.target?.className}`);
      const b = document.querySelector("main .site-demo__stage .xxd-btn");
      if (b) { b.setAttribute("aria-busy", "true"); const be = getComputedStyle(b, "::before"); if (!/xxd-breathe/.test(be.animationName)) bad.push(`进行中的按钮在减少动效下是 ${be.animationName}（应慢淡入淡出，不能定住）`); b.removeAttribute("aria-busy"); }
      return bad;
    });
    for (const x of r) fail("动效", `${page} 减少动效：${x}`);
    await tab.close();
  }
  await rm.close();
  console.log(`动效：${n} 页按下立即有反馈；减少动效下只有慢淡入淡出`);
}

/* ── 16. 状态叠加（ACCEPTANCE-REVIEW）：优先级 禁用 > 进行中 > 出错 > 选中 / 当前 > 焦点 > 按下 > 悬停 ──
 * 选中 / 当前 / 按下的东西悬停时，选中的记号不变；禁用的悬停不变；出错的输入框聚焦时边还是红的。 */
async function statesAudit() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sel = "main :is([aria-selected=true]:not([role=tab]), [aria-current=page], [aria-current=true], [aria-pressed=true], [data-selected], :disabled, [aria-disabled=true], [aria-invalid=true]):not([data-kind=dont] *)";
  let n = 0;
  for (const page of pages.filter((p) => /^\/(components|patterns|templates)\//.test(p))) {
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "load" });
    const cdp = await ctx.newCDPSession(tab);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: sel });
    const read = () => tab.evaluate(() => {
      const el = document.querySelector("[data-audit-state]");
      if (!el || !el.getClientRects().length) return null;
      const target = el.matches("li, tr") ? el.querySelector("td") || el : el;
      const cs = getComputedStyle(target);
      const danger = getComputedStyle(document.documentElement).getPropertyValue("--danger").trim();
      return { k: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")}`, kind: el.matches(":disabled, [aria-disabled=true]") ? "disabled" : el.matches("[aria-invalid=true]") ? "invalid" : "selected", bg: cs.backgroundColor, bd: cs.borderTopColor, sh: cs.boxShadow, fg: cs.color, danger };
    });
    const seen = new Set();
    for (const nodeId of nodeIds.slice(0, 40)) {
      await cdp.send("DOM.setAttributeValue", { nodeId, name: "data-audit-state", value: "" });
      const base = await read();
      if (base && !seen.has(base.k + base.kind)) {
        seen.add(base.k + base.kind);
        if (base.kind === "invalid") {
          await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["focus", "focus-visible"] });
          const f = await read();
          if (f && f.bd !== base.bd) fail("状态", `${page} ${base.k} 出错又聚焦时边不再是出错色（${f.bd}）`);
        } else {
          await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
          const h = await read();
          if (h && (h.bg !== base.bg || h.bd !== base.bd || (base.kind === "disabled" && h.fg !== base.fg))) fail("状态", `${page} ${base.k} ${base.kind === "disabled" ? "禁用了悬停还会变" : "选中 / 当前的悬停时选中样式变了"}（${base.bg} → ${h.bg}，边 ${base.bd} → ${h.bd}）`);
        }
        await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
      }
      await cdp.send("DOM.removeAttribute", { nodeId, name: "data-audit-state" });
    }
    n += 1;
    await tab.close();
  }
  await ctx.close();
  console.log(`状态：${n} 页，选中 / 禁用 / 出错叠上悬停、聚焦后都按优先级`);
}

/* ── 17. 截断和长文字（TRUNCATION-REVIEW-PLAN D96）──
 * 组件和模式的示例（中、英两份标记）× 6 种文字 × 320 / 260 宽；对照页的 React 一半换成长英文。每段字看：
 *   · 硬裁（被裁掉又没有省略号）、竖着裁、字压字（看得见的部分，被上面不透明的东西盖住的不算）、挤成一字一行；
 *   · 省略号只给标签：内容（标题、状态、数字、图表的类别名）被截就是错；原文里的数字被截也是错；
 *   · 省略号悬停后要能看到全文（xxd.js 自动加的提示，或者作者写的 title / data-tooltip）。 */
const TRUNC_CONTENT = ".xxd-card__title, .xxd-list__title, .xxd-panel__title, .xxd-dialog__title, .xxd-sheet__title, .xxd-dock__status, .xxd-toast, .xxd-help, .xxd-error, .xxd-row__title, .xxd-row__desc, .xxd-stat__value, .xxd-gauge__value, .xxd-gauge__label, .xxd-gauge__state, .xxd-legend__name, .xxd-bars__label, .xxd-proportion__label, .xxd-dumbbell__label, .xxd-radar__label, .xxd-quadrant__name, .xxd-quadrant__label, .xxd-heatmap__readout, .xxd-plan__name, .xxd-plan__price";
// 头像只放一两个字，长字只显示开头是它的样子；符号格一格一个字形
const TRUNC_EXEMPT = ".xxd-avatar, .xxd-glyphs";
function truncProbe({ scope, content, exempt }) {
  const out = [];
  const tag = (e) => `${e.tagName.toLowerCase()}${typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
  const hidden = (el) => {
    if (el.closest("[popover]:not(:popover-open), dialog:not([open]), [hidden], template, .xxd-sr-only, svg, [aria-hidden=true]") || (el.closest("details:not([open])") && !el.closest("summary"))) return true;
    if (getComputedStyle(el).visibility === "hidden") return true;
    for (let a = el; a; a = a.parentElement) if (getComputedStyle(a).opacity === "0") return true;
    return false;
  };
  for (const cell of document.querySelectorAll(scope)) {
    const name = cell.dataset.name || cell.dataset.pair || "";
    const box = cell.getBoundingClientRect();
    const texts = [];
    const tw = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const n = tw.currentNode, el = n.parentElement;
      if (!n.nodeValue.trim() || el.closest("script, style") || el.closest(exempt) || hidden(el)) continue;
      let fixed = false;
      for (let p = el; p && p !== cell; p = p.parentElement) if (getComputedStyle(p).position === "fixed") fixed = true;
      if (fixed) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5);
      if (!rects.length) continue;
      const R = { l: Math.min(...rects.map((r) => r.left)), r: Math.max(...rects.map((r) => r.right)), t: Math.min(...rects.map((r) => r.top)), b: Math.max(...rects.map((r) => r.bottom)) };
      const word = n.nodeValue.trim().replace(/\s+/g, " ");
      const V = { ...R };
      let kind = null, by = null;
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const st = getComputedStyle(a);
        if (st.display === "inline" || st.display === "contents" || (st.overflowX === "visible" && st.overflowY === "visible")) continue;
        const q = a.getBoundingClientRect();
        const c = { l: q.left + a.clientLeft, t: q.top + a.clientTop, r: q.left + a.clientLeft + a.clientWidth, b: q.top + a.clientTop + a.clientHeight };
        if (st.overflowX !== "visible") { V.l = Math.max(V.l, c.l); V.r = Math.min(V.r, c.r); }
        if (st.overflowY !== "visible") { V.t = Math.max(V.t, c.t); V.b = Math.min(V.b, c.b); }
        if (kind || !cell.contains(a)) continue;
        // 竖向：字形框本来就比行高高一点（行高 1 的控件），超过 1/4 个字高才算裁掉
        const fs = parseFloat(getComputedStyle(el).fontSize) * 0.25;
        const outX = R.l < c.l - 1 || R.r > c.r + 1, outY = R.t < c.t - fs || R.b > c.b + fs;
        if (!(outX && st.overflowX !== "visible") && !(outY && st.overflowY !== "visible")) continue;
        by = tag(a);
        if (/auto|scroll/.test(outX ? st.overflowX : st.overflowY)) kind = "滚动";
        else if ((st.webkitLineClamp && st.webkitLineClamp !== "none") || (outX && st.textOverflow === "ellipsis" && /block|list-item|table-cell/.test(st.display))) kind = "省略号";
        else kind = outY && !outX ? "竖着裁" : "硬裁";
      }
      if (kind === "省略号") {
        // 悬停一下：xxd.js 在捕获阶段写好全文提示
        el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true }));
        let full = false;
        for (let a = el, d = 0; a && d < 5; a = a.parentElement, d += 1) {
          const tt = a.getAttribute("title") || a.getAttribute("data-tooltip") || "";
          if (tt && tt.includes(word.slice(0, 8))) full = true;
        }
        // 省略到不足一个字宽：整个看不见了
        const gone = Math.min(V.r, R.r) - Math.max(V.l, R.l) < parseFloat(getComputedStyle(el).fontSize);
        out.push({ name, kind: gone ? "挤没了" : kind, el: tag(el), by, word: word.slice(0, 30), digits: /\d[\d,.]*\d|\d{2,}/.test(word), content: Boolean(el.closest(content)), full });
      } else if (kind && kind !== "滚动") out.push({ name, kind, el: tag(el), by, word: word.slice(0, 30) });
      if (!kind && R.r > box.right + 2 && !el.closest("[data-impl] [data-kumo-part=tab], .kumo-tabs-list")) out.push({ name, kind: "伸出", el: tag(el), by: `${Math.round(R.r - box.right)}px`, word: word.slice(0, 30) });
      // 挤成一字一行：四个字以上，却不到 2.5 个字宽、折成 3 行以上（数真的行数，固定高度的控件不按高度算）
      const size = parseFloat(getComputedStyle(el).fontSize);
      const lines = new Set(rects.map((r) => Math.round(r.top))).size;
      if (!kind && getComputedStyle(el).display !== "contents" && [...word].length >= 4 && el.getBoundingClientRect().width < size * 2.5 && lines >= 3) out.push({ name, kind: "挤窄", el: tag(el), by: `${Math.round(el.getBoundingClientRect().width)}px 宽`, word: word.slice(0, 30) });
      const vis = rects.map((r) => ({ l: Math.max(r.left, V.l), r: Math.min(r.right, V.r), t: Math.max(r.top, V.t), b: Math.min(r.bottom, V.b) })).filter((r) => r.r - r.l > 1 && r.b - r.t > 1);
      if (vis.length) texts.push({ el, rs: vis, word });
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const A = texts[i], B = texts[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      let at = null;
      for (const a of A.rs) for (const b of B.rs) if (!at && Math.min(a.r, b.r) - Math.max(a.l, b.l) > 2 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 3) at = { x: (Math.max(a.l, b.l) + Math.min(a.r, b.r)) / 2, y: (Math.max(a.t, b.t) + Math.min(a.b, b.b)) / 2 };
      if (!at) continue;
      // 被上面不透明的东西盖住的那段字看不见（面板盖在网格上、sticky 的 dock），不算
      const stack = document.elementsFromPoint(at.x, at.y);
      const ia = stack.indexOf(A.el), ib = stack.indexOf(B.el);
      if (ia < 0 || ib < 0) continue;
      const lowEl = stack[Math.max(ia, ib)];
      let covered = false;
      for (let k = 0; k < Math.max(ia, ib); k++) {
        const e = stack[k];
        if (e.contains(lowEl)) continue;
        const bg = getComputedStyle(e).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
        if (bg.length === 3 || (bg.length === 4 && bg[3] > 0.9)) covered = true;
      }
      if (!covered) out.push({ name, kind: "字压字", el: `${tag(A.el)} × ${tag(B.el)}`, by: "", word: `${A.word.slice(0, 12)} / ${B.word.slice(0, 12)}` });
    }
  }
  return out;
}

const TRUNC_TEXTS = {
  原文: null,
  重复三遍: "x3",
  长中文: "这是一段非常非常长的中文文字用来测试换行和截断是否正确处理而且还要再长一点点才行",
  长英文: "Synchronize internationalization configuration across workspaces",
  长链接: "https://vip.xiaoxiaodong.ai/prompts/2026/very-long-slug-without-any-spaces-at-all",
  大数字: "¥1,234,567,890.12",
};

async function truncAudit() {
  const zh = [
    ...JSON.parse(readFileSync(join(pkgs, "xxd-css/registry.json"), "utf8")).components,
    ...JSON.parse(readFileSync(join(pkgs, "xxd-css/patterns.json"), "utf8")).patterns.map((p) => ({ ...p, name: `模式 ${p.name}`, pattern: true })),
  ].filter((c) => typeof c.markup === "string");
  const enR = await import(pathToFileURL(join(pkgs, "xxd-css/registry.en.js")).href);
  const enP = await import(pathToFileURL(join(pkgs, "xxd-css/patterns.en.js")).href);
  const en = zh.map((c) => ({ ...c, markup: (c.pattern ? enP.patterns : enR.components)[c.name.replace(/^模式 /, "")]?.markup ?? c.markup }));
  let n = 0;
  const seen = new Set();
  const report = (label, x) => {
    const key = `${x.name}|${x.kind}|${x.el}`;
    if (seen.has(key)) return;
    seen.add(key);
    fail("截断", `${label} · ${x.name}: ${x.kind === "省略号" ? (x.content ? "内容被省略" : x.digits ? "数字被省略" : "省略了看不到全文") : x.kind} ${x.el}${x.by ? ` ← ${x.by}` : ""}「${x.word}」`);
  };
  for (const { lang, registry } of [{ lang: "中", registry: zh }, { lang: "英", registry: en }]) for (const [label, text] of Object.entries(TRUNC_TEXTS)) for (const w of [320, 260]) {
    const ctx = await browser.newContext({ viewport: { width: w + 40, height: 900 }, reducedMotion: "reduce" });
    const tab = await ctx.newPage();
    await tab.goto(`${origin}/__audit/long`);
    await tab.evaluate(({ registry, text, w }) => {
      const app = document.getElementById("app");
      app.style.setProperty("--cell", `${w}px`);
      for (const c of registry) {
        if (w < 300 && c.name === "Sidebar") continue;
        const cell = document.createElement("section");
        cell.className = "cell";
        cell.dataset.name = c.name;
        cell.innerHTML = c.markup;
        if (text) {
          const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
          const nodes = [];
          // 只有符号的（「…」「›」）不换：它们不会变长
          while (walker.nextNode()) if (/\p{L}/u.test(walker.currentNode.nodeValue) && !walker.currentNode.parentElement.closest("script, style, pre, code, kbd, .xxd-kbd, [data-spark], svg")) nodes.push(walker.currentNode);
          for (const node of nodes) node.nodeValue = text === "x3" ? [1, 2, 3].map(() => node.nodeValue.trim()).join(" ") : text;
          // 图表的字在数据属性里：类别名换成长文字（加序号分得开），大数字时数值放大一百万倍
          const big = text.startsWith("¥");
          for (const el of cell.querySelectorAll("[data-items], [data-parts], [data-rows]")) for (const at of ["data-items", "data-parts", "data-rows"]) {
            const v = el.getAttribute(at);
            if (v) el.setAttribute(at, v.split(";").map((seg, i) => { const [k, rest] = seg.split(":"); if (rest == null) return seg; return big ? `${k}:${rest.replace(/\d+(\.\d+)?/g, (m) => String(Math.round(Number(m) * 1e6)))}` : `${text === "x3" ? [k, k, k].join(" ") : text.slice(0, 24) + i}:${rest}`; }).join(";"));
          }
          if (!big) for (const el of cell.querySelectorAll("[data-label], [data-from-label], [data-to-label]")) for (const at of ["data-label", "data-from-label", "data-to-label"]) if (el.hasAttribute(at)) el.setAttribute(at, text === "x3" ? [1, 2, 3].map(() => el.getAttribute(at)).join(" ") : text);
        }
        app.append(cell);
      }
      Xxd.install(document);
      globalThis.XxdIcons?.hydrateIcons?.(document);
    }, { registry, text, w });
    await tab.waitForTimeout(400);
    const found = await tab.evaluate(truncProbe, { scope: "#app > .cell", content: TRUNC_CONTENT, exempt: TRUNC_EXEMPT });
    for (const x of found) if (x.kind !== "省略号" || x.content || (!text && x.digits) || !x.full) report(`${lang} · ${label} · ${w}px`, x);
    n += registry.length;
    await ctx.close();
  }
  // React：对照页的每一格（HTML 和 React 两半）字换成长英文
  for (const w of [320, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
    const tab = await ctx.newPage();
    await tab.goto(`${origin}/tools/parity/`, { waitUntil: "networkidle" });
    await tab.waitForTimeout(500);
    await tab.evaluate(() => {
      for (const cell of document.querySelectorAll("[data-impl]")) {
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        const nodes = [];
        // 数字不换（数字本来就短，换成长英文不是真实情况）
        while (walker.nextNode()) if (walker.currentNode.nodeValue.trim() && !/\d/.test(walker.currentNode.nodeValue) && !walker.currentNode.parentElement.closest("script, style, pre, code, svg")) nodes.push(walker.currentNode);
        for (const node of nodes) node.nodeValue = "Synchronize internationalization configuration";
      }
    });
    await tab.waitForTimeout(300);
    const found = await tab.evaluate(truncProbe, { scope: "[data-impl]", content: TRUNC_CONTENT, exempt: TRUNC_EXEMPT });
    for (const x of found) if (x.kind !== "省略号" || x.content) report(`对照页 · ${w}px`, x);
    await ctx.close();
  }
  console.log(`截断：${n} 个示例（中英 × 6 种文字 × 2 种宽）+ 对照页 React：不硬裁、内容和数字不省略、省略的都能看到全文、字不互相压`);
}

/* ── 18. 表单和出错（FORM-REVIEW-PLAN D106）──
 * 组件、模式、模板页演示里的每个表单控件用 Xxd.setFieldError 标错：
 *   · 错误在整个控件下面，不在 label、输入组、标签输入、自定义下拉、选择外面那层里；
 *   · 看得见的那个框变成出错色；出错又聚焦还是出错色，能打字的框加粗成 2px；清掉以后都回去。
 * 高对比度下出错的框比普通的粗；演示表单空着提交：焦点到第一个错、每个错都在、说明让位，改对了马上消失、作者的提交没跑；
 * 输入法组合中按回车不选中 combobox 的项。 */
const FORM_CONTROLS = ':is(input:not([type=hidden], [type=range], [type=submit], [type=button], [type=reset], [type=file], [type=color], [type=image]), textarea, select, .xxd-picker__trigger)';
function formProbe(sel) {
  const danger = (() => { const d = document.createElement("i"); d.style.color = getComputedStyle(document.documentElement).getPropertyValue("--danger"); document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; })();
  const out = [];
  const name = (el) => `${el.tagName.toLowerCase()}${el.type && el.tagName === "INPUT" ? `[${el.type}]` : ""}.${[...el.classList][0] || ""}「${(el.getAttribute("aria-label") || el.labels?.[0]?.textContent || el.closest(".xxd-field")?.querySelector(".xxd-label")?.textContent || "").trim().slice(0, 10)}」`;
  const seen = new Set();
  for (const ctl of document.querySelectorAll(sel)) {
    if (ctl.closest("[inert], [data-kind=dont], astro-island, .site-matrix, dialog:not([open]), [hidden]") || ctl.disabled || ctl.readOnly || !ctl.getClientRects().length) continue;
    if (ctl.getAttribute("aria-invalid") === "true" || ctl.closest("[aria-invalid=true]")) continue;
    const group = ctl.type === "radio" ? ctl.closest("fieldset, [role=radiogroup]") : null;
    if (group && seen.has(group)) continue;
    if (group) seen.add(group);
    const vis = ctl.closest(".xxd-input-group, .xxd-taginput") ?? ctl;
    const err = Xxd.setFieldError(ctl, "这里有一个比较长的错误说明，看它折行以后是不是还在整个控件下面");
    const er = err.getBoundingClientRect();
    const anchors = group ? [...group.querySelectorAll(".xxd-choice, input[type=radio]")] : [ctl.closest(".xxd-input-group, .xxd-taginput, .xxd-picker, .xxd-select, [data-xxd-combobox], .xxd-choice, .xxd-input-wrap") ?? ctl];
    const bottom = Math.max(...anchors.map((a) => a.getBoundingClientRect().bottom));
    const inside = err.closest("label, .xxd-input-group, .xxd-taginput, .xxd-picker, .xxd-select, .xxd-choice");
    // 字段、组里：错误在控件下面；设置行里：在左边那一栏；没放进字段的控件（演示里单放的）只要求不进框、不进 label
    const row = !ctl.closest(".xxd-field") && ctl.closest(".xxd-row");
    if (inside) out.push(`${name(ctl)} 的错误在 ${inside.tagName.toLowerCase()}.${[...inside.classList][0] || ""} 里面`);
    else if (!er.height) out.push(`${name(ctl)} 的错误看不见`);
    else if (row) { if (!err.parentElement.matches(".xxd-row__text")) out.push(`${name(ctl)} 在设置行里，错误不在左边那一栏`); }
    else if (ctl.closest(".xxd-field, fieldset, [role=radiogroup]") && er.top < bottom - 1) out.push(`${name(ctl)} 的错误不在控件下面（错误顶 ${Math.round(er.top)}，控件底 ${Math.round(bottom)}）`);
    const bd = getComputedStyle(vis).borderTopColor;
    if (bd !== danger) out.push(`${name(ctl)} 出错了框不是出错色（${bd}）`);
    ctl.focus({ preventScroll: true });
    const f = getComputedStyle(vis);
    const typing = !/^(checkbox|radio)$/.test(ctl.type);
    if (document.activeElement === ctl) {
      if (f.borderTopColor !== danger) out.push(`${name(ctl)} 出错又聚焦时边不是出错色（${f.borderTopColor}）`);
      else if (typing && !f.boxShadow.includes(danger) && parseFloat(f.borderTopWidth) < 2) out.push(`${name(ctl)} 出错又聚焦时没有加粗成 2px 的出错色（${f.boxShadow}）`);
    }
    ctl.blur();
    Xxd.setFieldError(ctl, "");
    if (err.isConnected && !err.hidden) out.push(`${name(ctl)} 清掉以后错误还在`);
    if (ctl.hasAttribute("aria-invalid") || getComputedStyle(vis).borderTopColor === danger) out.push(`${name(ctl)} 清掉以后还是出错的样子`);
  }
  return out;
}

async function formAudit() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(() => addEventListener("DOMContentLoaded", () => document.head.insertAdjacentHTML("beforeend", "<style>*,*::before,*::after{transition:none!important}</style>")));
  let n = 0;
  for (const page of pages.filter((p) => /^\/(en\/)?(components|patterns|templates)\//.test(p))) {
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "load" });
    await tab.waitForTimeout(60);
    const found = await tab.evaluate(formProbe, `main .site-demo__stage ${FORM_CONTROLS}`);
    for (const x of [...new Set(found)]) fail("表单", `${page} ${x}`);
    n += 1;
    await tab.close();
  }
  // 高对比度：出错的框比普通的粗，错误前面的图标看得见
  {
    const fc = await browser.newContext({ viewport: { width: 900, height: 900 }, forcedColors: "active" });
    const tab = await fc.newPage();
    await tab.goto(origin + "/__audit/long", { waitUntil: "load" });
    const r = await tab.evaluate(() => {
      document.querySelector("#app").innerHTML = `<div class="xxd-field"><label class="xxd-label" for="a">A</label><input class="xxd-input" id="a"></div><div class="xxd-field"><label class="xxd-label" for="b">B</label><input class="xxd-input" id="b"></div>
        <div class="xxd-field"><label class="xxd-label" for="c">C</label><div class="xxd-input-group"><input id="c"></div></div><div class="xxd-field"><label class="xxd-choice"><input type="checkbox" class="xxd-check" id="d">D</label></div>`;
      const bad = [];
      for (const id of ["a", "c", "d"]) {
        const el = document.getElementById(id);
        const err = Xxd.setFieldError(el, "错了");
        const vis = el.closest(".xxd-input-group") ?? el;
        if (parseFloat(getComputedStyle(vis).borderTopWidth) < 2) bad.push(`#${id} 出错的框和普通的一样粗`);
        const b = getComputedStyle(err, "::before");
        if (b.content === "none" || b.backgroundColor === getComputedStyle(document.body).backgroundColor) bad.push(`#${id} 错误前面的图标看不见`);
      }
      return bad;
    });
    for (const x of r) fail("表单", `高对比度 ${x}`);
    await fc.close();
  }
  // 演示表单：空着提交
  for (const page of ["/components/field/", "/en/components/field/"]) {
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "load" });
    const form = tab.locator("main form[data-xxd-validate]").first();
    if (!(await form.count())) { fail("表单", `${page} 没有整张表单的演示`); await tab.close(); continue; }
    await form.locator("button").first().click();
    await tab.waitForTimeout(80);
    const r = await tab.evaluate(() => {
      const form = document.querySelector("main form[data-xxd-validate]");
      const bad = [];
      if (!form.noValidate) bad.push("没写 novalidate（会冒浏览器的气泡）");
      const required = [...form.querySelectorAll("[required]")];
      if (document.activeElement !== required[0]) bad.push(`焦点不在第一个错上（在 ${document.activeElement?.id || document.activeElement?.tagName}）`);
      for (const el of required) {
        const err = document.getElementById((el.getAttribute("aria-describedby") || "").split(" ").pop());
        if (el.getAttribute("aria-invalid") !== "true" || !err?.classList.contains("xxd-error") || !err.getClientRects().length) bad.push(`${el.id || el.type} 空着提交没有看得见的错误`);
      }
      for (const help of form.querySelectorAll(".xxd-field:has(> .xxd-error:not([hidden])) > .xxd-help:not([data-counter])")) if (help.getClientRects().length) bad.push(`${help.id} 出错时说明没有让位`);
      if (document.querySelector(".xxd-toast")) bad.push("有错还跑了作者的提交处理");
      const first = required[0];
      first.value = "x";
      first.dispatchEvent(new Event("input", { bubbles: true }));
      if (first.hasAttribute("aria-invalid") || form.querySelector(`#${first.id} ~ .xxd-error:not([hidden])`)) bad.push("改对了错误没消失");
      return bad;
    });
    for (const x of r) fail("表单", `${page} 整张表单：${x}`);
    await tab.close();
  }
  // 输入法：组合中按回车不选中
  {
    const tab = await ctx.newPage();
    await tab.goto(origin + "/components/combobox/", { waitUntil: "load" });
    const r = await tab.evaluate(() => {
      const input = document.querySelector("main .site-demo__stage [data-xxd-combobox] input");
      input.focus();
      input.value = input.closest("[data-xxd-combobox]").querySelector(".xxd-option").textContent.trim().slice(0, 1);
      const typed = input.value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true }));
      return input.value === typed ? null : `输入法组合中按回车选中了「${input.value}」`;
    });
    if (r) fail("表单", `/components/combobox/ ${r}`);
    await tab.close();
  }
  await ctx.close();
  console.log(`表单：${n} 页的每个表单控件标错、聚焦、清掉；高对比度；整张表单空着提交（中英）；输入法组合中的回车`);
}

/* ── 19. 暗黑模式（DARK-REVIEW-PLAN D114）──
 * · 脚本算颜色的页面：亮着打开再切到暗 ↔ 直接暗着打开，逐个元素的字、底、边、SVG、阴影、画布像素一样；
 * · 组件页：亮页面里给演示框写 data-theme="dark" ↔ 整页暗色，演示框里的东西一样（局部主题是一张完整的面）；
 * · 局部暗色里打开、被放到页面最外层的 toast / 确认框 / 命令面板是暗的；打印是亮的；切主题后没有还在慢慢变色的。 */
function darkPrint(scopeSel) {
  const cv = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  const norm = (c) => {
    if (!c || c === "transparent" || c === "none") return "-";
    cv.clearRect(0, 0, 1, 1);
    cv.fillStyle = "#000";
    cv.fillStyle = c;
    cv.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = cv.getImageData(0, 0, 1, 1).data;
    return a === 0 ? "-" : `${r},${g},${b}${a < 255 ? `/${a}` : ""}`;
  };
  const out = [];
  for (const scope of document.querySelectorAll(scopeSel)) {
    for (const el of [scope, ...scope.querySelectorAll("*")]) {
      if (!el.getClientRects().length || el.closest(".xxd-appearance, [data-xxd-appearance]")) continue;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.opacity === "0") continue;
      const f = { c: norm(s.color), bg: norm(s.backgroundColor) };
      if (parseFloat(s.borderTopWidth) > 0) f.bd = norm(s.borderTopColor);
      if (el instanceof SVGElement) Object.assign(f, { fill: s.fill.startsWith("url") ? s.fill : norm(s.fill), stroke: norm(s.stroke) });
      if (s.boxShadow !== "none") f.sh = s.boxShadow.replace(/rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)/g, (m) => norm(m));
      if (el.tagName === "CANVAS" && el.width && el.height) {
        try {
          const d = el.getContext("2d")?.getImageData(0, 0, el.width, el.height).data;
          let h = 0;
          if (d) for (let k = 0; k < d.length; k += 97) h = (h * 31 + d[k]) >>> 0;
          f.px = h;
        } catch {}
      }
      out.push({ k: `${el.tagName.toLowerCase()}${el.classList.length ? "." + [...el.classList].slice(0, 2).join(".") : ""}`, f });
    }
  }
  return out;
}

function darkDiff(a, b) {
  const out = new Map();
  if (a.length !== b.length) return [`元素个数 ${a.length} ↔ ${b.length}`];
  for (let i = 0; i < a.length; i++) {
    if (a[i].k !== b[i].k) return [`结构不一样：${a[i].k} ↔ ${b[i].k}`];
    for (const p of new Set([...Object.keys(a[i].f), ...Object.keys(b[i].f)])) if (a[i].f[p] !== b[i].f[p] && !out.has(`${a[i].k} ${p}`)) out.set(`${a[i].k} ${p}`, `${a[i].f[p] ?? "无"} ↔ ${b[i].f[p] ?? "无"}`);
  }
  return [...out].map(([k, v]) => `${k}：${v}`);
}

async function darkAudit() {
  const still = "<style>*,*::before,*::after{transition:none!important;animation-duration:0s!important}</style>";
  const open = async (theme, page, setup) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), { theme, corners: "square", accent: "", density: "comfortable", finish: "flat" });
    await ctx.addInitScript((k) => addEventListener("DOMContentLoaded", () => document.head.insertAdjacentHTML("beforeend", k)), still);
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "networkidle" });
    await tab.waitForTimeout(200);
    if (setup) {
      await tab.evaluate(setup);
      await tab.waitForTimeout(400);
    }
    return { ctx, tab };
  };
  // 1. 切换 ↔ 直接打开
  const scripted = pages.filter((p) => /^\/(components\/(chart|gauge|bars|proportion|waffle|heatmap|dumbbell|radar|quadrant|stat|progress|appearance|code)|foundations\/colors)\/$/.test(p));
  for (const page of scripted) {
    const a = await open("light", page, () => XxdTheme.set({ theme: "dark" }));
    const A = await a.tab.evaluate(darkPrint, "main");
    await a.ctx.close();
    const b = await open("dark", page);
    const B = await b.tab.evaluate(darkPrint, "main");
    await b.ctx.close();
    for (const x of darkDiff(A, B).slice(0, 6)) fail("暗色", `${page} 亮着打开再切到暗和直接暗着打开不一样：${x}`);
  }
  // 2. 局部暗色 ↔ 整页暗色（组件页的演示框）
  const comps = pages.filter((p) => /^\/components\/[^/]+\/$/.test(p) && !/\/appearance\//.test(p));
  for (const page of comps) {
    const a = await open("light", page, () => { for (const s of document.querySelectorAll("main .site-demo__stage")) s.setAttribute("data-theme", "dark"); });
    const A = await a.tab.evaluate(darkPrint, "main .site-demo__stage > *");
    await a.ctx.close();
    const b = await open("dark", page);
    const B = await b.tab.evaluate(darkPrint, "main .site-demo__stage > *");
    await b.ctx.close();
    for (const x of darkDiff(A, B).slice(0, 6)) fail("暗色", `${page} 局部暗色和整页暗色不一样：${x}`);
  }
  // 3. 局部暗色里打开的浮层、打印、切换时的过渡
  {
    const { ctx, tab } = await open("light", "/components/button/");
    const r = await tab.evaluate(async () => {
      const bad = [];
      document.body.insertAdjacentHTML("beforeend", '<div data-theme="dark" id="dk"><button class="xxd-btn" id="dk-btn">按钮</button></div>');
      const btn = document.getElementById("dk-btn");
      btn.focus();
      const raised = getComputedStyle(document.getElementById("dk")).getPropertyValue("--paper-raised").trim();
      const probe = document.createElement("i");
      probe.style.color = raised;
      document.getElementById("dk").append(probe);
      const want = getComputedStyle(probe).color;
      const toast = Xxd.toast("局部暗色里的 toast").element;
      if (getComputedStyle(toast).backgroundColor !== want) bad.push(`toast 是 ${getComputedStyle(toast).backgroundColor}，不是这一块的 ${want}`);
      Xxd.confirmDialog({ title: "局部暗色里的确认框" });
      const dialog = [...document.querySelectorAll("dialog.xxd-dialog")].pop();
      if (getComputedStyle(dialog).backgroundColor !== want) bad.push(`确认框是 ${getComputedStyle(dialog).backgroundColor}，不是这一块的 ${want}`);
      dialog.close();
      Xxd.openCommandPalette({ items: [{ label: "一项" }] });
      const palette = [...document.querySelectorAll("dialog.xxd-palette")].pop();
      if (getComputedStyle(palette).backgroundColor !== want) bad.push(`命令面板是 ${getComputedStyle(palette).backgroundColor}，不是这一块的 ${want}`);
      palette.close();
      document.getElementById("dk").remove();
      return bad;
    });
    for (const x of r) fail("暗色", `局部暗色里打开的浮层：${x}`);
    await ctx.close();
  }
  {
    const { ctx, tab } = await open("dark", "/components/card/");
    const r = await tab.evaluate(() => {
      document.body.insertAdjacentHTML("beforeend", '<div data-theme="dark" id="dk2">一块暗色</div>');
      dispatchEvent(new Event("beforeprint"));
      const ink = getComputedStyle(document.body).color;
      const block = getComputedStyle(document.getElementById("dk2")).color;
      dispatchEvent(new Event("afterprint"));
      const back = document.documentElement.getAttribute("data-theme") + " " + document.getElementById("dk2").getAttribute("data-theme");
      return { ink, block, back };
    });
    const dark = (c) => { const [r, g, b] = c.match(/\d+/g).map(Number); return r + g + b < 200; };
    if (!dark(r.ink) || !dark(r.block)) fail("暗色", `打印时字不是深色（页面 ${r.ink}，暗色的一块 ${r.block}）`);
    if (r.back !== "dark dark") fail("暗色", `打印完没换回暗色（${r.back}）`);
    await ctx.close();
  }
  for (const page of ["/components/button/", "/components/field/"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem("xxd-site", JSON.stringify({ theme: "light", corners: "square", accent: "", density: "comfortable", finish: "flat" })));
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "networkidle" });
    const r = await tab.evaluate(async () => {
      const els = [...document.querySelectorAll("main *")].filter((e) => e.getClientRects().length);
      const read = () => els.map((e) => { const s = getComputedStyle(e); return s.backgroundColor + s.color + s.borderTopColor; });
      XxdTheme.set({ theme: "dark" });
      await new Promise((r) => setTimeout(r, 40));
      const mid = read();
      await new Promise((r) => setTimeout(r, 800));
      const end = read();
      return [...new Set(els.filter((e, i) => mid[i] !== end[i]).map((e) => `${e.tagName.toLowerCase()}.${e.classList[0] || ""}`))].slice(0, 6);
    });
    if (r.length) fail("暗色", `${page} 切到暗色 40ms 后还在变色：${r.join("、")}`);
    await ctx.close();
  }
  console.log(`暗色：${scripted.length} 页切换 ↔ 直接打开，${comps.length} 个组件页局部暗色 ↔ 整页暗色；局部暗色里的浮层、打印、切换不过渡`);
}

/* ── 20. 手机和触屏（TOUCH-REVIEW-PLAN D122）──
 * iPhone 13 的视口（触屏、粗指针、不能悬停），组件、模式、模板页的演示里每个能点的东西：
 *   · 从中心往四边逐点问「点到的是谁」，量出真正能点的宽高（伪元素补出来的也算）：任何东西不小于 24（WCAG 2.5.8），
 *     按钮、输入框、下拉高不小于 40（粗指针上是 44，被外面的容器裁掉一点的也算过）；
 *   · 能打字的框字号 ≥ 16px（iOS 聚焦时不放大页面）；
 *   · 强制 :hover 样子不变（触屏上悬停会粘住）。 */
async function touchAudit() {
  let n = 0;
  for (const page of pages.filter((p) => /^\/(components|patterns|templates)\//.test(p))) {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const tab = await ctx.newPage();
    await tab.goto(origin + page, { waitUntil: "networkidle" });
    await tab.waitForTimeout(120);
    const found = await tab.evaluate(() => {
      const out = [];
      const key = (e) => `${e.tagName.toLowerCase()}${e.classList.length ? "." + [...e.classList].slice(0, 2).join(".") : ""}「${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 8)}」`;
      const SEL = "main .site-demo__stage :is(a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=option], [role=switch], [role=checkbox], [role=radio], [role=menuitem])";
      for (const el of document.querySelectorAll(SEL)) {
        if (el.closest("[inert], [data-kind=dont], .site-demo__preview, .xxd-sr-only, [hidden], astro-island") || el.disabled || !el.getClientRects().length) continue;
        if (el.matches("a") && getComputedStyle(el).display === "inline" && el.closest("p, li, .xxd-prose, .xxd-text")) continue;
        if (el.matches("input[type=checkbox], input[type=radio]") && el.closest("label")?.textContent.trim()) continue;
        if (el.closest(".xxd-input-group, .xxd-taginput") && el.matches("input")) continue;
        if (el.matches("[role=separator], [role=tabpanel]")) continue;
        el.scrollIntoView({ block: "center", inline: "center" });
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const mine = (x, y) => { const h = document.elementFromPoint(x, y); return h && (h === el || el.contains(h)); };
        if (!mine(cx, cy)) continue;
        let a = 0, b = 0;
        while (a < 30 && mine(cx - a - 1, cy)) a++;
        while (b < 30 && mine(cx + b + 1, cy)) b++;
        const w = a + b + 1;
        a = 0; b = 0;
        while (a < 30 && mine(cx, cy - a - 1)) a++;
        while (b < 30 && mine(cx, cy + b + 1)) b++;
        const h = a + b + 1;
        if (Math.min(w, h) < 24) out.push(`${key(el)} 点按区 ${w}×${h}，小于 24`);
        else if (el.matches(".xxd-btn, .xxd-input, .xxd-textarea, select, .xxd-picker__trigger") && h < 40) out.push(`${key(el)} 点按区只有 ${h} 高`);
        if (el.matches("input:not([type=checkbox], [type=radio], [type=range], [type=color], [type=file], [type=button], [type=submit]), textarea, select") && parseFloat(getComputedStyle(el).fontSize) < 16) out.push(`${key(el)} 字号 ${getComputedStyle(el).fontSize}，iOS 聚焦时会放大页面`);
      }
      return [...new Set(out)];
    });
    for (const x of found) fail("触屏", `${page} ${x}`);
    // 触屏下强制 :hover：样子不该变
    const cdp = await ctx.newCDPSession(tab);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "main .site-demo__stage :is(a[href], button, [role=button], [role=tab], [role=option], [role=menuitem], .xxd-chip, .xxd-list__item, label, summary, input, select, textarea)" });
    const seen = new Set();
    for (const nodeId of nodeIds.slice(0, 60)) {
      await cdp.send("DOM.setAttributeValue", { nodeId, name: "data-audit-touch", value: "" }).catch(() => {});
      const read = () => tab.evaluate(() => { const e = document.querySelector("[data-audit-touch]"); if (!e) return null; const s = getComputedStyle(e); return { k: `${e.tagName.toLowerCase()}${e.classList.length ? "." + [...e.classList].slice(0, 2).join(".") : ""}`, v: [s.backgroundColor, s.color, s.borderTopColor, s.textDecorationLine, s.boxShadow].join("|") }; });
      const a = await read();
      if (a && !seen.has(a.k)) {
        seen.add(a.k);
        await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
        const b = await read();
        if (b && b.v !== a.v) fail("触屏", `${page} ${a.k} 触屏上悬停的样子会粘住`);
        await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
      }
      await cdp.send("DOM.removeAttribute", { nodeId, name: "data-audit-touch" }).catch(() => {});
    }
    n += 1;
    await ctx.close();
  }
  console.log(`触屏：${n} 页（iPhone 13 视口）点按区、输入框字号、悬停不粘住`);
}

/* ── 图表（ECharts）：ECHARTS-REVIEW-PLAN D136 ── */
async function chartAudit() {
  // 在组件页里另画一组极端图：饼、7 条线、十亿级柱、横向条形、参考线、坏值、时间轴
  const extreme = () => {
    const days = Array.from({ length: 14 }, (_, i) => `${i + 1}日`);
    const S = {
      pie: { series: [{ type: "pie", data: [{ name: "图片", value: 30 }, { name: "视频", value: 20 }, { name: "文字", value: 12 }, { name: "音频", value: 8 }] }] },
      many: { legend: {}, xAxis: { type: "category", data: days }, yAxis: { type: "value" }, series: Array.from({ length: 7 }, (_, k) => ({ name: `系列名字很长的第${k + 1}条`, type: "line", data: days.map((_, i) => 10 * k + i) })) },
      big: { xAxis: { type: "category", data: ["长文发布", "排序链接", "批量存图", "今日待办", "一个更长的插件名字"] }, yAxis: { type: "value" }, series: [{ type: "bar", data: [2410000000, 830000000, 5102000000, 312000000, 90000000] }] },
      hbar: { xAxis: { type: "value" }, yAxis: { type: "category", data: ["一个特别特别长的分类名字", "短", "中等长度"] }, series: [{ type: "bar", data: [3, 5, 2] }] },
      mark: { xAxis: { type: "category", data: days }, yAxis: { type: "value" }, series: [{ type: "line", data: days.map((_, i) => i * 3), markLine: { data: [{ type: "average", name: "平均" }] } }] },
      bad: { xAxis: { type: "category", data: days }, yAxis: { type: "value" }, series: [{ name: "坏值", type: "line", data: [1, 2, null, "-", NaN, 6, Infinity, 8, "9", 10, undefined, 12, 13, 14] }] },
      time: { xAxis: { type: "time" }, yAxis: { type: "value" }, series: [{ type: "line", data: [["2026-10-01", 3], ["2026-10-08", 5], ["2026-10-20", 4]] }] },
    };
    const box = document.createElement("div");
    box.id = "audit-charts";
    document.querySelector("main").append(box);
    for (const [k, o] of Object.entries(S)) {
      const d = document.createElement("div");
      d.className = "xxd-chart";
      d.dataset.audit = k;
      box.append(d);
      const ch = echarts.init(d);
      const build = () => Xxd.chartOptions(structuredClone(o));
      ch.setOption(build());
      Xxd.watchChartTheme(ch, build);
    }
  };
  const inspect = () => {
    const out = [];
    const Canvas = (() => { const p = document.createElement("span"); p.style.cssText = "color:Canvas;forced-color-adjust:none"; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; })();
    const rgb = (c) => { const p = document.createElement("span"); p.style.cssText = `color:${c};forced-color-adjust:none`; document.body.append(p); const m = getComputedStyle(p).color.match(/[\d.]+/g).map(Number); p.remove(); return m; };
    const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const forced = matchMedia("(forced-colors: active)").matches;
    for (const el of document.querySelectorAll("main .xxd-chart")) {
      const ch = echarts.getInstanceByDom(el);
      if (!ch) continue;
      const k = el.dataset.audit ?? el.id;
      const o = ch.getOption();
      const m = ch.getModel();
      const label = el.getAttribute("aria-label") ?? "";
      if (!label) out.push(`${k} 没有读屏描述`);
      if (/NaN|Infinity|undefined|第0个|\d{12}/.test(label)) out.push(`${k} 读屏描述里有乱的：「${label.slice(0, 60)}」`);
      if (o.animation !== false) out.push(`${k} 有进场动画（设计原则 §14 不做）`);
      const series = m.getSeries();
      for (const s of series) {
        if (s.subType === "pie") {
          const data = s.getData();
          const fills = new Set(data.mapArray((i) => data.getItemVisual(i, "style").fill));
          // 高对比模式下每块都是系统色，靠花纹分
          if (forced ? !data.getItemVisual(0, "style").decal : fills.size < data.count()) out.push(forced ? `${k} 高对比模式下饼图没有花纹，分不出块` : `${k} 饼图有 ${data.count() - fills.size} 块和别的块同色`);
          if ((o.xAxis ?? []).length) out.push(`${k} 饼图后面多了坐标轴`);
        }
        if (forced && s.subType !== "pie") {
          const c = s.getData().getVisual("style")?.stroke ?? s.getData().getVisual("style")?.fill;
          if (c && ratio(c, Canvas) < 3) out.push(`${k} 高对比模式下「${s.name}」和底色只有 ${ratio(c, Canvas).toFixed(2)}:1`);
        }
      }
      // 柱状图的类目一个不少
      for (const which of ["xAxis", "yAxis"]) {
        const ax = m.getComponent(which)?.axis;
        if (!ax || ax.type !== "category" || !series.some((s) => s.subType === "bar")) continue;
        const shown = ax.getViewLabels().length;
        const all = ax.scale.getOrdinalMeta().categories.length;
        if (shown < all) out.push(`${k} 柱状图的类目只写出 ${shown} / ${all} 个`);
      }
      // 图例不压住图区（刻度数在图区上边往上伸半行字）
      const legend = m.getComponent("legend");
      const grid = m.getComponent("grid");
      if (legend && grid && legend.get("show") !== false) {
        const view = ch.getViewOfComponentModel(legend);
        const r = view.group.getBoundingRect();
        const bottom = view.group.y + r.y + r.height;
        const top = grid.coordinateSystem.getRect().y;
        if (bottom > top - 6) out.push(`${k} 图例（到 ${Math.round(bottom)}px）压住图区（从 ${Math.round(top)}px）`);
      }
      // 参考线的字在图里
      for (const s of o.series ?? []) if (s.markLine && s.markLine.label?.position !== "insideEndTop") out.push(`${k} 参考线的字在图区外面，会被裁`);
    }
    return out;
  };
  const runs = [
    { id: "桌面", ctx: { viewport: { width: 1280, height: 900 } } },
    { id: "手机", ctx: { ...devices["iPhone 13"] } },
    { id: "减少动效", ctx: { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" } },
    { id: "高对比·暗", ctx: { viewport: { width: 1280, height: 900 }, forcedColors: "active", colorScheme: "dark" } },
  ];
  for (const run of runs) {
    for (const page of ["/components/chart/", "/en/components/chart/"]) {
      const ctx = await browser.newContext(run.ctx);
      const tab = await ctx.newPage();
      const errors = [];
      tab.on("pageerror", (e) => errors.push(e.message));
      await tab.goto(origin + page, { waitUntil: "networkidle" });
      await tab.evaluate(extreme);
      await tab.waitForTimeout(600);
      for (const x of await tab.evaluate(inspect)) fail("图表", `${run.id} ${page} ${x}`);
      for (const e of errors) fail("图表", `${run.id} ${page} 脚本出错：${e}`);
      await ctx.close();
    }
  }
  console.log(`图表：${runs.length} 种环境 × 中英，组件页的图 + 7 张极端图（饼、7 条线、十亿级柱、横向条形、参考线、坏值、时间轴）`);
}

/* ── 图解（DIAGRAM-PLAN）：线接得上、不穿字、窄了变竖排、不横向滚动、高对比看得见、读屏是列表 ── */
async function diagramAudit() {
  // 在组件页里另放几组极端的：9 步长标题、英文长词、长时间、还没发生的；每组放进 320 / 479 / 480 / 720 宽的格子
  const extreme = () => {
    const check = '<span class="xxd-steps__mark" aria-hidden="true"><svg viewBox="0 0 24 24"></svg></span>';
    const step = (t, i, cur) => {
      const state = i < cur ? "done" : i === cur ? "current" : "";
      const mark = state === "done" ? check : `<span class="xxd-steps__mark" aria-hidden="true">${i + 1}</span>`;
      return `<li class="xxd-steps__item"${state ? ` data-state="${state}"` : ""}${state === "current" ? ' aria-current="step"' : ""}>${mark}<span class="xxd-steps__text"><span class="xxd-steps__title">${t}${state === "done" ? '<span class="xxd-sr-only">（已完成）</span>' : ""}</span><span class="xxd-steps__desc">说明写怎么做，可能有两行那么长的一句话</span></span></li>`;
    };
    const titles = ["装好插件", "Internationalization", "打开侧边栏并且选好一个默认的模板", "选一个模板", "发第一条", "看数据", "复盘", "再写一条", "完成"];
    const S = {
      steps9: `<ol class="xxd-steps" aria-label="第 4 步，共 9 步">${titles.map((t, i) => step(t, i, 3)).join("")}</ol>`,
      steps3v: `<ol class="xxd-steps" data-vertical aria-label="第 3 步，共 3 步">${titles.slice(0, 3).map((t, i) => step(t, i, 2)).join("")}</ol>`,
      timeline: `<ol class="xxd-timeline">${[
        ["2026年10月23日 上午 09:12", "一个很长很长的标题，放不下就折行，不省略", ""],
        ["10月22日", "Internationalization", " data-highlight"],
        ["预计 11月", "还没发生", " data-upcoming"],
        ["预计 12月", "也还没发生", " data-upcoming"],
      ].map(([t, h, a]) => `<li class="xxd-timeline__item"${a}><span class="xxd-timeline__time">${t}</span><div class="xxd-timeline__body"><p class="xxd-timeline__title">${h}</p><p class="xxd-timeline__text">一两行说明，长的时候折行。</p></div></li>`).join("")}</ol>`,
    };
    const node = (b, t, d) => `<div class="xxd-${b}__node">${t}${d ? `<span class="xxd-${b}__desc">${d}</span>` : ""}</div>`;
    const fstep = (t, d) => `<li class="xxd-flowchart__step">${node("flowchart", t, d)}</li>`;
    S.flow3 = `<ol class="xxd-flowchart">${fstep("打开一个特别长名字的插件，看看会不会折行")}<li class="xxd-flowchart__step">${node("flowchart", "上传的图片多大？")}<ul class="xxd-flowchart__branches" data-merge>${[
      { l: "小于 5 MB", st: [["直接上传"]] },
      { l: "5 到 20 MB 之间的图片", st: [["先压缩", "长边 2000px"], ["Internationalization"]] },
      { l: "大于 20 MB", st: [["提示换一张"]] },
    ].map(({ l, st }) => `<li class="xxd-flowchart__branch"><span class="xxd-flowchart__label">${l}</span><ol class="xxd-flowchart__path">${st.map(([t, d]) => fstep(t, d)).join("")}</ol></li>`).join("")}</ul></li>${fstep("生成封面")}</ol>`;
    S.flowEnd = `<ol class="xxd-flowchart">${fstep("开始")}<li class="xxd-flowchart__step">${node("flowchart", "选哪个？")}<ul class="xxd-flowchart__branches"><li class="xxd-flowchart__branch" data-highlight><span class="xxd-flowchart__label">甲</span><ol class="xxd-flowchart__path">${fstep("走甲")}</ol></li><li class="xxd-flowchart__branch"><span class="xxd-flowchart__label">乙</span><ol class="xxd-flowchart__path">${fstep("走乙")}${fstep("再走一步")}</ol></li></ul></li></ol>`;
    const titem = (t, kids) => `<li class="xxd-tree__item"><span class="xxd-tree__node">${t}</span>${kids ? `<ul class="xxd-tree__group">${kids.join("")}</ul>` : ""}</li>`;
    S.tree2 = `<ul class="xxd-tree">${titem("一个很长很长的根节点名字", ["Internationalization", "二", "三个字", "第四个分类的名字比较长"].map((t) => titem(t)))}</ul>`;
    S.tree3 = `<ul class="xxd-tree">${titem("根", [titem("一", [titem("甲"), titem("乙很长很长很长很长很长很长很长很长很长的名字")]), titem("二"), titem("三", [titem("丙")])])}</ul>`;
    S.cycle6 = `<ol class="xxd-cycle">${["找参考", "写提示词", "Internationalization", "出图", "挑一张改一改再改", "发出去"].map((t, i, a) => `<li class="xxd-cycle__item">${node("cycle", t + (i === a.length - 1 ? '<span class="xxd-sr-only">（然后回到第 1 步）</span>' : ""))}</li>`).join("")}</ol>`;
    S.cycle3v = `<ol class="xxd-cycle" data-vertical>${["写", "发", "复盘"].map((t, i, a) => `<li class="xxd-cycle__item">${node("cycle", t + (i === a.length - 1 ? '<span class="xxd-sr-only">（然后回到第 1 步）</span>' : ""), i === 1 ? "说明可能有两行那么长的一句话，放不下就折行" : "")}</li>`).join("")}</ol>`;
    S.layers = `<ol class="xxd-layers">${["页面", "模式", "Internationalization", "令牌"].map((t, i) => `<li class="xxd-layers__item"${i === 2 ? " data-highlight" : ""}><span class="xxd-layers__title">${t}</span><span class="xxd-layers__desc">一句说明，长的时候折行，不省略也不伸出去</span></li>`).join("")}</ol>`;
    const box = document.createElement("div");
    box.id = "audit-diagrams";
    document.querySelector("main").append(box);
    for (const [k, html] of Object.entries(S))
      for (const w of [320, 479, 480, 720]) {
        const d = document.createElement("div");
        d.style.cssText = `width:${w}px;max-width:100%;margin:24px 0`;
        d.dataset.audit = `${k}@${w}`;
        d.innerHTML = html;
        box.append(d);
      }
  };
  const inspect = () => {
    const out = [];
    const px = (v) => parseFloat(v) || 0;
    const forced = matchMedia("(forced-colors: active)").matches;
    const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const Canvas = (() => { const p = document.createElement("span"); p.style.cssText = "color:Canvas;forced-color-adjust:none"; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; })();
    // 伪元素画的线 / 点：按它算好的位置换成页面上的矩形（相对于 li 的内边距盒）
    const pseudo = (li, which) => {
      const cs = getComputedStyle(li, which);
      if (cs.display === "none" || cs.content === "none" || cs.visibility === "hidden") return null;
      const r = li.getBoundingClientRect();
      const x = r.left + px(cs.left);
      const y = r.top + px(cs.top);
      const w = px(cs.width) + px(cs.borderLeftWidth) + px(cs.borderRightWidth);
      const h = px(cs.height) + px(cs.borderTopWidth) + px(cs.borderBottomWidth);
      const color = px(cs.borderLeftWidth) || px(cs.borderRightWidth) ? (px(cs.borderLeftWidth) ? cs.borderLeftColor : cs.borderRightColor) : cs.borderTopColor;
      return { left: x, top: y, right: x + w, bottom: y + h, w, h, color };
    };
    const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
    const gapX = (a, b) => Math.max(b.left - a.right, a.left - b.right);
    const name = (el) => el.closest("[data-audit]")?.dataset.audit ?? el.closest("[id]")?.id ?? el.className;
    for (const d of document.querySelectorAll("main .xxd-steps, main .xxd-timeline")) {
      if (!d.getClientRects().length) continue;
      const k = name(d);
      const steps = d.classList.contains("xxd-steps");
      const items = [...d.children];
      if (d.tagName !== "OL" || items.some((li) => li.tagName !== "LI")) out.push(`${k} 不是 <ol><li>（读屏要念成有序列表）`);
      const box = d.getBoundingClientRect();
      if (d.scrollWidth > d.clientWidth + 1) out.push(`${k} 横向溢出（${d.scrollWidth} > ${d.clientWidth}）`);
      for (const el of d.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width && (r.left < box.left - 1 || r.right > box.right + 1)) { out.push(`${k} 有东西伸出图外：${el.className || el.tagName}`); break; }
      }
      const texts = [...d.querySelectorAll(".xxd-steps__title, .xxd-steps__desc, .xxd-timeline__time, .xxd-timeline__title, .xxd-timeline__text")].flatMap((t) => [...t.getClientRects()]);
      const lines = [];
      if (steps) {
        const vertical = items.length > 1 && items[1].getBoundingClientRect().top >= items[0].getBoundingClientRect().bottom - 1;
        if (!d.hasAttribute("data-vertical") && box.width >= 480 && vertical) out.push(`${k} 宽 ${Math.round(box.width)}px 还是竖排`);
        if (box.width < 480 && !vertical) out.push(`${k} 宽 ${Math.round(box.width)}px 放不下横排，没有变竖排`);
        const current = items.filter((li) => li.dataset.state === "current");
        if (current.length > 1) out.push(`${k} 有 ${current.length} 个当前步`);
        for (const li of current) if (li.getAttribute("aria-current") !== "step") out.push(`${k} 当前这步没写 aria-current="step"`);
        for (const li of items.filter((x) => x.dataset.state === "done")) if (!li.querySelector(".xxd-sr-only")) out.push(`${k} 做完的步没有给读屏的「已完成」`);
        for (const m of d.querySelectorAll(".xxd-steps__mark")) if (m.getAttribute("aria-hidden") !== "true") out.push(`${k} 标记没有 aria-hidden`);
        items.forEach((li, i) => {
          const line = pseudo(li, "::after");
          const last = i === items.length - 1;
          if (last) return line && out.push(`${k} 最后一步后面还有线`);
          if (!line) return out.push(`${k} 第 ${i + 1} 步后面没有线`);
          lines.push(line);
          const a = li.querySelector(".xxd-steps__mark").getBoundingClientRect();
          const b = items[i + 1].querySelector(".xxd-steps__mark").getBoundingClientRect();
          if (vertical) {
            const cx = (line.left + line.right) / 2;
            if (Math.abs(cx - (a.left + a.right) / 2) > 1) out.push(`${k} 第 ${i + 1} 步的竖线没在标记正下方（差 ${(cx - (a.left + a.right) / 2).toFixed(1)}px）`);
            const g1 = line.top - a.bottom, g2 = b.top - line.bottom;
            if (g1 < 2 || g1 > 6 || g2 < 2 || g2 > 6) out.push(`${k} 第 ${i + 1} 步的竖线没接上标记（上 ${g1.toFixed(1)}px、下 ${g2.toFixed(1)}px）`);
          } else {
            const cy = (line.top + line.bottom) / 2;
            if (Math.abs(cy - (a.top + a.bottom) / 2) > 1) out.push(`${k} 第 ${i + 1} 步的线没在标记中间的高度`);
            const g1 = gapX(line, a), g2 = gapX(line, b);
            if (g1 < 6 || g1 > 10 || g2 < 6 || g2 > 10) out.push(`${k} 第 ${i + 1} 步的线没接上两头的标记（${g1.toFixed(1)}px、${g2.toFixed(1)}px）`);
          }
        });
      } else {
        const dots = items.map((li) => pseudo(li, "::before"));
        items.forEach((li, i) => {
          const dot = dots[i];
          if (!dot) return out.push(`${k} 第 ${i + 1} 条没有点`);
          const time = li.querySelector(".xxd-timeline__time").getBoundingClientRect();
          const lh = px(getComputedStyle(li.querySelector(".xxd-timeline__time")).lineHeight);
          if (Math.abs((dot.top + dot.bottom) / 2 - (time.top + lh / 2)) > 1.5) out.push(`${k} 第 ${i + 1} 条的点和第一行字没对齐`);
          const line = pseudo(li, "::after");
          if (i === items.length - 1) return line && out.push(`${k} 最后一条下面还有线`);
          if (!line) return out.push(`${k} 第 ${i + 1} 条下面没有线`);
          lines.push(line, dot);
          if (Math.abs((line.left + line.right) / 2 - (dot.left + dot.right) / 2) > 1) out.push(`${k} 第 ${i + 1} 条的线没在点的正下方`);
          const g1 = line.top - dot.bottom, g2 = dots[i + 1].top - line.bottom;
          if (g1 < 2 || g1 > 6 || g2 < 2 || g2 > 6) out.push(`${k} 第 ${i + 1} 条的线没接上点（上 ${g1.toFixed(1)}px、下 ${g2.toFixed(1)}px）`);
          const dashed = getComputedStyle(li, "::after").borderLeftStyle === "dashed" || getComputedStyle(li, "::after").borderRightStyle === "dashed";
          if (items[i + 1].hasAttribute("data-upcoming") !== dashed) out.push(`${k} 第 ${i + 1} 条下面的线${dashed ? "是虚线，下一条已经发生了" : "通到还没发生的一条，不是虚线"}`);
        });
      }
      for (const l of lines) {
        if (texts.some((t) => hit(l, t))) { out.push(`${k} 线或点压住了字`); break; }
        if (forced && ratio(l.color, Canvas) < 3) { out.push(`${k} 高对比模式下线和底色只有 ${ratio(l.color, Canvas).toFixed(2)}:1`); break; }
      }
    }
    return out;
  };
  // 流程图、树、循环、分层：线都是伪元素的边框。把每条边拆成线段，量两头有没有接上（节点的边、别的线、箭头），
  // 有没有穿过不相干的节点（diagram-design 的连线规则 5），有没有压住字；再看宽窄的排法对不对
  const inspect2 = () => {
    const out = [];
    const px = (v) => parseFloat(v) || 0;
    const forced = matchMedia("(forced-colors: active)").matches;
    const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const Canvas = (() => { const p = document.createElement("span"); p.style.cssText = "color:Canvas;forced-color-adjust:none"; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; })();
    const name = (el) => el.closest("[data-audit]")?.dataset.audit ?? el.closest("[id]")?.id ?? el.className;
    // 一个元素的 ::before / ::after（或元素自己）的边 → 线段；转过的方块是箭头
    const parts = (el, which) => {
      const cs = getComputedStyle(el, which);
      if (which && (cs.content === "none" || cs.content === "normal" || cs.display === "none" || cs.visibility === "hidden")) return null;
      let L, T, W, H;
      if (!which) {
        const r = el.getBoundingClientRect();
        [L, T, W, H] = [r.left, r.top, r.width, r.height];
      } else if (cs.position === "absolute") {
        const r = el.getBoundingClientRect();
        W = px(cs.width) + px(cs.borderLeftWidth) + px(cs.borderRightWidth) + px(cs.paddingLeft) + px(cs.paddingRight);
        H = px(cs.height) + px(cs.borderTopWidth) + px(cs.borderBottomWidth) + px(cs.paddingTop) + px(cs.paddingBottom);
        if (cs.boxSizing === "border-box") { W = px(cs.width); H = px(cs.height); }
        L = r.left + px(getComputedStyle(el).borderLeftWidth) + px(cs.left);
        T = r.top + px(getComputedStyle(el).borderTopWidth) + px(cs.top);
      } else {
        // 文档流里的伪元素（合拢时撑满的那根线）：在最后一个子元素下面
        const r = el.getBoundingClientRect();
        const last = el.lastElementChild?.getBoundingClientRect();
        W = px(cs.width) + px(cs.borderLeftWidth) + px(cs.borderRightWidth);
        H = px(cs.height) + px(cs.borderTopWidth) + px(cs.borderBottomWidth);
        L = r.left + px(getComputedStyle(el).paddingLeft) + px(cs.marginLeft);
        T = (last ? last.bottom : r.top) + px(cs.marginTop);
      }
      if (cs.transform !== "none") return { arrow: { x: L + W / 2, y: T + H / 2 }, color: cs.borderTopColor };
      const segs = [];
      const side = (k, x1, y1, x2, y2) => { if (px(cs[`border${k}Width`]) > 0 && cs[`border${k}Style`] !== "none") segs.push({ x1, y1, x2, y2, w: px(cs[`border${k}Width`]), color: cs[`border${k}Color`], el, which }); };
      // 量线的中线（1px 的线中线在边往里 0.5px）
      const bw = (k) => px(cs[`border${k}Width`]) / 2;
      side("Top", L, T + bw("Top"), L + W, T + bw("Top"));
      side("Bottom", L, T + H - bw("Bottom"), L + W, T + H - bw("Bottom"));
      side("Left", L + bw("Left"), T, L + bw("Left"), T + H);
      side("Right", L + W - bw("Right"), T, L + W - bw("Right"), T + H);
      return { segs };
    };
    const ptRect = (x, y, r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
    const ptSeg = (x, y, s) => { const dx = s.x2 - s.x1, dy = s.y2 - s.y1, l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / l)); return Math.hypot(x - s.x1 - t * dx, y - s.y1 - t * dy); };
    const roots = "main .xxd-flowchart, main .xxd-tree, main .xxd-cycle, main .xxd-layers";
    for (const d of document.querySelectorAll(roots)) {
      if (!d.getClientRects().length) continue;
      const k = name(d);
      const box = d.getBoundingClientRect();
      if (!/^(OL|UL)$/.test(d.tagName) || [...d.querySelectorAll("ol, ul")].some((l) => [...l.children].some((c) => c.tagName !== "LI")) || [...d.children].some((c) => c.tagName !== "LI")) out.push(`${k} 不是列表（读屏要念成列表）`);
      if (d.scrollWidth > d.clientWidth + 1) out.push(`${k} 横向溢出（${d.scrollWidth} > ${d.clientWidth}）`);
      for (const el of d.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width && !el.matches(".xxd-sr-only") && (r.left < box.left - 1 || r.right > box.right + 1)) { out.push(`${k} 有东西伸出图外：${el.className || el.tagName}`); break; }
      }
      const nodes = [...d.querySelectorAll(".xxd-flowchart__node, .xxd-tree__node, .xxd-cycle__node")].map((n) => n.getBoundingClientRect());
      const texts = [...d.querySelectorAll(".xxd-flowchart__label, .xxd-flowchart__node, .xxd-tree__node, .xxd-cycle__node")].flatMap((t) => { const rg = document.createRange(); rg.selectNodeContents(t); return [...rg.getClientRects()]; });
      // 没有框的字（分支名、大纲里的一项）：线指着它，留一点空
      const words = [...d.querySelectorAll(".xxd-flowchart__label, .xxd-tree__node")].filter((n) => !px(getComputedStyle(n).borderTopWidth)).map((n) => n.getBoundingClientRect());
      const segs = [], arrows = [];
      const els = d.classList.contains("xxd-layers") ? [] : [d, ...d.querySelectorAll("*")];
      for (const el of els) for (const which of ["::before", "::after"]) {
        const p = parts(el, which);
        if (!p) continue;
        if (p.arrow) arrows.push(p.arrow);
        else segs.push(...p.segs);
      }
      for (const lab of d.querySelectorAll(".xxd-flowchart__label")) segs.push(...parts(lab, null).segs);
      const lines = segs.filter((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1) > 1);
      let bad = 0;
      for (const s of lines) {
        for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) {
          // 接上：碰到节点的边、别的线、箭头；指向一段字（分支名、大纲里的一项）时留 4px 空也算
          const ok = nodes.some((r) => ptRect(x, y, r) <= 2) || lines.some((o) => o !== s && ptSeg(x, y, o) <= 2) || arrows.some((a) => Math.hypot(a.x - x, a.y - y) <= 8) || words.some((r) => ptRect(x, y, r) <= 6);
          if (!ok && bad++ < 2) out.push(`${k} 有一根线的一头没接上（${s.el.className.split(" ")[0]}${s.which}，在 ${Math.round(x - box.left)},${Math.round(y - box.top)}）`);
        }
        // 穿过不相干的节点：线段的中点在某个节点里面（缩进 3px）
        const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
        if (nodes.some((r) => mx > r.left + 3 && mx < r.right - 3 && my > r.top + 3 && my < r.bottom - 3) && bad++ < 2) out.push(`${k} 有一根线穿过节点`);
        if (texts.some((t) => Math.min(Math.max(s.x1, s.x2) + s.w / 2, t.right) - Math.max(Math.min(s.x1, s.x2) - s.w / 2, t.left) > 0.5 && Math.min(Math.max(s.y1, s.y2) + s.w / 2, t.bottom) - Math.max(Math.min(s.y1, s.y2) - s.w / 2, t.top) > 0.5) && bad++ < 2) out.push(`${k} 有一根线压住了字`);
        if (forced && ratio(s.color, Canvas) < 3 && bad++ < 2) out.push(`${k} 高对比模式下线和底色只有 ${ratio(s.color, Canvas).toFixed(2)}:1`);
      }
      // 箭头的尖指着一个节点（离节点 ≤ 8px）
      for (const a of arrows) if (!nodes.some((r) => ptRect(a.x, a.y, r) <= 8) && bad++ < 2) out.push(`${k} 有一个箭头没指着节点`);
      const w = box.width;
      if (d.matches(".xxd-flowchart")) {
        for (const ul of d.querySelectorAll(".xxd-flowchart__branches")) {
          const b = [...ul.children].map((c) => c.getBoundingClientRect());
          const across = b.length > 1 && Math.abs(b[0].top - b[1].top) < 1;
          if (w >= 480 && !across) out.push(`${k} 宽 ${Math.round(w)}px 分支还是上下排`);
          if (w < 480 && across) out.push(`${k} 宽 ${Math.round(w)}px 放不下并排的分支，没有上下排`);
          if (ul.children.length > 3) out.push(`${k} 一个判断有 ${ul.children.length} 条分支（最多 3 条）`);
          if (!ul.hasAttribute("data-merge") && ul.closest(".xxd-flowchart__step").nextElementSibling) out.push(`${k} 分支没合拢，后面还接着步骤（接不上）`);
        }
      }
      if (d.matches(".xxd-tree")) {
        const deep = !!d.querySelector(".xxd-tree__group .xxd-tree__group");
        const want = d.hasAttribute("data-outline") || deep || w < 480 ? "大纲" : "组织图";
        const g = d.querySelector(".xxd-tree__group");
        const b = g ? [...g.children].map((c) => c.getBoundingClientRect()) : [];
        const got = b.length > 1 && Math.abs(b[0].top - b[1].top) < 1 ? "组织图" : "大纲";
        if (b.length > 1 && got !== want) out.push(`${k} 宽 ${Math.round(w)}px${deep ? "、三层" : ""}应该是${want}，画成了${got}`);
      }
      if (d.matches(".xxd-cycle")) {
        const items = [...d.children];
        if (items.length < 3 || items.length > 6) out.push(`${k} 有 ${items.length} 步（循环要 3–6 步）`);
        if (!items.at(-1)?.querySelector(".xxd-sr-only")) out.push(`${k} 最后一步没有给读屏的「然后回到第 1 步」`);
        const row = items.length > 1 && Math.abs(items[0].getBoundingClientRect().top - items[1].getBoundingClientRect().top) < 1;
        if (!d.hasAttribute("data-vertical") && w >= 480 && !row) out.push(`${k} 宽 ${Math.round(w)}px 还是一步一行`);
        if ((d.hasAttribute("data-vertical") || w < 480) && row) out.push(`${k} 宽 ${Math.round(w)}px 放不下一排，没有一步一行`);
      }
      if (d.matches(".xxd-layers")) {
        for (const li of d.querySelectorAll("[data-highlight]")) if (getComputedStyle(li).outlineStyle === "none") out.push(`${k} 重点那一层没有记号（只靠底色）`);
        const it = d.querySelector(".xxd-layers__item");
        const [t, ds] = [it.querySelector(".xxd-layers__title"), it.querySelector(".xxd-layers__desc")].map((e) => e?.getBoundingClientRect());
        if (t && ds && w < 360 && ds.top < t.bottom - 1) out.push(`${k} 宽 ${Math.round(w)}px 名字和说明没有上下排`);
      }
    }
    return out;
  };
  const runs = [
    { id: "桌面", ctx: { viewport: { width: 1280, height: 900 } } },
    { id: "手机", ctx: { ...devices["iPhone 13"] } },
    { id: "从右往左", ctx: { viewport: { width: 1280, height: 900 } }, rtl: true },
    { id: "暗", ctx: { viewport: { width: 1280, height: 900 }, colorScheme: "dark" }, theme: "dark" },
    { id: "高对比·暗", ctx: { viewport: { width: 1280, height: 900 }, forcedColors: "active", colorScheme: "dark" } },
    { id: "打印", ctx: { viewport: { width: 1280, height: 900 } }, print: true },
  ];
  let count = 0;
  for (const run of runs) {
    for (const page of ["steps", "timeline", "flowchart", "tree", "cycle", "layers"].flatMap((c) => [`/components/${c}/`, `/en/components/${c}/`])) {
      const ctx = await browser.newContext(run.ctx);
      const tab = await ctx.newPage();
      const errors = [];
      tab.on("pageerror", (e) => errors.push(e.message));
      await tab.goto(origin + page, { waitUntil: "networkidle" });
      await tab.evaluate(extreme);
      if (run.rtl) await tab.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
      if (run.theme) await tab.evaluate((t) => document.documentElement.setAttribute("data-theme", t), run.theme);
      if (run.print) {
        await tab.emulateMedia({ media: "print" });
        // 打印：做完的标记、重点的点是底色画的，要印出来
        const bad = await tab.evaluate(() => [...document.querySelectorAll("main .xxd-steps, main .xxd-timeline, main .xxd-flowchart, main .xxd-tree, main .xxd-cycle, main .xxd-layers")].filter((d) => d.getClientRects().length && getComputedStyle(d).printColorAdjust !== "exact").length);
        if (bad) fail("图解", `${run.id} ${page} ${bad} 个图打印时不印底色（做完的标记会变空）`);
      }
      await tab.waitForTimeout(200);
      count += await tab.evaluate(() => document.querySelectorAll("main .xxd-steps, main .xxd-timeline, main .xxd-flowchart, main .xxd-tree, main .xxd-cycle, main .xxd-layers").length);
      for (const x of await tab.evaluate(inspect)) fail("图解", `${run.id} ${page} ${x}`);
      for (const x of await tab.evaluate(inspect2)) fail("图解", `${run.id} ${page} ${x}`);
      for (const e of errors) fail("图解", `${run.id} ${page} 脚本出错：${e}`);
      await ctx.close();
    }
  }
  console.log(`图解：${runs.length} 种环境 × 6 种图 × 中英，共量了 ${count} 张图（组件页的示例、React 演示 + 极端的：9 步长标题、长时间、三条分支长名字、不合拢的分支、四个子节点、三层、6 步循环、长说明 × 320 / 479 / 480 / 720 宽）`);
}

const sections = { axe: axeAudit, long: longAudit, shadow: hostileAudit, forced: forcedAudit, en: englishAudit, polish: polishAudit, overlay: overlayAudit, smoke: smokeAudit, sr: srSection, parity: paritySection, spec: specSection, inset: insetAudit, contrast: contrastAudit, focus: focusAudit, motion: motionAudit, states: statesAudit, trunc: truncAudit, form: formAudit, dark: darkAudit, touch: touchAudit, chart: chartAudit, diagram: diagramAudit };
for (const [name, run] of Object.entries(sections)) if (!only || only === name) await run();
await browser.close();
server.close();

// AUDIT_OUT=<文件>：把全部问题写进文件（终端只显示前 80 处）
if (process.env.AUDIT_OUT) (await import("node:fs")).writeFileSync(process.env.AUDIT_OUT, failures.join("\n") + "\n");
if (failures.length) {
  console.log(`\n✗ ${failures.length} 处问题：`);
  for (const f of failures.slice(0, 80)) console.log("  " + f);
  if (failures.length > 80) console.log(`  …还有 ${failures.length - 80} 处`);
  process.exit(1);
}
console.log("\n✓ 对抗门禁全部通过");
