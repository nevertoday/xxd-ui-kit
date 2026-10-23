// 审计的「读屏」一节：在真 Chrome 里用键盘走一遍关键流程，每一步从浏览器的无障碍树读出
// 焦点在哪（角色、名字、展开 / 选中 / 模态这些状态）和播报区（.xxd-announcer）念了什么。
// 读屏软件念的就是这些；这里不开 VoiceOver / NVDA 本身，真机朗读仍要人工试。
// 每一步的结果写进 visual/sr-transcript.txt（不进仓库），对不上预期的记为失败。

// pressed 这类三态属性 Chrome 给的是字符串 "true" / "false"
const norm = (v) => (v === "true" ? true : v === "false" ? false : v);

/** 焦点元素在无障碍树里的样子：{ role, name, expanded, selected, pressed, modal… } */
async function focused(cdp) {
  const { result } = await cdp.send("Runtime.evaluate", {
    expression: "(() => { let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement; return a; })()",
    objectGroup: "sr",
  });
  if (!result.objectId) return { role: "none", name: "" };
  const { nodes } = await cdp.send("Accessibility.getPartialAXTree", { objectId: result.objectId, fetchRelatives: false });
  const node = nodes.find((n) => !n.ignored) ?? nodes[0];
  const props = Object.fromEntries((node?.properties ?? []).map((p) => [p.name, norm(p.value?.value)]));
  return { role: node?.role?.value ?? "none", name: (node?.name?.value ?? "").trim(), ...props };
}

/** 某个元素在无障碍树里的样子 */
async function axOf(cdp, tab, selector) {
  const handle = await tab.$(selector);
  if (!handle) return null;
  await tab.evaluate((el) => (window.__srTarget = el), handle);
  const { result: target } = await cdp.send("Runtime.evaluate", { expression: "window.__srTarget", objectGroup: "sr" });
  const { nodes } = await cdp.send("Accessibility.getPartialAXTree", { objectId: target.objectId, fetchRelatives: false });
  const node = nodes.find((n) => !n.ignored) ?? nodes[0];
  const props = Object.fromEntries((node?.properties ?? []).map((p) => [p.name, norm(p.value?.value)]));
  return { role: node?.role?.value, name: (node?.name?.value ?? "").trim(), ...props };
}

const announced = (tab) => tab.evaluate(() => [...document.querySelectorAll(".xxd-announcer")].map((e) => e.textContent.trim()).filter(Boolean).join(" | "));

async function waitAnnounce(tab, re, ms = 1500) {
  const t0 = Date.now();
  let text = "";
  while (Date.now() - t0 < ms) {
    text = await announced(tab);
    if (re.test(text)) return text;
    await tab.waitForTimeout(50);
  }
  return text;
}

/**
 * 每个流程：页面、起点（聚焦哪个元素），然后一串步骤 [按键, 期望]。
 * 期望：focus（焦点元素的 role / name 正则 / 状态）、announce（播报区正则）、ax（某个元素的样子）。
 */
/** @type {{ name: string, page: string, start: string, steps: [string | null, any][] }[]} */
const FLOWS = [
  {
    name: "对话框：打开、焦点进去、Esc 关、焦点回到按钮",
    page: "/components/dialog/",
    start: '.site-demo__stage [data-xxd-dialog-open="d1"]',
    steps: [
      [null, { focus: { role: "button", name: /^打开$/ } }],
      ["Enter", { focus: { role: "button" }, ax: ["dialog#d1", { role: "dialog", name: /写入哪篇文章/, modal: true }] }],
      ["Escape", { focus: { role: "button", name: /^打开$/ } }],
    ],
  },
  {
    name: "菜单：按钮报「有菜单、收起」，Enter 打开进第一项，↓ 下一项，Esc 回到按钮",
    page: "/components/menu/",
    start: ".site-demo__stage [data-xxd-menu]",
    steps: [
      [null, { focus: { role: "button", name: /更多/, expanded: false, hasPopup: "menu" } }],
      ["Enter", { focus: { role: "menuitem", name: /重命名/ } }],
      ["ArrowDown", { focus: { role: "menuitem", name: /导出为/ } }],
      ["Escape", { focus: { role: "button", name: /更多/, expanded: false } }],
    ],
  },
  {
    name: "标签页：方向键切换，选中状态跟着走",
    page: "/components/tabs/",
    start: '.site-demo__stage [role="tab"][aria-selected="true"]',
    steps: [
      [null, { focus: { role: "tab", name: /写作/, selected: true } }],
      ["ArrowRight", { focus: { role: "tab", name: /记录/, selected: true } }],
    ],
  },
  {
    name: "轻提示：点了就念出来",
    page: "/components/toast/",
    start: ".site-demo__stage .xxd-cluster > .xxd-btn",
    steps: [
      [null, { focus: { role: "button", name: /^保存$/ } }],
      ["Enter", { announce: /已保存草稿/ }],
    ],
  },
  {
    name: "可输入的下拉：打字筛选，念出结果数",
    page: "/components/combobox/",
    start: ".site-demo__stage [data-xxd-combobox] input",
    steps: [
      [null, { focus: { role: "combobox", name: /主色/ } }],
      ["湖", { focus: { role: "combobox", expanded: true }, announce: /1/ }],
    ],
  },
  {
    name: "自定义下拉：名字带字段名，展开 / 收起有状态",
    page: "/components/picker/",
    start: ".site-demo__stage .xxd-picker__trigger",
    steps: [
      [null, { focus: { role: "combobox", name: /画质/, expanded: false } }],
      ["Enter", { focus: { role: "combobox", expanded: true } }],
      ["Escape", { focus: { role: "combobox", name: /画质/, expanded: false } }],
    ],
  },
  {
    name: "拖拽排序：空格拿起、↓ 挪、空格放下，每一步都念",
    page: "/patterns/sortable/",
    start: "#sort-demo .xxd-sort-handle",
    steps: [
      [null, { focus: { role: "button", name: /拖动排序：写作/ } }],
      [" ", { announce: /写作/, focus: { pressed: true } }],
      ["ArrowDown", { announce: /2/ }],
      [" ", { announce: /放|放下|已移/, focus: { pressed: false } }],
    ],
  },
  {
    name: "英文页的对话框：念的是英文",
    page: "/en/components/dialog/",
    start: '.site-demo__stage [data-xxd-dialog-open="d1"]',
    steps: [
      [null, { focus: { role: "button", name: /^Open$/ } }],
      ["Enter", { ax: ["dialog#d1", { role: "dialog", name: /[A-Za-z]/, modal: true }] }],
      ["Escape", { focus: { role: "button", name: /^Open$/ } }],
    ],
  },
];

