// 往第三方网页（X、公众号编辑器……）注入 UI：一律放进 Shadow DOM，样式互不污染。
// 令牌用 :host 版本（xxd.shadow.css），外观属性同步到 host 上。
import { applySettings } from "@xxd/tokens";
import { uiLocale } from "./i18n.js";
import { xxd as currentXxd } from "./xxd.js";

const sheetCache = new Map();

async function loadSheet(href) {
  if (sheetCache.has(href)) return sheetCache.get(href);
  const promise = fetch(href)
    .then((r) => r.text())
    .then((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return sheet;
    });
  sheetCache.set(href, promise);
  return promise;
}

/**
 * const ui = await mountXxdUI(hostElement, { settings });
 * ui.root.innerHTML = `<button class="xxd-btn" data-variant="primary">导出 MD</button>`;
 * ui.update(newSettings);  ui.destroy();
 *
 * 样式：缺省用 vendor/xxd/xxd.shadow.css.js 放进来的 globalThis.XxdShadowCSS（同步、不用 fetch、不用 web_accessible_resources）；
 *       也可以传 cssText，或 cssHref（要放进 web_accessible_resources）。
 * layerRoot（缺省 true）：toast、确认框、命令面板、图片查看器、tooltip 没指定 within 时出现在这个 Shadow 里，而不是宿主网页的 body。
 * 语言：host 上写 lang（读屏按这种语言念），组件自带的文字跟着 uiLocale()。
 * 主题「跟随系统」时，系统切换亮 / 暗会跟着变。
 * xxd：用哪份 @xxd/css（缺省 useXxd 设的那份，或经典脚本的 window.Xxd）。destroy() 会撤掉装在这个 Shadow 上的监听。
 */
export async function mountXxdUI(host, { cssHref, cssText = cssHref ? undefined : globalThis.XxdShadowCSS, settings = {}, mode = "open", install = true, layerRoot = true, locale = uiLocale(), xxd = currentXxd() } = {}) {
  const root = host.shadowRoot || host.attachShadow({ mode });
  const sheets = [];
  if (cssText) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    sheets.push(sheet);
  } else if (cssHref) {
    sheets.push(await loadSheet(cssHref));
  }
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...sheets];
  // 宿主页面的字号、行高不该影响我们。all:initial 放最前面，调用方写在 host 上的定位、z-index 等接在后面，不会被清掉。
  const own = host.getAttribute("style") || "";
  host.setAttribute("style", `all: initial; ${own}`);
  if (!/(^|;)\s*display\s*:/.test(own)) host.style.setProperty("display", host.dataset.display || "contents");
  host.setAttribute("lang", locale);
  let current = settings;
  const update = (next) => {
    current = next;
    return applySettings(next, { element: host });
  };
  update(settings);
  // 跟随系统：系统切换亮 / 暗时重新套一次
  const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  const onScheme = () => current?.theme === "system" && applySettings(current, { element: host });
  mq?.addEventListener?.("change", onScheme);
  const Xxd = xxd;
  if (layerRoot) Xxd?.setDefaultLayerRoot?.(root);
  if (install && Xxd?.install) Xxd.install(root);
  else if (install && !Xxd) console.warn("[xxd] mountXxdUI：没有找到 @xxd/css —— 内容脚本里先加载 vendor/xxd/xxd.js（或 ESM 里 useXxd(await import(\"@xxd/css\"))），组件的行为才会装上");
  return {
    host,
    root,
    update,
    destroy() {
      mq?.removeEventListener?.("change", onScheme);
      if (layerRoot && Xxd?.defaultLayerRoot?.() === root) Xxd.setDefaultLayerRoot(null);
      Xxd?.uninstall?.(root);
      root.replaceChildren();
      host.remove();
    },
  };
}
