// 表单（FORM-REVIEW-PLAN D97–D104）：字段出错、整张表单的校验、字数。
//   Xxd.setFieldError(control, "…")：错误放在整个控件下面（不进框、不进 label），出错时顶替说明；传 "" 清掉
//   <form data-xxd-validate>：提交时用原生约束（required / type / minlength / pattern / min / max / data-max）校验，
//     错误写在字段下面、焦点到第一个错；改对了马上清掉
//   <p class="xxd-help" data-counter>：跟着同一个字段里的输入框数字（emoji 算一个字）
import { byId, closestFrom, emit, nextId } from "./dom.js";
import { getLocale, t } from "./i18n.js";
import { announce } from "./announce.js";

// 控件「看得见的那个框」：错误放在它后面
const BOX = ".xxd-input-group, .xxd-taginput, .xxd-picker, .xxd-select, [data-xxd-combobox], .xxd-choice, .xxd-range-pair, .xxd-input-wrap";
const SCOPE = ".xxd-field, fieldset, [role=radiogroup], [role=group], .xxd-row";
const CONTROLS = "input:not([type=hidden], [type=submit], [type=button], [type=reset], [type=image]), textarea, select";

/** 传进来的可能是外面的框（输入组、自定义下拉）：换成里面真正的控件 */
function controlOf(el) {
  if (el.matches(".xxd-picker")) return el.querySelector(".xxd-picker__trigger") ?? el;
  if (el.matches(".xxd-input-group, .xxd-taginput, [data-xxd-combobox]")) return el.querySelector(CONTROLS) ?? el;
  return el;
}

/** 单选按组：一组里每个都标，错误放在组的最后 */
const groupOf = (ctl) => (ctl.type === "radio" ? ctl.closest("fieldset, [role=radiogroup]") : null);
const controlsOf = (ctl, group) => (group ? [...group.querySelectorAll('input[type="radio"]')].filter((r) => !ctl.name || r.name === ctl.name) : [ctl]);

function boxOf(ctl) {
  const scope = ctl.closest(SCOPE);
  let box = ctl;
  for (let el = ctl.parentElement, i = 0; el && el !== scope && i < 4; el = el.parentElement, i++) if (el.matches(BOX)) box = el;
  // 包着控件的别的 <label>（分页的「每页」）：错误放在 label 后面，不变成名字的一部分
  const label = box.parentElement?.closest("label");
  if (label && (!scope || (scope !== label && scope.contains(label)))) box = label;
  return box;
}

// 设置行（.xxd-row）里的控件：错误写在左边那一栏的说明下面（控件那一格很窄）
const rowTextOf = (ctl) => (ctl.closest(".xxd-field") ? null : ctl.closest(".xxd-row")?.querySelector(":scope > .xxd-row__text"));

