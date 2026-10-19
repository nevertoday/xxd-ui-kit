// 第二批组件的演示
import { View } from "@tarojs/components";
import { Cell, CellGroup, Chart, Collapse, LoadMore, Picker, Progress, SearchBar, Stack, Stat, Stats, Steps, Swipe, SwipeGroup, Text, Uploader, useToast, type UploadItem } from "@xxd/mini";
import { useState } from "react";
import { IMAGES } from "./batch1";
import type { Demo } from "./types";

type Tr = (zh: string, en: string) => string;

function SearchDemo({ tr }: { tr: Tr }) {
  const [q, setQ] = useState("");
  const toast = useToast();
  return (
    <Stack>
      <SearchBar value={q} onValueChange={setQ} placeholder={tr("搜索文章", "Search posts")} onSearch={(v) => toast(tr(`搜索「${v}」`, `Searching “${v}”`))} />
      <SearchBar placeholder={tr("搜索设置", "Search settings")} onCancel={() => {}} />
    </Stack>
  );
}

function LoadMoreDemo({ tr }: { tr: Tr }) {
  const [rows, setRows] = useState(3);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const load = () => {
    setStatus("loading");
    setTimeout(() => {
      const next = rows + 3;
      setRows(next);
      setStatus(next >= 9 ? "done" : next === 6 ? "error" : "idle");
    }, 700);
  };
  return (
    <View>
      <CellGroup>
        {Array.from({ length: rows }, (_, i) => (
          <Cell key={i} title={tr(`第 ${i + 1} 篇`, `Post ${i + 1}`)} description={tr("今天 14:02", "Today 14:02")} />
        ))}
      </CellGroup>
      <LoadMore status={status} onLoad={load} />
    </View>
  );
}

function SwipeDemo({ tr }: { tr: Tr }) {
  const toast = useToast();
  return (
    <View>
      <CellGroup note={tr("往左滑出操作；一次只开一行。", "Swipe left for actions; one row opens at a time.")}>
        <SwipeGroup>
        {[tr("交周报", "Send the report"), tr("买咖啡豆", "Buy coffee beans"), tr("给猫剪指甲", "Trim the cat's claws")].map((t) => (
          <Swipe
            key={t}
            actions={[
              { label: tr("置顶", "Pin"), onClick: () => toast(tr("已置顶", "Pinned")) },
              { label: tr("删除", "Delete"), danger: true, onClick: () => toast(tr("已删除", "Deleted"), { tone: "danger" }) },
            ]}
          >
            <Cell title={t} />
          </Swipe>
        ))}
        </SwipeGroup>
      </CellGroup>
    </View>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: String(i).padStart(2, "0"), label: String(i).padStart(2, "0") }));
const MINUTES = ["00", "15", "30", "45"].map((m) => ({ value: m, label: m }));

function PickerDemo({ tr }: { tr: Tr }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(["21", "00"]);
  return (
    <View>
      <CellGroup>
        <Cell title={tr("提醒时间", "Reminder")} value={time.join(":")} arrow onClick={() => setOpen(true)} />
      </CellGroup>
      <Picker open={open} onOpenChange={setOpen} title={tr("提醒时间", "Reminder")} columns={[HOURS, MINUTES]} value={time} onConfirm={setTime} />
    </View>
  );
}

function UploaderDemo({ tr }: { tr: Tr }) {
  const [items, setItems] = useState<UploadItem[]>([
    { id: "a", url: IMAGES[0], status: "done" },
    { id: "b", url: IMAGES[1], status: "uploading", progress: 42 },
    { id: "c", url: IMAGES[2], status: "error" },
  ]);
  // 演示：假装上传，一秒到 100%
  const upload = (path: string, onProgress: (p: number) => void) =>
    new Promise<string>((resolve) => {
      let p = 0;
      const t = setInterval(() => {
        p += 25;
        onProgress(p);
        if (p >= 100) {
          clearInterval(t);
          resolve(path);
        }
      }, 250);
    });
  return (
    <Stack>
      <Uploader value={items} onChange={setItems} upload={upload} max={6} />
      <Text variant="secondary">{tr("点图放大，右上角移除，出错的点一下重试。", "Tap to preview, × to remove, tap a failed one to retry.")}</Text>
    </Stack>
  );
}

