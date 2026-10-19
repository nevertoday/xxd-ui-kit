// 「两种实现对照」页的 React 一侧（设计师评审 V1）。每一对的 id 和 src/views/Parity.astro 里的 HTML 一侧一样；
// audit 的「对照」一项按 [data-pair] 找到两边，比较尺寸、字号、字重、颜色、边、圆角、背景。
import { useState, type JSX } from "react";
import { Badge, Bars, Button, Checkbox, Gauge, Input, Proportion, Radio, Select, Switch, Table, Tabs, XxdLocaleProvider } from "@xxd/react";

type Tr = (zh: string, en: string) => string;

// Kumo 的 Checkbox 只认受控的 checked
function CheckOn({ label, disabled }: { label: string; disabled?: boolean }) {
  const [on, setOn] = useState(true);
  return <Checkbox label={label} checked={on} onCheckedChange={setOn} disabled={disabled} />;
}

// Kumo 的 Switch 只认受控的 checked
function SwitchOn({ label, disabled }: { label: string; disabled?: boolean }) {
  const [on, setOn] = useState(true);
  return <Switch label={label} checked={on} onCheckedChange={setOn} disabled={disabled} />;
}

export const REACT_PAIRS: Record<string, (tr: Tr) => JSX.Element> = {
  "button-primary": (tr) => <Button variant="primary">{tr("写入", "Post")}</Button>,
  "button-secondary": (tr) => <Button>{tr("保存草稿", "Save draft")}</Button>,
  "button-ghost": (tr) => <Button variant="ghost">{tr("稍后", "Later")}</Button>,
  "button-outline": (tr) => <Button variant="outline">{tr("导出", "Export")}</Button>,
  "button-danger": (tr) => <Button variant="destructive">{tr("删除", "Delete")}</Button>,
  "button-sm": (tr) => <Button size="sm">{tr("复制", "Copy")}</Button>,
  "button-primary-disabled": (tr) => <Button variant="primary" disabled>{tr("写入", "Post")}</Button>,
  "button-secondary-disabled": (tr) => <Button disabled>{tr("保存草稿", "Save draft")}</Button>,
  input: (tr) => <Input aria-label={tr("标题", "Title")} placeholder={tr("给这篇文章起个名字", "Name this post")} className="w-60" />,
  "input-disabled": (tr) => <Input aria-label={tr("标题", "Title")} defaultValue={tr("已发布", "Published")} className="w-60" disabled />,
  select: (tr) => <Select aria-label={tr("图片质量", "Image quality")} className="w-40" defaultValue="high" items={{ high: tr("高", "High"), standard: tr("标准", "Standard") }} />,
  checkbox: (tr) => <CheckOn label={tr("智能标点", "Smart punctuation")} />,
  "checkbox-off": (tr) => <Checkbox label={tr("写入标题", "Write title")} />,
  "checkbox-disabled": (tr) => <CheckOn label={tr("智能标点", "Smart punctuation")} disabled />,
  "switch-disabled": (tr) => <SwitchOn label={tr("完成音效", "Done sound")} disabled />,
  switch: (tr) => <SwitchOn label={tr("完成音效", "Done sound")} />,
  "switch-off": (tr) => <Switch label={tr("自动保存", "Autosave")} />,
  radio: (tr) => (
    <Radio.Group legend={tr("写入方式", "Write mode")} defaultValue="one">
      <Radio.Item label={tr("只写这一篇", "Only this post")} value="one" />
      <Radio.Item label={tr("全部写入", "Write all")} value="all" />
    </Radio.Group>
  ),
  tabs: (tr) => (
    <Tabs
      variant="underline"
      tabs={[
        { value: "write", label: tr("写作", "Write") },
        { value: "history", label: tr("记录", "History") },
      ]}
      selectedValue="write"
    />
  ),
  badge: (tr) => <Badge variant="secondary">{tr("草稿", "Draft")}</Badge>,
  gauge: (tr) => <Gauge value={94} unit="%" label={tr("本月额度", "Monthly quota")} target={80} zones={[{ from: 80, to: 90, tone: "warning" }, { from: 90, tone: "danger" }]} />,
  "gauge-parts": (tr) => <Gauge shape="ring" unit="GB" label={tr("已用空间", "Storage used")} parts={[{ label: tr("图片", "Images"), value: 38 }, { label: tr("视频", "Video"), value: 22 }]} />,
  bars: (tr) => <Bars unit={tr("人", "users")} items={[{ label: tr("长文发布", "Publisher"), value: 2410 }, { label: tr("批量存图", "Image saver"), value: 5102, highlight: true }, { label: tr("今日待办", "Today"), value: 312 }]} />,
  proportion: (tr) => <Proportion label={tr("已用空间", "Storage used")} unit="GB" parts={[{ label: tr("图片", "Images"), value: 38 }, { label: tr("视频", "Video"), value: 22 }, { label: tr("文档", "Documents"), value: 9 }]} />,
  table: (tr) => (
    <div className="overflow-x-auto rounded-xl border border-kumo-line bg-kumo-base">
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>{tr("插件", "Extension")}</Table.Head>
          <Table.Head className="text-right">{tr("用户", "Users")}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>{tr("长文发布", "Long post")}</Table.Cell>
          <Table.Cell className="text-right">2,410</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
    </div>
  ),
};

export default function Parity({ id, lang = "zh" }: { id: string; lang?: string }) {
  const tr: Tr = (zh, en) => (lang === "en" ? en : zh);
  const render = REACT_PAIRS[id];
  return render ? <XxdLocaleProvider locale={lang === "en" ? "en" : "zh-CN"}>{render(tr)}</XxdLocaleProvider> : null;
}
