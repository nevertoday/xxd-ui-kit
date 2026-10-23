// IIFE 入口：window.Xxd，DOM 就绪后自动 install(document)。
// <script src="xxd.js" data-manual></script> 可以关掉自动安装。
import * as Xxd from "./index.js";

const script = globalThis.document?.currentScript;
globalThis.Xxd = Xxd;

// 作为 content script 跑在别人的网页里时不自动接管页面：请用 XxdExtension.mountXxdUI 放进 Shadow DOM。
const isContentScript = Boolean(globalThis.chrome?.runtime?.id) && globalThis.location?.protocol !== "chrome-extension:";

if (globalThis.document && !script?.hasAttribute("data-manual") && !isContentScript) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => Xxd.install(document), { once: true });
  else Xxd.install(document);
}
