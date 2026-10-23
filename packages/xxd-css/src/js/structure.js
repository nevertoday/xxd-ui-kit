// 结构类组件的行为：侧栏（折叠 / 子菜单 / 拖宽）、工具条键盘、文章目录高亮、面包屑折叠、横幅关闭、tab 溢出。
import { emit } from "./dom.js";
import { t } from "./i18n.js";

/* ── 侧栏 ── */
export function toggleSidebar(sidebar, collapsed = !sidebar.hasAttribute("data-collapsed")) {
  sidebar.toggleAttribute("data-collapsed", collapsed);
  // 折叠时每个项的名字变成 tooltip
  for (const item of sidebar.querySelectorAll(".xxd-sidebar__item")) {
    const label = item.querySelector(":scope > span:not(.xxd-badge)")?.textContent.trim();
    if (!label) continue;
    if (collapsed) {
      item.setAttribute("data-tooltip", label);
      item.setAttribute("data-tooltip-placement", "right");
      if (!item.getAttribute("aria-label")) {
        item.setAttribute("aria-label", label);
        item.setAttribute("data-auto-label", "");
      }
    } else {
      item.removeAttribute("data-tooltip");
      if (item.hasAttribute("data-auto-label")) {
        item.removeAttribute("aria-label");
        item.removeAttribute("data-auto-label");
      }
    }
  }
  // 名字固定成「侧栏」，展开 / 折叠只靠 aria-expanded（不会展开着还念「折叠侧栏」）
  for (const btn of document.querySelectorAll(`[data-xxd-sidebar-toggle="${sidebar.id}"]`)) {
    btn.setAttribute("aria-expanded", String(!collapsed));
    if (!btn.dataset.keepLabel) btn.setAttribute("aria-label", t("sidebar", null, btn));
  }
  emit(sidebar, "xxd:change", { collapsed });
}

/* ── 工具条：roving tabindex，← → Home End ── */
function toolbarItems(bar) {
  return [...bar.querySelectorAll(".xxd-toolbar__item, :scope > .xxd-btn, :scope > input")].filter((el) => !el.disabled && el.closest(".xxd-toolbar") === bar);
}

export function initStructure(root) {
  for (const bar of root.querySelectorAll(".xxd-toolbar[role='toolbar']")) {
    const items = toolbarItems(bar);
    if (!items.some((i) => i.tabIndex === 0)) items.forEach((el, n) => (el.tabIndex = n === 0 ? 0 : -1));
  }
  for (const s of root.querySelectorAll("[data-xxd-sidebar][data-collapsed]")) toggleSidebar(s, true);
  // 一开始就展开的侧栏：折叠按钮也要一开始就有 aria-expanded 和固定的名字（以前要点过一次才有，ACCEPTANCE-REVIEW）
  for (const s of root.querySelectorAll("[data-xxd-sidebar]:not([data-collapsed])")) {
    if (!s.id) continue;
    for (const btn of root.querySelectorAll(`[data-xxd-sidebar-toggle="${s.id}"]`)) {
      btn.setAttribute("aria-expanded", "true");
      if (!btn.dataset.keepLabel) btn.setAttribute("aria-label", t("sidebar", null, btn));
    }
  }
  // 拖侧栏宽度的把手：键盘也能用
  for (const h of root.querySelectorAll("[data-sidebar-resize]")) {
    const sidebar = h.closest("[data-xxd-sidebar]");
    if (!sidebar) continue;
    h.setAttribute("role", "separator");
    h.setAttribute("aria-orientation", "vertical");
    h.tabIndex = 0;
    if (!h.hasAttribute("aria-label")) h.setAttribute("aria-label", t("resizeSidebar", null, sidebar));
    h.setAttribute("aria-valuemin", String(Number(sidebar.dataset.min) || 200));
    h.setAttribute("aria-valuemax", String(Number(sidebar.dataset.max) || 400));
    h.setAttribute("aria-valuenow", String(Math.round(sidebar.getBoundingClientRect().width) || Number(sidebar.dataset.min) || 200));
  }
  for (const list of root.querySelectorAll(".xxd-tabs")) watchTabsOverflow(list);
  for (const crumbs of root.querySelectorAll(".xxd-breadcrumbs[data-collapse]")) collapseBreadcrumbs(crumbs);
  for (const toc of root.querySelectorAll(".xxd-toc[data-spy]")) spyToc(toc);
}

