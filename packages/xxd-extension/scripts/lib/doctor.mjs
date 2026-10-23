// xxd doctor：检查一个插件、网站或小程序。四类问题（小程序另有自己的规则，见 mini.mjs 的 checkMini）：
//   接入  vendor/xxd 有没有、是不是最新、页面引用的文件在不在、manifest 和 _locales 对不对得上
//   MV3   内联脚本、远程代码、eval、权限太宽、商店字数限制、图标尺寸、内容脚本的依赖顺序
//   拼写  图标名、xxd- 类名有没有拼错（拼错了界面上什么都不显示，也不报错）；有 _locales 时写死的中文
//   规则  DESIGN-PRINCIPLES 里能机器检查的：写死的颜色、阴影、字重、圆角、动效、衬线 / 网络字体
// 某一行确实要例外：在那一行写 xxd-ignore（CSS 注释或 HTML 注释都行）；整条规则不查：xxd.config.json 写 { "doctor": { "ignore": ["color"] } }。
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { iconName, iconSuggestions, knownClasses } from "./find.mjs";
import { say } from "./lang.mjs";
import { checkMini, isMiniProject } from "./mini.mjs";
import { suggest } from "./term.mjs";

const SKIP_DIRS = /^(node_modules|\.git|dist|build|out|coverage|vendor|\.wrangler|\.astro|\.next|\.cache|test-results|playwright-report)$/;

const LABELS = {
  setup: ["接入", "setup"],
  missing: ["文件不在", "missing file"],
  manifest: ["manifest", "manifest"],
  mv3: ["MV3", "MV3"],
  locale: ["多语言", "languages"],
  i18n: ["写死的文字", "hard-coded text"],
  icon: ["图标名", "icon name"],
  class: ["类名", "class name"],
  color: ["写死的颜色", "hard-coded color"],
  shadow: ["阴影", "shadow"],
  weight: ["字重", "weight"],
  radius: ["圆角", "radius"],
  motion: ["动效", "motion"],
  font: ["字体", "font"],
  mini: ["小程序接入", "mini program setup"],
  wxss: ["WXSS", "WXSS"],
  size: ["体积", "size"],
  nav: ["导航栏", "nav bar"],
  a11y: ["读屏", "screen reader"],
};
/** 规则 id → 这种语言的名字（RULES.color 等，给命令行显示）。 */
export const RULES = new Proxy(LABELS, { get: (t, k) => (t[k] ? say(t[k][0], t[k][1]) : undefined) });

const CJK = /[㐀-鿿豈-﫿]/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") && name !== ".") continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.test(name)) walk(p, out);
    } else if (/\.(html?|css|m?js|jsx|tsx?|astro|vue|svelte)$/.test(name) && !/\.min\.(js|css)$|\.[a-f0-9]{8,}\.(js|css)$/.test(name) && st.size < 2_000_000) out.push(p);
  }
  return out;
}

