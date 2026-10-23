// Skyline（微信的新渲染引擎）的后备声明（docs/maintainers/MINIPROGRAM-PLAN.md M6）。
// 小程序里 WebView 和 Skyline 用同一份 WXSS，所以不改原来的写法，而是在每条 Skyline 不支持的声明前面先写一条它支持的同名声明：
// WebView 用后面那条（原来的样子）；Skyline 不认后面那条，落到前面的。
// 依据：Skyline 样式文档（developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/wxss.html）——
//   display 只有 none / flex / block；没有 currentColor、em；box-shadow 只能一层；没有 sticky；overflow 只有 hidden / visible；
//   背景和遮罩只能一张图。:not、:only-child、:empty、兄弟选择器要微信 8.0.49，:nth-child 要 8.0.50（最低版本定 8.0.50，不算缺口）。
// currentColor 的后备：每条 color 声明前面多写一个继承的变量 --xxd-current，后备里用 var(--xxd-current, var(--ink))——和 currentColor 一样跟着文字颜色走。

/** 声明块按顶层分号切开（括号、引号里的分号不算：data:image/svg+xml;base64 里就有） */
export function splitDecls(body) {
  const out = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quote) {
      if (ch === quote && body[i - 1] !== "\\") quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === ";" && depth === 0) {
      out.push(body.slice(start, i));
      start = i + 1;
    }
  }
  out.push(body.slice(start));
  return out;
}

const parse = (raw) => {
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const m = text.match(/^\s*(-{0,2}[\w-]+)\s*:\s*([\s\S]*?)\s*$/);
  return m ? { prop: m[1].toLowerCase(), value: m[2] } : null;
};

/** 按顶层逗号切开 */
function splitComma(value) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "(") depth += 1;
    else if (value[i] === ")") depth -= 1;
    else if (value[i] === "," && depth === 0) {
      out.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(value.slice(start).trim());
  return out;
}

const BASE_FONT = 13; // --text-sm：没写 font-size 时 em 按它算

/**
 * 一条声明在 Skyline 里有没有问题。返回 null（没问题），或者 { label, fallback: [[属性, 值], …] }（fallback 为空表示没法给后备）。
 * ctx.fontPx：同一条规则里写的 px 字号（em 按它算）
 */
