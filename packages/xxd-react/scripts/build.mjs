// @xxd/react 的构建：Kumo（packages/kumo，内部包名 @cloudflare/kumo）打进产物，用的人不用装 Kumo。
//   dist/index.js     esbuild 打包我们自己的代码；import "@cloudflare/kumo" 改成 ./kumo/index.js
//   dist/kumo/*.js    Kumo 的构建产物原样拷过来（按组件分文件，用的人能按需打包）
//   dist/*.d.ts       tsc 生成；里面的 "@cloudflare/kumo" 改指 dist/kumo/（Kumo 的类型声明拷过来）
//   dist/kumo.css …   Kumo 的样式拷过来，styles.css / standalone.css 用相对路径引用
// 产物里剩下的每个外部 import 都必须在 package.json 的 dependencies / peerDependencies 里，否则构建失败。
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { xxdReactProps } from "./props.mjs";

const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const kumoDist = join(here, "../kumo/dist");
const dist = join(here, "dist");
const pkg = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));

if (!existsSync(join(kumoDist, "index.js"))) {
  console.error("✗ 先构建 Kumo：pnpm --filter @cloudflare/kumo build");
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });

// 1. 我们自己的代码打成 dist/index.js；"@cloudflare/kumo" 先留成外部，再改指 ./kumo/index.js
const bare = { name: "external-bare", setup: (b) => b.onResolve({ filter: /^[^./]/ }, (args) => ({ path: args.path, external: true })) };
const result = await build({
  absWorkingDir: here,
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  outfile: "dist/index.js",
  banner: { js: '"use client";' },
  metafile: true,
  logLevel: "warning",
  plugins: [bare],
});
const indexJs = join(dist, "index.js");
writeFileSync(indexJs, readFileSync(indexJs, "utf8").replace(/(["'])@cloudflare\/kumo\1/g, '$1./kumo/index.js$1'));

// 2. Kumo 的 dist 按原来的文件结构拷到 dist/kumo/（从 index.js 能走到的）：每个组件还是单独的模块，
//    用的人的打包器能按需去掉没用到的组件（整个内联成一个文件的话，Base UI 的顶层代码去不掉）
const graph = await build({ absWorkingDir: here, entryPoints: [join(kumoDist, "index.js")], bundle: true, write: false, format: "esm", metafile: true, logLevel: "silent", plugins: [bare] });
const kumoFiles = Object.keys(graph.metafile.inputs).filter((f) => !f.startsWith("<"));
for (const f of kumoFiles) {
  const to = join(dist, "kumo", relative(kumoDist, join(here, f)));
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(here, f), to);
}

// 产物里剩下的外部依赖（我们的代码 + 拷过去的 Kumo）必须都声明了
const pkgName = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})]);
const used = new Set();
for (const out of Object.values(result.metafile.outputs)) for (const imp of out.imports) if (imp.external && pkgName(imp.path) !== "@cloudflare/kumo") used.add(pkgName(imp.path));
for (const input of Object.values(graph.metafile.inputs)) for (const imp of input.imports) if (imp.external && !imp.path.startsWith("<")) used.add(pkgName(imp.path));
const missing = [...used].filter((n) => !declared.has(n));
if (missing.length) {
  console.error(`✗ 产物用到了没写进 dependencies / peerDependencies 的包：${missing.join("、")}`);
  process.exit(1);
}
writeFileSync(join(dist, "externals.json"), JSON.stringify([...used].sort(), null, 2) + "\n");

// 3. 类型：tsc 生成，再把 Kumo 的类型声明（从 index.d.ts 能走到的）拷到 dist/kumo/
execFileSync("pnpm", ["exec", "tsc", "-p", "tsconfig.build.json"], { cwd: here, stdio: "inherit" });
const kumoTypes = join(dist, "kumo");
const seen = new Set();
const walk = (file) => {
  if (seen.has(file)) return;
  seen.add(file);
  const text = readFileSync(join(kumoDist, file), "utf8");
  for (const [, spec] of text.matchAll(/(?:from|import\()\s*["'](\.[^"']+)["']/g)) {
    const target = join(dirname(file), spec.replace(/\.js$/, ".d.ts"));
    if (existsSync(join(kumoDist, target))) walk(target);
    else if (existsSync(join(kumoDist, target.replace(/\.d\.ts$/, "/index.d.ts")))) walk(target.replace(/\.d\.ts$/, "/index.d.ts"));
  }
};
walk("index.d.ts");
for (const file of seen) {
  mkdirSync(dirname(join(kumoTypes, file)), { recursive: true });
  copyFileSync(join(kumoDist, file), join(kumoTypes, file));
}
const rewrite = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      rewrite(p);
      continue;
    }
    if (!name.endsWith(".d.ts")) continue;
    const rel = relative(dirname(p), join(kumoTypes, "index.js"));
    const spec = rel.startsWith(".") ? rel : `./${rel}`;
    const insideKumo = p.startsWith(kumoTypes + "/");
    const text = readFileSync(p, "utf8");
    const next = (insideKumo ? text : text.replace(/(["'])@cloudflare\/kumo\1/g, `$1${spec}$1`))
      // Kumo 的 toast 图标类型还指着 Phosphor；小小东换成了 @xxd/icons/phosphor（同形的 Icon 类型）
      .replace(/import\((["'])@phosphor-icons\/react\/dist\/lib\/types\1\)\.Icon/g, 'import("@xxd/icons/phosphor").Icon');
    if (next !== text) writeFileSync(p, next);
  }
};
rewrite(dist);

// 类型里引用的外部包也必须声明了（不然用的人那里类型解析失败，悄悄变成 any）。
// next / react-router-dom 只出现在链接适配器的注释示例里，不算。
const typeRefs = new Set();
const scanTypes = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) scanTypes(p);
    else if (name.endsWith(".d.ts")) {
      const code = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const [, spec] of code.matchAll(/(?:from|import\()\s*["']([^"'.][^"']*)["']/g)) typeRefs.add(pkgName(spec));
    }
  }
};
scanTypes(dist);
const typeMissing = [...typeRefs].filter((n) => !declared.has(n) && n !== "@cloudflare/kumo");
if (typeMissing.length) {
  console.error(`✗ 类型声明引用了没写进 dependencies / peerDependencies 的包：${typeMissing.join("、")}`);
  process.exit(1);
}

// 小小东自己写的组件的属性清单（展示站「React 属性」表、xxd-ui doc --react 读它）
writeFileSync(join(dist, "props.json"), JSON.stringify(xxdReactProps(), null, 2) + "\n");

// 4. 样式：Kumo 的 CSS 拷过来（styles.css / standalone.css 用 ./dist/… 引用）
//    绑定层自己写的 :hover 也只给能悬停的指针（和 @xxd/css 同一个转换；Tailwind 的 hover: 本来就是这样，TOUCH-REVIEW-PLAN）
const { hoverOnly } = await import("../../xxd-css/scripts/hover-only.mjs");
for (const css of ["kumo.css", "kumo-binding.css", "kumo-standalone.css"]) {
  const src = readFileSync(join(kumoDist, "styles", css), "utf8");
  writeFileSync(join(dist, css), css === "kumo.css" ? src : hoverOnly(src)[0]);
}

console.log(`@xxd/react → dist/（Kumo ${kumoFiles.length} 个模块和 ${seen.size} 个类型文件拷进 dist/kumo；外部依赖 ${used.size} 个）`);
