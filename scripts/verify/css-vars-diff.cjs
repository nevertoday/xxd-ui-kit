// 迁移的零视觉变化检查：在无头 Chromium 里分别加载两份 CSS，比较亮 / 暗两种主题下每个自定义属性的最终值，
// 以及几个真实属性（圆角、遮罩、页面底色和字色、color-scheme）。
//   CHROME_EXE=<chromium 可执行文件> node scripts/verify/css-vars-diff.cjs before.css after.css

const fs = require("node:fs");
const pw = require(require.resolve("playwright", { paths: [require("node:path").join(__dirname, "../../node_modules/.pnpm/playwright@1.57.0/node_modules")] }));
const [beforeFile, afterFile] = process.argv.slice(2);
(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROME_EXE });
  const all = new Set();
  for (const f of [beforeFile, afterFile]) for (const m of fs.readFileSync(f, "utf8").matchAll(/(--[a-zA-Z][\w-]*)\s*:/g)) all.add(m[1]);
  const names = [...all];
  async function snapshot(file, theme) {
    const page = await browser.newPage();
    await page.setContent(`<html data-theme="${theme}"><head><style>${fs.readFileSync(file, "utf8").replace(/<\/style/g, "")}</style></head><body><div id="r1" style="border-radius:var(--ui-radius);width:10px;height:10px"></div><div id="r2" style="border-radius:var(--ui-radius-sm)"></div><div id="r3" style="border-radius:var(--ui-radius-xs)"></div><div id="b" style="background:var(--ui-backdrop)"></div></body></html>`);
    const res = await page.evaluate((names) => {
      const cs = getComputedStyle(document.documentElement);
      const vars = Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]));
      const real = {
        r1: getComputedStyle(document.getElementById("r1")).borderTopLeftRadius,
        r2: getComputedStyle(document.getElementById("r2")).borderTopLeftRadius,
        r3: getComputedStyle(document.getElementById("r3")).borderTopLeftRadius,
        b: getComputedStyle(document.getElementById("b")).backgroundColor,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color,
        scheme: cs.colorScheme,
      };
      return { vars, real };
    }, names);
    await page.close();
    return res;
  }
  const report = {};
  for (const theme of ["light", "dark"]) {
    const a = await snapshot(beforeFile, theme), b = await snapshot(afterFile, theme);
    const norm = (v) => v.replace(/\b0px\b/g, "0");
    const changed = names.filter((n) => norm(a.vars[n]) !== norm(b.vars[n]));
    const newlyDefined = changed.filter((n) => a.vars[n] === "" && b.vars[n] !== "");
    report[theme] = { compared: names.length, changedExisting: changed.filter((n) => !newlyDefined.includes(n)).map((n) => `${n}: ${a.vars[n]} → ${b.vars[n]}`), newlyDefined: newlyDefined.length, realBefore: a.real, realAfter: b.real, realSame: JSON.stringify(a.real) === JSON.stringify(b.real) };
  }
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();
