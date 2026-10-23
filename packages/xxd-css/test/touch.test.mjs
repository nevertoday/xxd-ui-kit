// 手机和触屏（TOUCH-REVIEW-PLAN）：读源码和构建产物能查的那几条（点按区、字号、悬停粘住由 audit 的 --only=touch 在浏览器里量）
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hoverOnly, hoverState } from "../scripts/hover-only.mjs";

const root = join(import.meta.dirname, "..");
const css = (f) => readFileSync(join(root, "src/css", f), "utf8");
const tokens = readFileSync(join(root, "../xxd-tokens/tokens.css"), "utf8");

describe("悬停只给能悬停的指针（D121）", () => {
  it("哪些选择器算「正在悬停」", () => {
    expect(hoverState(".a:hover")).toBe("plain");
    expect(hoverState("a.b:hover:not(:disabled)")).toBe("plain");
    expect(hoverState(".x:has(> a:hover)")).toBe("plain");
    expect(hoverState(".a:is(:hover, :focus-visible) > b")).toBe("nested");
    expect(hoverState(".r:not(:hover, :focus-within) > x")).toBe("nested");
    expect(hoverState(".a:hovered")).toBe("none");
  });
  it("选择器列表只挪带 :hover 的那几个，别的留在原处；可以重复跑", () => {
    const [once, k] = hoverOnly("@layer x {\n  .a:hover, .a:focus-visible { color: red; }\n}\n");
    expect(k).toBe(1);
    expect(once).toMatch(/\.a:focus-visible \{ color: red; \}/);
    expect(once).toMatch(/@media \(hover: hover\) \{\s*\.a:hover \{ color: red; \}/);
    expect(hoverOnly(once)[1]).toBe(0);
  });
  it("构建出来的 components.css 里没有留在 @media (hover: hover) 外面的悬停规则", () => {
    const built = readFileSync(join(root, "dist/components.css"), "utf8");
    expect(hoverOnly(built)[1]).toBe(0);
  });
});

describe("粗指针（D115、D116）", () => {
  it("控件 44 高、点按区 44", () => {
    const coarse = tokens.slice(tokens.indexOf("@media (pointer: coarse)"));
    expect(coarse.slice(0, 400)).toMatch(/--hit-min: 44px;[\s\S]*--control-h: 44px;/);
  });
  it("能打字的框字号 16px（iOS 聚焦时不放大页面）", () => {
    expect(css("form.css")).toMatch(/@media \(pointer: coarse\) \{[\s\S]*?\.xxd-input, \.xxd-textarea[\s\S]*?font-size: var\(--text-lg\)/);
  });
  it("按钮的点按区按自己的高往上下补到 --hit-min，纯图标按钮左右也补", () => {
    expect(css("button.css")).toMatch(/\.xxd-btn::after \{[\s\S]*?height: max\(100%, var\(--hit-min\)\);/);
    expect(css("button.css")).toMatch(/\.xxd-btn\[data-icon-only\]::after \{\s*width: max\(100%, var\(--hit-min\)\);/);
  });
});

describe("贴底的东西让出安全区（D118）、浮层滚到头不接着滚（D119）", () => {
  it("dock、toast、窄屏的对话框和面板、图片查看器", () => {
    const overlay = css("overlay.css");
    for (const sel of [".xxd-dock {", ".xxd-toast-region {"]) {
      const block = overlay.slice(overlay.indexOf(`\n  ${sel}`), overlay.indexOf("\n  }", overlay.indexOf(`\n  ${sel}`)));
      expect(block, sel).toMatch(/env\(safe-area-inset-bottom/);
    }
    const narrow = overlay.slice(overlay.indexOf("@media (max-width: 640px)"));
    expect(narrow).toMatch(/\.xxd-dialog \{[^}]*env\(safe-area-inset-bottom/);
    expect(narrow).toMatch(/\.xxd-panel \{[^}]*env\(safe-area-inset-bottom/);
    expect(css("patterns.css")).toMatch(/\.xxd-viewer \{[^}]*env\(safe-area-inset-bottom/);
  });
  it("对话框、sheet、面板、菜单、popover、命令面板、下拉的滚动块 overscroll-behavior: contain", () => {
    const m = css("overlay.css").match(/:is\(([^)]*)\) \{\s*overscroll-behavior: contain;/);
    expect(m).not.toBeNull();
    for (const k of [".xxd-dialog", ".xxd-sheet__body", ".xxd-panel__body", ".xxd-menu", ".xxd-popover", ".xxd-palette__list", ".xxd-listbox"]) expect(m[1]).toContain(k);
  });
});
