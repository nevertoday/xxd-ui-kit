// 构建 @xxd/css：
//   dist/components.css   只有组件（需要另外引入 tokens.css）
//   dist/xxd.css          令牌 + 组件（一个文件搞定）
//   dist/xxd.shadow.css   Shadow DOM 版本（:root → :host；宿主页面的继承样式和同名变量进不来）
//   dist/xxd.shadow.css.js  同一份压缩后放进 globalThis.XxdShadowCSS（内容脚本用，不需要 web_accessible_resources）
//   dist/xxd.js           经典脚本 window.Xxd（自动 install）
//   dist/xxd.esm.js       ESM 打包版
//   dist/boot.js          @xxd/tokens 首帧脚本（方便一起拷进插件）
//   dist/icons.js         @xxd/icons 经典脚本 window.XxdIcons
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const tokensDir = join(root, "../xxd-tokens");
const iconsDir = join(root, "../xxd-icons");

// 令牌和图标由根目录的 pnpm xxd:build 按依赖顺序先构建（这里不替别的包构建）。
// 没构建过就停下；源码比产物新就提醒（会用到旧的令牌 / 图标）。
for (const [dir, out, name] of [[tokensDir, "dist/tokens.json", "@xxd/tokens"], [iconsDir, "dist/icons.iife.js", "@xxd/icons"]]) {
  if (!existsSync(join(dir, out))) {
    console.error(`✗ ${name} 还没构建：pnpm xxd:build（或 pnpm --filter ${name} build）`);
    process.exit(1);
  }
  if (isStale(dir, out)) console.warn(`！${name} 的源码比构建产物新，这次用的是旧的；先 pnpm --filter ${name} build`);
}

/** 源码（src、scripts、包根目录的 .css / .js）里有比 out 新的文件。 */
function isStale(dir, out) {
  const target = join(dir, out);
  if (!existsSync(target)) return true;
  const built = statSync(target).mtimeMs;
  const newer = (p) => {
    const st = statSync(p);
    if (st.isDirectory()) return readdirSync(p).some((n) => n !== "node_modules" && n !== "dist" && newer(join(p, n)));
    return /\.(css|js|mjs|json)$/.test(p) && st.mtimeMs > built;
  };
  return readdirSync(dir).some((n) => !/^(node_modules|dist|test)$/.test(n) && newer(join(dir, n)));
}

// 和 @xxd/tokens 用同一个转换（:root → :host、令牌在 Shadow 内部再声明、继承属性重置）
const { toShadow } = await import("../../xxd-tokens/scripts/build.mjs");
const banner = "/* @xxd/css — 小小东原生组件。Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */";

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const cssResult = await build({
  entryPoints: [join(root, "src/index.css")],
  bundle: true,
  write: false,
  minify: false,
  target: ["chrome114", "safari17", "firefox125"],
  legalComments: "none",
});
const components = cssResult.outputFiles[0].text;
// 用构建好的 tokens.css（多一段「没有 JS 时跟随系统暗色」的兜底）
const tokens = readFileSync(join(tokensDir, "dist/tokens.css"), "utf8");
writeFileSync(join(dist, "components.css"), `${banner}\n${components}`);
writeFileSync(join(dist, "xxd.css"), `${banner}\n${tokens}\n${components}`);
const shadow = toShadow(`${tokens}\n${components}`);
writeFileSync(join(dist, "xxd.shadow.css"), `${banner}\n${shadow}`);
// 内容脚本用：Shadow 样式压缩后放进一个 JS 字符串（globalThis.XxdShadowCSS）。
// 跟着内容脚本一起注入，mountXxdUI 同步挂上：不用 fetch，不用 web_accessible_resources（网站也就没法借它认出插件）。
const shadowMin = (await build({ stdin: { contents: shadow, loader: "css" }, write: false, minify: true, target: ["chrome114"] })).outputFiles[0].text.trim();
writeFileSync(join(dist, "xxd.shadow.min.css"), `${banner}\n${shadowMin}\n`);
writeFileSync(join(dist, "xxd.shadow.css.js"), `${banner.replace("*/", "— Shadow DOM 样式 */")}\nglobalThis.XxdShadowCSS = ${JSON.stringify(shadowMin)};\n`);

const minCss = await build({ stdin: { contents: `${tokens}\n${components}`, loader: "css" }, write: false, minify: true, target: ["chrome114"] });
writeFileSync(join(dist, "xxd.min.css"), `${banner}\n${minCss.outputFiles[0].text}`);

const js = { bundle: true, target: "es2020", legalComments: "none", banner: { js: banner } };
await build({ ...js, entryPoints: [join(root, "src/js/global.js")], format: "iife", minify: true, outfile: join(dist, "xxd.js") });
await build({ ...js, entryPoints: [join(root, "src/js/index.js")], format: "esm", outfile: join(dist, "xxd.esm.js") });
// 量表的几何和图型的换算（GAUGE-PLAN D40、CHART-TYPES-PLAN D46）：单独一个经典脚本，用到图的页面才加载
await build({ ...js, entryPoints: [join(root, "src/js/viz-global.js")], format: "iife", minify: true, outfile: join(dist, "viz.js") });

copyFileSync(join(tokensDir, "dist/boot.js"), join(dist, "boot.js"));
copyFileSync(join(iconsDir, "dist/icons.iife.js"), join(dist, "icons.js"));

const size = (f) => {
  const buf = readFileSync(join(dist, f));
  return `${f} ${(buf.length / 1024).toFixed(1)}KB / gzip ${(gzipSync(buf).length / 1024).toFixed(1)}KB`;
};
console.log(["xxd.min.css", "xxd.js", "viz.js", "boot.js", "icons.js"].map(size).join("\n"));
