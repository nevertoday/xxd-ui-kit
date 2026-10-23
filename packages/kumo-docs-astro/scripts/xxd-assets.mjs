// 把 @xxd 的构建产物拷进 public/xxd/（boot.js 首帧外观、原生组件页用的 CSS/JS/图标）。
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgs = join(here, "../..");
const out = join(here, "../public/xxd");
const css = join(pkgs, "xxd-css/dist");
if (!existsSync(join(css, "xxd.js"))) execFileSync("node", ["scripts/build.mjs"], { cwd: join(pkgs, "xxd-css"), stdio: "inherit" });
mkdirSync(out, { recursive: true });
for (const f of ["boot.js", "components.css", "xxd.js", "icons.js"]) copyFileSync(join(css, f), join(out, f));
console.log("xxd assets → public/xxd/");
