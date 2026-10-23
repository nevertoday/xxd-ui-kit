// 首页组件墙上更丰富的样子（以前每格只有一两个元素，大片空白）：同一个组件的几种变体、尺寸、状态放在一格里。
// 中英共用，tr(中, 英) 选语言。只放组件文档里写了的变体和属性，不发明新写法。id 不能和别的格子重复。
const icon = (name, size = 16) => `<i data-xxd-icon="${name}" data-size="${size}"></i>`;

/** @param {"zh" | "en"} lang */
export function richWall(lang) {
  const tr = (zh, en) => (lang === "en" ? en : zh);
  return {
    Button: `<div class="xxd-stack" style="justify-items:center;gap:12px">
  <div class="xxd-cluster" style="justify-content:center"><button class="xxd-btn" data-variant="primary">${tr("写入 X", "Post to X")}</button><button class="xxd-btn">${tr("保存草稿", "Save draft")}</button><button class="xxd-btn" data-variant="ghost">${tr("稍后", "Later")}</button><button class="xxd-btn" data-variant="danger">${tr("删除", "Delete")}</button></div>
  <div class="xxd-cluster" style="justify-content:center"><button class="xxd-btn" data-size="xs">xs</button><button class="xxd-btn" data-size="sm">${tr("小号", "Small")}</button><button class="xxd-btn">${tr("标准", "Default")}</button><button class="xxd-btn" data-size="lg">${tr("大号", "Large")}</button></div>
  <div class="xxd-cluster" style="justify-content:center"><button class="xxd-btn" data-variant="outline">${icon("Download")}${tr("导出", "Export")}</button><button class="xxd-btn" data-variant="danger-outline">${tr("移除", "Remove")}</button><button class="xxd-btn" aria-pressed="true">${icon("Pin")}${tr("已钉住", "Pinned")}</button><button class="xxd-btn" data-icon-only aria-label="${tr("设置", "Settings")}">${icon("Settings")}</button><button class="xxd-btn" data-variant="primary" disabled>${tr("不可用", "Disabled")}</button></div>
</div>`,
    ButtonGroup: `<div class="xxd-stack" style="justify-items:center;gap:12px">
  <div class="xxd-btn-group"><button class="xxd-btn" data-size="sm">${tr("左", "Left")}</button><button class="xxd-btn" data-size="sm">${tr("中", "Center")}</button><button class="xxd-btn" data-size="sm">${tr("右", "Right")}</button></div>
  <div class="xxd-btn-group"><button class="xxd-btn" data-size="sm" data-icon-only aria-label="${tr("加粗", "Bold")}">${icon("Bold")}</button><button class="xxd-btn" data-size="sm" data-icon-only aria-label="${tr("斜体", "Italic")}">${icon("Italic")}</button><button class="xxd-btn" data-size="sm" data-icon-only aria-label="${tr("链接", "Link")}">${icon("Link")}</button></div>
</div>`,
    Link: `<div class="xxd-stack" style="justify-items:center;gap:10px">
  <p class="xxd-text">${tr("写入失败了？", "Didn't work?")}<button class="xxd-link">${tr("改为新建一篇", "Write it as a new post")}</button></p>
  <a class="xxd-link" data-variant="plain" href="#">${tr("查看全部记录", "See all history")}</a>
  <a class="xxd-link" href="#" data-external>${tr("在会员站打开", "Open on the member site")}</a>
</div>`,
    Badge: `<div class="xxd-stack" style="justify-items:center;gap:10px">
  <div class="xxd-cluster" style="justify-content:center"><span class="xxd-badge">${tr("草稿", "Draft")}</span><span class="xxd-badge" data-tone="action">${tr("会员", "Member")}</span><span class="xxd-badge" data-tone="success">${tr("已写入", "Posted")}</span><span class="xxd-badge" data-tone="warning">${tr("待更新", "Outdated")}</span><span class="xxd-badge" data-tone="danger">${tr("失败", "Failed")}</span></div>
  <div class="xxd-cluster" style="justify-content:center"><span class="xxd-badge" data-variant="solid">${tr("实心", "Solid")}</span><span class="xxd-badge" data-variant="outline">${tr("描边", "Outline")}</span><span class="xxd-badge" data-appearance="dot" data-tone="success">${tr("运行中", "Running")}</span><span class="xxd-badge" data-variant="new">${tr("新", "New")}</span></div>
</div>`,
    Chip: `<div class="xxd-cluster" style="justify-content:center;max-width:300px">
  <button class="xxd-chip" aria-pressed="true">${tr("海报", "Poster")}</button><button class="xxd-chip">${tr("封面", "Cover")}</button><button class="xxd-chip">${tr("卡片", "Card")}</button><button class="xxd-chip" aria-pressed="true">${tr("编辑式", "Editorial")}</button>
  <span class="xxd-chip">${tr("小红书", "RedNote")}<button aria-label="${tr("移除 小红书", "Remove RedNote")}">${icon("X", 12)}</button></span><span class="xxd-chip">X<button aria-label="${tr("移除 X", "Remove X")}">${icon("X", 12)}</button></span>
</div>`,
    Dot: `<div class="xxd-stack" style="gap:8px">
  <span class="xxd-cluster" style="--cluster-gap:6px"><span class="xxd-dot" data-tone="success" aria-hidden="true"></span>${tr("运行中", "Running")}</span>
  <span class="xxd-cluster" style="--cluster-gap:6px"><span class="xxd-dot" data-tone="warning" aria-hidden="true"></span>${tr("排队中", "Queued")}</span>
  <span class="xxd-cluster" style="--cluster-gap:6px"><span class="xxd-dot" data-tone="danger" aria-hidden="true"></span>${tr("出错", "Error")}</span>
  <span class="xxd-cluster" style="--cluster-gap:6px"><span class="xxd-dot" aria-hidden="true"></span>${tr("已停止", "Stopped")}</span>
</div>`,
    Glyphs: `<div class="xxd-glyphs" style="width:100%;max-width:260px">${["①", "②", "③", "④", "⑤", "★", "✓", "→", "·", "—", "「」", "※"].map((g, i) => `<button aria-label="${tr("插入", "Insert")} ${g}"${i === 0 ? ' aria-pressed="true"' : ""}>${g}</button>`).join("")}</div>`,
    Avatar: `<div class="xxd-stack" style="justify-items:center;gap:12px">
  <div class="xxd-cluster" style="align-items:center"><span class="xxd-avatar" style="--avatar-size:24px">${tr("东", "D")}</span><span class="xxd-avatar">${tr("林", "L")}</span><span class="xxd-avatar" style="--avatar-size:40px">${tr("王", "W")}</span><span class="xxd-avatar" data-member style="--avatar-size:40px">X</span></div>
  <div class="xxd-cluster" style="align-items:center">${[tr("东", "D"), tr("林", "L"), tr("王", "W"), tr("陈", "C")].map((n) => `<span class="xxd-avatar" style="--avatar-size:28px">${n}</span>`).join("")}<span class="xxd-text" data-variant="caption">${tr("等 12 人", "+12 more")}</span></div>
</div>`,
    Progress: `<div class="xxd-stack" style="width:100%;max-width:240px;gap:12px">
  <div class="xxd-stack" style="gap:4px"><div class="xxd-cluster" style="justify-content:space-between"><span class="xxd-text" data-variant="caption">${tr("上传图片", "Uploading")}</span><span class="xxd-text" data-variant="caption">12 / 20</span></div><progress class="xxd-progress" value="60" max="100" aria-label="${tr("上传图片", "Uploading")}"></progress></div>
  <div class="xxd-stack" style="gap:4px"><span class="xxd-text" data-variant="caption">${tr("读取颜色", "Reading colors")}</span><progress class="xxd-progress" value="25" max="100" aria-label="${tr("读取颜色", "Reading colors")}"></progress></div>
  <div class="xxd-loadbar" role="progressbar" aria-label="${tr("正在加载", "Loading")}"></div>
  <div class="xxd-cluster"><span class="xxd-spinner" aria-hidden="true"></span><span class="xxd-text" data-variant="caption">${tr("正在生成…", "Generating…")}</span></div>
</div>`,
    Switch: `<div class="xxd-stack" style="gap:10px">
  <label class="xxd-choice"><input type="checkbox" role="switch" class="xxd-switch" checked>${tr("完成音效", "Done sound")}</label>
  <label class="xxd-choice"><input type="checkbox" role="switch" class="xxd-switch">${tr("自动保存", "Autosave")}</label>
  <label class="xxd-choice"><input type="checkbox" role="switch" class="xxd-switch" checked disabled>${tr("会员专属", "Members only")}</label>
</div>`,
    Checkbox: `<div class="xxd-stack" style="gap:10px">
  <label class="xxd-choice"><input type="checkbox" class="xxd-check" checked>${tr("智能标点", "Smart punctuation")}</label>
  <label class="xxd-choice"><input type="checkbox" class="xxd-check">${tr("写入标题", "Write the title")}</label>
  <label class="xxd-choice"><input type="checkbox" class="xxd-check" checked disabled>${tr("保留原图", "Keep originals")}</label>
</div>`,
    Segmented: `<div class="xxd-stack" style="justify-items:center;gap:12px">
  <div class="xxd-segmented" role="radiogroup" data-xxd-segmented aria-label="${tr("类型", "Type")}"><button role="radio" aria-checked="true">${tr("文本", "Text")}</button><button role="radio" aria-checked="false">${tr("图片", "Image")}</button><button role="radio" aria-checked="false">${tr("视频", "Video")}</button></div>
  <div class="xxd-segmented" role="radiogroup" data-xxd-segmented aria-label="${tr("视图", "View")}"><button role="radio" aria-checked="true" aria-label="${tr("网格", "Grid")}">${icon("LayoutGrid", 14)}</button><button role="radio" aria-checked="false" aria-label="${tr("列表", "List")}">${icon("List", 14)}</button></div>
</div>`,
    Tabs: `<div style="width:100%">
  <div class="xxd-tabs" data-xxd-tabs>
    <button role="tab" id="wall-t1" aria-controls="wall-p1" aria-selected="true">${tr("写作", "Writing")}</button>
    <button role="tab" id="wall-t2" aria-controls="wall-p2">${tr("记录", "History")}<span class="xxd-count">24</span></button>
    <button role="tab" id="wall-t3" aria-controls="wall-p3">${tr("设置", "Settings")}</button>
  </div>
  <div class="xxd-tabpanel" id="wall-p1" style="padding-top:var(--space-3)"><p class="xxd-text" data-variant="secondary">${tr("正在写的文章：一篇关于设计系统的长文。", "In progress: a long post about design systems.")}</p></div>
  <div class="xxd-tabpanel" id="wall-p2" style="padding-top:var(--space-3)" hidden><p class="xxd-text" data-variant="secondary">${tr("写入过的文章按天排在这里。", "Posts you've written, grouped by day.")}</p></div>
  <div class="xxd-tabpanel" id="wall-p3" style="padding-top:var(--space-3)" hidden><p class="xxd-text" data-variant="secondary">${tr("账号、写入方式和外观。", "Account, writing and appearance.")}</p></div>
</div>`,

    Field: `<div class="xxd-stack" style="width:100%;max-width:260px;gap:14px">
  <div class="xxd-field"><label class="xxd-label" for="wall-f1">${tr("标题", "Title")}</label><input class="xxd-input" id="wall-f1" placeholder="${tr("给这篇文章起个名字", "Name this post")}" aria-describedby="wall-f1h"><p class="xxd-help" id="wall-f1h">${tr("最多 100 个字", "Up to 100 characters")}</p></div>
  <div class="xxd-field"><label class="xxd-label" for="wall-f2">${tr("邮箱", "Email")}</label><input class="xxd-input" id="wall-f2" value="not-an-email" aria-invalid="true" aria-describedby="wall-f2e"><p class="xxd-error" id="wall-f2e">${tr("请输入有效的邮箱地址", "Enter a valid email address")}</p></div>
</div>`,
    Select: `<div class="xxd-stack" style="justify-items:center;gap:12px">
  <label class="xxd-select" style="width:180px"><select aria-label="${tr("图片质量", "Image quality")}"><option>${tr("高", "High")}</option><option>${tr("标准", "Standard")}</option></select></label>
  <label class="xxd-select" data-size="sm" style="width:180px"><select aria-label="${tr("每页条数", "Per page")}"><option>${tr("每页 20 条", "20 per page")}</option></select></label>
  <div class="xxd-cluster"><span class="xxd-text" data-variant="secondary">${tr("排序", "Sort")}</span><label class="xxd-select" data-variant="bare"><select aria-label="${tr("排序", "Sort")}"><option>${tr("最新在前", "Newest first")}</option></select></label></div>
</div>`,
    Search: `<div class="xxd-stack" style="width:100%;max-width:260px;gap:12px">
  <div class="xxd-input-wrap">${icon("Search")}<input class="xxd-input" type="search" placeholder="${tr("搜索设置（⌘F）", "Search settings (⌘F)")}" aria-label="${tr("搜索设置", "Search settings")}"><button class="xxd-input-clear" aria-label="${tr("清空", "Clear")}">${icon("X", 14)}</button></div>
  <div class="xxd-input-wrap">${icon("Search")}<input class="xxd-input" data-size="sm" type="search" value="${tr("海报", "poster")}" aria-label="${tr("搜索风格", "Search styles")}"><button class="xxd-input-clear" aria-label="${tr("清空", "Clear")}">${icon("X", 14)}</button></div>
</div>`,
    TagInput: `<div class="xxd-taginput" data-xxd-taginput style="width:100%;max-width:280px"><span class="xxd-chip">${tr("海报", "Poster")}<button aria-label="${tr("移除 海报", "Remove Poster")}">${icon("X", 12)}</button></span><span class="xxd-chip">${tr("编辑式", "Editorial")}<button aria-label="${tr("移除 编辑式", "Remove Editorial")}">${icon("X", 12)}</button></span><input placeholder="${tr("回车添加", "Press Enter to add")}" aria-label="${tr("标签", "Tags")}"></div>`,
    Topbar: `<div class="xxd-stack" style="width:100%;gap:12px">
  <header class="xxd-topbar"><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="${tr("返回", "Back")}">${icon("ChevronLeft")}</button><span class="xxd-topbar__title">${tr("提示词", "Prompts")}</span><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="${tr("搜索", "Search")}">${icon("Search")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="${tr("更多", "More")}">${icon("Ellipsis")}</button></header>
  <header class="xxd-topbar"><span class="xxd-topbar__title">${tr("长文发布", "Long-form publisher")}</span><button class="xxd-btn" data-size="sm">${tr("预览", "Preview")}</button><button class="xxd-btn" data-variant="primary" data-size="sm">${tr("写入 X", "Post to X")}</button></header>
</div>`,
    List: `<ul class="xxd-list xxd-group__body" data-interactive style="width:100%">
  <li class="xxd-list__item">${icon("FileText")}<div class="xxd-list__main"><div class="xxd-list__title">${tr("一个人的设计系统", "A one-person design system")}</div><div class="xxd-list__meta">${tr("今天 14:02 · 2,410 字", "Today 14:02 · 2,410 words")}</div></div><span class="xxd-badge" data-tone="success">${tr("已写入", "Posted")}</span></li>
  <li class="xxd-list__item" aria-current="true">${icon("FileText")}<div class="xxd-list__main"><div class="xxd-list__title">${tr("为什么是直角", "Why square corners")}</div><div class="xxd-list__meta">${tr("昨天 · 草稿", "Yesterday · draft")}</div></div><span class="xxd-badge">${tr("草稿", "Draft")}</span></li>
  <li class="xxd-list__item">${icon("Image")}<div class="xxd-list__main"><div class="xxd-list__title">${tr("24 张图片", "24 images")}</div><div class="xxd-list__meta">${tr("周一 · 渐变", "Monday · gradient")}</div></div></li>
</ul>`,
    SettingsGroup: `<section class="xxd-group" style="width:100%"><h2 class="xxd-group__title">${tr("写入", "Writing")}</h2><div class="xxd-group__body">
  <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">${tr("写入标题", "Write the title")}</div><div class="xxd-row__desc">${tr("第一行 # 标题作为文章标题", "The first # heading becomes the title")}</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="${tr("写入标题", "Write the title")}"></div></div>
  <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">${tr("图片质量", "Image quality")}</div></div><div class="xxd-row__control"><label class="xxd-select" data-variant="bare"><select aria-label="${tr("图片质量", "Image quality")}"><option>${tr("高", "High")}</option></select></label></div></div>
  <a class="xxd-row" href="#"><div class="xxd-row__text"><div class="xxd-row__title">${tr("本地图片文件夹", "Local image folder")}</div><div class="xxd-row__desc">${tr("未连接", "Not connected")}</div></div></a>
</div></section>`,
    Dock: `<footer class="xxd-dock" style="position:static;width:100%">
  <div class="xxd-dock__status">${tr("30 字符 · 已保存", "30 characters · saved")}</div>
  <div class="xxd-dock__tools"><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="${tr("封面", "Cover")}">${icon("Image")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="${tr("标签", "Tags")}">${icon("Tag")}</button><button class="xxd-btn" data-size="sm">${tr("预览", "Preview")}</button></div>
  <div class="xxd-dock__primary"><button class="xxd-btn" data-variant="primary" data-size="sm">${tr("写入 X", "Post to X")}</button></div>
</footer>`,
    Rail: `<nav class="xxd-rail" aria-label="${tr("主导航（示例）", "Main (sample)")}"><a href="#" aria-current="page">${icon("House", 20)}${tr("首页", "Home")}</a><a href="#">${icon("Bookmark", 20)}${tr("收藏", "Saved")}</a><a href="#">${icon("History", 20)}${tr("记录", "History")}</a><a href="#">${icon("Settings", 20)}${tr("设置", "Settings")}</a></nav>`,
  };
}

/**
 * 每个大组件在墙上至少要多宽（px，不含格子内边距）：表格、侧栏、页面头这些，给少了就被挤窄。
 * 墙按这个宽度算占几列（Home.astro），没列在这里的按内容的自然宽度算。
 */
export const WALL_MINW = {
  Table: 560,
  Sidebar: 520,
  Topbar: 520,
  PageHeader: 520,
  Appearance: 480,
  Layout: 480,
  Stat: 460,
  Dock: 440,
  SettingsGroup: 420,
  LayerCard: 380,
  InputGroup: 380,
  SecretInput: 360,
  Toolbar: 360,
  Code: 360,
  Card: 340,
  Dialog: 340,
  CommandPalette: 340,
  Banner: 340,
  Tabs: 320,
  List: 360,
  Field: 260,
  Search: 260,
  TagInput: 280,
  Button: 400,
};
