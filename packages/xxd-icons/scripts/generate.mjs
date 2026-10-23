// 从 src/nodes.js 生成 src/names.d.ts、src/each.js、src/each.d.ts（build.mjs 写文件，测试检查是不是最新的）。
import { ICON_ALIASES, ICON_NAMES, ICON_NODES } from "../src/svg.js";
/** names.d.ts（IconName 联合类型）、each.js / each.d.ts（每个图标一个具名导出，打包器只带用到的）。 */
// 这几个名字会遮住 JS 的全局值（import { Infinity } 之后 Infinity 就不是无穷大了）：按需导出时加 Icon 后缀
const RESERVED = new Set(["Infinity", "NaN", "undefined", "eval", "arguments"]);
export const exportName = (name) => (RESERVED.has(name) ? `${name}Icon` : name);

export function generated() {
  const head = "// 由 scripts/build.mjs 从 src/nodes.js 生成，请勿手改。\n";
  const all = [...ICON_NAMES, ...Object.keys(ICON_ALIASES)];
  const names = `${head}export type IconName =\n${all.map((n) => `  | ${JSON.stringify(n)}`).join("\n")};\n`;
  const each = `${head}// import { Check } from "@xxd/icons/each"; iconSVG(Check) 或 <Icon icon={Check} />\n${ICON_NAMES.map((n) => `export const ${exportName(n)} = /* @__PURE__ */ Object.freeze(${JSON.stringify(ICON_NODES[n])});`).join("\n")}\n`;
  const eachTypes = `${head}import type { IconNode } from "./nodes.js";\n${ICON_NAMES.map((n) => `export declare const ${exportName(n)}: readonly IconNode[];`).join("\n")}\n`;
  return { "names.d.ts": names, "each.js": each, "each.d.ts": eachTypes };
}
