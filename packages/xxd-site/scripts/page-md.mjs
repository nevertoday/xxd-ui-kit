// 构建之后：把「本页的 Markdown」还只是占位的页面（开始、命令行与工具、颜色、字体、间距……）
// 从已经生成的 HTML 正文转成 Markdown，覆盖 dist/md/*.md 和 dist/en/md/*.md。
// 组件、模式、模板、原则、图标页的 .md 由 src/lib/md.js 直接从数据生成，不经过这里。
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "../dist");
export const PLACEHOLDER = "<!-- md:from-html -->";

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", mdash: "—", hellip: "…" };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e] ?? m));

/** 去掉整个元素（含嵌套的同名标签）。 */
function dropElements(html, test) {
  let out = html;
  const re = /<(\w+)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(out))) {
    const [open, tag, attrs] = m;
    if (!test(tag.toLowerCase(), attrs)) continue;
    const start = m.index;
    if (/\/>$/.test(open) || /^(img|br|hr|input|meta|link)$/i.test(tag)) {
      out = out.slice(0, start) + out.slice(start + open.length);
      re.lastIndex = start;
      continue;
    }
    let depth = 1;
    const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
    tagRe.lastIndex = start + open.length;
    let t;
    while (depth && (t = tagRe.exec(out))) depth += t[1] ? -1 : /\/>$/.test(t[0]) ? 0 : 1;
    const end = t ? t.index + t[0].length : out.length;
    out = out.slice(0, start) + out.slice(end);
    re.lastIndex = start;
  }
  return out;
}

const inline = (s) =>
  decode(
    s
      .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, x) => "`" + x.replace(/<[^>]+>/g, "") + "`")
      .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, h, x) => `[${x.replace(/<[^>]+>/g, "").trim()}](${h})`)
      .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();

export function htmlToMarkdown(html) {
  let main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
  main = dropElements(main, (tag, attrs) => /^(script|style|svg|button|template|nav|aside)$/.test(tag) || /aria-hidden="true"/.test(attrs) || /class="[^"]*\b(site-demo__stage|site-demo__bar|xxd-sr-only|site-swatch)\b/.test(attrs) || /data-variant="caption"/.test(attrs) || /\bhidden\b(?!=)/.test(attrs));
  const out = [];
  const block = /<(h[1-4]|p|pre|li|tr|dt|dd|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = block.exec(main))) {
    const [, tag, body] = m;
    const t = tag.toLowerCase();
    if (t === "pre") {
      const code = decode(body.replace(/<[^>]+>/g, "")).replace(/\n+$/, "");
      const lang = /<code[^>]*data-lang="(\w+)"/.exec(body)?.[1] ?? "";
      out.push("```" + lang + "\n" + code + "\n```");
      continue;
    }
    if (t === "tr") {
      const cells = [...body.matchAll(/<(t[hd])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((c) => inline(c[2]).replace(/\|/g, "\\|"));
      if (cells.length) out.push(`| ${cells.join(" | ")} |`);
      if (/<th\b/i.test(body)) out.push(`| ${cells.map(() => "---").join(" | ")} |`);
      continue;
    }
    // 嵌套的块（li 里的 pre 等）已经被外层吃掉：li / dd 只取它自己的文字
    const text = inline(body.replace(/<pre\b[\s\S]*?<\/pre>/gi, ""));
    if (!text) continue;
    if (/^h[1-4]$/.test(t)) out.push(`${"#".repeat(Number(t[1]))} ${text}`);
    else if (t === "li") out.push(`- ${text}`);
    else if (t === "dt") out.push(`**${text}**`);
    else if (t === "blockquote") out.push(`> ${text}`);
    else out.push(text);
    // 块里还有代码块（比如 dd 里的用法示例）：接在后面
    for (const pre of body.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)) out.push("```\n" + decode(pre[1].replace(/<[^>]+>/g, "")).replace(/\n+$/, "") + "\n```");
  }
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    if (statSync(f).isDirectory()) walk(f, files);
    else files.push(f);
  }
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let n = 0;
  for (const md of walk(dist).filter((f) => f.endsWith(".md") && /[\\/]md[\\/]/.test(f))) {
    if (!readFileSync(md, "utf8").includes(PLACEHOLDER)) continue;
    const rel = relative(dist, md).split("\\").join("/"); // md/start.md 或 en/md/start.md
    const page = rel.replace(/^(en\/)?md\//, "$1").replace(/\.md$/, "");
    const html = join(dist, page === "index" || page === "en/index" ? page.replace(/index$/, "") : page, "index.html");
    if (!existsSync(html)) continue;
    writeFileSync(md, htmlToMarkdown(readFileSync(html, "utf8")));
    n += 1;
  }
  console.log(`page-md：${n} 页的 Markdown 从 HTML 正文生成`);
}
