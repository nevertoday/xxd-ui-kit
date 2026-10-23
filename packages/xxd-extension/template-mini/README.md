# __APP_NAME__

用 [小小东 UI 小程序版（@xxd/mini）](https://ui.xiaoxiaodong.ai/mini/) 搭的微信小程序，基于 Taro 4.2 + React 18。

## 跑起来

```bash
pnpm install          # 或 npm install
pnpm dev:weapp        # 边改边编，产物在 dist/
```

打开微信开发者工具 →「导入项目」→ 选这个目录（`project.config.json` 里 `miniprogramRoot` 是 `dist`）。AppID 先用测试号，正式的在 `project.config.json` 里换。

## 约定

- 组件从 `@xxd/mini` 引：`Button`、`Cell`、`Sheet`、`Dialog`……每页的根是 `XxdPage`，`app.tsx` 包一层 `XxdProvider`。
- 自己写样式只用令牌：`var(--ink)`、`var(--line)`、`var(--space-4)`、`var(--r-md)`。不写死颜色、圆角、阴影。
- 尺寸写 px，不换算成 rpx（`config/index.ts` 已经关了 pxtransform）。
- 改完跑 `xxd-ui doctor .` 体检。

`vendor/` 里是打好的 `@xxd/mini`、`@xxd/tokens`、`@xxd/icons`；升级时在 xxd-ui-kit 里重新 `xxd-ui new-mini` 拿新版，或者换成 npm 上的版本。
