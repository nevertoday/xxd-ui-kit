// README 的配图：从构建好的展示站里截真组件，亮、暗各一张（README 用 <picture> 跟着 GitHub 的主题换）；
// 中文首页给 README.md，英文首页（/en/）给 README.en.md，英文的文件名带 .en。
//   pnpm --filter @xxd/site build && node packages/xxd-site/scripts/readme-shots.mjs
// 输出到仓库根的 docs/assets/readme/（PNG 先截，有 cwebp 就转成 WebP 并删掉 PNG）。
// 需要 Chromium：CHROME_EXE=<chrome-headless-shell 路径>（缺省用 Playwright 自带的）。
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "../dist");
const out = join(here, "../../../docs/assets/readme");
if (!existsSync(join(dist, "index.html"))) {
  console.error("先构建：pnpm --filter @xxd/site build");
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

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

// 首页「全部组件」墙上挑的格子：每种用途挑一两个，排成 README 里 3 列的表
const CELLS = ["button", "field", "settings-group", "table", "dialog", "command-palette", "chart", "gauge", "heatmap", "steps", "flowchart", "timeline"];
// 同一个插件侧边栏的四种外观（和截图回归的四种一样）
const LOOKS = [
  { id: "light-square", theme: "light", corners: "square", accent: "" },
  { id: "dark-square", theme: "dark", corners: "square", accent: "" },
  { id: "light-rounded", theme: "light", corners: "rounded", accent: "#3b74b8" },
  { id: "dark-rounded", theme: "dark", corners: "rounded", accent: "#b07a2a" },
];

const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});

/** @param {{ theme: string, corners: string, accent: string }} look @param {string} base */
async function open(look, base) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await ctx.addInitScript((s) => localStorage.setItem("xxd-site", JSON.stringify(s)), { theme: look.theme, corners: look.corners, accent: look.accent, density: "comfortable", finish: "flat" });
  const tab = await ctx.newPage();
  await tab.goto(origin + base, { waitUntil: "networkidle" });
  // 截图不要光标、骨架的流光，也不要格子左上角的组件名（README 的表格自己写名字）
  await tab.addStyleTag({ content: "*{caret-color:transparent!important} .xxd-skeleton::after,.xxd-loadbar::after,.xxd-spinner{animation:none!important} .site-showcase__item figcaption{display:none}" });
  await tab.waitForTimeout(200);
  return { ctx, tab };
}

/** @param {string} name */
const png = (name) => join(out, name + ".png");
const shots = [];

const LANGS = [
  { base: "/", suffix: "" },
  { base: "/en/", suffix: ".en" },
];

for (const { base, suffix } of LANGS) for (const theme of ["light", "dark"]) {
  const { ctx, tab } = await open({ theme, corners: "square", accent: "" }, base);
  // 头图：首页「拼成一个产品」的第一排（插件侧边栏 + 资源列表页）
  await tab.locator('.site-showcase__row[data-row="0"]').screenshot({ path: png("hero-" + theme + suffix) });
  shots.push("hero-" + theme + suffix);
  for (const slug of CELLS) {
    const cell = tab.locator(".site-wall__cell", { has: tab.locator('a.site-wall__name[href="' + base + 'components/' + slug + '"]') });
    await cell.locator(".site-wall__stage").screenshot({ path: png(slug + "-" + theme + suffix) });
    shots.push(slug + "-" + theme + suffix);
  }
  await ctx.close();
}

for (const { base, suffix } of LANGS) for (const look of LOOKS) {
  const { ctx, tab } = await open(look, base);
  await tab.locator('.site-showcase__item[data-slug="extension-sidepanel"] .site-showcase__frame').screenshot({ path: png("look-" + look.id + suffix) });
  await ctx.close();
}
await browser.close();
server.close();

// 格子大小不一：去掉格子的边线、裁到内容，放大到差不多大（最多 1.6 倍，免得糊），再放进同一个 3:2 的底上居中
// （底色取格子左上角那一点，亮暗各自对）
const has = (bin) => {
  try {
    execFileSync("which", [bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
if (has("magick")) {
  for (const { suffix } of LANGS) for (const theme of ["light", "dark"]) {
    for (const slug of CELLS) {
      const f = png(slug + "-" + theme + suffix);
      const bg = execFileSync("magick", [f, "-format", "%[pixel:p{8,8}]", "info:"], { encoding: "utf8" });
      execFileSync("magick", [f, "-shave", "4x4", "-fuzz", "3%", "-trim", "+repage", f]);
      const [w, h] = execFileSync("magick", [f, "-format", "%w %h", "info:"], { encoding: "utf8" }).split(" ").map(Number);
      const scale = Math.min(1040 / w, 660 / h, 1.6);
      const size = String(Math.round(w * scale)) + "x" + String(Math.round(h * scale)) + "!";
      execFileSync("magick", [f, "-resize", size, "-background", bg, "-gravity", "center", "-extent", "1200x800", f]);
    }
  }
  // 四种外观并排成一张，中间留透明的缝
  for (const { suffix } of LANGS) {
    const looks = LOOKS.map((l) => png("look-" + l.id + suffix));
    execFileSync("magick", ["-background", "none", ...looks.flatMap((f, i) => (i ? ["(", "-size", "48x1", "xc:none", ")", f] : [f])), "+append", png("looks" + suffix)]);
    for (const f of looks) rmSync(f);
    shots.push("looks" + suffix);
  }
}
if (has("cwebp")) {
  for (const name of shots) {
    execFileSync("cwebp", ["-quiet", "-q", "86", png(name), "-o", join(out, name + ".webp")]);
    rmSync(png(name));
  }
}
console.log("✓ " + shots.length + " 张 → docs/assets/readme/");
