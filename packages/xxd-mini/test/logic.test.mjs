// 组件逻辑（MINI-REVIEW-PLAN S12）：浮层栈和返回键、轻提示、对话框的异步确认、输入框不打断输入法、左滑、上传、导航栏。
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, React, render, tick } from "./harness.mjs";

const { mini, fake } = await (await import("./harness.mjs")).loadMini();
const h = React.createElement;
const { XxdProvider, XxdPage, Sheet, Dialog, Input, Swipe, SwipeGroup, Uploader, NavBar, useToast, useXxd, capsuleRect } = mini;

const cls = (n) => String(n.props.className ?? "");
const app = (...children) => h(XxdProvider, { persist: false }, h(XxdPage, null, ...children));

test("浮层栈：面板里再开对话框，一页只有一个 page-container；返回键先关对话框，再关面板", async () => {
  let setSheet, setDialog;
  function Page() {
    const [sheet, s1] = React.useState(false);
    const [dialog, s2] = React.useState(false);
    setSheet = s1;
    setDialog = s2;
    return app(h(Sheet, { open: sheet, onOpenChange: s1, title: "面板" }, "内容"), h(Dialog, { open: dialog, onOpenChange: s2, title: "确认？" }));
  }
  const v = render(h(Page));
  await act(async () => setSheet(true));
  await tick(30);
  await act(async () => setDialog(true));
  await tick(30);
  const guards = () => v.all((n) => n.type === "page-container");
  assert.equal(guards().length, 1, "一页只能有一个 page-container");
  assert.equal(guards()[0].props.show, true);
  // 页面内容对读屏隐藏
  assert.equal(v.byClass("xxd-page__body")[0].props.ariaHidden, true);
  // 返回键：关最上面的对话框
  await act(async () => guards()[0].props.onBeforeLeave());
  await tick(260);
  assert.equal(v.byClass("xxd-dialog").length, 0, "返回键先关对话框");
  assert.equal(v.byClass("xxd-sheet").length, 1, "面板还开着");
  assert.equal(guards().length, 1);
  assert.equal(guards()[0].props.show, true, "栈里还有面板：换一个新的 page-container 接着拦");
  await act(async () => guards()[0].props.onBeforeLeave());
  await tick(260);
  assert.equal(v.byClass("xxd-sheet").length, 0, "第二次返回关面板");
  assert.equal(guards()[0].props.show, false);
  assert.equal(v.byClass("xxd-page__body")[0].props.ariaHidden, undefined);
  v.unmount();
});

test("轻提示：弹一条提示，用外观的组件不重画；最多三条；只在看得见的页面画；手动关掉不留定时器", async () => {
  let renders = 0;
  let toast;
  function Reader() {
    useXxd();
    renders += 1;
    return null;
  }
  function Trigger() {
    toast = useToast();
    return null;
  }
  const v = render(app(h(Reader), h(Trigger)));
  const before = renders;
  for (let i = 0; i < 5; i += 1) await act(async () => toast(`第 ${i} 条`));
  assert.equal(renders, before, "弹提示不该让用 useXxd 的组件重画");
  assert.equal(v.byClass("xxd-toast").length, 3, "最多同时三条");
  await act(async () => fake.hide());
  assert.equal(v.byClass("xxd-toast").length, 0, "页面被盖住时不画");
  await act(async () => fake.show());
  assert.equal(v.byClass("xxd-toast").length, 3);
  await tick(2900);
  assert.equal(v.byClass("xxd-toast").length, 0, "2.6 秒后自动收起（短提示的下限，MOTION-REVIEW-PLAN D87）");
  v.unmount();
});

test("对话框：异步确认时按钮自动加载中、连点只提交一次；出错不关，弹一条危险色提示", async () => {
  let calls = 0;
  let resolve;
  let open = true;
  const setOpen = (v) => (open = v);
  const v = render(app(h(Dialog, { open: true, onOpenChange: setOpen, title: "删除？", confirm: { label: "删除", onClick: () => (calls += 1, new Promise((r) => (resolve = r))) } })));
  await tick(30);
  const confirmBtn = () => v.all((n) => n.type === "button" && cls(n).includes("is-variant-danger") === false && cls(n).includes("is-variant-primary"))[0];
  await act(async () => {
    confirmBtn().props.onClick();
  });
  assert.ok(cls(confirmBtn()).includes("is-busy"), "进入加载中");
  assert.equal(confirmBtn().props.onClick, undefined, "加载中按钮不响应");
  assert.equal(calls, 1);
  await act(async () => resolve());
  assert.equal(open, false, "完成后关掉");
  v.unmount();

  let open2 = true;
  const v2 = render(app(h(Dialog, { open: true, onOpenChange: (x) => (open2 = x), title: "保存？", confirm: { onClick: () => Promise.reject(new Error("网断了")), errorText: "保存没成功" } })));
  await tick(30);
  const btn = v2.all((n) => n.type === "button" && cls(n).includes("is-variant-primary"))[0];
  const err = console.error;
  console.error = () => {};
  await act(async () => btn.props.onClick());
  console.error = err;
  assert.equal(open2, true, "出错不关");
  const toasts = v2.byClass("xxd-toast");
  assert.equal(toasts.length, 1);
  assert.ok(cls(toasts[0]).includes("is-tone-danger"));
  v2.unmount();
});

