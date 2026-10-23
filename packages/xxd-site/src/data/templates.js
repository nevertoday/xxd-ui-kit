// 模板（整页）：每个都只用 @xxd/css 的类，复制整页 HTML 就能用。
const I = (n, s = 16) => `<i data-xxd-icon="${n}" data-size="${s}"></i>`;
const thumbs = (...c) => `<span class="xxd-thumbs">${c.map((x) => `<span style="background:${x}"></span>`).join("")}</span>`;

const sidepanel = `
<div class="xxd-sheet-host" data-density="compact" style="display:flex;flex-direction:column;height:100%">
  <nav class="xxd-tabs" data-xxd-tabs style="flex:none;padding:0 var(--inset-md)" aria-label="主导航">
    <button role="tab" id="sp-t1" aria-controls="sp-p1" aria-selected="true">排序</button>
    <button role="tab" id="sp-t2" aria-controls="sp-p2">记录</button>
    <button role="tab" id="sp-t3" aria-controls="sp-p3">设置</button>
  </nav>
  <main style="flex:1;min-height:0;overflow:auto">
    <section id="sp-p1" style="padding:var(--inset-md);display:grid;gap:var(--space-3)">
      <div class="xxd-dropzone">${I("ImagePlus", 24)}<p class="xxd-dropzone__title">把图片拖到这里</p><p class="xxd-help">也可以 <button class="xxd-link" type="button">选择图片文件</button></p></div>
      <div class="xxd-group__body"><ul class="xxd-list" data-interactive>
        <li class="xxd-list__item">${I("Globe")}<button class="xxd-list__main" type="button"><span class="xxd-list__title">取这个网页的图片</span><span class="xxd-list__meta">mp.weixin.qq.com 上有 31 张</span></button></li>
        <li class="xxd-list__item">${I("Columns3")}<button class="xxd-list__main" type="button"><span class="xxd-list__title">取所有标签页的图片</span><span class="xxd-list__meta">这个窗口的 6 个网页</span></button></li>
        <li class="xxd-list__item">${I("Link")}<button class="xxd-list__main" type="button"><span class="xxd-list__title">打开一个网址</span></button></li>
      </ul></div>
    </section>
    <section id="sp-p2" style="padding:var(--inset-md)" class="xxd-history">
      <section><h3 class="xxd-history__day">今天</h3><ul class="xxd-list xxd-group__body" data-interactive>
        <li class="xxd-list__item">${thumbs("#d65f32", "#3b74b8", "#5a8a3c")}<div class="xxd-list__main"><div class="xxd-list__title">24 张图片</div><div class="xxd-list__meta">渐变 · 14:02</div></div><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs" data-confirm-twice="确认删除">删除</button></li>
      </ul></section>
    </section>
    <section id="sp-p3" style="padding:var(--inset-md)" class="xxd-settings">
      <div class="xxd-group__body"><div class="xxd-account"><span class="xxd-avatar" data-member style="--avatar-size:32px">东</span><div class="xxd-account__main"><div class="xxd-account__name">小小东</div><div class="xxd-plan-line" data-tone="member">会员 · 到 2027年11月8日</div></div><button class="xxd-btn" data-size="sm">管理</button></div></div>
      <section class="xxd-group"><h2 class="xxd-group__title">排序</h2><div class="xxd-group__body">
        <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">新的一组先用</div></div><div class="xxd-row__control"><label class="xxd-select" data-variant="bare"><select aria-label="新的一组先用"><option>渐变</option><option>原样</option></select></label></div></div>
        <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">只留图片链接</div><div class="xxd-row__desc">去掉没有图片后缀的链接</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="只留图片链接"></div></div>
      </div></section>
    </section>
  </main>
  <div class="xxd-statusline">正在读取颜色 12 / 40<button class="xxd-link" type="button">停止</button></div>
  <footer class="xxd-dock" style="position:static">
    <div class="xxd-dock__status">24 张 · 来自 mp.weixin.qq.com</div>
    <div class="xxd-dock__tools"><button class="xxd-btn" data-size="sm">加图片</button><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="导出">${I("Ellipsis")}</button></div>
    <div class="xxd-dock__primary"><button class="xxd-btn" data-variant="primary" data-size="sm">复制 24 个链接</button></div>
  </footer>
</div>`;

