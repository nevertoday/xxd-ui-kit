// 用 lightningcss 改选择器（不再用正则猜选择器在哪、长什么样）：
//   1. lightningcss 解析整份 CSS，拿到每条样式规则的选择器（AST）和它在源码里的位置；
//   2. 交给 fn 改写（一个选择器可以变成几个）；
//   3. 用 lightningcss 把新的选择器打印回文本，按位置换回去。
// 声明部分原样保留：lightningcss 把带 var() 的声明写回去时会出错（1.33），而且我们本来也不想改值的写法。
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { transform } = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../package.json"))("lightningcss");

/** 一个选择器 AST → 文本 */
export function printSelector(selector) {
  const out = transform({ filename: "selector.css", code: Buffer.from("a{color:red}"), visitor: { Selector: () => selector } }).code.toString();
  return out.slice(0, out.indexOf("{")).trim();
}

/**
 * 每条样式规则：选择器在源码里的位置和原文、它的声明块原文、外面套的 @media（没有就是 null）。
 * errorRecovery：别人项目里的 CSS（xxd-ui adopt）可能有 lightningcss 不认识的写法，跳过而不是报错。
 */
export function styleRules(css, { errorRecovery = false } = {}) {
  const found = [];
  const mediaOf = new Map();
  const lineStart = [0];
  for (let i = 0; i < css.length; i += 1) if (css[i] === "\n") lineStart.push(i + 1);
  const offset = (loc) => lineStart[loc.line] + loc.column - 1;
  transform({
    filename: "input.css",
    code: Buffer.from(css),
    errorRecovery,
    visitor: {
      Rule: {
        style(rule) {
          found.push({ loc: rule.value.loc, selectors: rule.value.selectors });
        },
        media(rule) {
          const at = offset(rule.value.loc);
          const query = css.slice(at, css.indexOf("{", at)).trim();
          for (const child of rule.value.rules) if (child.type === "style") mediaOf.set(offset(child.value.loc), query);
        },
      },
    },
  });
  return found.map(({ loc, selectors }) => {
    const start = offset(loc);
    const open = css.indexOf("{", start);
    const close = css.indexOf("}", open);
    return { start, open, selectors, selector: css.slice(start, open).trim(), body: css.slice(open + 1, close === -1 ? css.length : close), media: mediaOf.get(start) ?? null };
  });
}

/**
 * 按规则树走一遍：每条样式规则带上外面套着的 @media / @supports / @layer（由外到内，原文）。
 * 声明块原文按大括号配对切出来（里面有嵌套规则也不会切错）。
 */
export function ruleTree(css) {
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
        const close = matching(open);
        out.push({ start: at, open, close, selectors: r.value.selectors, body: css.slice(open + 1, close), wrappers });
      } else if (["media", "supports", "layer-block", "container"].includes(r.type) && r.value.rules) {
        walk(r.value.rules, [...wrappers, { type: r.type, prelude: css.slice(at, css.indexOf("{", at)).trim() }]);
      }
    }
  };
  transform({
    filename: "input.css",
    code: Buffer.from(css),
    visitor: {
      StyleSheet(sheet) {
        walk(sheet.rules, []);
      },
    },
  });
  return out;
}

/**
 * fn(selector) 返回一个或几个选择器（AST）；返回 null 表示不改。
 * 结果里每条规则的选择器用 ",\n" 连起来（和手写的格式一样，测试和人都好读）。
 */
export function rewriteSelectors(css, fn) {
  const edits = [];
  for (const { start, open, selectors } of styleRules(css)) {
    let changed = false;
    const next = [];
    for (const sel of selectors) {
      const result = fn(sel);
      if (result == null) next.push(sel);
      else {
        changed = true;
        next.push(...result);
      }
    }
    if (changed) edits.push([start, open, `${[...new Set(next.map(printSelector))].join(",\n")} `]);
  }
  let out = css;
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, start) + text + out.slice(end);
  return out;
}

const isCombinator = (c) => c.type === "combinator";
const isRoot = (c) => c.type === "pseudo-class" && c.kind === "root";

/** 选择器的第一段（第一个组合符之前）和剩下的 */
export function firstCompound(selector) {
  const i = selector.findIndex(isCombinator);
  return i === -1 ? [selector, []] : [selector.slice(0, i), selector.slice(i)];
}

/** :root[...] → :host([...])；只有 :root → :host。没有 :root 返回 null。 */
export function rootToHost(selector) {
  const [head, rest] = firstCompound(selector);
  if (!head.some(isRoot)) return null;
  const inner = head.filter((c) => !isRoot(c));
  const host = inner.length ? { type: "pseudo-class", kind: "host", selectors: inner } : { type: "pseudo-class", kind: "host" };
  return [host, ...rest];
}

/** :root[...] → :where(:root[...])（放进 layer 的令牌：再去掉优先级） */
export function rootToWhere(selector) {
  const [head, rest] = firstCompound(selector);
  if (!head.some(isRoot)) return null;
  return [{ type: "pseudo-class", kind: "where", selectors: [head] }, ...rest];
}