/* ── tab 溢出：两端渐隐，选中项滚进视野 ── */
const watched = new WeakSet();
export function watchTabsOverflow(list) {
  const update = () => {
    const max = list.scrollWidth - list.clientWidth;
    list.toggleAttribute("data-overflow-start", list.scrollLeft > 2);
    list.toggleAttribute("data-overflow-end", max - list.scrollLeft > 2);
  };
  update();
  if (watched.has(list)) return;
  watched.add(list);
  list.addEventListener("scroll", update, { passive: true });
  list.addEventListener("xxd:change", () => {
    list.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    requestAnimationFrame(update);
  });
  if (typeof ResizeObserver === "function") new ResizeObserver(update).observe(list);
}

/* ── 面包屑：超过 data-collapse（缺省 4）项时，中间折叠成「…」，点开是菜单 ── */
export function collapseBreadcrumbs(crumbs) {
  const max = Number(crumbs.dataset.collapse) || 4;
  const items = [...crumbs.children].filter((li) => !li.classList.contains("xxd-breadcrumbs__gap"));
  if (items.length <= max || crumbs.querySelector(".xxd-breadcrumbs__gap")) return;
  const hidden = items.slice(1, items.length - (max - 2));
  const gap = document.createElement("li");
  gap.className = "xxd-breadcrumbs__gap";
  const id = `crumbs-${Math.random().toString(36).slice(2, 8)}`;
  gap.innerHTML = `<button class="xxd-breadcrumbs__more" data-xxd-menu="${id}" aria-label="${t("showLevels", { n: hidden.length }, crumbs)}">…</button><div class="xxd-menu" id="${id}" role="menu" popover></div>`;
  const menu = gap.querySelector(".xxd-menu");
  for (const li of hidden) {
    const a = li.querySelector("a");
    const item = document.createElement(a ? "a" : "span");
    item.className = "xxd-menu__item";
    item.setAttribute("role", "menuitem");
    if (a) item.href = a.href;
    // 没有链接的那一级也要能用方向键走到
    else item.tabIndex = -1;
    item.textContent = li.textContent.trim();
    menu.append(item);
    li.hidden = true;
  }
  items[0].after(gap);
}

/* ── 文章目录：滚动到哪一节，哪一项 aria-current ── */
const spying = new WeakMap();
export function spyToc(toc) {
  // 同一个目录再调一次（init 会被重复调用）：先停掉上一个观察者，不叠加
  spying.get(toc)?.disconnect();
  spying.delete(toc);
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const scope = toc.getRootNode?.() ?? document;
  const find = (id) => (scope.getElementById ? scope.getElementById(id) : document.getElementById(id));
  const targets = links.map((a) => find(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  if (!targets.length || typeof IntersectionObserver !== "function") return;
  const visible = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      const current = targets.find((t) => visible.has(t)) || null;
      if (!current) return;
      for (const a of links) a.setAttribute("aria-current", String(a.hash.slice(1) === current.id));
    },
    { rootMargin: "-56px 0px -60% 0px" },
  );
  targets.forEach((t) => io.observe(t));
  spying.set(toc, io);
}

