# 开源清单

> 本项目以 **MIT 许可**开源（2026-10-12），公开仓库：<https://github.com/nevertoday/xxd-ui-kit>。这份清单记录公开时检查过什么、还剩什么。
> 自查脚本：`node scripts/open-source-audit.mjs`（只读，列出不该公开的内部引用）。推送前跑一次。

## 1. 已经定了

- [x] **许可**：MIT（2026-10-12）。小小东的部分见根 `LICENSE`，来自 Kumo 的部分保留 `LICENSE-KUMO`；
      `packages/kumo`、`packages/kumo-docs-astro` 随包的 `LICENSE` 写明两部分都是 MIT；各包 `license` 字段都是 `MIT`；
      构建横幅和拷进插件的 `vendor/xxd/LICENSE` 都写 MIT。
      选 MIT 的原因：和 Kumo 一致；插件和会员站把组件拷进去用，不会因此被要求公开它们自己的代码。
- [x] **开哪些**：整个仓库。
- [x] **和 Kumo 上游的关系**：继续同步、内部包名不改（依据和脱钩条件见 `docs/UPSTREAM.md`）。

## 2. 公开时检查过的

| 检查 | 公开时（2026-10-12） | 以后 |
| --- | --- | --- |
| 本机路径 `/Volumes/…` `/Users/…` | `skills/xxd-ui/SKILL.md` 里 2 处（仓库位置，Skill 靠它找仓库） | 可以改成「仓库根目录」这类相对说法 |
| 个人邮箱、微信号、Chrome 商店 ID | 0 处（自查脚本里的微信号只用来检测，本来就公开在你的主页仓库） | 0 |
| 会员站域名 | 版权行和计划文档里有 | 可以保留 |
| 旧的许可声明 | 0 处 | 0 |
| 上游 Cloudflare 品牌 | Cloudflare Logo 组件、Kumo 文档站链接、`wrangler.jsonc` 账号、视觉回归脚本 | 删掉 Logo 组件或保留但不导出；`wrangler.jsonc` 换成自己的或删 |
| 内部记录 | `docs/member-site.md`、`docs/PLAN.md` 写了会员站和插件仓库的分支名、测试情况 | 已随仓库公开；以后不想公开的内容不要写进来 |
| git 历史 | 公开前扫过本项目的全部提交，没有密钥、令牌、密码；提交记录里的作者邮箱随仓库公开 | 提交前别把密钥写进文件 |

## 3. 公开之后

- [x] 建 GitHub 公开仓库并推送 `main`（2026-10-12）：<https://github.com/nevertoday/xxd-ui-kit>。`upstream` 的推送仍然禁用。
- [ ] CI：`.github/workflows/xxd.yml`（构建 + 小小东测试 + Kumo 测试 + lint）推上去后会自动运行，看第一次是否全绿。
- [x] 历史：保留了 Kumo 的完整 git 历史（MIT 允许）。
- [ ] **发不发 npm**：开源不等于要发 npm。插件靠 `pnpm xxd sync` 拷文件，不需要 npm；只有别人的 React 项目才需要。
      要发的包把 `"private": true` 改成 false，加 `publishConfig`，并把 `.changeset/config.json` 的 `access` 改成 `public`。
- [x] 展示站部署到 <https://ui.xiaoxiaodong.ai>（2026-10-12），GitHub 仓库的 About 也填了这个网址。部署方法见 `docs/DOCS-SITE.md`。

## 4. 不需要做的

- 会员站、各插件**不需要**跟着开源：它们通过 `vendor/xxd/` 拷文件使用，`vendor/xxd/LICENSE` 里是 MIT 原文，满足 MIT 的署名要求。
- `CONTRIBUTING.md`、`README.md` 已经按开源项目写好。
