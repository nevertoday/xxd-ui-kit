import { describe, expect, it } from "vite-plus/test";
import { THEME_CONFIG } from "./config";
import { generateKumoThemeCSS, generateThemeOverrideCSS } from "./generate-css";

function countOccurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

describe("theme css generator", () => {
  it("emits kumo runtime fallback selectors inside base layer", () => {
    const css = generateKumoThemeCSS(THEME_CONFIG);

    expect(css).toContain("@layer base {");
    expect(css).toContain(':root, [data-theme="kumo"], [data-theme="light"], [data-theme="dark"] {'); // 小小东：局部亮 / 暗块上重新算（ACCEPTANCE-REVIEW）
    expect(css).toContain(
      ':root[data-mode="dark"], [data-mode="dark"]:not([data-theme]), [data-mode="dark"] [data-theme="kumo"], [data-theme="kumo"][data-mode="dark"], [data-theme="kumo"] [data-mode="dark"] {',
    );
  });

  it("emits override theme runtime fallbacks in base layers only", () => {
    const css = generateThemeOverrideCSS(THEME_CONFIG, "fedramp");

    expect(countOccurrences(css, "@layer base {")).toBe(2);
    expect(css).toContain('  [data-theme="fedramp"] {');
    expect(css).toContain(
      '  [data-mode="dark"] [data-theme="fedramp"], [data-theme="fedramp"][data-mode="dark"], [data-theme="fedramp"] [data-mode="dark"] {',
    );
    expect(css).not.toMatch(/\n\[data-theme="fedramp"\] \{/);
  });
});
