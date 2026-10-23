// 展示站的静态资源：
//   public/xxd/      @xxd/css 的构建产物（boot.js、xxd.css、xxd.js、viz.js、icons.js）
//   public/v/<版本>/  同一批文件带版本号的一份（README「先试一下」引用它）
//   public/xxd/echarts.js  图表组件页用（echarts/dist/echarts.min.js）
//   public/xxd/kumo.css  React 组件的预编译样式（@cloudflare/kumo standalone，Kumo 换皮版）
//   public/xxd/xxd-icons-svg.zip  图标页「下载全部 SVG」：每个图标一个 24 × 24 的 SVG，加一份中英关键词表（设计师评审 V5-2）
//   public/xxd/forced-states.css  状态矩阵用：把组件 CSS 里的 :hover / :focus-visible / :active 复制成 [data-force~="…"] 版本，
//                                 这样「悬停 / 聚焦 / 按下」可以静态并排展示，用的是真实的组件规则而不是手写的模仿。
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";
import { printSelector, ruleTree } from "../../xxd-tokens/scripts/selectors.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pkgs = join(here, "../..");
const out = join(here, "../public/xxd");
mkdirSync(out, { recursive: true });

// 依赖的包由根目录的 pnpm xxd:build 先构建（这里不替别的包构建，免得用到半新半旧的产物）
const need = (file, name) => {
  if (existsSync(file)) return;
  console.error(`✗ ${name} 还没构建：先跑 pnpm xxd:build`);
  process.exit(1);
};
const cssDist = join(pkgs, "xxd-css/dist");
need(join(cssDist, "xxd.js"), "@xxd/css");
for (const f of ["boot.js", "xxd.css", "xxd.js", "viz.js", "icons.js"]) copyFileSync(join(cssDist, f), join(out, f));
// 插件套件（XxdExtension）：插件专用模式的演示要用（没有 chrome.* 时走演示行为）
const extDist = join(pkgs, "xxd-extension/dist/extension.js");
need(extDist, "@xxd/extension");
copyFileSync(extDist, join(out, "extension.js"));

// 带版本号的一份：public/v/<版本>/，给「先试一下」的 <link> / <script> 用（public/_headers 让它长期缓存）
const version = JSON.parse(readFileSync(join(pkgs, "xxd-css/package.json"), "utf8")).version;
const versioned = join(here, "../public/v", version);
mkdirSync(versioned, { recursive: true });
for (const f of ["boot.js", "xxd.css", "xxd.min.css", "components.css", "xxd.js", "xxd.esm.js", "viz.js", "icons.js"]) copyFileSync(join(cssDist, f), join(versioned, f));

// 小程序版的演示：演示小程序（packages/xxd-mini-demo）编出的 H5，放在 /mini/（组件页的「小程序」标签、/miniprogram/ 页嵌它）
const miniH5 = join(pkgs, "xxd-mini-demo/dist-h5");
if (existsSync(join(miniH5, "index.html"))) {
  rmSync(join(here, "../public/mini"), { recursive: true, force: true });
  cpSync(miniH5, join(here, "../public/mini"), { recursive: true });
} else console.warn("！没有演示小程序的 H5：先跑 pnpm --filter @xxd/mini-demo build（小程序标签页会是空的）");

// 图表组件页用的 ECharts（只在那一页加载）
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
try {
  copyFileSync(join(dirname(require.resolve("echarts/package.json")), "dist/echarts.min.js"), join(out, "echarts.js"));
} catch {
  console.warn("！没有 echarts：图表组件页的原生演示会是空的");
}

const kumoCss = join(pkgs, "kumo/dist/styles/kumo-standalone.css");
if (existsSync(kumoCss)) copyFileSync(kumoCss, join(out, "kumo.css"));
else console.warn("！没有 kumo-standalone.css：先运行 pnpm --filter @cloudflare/kumo build（React 演示会没有样式）");

/**
 * 把 :hover / :focus-visible / :active（和输入框的 :focus）规则复制成强制状态版本：.xxd-force-scope … [data-force~="hover"]。
 * 规则和选择器由 lightningcss 解析（packages/xxd-tokens/scripts/selectors.mjs），只改选择器，声明原样复制。
 *   - 写在 :not() 里的状态不换（:not([data-force~=…]) 会匹配到所有东西）；
 *   - 「鼠标点的时候不显示焦点环」那条规则（[data-input="pointer"]）不复制：矩阵里的「键盘聚焦」要真的画出焦点环。
 */
