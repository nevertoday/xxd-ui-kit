# xxd-ui-kit 工作说明（给 AI 编程助手）

小小东的开源设计系统（MIT），fork 自 cloudflare/kumo。这里是工程约定，人和 AI 都适用；给人看的贡献流程见 `CONTRIBUTING.md`。

## 开工前必读

1. `docs/maintainers/DESIGNER-REVIEW-PLAN.md` —— 最近一轮（设计师评审 V1–V6）的任务和验收标准；之前的轮次在同目录的 `REVIEW-PLAN.md`、`PLAN.md`、`OPTIMIZATION-PLAN.md`。做完在「进度」里打勾写日期。
   2026-10-18 做完的两份：`COLOR-SCALE-PLAN.md`（颜色色阶：组件只用用途名，不现场混色；改色阶跑 `node packages/xxd-tokens/scripts/scales.mjs`）、
   `MINI-REVIEW-PLAN.md`（小程序对抗测试 Q1–Q6；真机上还要看的在 `MINI-DEVICE-CHECKLIST.md`）。
   2026-10-19：`GAUGE-PLAN.md`（量表 Gauge：元素参考 gauge-ui，画法按设计原则 §14）、`CHART-TYPES-PLAN.md`（条形榜、构成条、百格图、热力格、前后对比：
   图型分类参考 lieflat-charts，**它是非商用许可，不能搬它的代码**）。换算只有一份 `@xxd/css/viz`（含量表几何），网页 / React / 小程序共用；选图看 §14 的表。
   2026-10-21：`CHART-REVIEW-PLAN.md`（这六种图的对抗测试：坏数据、窄屏、大数、触屏读数、高对比、打印；D49–D53）。
   2026-10-22：`SPACING-REVIEW-PLAN.md`（间距和对齐的体系：用途令牌 `--inset-*` / `--gap-*`、看起来四边一样、对齐只有两条线；D54–D60）。
   组件写用途令牌；展示站和小程序也守同一把尺子（门禁扫 `site.css`、小程序样式）；audit 加了 `--only=inset`，「细节」里加了「差一点没对齐」。
   2026-10-22：`SHAPE-LINE-PLAN.md`（圆角和线：直角就是直角，只有单选和转圈永远是圆；线的颜色只看用途——容器 `--line`、结构 `--line-strong`、控件 `--line-control`、当前 `--action`、出错 `--danger`；D61–D65）。
   2026-10-22：`TYPE-REVIEW-PLAN.md`（字和层级：展示站用组件的标题档、600 只给整屏标题和大数字、等宽字小一档、`<b>` 收到 600、不用斜体、中文不小于 12px；D66–D73）。
   2026-10-22：`COLOR-REVIEW-PLAN.md`（颜色和对比度：选中 / 当前要有 ≥ 3:1 的记号、任何主色下标记 ≥ 3 和灰字 ≥ 4.5、热力格每级配字色、原样模式标记用调过的一档；D74–D81；audit 加 `--only=contrast`）。
   2026-10-22：`MOTION-REVIEW-PLAN.md`（动效和交互反馈：按下立即变、进行中晚 150ms、完成反馈、toast 时长按内容；D82–D90）和
   `ACCEPTANCE-REVIEW.md`（7 条验收指标的多 agent 核查：状态优先级、嵌套浮层、焦点不被裁、局部主题、撤销；audit 加 `--only=focus / motion / states`）。
   2026-10-22：`TRUNCATION-REVIEW-PLAN.md`（截断和长文字：内容折行、标签才省略，省略只在末尾、悬停 / 聚焦能看到全文，数字永不截断；
   xxd.js 量到放不下的标签标 `data-truncated`（`truncate.js`）；Kumo 按钮、徽标、下拉、面包屑在绑定层收缩；D91–D96，audit 加 `--only=trunc`）。
   2026-10-23：`FORM-REVIEW-PLAN.md`（表单和出错：错误放在整个控件下面、前面一个图标、出错时顶替说明；`<form data-xxd-validate>` 用原生约束校验、
   三语默认句子、焦点到第一个错；字数会动；输入法拼字时的回车不算；React 出错写 `aria-invalid`、和 HTML 一样；D97–D106，audit 加 `--only=form`）。
   2026-10-23：`DARK-REVIEW-PLAN.md`（暗黑模式：局部 `data-theme` 是一张完整的面、弹出的浮层跟着它；切主题不过渡；打印是亮色；
   图表看局部主题；Kumo 的暗色规则也认 `data-theme="dark"`；D107–D114，audit 加 `--only=dark`）。
   2026-10-23：`TOUCH-REVIEW-PLAN.md`（手机和触屏：粗指针上控件 44 高、点按区 44 / 文字 24、输入框 16px；悬停在构建时包进
   `@media (hover: hover)`（`xxd-css/scripts/hover-only.mjs`，源码照旧写 `:hover`）；安全区、滚动不传出去、手指不弹提示；D115–D122，audit 加 `--only=touch`）。
   2026-10-23：`ECHARTS-REVIEW-PLAN.md`（ECharts 图表：`Xxd.chartOptions` 按图种套色、饼图没有坐标轴、高对比换系统色加花纹、读屏的一句话自己写（三语）、
   图例画出线型并让行、柱状图类目不藏、刻度缩写、参考线的字在图里、没有进场动画；`watchChartTheme` 管尺寸和触屏提示；Kumo 的图表在有令牌时用令牌的颜色；D123–D136，audit 加 `--only=chart`）。
   2026-10-30：`DIAGRAM-PLAN.md`（图解：只做步骤、时间线、流程、树、循环、分层 6 种，参考 diagram-design（MIT）的规则；
   节点是 HTML、线是伪元素的边框（不用 grid，Skyline 不认），读屏是列表，窄屏变竖排不横向滚动；一次性的工程图交给第二阶段的 AI 技能；D140–D149）。
   三批都做完：`Steps`、`Timeline`（小程序原来的 `Steps` 改成网页版的样子）；`Flowchart`、`Tree`、Kumo `Flow` 套令牌；`Cycle`、`Layers`。audit 加 `--only=diagram`（连线逐段量两头接没接上）；AI 技能待定。
