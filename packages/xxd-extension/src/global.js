// 经典脚本入口：window.XxdExtension（在 boot.js、xxd.js 之后加载）。
// 加载时就按 _locales 的 xxdLocale 定好语言：插件页面的 <html lang>、组件自带的文字（关闭、取消……）。
import * as XxdExtension from "./index.js";
globalThis.XxdExtension = XxdExtension;
if (globalThis.chrome?.i18n?.getMessage) XxdExtension.applyLocale();
