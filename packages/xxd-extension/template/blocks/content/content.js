// 往网页里放一个按钮：放进 Shadow DOM，不碰宿主页面的样式，也不写宿主页面的存储。
// 样式来自 vendor/xxd/xxd.shadow.css.js（manifest 里排在这个文件前面），不需要 web_accessible_resources。
(async () => {
  // 防重复注入（插件更新、页面里 SPA 切换时脚本可能再跑一次）
  if (document.querySelector("xxd-root[data-ext='__SLUG__']")) return;
  const { mountXxdUI, createAppearanceStore, t } = window.XxdExtension;
  const store = createAppearanceStore({ key: "__SLUG__-ui", apply: false });
  await store.load();
  // 自定义元素当 host：宿主页面写 div { … } 之类的规则打不到它
  const host = document.createElement("xxd-root");
  host.dataset.ext = "__SLUG__";
  host.dataset.display = "block";
  host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000";
  document.documentElement.append(host);
  const ui = await mountXxdUI(host, { cssText: globalThis.XxdShadowCSS, settings: store.get() });
  const button = document.createElement("button");
  button.className = "xxd-btn";
  button.dataset.variant = "primary";
  button.dataset.size = "sm";
  button.textContent = t("contentButton", [t("appName")]);
  // toast / 确认框默认出现在这个 Shadow 里（mountXxdUI 登记了浮层根），盖在宿主页面的东西上面
  button.addEventListener("click", () => Xxd.toast(t("doneToast"), { tone: "success" }));
  ui.root.append(button);
  store.subscribe((s) => ui.update(s));
})();
