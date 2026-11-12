// 别家的设计系统（/references）。只收官方公开的设计系统；链接、色值都是 2026-11-12 打开官方页面核对过的，
// 色值的出处写在每条的 source 里。「值得学」是我们自己的话。不放 logo、不放截图。
// 中英文写在同一条里（zh / en），两种语言条数天然一样。

export const REF_GROUPS = [
  { key: "chinese", label: { zh: "中文团队", en: "Chinese teams" } },
  { key: "platform", label: { zh: "操作系统和平台", en: "Operating systems and platforms" } },
  { key: "enterprise", label: { zh: "企业软件", en: "Enterprise software" } },
  { key: "product", label: { zh: "产品和开发者工具", en: "Products and developer tools" } },
  { key: "public", label: { zh: "公共服务", en: "Public services" } },
];

const P = { zh: "主色", en: "Primary" };
const TX = { zh: "正文", en: "Text" };
const BG = { zh: "背景", en: "Background" };
const SF = { zh: "底色", en: "Surface" };
const SG = { zh: "特色", en: "Signature" };
const c = (role, hex) => ({ role, hex });

export const REFERENCES = [
  {
    group: "chinese", name: "Ant Design", org: { zh: "蚂蚁集团", en: "Ant Group" },
    docs: "https://ant.design/", docsZh: "https://ant.design/index-cn/", repo: "https://github.com/ant-design/ant-design",
    colors: [c(P, "#1677FF"), c(TX, "#1F1F1F"), c(BG, "#F5F5F5"), c(SF, "#FFFFFF")],
    source: "components/theme/themes/seed.ts + default/colors.ts（ant-design 仓库）；正文是 rgba(0,0,0,0.88) 叠在白底上",
    learn: {
      zh: "把设计价值观（自然、确定、意义、生长）写成了可以对照的条目；表单页、列表页这些中后台模式来自研究。另有支付宝小程序版 Ant Design Mini。",
      en: "Design values (natural, certain, meaningful, growing) written down so you can check work against them, and research-based admin patterns such as form and list pages. There is also Ant Design Mini for Alipay mini programs.",
    },
  },
  {
    group: "chinese", name: "Arco Design", org: { zh: "字节跳动", en: "ByteDance" },
    docs: "https://arco.design/react/en-US/docs/start", docsZh: "https://arco.design/", repo: "https://github.com/arco-design/arco-design",
    colors: [c(P, "#165DFF"), c(TX, "#1D2129"), c(BG, "#FFFFFF"), c(SF, "#F2F3F5")],
    source: "@arco-design/web-react@2.66.18 es/style/theme/color/compiled-colors.less + global.less",
    learn: {
      zh: "主题商店和 Design Lab：在网页上调样式，直接生成可用的主题代码。",
      en: "A theme store and Design Lab: adjust styles in the browser and get theme code you can ship.",
    },
  },
  {
    group: "chinese", name: "TDesign", org: { zh: "腾讯", en: "Tencent" },
    docs: "https://tdesign.tencent.com/index-en", docsZh: "https://tdesign.tencent.com/", repo: "https://github.com/Tencent/tdesign", mini: true,
    colors: [c(P, "#0052D9"), c(TX, "#1A1A1A"), c(BG, "#EEEEEE"), c(SF, "#FFFFFF")],
    source: "tdesign-react@1.18.6 esm/common/style/web/theme/_light.less；正文是 rgba(0,0,0,0.9) 叠在白底上",
    learn: {
      zh: "同一套设计有 Vue、React、微信小程序、Flutter、uni-app 几个版本。做小程序时最值得对照。",
      en: "One design shipped for Vue, React, WeChat mini programs, Flutter and uni-app. The one to compare with when building a mini program.",
    },
  },
  {
    group: "chinese", name: "Semi Design", org: { zh: "抖音前端", en: "Douyin (ByteDance)" },
    docs: "https://semi.design/en-US/", docsZh: "https://semi.design/zh-CN/", repo: "https://github.com/DouyinFE/semi-design",
    colors: [c(P, "#0064FA"), c(TX, "#1C1F23"), c(BG, "#FFFFFF"), c(SF, "#F9F9F9")],
    source: "@douyinfe/semi-theme-default@2.105.0 scss/global.scss + _palette.scss",
    learn: {
      zh: "官方的 Figma 设计稿一键转代码；飞书、抖音创作者、剪映、火山引擎几套品牌主题，主题在 DSM 里配。",
      en: "Official one-click Figma-to-code, plus brand themes for Feishu, Douyin Creator, CapCut and Volcengine, configured in its DSM theme builder.",
    },
  },
  {
    group: "platform", name: "Material Design 3", org: { zh: "Google", en: "Google" },
    docs: "https://m3.material.io/", repo: "https://github.com/material-foundation/material-color-utilities",
    colors: [c(P, "#6750A4"), c(TX, "#1D1B20"), c(BG, "#FEF7FF"), c(SG, "#7D5260")],
    source: "@material/web@2.5.0 tokens/versions/latest/sass/_md-sys-color.scss（基准配色）",
    learn: {
      zh: "动态配色：从一个源颜色（壁纸或内容）算出整套配色；动效改成了弹簧物理，不再只给缓动曲线。",
      en: "Dynamic color builds a whole scheme from one source color (a wallpaper or the content), and motion is now spring physics rather than easing curves.",
    },
  },
  {
    group: "platform", name: "Fluent 2", org: { zh: "微软", en: "Microsoft" },
    docs: "https://fluent2.microsoft.design/", repo: "https://github.com/microsoft/fluentui",
    colors: [c(P, "#0F6CBD"), c(TX, "#242424"), c(BG, "#FFFFFF"), c(SF, "#FAFAFA")],
    source: "@fluentui/tokens@1.0.0-alpha.24 lib/alias/lightColor.js + lib/global/brandColors.js",
    learn: {
      zh: "一套设计同时给网页、Windows、iOS、Android，看它怎么在各平台的习惯之间取舍。",
      en: "One system for the web, Windows, iOS and Android. Worth reading for how it trades off each platform's conventions.",
    },
  },
  {
    group: "platform", name: "Human Interface Guidelines", org: { zh: "Apple", en: "Apple" },
    docs: "https://developer.apple.com/design/human-interface-guidelines/", docsZh: "https://developer.apple.com/cn/design/human-interface-guidelines/",
    colors: [c(P, "#0088FF"), c({ zh: "次要文字", en: "Secondary text" }, "#8E8E93"), c(BG, "#F2F2F7")],
    source: "developer.apple.com/design/human-interface-guidelines/color（Specifications 表，RGB 换成 hex）",
    learn: {
      zh: "按平台写：iOS、macOS、visionOS 各有一篇，每页再写各平台的差别。讲的是为什么这样做，不只是长什么样。",
      en: "Written per platform (iOS, macOS, visionOS and more), with platform notes on every page. It explains why, not only what things look like.",
    },
  },
  {
    group: "enterprise", name: "Carbon", org: { zh: "IBM", en: "IBM" },
    docs: "https://www.carbondesignsystem.com/", repo: "https://github.com/carbon-design-system/carbon",
    colors: [c(P, "#0F62FE"), c(TX, "#161616"), c(BG, "#FFFFFF"), c(SF, "#F4F4F4")],
    source: "@carbon/themes@11.85.0 js/generated/themes/white.js",
    learn: {
      zh: "2x 网格；数据可视化写得最全：图表种类、结构、坐标轴和标签、配色、图例、仪表盘。",
      en: "The 2x grid, and the most complete data-visualization guidance around: chart types, anatomy, axes and labels, palettes, legends and dashboards.",
    },
  },
  {
    group: "enterprise", name: "Spectrum", org: { zh: "Adobe", en: "Adobe" },
    docs: "https://spectrum.adobe.com/", repo: "https://github.com/adobe/react-spectrum",
    colors: [c(P, "#3B63FB"), c(TX, "#292929"), c(BG, "#FFFFFF"), c(SF, "#F8F8F8")],
    source: "@adobe/spectrum-tokens@15.7.0 src/color-aliases.json + color-palette.json（亮色）",
    learn: {
      zh: "React Aria 把无障碍的交互逻辑单独做成库：自带 30 多种语言的文案，支持多种日历和数字写法、从右往左排版。",
      en: "React Aria ships the accessible interaction logic as its own library, with strings in 30-plus languages, many calendar and numbering systems, and right-to-left layout.",
    },
  },
  {
    group: "enterprise", name: "Atlassian Design System", org: { zh: "Atlassian", en: "Atlassian" },
    docs: "https://atlassian.design/",
    colors: [c(P, "#1868DB"), c(TX, "#292A2E"), c(BG, "#FFFFFF"), c(SF, "#F8F8F8")],
    source: "@atlaskit/tokens@20.11.0 dist/esm/artifacts/themes/atlassian-light.js",
    learn: {
      zh: "令牌从概念讲到代码、设计稿和迁移；内容设计一节写了语气、包容的用词、日期时间的写法、提示信息怎么写。",
      en: "Tokens explained from concept to code, design files and migration, and a content section on voice and tone, inclusive language, dates and times, and writing messages.",
    },
  },
  {
    group: "enterprise", name: "SAP Fiori", org: { zh: "SAP", en: "SAP" },
    docs: "https://www.sap.com/design-system/fiori-design-web", repo: "https://github.com/UI5/webcomponents",
    colors: [c(P, "#0070F2"), c(TX, "#131E29"), c(BG, "#F5F6F7"), c(SF, "#FFFFFF")],
    source: "@sap-theming/theming-base-content@11.36.5 sap_horizon/css_variables.css",
    learn: {
      zh: "页面类型（floorplan）：列表报表、对象页、概览页、分析列表页，并写明什么时候用哪一种。",
      en: "Floorplans (list report, object page, overview page, analytical list page) with guidance on when to use which.",
    },
  },
  {
    group: "enterprise", name: "Lightning Design System 2", org: { zh: "Salesforce", en: "Salesforce" },
    docs: "https://www.lightningdesignsystem.com/2e1ef8501/p/85bd85-lightning-design-system-2",
    colors: [c(P, "#066AFE"), c(TX, "#2E2E2E"), c(BG, "#FFFFFF"), c(SG, "#032D60")],
    source: "lightningdesignsystem.com styling hook index（Light Mode 一栏）",
    learn: {
      zh: "「设计令牌」这个词就出自 Salesforce。第二版把令牌叫 global styling hooks，就是一组 CSS 变量。",
      en: "The term \"design tokens\" was coined at Salesforce. Version 2 calls them global styling hooks: plain CSS custom properties.",
    },
  },
  {
    group: "product", name: "Polaris", org: { zh: "Shopify", en: "Shopify" },
    docs: "https://shopify.dev/docs/apps/design",
    colors: [c(P, "#303030"), c(BG, "#F1F1F1"), c(SF, "#FFFFFF"), c(SG, "#8051FF")],
    source: "@shopify/polaris-tokens@9.4.2 dist/css/styles.css（和现在 polaris.js 里的回退值一致）",
    learn: {
      zh: "给商家后台应用写的设计规范，包括文案怎么写。现在的 Polaris 是 Web Components。",
      en: "Design guidelines for apps in the merchant admin, including how to write the copy. Polaris is now built as web components.",
    },
  },
  {
    group: "product", name: "Primer", org: { zh: "GitHub", en: "GitHub" },
    docs: "https://primer.style/", repo: "https://github.com/primer/react",
    colors: [c(P, "#1F883D"), c(TX, "#1F2328"), c(BG, "#FFFFFF"), c(SG, "#0969DA")],
    source: "@primer/primitives@11.10.0 dist/css/functional/themes/light.css",
    learn: {
      zh: "每个组件单独有一页「无障碍」；图标库 Octicons 也在这里。",
      en: "Every component has its own accessibility page, and the Octicons icon set lives here too.",
    },
  },
  {
    group: "product", name: "Geist", org: { zh: "Vercel", en: "Vercel" },
    docs: "https://vercel.com/geist/introduction", repo: "https://github.com/vercel/geist-font",
    colors: [c(P, "#0070F7"), c(TX, "#171717"), c(BG, "#FFFFFF"), c(SF, "#FAFAFA")],
    source: "vercel.com/geist/colors 页面的 CSS（hsl 换成 hex）",
    learn: {
      zh: "每种颜色 10 档，每档只有一个用途：100–300 是背景，400–600 是边框，700–800 是高对比的底，900–1000 是文字和图标。字体 Geist Sans / Mono 开源。",
      en: "Every color has 10 steps, each with one job: 100–300 backgrounds, 400–600 borders, 700–800 high-contrast fills, 900–1000 text and icons. The Geist Sans and Mono fonts are open source.",
    },
  },
  {
    group: "product", name: "Base Web", org: { zh: "Uber", en: "Uber" },
    docs: "https://baseweb.design/", repo: "https://github.com/uber/baseweb",
    colors: [c(P, "#000000"), c(BG, "#FFFFFF"), c(SF, "#F3F3F3"), c(SG, "#276EF1")],
    source: "baseui@18.2.0 themes/light-theme/color-semantic-tokens.js",
    learn: {
      zh: "Uber 的 Base 设计语言的 React 实现：黑白为主，蓝色只做强调，和我们靠墨色强调的思路接近。",
      en: "The React implementation of Uber's Base design language: black and white first, blue only as an accent, close to our own ink-for-emphasis approach.",
    },
  },
  {
    group: "product", name: "Helios", org: { zh: "HashiCorp", en: "HashiCorp" },
    docs: "https://helios.hashicorp.design/", repo: "https://github.com/hashicorp/design-system",
    colors: [c(P, "#1060FF"), c(TX, "#3B3D45"), c(BG, "#FFFFFF"), c(SG, "#A737FF")],
    source: "@hashicorp/design-system-tokens@6.0.1 dist/products/css/tokens.css",
    learn: {
      zh: "文档按版本保存；基础、文案、模式、工具各成一节，和组件并列。",
      en: "Versioned docs, with foundations, content, patterns and tooling as sections alongside the components.",
    },
  },
  {
    group: "product", name: "LeafyGreen", org: { zh: "MongoDB", en: "MongoDB" },
    docs: "https://www.mongodb.design/", repo: "https://github.com/mongodb/leafygreen-ui",
    colors: [c(P, "#00684A"), c(TX, "#001E2B"), c(BG, "#FFFFFF"), c(SG, "#00ED64")],
    source: "@leafygreen-ui/palette@5.0.3 src/palette.less + @leafygreen-ui/button@25.2.2",
    learn: {
      zh: "文案规范（语法、语气）；还有没权限、功能下线、功能限制提示这类产品场景的模式。",
      en: "Copy guidance (grammar, voice and tone) and patterns for product moments such as access restrictions, end of life and feature walls.",
    },
  },
  {
    group: "product", name: "Kumo", org: { zh: "Cloudflare", en: "Cloudflare" },
    docs: "https://kumo-ui.com/", repo: "https://github.com/cloudflare/kumo",
    colors: [c(P, "#056DFF"), c(TX, "#171717"), c(BG, "#FFFFFF"), c(SG, "#F6821F")],
    source: "@cloudflare/kumo@2.18.0 dist/styles/theme-kumo.css（oklch 换成 hex）",
    learn: {
      zh: "小小东 UI 的 React 版就 fork 自它。颜色只用用途名，靠 light-dark() 切亮暗；lint 规则不许直接写原始颜色。",
      en: "XXD UI's React version is forked from it. Colors are role names that switch light and dark with light-dark(), and a lint rule rejects raw colors.",
    },
  },
  {
    group: "public", name: "GOV.UK Design System", org: { zh: "英国政府数字服务局", en: "UK Government Digital Service" },
    docs: "https://design-system.service.gov.uk/", repo: "https://github.com/alphagov/govuk-frontend",
    colors: [c(P, "#1D70B8"), c(TX, "#0B0C0C"), c(BG, "#FFFFFF"), c({ zh: "焦点", en: "Focus" }, "#FFDD00")],
    source: "govuk-frontend@6.6.0 dist/govuk/settings/_colours-functional.scss",
    learn: {
      zh: "每个组件写了做过哪些用户研究；出错提示要用平白的话写。给所有人用的服务，标准最严。",
      en: "Each component records the user research behind it, and error messages must be in plain English. A service for everyone, held to the strictest bar.",
    },
  },
];

export const STYLE_REFS = [
  {
    name: "awesome-design-md",
    href: "https://github.com/VoltAgent/awesome-design-md",
    desc: {
      zh: "80 多个品牌官网写成的 DESIGN.md：颜色、字体、组件、该做和不该做，给 AI 编程工具照着做页面。MIT 许可。",
      en: "80-plus brand websites written up as DESIGN.md files (colors, type, components, dos and don'ts) for AI coding tools to follow. MIT licensed.",
    },
  },
];
