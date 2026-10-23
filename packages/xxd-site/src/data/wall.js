// 首页组件墙专用的样子：浮层画成静态展开的（只放一个「打开」按钮看不出组件长什么样），
// 太大或太抽象的换一个小样，看不懂的工具类不上墙。英文在 wall.en.js。
// data-static：浮层不定位、不隐藏，就在格子里展开（overlay.css）。
export const WALL = {
  Dialog: `<div class="xxd-dialog" data-static style="width:100%;max-width:300px">
  <div class="xxd-dialog__head"><h2 class="xxd-dialog__title">写入哪篇文章？</h2></div>
  <div class="xxd-dialog__body"><p>默认不会替换已有内容。</p></div>
  <div class="xxd-dialog__actions"><button class="xxd-btn ui-dialog-cancel">取消</button><button class="xxd-btn" data-variant="primary">写入为新文章</button></div>
</div>`,
  Menu: `<div class="xxd-menu" role="menu" aria-label="更多" data-static style="width:180px">
  <button class="xxd-menu__item" role="menuitem"><i data-xxd-icon="Pen" data-size="14"></i>重命名<span class="xxd-menu__kbd">F2</span></button>
  <button class="xxd-menu__item" role="menuitem"><i data-xxd-icon="Download" data-size="14"></i>导出为</button>
  <div class="xxd-menu__sep" role="separator"></div>
  <button class="xxd-menu__item" role="menuitem" data-tone="danger"><i data-xxd-icon="Trash" data-size="14"></i>删除</button>
</div>`,
  Popover: `<div class="xxd-stack" style="justify-items:center;gap:8px">
  <div class="xxd-popover" data-static data-arrow data-side="top" role="note">主色会被自动提亮或加深。</div>
  <button class="xxd-btn" data-size="sm">这是什么？</button>
</div>`,
  Tooltip: `<div class="xxd-stack" style="justify-items:center;gap:8px">
  <div class="xxd-tooltip" data-static data-open role="tooltip">搜索 ⌘F</div>
  <button class="xxd-btn" data-icon-only aria-label="搜索"><i data-xxd-icon="Search"></i></button>
</div>`,
  Toast: `<div class="xxd-stack" style="justify-items:center;gap:8px;width:100%">
  <div class="xxd-toast" data-tone="success"><i data-xxd-icon="CircleCheck" data-size="16"></i><span>已保存草稿</span></div>
  <div class="xxd-toast"><span>已移到废纸篓</span><button class="xxd-btn xxd-toast__action" data-variant="ghost" data-size="sm">撤销</button></div>
</div>`,
  Sheet: `<div class="xxd-sheet-host xxd-frame" style="display:flex;flex-direction:column;width:100%;max-width:300px;height:230px;overflow:hidden">
  <p class="xxd-text" data-variant="secondary" style="margin:0 0 auto;padding:12px">侧边栏的正文。</p>
  <div class="xxd-scrim" data-open></div>
  <section class="xxd-sheet" data-open aria-label="封面"><div class="xxd-sheet__head"><h3 class="xxd-sheet__title">封面</h3><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" tabindex="-1" aria-label="关闭"><i data-xxd-icon="X"></i></button></div><div class="xxd-sheet__body"><p class="xxd-help">选一张图作为文章封面。</p></div></section>
  <footer class="xxd-dock" style="position:static"><div class="xxd-dock__status">30 字符 · 已保存</div><div class="xxd-dock__primary"><button class="xxd-btn" data-size="sm" tabindex="-1">封面</button></div></footer>
</div>`,
  Panel: `<div class="xxd-panel" data-static aria-label="详情" style="width:100%;max-width:280px">
  <div class="xxd-panel__head"><h2 class="xxd-panel__title">详情</h2><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="关闭"><i data-xxd-icon="X"></i></button></div>
  <div class="xxd-panel__body"><p class="xxd-text" data-variant="secondary">编辑式海报 · 3:4</p></div>
</div>`,
  CommandPalette: `<div class="xxd-dialog xxd-palette" data-static style="width:100%;max-width:300px">
  <div class="xxd-palette__search"><i data-xxd-icon="Search" data-size="16"></i><input type="text" aria-label="输入命令或搜索" value="切换"></div>
  <ul class="xxd-palette__list" role="listbox" aria-label="命令"><li class="xxd-option" role="option" data-active>切换主题</li><li class="xxd-option" role="option">切换圆角</li></ul>
</div>`,
  Card: `<div class="xxd-grid" style="--grid-min:96px;width:100%;max-width:260px">
  <a class="xxd-card" href="#" tabindex="-1"><div class="xxd-card__media" style="--ratio:3/4"><img src="/demo/poster-1.svg" alt=""></div><div class="xxd-card__body"><p class="xxd-card__title">编辑式海报</p><span class="xxd-card__meta">3:4 · 海报</span></div></a>
  <a class="xxd-card" href="#" tabindex="-1"><div class="xxd-card__media" style="--ratio:3/4"><img src="/demo/poster-4.svg" alt=""></div><div class="xxd-card__body"><p class="xxd-card__title">城市夜景</p><span class="xxd-card__meta">3:4 · 摄影</span></div></a>
</div>`,
  Stat: `<div class="xxd-stats" style="width:100%;max-width:560px">
  <div class="xxd-stat"><p class="xxd-stat__label">本周写入</p><p class="xxd-stat__value">1,284<span class="xxd-stat__unit">篇</span></p><span class="xxd-stat__delta" data-tone="up">↑ 12.4% 比上周</span><span class="xxd-stat__spark" data-spark="8,9,7,11,10,13,15"></span></div>
  <div class="xxd-stat"><p class="xxd-stat__label">新会员</p><p class="xxd-stat__value">86</p><span class="xxd-stat__delta" data-tone="down">↓ 3 比上周</span><span class="xxd-stat__spark" data-spark="12,11,13,10,9,10,8"></span></div>
</div>`,
  Avatar: `<div class="xxd-cluster"><span class="xxd-avatar">东</span><span class="xxd-avatar" data-member>X</span><span class="xxd-avatar" style="--avatar-size:40px">林</span><span class="xxd-avatar" style="--avatar-size:24px">A</span></div>`,
};

/** 组件页的演示区也放这份静态展开的样子（浮层：只有一个「打开」按钮看不出长什么样） */
export const WALL_PREVIEW = new Set(["Dialog", "Menu", "Popover", "Tooltip", "Toast", "Sheet", "Panel", "CommandPalette"]);

/** 不上首页墙的：抽象的工具类（在各自的页面里看）。 */
export const WALL_HIDE = new Set(["Interaction"]);

/** 在墙上占满一整行的：两张图表放得开。 */
export const WALL_FULL = new Set(["Chart"]);

/** 整行宽的组件在墙上至少占两列（其余组件按自己的宽度自动算，见 Home.astro）。 */
export const WALL_WIDE = new Set(["Sidebar", "Appearance", "Chart", "Stat", "Table", "Layout", "LayerCard", "SettingsGroup", "Topbar", "PageHeader", "Toolbar", "Dock"]);
