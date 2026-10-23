import { defineConfig } from "@tarojs/cli";
import { resolve } from "node:path";

// 尺寸用 px、不换算成 rpx（docs/maintainers/MINIPROGRAM-PLAN.md §13 第 2 条）：和网页版是同一组数字，1px 线不发虚
export default defineConfig<"webpack5">(async () => ({
  projectName: "xxd-mini-demo",
  designWidth: 375,
  deviceRatio: { 375: 1, 750: 0.5 },
  sourceRoot: "src",
  outputRoot: process.env.TARO_ENV === "h5" ? "dist-h5" : "dist",
  framework: "react",
  plugins: ["@xxd/mini/taro-plugin"],
  // 跟随系统暗色的颜色表（app.config.ts 的 themeLocation），从 @xxd/mini 拷过来
  copy: { patterns: process.env.TARO_ENV === "h5" ? [] : [{ from: "node_modules/@xxd/mini/styles/theme.json", to: "dist/theme.json" }], options: {} },
  compiler: { type: "webpack5", prebundle: { enable: false } },
  cache: { enable: false },
  mini: {
    // 工作区里 @xxd/mini 是软链接，webpack 顺着真实路径找依赖，找不到 Taro 的平台包：再到这个项目的 node_modules 里找一遍
    // （用户从 npm 装的 @xxd/mini 在项目的 node_modules 里，不需要这一条）
    webpackChain(chain) {
      chain.resolve.modules.add("node_modules").add(resolve(process.cwd(), "node_modules"));
    },
    // 每个组件的样式自成一块、互不依赖顺序：不用提醒 CSS 的引入顺序
    miniCssExtractPluginOption: { ignoreOrder: true },
    postcss: {
      pxtransform: { enable: false, config: {} },
      cssModules: { enable: false, config: {} },
    },
  },
  h5: {
    webpackChain(chain) {
      chain.resolve.modules.add("node_modules").add(resolve(process.cwd(), "node_modules"));
    },
    publicPath: "/mini/",
    staticDirectory: "static",
    router: { mode: "hash" },
    output: { filename: "js/[name].[hash:8].js", chunkFilename: "js/[name].[chunkhash:8].js" },
    miniCssExtractPluginOption: { ignoreOrder: true, filename: "css/[name].[hash].css", chunkFilename: "css/[name].[chunkhash].css" },
    postcss: {
      pxtransform: { enable: false, config: {} },
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false, config: {} },
    },
  },
}));
