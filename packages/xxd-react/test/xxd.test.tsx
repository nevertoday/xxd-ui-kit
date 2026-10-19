/// <reference types="node" />
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AccountCard,
  AppearanceSettings,
  Card,
  CardGrid,
  Chip,
  ConfirmTwiceButton,
  DropZone,
  Prose,
  Rail,
  Settings,
  SettingsGroup,
  SettingsRow,
  Swatches,
  Dock,
  DropTarget,
  Gauge,
  Bars,
  Proportion,
  Waffle,
  Heatmap,
  Dumbbell,
  Pagination,
  Search,
  Segmented,
  Sheet,
  SheetHost,
  StatusLine,
  XxdAppearanceProvider,
  XxdLocaleProvider,
  resolveLocale,
} from "../src/index";
afterEach(cleanup);

describe("O5 语言", () => {
  it("resolveLocale：繁体 / 简体 / 英文", () => {
    expect(resolveLocale("zh-TW")).toBe("zh-Hant");
    expect(resolveLocale("zh_HK")).toBe("zh-Hant");
    expect(resolveLocale("zh-CN")).toBe("zh-CN");
    expect(resolveLocale("en-US")).toBe("en");
  });

  it("Kumo 内置文案跟着切换（分页按钮）", () => {
    const { rerender } = render(
      <XxdLocaleProvider locale="zh-CN">
        <Pagination page={2} perPage={10} totalCount={50} setPage={() => {}} />
      </XxdLocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "分页" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "下一页" })).toBeTruthy();
    rerender(
      <XxdLocaleProvider locale="en">
        <Pagination page={2} perPage={10} totalCount={50} setPage={() => {}} />
      </XxdLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeTruthy();
    rerender(
      <XxdLocaleProvider locale="zh-Hant">
        <Pagination page={2} perPage={10} totalCount={50} setPage={() => {}} />
      </XxdLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "下一頁" })).toBeTruthy();
  });

  it("小小东组件的文案也跟着切换", () => {
    render(
      <XxdLocaleProvider locale="en">
        <Search value="x" onValueChange={() => {}} />
      </XxdLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });

  it("Rail 的默认名字跟着语言走；传了 label 就用 label", () => {
    const { rerender } = render(
      <XxdLocaleProvider locale="en">
        <Rail items={[{ href: "/", label: "Home" }]} />
      </XxdLocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
    rerender(
      <XxdLocaleProvider locale="zh-CN">
        <Rail items={[{ href: "/", label: "首页" }]} />
      </XxdLocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeTruthy();
    rerender(<Rail label="会员站" items={[{ href: "/", label: "首页" }]} />);
    expect(screen.getByRole("navigation", { name: "会员站" })).toBeTruthy();
  });
});

describe("O5 小小东组件", () => {
  it("Dock：状态在开头，下一步在末尾", () => {
    const { container } = render(<Dock status="24 张" tools={<button>加图片</button>} primary={<button>复制</button>} />);
    const parts = [...container.querySelector(".xxd-dock")!.children].map((el) => el.className);
    expect(parts).toEqual(["xxd-dock__status", "xxd-dock__tools", "xxd-dock__primary"]);
  });

  it("Search：Esc 清空，× 清空", () => {
    function T() {
      const [v, setV] = useState("abc");
      return <Search value={v} onValueChange={setV} />;
    }
    render(<T />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "q" } });
    fireEvent.click(screen.getByRole("button", { name: "清空" }));
    expect(input.value).toBe("");
  });

  it("Segmented：→ 选下一个，aria-checked 跟着走", () => {
    function T() {
      const [v, setV] = useState<"a" | "b" | "c">("a");
      return <Segmented label="类型" value={v} onValueChange={setV} options={[{ value: "a", label: "A" }, { value: "b", label: "B" }, { value: "c", label: "C" }]} />;
    }
    render(<T />);
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "B" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "End" });
    expect(screen.getByRole("radio", { name: "C" }).getAttribute("aria-checked")).toBe("true");
  });

  it("Sheet：打开写 data-open，Esc 和 scrim 关闭", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <SheetHost>
        <Sheet open title="封面" onOpenChange={onOpenChange}>
          <input aria-label="标题" />
        </Sheet>
      </SheetHost>,
    );
    const sheet = container.querySelector(".xxd-sheet")!;
    expect(sheet.hasAttribute("data-open")).toBe(true);
    fireEvent.keyDown(sheet, { key: "Escape" });
    fireEvent.click(container.querySelector(".xxd-scrim")!);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("Sheet 是模态：role=dialog + aria-modal，背景 inert，焦点进去、Tab 在里面循环，宿主写 data-sheet-open", () => {
    const { container, rerender } = render(
      <SheetHost>
        <main id="bg"><button>背景</button></main>
        <Sheet open title="封面" onOpenChange={() => {}}>
          <input aria-label="标题" />
        </Sheet>
      </SheetHost>,
    );
    const sheet = container.querySelector(".xxd-sheet")!;
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-modal")).toBe("true");
    expect(container.querySelector("#bg")!.hasAttribute("inert")).toBe(true);
    expect(container.querySelector(".xxd-sheet-host")!.hasAttribute("data-sheet-open")).toBe(true);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("标题");
    // 最后一个可聚焦的再按 Tab 回到第一个
    const items = [...sheet.querySelectorAll<HTMLElement>("button, input")];
    items.at(-1)!.focus();
    fireEvent.keyDown(sheet, { key: "Tab" });
    expect(document.activeElement).toBe(items[0]);
    rerender(
      <SheetHost>
        <main id="bg"><button>背景</button></main>
        <Sheet open={false} title="封面" onOpenChange={() => {}}>
          <input aria-label="标题" />
        </Sheet>
      </SheetHost>,
    );
    expect(container.querySelector("#bg")!.hasAttribute("inert")).toBe(false);
    expect(container.querySelector(".xxd-sheet-host")!.hasAttribute("data-sheet-open")).toBe(false);
  });

  it("ConfirmTwiceButton：第一次变确认，第二次执行", () => {
    const onConfirm = vi.fn();
    render(<ConfirmTwiceButton onConfirm={onConfirm}>删除</ConfirmTwiceButton>);
    const b = screen.getByRole("button");
    fireEvent.click(b);
    expect(b.textContent).toBe("确认删除");
    expect(b.hasAttribute("data-confirming")).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(b);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(b.textContent).toBe("删除");
  });

  it("StatusLine：没字就不渲染", () => {
    const { container, rerender } = render(<StatusLine>{""}</StatusLine>);
    expect(container.querySelector(".xxd-statusline")).toBeNull();
    rerender(<StatusLine tone="warning">用完了</StatusLine>);
    expect(container.querySelector(".xxd-statusline")?.getAttribute("data-tone")).toBe("warning");
  });

  it("StatusLine：播报区一直挂着（没字时也在），只换文字", () => {
    const { container, rerender } = render(<StatusLine>{""}</StatusLine>);
    const live = container.querySelector('[role="status"]')!;
    expect(live).toBeTruthy();
    expect(live.textContent).toBe("");
    rerender(<StatusLine>已保存</StatusLine>);
    expect(container.querySelector('[role="status"]')).toBe(live);
    expect(live.textContent).toBe("已保存");
  });

  it("DropTarget：拖进来出遮罩，松手交给 onFiles", () => {
    const onFiles = vi.fn();
    const { container } = render(<DropTarget onFiles={onFiles}><p>区域</p></DropTarget>);
    const target = container.firstElementChild!;
    const file = new File(["x"], "a.png", { type: "image/png" });
    const dataTransfer = { types: ["Files"], files: [file], getData: () => "" };
    fireEvent.dragEnter(target, { dataTransfer });
    expect(container.querySelector(".xxd-dropveil")!.hasAttribute("data-open")).toBe(true);
    fireEvent.drop(target, { dataTransfer });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("AppearanceSettings：开关圆角写到 <html>", async () => {
    render(
      <XxdAppearanceProvider storageKey="test-ui-2">
        <AppearanceSettings />
      </XxdAppearanceProvider>,
    );
    await act(async () => fireEvent.click(screen.getByRole("switch", { name: "圆角" })));
    expect(document.documentElement.getAttribute("data-corners")).toBe("rounded");
    await act(async () => fireEvent.click(screen.getByRole("radio", { name: "暗" })));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

describe("O8 每个小小东组件", () => {
  it("Settings / SettingsGroup / SettingsRow：组名缺省 h2，可改级别；行可以是链接；关键词给设置搜索", () => {
    const { container, rerender } = render(
      <Settings>
        <SettingsGroup title="写入" note="只影响这个插件">
          <SettingsRow title="写入标题" description="第一行作为标题" keywords="heading" control={<input type="checkbox" aria-label="写入标题" />} />
          <SettingsRow title="快捷键" href="#keys" />
        </SettingsGroup>
      </Settings>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "写入" })).toBeTruthy();
    expect(container.querySelector(".xxd-row")?.getAttribute("data-keywords")).toBe("heading");
    expect(screen.getByRole("link", { name: "快捷键" }).getAttribute("href")).toBe("#keys");
    expect(container.querySelector(".xxd-group__note")?.textContent).toBe("只影响这个插件");
    rerender(<SettingsGroup title="高级" level={3}><span /></SettingsGroup>);
    expect(screen.getByRole("heading", { level: 3, name: "高级" })).toBeTruthy();
  });

  it("Chip：受控的 aria-pressed；不传 pressed 时是普通按钮", () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(<Chip pressed={false} onPressedChange={onPressedChange}>海报</Chip>);
    const chip = screen.getByRole("button", { name: "海报" });
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(chip);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    rerender(<Chip>封面</Chip>);
    expect(screen.getByRole("button", { name: "封面" }).hasAttribute("aria-pressed")).toBe(false);
  });

  it("Rail：nav 有名字，当前项 aria-current=page", () => {
    render(<Rail current="/fav" items={[{ href: "/", label: "首页" }, { href: "/fav", label: "收藏" }]} />);
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "收藏" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "首页" }).hasAttribute("aria-current")).toBe(false);
  });

  it("Swatches：一组单选，方向键选择，Tab 只停在选中的那一个；名字跟语言走", () => {
    const presets = [{ id: "", name: "Ink", zh: "墨色" }, { id: "#3b74b8", name: "Lake blue", zh: "湖蓝" }, { id: "#5a8a3c", name: "Moss", zh: "苔绿" }];
    function T() {
      const [v, setV] = useState("#3b74b8");
      return <Swatches value={v} onValueChange={setV} presets={presets} />;
    }
    render(<T />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
    fireEvent.keyDown(screen.getByRole("radiogroup", { name: "主色" }), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "苔绿" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "Home" });
    expect(screen.getByRole("radio", { name: "墨色" }).getAttribute("aria-checked")).toBe("true");
    cleanup();
    render(<XxdLocaleProvider locale="en"><Swatches value="" onValueChange={() => {}} presets={presets} /></XxdLocaleProvider>);
    expect(screen.getByRole("radio", { name: "Moss" })).toBeTruthy();
  });

  it("CardGrid / Card：网格最小列宽；有 href 是链接，没有是按钮；角标在图上", () => {
    const onClick = vi.fn();
    const { container } = render(
      <CardGrid min={180} masonry>
        <Card href="/p/1" title="编辑式海报" meta="12 张" marks={<span className="xxd-badge">新</span>} />
        <Card title="封面" onClick={onClick} />
      </CardGrid>,
    );
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toBe("xxd-masonry");
    expect(grid.style.getPropertyValue("--grid-min")).toBe("180px");
    expect(screen.getByRole("link", { name: /编辑式海报/ }).querySelector(".xxd-card__marks .xxd-badge")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "封面" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("Prose：透传属性", () => {
    const { container } = render(<Prose id="a" lang="en"><h2>标题</h2></Prose>);
    const el = container.querySelector(".xxd-prose")!;
    expect(el.id).toBe("a");
    expect(el.getAttribute("lang")).toBe("en");
  });

  it("DropZone：标题、说明、拖入时 data-over", () => {
    const { container, rerender } = render(<DropZone title="拖图片进来">或粘贴</DropZone>);
    expect(container.querySelector(".xxd-dropzone__title")?.textContent).toBe("拖图片进来");
    expect(container.querySelector(".xxd-help")?.textContent).toBe("或粘贴");
    expect(container.querySelector(".xxd-dropzone")!.hasAttribute("data-over")).toBe(false);
    rerender(<DropZone title="拖图片进来" over />);
    expect(container.querySelector(".xxd-dropzone")!.hasAttribute("data-over")).toBe(true);
  });

  it("AccountCard：会员的头像有标记，计划行的语气", () => {
    const { container } = render(<AccountCard name="小小东" avatar="东" plan="会员 · 到 2027 年" tone="member" member action={<button>管理</button>} />);
    expect(container.querySelector(".xxd-avatar")!.hasAttribute("data-member")).toBe(true);
    expect(container.querySelector(".xxd-plan-line")?.getAttribute("data-tone")).toBe("member");
    expect(screen.getByRole("button", { name: "管理" })).toBeTruthy();
  });
});

describe("O8 React 与原生同源", () => {
  // React 版和原生版用同一份 @xxd/css：React 渲染出的每个 xxd-* 类都必须是原生 CSS 里真有的类，
  // 否则就是两边走样了（React 自己发明了样式，或者原生改了名字 React 没跟上）。
  const cssDir = join(import.meta.dirname, "../../xxd-css/src/css");
  const css = readdirSync(cssDir).map((f) => readFileSync(join(cssDir, f), "utf8")).join("\n");
  const defined = new Set([...css.matchAll(/\.(xxd-[\w-]+)/g)].map((m) => m[1]));
  const presets = [{ id: "", name: "Ink", zh: "墨色" }, { id: "#3b74b8", name: "Lake blue", zh: "湖蓝" }];
  const all = (
    <XxdAppearanceProvider storageKey="parity">
      <SheetHost>
        <Dock status="已保存" tools={<button>x</button>} primary={<button>写入</button>} danger={<button>删除</button>} />
        <Sheet open title="封面" onOpenChange={() => {}}><p>内容</p></Sheet>
      </SheetHost>
      <Settings><SettingsGroup title="组" note="说明"><SettingsRow title="行" description="说明" control={<span />} /></SettingsGroup></Settings>
      <Chip pressed>海报</Chip>
      <Search value="a" onValueChange={() => {}} />
      <Segmented label="类型" value="a" onValueChange={() => {}} options={[{ value: "a", label: "A" }]} block size="sm" />
      <Rail items={[{ href: "/", label: "首页", icon: "House" }]} current="/" />
      <Swatches value="" onValueChange={() => {}} presets={presets} />
      <AppearanceSettings showDensity showFinish />
      <CardGrid><Card title="卡" meta="12" marks={<span />} /></CardGrid>
      <CardGrid masonry><Card href="#" title="卡" /></CardGrid>
      <Prose><p>正文</p></Prose>
      <StatusLine tone="warning" action={{ label: "重试", onClick: () => {} }}>用完了</StatusLine>
      <ConfirmTwiceButton onConfirm={() => {}}>删除</ConfirmTwiceButton>
      <DropTarget onFiles={() => {}}><p>区</p></DropTarget>
      <DropZone title="拖进来" over>或粘贴</DropZone>
      <AccountCard name="小小东" avatar="东" plan="会员" tone="member" member />
    </XxdAppearanceProvider>
  );

  it("每个渲染出来的 xxd-* 类都在 @xxd/css 里", () => {
    const { container } = render(all);
    const used = new Set([...container.querySelectorAll("[class]")].flatMap((el) => [...el.classList]).filter((c) => c.startsWith("xxd-")));
    expect(used.size).toBeGreaterThan(30);
    expect([...used].filter((c) => !defined.has(c))).toEqual([]);
  });
});

describe("R6 XxdAppearanceProvider", () => {
  it("服务端渲染和浏览器第一次渲染一样（水合不报错），挂载后读到存储里的设置", async () => {
    const { renderToString } = await import("react-dom/server");
    const { hydrateRoot } = await import("react-dom/client");
    localStorage.setItem("ssr-ui", JSON.stringify({ theme: "dark", corners: "rounded" }));
    const tree = (
      <XxdAppearanceProvider storageKey="ssr-ui">
        <AppearanceSettings />
      </XxdAppearanceProvider>
    );
    const html = renderToString(tree);
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(host, tree);
    });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-corners")).toBe("rounded");
    await act(async () => root!.unmount());
    host.remove();
  });

  it("lock 写成字面量：重新渲染不会每次都重新套外观", async () => {
    function App({ n }: { n: number }) {
      return (
        <XxdAppearanceProvider storageKey="lock-ui" lock={{ corners: "square" }}>
          <span>{n}</span>
        </XxdAppearanceProvider>
      );
    }
    const html = document.documentElement;
    const { rerender } = render(<App n={1} />);
    const before = html.getAttribute("data-theme");
    const writes: string[] = [];
    const spy = new MutationObserver((records) => records.forEach((r) => writes.push(r.attributeName ?? "")));
    spy.observe(html, { attributes: true });
    rerender(<App n={2} />);
    rerender(<App n={3} />);
    await new Promise((r) => setTimeout(r, 0));
    spy.disconnect();
    expect(html.getAttribute("data-theme")).toBe(before);
    expect(writes).toEqual([]);
  });
});

