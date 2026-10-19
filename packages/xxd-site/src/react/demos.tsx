// React 版演示（@xxd/react）。函数名 = 原生组件名 + "Demo"；组件页会自动并排展示，源码也从这里抽取。
import { useEffect, useState } from "react";
import { chartOptions, sparkline } from "@xxd/css";
import {
  Chart,
  Gauge,
  Bars,
  Proportion,
  Waffle,
  Heatmap,
  Dumbbell,
  AppearanceSettings,
  Card,
  CardGrid,
  Chip,
  Dock,
  Prose,
  Rail,
  Search,
  Segmented,
  Settings,
  SettingsGroup,
  SettingsRow,
  Sheet,
  SheetHost,
  XxdAppearanceProvider,
  Badge,
  Grid,
  GridItem,
  Sidebar,
  Surface,
  TableOfContents,
  Toolbar,
  Banner,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Checkbox,
  ClipboardText,
  Collapsible,
  Combobox,
  Dialog,
  DialogActions,
  DropdownMenu,
  Empty,
  Icon,
  InlineCopyText,
  Input,
  InputGroup,
  LayerCard,
  Link,
  Loader,
  Meter,
  Pagination,
  Popover,
  Radio,
  Select,
  SensitiveInput,
  Slider,
  Switch,
  Table,
  Tabs,
  TagInput,
  Text,
  Toasty,
  Tooltip,
  TooltipProvider,
  useKumoToastManager,
} from "@xxd/react";

export function TextDemo() {
  return (
    <div className="grid gap-1">
      <Text variant="heading2" as="h3">外观</Text>
      <Text variant="secondary">只影响这个插件</Text>
    </div>
  );
}

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary">写入 X</Button>
      <Button>保存草稿</Button>
      <Button variant="ghost">稍后</Button>
      <Button variant="outline">导出</Button>
      <Button variant="destructive">删除</Button>
      <Button loading>正在生成…</Button>
    </div>
  );
}

export function LinkDemo() {
  return <Link href="#">改为新建一篇</Link>;
}

export function ButtonGroupDemo() {
  return (
    <ButtonGroup>
      <Button size="sm">左</Button>
      <Button size="sm">中</Button>
      <Button size="sm">右</Button>
    </ButtonGroup>
  );
}

export function FieldDemo() {
  return (
    <div className="grid w-72 gap-4">
      <Input label="标题" placeholder="给这篇文章起个名字" description="最多 100 个字" />
      <Input label="邮箱" defaultValue="not-an-email" error="请输入有效的邮箱地址" />
    </div>
  );
}

export function SelectDemo() {
  const [value, setValue] = useState("high");
  return (
    <Select
      label="图片质量"
      className="w-48"
      value={value}
      onValueChange={(v) => setValue((v as string) ?? "high")}
      items={{ high: "高", standard: "标准" }}
    />
  );
}

export function SwitchDemo() {
  const [on, setOn] = useState(true);
  return <Switch label="完成音效" checked={on} onCheckedChange={setOn} />;
}

export function CheckboxDemo() {
  const [on, setOn] = useState(true);
  return <Checkbox label="智能标点" checked={on} onCheckedChange={setOn} />;
}

export function RadioDemo() {
  const [value, setValue] = useState("one");
  return (
    <Radio.Group legend="写入方式" value={value} onValueChange={(v) => setValue(v as string)}>
      <Radio.Item label="只写这一篇" value="one" />
      <Radio.Item label="全部写入" value="all" />
    </Radio.Group>
  );
}

export function RangeDemo() {
  return <Slider label="同时生成" defaultValue={2} min={1} max={4} className="w-60" />;
}

export function TagInputDemo() {
  return <TagInput className="w-72" defaultValue={["海报"]} placeholder="回车添加" />;
}

