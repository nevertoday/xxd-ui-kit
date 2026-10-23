// 组件逻辑测试的底子：把 src/ 打成一个包（Taro 换成 fakes/），用 react-test-renderer 渲染。
// 小程序版（TARO_ENV=weapp，读屏插件已装）；要测 H5 的分支另打一个包。
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const here = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);

export async function loadMini() {
  // 放在包里（.out 不进仓库）：打出来的包要从这里找到 react
  const outdir = join(here, ".out");
  mkdirSync(outdir, { recursive: true });
  const outfile = join(outdir, "mini.mjs");
  await build({
    entryPoints: [join(here, "../src/index.ts")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    logLevel: "silent",
    external: ["react", "react/jsx-runtime"],
    // 假的 Taro 不打进包里：测试和组件要拿到同一份（同一个 fake 对象）
    plugins: [
      {
        name: "fake-taro",
        setup(b) {
          const map = { "@tarojs/components": "components", "@tarojs/taro": "taro", "@tarojs/shared": "shared" };
          b.onResolve({ filter: /^@tarojs\/(components|taro|shared)$/ }, (a) => ({ path: join(here, `fakes/${map[a.path]}.js`), external: true }));
        },
      },
    ],
    loader: { ".css": "empty" },
    define: { "process.env.TARO_ENV": '"weapp"', __XXD_MINI_ARIA__: "true", "process.env.NODE_ENV": '"test"' },
    nodePaths: [join(here, "../node_modules")],
  });
  // react 要和测试渲染器同一份：从 @xxd/mini 的 node_modules 解析
  const mod = await import(pathToFileURL(outfile).href);
  const taro = await import(pathToFileURL(join(here, "fakes/taro.js")).href);
  return { mini: mod, fake: taro.fake };
}

export const React = require("react");
export const TestRenderer = require("react-test-renderer");
export const { act } = TestRenderer;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** 渲染；返回 renderer 和几个查找小工具 */
export function render(el) {
  let r;
  act(() => {
    r = TestRenderer.create(el);
  });
  const all = (pred) => r.root.findAll((n) => typeof n.type === "string" && pred(n), { deep: true });
  const byClass = (cls) => all((n) => String(n.props.className ?? "").split(/\s+/).includes(cls));
  return { r, all, byClass, update: (next) => act(() => r.update(next)), unmount: () => act(() => r.unmount()) };
}

export const tick = (ms = 0) => act(() => new Promise((res) => setTimeout(res, ms)));
