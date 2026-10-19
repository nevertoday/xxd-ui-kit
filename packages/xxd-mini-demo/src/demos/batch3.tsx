// 第三批组件的演示：手机上常用的（底部按钮条、数量加减、日期滚轮、结果页）
import { View } from "@tarojs/components";
import { BottomBar, Button, Cell, CellGroup, DatePicker, Result, Stack, Stepper, Text, useToast } from "@xxd/mini";
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

export const BATCH3: Demo[] = [
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
