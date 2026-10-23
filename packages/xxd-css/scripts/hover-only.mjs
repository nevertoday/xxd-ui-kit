// 触屏上悬停会粘住（TOUCH-REVIEW-PLAN）：手指点过一下，:hover 一直留在那个元素上，按钮像是还被按着、列表行像是被选中。
// 构建时把「正在悬停」的选择器包进 @media (hover: hover)：只有能悬停的指针（鼠标、触控板）才有悬停样子。
//   · 选择器列表里只挪带 :hover 的那几个，别的（:focus-visible、禁用）留在原处；
//   · :hover 写在 :not(…) 里、或者和别的状态写在同一个 :is(…) / :where(…) 里的不动（包进去会改掉别的状态的意思）。
// 源码照旧写 :hover，测试读的也是源码；只改构建产物。

/** 按顶层逗号拆选择器列表（括号里的逗号不拆） */
export function splitList(sel) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < sel.length; i += 1) {
    const ch = sel[i];
    if (ch === "\\") {
      cur += sel.slice(i, i + 2);
      i += 1;
      continue;
    }
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * 这个选择器是不是「正在悬停」：:hover 直接写在复合选择器上，或者在 :has(…) 里、只有它一项的 :is(…) / :where(…) 里。
 * 在 :not(…) 里（「没在悬停」）、和别的状态并列在 :is(…) 里的：不动。
 */
export function hoverState(sel) {
  if (!sel.includes(":hover")) return "none";
  const stack = []; // [函数名, 开括号的位置]
  let state = "none";
  for (let i = 0; i < sel.length; i += 1) {
    const ch = sel[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "(") stack.push([sel.slice(0, i).match(/:([\w-]+)$/)?.[1] ?? "", i]);
    else if (ch === ")") stack.pop();
    else if (sel.startsWith(":hover", i) && !/[\w-]/.test(sel[i + 6] ?? "")) {
      for (const [fn, at] of stack) {
        if (fn === "not") return "nested";
        if ((fn === "is" || fn === "where") && splitList(sel.slice(at + 1, closing(sel, at))).length > 1) return "nested";
      }
      state = "plain";
    }
  }
  return state;
}

const closing = (s, open) => {
  let depth = 0;
  for (let i = open; i < s.length; i += 1) {
    if (s[i] === "(") depth += 1;
    if (s[i] === ")" && --depth === 0) return i;
  }
  return s.length;
};

/** 把 css 里「正在悬停」的规则包进 @media (hover: hover)。返回 [新 css, 包了几条] */
export function hoverOnly(css) {
  let out = "";
  let i = 0;
  let wrapped = 0;
  const n = css.length;
  // 读到和 open 配对的 }，返回块里面的内容和结束位置
  const block = (start) => {
    let depth = 1;
    let j = start;
    while (j < n && depth) {
      if (css.startsWith("/*", j)) {
        j = css.indexOf("*/", j + 2) + 2;
        continue;
      }
      const ch = css[j];
      // 转义的字符（Tailwind 的类名里有 \' \[ 这种）：跳过，不当成字符串或括号
      if (ch === "\\") {
        j += 2;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const q = ch;
        j += 1;
        while (j < n && css[j] !== q) j += css[j] === "\\" ? 2 : 1;
      } else if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      j += 1;
    }
    return [css.slice(start, j - 1), j];
  };
  while (i < n) {
    // 找下一个 { 或 }（跳过注释和字符串）
    let j = i;
    let prelude = "";
    while (j < n) {
      if (css.startsWith("/*", j)) {
        const e = css.indexOf("*/", j + 2) + 2;
        prelude += css.slice(j, e);
        j = e;
        continue;
      }
      const ch = css[j];
      if (ch === "\\") {
        prelude += css.slice(j, j + 2);
        j += 2;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const q = ch;
        let k = j + 1;
        while (k < n && css[k] !== q) k += css[k] === "\\" ? 2 : 1;
        prelude += css.slice(j, k + 1);
        j = k + 1;
        continue;
      }
      if (ch === "{" || ch === ";" || ch === "}") break;
      prelude += ch;
      j += 1;
    }
    if (j >= n) {
      out += prelude;
      break;
    }
    if (css[j] !== "{") {
      out += prelude + css[j];
      i = j + 1;
      continue;
    }
    const [body, end] = block(j + 1);
    const lead = prelude.match(/^\s*(?:\/\*[\s\S]*?\*\/\s*)*/)[0];
    const head = prelude.slice(lead.length);
    if (head.trim().startsWith("@")) {
      // @layer / @media / @supports：里面递归；@keyframes、@font-face、@property 原样
      // 已经在 @media (hover: hover) 里的不再包（转换可以重复跑）
      if (/^\s*@media\s*\(\s*hover\s*:\s*hover\s*\)\s*$/.test(head)) out += `${prelude}{${body}}`;
      else if (/^\s*@(layer|media|supports|container|scope)\b/.test(head)) {
        const [inner, k] = hoverOnly(body);
        wrapped += k;
        out += `${prelude}{${inner}}`;
      } else out += `${prelude}{${body}}`;
    } else {
      const sels = splitList(head);
      const hover = sels.filter((s) => hoverState(s) === "plain");
      if (!hover.length) out += `${prelude}{${body}}`;
      else {
        wrapped += 1;
        const rest = sels.filter((s) => hoverState(s) !== "plain");
        const indent = (lead.match(/[^\S\n]*$/) ?? [""])[0];
        out += lead;
        if (rest.length) out += `${rest.join(",\n" + indent)} {${body}}\n${indent}`;
        out += `@media (hover: hover) {\n${indent}${hover.join(",\n" + indent)} {${body}}\n${indent}}`;
      }
    }
    i = end;
  }
  return [out, wrapped];
}
