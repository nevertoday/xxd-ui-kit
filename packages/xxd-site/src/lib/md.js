// 每页的 Markdown 版本和 llms.txt（给 AI）：内容来自同一份数据，和 HTML 页一致。中文在 /md、/llms.txt，英文在 /en/md、/en/llms.txt。
import { componentsFor, ICON_NAMES, ICON_GROUPS } from "./data.js";
import { principlesFor } from "../data/principles.js";
import { patternsFor } from "../data/patterns.js";
import { templatesFor } from "../data/templates.js";
import { flatPagesFor } from "../data/nav.js";
import { mdHref, stripLang, t } from "../i18n/index.js";

const fence = (s, lang = "html") => "```" + lang + "\n" + s.trim() + "\n```";

const W = {
  zh: { category: "分类", examples: "示例", props: "属性与类名", classes: "类名", a11y: "键盘与读屏", rules: "规则", good: "好", bad: "不好", colon: "：", sep: "、",
    index: "# 小小东 UI Kit\n\n中文优先、不依赖框架的界面组件：一个 CSS 加一个 JS 就能用，专门照顾 Chrome 插件（MV3）；React 版基于 Cloudflare Kumo。上手见 /md/start.md，全站目录见 /llms.txt。",
    icons: (n) => `# 图标\n\n${n} 个，按分类列出，每个后面是中文关键词。用法：\`<i data-xxd-icon="Check"></i>\`、\`XxdIcons.iconSVG("Check", { size: 16 })\` 或 React \`<Icon name="Check" />\`。命令行查找：\`pnpm xxd icon 关键词\`。\n\n` +
      ICON_GROUPS.map((g) => `## ${g.zh}\n\n` + Object.entries(g.icons).map(([k, v]) => `- ${k} — ${v}`).join("\n")).join("\n\n"),
    // 占位：构建后 scripts/page-md.mjs 用 HTML 正文替换（带这个标记的才替换）
    other: (label, group, href) => `<!-- md:from-html -->\n# ${label}\n\n（${group}）完整内容见 ${href}；组件 API 见 /api/registry.json。`,
    llmsTitle: "# 小小东 UI Kit",
    llmsLead: "> 中文优先、不依赖框架的界面组件，专门照顾 Chrome 插件（MV3）。黑白灰、默认直角、强调靠墨色；原生 HTML（@xxd/css）与 React（@xxd/react）两种实现。上手：/md/start.md；命令行：/md/tools.md。",
    pages: "## 页面", comps: "## 组件（原生类名）", registry: "注册表：/api/registry.json", alt: "English: /en/llms.txt" },
  en: { category: "Category", examples: "Examples", props: "Attributes and classes", classes: "Classes", a11y: "Keyboard and screen readers", rules: "Rules", good: "Do", bad: "Don't", colon: ": ", sep: ", ",
    index: "# XXD UI Kit\n\nA Chinese-first, framework-free UI kit: one CSS file and one JS file, with first-class support for Chrome extensions (MV3); the React version is built on Cloudflare Kumo. Getting started: /en/md/start.md; site index: /en/llms.txt.",
    icons: (n) => `# Icons\n\n${n} icons by category. Usage: \`<i data-xxd-icon="Check"></i>\`, \`XxdIcons.iconSVG("Check", { size: 16 })\` or React \`<Icon name="Check" />\`. Find one from the CLI: \`pnpm xxd icon <keyword>\`.\n\n` +
      ICON_GROUPS.map((g) => `## ${g.en}\n\n` + Object.keys(g.icons).join(", ")).join("\n\n"),
    other: (label, group, href) => `<!-- md:from-html -->\n# ${label}\n\n(${group}) Full content at ${href}; component API at /en/api/registry.json.`,
    llmsTitle: "# XXD UI Kit (小小东 UI)",
    llmsLead: "> A Chinese-first, framework-free UI kit with first-class support for Chrome extensions (MV3). Black, white and gray, square corners by default, ink for emphasis; two implementations: native HTML (@xxd/css) and React (@xxd/react). Getting started: /en/md/start.md; CLI: /en/md/tools.md.",
    pages: "## Pages", comps: "## Components (native classes)", registry: "Registry: /en/api/registry.json", alt: "中文：/llms.txt" },
};

