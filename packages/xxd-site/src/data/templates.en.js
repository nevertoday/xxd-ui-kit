// templates.js 的英文版（/en/templates/*）。结构、类名、尺寸和中文版一一对应，只换文字。
const I = (n, s = 16) => `<i data-xxd-icon="${n}" data-size="${s}"></i>`;
const thumbs = (...c) => `<span class="xxd-thumbs">${c.map((x) => `<span style="background:${x}"></span>`).join("")}</span>`;

const sidepanel = `
<div class="xxd-sheet-host" data-density="compact" style="display:flex;flex-direction:column;height:100%">
  <nav class="xxd-tabs" data-xxd-tabs style="flex:none;padding:0 var(--inset-md)" aria-label="Main navigation">
    <button role="tab" id="sp-t1" aria-controls="sp-p1" aria-selected="true">Sort</button>
    <button role="tab" id="sp-t2" aria-controls="sp-p2">History</button>
    <button role="tab" id="sp-t3" aria-controls="sp-p3">Settings</button>
  </nav>
  <main style="flex:1;min-height:0;overflow:auto">
    <section id="sp-p1" style="padding:var(--inset-md);display:grid;gap:var(--space-3)">
      <div class="xxd-dropzone">${I("ImagePlus", 24)}<p class="xxd-dropzone__title">Drag images here</p><p class="xxd-help">Or <button class="xxd-link" type="button">choose image files</button></p></div>
      <div class="xxd-group__body"><ul class="xxd-list" data-interactive>
        <li class="xxd-list__item">${I("Globe")}<button class="xxd-list__main" type="button"><span class="xxd-list__title">Get images from this page</span><span class="xxd-list__meta">31 on mp.weixin.qq.com</span></button></li>
        <li class="xxd-list__item">${I("Columns3")}<button class="xxd-list__main" type="button"><span class="xxd-list__title">Get images from all tabs</span><span class="xxd-list__meta">6 pages in this window</span></button></li>
        <li class="xxd-list__item">${I("Link")}<button class="xxd-list__main" type="button"><span class="xxd-list__title">Open a URL</span></button></li>
      </ul></div>
    </section>
    <section id="sp-p2" style="padding:var(--inset-md)" class="xxd-history">
      <section><h3 class="xxd-history__day">Today</h3><ul class="xxd-list xxd-group__body" data-interactive>
        <li class="xxd-list__item">${thumbs("#d65f32", "#3b74b8", "#5a8a3c")}<div class="xxd-list__main"><div class="xxd-list__title">24 images</div><div class="xxd-list__meta">Gradient · 14:02</div></div><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs" data-confirm-twice="Confirm delete">Delete</button></li>
      </ul></section>
    </section>
    <section id="sp-p3" style="padding:var(--inset-md)" class="xxd-settings">
      <div class="xxd-group__body"><div class="xxd-account"><span class="xxd-avatar" data-member style="--avatar-size:32px">D</span><div class="xxd-account__main"><div class="xxd-account__name">Dong</div><div class="xxd-plan-line" data-tone="member">Member · until Nov 8, 2027</div></div><button class="xxd-btn" data-size="sm">Manage</button></div></div>
      <section class="xxd-group"><h2 class="xxd-group__title">Sorting</h2><div class="xxd-group__body">
        <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">New sets start with</div></div><div class="xxd-row__control"><label class="xxd-select" data-variant="bare"><select aria-label="New sets start with"><option>Gradient</option><option>As is</option></select></label></div></div>
        <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">Keep image links only</div><div class="xxd-row__desc">Drop links without an image extension</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="Keep image links only"></div></div>
      </div></section>
    </section>
  </main>
  <div class="xxd-statusline">Reading colors 12 / 40<button class="xxd-link" type="button">Stop</button></div>
  <footer class="xxd-dock" style="position:static">
    <div class="xxd-dock__status">24 images · from mp.weixin.qq.com</div>
    <div class="xxd-dock__tools"><button class="xxd-btn" data-size="sm">Add images</button><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="Export">${I("Ellipsis")}</button></div>
    <div class="xxd-dock__primary"><button class="xxd-btn" data-variant="primary" data-size="sm">Copy 24 links</button></div>
  </footer>
</div>`;