export function forceStates(css) {
  const STATE = { hover: "hover", "focus-visible": "focus", focus: "focus", active: "active" };
  const force = (name) => ({ type: "attribute", namespace: null, name: "data-force", operation: { operator: "includes", value: name, caseSensitivity: "case-sensitive" } });
  const isPointerOnly = (c) => c.type === "attribute" && c.name === "data-input" && c.operation?.value === "pointer";
  // 返回换过的选择器；不该复制时返回 null
  const convert = (selector) => {
    let touched = false;
    let insideNot = false;
    const map = (components, negated) =>
      components.map((c) => {
        if (c.type === "pseudo-class" && STATE[c.kind]) {
          if (negated) insideNot = true;
          touched = true;
          return force(STATE[c.kind]);
        }
        if (c.type === "pseudo-class" && Array.isArray(c.selectors)) {
          const nested = c.kind === "host" ? map(c.selectors, negated) : c.selectors.map((s) => map(s, negated || c.kind === "not"));
          return { ...c, selectors: nested };
        }
        return c;
      });
    if (selector.some(isPointerOnly)) return null;
    const next = map(selector, false);
    if (!touched || insideNot) return null;
    return [{ type: "class", name: "xxd-force-scope" }, { type: "combinator", value: "descendant" }, ...next];
  };
  const out = [];
  for (const rule of ruleTree(css)) {
    const forced = rule.selectors.map(convert).filter(Boolean);
    if (!forced.length) continue;
    let text = `${[...new Set(forced.map(printSelector))].join(",\n")} {${rule.body}}`;
    for (const w of rule.wrappers.filter((x) => x.type === "media" || x.type === "supports").reverse()) text = `${w.prelude} {\n${text}\n}`;
    out.push(text);
  }
  return `/* 由 scripts/assets.mjs 生成：状态矩阵用的强制状态（请勿手改） */\n@layer xxd.components {\n${out.join("\n")}\n}\n`;
}

/** 最简单的 zip（只存不压：SVG 本来就小，设计工具都能直接打开）。files：[[文件名, Buffer]] */
export function zipStore(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // 文件名是 UTF-8
    local.writeUInt16LE(0, 8); // 不压缩
    local.writeUInt32LE(0, 10); // 时间日期写 0，产物每次一样
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

/** 图标包：icons/<名字>.svg（24 网格、1.5 线宽、currentColor），keywords.json（中英关键词、分类），README.txt */
export async function iconsZip() {
  const { ICON_NAMES, iconSVG } = await import("@xxd/icons");
  const { ICON_GROUPS } = await import("@xxd/icons/meta");
  const files = ICON_NAMES.map((name) => {
    const svg = iconSVG(name, { size: 24 }).replace(/ class="ui-icon"/, ' xmlns="http://www.w3.org/2000/svg"').replace(/ aria-hidden="true" focusable="false"/, "");
    return [`icons/${name}.svg`, Buffer.from(svg + "\n")];
  });
  const keywords = {};
  for (const g of ICON_GROUPS) for (const [name, kw] of Object.entries(g.icons)) keywords[name] = { group: { zh: g.zh, en: g.en }, keywords: kw };
  files.push(["keywords.json", Buffer.from(JSON.stringify(keywords, null, 2) + "\n")]);
  files.push(["README.txt", Buffer.from(`小小东 UI 图标 / XXD UI icons (MIT)\n${ICON_NAMES.length} 个 SVG：24 × 24 网格、1.5 线宽、圆头、斜接角、不填充，颜色是 currentColor。\n放大缩小时把线宽保持 1.5px（设计工具里关掉「缩放描边」）。\n${ICON_NAMES.length} SVGs on a 24 × 24 grid, 1.5 stroke, round caps, miter joins, no fill, currentColor.\nKeep the stroke at 1.5px when resizing (turn off "scale strokes").\nhttps://ui.xiaoxiaodong.ai/foundations/icons\n`)]);
  return zipStore(files);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(join(out, "xxd-icons-svg.zip"), await iconsZip());
  // 算好的令牌值（设计师从这里开始页可以下载）
  const resolvedTokens = join(pkgs, "xxd-tokens/dist/tokens.resolved.json");
  need(resolvedTokens, "@xxd/tokens");
  copyFileSync(resolvedTokens, join(out, "tokens.resolved.json"));
  const components = readFileSync(join(cssDist, "components.css"), "utf8");
  writeFileSync(join(out, "forced-states.css"), forceStates(components));
  console.log("xxd-site assets → public/xxd/");
}
