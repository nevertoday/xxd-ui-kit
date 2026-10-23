// 侧边栏样板：主页（拖放）→ 记录（按天分组）→ 设置（搜索、外观）。
// 外观设置存在 chrome.storage.sync，镜像到 localStorage 给 boot.js 首帧用。
// 界面上的字都在 _locales 里（简体 / 繁体 / 英文），这里用 t("键名") 取。
const { createAppearanceStore, applyI18n, uiLocale, t } = window.XxdExtension;
const store = createAppearanceStore({ key: "__SLUG__-ui", defaults: { density: "compact" } });
const $ = (id) => document.getElementById(id);

// 日期按界面语言写（「10月12日」/「Oct 12」）
const dayFormat = new Intl.DateTimeFormat(uiLocale(), { month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat(uiLocale(), { hour: "2-digit", minute: "2-digit" });
function dayLabel(ts) {
  const d = new Date(ts);
  if (d.toDateString() === new Date().toDateString()) return t("today");
  if (d.toDateString() === new Date(Date.now() - 864e5).toDateString()) return t("yesterday");
  return dayFormat.format(d);
}

const history = [];
function renderHistory() {
  const box = $("history");
  box.replaceChildren();
  $("history-empty").hidden = history.length > 0;
  const days = new Map();
  for (const h of history) (days.get(dayLabel(h.at)) ?? days.set(dayLabel(h.at), []).get(dayLabel(h.at))).push(h);
  for (const [day, list] of days) {
    const section = document.createElement("section");
    section.innerHTML = `<h3 class="xxd-history__day"></h3><ul class="xxd-list xxd-group__body" data-interactive></ul>`;
    section.querySelector("h3").textContent = day;
    for (const h of list) {
      const li = document.createElement("li");
      li.className = "xxd-list__item";
      li.innerHTML = `<div class="xxd-list__main"><div class="xxd-list__title"></div><div class="xxd-list__meta"></div></div><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs"></button>`;
      li.querySelector(".xxd-list__title").textContent = h.title;
      li.querySelector(".xxd-list__meta").textContent = timeFormat.format(h.at);
      const del = li.querySelector("button");
      del.textContent = t("delete");
      del.dataset.confirmTwice = t("confirmDelete");
      del.addEventListener("xxd:confirm", () => {
        history.splice(history.indexOf(h), 1);
        renderHistory();
      });
      section.querySelector("ul").append(li);
    }
    box.append(section);
  }
}

// xxd:account
// 账号与会员（样板：登录、支付都是假的，换成你自己的接口）
const ACCOUNT_KEY = "__SLUG__-account";
const local = globalThis.chrome?.storage?.local;

async function setAccount(state) {
  document.documentElement.dataset.account = state;
  try {
    localStorage.setItem(ACCOUNT_KEY, state);
  } catch {}
  await local?.set({ [ACCOUNT_KEY]: state });
}

function renderPlan(member) {
  const line = $("plan-line");
  const until = new Intl.DateTimeFormat(uiLocale(), { dateStyle: "long" }).format(Date.now() + 365 * 864e5);
  const text = member ? t("memberUntil", [until]) : t("trialLeft", ["7"]);
  if (line.textContent) Xxd.rollText(line, text);
  else line.textContent = text;
  line.dataset.tone = member ? "member" : "";
  $("avatar").toggleAttribute("data-member", member);
  $("upgrade").textContent = member ? t("manage") : t("upgrade");
}

async function setupAccount() {
  const saved = await local?.get(ACCOUNT_KEY);
  if (saved?.[ACCOUNT_KEY]) await setAccount(saved[ACCOUNT_KEY]);
  // 样板：任何邮箱都能进
  $("signin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    setAccount("signed-in");
  });
  $("signin-google").addEventListener("click", () => setAccount("signed-in"));
  $("signout").addEventListener("xxd:confirm", () => setAccount("signed-out"));
  renderPlan(false);
  $("upgrade").addEventListener("click", () => ($("purchase").hidden = !$("purchase").hidden));
  $("pay").addEventListener("click", () => Xxd.toast(t("payOpened")));
  // 样板：「我已支付」直接开通
  $("paid").addEventListener("click", (e) =>
    Xxd.runBusy(e.currentTarget, () => new Promise((r) => setTimeout(r, 800))).then(() => {
      $("purchase").hidden = true;
      renderPlan(true);
      Xxd.celebrate($("avatar"));
      Xxd.toast(t("memberDone"), { tone: "success" });
    }),
  );
}
// /xxd:account

async function main() {
  applyI18n(document);
  await store.load();
  Xxd.mountAppearance($("appearance"), { locale: uiLocale(), get: store.get, set: (patch) => store.set(patch) });
  Xxd.init(document);
  $("version").textContent = globalThis.chrome?.runtime?.getManifest?.().version ?? "0.1.0";
  // xxd:account
  await setupAccount();
  // /xxd:account

  // 主页：拖放 / 粘贴 / 选择文件
  const items = $("items");
  const add = (title) => {
    items.hidden = false;
    $("dropzone").hidden = true;
    const li = document.createElement("li");
    li.className = "xxd-list__item";
    li.textContent = title;
    items.append(li);
    history.unshift({ title, at: Date.now() });
    renderHistory();
    Xxd.setStatus($("status"), t("itemCount", [String(items.children.length)]));
  };
  Xxd.bindDrop(document.querySelector(".app-body"), {
    zone: $("dropzone"),
    veil: t("dropVeil"),
    onFiles: (files) => files.forEach((f) => add(f.name)),
    onText: (text) => add(text.slice(0, 60)),
  });
  $("pick").addEventListener("click", () => {
    const input = Object.assign(document.createElement("input"), { type: "file", multiple: true });
    input.addEventListener("change", () => [...input.files].forEach((f) => add(f.name)));
    input.click();
  });
  renderHistory();

  // 设置：搜索
  Xxd.bindSettingsSearch($("settings-search"), $("settings"));
  $("primary").addEventListener("click", () => Xxd.toast(t("doneToast"), { tone: "success" }));
}

main();
