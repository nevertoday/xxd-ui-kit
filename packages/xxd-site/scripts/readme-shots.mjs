// README 的配图：从构建好的展示站里截真页面，再按 SCENES 排进同样大小的画框（排版用 HTML 和令牌，不是修图）。
// 亮、暗各一张（README 用 <picture> 跟着 GitHub 的主题换）；中文给 README.md，英文（/en/、小程序 ?lang=en）给 README.en.md，文件名带 .en。
//   pnpm --filter @xxd/site build && node packages/xxd-site/scripts/readme-shots.mjs
// 输出到仓库根的 docs/assets/readme/（有 cwebp 就转成 WebP）。需要 Chromium：CHROME_EXE=<chrome-headless-shell 路径>（缺省用 Playwright 自带的）。
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "../dist");
const out = join(here, "../../../docs/assets/readme");
const raw = join(out, ".parts");
if (!existsSync(join(dist, "index.html"))) {
  console.error("先构建：pnpm --filter @xxd/site build");
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  let file = join(dist, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end("not found");
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", () => r(undefined)));
const addr = server.address();
const origin = "http://127.0.0.1:" + (addr && typeof addr === "object" ? String(addr.port) : "0");

/**
 * 一块真页面怎么截。tpl：模板页的整页；pattern：模式页的演示；wall：首页组件墙上的一格；mini：小程序 H5 的一页（手机宽）。
 * crop：只留上面这么高（CSS px），长页面截一屏；frame：截出来没有边框的，排版时加一圈线。
 * @typedef {{ tpl?: string, pattern?: string, wall?: string, mini?: string, crop?: number, frame?: boolean }} Part
 */
/** @type {Record<string, Part>} */
const PARTS = {
  sidepanel: { tpl: "extension-sidepanel" },
  signIn: { tpl: "extension-sign-in" },
  list: { tpl: "resource-list", crop: 470 },
  detail: { tpl: "detail-panel" },
  settings: { tpl: "settings", crop: 720 },
  article: { tpl: "article", crop: 640 },
  membership: { pattern: "membership", frame: true },
  chart: { wall: "chart", frame: true },
  gauge: { wall: "gauge", frame: true },
  bars: { wall: "bars", frame: true },
  heatmap: { wall: "heatmap", frame: true },
  radar: { wall: "radar", frame: true },
  proportion: { wall: "proportion", frame: true },
  flowchart: { wall: "flowchart", frame: true },
  timeline: { wall: "timeline", frame: true },
  tree: { wall: "tree", frame: true },
  cycle: { wall: "cycle", frame: true },
  miniTodo: { mini: "todo", frame: true },
  miniSettings: { mini: "settings", frame: true },
  miniHome: { mini: "index", frame: true },
};

/**
 * 一张图：画框大小（CSS px，按 2 倍出图）和几排 Part。整块等比缩到画框里、居中。
 * @typedef {{ id: string, w: number, h: number, rows: string[][], pad?: number, gap?: number }} Scene
 */
/** @type {Scene[]} */
const SCENES = [
  { id: "hero", w: 1600, h: 760, pad: 56, gap: 40, rows: [["detail", "sidepanel", "miniTodo"]] },
  { id: "use-extension", w: 800, h: 500, pad: 24, rows: [["sidepanel", "signIn"]] },
  { id: "use-admin", w: 800, h: 500, pad: 24, rows: [["list"]] },
  { id: "use-content", w: 800, h: 500, pad: 24, rows: [["detail"]] },
  { id: "use-settings", w: 800, h: 500, pad: 24, rows: [["settings"]] },
  { id: "use-pay", w: 800, h: 500, pad: 24, rows: [["membership"]] },
  { id: "use-data", w: 800, h: 500, pad: 24, rows: [["chart", "gauge"], ["bars", "heatmap"]] },
  { id: "use-diagram", w: 800, h: 500, pad: 24, rows: [["flowchart", "timeline", "tree", "cycle"]] },
  { id: "use-mini", w: 800, h: 500, pad: 24, rows: [["miniTodo", "miniSettings", "miniHome"]] },
];

// 同一个插件侧边栏的四种外观（和截图回归的四种一样）
const LOOKS = [
  { id: "light-square", theme: "light", corners: "square", accent: "" },
  { id: "dark-square", theme: "dark", corners: "square", accent: "" },
  { id: "light-rounded", theme: "light", corners: "rounded", accent: "#3b74b8" },
  { id: "dark-rounded", theme: "dark", corners: "rounded", accent: "#b07a2a" },
];

const LANGS = [
  { lang: "zh", base: "/", suffix: "" },
  { lang: "en", base: "/en/", suffix: ".en" },
];

const TODOS = {
  zh: [["回复设计评审的意见", "work", false], ["给插件换一个主色", "work", false], ["买咖啡豆", "life", false], ["周五前交周报", "work", false], ["整理桌面截图", "none", true]],
  en: [["Reply to the design review", "work", false], ["Try a new accent color", "work", false], ["Buy coffee beans", "life", false], ["Send the weekly report", "work", false], ["Clean up screenshots", "none", true]],
};

const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});
const NO_MOTION = "*{caret-color:transparent!important} .xxd-skeleton::after,.xxd-loadbar::after,.xxd-spinner{animation:none!important}";

