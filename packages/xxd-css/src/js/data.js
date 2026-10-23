// 数据类组件的行为：表格（全选 / 排序 / 拖列宽 / 固定列阴影）、分页渲染、区间滑块、代码高亮。
import { emit } from "./dom.js";
import { t } from "./i18n.js";

/* ── 表格 ──
 * 全选：<th class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-all></th>，每行 <input class="xxd-check" data-select-row>
 * 排序：<th aria-sort="none"><button class="xxd-th-sort">名称</button></th> → 派发 xxd:sort { key, direction }
 * 拖列宽：<th>名称<span class="xxd-th-resize"></span></th> */
function rowChecks(table) {
  return [...table.querySelectorAll("tbody [data-select-row]")];
}

export function syncSelectAll(table) {
  const all = table.querySelector("[data-select-all]");
  const rows = rowChecks(table);
  const on = rows.filter((r) => r.checked).length;
  if (all) {
    all.checked = on > 0 && on === rows.length;
    all.indeterminate = on > 0 && on < rows.length;
  }
  for (const r of rows) r.closest("tr")?.setAttribute("aria-selected", String(r.checked));
  return on;
}

const COL_MIN = 48;
const COL_MAX = 800;
/** 拖列宽的把手：键盘也能用（role=separator，← → 每次 16px，Home / End 最窄 / 最宽，双击恢复）。 */
function initColumnResizers(root) {
  for (const h of root.querySelectorAll(".xxd-th-resize")) {
    const th = h.closest("th");
    if (!th) continue;
    h.setAttribute("role", "separator");
    h.setAttribute("aria-orientation", "vertical");
    h.tabIndex = 0;
    const name = th.querySelector(".xxd-th-sort")?.textContent.trim() || th.textContent.trim();
    if (!h.hasAttribute("aria-label")) h.setAttribute("aria-label", t("resizeColumn", { name }, th));
    h.setAttribute("aria-valuemin", String(COL_MIN));
    h.setAttribute("aria-valuemax", String(COL_MAX));
    h.setAttribute("aria-valuenow", String(Math.round(th.getBoundingClientRect().width) || COL_MIN));
  }
}

function setColumnWidth(handle, width) {
  const th = handle.closest("th");
  const w = Math.min(COL_MAX, Math.max(COL_MIN, Math.round(width)));
  th.style.width = `${w}px`;
  handle.setAttribute("aria-valuenow", String(w));
}

export function initData(root) {
  initColumnResizers(root);
  for (const table of root.querySelectorAll(".xxd-table")) if (table.querySelector("[data-select-all]")) syncSelectAll(table);
  for (const wrap of root.querySelectorAll(".xxd-table-wrap")) watchStickyEdges(wrap);
  for (const pair of root.querySelectorAll(".xxd-range-pair")) syncRangePair(pair);
  for (const r of root.querySelectorAll(".xxd-range[data-fill]")) syncFill(r);
  for (const el of root.querySelectorAll(".xxd-code[data-highlight] code, code.xxd-code[data-highlight]")) highlight(el);
  for (const el of root.querySelectorAll("[data-xxd-pagination]")) renderPagination(el);
  // 能横向滚动的代码块 / 表格：里面没有能聚焦的东西时，键盘也要能进去滚（WCAG 2.1.1）
  for (const el of root.querySelectorAll("pre.xxd-code, .xxd-table-wrap")) {
    if (el.hasAttribute("tabindex") || el.querySelector("a[href], button, input, select, textarea, [tabindex]")) continue;
    el.tabIndex = 0;
  }
}

const stickyWatched = new WeakSet();
function watchStickyEdges(wrap) {
  if (stickyWatched.has(wrap)) return;
  stickyWatched.add(wrap);
  const update = () => {
    wrap.toggleAttribute("data-scrolled-x", wrap.scrollLeft > 0);
    wrap.toggleAttribute("data-scrollable-end", wrap.scrollWidth - wrap.clientWidth - wrap.scrollLeft > 1);
  };
  update();
  wrap.addEventListener("scroll", update, { passive: true });
}

