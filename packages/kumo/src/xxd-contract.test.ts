// 小小东换皮门禁（docs/DESIGN-PRINCIPLES.md §3 §5 §7）。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { THEME_CONFIG } from "../scripts/theme-generator/config";
import { XXD_COLOR, XXD_TEXT } from "../scripts/theme-generator/xxd-overrides";

const ROOT = join(__dirname, "components");
const files: string[] = [];
(function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name) && !/\.(test|browser\.test|type-spec)\.tsx?$/.test(name)) files.push(p);
  }
})(ROOT);

describe("xxd 换皮合同", () => {
  it("组件里没有 rounded-full：用 rounded-pill（跟开关）或 rounded-circle（语义圆）", () => {
    const offenders = files.filter((f) => /\brounded-full\b/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("组件里没有写死像素的圆角 rounded-[Npx]", () => {
    const offenders = files.filter((f) => /rounded(-[a-z]{1,2})?-\[\d+(\.\d+)?(px|rem)\]/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("组件不再直接依赖 @phosphor-icons/react", () => {
    const offenders = files.filter((f) => /from "@phosphor-icons\/react"/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("每个 Kumo 颜色 token 都映射到了小小东变量", () => {
    for (const name of Object.keys(THEME_CONFIG.color)) {
      expect(XXD_COLOR[name], name).toBeTruthy();
      expect(THEME_CONFIG.color[name].theme.kumo.light).toBe(XXD_COLOR[name]);
    }
    for (const name of Object.keys(THEME_CONFIG.text)) expect(XXD_TEXT[name], name).toBeTruthy();
  });

  it("生成的主题文件不再含 Cloudflare 橙", () => {
    const css = readFileSync(join(__dirname, "styles/theme-kumo.css"), "utf8");
    expect(css).not.toMatch(/#f6821f/i);
  });

  it("Tailwind 圆角与阴影映射到 token", () => {
    const css = readFileSync(join(__dirname, "styles/kumo-binding.css"), "utf8");
    expect(css).toMatch(/--radius-lg: var\(--r-sm/);
    expect(css).toMatch(/--shadow-xs: 0 0 #0000/);
    expect(css).toMatch(/@utility rounded-pill/);
    expect(css).toMatch(/@utility rounded-circle/);
  });
});
