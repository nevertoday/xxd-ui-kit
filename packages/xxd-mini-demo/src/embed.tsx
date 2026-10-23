// 嵌在展示站里（H5，地址带 embed=1）：外观跟着展示站走。
//   第一帧：地址上的 theme / corners / accent / density / finish；
//   之后：展示站切外观时 postMessage({ type: "xxd:appearance", settings })。
// 嵌入时不读写存储（persist={false}），不覆盖小程序自己的设置。
import { useXxd, type XxdSettings } from "@xxd/mini";
import { useEffect } from "react";

export const EMBED = process.env.TARO_ENV === "h5" && /[?&#]embed=1\b/.test(globalThis.location?.href ?? "");

export function embedSettings(): XxdSettings {
  if (!EMBED) return {};
  const q = new URLSearchParams((globalThis.location?.hash.split("?")[1] ?? "") + "&" + (globalThis.location?.search.slice(1) ?? ""));
  const out: Record<string, string> = {};
  for (const k of ["theme", "corners", "accent", "density", "finish"]) {
    const v = q.get(k);
    if (v != null) out[k] = k === "accent" && v && !v.startsWith("#") ? `#${v}` : v;
  }
  return out as XxdSettings;
}

export function EmbedBridge() {
  const { update } = useXxd();
  useEffect(() => {
    if (!EMBED) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== globalThis.location.origin) return;
      const data = e.data as { type?: string; settings?: XxdSettings };
      if (data?.type === "xxd:appearance" && data.settings) update(data.settings);
    };
    globalThis.addEventListener("message", onMessage);
    // 告诉展示站：准备好了，把现在的外观发过来
    globalThis.parent?.postMessage({ type: "xxd:mini-ready" }, globalThis.location.origin);
    return () => globalThis.removeEventListener("message", onMessage);
  }, [update]);
  return null;
}