const accents = ["墨色", "湖蓝", "苔绿", "胭脂"];
export function ComboboxDemo() {
  const [value, setValue] = useState<string | null>("湖蓝");
  return (
    <Combobox value={value} onValueChange={(v) => setValue(v as string | null)} items={accents}>
      <Combobox.TriggerInput placeholder="输入筛选" />
      <Combobox.Content>
        <Combobox.Empty />
        <Combobox.List>
          {(item: string) => (
            <Combobox.Item key={item} value={item}>
              {item}
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}

export function TabsDemo() {
  return (
    <Tabs
      variant="underline"
      tabs={[
        { value: "write", label: "写作" },
        { value: "history", label: "记录" },
        { value: "settings", label: "设置" },
      ]}
      selectedValue="write"
    />
  );
}

export function SegmentedDemo() {
  const [v, setV] = useState<"text" | "image">("text");
  return <Segmented label="类型" value={v} onValueChange={setV} options={[{ value: "text", label: "文本" }, { value: "image", label: "图片" }]} />;
}

export function BreadcrumbsDemo() {
  return (
    <Breadcrumbs>
      <Breadcrumbs.Link href="#">设置</Breadcrumbs.Link>
      <Breadcrumbs.Separator />
      <Breadcrumbs.Current>外观</Breadcrumbs.Current>
    </Breadcrumbs>
  );
}

export function PaginationDemo() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} setPage={setPage} perPage={10} totalCount={90} />;
}

export function DialogDemo() {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={(p) => <Button {...p}>打开</Button>} />
      <Dialog className="p-5">
        <Dialog.Title className="text-lg font-semibold">写入哪篇文章？</Dialog.Title>
        <Dialog.Description className="mt-2 text-kumo-subtle">默认不会替换已有内容。</Dialog.Description>
        <DialogActions className="mt-4">
          <Dialog.Close render={(p) => <Button variant="ghost" data-xxd-cancel {...p}>取消</Button>} />
          <Dialog.Close render={(p) => <Button variant="primary" {...p}>写入为新文章</Button>} />
        </DialogActions>
      </Dialog>
    </Dialog.Root>
  );
}

export function MenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger render={<Button>更多</Button>} />
      <DropdownMenu.Content>
        <DropdownMenu.Item>重命名</DropdownMenu.Item>
        <DropdownMenu.Item>复制 Markdown</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item variant="danger">删除</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

export function PopoverDemo() {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button />}>这是什么？</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup>
            <Popover.Arrow />
            <Popover.Title>主色</Popover.Title>
            <Popover.Description>会被自动提亮或加深，保证在亮暗两种纸上都看得清。</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <Tooltip content="搜索 ⌘F" render={<Button shape="square" aria-label="搜索" icon={<Icon name="Search" />} />} />
    </TooltipProvider>
  );
}

function ToastButton() {
  const toasts = useKumoToastManager();
  return <Button onClick={() => toasts.add({ title: "已保存草稿" })}>弹个 toast</Button>;
}
export function ToastDemo() {
  return (
    <Toasty>
      <ToastButton />
    </Toasty>
  );
}

export function BadgeDemo() {
  return (
    <div className="flex gap-2">
      <Badge variant="secondary">草稿</Badge>
      <Badge variant="success">已写入</Badge>
      <Badge variant="warning">待更新</Badge>
    </div>
  );
}

export function BannerDemo() {
  return <Banner variant="alert" title="今天还能写入 1 篇" description="明天 0 点恢复。" />;
}

export function EmptyDemo() {
  return <Empty title="还没有记录" description="写入 X 的文章会出现在这里。" />;
}

export function ProgressDemo() {
  return (
    <div className="grid w-72 gap-4">
      <Meter label="今天的写入" value={60} customValue="3 / 5" />
      <Loader />
    </div>
  );
}

export function TableDemo() {
  // 表格放在一个带框的容器里（和原生的 .xxd-table-wrap 一样：--line 的边、--r-md 的圆角、窄了横向滚动）
  return (
    <div className="overflow-x-auto rounded-xl border border-kumo-line bg-kumo-base">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>插件</Table.Head>
            <Table.Head className="text-right">用户</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>长文发布</Table.Cell>
            <Table.Cell className="text-right">2,410</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>批量存图</Table.Cell>
            <Table.Cell className="text-right">5,102</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  );
}

export function CollapsibleDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.DefaultTrigger>为什么默认直角？</Collapsible.DefaultTrigger>
      <Collapsible.DefaultPanel>
        <Text>会员站的硬规则：对话框、卡片、按钮、输入框都不许圆角。</Text>
      </Collapsible.DefaultPanel>
    </Collapsible.Root>
  );
}

export function CodeDemo() {
  return <ClipboardText text="pnpm xxd new ./today" />;
}

