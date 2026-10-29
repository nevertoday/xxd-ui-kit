// 第三批组件的演示：手机上常用的（底部按钮条、数量加减、日期滚轮、结果页）
import { View } from "@tarojs/components";
import { Bars, BottomBar, Button, Cell, CellGroup, DatePicker, Dumbbell, Gauge, Gauges, Heatmap, Proportion, Quadrant, Radar, Result, Sparkline, Stack, Stepper, Text, useToast, Waffle } from "@xxd/mini";
import { useState } from "react";
import type { Demo } from "./types";

type Tr = (zh: string, en: string) => string;

function BottomBarDemo({ tr }: { tr: Tr }) {
  const toast = useToast();
  return (
    <View>
      <CellGroup note={tr("按钮条固定在屏幕底部，页面底下自动留出它的高度；轻提示浮在它上面。", "The bar stays at the bottom, the page leaves room for it, and toasts float above it.")}>
        <Cell title={tr("拿铁", "Latte")} value="¥ 28" />
        <Cell title={tr("可颂", "Croissant")} value="¥ 16" />
      </CellGroup>
      <BottomBar note={tr("合计 ¥ 44", "Total ¥ 44")}>
        <Button onClick={() => toast(tr("已存为草稿", "Saved as draft"))}>{tr("存草稿", "Save draft")}</Button>
        <Button variant="primary" onClick={() => toast(tr("已下单", "Ordered"), { tone: "success" })}>
          {tr("下单", "Place order")}
        </Button>
      </BottomBar>
    </View>
  );
}

function StepperDemo({ tr }: { tr: Tr }) {
  const [cups, setCups] = useState(1);
  const [people, setPeople] = useState(2);
  return (
    <CellGroup>
      <Cell title={tr("杯数", "Cups")} description={tr("最多 9 杯", "Up to 9")} control={<Stepper value={cups} onValueChange={setCups} min={1} max={9} label={tr("杯数", "Cups")} />} />
      <Cell title={tr("人数", "People")} control={<Stepper value={people} onValueChange={setPeople} min={1} max={20} label={tr("人数", "People")} />} />
      <Cell title={tr("停用的", "Disabled")} control={<Stepper value={3} onValueChange={() => {}} label={tr("停用的", "Disabled")} disabled />} />
    </CellGroup>
  );
}

function DatePickerDemo({ tr }: { tr: Tr }) {
  const [date, setDate] = useState("2026-10-18");
  const [time, setTime] = useState("21:00");
  const [open, setOpen] = useState<"date" | "time" | null>(null);
  return (
    <View>
      <CellGroup>
        <Cell title={tr("日期", "Date")} value={date} arrow onClick={() => setOpen("date")} />
        <Cell title={tr("提醒时间", "Reminder")} value={time} arrow onClick={() => setOpen("time")} />
      </CellGroup>
      <DatePicker open={open === "date"} onOpenChange={(o) => !o && setOpen(null)} title={tr("日期", "Date")} value={date} onConfirm={setDate} min="2020-01-01" max="2030-12-31" />
      <DatePicker open={open === "time"} onOpenChange={(o) => !o && setOpen(null)} title={tr("提醒时间", "Reminder")} mode="time" minuteStep={5} value={time} onConfirm={setTime} />
    </View>
  );
}

function GaugeDemo({ tr }: { tr: Tr }) {
  const [cups, setCups] = useState(5);
  const zones = [
    { from: 80, to: 90, tone: "warning" as const },
    { from: 90, tone: "danger" as const },
  ];
  return (
    <Stack gap={24}>
      <Gauges>
        <Gauge value={72} unit="%" label={tr("空间已用", "Storage used")} target={80} zones={zones} />
        <Gauge value={94} unit="%" label={tr("本月额度", "Monthly quota")} target={80} zones={zones} />
      </Gauges>
      <Gauges>
        <Gauge shape="ring" segments={8} max={8} value={cups} unit={tr("杯", "glasses")} label={tr("今天喝水", "Water today")} />
        <Gauge shape="half" needle ticks={10} value={cups * 12} unit="%" label={tr("CPU 负载", "CPU load")} zones={[{ from: 80, tone: "danger" }]} />
      </Gauges>
      <CellGroup>
        <Cell title={tr("喝了几杯", "Glasses")} control={<Stepper value={cups} min={0} max={8} onValueChange={setCups} label={tr("喝了几杯", "Glasses")} />} />
      </CellGroup>
    </Stack>
  );
}

// 热力格的演示数据：最近 20 周，工作日写得多（固定的伪随机，每次一样）
function writingDays(end: string, weeks: number): Record<string, number> {
  const out: Record<string, number> = {};
  const t0 = Date.parse(`${end}T00:00:00Z`);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < weeks * 7; i += 1) {
    const t = t0 - i * 86400000;
    const weekday = (new Date(t).getUTCDay() + 6) % 7 < 5;
    if (rnd() < (weekday ? 0.72 : 0.35)) out[new Date(t).toISOString().slice(0, 10)] = [1, 1, 2, 2, 3, 4, 6, 9][Math.floor(rnd() * 8)];
  }
  return out;
}

