// 构建 @xxd/mini 的 JS：src/*.ts(x) → dist/*.js（每个文件单独转，import 原样留着，交给用户项目里的 Taro 打包），再出类型。
// 样式在 styles/（scripts/build-mini.mjs），组件里 import "../styles/xxx.mini.css"，dist 和 src 同一层，路径不变。
import { build, transform } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");
const banner = "/* @xxd/mini — 小小东 UI 小程序版。Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */";

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
const files = readdirSync(src).filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".d.ts"));
// 这些文件把依赖打进来（量表的几何、图型的换算来自 @xxd/css/viz：用户项目不用装 @xxd/css，GAUGE-PLAN D40）
const BUNDLED = new Set(["viz-core.ts"]);
for (const f of files) {
  if (BUNDLED.has(f)) {
    await build({ entryPoints: [join(src, f)], outfile: join(dist, f.replace(/\.tsx?$/, ".js")), bundle: true, format: "esm", target: "es2018", banner: { js: banner }, legalComments: "none" });
    continue;
  }
  const code = readFileSync(join(src, f), "utf8");
  const out = await transform(code, { loader: f.endsWith(".tsx") ? "tsx" : "ts", format: "esm", jsx: "automatic", target: "es2018", banner, sourcefile: f });
  // 相对导入补上 .js（ESM 要写全文件名）
  const js = out.code.replace(/from "(\.\/[\w-]+)"/g, 'from "$1.js"').replace(/import "(\.\/[\w-]+)"/g, 'import "$1.js"');
  writeFileSync(join(dist, f.replace(/\.tsx?$/, ".js")), js);
}
// 类型
const tsc = createRequire(join(root, "package.json")).resolve("typescript/bin/tsc");
execFileSync(process.execPath, [tsc, "-p", join(root, "tsconfig.json")], { stdio: "inherit" });
// viz-core.d.ts 里的 export * from "@xxd/css/viz" 换成那份类型本身（用户项目里没有 @xxd/css）
const require = createRequire(join(root, "package.json"));
const cssJs = join(dirname(require.resolve("@xxd/css/package.json")), "src/js");
// viz.d.ts 里的 export * from "./gauge" 指向量表几何的类型：dist 里 gauge.d.ts 是量表组件，几何的那份改名 viz-gauge.d.ts
writeFileSync(join(dist, "viz-core.d.ts"), readFileSync(join(cssJs, "viz.d.ts"), "utf8").replace('from "./gauge"', 'from "./viz-gauge"'));
writeFileSync(join(dist, "viz-gauge.d.ts"), readFileSync(join(cssJs, "gauge.d.ts"), "utf8"));
console.log(`@xxd/mini JS：${files.length} 个文件 → dist/`);
