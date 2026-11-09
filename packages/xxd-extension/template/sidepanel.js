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
// 账号只有一个状态：signed-out（没登录）→ signed-in（登录了，试用中）→ member（会员），退出回到 signed-out。
// 登录、开通、退出都只改它，界面全从它画出来；chrome.storage.local 是真正的来源，localStorage 镜像只给 account-boot.js 首帧用。
// （以前「登录了没有」存着、「是不是会员」只写在界面上：退出再登录还是会员，刷新又变回试用，另一个窗口退出了这里还登录着）
const ACCOUNT_STATES = ["signed-out", "signed-in", "member"];
let account = "signed-out";

function mirrorAccount() {
  try {
    localStorage.setItem(ACCOUNT_KEY, account);
  } catch {}
}

function renderAccount() {
  document.documentElement.dataset.account = account === "signed-out" ? "signed-out" : "signed-in";
  const member = account === "member";
  const line = $("plan-line");
  const until = new Intl.DateTimeFormat(uiLocale(), { dateStyle: "long" }).format(Date.now() + 365 * 864e5);
  const text = member ? t("memberUntil", [until]) : t("trialLeft", ["7"]);
  if (line.textContent && line.textContent !== text) Xxd.rollText(line, text);
  else line.textContent = text;
  line.dataset.tone = member ? "member" : "";
  $("avatar").toggleAttribute("data-member", member);
  $("upgrade").textContent = member ? t("manage") : t("upgrade");
  if (account === "signed-out") $("purchase").hidden = true;
}

async function setAccount(next) {
  if (!ACCOUNT_STATES.includes(next) || next === account) return;
  account = next;
  mirrorAccount();
  renderAccount();
  await local?.set({ [ACCOUNT_KEY]: next });
}

async function setupAccount() {
  // 以存储为准：镜像说登录了、存储里没有（被清掉了）就是没登录
  const saved = (await local?.get(ACCOUNT_KEY))?.[ACCOUNT_KEY];
  account = ACCOUNT_STATES.includes(saved) ? saved : local ? "signed-out" : localStorage.getItem(ACCOUNT_KEY) || "signed-out";
  if (!ACCOUNT_STATES.includes(account)) account = "signed-out";
  mirrorAccount();
  renderAccount();
  // 别的窗口登录、退出、开通了：这里跟着变
  globalThis.chrome?.storage?.onChanged?.addListener((changes, area) => {
    if (area !== "local" || !(ACCOUNT_KEY in changes)) return;
    const next = changes[ACCOUNT_KEY].newValue;
    account = ACCOUNT_STATES.includes(next) ? next : "signed-out";
    mirrorAccount();
    renderAccount();
  });
  // 样板：任何邮箱都能进
  $("signin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    setAccount("signed-in");
  });
  $("signin-google").addEventListener("click", () => setAccount("signed-in"));
  $("signout").addEventListener("xxd:confirm", () => setAccount("signed-out"));
  $("upgrade").addEventListener("click", () => ($("purchase").hidden = !$("purchase").hidden));
  $("pay").addEventListener("click", () => Xxd.toast(t("payOpened")));
  // 样板：「我已支付」直接开通。进行中再点，runBusy 返回同一个 promise：只有还在试用时才开通、庆祝一次
  $("paid").addEventListener("click", (e) =>
    Xxd.runBusy(e.currentTarget, () => new Promise((r) => setTimeout(r, 800))).then(() => {
      if (account !== "signed-in") return; // 已经开通了（双击），或者等的时候退出了
      $("purchase").hidden = true;
      setAccount("member");
      Xxd.celebrate($("avatar"));
      Xxd.toast(t("memberDone"), { tone: "success" });
    }),
  );
}
// /xxd:account

// 搜不到时说搜了什么、怎么放宽（filterSettings 派发 xxd:filter）
function bindSearchEmpty(container, empty, title) {
  container.addEventListener("xxd:filter", (e) => {
    empty.hidden = !e.detail.query || e.detail.hits > 0;
    if (!empty.hidden) title.textContent = t("searchEmpty", [e.detail.query]);
  });
}

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

  // 设置：搜索（搜不到时说一句）
  bindSearchEmpty($("settings"), $("settings-empty"), $("settings-empty-title"));
  Xxd.bindSettingsSearch($("settings-search"), $("settings"));
  $("primary").addEventListener("click", () => Xxd.toast(t("doneToast"), { tone: "success" }));
}

main();