const signIn = `
<div style="height:100%;display:grid;place-items:center">
<div class="xxd-auth" data-xxd-auth>
  <span class="xxd-logo" data-size="lg"><span class="xxd-logo__mark"></span></span>
  <h2 class="xxd-auth__name">XXD · Image sorter</h2>
  <p class="xxd-auth__line">Sorts image links by color.</p>
  <span class="xxd-auth__gift">New accounts get 7 days of full access</span>
  <form>
    <button class="xxd-btn" data-block type="button"><svg class="ui-icon" width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continue with Google</button>
    <div class="xxd-auth__or">or use email</div>
    <div data-step="email" data-active><input class="xxd-input" type="email" placeholder="you@example.com" aria-label="Email" required><button class="xxd-btn" data-variant="primary" data-block data-auth-next="password">Continue</button></div>
    <div data-step="password"><p class="xxd-help">Sign in as <b data-auth-email></b></p><input class="xxd-input" type="password" placeholder="Password" aria-label="Password"><div class="xxd-cluster"><button class="xxd-btn ui-dialog-cancel" data-auth-back="email">Back</button><button class="xxd-btn" data-variant="primary" style="flex:1">Continue</button></div></div>
  </form>
  <p class="xxd-auth__terms">By continuing you agree to the <a class="xxd-link" href="#">Terms of Service</a> and <a class="xxd-link" href="#">Privacy Policy</a></p>
</div></div>`;

const settings = `
<div style="padding:var(--space-8) var(--space-4) calc(var(--space-8) * 2)" class="xxd-read">
  <h1 class="xxd-text" data-variant="heading1" style="margin-bottom:var(--space-4)">Settings</h1>
  <div class="xxd-input-wrap" style="margin-bottom:var(--space-5)">${I("Search")}<input class="xxd-input" type="search" placeholder="Search settings (⌘F)" aria-label="Search settings"><button class="xxd-input-clear" aria-label="Clear">${I("X", 14)}</button></div>
  <div class="xxd-settings">
    <section class="xxd-group"><h2 class="xxd-group__title">Account</h2><div class="xxd-group__body"><div class="xxd-account"><span class="xxd-avatar" style="--avatar-size:36px">D</span><div class="xxd-account__main"><div class="xxd-account__name">Dong</div><div class="xxd-plan-line">Free · 3 posts left today</div></div><button class="xxd-btn" data-size="sm" data-variant="primary">Become a member</button></div></div></section>
    <section class="xxd-group"><h2 class="xxd-group__title">Writing</h2><div class="xxd-group__body">
      <div class="xxd-row" data-keywords="title heading"><div class="xxd-row__text"><div class="xxd-row__title">Write the title</div><div class="xxd-row__desc">Use the first # heading as the post title</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="Write the title"></div></div>
      <div class="xxd-row" data-keywords="punctuation quotes"><div class="xxd-row__text"><div class="xxd-row__title">Smart punctuation</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="Smart punctuation"></div></div>
      <a class="xxd-row" href="#"><div class="xxd-row__text"><div class="xxd-row__title">Local image folder</div><div class="xxd-row__desc">Not connected</div></div></a>
    </div></section>
    <section class="xxd-group"><h2 class="xxd-group__title">AI service</h2><div class="xxd-group__body">
      <div class="xxd-row" data-stack><div class="xxd-row__text"><div class="xxd-row__title">API key</div><div class="xxd-row__desc">Stored on this computer only</div></div><div class="xxd-input-group xxd-secret" data-xxd-secret><input type="password" value="sk_live_4f8a2c91d7e3b6a0" readonly aria-label="API key"><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-secret-toggle aria-label="Show secret">${I("Eye")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-secret-copy aria-label="Copy">${I("Copy")}</button></div></div>
    </div></section>
    <div id="tpl-appearance"></div>
    <section class="xxd-group"><h2 class="xxd-group__title">About</h2><div class="xxd-group__body">
      <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">Version</div></div><div class="xxd-row__control xxd-text" data-variant="mono-secondary">1.8.2</div></div>
      <a class="xxd-row" href="#"><div class="xxd-row__text"><div class="xxd-row__title">Privacy Policy</div></div></a>
    </div></section>
  </div>
</div>
<script>
  Xxd.mountAppearance(document.getElementById("tpl-appearance"), { locale: "en", languages: [{ value: "zh-CN", label: "简体中文" }, { value: "zh-Hant", label: "繁體中文" }, { value: "en", label: "English" }], language: "en" });
  Xxd.init(document);
  Xxd.bindSettingsSearch(document.querySelector('.xxd-input-wrap input'), document.querySelector('.xxd-settings'), { hotkey: false });
</script>`;

