// 把令牌算成具体的值：var() 换成它指向的值，color-mix() 算成颜色。
// 不碰 DOM：小程序（@xxd/mini）靠它把外观写进 page-style，网页版以后也可以用它出静态主题。
import { accentPalette, normalizeAccent } from "./accent.js";
import { DEFAULT_SETTINGS } from "./theme.js";

/** 找到 from 处的 "(" 对应的 ")"；没有返回 -1 */
function closing(text, from) {
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

/** 按顶层逗号切开（括号里的逗号不算） */
function splitTop(text) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") depth -= 1;
    else if (text[i] === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out;
}

/** 颜色文本 → [r, g, b, a]（r/g/b 0–255，a 0–1）；认不出返回 null */
export function parseColor(text) {
  const s = String(text).trim().toLowerCase();
  if (s === "transparent") return [0, 0, 0, 0];
  if (s === "black") return [0, 0, 0, 1];
  if (s === "white") return [255, 255, 255, 1];
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = s.match(/^rgba?\((.*)\)$/);
  if (m) {
    const parts = m[1].includes(",") ? m[1].split(",") : m[1].replace("/", " ").split(/\s+/);
    const nums = parts.map((p) => p.trim()).filter(Boolean);
    if (nums.length < 3) return null;
    const ch = (p) => (p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p));
    const a = nums[3] == null ? 1 : nums[3].endsWith("%") ? parseFloat(nums[3]) / 100 : parseFloat(nums[3]);
    const out = [ch(nums[0]), ch(nums[1]), ch(nums[2]), a];
    return out.some((v) => Number.isNaN(v)) ? null : out;
  }
  return null;
}

/** [r, g, b, a] → 文本：不透明写 #rrggbb，半透明写 rgba() */
export function formatColor([r, g, b, a]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
  if (a >= 0.9995) return `#${[r, g, b].map((v) => c(v).toString(16).padStart(2, "0")).join("")}`;
  return `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${Math.round(a * 1000) / 1000})`;
}

/**
 * color-mix(in srgb, A p%, B q%)：和浏览器同一个算法（CSS Color 5）——
 * 百分比缺一个就用 100 减另一个；都缺就各 50；和不到 100 时整体透明度按比例降；按预乘透明度插值。
 */
export function mixSrgb(a, pa, b, pb) {
  let p1 = pa;
  let p2 = pb;
  if (p1 == null && p2 == null) p1 = p2 = 50;
  else if (p1 == null) p1 = 100 - p2;
  else if (p2 == null) p2 = 100 - p1;
  const sum = p1 + p2;
  if (sum <= 0) return null;
  const w1 = p1 / sum;
  const w2 = p2 / sum;
  const alpha = a[3] * w1 + b[3] * w2;
  const scale = sum < 100 ? sum / 100 : 1;
  if (alpha === 0) return [0, 0, 0, 0];
  const ch = (i) => (a[i] * a[3] * w1 + b[i] * b[3] * w2) / alpha;
  return [ch(0), ch(1), ch(2), alpha * scale];
}

const MIX_ARG = /^(.*?)(?:\s+(-?[\d.]+)%)?$/s;

/** 算一个 color-mix(...) 的参数（已经没有 var()）；只认 srgb，别的空间返回 null */
function evalMix(inner) {
  const [space, ...colors] = splitTop(inner);
  if (space.replace(/\s+/g, " ").trim() !== "in srgb" || colors.length !== 2) return null;
  const parsed = colors.map((arg) => {
    const m = arg.trim().match(MIX_ARG);
    // 百分比也可以写在颜色前面：color-mix(in srgb, 40% red, blue)
    const lead = m[1].match(/^(-?[\d.]+)%\s+(.*)$/s);
    return lead ? { color: parseColor(lead[2]), p: parseFloat(lead[1]) } : { color: parseColor(m[1]), p: m[2] == null ? null : parseFloat(m[2]) };
  });
  if (parsed.some((x) => !x.color)) return null;
  const out = mixSrgb(parsed[0].color, parsed[0].p, parsed[1].color, parsed[1].p);
  return out && formatColor(out);
}

/**
 * 把一个值里的 var() 和 color-mix() 都算掉。vars 是 { "--名字": 原始值 }。
 * 找不到的 var() 用它的缺省值；连缺省值也没有就原样留着（交给运行环境）。循环引用原样留着。
 */
export function resolveValue(value, vars, seen = new Set()) {
  let text = String(value);
  // 先换 var()（从里往外：缺省值里也可能有 var()）
  for (let at = text.lastIndexOf("var("); at !== -1; at = text.lastIndexOf("var(", at - 1)) {
    const end = closing(text, at + 3);
    if (end === -1) break;
    const [name, ...rest] = splitTop(text.slice(at + 4, end));
    const fallback = rest.length ? rest.join(", ") : null;
    let next = null;
    if (Object.prototype.hasOwnProperty.call(vars, name) && !seen.has(name)) next = resolveValue(vars[name], vars, new Set([...seen, name]));
    else if (fallback != null) next = resolveValue(fallback, vars, seen);
    if (next != null) text = text.slice(0, at) + next + text.slice(end + 1);
    if (at === 0) break;
  }
  // 再算 color-mix()（从里往外）
  for (let at = text.lastIndexOf("color-mix("); at !== -1; at = text.lastIndexOf("color-mix(", at - 1)) {
    const end = closing(text, at + 9);
    if (end === -1) break;
    const out = evalMix(text.slice(at + 10, end));
    if (out) text = text.slice(0, at) + out + text.slice(end + 1);
    if (at === 0) break;
  }
  return text;
}

/** 整张表都算成具体的值 */
export function resolveVars(vars) {
  const out = {};
  for (const name of Object.keys(vars)) out[name] = resolveValue(vars[name], vars, new Set([name]));
  return out;
}

/**
 * 一种外观下的全部变量（已经算成具体的值）。
 *   modes：@xxd/tokens/dist/tokens.json 那样的表 { base, dark, rounded, compact, accent, darkAccent, coarse }
 *   extra：额外要算的变量（小程序的派生色 --mix-*），可以引用令牌
 *   system：「跟随系统」时系统现在是亮还是暗
 *   coarse：手机（没有鼠标）：点按区域放大一档
 * 合并顺序和 tokens.css 的层叠一样：基础 → 暗色 → 圆角 → 紧凑 → 主色 → 暗色主色。
 */
export function appearanceVars(settings = {}, { modes, extra = {}, system = "light", coarse = false, lock = {} } = {}) {
  if (!modes?.base) throw new Error("appearanceVars 需要 modes（tokens.json）");
  const s = { ...DEFAULT_SETTINGS, ...settings, ...lock };
  const theme = s.theme === "dark" || s.theme === "light" ? s.theme : system === "dark" ? "dark" : "light";
  const accent = normalizeAccent(s.accent);
  const vars = { ...modes.base };
  if (coarse) Object.assign(vars, modes.coarse);
  if (theme === "dark") Object.assign(vars, modes.dark);
  if (s.corners === "rounded") Object.assign(vars, modes.rounded);
  if (s.density === "compact") Object.assign(vars, modes.compact);
  if (accent) {
    Object.assign(vars, accentPalette(accent, "", { exact: s.accentMode === "exact" }), modes.accent);
    if (theme === "dark") Object.assign(vars, modes.darkAccent);
  }
  Object.assign(vars, extra);
  return { theme, accent, vars: resolveVars(vars) };
}