export function LayerCardDemo() {
  return (
    <LayerCard className="w-72">
      <LayerCard.Secondary>下一步</LayerCard.Secondary>
      <LayerCard.Primary>用小小东 UI 做第一个插件</LayerCard.Primary>
    </LayerCard>
  );
}

export function InputGroupDemo() {
  return (
    <InputGroup className="w-80">
      <InputGroup.Input aria-label="子域名" defaultValue="today" />
      <InputGroup.Suffix>.xiaoxiaodong.ai</InputGroup.Suffix>
    </InputGroup>
  );
}

export function SecretInputDemo() {
  return (
    <div className="w-80">
      <SensitiveInput label="API 密钥" defaultValue="sk_live_4f8a2c91d7e3b6a0" />
    </div>
  );
}

export function ClipboardTextDemo() {
  return <ClipboardText text="pnpm xxd new ./today" />;
}

export function InlineCopyDemo() {
  return (
    <p>
      命令 <InlineCopyText labels={{ copyAction: "复制命令", copied: "已复制命令" }}>pnpm xxd ls</InlineCopyText>，一点就复制。
    </p>
  );
}

type Quality = { value: string; label: string };
const qualities = { pic: [{ value: "high", label: "高" }, { value: "standard", label: "标准" }], other: [{ value: "auto", label: "跟随会员计划" }] };
export function PickerDemo() {
  const [value, setValue] = useState<Quality | null>(qualities.pic[0]);
  return (
    <Select
      label="图片质量"
      className="w-56"
      value={value}
      onValueChange={(v) => setValue(v as Quality | null)}
      isItemEqualToValue={(a: Quality, b: Quality) => a.value === b.value}
      renderValue={(v: Quality | null) => v?.label ?? "请选择"}
    >
      <Select.Group>
        <Select.GroupLabel>画质</Select.GroupLabel>
        {qualities.pic.map((q) => (
          <Select.Option key={q.value} value={q}>{q.label}</Select.Option>
        ))}
      </Select.Group>
      <Select.Separator />
      <Select.Group>
        {qualities.other.map((q) => (
          <Select.Option key={q.value} value={q}>{q.label}</Select.Option>
        ))}
      </Select.Group>
    </Select>
  );
}

export function ToolbarDemo() {
  return (
    <Toolbar className="w-full max-w-md">
      <Toolbar.Button icon={<Icon name="Bold" />} aria-label="加粗" />
      <Toolbar.Button icon={<Icon name="Italic" />} aria-label="斜体" />
      <Toolbar.Button icon={<Icon name="Link" />} aria-label="链接" />
      <Toolbar.Button icon={<Icon name="Image" />} aria-label="图片" />
    </Toolbar>
  );
}

export function TableOfContentsDemo() {
  return (
    <TableOfContents>
      <TableOfContents.Title>本文</TableOfContents.Title>
      <TableOfContents.List>
        {["演示", "属性与类名", "规则"].map((t) => (
          <TableOfContents.Item key={t} active={t === "演示"}>
            {t}
          </TableOfContents.Item>
        ))}
      </TableOfContents.List>
    </TableOfContents>
  );
}

export function LayoutDemo() {
  return (
    <Grid variant="2up" gap="base">
      <GridItem>
        <Surface className="rounded-lg p-4">侧栏 1</Surface>
      </GridItem>
      <GridItem>
        <Surface className="rounded-lg p-4">主体 2</Surface>
      </GridItem>
    </Grid>
  );
}

export function SidebarDemo() {
  return (
    <div style={{ height: 320, display: "flex", border: "1px solid var(--line)" }}>
      <Sidebar.Provider contained defaultOpen className="h-full min-h-0!">
        <Sidebar>
          <Sidebar.Content>
            <Sidebar.Group>
              <Sidebar.GroupLabel>内容</Sidebar.GroupLabel>
              <Sidebar.Menu>
                <Sidebar.MenuButton icon={(p: object) => <Icon name="House" {...p} />} active>
                  首页
                </Sidebar.MenuButton>
                <Sidebar.MenuButton icon={(p: object) => <Icon name="Bookmark" {...p} />}>收藏</Sidebar.MenuButton>
              </Sidebar.Menu>
            </Sidebar.Group>
          </Sidebar.Content>
        </Sidebar>
      </Sidebar.Provider>
    </div>
  );
}