test("输入框：打字时不把值写回原生输入框（不打断中文输入法），外面清空时写一次；超过上限截掉并标红", async () => {
  function Form() {
    const [v, set] = React.useState("");
    return h(React.Fragment, null, h(Input, { value: v, onValueChange: set, maxLength: 5, counter: true }), h("view", { className: "clear", onClick: () => set("") }));
  }
  const v = render(app(h(Form)));
  const input = () => v.all((n) => n.type === "input")[0];
  assert.equal(input().props.maxlength, 6, "原生上限放宽一个字");
  for (const text of ["n", "ni", "你", "你好"]) await act(async () => input().props.onInput({ detail: { value: text } }));
  assert.equal(input().props.value, "", "打字过程中给原生的值不变，Taro 不会 setData");
  await act(async () => v.byClass("clear")[0].props.onClick());
  await tick(10);
  assert.equal(input().props.value, "", "清空后原生的值是空");
  const seen = [];
  // 清空前原生里是「你好」，交给原生的值必须真的变过一次（先「你好」再空），Taro 才会写过去
  await act(async () => input().props.onInput({ detail: { value: "abc" } }));
  // 同步的 act：只跑完 React 的更新，不跑定时器，看得到中间那一步
  act(() => v.byClass("clear")[0].props.onClick());
  seen.push(input().props.value);
  await tick(10);
  seen.push(input().props.value);
  assert.deepEqual(seen, ["abc", ""]);
  // 粘贴超长
  await act(async () => input().props.onInput({ detail: { value: "一二三四五六" } }));
  await tick(10);
  assert.equal(input().props.value, "一二三四五");
  const counter = v.byClass("is-counter")[0];
  assert.ok(cls(counter).includes("is-over"), "字数标红");
  v.unmount();
});

test("输入框：在底部面板里缺省不推页面（adjustPosition=false），面板跟着键盘升起来", async () => {
  const v = render(app(h(Sheet, { open: true, onOpenChange: () => {} }, h(Input, { label: "名字" }))));
  await tick(30);
  assert.equal(v.all((n) => n.type === "input")[0].props.adjustPosition, false);
  await act(async () => fake.keyboard(300));
  const sheet = v.byClass("xxd-sheet")[0];
  assert.ok(cls(sheet).includes("is-keyboard"));
  assert.match(sheet.props.style, /--kb:300px/);
  await act(async () => fake.keyboard(0));
  assert.ok(!cls(v.byClass("xxd-sheet")[0]).includes("is-keyboard"));
  v.unmount();
  const v2 = render(app(h(Input, { label: "名字" })));
  assert.equal(v2.all((n) => n.type === "input")[0].props.adjustPosition, undefined, "不在面板里交给微信");
  v2.unmount();
});

test("面板：往下拖过 96px 松手就关；拖得少弹回去；拖动时每 16ms 最多更新一次", async () => {
  let open = true;
  const v = render(app(h(Sheet, { open: true, onOpenChange: (x) => (open = x), title: "面板" }, "内容")));
  await tick(30);
  const head = () => v.byClass("xxd-sheet__head")[0];
  const touch = (y) => ({ touches: [{ clientX: 100, clientY: y }] });
  await act(async () => head().props.onTouchStart(touch(100)));
  for (let y = 110; y <= 150; y += 10) {
    await tick(20);
    await act(async () => head().props.onTouchMove(touch(y)));
  }
  await act(async () => head().props.onTouchEnd({}));
  assert.equal(open, true, "拖 50px 不关");
  await tick(20);
  await act(async () => head().props.onTouchStart(touch(100)));
  await tick(20);
  await act(async () => head().props.onTouchMove(touch(160)));
  await tick(20);
  await act(async () => head().props.onTouchMove(touch(230)));
  assert.match(v.byClass("xxd-sheet")[0].props.style, /translateY\(130px\)/);
  await act(async () => head().props.onTouchEnd({}));
  assert.equal(open, false, "拖 130px 关掉");
  v.unmount();
});