const signIn = `
<div style="height:100%;display:grid;place-items:center">
<div class="xxd-auth" data-xxd-auth>
  <span class="xxd-logo" data-size="lg"><span class="xxd-logo__mark"></span></span>
  <h2 class="xxd-auth__name">小小东 · 图片排序</h2>
  <p class="xxd-auth__line">按颜色给图片链接排序。</p>
  <span class="xxd-auth__gift">新账号送 7 天完整体验</span>
  <form>
    <button class="xxd-btn" data-block type="button"><svg class="ui-icon" width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>使用 Google 继续</button>
    <div class="xxd-auth__or">或使用邮箱</div>
    <div data-step="email" data-active><input class="xxd-input" type="email" placeholder="you@example.com" aria-label="邮箱" required><button class="xxd-btn" data-variant="primary" data-block data-auth-next="password">继续</button></div>
    <div data-step="password"><p class="xxd-help">登录 <b data-auth-email></b></p><input class="xxd-input" type="password" placeholder="密码" aria-label="密码"><div class="xxd-cluster"><button class="xxd-btn ui-dialog-cancel" data-auth-back="email">返回</button><button class="xxd-btn" data-variant="primary" style="flex:1">继续</button></div></div>
  </form>
  <p class="xxd-auth__terms">继续即表示同意 <a class="xxd-link" href="#">服务条款</a> 和 <a class="xxd-link" href="#">隐私政策</a></p>
</div></div>`;

const settings = `
<div style="padding:var(--space-8) var(--space-4) calc(var(--space-8) * 2)" class="xxd-read">
  <h1 class="xxd-text" data-variant="heading1" style="margin-bottom:var(--space-4)">设置</h1>
  <div class="xxd-input-wrap" style="margin-bottom:var(--space-5)">${I("Search")}<input class="xxd-input" type="search" placeholder="搜索设置（⌘F）" aria-label="搜索设置"><button class="xxd-input-clear" aria-label="清空">${I("X", 14)}</button></div>
  <div class="xxd-settings">
    <section class="xxd-group"><h2 class="xxd-group__title">账号</h2><div class="xxd-group__body"><div class="xxd-account"><span class="xxd-avatar" style="--avatar-size:36px">东</span><div class="xxd-account__main"><div class="xxd-account__name">小小东</div><div class="xxd-plan-line">免费版 · 今天还能写入 3 篇</div></div><button class="xxd-btn" data-size="sm" data-variant="primary">开通会员</button></div></div></section>
    <section class="xxd-group"><h2 class="xxd-group__title">写入</h2><div class="xxd-group__body">
      <div class="xxd-row" data-keywords="标题 title"><div class="xxd-row__text"><div class="xxd-row__title">写入标题</div><div class="xxd-row__desc">第一行 # 标题作为文章标题</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="写入标题"></div></div>
      <div class="xxd-row" data-keywords="标点 引号"><div class="xxd-row__text"><div class="xxd-row__title">智能标点</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="智能标点"></div></div>
      <a class="xxd-row" href="#"><div class="xxd-row__text"><div class="xxd-row__title">本地图片文件夹</div><div class="xxd-row__desc">未连接</div></div></a>
    </div></section>
    <section class="xxd-group"><h2 class="xxd-group__title">AI 服务</h2><div class="xxd-group__body">
      <div class="xxd-row" data-stack><div class="xxd-row__text"><div class="xxd-row__title">API 密钥</div><div class="xxd-row__desc">只保存在这台电脑上</div></div><div class="xxd-input-group xxd-secret" data-xxd-secret><input type="password" value="sk_live_4f8a2c91d7e3b6a0" readonly aria-label="API 密钥"><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-secret-toggle aria-label="显示密钥">${I("Eye")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-secret-copy aria-label="复制">${I("Copy")}</button></div></div>
    </div></section>
    <div id="tpl-appearance"></div>
    <section class="xxd-group"><h2 class="xxd-group__title">关于</h2><div class="xxd-group__body">
      <div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">版本</div></div><div class="xxd-row__control xxd-text" data-variant="mono-secondary">1.8.2</div></div>
      <a class="xxd-row" href="#"><div class="xxd-row__text"><div class="xxd-row__title">隐私政策</div></div></a>
    </div></section>
  </div>
</div>
<script>
  Xxd.mountAppearance(document.getElementById("tpl-appearance"), { languages: [{ value: "zh-CN", label: "简体中文" }, { value: "zh-Hant", label: "繁體中文" }, { value: "en", label: "English" }], language: "zh-CN" });
  Xxd.init(document);
  Xxd.bindSettingsSearch(document.querySelector('.xxd-input-wrap input'), document.querySelector('.xxd-settings'), { hotkey: false });
</script>`;

