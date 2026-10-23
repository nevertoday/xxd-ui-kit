// 下拉加载更多：列表底下一行——在加载、没有更多了、出错了重试。配合页面的 onReachBottom 用（useReachBottom）。
import { View, Text } from "@tarojs/components";
import "../styles/loadmore.mini.css";
import "../styles/loading.mini.css";
import { a11y } from "./aria";
import { useXxd } from "./provider";
import { cx, mods } from "./util";

export interface LoadMoreProps {
  status: "idle" | "loading" | "done" | "error";
  onLoad?: () => void;
  /** 各状态下的字，不写用缺省的 */
  text?: Partial<Record<"idle" | "loading" | "done" | "error", string>>;
  className?: string;
}

export function LoadMore({ status, onLoad, text, className }: LoadMoreProps) {
  const { t } = useXxd();
  const label = text?.[status] ?? { idle: t.loadMore, loading: t.loading, done: t.noMore, error: t.retry }[status];
  const tappable = status === "idle" || status === "error";
  return (
    <View
      className={cx("xxd-loadmore", mods({ status }), className)}
      hoverClass={tappable ? "is-hover" : "none"}
      onClick={tappable ? onLoad : undefined}
      {...a11y(tappable ? { role: "button" } : { role: "status", live: "polite", busy: status === "loading" })}
    >
      {status === "loading" && <View className="xxd-spinner" />}
      <Text>{label}</Text>
    </View>
  );
}
