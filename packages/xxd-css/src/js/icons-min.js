// 组件内部用到的几个图标（与 @xxd/icons 同一画法），免得 xxd.js 打包整套图标。
const svg = (d, size = 16) =>
  `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter" aria-hidden="true" focusable="false">${d}</svg>`;

export const ICON = {
  close: (s) => svg('<path d="m6 6 12 12M18 6 6 18"/>', s),
  check: (s) => svg('<path d="m6 12 4 4 8-8"/>', s),
  copy: (s) => svg('<rect x="8" y="8" width="12" height="12"/><path d="M16 4H4v12"/>', s),
  search: (s) => svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>', s),
  success: (s) => svg('<circle cx="12" cy="12" r="8.5"/><path d="m7.5 12 3 3 6-6"/>', s),
  danger: (s) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v6m0 4h.01"/>', s),
  warning: (s) => svg('<path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3h.01"/>', s),
  info: (s) => svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v6m0-10h.01"/>', s),
};
