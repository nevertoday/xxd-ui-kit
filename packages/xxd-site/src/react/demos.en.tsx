// demos.tsx 的英文版（/en/ 组件页用）：函数名、结构和中文版一一对应，只换文字。
import { useEffect, useState } from "react";
import { chartOptions, sparkline } from "@xxd/css";
import {
  Chart,
  Gauge,
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
      <Text variant="heading2" as="h3">Appearance</Text>
      <Text variant="secondary">Only affects this extension</Text>
    </div>
  );
}

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary">Post to X</Button>
      <Button>Save draft</Button>
      <Button variant="ghost">Later</Button>
      <Button variant="outline">Export</Button>
      <Button variant="destructive">Delete</Button>
      <Button loading>Generating…</Button>
    </div>
  );
}

export function LinkDemo() {
  return <Link href="#">Start a new post instead</Link>;
}

export function ButtonGroupDemo() {
  return (
    <ButtonGroup>
      <Button size="sm">Left</Button>
      <Button size="sm">Middle</Button>
      <Button size="sm">Right</Button>
    </ButtonGroup>
  );
}

export function FieldDemo() {
  return (
    <div className="grid w-72 gap-4">
      <Input label="Title" placeholder="Give this post a name" description="Up to 100 characters" />
      <Input label="Email" defaultValue="not-an-email" error="Enter a valid email address" />
    </div>
  );
}

export function SelectDemo() {
  const [value, setValue] = useState("high");
  return (
    <Select
      label="Image quality"
      className="w-48"
      value={value}
      onValueChange={(v) => setValue((v as string) ?? "high")}
      items={{ high: "High", standard: "Standard" }}
    />
  );
}

export function SwitchDemo() {
  const [on, setOn] = useState(true);
  return <Switch label="Completion sound" checked={on} onCheckedChange={setOn} />;
}

export function CheckboxDemo() {
  const [on, setOn] = useState(true);
  return <Checkbox label="Smart punctuation" checked={on} onCheckedChange={setOn} />;
}

export function RadioDemo() {
  const [value, setValue] = useState("one");
  return (
    <Radio.Group legend="How to write" value={value} onValueChange={(v) => setValue(v as string)}>
      <Radio.Item label="This post only" value="one" />
      <Radio.Item label="Write all" value="all" />
    </Radio.Group>
  );
}

export function RangeDemo() {
  return <Slider label="Generate at once" defaultValue={2} min={1} max={4} className="w-60" />;
}

export function TagInputDemo() {
  return <TagInput className="w-72" defaultValue={["Poster"]} placeholder="Press Enter to add" />;
}

const accents = ["Ink", "Lake blue", "Moss", "Rouge"];
export function ComboboxDemo() {
  const [value, setValue] = useState<string | null>("Lake blue");
  return (
    <Combobox value={value} onValueChange={(v) => setValue(v as string | null)} items={accents}>
      <Combobox.TriggerInput placeholder="Type to filter" />
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
        { value: "write", label: "Write" },
        { value: "history", label: "History" },
        { value: "settings", label: "Settings" },
      ]}
      selectedValue="write"
    />
  );
}

export function SegmentedDemo() {
  const [v, setV] = useState<"text" | "image">("text");
  return <Segmented label="Type" value={v} onValueChange={setV} options={[{ value: "text", label: "Text" }, { value: "image", label: "Image" }]} />;
}

export function BreadcrumbsDemo() {
  return (
    <Breadcrumbs>
      <Breadcrumbs.Link href="#">Settings</Breadcrumbs.Link>
      <Breadcrumbs.Separator />
      <Breadcrumbs.Current>Appearance</Breadcrumbs.Current>
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
      <Dialog.Trigger render={(p) => <Button {...p}>Open</Button>} />
      <Dialog className="p-5">
        <Dialog.Title className="text-lg font-semibold">Which post should this go into?</Dialog.Title>
        <Dialog.Description className="mt-2 text-kumo-subtle">Existing content is never replaced by default.</Dialog.Description>
        <DialogActions className="mt-4">
          <Dialog.Close render={(p) => <Button variant="ghost" data-xxd-cancel {...p}>Cancel</Button>} />
          <Dialog.Close render={(p) => <Button variant="primary" {...p}>Write as a new post</Button>} />
        </DialogActions>
      </Dialog>
    </Dialog.Root>
  );
}

export function MenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger render={<Button>More</Button>} />
      <DropdownMenu.Content>
        <DropdownMenu.Item>Rename</DropdownMenu.Item>
        <DropdownMenu.Item>Copy Markdown</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item variant="danger">Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

export function PopoverDemo() {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button />}>What is this?</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup>
            <Popover.Arrow />
            <Popover.Title>Accent</Popover.Title>
            <Popover.Description>Lightened or darkened automatically so it reads clearly on both light and dark paper.</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <Tooltip content="Search ⌘F" render={<Button shape="square" aria-label="Search" icon={<Icon name="Search" />} />} />
    </TooltipProvider>
  );
}