test("左滑：同一组里一次只开一行；读屏有「更多操作」按钮把操作亮出来", async () => {
  const v = render(app(h(SwipeGroup, null, h(Swipe, { actions: [{ label: "删", onClick: () => {} }] }, "一"), h(Swipe, { actions: [{ label: "删", onClick: () => {} }] }, "二"))));
  const rows = () => v.byClass("xxd-swipe");
  const sr = () => v.byClass("xxd-sr-only");
  assert.equal(sr().length, 2);
  await act(async () => sr()[0].props.onClick());
  assert.ok(cls(rows()[0]).includes("is-open"));
  assert.equal(v.byClass("xxd-swipe__actions")[0].props.ariaHidden, undefined, "打开后操作对读屏可见");
  await act(async () => sr()[0].props.onClick());
  assert.ok(cls(rows()[1]).includes("is-open"), "第二行打开");
  assert.ok(!cls(rows()[0]).includes("is-open"), "第一行收回");
  v.unmount();
});

test("上传：同时最多传 3 张；移除正在传的那张会停掉它；超过大小的不加", async () => {
  fake.nextMedia = { tempFiles: [1, 2, 3, 4, 5].map((i) => ({ tempFilePath: `p${i}`, size: i === 5 ? 9e6 : 1000 })) };
  const aborted = [];
  const pending = new Map();
  function Box() {
    const [items, set] = React.useState([]);
    return h(Uploader, {
      value: items,
      onChange: set,
      maxSize: 5e6,
      upload: (path, _p, onAbort) => {
        onAbort(() => aborted.push(path));
        return new Promise((res) => pending.set(path, res));
      },
    });
  }
  const v = render(app(h(Box)));
  await act(async () => v.byClass("xxd-uploader__add")[0].props.onClick());
  await tick(10);
  assert.equal(v.byClass("xxd-uploader__item").length, 4, "超过 5 MB 的那张没加");
  assert.equal(v.byClass("xxd-toast").length, 1, "并提示");
  assert.equal(pending.size, 3, "同时只传 3 张");
  await act(async () => v.byClass("xxd-uploader__remove")[0].props.onClick());
  assert.deepEqual(aborted, ["p1"]);
  assert.equal(pending.size, 4, "空出一个位置，第 4 张开始传");
  await act(async () => pending.get("p2")("https://cdn/p2"));
  await tick(10);
  assert.equal(v.byClass("xxd-uploader__item").filter((n) => cls(n).includes("is-status-done")).length, 1);
  v.unmount();
  fake.nextMedia = undefined;
});

test("导航栏：胶囊读到全 0 时按状态栏估一个，高度不会是负数；窗口变了重新量", async () => {
  const saved = fake.menuRect;
  fake.menuRect = { top: 0, height: 0, left: 0, right: 0, bottom: 0, width: 0 };
  const r = capsuleRect();
  assert.equal(r.top, 48);
  assert.equal(r.height, 32);
  assert.ok(r.right > 0);
  const v = render(app(h(NavBar, { title: "标题" })));
  const bar = () => v.byClass("xxd-navbar")[0];
  const height = () => Number(/height:(\d+)px/.exec(bar().props.style)[1]);
  assert.ok(height() >= 44 + 40);
  fake.menuRect = saved;
  await act(async () => fake.resize());
  assert.equal(height(), 44 + 32 + 4 * 2);
  v.unmount();
});

test("图标：同一个图标的数据在页面根上只写一次，每个图标只引用变量；后来打开的面板里的新图标也补上", async () => {
  const { Icon, Button } = mini;
  const { Trash, Plus, X } = await import("@xxd/icons/each");
  let setOpen;
  function Page() {
    const [open, s] = React.useState(false);
    setOpen = s;
    return app(...Array.from({ length: 20 }, (_, i) => h(Icon, { key: i, icon: i % 2 ? Trash : Plus })), h(Sheet, { open, onOpenChange: s, title: "面板", closable: false }, h(Icon, { icon: X })));
  }
  const v = render(h(Page));
  const icons = v.byClass("ui-icon");
  assert.equal(icons.length, 20);
  for (const i of icons) assert.ok(i.props.style.length < 120, `图标自己的样式应该很短：${i.props.style.slice(0, 80)}`);
  const root = v.byClass("xxd-page")[0].props.style;
  assert.equal((root.match(/--xi-\d+:url/g) ?? []).length, 2, "两种图标，页面根上两个变量");
  await act(async () => setOpen(true));
  await tick(30);
  assert.equal((v.byClass("xxd-page")[0].props.style.match(/--xi-\d+:url/g) ?? []).length, 3, "面板里的新图标补到页面根上");
  assert.match(v.byClass("xxd-overlay")[0].props.style, /--xi-2:url/, "浮层根上也有（root-portal 继承不到）");
  v.unmount();
});

