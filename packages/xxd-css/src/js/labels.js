// 外观设置的文案：原生（mountAppearance）和 React（AppearanceSettings）共用这一份，两边叫法一样。
export const APPEARANCE_LABELS = {
  "zh-CN": {
    group: "外观", theme: "主题", light: "亮", dark: "暗", system: "跟随系统",
    corners: "圆角", cornersDesc: "关闭时为直角", accent: "主色", accentDesc: "按钮、选中和焦点使用这个颜色",
    density: "密度", comfortable: "标准", compact: "紧凑", finish: "按钮质感", flat: "平面", material: "立体", language: "语言", ink: "墨色",
  },
  "zh-Hant": {
    group: "外觀", theme: "主題", light: "亮", dark: "暗", system: "跟隨系統",
    corners: "圓角", cornersDesc: "關閉時為直角", accent: "主色", accentDesc: "按鈕、選中和焦點使用這個顏色",
    density: "密度", comfortable: "標準", compact: "緊湊", finish: "按鈕質感", flat: "平面", material: "立體", language: "語言", ink: "墨色",
  },
  en: {
    group: "Appearance", theme: "Theme", light: "Light", dark: "Dark", system: "System",
    corners: "Rounded corners", cornersDesc: "Off keeps every corner square", accent: "Accent", accentDesc: "Used for buttons, selection and focus",
    density: "Density", comfortable: "Comfortable", compact: "Compact", finish: "Button style", flat: "Flat", material: "Material", language: "Language", ink: "Ink",
  },
};

// 操作反馈的文案（FEEDBACK-ALIGN-PLAN D175–D177）：网页版（i18n.js）、React（@xxd/react 的 locale）共用。
export const FEEDBACK_LABELS = {
  "zh-CN": { retry: "重试", done: "已完成", failed: "没有完成，可以重试", saving: "正在保存…", saved: "已保存", notSaved: "没有保存，已退回原来的设置", autoSave: "改动自动保存", copyFailed: "复制失败" },
  "zh-Hant": { retry: "重試", done: "已完成", failed: "沒有完成，可以重試", saving: "正在儲存…", saved: "已儲存", notSaved: "沒有儲存，已退回原本的設定", autoSave: "變更會自動儲存", copyFailed: "複製失敗" },
  en: { retry: "Retry", done: "Done", failed: "That didn’t finish. You can retry.", saving: "Saving…", saved: "Saved", notSaved: "Not saved. The setting is back to what it was.", autoSave: "Changes save automatically", copyFailed: "Couldn’t copy" },
};