describe("R6 React 和原生对照", () => {
  const registry = JSON.parse(readFileSync(join(import.meta.dirname, "../../xxd-css/registry.json"), "utf8")).components as { name: string; markup: string }[];
  const native = (name: string, selector: string) => {
    const host = document.createElement("div");
    host.innerHTML = registry.find((c) => c.name === name)!.markup;
    return host.querySelector(selector)!;
  };
  const xxdClasses = (root: Element) => new Set([root, ...root.querySelectorAll("*")].flatMap((el) => [...el.classList]).filter((c) => c.startsWith("xxd-")));
  const roles = (root: Element) => [root, ...root.querySelectorAll("[role]")].map((el) => el.getAttribute("role")).filter(Boolean);

  const CASES: [string, string, ReactNode][] = [
    ["Segmented", ".xxd-segmented", <Segmented label="类型" value="a" onValueChange={() => {}} options={[{ value: "a", label: "文本" }, { value: "b", label: "图片" }]} />],
    ["Chip", ".xxd-chip", <Chip pressed>海报</Chip>],
    ["Dock", ".xxd-dock", <Dock status="已保存" tools={<button>x</button>} primary={<button>写入</button>} />],
    ["SettingsGroup", ".xxd-group", <SettingsGroup title="写入"><SettingsRow title="写入标题" description="第一行" control={<input type="checkbox" role="switch" className="xxd-switch" aria-label="写入标题" />} /></SettingsGroup>],
    ["Rail", ".xxd-rail", <Rail items={[{ href: "/", label: "首页", icon: "House" }, { href: "/b", label: "收藏", icon: "Bookmark" }]} current="/" />],
  ];

  for (const [name, selector, element] of CASES) {
    it(`${name}：根元素同样的标签角色和类，React 没有原生示例里没有的 xxd-* 结构`, () => {
      const n = native(name, selector);
      const { container } = render(<XxdAppearanceProvider storageKey="parity-2">{element}</XxdAppearanceProvider>);
      const r = container.querySelector(selector)!;
      expect(r, `React 版没有 ${selector}`).toBeTruthy();
      expect(r.tagName).toBe(n.tagName);
      expect(r.getAttribute("role")).toBe(n.getAttribute("role"));
      expect([...xxdClasses(r)].filter((c) => !xxdClasses(n).has(c))).toEqual([]);
      expect([...new Set(roles(r))].sort()).toEqual([...new Set(roles(n))].sort());
    });
  }
});

