---
name: xxd-ui
description: Build or restyle any 小小东 interface with the open-source (MIT) 小小东 UI Kit (xxd-ui-kit) — Chrome extension side panels, options pages, popups, content-script UI, the 小小东提示词 member site, or React apps. Use whenever the user asks to 做一个新插件、新建插件、写个侧边栏、做设置页、改界面、统一样式、换成小小东风格、用 UI Kit、接入 xxd-ui-kit, or edits UI in any 小小东 project, even if the kit is not named. Covers scaffolding (pnpm xxd new), syncing (pnpm xxd sync), component lookup (pnpm xxd doc), the design rules (square corners by default, ink emphasis, warm-black dark, 1.5 miter icons, dialog action order) and the checks to run.
---

# 小小东 UI Kit

仓库：这个 Skill 所在目录往上两级（`skills/xxd-ui/` → 仓库根目录；Skill 通常是从仓库链接过去的）；也可以用环境变量 `XXD_UI_KIT_DIR` 指定。
MIT 开源；不 push `upstream`；推送、发 npm、部署等用户说了再做。装过 `pnpm xxd link` 的话，任何目录都能用 `xxd-ui …` 代替 `pnpm xxd …`。

## 先读

1. `docs/DESIGN-PRINCIPLES.md` —— 审美宪法。任何视觉决定都要对应到其中一条，对应不上就问用户。
2. 要用的组件：`pnpm xxd doc <组件>`（原生，中文名也行；`--markup` 只要示例代码）或 `pnpm xxd doc <组件> --react`；全部组件 `pnpm xxd ls`。要用的图标：`pnpm xxd icon <中文关键词>`（500 多个；不要自己画 SVG，也不要猜名字）。

## 选哪一层

| 项目 | 用 |
| --- | --- |
| Chrome 插件（原生 JS，绝大多数） | `@xxd/css` 原生组件，`pnpm xxd new` / `pnpm xxd sync` 拷进 `vendor/xxd/` |
| 会员站（原生 JS + esbuild，Cloudflare） | `xxd.config.json` 的 layered 令牌 + 图标数据；新界面用 `xxd-*` 类 |
| React / Next.js | `@xxd/react`（Kumo 换皮版）+ `@xxd/react/styles.css` |
| 往第三方网页注入的 UI | `XxdExtension.mountXxdUI`（Shadow DOM + `xxd.shadow.css`） |

## 新插件

```bash
cd <仓库根目录>
pnpm xxd new <目录> --name 四字名字 --name-en "English" --slug short-id   # 需要时加 --popup / --content "<match>" / --account
```

然后在模板上改：tab 在最上面（没有顶栏）、内容在阅读列里、底部 dock（状态在前，下一步在最后）、设置页用 `Xxd.mountAppearance` 接 `XxdExtension.createAppearanceStore({ key })`。详见 `docs/EXTENSION-KIT.md`。

## 已有项目

- 先 `pnpm xxd status <目录>` 看版本；更新用 `pnpm xxd sync <目录>`，不要手改 `vendor/xxd/`。还没接入的项目：`pnpm xxd init <目录>`。
- 渐进迁移：先只换令牌（`tokens.css` + `boot.js`，用 `tokensTargets` 保留老路径），再一个模块一个模块换成 `xxd-*` 类，并删掉旧 CSS 里对应的规则。
- 用户在别的项目里有未提交的改动时：用 `git worktree add -b <新分支>` 在临时目录里改，提交到新分支，不碰原工作区；**不推送、不部署**，除非用户明确要求。

## 写代码时守住

- 颜色、圆角、阴影、字号只用令牌（`var(--…)`），不写死。矩形圆角只用 `--r-xs/sm/md/lg/pill`，语义圆（单选、状态点、头像、色块）用 `--r-circle`。默认直角。
- 卡片、行、按钮没有阴影；只有浮层有。字重只有 400 / 500 / 600；选中改颜色，不加粗。
- 线：能用空间分开就不画线；不出现两条挨着的线；一个框只有一个框。
- 图标：`@xxd/icons`（`<i data-xxd-icon="Check">` 或 `XxdIcons.iconSVG`），24 网格、1.5 线宽、圆头、斜接角、方角。
- 动效只动 opacity / transform，不弹跳；尊重减少动效。
- 对话框：取消在前（`ui-dialog-cancel`，内容宽度、安静），主操作最后；按钮文字说下一次点击会做什么。
- 反馈就地出现：面板里的操作 `Xxd.toast(…, { within: panelBody })`。
- 文案直接、照字面；三语（简 / 繁 / 英），`data-i18n`。
- 改完跑 `pnpm xxd doctor <目录>`：错误（图标名拼错、引用的文件不在、__MSG 缺条目）必须修；提醒里是新写的代码就改成令牌，老代码顺手改或说明。确实要例外的那一行写 `xxd-ignore`。

## 改 UI Kit 本身

- 令牌唯一来源 `packages/xxd-tokens/tokens.css`；图标 `packages/xxd-icons/src/nodes.js`（新图标同时在 `src/meta.js` 写分类和中文关键词，测试会查）；原生组件 `packages/xxd-css/src/`，并同步 `registry.json`；Kumo 颜色映射只改 `packages/kumo/scripts/theme-generator/xxd-overrides.ts`。
- 跑 `pnpm xxd:build && pnpm xxd:test`；动了 Kumo 再跑 `pnpm --filter @cloudflare/kumo test` 和 `pnpm lint`。
- 看效果：`pnpm dev` 打开展示站（http://localhost:4400），每个组件页有原生和 React 两种演示，右上角切亮/暗 × 直角/圆角 × 主色，都要看。
- 完成后在 `docs/maintainers/` 当前那一轮的计划里记录。