const idsOf = (el) => (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
function setIds(el, ids) {
  if (ids.length) el.setAttribute("aria-describedby", [...new Set(ids)].join(" "));
  else el.removeAttribute("aria-describedby");
}

/** 已经有的错误：连在 describedby 里的、紧跟在框后面的、字段里只有这一个控件时字段里的那一行（作者自己写的） */
function findError(ctl, box, group) {
  for (const id of idsOf(ctl)) {
    const el = byId(ctl, id);
    if (el?.classList.contains("xxd-error")) return el;
  }
  const rowText = rowTextOf(ctl);
  const next = group ? group.querySelector(":scope > .xxd-error") : rowText ? rowText.querySelector(":scope > .xxd-error") : box.nextElementSibling;
  if (next?.classList.contains("xxd-error")) return next;
  const field = ctl.closest(".xxd-field");
  if (field && field.querySelectorAll(CONTROLS).length === 1) return field.querySelector(":scope > .xxd-error");
  return null;
}

// 出错时说明让位（D100）：describedby 里先拿掉说明（字数留着），清掉错误时放回去
function hideHelp(ctl) {
  const help = idsOf(ctl).filter((id) => byId(ctl, id)?.matches(".xxd-help:not([data-counter])"));
  if (!help.length) return;
  ctl.dataset.xxdHelp = [...new Set([...(ctl.dataset.xxdHelp || "").split(" ").filter(Boolean), ...help])].join(" ");
  setIds(ctl, idsOf(ctl).filter((id) => !help.includes(id)));
}

function restoreHelp(ctl) {
  if (!ctl.dataset.xxdHelp) return;
  setIds(ctl, [...ctl.dataset.xxdHelp.split(" "), ...idsOf(ctl)]);
  delete ctl.dataset.xxdHelp;
}

/**
 * 表单错误：Xxd.setFieldError(input, "请输入有效的邮箱")；传空字符串清掉。
 * 写 aria-invalid、在整个控件下面放一行 .xxd-error（有 id）并连进 aria-describedby；出错时说明让位。
 * 输入组、标签输入、自定义下拉可以传外面的框；单选传组里任意一个，整组一起标。
 */
export function setFieldError(target, message, { focus = false } = {}) {
  const ctl = controlOf(target);
  const doc = ctl.ownerDocument;
  const group = groupOf(ctl);
  const controls = controlsOf(ctl, group);
  const box = group ?? boxOf(ctl);
  let error = findError(ctl, box, group);
  if (!message) {
    for (const c of controls) {
      c.removeAttribute("aria-invalid");
      if (error) setIds(c, idsOf(c).filter((id) => id !== error.id));
      restoreHelp(c);
    }
    // 自己加的删掉；作者写的藏起来（它可能被别处引用）
    if (error?.hasAttribute("data-xxd-auto")) error.remove();
    else if (error) error.hidden = true;
    return null;
  }
  if (!error) {
    error = doc.createElement("p");
    error.className = "xxd-error";
    error.setAttribute("data-xxd-auto", "");
    const rowText = rowTextOf(ctl);
    if (group) group.append(error);
    else if (rowText) rowText.append(error);
    else box.after(error);
  }
  error.id ||= nextId("xxd-error");
  error.hidden = false;
  if (error.textContent !== message) error.textContent = message;
  for (const c of controls) {
    c.setAttribute("aria-invalid", "true");
    hideHelp(c);
    setIds(c, [...idsOf(c), error.id]);
  }
  if (focus) (controls.find((c) => c.checked) ?? controls[0]).focus();
  return error;
}

/* ── 整张表单 ── */

// 邮箱、网址、电话里的全角字母数字、全角空格、「。」：中文输入法常带出来，先换成半角（D104）
function halfWidth(ctl) {
  if (!["email", "url", "tel"].includes(ctl.type)) return;
  let v = ctl.value.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");
  if (ctl.type !== "tel") v = v.replace(/。/g, ".");
  v = v.trim();
  if (v !== ctl.value) ctl.value = v;
}

const length = (s) => Array.from(s).length;

function nameOf(ctl) {
  const field = ctl.closest(".xxd-field");
  const label = field?.querySelector(":scope > .xxd-label") ?? (ctl.type === "radio" ? groupOf(ctl)?.querySelector("legend") : null) ?? ctl.labels?.[0];
  const text = (label?.textContent || ctl.getAttribute("aria-label") || "").trim().replace(/[：:*＊]+$/, "").trim();
  // 英文句子中间：「Fill in email」（API、URL 这种全大写的不改）
  return text && getLocale(ctl) === "en" && /^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text;
}

/** 这个控件现在哪里不对：返回要显示的话，没问题返回 ""。normalize：先把全角换成半角（打字时复查不换，免得光标跳到最后） */
export function fieldProblem(ctl, { normalize = true } = {}) {
  if (ctl.disabled || ctl.closest("fieldset:disabled") || ctl.willValidate === false) return "";
  if (normalize) halfWidth(ctl);
  const v = ctl.validity;
  const d = ctl.dataset;
  const name = nameOf(ctl);
  const say = (kind, key, vars) => d[`error${kind}`] ?? d.error ?? t(key, { name: name || t("thisField", null, ctl), ...vars }, ctl);
  const n = length(ctl.value);
  // minlength / maxlength 只在用户改过之后浏览器才算：自己数（按字数，emoji 算一个）
  const min = ctl.minLength > 0 ? ctl.minLength : 0;
  const max = Number(d.max) > 0 ? Number(d.max) : 0;
  if (v.valueMissing) {
    if (ctl.type === "checkbox") return say("Required", "checkRequired");
    if (ctl.type === "radio" || ctl.tagName === "SELECT") return say("Required", "chooseRequired");
    return say("Required", "fieldRequired");
  }
  if (v.badInput) return say("Type", "numberInvalid");
  if (v.typeMismatch) return say("Type", ctl.type === "email" ? "emailInvalid" : ctl.type === "url" ? "urlInvalid" : "formatInvalid");
  if (min && n && n < min) return say("Short", "tooShort", { n: min, d: min - n });
  if ((max && n > max) || v.tooLong) return say("Long", "tooLong", { n: max || ctl.maxLength, d: n - (max || ctl.maxLength) });
  if (v.rangeUnderflow) return say("Min", "rangeUnder", { min: ctl.min });
  if (v.rangeOverflow) return say("Max", "rangeOver", { max: ctl.max });
  if (v.stepMismatch) return say("Step", "stepMismatch", { step: ctl.step });
  if (v.patternMismatch) return d.errorPattern ?? d.error ?? (ctl.title ? t("patternHint", { hint: ctl.title }, ctl) : say("Pattern", "formatInvalid"));
  if (v.customError) return ctl.validationMessage;
  return "";
}

function controlsIn(form) {
  const seen = new Set();
  return [...form.querySelectorAll(CONTROLS)].filter((c) => {
    if (c.type !== "radio") return true;
    const key = groupOf(c) ?? c.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 校验整张表单：每个错标在字段下面，焦点到第一个错，错了几处念一句。返回出错的控件（没错是空数组）。
 * 没写 data-xxd-validate 的表单也能直接调。
 */
export function validateForm(form, { focus = true } = {}) {
  const bad = [];
  for (const ctl of controlsIn(form)) {
    const message = fieldProblem(ctl);
    setFieldError(ctl, message);
    if (message) bad.push(ctl);
  }
  form.setAttribute("data-xxd-checked", "");
  if (bad.length) {
    if (focus) {
      const first = bad[0];
      const group = groupOf(first);
      (group ? (controlsOf(first, group).find((c) => c.checked) ?? first) : first).focus();
    }
    // 只有一处时焦点过去就会念出名字和错误；几处时再说一句有几处
    if (bad.length > 1) announce(t("formErrors", { n: bad.length }, form), { within: form });
    emit(form, "xxd:invalid", { controls: bad });
  }
  return bad;
}

/* ── 字数 ── */
function counterOf(ctl) {
  return ctl.closest(".xxd-field")?.querySelector(":scope > .xxd-help[data-counter]") ?? null;
}

function updateCounter(ctl, counter = counterOf(ctl)) {
  if (!counter) return;
  const max = Number(ctl.dataset.max) || (ctl.maxLength > 0 ? ctl.maxLength : 0);
  if (!max) return;
  const n = length(ctl.value);
  const over = n > max;
  counter.textContent = t("count", { n, max }, ctl);
  // 超出时念一次（不是每个字都念）
  if (over && !counter.hasAttribute("data-over")) announce(t("overBy", { n: n - max }, ctl), { within: ctl });
  counter.toggleAttribute("data-over", over);
}

export function initForms(root) {
  for (const form of root.querySelectorAll("form[data-xxd-validate]")) form.noValidate = true;
  for (const counter of root.querySelectorAll(".xxd-field > .xxd-help[data-counter]")) {
    const ctl = counter.parentElement.querySelector("input, textarea");
    if (ctl) updateCounter(ctl, counter);
  }
}

export function installForms(root) {
  // 捕获阶段：作者自己在 form 上的 submit 处理只在全对时才跑
  root.addEventListener(
    "submit",
    (event) => {
      const form = targetForm(event);
      if (!form) return;
      if (validateForm(form).length) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  // 还没 init 的表单（后插进来的）：浏览器提交前先发 invalid，不让它冒气泡，换成我们的
  // （init 过的表单 noValidate，这时的 invalid 来自作者自己调的 checkValidity，不管）
  root.addEventListener(
    "invalid",
    (event) => {
      const form = event.target.form;
      if (!form?.matches("[data-xxd-validate]") || form.noValidate) return;
      event.preventDefault();
      form.noValidate = true;
      if (form._xxdPending) return;
      form._xxdPending = true;
      queueMicrotask(() => {
        form._xxdPending = false;
        validateForm(form);
      });
    },
    true,
  );
  // 改对了马上清掉；没改对只更新说法，不新加错误（打字时不催）
  const recheck = (event) => {
    const ctl = closestFrom(event, CONTROLS);
    if (!ctl) return;
    if (event.type === "input") updateCounter(ctl);
    if (ctl.getAttribute("aria-invalid") !== "true" || !ctl.form?.matches("[data-xxd-validate][data-xxd-checked]")) return;
    setFieldError(ctl, fieldProblem(ctl, { normalize: false }));
  };
  root.addEventListener("input", recheck);
  root.addEventListener("change", recheck);
}

function targetForm(event) {
  const form = event.target;
  return form?.matches?.("form[data-xxd-validate]") ? form : null;
}
