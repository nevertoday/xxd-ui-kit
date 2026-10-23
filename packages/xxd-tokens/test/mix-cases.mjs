// 要和浏览器对一遍的 color-mix() 表达式：令牌里的每一个，在亮 / 暗 × 墨色 + 18 个主色下把 var() 换掉以后的样子。
import { readFileSync } from "node:fs";
import { ACCENT_PRESETS, accentPalette } from "../src/accent.js";

const json = JSON.parse(readFileSync(new URL("../dist/tokens.json", import.meta.url), "utf8"));

/** 只换 var()、不算 color-mix：留下浏览器要算的那个表达式 */
function substitute(value, vars, depth = 0) {
  if (depth > 20) return value;
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) => (vars[name] == null ? `var(${name})` : substitute(vars[name], vars, depth + 1)));
}

export function mixExpressions() {
  const set = new Set();
  for (const theme of ["light", "dark"]) {
    for (const accent of ["", ...ACCENT_PRESETS.map((p) => p.id)]) {
      const vars = { ...json.base, ...(theme === "dark" ? json.dark : {}) };
      if (accent) Object.assign(vars, accentPalette(accent), json.accent, theme === "dark" ? json.darkAccent : {});
      for (const value of Object.values(vars)) {
        for (const m of substitute(value, vars).matchAll(/color-mix\((?:[^()]|\([^()]*\))*\)/g)) set.add(m[0]);
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