const detailPanel = `
<div style="height:100%;position:relative;overflow:hidden">
  <!-- Masonry: images of different heights in columns (CSS columns); favourites get a dot -->
  <div class="xxd-panel-room" style="height:100%;overflow:auto"><div style="columns:150px;column-gap:var(--space-3);padding:var(--inset-md)">${[["1", "3/4"], ["2", "1/1"], ["3", "4/5"], ["4", "2/3"], ["5", "3/4"], ["6", "15/16"]].map(([n, r], i) => `<a class="xxd-card" href="#" style="break-inside:avoid;margin-bottom:var(--space-3)"><div class="xxd-card__media" style="--ratio:${r};background:center / cover url(/demo/poster-${n}.svg)">${i % 3 === 0 ? `<div class="xxd-card__marks"><span class="xxd-dot" data-tone="danger"></span></div>` : ""}</div><div class="xxd-card__body"><p class="xxd-card__title">Editorial poster 00${i + 1}</p><span class="xxd-card__meta">xxd-panel-00${i + 1}</span></div></a>`).join("")}</div></div>
  <aside class="xxd-panel" data-open style="position:absolute" aria-label="Prompt details">
    <div class="xxd-panel__head"><h2 class="xxd-panel__title">Editorial poster 001</h2><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="Copy prompt" data-tooltip="Copy prompt">${I("Copy")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="Close">${I("X")}</button></div>
    <div class="xxd-panel__body"><div class="xxd-card__media" style="--ratio:3/4;width:100%;max-height:min(420px, 50vh);background:center / contain no-repeat url(/demo/poster-1.svg) var(--wash);border-radius:var(--r-md)"></div>
      <div class="xxd-prose" style="margin-top:var(--space-4)"><h3>Prompt</h3><p>Restrained editorial brutalism: a paper background, crisp black lines, clean sans-serif type, dense but readable text.</p></div>
      <div class="xxd-cluster" style="margin-top:var(--space-3)"><button class="xxd-chip" aria-pressed="true">Poster</button><button class="xxd-chip">Editorial</button></div>
    </div>
    <footer class="xxd-dock" style="position:static"><div class="xxd-dock__status">Used 2,410 times</div><div class="xxd-dock__tools"><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="Previous">${I("ChevronLeft")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="Next">${I("ChevronRight")}</button></div><div class="xxd-dock__primary"><button class="xxd-btn" data-variant="primary" data-size="sm">Generate in this style</button></div></footer>
  </aside>
</div>`;

const article = `
<div class="xxd-layout" data-cols="2-1" style="padding:var(--space-8) var(--space-6);max-width:1080px;margin:0 auto;--layout-gap:calc(var(--space-8) + var(--space-4))">
  <article class="xxd-prose">
    <ol class="xxd-breadcrumbs"><li><a href="#">Articles</a></li><li aria-current="page">Design systems</li></ol>
    <h1 id="a1">A design system for one</h1>
    <p>Twenty-odd extensions and one member site, one look: black, white and gray, square corners by default, ink for emphasis.</p>
    <h2 id="a2">Why square corners</h2>
    <p>Square corners let the content speak first. <a href="#">The member site's hard rule</a>: no rounded dialogs, cards, buttons or inputs.</p>
    <blockquote>Motion is for revealing hierarchy and giving feedback, not decoration.</blockquote>
    <h2 id="a3">Tokens</h2>
    <p>Every color, radius and shadow comes from <code>tokens.css</code>.</p>
    <pre><code>--r-sm: 0px; /* square by default */</code></pre>
    <h3 id="a4">Accent</h3>
    <ul><li>12 presets</li><li>Lightened or darkened automatically to keep contrast</li></ul>
  </article>
  <aside style="position:sticky;top:24px;align-self:start"><p class="xxd-toc__title">On this page</p><ul class="xxd-toc" data-spy><li><a href="#a1" aria-current="true">A design system for one</a></li><li><a href="#a2">Why square corners</a></li><li><a href="#a3">Tokens</a></li><li data-depth="3"><a href="#a4">Accent</a></li></ul></aside>
</div>`;

