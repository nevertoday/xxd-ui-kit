// 注册表与 CSS 一致：注册表里的每个类都真的存在；CSS 里的每个组件根类都登记了。
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as registryEn from "../registry.en.js";
import { patterns as patternsEn } from "../patterns.en.js";

const root = join(import.meta.dirname, "..");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const patternsFile = JSON.parse(readFileSync(join(root, "patterns.json"), "utf8"));
const css = readdirSync(join(root, "src/css")).map((f) => readFileSync(join(root, "src/css", f), "utf8")).join("\n");
const defined = new Set([...css.matchAll(/\.((?:xxd-[\w-]+)|ui-dialog-cancel)/g)].map((m) => m[1]));

describe("registry.json", () => {
  it("每个组件有名字、中文名、分类、示例", () => {
    for (const c of registry.components) {
      expect(c.name && c.zh && c.category && c.markup, c.name).toBeTruthy();
      for (const k of ["a11y", "rules", "classes"]) if (c[k] !== undefined) expect(Array.isArray(c[k]), `${c.name}.${k} 要是数组`).toBe(true);
    }
    const names = registry.components.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("每个组件都有简介和「键盘与读屏」说明（O8）", () => {
    const missing = registry.components.filter((c) => !c.summary || !c.a11y?.length).map((c) => c.name);
    expect(missing).toEqual([]);
  });

  it("示例里没有写死的宽度（width: Npx 会在手机上溢出，用 max-width）", () => {
    const bad = [...registry.components, ...patternsFile.patterns].filter((c) => /style="[^"]*(?<!max-|min-)width:\s*\d+px/.test(c.markup)).map((c) => c.name);
    expect(bad).toEqual([]);
  });

  it("模式（patterns.json）登记的类也都存在，slug 唯一", () => {
    const missing = patternsFile.patterns.flatMap((p) => p.classes.filter((k) => !defined.has(k)).map((k) => `${p.name}: ${k}`));
    expect(missing).toEqual([]);
    const slugs = patternsFile.patterns.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("登记的类在 CSS 里都存在", () => {
    const missing = registry.components.flatMap((c) => c.classes.filter((k) => !defined.has(k)).map((k) => `${c.name}: ${k}`));
    expect(missing).toEqual([]);
  });

  it("CSS 里的类都登记在某个组件下（工具类除外）", () => {
    const listed = new Set([...registry.components.flatMap((c) => c.classes), ...patternsFile.patterns.flatMap((p) => p.classes)]);
    const utilities = new Set(["xxd-page", "xxd-sr-only", "xxd-sr-only-focusable", "xxd-frame", "xxd-title", "xxd-heading", "xxd-muted", "xxd-small", "xxd-mono", "xxd-divider", "xxd-read", "xxd-stack", "xxd-cluster"]);
    const unlisted = [...defined].filter((k) => !listed.has(k) && !utilities.has(k));
    expect(unlisted).toEqual([]);
  });
});

// 英文版（展示站 /en/）：中文里有汉字的字段，英文版都要有，而且英文里没有汉字；结构（条数、示例数）和中文一致。
const han = /\p{Script=Han}/u;
const hasHan = (v) => han.test(JSON.stringify(v ?? ""));
const SKIP = new Set(["zh", "name", "slug", "category", "classes", "react", "states"]);
function englishGaps(items, en) {
  const gaps = [];
  for (const item of items) {
    const e = en[item.name];
    if (!e) {
      gaps.push(`${item.name}: 没有英文`);
      continue;
    }
    if (!e.title) gaps.push(`${item.name}.title`);
    for (const [k, v] of Object.entries(item)) if (!SKIP.has(k) && hasHan(v) && e[k] === undefined) gaps.push(`${item.name}.${k} 缺英文`);
    for (const [k, v] of Object.entries(e)) if (hasHan(v)) gaps.push(`${item.name}.${k} 英文里有汉字`);
    for (const k of ["rules", "a11y", "anatomy", "examples"]) if (item[k] && e[k] && item[k].length !== e[k].length) gaps.push(`${item.name}.${k} 条数不同`);
    if (item.attributes && e.attributes && Object.keys(item.attributes).length !== Object.keys(e.attributes).length) gaps.push(`${item.name}.attributes 条数不同`);
  }
  for (const k of Object.keys(en)) if (!items.some((i) => i.name === k)) gaps.push(`多出来的英文：${k}`);
  return gaps;
}
const classesIn = (markup) => [...markup.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((k) => k.startsWith("xxd-"));

describe("英文版（registry.en.js / patterns.en.js）", () => {
  it("每个组件都有英文，英文里没有汉字", () => {
    expect(englishGaps(registry.components, registryEn.components)).toEqual([]);
    const cats = [...new Set(registry.components.map((c) => c.category))];
    expect(cats.filter((c) => !registryEn.categories[c])).toEqual([]);
  });

  it("每个模式都有英文，英文里没有汉字", () => {
    expect(englishGaps(patternsFile.patterns, patternsEn)).toEqual([]);
  });

  it("英文示例里用到的类都存在，而且和中文示例用的是同一组类", () => {
    const bad = [];
    for (const c of [...registry.components, ...patternsFile.patterns]) {
      const e = registryEn.components[c.name] ?? patternsEn[c.name];
      if (!e?.markup) continue;
      const zhSet = new Set(classesIn(c.markup));
      for (const k of classesIn(e.markup)) {
        if (!defined.has(k)) bad.push(`${c.name}: ${k} 不存在`);
        else if (!zhSet.has(k)) bad.push(`${c.name}: ${k} 中文示例里没有`);
      }
      for (const k of zhSet) if (!classesIn(e.markup).includes(k)) bad.push(`${c.name}: 英文示例少了 ${k}`);
    }
    expect(bad).toEqual([]);
  });
});

describe("示例代码本身达标（会被 doc 命令和 AI 照抄到每个项目）", () => {
  const all = [...registry.components.flatMap((c) => [c.markup, ...(c.examples ?? []).map((e) => e.markup)].map((m) => [c.name, m])), ...patternsFile.patterns.map((p) => [p.name, p.markup])];
  it("aria-describedby / aria-labelledby / aria-controls 指向的 id 都在同一段示例里", () => {
    const bad = [];
    for (const [name, m] of all) {
      const ids = new Set([...m.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]));
      for (const ref of m.matchAll(/\baria-(?:describedby|labelledby|controls)="([^"]+)"/g)) for (const id of ref[1].split(/\s+/)) if (!ids.has(id)) bad.push(`${name}: ${id}`);
    }
    expect(bad).toEqual([]);
  });
  it("每一行 .xxd-error 都被某个 aria-describedby 引用（错误要连到输入框上）", () => {
    const bad = [];
    for (const [name, m] of all) {
      for (const e of m.matchAll(/<[^>]*class="[^"]*\bxxd-error\b[^"]*"[^>]*>/g)) {
        const id = /\bid="([^"]+)"/.exec(e[0])?.[1];
        if (!id || !new RegExp(`aria-describedby="[^"]*\\b${id}\\b`).test(m)) bad.push(name);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("示例不写死样子", () => {
  it("style 属性里只有布局和尺寸：颜色、背景、边框、字体、阴影交给类名和令牌（复制出去的代码不带写死的样子）", () => {
    const bad = [];
    for (const c of [...registry.components, ...patternsFile.patterns]) {
      for (const m of [c.markup, ...(c.examples ?? []).map((e) => e.markup)]) {
        for (const s of m.matchAll(/style="([^"]*)"/g)) if (/(^|;)\s*(color|background|border|font|box-shadow)\b/.test(s[1])) bad.push(`${c.name}: ${s[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});


it("质感：离按钮最近的 data-finish 说了算（不用会被外层 flat 一起匹配的祖先选择器）", () => {
  const css = readFileSync(join(root, "src/css/button.css"), "utf8");
  expect(css).not.toMatch(/:not\(\[data-finish="flat"\] \*/);
  // 变量放在 @xxd/tokens 里（原生和 React 读同一组，设计师评审 V1）
  const tokens = readFileSync(join(root, "../xxd-tokens/tokens.css"), "utf8");
  expect(tokens).toMatch(/\[data-finish="material"\] \{\n\s+--btn-edge/);
  expect(tokens).toMatch(/\[data-finish="flat"\] \{\n\s+--btn-edge: 100%/);
  expect(css).toMatch(/var\(--btn-highlight/);
});
