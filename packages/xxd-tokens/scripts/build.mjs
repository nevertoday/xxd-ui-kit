// tokens.css（人写，唯一来源）→ dist/
//   tokens.css         原样复制
//   tokens.shadow.css  :root → :host，给 Shadow DOM 注入用
//   tokens.json        各模式下的变量值（文档站、对比度检查、Figma）
//   tokens.d.ts        类型化的变量名
//   boot.js            首帧前执行的经典脚本（window.XxdTheme）
//   theme.js           ESM（有构建的项目直接 import "@xxd/tokens"）
import { build } from "esbuild";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { firstCompound, rewriteSelectors, rootToHost, rootToWhere, styleRules } from "./selectors.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const source = readFileSync(join(root, "tokens.css"), "utf8");

// 写在 <html>（Shadow 里是 host）上的外观属性
const ROOT_ATTRS = /^data-(theme|corners|accent|density|finish|input)$/;
const isRootAttr = (c) => c.type === "attribute" && ROOT_ATTRS.test(c.name);
const isHost = (sel) => sel.length === 1 && sel[0].type === "pseudo-class" && sel[0].kind === "host";

/** 一个选择器在 Shadow 里要变成哪几个（lightningcss 的选择器 AST）。 */
function shadowSelectors(selector) {
  const out = [rootToHost(selector) ?? selector];
  // 令牌块：host 上的值可能被宿主页面的规则盖掉（页面里 `div { --ink: … }` 会打到 host 上，
  // 而且外面的规则永远赢过 :host），所以在 Shadow 内部的顶层元素上再声明一次——那里宿主页面够不着。
  if (isHost(out[0])) out.push([...out[0], { type: "combinator", value: "child" }, { type: "universal" }]);
  // `[data-finish=material] .xxd-btn`、光秃秃的 `[data-finish=material]`：属性写在 host 上时也生效
  const [head, rest] = firstCompound(selector);
  if (head.length === 1 && isRootAttr(head[0])) {
    const host = { type: "pseudo-class", kind: "host", selectors: head };
    out.push([host, ...rest]);
    // 光秃秃的属性块（[data-finish=material]）：上面那条「内部顶层元素再声明一次」会把 host 上的值盖掉，这里也要再声明一次
    if (!rest.length) out.push([host, { type: "combinator", value: "child" }, { type: "universal" }]);
  }
  return out;
}

/**
 * 继承属性的隔离：宿主页面的 text-transform / letter-spacing / text-align / line-height … 会穿过 Shadow 边界继承进来。
 * 在 Shadow 的顶层元素上重置；放在最先声明的 layer 里，所以任何组件样式都赢过它。
 */
export const SHADOW_RESET = `@layer xxd.reset {
  :host > * {
    color: var(--ink);
    font: var(--weight-regular) var(--text-sm) / 1.55 var(--font-body);
    letter-spacing: normal;
    word-spacing: normal;
    text-transform: none;
    text-align: start;
    text-indent: 0;
    text-shadow: none;
    white-space: normal;
    cursor: auto;
    visibility: visible;
    hyphens: manual;
    writing-mode: horizontal-tb;
    -webkit-text-fill-color: currentcolor;
    -webkit-font-smoothing: antialiased;
    font-synthesis: none;
  }
}
`;

/** :root → :host；:root[...] / :root:lang(...) → :host([...])；令牌在 Shadow 内部再声明一次；外观属性选择器加 :host() 版本；继承属性重置。 */
export function toShadow(css) {
  return `${SHADOW_RESET}${rewriteSelectors(css, shadowSelectors)}`;
}

/**
 * 每条规则里的自定义属性：{ 选择器原文: { --名字: 值 } }。规则的位置由 lightningcss 找；
 * @media 里的规则键名前面带上那条 @media（不和顶层的同名选择器混在一起）。
 */