/** @param {{ theme: string, corners: string, accent: string }} look */
async function siteContext(look) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), { theme: look.theme, corners: look.corners, accent: look.accent, density: "comfortable", finish: "flat" });
  return ctx;
}

/** @param {string} theme @param {"zh" | "en"} lang */
async function miniContext(theme, lang) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 720 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme === "dark" ? "dark" : "light", reducedMotion: "reduce" });
  const now = Date.UTC(2026, 10, 12, 9);
  const list = TODOS[lang].map(([text, tag, done], i) => ({ id: "t" + i, text, tag, done, createdAt: now - i * 3_600_000 }));
  // Taro H5 的存储外面包一层 { data }
  await ctx.addInitScript((v) => localStorage.setItem("xxd-mini-demo-todos", JSON.stringify({ data: v })), JSON.stringify(list));
  return ctx;
}

/** @param {import("playwright").Page} tab @param {string} url */
async function go(tab, url) {
  await tab.goto(origin + url, { waitUntil: "networkidle" });
  await tab.addStyleTag({ content: NO_MOTION + " .site-showcase__item figcaption{display:none}" });
  await tab.waitForTimeout(300);
}

// 演示区和墙上格子四周的留白大小不一：都裁到内容（magick），排版时再统一留边
/** 截一块，存成 .parts/<名>-<主题><语言>.png @param {string} name @param {Part} part @param {import("playwright").Page} tab @param {string} base @param {string} file */
async function shoot(name, part, tab, base, file) {
  if (part.tpl) {
    await go(tab, base + "templates/" + part.tpl);
    await tab.locator(".site-template").screenshot({ path: file });
  } else if (part.pattern) {
    await go(tab, base + "patterns/" + part.pattern);
    await tab.locator(".site-demo__stage").first().screenshot({ path: file });
    execFileSync("magick", [file, "-shave", "4x4", "-fuzz", "3%", "-trim", "+repage", file]);
  } else if (part.wall) {
    if (!tab.url().endsWith(base) || tab.url() === "about:blank") await go(tab, base);
    const cell = tab.locator(".site-wall__cell", { has: tab.locator('a.site-wall__name[href="' + base + "components/" + part.wall + '"]') });
    await cell.locator(".site-wall__stage").screenshot({ path: file });
    execFileSync("magick", [file, "-shave", "4x4", "-fuzz", "3%", "-trim", "+repage", file]);
  } else throw new Error("不认识的 Part：" + name);
}

/** @type {Map<string, string>} 键：名-主题-语言 → 截图文件 */
const files = new Map();
for (const { lang, base, suffix } of LANGS) for (const theme of ["light", "dark"]) {
  const ctx = await siteContext({ theme, corners: "square", accent: "" });
  const tab = await ctx.newPage();
  const mctx = await miniContext(theme, /** @type {"zh" | "en"} */ (lang));
  const mtab = await mctx.newPage();
  for (const [name, part] of Object.entries(PARTS)) {
    const file = join(raw, name + "-" + theme + suffix + ".png");
    if (part.mini) {
      await mtab.goto(origin + "/mini/" + (lang === "en" ? "?lang=en" : "") + "#/pages/" + part.mini + "/index", { waitUntil: "networkidle" });
      await mtab.addStyleTag({ content: NO_MOTION });
      await mtab.waitForTimeout(600);
      await mtab.screenshot({ path: file });
    } else await shoot(name, part, tab, base, file);
    files.set(name + "-" + theme + "-" + lang, file);
  }
  await ctx.close();
  await mctx.close();
}
for (const { lang, base, suffix } of LANGS) for (const look of LOOKS) {
  const ctx = await siteContext(look);
  const tab = await ctx.newPage();
  const file = join(raw, "look-" + look.id + suffix + ".png");
  await shoot("look", PARTS.sidepanel, tab, base, file);
  files.set("look-" + look.id + "-" + lang, file);
  await ctx.close();
}

