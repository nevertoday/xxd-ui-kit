// 小程序（@xxd/mini，Taro + React）：xxd-ui new-mini 新建项目，xxd-ui doctor 的小程序规则。
// docs/maintainers/MINIPROGRAM-PLAN.md §11、M4。
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { say } from "./lang.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../..");
const TEMPLATE = resolve(here, "../../template-mini");

/** 这个目录是不是 Taro 小程序项目 */
export function isMiniProject(dir) {
  if (existsSync(join(dir, "project.config.json")) && existsSync(join(dir, "src/app.config.ts"))) return true;
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    return Boolean(pkg.dependencies?.["@tarojs/taro"] || pkg.dependencies?.["@xxd/mini"]);
  } catch {
    return false;
  }
}

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "xxd-mini-app";

/**
 * 新建一个小程序项目：拷 template-mini，把 @xxd/mini / @xxd/tokens / @xxd/icons 打成包放进 vendor/（和插件的 vendor/xxd 一个道理：
 * 项目自己带着组件，普通的 npm / pnpm install 就能装，不用软链到 xxd-ui-kit）。
 * pack 可以换掉（测试里不真的打包）。
 */
export function createMini(target, { name, nameEn, slug, pack = packMini } = {}) {
  const dir = resolve(target);
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(say(`${dir} 已存在且不为空`, `${dir} already exists and isn't empty`));
  if (!name) throw new Error(say("需要 --name（几个朴素的字说清它做什么，比如「今日待办」）", "--name is required (a few plain words saying what it does, like “Today”)"));
  const id = slug ? slugify(slug) : slugify(nameEn || basename(dir));
  mkdirSync(dir, { recursive: true });
  cpSync(TEMPLATE, dir, { recursive: true });
  renameSync(join(dir, "gitignore"), join(dir, ".gitignore"));
  const vendor = join(dir, "vendor");
  mkdirSync(vendor, { recursive: true });
  const files = pack(vendor);
  const dep = (pkg) => {
    const f = files.find((x) => x.startsWith(`xxd-${pkg}-`));
    if (!f) throw new Error(say(`没打出 @xxd/${pkg} 的包`, `Couldn't pack @xxd/${pkg}`));
    return `file:vendor/${f}`;
  };
  const values = { __APP_NAME_EN__: nameEn || name, __APP_NAME__: name, __SLUG__: id, __DEP_MINI__: dep("mini"), __DEP_TOKENS__: dep("tokens"), __DEP_ICONS__: dep("icons") };
  const fill = (p) => {
    const st = statSync(p);
    if (st.isDirectory()) return readdirSync(p).forEach((n) => n !== "vendor" && fill(join(p, n)));
    if (!/\.(json|ts|tsx|css|html|md|cjs|yaml)$|^\.gitignore$/.test(basename(p))) return;
    let text = readFileSync(p, "utf8");
    for (const [k, v] of Object.entries(values)) text = text.split(k).join(v);
    writeFileSync(p, text);
  };
  fill(dir);
  return { dir, vendor: files };
}

/** 打包 @xxd/tokens、@xxd/icons、@xxd/mini（各自的 prepack 会先构建） */
export function packMini(out) {
  const made = [];
  for (const pkg of ["xxd-tokens", "xxd-icons", "xxd-mini"]) {
    const text = execFileSync("pnpm", ["pack", "--pack-destination", out], { cwd: join(repo, "packages", pkg), encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
    const file = text.trim().split("\n").reverse().find((l) => l.trim().endsWith(".tgz"));
    made.push(basename((file || pkg).trim()));
  }
  return made;
}

/* ───────────── 体检 ───────────── */

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const firstExisting = (dir, names) => names.map((n) => join(dir, n)).find((p) => existsSync(p));
const lineAt = (text, index) => text.slice(0, index).split("\n").length;

function sourceFiles(dir, re, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    if (n === "node_modules" || n.startsWith(".")) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) sourceFiles(p, re, out);
    else if (re.test(n)) out.push(p);
  }
  return out;
}

function dirSize(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    n += st.isDirectory() ? dirSize(p) : st.size;
  }
  return n;
}

/** WXSS 不支持的选择器（只看选择器部分） */
export function checkWxss(css) {
  const out = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  for (const m of text.matchAll(/([^{}]+)\{/g)) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith("@")) continue;
    const line = lineAt(text, m.index + m[1].indexOf(sel));
    if (/\[[^\]]*\]/.test(sel)) out.push({ line, message: say(`${sel.slice(0, 50)} —— 小程序不支持属性选择器，换成类名（.is-active 这样）`, `${sel.slice(0, 50)} — mini programs don't support attribute selectors; use a class (like .is-active)`) });
    if (/(^|[\s,>+~])\*(?=[\s,>+~:.]|$)/.test(sel)) out.push({ line, message: say(`${sel.slice(0, 50)} —— 小程序（Skyline）不支持通配符 *`, `${sel.slice(0, 50)} — mini programs (Skyline) don't support the * selector`) });
    if (/:root\b/.test(sel)) out.push({ line, message: say(`${sel.slice(0, 50)} —— 小程序没有 :root，页面根是 page（令牌已经在 @xxd/mini/tokens.css 里了）`, `${sel.slice(0, 50)} — mini programs have no :root; the page root is page (the tokens are already in @xxd/mini/tokens.css)`) });
    if (/:hover\b/.test(sel)) out.push({ line, message: say(`${sel.slice(0, 50)} —— 手机上没有悬停：用组件的 hoverClass（按下时的类名）`, `${sel.slice(0, 50)} — there's no hover on phones: use the component's hoverClass (the pressed class)`) });
  }
  return out;
}