describe("Gauge（GAUGE-PLAN G4）", () => {
  it("和 Xxd.gauge 同一个结构：role=meter、名字、整句、两端刻度", async () => {
    const { container } = render(<Gauge value={94} unit="%" label="本月额度" target={80} zones={[{ from: 80, to: 90, tone: "warning" }, { from: 90, tone: "danger" }]} />);
    const el = container.querySelector(".xxd-gauge")!;
    expect(el.getAttribute("role")).toBe("meter");
    expect(el.getAttribute("aria-label")).toBe("本月额度");
    expect(el.getAttribute("aria-valuetext")).toBe("94%，超限，目标 80%");
    expect(el.querySelector(".xxd-gauge__state")?.textContent).toBe("超限");
    expect(el.querySelector(".xxd-gauge__fill-danger")).not.toBeNull();
    // 网页版（@xxd/css）画出来的类名一样
    const lib = await import("@xxd/css/viz");
    const { gauge, useViz } = await import("@xxd/css");
    useViz(lib);
    const native = document.createElement("div");
    gauge(native, { value: 94, unit: "%", label: "本月额度", target: 80, zones: [{ from: 80, to: 90, tone: "warning" }, { from: 90, tone: "danger" }] });
    const classes = (n: Element) => [...n.querySelectorAll("[class]")].map((x) => x.getAttribute("class")).sort();
    expect(classes(el)).toEqual(classes(native));
  });

  it("指针：值变了只改 transform（同一个元素，过渡才放得出来）", () => {
    const { container, rerender } = render(<Gauge shape="half" needle value={20} label="负载" />);
    const g = container.querySelector(".xxd-gauge__needle") as SVGGElement;
    rerender(<Gauge shape="half" needle value={80} label="负载" />);
    expect(container.querySelector(".xxd-gauge__needle")).toBe(g);
    expect(g.style.transform).toBe("rotate(54deg)");
  });

  it("英文、多环的图例、没有 label 时用 aria-label", () => {
    const { container } = render(
      <XxdLocaleProvider locale="en">
        <Gauge shape="ring" aria-label="This week" rings={[{ label: "Writing", value: 3, max: 5 }, { label: "Reading", value: 40, max: 60 }]} />
      </XxdLocaleProvider>,
    );
    const el = container.querySelector(".xxd-gauge")!;
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("This week");
    expect([...el.querySelectorAll(".xxd-legend__item")].map((li) => li.textContent)).toEqual(["Writing3 of 5", "Reading40 of 60"]);
  });
});

