// Skyline 的后备声明（scripts/skyline.mjs）：每条 Skyline 不支持的声明前面有一条它认得的，WebView 照旧用原来的。
import { test } from "node:test";
import assert from "node:assert/strict";
import { addSkylineFallbacks, skylineGaps, skylineIssue, splitDecls } from "../scripts/skyline.mjs";

test("splitDecls：data: 地址里的分号不切", () => {
  assert.equal(splitDecls('a: url("data:image/svg+xml;base64,AAA"); b: 1').length, 2);
});

test("skylineIssue：文档里写明不支持的都认得出来，支持的不报", () => {
  assert.equal(skylineIssue("display", "flex"), null);
  assert.equal(skylineIssue("display", "grid").fallback[0][1], "flex");
  assert.equal(skylineIssue("display", "inline-flex").fallback[0][1], "flex");
  assert.match(skylineIssue("color", "currentColor").fallback[0][1], /var\(--xxd-current, var\(--ink\)\)/);
  assert.equal(skylineIssue("margin-left", "0.5em", { fontPx: 14 }).fallback[0][1], "7px");
  assert.equal(skylineIssue("position", "sticky").fallback[0][1], "relative");
  assert.equal(skylineIssue("overflow-y", "auto").fallback[0][1], "hidden");
  assert.equal(skylineIssue("box-shadow", "0 0 0 1px red, 0 2px 4px blue").fallback[0][1], "0 0 0 1px red");
  assert.equal(skylineIssue("--x", "grid"), null);
});

test("addSkylineFallbacks：后备写在原来那条前面；文字颜色多记一份 --xxd-current；不重复加", () => {
  const out = addSkylineFallbacks("\n  display: grid;\n  color: var(--ink);\n  border: 1px solid currentColor;\n", ".xxd-btn");
  const lines = out.split(";").map((l) => l.trim()).filter(Boolean);
  assert.deepEqual(lines.slice(0, 3), ["display: flex", "flex-direction: column", "display: grid"]);
  assert.ok(lines.indexOf("--xxd-current: var(--ink)") < lines.indexOf("color: var(--ink)"));
  assert.ok(lines.indexOf("border: 1px solid var(--xxd-current, var(--ink))") < lines.indexOf("border: 1px solid currentColor"));
  assert.equal(addSkylineFallbacks(out, ".xxd-btn").split("display: flex").length, 2, "第二遍不应该再加一次");
});

test("skylineGaps：有后备的不算缺口，没后备的算；暗色以外的媒体查询单独列出", () => {
  assert.equal(skylineGaps(".a { display: grid }").missing.length, 1);
  const fixed = `.a {${addSkylineFallbacks(" display: grid; overflow: auto ")}}`;
  assert.deepEqual(skylineGaps(fixed).missing, []);
  assert.equal(skylineGaps(fixed).covered, 2);
  assert.deepEqual(skylineGaps("@media (prefers-reduced-motion: reduce) { .a { opacity: 1 } } @media (prefers-color-scheme: dark) { page { --a: 1 } }").media, ["(prefers-reduced-motion: reduce)"]);
});
