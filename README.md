# 小小东 UI Kit

**中文** · [English](README.en.md)

[![CI](https://github.com/nevertoday/xxd-ui-kit/actions/workflows/xxd.yml/badge.svg)](https://github.com/nevertoday/xxd-ui-kit/actions/workflows/xxd.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)

一套安静、克制的界面组件：直角、黑白灰、细线、系统字体。

- 普通网页：引一个 CSS、一个 JS 就能用，不用装 React。
- Chrome 插件：一条命令建好侧边栏和设置页，中文、繁体、英文都有。
- React 项目：也有一套同样样子的组件。

**看全部组件：<https://ui.xiaoxiaodong.ai>**

![同一个插件侧边栏的四种样子：亮色、暗色，直角、圆角](docs/assets/overview.png)

> 还在早期（0.x），没有发布到 npm，版本之间可能有不兼容的改动（见[更新记录](CHANGELOG.md)）。

## 适不适合你

适合：做 Chrome 插件；做小网站、工具页；喜欢上面截图这种样子。

不适合：

- 大型后台、复杂表单和表格：用 [Ant Design](https://ant.design)。
- 想把组件源码拷进项目随便改：用 [shadcn/ui](https://ui.shadcn.com)。
- 想要完全不同的风格：这里能换主色、圆角、疏密，风格本身不变。

## 先试一下（不用装）

新建一个 HTML 文件，贴进去，用浏览器打开：

```html
<script src="https://ui.xiaoxiaodong.ai/v/0.1.0/boot.js" data-key="my-site-ui"></script>
<link rel="stylesheet" href="https://ui.xiaoxiaodong.ai/v/0.1.0/xxd.css" />
<script src="https://ui.xiaoxiaodong.ai/v/0.1.0/icons.js"></script>
<script src="https://ui.xiaoxiaodong.ai/v/0.1.0/xxd.js"></script>

<body class="xxd-page">
  <button class="xxd-btn" data-variant="primary">保存</button>
</body>
```

每个组件怎么写，在展示站上点开就能复制。

## 正式用：先装一次

需要 Node 24.12 以上和 pnpm。

```bash
git clone https://github.com/nevertoday/xxd-ui-kit.git
cd xxd-ui-kit
pnpm install
pnpm xxd:build   # 第一次要几分钟
pnpm xxd link    # 装好命令 xxd-ui，之后在哪个目录都能用
```

然后按你要做的事，选一条（插件、已有网页、React、微信小程序）：

### 做一个 Chrome 插件

```bash
xxd-ui new ./today --name 今日待办 --name-en Today --slug today
```

打开 `chrome://extensions`，开「开发者模式」，点「加载已解压的扩展程序」，选 `today` 文件夹，就能用了。

要更多就加参数：`--popup` 加点图标弹出的小窗，`--content "https://example.com/*"` 往网页里放界面，`--account` 加登录和会员页。
详细写法见[插件套件](docs/EXTENSION-KIT.md)。

### 给已有的网页或插件用

```bash
xxd-ui init ./my-site
```

它把组件文件拷进 `my-site`，再告诉你往 `<head>` 里加哪几行。

网站已经有自己的颜色变量、不想变样子：看[已有网站怎么接入](docs/existing-site.md)。
用 Vite 这类打包工具：看展示站的[开始使用](https://ui.xiaoxiaodong.ai/start)。

### 在 React 里用

```bash
xxd-ui pack ./packs          # 在 xxd-ui-kit 里打包
npm install ./packs/*.tgz    # 在你的项目里安装
```

```tsx
import { Button } from "@xxd/react";
import "@xxd/react/standalone.css";
```

用 Tailwind、要加外观和语言设置：看[开始使用](https://ui.xiaoxiaodong.ai/start)。

### 做一个微信小程序

```bash
xxd-ui new-mini ./today-mini --name 今日待办 --slug today-mini
cd ./today-mini && pnpm install && pnpm dev:weapp
```

打开微信开发者工具，「导入项目」选 `today-mini` 文件夹。基于 Taro 4.2 + React，组件来自 `@xxd/mini`，样子和网页版一样。
详细见展示站的[小程序版](https://ui.xiaoxiaodong.ai/miniprogram)。

## 以后组件更新了

```bash
xxd-ui status        # 哪些项目用的是旧版
xxd-ui sync --all    # 全部更新
xxd-ui doctor ./today  # 检查有没有写错、写死的颜色和插件配置问题
```

## 找组件、找图标

```bash
xxd-ui doc 对话框   # 一个组件怎么写（中文名、英文名都行）
xxd-ui icon 删除    # 找图标，500 多个，可以用中文搜
xxd-ui help         # 全部命令
```

或者直接在[展示站](https://ui.xiaoxiaodong.ai)上搜。

## 给设计师

不打开代码也能用它出稿：[设计师从这里开始](https://ui.xiaoxiaodong.ai/designers)写了先看哪几页、令牌怎么标、按多宽出稿、交给开发时给什么。常用组件页有「规格」（尺寸、内边距、字号都标出是哪个令牌，从真的 CSS 量出来）；图标可以一次下载全部 SVG。没有 Figma 库，展示站就是来源。

## 想参与

先看[参与指南](CONTRIBUTING.md)：欢迎什么、改哪里、怎么跑测试都在里面。
样子为什么是这样，看[设计原则](docs/DESIGN-PRINCIPLES.md)。发现安全问题，按 [SECURITY.md](SECURITY.md) 私下告诉我们。

## 和 Kumo 的关系

React 组件来自 Cloudflare 的开源组件库 [Kumo](https://github.com/cloudflare/kumo)（MIT），换上了小小东的样子；其他部分是这个项目自己写的。
本项目和 Cloudflare 没有关系，也没有得到它的认可。因为保留了 Kumo 的提交历史，GitHub 贡献者列表里排在前面的是 Kumo 的作者。

## 许可

MIT，见 [LICENSE](LICENSE)；来自 Kumo 的代码见 [LICENSE-KUMO](LICENSE-KUMO)。
