// 自定义下拉（Picker）与密钥输入。
//   Picker：分组、每项说明、图标、多选；键盘 ↑ ↓ Home End、输入首字跳转、Enter / 空格选择、Esc 关；派发 xxd:change。
//   <div class="xxd-picker" data-xxd-picker [data-multiple] [data-placeholder="请选择"]>…（结构见 form-plus.css）
//   取值：picker.dataset.value（多选是逗号分隔）；表单里放 <input type="hidden" name="…"> 会被同步。
import { place } from "./floating.js";
import { emit, nextId } from "./dom.js";
import { showBubble, copyText } from "./feedback.js";
import { t } from "./i18n.js";

const parts = (picker) => ({
  trigger: picker.querySelector(".xxd-picker__trigger"),
  value: picker.querySelector(".xxd-picker__value"),
  list: picker.querySelector(".xxd-listbox"),
  hidden: picker.querySelector('input[type="hidden"]'),
});
const options = (list) => [...list.querySelectorAll('.xxd-option:not([aria-disabled="true"])')];

function render(picker) {
  const { value, list, hidden } = parts(picker);
  const chosen = [...list.querySelectorAll('.xxd-option[aria-selected="true"]')];
  // 标签：data-label，否则选项的字去掉说明（<small>）
  const labelOf = (o) => {
    if (o.dataset.label) return o.dataset.label;
    const copy = o.cloneNode(true);
    copy.querySelectorAll("small, .ui-icon").forEach((n) => n.remove());
    return copy.textContent.trim();
  };
  const labels = chosen.map(labelOf);
  const values = chosen.map((o) => o.dataset.value ?? o.textContent.trim());
  picker.dataset.value = values.join(",");
  if (hidden) hidden.value = picker.dataset.value;
  if (chosen.length) {
    value.textContent = picker.hasAttribute("data-multiple") && chosen.length > 2 ? t("selectedMany", { list: labels.slice(0, 2).join(t("listSep", null, picker)), n: chosen.length }, picker) : labels.join(t("listSep", null, picker));
    value.removeAttribute("data-placeholder");
  } else {
    value.textContent = picker.dataset.placeholder || t("selectPlaceholder", null, picker);
    value.setAttribute("data-placeholder", "");
  }
  return values;
}

function setActive(picker, option) {
  const { trigger, list } = parts(picker);
  for (const o of list.querySelectorAll(".xxd-option[data-active]")) o.removeAttribute("data-active");
  if (!option) return trigger.removeAttribute("aria-activedescendant");
  option.setAttribute("data-active", "");
  trigger.setAttribute("aria-activedescendant", option.id);
  option.scrollIntoView?.({ block: "nearest" });
}

export function openPicker(picker) {
  const { trigger, list } = parts(picker);
  if (picker.hasAttribute("data-disabled") || !list.hidden) return;
  list.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  list.style.minWidth = `${trigger.offsetWidth}px`;
  place(trigger, list, { placement: "bottom-start", offset: 4 });
  setActive(picker, list.querySelector('.xxd-option[aria-selected="true"]') || options(list)[0]);
}

export function closePicker(picker, { focus = false } = {}) {
  const { trigger, list } = parts(picker);
  if (list.hidden) return;
  list.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  setActive(picker, null);
  if (focus) trigger.focus();
}

export function choose(picker, option) {
  const { list } = parts(picker);
  if (!option || option.getAttribute("aria-disabled") === "true") return;
  if (picker.hasAttribute("data-multiple")) {
    option.setAttribute("aria-selected", String(option.getAttribute("aria-selected") !== "true"));
  } else {
    for (const o of list.querySelectorAll(".xxd-option")) o.setAttribute("aria-selected", String(o === option));
    closePicker(picker, { focus: true });
  }
  const values = render(picker);
  emit(picker, "xxd:change", { value: picker.hasAttribute("data-multiple") ? values : values[0] });
}

export function initPickers(root) {
  for (const picker of root.querySelectorAll("[data-xxd-picker]")) {
    const { trigger, list } = parts(picker);
    if (!trigger || !list) continue;
    list.id ||= nextId("xxd-picker");
    list.setAttribute("role", "listbox");
    list.setAttribute("data-picker", "");
    if (picker.hasAttribute("data-multiple")) list.setAttribute("aria-multiselectable", "true");
    // 仅可选择的 combobox（APG Select-Only Combobox）：按钮本身是 combobox，高亮用 aria-activedescendant 指向选项
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-controls", list.id);
    trigger.setAttribute("aria-expanded", "false");
    trigger.type = "button";
    // 名字：字段名 + 当前值（「画质，高」）。字段名取 aria-labelledby，或者外层 .xxd-field 里的 .xxd-label
    const value = parts(picker).value;
    if (value) value.id ||= nextId("xxd-picker-value");
    if (!trigger.hasAttribute("aria-label")) {
      const label = trigger.getAttribute("aria-labelledby") || (() => {
        const el = picker.closest(".xxd-field")?.querySelector(".xxd-label");
        if (!el) return "";
        el.id ||= nextId("xxd-picker-label");
        return el.id;
      })();
      const ids = [...new Set([...label.split(/\s+/).filter(Boolean), value?.id].filter(Boolean))];
      if (ids.length) trigger.setAttribute("aria-labelledby", ids.join(" "));
    }
    for (const o of list.querySelectorAll(".xxd-option")) {
      o.id ||= nextId("xxd-opt");
      o.setAttribute("role", "option");
      if (!o.hasAttribute("aria-selected")) o.setAttribute("aria-selected", "false");
    }
    list.hidden = true;
    render(picker);
  }
}

