export default defineAppConfig({
  pages: ["pages/index/index", "pages/settings/index"],
  // 跟随系统暗色：导航栏、窗口的颜色写在 theme.json（构建时从 @xxd/mini 拷进来）
  darkmode: true,
  themeLocation: "theme.json",
  window: {
    navigationBarTitleText: "__APP_NAME__",
    navigationBarBackgroundColor: "@navBg",
    navigationBarTextStyle: "@navText",
    backgroundColor: "@bg",
    backgroundTextStyle: "@bgText",
  },
  // 底部标签栏：小程序自带的，样子是 @xxd/mini 的（src/custom-tab-bar）。页面写 <XxdPage tabBar={TABS}>
  tabBar: {
    custom: true,
    color: "@tabColor",
    selectedColor: "@tabSelected",
    backgroundColor: "@tabBg",
    borderStyle: "@tabBorder",
    list: [
      { pagePath: "pages/index/index", text: "首页" },
      { pagePath: "pages/settings/index", text: "设置" },
    ],
  },
  lazyCodeLoading: "requiredComponents",
});
