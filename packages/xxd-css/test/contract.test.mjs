// CSS 合同（DESIGN-PRINCIPLES §3 §5 §6 §8）：能机器检查的审美规则都在这里。
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(import.meta.dirname, "../src/css");
const files = Object.fromEntries(readdirSync(dir).map((f) => [f, readFileSync(join(dir, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")]));

/** 粗粒度规则解析：[{ file, selector, decls: [[prop, value]] }] */
function rules() {
  const out = [];
  for (const [file, css] of Object.entries(files)) {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
      const selector = m[1].trim().replace(/\s+/g, " ");
      const decls = [...m[2].matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map((d) => [d[1], d[2].trim().replace(/\s+/g, " ")]);
      out.push({ file, selector, decls });
    }
  }
  return out;
}
const all = rules();

describe("圆角只走令牌", () => {
  it("border-radius 只能是 var(--r-*)、0、inherit 或基于 --r-* 的 calc", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls)
        if (/radius/.test(p) && !/^(0|inherit|var\(--r-[a-z]+\)|calc\(var\(--r-[a-z]+\) - \d+px\)|var\(--outer-r\)|max\(0px, calc\(var\(--outer-r\) - var\(--pad\)\)\))$/.test(v)) bad.push(`${r.file} ${r.selector} ${p}: ${v}`);
    expect(bad).toEqual([]);
  });

  it("语义圆（单选、状态点、头像、色块、spinner）用 --r-circle；开关用 --r-pill", () => {
    const radius = (sel) => all.filter((r) => r.selector === sel).flatMap((r) => r.decls).find(([p]) => p === "border-radius")?.[1];
    expect(radius(".xxd-radio")).toBe("var(--r-circle)");
    expect(radius(".xxd-switch")).toBe("var(--r-pill)");
    expect(radius(".xxd-switch::before")).toBe("var(--r-pill)");
    expect(radius(".xxd-check")).toBe("var(--r-xs)");
  });
});

describe("阴影只给浮层", () => {
  const FLOATING = /xxd-(dialog|sheet|menu|popover|tooltip|toast|panel|listbox|surface-float)\b|xxd-surface\[data-level="raised"\]|xxd-sidebar\[data-variant="floating"\]|\[data-dragging\]|xxd-progress-pill/;
  it("非浮层只允许 0 模糊的描边环（box-shadow: 0 0 0 Npx / inset）", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (p !== "box-shadow" || v === "none") continue;
        if (FLOATING.test(r.selector)) continue;
        // 质感模式（D1）：实心按钮顶部 1px 内高光，是材质不是浮起。值放在 --btn-highlight* 里（只有 material 设，下面单独检查）
        if (r.selector.includes('data-finish="material"') && /^inset 0 1px 0 rgba\(255, 255, 255, 0\.\d+\)$/.test(v)) continue;
        if (/^var\(--btn-highlight(-pressed)?, none\)$/.test(v)) continue;
        // 允许的是「零模糊」的描边 / 分隔线（没有投影）：第三个长度（模糊）必须是 0
        const rings = v.split(/,(?![^(]*\))/).every((part) => {
          const lengths = part.replace(/(rgba?|color-mix|var)\([^)]*\)+/g, "").replace("inset", "").trim().split(/\s+/).filter((t) => /^-?[\d.]+(px)?$/.test(t));
          return lengths.length >= 2 && (lengths[2] === undefined || parseFloat(lengths[2]) === 0);
        });
        if (!rings) bad.push(`${r.file} ${r.selector}: ${v}`);
      }
    expect(bad).toEqual([]);
  });
});

describe("字重只有 400 / 500 / 600", () => {
  it("font-weight 与 font 简写里的字重", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (p === "font-weight" && !/^(var\(--weight-(regular|medium|strong)\)|400|500|600|inherit)$/.test(v)) bad.push(`${r.selector} ${v}`);
        if (p === "font" && /^\d{3}\b/.test(v) && !/^(400|500|600)\b/.test(v)) bad.push(`${r.selector} ${v}`);
      }
    expect(bad).toEqual([]);
  });
});

