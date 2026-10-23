// 搜索（⌘F / Esc + 匹配高亮）、标签输入、下拉选择（combobox）、命令面板。
import { place } from "./floating.js";
import { composing, defaultLayerRoot, emit, matchTheme, nextId } from "./dom.js";
import { openDialog, closeDialog } from "./dialog.js";
import { ICON } from "./icons-min.js";
import { fill$1, t } from "./i18n.js";
import { announce } from "./announce.js";

/* ── 搜索 ── */
/** 绑定一个搜索框：⌘F / Ctrl+F 跳到它，Esc 清空。onQuery(query) 在输入时调用。返回解绑函数。 */
export function bindSearch(input, { onQuery, hotkey = true, scope = globalThis } = {}) {
  const onInput = () => onQuery?.(input.value.trim());
  const onKey = (event) => {
    if (event.key === "Escape" && input.value && !composing(event)) {
      event.preventDefault();
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  const onHotkey = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      input.focus();
      input.select();
    }
  };
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKey);
  if (hotkey) scope.addEventListener("keydown", onHotkey);
  const clear = input.parentElement?.querySelector(".xxd-input-clear");
  const onClear = () => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  };
  clear?.addEventListener("click", onClear);
  return () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onKey);
    if (hotkey) scope.removeEventListener("keydown", onHotkey);
    clear?.removeEventListener("click", onClear);
  };
}

export function clearMarks(root) {
  for (const mark of root.querySelectorAll("mark.xxd-hit")) mark.replaceWith(...mark.childNodes);
  root.normalize();
}

/** 在 root 里把匹配的文字包进 <mark class="xxd-hit">。返回匹配数。 */
export function markMatches(root, query) {
  clearMarks(root);
  const q = String(query || "").trim().toLowerCase();
  if (!q) return 0;
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest("script, style, mark, input, textarea") || !node.nodeValue.toLowerCase().includes(q)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let count = 0;
  for (const node of nodes) {
    const text = node.nodeValue;
    const lower = text.toLowerCase();
    const frag = root.ownerDocument.createDocumentFragment();
    let from = 0;
    let at = lower.indexOf(q);
    while (at !== -1) {
      frag.append(text.slice(from, at));
      const mark = root.ownerDocument.createElement("mark");
      mark.className = "xxd-hit";
      mark.textContent = text.slice(at, at + q.length);
      frag.append(mark);
      count += 1;
      from = at + q.length;
      at = lower.indexOf(q, from);
    }
    frag.append(text.slice(from));
    node.replaceWith(frag);
  }
  return count;
}

/* ── 标签输入：.xxd-taginput[data-xxd-taginput] ── */
function chip(doc, value, removeLabel) {
  const el = doc.createElement("span");
  el.className = "xxd-chip";
  el.dataset.value = value;
  el.textContent = value;
  const x = doc.createElement("button");
  x.type = "button";
  x.setAttribute("aria-label", `${removeLabel} ${value}`);
  x.innerHTML = ICON.close(12);
  el.append(x);
  return el;
}

export function tagValues(box) {
  return [...box.querySelectorAll(":scope > .xxd-chip")].map((c) => c.dataset.value);
}

export function addTag(box, raw) {
  const value = String(raw).trim();
  if (!value || tagValues(box).includes(value)) return false;
  const input = box.querySelector(":scope > input");
  box.insertBefore(chip(box.ownerDocument, value, box.dataset.removeLabel || t("remove", null, box)), input);
  emit(box, "xxd:change", { value: tagValues(box) });
  return true;
}

