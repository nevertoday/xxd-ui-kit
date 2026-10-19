// 经典脚本 dist/gauge.js：window.XxdGauge（量表的几何）。放在 xxd.js 后面；加载时页面上已有的 [data-gauge] 马上画出来。
import * as XxdGauge from "./gauge.js";

globalThis.XxdGauge = XxdGauge;
if (globalThis.document) {
  const draw = () => globalThis.Xxd?.initGauges?.(document);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw, { once: true });
  else draw();
}
