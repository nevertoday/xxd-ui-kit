# 安全 · Security

**中文**

xxd-ui-kit 的代码会跑在 Chrome 插件里，也会通过内容脚本注入到别人的网页（Shadow DOM），所以安全问题请**私下报告**，不要开公开 issue：

- 用 GitHub 的私密漏洞报告：仓库页面 → **Security** → **Report a vulnerability**。
- 请写清楚：受影响的包和版本（或提交）、怎么复现、可能的影响。

我们会尽快回复，确认后修复并在 [更新记录](CHANGELOG.md) 里说明（征得你同意后署名致谢）。
目前处于 alpha（0.x），只修最新版本。

**English**

xxd-ui-kit runs inside Chrome extensions and is injected into other people's web pages through content scripts (in Shadow DOM), so please **report security issues privately** rather than in a public issue:

- Use GitHub's private vulnerability reporting: the repository page → **Security** → **Report a vulnerability**.
- Please include the affected package and version (or commit), steps to reproduce, and the possible impact.

We'll reply as soon as we can, fix confirmed issues and note them in the [changelog](CHANGELOG.md) (with credit, if you'd like).
While in alpha (0.x), only the latest version receives fixes.
