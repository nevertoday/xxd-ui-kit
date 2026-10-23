// 小程序自带的自定义标签栏（app.config 的 tabBar.custom）：切页是 switchTab，页面不销毁。
// 它不在 App 下面：外观由 TabBarHost 自己读（跟着系统亮暗和设置页的修改变）。
import { TabBarHost } from "@xxd/mini";
import "@xxd/mini/tokens.css";
import { TABS } from "../tabs";

export default function CustomTabBar() {
  return <TabBarHost items={TABS} />;
}