function check(actual, expect) {
  const bad = [];
  for (const [k, v] of Object.entries(expect)) {
    if (v === undefined) continue;
    const got = actual?.[k];
    if (v instanceof RegExp ? !v.test(String(got ?? "")) : got !== v) bad.push(`${k} 期望 ${v} 实际 ${JSON.stringify(got)}`);
  }
  return bad;
}

export async function srAudit({ browser, origin, fail, transcriptFile }) {
  const { writeFileSync } = await import("node:fs");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const lines = [];
  let steps = 0;
  for (const flow of FLOWS) {
    const tab = await ctx.newPage();
    const cdp = await ctx.newCDPSession(tab);
    await cdp.send("Accessibility.enable");
    await tab.goto(origin + flow.page, { waitUntil: "networkidle" });
    lines.push(`\n## ${flow.name}  （${flow.page}）`);
    const start = tab.locator(flow.start).first();
    if (!(await start.count())) {
      fail("读屏", `${flow.page} 找不到起点 ${flow.start}`);
      await tab.close();
      continue;
    }
    // 键盘用户：鼠标模式的标记去掉，再聚焦起点
    await tab.keyboard.press("Tab");
    await start.focus();
    for (const [key, expect] of flow.steps) {
      if (key) {
        if (key.length === 1 && key !== " ") await tab.keyboard.type(key);
        else await tab.keyboard.press(key === " " ? "Space" : key);
        await tab.waitForTimeout(250);
      }
      steps += 1;
      const f = await focused(cdp);
      const say = expect.announce ? await waitAnnounce(tab, expect.announce) : await announced(tab);
      const state = ["expanded", "selected", "pressed", "checked", "modal", "hasPopup"].filter((k) => f[k] !== undefined).map((k) => `${k}=${f[k]}`).join(" ");
      lines.push(`- ${key ? `按 ${key === " " ? "空格" : key}` : "起点"} → 焦点：${f.role}「${f.name}」${state ? ` ${state}` : ""}${say ? `；播报：「${say}」` : ""}`);
      const problems = [];
      if (expect.focus) problems.push(...check(f, expect.focus).map((p) => `焦点 ${p}`));
      if (expect.announce && !expect.announce.test(say)) problems.push(`播报期望 ${expect.announce} 实际「${say}」`);
      if (expect.ax) {
        const ax = await axOf(cdp, tab, expect.ax[0]);
        lines.push(`  ${expect.ax[0]}：${ax ? `${ax.role}「${ax.name}」${ax.modal !== undefined ? ` modal=${ax.modal}` : ""}` : "找不到"}`);
        problems.push(...check(ax, expect.ax[1]).map((p) => `${expect.ax[0]} ${p}`));
      }
      for (const p of problems) fail("读屏", `${flow.page}「${flow.name}」第 ${steps} 步（${key ? key : "起点"}）：${p}`);
    }
    await tab.close();
  }
  await ctx.close();
  if (transcriptFile) writeFileSync(transcriptFile, `# 读屏走查（无障碍树 + 播报区，自动生成）\n${lines.join("\n")}\n`);
  console.log(`读屏：${FLOWS.length} 个流程、${steps} 步（焦点的角色 / 名字 / 状态 + 播报区）`);
}
