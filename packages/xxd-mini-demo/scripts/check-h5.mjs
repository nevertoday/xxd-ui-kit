// 演示小程序 H5 版的检查（docs/maintainers/MINIPROGRAM-PLAN.md §11、M3 的验收）：
//   1. 每个组件页 × 两种外观（中文·亮·直角·墨色 / 英文·暗·圆角·主色），axe（WCAG 2.1 AA + best-practice）零违规；
//   2. 不横向溢出（手机 390 和 320 宽）、控制台没有报错；
//   3. 浮层（底部面板、一列操作、对话框、滚轮）打开后再扫一遍，并且整个落在屏幕里；
//   4. 待办页走一遍：新建、勾选、筛选、左滑删除、撤销，刷新以后还在；外观页切暗色，所有页面跟着变、刷新以后还在。
// 用法：pnpm --filter @xxd/mini-demo build:h5 && pnpm --filter @xxd/mini-demo check
// 需要 Chromium：CHROME_EXE=<Chrome 路径>（缺省用 Playwright 自带的）。
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("..", import.meta.url));
const dist = join(here, "dist-h5");
if (!existsSync(join(dist, "index.html"))) {
  console.error("✗ 还没构建 H5：pnpm --filter @xxd/mini-demo build:h5");
  process.exit(1);
}
const require = createRequire(join(here, "../xxd-site/package.json"));
const { chromium } = require("playwright");
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const manifest = JSON.parse(readFileSync(join(here, "../xxd-mini/mini.json"), "utf8"));

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/mini/, "") || "/";
  if (p.endsWith("/")) p += "index.html";
  try {
    const body = await readFile(join(dist, p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(0);
const base = `http://localhost:${server.address().port}/mini/`;

const problems = [];
const fail = (section, msg) => problems.push(`[${section}] ${msg}`);
const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});

const MODES = [
  { id: "zh-light", scheme: "light", query: "" },
  { id: "en-dark", scheme: "dark", query: "&lang=en&embed=1&theme=dark&corners=rounded&accent=2a8a7a" },
];

async function open(mode, hash, width = 390) {
  const ctx = await browser.newContext({ viewport: { width, height: 760 }, colorScheme: mode.scheme, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${base}#${hash}${mode.query && (hash.includes("?") ? mode.query : `?${mode.query.slice(1)}`)}`);
  await page.waitForTimeout(700);
  return { ctx, page, errors };
}

async function axe(page, label) {
  if (!(await page.evaluate(() => Boolean(window.axe)))) await page.addScriptTag({ content: AXE });
  const result = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
    return r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
  });
  for (const v of result) fail("axe", `${label} ${v}`);
}

async function overflow(page, label) {
  const out = await page.evaluate(() => {
    const w = window.innerWidth;
    const bad = [];
    if (document.scrollingElement.scrollWidth > w + 1) bad.push(`整页 ${document.scrollingElement.scrollWidth}px`);
    for (const el of document.querySelectorAll(".xxd-page *, .xxd-overlay *")) {
      const r = el.getBoundingClientRect();
      if (!r.width || getComputedStyle(el).visibility === "hidden") continue;
      // 横向滚动区里的（标签页）、左滑操作藏在右边的按钮不算
      if (el.closest(".xxd-tabs-scroll, .xxd-swipe__actions, .xxd-swipe__content, taro-picker-view-column-core")) continue;
      // 图片铺满（aspectFill）时里面的 <img> 比外框大，外框裁掉了
      if (el.parentElement?.closest("taro-image-core")) continue;
      if (r.right > w + 1 || r.left < -1) bad.push(`${el.className || el.tagName} [${Math.round(r.left)}, ${Math.round(r.right)}]`);
    }
    return bad.slice(0, 3);
  });
  for (const o of out) fail("溢出", `${label} ${o}`);
}

/* ── 1–2. 每个组件页 ── */
let scans = 0;
for (const mode of MODES) {
  for (const c of manifest.components) {
    for (const width of [390, 320]) {
      const { ctx, page, errors } = await open(mode, `/pages/component/index?name=${c.name}`, width);
      const label = `${mode.id} ${width} ${c.name}`;
      if (width === 390) {
        await axe(page, label);
        scans += 1;
      }
      await overflow(page, label);
      for (const e of errors) fail("报错", `${label} ${e}`);
      await ctx.close();
    }
  }
}
console.log(`组件页：${manifest.components.length} 个组件 × ${MODES.length} 种外观 × 2 种宽度，axe ${scans} 次`);

/* ── 3. 浮层 ── */
const OVERLAYS = [
  ["Sheet", ["封面", "Cover"], ".xxd-sheet"],
  ["Sheet", ["更多操作", "More"], ".xxd-sheet"],
  ["Dialog", ["删除这篇", "Delete post"], ".xxd-dialog"],
  ["Picker", ["提醒时间", "Reminder"], ".xxd-sheet"],
  ["Toast", ["保存", "Save"], ".xxd-toast"],
];
for (const mode of MODES) {
  for (const [name, [zh, en], sel] of /** @type {[string, [string, string], string][]} */ (OVERLAYS)) {
    const { ctx, page, errors } = await open(mode, `/pages/component/index?name=${name}`);
    const label = `${mode.id} ${name}「${mode.id.startsWith("en") ? en : zh}」`;
    await page.getByText(mode.id.startsWith("en") ? en : zh, { exact: true }).first().click();
    await page.waitForTimeout(450);
    const box = await page.locator(sel).first().boundingBox();
    if (!box) fail("浮层", `${label} 没打开`);
    else if (box.x < -1 || box.y < -1 || box.x + box.width > 391 || box.y + box.height > 761) fail("浮层", `${label} 伸出屏幕 [${box.x}, ${box.y}, ${box.width}, ${box.height}]`);
    await axe(page, label);
    for (const e of errors) fail("报错", `${label} ${e}`);
    await ctx.close();
  }
}
console.log(`浮层：${OVERLAYS.length} 个 × ${MODES.length} 种外观`);

/* ── 3b. 返回键先关浮层（MINI-REVIEW-PLAN S2）：打开面板，按浏览器的返回，面板关掉、还在这一页；再按一次才离开 ── */
{
  const { ctx, page, errors } = await open(MODES[0], "/pages/component/index?name=Sheet");
  await page.goto(`${base}#/pages/index/index`);
  await page.waitForTimeout(500);
  await page.goto(`${base}#/pages/component/index?name=Sheet`);
  await page.waitForTimeout(700);
  await page.getByText("封面", { exact: true }).first().click();
  await page.waitForTimeout(450);
  if (!(await page.locator(".xxd-sheet.is-open").count())) fail("返回键", "面板没打开");
  await page.goBack();
  await page.waitForTimeout(500);
  if (await page.locator(".xxd-sheet.is-open").count()) fail("返回键", "按返回以后面板还开着");
  if (!page.url().includes("name=Sheet")) fail("返回键", `按返回直接离开了这一页：${page.url()}`);
  // 点按钮关掉面板，不该多留一条历史：再按一次返回就回到首页
  await page.getByText("封面", { exact: true }).first().click();
  await page.waitForTimeout(450);
  await page.locator(".xxd-sheet.is-open .xxd-btn[aria-label]").first().click();
  await page.waitForTimeout(500);
  await page.goBack();
  await page.waitForTimeout(700);
  if (page.url().includes("name=Sheet")) fail("返回键", "点按钮关掉面板以后，要按两次返回才离开");
  for (const e of errors) fail("报错", `返回键：${e}`);
  await ctx.close();
  console.log("返回键：面板打开时按返回先关面板；点按钮关的不多留历史");
}

/* ── 4. 待办和外观：真的操作一遍 ── */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}#/pages/todo/index`);
  await page.waitForTimeout(700);
  const add = async (text) => {
    await page.getByText("新建", { exact: true }).last().click();
    await page.waitForTimeout(350);
    await page.locator(".xxd-sheet input").fill(text);
    await page.getByText("添加", { exact: true }).click();
    await page.waitForTimeout(350);
  };
  await add("交周报");
  await add("买咖啡豆");
  const count = () => page.locator(".todo-row").count();
  if ((await count()) !== 2) fail("待办", `新建两件后列表里有 ${await count()} 件`);
  await page.locator(".todo-row .xxd-choice").first().click();
  await page.waitForTimeout(200);
  if ((await count()) !== 1) fail("待办", "勾掉一件以后「未完成」里应该剩 1 件");
  await page.getByText("已完成 1", { exact: true }).click();
  await page.waitForTimeout(200);
  if ((await count()) !== 1) fail("待办", "「已完成」里应该有 1 件");
  // 左滑删除
  await page.getByText("全部", { exact: true }).click();
  await page.waitForTimeout(200);
  const row = page.locator(".xxd-swipe__content").first();
  const b = await row.boundingBox();
  await row.dispatchEvent("touchstart", { touches: [{ clientX: b.x + 300, clientY: b.y + 20, identifier: 1 }] });
  for (let x = 280; x >= 160; x -= 30) await row.dispatchEvent("touchmove", { touches: [{ clientX: b.x + x, clientY: b.y + 20, identifier: 1 }] });
  await row.dispatchEvent("touchend", { changedTouches: [{ clientX: b.x + 160, clientY: b.y + 20, identifier: 1 }] });
  await page.waitForTimeout(300);
  await page.locator(".xxd-swipe__action").first().click();
  await page.waitForTimeout(300);
  if ((await count()) !== 1) fail("待办", `左滑删除后应该剩 1 件，现在 ${await count()} 件`);
  await page.getByText("撤销", { exact: true }).click();
  await page.waitForTimeout(300);
  if ((await count()) !== 2) fail("待办", "撤销以后应该回到 2 件");
  await page.reload();
  await page.waitForTimeout(700);
  await page.getByText("全部", { exact: true }).click();
  await page.waitForTimeout(200);
  if ((await count()) !== 2) fail("待办", "刷新以后数据没了");
  // 外观：切暗色，回到首页也是暗的，刷新以后还是暗的
  await page.goto(`${base}#/pages/settings/index`);
  await page.waitForTimeout(600);
  await page.getByText("暗", { exact: true }).first().click();
  await page.waitForTimeout(300);
  const dark = async () => page.evaluate(() => getComputedStyle(document.querySelector(".xxd-page")).backgroundColor);
  if ((await dark()) !== "rgb(23, 22, 18)") fail("外观", `切暗色以后页面底色是 ${await dark()}`);
  await page.goto(`${base}#/pages/index/index`);
  await page.reload();
  await page.waitForTimeout(700);
  if ((await dark()) !== "rgb(23, 22, 18)") fail("外观", "刷新以后暗色没留住");
  for (const e of errors) fail("报错", `待办 / 外观：${e}`);
  await ctx.close();
  console.log("待办和外观：新建、勾选、筛选、左滑删除、撤销、刷新；切暗色、换页、刷新");
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`\n✗ ${problems.length} 处问题：`);
  for (const p of problems.slice(0, 80)) console.error(`  ${p}`);
  process.exit(1);
}
console.log("\n✓ H5 检查全过");
