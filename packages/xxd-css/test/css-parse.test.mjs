// 构建产物里的 CSS 用正则转换过（:root → :host 等）：用真正的 CSS 解析器过一遍，语法坏了在这里拦住
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { transform } from "lightningcss";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const FILES = [
  "dist/xxd.css",
  "dist/components.css",
  "dist/xxd.shadow.css",
  "../xxd-tokens/dist/tokens.css",
  "../xxd-tokens/dist/tokens.shadow.css",
  "../xxd-tokens/dist/tokens.layered.css",
  "../xxd-tokens/dist/base.css",
];

describe("构建出来的 CSS 能被解析", () => {
  for (const file of FILES) {
    it(file, () => {
      const code = readFileSync(join(root, file));
      const { warnings } = transform({ filename: file, code, errorRecovery: true });
      expect(warnings.map((w) => `${w.message} @ ${w.loc?.line}:${w.loc?.column}`)).toEqual([]);
    });
  }
});