describe("动效只动 opacity / transform（颜色过渡用于状态变化）", () => {
  const ALLOWED = new Set(["opacity", "transform", "color", "background-color", "border-color", "visibility", "overlay", "display", "box-shadow"]);
  it("transition 的属性", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (p !== "transition" || v === "none") continue;
        for (const part of v.split(/,(?![^(]*\))/)) {
          const prop = part.trim().split(" ")[0];
          if (!ALLOWED.has(prop)) bad.push(`${r.selector}: ${prop}`);
        }
      }
    expect(bad).toEqual([]);
  });

  it("@keyframes 里只有 transform / opacity", () => {
    const css = Object.values(files).join("\n");
    const bad = [];
    for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\}\s*)\}/g)) {
      for (const d of m[2].matchAll(/([\w-]+)\s*:/g)) if (!["transform", "opacity"].includes(d[1])) bad.push(`${m[1]}: ${d[1]}`);
    }
    expect(bad).toEqual([]);
  });

  it("没有弹跳缓动", () => {
    const css = Object.values(files).join("\n");
    expect(css).not.toMatch(/cubic-bezier\([^)]*,\s*1\.[1-9]/);
    expect(css).not.toMatch(/ease-bounce|spring/);
  });
});

describe("颜色来自令牌", () => {
  // 允许：白字放在实心语义色上、图片上的深色半透明控件、星标黄（会员站角标）、混色用的黑白。
  const ALLOW = new Set(["#ffffff", "#000000", "#f5b301"]);
  it("组件里没有其他写死的颜色", () => {
    const bad = [];
    for (const [file, css] of Object.entries(files)) {
      const body = css.replace(/url\("data:[^"]+"\)/g, "");
      for (const m of body.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) if (!ALLOW.has(m[0].toLowerCase())) bad.push(`${file}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });
});

describe("颜色只有令牌、黑白和系统色（O8：变异测试补的漏洞）", () => {
  const NAMED = "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(" ");
  const SYSTEM = "canvas canvastext linktext visitedtext activetext buttonface buttontext buttonborder field fieldtext highlight highlighttext selecteditem selecteditemtext mark marktext graytext accentcolor accentcolortext".split(" ");
  const COLOR_PROP = /^(color|background|background-color|border|border-(top|right|bottom|left|block|inline)(-(start|end))?(-color)?|border-color|outline|outline-color|fill|stroke|box-shadow|caret-color|text-decoration|text-decoration-color|accent-color|column-rule|--[\w-]+)$/;
  const words = (v) => v.replace(/var\([^)]*\)/g, " ").replace(/url\([^)]*\)/g, " ").toLowerCase().match(/[a-z-]+/g) ?? [];

  it("没有命名色（transparent / currentColor 除外）；系统色只在 forced-colors.css 里", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (!COLOR_PROP.test(p)) continue;
        for (const w of words(v)) {
          if (NAMED.includes(w)) bad.push(`${r.file} ${r.selector} ${p}: ${w}`);
          if (SYSTEM.includes(w) && r.file !== "forced-colors.css") bad.push(`${r.file} ${r.selector} ${p}: 系统色 ${w}`);
        }
      }
    expect(bad).toEqual([]);
  });

  it("rgb() / rgba() 字面量只能是白或近黑（图片上的半透明控件）；hsl() 不用", () => {
    const bad = [];
    for (const [file, css] of Object.entries(files)) {
      for (const m of css.matchAll(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(([^()]*)\)/g)) {
        if (m[1].startsWith("rgb") && /^\s*var\(/.test(m[2])) continue;
        if (!m[1].startsWith("rgb")) {
          bad.push(`${file}: ${m[0]}`);
          continue;
        }
        const [r, g, b] = m[2].split(/[\s,/]+/).filter(Boolean).map(Number);
        const white = r === 255 && g === 255 && b === 255;
        const nearBlack = Math.max(r, g, b) <= 20;
        if (!white && !nearBlack) bad.push(`${file}: ${m[0]}`);
      }
      // rgba(var(--x-rgb), a) 写法里的 var 括号会打断上面的匹配，单独查一次
    }
    expect(bad).toEqual([]);
  });

  it("没有装饰性渐变：只允许遮罩、纯色块、带硬边的填充、往透明淡出", () => {
    const bad = [];
    const splitTop = (s) => {
      const out = [];
      let depth = 0;
      let start = 0;
      for (let i = 0; i < s.length; i += 1) {
        if (s[i] === "(") depth += 1;
        else if (s[i] === ")") depth -= 1;
        else if (s[i] === "," && depth === 0) {
          out.push(s.slice(start, i).trim());
          start = i + 1;
        }
      }
      out.push(s.slice(start).trim());
      return out;
    };
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (/mask/.test(p)) continue;
        let i = v.search(/(repeating-)?(linear|radial|conic)-gradient\(/);
        while (i !== -1) {
          const open = v.indexOf("(", i);
          let depth = 0;
          let end = open;
          for (; end < v.length; end += 1) {
            if (v[end] === "(") depth += 1;
            else if (v[end] === ")" && --depth === 0) break;
          }
          const args = splitTop(v.slice(open + 1, end)).filter((a) => !/^(to |\d+(\.\d+)?(deg|turn|rad)|circle|ellipse|from |at )/.test(a));
          const hasTransparent = args.some((a) => /transparent/.test(a));
          const hasStops = args.some((a) => /\)\s+[\d.]+(%|px)?|\s(\d+(\.\d+)?(%|px)|calc\()/.test(a.replace(/^[^ ]*\(.*\)$/, "")) || /\s[\d.]+(%|px)?(\s|$)|calc\(/.test(a.replace(/^(color-mix|var|rgba?)\([^]*?\)\s*/, " ")));
          const colors = new Set(args.map((a) => a.replace(/\s+[\d.]+(%|px)?.*$/, "")));
          if (!hasTransparent && !hasStops && colors.size > 1) bad.push(`${r.file} ${r.selector} ${p}: ${v.slice(i, end + 1)}`);
          i = v.slice(end).search(/(repeating-)?(linear|radial|conic)-gradient\(/);
          if (i !== -1) i += end;
        }
      }
    expect(bad).toEqual([]);
  });

  it("--muted-2 只做装饰：当 color 用时只能是图标或伪元素（文字用 --muted，≥ 4.5:1）", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls)
        if (p === "color" && v.includes("--muted-2") && !/\.ui-icon|::(before|after|marker)/.test(r.selector)) bad.push(`${r.file} ${r.selector}`);
    expect(bad).toEqual([]);
  });

  it("没有 text-shadow，没有 filter: drop-shadow()", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (p === "text-shadow" && v !== "none") bad.push(`${r.file} ${r.selector} ${p}: ${v}`);
        if (/filter$/.test(p) && /drop-shadow\(/.test(v)) bad.push(`${r.file} ${r.selector} ${p}: ${v}`);
      }
    expect(bad).toEqual([]);
  });

  it("--btn-highlight* 只在 material 里是 1px 白色内高光，别处只能是 none", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (!/^--btn-highlight/.test(p)) continue;
        const ok = r.selector.includes('data-finish="material"') ? /^inset 0 1px 0 rgba\(255, 255, 255, 0\.\d+\)$/.test(v) : v === "none";
        if (!ok) bad.push(`${r.file} ${r.selector} ${p}: ${v}`);
      }
    expect(bad).toEqual([]);
  });

  it("白色内高光只在质感模式（data-finish=\"material\"）下", () => {
    const bad = [];
    for (const r of all)
      for (const [p, v] of r.decls) {
        if (p !== "box-shadow" || !/inset/.test(v)) continue;
        const highlight = /inset[^,]*\b0 -?[1-9][\d.]*px[^,]*(rgba?\(\s*255\s*,\s*255\s*,\s*255|#fff(fff)?\b|\bwhite\b|var\(--on-ink\))/.test(v);
        if (highlight && !r.selector.includes('data-finish="material"')) bad.push(`${r.file} ${r.selector}: ${v}`);
      }
    expect(bad).toEqual([]);
  });
});

describe("对话框按钮层级", () => {
  it("ui-dialog-cancel 内容宽度、安静：不 flex-grow，不用实心主色", () => {
    const cancel = all.filter((r) => r.selector.includes("ui-dialog-cancel") && !r.selector.includes(":not(.ui-dialog-cancel)"));
    const decls = Object.fromEntries(cancel.flatMap((r) => r.decls));
    expect(decls.flex).toBe("none");
    expect(decls.width).toBe("auto");
    expect(cancel.some((r) => r.decls.some(([p, v]) => p === "background" && /--action|--danger/.test(v)))).toBe(false);
  });
});

describe("每个组件都在入口里", () => {
  it("index.css 引入了 css/ 下的每个文件", () => {
    const index = readFileSync(join(import.meta.dirname, "../src/index.css"), "utf8");
    for (const f of Object.keys(files)) expect(index).toContain(`./css/${f}`);
  });
});

describe("hover 进入立即、离开淡回（D2）", () => {
  it("每个带颜色过渡的组件根类都在 interaction.css 的 :hover 清零列表里", () => {
    const list = files["interaction.css"].match(/:is\(([\s\S]*?)\):(?:is\(:hover, :active\)|hover)\s*\{\s*transition-duration:\s*0s/)[1];
    const instant = new Set([...list.matchAll(/\.(xxd-[\w-]+)/g)].map((m) => m[1]));
    const colorTransitions = all
      .filter((r) => r.decls.some(([p, v]) => p === "transition" && /(background-color|border-color|(^|[\s,])color)\b/.test(v)))
      .map((r) => r.selector.match(/\.(xxd-[\w-]+)/)?.[1])
      .filter(Boolean);
    const missing = [...new Set(colorTransitions)].filter((k) => !instant.has(k) && !["xxd-scrim", "xxd-panel-scrim", "xxd-tooltip", "xxd-bubble"].includes(k));
    expect(missing).toEqual([]);
  });

  it("浮层（菜单 / popover / tooltip）出现时只缩放和淡入，原点跟着锚点", () => {
    expect(files["overlay.css"]).toMatch(/transform-origin: var\(--xxd-origin/);
    expect(files["overlay.css"]).toMatch(/\.xxd-menu:not\(:popover-open\)[\s\S]*?transform: scale\(0\.96\)/);
  });
});

describe("选择器写法", () => {
  it(":is() / :where() 里不写伪元素（按规范会被忽略，规则悄悄不生效）", () => {
    const bad = all.filter((r) => /:(is|where)\([^)]*::/.test(r.selector)).map((r) => `${r.file} ${r.selector}`);
    expect(bad).toEqual([]);
  });
});

describe("能打字的框一个框只有一个框（§4）", () => {
  // 文本框、多行框、下拉框聚焦时边框变深一次；外扩的焦点环、外圈光晕会变成「框套框」，
  // 还让框比同一行的按钮高出一截（会员站管理员工作区搜索框，2026-10-19）。
  const field = /(^|[\s>+~(,])(input(?!\[type="(checkbox|radio|range|color|file)"\])|textarea|select|\.xxd-(input|textarea|select|taginput|input-group))\b/;
  const subjects = (selector) => selector.split(/,(?![^()]*\))/).map((s) => s.trim().split(/\s*[\s>+~]\s*(?![^()]*\))/).pop());
  it("聚焦时没有外扩的 outline，也没有向外的 box-shadow", () => {
    const bad = [];
    for (const r of all) {
      if (!/:focus/.test(r.selector)) continue;
      if (!subjects(r.selector).some((s) => /:focus/.test(s) && field.test(` ${s}`))) continue;
      const decl = Object.fromEntries(r.decls);
      // 画在框里面的（负的 outline-offset）不算外扩：高对比度里 box-shadow 会被抹掉，聚焦只能用 outline
      const ring = decl.outline && !/^(none|0)$/.test(decl.outline) && !/^-\d/.test(decl["outline-offset"] ?? "");
      const halo = decl["box-shadow"] && !/^(none|inset\b)/.test(decl["box-shadow"]);
      if (ring || halo) bad.push(`${r.file} ${r.selector}`);
    }
    expect(bad).toEqual([]);
  });
  it("通用焦点环之后，原生文本框改成压在自己边框上的 1px 线", () => {
    const base = all.find((r) => r.file === "base.css" && /:where\(input:not\(/.test(r.selector) && /:focus-visible$/.test(r.selector));
    expect(Object.fromEntries(base?.decls ?? [])).toMatchObject({ outline: "1px solid var(--action)", "outline-offset": "-1px" });
  });
});

// 用 Kit 的插件里看出来的（docs/maintainers/FIELD-FIXES.md D137–D139）
describe("窄面板和从右往左", () => {
  // 同一个选择器可能出现在几处（高对比里也有一条），合在一起看
  const decl = (selector) => Object.fromEntries(all.filter((r) => r.selector === selector).flatMap((r) => r.decls));
  it("色块组带 data-balance 时放不下一行各行一样多，不带的照旧（D137）", () => {
    expect(decl(".xxd-swatches[data-balance]")).toMatchObject({ "text-wrap": "balance" });
    expect(decl(".xxd-swatches[data-balance] > .xxd-swatch")).toMatchObject({ display: "inline-block" });
    // 不带的组和单独用的色块不变：项目自己排的 grid / flex 不会多出外边距
    expect(decl(".xxd-swatches")).toMatchObject({ display: "flex", gap: "var(--swatch-gap)" });
    expect(Object.keys(decl(".xxd-swatch")).filter((p) => p.startsWith("margin"))).toEqual([]);
  });
  it("错误的图标在开头那一边，不写死左边（D138）", () => {
    const d = decl(".xxd-error::before");
    expect(d["inset-inline-start"]).toBe("0");
    expect(d.left).toBeUndefined();
  });
  it("从右往左时滑块从右边填（D139）", () => {
    expect(decl(".xxd-range[data-fill]:dir(rtl)::-webkit-slider-runnable-track").background).toMatch(/^linear-gradient\(to left,/);
  });
  it("色块在粗指针上 28px、间距 12px，鼠标上 22 / 8（D151）", () => {
    // 粗粒度解析不认 @media：两条规则按源码顺序，先是平常的，后是 @media (pointer: coarse) 里的
    const [plain, coarse] = all.filter((r) => r.selector === ".xxd-swatches").map((r) => Object.fromEntries(r.decls));
    expect(plain).toMatchObject({ "--swatch-size": "22px", "--swatch-gap": "var(--space-2)" });
    expect(coarse).toMatchObject({ "--swatch-size": "28px", "--swatch-gap": "var(--space-3)" });
    expect(files["content.css"]).toMatch(/@media \(pointer: coarse\) \{\s*\.xxd-swatches \{\s*--swatch-size: 28px;/);
    expect(decl(".xxd-swatch")).toMatchObject({ width: "var(--swatch-size, 22px)", height: "var(--swatch-size, 22px)" });
  });
  it("开关关着时滑块用 --switch-knob-off，开着时是纸色（D152）", () => {
    expect(decl(".xxd-switch::before").background).toBe("var(--switch-knob-off)");
    expect(decl(".xxd-switch:checked::before").background).toBe("var(--paper)");
  });
  it("可点的行里写 span，标题和说明也是上下两行（D150）", () => {
    expect(decl(".xxd-row__title")).toMatchObject({ display: "block" });
    expect(decl(".xxd-row__desc")).toMatchObject({ display: "block" });
  });
});
