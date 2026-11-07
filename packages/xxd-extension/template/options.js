// 设置页：搜索 + 外观（和侧边栏的设置是同一份，存在 chrome.storage.sync）。
const { createAppearanceStore, applyI18n, uiLocale, t } = window.XxdExtension;
const store = createAppearanceStore({ key: "__SLUG__-ui" });
const $ = (id) => document.getElementById(id);

// 搜不到时说搜了什么、怎么放宽（filterSettings 派发 xxd:filter）
function bindSearchEmpty(container, empty, title) {
  container.addEventListener("xxd:filter", (e) => {
    empty.hidden = !e.detail.query || e.detail.hits > 0;
    if (!empty.hidden) title.textContent = t("searchEmpty", [e.detail.query]);
  });
}

(async () => {
  applyI18n(document);
  await store.load();
  const settings = $("settings");
  Xxd.mountAppearance(settings, { locale: uiLocale(), get: store.get, set: (patch) => store.set(patch) });
  Xxd.init(document);
  // 和侧边栏一样：输入就筛设置行（以前只是高亮，搜不到也看不出来）
  bindSearchEmpty(settings, $("settings-empty"), $("settings-empty-title"));
  Xxd.bindSettingsSearch($("search"), settings);
})();
