const { createAppearanceStore, applyI18n, uiLocale } = window.XxdExtension;
const store = createAppearanceStore({ key: "__SLUG__-ui" });

(async () => {
  applyI18n(document);
  await store.load();
  const settings = document.getElementById("settings");
  Xxd.mountAppearance(settings, { locale: uiLocale(), get: store.get, set: (patch) => store.set(patch) });
  Xxd.init(document);
  Xxd.bindSearch(document.getElementById("search"), { onQuery: (q) => Xxd.markMatches(settings, q) });
})();
