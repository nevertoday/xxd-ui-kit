// 经典脚本 dist/viz.js：window.XxdViz（量表的几何、图型的换算）。放在 xxd.js 后面；加载时页面上已有的 [data-gauge] / [data-viz] 马上画出来。
import * as XxdViz from "./viz.js";

globalThis.XxdViz = XxdViz;
if (globalThis.document) {
  const draw = () => {
    globalThis.Xxd?.initGauges?.(document);
    globalThis.Xxd?.initViz?.(document);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw, { once: true });
  else draw();
}