export function installStructure(root, byId, closestFrom) {
  root.addEventListener("click", (event) => {
    const toggle = closestFrom(event, "[data-xxd-sidebar-toggle]");
    if (toggle) {
      const sidebar = byId(toggle, toggle.getAttribute("data-xxd-sidebar-toggle"));
      if (sidebar) toggleSidebar(sidebar);
      return;
    }
    const sub = closestFrom(event, ".xxd-sidebar__item[data-sidebar-sub]");
    if (sub) {
      const panel = byId(sub, sub.dataset.sidebarSub);
      const sidebar = sub.closest("[data-xxd-sidebar]");
      if (sidebar?.hasAttribute("data-collapsed")) toggleSidebar(sidebar, false);
      const open = sub.getAttribute("aria-expanded") !== "true";
      sub.setAttribute("aria-expanded", String(open));
      if (panel) panel.hidden = !open;
      return;
    }
    const close = closestFrom(event, ".xxd-banner [data-banner-close]");
    if (close) {
      const banner = close.closest(".xxd-banner");
      banner.setAttribute("data-leaving", "");
      // 关掉的东西里有焦点：先把焦点交给后面（或前面）最近的可聚焦元素，不让它掉到 body 上
      const hadFocus = banner.contains(banner.getRootNode().activeElement);
      setTimeout(() => {
        if (hadFocus) nearestFocusable(banner)?.focus();
        banner.remove();
      }, 130);
      emit(document, "xxd:banner-close", { id: banner.id });
    }
  });

  root.addEventListener("keydown", (event) => {
    const bar = closestFrom(event, ".xxd-toolbar[role='toolbar']");
    if (!bar || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    if (event.target.tagName === "INPUT" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
    const items = toolbarItems(bar);
    const i = items.indexOf(event.target.closest(".xxd-toolbar__item, .xxd-btn, input"));
    if (i === -1) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    items.forEach((el, n) => (el.tabIndex = n === next ? 0 : -1));
    items[next].focus();
  });

  // 拖动侧栏宽度
  root.addEventListener("pointerdown", (event) => {
    const handle = closestFrom(event, "[data-sidebar-resize]");
    if (!handle) return;
    const sidebar = handle.closest("[data-xxd-sidebar]");
    const startX = event.clientX;
    const startW = sidebar.getBoundingClientRect().width;
    sidebar.setAttribute("data-resizing", "");
    handle.setPointerCapture?.(event.pointerId);
    const move = (e) => setSidebarWidth(handle, startW + e.clientX - startX);
    const up = () => {
      sidebar.removeAttribute("data-resizing");
      handle.removeEventListener("pointermove", move);
      emit(sidebar, "xxd:resize", { width: sidebar.getBoundingClientRect().width });
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up, { once: true });
  });
  root.addEventListener("keydown", (event) => {
    const handle = closestFrom(event, "[data-sidebar-resize]");
    if (!handle) return;
    const sidebar = handle.closest("[data-xxd-sidebar]");
    const w = sidebar.getBoundingClientRect().width;
    const next = { ArrowLeft: w - 16, ArrowRight: w + 16, Home: -Infinity, End: Infinity }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSidebarWidth(handle, next);
    emit(sidebar, "xxd:resize", { width: sidebar.getBoundingClientRect().width });
  });
  root.addEventListener("dblclick", (event) => {
    const handle = closestFrom(event, "[data-sidebar-resize]");
    if (!handle) return;
    handle.closest("[data-xxd-sidebar]").style.removeProperty("--sidebar-w");
  });
}

function setSidebarWidth(handle, width) {
  const sidebar = handle.closest("[data-xxd-sidebar]");
  const min = Number(sidebar.dataset.min) || 200;
  const max = Number(sidebar.dataset.max) || 400;
  const w = Math.round(Math.min(max, Math.max(min, width)));
  sidebar.style.setProperty("--sidebar-w", `${w}px`);
  handle.setAttribute("aria-valuenow", String(w));
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** el 之后（没有就之前）文档顺序里第一个可聚焦、可见的元素（el 自己里面的不算）。 */
function nearestFocusable(el) {
  const all = [...el.getRootNode().querySelectorAll(FOCUSABLE)].filter((n) => !el.contains(n) && n.getClientRects().length);
  const after = all.find((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING);
  return after ?? all.filter((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING).pop();
}
