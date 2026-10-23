// xxd:!popup
// 点工具栏图标打开侧边栏。
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
// /xxd:!popup
// xxd:popup
// 有 popup 时点工具栏图标打开 popup；popup 里的按钮再打开侧边栏。
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
// /xxd:popup

// 工具栏图标上的徽章用令牌的颜色（tokens.mjs 是 vendor/xxd 里的纯数据，service worker 也能用）：
//   import { setBadge } from "./vendor/xxd/tokens.mjs";  setBadge("3", "danger");
