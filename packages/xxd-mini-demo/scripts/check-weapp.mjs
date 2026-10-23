// 微信小程序产物（dist/）的检查：本机没有微信开发者工具也能跑（§11）。
//   - 所有 .wxss：没有 WXSS 不允许的写法；Skyline 不支持的声明都有后备（和 @xxd/mini 构建报告同一个门禁，压缩以后再查一遍）
//   - 主包不超过 1 MB（2 MB 是微信的硬上限）
//   - app.json 开了 darkmode、theme.json 在；project.config.json 写了最低基础库 3.0.0
//   - 模板里带上了读屏属性（@xxd/mini/taro-plugin 生效了）
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { audit } from "../../xxd-mini/scripts/build-mini.mjs";

const dist = fileURLToPath(new URL("../dist", import.meta.url));
const problems = [];
if (!existsSync(join(dist, "app.json"))) {
  console.error("✗ 还没构建微信版：pnpm --filter @xxd/mini-demo build:weapp");
  process.exit(1);
}
let size = 0;
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else {
      size += st.size;
      if (f.endsWith(".wxss")) {
        const r = audit(readFileSync(p, "utf8"));
        for (const x of r.webview) problems.push(`${p.slice(dist.length + 1)}：${x}`);
        for (const x of r.skyline) problems.push(`${p.slice(dist.length + 1)}（Skyline）：${x}`);
      }
    }
  }
};
walk(dist);
if (size > 1024 * 1024) problems.push(`主包 ${(size / 1024).toFixed(0)} KB，超过 1 MB`);
const app = JSON.parse(readFileSync(join(dist, "app.json"), "utf8"));
if (!app.darkmode || app.themeLocation !== "theme.json") problems.push("app.json 没开 darkmode / themeLocation");
if (!existsSync(join(dist, "theme.json"))) problems.push("dist/theme.json 没拷进来");
const project = JSON.parse(readFileSync(join(dist, "project.config.json"), "utf8"));
if (project.libVersion !== "3.0.0") problems.push(`project.config.json 的 libVersion 是 ${project.libVersion}`);
const base = readFileSync(join(dist, "base.wxml"), "utf8");
for (const attr of ["aria-role", "aria-label", "aria-checked"]) if (!base.includes(`${attr}=`)) problems.push(`base.wxml 里没有 ${attr}（@xxd/mini/taro-plugin 没生效？）`);
if (/\brpx\b/.test(walkText(dist))) problems.push("产物里有 rpx：px 被换算了");
function walkText(dir) {
  let out = "";
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out += walkText(p);
    else if (f.endsWith(".wxss")) out += readFileSync(p, "utf8");
  }
  return out;
}
if (problems.length) {
  console.error(`✗ 微信版产物 ${problems.length} 处问题：`);
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`✓ 微信版产物：${(size / 1024).toFixed(0)} KB，WXSS 门禁 0（WebView、Skyline），暗色、最低基础库、读屏属性都在`);
