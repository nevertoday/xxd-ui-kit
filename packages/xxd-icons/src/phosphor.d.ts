import type { ComponentType, Context, ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  color?: string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  mirrored?: boolean;
  label?: string;
}
export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
export declare const IconContext: Context<{ size?: number | string; color?: string; className?: string }>;
export declare const ArrowRightIcon: Icon;
export declare const ArrowSquareOutIcon: Icon;
export declare const ArrowsClockwise: Icon;
export declare const CaretDoubleLeftIcon: Icon;
export declare const CaretDoubleRightIcon: Icon;
export declare const CaretDownIcon: Icon;
export declare const CaretLeftIcon: Icon;
export declare const CaretRightIcon: Icon;
export declare const CaretUpDownIcon: Icon;
export declare const CheckIcon: Icon;
export declare const CopyIcon: Icon;
export declare const CopySimpleIcon: Icon;
export declare const Eye: Icon;
export declare const EyeSlash: Icon;
export declare const GlobeHemisphereWestIcon: Icon;
export declare const Info: Icon;
export declare const MagnifyingGlassIcon: Icon;
export declare const MinusIcon: Icon;
export declare const WarningCircleIcon: Icon;
export declare const X: Icon;
export declare const XIcon: Icon;
export declare const GearSixIcon: Icon;
export declare const Plus: Icon;
export type { ComponentType };