export function skylineIssue(prop, value, ctx = {}) {
  const v = value.replace(/\s*!important\s*$/, "");
  const important = /!important\s*$/.test(value) ? " !important" : "";
  if (prop.startsWith("--")) return null;
  if (prop === "display") {
    if (/^(none|flex|block)$/.test(v)) return null;
    if (/^(grid|inline-grid)$/.test(v)) return { label: "display: grid", fallback: [["display", `flex${important}`], ["flex-direction", "column"]] };
    if (v === "inline-flex") return { label: "display: inline-flex", fallback: [["display", `flex${important}`]] };
    return { label: `display: ${v}`, fallback: [["display", `block${important}`]] };
  }
  if (/currentcolor/i.test(v)) return { label: "currentColor", fallback: [[prop, v.replace(/currentcolor/gi, "var(--xxd-current, var(--ink))") + important]] };
  if (/(^|[\s(,])-?[\d.]+em\b/.test(v)) {
    const base = prop === "font-size" ? BASE_FONT : (ctx.fontPx ?? BASE_FONT);
    return { label: "em 单位", fallback: [[prop, v.replace(/(-?[\d.]+)em\b/g, (_, n) => `${Math.round(parseFloat(n) * base * 100) / 100}px`) + important]] };
  }
  if (prop === "position" && v === "sticky") return { label: "position: sticky", fallback: [["position", `relative${important}`]] };
  if (/^overflow(-[xy])?$/.test(prop) && /\b(auto|scroll|clip|overlay)\b/.test(v)) return { label: `${prop}: ${v}`, fallback: [[prop, `hidden${important}`]] };
  if ((prop === "box-shadow" || prop === "text-shadow") && splitComma(v).length > 1) return { label: "多层阴影", fallback: [[prop, splitComma(v)[0] + important]] };
  if (/^(background-image|mask-image|-webkit-mask-image|background|mask|-webkit-mask)$/.test(prop) && (v.match(/url\(|gradient\(/g) || []).length > 1) {
    const first = splitComma(v)[0];
    return { label: `${prop} 多张图`, fallback: [[prop, first + important]] };
  }
  return null;
}

// 里面会放图标、转圈（用 currentColor 画）的组件：只有这些规则的文字颜色要多记一份 --xxd-current
const CURRENT_HOSTS = /\.(xxd-(btn|toast|empty|input-wrap|input-clear|row|cell|tabbar|collapse|steps|uploader|chip|loadmore|loading|page|overlay|link|segmented|tabs|sheet|dialog|navbar|topbar|swipe|text)|ui-icon|is-tone-)/;

/** 给一个声明块加上 Skyline 的后备声明（已经有后备的不重复加）。selector 用来判断要不要记 --xxd-current */
export function addSkylineFallbacks(body, selector = ".xxd-page") {
  const pieces = splitDecls(body);
  const decls = pieces.map(parse);
  const fontPx = decls.find((d) => d?.prop === "font-size" && /^[\d.]+px$/.test(d.value))?.value;
  const ctx = { fontPx: fontPx ? parseFloat(fontPx) : undefined };
  const out = [];
  const indent = body.match(/\n(\s+)\S/)?.[1] ?? "  ";
  for (let i = 0; i < pieces.length; i += 1) {
    const d = decls[i];
    if (d) {
      // 文字颜色：多记一个会继承的变量，currentColor 的后备用它
      if (d.prop === "color" && CURRENT_HOSTS.test(selector) && !/currentcolor/i.test(d.value) && !/^(inherit|initial|unset|transparent)$/.test(d.value)) out.push(`\n${indent}--xxd-current: ${d.value.replace(/\s*!important$/, "")}`);
      const issue = skylineIssue(d.prop, d.value, ctx);
      const prev = decls[i - 1];
      const hasFallback = issue && prev && issue.fallback.some(([p, v]) => p === prev.prop && v === prev.value);
      if (issue && !hasFallback) for (const [p, v] of issue.fallback) out.push(`\n${indent}${p}: ${v}`);
    }
    out.push(pieces[i]);
  }
  return out.join(";");
}

/**
 * 一份 WXSS 在 Skyline 里还有哪些写法没有后备。返回 { missing: [说明], covered: 有后备的条数, media: [Skyline 不认的 @media] }
 */
export function skylineGaps(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const missing = [];
  let covered = 0;
  const media = [];
  for (const m of text.matchAll(/@media([^{]+)\{/g)) if (!/prefers-color-scheme/.test(m[1])) media.push(m[1].trim());
  // 同一个选择器在别的规则里给了 Skyline 认得的值（压缩工具常把同选择器的规则合并、把后备挪走）：也算有后备
  const safe = new Set();
  for (const m of text.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g, " ");
    for (const d of splitDecls(m[2]).map(parse).filter(Boolean)) if (!skylineIssue(d.prop, d.value)) safe.add(`${sel}|${d.prop}`);
  }
  for (const m of text.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith("@") || /^(from|to|\d+%)/.test(sel)) continue;
    const decls = splitDecls(m[2]).map(parse).filter(Boolean);
    const fontPx = decls.find((d) => d.prop === "font-size" && /^[\d.]+px$/.test(d.value))?.value;
    for (let i = 0; i < decls.length; i += 1) {
      const d = decls[i];
      const issue = skylineIssue(d.prop, d.value, { fontPx: fontPx ? parseFloat(fontPx) : undefined });
      if (!issue) continue;
      // 前面有一条同名的、Skyline 认得的声明 = 有后备
      const ok = decls.slice(0, i).some((p) => p.prop === d.prop && !skylineIssue(p.prop, p.value)) || safe.has(`${sel.replace(/\s+/g, " ")}|${d.prop}`);
      if (ok) covered += 1;
      else missing.push(`${issue.label}：${sel.split("\n")[0].slice(0, 60)}`);
    }
  }
  return { missing, covered, media };
}
