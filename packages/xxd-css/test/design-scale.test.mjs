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
function decls(list = files) {
  const out = [];
  for (const [f, css] of list) {
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
      // 相对写法（等宽字比周围小一档、不小于 12：max(var(--text-xs), calc(1em - clamp(1px, 1em - 14px, 4px)))，TYPE-REVIEW-PLAN D69）不算写死
      if ((prop === "font-size" || prop === "font") && /(^|\s)\d+(\.\d+)?px/.test(value.replace(/var\([^)]*\)|calc\(1em - clamp\(1px, 1em - 14px, 4px\)\)/g, ""))) bad.push(`${f} ${sel} ${prop}: ${value}`);
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

// SPACING-REVIEW-PLAN D60：展示站（别人最先看到的）和小程序守同一把尺子
const read = (dir) => readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => [f, readFileSync(join(dir, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")]);
const outside = [
  ...read(join(root, "../xxd-site/public")).map(([f, c]) => [`xxd-site/${f}`, c]),
  ...read(join(root, "../xxd-mini/src/styles")).map(([f, c]) => [`xxd-mini/${f}`, c]),
];

describe("展示站和小程序也守刻度（SPACING-REVIEW-PLAN D60）", () => {
  it("间距只写 --space-* / 用途令牌（或由它们算出来）", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls(outside)) {
      if (!/^(padding|margin|gap|row-gap|column-gap)(-[a-z-]+)?$/.test(prop)) continue;
      const literal = value.replace(/calc\([^;]*\)|var\([^)]*\)|min\([^)]*\)|max\([^)]*\)/g, "");
      for (const m of literal.matchAll(/(-?)(\d+(?:\.\d+)?)px/g)) if (!m[1] && Number(m[2]) > 1) bad.push(`${f} ${sel} ${prop}: ${value}`);
    }
    expect(bad).toEqual([]);
  });

  it("行高只用 --leading-*（单行写 1），字号不用已经去掉的 15px", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls(outside)) {
      if (prop === "line-height" && !/^(var\(--leading-[a-z]+\)|1|inherit|normal)$/.test(value)) bad.push(`${f} ${sel} line-height: ${value}`);
      if (prop === "font") {
        const lh = value.match(/\)\s*\/\s*([^\s]+(?:\([^)]*\))?)/)?.[1];
        if (lh && !/^(var\(--leading-[a-z]+\)|1)$/.test(lh)) bad.push(`${f} ${sel} font: ${value}`);
      }
      if (/--text-md\b/.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    }
    expect(bad).toEqual([]);
  });
});

