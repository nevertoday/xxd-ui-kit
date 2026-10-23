#!/usr/bin/env node
// 小小东 UI Kit 命令行。在仓库里：pnpm xxd <命令>；装成全局（pnpm xxd link）之后：xxd-ui <命令>。
// 全部命令和说明在 scripts/commands.mjs（help 和展示站都从那里生成）；xxd-ui help 看全部。
// 说哪种话：--en / --zh，或 XXD_UI_LANG，缺省跟系统语言（见 lib/lang.mjs）。
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, rmSync, statSync, symlinkSync, watch, writeFileSync, accessSync, constants } from "node:fs";
import { createHash } from "node:crypto";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
import { parseBlocks } from "../../xxd-tokens/scripts/build.mjs";
import { COMMANDS, GROUPS } from "./commands.mjs";
import { c, columns, copy, openUrl, suggest } from "./lib/term.mjs";
import { forgetProject, isProject, listProjects, rememberProject } from "./lib/projects.mjs";
import { catalog, findComponent, iconAs, iconName, listTokens, pageUrl, searchIcons } from "./lib/find.mjs";
import { RULES, doctor } from "./lib/doctor.mjs";
import { createMini } from "./lib/mini.mjs";
import { isEn, say, setLang } from "./lib/lang.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, "..");
const repo = resolve(pkgDir, "../..");
const cssDir = join(repo, "packages/xxd-css");
const tokensDir = join(repo, "packages/xxd-tokens");

/**
 * 拷进项目 vendor/xxd/ 的文件 → 来源。min：拷压缩版（xxd.css、xxd.shadow.css；缺省开，xxd.config.json 写 "vendorMinify": false 关掉）。
 * xxd.config.json 的 "vendorFiles": ["xxd.css", "xxd.js", …] 可以只拷一部分。
 */
const VENDOR = {
  "tokens.css": () => join(tokensDir, "dist/tokens.css"),
  "xxd.css": (min) => join(cssDir, "dist", min ? "xxd.min.css" : "xxd.css"),
  "xxd.shadow.css": (min) => join(cssDir, "dist", min ? "xxd.shadow.min.css" : "xxd.shadow.css"),
  "xxd.shadow.css.js": () => join(cssDir, "dist/xxd.shadow.css.js"),
  "xxd.js": () => join(cssDir, "dist/xxd.js"),
  "boot.js": () => join(cssDir, "dist/boot.js"),
  "icons.js": () => join(cssDir, "dist/icons.js"),
  "extension.js": () => join(pkgDir, "dist/extension.js"),
  "tokens.mjs": () => join(pkgDir, "dist/tokens.mjs"),
};
const VENDOR_FILES = Object.keys(VENDOR);

