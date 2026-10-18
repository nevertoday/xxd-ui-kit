// 颜色色阶原型页（docs/maintainers/COLOR-SCALE-PLAN.md S1）：只看，不改组件。
//   node scripts/scales-prototype.mjs [输出文件]   缺省写到展示站的 dist/proto/color-scales.html（本机预览 :4400 能打开，不进源码、不会部署）
// 页面里：五族 × 亮暗的 12 级色阶（用途、色值、关键对比度）；任意主色 + 自动 / 原样；几个组件「现在 vs 色阶版」并排。
// 「现在」是真的组件样式；「色阶版」是同样的组件，只在这一块里把现场混色换成某一级（原型用的覆盖样式写在下面）。
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, "../../xxd-site/dist/proto/color-scales.html");

const bundle = buildSync({ entryPoints: [join(here, "../src/scales.js")], bundle: true, format: "iife", globalName: "XxdScales", write: false, minify: true }).outputFiles[0].text;

const ROLES_ZH = ["页面底", "浅一层的底", "淡底", "淡底悬停 / 选中", "淡底按下", "安静的线", "边", "边悬停", "实心底", "实心底悬停", "带颜色的字", "强调字"];
const NOW = { 1: "--bg", 3: "--wash", 4: "--wash-strong", 6: "--line", 7: "--line-strong", 8: "--muted-2", 9: "--line-control", 11: "--muted", 12: "--ink" };

const sample = `
<div class="proto-row"><span class="xxd-badge">草稿</span><span class="xxd-badge" data-tone="action">会员</span><span class="xxd-badge" data-tone="success">已写入</span><span class="xxd-badge" data-tone="warning">待更新</span><span class="xxd-badge" data-tone="danger">失败</span></div>
<div class="xxd-banner" data-tone="warning"><i data-xxd-icon="TriangleAlert"></i><div><p class="xxd-banner__title">今天还能写入 1 篇</p><p class="xxd-banner__text">明天 0 点恢复；会员不限。</p></div></div>
<div class="xxd-banner" data-tone="danger"><i data-xxd-icon="CircleX"></i><div><p class="xxd-banner__title">写入失败</p><p class="xxd-banner__text">X 拒绝了这次请求，稍后再试。</p></div></div>
<div class="xxd-banner" data-tone="success"><i data-xxd-icon="CircleCheck"></i><div><p class="xxd-banner__title">已写入 24 篇</p></div></div>
<div class="proto-row"><button class="xxd-chip" aria-pressed="true">海报</button><button class="xxd-chip">封面</button><button class="xxd-chip" aria-pressed="true">编辑式</button></div>
<div class="proto-row"><button class="xxd-btn" data-variant="primary">写入 X</button><button class="xxd-btn" data-variant="danger-outline">移除</button><button class="xxd-btn" data-variant="danger">删除</button><button class="xxd-btn" aria-pressed="true">已钉住</button></div>
<ul class="xxd-list xxd-group__body"><li class="xxd-list__item">一个人的设计系统</li><li class="xxd-list__item" aria-current="true">为什么是直角（选中）</li><li class="xxd-list__item">令牌</li></ul>
<div class="proto-row" style="align-items:flex-start"><input class="xxd-input proto-focus" value="聚焦时边框变深一次" aria-label="示例"><div class="xxd-field"><input class="xxd-input" value="not-an-email" aria-invalid="true" aria-label="邮箱"><p class="xxd-error">请输入有效的邮箱地址</p></div></div>
<div class="xxd-toast" data-tone="success"><i data-xxd-icon="CircleCheck" data-size="16"></i><span>已保存草稿</span></div>`;

