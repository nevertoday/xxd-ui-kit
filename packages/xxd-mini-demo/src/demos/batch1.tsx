// 第一批组件的演示：组件页（pages/component）和展示站嵌的 H5 都用这里。每个演示都中英两版。
import { View } from "@tarojs/components";
import { Bell, Copy, FileText, Heart, House, Plus, Search, Settings, Share, Trash, User } from "@xxd/icons/each";
import {
  ActionSheet,
  AppearanceSettings,
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardGrid,
  Cell,
  CellGroup,
  Checkbox,
  Cluster,
  Dialog,
  Dot,
  Empty,
  Field,
  Icon,
  ImageGrid,
  Input,
  LoadBar,
  Loading,
  NavBar,
  Radio,
  RadioGroup,
  Segmented,
  Sheet,
  Skeleton,
  Spinner,
  Stack,
  Switch,
  TabBar,
  TabPanel,
  Tabs,
  Tag,
  Text,
  Textarea,
  useToast,
} from "@xxd/mini";
import { useState } from "react";
import type { Demo } from "./types";

// 演示用的图（纯色块 SVG，不依赖网络）
const swatch = (color: string) => `data:image/svg+xml;base64,${btoaAscii(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="${color}"/></svg>`)}`;
function btoaAscii(s: string) {
  const B = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let o = "";
  for (let i = 0; i < s.length; i += 3) {
    const n = (s.charCodeAt(i) << 16) | ((s.charCodeAt(i + 1) || 0) << 8) | (s.charCodeAt(i + 2) || 0);
    o += B[(n >> 18) & 63] + B[(n >> 12) & 63] + (i + 1 < s.length ? B[(n >> 6) & 63] : "=") + (i + 2 < s.length ? B[n & 63] : "=");
  }
  return o;
}
export const IMAGES = ["#d8d4cb", "#c9c3b6", "#b9b2a4", "#a7a194", "#e7e4dd", "#cfc9bd"].map(swatch);

function ButtonDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Stack>
      <Cluster>
        <Button variant="primary">{tr("保存", "Save")}</Button>
        <Button>{tr("草稿", "Draft")}</Button>
        <Button variant="ghost">{tr("稍后", "Later")}</Button>
        <Button variant="danger">{tr("删除", "Delete")}</Button>
      </Cluster>
      <Cluster>
        <Button size="sm" icon={Plus}>
          {tr("新建", "New")}
        </Button>
        <Button size="sm" icon={Share} label={tr("分享", "Share")} />
        <Button
          size="sm"
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          {tr("提交", "Submit")}
        </Button>
      </Cluster>
      <Button variant="primary" block>
        {tr("登录", "Sign in")}
      </Button>
      <ButtonGroup block>
        <Button>{tr("取消", "Cancel")}</Button>
        <Button variant="primary">{tr("确定", "OK")}</Button>
      </ButtonGroup>
    </Stack>
  );
}

function CellDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [sound, setSound] = useState(true);
  return (
    <Stack gap={20}>
      <CellGroup title={tr("通知", "Notifications")} note={tr("关掉以后，写入完成时不再响。", "Turn this off to stop the sound when a post is saved.")}>
        <Cell title={tr("完成音效", "Done sound")} control={<Switch checked={sound} onCheckedChange={setSound} label={tr("完成音效", "Done sound")} />} />
        <Cell title={tr("提醒时间", "Reminder")} value="21:00" arrow onClick={() => {}} />
        <Cell leading={<Icon icon={User} size={20} />} title={tr("账号", "Account")} description={tr("小小东 · 会员", "Xiaoxiaodong · Member")} arrow onClick={() => {}} />
      </CellGroup>
      <CellGroup inset>
        <Cell title={tr("退出登录", "Sign out")} danger onClick={() => {}} />
      </CellGroup>
    </Stack>
  );
}

function FieldDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [title, setTitle] = useState("");
  return (
    <Stack gap={16}>
      <Field label={tr("标题", "Title")} help={tr("最多 30 个字", "Up to 30 characters")}>
        <Input value={title} onValueChange={setTitle} placeholder={tr("给这篇起个名字", "Name this post")} maxLength={30} counter />
      </Field>
      <Field label={tr("邮箱", "Email")} error={tr("邮箱格式不对", "That email doesn't look right")}>
        <Input defaultValue="xiaodong@" invalid />
      </Field>
      <Field label={tr("备注", "Notes")} optional>
        <Textarea placeholder={tr("写点什么", "Write something")} rows={3} />
      </Field>
    </Stack>
  );
}

function ChoiceDemo({ tr, kind }: { tr: (zh: string, en: string) => string; kind: "switch" | "checkbox" | "radio" }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [mode, setMode] = useState("one");
  if (kind === "switch")
    return (
      <Stack>
        <Switch checked={a} onCheckedChange={setA}>
          {tr("完成音效", "Done sound")}
        </Switch>
        <Switch checked={b} onCheckedChange={setB}>
          {tr("智能标点", "Smart punctuation")}
        </Switch>
        <Switch disabled>{tr("同步到云端（会员）", "Cloud sync (members)")}</Switch>
      </Stack>
    );
  if (kind === "checkbox")
    return (
      <Stack>
        <Checkbox checked={a} onCheckedChange={setA}>
          {tr("智能标点", "Smart punctuation")}
        </Checkbox>
        <Checkbox checked={b} onCheckedChange={setB}>
          {tr("写入标题", "Write the title")}
        </Checkbox>
        <Checkbox indeterminate>{tr("全选（选了一部分）", "Select all (some selected)")}</Checkbox>
      </Stack>
    );
  return (
    <RadioGroup value={mode} onValueChange={setMode} label={tr("写入方式", "How to write")}>
      <Radio value="one">{tr("只写这一篇", "Only this post")}</Radio>
      <Radio value="all">{tr("全部写入", "All posts")}</Radio>
      <Radio value="none" disabled>
        {tr("不写（不可选）", "Don't write (unavailable)")}
      </Radio>
    </RadioGroup>
  );
}

function SegmentedDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [v, setV] = useState("list");
  const [w, setW] = useState("day");
  return (
    <Stack>
      <Segmented label={tr("显示方式", "View")} value={v} onValueChange={setV} options={[{ value: "list", label: tr("列表", "List") }, { value: "grid", label: tr("网格", "Grid") }]} />
      <Segmented block label={tr("范围", "Range")} value={w} onValueChange={setW} options={[{ value: "day", label: tr("按天", "Day") }, { value: "week", label: tr("按周", "Week") }, { value: "month", label: tr("按月", "Month") }]} />
    </Stack>
  );
}

function TabsDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [v, setV] = useState("write");
  const items = [
    { value: "write", label: tr("写作", "Write") },
    { value: "history", label: tr("记录", "History"), count: 12 },
    { value: "drafts", label: tr("草稿", "Drafts") },
    { value: "trash", label: tr("废纸篓", "Trash") },
    { value: "shared", label: tr("分享出去的", "Shared") },
  ];
  return (
    <View>
      <Tabs value={v} onValueChange={setV} items={items} label={tr("文章", "Posts")} />
      {items.map((i) => (
        <TabPanel key={i.value} when={i.value} value={v} className="demo-block">
          <Text variant="secondary">{tr(`「${i.label}」里的文章排在这里。`, `Posts in “${i.label}” show up here.`)}</Text>
        </TabPanel>
      ))}
    </View>
  );
}

function SheetDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const toast = useToast();
  return (
    <Cluster>
      <Button onClick={() => setOpen(true)}>{tr("封面", "Cover")}</Button>
      <Button onClick={() => setMore(true)}>{tr("更多操作", "More")}</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={tr("封面", "Cover")}
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            {tr("用这张", "Use this")}
          </Button>
        }
      >
        <Stack>
          <Text variant="secondary">{tr("选一张图作为文章封面。", "Pick an image for the cover.")}</Text>
          <ImageGrid images={IMAGES.slice(0, 3)} preview={false} />
        </Stack>
      </Sheet>
      <ActionSheet
        open={more}
        onOpenChange={setMore}
        title={tr("这篇文章", "This post")}
        actions={[
          { label: tr("复制链接", "Copy link"), onClick: () => toast(tr("已复制", "Copied"), { tone: "success" }) },
          { label: tr("移到草稿", "Move to drafts"), onClick: () => toast(tr("已移到草稿", "Moved to drafts")) },
          { label: tr("删除", "Delete"), danger: true, description: tr("30 天内可以在废纸篓找回", "Recoverable from Trash for 30 days"), onClick: () => toast(tr("已删除", "Deleted"), { tone: "danger" }) },
        ]}
      />
    </Cluster>
  );
}

function DialogDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(false);
  const toast = useToast();
  return (
    <Cluster>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {tr("删除这篇", "Delete post")}
      </Button>
      <Button onClick={() => setInfo(true)}>{tr("说明", "About")}</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tr("删除这篇文章？", "Delete this post?")}
        description={tr("删除后 30 天内可以在废纸篓找回。", "You can restore it from Trash within 30 days.")}
        confirm={{ label: tr("删除", "Delete"), danger: true, onClick: () => toast(tr("已删除", "Deleted"), { tone: "success" }) }}
      />
      <Dialog open={info} onOpenChange={setInfo} title={tr("为什么默认直角？", "Why square corners?")} description={tr("直角更安静；想要圆角可以在设置里打开。", "Square corners are calmer. Turn on rounded corners in Settings.")} cancel={false} confirm={{ label: tr("知道了", "Got it") }} />
    </Cluster>
  );
}

function ToastDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const toast = useToast();
  return (
    <Cluster>
      <Button onClick={() => toast(tr("已保存草稿", "Draft saved"), { tone: "success" })}>{tr("保存", "Save")}</Button>
      <Button onClick={() => toast(tr("已移到废纸篓", "Moved to Trash"), { action: { label: tr("撤销", "Undo"), onClick: () => toast(tr("已恢复", "Restored"), { tone: "success" }) } })}>{tr("删除（可撤销）", "Delete (undo)")}</Button>
      <Button onClick={() => toast(tr("网络断了，稍后重试", "Offline — try again later"), { tone: "danger" })}>{tr("出错", "Error")}</Button>
    </Cluster>
  );
}

function NavBarDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  return (
    <View className="demo-frame">
      <NavBar title={tr("今日待办", "Today")} back={() => {}} trailing={<Button variant="ghost" icon={Search} label={tr("搜索", "Search")} />} />
      <View className="demo-block">
        <Text variant="secondary">{tr("自定义导航栏会给右上角的胶囊按钮让位。", "A custom nav bar leaves room for the capsule button.")}</Text>
      </View>
    </View>
  );
}

function TabBarDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [v, setV] = useState("home");
  return (
    <TabBar
      fixed={false}
      value={v}
      onValueChange={setV}
      items={[
        { value: "home", label: tr("首页", "Home"), icon: House },
        { value: "inbox", label: tr("消息", "Inbox"), icon: Bell, badge: 3 },
        { value: "fav", label: tr("收藏", "Saved"), icon: Heart, badge: true },
        { value: "me", label: tr("我的", "Me"), icon: User },
      ]}
    />
  );
}

function TagDemo({ tr }: { tr: (zh: string, en: string) => string }) {
  const [sel, setSel] = useState<string[]>(["poster"]);
  const toggle = (v: string) => (on: boolean) => setSel((s) => (on ? [...s, v] : s.filter((x) => x !== v)));
  return (
    <Cluster>
      {[
        ["poster", tr("海报", "Poster")],
        ["cover", tr("封面", "Cover")],
        ["note", tr("笔记", "Note")],
        ["old", tr("旧版（停用）", "Legacy (off)")],
      ].map(([v, l]) => (
        <Tag key={v} pressed={sel.includes(v)} onPressedChange={toggle(v)} disabled={v === "old"}>
          {l}
        </Tag>
      ))}
    </Cluster>
  );
}

export const BATCH1: Demo[] = [
  { name: "Button", render: (tr) => <ButtonDemo tr={tr} /> },
  { name: "Cell", bleed: true, render: (tr) => <CellDemo tr={tr} /> },
  { name: "Field", render: (tr) => <FieldDemo tr={tr} /> },
  { name: "Switch", render: (tr) => <ChoiceDemo tr={tr} kind="switch" /> },
  { name: "Checkbox", render: (tr) => <ChoiceDemo tr={tr} kind="checkbox" /> },
  { name: "Radio", render: (tr) => <ChoiceDemo tr={tr} kind="radio" /> },
  { name: "Segmented", render: (tr) => <SegmentedDemo tr={tr} /> },
  { name: "Tabs", bleed: true, render: (tr) => <TabsDemo tr={tr} /> },
  { name: "Sheet", render: (tr) => <SheetDemo tr={tr} /> },
  { name: "Dialog", render: (tr) => <DialogDemo tr={tr} /> },
  { name: "Toast", render: (tr) => <ToastDemo tr={tr} /> },
  { name: "NavBar", bleed: true, render: (tr) => <NavBarDemo tr={tr} /> },
  { name: "TabBar", bleed: true, render: (tr) => <TabBarDemo tr={tr} /> },
  {
    name: "Empty",
    render: (tr) => <Empty icon={FileText} title={tr("还没有记录", "No posts yet")} description={tr("写好的文章会排在这里。", "Posts you write show up here.")} action={<Button size="sm" icon={Plus}>{tr("写一篇", "Write one")}</Button>} />,
  },
  {
    name: "Loading",
    render: (tr) => (
      <Stack gap={16}>
        <Cluster>
          <Spinner />
          <Spinner size="lg" />
        </Cluster>
        <Loading>{tr("正在加载文章", "Loading posts")}</Loading>
        <LoadBar />
        <Cluster gap={12} style="flex-wrap:nowrap;align-items:flex-start">
          <Skeleton width={40} height={40} circle />
          <View style="flex:1">
            <Skeleton lines={3} />
          </View>
        </Cluster>
      </Stack>
    ),
  },
  {
    name: "Badge",
    render: (tr) => (
      <Stack>
        <Cluster>
          <Badge>{tr("草稿", "Draft")}</Badge>
          <Badge tone="success">{tr("已写入", "Saved")}</Badge>
          <Badge tone="warning">{tr("待更新", "Outdated")}</Badge>
          <Badge tone="danger" variant="solid">
            3
          </Badge>
          <Badge variant="new">{tr("新", "New")}</Badge>
        </Cluster>
        <Cluster>
          <Badge dot tone="success">
            {tr("运行中", "Running")}
          </Badge>
          <Dot tone="danger" label={tr("出错", "Error")} />
          <Dot tone="warning" />
          <Dot tone="action" />
        </Cluster>
      </Stack>
    ),
  },
  {
    name: "Avatar",
    render: (tr) => (
      <Cluster gap={12}>
        <Avatar name={tr("东", "Dong")} />
        <Avatar name="X" member />
        <Avatar src={IMAGES[2]} name={tr("照片", "Photo")} size={48} />
      </Cluster>
    ),
  },
  {
    name: "Tag",
    render: (tr) => <TagDemo tr={tr} />,
  },
  {
    name: "Card",
    render: (tr) => (
      <Stack gap={16}>
        <CardGrid>
          <Card image={IMAGES[0]} ratio="3/4" title={tr("编辑式海报", "Editorial poster")} meta="xxd-panel-001" marks={<Dot tone="success" />} onClick={() => {}} />
          <Card image={IMAGES[3]} ratio="3/4" title={tr("产品标签", "Product tag")} meta="xxd-shop-003" selected onClick={() => {}} />
        </CardGrid>
        <ImageGrid images={IMAGES} alt={(i) => tr(`第 ${i + 1} 张`, `Image ${i + 1}`)} />
      </Stack>
    ),
  },
  { name: "Appearance", bleed: true, render: () => <AppearanceSettings showFinish /> },
  {
    name: "Text",
    render: (tr) => (
      <Stack>
        <Text variant="heading3">{tr("下午", "Afternoon")}</Text>
        <Text>{tr("正文 13px，行高 20px。", "Body text is 13px on a 20px line.")}</Text>
        <Text variant="secondary">{tr("说明文字用次要色。", "Secondary text uses the muted color.")}</Text>
        <Text variant="mono">--r-sm</Text>
      </Stack>
    ),
  },
  {
    name: "Icon",
    render: (tr) => (
      <Stack>
        <Cluster gap={16}>
          {[House, Search, Bell, Heart, Settings, Trash, Copy, Share].map((icon, i) => (
            <Icon key={i} icon={icon} size={24} />
          ))}
        </Cluster>
        <Text variant="secondary">{tr("24 网格、1.5 线宽、圆头、方角；颜色跟着文字走。", "24 grid, 1.5 stroke, round caps, square joins; color follows the text.")}</Text>
      </Stack>
    ),
  },
  {
    name: "Layout",
    render: (tr) => (
      <Stack>
        <Text variant="secondary">{tr("Stack 竖着排、Cluster 横着排，间距用令牌。", "Stack stacks, Cluster lines things up; gaps come from tokens.")}</Text>
        <Cluster>
          <Badge>A</Badge>
          <Badge>B</Badge>
          <Badge>C</Badge>
        </Cluster>
      </Stack>
    ),
  },
];