export function parseBlocks(css, { errorRecovery = true } = {}) {
  const blocks = {};
  for (const { selector, body, media } of styleRules(css, { errorRecovery })) {
    const vars = {};
    for (const decl of body.replace(/\/\*[\s\S]*?\*\//g, "").split(";")) {
      const at = decl.indexOf(":");
      const name = decl.slice(0, at).trim();
      if (at > 0 && name.startsWith("--")) vars[name] = decl.slice(at + 1).trim().replace(/\s+/g, " ");
    }
    const key = media ? `${media} ${selector}` : selector;
    if (Object.keys(vars).length) blocks[key] = { ...(blocks[key] || {}), ...vars };
  }
  return blocks;
}

/**
 * 给已有一套变量的老项目（会员站）用：整份令牌放进 @layer xxd.tokens。
 * 没进 layer 的样式永远赢过 layer 里的，所以老项目自己的同名变量不受影响（不管选择器优先级），
 * 只多出它还没有的变量。（tokens.css 只有变量；全局规则在 base.css，老项目不引。）
 */
export function toLayered(css) {
  // :root → :where(:root)：layer 里本来就最弱，再去掉优先级；文字上也和老项目自己的 :root[...] 块区分开
  // （有些老测试按文本找第一个 `:root[data-theme="dark"] {`）。
  const scoped = rewriteSelectors(css, (sel) => (rootToWhere(sel) ? [rootToWhere(sel)] : null));
  return `/* @xxd/tokens（layered）— Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */\n@layer xxd.tokens {\n${scoped.trim()}\n}\n`;
}

const MODE_NAMES = {
  ":root": "base",
  ':root[data-theme="dark"]': "dark",
  ':root[data-corners="rounded"]': "rounded",
  ':root[data-density="compact"]': "compact",
  ":root[data-accent]": "accent",
  ':root[data-theme="dark"][data-accent]': "darkAccent",
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // 色阶区域要是最新的（改了 src/scales.js 要先跑 node scripts/scales.mjs）
  const { applyScales } = await import("./scales.mjs");
  if (applyScales(source) !== source) throw new Error("tokens.css 里的色阶不是最新的：先跑 node packages/xxd-tokens/scripts/scales.mjs");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  const blocks = parseBlocks(source);
  // 没有 JS 时（boot.js 没跑、SSR 首屏）也跟随系统暗色：从暗色块生成一段 prefers-color-scheme 的兜底，只放进 dist。
  const darkVars = Object.entries(blocks[':root[data-theme="dark"],\n[data-theme="dark"]'] ?? blocks[':root[data-theme="dark"]'] ?? {});
  const fallback = darkVars.length
    ? `\n/* 没有 JS 时也跟随系统暗色（scripts/build.mjs 从暗色块生成；boot.js 写了 data-theme 以后以它为准） */\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {\n    color-scheme: dark;\n${darkVars.map(([k, v]) => `    ${k}: ${v};`).join("\n")}\n  }\n}\n`
    : "";
  const full = source + fallback;
  writeFileSync(join(dist, "tokens.css"), `/* @xxd/tokens — Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */\n${full}`);
  writeFileSync(join(dist, "tokens.shadow.css"), toShadow(full));
  writeFileSync(join(dist, "tokens.layered.css"), toLayered(full));
  // 全局规则（减少动效、选中色、输入光标）：不是变量，单独一份
  const base = readFileSync(join(root, "base.css"), "utf8");
  writeFileSync(join(dist, "base.css"), `/* @xxd/tokens base — Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */\n${base}`);

  const json = {};
  for (const [selector, vars] of Object.entries(blocks)) {
    // 一个块可以写成「:root[data-x], [data-x]」（整页或页面里的一块都生效）：按第一个选择器认
    const [first, second, ...more] = selector.split(/,\s*/);
    const pair = !more.length && second && second === first.replace(/^:root/, "") ? MODE_NAMES[first] : null;
    // 主色块写成「:root[data-accent], :root[data-accent] [data-theme="light"]」（页面里亮色的一块也跟着主色）：按第一个认
    // 暗色主色块写成「:root[data-theme="dark"][data-accent], :root[data-accent] [data-theme="dark"]」：同样按第一个认
    const scoped = !more.length && (second?.startsWith(`${first} `) || second === ':root[data-accent] [data-theme="dark"]') ? MODE_NAMES[first] : null;
    const name = MODE_NAMES[selector] || pair || scoped || (selector === ":root" ? "base" : null);
    if (name) json[name] = vars;
  }
  json.coarse = blocks["@media (pointer: coarse) :root"];
  writeFileSync(join(dist, "tokens.json"), JSON.stringify(json, null, 2) + "\n");

  // 算好的值（设计师评审 V5-4）：亮 / 暗 × 直角 / 圆角 × 标准 / 紧凑，每个令牌一个具体值（没有 var() / color-mix()）。
  // 给规格标注、颜色页、llms.txt 和不读 CSS 的工具用；主色另算（主色是运行时选的，见 accentPalette）。
  const { appearanceVars } = await import("../src/resolve.js");
  const resolved = { $comment: "@xxd/tokens 算好的值：键是「亮/暗-直角/圆角-标准/紧凑」，值是每个令牌的具体值。由 scripts/build.mjs 从 tokens.css 生成，不要手改。" };
  for (const theme of ["light", "dark"]) for (const corners of ["square", "rounded"]) for (const density of ["comfortable", "compact"]) {
    resolved[`${theme}-${corners}-${density}`] = appearanceVars({ theme, corners, density }, { modes: json }).vars;
  }
  writeFileSync(join(dist, "tokens.resolved.json"), JSON.stringify(resolved, null, 2) + "\n");

  const names = Object.keys(json.base).sort();
  writeFileSync(
    join(dist, "tokens.d.ts"),
    `/** 小小东设计令牌的 CSS 变量名（自动生成）。 */\nexport type XxdToken =\n${names.map((n) => `  | "${n}"`).join("\n")};\n`,
  );

  const common = { bundle: true, target: "es2020", legalComments: "none", banner: { js: "/* @xxd/tokens — Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */" } };
  await build({ ...common, entryPoints: [join(root, "src/boot.js")], format: "iife", minify: true, outfile: join(dist, "boot.js") });
  await build({ ...common, entryPoints: [join(root, "src/index.js")], format: "esm", outfile: join(dist, "theme.js") });
  console.log(`@xxd/tokens: ${names.length} tokens → dist/`);
}
