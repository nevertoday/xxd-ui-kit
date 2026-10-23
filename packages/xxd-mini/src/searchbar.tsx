// 搜索框：放大镜 + 输入框 + 清空按钮；回车（键盘上的「搜索」）提交。网页版 .xxd-input-wrap。
import { Input, View } from "@tarojs/components";
import { Search, X } from "@xxd/icons/each";
import { useState } from "react";
import "../styles/field.mini.css";
import "../styles/searchbar.mini.css";
import { a11y } from "./aria";
import { Icon } from "./icon";
import { useXxd } from "./provider";
import { cx, IS_H5 } from "./util";

export interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  /** 右边的「取消」（搜索页常用），点了清空并回调 */
  onCancel?: () => void;
  focus?: boolean;
  className?: string;
}

export function SearchBar({ value, defaultValue, onValueChange, onSearch, placeholder, onCancel, focus, className }: SearchBarProps) {
  const { t } = useXxd();
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const set = (v: string) => {
    if (value == null) setInner(v);
    onValueChange?.(v);
  };
  return (
    <View className={cx("xxd-searchbar", className)} {...a11y({ role: "search", label: placeholder ?? t.search })}>
      <View className="xxd-input-wrap">
        <Icon icon={Search} />
        <Input
          className="xxd-input"
          placeholderClass="is-placeholder"
          type="text"
          confirmType="search"
          value={current}
          placeholder={placeholder ?? t.search}
          focus={focus}
          onInput={(e) => set(e.detail.value)}
          onConfirm={(e) => onSearch?.(e.detail.value)}
          {...(IS_H5 ? { nativeProps: { "aria-label": placeholder ?? t.search } } : {})}
          {...a11y({ label: placeholder ?? t.search })}
        />
        {current && (
          <View className="xxd-input-clear" hoverClass="is-hover" onClick={() => set("")} {...a11y({ role: "button", label: t.clear })}>
            <Icon icon={X} size={14} />
          </View>
        )}
      </View>
      {onCancel && (
        <View
          className="xxd-searchbar__cancel"
          hoverClass="is-hover"
          onClick={() => {
            set("");
            onCancel();
          }}
          {...a11y({ role: "button" })}
        >
          {t.cancel}
        </View>
      )}
    </View>
  );
}
