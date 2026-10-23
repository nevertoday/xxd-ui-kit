// src/index.js 导出的每个名字都要在 src/index.d.ts 里有声明
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("类型声明", () => {
  it("每个导出都有类型", () => {
    const js = readFileSync(join(import.meta.dirname, "../src/index.js"), "utf8");
    const dts = readFileSync(join(import.meta.dirname, "../src/index.d.ts"), "utf8");
    const names = [...js.matchAll(/export \{([^}]+)\}/g)].flatMap((m) => m[1].split(",").map((n) => n.trim().split(/\s+as\s+/).pop())).filter(Boolean);
    const declared = new Set([...dts.matchAll(/^export (?:declare )?(?:const|function|type|interface) (\w+)/gm)].map((m) => m[1]));
    expect(names.filter((n) => !declared.has(n))).toEqual([]);
  });
});
