# 文档站

## 小小东展示站（`packages/xxd-site`）

线上：<https://ui.xiaoxiaodong.ai>（Cloudflare Workers 静态资源，配置在 `packages/xxd-site/wrangler.jsonc`，Worker 名 `xxd-ui`）。

```bash
pnpm --filter @xxd/site dev            # 本机 http://localhost:4400
pnpm --filter @xxd/site run release    # 构建并部署（先 wrangler login）
```

中文在根路径，英文在 `/en/` 下（91 页，一一对应）。页面正文在 `src/views/*.astro`，中英共用，语言看路径（`src/i18n/index.js`）；
`src/pages/` 和 `src/pages/en/` 下都只是一行入口。界面文字在 `src/i18n/index.js`；组件和模式的英文在 `packages/xxd-css/registry.en.js` / `patterns.en.js`；
模板、原则、React 演示的英文在 `src/data/*.en.js`、`src/react/demos.en.tsx`。加新页时两边都要加（测试会检查）。

推送 GitHub 不会自动部署；要自动部署的话，在仓库 Secrets 里加 `CLOUDFLARE_API_TOKEN`，再在 CI 里加一步 `release`。

## Kumo 原版文档站（`packages/kumo-docs-astro`）

```bash
pnpm install
pnpm --filter @cloudflare/kumo build            # 文档站读组件库构建产物
pnpm --filter @cloudflare/kumo-docs-astro dev   # http://localhost:4321
```

小小东的页面：`/xxd`（原则）、`/xxd/native`（原生组件，从 `packages/xxd-css/registry.json` 生成）、
`/xxd/showcase`（React 换皮总览）、`/xxd/extension`（插件套件）。右上角切换直角 / 圆角和主色，最右边切换主题。

### 部署

这个站一般不需要上线（看小小东的效果用上面的展示站）。要放到线上时：

1. 把 `packages/kumo-docs-astro/wrangler.jsonc` 里 Cloudflare（上游）的账号、路由换成你自己的；
2. `pnpm --filter @cloudflare/kumo-docs-astro build` 后用 wrangler 部署到你的账号；
3. 想先只给自己看，可以在 Cloudflare Zero Trust 里给这个域名加 **Access** 策略，只允许你的邮箱登录。

Kumo 原版文档站没有部署过。
