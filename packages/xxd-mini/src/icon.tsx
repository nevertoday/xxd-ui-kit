// 图标：@xxd/icons 的同一套（24 网格、1.5 线宽、圆头、斜接角）。
// 小程序里不能直接写 <svg>：做成 SVG 数据地址，当遮罩用，颜色是 currentColor —— 跟着文字颜色走，换主题、主色、按下都不用换图。
//   <Icon icon={Trash} />            按需引入（import { Trash } from "@xxd/icons/each"），没用到的图标不进包
//   registerIcons({ Trash }); <Icon name="Trash" />   用名字：先登记
import { View } from "@tarojs/components";
import { createContext, useContext, useLayoutEffect } from "react";
import "../styles/icon.mini.css";
import { a11y } from "./aria";
import { cx, styleText } from "./util";

export type IconNode = readonly (readonly [string, Record<string, string | number>])[];

/** 和 @xxd/icons 的 ICON_ATTRIBUTES 一样（测试会对一遍）；遮罩只看形状，笔画颜色随便写一个不透明的 */
export const ICON_SVG_ATTRS = { fill: "none", stroke: "#000", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "miter" };

const registry = new Map<string, IconNode>();
/** 登记几个图标，之后可以用名字 */
export function registerIcons(icons: Record<string, IconNode>): void {
  for (const [name, node] of Object.entries(icons)) registry.set(name, node);
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/** ASCII 文本 → base64（小程序里没有 btoa） */
export function base64(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i += 3) {
    const a = text.charCodeAt(i);
    const b = text.charCodeAt(i + 1);
    const c = text.charCodeAt(i + 2);
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (Number.isNaN(b) ? "=" : B64[(n >> 6) & 63]) + (Number.isNaN(c) ? "=" : B64[n & 63]);
  }
  return out;
}

const esc = (v: string | number) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** 图标数据 → SVG 文本 */
export function iconSvg(node: IconNode): string {
  const attrs = Object.entries(ICON_SVG_ATTRS).map(([k, v]) => `${k}="${v}"`).join(" ");
  // 线宽固定 1.5px，不跟着图标缩小（和网页版一样，设计师评审 D23）
  const body = node.map(([tag, a]) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${esc(v)}"`).join(" ")} vector-effect="non-scaling-stroke"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${attrs}>${body}</svg>`;
}

const uriCache = new WeakMap<object, string>();
/** 图标数据 → data: 地址（缓存） */
export function iconUri(node: IconNode): string {
  let uri = uriCache.get(node);
  if (!uri) {
    // 用 base64：微信文档只保证 base64 的 data: 地址能当背景图 / 遮罩（百分号编码的 SVG 短两成，但不保证）
    uri = `data:image/svg+xml;base64,${base64(iconSvg(node))}`;
    uriCache.set(node, uri);
  }
  return uri;
}

/* ── 一页里同一个图标的数据只写一次（MINI-REVIEW-PLAN S3）──
 * 每个图标都把整段 SVG 写进行内样式的话，一个 100 行的列表首屏就要多传 100 KB。
 * XxdPage 放一张表：图标第一次出现时登记成一个 CSS 变量（--xi-0、--xi-1……），变量写在页面根和浮层根上，
 * 每个图标只写 var(--xi-n)。没包在 XxdPage 里时照旧把数据写在自己身上。 */
export interface IconTable {
  map: Map<string, string>;
  /** 页面根上已经写了几个 */
  version: number;
  /** 登记了新的：让页面根再画一次 */
  sync: () => void;
}
export const IconTableCtx = createContext<IconTable | null>(null);

/** 页面根 / 浮层根上要写的图标变量 */
export function iconVars(table: IconTable | null): string {
  if (!table) return "";
  let out = "";
  for (const [uri, name] of table.map) out += `${name}:url("${uri}");`;
  return out;
}

function maskRef(table: IconTable | null, uri: string): string {
  if (!table) return `url("${uri}")`;
  let name = table.map.get(uri);
  if (!name) {
    name = `--xi-${table.map.size}`;
    table.map.set(uri, name);
  }
  return `var(${name})`;
}

export interface IconProps {
  icon?: IconNode;
  name?: string;
  /** 像素，缺省 16（和网页版按钮里的图标一样） */
  size?: number;
  /** 有意义的图标（不在文字旁边）要给说明；装饰用的不给，读屏会跳过 */
  label?: string;
  className?: string;
  style?: string | Record<string, string | number>;
}

export function Icon({ icon, name, size = 16, label, className, style }: IconProps) {
  const table = useContext(IconTableCtx);
  // 后来才出现的图标（比如面板里的）：页面根不会自己重画，这里提醒它
  useLayoutEffect(() => {
    if (table && table.map.size !== table.version) table.sync();
  });
  const node = icon ?? (name ? registry.get(name) : undefined);
  if (!node) {
    if (process.env.NODE_ENV !== "production") console.warn(`[@xxd/mini] 图标 ${name ?? "?"} 没登记：registerIcons({ ${name} })，或者用 icon={…}`);
    return null;
  }
  const url = maskRef(table, iconUri(node));
  const css = `width:${size}px;height:${size}px;-webkit-mask-image:${url};mask-image:${url};${styleText(style)}`;
  return <View className={cx("ui-icon", className)} style={css} {...a11y(label ? { role: "img", label } : { hidden: true })} />;
}