export function installTagInputs(root, closestFrom) {
  root.addEventListener("keydown", (event) => {
    const input = closestFrom(event, ".xxd-taginput[data-xxd-taginput] > input");
    if (!input) return;
    const box = input.parentElement;
    if (composing(event)) return;
    if (event.key === "Enter" || event.key === "," || event.key === "，") {
      event.preventDefault();
      if (addTag(box, input.value)) input.value = "";
    } else if (event.key === "Backspace" && !input.value) {
      const last = box.querySelector(":scope > .xxd-chip:last-of-type");
      if (last) {
        last.remove();
        emit(box, "xxd:change", { value: tagValues(box) });
      }
    }
  });
  root.addEventListener("click", (event) => {
    const x = closestFrom(event, ".xxd-taginput[data-xxd-taginput] > .xxd-chip > button");
    if (x) {
      const box = x.closest(".xxd-taginput");
      x.parentElement.remove();
      emit(box, "xxd:change", { value: tagValues(box) });
      box.querySelector(":scope > input")?.focus();
      return;
    }
    const box = closestFrom(event, ".xxd-taginput[data-xxd-taginput]");
    if (box && event.target === box) box.querySelector(":scope > input")?.focus();
  });
}

/* ── Combobox：<div data-xxd-combobox><input class="xxd-input"><ul class="xxd-listbox" hidden><li class="xxd-option" data-value>…</li></ul></div> ── */
function cbParts(wrap) {
  return { input: wrap.querySelector("input"), list: wrap.querySelector(".xxd-listbox") };
}

function cbVisible(list) {
  return [...list.querySelectorAll(".xxd-option")].filter((o) => !o.hidden);
}

function cbSetActive(input, list, option) {
  for (const o of list.querySelectorAll(".xxd-option[data-active]")) o.removeAttribute("data-active");
  if (option) {
    option.setAttribute("data-active", "");
    input.setAttribute("aria-activedescendant", option.id);
    option.scrollIntoView?.({ block: "nearest" });
  } else input.removeAttribute("aria-activedescendant");
}

function cbOpen(wrap) {
  const { input, list } = cbParts(wrap);
  const raw = input.value.trim();
  const q = raw.toLowerCase();
  for (const o of list.querySelectorAll(".xxd-option:not([data-create])")) o.hidden = Boolean(q) && !o.textContent.toLowerCase().includes(q);
  // 分组：组里一个都不剩时整组藏起来
  for (const g of list.querySelectorAll(".xxd-option-group")) g.hidden = ![...g.querySelectorAll(".xxd-option")].some((o) => !o.hidden);
  // 「创建 xx」：data-creatable，且没有完全相同的项
  if (wrap.hasAttribute("data-creatable")) {
    let create = list.querySelector(".xxd-option[data-create]");
    const exact = [...list.querySelectorAll(".xxd-option:not([data-create])")].some((o) => o.textContent.trim().toLowerCase() === q);
    if (q && !exact) {
      if (!create) {
        create = document.createElement("li");
        create.className = "xxd-option";
        create.setAttribute("role", "option");
        create.setAttribute("data-create", "");
        create.id = nextId("xxd-option");
        list.prepend(create);
      }
      create.dataset.value = raw;
      create.textContent = wrap.dataset.createLabel ? fill$1(wrap.dataset.createLabel, raw) : t("createOption", { value: raw }, wrap);
      create.hidden = false;
    } else if (create) create.hidden = true;
  }
  list.hidden = cbVisible(list).length === 0;
  input.setAttribute("aria-expanded", String(!list.hidden));
  if (list.hidden) cbSetActive(input, list, null);
  // 筛选后的条数念出来（停下来 300ms 再念，不跟着每个字念）
  clearTimeout(wrap._announceTimer);
  // 300ms 后才播报：那时组件已经不在页面上（关了、换页了）就不播，免得盖掉别处的播报
  if (raw) wrap._announceTimer = setTimeout(() => wrap.isConnected && announce(list.hidden ? t("commandEmpty", null, wrap) : t("resultsCount", { n: cbVisible(list).filter((o) => !o.hasAttribute("data-create")).length }, wrap), { within: wrap }), 300);
  if (!list.hidden) {
    list.style.minWidth = `${input.offsetWidth}px`;
    place(input, list, { placement: "bottom-start", offset: 4 });
  }
}

