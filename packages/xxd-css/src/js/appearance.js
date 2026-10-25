// 「外观」设置组：主题 · 圆角 · 主色 ·（密度）·（语言）。每个插件都要的那一组。
//   mountAppearance(container, { locale: "zh-CN", lockCorners: false, showDensity: false,
//                               languages: [{ value: "zh-CN", label: "简体中文" }, …], language, onLanguage })
// 读写默认走 window.XxdTheme（@xxd/tokens/dist/boot.js）；插件里可以传 get / set 接到 chrome.storage。
import { emit } from "./dom.js";
import { getLocale, resolveLocale } from "./i18n.js";
import { APPEARANCE_LABELS } from "./labels.js";

const PRESETS_FALLBACK = [{ id: "", name: "Ink", zh: "墨色" }];

export { APPEARANCE_LABELS };

function row(doc, title, desc, control) {
  const el = doc.createElement("div");
  el.className = "xxd-row";
  const text = doc.createElement("div");
  text.className = "xxd-row__text";
  const t = doc.createElement("div");
  t.className = "xxd-row__title";
  t.textContent = title;
  text.append(t);
  if (desc) {
    const d = doc.createElement("div");
    d.className = "xxd-row__desc";
    d.textContent = desc;
    text.append(d);
  }
  const c = doc.createElement("div");
  c.className = "xxd-row__control";
  c.append(control);
  el.append(text, c);
  return el;
}

function segmented(doc, name, options, value, label) {
  const g = doc.createElement("div");
  g.className = "xxd-segmented";
  g.setAttribute("data-xxd-segmented", "");
  g.setAttribute("role", "radiogroup");
  g.setAttribute("aria-label", label);
  g.dataset.name = name;
  for (const [v, text] of options) {
    const b = doc.createElement("button");
    b.type = "button";
    b.setAttribute("role", "radio");
    b.dataset.value = v;
    b.textContent = text;
    b.setAttribute("aria-checked", String(v === value));
    b.tabIndex = v === value ? 0 : -1;
    g.append(b);
  }
  return g;
}

