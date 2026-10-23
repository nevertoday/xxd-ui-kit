#!/usr/bin/env node
// 图标来源自查（评审 D15）：把小小东图标的每个形状和另一套 24 网格图标（比如 Lucide）逐个比对。
//   mkdir /tmp/lucide && cd /tmp/lucide && npm pack lucide-static && tar -xzf lucide-static-*.tgz
//   node scripts/verify/icon-similarity.mjs /tmp/lucide/package/icons
// 列出：整个图标完全相同的、以及每个相同的形状。只读，不改任何文件。
// 直线、居中的圆、打勾这类基本笔画在同一个网格上难免重合；要看的是有没有复杂路径一模一样。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const { ICON_NODES } = await import(new URL("../../packages/xxd-icons/src/nodes.js", import.meta.url).href);
const dir = process.argv[2];
// 每个形状变成一段规范化的字符串（标签 + 属性，数字统一格式）
const num = (s) => String(s).replace(/-?\d*\.?\d+/g, (n) => String(Number(n)));
const shape = (tag, attrs) => `${tag}:${Object.entries(attrs).filter(([k]) => !/^(key|fill|stroke|class)/.test(k)).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${num(v).replace(/\s+/g, " ").replace(/\s*([a-zA-Z,])\s*/g, "$1").trim()}`).join(";")}`;
const lucide = new Map(); // shape -> [icon names]
/** @type {[string, Set<string>][]} */
const lucideSets = [];
for (const f of readdirSync(dir)) {
  const svg = readFileSync(join(dir, f), "utf8");
  const shapes = [...svg.matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\s([^>]*?)\/?>/g)].map(([, tag, a]) => shape(tag, Object.fromEntries([...a.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))));
  lucideSets.push([f.replace(".svg", ""), new Set(shapes)]);
  for (const s of shapes) (lucide.get(s) ?? lucide.set(s, []).get(s)).push(f.replace(".svg", ""));
}
let whole = [], partial = 0, shapesTotal = 0, shapesHit = 0;
for (const [name, nodes] of Object.entries(ICON_NODES)) {
  const ours = nodes.map(([tag, attrs]) => shape(tag, attrs));
  shapesTotal += ours.length;
  const hits = ours.filter((s) => lucide.has(s));
  shapesHit += hits.length;
  if (hits.length) partial += 1;
  const same = lucideSets.find(([, set]) => set.size === ours.length && ours.every((s) => set.has(s)));
  if (same) whole.push(`${name} = lucide/${same[0]}`);
}
console.log(`我们的图标 ${Object.keys(ICON_NODES).length} 个、形状 ${shapesTotal} 个；Lucide ${lucideSets.length} 个`);
console.log(`和某个 Lucide 图标完全相同（所有形状一样）：${whole.length} 个`);
whole.forEach((w) => console.log("  " + w));
console.log(`至少有一个形状和 Lucide 某个形状相同的图标：${partial} 个；相同的形状 ${shapesHit} / ${shapesTotal}`);
const seen = new Map();
for (const [name, nodes] of Object.entries(ICON_NODES)) for (const [tag, attrs] of nodes) { const s = shape(tag, attrs); if (lucide.has(s)) (seen.get(s) ?? seen.set(s, []).get(s)).push(name); }
for (const [s, names] of [...seen].sort((a, b) => b[1].length - a[1].length)) console.log(`${s.slice(0, 70).padEnd(70)} ← ${names.slice(0, 4).join(" ")}${names.length > 4 ? " …" : ""}`);
