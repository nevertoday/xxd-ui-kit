// 终端输出：颜色（NO_COLOR / 非终端时不上色）、对齐、「你是不是想找」、复制到剪贴板、打开网址。
import { execFileSync, spawn } from "node:child_process";

const useColor = () => !process.env.NO_COLOR && (process.env.FORCE_COLOR || process.stdout.isTTY);
const wrap = (code, end) => (s) => (useColor() ? `\x1b[${code}m${s}\x1b[${end}m` : String(s));
export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  cyan: wrap(36, 39),
};

/** 显示宽度：中日韩字符算 2 格（对齐表格用）。 */
export function width(s) {
  let w = 0;
  // 去掉终端颜色码（ESC [ … m）再量宽度
  // eslint-disable-next-line no-control-regex
  for (const ch of String(s).replace(/\x1b\[[0-9;]*m/g, "")) w += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1;
  return w;
}
export const pad = (s, n) => String(s) + " ".repeat(Math.max(0, n - width(s)));

/** 把行排成列：rows 是字符串数组的数组，最后一列不补空格。 */
export function columns(rows, gap = 2) {
  const n = Math.max(0, ...rows.map((r) => r.length));
  const widths = Array.from({ length: n }, (_, i) => Math.max(0, ...rows.map((r) => (i < r.length - 1 ? width(r[i] ?? "") : 0))));
  return rows.map((r) => r.map((cell, i) => (i < r.length - 1 ? pad(cell ?? "", widths[i] + gap) : cell ?? "")).join("")).join("\n");
}

/** 编辑距离（「你是不是想找」）。 */
export function distance(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}

/** 从候选里找最像的几个：先看包含关系，再看编辑距离（不超过长度的三分之一，至少 1）。 */
export function suggest(word, candidates, max = 3) {
  const w = String(word).toLowerCase();
  if (!w) return [];
  const scored = [];
  for (const cand of candidates) {
    const l = cand.toLowerCase();
    if (l === w) return [cand];
    const dist = distance(w, l);
    const score = l.includes(w) || w.includes(l) ? Math.abs(l.length - w.length) / 10 : dist;
    if (score <= Math.max(1, Math.ceil(w.length / 3))) scored.push([score, cand]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].length - b[1].length).slice(0, max).map(([, cand]) => cand);
}

/** 复制到系统剪贴板；成功返回 true。 */
export function copy(text) {
  const tools = process.platform === "darwin" ? [["pbcopy", []]] : process.platform === "win32" ? [["clip", []]] : [["wl-copy", []], ["xclip", ["-selection", "clipboard"]], ["xsel", ["--clipboard", "--input"]]];
  for (const [cmd, args] of tools) {
    try {
      execFileSync(cmd, args, { input: text, stdio: ["pipe", "ignore", "ignore"] });
      return true;
    } catch {
      // 换下一个
    }
  }
  return false;
}

/** 用系统浏览器打开网址。 */
export function openUrl(url) {
  const [cmd, args] = process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
}
