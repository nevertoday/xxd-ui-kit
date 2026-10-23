// 构建 @xxd/mini 的样式（docs/maintainers/MINIPROGRAM-PLAN.md §6、§7）：
//   styles/tokens.mini.css   page 上的令牌（缺省外观，算成具体的值）+ 暗色媒体查询 + 动画 + 基础样式
//   styles/<组件>.mini.css   网页版 @xxd/css 改写成小程序能用的样子，按 mini.json 分到每个组件，后面接 src/styles/ 里小程序专有的样式
//   styles/vars.js           运行时用：各外观的令牌表（tokens.json）和派生色（原来的 color-mix）
//   styles/theme.json        小程序的 theme.json：导航栏、标签栏、窗口背景的亮暗颜色
//   styles/REPORT.md         逐项列出改写了什么、去掉了什么、Skyline 还差什么
// 改写不了的写法不会悄悄留下：产物再扫一遍，有不允许的写法就失败。
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { appearanceVars } from "@xxd/tokens/resolve";
import { addSkylineFallbacks, skylineGaps, splitDecls } from "./skyline.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const { transform } = require("lightningcss");
const tokensDir = dirname(require.resolve("@xxd/tokens/package.json"));
const cssDir = dirname(require.resolve("@xxd/css/package.json"));

export const HEADER = "/*postcss-pxtransform disable*/";
const BANNER = "/* @xxd/mini — 小小东 UI 小程序版。由 scripts/build-mini.mjs 从 @xxd/css 生成，请勿手改。Copyright (c) 2026 小小东 (xiaoxiaodong.ai). MIT License. */";

/* ───────────── 选择器 ───────────── */

/** 一个选择器 AST → 文本 */
export function printSelector(selector) {
  const out = transform({ filename: "s.css", code: Buffer.from("a{color:red}"), visitor: { Selector: () => selector } }).code.toString();
  return out.slice(0, out.indexOf("{")).trim();
}

const cls = (name) => ({ type: "class", name });
const slug = (v) => String(v).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

// aria 状态：true → 一个类名，false → 没有这个类名
const ARIA_STATE = { pressed: "pressed", selected: "selected", checked: "checked", disabled: "disabled", invalid: "invalid", expanded: "expanded", busy: "busy", hidden: "hidden", current: "current", modal: "modal", readonly: "readonly", required: "required" };
// 伪类：小程序里由组件按状态加类名
const STATE_PSEUDO = { hover: "is-hover", active: "is-active", checked: "is-checked", disabled: "is-disabled", indeterminate: "is-indeterminate", "placeholder-shown": "is-placeholder-shown", empty: "is-empty", "popover-open": "is-open", "read-only": "is-readonly", required: "is-required", invalid: "is-invalid", "user-invalid": "is-invalid" };
// 标签和类名写在一起时换成什么类名（null：标签可以直接去掉）。没列的标签整条去掉
const TAG_CLASS = { a: "is-link", button: "is-link", label: "is-label", body: null, html: null };
// 手机上没有键盘焦点环：带这些伪类的选择器整条去掉
const FOCUS_PSEUDO = new Set(["focus", "focus-visible", "focus-within"]);
// 结构伪类：WebView 支持
const KEEP_PSEUDO = new Set(["first-child", "last-child", "only-child", "nth-child", "nth-last-child", "nth-of-type", "first-of-type", "last-of-type"]);

const WEB_ONLY_ATTRS = new Set(["data-truncated", "data-xxd-full"]);

/** 属性选择器 → 小程序里的类名写法。返回 { add: [类名], not: [类名] } 或 { drop: 原因 } */
export function attributeToClass(c) {
  const op = c.operation;
  const raw = c.name;
  if (op && op.operator !== "equal") return { drop: `属性选择器 [${raw}${op.operator}…]` };
  const value = op ? String(op.value) : null;
  if (raw.startsWith("aria-")) {
    const key = raw.slice(5);
    if (key === "checked" && value === "mixed") return { add: ["is-indeterminate"] };
    if (key === "current") return value === "false" ? { not: ["is-current"] } : { add: ["is-current"] };
    if (ARIA_STATE[key]) {
      if (value === "false") return { not: [`is-${ARIA_STATE[key]}`] };
      if (value == null || value === "true") return { add: [`is-${ARIA_STATE[key]}`] };
    }
    return { add: [value == null ? `is-${slug(key)}` : `is-${slug(key)}-${slug(value)}`] };
  }
  if (raw === "role") return value ? { add: [`is-role-${slug(value)}`] } : { drop: "[role]" };
  // 只有网页版 xxd.js 量过以后才加的属性（放不下的标签换排法，TRUNCATION-REVIEW-PLAN D92）：小程序里没有，不带过去
  if (WEB_ONLY_ATTRS.has(raw)) return { drop: `只有网页 xxd.js 会加的 [${raw}]` };
  const name = slug(raw.replace(/^data-/, ""));
  if (!name) return { drop: `属性选择器 [${raw}]` };
  return { add: [value == null ? `is-${name}` : value === "" ? `is-${name}` : `is-${name}-${slug(value)}`] };
}

const isCombinator = (c) => c.type === "combinator";