2. `docs/DESIGN-PRINCIPLES.md` —— 审美宪法。任何视觉决定都要能对应到其中一条；对应不上就先问。
3. 改 Kumo 组件前读 `docs/upstream/KUMO-AGENTS.md` 和 `packages/kumo/AGENTS.md`（上游的工程约定仍然有效）。

## 硬规则

- **许可与发布**：MIT 开源。来自 Kumo 的代码保留 `LICENSE-KUMO`。不要 push 到 `upstream`（那是 Cloudflare 的仓库）。推送、发布 npm、部署展示站都是维护者的决定，AI 助手不要自己做，等维护者明确说了再做。package 暂时保持 `private: true`，防止误发 npm。
- **别的仓库**：插件、网站各有自己的仓库，常有未提交的工作。要改的话用 `git worktree add -b <新分支>` 在临时目录里改、在新分支上提交，不推送、不合并。
- **令牌唯一来源**是 `packages/xxd-tokens/tokens.css`。组件里不写死颜色、圆角、阴影、字重；颜色用色阶的用途名（`--danger-tint`、`--accent-border`……），不写 `color-mix()`（测试会拦）。
- 矩形圆角只用 `--r-xs / sm / md / lg / pill`；`--r-circle` 只给单选和转圈（头像、点、色块跟开关走，用 `--r-pill`）。默认直角。
- 卡片、行、按钮不加阴影；动效只动 opacity / transform；字重只有 400 / 500 / 600。
- 图标：24 网格、1.5 线宽、round cap、miter join、方角。
- 不手改生成文件（`theme-kumo.css`、`ai/*`、`src/primitives/*`、`xxd-react/src/kumo-exports.ts`、`xxd-icons/src/{names.d.ts,each.js,each.d.ts}`），改源配置再 codegen / 构建。
- 展示站有中英两版：改 `packages/xxd-css/registry.json` / `patterns.json` 时同步改旁边的 `registry.en.js` / `patterns.en.js`；加展示站页面时 `src/pages/en/` 也加一个（正文写在 `src/views/`）。测试会检查。
- 字体只用系统无衬线（不用宋体 / 衬线），不加载网络字体。
- 修改后跑 `pnpm --filter @cloudflare/kumo test`；基线是 65 文件 / 1458 测试全绿。改了组件样式还要跑展示站的 audit（`--only=parity` 两种实现对照、`--only=polish` 细节、`--only=spec` 规格、`--only=inset` 看得见的内边距、`--only=contrast` 真实对比度和选中记号、`--only=focus / motion / states` 焦点不被裁、按下立即变、状态叠加、`--only=trunc` 长文字和截断、`--only=form` 表单和出错、`--only=dark` 暗黑模式、`--only=touch` 手机和触屏、`--only=chart` ECharts 图表、`--only=diagram` 图解）。
