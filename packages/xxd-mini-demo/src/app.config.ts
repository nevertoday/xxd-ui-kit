export default defineAppConfig({
  pages: ["pages/index/index", "pages/component/index", "pages/todo/index", "pages/settings/index"],
  // 跟随系统暗色：颜色写在 theme.json（@xxd/mini/theme.json，构建时拷进来）
  darkmode: true,
  themeLocation: "theme.json",
  window: {
    navigationBarTitleText: "小小东 UI",
    navigationBarBackgroundColor: "@navBg",
    navigationBarTextStyle: "@navText",
    backgroundColor: "@bg",
    backgroundTextStyle: "@bgText",
  },
  // 三个主页面用小程序自带的标签栏（custom：样子是 @xxd/mini 的 TabBarHost，见 src/custom-tab-bar）。切页不销毁页面
  tabBar: {
    custom: true,
    color: "@tabColor",
    selectedColor: "@tabSelected",
    backgroundColor: "@tabBg",
    borderStyle: "@tabBorder",
    list: [
      { pagePath: "pages/index/index", text: "组件" },
      { pagePath: "pages/todo/index", text: "待办" },
      { pagePath: "pages/settings/index", text: "外观" },
    ],
  },
  lazyCodeLoading: "requiredComponents",
});