test("列表行：放开关时点整行就切换，开关自己被点不会切两次；读屏上整行是一个开关", async () => {
  const { Cell, Switch } = mini;
  function Row() {
    const [on, set] = React.useState(false);
    return app(h(Cell, { title: "完成音效", control: h(Switch, { checked: on, onCheckedChange: set }) }));
  }
  const v = render(h(Row));
  const row = () => v.byClass("xxd-cell")[0];
  assert.equal(row().props.ariaRole, "switch");
  assert.equal(row().props.ariaChecked, false);
  assert.equal(row().props.ariaLabel, "完成音效");
  await act(async () => row().props.onClick());
  assert.equal(row().props.ariaChecked, true, "点整行打开");
  let stopped = false;
  await act(async () => v.byClass("xxd-choice")[0].props.onClick({ stopPropagation: () => (stopped = true) }));
  assert.equal(stopped, true, "点开关本身不冒泡到行上");
  assert.equal(row().props.ariaChecked, false);
  assert.equal(v.byClass("xxd-choice")[0].props.ariaHidden, true, "开关本身对读屏隐藏，整行代表它");
  v.unmount();
});

test("底部：有底部按钮条时页面底下留出它的高度，轻提示浮在它上面；自定义标签栏跟着设置页的修改变", async () => {
  const { BottomBar, Button, TabBarHost, useXxd: use } = mini;
  const v = render(app(h(BottomBar, null, h(Button, { variant: "primary" }, "新建"))));
  const page = v.byClass("xxd-page")[0];
  assert.ok(cls(page).includes("is-has-bottom"));
  assert.match(page.props.style, /--bottom-inset:calc\(var\(--bottombar-h\) \+ env\(safe-area-inset-bottom\)\)/);
  v.unmount();
  const items = [{ value: "a", label: "甲", url: "/pages/a/index" }, { value: "b", label: "乙", url: "/pages/b/index" }];
  let update;
  function Settings() {
    update = use().update;
    return null;
  }
  const host = render(h(TabBarHost, { items }));
  const settings = render(app(h(Settings)));
  assert.ok(!cls(host.byClass("xxd-tabbar-host")[0]).includes("is-theme-dark"));
  await act(async () => update({ theme: "dark" }));
  assert.ok(cls(host.byClass("xxd-tabbar-host")[0]).includes("is-theme-dark"), "设置页改成暗色，自定义标签栏跟着变");
  host.unmount();
  settings.unmount();
});

test("数量加减、日期滚轮：到头了按钮变灰；2 月的天数跟着年份变", async () => {
  const { Stepper, DatePicker } = mini;
  function S() {
    const [n, set] = React.useState(1);
    return app(h(Stepper, { value: n, onValueChange: set, min: 1, max: 2, label: "杯数" }));
  }
  const v = render(h(S));
  const btns = () => v.all((n) => n.type === "button");
  assert.ok(btns()[0].props.disabled, "到最小值，减一变灰");
  await act(async () => btns()[1].props.onClick());
  assert.equal(v.byClass("xxd-stepper__value")[0].props.children, 2);
  assert.ok(btns()[1].props.disabled, "到最大值，加一变灰");
  v.unmount();
  const d = render(app(h(DatePicker, { open: true, onOpenChange: () => {}, value: "2024-02-10", onConfirm: () => {} })));
  await tick(30);
  const days = () => d.all((n) => n.type === "picker-view-column")[2].props.children.length;
  assert.equal(days(), 29, "2024 年 2 月 29 天");
  const wheel = d.all((n) => n.type === "picker-view")[0];
  const yearIdx = d.all((n) => n.type === "picker-view-column")[0].props.children.findIndex((c) => c.key === "2025");
  await act(async () => wheel.props.onChange({ detail: { value: [yearIdx, 1, 9] } }));
  assert.equal(days(), 28, "换到 2025 年变成 28 天");
  d.unmount();
});

