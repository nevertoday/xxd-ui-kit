// 生成 src/kumo-exports.ts：把 Kumo 的导出逐个列出来（不再 export *）。
//   · Cloudflare 的品牌组件（Logo、Powered by Cloudflare）不转出去：MIT 只许可代码，不许可商标。
//   · 公开接口由这份清单决定：合并上游后新增或去掉的导出，会让 test/exports.test.ts 失败，需要重新生成并看一眼。
// 用法：node scripts/kumo-exports.mjs（--check 只检查，不写）
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const entry = join(here, "../../kumo/src/index.ts");
const out = join(here, "../src/kumo-exports.ts");

/** 不转出去的导出：上游的品牌资产。 */
export const BLOCKED = /cloudflare/i;

export function kumoExports() {
  const program = ts.createProgram([entry], { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, skipLibCheck: true, noEmit: true });
  const checker = program.getTypeChecker();
  const file = program.getSourceFile(entry);
  const symbols = checker.getExportsOfModule(checker.getSymbolAtLocation(file));
  const values = [];
  const types = [];
  for (const sym of symbols) {
    const name = sym.getName();
    if (BLOCKED.test(name)) continue;
    const target = sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;
    if (target.flags & ts.SymbolFlags.Value) values.push(name);
    else types.push(name);
  }
  return { values: values.sort(), types: types.sort() };
}

export function render({ values, types }) {
  const lines = [
    "// 由 scripts/kumo-exports.mjs 生成，请勿手改。Kumo 的公开导出，去掉了 Cloudflare 的品牌组件。",
    "export {",
    ...values.map((n) => `  ${n},`),
    '} from "@cloudflare/kumo";',
    "export type {",
    ...types.map((n) => `  ${n},`),
    '} from "@cloudflare/kumo";',
    "",
  ];
  return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = render(kumoExports());
  if (process.argv.includes("--check")) {
    let now = "";
    try {
      now = readFileSync(out, "utf8");
    } catch {}
    if (now !== next) {
      console.error("src/kumo-exports.ts 过期了：运行 node scripts/kumo-exports.mjs 重新生成，看一眼新增的导出");
      process.exit(1);
    }
  } else {
    writeFileSync(out, next);
    console.log("src/kumo-exports.ts");
  }
}
