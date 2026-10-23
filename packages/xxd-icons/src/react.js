// React 组件。不用 JSX，免编译即可被任何打包器使用。
import { createContext, createElement, forwardRef, useContext } from "react";
import { ICON_ATTRIBUTES, ICON_NODES } from "./nodes.js";
import { ICON_NAMES, resolveIcon, warnUnknownIcon } from "./svg.js";

export { ICON_NAMES };

/** 和 Phosphor 的 IconContext 同形：{ size, color, className }。 */
export const IconContext = createContext({});

const toReactAttrs = (attrs) =>
  Object.fromEntries(
    Object.entries(attrs).map(([key, value]) => [key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value]),
  );

const SVG_ATTRS = toReactAttrs(ICON_ATTRIBUTES);

/**
 * <Icon name="Check" size={16} />，或按需打包：import { Check } from "@xxd/icons/each"; <Icon icon={Check} />
 * 兼容 Phosphor 的 props：size、color、className、weight（忽略 —— 线宽永远是 1.5，激活态改颜色不改线宽）、mirrored。
 */
export const Icon = forwardRef(function Icon(
  { name, icon, size, color, className, weight: _weight, mirrored, label, style, children, ...rest },
  ref,
) {
  const ctx = useContext(IconContext);
  // icon：@xxd/icons/each 的图标数据（按需打包）；name：名字
  const nodes = resolveIcon(icon ?? name);
  if (!nodes) {
    warnUnknownIcon(name);
    return null;
  }
  const finalSize = size ?? ctx.size ?? 16;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: "false" };
  return createElement(
    "svg",
    {
      ref,
      width: finalSize,
      height: finalSize,
      viewBox: "0 0 24 24",
      ...SVG_ATTRS,
      stroke: color ?? ctx.color ?? "currentColor",
      className: ["ui-icon", ctx.className, className].filter(Boolean).join(" "),
      style: mirrored ? { transform: "scaleX(-1)", ...style } : style,
      ...a11y,
      ...rest,
    },
    children,
    ...nodes.map(([tag, attrs], index) => createElement(tag, { key: index, ...toReactAttrs(attrs) })),
  );
});
Icon.displayName = "Icon";

/** 生成一个具名图标组件：const Check = createIcon("Check") */
export function createIcon(name) {
  const Named = forwardRef(function NamedIcon(props, ref) {
    return createElement(Icon, { ...props, name, ref });
  });
  Named.displayName = `${name}Icon`;
  return Named;
}

/** 所有图标的具名组件，按需取：icons.Check */
export const icons = Object.freeze(Object.fromEntries(Object.keys(ICON_NODES).map((name) => [name, createIcon(name)])));
