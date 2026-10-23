// 小小东自己写的 React 组件（src/xxd.tsx）的属性清单：用 TypeScript 读源码里每个导出组件第一个参数的类型。
// 生成 dist/props.json（构建时写），展示站的「React 属性」表和 `xxd-ui doc <组件> --react` 都读它。
// Kumo 来的组件不在这里，它们的属性在 packages/kumo/ai/component-registry.json。
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const ts = createRequire(join(here, "package.json"))("typescript");

const jsDoc = (node) => (node.jsDoc ?? []).map((d) => (typeof d.comment === "string" ? d.comment : "")).filter(Boolean).join("\n").trim();
const text = (node, sf) => node.getText(sf).replace(/\s+/g, " ").trim();

/** { 组件名: { description, props: { 名字: { type, optional, default, description } }, rest } } */
export function xxdReactProps(file = join(here, "src/xxd.tsx")) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = {};
  for (const st of sf.statements) {
    if (!ts.isFunctionDeclaration(st) || !st.name || !/^[A-Z]/.test(st.name.text)) continue;
    if (!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    const param = st.parameters[0];
    const entry = { description: jsDoc(st), props: {}, rest: null };
    out[st.name.text] = entry;
    if (!param?.type) continue;
    // 解构里的初始值就是缺省值：({ level = 2 })
    const defaults = {};
    if (ts.isObjectBindingPattern(param.name)) {
      for (const el of param.name.elements) if (el.initializer && el.name && ts.isIdentifier(el.name)) defaults[el.name.text] = text(el.initializer, sf);
    }
    const parts = ts.isIntersectionTypeNode(param.type) ? param.type.types : [param.type];
    for (const part of parts) {
      if (ts.isTypeLiteralNode(part)) {
        for (const m of part.members) {
          if (!ts.isPropertySignature(m) || !m.name) continue;
          const name = m.name.getText(sf);
          entry.props[name] = { type: m.type ? text(m.type, sf) : "unknown", optional: Boolean(m.questionToken), ...(defaults[name] ? { default: defaults[name] } : {}), description: jsDoc(m) };
        }
      } else if (ts.isTypeReferenceNode(part)) {
        // HTMLAttributes<HTMLDivElement> 这类：其余属性原样透传给根元素
        entry.rest = text(part, sf);
      }
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(xxdReactProps(), null, 2));
