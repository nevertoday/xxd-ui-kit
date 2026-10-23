#!/usr/bin/env node
// 发包前的验收：把 tokens / icons / css / react 打成 .tgz，装进仓库外的一个空 Vite 项目，构建，在真浏览器里看一遍。
//   node scripts/pack-check.mjs          需要网络（npm 装 react、vite）和 Chrome（CHROME_EXE，缺省用 Playwright 自带的）
// 检查：能装上、能构建、页面没有报错；原生和 React 按钮一样高（标准 40 / 紧凑 32）；图标能按名字和按需导入两种方式渲染。
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const work = mkdtempSync(join(tmpdir(), "xxd-pack-check-"));
const packs = join(work, "packs");
const app = join(work, "app");
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });
const fail = (msg) => {
  console.error(`✗ ${msg}\n  （留着现场：${work}）`);
  process.exit(1);
};

// 1. 打包（pnpm pack 会先跑每个包的 prepack 构建，并把 workspace:* 换成真的版本号）
const { pack } = await import(join(repo, "packages/xxd-extension/scripts/cli.mjs"));
const files = pack(packs);
console.log(`✓ 打包：${files.join("、")}`);
for (const f of readdirSync(packs)) {
  const manifest = JSON.parse(run("tar", ["-xOzf", join(packs, f), "package/package.json"], packs));
  const deps = { ...manifest.dependencies, ...manifest.peerDependencies };
  const bad = Object.entries(deps).filter(([n, v]) => n.startsWith("@cloudflare/") || String(v).startsWith("workspace:"));
  if (bad.length) fail(`${f} 的依赖里还有 ${bad.map(([n, v]) => `${n}@${v}`).join("、")}`);
}

// 2. 空 Vite 项目
mkdirSync(join(app, "src"), { recursive: true });
writeFileSync(join(app, "package.json"), JSON.stringify({ name: "xxd-pack-check", private: true, type: "module" }, null, 2));
writeFileSync(join(app, "vite.config.js"), 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n');
writeFileSync(
  join(app, "index.html"),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>check</title><link rel="icon" href="data:,"></head>
<body class="xxd-page"><div id="native"><button class="xxd-btn" data-variant="primary">原生按钮</button><i data-xxd-icon="Check"></i></div><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>\n`,
);
writeFileSync(
  join(app, "src/main.jsx"),
  `import "@xxd/css/dist/xxd.css";
import "@xxd/react/standalone.css";
import { install, useIcons } from "@xxd/css";
import * as icons from "@xxd/icons";
import { Check } from "@xxd/icons/each";
import { Icon } from "@xxd/icons/react";
import { createRoot } from "react-dom/client";
import { AppearanceSettings, Button, XxdAppearanceProvider } from "@xxd/react";

useIcons(icons);
install(document);
document.getElementById("native").insertAdjacentHTML("beforeend", icons.iconSVG(Check));
createRoot(document.getElementById("root")).render(
  <XxdAppearanceProvider>
    <Button variant="primary">React 按钮</Button>
    <Icon icon={Check} />
    <AppearanceSettings />
  </XxdAppearanceProvider>,
);
`,
);
const tgz = readdirSync(packs).map((f) => join(packs, f));
run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...tgz, "react@19", "react-dom@19", "vite@7", "@vitejs/plugin-react@5"], app);
console.log("✓ 装进了空 Vite 项目");
const out = run("npx", ["vite", "build"], app);
const js = out.match(/assets\/index-[\w-]+\.js\s+([\d.,]+ kB)/)?.[1];
console.log(`✓ vite build（JS ${js ?? "?"}）`);

// 3. 浏览器里看一遍
const dist = join(app, "dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer((req, res) => {
  const file = join(dist, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  if (!existsSync(file)) return res.writeHead(404).end();
  res.setHeader("content-type", types[extname(file)] ?? "application/octet-stream");
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { chromium } = createRequire(join(repo, "packages/xxd-site/package.json"))("playwright");
const browser = await chromium.launch(process.env.CHROME_EXE ? { executablePath: process.env.CHROME_EXE } : {});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "networkidle" });
const heights = () =>
  page.evaluate(() => {
    const h = (el) => (el ? Math.round(el.getBoundingClientRect().height) : 0);
    const react = [...document.querySelectorAll("#root button")].find((b) => b.textContent.includes("React"));
    return { native: h(document.querySelector("#native .xxd-btn")), react: h(react), icons: document.querySelectorAll("svg.ui-icon").length, left: document.querySelectorAll("i[data-xxd-icon]").length };
  });
const comfy = await heights();
await page.evaluate(() => document.documentElement.setAttribute("data-density", "compact"));
const compact = await heights();
await browser.close();
server.close();

if (errors.length) fail(`页面报错：${errors.join(" / ")}`);
if (comfy.native !== 40 || comfy.react !== 40) fail(`标准密度下按钮应该都是 40px：原生 ${comfy.native}、React ${comfy.react}`);
if (compact.native !== 32 || compact.react !== 32) fail(`紧凑密度下按钮应该都是 32px：原生 ${compact.native}、React ${compact.react}`);
if (comfy.icons < 3 || comfy.left) fail(`图标没渲染全：${comfy.icons} 个 svg，还剩 ${comfy.left} 个 <i data-xxd-icon>`);
console.log(`✓ 浏览器：没有报错；按钮 原生 / React 都是 ${comfy.native}px（紧凑 ${compact.native}px）；图标 ${comfy.icons} 个`);
rmSync(work, { recursive: true, force: true });