describe("图型（CHART-TYPES-PLAN H4）：和 Xxd.viz 画出来的结构一样", () => {
  const same = async (node: ReactNode, kind: string, data: unknown, options: Record<string, unknown> = {}) => {
    const { container } = render(node);
    const lib = await import("@xxd/css/viz");
    const { viz, useViz } = await import("@xxd/css");
    useViz(lib);
    const native = document.createElement("div");
    viz(native, kind as "bars", data, options);
    const shape = (n: Element) => [...n.querySelectorAll("*")].map((x) => `${x.tagName}.${x.getAttribute("class") ?? ""}[${x.getAttribute("data-part") ?? x.getAttribute("data-level") ?? ""}]${x.children.length ? "" : x.textContent}`);
    expect(shape(container.firstElementChild!)).toEqual(shape(native));
    return container.firstElementChild!;
  };

  it("条形榜", async () => {
    const items = [{ label: "长文发布", value: 2410 }, { label: "批量存图", value: 5102, highlight: true }];
    const el = await same(<Bars items={items} unit="人" step={1000} />, "bars", items, { unit: "人", step: 1000 });
    expect(el.tagName).toBe("OL");
    expect(el.hasAttribute("data-emphasis")).toBe(true);
    expect((el as HTMLElement).style.getPropertyValue("--rungs")).toBe("5");
  });

  it("构成条、百格图", async () => {
    const parts = [{ label: "图片", value: 38 }, { label: "视频", value: 22 }];
    const p = await same(<Proportion parts={parts} label="已用空间" unit="GB" />, "proportion", parts, { label: "已用空间", unit: "GB" });
    expect(p.getAttribute("aria-label")).toBe("已用空间，图片 63%，视频 37%");
    const w = await same(<Waffle parts={parts} label="来源" />, "waffle", parts, { label: "来源" });
    expect(w.querySelectorAll(".xxd-waffle__cell")).toHaveLength(100);
  });

  it("热力格（日历、矩阵）、前后对比", async () => {
    const values = { "2026-10-19": 5, "2026-10-12": 2 };
    const cal = await same(<Heatmap values={values} end="2026-10-19" weeks={8} />, "calendar", values, { end: "2026-10-19", weeks: 8 });
    expect(cal.querySelectorAll(".xxd-heatmap__grid .xxd-heatmap__cell")).toHaveLength(56);
    const matrix = { rows: ["一", "二"], cols: ["9", "10"], values: [[1, 4], [0, 8]] };
    await same(<Heatmap matrix={matrix} numbers />, "matrix", matrix, { numbers: true });
    const rows = [{ label: "写第一篇", from: 14, to: 6 }];
    const d = await same(<Dumbbell rows={rows} unit="分钟" />, "dumbbell", rows, { unit: "分钟" });
    expect(d.querySelector(".xxd-dumbbell__item")?.textContent).toBe("写第一篇14 分钟 → 6 分钟−8");
  });
});

