// 小程序（M4）：new-mini 新建的项目体检零问题；故意写坏的例子每条规则都报。
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { doctor } from "../scripts/lib/doctor.mjs";
import { checkMini, checkWxss, createMini, isMiniProject } from "../scripts/lib/mini.mjs";
import { COMMANDS } from "../scripts/commands.mjs";
import { HANDLERS } from "../scripts/cli.mjs";

let base;
// 测试里不真的打包（pnpm pack 慢），放三个空文件代替
const fakePack = (out) => {
  const files = ["xxd-tokens-0.1.0.tgz", "xxd-icons-0.1.0.tgz", "xxd-mini-0.1.0.tgz"];
  for (const f of files) writeFileSync(join(out, f), "");
  return files;
};
beforeAll(() => {
  base = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "xxd-mini-"));
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("new-mini", () => {
  it("命令登记了，命令行能找到它", () => {
    expect(COMMANDS.some((c) => c.name === "new-mini")).toBe(true);
    expect(typeof HANDLERS["new-mini"]).toBe("function");
  });

  it("新建的项目：名字、依赖指向 vendor/、插件、暗色、最低基础库都填好了", () => {
    const { dir } = createMini(join(base, "today"), { name: "今日待办", slug: "today-mini", pack: fakePack });
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    expect(pkg.name).toBe("today-mini");
    expect(pkg.dependencies["@xxd/mini"]).toBe("file:vendor/xxd-mini-0.1.0.tgz");
    expect(readFileSync(join(dir, "pnpm-workspace.yaml"), "utf8")).toContain('"@xxd/tokens": "file:vendor/xxd-tokens-0.1.0.tgz"');
    expect(readFileSync(join(dir, "src/app.config.ts"), "utf8")).toMatch(/navigationBarTitleText: "今日待办"/);
    expect(JSON.parse(readFileSync(join(dir, "project.config.json"), "utf8")).libVersion).toBe("3.0.0");
    expect(readFileSync(join(dir, ".gitignore"), "utf8")).toContain("node_modules/");
    for (const f of ["package.json", "config/index.ts", "src/app.tsx", "src/pages/index/index.tsx", "README.md"]) expect(readFileSync(join(dir, f), "utf8")).not.toMatch(/__[A-Z_]+__/);
    expect(isMiniProject(dir)).toBe(true);
  });

  it("新建的项目体检零问题", () => {
    const dir = join(base, "today");
    const result = doctor(dir);
    expect(result.kind).toBe("mini");
    expect(result.findings).toEqual([]);
  });

  it("目录不空、没给名字：拒绝", () => {
    expect(() => createMini(join(base, "today"), { name: "x", pack: fakePack })).toThrow(/不为空/);
    expect(() => createMini(join(base, "no-name"), { pack: fakePack })).toThrow(/--name/);
  });
});

describe("doctor 的小程序规则", () => {
  it("故意写坏的项目：每条规则都报", () => {
    const { dir } = createMini(join(base, "broken"), { name: "坏的", slug: "broken", pack: fakePack });
    const edit = (file, fn) => writeFileSync(join(dir, file), fn(readFileSync(join(dir, file), "utf8")));
    edit("config/index.ts", (s) => s.replace('plugins: ["@xxd/mini/taro-plugin"],', "plugins: [],").replace("pxtransform: { enable: false, config: {} },\n      cssModules", "pxtransform: { enable: true, config: {} },\n      cssModules").replace("node_modules/@xxd/mini/styles/theme.json", "theme.json"));
    edit("src/app.config.ts", (s) => s.replace("darkmode: true,", "").replace('themeLocation: "theme.json",', 'navigationStyle: "custom",'));
    edit("project.config.json", (s) => s.replace('"libVersion": "3.0.0"', '"libVersion": "2.20.0"'));
    edit("src/app.tsx", (s) => s.replace('<XxdProvider lang="zh">{children}</XxdProvider>', "children"));
    edit("src/pages/settings/index.tsx", (s) => s.replaceAll("XxdPage", "View").replace("<AppearanceSettings />", "<AppearanceSettings /><Button icon={Trash} />"));
    edit("src/pages/index/index.tsx", (s) => s.replace("</XxdPage>", '  <TabBar items={TABS} value="index" />\n    </XxdPage>'));
    rmSync(join(dir, "src/custom-tab-bar"), { recursive: true, force: true });
    edit("src/app.css", (s) => `${s}\n.card[data-on] { color: var(--ink) }\n.list * { margin: 0 }\n:root { --x: 1 }\n.btn:hover { opacity: 0.8 }\n`);
    mkdirSync(join(dir, "dist"), { recursive: true });
    writeFileSync(join(dir, "dist/app.json"), "{}");
    writeFileSync(join(dir, "dist/a.wxss"), ".a{width:20rpx}");
    writeFileSync(join(dir, "dist/big.bin"), Buffer.alloc(2_200_000));
    const findings = checkMini(dir);
    const has = (rule, re) => expect(findings.some((f) => f.rule === rule && re.test(f.message)), `${rule} ${re}`).toBe(true);
    has("mini", /taro-plugin/);
    has("mini", /pxtransform/);
    has("mini", /theme\.json.*拷/);
    has("mini", /darkmode/);
    has("mini", /themeLocation/);
    has("mini", /最低基础库/);
    has("mini", /XxdProvider/);
    has("mini", /XxdPage/);
    has("nav", /NavBar/);
    has("tabbar", /自己放了 <TabBar>/);
    has("tabbar", /TabBarHost/);
    has("a11y", /label/);
    has("wxss", /属性选择器/);
    has("wxss", /通配符/);
    has("wxss", /:root/);
    has("wxss", /悬停/);
    has("size", /2 MB/);
    has("size", /rpx/);
    expect(doctor(dir).findings.some((f) => f.level === "error")).toBe(true);
  });

  it("checkWxss：类名、标签、::before、page 都没问题", () => {
    expect(checkWxss("page { --a: 1 } .a > .b::after { color: red } view.a, .b + .c { color: red }")).toEqual([]);
    expect(checkWxss(".a[data-x] { color: red }")).toHaveLength(1);
  });
});