let typed = "";
let typedAt = 0;

export function installPickers(root, closestFrom) {
  root.addEventListener("click", (event) => {
    const trigger = closestFrom(event, "[data-xxd-picker] > .xxd-picker__trigger");
    if (trigger) {
      const picker = trigger.parentElement;
      if (parts(picker).list.hidden) openPicker(picker);
      else closePicker(picker);
      return;
    }
    const option = closestFrom(event, "[data-xxd-picker] .xxd-option");
    if (option) return choose(option.closest("[data-xxd-picker]"), option);
    for (const open of root.querySelectorAll("[data-xxd-picker] > .xxd-picker__trigger[aria-expanded='true']")) {
      const picker = open.parentElement;
      if (!picker.contains(event.target)) closePicker(picker);
    }
  });
  root.addEventListener("pointermove", (event) => {
    const option = closestFrom(event, "[data-xxd-picker] .xxd-option");
    if (option && !option.hasAttribute("data-active") && option.getAttribute("aria-disabled") !== "true") setActive(option.closest("[data-xxd-picker]"), option);
  });
  root.addEventListener("keydown", (event) => {
    const picker = closestFrom(event, "[data-xxd-picker]");
    if (!picker) return;
    const { list } = parts(picker);
    const all = options(list);
    const active = list.querySelector(".xxd-option[data-active]");
    const i = all.indexOf(active);
    const open = !list.hidden;
    const k = event.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      event.preventDefault();
      if (!open) return openPicker(picker);
      setActive(picker, all[(i + (k === "ArrowDown" ? 1 : -1) + all.length) % all.length]);
    } else if (k === "Home" || k === "End") {
      if (!open) return;
      event.preventDefault();
      setActive(picker, k === "Home" ? all[0] : all[all.length - 1]);
    } else if (k === "Enter" || k === " ") {
      event.preventDefault();
      if (!open) return openPicker(picker);
      choose(picker, active);
    } else if (k === "Escape" && open) {
      event.preventDefault();
      closePicker(picker, { focus: true });
    } else if (k === "Tab" && open) {
      closePicker(picker);
    } else if (k.length === 1 && /\S/.test(k)) {
      // 输入首字跳转
      typed = Date.now() - typedAt > 600 ? k : typed + k;
      typedAt = Date.now();
      const hit = all.find((o) => o.textContent.trim().toLowerCase().startsWith(typed.toLowerCase()));
      if (hit) {
        if (!open) openPicker(picker);
        setActive(picker, hit);
      }
    }
  });
}

/* ── 密钥输入：[data-xxd-secret] 里的 [data-secret-toggle] 显示 / 隐藏，[data-secret-copy] 复制 ── */
const EYE = '<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter" aria-hidden="true"><path d="M3 12q9-13 18 0-9 13-18 0Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
const EYE_OFF = '<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter" aria-hidden="true"><path d="M9 6q6-2 12 6l-2 2.5M15 18q-6 2-12-6l2-2.5"/><path d="m3.5 3.5 17 17"/></svg>';

export function installSecrets(root, closestFrom) {
  root.addEventListener("click", async (event) => {
    const toggle = closestFrom(event, "[data-xxd-secret] [data-secret-toggle]");
    if (toggle) {
      const input = toggle.closest("[data-xxd-secret]").querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      // 名字固定（「显示密钥」），状态只靠 aria-pressed：不会念成「隐藏，已按下」这种反话
      toggle.setAttribute("aria-label", toggle.dataset.showLabel || t("showSecret", null, toggle));
      toggle.setAttribute("aria-pressed", String(show));
      toggle.innerHTML = show ? EYE_OFF : EYE;
      return;
    }
    const copy = closestFrom(event, "[data-xxd-secret] [data-secret-copy]");
    if (copy) {
      const input = copy.closest("[data-xxd-secret]").querySelector("input");
      if (await copyText(input.value)) showBubble(copy, copy.dataset.copyDone || t("copied", null, copy));
    }
  });
}