function cbClose(wrap) {
  const { input, list } = cbParts(wrap);
  list.hidden = true;
  input.setAttribute("aria-expanded", "false");
  cbSetActive(input, list, null);
}

function cbChoose(wrap, option) {
  const { input, list } = cbParts(wrap);
  const value = option.dataset.value ?? option.textContent.trim();
  const label = option.hasAttribute("data-create") ? value : option.dataset.label ?? option.textContent.trim();
  if (option.hasAttribute("data-create")) {
    // 新建的项留在列表里
    const added = document.createElement("li");
    added.className = "xxd-option";
    added.setAttribute("role", "option");
    added.id = nextId("xxd-option");
    added.dataset.value = value;
    added.textContent = value;
    option.after(added);
    option.hidden = true;
    option = added;
  }
  if (wrap.hasAttribute("data-multiple")) {
    // 多选：选中的变成输入框前面的 chip（同 .xxd-taginput），列表不关
    const box = wrap.querySelector(".xxd-taginput");
    if (box && addTag(box, label)) option.setAttribute("aria-selected", "true");
    input.value = "";
    cbOpen(wrap);
    emit(wrap, "xxd:change", { value: tagValues(box) });
    return;
  }
  for (const o of list.querySelectorAll(".xxd-option")) o.setAttribute("aria-selected", String(o === option));
  input.value = label;
  wrap.dataset.value = value;
  cbClose(wrap);
  emit(wrap, "xxd:change", { value, label });
}

export function initComboboxes(root) {
  for (const wrap of root.querySelectorAll("[data-xxd-combobox]")) {
    const { input, list } = cbParts(wrap);
    if (!input || !list) continue;
    list.id ||= nextId("xxd-listbox");
    list.setAttribute("role", "listbox");
    if (wrap.hasAttribute("data-multiple")) list.setAttribute("aria-multiselectable", "true");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.autocomplete = "off";
    for (const o of list.querySelectorAll(".xxd-option")) {
      o.id ||= nextId("xxd-option");
      o.setAttribute("role", "option");
    }
    list.hidden = true;
  }
}

function cbRemoveChip(wrap, chipEl) {
  const box = wrap.querySelector(".xxd-taginput");
  const value = chipEl.dataset.value;
  chipEl.remove();
  for (const o of wrap.querySelectorAll(".xxd-option")) if ((o.dataset.value ?? o.textContent.trim()) === value) o.setAttribute("aria-selected", "false");
  emit(wrap, "xxd:change", { value: tagValues(box) });
}

export function installComboboxes(root, closestFrom) {
  // 多选：chip 上的 × 和空输入框里的退格
  root.addEventListener("click", (event) => {
    const x = closestFrom(event, "[data-xxd-combobox][data-multiple] .xxd-chip > button");
    if (!x) return;
    const wrap = x.closest("[data-xxd-combobox]");
    cbRemoveChip(wrap, x.parentElement);
    cbParts(wrap).input.focus();
  });
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Backspace" || composing(event)) return;
    const wrap = closestFrom(event, "[data-xxd-combobox][data-multiple]");
    if (!wrap || cbParts(wrap).input.value) return;
    const last = wrap.querySelector(".xxd-taginput > .xxd-chip:last-of-type");
    if (last) cbRemoveChip(wrap, last);
  });
  root.addEventListener("input", (event) => {
    const wrap = closestFrom(event, "[data-xxd-combobox]");
    if (wrap) cbOpen(wrap);
  });
  root.addEventListener("focusin", (event) => {
    const wrap = closestFrom(event, "[data-xxd-combobox]");
    if (wrap && event.target === cbParts(wrap).input) cbOpen(wrap);
  });
  root.addEventListener("focusout", (event) => {
    const wrap = closestFrom(event, "[data-xxd-combobox]");
    if (wrap && !wrap.contains(event.relatedTarget)) setTimeout(() => cbClose(wrap), 120);
  });
  root.addEventListener("pointerdown", (event) => {
    const option = closestFrom(event, "[data-xxd-combobox] .xxd-option");
    if (option) {
      event.preventDefault();
      cbChoose(option.closest("[data-xxd-combobox]"), option);
    }
  });
  root.addEventListener("keydown", (event) => {
    const wrap = closestFrom(event, "[data-xxd-combobox]");
    if (!wrap || composing(event)) return;
    const { input, list } = cbParts(wrap);
    const options = cbVisible(list);
    const active = list.querySelector(".xxd-option[data-active]");
    const i = options.indexOf(active);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (list.hidden) cbOpen(wrap);
      const next = event.key === "ArrowDown" ? options[(i + 1) % options.length] : options[(i - 1 + options.length) % options.length];
      cbSetActive(input, list, next);
    } else if (event.key === "Enter" && active && !list.hidden) {
      event.preventDefault();
      cbChoose(wrap, active);
    } else if (event.key === "Escape" && !list.hidden) {
      event.preventDefault();
      cbClose(wrap);
    }
  });
}

