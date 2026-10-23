// lightningcss 改选择器：Shadow / layered 版本、状态矩阵都靠它
import assert from "node:assert/strict";
import test from "node:test";
import { toLayered, toShadow, parseBlocks } from "../scripts/build.mjs";

const body = (css) => css.slice(css.indexOf("}\n}\n") + 4);

test(":root 的各种写法都正确地变成 :host(...)", () => {
  const out = body(toShadow(`:root { --a: 1 }\n:root[data-theme="dark"] { --a: 2 }\n:root:lang(zh-TW) { --a: 3 }\n:root:not([data-theme]) { --a: 4 }\n:root[data-accent] .b { color: red }\n`));
  assert.match(out, /:host,\n:host > \* \{/);
  assert.match(out, /:host\(\[data-theme="dark"\]\),\n:host\(\[data-theme="dark"\]\) > \* \{/);
  assert.match(out, /:host\(:lang\(zh-TW\)\),\n:host\(:lang\(zh-TW\)\) > \* \{/);
  // 以前的正则会写成 :host:not(...)（在 Shadow 里永远不匹配）
  assert.match(out, /:host\(:not\(\[data-theme\]\)\)/);
  assert.match(out, /:host\(\[data-accent\]\) \.b \{/);
  assert.doesNotMatch(out, /:root/);
});

test("声明原样保留（var()、color-mix、斜杠简写都不改写）", () => {
  const decls = "--x: rgba(var(--shadow-rgb), 0.16); background: color-mix(in srgb, var(--a) 86%, #000000); font: var(--w) var(--s) / 1.55 var(--f);";
  assert.ok(body(toShadow(`:root { ${decls} }`)).includes(decls));
  assert.ok(toLayered(`:root { ${decls} }`).includes(decls));
});

test("外观属性开头的选择器多一个 :host() 版本；@keyframes 不动", () => {
  const out = body(toShadow(`[data-finish="material"] .b { color: red }\n[data-finish="material"] { --e: 1 }\n@keyframes k { from { opacity: 0 } to { opacity: 1 } }`));
  assert.match(out, /\[data-finish="material"\] \.b,\n:host\(\[data-finish="material"\]\) \.b \{/);
  assert.match(out, /\[data-finish="material"\],\n:host\(\[data-finish="material"\]\),\n:host\(\[data-finish="material"\]\) > \* \{/);
  assert.match(out, /@keyframes k \{ from \{ opacity: 0 \} to \{ opacity: 1 \} \}/);
});

test("layered：:root[...] 整段放进 :where()", () => {
  const out = toLayered(`:root:lang(zh-TW) { --a: 1 }\n:root[data-theme="dark"],\n[data-theme="dark"] { --a: 2 }`);
  assert.match(out, /:where\(:root:lang\(zh-TW\)\) \{/);
  assert.match(out, /:where\(:root\[data-theme="dark"\]\),\n\[data-theme="dark"\] \{/);
});

test("parseBlocks：@media 里的规则单独记；别人项目里不认识的写法跳过而不报错", () => {
  const blocks = parseBlocks(`:root { --a: 1 }\n@media (pointer: coarse) { :root { --a: 2 } }\n.x { @apply foo; --b: 3 }`);
  assert.equal(blocks[":root"]["--a"], "1");
  assert.equal(blocks["@media (pointer: coarse) :root"]["--a"], "2");
});
