# Changesets（版本记录）

小小东 UI Kit 用 [Changesets](https://github.com/changesets/changesets) 记录每次改动、生成 `CHANGELOG.md`、统一升版本。

- **管哪些包**：`@xxd/tokens`、`@xxd/icons`、`@xxd/css`、`@xxd/react`、`@xxd/extension`，它们版本号一起走（`config.json` 的 `fixed`）。
- **不管哪些**：上游的 `@cloudflare/kumo*`（内部包，不发布）和展示站 `@xxd/site`（`ignore`）。
- **什么时候写**：改了上面这些包里用户看得到的东西（新组件、改了行为或样子、修了 bug）。只改文档、测试、展示站的不用写。

```bash
pnpm changeset            # 选包、选 patch / minor / major、写一句给用户看的说明
pnpm changeset version    # 发布前：合并所有 changeset，升版本，写 CHANGELOG
```

0.x 期间：破坏性改动升 minor，其余升 patch。
