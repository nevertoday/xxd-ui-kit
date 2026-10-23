// 两种实现对照（/tools/parity，设计师评审 V1）覆盖的组件：audit 的「对照」一项逐项比过，React 和 HTML 一样。
// 组件页在 React 名字旁边标「和 HTML 一致」；没在这里的组件，React 版标「还没进对照」。
// 键是注册表里的组件名，值是对照页上的 data-pair（一个组件可以有几对）。
export const PARITY = {
  Button: ["button-primary", "button-secondary", "button-ghost", "button-outline", "button-danger", "button-sm", "button-primary-disabled", "button-secondary-disabled"],
  Field: ["input", "input-disabled"],
  Select: ["select"],
  Checkbox: ["checkbox", "checkbox-off", "checkbox-disabled"],
  Switch: ["switch", "switch-off", "switch-disabled"],
  Radio: ["radio"],
  Tabs: ["tabs"],
  Badge: ["badge"],
  Table: ["table"],
  Gauge: ["gauge", "gauge-parts"],
  Bars: ["bars"],
  Proportion: ["proportion"],
  // 浮层不放在对照页上：audit 到组件页把两种实现各打开一次再比（scripts/parity.mjs 的 OVERLAYS）
  Dialog: [],
  Menu: [],
};