const resourceList = `
<div style="padding:0 var(--space-6) var(--space-8);max-width:1080px;margin:0 auto">
  <header class="xxd-page-header">
    <ol class="xxd-breadcrumbs"><li><a href="#">XXD</a></li><li aria-current="page">Extensions</li></ol>
    <div class="xxd-page-header__row"><h1 class="xxd-page-header__title">Extensions</h1><div class="xxd-page-header__actions"><button class="xxd-btn">Import</button><button class="xxd-btn" data-variant="primary">${I("Plus")}New extension</button></div></div>
    <p class="xxd-page-header__desc">Every extension on XXD UI: whether its version is current and when it was last published.</p>
  </header>
  <div class="xxd-cluster" style="margin-bottom:var(--space-3)"><div class="xxd-input-wrap" style="width:260px">${I("Search")}<input class="xxd-input" data-size="sm" type="search" placeholder="Search extensions" aria-label="Search extensions"></div><button class="xxd-chip" data-size="sm" aria-pressed="true">All</button><button class="xxd-chip" data-size="sm">Behind</button><button class="xxd-chip" data-size="sm">To publish</button></div>
  <div class="xxd-table-wrap"><table class="xxd-table" data-interactive>
    <thead><tr><th class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-all aria-label="Select all"></th><th aria-sort="ascending"><button class="xxd-th-sort">Extension</button></th><th>UI Kit</th><th aria-sort="none" data-align="end"><button class="xxd-th-sort">Users</button></th><th>Status</th><th class="xxd-table__actions"><span class="xxd-sr-only">Actions</span></th></tr></thead>
    <tbody>
      ${[["Long-form publisher", "Current", "2,410", "success", "Live"], ["Link sorter", "2 behind", "830", "warning", "To publish"], ["Bulk image saver", "Not adopted", "5,102", "success", "Live"], ["Today", "Current", "312", "", "In review"]].map(([n, v, u, t, s]) => `<tr><td class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-row aria-label="Select ${n}"></td><td><span class="xxd-logo" data-size="sm"><span class="xxd-logo__mark"></span>${n}</span></td><td>${v}</td><td data-align="end">${u}</td><td><span class="xxd-badge" data-appearance="dot" ${t ? `data-tone="${t}"` : ""}>${s}</span></td><td class="xxd-table__actions"><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs">Sync</button></td></tr>`).join("")}
    </tbody>
  </table></div>
  <div class="xxd-pagination-bar" style="margin-top:var(--space-3)"><span class="xxd-pagination__info"></span><nav class="xxd-pagination" data-xxd-pagination data-page="1" data-total="24" data-per-page="4" aria-label="Pagination"></nav></div>
</div>`;

const deleteConfirm = `
<div style="height:100%;display:grid;place-items:center;gap:var(--space-4);align-content:center;padding:var(--space-6)">
  <!-- The dialog shown open (for real it's opened with Xxd.confirmDelete; try the button below) -->
  <div class="xxd-dialog" data-static role="alertdialog" aria-labelledby="dc-title" aria-describedby="dc-desc" style="width:100%;max-width:400px">
    <div class="xxd-dialog__head"><h2 class="xxd-dialog__title" id="dc-title">Delete “Long-form publisher”?</h2></div>
    <div class="xxd-dialog__body">
      <p id="dc-desc">All records and settings of this extension are deleted for good. This can't be undone.</p>
      <div class="xxd-field"><label class="xxd-label" for="dc-name">Type “Long-form publisher” to confirm</label><input class="xxd-input" id="dc-name" autocomplete="off"></div>
    </div>
    <div class="xxd-dialog__actions"><button class="xxd-btn ui-dialog-cancel">Cancel</button><button class="xxd-btn" data-variant="danger" disabled>Delete</button></div>
  </div>
  <button class="xxd-btn" data-variant="danger-outline" data-size="sm" onclick="Xxd.confirmDelete({ name: 'Long-form publisher', what: 'all records and settings of this extension' }).then((ok) => ok && Xxd.toast('Deleted', { tone: 'success' }))">Try it: delete extension…</button>
  <p class="xxd-text" data-variant="caption">For less serious ones, use “Two-step confirm” (pattern).</p>
</div>`;

export const templates = [
  { slug: "extension-sidepanel", title: "Extension side panel", summary: "Compact density: tabs at the very top (no top bar), drop zone and ways to get images, history, settings, status line, bottom dock.", markup: sidepanel, width: 380, height: 720, where: "Chrome side panel" },
  { slug: "extension-sign-in", title: "Extension sign-in", summary: "When signed out, the side panel shows only this screen.", markup: signIn, width: 380, height: 640, where: "Chrome side panel" },
  { slug: "settings", title: "Settings page", summary: "Search pinned to the top (filters + marks text), account, writing, AI key, appearance group, about.", markup: settings, height: 980, flow: true },
  { slug: "detail-panel", title: "Member site details panel", summary: "Masonry + a details panel on the right: title bar, image, prompt, tags, bottom dock (previous / next / next step).", markup: detailPanel, height: 680 },
  { slug: "article", title: "Article page", summary: "Reading typography + a table of contents on the right (highlights while scrolling).", markup: article, height: 760, flow: true },
  { slug: "resource-list", title: "Resource list", summary: "Page header, filters, a table (select all / sort / hover actions), pagination.", markup: resourceList, height: 620, flow: true },
  { slug: "delete-confirm", title: "Delete confirmation", summary: "A dialog that asks you to type the name before deleting.", markup: deleteConfirm, height: 460 },
];
