// 小小东自己写的 React 组件（@xxd/react/props.json，说明是源码里的中文注释）的英文说明：英文页的「React 属性」表用。
// 没写在这里的属性，英文页上说明一栏是「—」（不显示中文）。
export const REACT_PROPS_EN = {
  Gauge: {
    value: "One number, or a [low, high] range (not needed for parts or rings)",
    min: "Default 0",
    max: "Default 100",
    shape: "arc: 270°, opening at the bottom (default); half: half circle; ring: full circle",
    label: "Shown under the number; also the name screen readers read",
    decimals: "Decimal places (default: at most one)",
    target: "Target marks (one or more)",
    zones: "Zones, for meaning only: inside a zone the fill takes that zone's color and the state is written under the number",
    ticks: "Ticks: how many parts the arc is split into",
    segments: "Segments: N cells, a cell lights only when full",
    needle: "Thin needle (arc / half; no fill is drawn with a needle); turns when the value changes",
    parts: "Stacked parts end to end, with a legend",
    rings: "Concentric rings: at most 3, each with its own maximum, with a legend",
    ends: "End labels (default: shown on arc / half, hidden on ring)",
    size: "Size of the number in the middle",
    '"aria-label"': "Name for screen readers when there is no label",
    style: 'Maximum width: style={{ "--gauge-size": "220px" }}',
  },
};