/* ── 命令面板：openCommandPalette({ items: [{ id, label, hint, keywords, run }] }) ── */
/**
 * items: [{ id, label, hint, keywords, group, run }]；group 相同的放在一起，带组标题。
 * recentKey：记住最近运行的命令（localStorage），没有输入时排在最前「最近使用」。
 * loading：true 时显示「正在加载…」（异步命令列表）；之后 palette.setItems(items) 换上真的。
 */
export function openCommandPalette({ items = [], placeholder = t("commandPlaceholder"), empty = t("commandEmpty"), within = defaultLayerRoot(), recentKey, recentLabel = t("recent"), loading = false, loadingLabel = t("loading") } = {}) {
  const doc = within.ownerDocument;
  const dialog = doc.createElement("dialog");
  dialog.className = "xxd-dialog xxd-palette";
  dialog.setAttribute("data-light-dismiss", "");
  dialog.setAttribute("aria-label", placeholder);
  const listId = nextId("xxd-palette");
  dialog.innerHTML = `<div class="xxd-palette__search">${ICON.search(16)}<input type="text" role="combobox" aria-expanded="true" aria-controls="${listId}" aria-autocomplete="list"></div><ul class="xxd-palette__list" role="listbox" id="${listId}"></ul>`;
  const input = dialog.querySelector("input");
  input.placeholder = placeholder;
  const list = dialog.querySelector("ul");
  let shown = [];
  let active = 0;

  const readRecent = () => {
    try {
      return JSON.parse(localStorage.getItem(recentKey) || "[]");
    } catch {
      return [];
    }
  };
  const render = () => {
    const q = input.value.trim().toLowerCase();
    if (loading) {
      list.innerHTML = `<li class="xxd-palette__empty"><span class="xxd-spinner" aria-hidden="true"></span> </li>`;
      list.firstChild.append(loadingLabel);
      shown = [];
      return;
    }
    // 每个词都要出现（「dark mode」能匹配 dark-mode；「日历 添加」两个词都要有）
    const words = q.split(/\s+/).filter(Boolean);
    shown = items.filter((it) => {
      if (!words.length) return true;
      const hay = `${it.label} ${it.keywords ?? ""} ${it.hint ?? ""} ${it.group ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    if (!q && recentKey) {
      const recent = readRecent();
      const recentItems = recent.map((key) => items.find((it) => (it.id ?? it.label) === key)).filter(Boolean).map((it) => ({ ...it, group: recentLabel }));
      shown = [...recentItems, ...shown.filter((it) => !recent.includes(it.id ?? it.label))];
    }
    // 按组排：保持第一次出现的顺序
    const order = [...new Set(shown.map((it) => it.group ?? ""))];
    shown = order.flatMap((g) => shown.filter((it) => (it.group ?? "") === g));
    active = Math.min(active, Math.max(0, shown.length - 1));
    let lastGroup = null;
    let groupBox = null;
    // 有组名的放进 role=group（组名是它的名字），读屏念「最近使用，组」；没组名的直接放在列表里
    list.replaceChildren(
      ...shown.flatMap((it, i) => {
        const nodes = [];
        if ((it.group ?? "") !== lastGroup) {
          groupBox = null;
          if (it.group) {
            const group = doc.createElement("li");
            group.className = "xxd-option-group";
            group.setAttribute("role", "group");
            const label = doc.createElement("div");
            label.className = "xxd-option-group__label";
            label.id = `${listId}-g${i}`;
            label.textContent = it.group;
            group.setAttribute("aria-labelledby", label.id);
            groupBox = doc.createElement("ul");
            groupBox.setAttribute("role", "none");
            groupBox.style.cssText = "margin:0;padding:0;list-style:none";
            group.append(label, groupBox);
            nodes.push(group);
          }
        }
        lastGroup = it.group ?? "";
        const li = doc.createElement("li");
        li.className = "xxd-option";
        li.id = `${listId}-${i}`;
        li.setAttribute("role", "option");
        if (i === active) li.setAttribute("data-active", "");
        li.textContent = it.label;
        if (it.hint) {
          const hint = doc.createElement("span");
          hint.className = "xxd-option__hint";
          hint.textContent = it.hint;
          li.append(hint);
        }
        li.addEventListener("click", () => run(i));
        if (groupBox) groupBox.append(li);
        else nodes.push(li);
        return nodes;
      }),
    );
    if (!shown.length) {
      const li = doc.createElement("li");
      li.className = "xxd-palette__empty";
      li.textContent = empty;
      list.append(li);
    }
    // 没有结果时去掉 aria-activedescendant（空字符串是无效引用）
    if (shown.length) input.setAttribute("aria-activedescendant", `${listId}-${active}`);
    else input.removeAttribute("aria-activedescendant");
    // 结果条数念出来（停下来 300ms 再念）
    clearTimeout(dialog._announceTimer);
    if (input.value.trim()) dialog._announceTimer = setTimeout(() => dialog.isConnected && dialog.open !== false && announce(shown.length ? t("resultsCount", { n: shown.length }, dialog) : empty, { within: dialog }), 300);
  };
  const run = (i) => {
    const item = shown[i];
    if (item && recentKey) {
      const key = item.id ?? item.label;
      try {
        localStorage.setItem(recentKey, JSON.stringify([key, ...readRecent().filter((k) => k !== key)].slice(0, 5)));
      } catch {
        /* 存不了就不记 */
      }
    }
    closeDialog(dialog, "run");
    item?.run?.();
  };
  input.addEventListener("input", () => {
    active = 0;
    render();
  });
  input.addEventListener("keydown", (event) => {
    if (composing(event)) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!shown.length) return;
      active = (active + (event.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length;
      render();
      list.querySelector(`#${listId}-${active}`)?.scrollIntoView?.({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(active);
    }
  });
  dialog.addEventListener("close", () => setTimeout(() => dialog.remove(), 200), { once: true });
  matchTheme(dialog);
  within.append(dialog);
  render();
  openDialog(dialog);
  input.focus();
  dialog.setItems = (next) => {
    items = next;
    loading = false;
    render();
  };
  return dialog;
}

/** ⌘K / Ctrl+K 打开命令面板。返回解绑函数。 */
export function bindCommandPalette(getItems, { key = "k", ...options } = {}) {
  const handler = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key) {
      event.preventDefault();
      openCommandPalette({ items: typeof getItems === "function" ? getItems() : getItems, ...options });
    }
  };
  globalThis.addEventListener("keydown", handler);
  return () => globalThis.removeEventListener("keydown", handler);
}