const detailPanel = `
<div style="height:100%;position:relative;overflow:hidden">
  <!-- 瀑布流：图片高矮不一，按列排（CSS columns）；收藏的那几张左上角一个点 -->
  <div class="xxd-panel-room" style="height:100%;overflow:auto"><div style="columns:150px;column-gap:var(--space-3);padding:var(--inset-md)">${[["1", "3/4"], ["2", "1/1"], ["3", "4/5"], ["4", "2/3"], ["5", "3/4"], ["6", "15/16"]].map(([n, r], i) => `<a class="xxd-card" href="#" style="break-inside:avoid;margin-bottom:var(--space-3)"><div class="xxd-card__media" style="--ratio:${r};background:center / cover url(/demo/poster-${n}.svg)">${i % 3 === 0 ? `<div class="xxd-card__marks"><span class="xxd-dot" data-tone="danger"></span></div>` : ""}</div><div class="xxd-card__body"><p class="xxd-card__title">编辑式海报 00${i + 1}</p><span class="xxd-card__meta">xxd-panel-00${i + 1}</span></div></a>`).join("")}</div></div>
  <aside class="xxd-panel" data-open style="position:absolute" aria-label="提示词详情">
    <div class="xxd-panel__head"><h2 class="xxd-panel__title">编辑式海报 001</h2><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="复制提示词" data-tooltip="复制提示词">${I("Copy")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="关闭">${I("X")}</button></div>
    <div class="xxd-panel__body"><div class="xxd-card__media" style="--ratio:3/4;width:100%;max-height:min(420px, 50vh);background:center / contain no-repeat url(/demo/poster-1.svg) var(--wash);border-radius:var(--r-md)"></div>
      <div class="xxd-prose" style="margin-top:var(--space-4)"><h3>提示词</h3><p>克制的编辑式粗野主义：纸色背景、清晰的黑线、干净的无衬线字、密但好读的中文。</p></div>
      <div class="xxd-cluster" style="margin-top:var(--space-3)"><button class="xxd-chip" aria-pressed="true">海报</button><button class="xxd-chip">编辑式</button></div>
    </div>
    <footer class="xxd-dock" style="position:static"><div class="xxd-dock__status">2,410 次使用</div><div class="xxd-dock__tools"><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="上一个">${I("ChevronLeft")}</button><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="下一个">${I("ChevronRight")}</button></div><div class="xxd-dock__primary"><button class="xxd-btn" data-variant="primary" data-size="sm">用这个风格生成</button></div></footer>
  </aside>
</div>`;

const article = `
<div class="xxd-layout" data-cols="2-1" style="padding:var(--space-8) var(--space-6);max-width:1080px;margin:0 auto;--layout-gap:calc(var(--space-8) + var(--space-4))">
  <article class="xxd-prose">
    <ol class="xxd-breadcrumbs"><li><a href="#">文章</a></li><li aria-current="page">设计系统</li></ol>
    <h1 id="a1">一个人的设计系统</h1>
    <p>二十多个插件、一个会员站，同一套审美：黑白灰、默认直角、强调靠墨色。</p>
    <h2 id="a2">为什么是直角</h2>
    <p>直角让内容先说话。<a href="#">会员站的硬规则</a>是：对话框、卡片、按钮、输入框都不许圆角。</p>
    <blockquote>动效用来揭示层级和给反馈，不是装饰。</blockquote>
    <h2 id="a3">令牌</h2>
    <p>所有颜色、圆角、阴影都来自 <code>tokens.css</code>。</p>
    <pre><code>--r-sm: 0px; /* 默认直角 */</code></pre>
    <h3 id="a4">主色</h3>
    <ul><li>12 个预设</li><li>自动提亮或加深，保证对比度</li></ul>
  </article>
  <aside style="position:sticky;top:24px;align-self:start"><p class="xxd-toc__title">本文</p><ul class="xxd-toc" data-spy><li><a href="#a1" aria-current="true">一个人的设计系统</a></li><li><a href="#a2">为什么是直角</a></li><li><a href="#a3">令牌</a></li><li data-depth="3"><a href="#a4">主色</a></li></ul></aside>
</div>`;

