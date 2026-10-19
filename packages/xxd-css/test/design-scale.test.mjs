// 设计师评审 V2：文档写的刻度和组件 CSS 对得上。设计师按令牌出稿，开发按 CSS 实现，两边必须是同一组数字。
//   行高只用 --leading-*（单行控件写 1）；间距只用 --space-* 或由它和图标尺寸算出来；断点只有 480 / 640 / 1024；
//   字号只用 --text-*（15px 那一档不用了）；禁用态用 --disabled-*，不用半透明。
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const files = readdirSync(join(root, "src/css")).map((f) => [f, readFileSync(join(root, "src/css", f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")]);
const tokens = readFileSync(join(root, "../xxd-tokens/tokens.css"), "utf8");

/** 所有声明：[文件, 选择器, 属性, 值] */
function decls() {
  const out = [];
  for (const [f, css] of files) {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim().split("\n").pop().trim();
      for (const d of m[2].split(";")) {
        const i = d.indexOf(":");
        if (i === -1) continue;
        out.push([f, sel, d.slice(0, i).trim(), d.slice(i + 1).trim()]);
      }
    }
  }
  return out;
}

describe("刻度", () => {
  it("行高：只用 --leading-*，单行控件写 1", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls()) {
      if (prop === "line-height" && !/^(var\(--leading-[a-z]+\)|1|inherit|normal)$/.test(value)) bad.push(`${f} ${sel} line-height: ${value}`);
      if (prop === "font") {
        const lh = value.match(/\)\s*\/\s*([^\s]+(?:\([^)]*\))?)/)?.[1];
        if (lh && !/^(var\(--leading-[a-z]+\)|1)$/.test(lh)) bad.push(`${f} ${sel} font: ${value}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("字号：只用 --text-*，不写死 px，也不用已经去掉的 --text-md（15px）", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls()) {
      // 相对写法（calc(1em - 1px)：行内等宽字比周围小一号）不算写死
      if ((prop === "font-size" || prop === "font") && /(^|\s)\d+(\.\d+)?px/.test(value.replace(/var\([^)]*\)|calc\(1em - \dpx\)/g, ""))) bad.push(`${f} ${sel} ${prop}: ${value}`);
      if (/--text-md\b/.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    }
    expect(bad).toEqual([]);
  });

  it("间距：padding / gap / margin 只写 --space-*（或由它算出来），字面值只放行 0、1px 和负的补偿", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls()) {
      if (!/^(padding|margin|gap|row-gap|column-gap)(-[a-z-]+)?$/.test(prop)) continue;
      const literal = value.replace(/calc\([^;]*\)|var\([^)]*\)|min\([^)]*\)|max\([^)]*\)/g, "");
      for (const m of literal.matchAll(/(-?)(\d+(?:\.\d+)?)px/g)) if (!m[1] && Number(m[2]) > 1) bad.push(`${f} ${sel} ${prop}: ${value}`);
    }
    expect(bad).toEqual([]);
  });

  it("断点：只有 480 / 640 / 1024（和 tokens.css 的 --bp-* 一致）", () => {
    const allowed = new Set([...tokens.matchAll(/--bp-[a-z]+: (\d+)px/g)].map((m) => m[1]));
    expect([...allowed].sort()).toEqual(["1024", "480", "640"]);
    const bad = [];
    for (const [f, css] of files) for (const m of css.matchAll(/@media[^{]*?(?:min|max)-width:\s*(\d+)px/g)) if (!allowed.has(m[1])) bad.push(`${f} ${m[0]}`);
    expect(bad).toEqual([]);
  });

  it("禁用态：用 --disabled-* 令牌，不用半透明", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls()) if (/:disabled|aria-disabled="true"/.test(sel) && !/:not\(/.test(sel) && prop === "opacity") bad.push(`${f} ${sel} opacity: ${value}`);
    expect(bad).toEqual([]);
    for (const t of ["--disabled-ink", "--disabled-bg", "--disabled-line"]) expect(tokens).toContain(`${t}:`);
  });
});

describe("颜色色阶（COLOR-SCALE-PLAN S3）", () => {
  it("组件里不现场混色：用色阶的用途名（--danger-tint、--accent-border……）；例外要在同一行写明原因", () => {
    const bad = [];
    for (const f of readdirSync(join(root, "src/css"))) {
      readFileSync(join(root, "src/css", f), "utf8").split("\n").forEach((line, i) => {
        if (line.includes("color-mix(") && !line.includes("color-mix 例外")) bad.push(`${f}:${i + 1} ${line.trim()}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it("用到的用途名都在令牌里", () => {
    const missing = new Set();
    for (const [, css] of files) for (const m of css.matchAll(/var\((--(?:accent|success|danger|warning)-[a-z-]+)\)/g)) if (!tokens.includes(`${m[1]}:`)) missing.add(m[1]);
    expect([...missing]).toEqual([]);
  });
});
