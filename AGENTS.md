# xxd-ui-kit 工作说明（给 AI 编程助手）

小小东的开源设计系统（MIT），fork 自 cloudflare/kumo。这里是工程约定，人和 AI 都适用；给人看的贡献流程见 `CONTRIBUTING.md`。

## 开工前必读

1. `docs/maintainers/DESIGNER-REVIEW-PLAN.md` —— 最近一轮（设计师评审 V1–V6）的任务和验收标准；之前的轮次在同目录的 `REVIEW-PLAN.md`、`PLAN.md`、`OPTIMIZATION-PLAN.md`。做完在「进度」里打勾写日期。
   2026-10-18 做完的两份：`COLOR-SCALE-PLAN.md`（颜色色阶：组件只用用途名，不现场混色；改色阶跑 `node packages/xxd-tokens/scripts/scales.mjs`）、
   `MINI-REVIEW-PLAN.md`（小程序对抗测试 Q1–Q6；真机上还要看的在 `MINI-DEVICE-CHECKLIST.md`）。
   2026-10-19：`GAUGE-PLAN.md`（量表 Gauge：元素参考 gauge-ui，画法按设计原则 §14）、`CHART-TYPES-PLAN.md`（条形榜、构成条、百格图、热力格、前后对比：
   图型分类参考 lieflat-charts，**它是非商用许可，不能搬它的代码**）。换算只有一份 `@xxd/css/viz`（含量表几何），网页 / React / 小程序共用；选图看 §14 的表。
2. `docs/DESIGN-PRINCIPLES.md` —— 审美宪法。任何视觉决定都要能对应到其中一条；对应不上就先问。
3. 改 Kumo 组件前读 `docs/upstream/KUMO-AGENTS.md` 和 `packages/kumo/AGENTS.md`（上游的工程约定仍然有效）。

## 硬规则

- **许可与发布**：MIT 开源。来自 Kumo 的代码保留 `LICENSE-KUMO`。不要 push 到 `upstream`（那是 Cloudflare 的仓库）。推送、发布 npm、部署展示站都是维护者的决定，AI 助手不要自己做，等维护者明确说了再做。package 暂时保持 `private: true`，防止误发 npm。
- **别的仓库**：插件、网站各有自己的仓库，常有未提交的工作。要改的话用 `git worktree add -b <新分支>` 在临时目录里改、在新分支上提交，不推送、不合并。
- **令牌唯一来源**是 `packages/xxd-tokens/tokens.css`。组件里不写死颜色、圆角、阴影、字重；颜色用色阶的用途名（`--danger-tint`、`--accent-border`……），不写 `color-mix()`（测试会拦）。
- 矩形圆角只用 `--r-xs / sm / md / lg / pill`；语义圆用 `--r-circle`。默认直角。
- 卡片、行、按钮不加阴影；动效只动 opacity / transform；字重只有 400 / 500 / 600。
- 图标：24 网格、1.5 线宽、round cap、miter join、方角。
- 不手改生成文件（`theme-kumo.css`、`ai/*`、`src/primitives/*`、`xxd-react/src/kumo-exports.ts`、`xxd-icons/src/{names.d.ts,each.js,each.d.ts}`），改源配置再 codegen / 构建。
- 展示站有中英两版：改 `packages/xxd-css/registry.json` / `patterns.json` 时同步改旁边的 `registry.en.js` / `patterns.en.js`；加展示站页面时 `src/pages/en/` 也加一个（正文写在 `src/views/`）。测试会检查。
- 字体只用系统无衬线（不用宋体 / 衬线），不加载网络字体。
- 修改后跑 `pnpm --filter @cloudflare/kumo test`；基线是 65 文件 / 1456 测试全绿。改了组件样式还要跑展示站的 audit（`--only=parity` 两种实现对照、`--only=polish` 细节、`--only=spec` 规格）。
