// @xxd/react —— 小小东 React 组件入口。
// 组件来自 packages/kumo（Kumo 换皮版，内部包名保持 @cloudflare/kumo 以便合并上游）。
// 消费者只认 @xxd/react：
//   import { Button, Dialog, DialogActions } from "@xxd/react";
//   import "@xxd/react/styles.css";   // 需要 Tailwind v4：先 @import "tailwindcss"
//   import "@xxd/react/standalone.css"; // 不用 Tailwind 时
//   import "@xxd/react/xxd.css";        // 小小东独有组件（Dock、Sheet、Settings…）用 @xxd/css 的样式
// Kumo 的导出逐个列在 kumo-exports.ts（生成的；不含 Cloudflare 的品牌组件）
export * from "./kumo-exports";
export { DialogActions } from "./dialog-actions";
export { XxdAppearanceProvider, useXxdAppearance } from "./appearance";
export { XxdLocaleProvider, useXxdLocale, resolveLocale, KUMO_TRANSLATIONS, type XxdLocale, type XxdStrings } from "./locale";
export {
  Dock,
  SheetHost,
  Sheet,
  Settings,
  SettingsGroup,
  SettingsRow,
  Chip,
  Search,
  Segmented,
  Rail,
  Swatches,
  AppearanceSettings,
  CardGrid,
  Card,
  Prose,
  StatusLine,
  ConfirmTwiceButton,
  DropTarget,
  DropZone,
  AccountCard,
  Gauge,
  type GaugeProps,
} from "./xxd";
export { Icon, IconContext, createIcon, icons, ICON_NAMES } from "@xxd/icons/react";
export { ACCENT_PRESETS, type XxdSettings } from "@xxd/tokens";