const lineStarts = (text) => {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text[i] === "\n") starts.push(i + 1);
  return starts;
};
const lineOf = (starts, index) => {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
};
// 注释和 xxd 生成的令牌区换成空格（保留换行，行号不变）
const blank = (s) => s.replace(/[^\n]/g, " ");
const stripCss = (css) => css.replace(/\/\* xxd:tokens:start[\s\S]*?xxd:tokens:end \*\//g, blank).replace(/\/\*[\s\S]*?\*\//g, blank);
// JS 的注释换成空格（// 前面要是行首或空白，免得吃掉 https://）
const stripJs = (js) => js.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
const stripHtmlComments = (html) => html.replace(/<!--[\s\S]*?-->/g, blank);

const OVERLAY = /popover|menu|dropdown|dialog|modal|toast|tooltip|overlay|sheet|drawer|popup|lightbox|palette|command/i;

/** 检查一段 CSS（也用于 <style> 和 .astro / .vue 里的样式）。返回 [{ rule, line, message }]。 */
export function checkCss(css) {
  const out = [];
  const text = stripCss(css);
  const starts = lineStarts(text);
  const stack = [];
  let buf = "";
  let bufStart = 0;
  const decl = (raw, at) => {
    const i = raw.indexOf(":");
    if (i < 0) return;
    const prop = raw.slice(0, i).trim().toLowerCase();
    const value = raw.slice(i + 1).replace(/!important/g, "").trim();
    if (!prop || prop.startsWith("--") || !/^[a-z-]+$/.test(prop)) return;
    const sel = ([...stack].reverse().find((s) => !s.startsWith("@")) || "").replace(/\s+/g, " ");
    const atRule = stack.find((s) => s.startsWith("@font-face"));
    const line = lineOf(starts, at + (raw.length - raw.trimStart().length));
    const add = (rule, message) => out.push({ rule, line, message });
    if (atRule) return;
    // 颜色：去掉 var(--x, 后备值) 里的后备值再看；rgba(var(--ink-rgb), .5) 这类用的也是令牌
    const bare = value.replace(/var\(\s*--[\w-]+\s*,[^()]*(\([^()]*\)[^()]*)*\)/g, "").replace(/url\([^)]*\)/g, "").replace(/\b(?:rgba?|hsla?)\(\s*var\([^)]*\)[^)]*\)/g, "");
    const color = bare.match(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/i);
    if (color && !/^(?:mask|-webkit-mask|filter|box-shadow|text-shadow)/.test(prop)) add("color", say(`${prop}: ${value.slice(0, 48)} —— 颜色用令牌（var(--ink)、--muted、--line、--action…）`, `${prop}: ${value.slice(0, 48)} — use a token for colors (var(--ink), --muted, --line, --action…)`));
    // 阴影：整个值是一个令牌（var(--focus-ring)）、焦点环（:focus）、只有扩散没有模糊的描边，都不算
    if (prop === "box-shadow" && !/^(none|0|inherit|initial|unset)$/.test(value) && !/^var\(--[\w-]+\)$/.test(value) && !/var\(--shadow-/.test(value) && !/:focus/.test(sel)) {
      const ring = /^(inset\s+)?0(px)?\s+0(px)?\s+0(px)?\s/.test(value);
      if (!ring && !OVERLAY.test(sel)) add("shadow", say(`${sel.slice(0, 40)} 有阴影 —— 卡片、行、按钮不加阴影；浮层用 var(--shadow-popover / dialog / sheet)`, `${sel.slice(0, 40)} has a shadow — no shadows on cards, rows or buttons; overlays use var(--shadow-popover / dialog / sheet)`));
      else if (!ring) add("shadow", say(`${sel.slice(0, 40)} 的阴影写死了 —— 用 var(--shadow-popover / dialog / sheet)，暗色下会自动变深`, `${sel.slice(0, 40)} has a hard-coded shadow — use var(--shadow-popover / dialog / sheet); it deepens in dark mode`));
    }
    if (prop === "font-weight" && /^(700|800|900|bold|bolder|100|200|300|lighter)$/.test(value)) add("weight", say(`font-weight: ${value} —— 字重只有 400 / 500 / 600（var(--weight-medium) 等）`, `font-weight: ${value} — weights are 400 / 500 / 600 only (var(--weight-medium) etc.)`));
    if (/^border(-[a-z]+)*-radius$/.test(prop) && !/var\(--r-/.test(value) && !/^(0|0px|inherit|initial|unset)$/.test(value)) {
      const circle = /50%|999+px/.test(value);
      add("radius", say(`${prop}: ${value} —— ${circle ? "圆用 var(--r-circle)，胶囊用 var(--r-pill)" : "圆角只用 var(--r-xs / sm / md / lg / pill)"}`, `${prop}: ${value} — ${circle ? "circles use var(--r-circle), pills var(--r-pill)" : "radii use var(--r-xs / sm / md / lg / pill) only"}`));
    }
    if (/^transition(-property)?$/.test(prop) && /\b(all|width|height|max-height|min-height|top|left|right|bottom|margin[a-z-]*|padding[a-z-]*|inset)\b/.test(value)) add("motion", say(`${prop}: ${value.slice(0, 40)} —— 动效只动 opacity / transform`, `${prop}: ${value.slice(0, 40)} — animate opacity / transform only`));
    if (prop === "font-family" && !/var\(--font-/.test(value) && (/(^|[\s,"'])serif\b/.test(value.replace(/sans-serif/g, "")) || /宋体|simsun|songti|georgia|times|garamond|mincho/i.test(value))) add("font", say(`font-family: ${value.slice(0, 40)} —— 只用系统无衬线（var(--font-body)）`, `font-family: ${value.slice(0, 40)} — system sans-serif only (var(--font-body))`));
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") {
      const sel = buf.trim();
      if (sel.startsWith("@font-face")) out.push({ rule: "font", line: lineOf(starts, bufStart + (buf.length - buf.trimStart().length)), message: say("@font-face —— 不加载网络字体，只用系统无衬线", "@font-face — no web fonts, system sans-serif only") });
      stack.push(sel);
      buf = "";
      bufStart = i + 1;
    } else if (ch === "}") {
      if (buf.trim()) decl(buf, bufStart);
      stack.pop();
      buf = "";
      bufStart = i + 1;
    } else if (ch === ";") {
      const s = buf.trim();
      if (/^@import\b/.test(s) && /fonts\.(googleapis|gstatic)|typekit|fonts\.bunny/.test(s)) out.push({ rule: "font", line: lineOf(starts, bufStart), message: say("网络字体 —— 只用系统无衬线", "Web font — system sans-serif only") });
      else if (stack.length) decl(buf, bufStart);
      buf = "";
      bufStart = i + 1;
    } else buf += ch;
  }
  return out;
}

/** 检查 HTML / JS 里的图标名和 xxd- 类名。 */
export function checkMarkup(text, { classes = knownClasses() } = {}) {
  const out = [];
  const starts = lineStarts(text);
  for (const re of [/data-xxd-icon\s*=\s*["']([A-Za-z0-9]+)["']/g, /iconSVG\(\s*["']([A-Za-z0-9]+)["']/g, /<Icon\b[^>]*\bname\s*=\s*["']([A-Za-z0-9]+)["']/g]) {
    for (const m of text.matchAll(re)) {
      if (iconName(m[1])) continue;
      const near = iconSuggestions(m[1]);
      out.push({ rule: "icon", level: "error", line: lineOf(starts, m.index), message: say(`没有叫 ${m[1]} 的图标${near.length ? `，是不是 ${near.join(" / ")}` : ""}（按关键词查：icon 命令）`, `There's no icon called ${m[1]}${near.length ? ` — did you mean ${near.join(" / ")}?` : ""} (search by keyword with the icon command)`) });
    }
  }
  const seen = new Set();
  const checkTokens = (str, index) => {
    for (const tok of str.split(/[\s,'"`]+/)) {
      if (!/^xxd-[a-z0-9_-]+$/.test(tok) || classes.has(tok) || seen.has(tok)) continue;
      seen.add(tok);
      // 比较时去掉共同的 xxd- 前缀，否则什么都「像」
      const near = suggest(tok.slice(4), [...classes].map((x) => x.slice(4)), 2).map((x) => `xxd-${x}`);
      out.push({ rule: "class", line: lineOf(starts, index), message: say(`类名 ${tok} 在 @xxd/css 里不存在${near.length ? `，是不是 ${near.join(" / ")}` : ""}`, `@xxd/css has no class ${tok}${near.length ? ` — did you mean ${near.join(" / ")}?` : ""}`) });
    }
  };
  for (const m of text.matchAll(/\bclass(?:Name)?\s*=\s*(["'`])([^"'`]*)\1/g)) checkTokens(m[2].replace(/\$\{[^}]*\}/g, " ").replace(/\S*\$\{\S*/g, " "), m.index);
  for (const m of text.matchAll(/classList\.(?:add|remove|toggle|contains)\(([^)]*)\)/g)) checkTokens(m[1], m.index);
  return out;
}

/**
 * 有 _locales 的项目里写死的中文（换成英文界面时还是中文，读屏也念中文）：
 *   HTML：aria-label / title / placeholder / alt 里有中文，且没有 data-i18n-attr 管这个属性；文字里有中文，且外层元素没有 data-i18n。
 *   JS：字符串里有中文（注释不算）。
 */
export function checkI18n(text, { html = false } = {}) {
  const out = [];
  const starts = lineStarts(text);
  const add = (index, message) => out.push({ rule: "i18n", line: lineOf(starts, index), message });
  if (html) {
    const src = stripHtmlComments(text).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, blank);
    for (const m of src.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
      const attrs = m[2];
      const covered = attrs.match(/data-i18n-attr\s*=\s*["']([^"']*)["']/)?.[1] ?? "";
      for (const a of attrs.matchAll(/\b(aria-label|title|placeholder|alt|data-tooltip|data-confirm-twice)\s*=\s*["']([^"']*)["']/g)) {
        if (CJK.test(a[2]) && !new RegExp(`\\b${a[1]}\\s*:`).test(covered)) add(m.index, say(`${a[1]}="${a[2].slice(0, 20)}" 写死了中文 —— 用 data-i18n-attr="${a[1]}:键名"`, `${a[1]}="${a[2].slice(0, 20)}" is hard-coded Chinese — use data-i18n-attr="${a[1]}:key"`));
      }
    }
    // 文字：找「开始标签 文字」，开始标签上没有 data-i18n 就算写死
    for (const m of src.matchAll(/<([a-z][\w-]*)\b([^>]*)>([^<]+)/gi)) {
      const words = m[3].trim();
      if (!words || !CJK.test(words) || /\bdata-i18n\s*=/.test(m[2]) || /^(title|option)$/i.test(m[1]) && /data-i18n/.test(m[2])) continue;
      add(m.index, say(`「${words.slice(0, 16)}」写死了中文 —— 外层元素加 data-i18n="键名"，文字放进 _locales`, `“${words.slice(0, 16)}” is hard-coded Chinese — add data-i18n="key" to the element and put the text in _locales`));
    }
    return out;
  }
  const src = stripJs(text);
  for (const m of src.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    if (!CJK.test(m[2])) continue;
    add(m.index, say(`字符串「${m[2].slice(0, 16)}」写死了中文 —— 用 t("键名")（XxdExtension.t / chrome.i18n.getMessage）`, `String “${m[2].slice(0, 16)}” is hard-coded Chinese — use t("key") (XxdExtension.t / chrome.i18n.getMessage)`));
  }
  return out;
}

/** MV3 不允许或不该有的写法（插件自己的 HTML / JS）。 */
export function checkMv3(text, { html = false } = {}) {
  const out = [];
  const starts = lineStarts(text);
  const add = (index, message) => out.push({ rule: "mv3", level: "error", line: lineOf(starts, index), message });
  if (html) {
    const src = stripHtmlComments(text);
    for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = m[1];
      if (/\bsrc\s*=\s*["']\s*(https?:)?\/\//i.test(attrs)) add(m.index, say("远程脚本 —— MV3 不能加载远程代码，把文件拷进插件", "Remote script — MV3 can't load remote code; copy the file into the extension"));
      else if (!/\bsrc\s*=/.test(attrs) && m[2].trim() && !/type\s*=\s*["'](application\/(ld\+)?json|text\/template|importmap)["']/i.test(attrs)) add(m.index, say("内联 <script> —— MV3 的 CSP 不执行它，挪到单独的 .js 文件", "Inline <script> — MV3's CSP won't run it; move it into a .js file"));
    }
    for (const m of src.matchAll(/<[a-z][^>]*\s(on[a-z]+)\s*=\s*["']/gi)) add(m.index, say(`${m[1]}= 内联事件 —— MV3 不执行，改用 addEventListener`, `Inline ${m[1]}= handler — MV3 won't run it; use addEventListener`));
    for (const m of src.matchAll(/\b(?:href|src|action)\s*=\s*["']\s*javascript:/gi)) add(m.index, say("javascript: 地址 —— MV3 不执行", "javascript: URL — MV3 won't run it"));
    return out;
  }
  const src = stripJs(text);
  for (const m of src.matchAll(/(?<![\w.$])(eval|new\s+Function)\s*\(/g)) add(m.index, say(`${m[1].replace(/\s+/, " ")}() —— MV3 的 CSP 不允许`, `${m[1].replace(/\s+/, " ")}() — not allowed by MV3's CSP`));
  for (const m of src.matchAll(/\b(setTimeout|setInterval)\s*\(\s*["'`]/g)) add(m.index, say(`${m[1]} 传了字符串 —— 等于 eval，改成函数`, `${m[1]} with a string is eval — pass a function`));
  for (const m of src.matchAll(/\bimport\s*\(\s*["'`]https?:\/\//g)) add(m.index, say("import() 远程模块 —— MV3 不能加载远程代码", "import() of a remote module — MV3 can't load remote code"));
  return out;
}

const ignoredLine = (text, line) => /xxd-ignore/.test(text.split("\n")[line - 1] || "");

/** PNG 的宽高（读文件头）；不是 PNG 返回 null。 */
function pngSize(file) {
  try {
    const buf = readFileSync(file);
    if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  } catch {
    return null;
  }
}

function checkManifest(dir, { skipVendor = false, bin }) {
  const out = [];
  const file = join(dir, "manifest.json");
  let m;
  try {
    m = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    return { findings: [{ rule: "manifest", level: "error", file, message: say(`manifest.json 不是合法的 JSON：${err.message}`, `manifest.json isn't valid JSON: ${err.message}`) }], messages: {}, manifest: null };
  }
  const add = (rule, level, message) => out.push({ rule, level, file, message });
  if (m.manifest_version !== 3) add("manifest", "warn", say(`manifest_version 是 ${m.manifest_version} —— Chrome 只收 MV3`, `manifest_version is ${m.manifest_version} — Chrome only accepts MV3`));
  if (!m.icons || !Object.keys(m.icons).length) add("manifest", "warn", say(`还没有 icons —— 上架前补上 16 / 32 / 48 / 128（${bin} store-icons 可以生成）`, `No icons yet — add 16 / 32 / 48 / 128 before publishing (${bin} store-icons can make them)`));
  const refs = [];
  const push = (v, what) => v && refs.push([v, what]);
  for (const v of Object.values(m.icons || {})) push(v, "icons");
  const di = m.action?.default_icon;
  for (const v of typeof di === "string" ? [di] : Object.values(di || {})) push(v, "action.default_icon");
  push(m.background?.service_worker, "background.service_worker");
  push(m.side_panel?.default_path, "side_panel.default_path");
  push(m.options_page || m.options_ui?.page, "options");
  push(m.action?.default_popup, "action.default_popup");
  for (const cs of m.content_scripts || []) for (const f of [...(cs.js || []), ...(cs.css || [])]) push(f, "content_scripts");
  for (const w of m.web_accessible_resources || []) for (const f of w.resources || []) if (!/[*]/.test(f)) push(f, "web_accessible_resources");
  for (const [rel, what] of refs) if (!existsSync(join(dir, rel)) && !(skipVendor && /(^|\/)vendor\/xxd\//.test(rel))) add("missing", "error", say(`${what} 指向的 ${rel} 不存在`, `${what} points to ${rel}, which doesn't exist`));
  // 图标的实际尺寸和声明的一样
  for (const [size, rel] of Object.entries(m.icons || {})) {
    const real = pngSize(join(dir, rel));
    if (real && (real[0] !== Number(size) || real[1] !== Number(size))) add("mv3", "warn", say(`icons.${size} 是 ${real[0]}×${real[1]} 的图 —— 应当是 ${size}×${size}`, `icons.${size} is ${real[0]}×${real[1]} — it should be ${size}×${size}`));
  }
  // 多语言
  const locales = existsSync(join(dir, "_locales")) ? readdirSync(join(dir, "_locales")).filter((l) => existsSync(join(dir, "_locales", l, "messages.json"))) : [];
  if (m.default_locale && !locales.includes(m.default_locale)) add("locale", "error", say(`default_locale 是 ${m.default_locale}，但 _locales/${m.default_locale}/messages.json 不存在`, `default_locale is ${m.default_locale}, but _locales/${m.default_locale}/messages.json doesn't exist`));
  if (!m.default_locale && locales.length) add("locale", "error", say("有 _locales 但 manifest 没写 default_locale —— Chrome 会拒绝加载", "There's a _locales folder but no default_locale in the manifest — Chrome will refuse to load it"));
  const messages = {};
  for (const l of locales) {
    try {
      messages[l] = JSON.parse(readFileSync(join(dir, "_locales", l, "messages.json"), "utf8"));
    } catch (err) {
      add("locale", "error", say(`_locales/${l}/messages.json 不是合法的 JSON：${err.message}`, `_locales/${l}/messages.json isn't valid JSON: ${err.message}`));
    }
  }
  const used = [...JSON.stringify(m).matchAll(/__MSG_(\w+)__/g)].map((x) => x[1]);
  for (const key of new Set(used)) for (const l of Object.keys(messages)) if (!messages[l][key]) add("locale", l === m.default_locale ? "error" : "warn", say(`manifest 用了 __MSG_${key}__，_locales/${l} 里没有`, `The manifest uses __MSG_${key}__, but _locales/${l} doesn't have it`));
  const base = messages[m.default_locale];
  if (base) {
    for (const l of Object.keys(messages)) {
      if (l === m.default_locale) continue;
      const missing = Object.keys(base).filter((k) => !messages[l][k]);
      if (missing.length) add("locale", "warn", say(`_locales/${l} 比 ${m.default_locale} 少 ${missing.length} 条：${missing.slice(0, 5).join(" ")}${missing.length > 5 ? " …" : ""}`, `_locales/${l} has ${missing.length} fewer entries than ${m.default_locale}: ${missing.slice(0, 5).join(" ")}${missing.length > 5 ? " …" : ""}`));
    }
  }
  // 商店的字数限制（按每种语言展开 __MSG__ 后算）
  const expand = (v, l) => String(v ?? "").replace(/__MSG_(\w+)__/g, (_, k) => messages[l]?.[k]?.message ?? messages[m.default_locale]?.[k]?.message ?? "");
  const LIMITS = [["name", 75], ["short_name", 12], ["description", 132]];
  for (const l of locales.length ? Object.keys(messages) : [null]) {
    for (const [field, max] of LIMITS) {
      if (m[field] == null) continue;
      const text = l ? expand(m[field], l) : String(m[field]);
      if ([...text].length > max) add("mv3", "error", say(`${field}${l ? `（${l}）` : ""} 有 ${[...text].length} 个字 —— 商店最多 ${max} 个`, `${field}${l ? ` (${l})` : ""} is ${[...text].length} characters — the store allows at most ${max}`));
    }
  }
  // 权限太宽
  const hosts = [...(m.host_permissions || []), ...(m.permissions || []).filter((p) => /[:/*]/.test(p) || p === "<all_urls>")];
  for (const h of hosts) if (h === "<all_urls>" || /^(\*|https?):\/\/\*\/\*$/.test(h)) add("mv3", "warn", say(`权限 ${h} 覆盖所有网站 —— 能用 activeTab 或 optional_host_permissions 就别要这么宽（审核会问）`, `Permission ${h} covers every site — prefer activeTab or optional_host_permissions (review will ask)`));
  for (const cs of m.content_scripts || []) {
    if ((cs.matches || []).some((x) => /example\.com/.test(x))) add("mv3", "warn", say("content_scripts 还是模板里的 example.com —— 改成真正要注入的网站，或者删掉", "content_scripts still match the template's example.com — change it to the real site or remove it"));
  }
  return { findings: out, messages, manifest: m };
}

/** 内容脚本用了 mountXxdUI / data-xxd-icon 时，manifest 里的依赖齐不齐、顺序对不对。 */
function checkContentScripts(dir, manifest, file) {
  const out = [];
  const add = (level, message) => out.push({ rule: "mv3", level, file, message });
  const war = (manifest.web_accessible_resources || []).flatMap((w) => w.resources || []);
  for (const cs of manifest.content_scripts || []) {
    const js = cs.js || [];
    const own = js.filter((f) => !/vendor\/xxd\//.test(f));
    const text = own.map((f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), "utf8") : "")).join("\n");
    const at = (name) => js.findIndex((f) => f.endsWith(`vendor/xxd/${name}`));
    const first = Math.min(...own.map((f) => js.indexOf(f)));
    if (/mountXxdUI/.test(text)) {
      for (const dep of ["xxd.js", "extension.js"]) {
        const i = at(dep);
        if (i === -1) add("error", say(`内容脚本用了 mountXxdUI，但 content_scripts 里没有 vendor/xxd/${dep}`, `The content script uses mountXxdUI, but content_scripts doesn't include vendor/xxd/${dep}`));
        else if (i > first) add("error", say(`vendor/xxd/${dep} 要排在你自己的内容脚本前面`, `vendor/xxd/${dep} has to come before your own content script`));
      }
      const viaJs = at("xxd.shadow.css.js") !== -1;
      const viaWar = war.some((r) => /vendor\/xxd\/xxd\.shadow\.css$/.test(r));
      if (!viaJs && !viaWar) add("error", say("mountXxdUI 需要 Shadow 样式：content_scripts 里加 vendor/xxd/xxd.shadow.css.js（推荐），或把 xxd.shadow.css 放进 web_accessible_resources", "mountXxdUI needs the Shadow styles: add vendor/xxd/xxd.shadow.css.js to content_scripts (recommended), or put xxd.shadow.css in web_accessible_resources"));
    }
    if (/data-xxd-icon|iconSVG\(/.test(text) && at("icons.js") === -1) add("warn", say("内容脚本用了图标，但 content_scripts 里没有 vendor/xxd/icons.js（图标不会出现）", "The content script uses icons, but content_scripts doesn't include vendor/xxd/icons.js (they won't show)"));
  }
  return out;
}

/**
 * 检查一个项目。返回 { dir, kind, findings: [{ rule, level, file, line, message }] }。
 * now：当前 xxd-ui-kit 的版本（{ commit }），用来判断 vendor 是否落后。
 */
export function doctor(target, { now, bin = "xxd-ui" } = {}) {
  const dir = resolve(target);
  if (!existsSync(dir)) throw new Error(say(`${dir} 不存在`, `${dir} doesn't exist`));
  const isExtension = existsSync(join(dir, "manifest.json"));
  const configFile = join(dir, "xxd.config.json");
  let config = {};
  if (existsSync(configFile)) {
    try {
      config = JSON.parse(readFileSync(configFile, "utf8"));
    } catch (err) {
      return { dir, kind: "unknown", findings: [{ rule: "setup", level: "error", file: configFile, message: say(`xxd.config.json 不是合法的 JSON：${err.message}`, `xxd.config.json isn't valid JSON: ${err.message}`) }] };
    }
  }
  const isMini = !isExtension && isMiniProject(dir);
  const kind = isExtension ? "extension" : isMini ? "mini" : existsSync(configFile) ? "site" : "unknown";
  const findings = [];
  // 小程序（@xxd/mini）：组件从 npm 包来，不查 vendor/xxd；查小程序自己的规则
  if (isMini) findings.push(...checkMini(dir));
  // 既不是插件也没有 xxd.config.json：说清楚还没接入，而不是「没发现问题」
  if (kind === "unknown") findings.push({ rule: "setup", level: "warn", file: dir, message: say(`这里还没接入（没有 manifest.json，也没有 xxd.config.json）—— 先运行 ${bin} init`, `This folder isn't set up yet (no manifest.json or xxd.config.json) — run ${bin} init first`) });
  const fixCmd = kind === "unknown" ? `${bin} init` : `${bin} sync`;
  const vendorRel = config.vendorDir ?? (isExtension ? "vendor/xxd" : false);
  // 还没接入时只报一次，不再逐个报 vendor/xxd 里的文件不在
  let vendorMissing = false;
  if (vendorRel) {
    const version = join(dir, vendorRel, "VERSION");
    vendorMissing = !existsSync(version);
    if (vendorMissing) findings.push({ rule: "setup", level: "error", file: join(dir, vendorRel), message: say(`组件还没拷进来：${vendorRel}/VERSION 不存在 —— 运行 ${bin} sync`, `The components aren't copied in yet: ${vendorRel}/VERSION is missing — run ${bin} sync`) });
    else if (now) {
      const text = readFileSync(version, "utf8");
      const hash = text.match(/hash (\S+)/)?.[1];
      const commit = text.match(/commit (\S+)/)?.[1];
      const behind = now.hash && hash ? hash !== now.hash : commit && now.commit && commit !== now.commit;
      if (behind) findings.push({ rule: "setup", level: "warn", file: version, message: say(`组件是旧版（${commit ?? hash}，最新 ${now.commit}）—— 运行 ${bin} sync`, `The components are out of date (${commit ?? hash}, latest ${now.commit}) — run ${bin} sync`) });
    }
  }
  let multilingual = existsSync(join(dir, "_locales"));
  if (isExtension) {
    const { findings: list, messages, manifest } = checkManifest(dir, { skipVendor: vendorMissing, bin });
    findings.push(...list);
    if (manifest) findings.push(...checkContentScripts(dir, manifest, join(dir, "manifest.json")));
    // data-i18n 用到的键都要在 default_locale 里
    const base = manifest && messages[manifest.default_locale];
    if (base) {
      for (const file of walk(dir).filter((f) => /\.html?$/.test(f))) {
        const text = readFileSync(file, "utf8");
        const starts = lineStarts(text);
        for (const m of text.matchAll(/data-i18n\s*=\s*["'](\w+)["']|data-i18n-attr\s*=\s*["']([^"']+)["']/g)) {
          const keys = m[1] ? [m[1]] : m[2].split(",").map((p) => p.split(":")[1]?.trim()).filter(Boolean);
          for (const k of keys) if (!base[k]) findings.push({ rule: "locale", level: "warn", file, line: lineOf(starts, m.index), message: say(`data-i18n 用了 ${k}，_locales/${manifest.default_locale} 里没有`, `data-i18n uses ${k}, but _locales/${manifest.default_locale} doesn't have it`) });
        }
      }
    }
  }
  const classes = knownClasses();
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    const add = (list) => {
      for (const f of list) if (!(f.line && ignoredLine(text, f.line))) findings.push({ level: "warn", ...f, file });
    };
    const isHtml = /\.html?$/.test(file);
    const isJs = /\.(m?js|jsx|tsx?)$/.test(file);
    if (file.endsWith(".css")) add(checkCss(text));
    else {
      // 页面里的 <style> 也查规则
      for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
        const offset = lineOf(lineStarts(text), m.index) - 1;
        add(checkCss(m[1]).map((f) => ({ ...f, line: f.line + offset })));
      }
      add(checkMarkup(text, { classes }));
    }
    if (isExtension && (isHtml || isJs)) add(checkMv3(text, { html: isHtml }));
    if (multilingual && (isHtml || isJs)) add(checkI18n(text, { html: isHtml }));
    if (isHtml) {
      const starts = lineStarts(text);
      for (const m of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"'#?]*vendor\/xxd\/[^"'#?]+)["']/g)) {
        if (/^(https?:)?\/\//.test(m[1]) || vendorMissing) continue;
        // 网站常把静态文件放在 public/（Vite、Astro）：页面里的 vendor/xxd/… 从那里起算
        const rel = m[1].replace(/^\//, "");
        const candidates = [resolve(dirname(file), m[1]), join(dir, rel), join(dir, "public", rel.replace(/^(\.\.\/)+/, ""))];
        if (!candidates.some((p) => existsSync(p))) findings.push({ rule: "missing", level: "error", file, line: lineOf(starts, m.index), message: say(`引用的 ${m[1]} 不存在 —— 运行 ${fixCmd}`, `${m[1]} is referenced but doesn't exist — run ${fixCmd}`) });
      }
      const usesClasses = /class\s*=\s*["'][^"']*\bxxd-/.test(text);
      if (usesClasses && !/xxd(\.min|\.shadow)?\.css/.test(text) && !/<link[^>]+\.css/.test(text)) findings.push({ rule: "setup", level: "warn", file, message: say("页面用了 xxd- 类名，但没有引 xxd.css", "The page uses xxd- classes but doesn't load xxd.css") });
      if (/data-xxd-icon/.test(text) && !/icons(\.iife)?\.js/.test(text) && !/<script[^>]+type=["']module/.test(text)) findings.push({ rule: "setup", level: "warn", file, message: say("用了 data-xxd-icon，但没有引 icons.js（图标不会出现）", "The page uses data-xxd-icon but doesn't load icons.js (icons won't show)") });
      const boot = text.match(/<script[^>]*boot\.js[^>]*>/);
      if (boot && !/data-key=/.test(boot[0])) findings.push({ rule: "setup", level: "warn", file, line: lineOf(starts, boot.index), message: say("boot.js 没写 data-key —— 外观设置会存在默认的 xxd-ui 下，同一个网站的几个应用会互相影响", "boot.js has no data-key — appearance settings go under the default xxd-ui key, shared by every app on the same site") });
    }
  }
  const ignore = new Set(config.doctor?.ignore || []);
  return { dir, kind, findings: findings.filter((f) => !ignore.has(f.rule)).map((f) => ({ ...f, file: relative(dir, f.file) || "." })) };
}