function componentMd(c, lang) {
  const w = W[lang];
  return [
    `# ${lang === "en" ? c.label : `${c.label} ${c.name}`}`,
    "",
    `${w.category}${w.colon}${c.categoryLabel}${c.react ? ` · React${w.colon}${c.react}` : ""}`,
    c.summary ? `\n${c.summary}` : "",
    "",
    `## ${w.examples}`,
    fence(c.markup),
    ...(c.examples ?? []).flatMap((e) => ["", `### ${e.title}`, e.text ?? "", fence(e.markup)]),
    "",
    `## ${w.props}`,
    ...Object.entries(c.attributes ?? {}).map(([k, v]) => `- \`${k}\`${w.colon}${v}`),
    `- ${w.classes}${w.colon}${c.classes.map((x) => `\`${x}\``).join(" ")}`,
    ...(c.js ? ["", "## JS", fence(c.js, "js")] : []),
    ...(c.a11y ? ["", `## ${w.a11y}`, ...c.a11y.map((r) => `- ${r}`)] : []),
    ...(c.rules?.length ? ["", `## ${w.rules}`, ...c.rules.map((r) => `- ${r}`)] : []),
  ].join("\n");
}

/** 某种语言的全部 .md 页：[{ path, body }]，path 不带语言前缀 */
export function mdPages(lang = "zh") {
  const w = W[lang];
  const L = t(lang);
  const pages = [
    { path: "index", body: w.index },
    { path: "principles", body: [`# ${L.pagePrinciples}`, "", ...principlesFor(lang).flatMap((p) => [lang === "en" ? `## ${p.title} (${p.ref})` : `## ${p.title}（${p.ref}）`, `- ${w.good}${w.colon}${p.doText}`, fence(p.doMarkup), `- ${w.bad}${w.colon}${p.dontText}`, ""])].join("\n") },
    { path: "foundations/icons", body: w.icons(ICON_NAMES.length) },
    ...componentsFor(lang).map((c) => ({ path: `components/${c.slug}`, body: componentMd(c, lang) })),
    ...patternsFor(lang).map((p) => ({ path: `patterns/${p.slug}`, body: [`# ${p.label}`, "", p.summary, "", fence(p.markup), ...(p.rules ?? []).map((r) => `- ${r}`), ...(p.js ? ["", fence(p.js, "js")] : [])].join("\n") })),
    ...templatesFor(lang).map((x) => ({ path: `templates/${x.slug}`, body: [`# ${x.label}`, "", x.summary, "", fence(x.markup)].join("\n") })),
  ];
  // 其余静态页：给出标题和 HTML 地址，保证每页的「本页的 Markdown」都有东西
  const have = new Set(pages.map((p) => p.path));
  for (const page of flatPagesFor(lang)) {
    const path = stripLang(page.href).replace(/^\//, "").split("#")[0];
    if (path && !have.has(path)) {
      have.add(path);
      pages.push({ path, body: w.other(page.label, page.group, page.href) });
    }
  }
  return pages;
}

export function llmsTxt(lang = "zh") {
  const w = W[lang];
  return [
    w.llmsTitle,
    "",
    w.llmsLead,
    "",
    w.pages,
    ...flatPagesFor(lang).filter((p) => !p.href.includes("#")).map((p) => `- [${p.label}](${mdHref(p.href, lang)})${p.sub ? ` — ${p.sub}` : ""}`),
    "",
    w.comps,
    ...componentsFor(lang).map((c) => `- ${c.name}${lang === "en" ? ` (${c.label})` : `（${c.label}）`}${w.colon}${c.classes.slice(0, 4).join(" ")}`),
    "",
    w.registry,
    w.alt,
  ].join("\n");
}
