#!/usr/bin/env node
// 截图回归门禁（优化计划 O6）：
//   pnpm --filter @xxd/site build && pnpm --filter @xxd/site visual          对比基线
//   pnpm --filter @xxd/site visual:update                                   确认改动后更新基线
// 每个页面 × 4 种外观（亮 / 暗 × 直角 / 圆角）整页截图，和 visual/baseline/ 比较（pixelmatch），差异图写到 visual/diff/。
// 同时检查：控制台零错误、390px 手机宽度不横向滚动。基线只在本机（.gitignore），不进仓库。
// 需要 Chromium：CHROME_EXE=<chrome-headless-shell 路径>（缺省用 Playwright 自带的）。
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const update = process.argv.includes("--update");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const baseDir = join(root, "visual/baseline");
const diffDir = join(root, "visual/diff");
const nowDir = join(root, "visual/current");
for (const d of [baseDir, diffDir, nowDir]) mkdirSync(d, { recursive: true });

if (!existsSync(join(dist, "index.html"))) {
  console.error("先构建：pnpm --filter @xxd/site build");
  process.exit(1);
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8" };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(dist, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end("not found");
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const pages = [];
(function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name === "index.html") pages.push("/" + relative(dist, d).split("\\").join("/"));
  }
})(dist);
const targets = pages
  .map((p) => (p === "/" ? "/" : p.replace(/\/?$/, "/")))
  .filter((p) => !p.startsWith("/md/") && (!only || p.includes(only)))
  .sort();

const MODES = [
  { id: "light-square", theme: "light", corners: "square" },
  { id: "dark-square", theme: "dark", corners: "square" },
  { id: "light-rounded", theme: "light", corners: "rounded" },
  { id: "dark-rounded", theme: "dark", corners: "rounded", accent: "#3b74b8" },
];

const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});
const results = [];
const fileName = (page, mode) => `${page === "/" ? "home" : page.replace(/^\/|\/$/g, "").replace(/\//g, "__")}--${mode}.png`;

async function shoot(page, mode) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), { theme: mode.theme, corners: mode.corners, accent: mode.accent ?? "", density: "comfortable", finish: "flat" });
  const tab = await ctx.newPage();
  const errors = [];
  tab.on("pageerror", (e) => errors.push(String(e)));
  tab.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await tab.goto(origin + page, { waitUntil: "networkidle" });
  await tab.addStyleTag({ content: "*{caret-color:transparent!important} .xxd-skeleton::after,.xxd-loadbar::after,.xxd-spinner{animation:none!important}" });
  await tab.waitForTimeout(150);
  const buf = await tab.screenshot({ fullPage: true });
  await ctx.close();
  return { buf, errors };
}

async function mobile(page) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const tab = await ctx.newPage();
  await tab.goto(origin + page, { waitUntil: "networkidle" });
  const overflow = await tab.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await ctx.close();
  return overflow;
}

const queue = targets.flatMap((page) => MODES.map((mode) => ({ page, mode })));
let index = 0;
async function worker() {
  while (index < queue.length) {
    const { page, mode } = queue[index++];
    const { buf, errors } = await shoot(page, mode);
    const name = fileName(page, mode.id);
    writeFileSync(join(nowDir, name), buf);
    const basePath = join(baseDir, name);
    let diffPixels = null;
    if (update || !existsSync(basePath)) {
      writeFileSync(basePath, buf);
    } else {
      const a = PNG.sync.read(readFileSync(basePath));
      const b = PNG.sync.read(buf);
      if (a.width !== b.width || a.height !== b.height) diffPixels = -1;
      else {
        const diff = new PNG({ width: a.width, height: a.height });
        diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
        if (diffPixels > 0) writeFileSync(join(diffDir, name), PNG.sync.write(diff));
      }
    }
    results.push({ page, mode: mode.id, errors, diffPixels });
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
// React 演示藏在「React」标签页里，平时不渲染：逐页点开所有 React 标签，确认没有运行时错误、确实渲染出东西。
const reactIssues = [];
for (const page of targets.filter((p) => p.startsWith("/components/"))) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const tab = await ctx.newPage();
  const errors = [];
  tab.on("pageerror", (e) => errors.push(String(e)));
  tab.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await tab.goto(origin + page, { waitUntil: "networkidle" });
  const tabs = await tab.$$('.site-demo__bar > .xxd-tabs > [role="tab"]:nth-child(2)');
  for (const t of tabs) {
    try {
      await t.scrollIntoViewIfNeeded({ timeout: 2000 });
      await t.click({ timeout: 3000 });
    } catch (error) {
      errors.push(`点不到 React 标签：${String(error).split("\n")[0]}`);
    }
    await tab.waitForTimeout(250);
  }
  if (tabs.length) {
    const empty = await tab.evaluate(() => [...document.querySelectorAll('.site-demo [id$="-react"]:not([hidden]) astro-island')].filter((el) => !el.querySelector("*")).length);
    if (empty) errors.push(`${empty} 个 React 演示没有渲染出内容`);
  }
  if (errors.length) reactIssues.push({ page, errors });
  await ctx.close();
}

const overflow = [];
for (const page of targets) {
  const px = await mobile(page);
  if (px > 0) overflow.push({ page, px });
}
await browser.close();
server.close();

const withErrors = results.filter((r) => r.errors.length);
// 差几个像素以内是抗锯齿的随机抖动（图标页几百个小图标，偶尔有一个像素不一样）：只报告，不算失败
const NOISE_PX = 4;
const changed = results.filter((r) => r.diffPixels === -1 || r.diffPixels > NOISE_PX);
const noisy = results.filter((r) => r.diffPixels > 0 && r.diffPixels <= NOISE_PX);
console.log(`页面 ${targets.length} 个 × ${MODES.length} 种外观 = ${results.length} 张截图${update ? "（已更新基线）" : ""}`);
console.log(`控制台错误：${withErrors.length ? withErrors.map((r) => `${r.page} ${r.mode}: ${r.errors[0]}`).join("\n  ") : "无"}`);
console.log(`手机宽度横向溢出：${overflow.length ? overflow.map((o) => `${o.page} +${o.px}px`).join("、") : "无"}`);
console.log(`React 演示：${reactIssues.length ? reactIssues.map((r) => `${r.page}: ${r.errors[0]}`).join("\n  ") : "全部正常渲染"}`);
if (!update && noisy.length) console.log(`抗锯齿抖动（≤ ${NOISE_PX}px，不算失败）：${noisy.map((r) => `${r.page} ${r.mode} ${r.diffPixels}px`).join("、")}`);
if (!update) console.log(`和基线不同：${changed.length ? changed.map((r) => `${r.page} ${r.mode} ${r.diffPixels === -1 ? "尺寸变了" : `${r.diffPixels}px`}`).join("\n  ") : "无"}`);
writeFileSync(join(root, "visual/report.json"), JSON.stringify({ when: new Date().toISOString(), pages: targets.length, results, overflow, reactIssues }, null, 2));
process.exit(withErrors.length || overflow.length || changed.length || reactIssues.length ? 1 : 0);