describe("间距的用途（SPACING-REVIEW-PLAN D54–D58）", () => {
  it("容器的内边距写用途令牌 --inset-*：左右是 --inset-x，文字开头的上边小一档（-y）", () => {
    // [选择器, 期望的内边距（写法要一字不差）]
    const CONTAINERS = [
      [".xxd-card__body", "var(--inset-sm-y) var(--inset-sm)"],
      [".xxd-chart-card", "var(--inset-md-y) var(--inset-md)"],
      [".xxd-stat", "var(--inset-md-y) var(--inset-md)"],
      [".xxd-banner", "var(--inset-md-y) var(--inset-md)"],
      ['.xxd-banner[data-size="sm"]', "var(--inset-sm-y) var(--inset-sm)"],
      [".xxd-popover", "var(--inset-md-y) var(--inset-md)"],
      [".xxd-dialog__head", "var(--inset-lg-y) var(--inset-lg) 0"],
      [".xxd-dialog__actions", "var(--inset-lg-y) var(--inset-lg) var(--inset-lg)"],
      [".xxd-sheet__head", "var(--inset-md-y) var(--inset-md) var(--space-2)"],
      [".xxd-sheet__body", "0 var(--inset-md) var(--inset-md-y)"],
      [".xxd-panel__head", "0 var(--inset-lg)"],
      [".xxd-panel__body", "var(--inset-lg-y) var(--inset-lg)"],
    ];
    const all = decls().filter(([, , prop]) => prop === "padding");
    const bad = [];
    for (const [sel, want] of CONTAINERS) {
      const got = all.filter(([, s]) => s === sel).map(([, , , v]) => v);
      if (!got.includes(want)) bad.push(`${sel} padding: ${got.join(" | ") || "（没写）"}，应该是 ${want}`);
    }
    expect(bad).toEqual([]);
  });

  it("用途令牌在 tokens.css 里，紧凑密度一起收", () => {
    const compact = tokens.slice(tokens.indexOf('[data-density="compact"] {'));
    for (const t of ["--inset-sm", "--inset-md", "--inset-lg", "--inset-sm-y", "--inset-md-y", "--inset-lg-y", "--gap-block", "--gap-group"]) {
      expect(tokens).toContain(`${t}:`);
      expect(compact.slice(0, compact.indexOf("}"))).toContain(`${t}:`);
    }
    for (const t of ["--gap-tight", "--gap-items"]) expect(tokens).toContain(`${t}:`);
  });

  it("二级缩进（列表、引用）不按字号算 em：统一 --space-5（D57）", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls([...files, ...outside])) if (/^padding-(left|inline-start)$/.test(prop) && /\d(\.\d+)?em\b/.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    expect(bad).toEqual([]);
  });

  it("示例、模式、模板（别人会整段复制的标记）里的行内间距也写令牌", () => {
    const bad = [];
    for (const f of ["registry.json", "registry.en.js", "patterns.json", "patterns.en.js", "../xxd-site/src/data/templates.js", "../xxd-site/src/data/templates.en.js"]) {
      const src = readFileSync(join(root, f), "utf8");
      for (const m of src.matchAll(/(?:padding|margin|gap|column-gap|row-gap)(?:-[a-z]+)?:\s?([^;"`\\]*)/g)) if (/(^|\s)([2-9]|\d{2,})px/.test(m[1])) bad.push(`${f}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });

  it("角上的关闭按钮不写算好的负外边距：按（图标 − 按钮）/ 2 算", () => {
    const bad = [];
    for (const [f, sel, prop, value] of decls()) if (/__close/.test(sel) && /^margin/.test(prop) && /-\d+px/.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    expect(bad).toEqual([]);
  });
});

// SHAPE-LINE-PLAN D61–D65：圆和线
describe("圆和线（SHAPE-LINE-PLAN）", () => {
  const all = () => decls([...files, ...outside]);

  it("--r-circle 只给单选和转圈；其他圆的东西（头像、点、色块）用 --r-pill 跟开关走；不写 50% / 999px", () => {
    const CIRCLE_OK = /\.xxd-radio|\.xxd-spinner|aria-busy/;
    const bad = [];
    for (const [f, sel, prop, value] of all()) {
      if (!/radius/.test(prop)) continue;
      if (/--r-circle/.test(value) && !CIRCLE_OK.test(sel)) bad.push(`${f} ${sel} ${prop}: ${value}`);
      if (/(^|\s)(50%|999px|9999px)/.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    }
    expect(bad).toEqual([]);
  });

  it("线的颜色只看用途：分隔和容器、结构线、控件、当前、出错、提示容器、禁用（D62）", () => {
    // 用途表里的令牌；后面几行是有名有姓的例外
    const OK = new Set([
      "--line", "--line-raised", "--line-strong", "--line-control", "--line-control-hover", "--action", "--danger",
      "--success-line", "--warning-line", "--danger-line", "--disabled-line", "--disabled-ink",
      "--paper", // 隔开环、选中环的间隔（D64）
      "--swatch-edge", // 色块自己的边
      "--btn-bd", "--btn-bg-hover", "--btn-fg", // 按钮内部：边按变体取上面这些令牌
      "--action-fill", "--switch-on", "--danger-solid", // 实心的东西边和底同色（勾上的复选、开着的开关、主按钮）
      "--accent-solid-hover", // 两个主按钮之间的缝
      "--ink", // 图上画的记号（前后对比的空心圈、热力格的当前格）、色块的选中环
      "--accent-border", // 只给正文引用的竖线（装饰）
      "--accent-border-strong", // 只给展示站「间距」页画的辅助线
      "--wash", // 小程序底部面板「取消」上面 8px 的隔带（不是线）
      "--focus-color", "--action-text", // 键盘焦点轮廓（它自己是一种用途，只在 :focus-visible 里）
    ]);
    const bad = [];
    for (const [f, sel, prop, value] of all()) {
      if (!/^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?)$/.test(prop)) continue;
      for (const m of value.matchAll(/var\((--[a-z0-9-]+)/g)) if (!OK.has(m[1])) bad.push(`${f} ${sel} ${prop}: ${value}`);
      if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(value.replace(/var\([^)]*\)/g, ""))) bad.push(`${f} ${sel} ${prop}: ${value}`);
    }
    expect(bad).toEqual([]);
    // 名单里的例外只在说好的地方用
    const only = { "--action-text": /focus-visible/, "--focus-color": /focus-visible/, "--accent-border": /blockquote/, "--accent-border-strong": /site-guides/, "--wash": /is-cancel/, "--accent-solid-hover": /xxd-btn-group/ };
    const misuse = [];
    for (const [f, sel, prop, value] of all()) if (/^(border|outline)/.test(prop)) for (const [t, re] of Object.entries(only)) if (value.includes(`var(${t})`) && !re.test(sel)) misuse.push(`${f} ${sel} ${prop}: ${value}`);
    expect(misuse).toEqual([]);
  });

  it("控件的边：有边的按钮、输入框、下拉、选择器都是 --line-control，聚焦是 --action，出错是 --danger", () => {
    const btn = readFileSync(join(root, "src/css/button.css"), "utf8");
    expect(btn).toMatch(/--btn-bd: var\(--line-control\)/);
    const bad = [];
    for (const [f, sel, prop, value] of decls()) {
      if (!/^(border(-color)?|outline)$/.test(prop) || /sr-only/.test(sel)) continue;
      // 出错又聚焦：边还是出错色（状态优先级：出错 > 聚焦）
      // 高对比度里只能用系统色（Highlight / CanvasText）
      if (f === "forced-colors.css" && /^(Highlight|CanvasText)$|solid (Highlight|CanvasText)$/.test(value)) continue;
      if (/:focus|focus-within|aria-expanded="true"/.test(sel) && /border|outline/.test(prop) && !/--action\b|none|-1px|currentColor|--focus-color/.test(value) && !(/aria-invalid="true"/.test(sel) && /--danger\)/.test(value))) bad.push(`${f} ${sel} ${prop}: ${value}`);
      if (/aria-invalid="true"/.test(sel) && !/--danger\)/.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    }
    expect(bad).toEqual([]);
  });

  it("环的值不写死：#fff、白色的环改成 --paper", () => {
    const bad = [];
    for (const [f, sel, prop, value] of all()) if (prop === "box-shadow" && /0 0 0 [\d.]+px (#[0-9a-f]{3,8}|white|rgba?\((?!var))/i.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    expect(bad).toEqual([]);
  });
});

// TYPE-REVIEW-PLAN D69–D71：字
describe("字（TYPE-REVIEW-PLAN）", () => {
  const all = () => decls([...files, ...outside]);
  it("不用斜体：中文没有真斜体", () => {
    const bad = [];
    for (const [f, sel, prop, value] of all()) if ((prop === "font-style" && /italic|oblique/.test(value)) || (prop === "font" && /\bitalic\b/.test(value))) bad.push(`${f} ${sel} ${prop}: ${value}`);
    expect(bad).toEqual([]);
  });

  it("11px（--text-2xs）只给不会出现中文的：键帽、快捷键、等宽的名字、图上的刻度数字、小程序的标签栏", () => {
    const OK = /xxd-kbd|__kbd|xxd-code__head|site-nav a span|site-wall__name span|site-icons|xxd-chart__axis|xxd-steps__mark|xxd-tabbar|mono/;
    const bad = [];
    for (const [f, sel, prop, value] of all()) if (/^font(-size)?$/.test(prop) && /--text-2xs\b/.test(value) && !OK.test(sel)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    expect(bad).toEqual([]);
  });

  it("等宽字比周围小一档、不小于 12：只用 max(var(--text-xs), calc(1em - clamp(…)))，不写 calc(1em - 1px)", () => {
    const bad = [];
    for (const [f, sel, prop, value] of all()) if (/^font(-size)?$/.test(prop) && /calc\(1em - \dpx\)/.test(value)) bad.push(`${f} ${sel} ${prop}: ${value}`);
    expect(bad).toEqual([]);
  });
});
