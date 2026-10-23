// @xxd/extension 的构建：只构建自己（dist/extension.js、dist/tokens.mjs）。
// 令牌和组件由根目录的 pnpm xxd:build 按依赖顺序先构建；用户命令 xxd-ui new / sync 会自己把依赖构建成最新。
import { buildExtension } from "./cli.mjs";

await buildExtension();
console.log("@xxd/extension → dist/");
