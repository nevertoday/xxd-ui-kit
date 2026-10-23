// Phosphor 兼容层：Kumo 组件原来从 "@phosphor-icons/react" 引入的名字，在这里用小小东画法实现。
// 只覆盖 Kumo 组件库自己用到的名字；新代码请直接用 <Icon name="…" />。
import { createIcon, IconContext } from "./react.js";

export { IconContext };

export const ArrowRightIcon = createIcon("ArrowRight");
export const ArrowSquareOutIcon = createIcon("ExternalLink");
export const ArrowsClockwise = createIcon("RefreshCw");
export const CaretDoubleLeftIcon = createIcon("ChevronsLeft");
export const CaretDoubleRightIcon = createIcon("ChevronsRight");
export const CaretDownIcon = createIcon("ChevronDown");
export const CaretLeftIcon = createIcon("ChevronLeft");
export const CaretRightIcon = createIcon("ChevronRight");
export const CaretUpDownIcon = createIcon("ChevronsUpDown");
export const CheckIcon = createIcon("Check");
export const CopyIcon = createIcon("Copy");
export const CopySimpleIcon = createIcon("Copy");
export const Eye = createIcon("Eye");
export const EyeSlash = createIcon("EyeOff");
export const GlobeHemisphereWestIcon = createIcon("Globe");
export const Info = createIcon("Info");
export const MagnifyingGlassIcon = createIcon("Search");
export const MinusIcon = createIcon("Minus");
export const WarningCircleIcon = createIcon("CircleAlert");
export const X = createIcon("X");
export const XIcon = createIcon("X");
export const GearSixIcon = createIcon("Settings");
export const Plus = createIcon("Plus");
