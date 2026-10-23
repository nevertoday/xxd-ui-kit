# 参与 xxd-ui-kit

**中文** · [English](CONTRIBUTING.en.md)

这是 MIT 开源项目，欢迎提 issue 和 PR。这是作者个人品牌的设计系统，**审美上的决定由作者来做**，所以先读下面「欢迎什么」再动手，免得白做。
改 `packages/kumo` 内部时，上游的贡献指南 `docs/upstream/KUMO-CONTRIBUTING.md` 仍然有效。

## 欢迎什么

| 很欢迎，直接提 PR | 先开 issue 讨论 | 一般不接受 |
| --- | --- | --- |
| bug 修复、无障碍（键盘、读屏、对比度）、浏览器兼容、繁体和英文翻译、文档、测试、命令行的改进 | 新组件、新模式、改变现有组件的样子或交互、新令牌 | 违反[设计原则](docs/DESIGN-PRINCIPLES.md)的视觉改动（阴影上卡片、700 字重、网络字体……）、只为个人口味的调整 |

视觉改动要能对应到设计原则里的一条；对应不上，先在 issue 里讨论。

## 动手之前

1. 读 `docs/DESIGN-PRINCIPLES.md`。
2. 准备环境：Node 24.12 以上、pnpm 12；`pnpm install && pnpm xxd:build`。
3. 本机看效果：`pnpm dev`（展示站 http://localhost:4400）。

## 仓库里有什么

从下往上三层，上层用下层：

```
令牌     颜色、字号、间距、圆角                  @xxd/tokens   @xxd/icons
  ↓
组件     不用框架的原生组件                      @xxd/css
         React 组件（Kumo 换皮）                 @xxd/react
         小程序组件（Taro + React）              @xxd/mini
  ↓
插件套件 新建插件、同步组件、设置同步、命令行    @xxd/extension
```

| 包 | 一句话 |
| --- | --- |
| `@xxd/tokens` | 所有颜色、字号、间距、圆角的唯一来源；另带首帧脚本 `boot.js`，页面打开第一眼就是用户选的主题 |
| `@xxd/icons` | 500 多个图标，统一画法（24 网格、1.5 线宽、方角），可以按中文关键词搜 |
| `@xxd/css` | 59 个原生组件和 18 个模式，键盘和读屏是自己实现的，由 audit 守着 |
| `@xxd/react` | Kumo 的 React 组件换上小小东的样子（键盘、焦点、读屏由底层的 Base UI 负责），再加小小东独有组件和外观、语言两个 Provider |
| `@xxd/mini` | 微信小程序版：基于 Taro 的 React 组件，样式在构建时从 `@xxd/css` 改写过来（`styles/REPORT.md` 列着改了什么），外观和网页版同一套 |
| `@xxd/mini-demo` | 演示小程序：组件目录、待办、外观设置；它的 H5 版嵌在展示站的「小程序」标签里 |
| `@xxd/extension` | Chrome 插件工具箱和命令行 `xxd-ui` |
| `@xxd/site` | 展示站，中英两版；`pnpm dev` 在 http://localhost:4400 打开 |

`packages/kumo*` 是上游 Kumo 的代码：内部包名保持 `@cloudflare/kumo`，方便合并上游；对外用 `@xxd/react`。根目录的 `pnpm kumo:dev` 打开 Kumo 原版的文档站。

## 改哪里

| 想改 | 只改这里 | 然后 |
| --- | --- | --- |
| 颜色、圆角、字号、间距、动效 | `packages/xxd-tokens/tokens.css` | `pnpm --filter @xxd/tokens build`；对比度测试必须过 |
| 图标 | `packages/xxd-icons/src/nodes.js`，分类和中文关键词在 `src/meta.js` | 图标规则测试必须过 |
| 原生组件 | `packages/xxd-css/src/css/*.css`、`src/js/*.js` | 同步改 `registry.json` 和旁边的英文版 `registry.en.js`；看四种外观 |
| React 组件的颜色映射 | `packages/kumo/scripts/theme-generator/xxd-overrides.ts` | `pnpm --filter @cloudflare/kumo codegen:themes`，更新 `docs/token-map.md` |
| React 组件内部 | `packages/kumo/src/components/…` | 尽量少改（要合并上游）；改了在提交信息里写清楚为什么 |
| 插件模板 / 命令行 | `packages/xxd-extension/`，命令清单在 `scripts/commands.mjs` | `pnpm xxd new` 生成一个看看 |
| 小程序组件 | `packages/xxd-mini/src/`（组件）、`src/styles/`（小程序专有的样式）、`mini.json`（组件清单和网页版类名的归属） | `pnpm --filter @xxd/mini build && pnpm --filter @xxd/mini-demo build && pnpm --filter @xxd/mini-demo check`；新组件要在演示小程序里加演示 |
| 展示站页面 | `packages/xxd-site/src/views/`（正文），`src/pages/` 和 `src/pages/en/` 各放一个入口 | 中英两版都要有（测试会查） |

不要手改生成的文件：`theme-kumo.css`、`ai/*`、`src/primitives/*`、`packages/xxd-react/src/kumo-exports.ts`、各包的 `dist/`、`packages/xxd-mini/styles/`，以及任何项目里的 `vendor/xxd/`、`xxd:tokens` 标记区域、`xxd-icon-nodes.js`。

## 提交前

```bash
pnpm xxd:build && pnpm xxd:test           # 小小东的包（含所有合同测试）；改了 packages/kumo 先 pnpm --filter @cloudflare/kumo build
pnpm --filter @cloudflare/kumo test       # 动了 packages/kumo 时
pnpm lint
pnpm changeset                            # 改了用户看得到的东西时，写一条版本记录（见 .changeset/README.md）
```

展示站的两道检查要无头 Chrome（设置 `CHROME_EXE`）。没有条件跑的话，在 PR 里说一声，维护者来跑；`audit` 也会在 CI 里跑。

```bash
pnpm --filter @xxd/site build
pnpm --filter @xxd/site visual       # 截图对比：每页 × 4 种外观
pnpm --filter @xxd/site run audit    # 无障碍、长文字、恶意宿主页、高对比、英文漏翻、细节、浮层、冒烟、读屏走查
```

视觉改动：附四种外观的截图（亮 / 暗 × 直角 / 圆角，至少一种主色），说明对应原则的哪一条。

## 提交信息

`feat(xxd): …` / `fix(xxd): …` / `docs: …`，说清楚做了什么、为什么。一个提交只做一件事。中文英文都可以。

## 维护的人看这里

| 想知道 | 看这里 |
| --- | --- |
| 路线和进度 | [维护者文档](docs/maintainers/)（计划、评审、开源清单） |
| 展示站怎么搭、怎么部署 | [文档站](docs/DOCS-SITE.md) |
| Kumo 的变量对应我们的哪个 | [令牌映射](docs/token-map.md) |
| 怎么合并 Kumo 的新版本 | [同步上游](docs/UPSTREAM.md) |
| 给 AI 助手的工程约定 | [AGENTS.md](AGENTS.md) |

## 许可

提交的代码以 MIT 许可开源。来自 Kumo 的部分保留 `LICENSE-KUMO`，不要删。

## 行为准则与安全

参与时请遵守 [行为准则](CODE_OF_CONDUCT.md)。发现安全问题请按 [SECURITY.md](SECURITY.md) 私下报告，不要开公开 issue。