function git(args) {
  try {
    return execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** 当前构建的版本：包版本、提交，以及拷进项目的那些文件的内容 hash（status 用它判断落没落后：只改了文档不算落后）。 */
export function currentVersion() {
  const pkg = JSON.parse(readFileSync(join(cssDir, "package.json"), "utf8"));
  const commit = git(["rev-parse", "--short", "HEAD"]) || "unknown";
  const dirty = git(["status", "--porcelain", "--", "packages/xxd-tokens", "packages/xxd-icons", "packages/xxd-css", "packages/xxd-extension"]) ? "+dirty" : "";
  const h = createHash("sha256");
  let complete = true;
  for (const f of VENDOR_FILES) {
    const from = VENDOR[f](false);
    if (existsSync(from)) h.update(readFileSync(from));
    else complete = false;
  }
  return { version: pkg.version, commit: commit + dirty, hash: complete ? h.digest("hex").slice(0, 12) : null };
}

/** 用户命令（new / init / sync / pack）用：令牌、图标、组件先重新构建，再构建插件套件，保证拷出去的是最新的。 */
export async function buildAll({ quiet = false } = {}) {
  for (const pkg of ["xxd-tokens", "xxd-icons", "xxd-css"]) execFileSync("node", ["scripts/build.mjs"], { cwd: join(repo, "packages", pkg), stdio: quiet ? "ignore" : "inherit" });
  await buildExtension();
}

/** 只构建插件套件自己（dist/extension.js、dist/tokens.mjs）。包的 build 脚本和测试用：依赖由根目录按拓扑顺序先构建好，这里不碰别的包的 dist。 */
export async function buildExtension() {
  if (!existsSync(join(tokensDir, "dist/tokens.json")) || !existsSync(join(cssDir, "dist/xxd.js"))) {
    throw new Error(say("先构建令牌和组件：pnpm xxd:build", "Build tokens and components first: pnpm xxd:build"));
  }
  mkdirSync(join(pkgDir, "dist"), { recursive: true });
  const banner = "/* @xxd/extension — Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */";
  await build({
    entryPoints: [join(pkgDir, "src/global.js")],
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2020",
    legalComments: "none",
    banner: { js: banner },
    outfile: join(pkgDir, "dist/extension.js"),
  });
  writeFileSync(join(pkgDir, "dist/tokens.mjs"), tokensModule(banner));
}

/** service worker 也能用的令牌（纯数据）+ 工具栏徽章：import { TOKENS, setBadge } from "./vendor/xxd/tokens.mjs" */
function tokensModule(banner) {
  const t = JSON.parse(readFileSync(join(tokensDir, "dist/tokens.json"), "utf8"));
  const pick = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => /^#[0-9a-f]{3,8}$/i.test(String(v))));
  const light = pick(t.base);
  const dark = { ...light, ...pick(t.dark) };
  return `${banner}
// 令牌里的颜色（亮 / 暗），给 service worker、OffscreenCanvas、通知用（它们拿不到 CSS 变量）。
export const TOKENS = ${JSON.stringify({ light, dark }, null, 2)};

const TONES = { neutral: "--ink", danger: "--danger", success: "--success", warning: "--warning" };

/** 工具栏图标上的徽章：setBadge("3", "danger")；setBadge("") 清掉。 */
export async function setBadge(text, tone = "neutral", { tabId } = {}) {
  const color = TOKENS.light[TONES[tone] ?? "--ink"];
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
  await chrome.action.setBadgeTextColor?.({ color: "#ffffff", tabId });
  await chrome.action.setBadgeText({ text: String(text ?? ""), tabId });
}
`;
}

const REGION_START = "/* xxd:tokens:start —— 由 xxd-ui-kit 生成（xxd-ui sync），这一段请勿手改 */";
const REGION_END = "/* xxd:tokens:end */";

/** 把一段内容放进文件开头的标记区域里（已有就替换）。 */
export function upsertRegion(text, body) {
  const block = `${REGION_START}\n${body.trim()}\n${REGION_END}\n`;
  // 只认固定的开头：标记里的说明文字改过，老项目里的那一段也要认得出来
  const start = text.search(/\/\* xxd:tokens:start\b[^]*?\*\//);
  const end = text.indexOf(REGION_END);
  if (start !== -1 && end > start) return text.slice(0, start) + block + text.slice(end + REGION_END.length).replace(/^\n/, "");
  // @charset / @import 必须在最前面：放在它们后面
  const lead = text.match(/^(?:\s*@(?:charset|import)[^;]+;\s*)*/)[0];
  return lead + block + (lead ? "" : "\n") + text.slice(lead.length);
}

/**
 * xxd.config.json（放在项目根目录，插件或网站都行）：
 *   vendorDir          组件拷到哪（插件默认 "vendor/xxd"；网站写 false 表示不拷）
 *   vendorFiles        只拷这几个文件（缺省全拷）
 *   vendorMinify       xxd.css / xxd.shadow.css 拷压缩版（缺省 true）
 *   tokensTargets      把 tokens.css 原样写到这些路径（老路径不想改时）
 *   layeredTokensRegions  把 layered 令牌写进这些 CSS 文件开头的标记区域（已有一套变量的老项目：老变量永远优先）
 *   iconNodesTargets   把图标数据（@xxd/icons/src/nodes.js）写到这些路径
 */
/**
 * 老项目里「用了但自己没声明」的变量（靠 var(--x, 后备值) 或干脆无效）：我们一声明，它们的样子就会变。
 * layered 令牌默认跳过这些名字，并打印出来，统一它们是另一件需要人决定的事。
 */
export function findFallbackConflicts(dir, tokenNames) {
  const declared = new Set();
  const used = new Set();
  const visit = (d) => {
    for (const name of readdirSync(d)) {
      if (/^(node_modules|\.git|dist|vendor)$/.test(name)) continue;
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) visit(p);
      else if (/\.(css|js|mjs|html)$/.test(name) && !/\.[a-f0-9]{10}\.(css|js)$/.test(name) && st.size < 4_000_000) {
        const text = readFileSync(p, "utf8").replace(/\/\* xxd:tokens:start[\s\S]*?xxd:tokens:end \*\//, "");
        for (const m of text.matchAll(/(--[a-zA-Z][\w-]*)\s*:/g)) declared.add(m[1]);
        for (const m of text.matchAll(/setProperty\(\s*["'`](--[\w-]+)/g)) declared.add(m[1]);
        for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g)) used.add(m[1]);
      }
    }
  };
  visit(dir);
  return tokenNames.filter((t) => used.has(t) && !declared.has(t));
}

/** 从一段 CSS 里去掉这些自定义属性的声明。 */
export function dropDeclarations(css, names) {
  if (!names.length) return css;
  const re = new RegExp(`^\\s*(?:${names.map((n) => n.replace(/[-]/g, "\\-")).join("|")})\\s*:[^;]*;\\s*$\\n?`, "gm");
  return css.replace(re, "");
}

/**
 * 老项目接过令牌之后的第二步（「改为引入 @xxd/tokens，旧名先做别名」）：
 * - :root 与 :root[data-theme="dark"] 里，亮暗两种值都与令牌相同的变量 → 删掉，改由令牌提供；
 *   只要有一种模式不同就保留（否则老项目没进 layer 的亮色声明会在暗色里继续生效）。
 * - aliases：{ "--ui-radius": "var(--r-md)" } 把旧名的值换成指向令牌（只在亮暗值都不变时才该写）。
 * 返回 { css, removed, aliased }。只动 xxd:tokens 区域之外的那两个块。
 */
export function adoptTokens(css, { tokensCss, parseBlocks, aliases = {}, darkSelector = ':root[data-theme="dark"]' }) {
  const regionEnd = css.indexOf("/* xxd:tokens:end */");
  const head = regionEnd === -1 ? "" : css.slice(0, regionEnd + "/* xxd:tokens:end */".length);
  let body = regionEnd === -1 ? css : css.slice(head.length);
  const ours = parseBlocks(tokensCss);
  const oursLight = ours[":root"];
  const oursDark = { ...oursLight, ...ours[':root[data-theme="dark"]'] };
  const theirs = parseBlocks(body);
  const theirLight = theirs[":root"] || {};
  const theirDark = { ...theirLight, ...(theirs[darkSelector] || {}) };
  const removed = Object.keys(theirLight).filter(
    (k) => k in oursLight && !(k in aliases) && theirLight[k] === oursLight[k] && theirDark[k] === oursDark[k],
  );
  const firstBlock = (sel) => {
    const re = new RegExp(`(^|\\n)${sel.replace(/[[\]"().*+?^$|\\]/g, "\\$&")}\\s*\\{`, "");
    const m = re.exec(body);
    if (!m) return null;
    const start = m.index + m[0].length;
    const end = body.indexOf("}", start);
    return { start, end };
  };
  const rewrite = (sel, fn) => {
    const b = firstBlock(sel);
    if (!b) return;
    body = body.slice(0, b.start) + fn(body.slice(b.start, b.end)) + body.slice(b.end);
  };
  const dropLines = (text) => removed.reduce((t, k) => t.replace(new RegExp(`\\n[ \\t]*${k}\\s*:[^;]*;[^\\n]*`), ""), text);
  const aliased = [];
  rewrite(":root", (text) => {
    let t = dropLines(text);
    for (const [k, v] of Object.entries(aliases)) {
      const next = t.replace(new RegExp(`(\\n[ \\t]*${k}\\s*:)[^;]*;`), `$1 ${v}; /* 别名 → @xxd/tokens */`);
      if (next !== t) aliased.push(k);
      t = next;
    }
    return t;
  });
  rewrite(darkSelector, dropLines);
  return { css: head + body, removed, aliased };
}

function readConfig(dir) {
  const file = join(dir, "xxd.config.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

export function sync(target, { quiet = false } = {}) {
  const dir = resolve(target);
  const config = readConfig(dir) ?? {};
  const isExtension = existsSync(join(dir, "manifest.json"));
  if (!isExtension && !existsSync(join(dir, "xxd.config.json"))) throw new Error(say(`${dir} 里既没有 manifest.json 也没有 xxd.config.json —— 先运行 ${BIN} init ${target}`, `${dir} has neither manifest.json nor xxd.config.json — run ${BIN} init ${target} first`));
  const vendorRel = config.vendorDir ?? (isExtension ? "vendor/xxd" : false);
  const vendor = vendorRel ? join(dir, vendorRel) : null;
  const minify = config.vendorMinify !== false;
  const files = config.vendorFiles ?? VENDOR_FILES;
  if (vendor) mkdirSync(vendor, { recursive: true });
  for (const f of vendor ? files : []) {
    if (!VENDOR[f]) throw new Error(say(`vendorFiles 里的 ${f} 不认识（可以用：${VENDOR_FILES.join(" ")}）`, `Unknown file ${f} in vendorFiles (available: ${VENDOR_FILES.join(" ")})`));
    const from = VENDOR[f](minify);
    if (!existsSync(from)) throw new Error(say(`缺少 ${relative(repo, from)}，先运行 pnpm xxd:build`, `${relative(repo, from)} is missing — run pnpm xxd:build first`));
    cpSync(from, join(vendor, f));
  }
  // 打包工具把 vendor/ 下的文件当第三方代码检查许可：放一份整个目录的 LICENSE。
  if (vendor) writeFileSync(join(vendor, "LICENSE"), "小小东 UI Kit（xxd-ui-kit）的构建产物：设计令牌、原生组件、图标与插件套件。\nBuild output of XXD UI Kit (xxd-ui-kit): design tokens, native components, icons and the extension kit.\n\n" + readFileSync(join(repo, "LICENSE"), "utf8"));
  const v = currentVersion();
  // 老项目的令牌文件路径不想改（测试、网站都引用它）：xxd.config.json 里写 { "tokensTargets": ["src/xxd-theme.css"] }
  const tokens = readFileSync(join(tokensDir, "dist/tokens.css"), "utf8");
  for (const rel of config.tokensTargets ?? []) {
    const out = join(dir, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `/* 由 xxd-ui-kit 生成（xxd-ui sync），请勿手改；来源 packages/xxd-tokens/tokens.css @ ${v.commit} */\n${tokens}`);
  }
  if (config.layeredTokensRegions?.length) {
    const names = Object.keys(JSON.parse(readFileSync(join(tokensDir, "dist/tokens.json"), "utf8")).base);
    const skip = [...new Set([...findFallbackConflicts(dir, names), ...(config.layeredTokensExclude ?? [])])].sort((a, b) => a.localeCompare(b));
    if (skip.length && !quiet) console.log(say(`  跳过 ${skip.length} 个令牌（项目里用了但没声明，声明了会改变现在的样子）：${skip.join(" ")}`, `  Skipped ${skip.length} tokens (the project uses them without declaring them; declaring them would change how it looks): ${skip.join(" ")}`));
    const layered = dropDeclarations(readFileSync(join(tokensDir, "dist/tokens.layered.css"), "utf8"), skip);
    for (const rel of config.layeredTokensRegions) {
      const out = join(dir, rel);
      const note = skip.length ? `/* 跳过：${skip.join(" ")}（见 xxd-ui-kit docs/existing-site.md） */\n` : "";
      writeFileSync(out, upsertRegion(readFileSync(out, "utf8"), `/* @xxd ${v.version} ${v.commit} */\n${note}${layered}`));
    }
  }
  for (const rel of config.iconNodesTargets ?? []) {
    const out = join(dir, rel);
    mkdirSync(dirname(out), { recursive: true });
    const nodes = readFileSync(join(repo, "packages/xxd-icons/src/nodes.js"), "utf8");
    writeFileSync(out, `// 由 xxd-ui-kit 生成（xxd-ui sync），请勿手改；来源 packages/xxd-icons/src/nodes.js @ ${v.commit}\n${nodes}`);
  }
  if (vendor) {
    writeFileSync(
      join(vendor, "VERSION"),
      `@xxd/css ${v.version}\ncommit ${v.commit}\nhash ${v.hash ?? "unknown"}\nsynced ${new Date().toISOString()}\nsource xxd-ui-kit（请勿手改这个目录，用 xxd-ui sync 更新 · don't edit by hand, run xxd-ui sync）\n`,
    );
  }
  if (!quiet) console.log(`✓ ${basename(dir)} ← @xxd ${v.version} (${v.commit})`);
  return v;
}

/** 一个项目的状态。state：current（最新）/ behind（落后）/ not-set-up（没接入）/ tokens-only（只用令牌）。 */
export function status(target) {
  const vendorRel = readConfig(resolve(target))?.vendorDir ?? "vendor/xxd";
  if (vendorRel === false) return { target, state: "tokens-only" };
  const file = join(resolve(target), vendorRel, "VERSION");
  if (!existsSync(file)) return { target, state: "not-set-up" };
  const now = currentVersion();
  const text = readFileSync(file, "utf8");
  const version = text.match(/@xxd\/css (\S+)/)?.[1];
  const commit = text.match(/commit (\S+)/)?.[1];
  const hash = text.match(/hash (\S+)/)?.[1];
  // 内容 hash 一样就是最新（只提交了文档、测试不算落后）；老项目没有 hash 时比提交
  const current = hash && hash !== "unknown" && now.hash ? hash === now.hash : commit === now.commit;
  return { target, version, commit, state: current ? "current" : "behind", latest: now };
}

const stateLabel = (s) =>
  ({
    current: say("最新", "up to date"),
    behind: say(`落后（最新 ${s.latest?.version} ${s.latest?.commit}）`, `behind (latest ${s.latest?.version} ${s.latest?.commit})`),
    "not-set-up": say("未接入", "not set up"),
    "tokens-only": say("只用令牌（不拷组件）", "tokens only (no components copied)"),
  })[s.state] ?? s.state;

function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, fn);
    else fn(p);
  }
}

const toSlug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** 简体 → 繁体的极小对照（模板里的名字常用字）；完整转换交给 opencc。 */
const HANT = { 发: "發", 图: "圖", 片: "片", 链: "鏈", 接: "接", 记: "記", 录: "錄", 设: "設", 置: "置", 长: "長", 文: "文", 东: "東", 写: "寫", 批: "批", 量: "量", 存: "存", 办: "辦", 待: "待", 今: "今", 日: "日", 排: "排", 序: "序", 标: "標", 题: "題", 生: "生", 成: "成", 换: "換", 识: "識", 别: "別", 页: "頁", 摘: "摘", 网: "網", 书: "書", 签: "籤", 读: "讀", 笔: "筆", 译: "譯", 览: "覽", 时: "時", 间: "間", 刷: "刷", 新: "新", 闻: "聞", 视: "視", 频: "頻", 单: "單", 词: "詞", 复: "複", 制: "製" };
const toHant = (s) => [...s].map((ch) => HANT[ch] || ch).join("");

/**
 * 模板里的可选块：HTML <!-- xxd:account --> … <!-- /xxd:account -->，JS // xxd:account … // /xxd:account，
 * CSS 同理；xxd:!popup 是「没选 popup 时才要」。选了就留下里面的内容（去掉标记），没选整块删掉。
 */
export function applyBlocks(text, on) {
  return text.replace(/^[ \t]*(?:<!--|\/\/|\/\*)\s*xxd:(!?)(\w+)\s*(?:-->|\*\/)?[ \t]*\n([\s\S]*?)^[ \t]*(?:<!--|\/\/|\/\*)\s*\/xxd:\1\2\s*(?:-->|\*\/)?[ \t]*\n/gm, (_, not, name, body) => (Boolean(on[name]) !== Boolean(not) ? body : ""));
}

/**
 * 从模板新建插件。默认最小：侧边栏 + 设置页 + 外观 + 三语，不要登录、不注入网页。
 *   popup：点工具栏图标弹出的小窗；content：往匹配的网页里放界面（字符串是 matches 规则）；account：登录和会员（价格是占位）。
 */
export async function create(target, { name, nameEn, slug, desc, descEn, popup = false, content = false, account = false } = {}) {
  const dir = resolve(target);
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(say(`${dir} 已存在且不为空`, `${dir} already exists and isn't empty`));
  if (!name) throw new Error(say("需要 --name（几个朴素的字说清它做什么，比如「长文发布」）", "--name is required (a few plain words saying what it does, like “Long-form Publisher”)"));
  if (content === true) throw new Error(say('--content 后面要写网址规则，比如 --content "https://*.example.com/*"', '--content needs a match pattern, like --content "https://*.example.com/*"'));
  const enName = nameEn || name;
  const values = {
    __APP_NAME_HANT__: toHant(name),
    __APP_NAME_EN__: enName,
    __APP_NAME__: name,
    __APP_DESC_EN__: descEn || `${enName}: a Chrome extension.`,
    __APP_DESC__: desc || `${name}：一个 Chrome 插件。`,
    __SLUG__: slug || toSlug(nameEn) || toSlug(basename(dir)) || "my-ext",
  };
  const on = { account: Boolean(account), popup: Boolean(popup), content: Boolean(content) };
  const template = join(pkgDir, "template");
  mkdirSync(dir, { recursive: true });
  cpSync(template, dir, { recursive: true, filter: (src) => !src.startsWith(join(template, "blocks")) });
  // 选中的块：文件拷进去（_locales 合并进 messages.json）
  for (const [block, yes] of Object.entries(on)) {
    if (!yes) continue;
    const from = join(template, "blocks", block);
    cpSync(from, dir, { recursive: true, filter: (src) => !src.startsWith(join(from, "_locales")) });
    for (const loc of existsSync(join(from, "_locales")) ? readdirSync(join(from, "_locales")) : []) {
      const file = join(dir, "_locales", loc, "messages.json");
      const merged = { ...JSON.parse(readFileSync(file, "utf8")), ...JSON.parse(readFileSync(join(from, "_locales", loc, "messages.json"), "utf8")) };
      writeFileSync(file, JSON.stringify(merged, null, 2) + "\n");
    }
  }
  // manifest：按选的块补上 popup、内容脚本
  const manifestFile = join(dir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  if (on.popup) manifest.action.default_popup = "popup.html";
  if (on.content) {
    manifest.content_scripts = [
      {
        matches: [String(content)],
        // 先装组件、套件、图标和 Shadow 样式，最后是你自己的内容脚本
        js: ["vendor/xxd/xxd.js", "vendor/xxd/extension.js", "vendor/xxd/icons.js", "vendor/xxd/xxd.shadow.css.js", "content.js"],
        run_at: "document_idle",
      },
    ];
  }
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  walk(dir, (file) => {
    if (!/\.(json|html|js|css|md)$/.test(file)) return;
    let text = applyBlocks(readFileSync(file, "utf8"), on);
    for (const [k, v] of Object.entries(values)) text = text.replaceAll(k, v);
    writeFileSync(file, text);
  });
  const extras = [on.popup && "popup", on.content && say(`内容脚本（${content}）`, `content script (${content})`), on.account && say("登录和会员", "sign-in and membership")].filter(Boolean);
  writeFileSync(
    join(dir, "README.md"),
    say(
      `# ${name}\n\n用小小东 UI Kit（xxd-ui-kit）生成。${extras.length ? `带：${extras.join("、")}。` : ""}\n\n- 在 chrome://extensions 打开「开发者模式」→「加载已解压的扩展程序」→ 选这个目录\n- 界面文字在 _locales（en、zh_CN、zh_TW）；改完跑 \`xxd-ui doctor\` 体检\n- 更新组件：\`xxd-ui sync\`（在这个目录里）\n- 上架图标：\`xxd-ui store-icons . --glyph 图标名\`\n- 设计原则：https://ui.xiaoxiaodong.ai/principles\n`,
      `# ${enName}\n\nMade with XXD UI Kit (xxd-ui-kit).${extras.length ? ` Includes: ${extras.join(", ")}.` : ""}\n\n- In chrome://extensions turn on Developer mode → Load unpacked → pick this folder\n- UI text lives in _locales (en, zh_CN, zh_TW); run \`xxd-ui doctor\` after changes\n- Update the components: \`xxd-ui sync\` (in this folder)\n- Store icons: \`xxd-ui store-icons . --glyph IconName\`\n- Design principles: https://ui.xiaoxiaodong.ai/en/principles\n`,
    ),
  );
  sync(dir, { quiet: true });
  console.log(say(`✓ 新建 ${name} → ${dir}`, `✓ Created ${enName} → ${dir}`));
  return dir;
}

/** React 组件清单：Kumo 来的（它的组件清单）+ 小小东自己写的（@xxd/react 构建时生成的 dist/props.json；没构建过就现读源码）。 */
function loadReact() {
  const reactFile = join(repo, "packages/kumo/ai/component-registry.json");
  const kumo = existsSync(reactFile) ? JSON.parse(readFileSync(reactFile, "utf8")).components : {};
  const propsFile = join(repo, "packages/xxd-react/dist/props.json");
  let own = {};
  try {
    own = JSON.parse(existsSync(propsFile) ? readFileSync(propsFile, "utf8") : execFileSync("node", [join(repo, "packages/xxd-react/scripts/props.mjs")], { encoding: "utf8" }));
  } catch {}
  const xxd = Object.fromEntries(Object.entries(own).map(([name, x]) => [name, { name, description: x.description || say("小小东自己写的组件", "An XXD component"), props: x.props, subComponents: {} }]));
  return { ...xxd, ...kumo };
}

/** 组件和模式列表；filter 按分类、英文名、中文名过滤。 */
export function listComponents(filter = "") {
  const react = loadReact();
  const f = String(filter).trim().toLowerCase();
  const items = catalog().filter((x) => !f || [x.category, x.categoryLabel, x.name, x.label, x.zh].some((v) => String(v ?? "").toLowerCase().includes(f)));
  if (!items.length) return say(`没有和「${filter}」相关的组件。${BIN} ls 看全部`, `Nothing matches “${filter}”. ${BIN} ls lists everything`);
  const lines = [];
  const byCat = new Map();
  for (const x of items) byCat.set(x.categoryLabel, [...(byCat.get(x.categoryLabel) || []), x]);
  for (const [cat, list] of byCat) {
    lines.push(c.bold(cat === "模式" ? "模式（几个组件拼成的固定做法）" : cat === "Patterns" ? "Patterns (fixed combinations of components)" : cat));
    lines.push(columns(list.map((x) => [`  ${x.name}`, isEn() ? (x.label !== x.name ? x.label : "") : x.zh, x.react ? c.dim(`React: ${x.react}`) : ""])));
  }
  const reactNames = Object.keys(react);
  if (!f && reactNames.length) lines.push("", c.bold(say(`React 组件（@xxd/react：Kumo 换皮版加小小东自己写的，${reactNames.length} 个）`, `React components (@xxd/react: restyled Kumo plus XXD's own, ${reactNames.length})`)), `  ${reactNames.join(" ")}`);
  return lines.join("\n");
}

/** 一个组件（或模式）的用法。找不到时抛错并给出最像的几个。 */
export function docComponent(name, { react: wantReact = false, markup = false } = {}) {
  const react = loadReact();
  if (wantReact) {
    const key = String(name || "").toLowerCase();
    const native = findComponent(name).exact;
    const entry = Object.values(react).find((x) => x.name.toLowerCase() === key) ?? (native?.react ? Object.values(react).find((x) => x.name === native.react.split(/[\s(（]/)[0]) : null);
    if (!entry) {
      const near = suggest(name, Object.values(react).map((x) => x.name));
      throw new Error(say(`没有叫 ${name} 的 React 组件${near.length ? `，是不是 ${near.join(" / ")}？` : ""}（${BIN} ls 看全部）`, `There's no React component called ${name}${near.length ? ` — did you mean ${near.join(" / ")}?` : ""} (${BIN} ls lists everything)`));
    }
    const props = Object.entries(entry.props || {}).map(([p, v]) => `  ${p}${v.optional ? "?" : ""}: ${v.values ? v.values.join(" | ") : v.type}${v.default ? say(`（缺省 ${v.default}）`, ` (default ${v.default})`) : ""}`);
    const subs = Object.keys(entry.subComponents || {});
    return [
      `${entry.name} — ${entry.description ?? ""}`,
      `import { ${entry.name} } from "@xxd/react";`,
      "",
      "props",
      ...props,
      ...(subs.length ? ["", say("子组件", "Sub-components"), `  ${subs.map((s) => `${entry.name}.${s}`).join("  ")}`] : []),
      "",
      c.dim(`${say("展示站", "Showcase")}: ${pageUrl(native?.name ?? entry.name, { en: isEn() }) ?? pageUrl("", { en: isEn() })}`),
    ].join("\n");
  }
  const { exact, matches, near } = findComponent(name);
  const show = (x) => (isEn() ? x.name : `${x.name}（${x.zh}）`);
  if (!exact) {
    if (near && matches.length) throw new Error(say(`没有叫 ${name} 的组件，是不是 ${matches.map(show).join(" / ")}？`, `There's no component called ${name} — did you mean ${matches.map(show).join(" / ")}?`));
    if (matches.length) throw new Error(say(`「${name}」对上了 ${matches.length} 个：${matches.slice(0, 8).map(show).join("、")}`, `“${name}” matches ${matches.length}: ${matches.slice(0, 8).map(show).join(", ")}`));
    throw new Error(say(`没有叫 ${name} 的组件或模式（${BIN} ls 看全部；React 版加 --react）`, `There's no component or pattern called ${name} (${BIN} ls lists everything; add --react for React)`));
  }
  const x = exact;
  if (markup) return x.markup.trim();
  const out = [`${c.bold(isEn() ? `${x.name}${x.label !== x.name ? ` · ${x.label}` : ""}` : `${x.name} · ${x.zh}`)}${say(`（${x.categoryLabel}）`, ` (${x.categoryLabel})`)}`];
  if (x.summary) out.push("", x.summary);
  out.push("", c.bold(say("类名", "Classes")), `  ${x.classes.join(" ")}`);
  if (x.attributes) out.push("", c.bold(say("属性", "Attributes")), ...Object.entries(x.attributes).map(([k, v]) => `  ${k}: ${v}`));
  out.push("", c.bold(say("示例", "Example")), ...x.markup.split("\n").map((l) => `  ${l}`));
  if (x.js) out.push("", c.bold("JS"), ...x.js.split("\n").map((l) => `  ${l}`));
  if (x.a11y?.length) out.push("", c.bold(say("键盘与读屏", "Keyboard and screen readers")), ...x.a11y.map((r) => `  · ${r}`));
  if (x.rules?.length) out.push("", c.bold(say("规则（设计原则）", "Rules (design principles)")), ...x.rules.map((r) => `  · ${r}`));
  if (x.react) out.push("", say(`React 版：${x.react}（${BIN} doc ${x.name} --react）`, `React: ${x.react} (${BIN} doc ${x.name} --react)`));
  out.push("", c.dim(`${say("展示站", "Showcase")}: ${pageUrl(x.name, { en: isEn() })}`));
  return out.join("\n");
}

/** 项目里已经在用的外观设置键（页面里 boot.js 的 data-key）：沿用它，用户的设置不会丢。 */
function existingKey(dir) {
  let found = null;
  const visit = (d, depth = 0) => {
    if (found || depth > 3) return;
    for (const name of readdirSync(d)) {
      if (found || /^(node_modules|\.git|dist|vendor)$/.test(name)) continue;
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) visit(p, depth + 1);
      else if (/\.html?$/.test(name)) found = readFileSync(p, "utf8").match(/<script[^>]*boot\.js[^>]*data-key=["']([^"']+)["']/)?.[1] ?? null;
    }
  };
  visit(dir);
  return found;
}

/** 插件 manifest 里的名字（展开 __MSG_x__）当 key 的来源。 */
function manifestSlug(dir) {
  try {
    const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
    let n = m.short_name || m.name || "";
    const msg = /__MSG_(\w+)__/.exec(n)?.[1];
    if (msg) {
      for (const loc of ["en", m.default_locale].filter(Boolean)) {
        const file = join(dir, "_locales", loc, "messages.json");
        if (existsSync(file)) {
          n = JSON.parse(readFileSync(file, "utf8"))[msg]?.message ?? n;
          if (!/__MSG_/.test(n)) break;
        }
      }
    }
    return toSlug(n);
  } catch {
    return "";
  }
}

/** 让已有的项目接入：写 xxd.config.json（需要时）、拷组件、记住它。返回要加进 <head> 的几行。 */
export function init(target, { vendor, noVendor = false, quiet = false, key: wantedKey } = {}) {
  const dir = resolve(target);
  if (!existsSync(dir)) throw new Error(say(`${dir} 不存在`, `${dir} doesn't exist`));
  const isExtension = existsSync(join(dir, "manifest.json"));
  const configFile = join(dir, "xxd.config.json");
  let config = existsSync(configFile) ? JSON.parse(readFileSync(configFile, "utf8")) : null;
  const wanted = noVendor ? false : vendor || (isExtension ? "vendor/xxd" : existsSync(join(dir, "public")) ? "public/vendor/xxd" : "vendor/xxd");
  if (!config && (!isExtension || wanted !== "vendor/xxd")) {
    config = { vendorDir: wanted };
    writeFileSync(configFile, JSON.stringify(config, null, 2) + "\n");
    if (!quiet) console.log(say(`✓ 写了 xxd.config.json（组件放在 ${wanted || "不拷，只用令牌"}）`, `✓ Wrote xxd.config.json (components go in ${wanted || "nowhere — tokens only"})`));
  }
  sync(dir, { quiet });
  rememberProject(dir);
  const v = (config?.vendorDir ?? "vendor/xxd") || "";
  const base = v.replace(/^public\//, "");
  const reused = !wantedKey && existingKey(dir);
  const key = wantedKey || reused || `${(isExtension && manifestSlug(dir)) || toSlug(basename(dir)) || "my-app"}-ui`;
  if (reused && !quiet) console.log(say(`  沿用页面里已有的外观设置键 data-key="${key}"（用户的设置不会丢）`, `  Keeping the existing appearance key data-key="${key}" (users keep their settings)`));
  return [
    "<head>",
    `  <script src="${base}/boot.js" data-key="${key}"></script>`,
    `  <link rel="stylesheet" href="${base}/xxd.css">`,
    `  <script src="${base}/icons.js"></script>`,
    `  <script src="${base}/xxd.js"></script>`,
    ...(isExtension ? [`  <script src="${base}/extension.js"></script>`] : []),
    "</head>",
    '<body class="xxd-page">',
  ].join("\n");
}

/** 把 tokens、icons、css、react 打成 .tgz：pnpm pack 先跑各包的 prepack 构建，并把 workspace:* 换成真的版本号。 */
export function pack(outDir) {
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });
  const made = [];
  for (const pkg of ["xxd-tokens", "xxd-icons", "xxd-css", "xxd-react"]) {
    const cwd = join(repo, "packages", pkg);
    const text = execFileSync("pnpm", ["pack", "--pack-destination", out], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
    const file = text.trim().split("\n").reverse().find((l) => l.trim().endsWith(".tgz"));
    made.push(file ? basename(file.trim()) : pkg);
  }
  return made;
}

/** 找 Chrome（store-icons 用）：CHROME_EXE，或者常见的安装位置。 */
function chromePath() {
  const candidates = [
    process.env.CHROME_EXE,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? null;
}

/** 一个尺寸的上架图标（SVG）：墨色方块里一个白色图标；128 四周留 16px 透明（商店的安全区）；小尺寸线条加粗。 */
export function storeIconSvg(glyph, size, { bg = "#111111", fg = "#ffffff" } = {}) {
  const pad = size >= 128 ? 16 : 0;
  const art = size - pad * 2;
  const g = Math.round(art * 0.62);
  const natural = (1.5 * g) / 24;
  const px = Math.max(natural, size <= 16 ? 2 : size <= 32 ? 1.75 : 1.5);
  const stroke = ((px * 24) / g).toFixed(2);
  const inner = iconAs(glyph, "svg").replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const off = (size - g) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect x="${pad}" y="${pad}" width="${art}" height="${art}" fill="${bg}"/><svg x="${off}" y="${off}" width="${g}" height="${g}" viewBox="0 0 24 24" fill="none" stroke="${fg}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="miter">${inner}</svg></svg>`;
}

export function storeIcons(target, { glyph, bg, fg } = {}) {
  const dir = resolve(target);
  const manifestFile = join(dir, "manifest.json");
  if (!existsSync(manifestFile)) throw new Error(say(`${dir} 里没有 manifest.json`, `${dir} has no manifest.json`));
  if (!glyph || !iconName(glyph)) throw new Error(say(`需要 --glyph 图标名（找图标：${BIN} icon 关键词）`, `--glyph IconName is required (find one: ${BIN} icon <keyword>)`));
  const chrome = chromePath();
  if (!chrome) throw new Error(say("没找到 Chrome：设置 CHROME_EXE=<Chrome 可执行文件的路径>", "Chrome not found: set CHROME_EXE=<path to the Chrome binary>"));
  const tmp = mkdtempSync(join(tmpdir(), "xxd-icons-"));
  const outDir = join(dir, "icons");
  mkdirSync(outDir, { recursive: true });
  const icons = {};
  try {
    for (const size of [16, 32, 48, 128]) {
      const html = join(tmp, `${size}.html`);
      writeFileSync(html, `<!doctype html><html><body style="margin:0;background:transparent">${storeIconSvg(iconName(glyph), size, { bg, fg })}</body></html>`);
      const png = join(outDir, `icon-${size}.png`);
      execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000", `--window-size=${size},${size}`, `--screenshot=${png}`, pathToFileURL(html).href], { stdio: "ignore" });
      icons[size] = `icons/icon-${size}.png`;
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  manifest.icons = icons;
  manifest.action = { ...manifest.action, default_icon: { 16: icons[16], 32: icons[32] } };
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  return icons;
}

/** 找一个在 PATH 里、能写的目录放全局命令。 */
function binDir() {
  const path = (process.env.PATH || "").split(":");
  const home = homedir();
  for (const d of [join(home, ".local/bin"), join(home, "bin"), "/opt/homebrew/bin", "/usr/local/bin"]) {
    if (!path.includes(d) || !existsSync(d)) continue;
    try {
      accessSync(d, constants.W_OK);
      return { dir: d, inPath: true };
    } catch {
      // 换下一个
    }
  }
  return { dir: join(home, ".local/bin"), inPath: false };
}

export function link() {
  const self = fileURLToPath(import.meta.url);
  chmodSync(self, 0o755);
  const { dir, inPath } = binDir();
  mkdirSync(dir, { recursive: true });
  const target = join(dir, "xxd-ui");
  let exists = false;
  try {
    exists = Boolean(lstatSync(target));
  } catch {
    // 不存在
  }
  if (exists) {
    const current = lstatSync(target).isSymbolicLink() ? resolve(dir, readlinkSync(target)) : null;
    if (current === self) return say(`已经装好了：${target}`, `Already installed: ${target}`);
    throw new Error(say(`${target} 已经有别的东西了，先看一眼再删`, `${target} already exists and isn't ours — look at it before removing it`));
  }
  symlinkSync(self, target);
  return inPath
    ? say(`✓ 装好了：${target}。在任何目录都可以用 xxd-ui 了`, `✓ Installed: ${target}. xxd-ui now works in any directory`)
    : say(`✓ 放在了 ${target}，但 ${dir} 不在 PATH 里：在 ~/.zshrc 加一行 export PATH="$HOME/.local/bin:$PATH"`, `✓ Put it at ${target}, but ${dir} isn't on your PATH: add export PATH="$HOME/.local/bin:$PATH" to ~/.zshrc`);
}

function help(name) {
  const en = isEn();
  const lines = [];
  if (name) {
    const cmd = COMMANDS.find((x) => x.name === name);
    if (!cmd) return unknown(name);
    lines.push(`${c.bold(`${BIN} ${en ? cmd.usageEn : cmd.usage}`)}`, "", en ? cmd.en : cmd.zh, "", c.bold(say("例子", "Examples")), ...(en ? cmd.examplesEn || cmd.examples : cmd.examples).map((e) => `  ${BIN} ${e}`));
    return lines.join("\n");
  }
  lines.push(`${c.bold(say("小小东 UI Kit 命令行", "XXD UI Kit CLI"))}  ${c.dim(say(`（${BIN} help <命令> 看用法和例子；--en 说英文）`, `(${BIN} help <command> for usage and examples; --zh for Chinese)`))}`);
  for (const g of GROUPS) {
    lines.push("", c.bold(en ? g.en : g.zh));
    const w = Math.max(...COMMANDS.map((x) => x.name.length)) + 4;
    lines.push(...COMMANDS.filter((x) => x.group === g.id).map((x) => `  ${x.name.padEnd(w)}${(en ? x.en : x.zh).split(/[。.](\s|$)/)[0]}`));
  }
  lines.push("", c.dim(`${say("展示站", "Showcase")}: ${pageUrl("tools", { en })}`));
  return lines.join("\n");
}

function unknown(name) {
  const near = suggest(name, COMMANDS.map((x) => x.name));
  return say(
    `没有 ${name} 这个命令${near.length ? `，是不是 ${near.map((n) => c.bold(n)).join(" / ")}？` : "。"}${BIN} help 看全部`,
    `There's no ${name} command${near.length ? ` — did you mean ${near.map((n) => c.bold(n)).join(" / ")}?` : "."} ${BIN} help lists everything`,
  );
}

// 这些开关不带值：后面跟的词是参数，不是它的值（icon 购物车 --svg 删除 ……）
const BOOLEAN = new Set(["all", "json", "react", "markup", "copy", "svg", "js", "html", "en", "zh", "noVendor", "help", "list", "dryRun", "popup", "account"]);

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "-h") out.help = true;
    else if (a.startsWith("--")) {
      const [rawKey, inline] = a.slice(2).split(/=(.*)/s);
      const key = rawKey.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      if (inline !== undefined) out[key] = inline;
      else if (BOOLEAN.has(key)) out[key] = true;
      else out[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else out._.push(a);
  }
  return out;
}

const BIN = process.env.npm_lifecycle_event === "xxd" ? "pnpm xxd" : "xxd-ui";

function printStatus(targets) {
  const rows = targets.map((t) => {
    if (!existsSync(t)) return [basename(t), "", c.red(say("目录不在了", "folder is gone")), c.dim(`${BIN} projects --forget ${t}`)];
    const s = status(t);
    const label = stateLabel(s);
    const state = s.state === "current" ? c.green(label) : c.yellow(label);
    return [basename(t), s.version ? `${s.version} ${s.commit}` : "", state, c.dim(t)];
  });
  console.log(columns(rows));
}

function printDoctor(result) {
  const { findings, dir, kind } = result;
  const errors = findings.filter((f) => f.level === "error").length;
  const warns = findings.length - errors;
  const kinds = { extension: say("插件", "extension"), site: say("网站", "site"), mini: say("小程序", "mini program"), unknown: say("还没接入", "not set up") };
  console.log(`${c.bold(basename(dir))} ${c.dim(say(`（${kinds[kind]}）`, `(${kinds[kind]})`))}`);
  const byFile = new Map();
  for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) || []), f]);
  for (const [file, list] of byFile) {
    console.log(`\n${c.cyan(file)}`);
    // 同一个文件里同一条规则太多时只列前 6 条
    const perRule = {};
    for (const f of list.sort((a, b) => (a.line || 0) - (b.line || 0))) {
      perRule[f.rule] = (perRule[f.rule] || 0) + 1;
      if (perRule[f.rule] === 7) console.log(c.dim(say(`  …${RULES[f.rule] || f.rule}还有 ${list.filter((x) => x.rule === f.rule).length - 6} 处`, `  …${list.filter((x) => x.rule === f.rule).length - 6} more ${RULES[f.rule] || f.rule}`)));
      if (perRule[f.rule] > 6) continue;
      const tag = f.level === "error" ? c.red(say("错误", "error")) : c.yellow(say("提醒", "warn "));
      console.log(`  ${c.dim(String(f.line || "").padStart(4))}  ${tag}  ${c.dim(`[${RULES[f.rule] || f.rule}]`)} ${f.message}`);
    }
  }
  console.log("");
  if (!findings.length) console.log(c.green(say("✓ 没发现问题", "✓ No problems found")));
  else console.log(`${errors ? c.red(say(`${errors} 个错误`, `${errors} errors`)) : c.green(say("0 个错误", "0 errors"))}${say("，", ", ")}${say(`${warns} 个提醒`, `${warns} warnings`)}${c.dim(say("　某一行是有意的例外：在那一行写 xxd-ignore", "   A line that's meant to be different: put xxd-ignore on it"))}`);
  return errors;
}

/**
 * 命令表：每个命令一个处理函数。命令的说明、用法、例子在 commands.mjs（help 和展示站都从那里生成），
 * 测试会检查两边一一对应。
 */
export const HANDLERS = {
  help: async ({ args }) => {
    console.log(help(args._[0]));
  },
  new: async ({ args, targets }) => {
    if (!targets[0]) throw new Error(say(`用法：${BIN} new <目录> --name 名字`, `Usage: ${BIN} new <dir> --name Name`));
    await buildAll({ quiet: true });
    const dir = await create(targets[0], args);
    rememberProject(dir);
    console.log(c.dim(say(`下一步：chrome://extensions →「加载已解压的扩展程序」→ 选 ${dir}；改完跑 ${BIN} doctor ${dir}`, `Next: chrome://extensions → Load unpacked → pick ${dir}; after changes run ${BIN} doctor ${dir}`)));
  },
  "new-mini": async ({ args, targets }) => {
    if (!targets[0]) throw new Error(say(`用法：${BIN} new-mini <目录> --name 名字`, `Usage: ${BIN} new-mini <dir> --name Name`));
    const { dir, vendor } = createMini(targets[0], { name: typeof args.name === "string" ? args.name : undefined, nameEn: args.nameEn, slug: args.slug });
    console.log(`${c.green("✓")} ${say(`新建了 ${dir}（vendor/ 里：${vendor.join(" ")}）`, `Created ${dir} (vendor/: ${vendor.join(" ")})`)}`);
    console.log(c.dim(say(`下一步：cd ${dir} && pnpm install && pnpm dev:weapp，然后微信开发者工具「导入项目」选这个目录；改完跑 ${BIN} doctor ${dir}`, `Next: cd ${dir} && pnpm install && pnpm dev:weapp, then WeChat DevTools → Import → pick this folder; after changes run ${BIN} doctor ${dir}`)));
  },
  init: async ({ args, cwd, targets }) => {
    const dir = targets[0] || cwd;
    await buildAll({ quiet: true });
    const head = init(dir, { vendor: args.vendor, noVendor: args.noVendor, key: typeof args.key === "string" ? args.key : undefined });
    console.log(say(`\n把这几行放进页面（路径按页面所在位置调整）：\n\n${head}\n`, `\nPut these lines in your pages (adjust the paths to where each page lives):\n\n${head}\n`));
    console.log(c.dim(say(`以后：${BIN} sync 更新组件，${BIN} doctor 体检`, `Later: ${BIN} sync to update, ${BIN} doctor to check`)));
  },
  sync: async ({ args, cwd, targets }) => {
    let list = targets;
    if (args.all) list = listProjects().filter((p) => existsSync(p));
    else if (!list.length) list = [cwd];
    if (!list.length) throw new Error(say(`还没有记住的项目。先 ${BIN} init <目录> 或 ${BIN} sync <目录>`, `No remembered projects yet. Run ${BIN} init <dir> or ${BIN} sync <dir> first`));
    await buildAll({ quiet: true });
    for (const t of list) {
      sync(t);
      rememberProject(t);
    }
  },
  status: async ({ cwd, targets }) => {
    let list = targets;
    if (!list.length) {
      list = listProjects();
      if (isProject(cwd) && !list.includes(cwd)) list.unshift(cwd);
    }
    if (!list.length) return console.log(say(`还没有记住的项目。${BIN} status <目录…>，或先 ${BIN} init / sync 一次`, `No remembered projects yet. ${BIN} status <dir…>, or run ${BIN} init / sync once`));
    printStatus(list);
  },
  doctor: async ({ args, cwd, targets }) => {
    const result = doctor(targets[0] || cwd, { now: currentVersion(), bin: BIN });
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else if (printDoctor(result)) process.exitCode = 1;
    if (args.json && result.findings.some((f) => f.level === "error")) process.exitCode = 1;
  },
  watch: async ({ targets }) => {
    if (!targets.length) throw new Error(say(`用法：${BIN} watch <项目目录…>`, `Usage: ${BIN} watch <project-dir…>`));
    const sources = ["packages/xxd-tokens/tokens.css", "packages/xxd-icons/src", "packages/xxd-css/src", "packages/xxd-extension/src"].map((p) => join(repo, p));
    let timer = null;
    let running = false;
    const run = async (why) => {
      if (running) return;
      running = true;
      const t0 = Date.now();
      try {
        await buildAll({ quiet: true });
        for (const t of targets) sync(t, { quiet: true });
        const secs = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`${c.green("✓")} ${new Date().toLocaleTimeString()} ${why ? c.dim(why) + " → " : ""}${say(`已同步 ${targets.length} 个项目（${secs}s）`, `synced ${targets.length} project(s) (${secs}s)`)}`);
      } catch (err) {
        console.log(`${c.red("✗")} ${err.message}`);
      }
      running = false;
    };
    await run();
    for (const src of sources) {
      watch(src, { recursive: true }, (_, file) => {
        clearTimeout(timer);
        timer = setTimeout(() => run(relative(repo, join(src.endsWith(".css") ? dirname(src) : src, file || ""))), 250);
      });
    }
    console.log(c.dim(say("盯着令牌、图标、组件、插件套件的源码；Ctrl+C 停", "Watching the tokens, icons, components and extension kit sources; Ctrl+C to stop")));
  },
  projects: async ({ args, cwd }) => {
    if (args.forget) {
      const dir = resolve(cwd, String(args.forget).replace(/^~(?=\/|$)/, homedir()));
      console.log(forgetProject(dir) ? say(`✓ 不再记 ${dir}`, `✓ Forgot ${dir}`) : say(`本来就没记 ${dir}`, `${dir} wasn't remembered`));
    } else {
      const list = listProjects();
      if (!list.length) console.log(say("还没有记住的项目（new / init / sync 过的会自动记住）", "No remembered projects yet (anything you new / init / sync is remembered)"));
      else printStatus(list);
    }
  },
  ls: async ({ args }) => {
    console.log(listComponents(args._.join(" ")));
  },
  doc: async ({ args }) => {
    if (!args._.length) throw new Error(say(`用法：${BIN} doc <组件>（中文名也行，比如 ${BIN} doc 对话框）`, `Usage: ${BIN} doc <component> (e.g. ${BIN} doc Dialog)`));
    const text = docComponent(args._.join(" "), { react: Boolean(args.react), markup: Boolean(args.markup) });
    console.log(text);
    if (args.copy) console.error(copy(args.markup ? text : docComponent(args._.join(" "), { markup: true })) ? c.green(say("✓ 示例代码已复制", "✓ Example copied")) : c.yellow(say("没能复制（找不到剪贴板工具）", "Couldn't copy (no clipboard tool found)")));
  },
  icon: async ({ args }) => {
    const format = args.svg ? "svg" : args.react ? "react" : args.js ? "js" : args.html ? "html" : null;
    const q = args._.join(" ");
    const results = searchIcons(q);
    if (!args._.length && !format) {
      console.log(say(`${results.length} 个图标。${BIN} icon <关键词>，比如 ${BIN} icon 删除；看图：${BIN} open icons`, `${results.length} icons. ${BIN} icon <keyword>, e.g. ${BIN} icon trash; browse them: ${BIN} open icons`));
      return;
    }
    if (!results.length) {
      console.log(say(`没有和「${q}」相关的图标。换个词，或者看全部：${BIN} open icons`, `No icon matches “${q}”. Try another word, or browse them all: ${BIN} open icons`));
      process.exitCode = 1;
      return;
    }
    const exact = results[0].name.toLowerCase() === q.toLowerCase() || results[0].aliases.some((a) => a.toLowerCase() === q.toLowerCase());
    if (format || results.length === 1 || exact) {
      const top = results[0];
      const code = iconAs(top.name, format || "html");
      console.log(code);
      if (results.length > 1 && !exact) console.error(c.dim(say(`（最像的是 ${top.name}；还有 ${results.slice(1, 6).map((r) => r.name).join(" ")}…）`, `(closest is ${top.name}; also ${results.slice(1, 6).map((r) => r.name).join(" ")}…)`)));
      if (args.copy) console.error(copy(code) ? c.green(say(`✓ 已复制 ${top.name}`, `✓ Copied ${top.name}`)) : c.yellow(say("没能复制（找不到剪贴板工具）", "Couldn't copy (no clipboard tool found)")));
      return;
    }
    const shown = results.slice(0, 30);
    console.log(columns(shown.map((r) => [r.name, c.dim(isEn() ? r.groupEn : r.group), isEn() ? r.aliases.join(" ") : r.keywords])));
    if (results.length > shown.length) console.log(c.dim(say(`…还有 ${results.length - shown.length} 个，多加一个词缩小范围`, `…${results.length - shown.length} more; add a word to narrow it down`)));
    console.log(c.dim(say(`\n要哪个：${BIN} icon ${shown[0].name}（加 --svg / --react / --copy）`, `\nPick one: ${BIN} icon ${shown[0].name} (add --svg / --react / --copy)`)));
  },
  tokens: async ({ args }) => {
    const list = listTokens(args._.join(" "));
    if (args.json) return console.log(JSON.stringify(list, null, 2));
    const swatch = (v) => {
      const m = /^#([0-9a-f]{6})$/i.exec(v || "");
      if (!m || !process.stdout.isTTY || process.env.NO_COLOR) return "";
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
      return `\x1b[48;2;${r};${g};${b}m  \x1b[0m `;
    };
    console.log(columns([[c.dim(say("令牌", "token")), c.dim(say("亮色", "light")), c.dim(say("暗色", "dark")), c.dim(say("圆角 / 紧凑", "rounded / compact"))], ...list.map((t) => [t.name, `${swatch(t.light)}${t.light}`, t.dark && t.dark !== t.light ? `${swatch(t.dark)}${t.dark}` : "", t.rounded || t.compact || ""])]));
  },
  open: async ({ args }) => {
    const q = args._.join(" ");
    const url = pageUrl(q, { en: Boolean(args.en) || isEn() });
    if (!url) {
      const near = suggest(q, catalog().map((x) => x.name));
      throw new Error(say(`展示站上没有「${q}」${near.length ? `，是不是 ${near.join(" / ")}？` : ""}`, `The showcase has no page for “${q}”${near.length ? ` — did you mean ${near.join(" / ")}?` : ""}`));
    }
    console.log(url);
    openUrl(url);
  },
  adopt: async ({ args, targets }) => {
    const dir = targets[0];
    if (!dir) throw new Error(say(`用法：${BIN} adopt <项目目录>`, `Usage: ${BIN} adopt <project-dir>`));
    const config = readConfig(dir)?.adopt;
    if (!config?.file) throw new Error(say("xxd.config.json 里需要 adopt: { file, aliases }", "xxd.config.json needs adopt: { file, aliases }"));
    const file = join(dir, config.file);
    const result = adoptTokens(readFileSync(file, "utf8"), {
      tokensCss: readFileSync(join(tokensDir, "tokens.css"), "utf8"),
      parseBlocks,
      aliases: config.aliases,
      darkSelector: config.darkSelector,
    });
    if (!args.dryRun) writeFileSync(file, result.css);
    const prefix = args.dryRun ? say("（试运行，没有改文件）", "(dry run, nothing written) ") : "";
    console.log(`${prefix}${say(`✓ 改由令牌提供（删掉 ${result.removed.length} 个相同的声明）：`, `✓ Handed to the tokens (${result.removed.length} identical declarations removed): `)}${result.removed.join(" ")}`);
    console.log(`${say("✓ 旧名改为别名：", "✓ Old names aliased: ")}${result.aliased.join(" ") || say("（无）", "(none)")}`);
  },
  "store-icons": async ({ args, cwd, targets }) => {
    const dir = targets[0] || cwd;
    const icons = storeIcons(dir, { glyph: args.glyph, bg: args.bg, fg: args.fg });
    console.log(say(`✓ 生成了 ${Object.values(icons).join(" ")}，写进了 manifest 的 icons 和 action.default_icon`, `✓ Made ${Object.values(icons).join(" ")} and added them to the manifest's icons and action.default_icon`));
  },
  pack: async ({ cwd, targets }) => {
    const out = targets[0] || resolve(cwd, "packs");
    // 每个包的 prepack 会先构建（@xxd/react 要求 Kumo 已经构建过：pnpm --filter @cloudflare/kumo build）
    const files = pack(out);
    console.log(say(`✓ 打好了 ${files.length} 个包 → ${out}\n  ${files.join("\n  ")}\n\n在你的项目里：npm install ${relative(cwd, out) || "."}/*.tgz`, `✓ Packed ${files.length} packages → ${out}\n  ${files.join("\n  ")}\n\nIn your project: npm install ${relative(cwd, out) || "."}/*.tgz`));
  },
  add: async ({ cmd, rest, cwd }) => {
    const kumoCli = join(repo, "packages/kumo/dist/command-line/cli.js");
    if (!existsSync(kumoCli)) throw new Error(say("先构建 React 组件库：pnpm --filter @cloudflare/kumo build", "Build the React library first: pnpm --filter @cloudflare/kumo build"));
    execFileSync("node", [kumoCli, cmd, ...rest], { stdio: "inherit", cwd });
  },
  build: async () => {
    await buildAll();
  },
  link: async () => {
    console.log(link());
  },
};
/** 别名 → 命令 */
export const ALIASES = { "--help": "help", "-h": "help", "check": "doctor", "icons": "icon", "blocks": "add" };

async function main() {
  // 命令是第一个不以 - 开头的词（--en / --zh 写在前面也行）
  const argv = process.argv.slice(2);
  const at = argv.findIndex((a) => !a.startsWith("-"));
  const cmd = at === -1 ? "help" : argv[at];
  const rest = at === -1 ? argv : [...argv.slice(0, at), ...argv.slice(at + 1)];
  const args = parseArgs(rest);
  if (args.en) setLang("en");
  else if (args.zh) setLang("zh");
  // pnpm 在仓库根目录执行脚本；相对路径按调用者的目录解析
  const cwd = process.env.INIT_CWD || process.cwd();
  const targets = args._.map((t) => resolve(cwd, t.replace(/^~(?=\/|$)/, homedir())));
  if (args.help && cmd !== "help") return console.log(help(ALIASES[cmd] ?? cmd));
  const name = ALIASES[cmd] ?? cmd;
  const handler = Object.hasOwn(HANDLERS, name) ? HANDLERS[name] : null;
  if (!handler) {
    console.log(unknown(cmd));
    process.exitCode = 1;
    return;
  }
  await handler({ cmd, args, rest, cwd, targets });
}

const invokedDirectly = (() => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().catch((err) => {
    console.error(`${c.red("✗")} ${err.message}`);
    process.exit(1);
  });
}
