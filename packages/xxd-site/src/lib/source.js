// 组件的样式在 @xxd/css 的哪个源文件里（DOCS-NAV-PLAN G7）：组件页头的「样式源码」「改动记录」链接用。
// 看第一个类名的规则（.xxd-btn { / .xxd-btn, / .xxd-btn[ …）在哪个文件里最多：base.css 里也有几条重置，不算它的家。构建时读源文件，不手写对照表。
const files = import.meta.glob("../../../xxd-css/src/css/*.css", { query: "?raw", import: "default", eager: true });
const sources = Object.entries(files).map(([path, text]) => [path.split("/").pop(), String(text)]);

export function cssFileOf(cls) {
  const re = new RegExp(`\\.${cls.replace(/[-]/g, "\\-")}(?![\\w-])[^{}]*\\{`, "g");
  // 横跨所有组件的几个文件（重置、高对比、触屏补丁、交互工具）只在别处都没有时才算
  const shared = (file) => ["base.css", "robust.css", "forced-colors.css", "interaction.css"].includes(file);
  // 再看哪个文件里有它的本体规则（一行开头就是 .xxd-range {），最后看条数
  const own = new RegExp(`^\\s*\\.${cls.replace(/[-]/g, "\\-")}\\s*[{,]`, "m");
  const ranked = sources
    .map(([file, text]) => [file, text.match(re)?.length ?? 0, own.test(text) ? 1 : 0])
    .filter(([, n]) => n)
    .sort((a, b) => shared(a[0]) - shared(b[0]) || b[2] - a[2] || b[1] - a[1]);
  return ranked[0]?.[0];
}