export const BATCH2: Demo[] = [
  { name: "SearchBar", render: (tr) => <SearchDemo tr={tr} /> },
  { name: "LoadMore", bleed: true, render: (tr) => <LoadMoreDemo tr={tr} /> },
  {
    name: "Progress",
    render: (tr) => (
      <Stack gap={16}>
        <Progress value={60} label={tr("上传中", "Uploading")} />
        <Progress value={92} label={tr("本月用量", "This month")} valueText="92 / 100" tone="warning" />
        <Progress value={100} label={tr("同步完成", "Synced")} tone="success" />
      </Stack>
    ),
  },
  {
    name: "Steps",
    render: (tr) => (
      <Stack gap={24}>
        <Steps current={1} items={[{ title: tr("填资料", "Details") }, { title: tr("选套餐", "Plan") }, { title: tr("付款", "Pay") }]} />
        <Steps
          vertical
          current={1}
          items={[
            { title: tr("下单", "Ordered"), description: tr("10 月 12 日 14:02", "Oct 12, 14:02") },
            { title: tr("已发货", "Shipped"), description: tr("顺丰 · 预计明天到", "Arrives tomorrow") },
            { title: tr("签收", "Delivered") },
          ]}
        />
      </Stack>
    ),
  },
  {
    name: "Collapse",
    render: (tr) => (
      <Collapse
        accordion
        defaultOpen={["a"]}
        items={[
          { key: "a", title: tr("为什么默认直角？", "Why square corners?"), content: tr("直角更安静，内容是主角。想要圆角可以在外观里打开。", "Square corners keep things quiet. Turn on rounded corners in Appearance.") },
          { key: "b", title: tr("主色怎么挑？", "How do I pick an accent?"), content: tr("12 个预设，墨色是第一个也是缺省。", "12 presets; ink is the first and the default.") },
          { key: "c", title: tr("和网页版一样吗？", "Same as the web kit?"), content: tr("同一套令牌和样式，构建时改写成小程序能用的样子。", "Same tokens and styles, rewritten for mini programs at build time.") },
        ]}
      />
    ),
  },
  { name: "Swipe", bleed: true, render: (tr) => <SwipeDemo tr={tr} /> },
  { name: "Picker", bleed: true, render: (tr) => <PickerDemo tr={tr} /> },
  { name: "Uploader", render: (tr) => <UploaderDemo tr={tr} /> },
  {
    name: "Stat",
    render: (tr) => (
      <Stats>
        <Stat label={tr("本周写入", "Posts this week")} value="1,284" unit={tr("篇", "")} delta={tr("↑ 12.4%", "↑ 12.4%")} trend="up" spark={[8, 9, 7, 11, 10, 13, 15]} />
        <Stat label={tr("新会员", "New members")} value="86" delta={tr("↓ 3 比上周", "↓ 3 vs last week")} trend="down" spark={[12, 11, 13, 10, 9, 10, 8]} />
      </Stats>
    ),
  },
  {
    name: "Chart",
    render: (tr) => (
      <Stack gap={24}>
        <Chart
          title={tr("每天写入", "Posts per day")}
          meta={tr("最近 7 天", "Last 7 days")}
          series={[
            { name: tr("本周", "This week"), data: [12, 18, 15, 22, 19, 26, 30] },
            { name: tr("上周", "Last week"), data: [10, 12, 14, 13, 17, 16, 20] },
          ]}
          labels={tr("一,二,三,四,五,六,日", "Mon,Tue,Wed,Thu,Fri,Sat,Sun").split(",")}
          summary={tr("本周每天写入从 12 篇涨到 30 篇，比上周多", "Daily posts rose from 12 to 30 this week, above last week")}
        />
        <Chart type="bar" title={tr("各类文章", "By type")} series={[{ name: tr("篇数", "Posts"), data: [32, 21, 14, 9] }]} labels={tr("海报,封面,笔记,其他", "Poster,Cover,Note,Other").split(",")} summary={tr("海报 32 篇最多，其次封面 21 篇", "Posters lead with 32, then covers with 21")} />
      </Stack>
    ),
  },
];

