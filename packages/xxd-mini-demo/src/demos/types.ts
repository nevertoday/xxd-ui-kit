import type { ReactNode } from "react";
export interface Demo {
  /** mini.json 里的组件名 */
  name: string;
  /** 演示贴着屏幕两边（列表、标签页、导航栏） */
  bleed?: boolean;
  render: (tr: (zh: string, en: string) => string) => ReactNode;
}
