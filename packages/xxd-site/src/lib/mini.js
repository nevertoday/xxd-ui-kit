// 小程序版（@xxd/mini）在展示站上：组件清单来自 packages/xxd-mini/mini.json，演示是演示小程序（packages/xxd-mini-demo）编出的 H5，
// 放在 /mini/ 下（scripts/assets.mjs 拷进来）；代码从演示小程序的源码里抽出来，按语言把 tr("中", "En") 换成一种。
import manifest from "@xxd/mini/mini.json";
import batch1 from "../../../xxd-mini-demo/src/demos/batch1.tsx?raw";
import batch2 from "../../../xxd-mini-demo/src/demos/batch2.tsx?raw";
import batch3 from "../../../xxd-mini-demo/src/demos/batch3.tsx?raw";
import { withImports } from "./markup.js";

const SOURCES = [batch1, batch2, batch3];

/** Button → button，SearchBar → search-bar */
export const miniSlug = (name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

/** 小程序组件，按 mini.json 的顺序；label / summary 按语言 */
export function miniFor(lang = "zh") {
  return manifest.components.map((c) => ({
    name: c.name,
    slug: miniSlug(c.name),
    label: lang === "en" ? c.en : c.zh,
    summary: lang === "en" ? c.summaryEn : c.summary,
    batch: c.batch,
    web: c.web,
  }));
}

/** 网页版组件对应的小程序组件（没有就是 undefined） */
export const miniOfWeb = (webName, lang = "zh") => miniFor(lang).find((c) => c.web.includes(webName));

/** 从 from 处的开括号找到配对的闭括号 */
function matching(text, from, open = "{", close = "}") {
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === open) depth += 1;
    else if (text[i] === close && --depth === 0) return i;
  }
  return -1;
}

/** 一个函数（function Name(…) {…}）的源码 */
function functionSource(source, name) {
  const at = source.search(new RegExp(`(^|\\n)(export )?function ${name}\\(`));
  if (at === -1) return "";
  const start = source.indexOf("function", at);
  const params = matching(source, source.indexOf("(", start), "(", ")");
  return source.slice(start, matching(source, source.indexOf("{", params)) + 1);
}

/** tr("中文", "English") → 这种语言的字 */
function pickLang(code, lang) {
  const str = '"((?:[^"\\\\]|\\\\.)*)"';
  const pick = (zh, en) => (lang === "en" ? en : zh);
  return code
    .replace(new RegExp(`=\\{tr\\(${str}, ${str}\\)\\}`, "g"), (_, zh, en) => `="${pick(zh, en)}"`)
    .replace(new RegExp(`\\{tr\\(${str}, ${str}\\)\\}`, "g"), (_, zh, en) => pick(zh, en))
    .replace(new RegExp(`tr\\(${str}, ${str}\\)`, "g"), (_, zh, en) => `"${pick(zh, en)}"`)
    .replace(/tr\((`[^`]*`), (`[^`]*`)\)/g, (_, zh, en) => pick(zh, en));
}

/** 演示函数的参数里去掉 tr（换成一种语言以后用不到了） */
function dropTr(code) {
  return code
    .replace(/\(\{ tr \}: \{ tr: [^}]*\}\)/, "()")
    .replace(/\(\{ tr, (\w+) \}: \{ tr: [^;]*; (\w+: [^}]*?)\s*\}\)/, "({ $1 }: { $2 })")
    .replace(/\(tr\) => /g, "() => ");
}

/** 一个小程序组件的演示代码（复制下来改一改就能用）：演示函数，或者演示里那一段 JSX。sources 是演示小程序的源码 */
export function extractMiniCode(sources, name, lang = "zh") {
  for (const source of sources) {
    const key = source.search(new RegExp(`\\{\\s*name: "${name}"`));
    if (key === -1) continue;
    const at = source.indexOf("{", key);
    const entry = source.slice(at, matching(source, at) + 1);
    const render = entry.slice(entry.indexOf("render:") + "render:".length).replace(/\}\s*$/, "").trim().replace(/,$/, "");
    const body = render.replace(/^\([^)]*\)\s*=>\s*/, "").trim();
    const comp = body.match(/^<(\w+Demo)\b[^>]*\/>$/);
    const jsx = body.replace(/^\(\s*([\s\S]*?)\s*\)$/, "$1");
    const code = comp ? functionSource(source, comp[1]) : `function ${name}Demo() {\n  return (\n    ${jsx.replace(/\n {6}/g, "\n    ")}\n  );\n}`;
    // 演示源码里的注释是写给维护的人看的（中文）：给人复制的代码里不要
    const clean = code.replace(/^\s*\/\/[^\n]*\n/gm, "").replace(/\s*\{\/\*[\s\S]*?\*\/\}/g, "");
    return withImports(dropTr(pickLang(clean, lang)), source);
  }
  return "";
}

export const miniCode = (name, lang = "zh") => extractMiniCode(SOURCES, name, lang);

/** H5 演示的地址：/mini/#/pages/component/index?name=Button&embed=1（英文加 lang=en） */
export const miniFrameSrc = (name, lang = "zh") => `/mini/#/pages/component/index?name=${encodeURIComponent(name)}&embed=1${lang === "en" ? "&lang=en" : ""}`;
