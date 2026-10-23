import { defineConfig } from "vitest/config";
// 测试文件按顺序跑：好几个测试都会构建（buildAll 会重建 dist），并行会互相删掉对方的文件。
// 命令行的文字按系统语言切换：测试固定成中文（CI 的 LANG 是 C.UTF-8，本机可能是别的）
export default defineConfig({ test: { environment: "happy-dom", setupFiles: ["./test/setup.mjs"], fileParallelism: false, env: { XXD_UI_LANG: "zh" } } });
