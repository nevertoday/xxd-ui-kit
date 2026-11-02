# 授权方案：非商业免费，商用付费授权（2026-11-02）

维护者 2026-11-02 定下：商业用途要联系小小东付费，取得授权后才能用。参考的是朋友的项目，比如 lieflat-charts、lieflat-gongwen、lieflat-code-video。它们都是 PolyForm Noncommercial 1.0.0，商用另外签授权。商业授权的联系方式放在展示站上（微信二维码、X）。

## 决定

| 编号 | 决定 | 为什么 |
| --- | --- | --- |
| D153 | 本项目自己写的部分（令牌、样式、xxd.js、插件套件、小程序、图标、展示站、命令行）改用 **PolyForm Noncommercial 1.0.0**，`LICENSE` 放协议原文，不改一个字 | 这份协议是专门给软件写的，对「非商业」有具体的列举。CC BY-NC 是给内容写的，Creative Commons 自己也不建议用在软件上。AGPL 拦不住前端组件的商用 |
| D154 | 来自 Kumo 的代码保持 MIT（`LICENSE-KUMO`）。`packages/kumo`、`packages/kumo-docs-astro` 里，Kumo 原有的部分是 MIT，小小东的修改按 PolyForm NC，package.json 写 `(MIT AND PolyForm-Noncommercial-1.0.0)` | MIT 允许把改过的作品换别的协议发，但原来那份许可声明必须一直跟着。Kumo 原有的代码，谁都可以从上游免费拿 |
| D155 | 商用的范围、怎么取得授权，写在 `COMMERCIAL.md` / `COMMERCIAL.en.md` 和展示站的 `/license` 页（中英两版） | 协议原文是英文法律文字，要另外用大白话举例：收费的插件和网站、带广告的、公司内部用、给客户做的项目都算商用。真正算数的仍然是 `LICENSE` |
| D156 | 联系方式只放在展示站 `/license` 页：小小东的微信二维码（`public/contact/wechat-qr.png`）和 X（@xiaoxiaodong）。仓库里不写邮箱 | 开源自查规定邮箱和微信号都必须是 0 处。二维码是图片，自查不扫图片 |
| D157 | 这次之前按 MIT 发出去的代码（提交 `8aa80f12` 和更早），收到的人可以继续按 MIT 用。`COMMERCIAL.md` 写清分界线 | MIT 的授权一旦给出去就收不回来，只能管以后 |
| D158 | 以后接受别人的贡献，要在 CONTRIBUTING 里写明：提交代码就是同意小小东可以把它放进商业授权一起发 | 不这样的话，商业授权里含别人的代码，就没有权利卖 |
| D159 | 不再说「开源」，改说「源码公开」。改 README、CONTRIBUTING、AGENTS.md、`skills/xxd-ui`、各 package.json 的 `license`、构建产物文件头的那一行 | 按通行定义，限制商用的协议不算开源。说法不改，会让人以为能随便商用 |
| D160 | 版本号这次不动。等下次发版时升到 0.2.0，并决定 `/v/0.1.0/` 是冻结旧文件还是下线 | 升版本会改 CDN 地址，README 里「30 秒试一下」的 `/v/0.1.0/` 链接会失效，这个要维护者定 |

## 做了什么（2026-11-02）

- 根目录：
  - `LICENSE` 换成 PolyForm NC 原文，开头一行 `Required Notice`；
  - 新增 `COMMERCIAL.md`、`COMMERCIAL.en.md`；
  - `packages/{xxd-css,xxd-extension,xxd-icons,xxd-react,xxd-tokens}/LICENSE` 换成同一份；
  - `packages/kumo*/LICENSE` 写清哪部分是 MIT，哪部分是 PolyForm NC。
- `package.json`：本项目自己的包写 `PolyForm-Noncommercial-1.0.0`，Kumo 的两个包写组合表达式；`kumo-figma` 没有小小东的修改，不动。
- 构建出来的文件头：tokens、icons、css、extension、mini 统一成一行「PolyForm Noncommercial 1.0.0，商用请到 /license」。展示站图标包里的 README.txt 也改了。
- 文档：README 中英两版（徽标、许可、和 Kumo 的关系）、CONTRIBUTING 中英两版（贡献的授权）、AGENTS.md 硬规则、`skills/xxd-ui/SKILL.md`。
- 展示站：新增 `/license` 和 `/en/license`（正文在 `src/views/License.astro`），左侧导航「开始」组最后一项，搜索关键词。
- `.changeset/license-noncommercial.md`：minor，五个包一起升。

## 还没定的

- D160：下次发版时，`/v/0.1.0/` 怎么处理。
- 商业授权的价格、期限、范围（单个产品、整个公司、外包项目），以及合同文本。最好请律师看。
- X 账号：展示站用的是小小东VPS 网站上公开的 @xiaoxiaodong；申诉技能里记的是 @xiaoxiaodong01。要换就改 `src/views/License.astro` 里的一个常量。