describe("查漏补缺（CHART-TYPES-PLAN 8.1）：React 和 Xxd.viz 一样", () => {
  it("条形榜的对照、参考线、刻度、瀑布、空数据", async () => {
    const lib = await import("@xxd/css/viz");
    const { viz, useViz } = await import("@xxd/css");
    useViz(lib);
    const items = [{ label: "a", value: 2400, compare: 2000, note: "历史最高" }, { label: "b", value: 1000 }];
    const o = { axis: true, mark: 1800, markLabel: "平均", compareLabel: "去年", valueLabel: "今年", unit: "人" };
    const { container } = render(<Bars items={items} {...o} />);
    const native = document.createElement("ol");
    viz(native, "bars", items, o);
    const shape = (n: Element) => [...n.querySelectorAll("*")].map((x) => `${x.className}|${x.children.length ? "" : x.textContent}|${(x as HTMLElement).style?.cssText ?? ""}`);
    expect(shape(container.firstElementChild!)).toEqual(shape(native));
    expect(container.querySelector(".xxd-bars__key")?.textContent).toBe("今年去年平均 1,800 人");
    const w = render(<Bars variant="waterfall" items={[{ label: "毛收入", value: 100, total: true }, { label: "退款", value: -20 }]} />);
    expect(w.container.querySelectorAll("[data-total]")).toHaveLength(1);
    const e = render(<Bars items={[]} />);
    expect(e.container.textContent).toBe("没有数据");
  });
});