export function SearchDemo() {
  const [q, setQ] = useState("");
  return <Search value={q} onValueChange={setQ} placeholder="搜索设置" />;
}

export function ChipDemo() {
  const [on, setOn] = useState<Record<string, boolean>>({ 海报: true, 封面: false });
  return (
    <div className="xxd-cluster">
      {Object.keys(on).map((k) => (
        <Chip key={k} pressed={on[k]} onPressedChange={(p) => setOn({ ...on, [k]: p })}>{k}</Chip>
      ))}
    </div>
  );
}

export function RailDemo() {
  return <Rail current="/" items={[{ href: "/", label: "首页", icon: "House" }, { href: "/saved", label: "收藏", icon: "Bookmark" }]} />;
}

export function DockDemo() {
  return (
    <Dock
      style={{ position: "static", width: 380 }}
      status="30 字符 · 已保存"
      tools={<Button variant="ghost" shape="square" aria-label="封面" icon={<Icon name="Image" />} />}
      primary={<Button variant="primary" size="sm">写入 X</Button>}
    />
  );
}

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <SheetHost style={{ position: "relative", width: 380, height: 320, border: "1px solid var(--line)", overflow: "hidden" }}>
      <div style={{ padding: 14 }} className="xxd-text" data-variant="secondary">正文……</div>
      <Sheet open={open} onOpenChange={setOpen} title="封面">
        <p className="xxd-help">选一张图作为文章封面。</p>
      </Sheet>
      <Dock style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} primary={<Button size="sm" onClick={() => setOpen(!open)}>封面</Button>} />
    </SheetHost>
  );
}

export function SettingsGroupDemo() {
  const [on, setOn] = useState(true);
  return (
    <Settings style={{ maxWidth: 420 }}>
      <SettingsGroup title="写入">
        <SettingsRow title="写入标题" description="第一行 # 标题作为文章标题" control={<input type="checkbox" role="switch" className="xxd-switch" aria-label="写入标题" checked={on} onChange={(e) => setOn(e.target.checked)} />} />
        <SettingsRow title="本地图片文件夹" description="未连接" href="#" />
      </SettingsGroup>
    </Settings>
  );
}

export function AppearanceDemo() {
  return (
    <XxdAppearanceProvider storageKey="xxd-site">
      <Settings style={{ maxWidth: 440 }}>
        <AppearanceSettings showFinish />
      </Settings>
    </XxdAppearanceProvider>
  );
}

export function CardDemo() {
  return (
    <CardGrid min={180}>
      {["#d65f32", "#3b74b8", "#5a8a3c"].map((c, i) => (
        <Card key={c} href="#" title={`编辑式海报 00${i + 1}`} meta={`xxd-panel-00${i + 1}`} media={<div style={{ position: "absolute", inset: 0, background: c }} />} />
      ))}
    </CardGrid>
  );
}

export function ProseDemo() {
  return (
    <Prose style={{ maxWidth: 560 }}>
      <h2>为什么是直角</h2>
      <p>直角让内容先说话。所有颜色、圆角、阴影都来自 <code>tokens.css</code>。</p>
      <blockquote>动效用来揭示层级和给反馈，不是装饰。</blockquote>
    </Prose>
  );
}

