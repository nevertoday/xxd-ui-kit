// 公开接口：Kumo 的导出逐个列出（kumo-exports.ts 要是最新的），并且不带 Cloudflare 的品牌组件。
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as Xxd from "../src/index";
// @ts-expect-error —— 生成脚本是 .mjs
import { kumoExports, render } from "../scripts/kumo-exports.mjs";

describe("@xxd/react 的导出", () => {
  it("kumo-exports.ts 是最新的（合并上游后新增 / 去掉的导出要重新生成并看一眼）", () => {
    const now = readFileSync(join(import.meta.dirname, "../src/kumo-exports.ts"), "utf8");
    expect(now).toBe(render(kumoExports()));
  }, 30_000);

  it("没有 Cloudflare 的品牌组件", () => {
    const names = Object.keys(Xxd);
    expect(names.filter((n) => /cloudflare/i.test(n))).toEqual([]);
    expect(names).toContain("Button");
    expect(names).toContain("DialogActions");
  });
});
