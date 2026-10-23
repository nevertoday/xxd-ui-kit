// Astro 岛：按名字渲染 demos.tsx（英文页用 demos.en.tsx）里的 React 演示；外面包一层三语 Provider。
import type { JSX } from "react";
import { XxdLocaleProvider } from "@xxd/react";
import * as demos from "./demos";
import * as demosEn from "./demos.en";

export default function ReactDemo({ name, lang = "zh" }: { name: string; lang?: string }) {
  const set = (lang === "en" ? demosEn : demos) as Record<string, () => JSX.Element>;
  const Demo = set[`${name}Demo`];
  return Demo ? (
    <XxdLocaleProvider locale={lang === "en" ? "en" : "zh-CN"}>
      <Demo />
    </XxdLocaleProvider>
  ) : null;
}
