// The home wall's English versions (see wall.js).
export const WALL = {
  Dialog: `<div class="xxd-dialog" data-static style="width:100%;max-width:300px">
  <div class="xxd-dialog__head"><h2 class="xxd-dialog__title">Write to which post?</h2></div>
  <div class="xxd-dialog__body"><p>Nothing that's already there is replaced.</p></div>
  <div class="xxd-dialog__actions"><button class="xxd-btn ui-dialog-cancel">Cancel</button><button class="xxd-btn" data-variant="primary">Write as a new post</button></div>
</div>`,
  Menu: `<div class="xxd-menu" role="menu" aria-label="More" data-static style="width:180px">
  <button class="xxd-menu__item" role="menuitem"><i data-xxd-icon="Pen" data-size="14"></i>Rename<span class="xxd-menu__kbd">F2</span></button>
  <button class="xxd-menu__item" role="menuitem"><i data-xxd-icon="Download" data-size="14"></i>Export as</button>
  <div class="xxd-menu__sep" role="separator"></div>
  <button class="xxd-menu__item" role="menuitem" data-tone="danger"><i data-xxd-icon="Trash" data-size="14"></i>Delete</button>
</div>`,
  Popover: `<div class="xxd-stack" style="justify-items:center;gap:8px">
  <div class="xxd-popover" data-static data-arrow data-side="top" role="note">The accent is lightened or darkened automatically.</div>
  <button class="xxd-btn" data-size="sm">What's this?</button>
</div>`,
  Tooltip: `<div class="xxd-stack" style="justify-items:center;gap:8px">
  <div class="xxd-tooltip" data-static data-open role="tooltip">Search ⌘F</div>
  <button class="xxd-btn" data-icon-only aria-label="Search"><i data-xxd-icon="Search"></i></button>
</div>`,
  Toast: `<div class="xxd-stack" style="justify-items:center;gap:8px;width:100%">
  <div class="xxd-toast" data-tone="success"><i data-xxd-icon="CircleCheck" data-size="16"></i><span>Draft saved</span></div>
  <div class="xxd-toast"><span>Moved to the trash</span><button class="xxd-btn xxd-toast__action" data-variant="ghost" data-size="sm">Undo</button></div>
</div>`,
  Sheet: `<div class="xxd-sheet-host xxd-frame" style="display:flex;flex-direction:column;width:100%;max-width:300px;height:230px;overflow:hidden">
  <p class="xxd-text" data-variant="secondary" style="margin:0 0 auto;padding:12px">The side panel’s content.</p>
  <div class="xxd-scrim" data-open></div>
  <section class="xxd-sheet" data-open aria-label="Cover"><div class="xxd-sheet__head"><h3 class="xxd-sheet__title">Cover</h3><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" tabindex="-1" aria-label="Close"><i data-xxd-icon="X"></i></button></div><div class="xxd-sheet__body"><p class="xxd-help">Pick an image as the cover.</p></div></section>
  <footer class="xxd-dock" style="position:static"><div class="xxd-dock__status">30 chars · Saved</div><div class="xxd-dock__primary"><button class="xxd-btn" data-size="sm" tabindex="-1">Cover</button></div></footer>
</div>`,
  Panel: `<div class="xxd-panel" data-static aria-label="Details" style="width:100%;max-width:280px">
  <div class="xxd-panel__head"><h2 class="xxd-panel__title">Details</h2><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="Close"><i data-xxd-icon="X"></i></button></div>
  <div class="xxd-panel__body"><p class="xxd-text" data-variant="secondary">Editorial poster · 3:4</p></div>
</div>`,
  CommandPalette: `<div class="xxd-dialog xxd-palette" data-static style="width:100%;max-width:300px">
  <div class="xxd-palette__search"><i data-xxd-icon="Search" data-size="16"></i><input type="text" aria-label="Type a command or search" value="Switch"></div>
  <ul class="xxd-palette__list" role="listbox" aria-label="Commands"><li class="xxd-option" role="option" data-active>Switch theme</li><li class="xxd-option" role="option">Switch corners</li></ul>
</div>`,
  Card: `<div class="xxd-grid" style="--grid-min:96px;width:100%;max-width:260px">
  <a class="xxd-card" href="#" tabindex="-1"><div class="xxd-card__media" style="--ratio:3/4"><img src="/demo/poster-1.svg" alt=""></div><div class="xxd-card__body"><p class="xxd-card__title">Editorial poster</p><span class="xxd-card__meta">3:4 · Poster</span></div></a>
  <a class="xxd-card" href="#" tabindex="-1"><div class="xxd-card__media" style="--ratio:3/4"><img src="/demo/poster-4.svg" alt=""></div><div class="xxd-card__body"><p class="xxd-card__title">City at night</p><span class="xxd-card__meta">3:4 · Photo</span></div></a>
</div>`,
  Stat: `<div class="xxd-stats" style="width:100%;max-width:560px">
  <div class="xxd-stat"><p class="xxd-stat__label">Written this week</p><p class="xxd-stat__value">1,284</p><span class="xxd-stat__delta" data-tone="up">↑ 12.4% vs last week</span><span class="xxd-stat__spark" data-spark="8,9,7,11,10,13,15"></span></div>
  <div class="xxd-stat"><p class="xxd-stat__label">New members</p><p class="xxd-stat__value">86</p><span class="xxd-stat__delta" data-tone="down">↓ 3 vs last week</span><span class="xxd-stat__spark" data-spark="12,11,13,10,9,10,8"></span></div>
</div>`,
  Avatar: `<div class="xxd-cluster"><span class="xxd-avatar">X</span><span class="xxd-avatar" data-member>D</span><span class="xxd-avatar" style="--avatar-size:40px">L</span><span class="xxd-avatar" style="--avatar-size:24px">A</span></div>`,
};