function ToastButton() {
  const toasts = useKumoToastManager();
  return <Button onClick={() => toasts.add({ title: "Draft saved" })}>Show a toast</Button>;
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
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="success">Posted</Badge>
      <Badge variant="warning">Needs update</Badge>
    </div>
  );
}

export function BannerDemo() {
  return <Banner variant="alert" title="1 post left today" description="Resets at midnight." />;
}

export function EmptyDemo() {
  return <Empty title="No history yet" description="Posts written to X show up here." />;
}

export function ProgressDemo() {
  return (
    <div className="grid w-72 gap-4">
      <Meter label="Posts today" value={60} customValue="3 / 5" />
      <Loader />
    </div>
  );
}

export function TableDemo() {
  // The table sits in a framed box (same as native .xxd-table-wrap: --line border, --r-md corners, scrolls sideways when narrow)
  return (
    <div className="overflow-x-auto rounded-xl border border-kumo-line bg-kumo-base">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Extension</Table.Head>
            <Table.Head className="text-right">Users</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Long-form publisher</Table.Cell>
            <Table.Cell className="text-right">2,410</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Bulk image saver</Table.Cell>
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
      <Collapsible.DefaultTrigger>Why square corners by default?</Collapsible.DefaultTrigger>
      <Collapsible.DefaultPanel>
        <Text>It's a hard rule on the member site: no rounded dialogs, cards, buttons or inputs.</Text>
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
      <LayerCard.Secondary>Next step</LayerCard.Secondary>
      <LayerCard.Primary>Build your first extension with XXD UI</LayerCard.Primary>
    </LayerCard>
  );
}

export function InputGroupDemo() {
  return (
    <InputGroup className="w-80">
      <InputGroup.Input aria-label="Subdomain" defaultValue="today" />
      <InputGroup.Suffix>.xiaoxiaodong.ai</InputGroup.Suffix>
    </InputGroup>
  );
}

export function SecretInputDemo() {
  return (
    <div className="w-80">
      <SensitiveInput label="API key" defaultValue="sk_live_4f8a2c91d7e3b6a0" />
    </div>
  );
}

export function ClipboardTextDemo() {
  return <ClipboardText text="pnpm xxd new ./today" />;
}

export function InlineCopyDemo() {
  return (
    <p>
      Run <InlineCopyText labels={{ copyAction: "Copy command", copied: "Command copied" }}>pnpm xxd ls</InlineCopyText> — one click copies it.
    </p>
  );
}

type Quality = { value: string; label: string };
const qualities = { pic: [{ value: "high", label: "High" }, { value: "standard", label: "Standard" }], other: [{ value: "auto", label: "Follow my plan" }] };
export function PickerDemo() {
  const [value, setValue] = useState<Quality | null>(qualities.pic[0]);
  return (
    <Select
      label="Image quality"
      className="w-56"
      value={value}
      onValueChange={(v) => setValue(v as Quality | null)}
      isItemEqualToValue={(a: Quality, b: Quality) => a.value === b.value}
      renderValue={(v: Quality | null) => v?.label ?? "Choose one"}
    >
      <Select.Group>
        <Select.GroupLabel>Quality</Select.GroupLabel>
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
      <Toolbar.Button icon={<Icon name="Bold" />} aria-label="Bold" />
      <Toolbar.Button icon={<Icon name="Italic" />} aria-label="Italic" />
      <Toolbar.Button icon={<Icon name="Link" />} aria-label="Link" />
      <Toolbar.Button icon={<Icon name="Image" />} aria-label="Image" />
    </Toolbar>
  );
}

