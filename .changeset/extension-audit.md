---
"@xxd/extension": patch
---

插件套件全功能验收（把 `xxd-ui new` 生成的插件装进真的 Chromium，按用户操作走一遍）发现并修好的：侧边栏的缺省「紧凑」被当成用户的选择存进共享设置，设置页跟着变紧凑，导入后撤销也回不到原来的外观（现在只存用户选过的几项）；插件更新以后 `guardContext` 本该放「请刷新」横幅，却因为取文字时 `chrome.i18n` 已失效而再抛一次错；宿主网页写了 `* { font: … !important }` 时内容脚本的按钮被顶离右下角；设置页的搜索只高亮不筛选，两个设置页搜不到时都没有一句话；`doctor` 漏掉两种让 Chrome 整个装不上的多语言目录；组件目录不叫 vendor 或写了 `tokensTargets` 时，「用了但没声明的令牌」检测失灵；`add --list`（帮助里的例子）和 `add --cwd` 从来没生效；`xxd.config.json` 写坏时报错不说是哪个文件；`index.d.ts` 里 `mountShortcuts`、`exportSettings` 的返回值和实现不一致。
