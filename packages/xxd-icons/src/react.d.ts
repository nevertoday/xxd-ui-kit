import type { Context, ForwardRefExoticComponent, RefAttributes } from "react";
import type { IconProps, Icon as IconComponent } from "./phosphor.js";
import type { IconName } from "./names.js";
import type { IconNode } from "./nodes.js";
export type { IconProps };
export declare const ICON_NAMES: readonly string[];
export declare const IconContext: Context<{ size?: number | string; color?: string; className?: string }>;
export declare const Icon: ForwardRefExoticComponent<
  IconProps & ({ name: IconName | (string & {}); icon?: readonly IconNode[] } | { name?: never; icon: readonly IconNode[] }) & RefAttributes<SVGSVGElement>
>;
export declare function createIcon(name: IconName | (string & {})): IconComponent;
export declare const icons: Readonly<Record<IconName, IconComponent>>;