const html = `<!doctype html>
<html lang="zh-CN" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>颜色色阶 · 原型</title>
<script src="/xxd/boot.js" data-key="xxd-scales-proto"></script>
<link rel="stylesheet" href="/xxd/xxd.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  body { margin: 0; }
  .proto { max-width: 1240px; margin: 0 auto; padding: 32px 24px 80px; }
  .proto h2 { margin: 40px 0 8px; font: var(--weight-strong) var(--text-xl) / var(--leading-lg) var(--font-body); }
  .proto p.lead { max-width: 760px; color: var(--muted); }
  .proto-bar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; padding: 12px 0; background: var(--bg); border-bottom: 1px solid var(--line); }
  .scale { display: grid; grid-template-columns: 96px repeat(12, minmax(0, 1fr)); gap: 4px; margin: 6px 0; align-items: stretch; }
  .scale > b { align-self: center; font: var(--weight-medium) var(--text-xs) / var(--leading-xs) var(--font-body); }
  .sw { display: grid; align-content: end; min-height: 64px; padding: 4px; border-radius: 0; font: 10px / 14px var(--font-mono); }
  .sw i { font-style: normal; opacity: .9; }
  .scale-head { display: grid; grid-template-columns: 96px repeat(12, minmax(0, 1fr)); gap: 4px; color: var(--muted); font-size: 11px; line-height: 14px; }
  .modes { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .mode { padding: 16px; border: 1px solid var(--line); color: var(--ink); }
  .mode[data-theme="dark"] { background: #171612; }
  .cmp { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .cmp > section { display: grid; gap: 12px; align-content: start; padding: 20px; border: 1px solid var(--line); background: var(--bg); }
  .cmp h3 { margin: 0; font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); color: var(--muted); }
  .proto-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .proto-focus { border-color: color-mix(in srgb, var(--action) 70%, var(--line-control)) !important; }
  table.map { border-collapse: collapse; font-size: 13px; }
  table.map td, table.map th { padding: 6px 12px; border-bottom: 1px solid var(--line); text-align: left; }
  /* ── 色阶版：同样的组件，现场混色换成某一级（--g 灰、--a 主色、--s 成功、--d 危险、--w 警告） ── */
  .proto-new { --bg: var(--g-1); --wash: var(--g-3); --wash-strong: var(--g-4); --selected-bg: var(--a-4); --line: var(--g-6); --line-strong: var(--g-7); --line-control: var(--g-9); --muted-2: var(--g-8); --muted: var(--g-11); --ink: var(--g-12);
    --action: var(--a-9); --action-text: var(--a-11); --action-fill: var(--a-9); --action-fill-hover: var(--a-10); --on-action: var(--a-on);
    --success: var(--s-11); --danger: var(--d-11); --warning: var(--w-11); --success-strong: var(--s-9); --danger-strong: var(--d-9); --warning-strong: var(--w-9); }
  .proto-new .xxd-badge { background: var(--g-4); color: var(--g-12); }
  .proto-new .xxd-badge[data-tone="action"] { background: var(--a-3); color: var(--a-11); }
  .proto-new .xxd-badge[data-tone="success"] { background: var(--s-3); color: var(--s-11); }
  .proto-new .xxd-badge[data-tone="warning"] { background: var(--w-3); color: var(--w-11); }
  .proto-new .xxd-badge[data-tone="danger"] { background: var(--d-3); color: var(--d-11); }
  .proto-new .xxd-banner[data-tone="warning"] { background: var(--w-2); border-color: var(--w-6); }
  .proto-new .xxd-banner[data-tone="danger"] { background: var(--d-2); border-color: var(--d-6); }
  .proto-new .xxd-banner[data-tone="success"] { background: var(--s-2); border-color: var(--s-6); }
  .proto-new .xxd-chip[aria-pressed="true"] { background: var(--a-4); border-color: var(--a-7); color: var(--a-11); }
  .proto-new .xxd-btn[data-variant="danger-outline"] { --btn-fg: var(--d-11); --btn-bd: var(--d-7); --btn-bg-hover: var(--d-3); }
  .proto-new .xxd-btn[data-variant="danger"] { --btn-bg-hover: var(--d-10); }
  .proto-new .xxd-btn[aria-pressed="true"] { --btn-bg: var(--a-4); --btn-bg-hover: var(--a-5); --btn-bd: var(--a-7); }
  .proto-new .proto-focus { border-color: var(--a-9) !important; }
  .proto-new .xxd-input[aria-invalid="true"] { border-color: var(--d-9); }
</style></head>
<body class="xxd-page">
<div class="proto">
  <p class="xxd-text" data-variant="caption">原型 · docs/maintainers/COLOR-SCALE-PLAN.md S1 · 只看，不改组件</p>
  <h1 class="xxd-text" data-variant="display">颜色色阶</h1>
  <p class="lead">借鉴 Radix Colors：每种颜色 12 级，每一级用途固定，亮暗各一套。暖灰的明度锚在现有令牌上，所以「现在」和「色阶版」的灰基本一样；变化主要在各种淡底、边和语义色。</p>
  <div class="proto-bar">
    <label class="xxd-choice"><input type="color" id="pick" value="#4386ba" aria-label="主色"> 主色 <code class="xxd-code-inline" id="hex">#4386ba</code></label>
    <label class="xxd-select" style="width:160px"><select id="preset" aria-label="预设"></select></label>
    <div class="xxd-segmented" data-xxd-segmented id="mode" aria-label="模式"><button role="radio" data-value="auto" aria-checked="true">自动</button><button role="radio" data-value="exact" aria-checked="false">原样</button></div>
    <div class="xxd-segmented" data-xxd-segmented id="theme" aria-label="主题"><button role="radio" data-value="light" aria-checked="true">亮</button><button role="radio" data-value="dark" aria-checked="false">暗</button></div>
    <span class="xxd-text" data-variant="caption" id="gate"></span>
  </div>

  <h2>五族的色阶</h2>
  <div class="scale-head"><span></span>${ROLES_ZH.map((r, i) => `<span>${i + 1} · ${r}</span>`).join("")}</div>
  <div class="modes">
    <div class="mode" data-theme="light"><p class="xxd-text" data-variant="caption">亮</p><div data-scales="light"></div></div>
    <div class="mode" data-theme="dark"><p class="xxd-text" data-variant="caption">暗</p><div data-scales="dark"></div></div>
  </div>

  <h2>级别和现在的令牌</h2>
  <table class="map"><thead><tr><th>级</th><th>用途</th><th>角色名（以危险色为例）</th><th>现在的灰令牌</th></tr></thead><tbody>
    ${ROLES_ZH.map((r, i) => `<tr><td>${i + 1}</td><td>${r}</td><td><code class="xxd-code-inline">--danger-${["bg-page", "bg", "tint", "tint-hover", "tint-active", "line", "border", "border-hover", "solid", "solid-hover", "text", "text-strong"][i]}</code></td><td>${NOW[i + 1] ? `<code class="xxd-code-inline">${NOW[i + 1]}</code>` : "—"}</td></tr>`).join("")}
  </tbody></table>

  <h2>组件：现在 vs 色阶版</h2>
  <p class="lead">左边是现在的样子（现场混色）；右边是同样的组件，淡底、边、字都换成某一级。切换上面的主色、模式和亮暗一起看。</p>
  <div class="cmp">
    <section><h3>现在</h3>${sample}</section>
    <section class="proto-new" id="new"><h3>色阶版</h3>${sample}</section>
  </div>
</div>
<script src="/xxd/icons.js"></script><script src="/xxd/xxd.js"></script>
<script>${bundle}</script>
<script>
  (() => {
    const S = window.XxdScales, T = window.XxdTheme;
    const FAM = [["gray", "暖灰", "g"], ["accent", "主色", "a"], ["success", "成功", "s"], ["danger", "危险", "d"], ["warning", "警告", "w"]];
    const pick = document.getElementById("pick"), preset = document.getElementById("preset");
    let mode = "auto", theme = "light";
    for (const p of T.ACCENT_PRESETS) preset.add(new Option(p.zh || p.name, p.id));
    preset.value = "#4386ba";
    const L = (hex) => S.hexToOklch(hex)[0];
    const ratio = (a, b) => T.accent.contrast(T.accent.toRgb(a), T.accent.toRgb(b)).toFixed(1);
    function render() {
      const accent = preset.value === "" ? "" : pick.value;
      document.getElementById("hex").textContent = accent || "墨色";
      const f = S.generateFamilies({ accent, accentMode: mode });
      let bad = 0;
      for (const m of ["light", "dark"]) {
        document.querySelector('[data-scales="' + m + '"]').innerHTML = FAM.map(([k, name]) => {
          const s = f[m][k];
          bad += S.checkScale(s, { kind: k === "gray" || (!accent && k === "accent") ? "gray" : "color" }).filter((x) => !(mode === "exact" && k === "accent" && x.startsWith("9 级在"))).length;
          return '<div class="scale"><b>' + name + '</b>' + s.steps.map((hex, i) => {
            const fg = L(hex) > 0.62 ? "#111111" : "#ffffff";
            const note = i === 8 ? "字 " + ratio(hex, s.on) : i === 10 ? "对 2 级 " + ratio(hex, s.steps[1]) : i === 11 ? "对 2 级 " + ratio(hex, s.steps[1]) : "";
            return '<span class="sw" style="background:' + hex + ';color:' + fg + '"><i>' + hex + '</i>' + (note ? "<i>" + note + "</i>" : "") + "</span>";
          }).join("") + "</div>";
        }).join("");
      }
      document.getElementById("gate").textContent = bad ? "对比度门禁：" + bad + " 处不够" : "对比度门禁：全部达标" + (mode === "exact" ? "（原样模式不检查实心底在纸上的 3:1）" : "");
      // 现在：真的主色设置；色阶版：这一块的 --g-1 … --w-12
      T.set({ theme, accent, accentMode: mode });
      const box = document.getElementById("new");
      for (const [k, , p] of FAM) { f[theme][k].steps.forEach((hex, i) => box.style.setProperty("--" + p + "-" + (i + 1), hex)); box.style.setProperty("--" + p + "-on", f[theme][k].on); }
    }
    pick.addEventListener("input", () => { preset.value = [...preset.options].some((o) => o.value === pick.value) ? pick.value : preset.value; render(); });
    preset.addEventListener("change", () => { if (preset.value) pick.value = preset.value; render(); });
    document.getElementById("mode").addEventListener("xxd:change", (e) => { mode = e.detail.value; render(); });
    document.getElementById("theme").addEventListener("xxd:change", (e) => { theme = e.detail.value; render(); });
    render();
  })();
</script>
</body></html>`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`色阶原型 → ${out}`);
