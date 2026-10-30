// 小工具：拼类名、平台判断
export const IS_H5 = process.env.TARO_ENV === "h5";

type ClassValue = string | false | null | undefined | 0;
/** 拼类名，假值跳过 */
export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * 网页版的 data-* 属性在小程序里写成类名（scripts/build-mini.mjs 的改写规则）：
 *   variant="primary" → is-variant is-variant-primary；布尔 true → is-<名>；false / 空 → 不写
 */
export function mods(map: Record<string, string | number | boolean | null | undefined>): string {
  const out: string[] = [];
  for (const [name, value] of Object.entries(map)) {
    if (value == null || value === false || value === "") continue;
    out.push(`is-${name}`);
    if (value !== true) out.push(`is-${name}-${String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`);
  }
  return out.join(" ");
}

/** 行内样式：对象 → 字符串（Taro 的 style 收字符串，CSS 变量也能写） */
export function styleText(style?: string | Record<string, string | number | undefined>): string {
  if (!style) return "";
  if (typeof style === "string") return style;
  return Object.entries(style)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k.startsWith("--") ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(";");
}

let uid = 0;
/** 页面里唯一的 id（读屏关联、滚动定位用）。组件里写 useState(() => nextId("tab")) */
export function nextId(prefix = "xxd"): string {
  uid += 1;
  return `${prefix}-${uid}`;
}

/** H5 里 Taro 的 Image 是 <taro-image-core><img></taro-image-core>：alt 要经 nativeProps 交给里面的 <img>（微信版用 aria-label） */
export function imgAlt(alt: string): Record<string, unknown> {
  return IS_H5 ? { nativeProps: { alt } } : {};
}

const warned = new Set<string>();
/** 同一件事只提醒一次（超过上限这类，不悄悄截掉） */
export function warnOnce(key: string, text: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[@xxd/mini] ${text}`);
}
