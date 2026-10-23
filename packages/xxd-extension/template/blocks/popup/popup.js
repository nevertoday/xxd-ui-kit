// popup：最常用的一两个操作。完整功能在侧边栏（chrome.sidePanel.open 必须在用户点击里调用）。
const { createAppearanceStore, applyI18n, t } = window.XxdExtension;
const store = createAppearanceStore({ key: "__SLUG__-ui", defaults: { density: "compact" } });

(async () => {
  applyI18n(document);
  await store.load();
  Xxd.init(document);
  document.getElementById("primary").addEventListener("click", () => Xxd.toast(t("doneToast"), { tone: "success" }));
  document.getElementById("open-panel").addEventListener("click", async () => {
    const win = await chrome.windows.getCurrent();
    await chrome.sidePanel.open({ windowId: win.id });
    window.close();
  });
})();
