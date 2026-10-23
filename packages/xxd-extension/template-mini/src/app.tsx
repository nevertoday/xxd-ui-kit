import type { PropsWithChildren } from "react";
import "@xxd/mini/tokens.css";
import { XxdProvider } from "@xxd/mini";
import "./app.css";

// 外观（主题 / 主色 / 圆角 / 密度）存在本机，所有页面共用；lang 可以是 "zh" 或 "en"
export default function App({ children }: PropsWithChildren) {
  return <XxdProvider lang="zh">{children}</XxdProvider>;
}