export function mountAppearance(container, options = {}) {
  const doc = container.ownerDocument;
  const theme = globalThis.XxdTheme;
  const {
    locale: localeOption,
    labels: customLabels,
    get = () => ({ ...(theme?.DEFAULT_SETTINGS ?? {}), ...(theme?.read() ?? {}) }),
    set = (patch) => theme?.set(patch),
    presets = theme?.ACCENT_PRESETS ?? PRESETS_FALLBACK,
    lockCorners = Boolean(theme?.lock?.corners),
    showDensity = false,
    showFinish = false,
    languages,
    language,
    onLanguage,
  } = options;
  // 缺省跟 Xxd.setLocale / <html lang>
  const locale = localeOption ? resolveLocale(localeOption) : getLocale(container);
  const L = { ...(APPEARANCE_LABELS[locale] || APPEARANCE_LABELS["zh-CN"]), ...customLabels };
  const s = get();

  const group = doc.createElement("section");
  group.className = "xxd-group";
  group.dataset.xxdAppearance = "";
  const title = doc.createElement("h3");
  title.className = "xxd-group__title";
  title.textContent = L.group;
  const body = doc.createElement("div");
  body.className = "xxd-group__body";
  group.append(title, body);

  body.append(row(doc, L.theme, "", segmented(doc, "theme", [["light", L.light], ["dark", L.dark], ["system", L.system]], s.theme || "light", L.theme)));

  if (!lockCorners) {
    const sw = doc.createElement("input");
    sw.type = "checkbox";
    sw.className = "xxd-switch";
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-label", L.corners);
    sw.checked = s.corners === "rounded";
    sw.addEventListener("change", () => {
      set({ corners: sw.checked ? "rounded" : "square" });
      emit(group, "xxd:appearance", get());
    });
    body.append(row(doc, L.corners, L.cornersDesc, sw));
  }

  const swatches = doc.createElement("div");
  swatches.className = "xxd-swatches";
  // 放不下一行时各行一样多（FIELD-FIXES D137）
  swatches.setAttribute("data-balance", "");
  swatches.setAttribute("role", "radiogroup");
  swatches.setAttribute("aria-label", L.accent);
  // 和分段控件同一套键盘：← → ↑ ↓ Home End 选择，Tab 只停在选中的那一个
  swatches.setAttribute("data-xxd-segmented", "");
  const nameOf = (id) => {
    const p = presets.find((x) => x.id === (id || ""));
    if (!p) return id || L.ink;
    return p.id ? (locale === "en" ? p.name : p.zh || p.name) : L.ink;
  };
  for (const p of presets) {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "xxd-swatch";
    b.setAttribute("role", "radio");
    const name = nameOf(p.id);
    b.setAttribute("aria-label", name);
    b.dataset.tooltip = name;
    b.dataset.value = p.id;
    if (p.id) b.style.setProperty("--swatch", p.id);
    b.setAttribute("aria-checked", String((s.accent || "") === p.id));
    b.tabIndex = (s.accent || "") === p.id ? 0 : -1;
    swatches.append(b);
  }
  if (![...swatches.children].some((b) => b.tabIndex === 0)) swatches.firstElementChild.tabIndex = 0;
  // 点击和方向键都由 install() 的分段控件委托处理，派发 xxd:change
  // 选中的那个颜色的名字直接写在标题旁边（设计师评审 E2：以前只能悬停一个个看）
  const current = doc.createElement("span");
  current.className = "xxd-text";
  current.dataset.variant = "secondary";
  current.textContent = nameOf(s.accent);
  swatches.addEventListener("xxd:change", (event) => {
    event.stopPropagation();
    set({ accent: event.detail.value });
    current.textContent = nameOf(event.detail.value);
    emit(group, "xxd:appearance", get());
  });
  const accentRow = row(doc, L.accent, L.accentDesc, swatches);
  accentRow.querySelector(".xxd-row__title").append(" · ", current);
  accentRow.setAttribute("data-stack", "");
  body.append(accentRow);

  if (showDensity) {
    body.append(row(doc, L.density, "", segmented(doc, "density", [["comfortable", L.comfortable], ["compact", L.compact]], s.density || "comfortable", L.density)));
  }

  if (showFinish) {
    body.append(row(doc, L.finish, "", segmented(doc, "finish", [["flat", L.flat], ["material", L.material]], s.finish || "flat", L.finish)));
  }

  if (languages?.length) {
    const wrap = doc.createElement("label");
    wrap.className = "xxd-select";
    wrap.dataset.variant = "bare";
    const sel = doc.createElement("select");
    sel.setAttribute("aria-label", L.language);
    for (const lang of languages) {
      const opt = new Option(lang.label, lang.value, false, lang.value === language);
      opt.lang = lang.value; // 语言的本名（简体中文、English）按它自己的语言读
      sel.append(opt);
    }
    sel.addEventListener("change", () => onLanguage?.(sel.value));
    wrap.append(sel);
    body.append(row(doc, L.language, "", wrap));
  }

  group.addEventListener("xxd:change", (event) => {
    const name = event.target?.dataset?.name;
    if (!name) return;
    set({ [name]: event.detail.value });
    emit(group, "xxd:appearance", get());
  });

  /** 设置在别处被改（命令面板、另一个页面）时，同步控件状态。 */
  function sync() {
    const now = get();
    for (const g of group.querySelectorAll("[data-xxd-segmented][data-name]")) {
      const value = now[g.dataset.name];
      for (const b of g.children) {
        b.setAttribute("aria-checked", String(b.dataset.value === value));
        b.tabIndex = b.dataset.value === value ? 0 : -1;
      }
    }
    const sw = group.querySelector(".xxd-switch");
    if (sw) sw.checked = now.corners === "rounded";
    for (const b of swatches.children) {
      const on = (now.accent || "") === b.dataset.value;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    }
  }
  const onSettings = () => sync();
  globalThis.addEventListener?.("xxd:settings", onSettings);

  container.append(group);
  return {
    element: group,
    sync,
    destroy: () => {
      globalThis.removeEventListener?.("xxd:settings", onSettings);
      group.remove();
    },
  };
}