/** :is() / :where() 展开成几个选择器（只展开整段都是它的情况，比如 `:where(.a) :where(b, c)`） */
export function expandIs(selector) {
  const i = selector.findIndex((c) => c.type === "pseudo-class" && (c.kind === "is" || c.kind === "where"));
  if (i === -1) return [selector];
  const c = selector[i];
  const alone = (i === 0 || isCombinator(selector[i - 1])) && (i === selector.length - 1 || isCombinator(selector[i + 1]));
  const out = [];
  for (const alt of c.selectors) {
    if (alt.some(isCombinator) && !alone) return null;
    // 一段里的 :is(.a) 和别的写在一起（.x:is(.a, .b)）：把 .a 拼进这一段
    const expanded = expandIs([...selector.slice(0, i), ...alt, ...selector.slice(i + 1)]);
    if (!expanded) return null;
    out.push(...expanded);
  }
  return out;
}

/**
 * 一个网页版选择器 → 小程序版（AST），或者 { drop: 原因 }。
 *   - 属性 → 类名；状态伪类 → 类名；焦点伪类 → 去掉；:root → page（和别的写在一起时去掉，外观类名在页面根上）
 *   - 标签：和类名写在一起时去掉标签（类名已经认得出来）；只有标签的 → 去掉（小程序的标签不一样，H5 里又是自定义元素）
 *   - * → 去掉；::placeholder → .is-placeholder（输入框传 placeholderClass）；别的伪元素只留 ::before / ::after
 */
export function convertSelector(selector, { has = {} } = {}) {
  const parts = [];
  // 按组合符切成几段
  let compound = [];
  const segments = [];
  for (const c of selector) {
    if (isCombinator(c)) {
      segments.push({ compound, combinator: c });
      compound = [];
    } else compound.push(c);
  }
  segments.push({ compound, combinator: null });
  for (let s = 0; s < segments.length; s += 1) {
    const { compound: comp, combinator } = segments[s];
    const hasClass = comp.some((c) => c.type === "class");
    const isRootOnly = comp.length > 0 && comp.every((c) => c.type === "pseudo-class" && c.kind === "root");
    const out = [];
    let placeholder = false;
    for (const c of comp) {
      if (c.type === "class") out.push(c);
      else if (c.type === "type") {
        if (!hasClass) return { drop: `标签 <${c.name}>` };
        // 标签和类名写在一起：a.xxd-row（能点的行）和 div.xxd-row 不一样，不能光去掉标签。换成组件会加的类名
        if (TAG_CLASS[c.name]) out.push(cls(TAG_CLASS[c.name]));
        else if (!(c.name in TAG_CLASS)) return { drop: `标签 <${c.name}>` };
      } else if (c.type === "universal") {
        if (!comp.some((x) => x !== c && x.type !== "pseudo-element")) return { drop: "通配符 *" };
      } else if (c.type === "id") return { drop: "id 选择器" };
      else if (c.type === "attribute") {
        const r = attributeToClass(c);
        if (r.drop) return { drop: r.drop };
        for (const n of r.add ?? []) out.push(cls(n));
        for (const n of r.not ?? []) out.push({ type: "pseudo-class", kind: "not", selectors: [[cls(n)]] });
      } else if (c.type === "pseudo-class") {
        if (c.kind === "root") {
          if (isRootOnly) out.push({ type: "type", name: "page" });
        } else if (FOCUS_PSEUDO.has(c.kind)) return { drop: `焦点 :${c.kind}` };
        else if (STATE_PSEUDO[c.kind]) out.push(cls(STATE_PSEUDO[c.kind]));
        else if (c.kind === "enabled") out.push({ type: "pseudo-class", kind: "not", selectors: [[cls("is-disabled")]] });
        else if (KEEP_PSEUDO.has(c.kind)) out.push(c);
        else if (c.kind === "not") {
          // :not(里面) 也改写；里面只能剩类名。里面是小程序里永远不成立的东西（焦点、网页标签）时，:not() 永远成立，去掉
          const inner = [];
          let always = false;
          for (const sel of c.selectors) {
            const r = convertSelector(sel, { has });
            if (r.drop || !r.selectors) {
              always = true;
              continue;
            }
            for (const x of r.selectors) {
              if (x.some((y) => isCombinator(y) || y.type === "type")) return { drop: `:not() 里有组合符` };
              inner.push(x);
            }
          }
          // :not(.a, .b) 拆成 :not(.a):not(.b)：老的 WebView 不认 :not() 里的选择器列表
          const seen = new Set(out.filter((x) => x.kind === "not").map((x) => printSelector([x])));
          for (const x of inner) {
            const one = { type: "pseudo-class", kind: "not", selectors: [x] };
            const key = printSelector([one]);
            if (!seen.has(key)) {
              out.push(one);
              seen.add(key);
            }
          }
          if (!inner.length && !always) return { drop: ":not()" };
        } else if (c.kind === "has") {
          const key = printSelector([c]);
          if (!has[key]) return { drop: `:has() 没在 mini.json 里写换成什么：${key}` };
          out.push(cls(has[key]));
        } else return { drop: `伪类 :${c.kind}` };
      } else if (c.type === "pseudo-element") {
        if (c.kind === "before" || c.kind === "after") out.push(c);
        else if (c.kind === "placeholder") placeholder = true;
        else return { drop: `伪元素 ::${c.kind === "custom" ? c.name : c.kind}` };
      } else if (c.type === "nesting") return { drop: "嵌套 &" };
      else return { drop: `不认识的选择器（${c.type}）` };
    }
    if (placeholder) return { selectors: [[cls("is-placeholder")]], placeholder: true };
    // :root 和外观类名写在一起（:root[data-theme=dark] .x）：外观类名在页面根上，留类名
    if (!out.length) {
      if (combinator && combinator.value === "descendant") continue; // 这一段什么都没剩（比如 :root）：后代关系照样成立
      if (!combinator && parts.length) {
        // 最后一段什么都没剩（`.x :focus-visible` 这类已经在上面去掉了）：不应该走到这里
        return { drop: "选择器最后一段为空" };
      }
      if (!combinator) return { drop: "选择器为空" };
      return { drop: "子代关系的一段为空" };
    }
    parts.push(...out);
    if (combinator) parts.push(combinator);
  }
  if (isCombinator(parts[parts.length - 1])) parts.pop();
  return { selectors: [parts] };
}

