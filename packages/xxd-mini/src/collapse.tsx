// 折叠：常见问题、更多说明。点标题展开 / 收起，accordion 时一次只开一个。网页版 .xxd-collapse（<details>）。
import { View, Text } from "@tarojs/components";
import { ChevronDown } from "@xxd/icons/each";
import { useState, type ReactNode } from "react";
import "../styles/collapse.mini.css";
import { a11y } from "./aria";
import { Icon } from "./icon";
import { cx, mods } from "./util";

export interface CollapseProps {
  items: { key: string; title: ReactNode; content: ReactNode }[];
  /** 一次只开一个 */
  accordion?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export function Collapse({ items, accordion, defaultOpen = [], className }: CollapseProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const toggle = (key: string) => setOpen((list) => (list.includes(key) ? list.filter((k) => k !== key) : accordion ? [key] : [...list, key]));
  return (
    <View className={cx("xxd-collapse-group", className)}>
      {items.map((item) => {
        const on = open.includes(item.key);
        return (
          <View key={item.key} className={cx("xxd-collapse", mods({ open: on }))}>
            <View className="xxd-collapse__summary" hoverClass="is-hover" onClick={() => toggle(item.key)} {...a11y({ role: "button", expanded: on })}>
              <Text className="xxd-collapse__title">{item.title}</Text>
              <Icon icon={ChevronDown} size={14} className="xxd-collapse__chevron" />
            </View>
            {on && <View className="xxd-collapse__body">{item.content}</View>}
          </View>
        );
      })}
    </View>
  );
}
