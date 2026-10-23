// 用哪份 @xxd/css：ESM 项目显式传 useXxd(await import("@xxd/css"))；经典脚本（vendor/xxd/xxd.js）自动用 window.Xxd。
let impl = null;
export function useXxd(xxd) {
  impl = xxd || null;
}
export const xxd = () => impl ?? globalThis.Xxd ?? null;
