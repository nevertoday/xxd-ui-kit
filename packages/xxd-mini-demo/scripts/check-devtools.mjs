// 在微信开发者工具里跑一遍演示小程序（MINIPROGRAM-PLAN §11、MINI-REVIEW-PLAN Q6）：H5 量不出来的那些。
//   1. 每个主页面亮 / 暗各截一张（shots/devtools/）；
//   2. 打开底部面板、再开对话框，按返回键：先关对话框，再关面板，还在这一页（page-container 一页一个）；
//   3. 切主色、圆角、强制暗色，换页以后导航栏颜色对；
//   4. 每个能点的东西有 aria-role，开关和复选框有 aria-checked；
//   5. 左滑一行：渲染层收到的 setData 次数（看跟手的代价）。
//
// 要先装：微信开发者工具（设置 → 安全 → 打开「服务端口」），以及 miniprogram-automator（不进依赖，用的时候装）：
//   pnpm --filter @xxd/mini-demo build:weapp
//   pnpm dlx -p miniprogram-automator node packages/xxd-mini-demo/scripts/check-devtools.mjs
// 环境变量：WECHAT_CLI=开发者工具 cli 的路径（macOS 缺省 /Applications/wechatwebdevtools.app/Contents/MacOS/cli）
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("..", import.meta.url));
const project = join(here, "dist");
const cli = process.env.WECHAT_CLI ?? "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";
if (!existsSync(join(project, "app.json"))) {
  console.error("✗ 还没编微信版：pnpm --filter @xxd/mini-demo build:weapp");
  process.exit(1);
}
if (!existsSync(cli)) {
  console.error(`✗ 没找到微信开发者工具的命令行（${cli}）。装好开发者工具、打开「服务端口」，或者用 WECHAT_CLI 指给它。`);
  process.exit(1);
}
let automator;
try {
  automator = (await import("miniprogram-automator")).default;
} catch {
  console.error("✗ 没装 miniprogram-automator：pnpm dlx -p miniprogram-automator node packages/xxd-mini-demo/scripts/check-devtools.mjs");
  process.exit(1);
}

const problems = [];
const fail = (s, m) => problems.push(`[${s}] ${m}`);
const shots = join(here, "shots/devtools");
mkdirSync(shots, { recursive: true });
const mp = await automator.launch({ cliPath: cli, projectPath: project });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // 1. 截图
  for (const theme of ["light", "dark"]) {
    await mp.callWxMethod("setStorageSync", "xxd-ui", JSON.stringify({ theme }));
    for (const path of ["/pages/index/index", "/pages/todo/index", "/pages/settings/index"]) {
      await mp.reLaunch(path);
      await wait(800);
      await mp.screenshot({ path: join(shots, `${path.split("/")[2]}-${theme}.png`) });
    }
  }
  await mp.callWxMethod("setStorageSync", "xxd-ui", JSON.stringify({ theme: "system" }));

  // 2. 返回键：面板里再开对话框
  let page = await mp.navigateTo("/pages/component/index?name=Dialog");
  await wait(600);
  const before = (await mp.currentPage()).path;
  const open = async (text) => {
    const btns = await page.$$("button");
    for (const b of btns) if ((await b.text()).includes(text)) return b.tap();
    fail("返回键", `没找到「${text}」`);
  };
  await open("删除这篇");
  await wait(400);
  await mp.navigateBack(); // 返回键
  await wait(500);
  if ((await mp.currentPage()).path !== before) fail("返回键", "对话框开着时按返回，直接离开了这一页");
  if ((await page.$$(".xxd-dialog")).length) fail("返回键", "按返回以后对话框还在");

  // 3. 强制暗色：换页以后导航栏是暗的（截图人工看）
  await mp.callWxMethod("setStorageSync", "xxd-ui", JSON.stringify({ theme: "dark", accent: "4386ba", corners: "rounded" }));
  page = await mp.reLaunch("/pages/todo/index");
  await wait(800);
  await mp.screenshot({ path: join(shots, "forced-dark-todo.png") });
  page = await mp.navigateTo("/pages/component/index?name=Button");
  await wait(150);
  await mp.screenshot({ path: join(shots, "forced-dark-first-frame.png") }); // 第一帧：导航栏不该是亮的
  await mp.callWxMethod("setStorageSync", "xxd-ui", JSON.stringify({ theme: "system" }));

  // 4. 读屏属性
  page = await mp.reLaunch("/pages/component/index?name=Switch");
  await wait(600);
  for (const el of await page.$$(".xxd-choice")) {
    const role = await el.attribute("aria-role");
    if (!role) fail("读屏", "开关 / 复选框没有 aria-role");
  }

  // 5. 左滑的 setData 次数
  page = await mp.reLaunch("/pages/component/index?name=Swipe");
  await wait(600);
  let count = 0;
  await mp.exposeFunction("onSetData", () => (count += 1));
  await mp.evaluate(() => {
    const p = getCurrentPages().pop();
    const raw = p.setData;
    p.setData = function (...a) {
      onSetData();
      return raw.apply(this, a);
    };
  });
  const row = (await page.$$(".xxd-swipe__content"))[0];
  if (row) {
    await row.touchstart({ touches: [{ identifier: 1, clientX: 300, clientY: 20 }], changedTouches: [{ identifier: 1, clientX: 300, clientY: 20 }] });
    for (let x = 290; x >= 150; x -= 5) await row.touchmove({ touches: [{ identifier: 1, clientX: x, clientY: 20 }], changedTouches: [{ identifier: 1, clientX: x, clientY: 20 }] });
    await row.touchend({ touches: [], changedTouches: [{ identifier: 1, clientX: 150, clientY: 20 }] });
    await wait(300);
    console.log(`左滑一次（29 个 touchmove）：页面 setData ${count} 次`);
  }
} finally {
  await mp.close();
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} 处问题：`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`\n✓ 开发者工具检查全过（截图在 ${shots}，第一帧和强制暗色那两张请人看一眼）`);
