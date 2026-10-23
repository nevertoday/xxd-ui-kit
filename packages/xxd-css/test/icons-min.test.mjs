// icons-min.js 是组件内部用的几个图标（免得 xxd.js 打包整套）：画法必须和 @xxd/icons 完全一样
import { describe, expect, it } from "vitest";
import { iconSVG, resolveIcon } from "../../xxd-icons/src/svg.js";
import { ICON } from "../src/js/icons-min.js";

const inner = (s) => s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
const SAME_AS = { close: "X", check: "Check", copy: "Copy", search: "Search", success: "CircleCheck", danger: "CircleAlert", warning: "TriangleAlert", info: "Info" };

describe("icons-min 和 @xxd/icons 一致", () => {
  it("每个内部图标都对应一个正式图标", () => {
    expect(Object.keys(ICON).sort()).toEqual(Object.keys(SAME_AS).sort());
  });
  for (const [key, name] of Object.entries(SAME_AS)) {
    it(`${key} = ${name}`, () => {
      expect(resolveIcon(name)).toBeTruthy();
      expect(inner(ICON[key](16))).toBe(inner(iconSVG(name)));
    });
  }
});