/**
 * 小程序项目的体检。返回 [{ rule, level, file, line?, message }]，和 doctor 的其他规则同一个格式。
 *   mini   接入：taro-plugin、XxdProvider / XxdPage、暗色、最低基础库、px 不换算、theme.json
 *   wxss   WXSS 不支持的选择器
 *   size   主包体积、产物里的 rpx
 *   nav    自定义导航栏的页面没用 NavBar（不给胶囊按钮让位）
 *   a11y   只有图标、没有 label 的按钮
 */
export function checkMini(dir) {
  const out = [];
  const add = (rule, level, file, message, line) => out.push({ rule, level, file, message, ...(line ? { line } : {}) });
  const configFile = firstExisting(dir, ["config/index.ts", "config/index.js"]);
  // 去掉注释再查（模板的注释里就写着 @xxd/mini/taro-plugin、theme.json）
  const stripComments = (t) => t && t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/[^\n]*/g, "$1");
  const config = configFile && stripComments(read(configFile));
  if (!config) add("mini", "error", join(dir, "config"), say("没有 config/index.ts（不是 Taro 项目？）", "No config/index.ts (not a Taro project?)"));
  else {
    if (!/@xxd\/mini\/taro-plugin/.test(config)) add("mini", "error", configFile, say('plugins 里没有 "@xxd/mini/taro-plugin" —— 微信版的读屏属性（aria-*）会被丢掉', 'plugins doesn\'t include "@xxd/mini/taro-plugin" — screen reader attributes (aria-*) get dropped in the WeChat build'));
    const mini = config.match(/mini\s*:\s*\{[\s\S]*?pxtransform\s*:\s*\{([^}]*)\}/);
    if (!mini || !/enable\s*:\s*false/.test(mini[1])) add("mini", "warn", configFile, say("mini.postcss.pxtransform 没关：你写的 px 会被换成 rpx，和 @xxd/mini 的尺寸对不上（加 enable: false）", "mini.postcss.pxtransform is on: your px get turned into rpx and won't match @xxd/mini's sizes (add enable: false)"));
    if (!/@xxd\/mini\/styles\/theme\.json/.test(config)) add("mini", "warn", configFile, say("没把 @xxd/mini/styles/theme.json 拷进产物（copy.patterns）—— 跟随系统暗色时导航栏颜色不对", "@xxd/mini/styles/theme.json isn't copied into the build (copy.patterns) — the nav bar colors are wrong in system dark mode"));
  }
  const appConfigFile = firstExisting(dir, ["src/app.config.ts", "src/app.config.js"]);
  const appConfig = appConfigFile && stripComments(read(appConfigFile));
  if (appConfig) {
    if (!/darkmode\s*:\s*true/.test(appConfig)) add("mini", "error", appConfigFile, say("app.config 没开 darkmode: true —— 跟随系统暗色不生效", "app.config doesn't set darkmode: true — following the system dark mode won't work"));
    if (!/themeLocation\s*:/.test(appConfig)) add("mini", "error", appConfigFile, say('app.config 没写 themeLocation: "theme.json"', 'app.config is missing themeLocation: "theme.json"'));
  }
  const project = read(join(dir, "project.config.json"));
  if (project) {
    let lib = null;
    try {
      lib = JSON.parse(project).libVersion;
    } catch {
      add("mini", "error", join(dir, "project.config.json"), say("project.config.json 不是合法的 JSON", "project.config.json isn't valid JSON"));
    }
    const [major] = String(lib || "0").split(".").map(Number);
    if (!lib || major < 3) add("mini", "warn", join(dir, "project.config.json"), say(`最低基础库写的是 ${lib || "（没写）"} —— @xxd/mini 要 3.0.0 以上（root-portal、暗色、读屏属性）`, `The minimum base library is ${lib || "(not set)"} — @xxd/mini needs 3.0.0+ (root-portal, dark mode, screen reader attributes)`));
  }
  const app = read(firstExisting(dir, ["src/app.tsx", "src/app.jsx", "src/app.ts", "src/app.js"]) || "");
  if (app != null && !/<XxdProvider\b/.test(app)) add("mini", "warn", join(dir, "src/app.tsx"), say("app.tsx 没包 <XxdProvider> —— 外观设置、轻提示不生效", "app.tsx doesn't wrap <XxdProvider> — appearance settings and toasts won't work"));

  // 每一页：根是 XxdPage；自定义导航栏的要用 NavBar
  for (const file of sourceFiles(join(dir, "src/pages"), /^index\.(tsx|jsx)$/)) {
    const text = read(file);
    if (!/<XxdPage\b/.test(text)) add("mini", "warn", file, say("这一页的根不是 <XxdPage> —— 外观变量、安全区、轻提示都没有", "This page's root isn't <XxdPage> — no appearance variables, safe area or toasts"));
    const pageConfig = read(file.replace(/index\.(tsx|jsx)$/, "index.config.ts")) || "";
    if (/navigationStyle\s*:\s*["']custom["']/.test(pageConfig) && !/<NavBar\b/.test(text)) add("nav", "warn", file, say("这一页用了自定义导航栏，但没用 <NavBar> —— 右上角的胶囊按钮会盖住内容", "This page uses a custom nav bar but no <NavBar> — the capsule button will cover the content"));
  }
  // 标签栏（MINI-REVIEW-PLAN D26）：页面里自己放 TabBar、用 redirectTo 切页，每切一次整页重载
  for (const file of sourceFiles(join(dir, "src/pages"), /\.(tsx|jsx)$/)) {
    if (/<TabBar\b/.test(read(file))) add("tabbar", "warn", file, say("页面里自己放了 <TabBar>：切页会整页重载、丢掉滚动位置。用小程序自带的 tabBar（custom: true），在 src/custom-tab-bar/index.tsx 里放 <TabBarHost items={TABS} />，页面写 <XxdPage tabBar={TABS}>", "This page renders its own <TabBar>: switching tabs reloads the whole page and loses the scroll position. Use the built-in tabBar (custom: true), put <TabBarHost items={TABS} /> in src/custom-tab-bar/index.tsx and write <XxdPage tabBar={TABS}> on the page"));
  }
  if (appConfig && /tabBar\s*:\s*\{[\s\S]*?custom\s*:\s*true/.test(appConfig)) {
    const host = read(firstExisting(dir, ["src/custom-tab-bar/index.tsx", "src/custom-tab-bar/index.jsx"]) || "");
    if (!host || !/<TabBarHost\b/.test(host)) add("tabbar", "warn", join(dir, "src/custom-tab-bar/index.tsx"), say("app.config 的 tabBar 开了 custom，但 src/custom-tab-bar 里没有 <TabBarHost> —— 底部不会出现标签栏", "app.config turns on tabBar.custom, but src/custom-tab-bar has no <TabBarHost> — no tab bar will show"));
  }
  if (appConfig && /navigationStyle\s*:\s*["']custom["']/.test(appConfig)) {
    for (const file of sourceFiles(join(dir, "src/pages"), /^index\.(tsx|jsx)$/)) if (!/<NavBar\b/.test(read(file))) add("nav", "warn", file, say("整个小程序是自定义导航栏，这一页没用 <NavBar>", "The whole app uses a custom nav bar, but this page has no <NavBar>"));
  }

  // 源码：WXSS 选择器；只有图标的按钮
  for (const file of sourceFiles(join(dir, "src"), /\.(css|scss|less)$/)) for (const f of checkWxss(read(file))) add("wxss", "error", file, f.message, f.line);
  for (const file of sourceFiles(join(dir, "src"), /\.(tsx|jsx)$/)) {
    const text = read(file);
    for (const m of text.matchAll(/<Button\b([^>]*?)\/>/g)) {
      if (/\bicon=/.test(m[1]) && !/\blabel=/.test(m[1])) add("a11y", "error", file, say("只有图标的按钮要写 label（读屏要念出来）", "An icon-only button needs a label (screen readers read it out)"), lineAt(text, m.index));
    }
  }

  // 产物：主包体积、rpx
  const dist = join(dir, "dist");
  if (existsSync(join(dist, "app.json"))) {
    const size = dirSize(dist);
    const kb = Math.round(size / 1024);
    if (size > 2 * 1024 * 1024) add("size", "error", dist, say(`主包 ${kb} KB，超过微信的 2 MB 上限 —— 拆分包，或者少引几个组件`, `The main package is ${kb} KB, over WeChat's 2 MB limit — split it into subpackages or import fewer components`));
    else if (size > 1.5 * 1024 * 1024) add("size", "warn", dist, say(`主包 ${kb} KB，快到 2 MB 上限了`, `The main package is ${kb} KB, close to the 2 MB limit`));
    for (const file of sourceFiles(dist, /\.wxss$/)) if (/\d(\.\d+)?rpx\b/.test(read(file))) add("size", "error", file, say("产物里有 rpx：px 被换算了（mini.postcss.pxtransform 要关）", "The build has rpx: px got converted (turn off mini.postcss.pxtransform)"));
  }
  return out;
}

