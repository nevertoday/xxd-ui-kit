import { House, SlidersHorizontal } from "@xxd/icons/each";
import type { TabBarItem } from "@xxd/mini";

export const TABS: TabBarItem[] = [
  { value: "index", label: "首页", icon: House, url: "/pages/index/index" },
  { value: "settings", label: "设置", icon: SlidersHorizontal, url: "/pages/settings/index" },
];
