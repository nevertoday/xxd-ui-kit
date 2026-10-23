import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

// 小小东 UI Kit 展示站。静态构建；界面本身用 @xxd/css（自己用自己），React 演示是 Astro 岛。
export default defineConfig({
  site: "https://ui.xiaoxiaodong.ai",
  integrations: [react(), mdx()],
  build: { format: "directory" },
  // github-dark 的注释色只有 3:1；-default 版本是 6:1（axe 门禁）
  markdown: { shikiConfig: { theme: "github-dark-default" } },
  vite: { server: { fs: { allow: ["../.."] } } },
});