export function TableOfContentsDemo() {
  return (
    <TableOfContents>
      <TableOfContents.Title>On this page</TableOfContents.Title>
      <TableOfContents.List>
        {["Demo", "Attributes and classes", "Rules"].map((t) => (
          <TableOfContents.Item key={t} active={t === "Demo"}>
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
        <Surface className="rounded-lg p-4">Side 1</Surface>
      </GridItem>
      <GridItem>
        <Surface className="rounded-lg p-4">Main 2</Surface>
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
              <Sidebar.GroupLabel>Content</Sidebar.GroupLabel>
              <Sidebar.Menu>
                <Sidebar.MenuButton icon={(p: object) => <Icon name="House" {...p} />} active>
                  Home
                </Sidebar.MenuButton>
                <Sidebar.MenuButton icon={(p: object) => <Icon name="Bookmark" {...p} />}>Saved</Sidebar.MenuButton>
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
  return <Search value={q} onValueChange={setQ} placeholder="Search settings" />;
}

export function ChipDemo() {
  const [on, setOn] = useState<Record<string, boolean>>({ Poster: true, Cover: false });
  return (
    <div className="xxd-cluster">
      {Object.keys(on).map((k) => (
        <Chip key={k} pressed={on[k]} onPressedChange={(p) => setOn({ ...on, [k]: p })}>{k}</Chip>
      ))}
    </div>
  );
}

export function RailDemo() {
  return <Rail current="/" items={[{ href: "/", label: "Home", icon: "House" }, { href: "/saved", label: "Saved", icon: "Bookmark" }]} />;
}

export function DockDemo() {
  return (
    <Dock
      style={{ position: "static", width: 380 }}
      status="30 characters · Saved"
      tools={<Button variant="ghost" shape="square" aria-label="Cover" icon={<Icon name="Image" />} />}
      primary={<Button variant="primary" size="sm">Post to X</Button>}
    />
  );
}

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <SheetHost style={{ position: "relative", width: 380, height: 320, border: "1px solid var(--line)", overflow: "hidden" }}>
      <div style={{ padding: 14 }} className="xxd-text" data-variant="secondary">Body…</div>
      <Sheet open={open} onOpenChange={setOpen} title="Cover">
        <p className="xxd-help">Pick an image as the post cover.</p>
      </Sheet>
      <Dock style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} primary={<Button size="sm" onClick={() => setOpen(!open)}>Cover</Button>} />
    </SheetHost>
  );
}

export function SettingsGroupDemo() {
  const [on, setOn] = useState(true);
  return (
    <Settings style={{ maxWidth: 420 }}>
      <SettingsGroup title="Writing">
        <SettingsRow title="Write the title" description="Use the first # heading as the post title" control={<input type="checkbox" role="switch" className="xxd-switch" aria-label="Write the title" checked={on} onChange={(e) => setOn(e.target.checked)} />} />
        <SettingsRow title="Local image folder" description="Not connected" href="#" />
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
        <Card key={c} href="#" title={`Editorial poster 00${i + 1}`} meta={`xxd-panel-00${i + 1}`} media={<div style={{ position: "absolute", inset: 0, background: c }} />} />
      ))}
    </CardGrid>
  );
}

export function ProseDemo() {
  return (
    <Prose style={{ maxWidth: 560 }}>
      <h2>Why square corners</h2>
      <p>Square corners let the content speak first. Every color, radius and shadow comes from <code>tokens.css</code>。</p>
      <blockquote>Motion is for revealing hierarchy and giving feedback, not decoration.</blockquote>
    </Prose>
  );
}

export function ChartDemo() {
  const [echarts, setEcharts] = useState<typeof import("echarts") | null>(null);
  const [, bump] = useState(0);
  useEffect(() => {
    import("echarts").then(setEcharts);
    // Re-read the tokens when the theme or accent changes
    const mo = new MutationObserver(() => bump((n) => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-accent", "style"] });
    return () => mo.disconnect();
  }, []);
  if (!echarts) return <div className="xxd-chart" />;
  const days = Array.from({ length: 14 }, (_, i) => `Day ${i + 1}`);
  const options = chartOptions({
    legend: {},
    xAxis: { type: "category", data: days, boundaryGap: false },
    yAxis: { type: "value" },
    series: [
      { name: "Long-form publisher", type: "line", data: [42, 48, 45, 60, 58, 66, 71, 69, 80, 78, 85, 90, 88, 96] },
      { name: "Image sorter", type: "line", data: [20, 22, 25, 24, 28, 27, 30, 33, 31, 35, 34, 36, 38, 40] },
    ],
  });
  return (
    <div className="xxd-chart-card" style={{ width: "100%", maxWidth: 720 }}>
      <div className="xxd-chart-card__head"><h3 className="xxd-chart-card__title">Posts per day</h3><span className="xxd-chart-card__meta">Kumo &lt;Chart&gt; + Xxd.chartOptions</span></div>
      <Chart echarts={echarts as never} options={options as never} height={260} />
    </div>
  );
}

export function StatDemo() {
  return (
    <div className="xxd-stats" style={{ width: "100%", maxWidth: 640 }}>
      {[["Posts this week", "1,284", "posts", "up", "↑ 12.4% vs last week", [8, 9, 7, 11, 10, 13, 15]], ["New members", "86", "", "down", "↓ 3 vs last week", [12, 11, 13, 10, 9, 10, 8]]].map(([label, value, unit, tone, delta, data]) => (
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
        <Gauge value={72} unit="%" label="Storage used" target={80} zones={zones} />
        <Gauge shape="ring" segments={8} max={8} value={cups} unit="glasses" label="Water today" />
        <Gauge shape="half" needle ticks={10} value={cups * 12} unit="%" label="CPU load" zones={[{ from: 80, tone: "danger" }]} />
      </div>
      <div className="xxd-cluster">
        <Button size="sm" onClick={() => setCups((n) => Math.max(0, n - 1))}>One less</Button>
        <Button size="sm" onClick={() => setCups((n) => Math.min(8, n + 1))}>One more</Button>
      </div>
    </div>
  );
}