/* ───────────── 值 ───────────── */

/** color-mix(...) 的派生令牌名：color-mix(in srgb, var(--action) 24%, transparent) → --mix-action-24-transparent */
export function mixName(expr) {
  const inner = expr.slice(expr.indexOf("(") + 1, expr.lastIndexOf(")"));
  const args = inner.split(",").slice(1).map((a) => a.trim());
  const piece = (a) => {
    const m = a.match(/^(.*?)(?:\s+(-?[\d.]+)%)?$/s);
    const color = m[1].trim().replace(/^var\(--([\w-]+)\)$/, "$1").replace(/^#/, "");
    return [slug(color), m[2]].filter(Boolean).join("-");
  };
  const name = `--mix-${args.map(piece).join("-")}`;
  return /^--mix-[a-z0-9-]+$/.test(name) && name.length <= 48 ? name : `--mix-${hash(expr)}`;
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/** 找到 from 处 "(" 对应的 ")" */
function closing(text, from) {
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

/**
 * color-mix() 只用到全局令牌时才能提前算：组件自己的局部变量（--btn-bg）、currentColor 每处的值不一样。
 * 这种就近似成占比大的那个颜色（记进 approx），准确的值写在 src/styles/ 的小程序专有样式里。
 */
function approximateMix(expr) {
  const inner = expr.slice(expr.indexOf("(") + 1, expr.lastIndexOf(")"));
  const [, a, b] = inner.split(/,(?![^(]*\))/).map((x) => x.trim());
  const pct = (arg) => {
    const m = arg.match(/\s(-?[\d.]+)%$/) || arg.match(/\s(var\([^)]*,\s*(-?[\d.]+)%\))$/);
    return m ? parseFloat(m[2] ?? m[1]) : null;
  };
  const color = (arg) => arg.replace(/\s+(-?[\d.]+%|var\([^)]*\))$/, "").trim();
  const pa = pct(a);
  const pb = pct(b);
  const first = pa != null ? pa : pb != null ? 100 - pb : 50;
  return first >= 50 ? color(a) : color(b);
}

// 小程序里没用的声明（没有鼠标、没有网页的排版特性）：去掉，规则空了就不写
const USELESS_PROPS = /^\s*(cursor|text-spacing-trim|text-wrap|text-wrap-style|field-sizing|interpolate-size|scrollbar-width|scrollbar-color|scrollbar-gutter|-moz-osx-font-smoothing|content-visibility|contain-intrinsic-size|contain-intrinsic-inline-size|contain-intrinsic-block-size|container-type|container-name|anchor-name|position-anchor)\s*:/i;
export function dropUseless(body) {
  const pieces = splitDecls(body);
  return pieces.filter((p) => !USELESS_PROPS.test(p.replace(/\/\*[\s\S]*?\*\//g, ""))).join(";");
}

/** 声明块里的 color-mix() 换成派生令牌（记进 mixes）；dvh → vh（老的 WebView 不认 dvh） */
export function convertBody(body, mixes, { known = null, approx = null } = {}) {
  let text = body;
  for (let at = text.indexOf("color-mix("); at !== -1; at = text.indexOf("color-mix(", at + 1)) {
    const end = closing(text, at + 9);
    if (end === -1) break;
    const expr = text.slice(at, end + 1).replace(/\s+/g, " ");
    const refs = [...expr.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);
    const local = /currentcolor/i.test(expr) || (known && refs.some((r) => !known.has(r) && !r.startsWith("--mix-")));
    if (local) {
      approx?.push(expr);
      text = `${text.slice(0, at)}${approximateMix(expr)}${text.slice(end + 1)}`;
      continue;
    }
    const name = mixName(expr);
    mixes.set(name, expr);
    text = `${text.slice(0, at)}var(${name})${text.slice(end + 1)}`;
  }
  // 微信文档只保证 base64 的 data: 地址能当背景图：百分号编码的 SVG 转成 base64
  const b64 = (data) => `url("data:image/svg+xml;base64,${Buffer.from(decodeURIComponent(data)).toString("base64")}")`;
  text = text.replace(/url\("data:image\/svg\+xml,([^"]+)"\)/g, (_, d) => b64(d)).replace(/url\('data:image\/svg\+xml,([^']+)'\)/g, (_, d) => b64(d));
  return text.replace(/(\d)dvh\b/g, "$1vh").replace(/(\d)svh\b/g, "$1vh");
}

/* ───────────── 规则树 ───────────── */

/** 整份 CSS 的规则（样式规则带上外面套着的 @media / @layer / @supports；@keyframes 原文） */
export function readRules(css) {
  const lineStart = [0];
  for (let i = 0; i < css.length; i += 1) if (css[i] === "\n") lineStart.push(i + 1);
  const offset = (loc) => lineStart[loc.line] + loc.column - 1;
  const matching = (open) => {
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}" && --depth === 0) return i;
    }
    return css.length;
  };
  const out = [];
  const walk = (rules, wrappers) => {
    for (const r of rules) {
      const at = r.value?.loc ? offset(r.value.loc) : -1;
      if (r.type === "style") {
        const open = css.indexOf("{", at);
        out.push({ kind: "style", selectors: r.value.selectors, body: css.slice(open + 1, matching(open)), wrappers });
      } else if (r.type === "keyframes") {
        const open = css.indexOf("{", at);
        out.push({ kind: "keyframes", name: r.value.name.value, text: css.slice(at, matching(open) + 1), wrappers });
      } else if (r.value?.rules) {
        out.push(...[]);
        const prelude = r.type === "layer-block" ? "@layer" : css.slice(at, css.indexOf("{", at)).trim();
        walk(r.value.rules, [...wrappers, { type: r.type, prelude }]);
      }
    }
  };
  transform({ filename: "in.css", code: Buffer.from(css), visitor: { StyleSheet(sheet) { walk(sheet.rules, []); } } });
  return out;
}

/** 外面套的 @规则在小程序里怎么办：keep（保留这一层）、unwrap（去掉这一层，里面照用）、drop（整块去掉） */
export function wrapperAction(w) {
  if (w.type === "layer-block") return "unwrap";
  if (w.type === "media") {
    if (/\(hover:\s*none\)|\(pointer:\s*coarse\)/.test(w.prelude)) return "unwrap"; // 手机就是这样
    if (/\(hover:\s*hover\)|\(pointer:\s*fine\)|forced-colors|prefers-contrast|print/.test(w.prelude)) return "drop";
    // 网页版给窄屏的样子（max-width 480 以上）：小程序就是手机，直接用（Skyline 只认暗色的媒体查询）
    const max = w.prelude.match(/^@media\s*\(max-width:\s*(\d+)px\)$/);
    if (max && Number(max[1]) >= 480) return "unwrap";
    return "keep";
  }
  if (w.type === "starting-style" || w.type === "container" || w.type === "supports") return "drop";
  return "drop";
}

/* ───────────── 组件归属 ───────────── */

const blockOf = (name) => name.replace(/__.*$/, "").replace(/--.*$/, "");

/** 选择器属于哪个组件：主体（最后一段）里的 xxd- 类名优先，没有就取第一个 */
export function ownerOf(selector, blocks) {
  const classes = (sel) => sel.filter((c) => c.type === "class" && /^(xxd|ui)-/.test(c.name)).map((c) => blockOf(c.name));
  const lastStart = selector.map(isCombinator).lastIndexOf(true) + 1;
  const subject = classes(selector.slice(lastStart));
  const all = classes(selector);
  // 选择器里只要有一个网页专用组件（.xxd-menu__item > .ui-icon），这条就只在网页上用得到
  const foreign = all.find((b) => !blocks.has(b));
  if (foreign) return { unknown: foreign };
  for (const b of [...subject, ...all]) if (blocks.has(b)) return blocks.get(b);
  return null;
}

/* ───────────── 门禁 ───────────── */

const ALLOWED_PSEUDO = new Set([...KEEP_PSEUDO, "not"]);
// 小程序自己的标签（WXSS 支持标签选择器；Taro 编 H5 时会换成对应的元素）。网页版的标签在改写时已经去掉
export const MINI_TAGS = new Set(["page", "view", "text", "button", "input", "textarea", "image", "scroll-view", "swiper", "swiper-item", "label", "picker-view", "picker-view-column", "root-portal"]);

/** 扫一份产物：返回不允许的写法（WebView 一列）和 Skyline 还不支持的写法 */
export function audit(css) {
  const webview = [];
  const skyline = [];
  const check = (sel, where) => {
    for (const c of sel) {
      if (c.type === "attribute") webview.push(`属性选择器：${where}`);
      else if (c.type === "universal") webview.push(`通配符：${where}`);
      else if (c.type === "id") webview.push(`id：${where}`);
      else if (c.type === "type" && !MINI_TAGS.has(c.name)) webview.push(`标签 ${c.name}：${where}`);
      else if (c.type === "pseudo-class") {
        if (!ALLOWED_PSEUDO.has(c.kind)) webview.push(`伪类 :${c.kind}：${where}`);
        if (c.kind === "not") for (const s of c.selectors) check(s, where);
      } else if (c.type === "pseudo-element" && c.kind !== "before" && c.kind !== "after") webview.push(`伪元素：${where}`);
    }
  };
  transform({
    filename: "out.css",
    code: Buffer.from(css),
    visitor: {
      Rule: {
        style(rule) {
          for (const sel of rule.value.selectors) check(sel, printSelector(sel));
        },
        "layer-block"() {
          webview.push("@layer");
        },
        "layer-statement"() {
          webview.push("@layer");
        },
      },
    },
  });
  if (/color-mix\(/.test(css)) webview.push("color-mix()");
  if (/:root\b/.test(css)) webview.push(":root");
  if (/@container|@starting-style|@supports/.test(css)) webview.push("@container / @starting-style / @supports");
  // Skyline：每条它不支持的声明前面要有后备（scripts/skyline.mjs）；@media 只认暗色
  const gaps = skylineGaps(css);
  skyline.push(...gaps.missing);
  // Skyline 只认暗色的媒体查询：别的（减少动效）在 Skyline 里不生效，样子不受影响，单独列出来
  const notes = gaps.media.map((m) => `@media ${m}`);
  return { webview, skyline, notes };
}

/* ───────────── 令牌 ───────────── */

/** 色阶的数字令牌 */
const SCALE_NUMERIC = /^--(gray|accent|success|danger|warning)-(\d+|on)$/;

/** 一组变量写成声明 */
const declare = (vars, indent = "  ") => Object.entries(vars).map(([k, v]) => `${indent}${k}: ${v};`).join("\n");

/**
 * 小程序版令牌：缺省外观（亮）写在 page 上，暗色写进媒体查询；都算成具体的值。
 * used：组件样式里真的引用了的变量。色阶以后令牌有两百多个（五族 × 12 级 + 用途名），小程序只写用得到的（体积门禁）
 */
export function tokensCss(modes, mixes, used) {
  const extra = Object.fromEntries(mixes);
  // 只筛色阶的数字令牌（--gray-3、--danger-9 这类：给生成器、测试和颜色页用，组件里只写用途名）；
  // 别的令牌（间距、字号、用途名……）都写上：用户自己的样式里也会用
  const keep = ([k]) => !used || !SCALE_NUMERIC.test(k) || used.has(k);
  const light = Object.fromEntries(Object.entries(appearanceVars({ theme: "light" }, { modes, extra, coarse: true }).vars).filter(keep));
  const dark = appearanceVars({ theme: "dark" }, { modes, extra, coarse: true }).vars;
  const darkOnly = Object.fromEntries(Object.entries(dark).filter(([k, v]) => keep([k]) && light[k] !== v));
  // page 是小程序的页面根；.xxd-h5-root 是 Taro 编 H5 时的页面根（H5 里没有 page 元素，@xxd/mini 运行时把这个类名挂到 <html> 上）
  return `page,\n.xxd-h5-root {\n  color-scheme: light;\n${declare(light)}\n}\n\n/* 跟随系统暗色（app.json 要开 darkmode）。用户选了强制亮 / 暗时，XxdPage 把算好的变量写在页面根节点上，盖过这里 */\n@media (prefers-color-scheme: dark) {\n  page,\n  .xxd-h5-root {\n    color-scheme: dark;\n${declare(darkOnly, "    ")}\n  }\n}\n`;
}

/** theme.json：导航栏、标签栏、窗口背景的亮暗颜色（app.json 里写 "@navBg" 这样引用） */
export function themeJson(modes) {
  const pick = (theme) => {
    const v = appearanceVars({ theme }, { modes }).vars;
    return {
      navBg: v["--bg"],
      navText: theme === "dark" ? "white" : "black",
      bg: v["--bg"],
      bgText: theme === "dark" ? "light" : "dark",
      tabColor: v["--muted"],
      tabSelected: v["--ink"],
      tabBg: v["--paper"],
      tabBorder: theme === "dark" ? "white" : "black",
    };
  };
  return { light: pick("light"), dark: pick("dark") };
}

/* ───────────── 主流程 ───────────── */

export function buildMini({ componentsCss, modes, manifest, extraCss = {}, jsSource = "" }) {
  const blocks = new Map();
  for (const c of manifest.components) for (const b of c.blocks) blocks.set(b, c);
  const mixes = new Map();
  // 全局令牌（包括主色写进来的 --action-custom*）：只引用这些的 color-mix() 才能提前算
  const known = new Set(Object.values(modes).flatMap((m) => Object.keys(m || {})));
  for (const n of Object.values(modes.accent || {}).join(" ").matchAll(/var\((--[\w-]+)/g)) known.add(n[1]);
  for (const n of Object.values(modes.darkAccent || {}).join(" ").matchAll(/var\((--[\w-]+)/g)) known.add(n[1]);
  const approx = [];
  const files = new Map(manifest.components.map((c) => [c.name, []]));
  const base = [];
  const keyframes = new Map();
  const report = { rules: 0, kept: 0, dropped: new Map(), web: new Map(), wrappers: new Map(), rewritten: { attribute: 0, state: 0, root: 0, is: 0, mix: 0, placeholder: 0 } };
  const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);

  for (const rule of readRules(componentsCss)) {
    if (rule.kind === "keyframes") {
      keyframes.set(rule.name, rule.text);
      continue;
    }
    report.rules += 1;
    const actions = rule.wrappers.map(wrapperAction);
    if (actions.includes("drop")) {
      const w = rule.wrappers[actions.indexOf("drop")];
      bump(report.wrappers, w.type === "layer-block" ? "@layer" : w.prelude.replace(/\s+/g, " "));
      continue;
    }
    // 每个选择器各自改写，按组件分组
    const byOwner = new Map();
    for (const sel of rule.selectors) {
      const text = printSelector(sel);
      if (/\[|:root|:hover|:checked|:disabled|:active/.test(text)) {
        if (/\[/.test(text)) report.rewritten.attribute += 1;
        if (/:root/.test(text)) report.rewritten.root += 1;
        if (/:(hover|checked|disabled|active)/.test(text)) report.rewritten.state += 1;
      }
      const expanded = expandIs(sel);
      if (!expanded) {
        bump(report.dropped, ":is() 里有组合符");
        continue;
      }
      if (expanded.length > 1 || /:is\(|:where\(/.test(text)) report.rewritten.is += 1;
      for (const one of expanded) {
        const r = convertSelector(one, { has: manifest.has });
        if (r.drop) {
          bump(report.dropped, r.drop.replace(/：.*$/, ""));
          continue;
        }
        if (r.placeholder) report.rewritten.placeholder += 1;
        for (const out of r.selectors) {
          const owner = ownerOf(out, blocks);
          if (owner?.unknown) {
            bump(report.web, owner.unknown);
            continue;
          }
          // 小程序版的组件不会加的修饰类名（mini.json 的 skip）：这条只在网页版用得到
          const skipped = owner?.skip?.find((k) => out.some((c) => c.type === "class" && c.name === k));
          if (skipped) {
            bump(report.dropped, `小程序版不用的修饰 .${skipped}`);
            continue;
          }
          const key = owner ? owner.name : "";
          if (!byOwner.has(key)) byOwner.set(key, new Set());
          const text = printSelector(out);
          byOwner.get(key).add(text);
          // page 是小程序的页面根；H5 里没有 page，同一条再写给 .xxd-h5-root（<html> 上的类名）
          if (/^page(?![\w-])/.test(text)) byOwner.get(key).add(`.xxd-h5-root${text.slice(4)}`);
        }
      }
    }
    if (!byOwner.size) continue;
    const before = mixes.size;
    const body = convertBody(dropUseless(rule.body), mixes, { known, approx });
    if (!body.replace(/\/\*[\s\S]*?\*\//g, "").trim()) {
      bump(report.dropped, "只有小程序里没用的声明（cursor 等）");
      continue;
    }
    report.rewritten.mix += (rule.body.match(/color-mix\(/g) || []).length;
    void before;
    const kept = rule.wrappers.filter((w, i) => actions[i] === "keep");
    for (const [key, sels] of byOwner) {
      let text = `${[...sels].join(",\n")} {${body}}`;
      for (const w of [...kept].reverse()) text = `${w.prelude} {\n${text}\n}`;
      (key ? files.get(key) : base).push(text);
      report.kept += 1;
    }
  }

  // 小程序专有的样式（src/styles/<组件>.css）接在改写的后面：同样的优先级，后写的赢
  const out = new Map();
  for (const c of manifest.components) {
    const own = extraCss[c.name] ? convertBody(extraCss[c.name], mixes, { known }) : "";
    out.set(c.name, `${HEADER}\n${BANNER}\n/* ${c.name}（${c.zh}）：网页版 ${c.web.join(" / ") || "—"} 改写 */\n${files.get(c.name).join("\n\n")}\n${own ? `\n/* 小程序专有 */\n${own}` : ""}`);
  }
  // 动画用到哪些写哪些（keyframes 是全局的，放进 tokens.mini.css）
  const used = [...out.values(), base.join("\n"), extraCss.base ?? ""].join("\n");
  const frames = [...keyframes].filter(([name]) => new RegExp(`\\b${name}\\b`).test(used.replace(/@keyframes\s+[\w-]+/g, ""))).map(([, text]) => text);
  const baseOwn = extraCss.base ? convertBody(extraCss.base, mixes, { known }) : "";
  // 用到的变量：组件样式、基础样式、组件 JS 里行内写的 var(--…)
  const usedVars = new Set([...`${used}\n${baseOwn}\n${jsSource}`.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
  const tokens = `${HEADER}\n${BANNER}\n${tokensCss(modes, mixes, usedVars)}\n/* 基础（网页版改写） */\n${base.join("\n\n")}\n\n/* 基础（小程序专有） */\n${baseOwn}\n\n/* 动画 */\n${frames.join("\n\n")}\n`;
  report.approx = approx;
  // Skyline 的后备声明：每条规则的声明块都过一遍（只处理最里层的块，@media 里的规则也算）
  const sky = (css) => css.replace(/([^{}]*)\{([^{}]*)\}/g, (m, sel, body) => `${sel}{${addSkylineFallbacks(body, sel)}}`);
  for (const [k, v] of out) out.set(k, sky(v));
  return { files: out, tokens: sky(tokens), mixes, report, usedVars };
}

function reportMarkdown({ report, files, tokens, mixes, problems }) {
  const sizes = [...files].map(([name, css]) => [name, Buffer.byteLength(css)]);
  const total = sizes.reduce((n, [, s]) => n + s, 0) + Buffer.byteLength(tokens);
  const rows = (map) => [...map].sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join("\n");
  const sky = new Map();
  for (const p of problems.skyline) sky.set(p.replace(/：.*$/, ""), (sky.get(p.replace(/：.*$/, "")) || 0) + 1);
  return `# @xxd/mini 样式改写报告

由 \`scripts/build-mini.mjs\` 生成，请勿手改。规则见 \`docs/maintainers/MINIPROGRAM-PLAN.md\` §6。

## 结论

| 引擎 | 不允许的写法 |
| --- | --- |
| WebView（第一版保证） | **${problems.webview.length}** |
| Skyline（最低微信 8.0.50） | ${problems.skyline.length} |

网页版 ${report.rules} 条规则，小程序版写出 ${report.kept} 条。样式一共 ${(total / 1024).toFixed(1)} KB（令牌和基础 ${(Buffer.byteLength(tokens) / 1024).toFixed(1)} KB）。

## 改写了什么

| 写法 | 处 |
| --- | --- |
| 属性选择器 → \`.is-*\` 类名 | ${report.rewritten.attribute} |
| 状态伪类（:hover、:checked、:disabled、:active）→ 类名 | ${report.rewritten.state} |
| \`:root\` → \`page\` / 页面根上的外观类名 | ${report.rewritten.root} |
| \`:is()\` / \`:where()\` 展开 | ${report.rewritten.is} |
| \`color-mix()\` → 派生令牌（${mixes.size} 种） | ${report.rewritten.mix} |
| \`::placeholder\` → \`.is-placeholder\` | ${report.rewritten.placeholder} |

用到组件局部变量或 \`currentColor\` 的 \`color-mix()\` 没法提前算，先近似成占比大的那个颜色，准确的值在 \`src/styles/\` 里用全局令牌补上（${report.approx.length} 处）：

${[...new Set(report.approx)].map((e) => `- \`${e}\``).join("\n") || "- 没有"}

## 去掉了什么

小程序里用不上的选择器（一条规则里别的选择器照样留着）：

| 原因 | 个 |
| --- | --- |
${rows(report.dropped)}

整块去掉的 @ 规则：

| 规则 | 条 |
| --- | --- |
${rows(report.wrappers)}

网页专用组件（不在 \`mini.json\` 里）：

| 类名 | 个 |
| --- | --- |
${rows(report.web)}

## Skyline 还差什么

Skyline 不支持的声明（grid、inline-flex、currentColor、em、sticky、overflow: auto、多层阴影……）前面都写了一条它认得的后备声明（\`scripts/skyline.mjs\`），WebView 照旧用原来的。下面是没有后备的：

| 写法 | 处 |
| --- | --- |
${rows(sky) || "| — | 0 |"}

Skyline 里不生效、但样子不受影响的（Skyline 只认暗色的媒体查询）：

${[...new Set(problems.notes)].map((n) => `- \`${n}\`（${problems.notes.filter((x) => x === n).length} 处）`).join("\n") || "- 没有"}

还要知道的：Skyline 没有 grid，网格（卡片、图片宫格、统计）在 Skyline 里退成一列；\`overflow: auto\` 退成 \`hidden\`，很长的底部面板在 Skyline 里滚不动（要滚的地方用 scroll-view）。

## 每个组件的大小

| 组件 | 字节 |
| --- | --- |
| tokens（令牌、基础、动画） | ${Buffer.byteLength(tokens)} |
${sizes.map(([n, s]) => `| ${n} | ${s} |`).join("\n")}
`;
}

/** 组件样式加起来的上限（§11）：压缩后 88 KB。这是 44 个组件全用上的总量；按需引入，没用到的组件样式不进包 */
// 2026-10-15 从 60 KB 调到 64 KB：设计师评审加了禁用、浮层抬起一层、半档间距这些令牌（亮暗各一份）和浮层规则，约 2 KB。
// 2026-10-18 从 64 KB 调到 68 KB：小程序对抗测试（MINI-REVIEW-PLAN D31）加了底部按钮条、数量加减、日期滚轮、结果页四个组件，
// 还有点按区、面板拖动和键盘的规则，约 3.5 KB。色阶计划（COLOR-SCALE-PLAN S3）去掉预先算的混色以后再看能不能收回。
// 2026-10-19 从 68 KB 调到 72 KB：量表（GAUGE-PLAN G5）约 3 KB，计量条的目标线、超限、分格约 0.6 KB。
// 量表在小程序里画成图片，网页版给 SVG 上色的那些类已经用 mini.json 的 skip 去掉了（省 1.1 KB）。
// 微信主包上限 2 MB，样式这一块仍然很小；再往上涨要先看能不能删。
// 2026-10-19 从 72 KB 调到 80 KB：图型计划（CHART-TYPES-PLAN D48）加了条形榜、构成条（含共用图例）、百格图、热力格、前后对比五个组件，约 8 KB。
// 一个组件 1.5 KB 左右，用到哪个才进包；没有更小的写法（格子、条都已经是最少的规则）。
// 2026-10-19 从 80 KB 调到 84 KB：查漏补缺（CHART-TYPES-PLAN 8.1）给条形榜加了对照条、参考线、刻度、瀑布，几个图加了「没有数据」，约 2.5 KB。
// 2026-10-22 从 84 KB 调到 86 KB：间距体系（SPACING-REVIEW-PLAN D54–D58）加了容器内边距和间隔的用途令牌、
// 角上的关闭按钮按图标对齐（小程序的底部面板也用），约 0.9 KB。
// 2026-10-22 从 86 KB 调到 88 KB：动效和验收（MOTION-REVIEW-PLAN、ACCEPTANCE-REVIEW）给按钮加了按下 / 进行中 / 完成的状态和状态优先级，
// 分段加了尺寸和禁用，令牌多了 --motion-out、热力的字色，约 2 KB；整行可点的列表行小程序用不上，已经 skip 掉。
export const SIZE_BUDGET = 88 * 1024;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tokensJson = join(tokensDir, "dist/tokens.json");
  const componentsPath = join(cssDir, "dist/components.css");
  for (const [p, name] of [[tokensJson, "@xxd/tokens"], [componentsPath, "@xxd/css"]]) {
    if (!existsSync(p)) {
      console.error(`✗ ${name} 还没构建：pnpm xxd:build（或 pnpm --filter ${name} build）`);
      process.exit(1);
    }
  }
  const modes = JSON.parse(readFileSync(tokensJson, "utf8"));
  const manifest = JSON.parse(readFileSync(join(root, "mini.json"), "utf8"));
  const extraCss = {};
  const stylesSrc = join(root, "src/styles");
  for (const f of existsSync(stylesSrc) ? readdirSync(stylesSrc) : []) if (f.endsWith(".css")) extraCss[f.replace(/\.css$/, "")] = readFileSync(join(stylesSrc, f), "utf8");
  for (const name of Object.keys(extraCss)) if (name !== "base" && !manifest.components.some((c) => c.name === name)) throw new Error(`src/styles/${name}.css 不对应 mini.json 里的组件`);
  // 组件 JS 里行内写的变量（var(--…)）也算用到
  const jsSource = readdirSync(join(root, "src")).filter((f) => /\.tsx?$/.test(f)).map((f) => readFileSync(join(root, "src", f), "utf8")).join("\n");
  const result = buildMini({ componentsCss: readFileSync(componentsPath, "utf8"), modes, manifest, extraCss, jsSource });
  const outDir = join(root, "styles");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const problems = { webview: [], skyline: [], notes: [] };
  const all = [["tokens.mini.css", result.tokens], ...[...result.files].map(([n, css]) => [`${n.toLowerCase()}.mini.css`, css])];
  for (const [file, css] of all) {
    writeFileSync(join(outDir, file), css);
    const p = audit(css);
    problems.webview.push(...p.webview.map((x) => `${file}：${x}`));
    problems.skyline.push(...p.skyline);
    problems.notes.push(...p.notes);
  }
  const mixes = Object.fromEntries([...result.mixes].sort(([a], [b]) => a.localeCompare(b)));
  const { prefersContrast, ...runtimeModes } = modes;
  void prefersContrast;
  writeFileSync(join(outDir, "vars.js"), `// 由 scripts/build-mini.mjs 生成，请勿手改。\n// 运行时（XxdPage）用：各外观的令牌（@xxd/tokens 的 tokens.json）和派生色（网页版的 color-mix，小程序里由 JS 算好）\nexport const MODES = ${JSON.stringify(runtimeModes)};\nexport const MIXES = ${JSON.stringify(mixes)};\n// 组件样式里用到的令牌：根节点上的行内变量只写这些（色阶的数字令牌大多用不到）\nexport const USED = ${JSON.stringify([...result.usedVars].sort())};\n`);
  writeFileSync(join(outDir, "vars.d.ts"), `import type { TokenModes } from "@xxd/tokens/resolve";\nexport declare const MODES: TokenModes;\nexport declare const MIXES: Record<string, string>;\nexport declare const USED: string[];\n`);
  writeFileSync(join(outDir, "theme.json"), JSON.stringify(themeJson(modes), null, 2) + "\n");
  writeFileSync(join(outDir, "REPORT.md"), reportMarkdown({ ...result, problems }));
  const total = all.reduce((n, [, css]) => n + Buffer.byteLength(css), 0);
  // 体积门禁按压缩后算（Taro 正式构建会压缩样式）
  const { transformSync } = require("esbuild");
  const minified = all.reduce((n, [, css]) => n + Buffer.byteLength(transformSync(css, { loader: "css", minify: true }).code), 0);
  console.log(`@xxd/mini 样式：${all.length} 个文件，${(total / 1024).toFixed(1)} KB（压缩后 ${(minified / 1024).toFixed(1)} KB）；派生色 ${result.mixes.size} 种；WebView 不允许的写法 ${problems.webview.length}，Skyline 还差 ${problems.skyline.length}`);
  if (problems.webview.length) {
    for (const p of problems.webview.slice(0, 20)) console.error(`  ✗ ${String(p)}`);
    process.exit(1);
  }
  if (minified > SIZE_BUDGET) {
    console.error(`✗ 样式压缩后超过 ${SIZE_BUDGET / 1024} KB（${(minified / 1024).toFixed(1)} KB）`);
    process.exit(1);
  }
}
