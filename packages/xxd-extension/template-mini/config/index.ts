import { defineConfig } from "@tarojs/cli";

// @xxd/mini 的约定（xxd-ui doctor 会查）：
//   - plugins 里有 @xxd/mini/taro-plugin（读屏属性）
//   - px 不换算成 rpx：和网页版是同一组数字，1px 线不发虚
//   - 跟随系统暗色的颜色表 theme.json 从 @xxd/mini 拷过来
export default defineConfig<"webpack5">(async () => ({
  projectName: "__SLUG__",
  designWidth: 375,
  deviceRatio: { 375: 1, 750: 0.5 },
  sourceRoot: "src",
  outputRoot: process.env.TARO_ENV === "h5" ? "dist-h5" : "dist",
  framework: "react",
  plugins: ["@xxd/mini/taro-plugin"],
  copy: { patterns: process.env.TARO_ENV === "h5" ? [] : [{ from: "node_modules/@xxd/mini/styles/theme.json", to: "dist/theme.json" }], options: {} },
  compiler: { type: "webpack5", prebundle: { enable: false } },
  cache: { enable: false },
  mini: {
    miniCssExtractPluginOption: { ignoreOrder: true },
    postcss: {
      pxtransform: { enable: false, config: {} },
      cssModules: { enable: false, config: {} },
    },
  },
  h5: {
    publicPath: "/",
    staticDirectory: "static",
    router: { mode: "hash" },
    miniCssExtractPluginOption: { ignoreOrder: true },
    postcss: {
      pxtransform: { enable: false, config: {} },
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false, config: {} },
    },
  },
}));