/* ── 分页：<nav class="xxd-pagination" data-xxd-pagination data-page="3" data-total="230" data-per-page="20"> → 生成按钮；派发 xxd:change { page } ── */
export function pageList(page, pages, around = 1) {
  const out = [];
  for (let p = 1; p <= pages; p += 1) {
    if (p === 1 || p === pages || Math.abs(p - page) <= around) out.push(p);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

const CHEV = (d) => `<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter" aria-hidden="true"><path d="${d}"/></svg>`;

export function renderPagination(nav, { page = Number(nav.dataset.page) || 1, total = Number(nav.dataset.total) || 0, perPage = Number(nav.dataset.perPage) || 20 } = {}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  nav.dataset.page = String(current);
  nav.dataset.total = String(total);
  nav.dataset.perPage = String(perPage);
  const prev = `<button type="button" data-page-to="${current - 1}" data-role="prev" aria-label="${t("prevPage", null, nav)}" ${current === 1 ? "disabled" : ""}>${CHEV("m15 6-6 6 6 6")}</button>`;
  const next = `<button type="button" data-page-to="${current + 1}" data-role="next" aria-label="${t("nextPage", null, nav)}" ${current === pages ? "disabled" : ""}>${CHEV("m9 6 6 6-6 6")}</button>`;
  const middle = pageList(current, pages)
    .map((p) => (p === "…" ? `<span class="xxd-pagination__gap">…</span>` : `<button type="button" data-page-to="${p}" ${p === current ? 'aria-current="page"' : ""}>${p}</button>`))
    .join("");
  // 窄的时候只显示这一段（CSS 的容器查询）：「3 / 12」，读屏也读得到当前页
  const status = `<span class="xxd-pagination__status">${current} / ${pages}</span>`;
  // 整段重建会把焦点丢到 body：记下焦点在哪个按钮上，重建后放回去（变成禁用的话放到当前页）
  const had = nav.contains(document.activeElement) ? document.activeElement : null;
  const role = had?.dataset.role;
  nav.innerHTML = prev + status + middle + next;
  if (had) {
    const again = role ? nav.querySelector(`[data-role="${role}"]:not(:disabled)`) : null;
    (again || nav.querySelector('[aria-current="page"]'))?.focus();
  }
  const info = nav.parentElement?.querySelector(".xxd-pagination__info");
  if (info) info.textContent = total ? `${(current - 1) * perPage + 1}–${Math.min(total, current * perPage)} / ${total}` : "0 / 0";
  return { page: current, pages };
}

/* ── 区间滑块：<div class="xxd-range-pair"><input type="range" class="xxd-range" data-role="from"><input … data-role="to"></div> ── */
export function syncRangePair(pair, moved) {
  const [a, b] = pair.querySelectorAll(".xxd-range");
  if (!a || !b) return null;
  const min = Number(a.min || 0);
  const max = Number(a.max || 100);
  let from = Number(a.value);
  let to = Number(b.value);
  if (from > to) {
    if (moved === b) b.value = String((to = from));
    else a.value = String((from = to));
  }
  const pct = (v) => ((v - min) / (max - min || 1)) * 100;
  pair.style.setProperty("--from", String(pct(from)));
  pair.style.setProperty("--to", String(pct(to)));
  const out = pair.parentElement?.querySelector(".xxd-range-value");
  if (out) out.textContent = `${from} – ${to}`;
  return [from, to];
}

function syncFill(range) {
  const min = Number(range.min || 0);
  const max = Number(range.max || 100);
  range.style.setProperty("--fill", String(((Number(range.value) - min) / (max - min || 1)) * 100));
}

/* ── 代码高亮（轻量，不引外部库）：js / ts / json / css / html / bash；Xxd.highlight(codeEl, lang?) ── */
const KEYWORDS = new Set("const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof in of null undefined true false this yield".split(" "));
const BASH = new Set("pnpm npm npx node cd git ls cat echo export source".split(" "));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function highlightText(text, lang = "js") {
  if (lang === "html") {
    return esc(text).replace(/(&lt;\/?)([\w-]+)([^&]*?)(\/?&gt;)/g, (_, open, tag, attrs, close) =>
      `<span class="tok-p">${open}</span><span class="tok-t">${tag}</span>${attrs.replace(/([\w-]+)(=)("[^"]*")/g, '<span class="tok-k">$1</span><span class="tok-p">$2</span><span class="tok-s">$3</span>')}<span class="tok-p">${close}</span>`);
  }
  if (lang === "css") {
    return esc(text)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-c">$1</span>')
      .replace(/(--[\w-]+)/g, '<span class="tok-n">$1</span>')
      .replace(/([\w-]+)(\s*:)(?![^<]*>)/g, '<span class="tok-k">$1</span>$2');
  }
  const re = lang === "bash"
    ? /(#.*$)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|(--?[\w-]+)|(\b[\w-]+\b)/gm
    : /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([{}()[\];,.:=<>+\-*/!?&|]+)|(\b[\w$]+\b)/gm;
  let out = "";
  let last = 0;
  for (const m of text.matchAll(re)) {
    out += esc(text.slice(last, m.index));
    const [whole, comment, str, num, punct, word] = m;
    if (comment) out += `<span class="tok-c">${esc(comment)}</span>`;
    else if (str) out += `<span class="tok-s">${esc(str)}</span>`;
    else if (num) out += `<span class="tok-n">${num}</span>`;
    else if (punct) out += lang === "bash" ? `<span class="tok-n">${esc(punct)}</span>` : `<span class="tok-p">${esc(punct)}</span>`;
    else if (word && (lang === "bash" ? BASH.has(word) : KEYWORDS.has(word))) out += `<span class="tok-k">${word}</span>`;
    else out += esc(whole);
    last = m.index + whole.length;
  }
  return out + esc(text.slice(last));
}

export function highlight(el, lang = el.dataset.lang || el.closest("[data-lang]")?.dataset.lang || "js") {
  if (el.dataset.highlighted) return el;
  const text = el.textContent;
  const html = highlightText(text, lang);
  const pre = el.closest(".xxd-code");
  // 行号：每行一个块；换行符放进行里（夹在块之间会多出一个空行），复制出来仍然是原来的代码
  const lines = html.split("\n");
  el.innerHTML = pre?.hasAttribute("data-lines") ? lines.map((l, i) => `<span class="line">${l}${i < lines.length - 1 ? "\n" : ""}</span>`).join("") : html;
  el.dataset.highlighted = "1";
  return el;
}

export function installData(root, closestFrom) {
  root.addEventListener("change", (event) => {
    const all = closestFrom(event, "[data-select-all]");
    if (all) {
      const table = all.closest(".xxd-table");
      for (const r of rowChecks(table)) r.checked = all.checked;
      const n = syncSelectAll(table);
      emit(table, "xxd:select", { count: n });
      return;
    }
    const row = closestFrom(event, "[data-select-row]");
    if (row) {
      const table = row.closest(".xxd-table");
      emit(table, "xxd:select", { count: syncSelectAll(table) });
    }
  });
  root.addEventListener("input", (event) => {
    const range = closestFrom(event, ".xxd-range");
    if (!range) return;
    const pair = range.closest(".xxd-range-pair");
    if (pair) {
      const v = syncRangePair(pair, range);
      emit(pair, "xxd:change", { value: v });
    } else if (range.hasAttribute("data-fill")) syncFill(range);
  });
  root.addEventListener("click", (event) => {
    const sort = closestFrom(event, "th > .xxd-th-sort");
    if (sort) {
      const th = sort.parentElement;
      const next = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
      for (const other of th.parentElement.querySelectorAll("th[aria-sort]")) other.setAttribute("aria-sort", "none");
      th.setAttribute("aria-sort", next);
      emit(th.closest(".xxd-table"), "xxd:sort", { key: th.dataset.key ?? sort.textContent.trim(), direction: next });
      return;
    }
    const to = closestFrom(event, "[data-xxd-pagination] [data-page-to]");
    if (to && !to.disabled) {
      const nav = to.closest("[data-xxd-pagination]");
      const { page } = renderPagination(nav, { page: Number(to.dataset.pageTo) });
      emit(nav, "xxd:change", { page });
    }
  });
  root.addEventListener("change", (event) => {
    const size = closestFrom(event, ".xxd-pagination__size select");
    if (!size) return;
    const nav = size.closest(".xxd-pagination-bar")?.querySelector("[data-xxd-pagination]");
    if (!nav) return;
    const { page } = renderPagination(nav, { page: 1, perPage: Number(size.value) });
    emit(nav, "xxd:change", { page, perPage: Number(size.value) });
  });
  root.addEventListener("pointerdown", (event) => {
    const handle = closestFrom(event, ".xxd-th-resize");
    if (!handle) return;
    event.preventDefault();
    const th = handle.closest("th");
    const startX = event.clientX;
    const startW = th.getBoundingClientRect().width;
    handle.setAttribute("data-active", "");
    handle.setPointerCapture?.(event.pointerId);
    const move = (e) => setColumnWidth(handle, startW + e.clientX - startX);
    handle.addEventListener("pointermove", move);
    handle.addEventListener(
      "pointerup",
      () => {
        handle.removeAttribute("data-active");
        handle.removeEventListener("pointermove", move);
      },
      { once: true },
    );
  });
  root.addEventListener("keydown", (event) => {
    const handle = closestFrom(event, ".xxd-th-resize");
    if (!handle) return;
    const th = handle.closest("th");
    const w = th.getBoundingClientRect().width;
    const next = { ArrowLeft: w - 16, ArrowRight: w + 16, Home: COL_MIN, End: COL_MAX }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setColumnWidth(handle, next);
  });
  root.addEventListener("dblclick", (event) => {
    const handle = closestFrom(event, ".xxd-th-resize");
    if (!handle) return;
    handle.closest("th").style.width = "";
    handle.setAttribute("aria-valuenow", String(Math.round(handle.closest("th").getBoundingClientRect().width)));
  });
}