export const BATCH3: Demo[] = [
  { name: "Gauge", render: (tr) => <GaugeDemo tr={tr} /> },
  {
    name: "Bars",
    render: (tr) => (
      // 手机上名字在条上面一行（CHART-REVIEW-PLAN D53），三组之间留 16 就分得开
      <Stack gap={16}>
        <Bars unit={tr("人", "users")} items={[{ label: tr("长文发布", "Publisher"), value: 2410 }, { label: tr("排序链接", "Link sorter"), value: 830 }, { label: tr("批量存图", "Image saver"), value: 5102, highlight: true }, { label: tr("今日待办", "Today"), value: 312 }]} />
        <Bars variant="funnel" unit={tr("人", "people")} items={[{ label: tr("打开", "Opened"), value: 12480 }, { label: tr("写过一篇", "Wrote one"), value: 5210 }, { label: tr("开会员", "Joined"), value: 742 }]} />
        <Bars variant="diverging" unit="%" items={[{ label: tr("海报", "Posters"), value: 18 }, { label: tr("封面", "Covers"), value: 6 }, { label: tr("笔记", "Notes"), value: -4 }, { label: tr("长图", "Long images"), value: -11 }]} />
        <Sparkline type="bar" data={[3, 5, 0, 6, 2, 8, 4, 7, 0, 5, 9, 6, 3, 4]} height={28} />
      </Stack>
    ),
  },
  {
    name: "Proportion",
    render: (tr) => (
      <Stack gap={20}>
        <Proportion label={tr("已用空间", "Storage used")} unit="GB" parts={[{ label: tr("图片", "Images"), value: 38 }, { label: tr("视频", "Video"), value: 22 }, { label: tr("文档", "Documents"), value: 9 }, { label: tr("其他", "Other"), value: 3 }]} />
      </Stack>
    ),
  },
  {
    name: "Waffle",
    render: (tr) => <Waffle label={tr("新会员从哪来", "Where new members come from")} parts={[{ label: tr("朋友推荐", "Friends"), value: 46 }, { label: tr("搜索", "Search"), value: 27 }, { label: tr("公众号", "WeChat"), value: 18 }, { label: tr("其他", "Other"), value: 9 }]} />,
  },
  {
    name: "Heatmap",
    render: (tr) => (
      <Stack gap={24}>
        <Heatmap values={writingDays("2026-10-19", 20)} end="2026-10-19" weeks={20} unit={tr("篇", "posts")} />
        <Heatmap numbers label={tr("哪个时段写得多", "When people write")} matrix={{ rows: tr("一,二,三,四,五", "Mon,Tue,Wed,Thu,Fri").split(","), cols: ["8", "12", "16", "20"], values: [[2, 4, 7, 9], [1, 6, 6, 8], [2, 5, 8, 10], [1, 4, 7, 9], [3, 6, 9, 6]] }} />
      </Stack>
    ),
  },
  {
    name: "Dumbbell",
    render: (tr) => <Dumbbell unit={tr("分钟", "min")} fromLabel={tr("改版前", "Before")} toLabel={tr("改版后", "After")} rows={[{ label: tr("写第一篇", "First post"), from: 14, to: 6 }, { label: tr("配好图片", "Images ready"), from: 9, to: 4 }, { label: tr("排好版", "Layout"), from: 21, to: 12 }]} />,
  },
  {
    name: "Radar",
    render: (tr) => (
      <Radar
        max={40}
        valueLabel={tr("你", "You")}
        compareLabel={tr("平均", "Average")}
        axes={[
          { label: tr("现实型", "Realistic"), value: 18, compare: 22 },
          { label: tr("研究型", "Investigative"), value: 34, compare: 24, highlight: true },
          { label: tr("艺术型", "Artistic"), value: 28, compare: 23 },
          { label: tr("社会型", "Social"), value: 20, compare: 26 },
          { label: tr("企业型", "Enterprising"), value: 12, compare: 21 },
          { label: tr("常规型", "Conventional"), value: 9, compare: 20 },
        ]}
      />
    ),
  },
  {
    name: "Quadrant",
    render: (tr) => (
      <Quadrant
        x={{ label: tr("依恋焦虑", "Attachment anxiety"), min: 1, max: 7, cut: 4, low: tr("不担心", "Unworried"), high: tr("担心", "Worried") }}
        y={{ label: tr("依恋回避", "Attachment avoidance"), min: 1, max: 7, cut: 4, low: tr("亲近", "Close"), high: tr("疏远", "Distant") }}
        names={{ "low-high": tr("回避型", "Avoidant"), "high-high": tr("混乱型", "Fearful"), "low-low": tr("安全型", "Secure"), "high-low": tr("焦虑型", "Anxious") }}
        points={[{ label: tr("你", "You"), x: 4.6, y: 2.4, highlight: true }, { label: tr("平均", "Average"), x: 3.6, y: 3.1 }]}
      />
    ),
  },
  { name: "BottomBar", bleed: true, render: (tr) => <BottomBarDemo tr={tr} /> },
  { name: "Stepper", bleed: true, render: (tr) => <StepperDemo tr={tr} /> },
  { name: "DatePicker", bleed: true, render: (tr) => <DatePickerDemo tr={tr} /> },
  {
    name: "Result",
    bleed: true,
    render: (tr) => (
      <Stack gap={0}>
        <Result
          tone="success"
          title={tr("提交成功", "Submitted")}
          description={tr("我们会在 1 个工作日内回复你。", "We'll get back to you within one working day.")}
          actions={
            <>
              <Button variant="primary">{tr("返回首页", "Back to home")}</Button>
              <Button>{tr("查看提交的内容", "View what you sent")}</Button>
            </>
          }
        >
          <Text variant="secondary">{tr("编号 XXD-20261018-0042", "No. XXD-20261018-0042")}</Text>
        </Result>
      </Stack>
    ),
  },
];