export function ChartDemo() {
  const [echarts, setEcharts] = useState<typeof import("echarts") | null>(null);
  const [, bump] = useState(0);
  useEffect(() => {
    import("echarts").then(setEcharts);
    // 切主题 / 主色时重新取令牌
    const mo = new MutationObserver(() => bump((n) => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-accent", "style"] });
    return () => mo.disconnect();
  }, []);
  if (!echarts) return <div className="xxd-chart" />;
  const days = Array.from({ length: 14 }, (_, i) => `${i + 1}日`);
  const options = chartOptions({
    legend: {},
    xAxis: { type: "category", data: days, boundaryGap: false },
    yAxis: { type: "value" },
    series: [
      { name: "长文发布", type: "line", data: [42, 48, 45, 60, 58, 66, 71, 69, 80, 78, 85, 90, 88, 96] },
      { name: "图片排序", type: "line", data: [20, 22, 25, 24, 28, 27, 30, 33, 31, 35, 34, 36, 38, 40] },
    ],
  });
  return (
    <div className="xxd-chart-card" style={{ width: "100%", maxWidth: 720 }}>
      <div className="xxd-chart-card__head"><h3 className="xxd-chart-card__title">每天写入篇数</h3><span className="xxd-chart-card__meta">Kumo &lt;Chart&gt; + Xxd.chartOptions</span></div>
      <Chart echarts={echarts as never} options={options as never} height={260} />
    </div>
  );
}

export function StatDemo() {
  return (
    <div className="xxd-stats" style={{ width: "100%", maxWidth: 640 }}>
      {[["本周写入", "1,284", "篇", "up", "↑ 12.4% 比上周", [8, 9, 7, 11, 10, 13, 15]], ["新会员", "86", "", "down", "↓ 3 比上周", [12, 11, 13, 10, 9, 10, 8]]].map(([label, value, unit, tone, delta, data]) => (
        <div className="xxd-stat" key={label as string}>
          <p className="xxd-stat__label">{label}</p>
          <p className="xxd-stat__value">{value}{unit && <span className="xxd-stat__unit">{unit}</span>}</p>
          <span className="xxd-stat__delta" data-tone={tone as string}>{delta}</span>
          <span className="xxd-stat__spark" dangerouslySetInnerHTML={{ __html: sparkline(data as number[]) }} />
        </div>
      ))}
    </div>
  );
}

export function GaugeDemo() {
  const [cups, setCups] = useState(5);
  const zones = [
    { from: 80, to: 90, tone: "warning" as const },
    { from: 90, tone: "danger" as const },
  ];
  return (
    <div className="xxd-stack" style={{ width: "100%", maxWidth: 560 }}>
      <div className="xxd-gauges">
        <Gauge value={72} unit="%" label="空间已用" target={80} zones={zones} />
        <Gauge shape="ring" segments={8} max={8} value={cups} unit="杯" label="今天喝水" />
        <Gauge shape="half" needle ticks={10} value={cups * 12} unit="%" label="CPU 负载" zones={[{ from: 80, tone: "danger" }]} />
      </div>
      <div className="xxd-cluster">
        <Button size="sm" onClick={() => setCups((n) => Math.max(0, n - 1))}>少一杯</Button>
        <Button size="sm" onClick={() => setCups((n) => Math.min(8, n + 1))}>多一杯</Button>
      </div>
    </div>
  );
}

export function BarsDemo() {
  return (
    <div className="xxd-stack" style={{ width: "100%", maxWidth: 560, ["--stack-gap" as string]: "24px" }}>
      <Bars unit="人" items={[{ label: "长文发布", value: 2410 }, { label: "排序链接", value: 830 }, { label: "批量存图", value: 5102, highlight: true }, { label: "今日待办", value: 312 }]} />
      <Bars variant="funnel" unit="人" items={[{ label: "打开插件", value: 12480 }, { label: "写过一篇", value: 5210 }, { label: "开了会员", value: 742 }]} />
    </div>
  );
}

export function ProportionDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <Proportion label="已用空间" unit="GB" parts={[{ label: "图片", value: 38 }, { label: "视频", value: 22 }, { label: "文档", value: 9 }, { label: "其他", value: 3 }]} />
    </div>
  );
}

export function WaffleDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <Waffle label="新会员从哪来" parts={[{ label: "朋友推荐", value: 46 }, { label: "搜索", value: 27 }, { label: "公众号", value: 18 }, { label: "其他", value: 9 }]} />
    </div>
  );
}

export function HeatmapDemo() {
  const values: Record<string, number> = {};
  for (let i = 0; i < 140; i += 1) if (i % 3 !== 1) values[new Date(Date.UTC(2026, 9, 19) - i * 86400000).toISOString().slice(0, 10)] = (i * 7) % 9;
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Heatmap values={values} end="2026-10-19" weeks={20} unit="篇" />
    </div>
  );
}

export function DumbbellDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <Dumbbell unit="分钟" fromLabel="改版前" toLabel="改版后" rows={[{ label: "写第一篇", from: 14, to: 6 }, { label: "配好图片", from: 9, to: 4 }, { label: "排好版", from: 21, to: 12 }]} />
    </div>
  );
}
