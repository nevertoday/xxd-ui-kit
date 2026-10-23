# XXD UI Kit

[中文](README.md) · **English**

[![CI](https://github.com/nevertoday/xxd-ui-kit/actions/workflows/xxd.yml/badge.svg)](https://github.com/nevertoday/xxd-ui-kit/actions/workflows/xxd.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)

A quiet, restrained set of UI components: square corners, black, white and gray, hairlines, system fonts.

- Plain web pages: one CSS file and one JS file. No React needed.
- Chrome extensions: one command sets up a side panel and a settings page, in Simplified Chinese, Traditional Chinese and English.
- React projects: a matching set of components.

**See every component: <https://ui.xiaoxiaodong.ai/en/>**

![The same extension side panel four ways: light and dark, square and rounded](docs/assets/overview.png)

> Early days (0.x). Not on npm yet, and versions may break things (see the [changelog](CHANGELOG.en.md)).

## Is it for you?

Yes if you build Chrome extensions, small sites or tool pages, and like the look in the screenshot above.

Not if you need:

- Big admin apps, complex forms and data tables: use [Ant Design](https://ant.design).
- Component source copied into your project to edit freely: use [shadcn/ui](https://ui.shadcn.com).
- A completely different style: you can change the accent color, corners and density, but not the style itself.

## Try it (nothing to install)

Paste this into a new HTML file and open it in a browser:

```html
<script src="https://ui.xiaoxiaodong.ai/v/0.1.0/boot.js" data-key="my-site-ui"></script>
<link rel="stylesheet" href="https://ui.xiaoxiaodong.ai/v/0.1.0/xxd.css" />
<script src="https://ui.xiaoxiaodong.ai/v/0.1.0/icons.js"></script>
<script src="https://ui.xiaoxiaodong.ai/v/0.1.0/xxd.js"></script>

<body class="xxd-page">
  <button class="xxd-btn" data-variant="primary">Save</button>
</body>
```

Every component on the showcase has markup you can copy.

## Using it for real: install once

You need Node 24.12+ and pnpm.

```bash
git clone https://github.com/nevertoday/xxd-ui-kit.git
cd xxd-ui-kit
pnpm install
pnpm xxd:build   # takes a few minutes the first time
pnpm xxd link    # installs the xxd-ui command so it works from any folder
```

Then pick what you're doing:

### Make a Chrome extension

```bash
xxd-ui new ./today --name 今日待办 --name-en Today --slug today
```

Open `chrome://extensions`, turn on Developer mode, click "Load unpacked" and pick the `today` folder. It works right away.

Add more with flags: `--popup` for the small window behind the toolbar icon, `--content "https://example.com/*"` to put UI on web pages, `--account` for sign-in and membership pages.
More in the [extension kit](docs/en/EXTENSION-KIT.md).

### Add it to an existing page or extension

```bash
xxd-ui init ./my-site
```

It copies the component files into `my-site` and tells you which lines to add to `<head>`.

Your site already has its own color variables and shouldn't change: see [existing sites](docs/en/existing-site.md).
Using a bundler like Vite: see [Get started](https://ui.xiaoxiaodong.ai/en/start) on the showcase.

### Use it in React

```bash
xxd-ui pack ./packs          # in xxd-ui-kit: build the packages
npm install ./packs/*.tgz    # in your project
```

```tsx
import { Button } from "@xxd/react";
import "@xxd/react/standalone.css";
```

Tailwind, appearance and language settings: see [Get started](https://ui.xiaoxiaodong.ai/en/start).

### Make a WeChat mini program

```bash
xxd-ui new-mini ./today-mini --name "Today" --slug today-mini
cd ./today-mini && pnpm install && pnpm dev:weapp
```

Open WeChat DevTools and import the `today-mini` folder. It's Taro 4.2 + React with components from `@xxd/mini`, looking the same as the web kit.
More on the showcase's [Mini program kit](https://ui.xiaoxiaodong.ai/en/miniprogram) page.

## When components get updated

```bash
xxd-ui status          # which projects are on an old version
xxd-ui sync --all      # update them all
xxd-ui doctor ./today  # check for typos, hard-coded colors and extension config problems
```

## Finding components and icons

```bash
xxd-ui doc dialog   # how to write one component (English or Chinese name)
xxd-ui icon delete  # find an icon among 500+
xxd-ui help         # every command
```

Or search the [showcase](https://ui.xiaoxiaodong.ai/en/).

## For designers

You can design with it without opening the code: [For designers](https://ui.xiaoxiaodong.ai/en/designers) covers what to read first, how to name tokens in a spec, which widths to design at and what to hand over. Common component pages have a Spec section (sizes, padding and type, each named by its token and measured from the real CSS), and all icons can be downloaded as SVG. There is no Figma library; the site is the source.

## Contributing

Start with [CONTRIBUTING](CONTRIBUTING.en.md): what's welcome, where to change things, how to run the tests.
Why it looks the way it does: [design principles](https://ui.xiaoxiaodong.ai/en/principles). Found a security problem? Report it privately as described in [SECURITY.md](SECURITY.md).

## Kumo

The React components come from Cloudflare's open-source component library [Kumo](https://github.com/cloudflare/kumo) (MIT), restyled; everything else is this project's own.
This project is not affiliated with or endorsed by Cloudflare. The repository keeps Kumo's commit history, which is why Kumo's authors top GitHub's contributor list.

## License

MIT, see [LICENSE](LICENSE); code from Kumo is under [LICENSE-KUMO](LICENSE-KUMO).