/** @param {string} file */
const dataUrl = (file) => "data:image/png;base64," + readFileSync(file).toString("base64");

/**
 * 把几排截图排进一个画框：底色 --gray-3，每块原大（2 倍图按一半宽放），整块用 zoom 缩到画框里。
 * @param {{ w: number, h: number, pad?: number, gap?: number, theme: string, rows: { file: string, crop?: number, frame?: boolean, pad?: boolean }[][], bare?: boolean }} o
 * @param {string} path
 */
async function compose(o, path) {
  const pad = o.pad ?? 40;
  const gap = o.gap ?? 24;
  const rows = o.rows.map((row) => `<div class="r">${row.map((p) => `<div class="p${p.frame ? " f" : ""}${p.pad ? " w" : ""}"${p.crop ? ` style="max-height:${p.crop}px"` : ""}><img src="${dataUrl(p.file)}"></div>`).join("")}</div>`).join("");
  const html = `<!doctype html><html data-theme="${o.theme}"><head><link rel="stylesheet" href="${origin}/xxd/xxd.css"><style>
    html,body{margin:0;background:${o.bare ? "transparent" : "var(--gray-3)"}}
    .c{width:${o.w}px;height:${o.h}px;display:grid;place-items:center;overflow:hidden}
    .z{display:flex;flex-direction:column;gap:${gap}px;align-items:center}
    .r{display:flex;gap:${gap}px;align-items:flex-start}
    .p{overflow:hidden;background:var(--bg)}
    .p.f{border:1px solid var(--line)}
    .p.f.w{padding:24px}
    .p img{display:block}
  </style></head><body><div class="c"><div class="z">${rows}</div></div></body></html>`;
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: 2 });
  const tab = await ctx.newPage();
  await tab.setContent(html, { waitUntil: "load" });
  await tab.evaluate(({ w, h, pad }) => {
    for (const img of document.images) img.style.width = img.naturalWidth / 2 + "px";
    const z = /** @type {HTMLElement} */ (document.querySelector(".z"));
    const r = z.getBoundingClientRect();
    z.style.zoom = String(Math.min((w - 2 * pad) / r.width, (h - 2 * pad) / r.height, 1));
  }, { w: o.w, h: o.h, pad });
  await tab.screenshot({ path, omitBackground: !!o.bare });
  await ctx.close();
}

const shots = [];
for (const { lang, suffix } of LANGS) {
  for (const scene of SCENES) for (const theme of ["light", "dark"]) {
    const rows = scene.rows.map((row) => row.map((name) => ({ file: /** @type {string} */ (files.get(name + "-" + theme + "-" + lang)), crop: PARTS[name].crop, frame: PARTS[name].frame, pad: !!(PARTS[name].wall || PARTS[name].pattern) })));
    const name = scene.id + "-" + theme + suffix;
    await compose({ ...scene, theme, rows }, join(out, name + ".png"));
    shots.push(name);
  }
  // 四种外观并排：透明底，亮暗主题下都能看
  const looks = LOOKS.map((l) => ({ file: /** @type {string} */ (files.get("look-" + l.id + "-" + lang)) }));
  await compose({ w: 1600, h: 720, pad: 0, gap: 40, theme: "light", rows: [looks], bare: true }, join(out, "looks" + suffix + ".png"));
  shots.push("looks" + suffix);
}
await browser.close();
server.close();
rmSync(raw, { recursive: true, force: true });

let webp = false;
try {
  execFileSync("which", ["cwebp"], { stdio: "ignore" });
  webp = true;
} catch {
  /* 没有 cwebp 就留 PNG */
}
if (webp) {
  for (const name of shots) {
    execFileSync("cwebp", ["-quiet", "-q", "88", join(out, name + ".png"), "-o", join(out, name + ".webp")]);
    rmSync(join(out, name + ".png"));
  }
}
console.log("✓ " + shots.length + " 张 → docs/assets/readme/");