const resourceList = `
<div style="padding:0 var(--space-6) var(--space-8);max-width:1080px;margin:0 auto">
  <header class="xxd-page-header">
    <ol class="xxd-breadcrumbs"><li><a href="#">小小东</a></li><li aria-current="page">插件</li></ol>
    <div class="xxd-page-header__row"><h1 class="xxd-page-header__title">插件</h1><div class="xxd-page-header__actions"><button class="xxd-btn">导入</button><button class="xxd-btn" data-variant="primary">${I("Plus")}新建插件</button></div></div>
    <p class="xxd-page-header__desc">所有接入小小东 UI 的插件，版本是否最新、上次发布时间。</p>
  </header>
  <div class="xxd-cluster" style="margin-bottom:var(--space-3)"><div class="xxd-input-wrap" style="width:260px">${I("Search")}<input class="xxd-input" data-size="sm" type="search" placeholder="搜索插件" aria-label="搜索插件"></div><button class="xxd-chip" data-size="sm" aria-pressed="true">全部</button><button class="xxd-chip" data-size="sm">落后</button><button class="xxd-chip" data-size="sm">待发布</button></div>
  <div class="xxd-table-wrap"><table class="xxd-table" data-interactive>
    <thead><tr><th class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-all aria-label="全选"></th><th aria-sort="ascending"><button class="xxd-th-sort">插件</button></th><th>UI Kit</th><th aria-sort="none" data-align="end"><button class="xxd-th-sort">用户</button></th><th>状态</th><th class="xxd-table__actions"><span class="xxd-sr-only">操作</span></th></tr></thead>
    <tbody>
      ${[["长文发布", "最新", "2,410", "success", "已上架"], ["排序链接", "落后 2", "830", "warning", "待发布"], ["批量存图", "未接入", "5,102", "success", "已上架"], ["今日待办", "最新", "312", "", "审核中"]].map(([n, v, u, t, s]) => `<tr><td class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-row aria-label="选择 ${n}"></td><td><span class="xxd-logo" data-size="sm"><span class="xxd-logo__mark"></span>${n}</span></td><td>${v}</td><td data-align="end">${u}</td><td><span class="xxd-badge" data-appearance="dot" ${t ? `data-tone="${t}"` : ""}>${s}</span></td><td class="xxd-table__actions"><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs">同步</button></td></tr>`).join("")}
    </tbody>
  </table></div>
  <div class="xxd-pagination-bar" style="margin-top:var(--space-3)"><span class="xxd-pagination__info"></span><nav class="xxd-pagination" data-xxd-pagination data-page="1" data-total="24" data-per-page="4" aria-label="分页"></nav></div>
</div>`;

const deleteConfirm = `
<div style="height:100%;display:grid;place-items:center;gap:var(--space-4);align-content:center;padding:var(--space-6)">
  <!-- 对话框直接展开着看（真的用 Xxd.confirmDelete 打开；下面的按钮可以试） -->
  <div class="xxd-dialog" data-static role="alertdialog" aria-labelledby="dc-title" aria-describedby="dc-desc" style="width:100%;max-width:400px">
    <div class="xxd-dialog__head"><h2 class="xxd-dialog__title" id="dc-title">删除「长文发布」？</h2></div>
    <div class="xxd-dialog__body">
      <p id="dc-desc">会永久删除这个插件的全部记录和设置，不能恢复。</p>
      <div class="xxd-field"><label class="xxd-label" for="dc-name">输入「长文发布」确认</label><input class="xxd-input" id="dc-name" autocomplete="off"></div>
    </div>
    <div class="xxd-dialog__actions"><button class="xxd-btn ui-dialog-cancel">取消</button><button class="xxd-btn" data-variant="danger" disabled>删除</button></div>
  </div>
  <button class="xxd-btn" data-variant="danger-outline" data-size="sm" onclick="Xxd.confirmDelete({ name: '长文发布', what: '这个插件的全部记录和设置' }).then((ok) => ok && Xxd.toast('已删除', { tone: 'success' }))">试一下：删除插件…</button>
  <p class="xxd-text" data-variant="caption">没那么严重的，用「两次确认」（模式）。</p>
</div>`;

import { templates as templatesEn } from "./templates.en.js";

export const templatesFor = (lang = "zh") => (lang === "en" ? templatesEn.map((t) => ({ ...t, label: t.title })) : templates.map((t) => ({ ...t, label: t.zh })));

export const templates = [
  { slug: "extension-sidepanel", zh: "插件侧边栏", summary: "紧凑密度：tab 在最上面（没有顶栏）、拖放区和取图方式、记录、设置、状态行、底部 dock。", markup: sidepanel, width: 380, height: 720, where: "Chrome 侧边栏" },
  { slug: "extension-sign-in", zh: "插件登录页", summary: "没登录时侧边栏只有这一屏。", markup: signIn, width: 380, height: 640, where: "Chrome 侧边栏" },
  { slug: "settings", zh: "设置页", summary: "搜索钉在顶部（过滤 + 标字）、账号、写入、AI 密钥、外观组、关于。", markup: settings, height: 980, flow: true },
  { slug: "detail-panel", zh: "会员站详情面板", summary: "瀑布流 + 右侧详情面板：标题栏、图、提示词、标签、底部 dock（上一个 / 下一个 / 下一步）。", markup: detailPanel, height: 680 },
  { slug: "article", zh: "文章阅读页", summary: "阅读排版 + 右侧目录（滚动高亮）。", markup: article, height: 760, flow: true },
  { slug: "resource-list", zh: "资源列表页", summary: "页面头、筛选、表格（全选 / 排序 / 悬停操作）、分页。", markup: resourceList, height: 620, flow: true },
  { slug: "delete-confirm", zh: "删除确认", summary: "输入名字确认删除的对话框。", markup: deleteConfirm, height: 460 },
];
