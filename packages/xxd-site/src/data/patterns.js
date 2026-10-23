// 小小东模式（优化计划 O4）：来自 packages/xxd-css/patterns.json（和注册表一样是唯一来源）；英文从 patterns.en.js 叠上去。
import data from "../../../xxd-css/patterns.json";
import { patterns as en } from "../../../xxd-css/patterns.en.js";

export const patterns = data.patterns.map((p) => ({ ...p, label: p.zh }));

export function patternsFor(lang = "zh") {
  if (lang !== "en") return patterns;
  return patterns.map((p) => {
    const { title, ...rest } = en[p.name] ?? {};
    return { ...p, ...rest, label: title ?? p.name };
  });
}
