# 同步 Kumo 上游

- 上游：`https://github.com/cloudflare/kumo`，远端名 `upstream`，**push 已禁用**（`git remote set-url --push upstream DISABLED`）。
- 分叉基点：`543dc8a0ca1b6f7678eb9c27be6750965eaf2564`（2026-10-08，@cloudflare/kumo 2.14.0）。

## 怎么同步

```bash
git fetch upstream
git log --oneline main..upstream/main -- packages/kumo   # 看组件库有什么新东西
git merge upstream/main                                   # 在单独分支上做，测试过了再并回 main
pnpm install && pnpm --filter @cloudflare/kumo build && pnpm test
```

## 冲突时的原则

- `.github/`、根 `README.md`、根 `AGENTS.md`、`LICENSE`：保留我们的（上游的说明在 `docs/upstream/`，需要时手动更新那里）。
- `scripts/theme-generator/config.ts`：保留我们的映射，把上游新增的 token 补进映射表 `docs/token-map.md`。
- 生成文件（`theme-kumo.css`、`ai/*`）：不手动合并，合并后重新 codegen。
- 组件内部：逐个看。上游修了 bug 就收，我们的换皮改动保留。

## 什么时候脱钩

换皮后如果每次合并都要花半天以上解决冲突，而上游的新东西我们用不上，就停止同步，在 `docs/PLAN.md` 记录日期和原因，
之后可以把内部包名 `@cloudflare/kumo` 改成 `@xxd/react` 并删掉 `upstream` 远端。

## 决定（2026-10-11）：继续同步，内部包名不改

量了一下换皮后 `packages/kumo` 与上游的差别（相对分叉基点 543dc8a）：

- 组件源码：33 个文件、89 行换 89 行，几乎都是一行内的替换（图标的 import 路径、`rounded-full` → `rounded-pill / rounded-circle`、选中态的 token）。
- 其余：`scripts/theme-generator/xxd-overrides.ts`（新文件）+ `config.ts` 两行、`kumo-binding.css` 一段、`kumo.css` 三处、`vite.config.ts` 一行、`package.json`、3 个测试断言、1 个合同测试（新文件）。

这样的改动和上游合并时冲突很少，值得继续拿上游的 bug 修复和新组件。所以：

- 保留 `upstream` 远端（只读）、保留目录 `packages/kumo` 和内部包名 `@cloudflare/kumo`；消费者只认 `@xxd/react`。
- 新的换皮改动继续优先放在 `xxd-overrides.ts`、`kumo-binding.css` 和新文件里；组件内部只做一行内的替换。
- **脱钩的条件**（满足任一就脱钩，并在 `docs/PLAN.md` 记日期）：一次合并要花半天以上解决冲突；或者要改组件结构（不只是换 class）的地方超过 10 个组件；或者决定开源 `@xxd/react` 并发布到 npm。

## 第二轮的改动（优化计划 O5，2026-10-11）

- **三语文案**：`utils/locale-provider.tsx` 加了 `common`、`pagination` 两组文案和 `layerDialog.moreActions`，合并改成按组通用合并。下面这些组件里写死的英文换成了 `useKumoLocale()`（英文默认值不变，所以上游测试照常通过）：breadcrumbs、clipboard-text、inline-copy-text、sensitive-input、empty、toast、combobox、command-palette、loader、table、pagination、date-range-picker、chart/TimeseriesChart、layer-dialog。每处都是「加一行 hook + 把字面量换成变量」。上游要是自己做了 i18n，以上游为准，再把 `@xxd/react` 的 `KUMO_TRANSLATIONS` 对上去。
- **动效（D2 / D4）**：只在 `kumo-binding.css` 末尾加了一段，组件不动。

## 第三轮（优化计划 O8 加固，2026-10-12）

- 只改了 `scripts/theme-generator/xxd-overrides.ts`（然后 `pnpm --filter @cloudflare/kumo codegen:themes` 重新生成 `theme-kumo.css`），组件源码没动：
  - `kumo-brand` / `kumo-brand-hover` / `kumo-badge-{purple,teal,blue}` 改用 `--action-fill`（主色实心底上白字 ≥ 4.5:1）；
  - `kumo-placeholder` 从 `--muted-2` 改成 `--muted`；兜底色 `#6f6f6f` → `#6b6b6b`。

## 第四轮（评审 R6，2026-10-13）

- 只在 `kumo-binding.css` 末尾加了一段 `@layer utilities`：按 `data-kumo-component` 加 Kumo 自己的尺寸类（`h-9`、`h-6.5`、`size-9`…）把控件高度和内边距映射到 `--control-h*` / `--control-pad-x*` / `--field-pad-x`，组件源码没动。上游要是改了尺寸类名（比如 `h-9` 换成别的），这段要跟着改；`scripts/pack-check.mjs` 会在真浏览器里查原生和 React 按钮是不是一样高。
- `@xxd/react` 构建时把 `packages/kumo/dist` 的模块和类型拷进自己的 `dist/kumo/`（见 `packages/xxd-react/scripts/build.mjs`），对外不再依赖 `@cloudflare/kumo`。
