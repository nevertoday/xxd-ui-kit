#!/usr/bin/env node
// pnpm xxd:build 的第一步：@xxd/react 用 Kumo 的构建产物（packages/kumo/dist）。
// 新克隆的仓库还没有它，就先构建一次；已经有了就跳过（改了 packages/kumo 的源码，自己跑 pnpm --filter @cloudflare/kumo build）。
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(join(repo, "packages/kumo/dist/index.js"))) {
  console.log("packages/kumo 还没构建，先构建一次（第一次大约一分钟）…");
  execFileSync("pnpm", ["--filter", "@cloudflare/kumo", "build"], { cwd: repo, stdio: "inherit" });
}