test("量表：和网页版同一份几何；颜色从当前外观取、线头跟圆角模式；读屏念整句", async () => {
  const { Gauge, gaugeModel } = mini;
  const v = render(app(h(Gauge, { value: 94, unit: "%", label: "本月额度", target: 80, zones: [{ from: 80, to: 90, tone: "warning" }, { from: 90, tone: "danger" }] })));
  await tick(10);
  const img = v.all((n) => n.type === "image")[0];
  const svg = Buffer.from(img.props.src.replace("data:image/svg+xml;base64,", ""), "base64").toString();
  assert.match(svg, /stroke-linecap="butt"/, "直角模式：平头");
  assert.doesNotMatch(svg, /var\(|class=/, "图片里没有 CSS 变量和类名（图片读不到页面的样式）");
  const dial = v.byClass("xxd-gauge__dial")[0];
  assert.equal(dial.props.ariaLabel, "本月额度，94%，超限，目标 80%");
  assert.equal(v.byClass("xxd-gauge__state")[0].props.children, "超限");
  assert.ok(cls(v.byClass("xxd-gauge__state")[0]).includes("is-tone-danger"));
  // 几何和 @xxd/css/gauge 一样（同一份代码打进来的）
  const web = await import("@xxd/css/gauge");
  assert.equal(gaugeModel({ value: 42 }).svgBody, web.gaugeModel({ value: 42 }).svgBody);
  v.unmount();
});

test("图型：和网页版同一份换算；条形榜每行的字就是数据；百格正好 100 格；热力格按周排", async () => {
  const { Bars, Waffle, Heatmap, Dumbbell, barsModel } = mini;
  const v = render(
    app(
      h(Bars, { unit: "人", items: [{ label: "a", value: 2000 }, { label: "b", value: 5000, highlight: true }], step: 1000 }),
      h(Waffle, { label: "来源", parts: [{ label: "推荐", value: 2 }, { label: "搜索", value: 1 }] }),
      h(Heatmap, { values: { "2026-10-19": 5 }, end: "2026-10-19", weeks: 4 }),
      h(Dumbbell, { rows: [{ label: "写第一篇", from: 14, to: 6 }] }),
    ),
  );
  await tick(10);
  const bars = v.byClass("xxd-bars")[0];
  assert.ok(cls(bars).includes("is-emphasis") && cls(bars).includes("is-rungs"));
  assert.equal(bars.props.style, "--rungs:5");
  assert.deepEqual(v.byClass("xxd-bars__item").map((n) => n.props.style), ["--value:1", "--value:0.4"]);
  assert.equal(v.byClass("xxd-waffle__cell").length, 100);
  assert.equal(v.byClass("xxd-waffle")[0].props.ariaLabel, "来源，推荐 67%，搜索 33%");
  assert.equal(v.byClass("xxd-heatmap__grid")[0].children.length, 28);
  assert.ok(cls(v.byClass("xxd-dumbbell__delta")[0]) !== undefined);
  const web = await import("@xxd/css/viz");
  assert.deepEqual(barsModel([{ label: "x", value: 3 }]), web.barsModel([{ label: "x", value: 3 }]));
  v.unmount();
});

test("图型对抗测试（CHART-REVIEW-PLAN）：热力格点一格写出这一格；条那一层单独一层；分类色顺序和网页版一样", async () => {
  const { Heatmap, Bars, chartPalette } = mini;
  const v = render(app(h(Heatmap, { values: { "2026-10-19": 5 }, end: "2026-10-19", weeks: 2 }), h(Bars, { items: [{ label: "a", value: 3, compare: 2 }], step: 1 })));
  await tick(10);
  const grid = v.byClass("xxd-heatmap__grid")[0];
  await act(async () => grid.props.onTap({ target: { dataset: { key: "2026-10-19" } } }));
  assert.equal(v.byClass("xxd-heatmap__readout")[0].props.children, "2026-10-19：5");
  assert.equal(v.all((n) => cls(n).includes("is-active")).length, 1);
  assert.equal(v.byClass("xxd-bars__bar").length, 1);
  const vars = { "--action": "a", "--gray-9": "g9", "--accent-8": "a8", "--gray-10": "g10", "--gray-11": "g11" };
  assert.deepEqual(chartPalette(vars), ["a", "g9", "a8", "g10", "g11"]);
  v.unmount();
});
