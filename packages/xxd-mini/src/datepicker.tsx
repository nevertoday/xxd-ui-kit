// 日期 / 时间滚轮：Picker 现成的几列（年月日、时分），天数跟着年月变。MINI-REVIEW-PLAN D31、I12
//   <DatePicker open … mode="date" value="2026-10-18" min="2020-01-01" max="2030-12-31" onConfirm={setDate} />
//   <DatePicker open … mode="time" value="21:00" minuteStep={5} onConfirm={setTime} />
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Picker, type PickerOption } from "./picker";
import { useXxd } from "./provider";

export interface DatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  /** date：年 月 日（"2026-10-18"）；time：时 分（"21:00"） */
  mode?: "date" | "time";
  value: string;
  onConfirm: (value: string) => void;
  /** 最早 / 最晚的日期（mode=date），缺省前后 10 年 */
  min?: string;
  max?: string;
  /** 分钟的间隔（mode=time），缺省 1 */
  minuteStep?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
const range = (from: number, to: number, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

export function DatePicker({ open, onOpenChange, title, mode = "date", value, onConfirm, min, max, minuteStep = 1 }: DatePickerProps) {
  const { t } = useXxd();
  const u = t.units;
  const opt = (n: number, unit: string): PickerOption => ({ value: pad(n), label: `${pad(n)}${unit}` });
  const now = new Date();
  const [minY, maxY] = [Number((min ?? "").slice(0, 4)) || now.getFullYear() - 10, Number((max ?? "").slice(0, 4)) || now.getFullYear() + 10];
  const parts = (v: string) => (mode === "date" ? v.split("-") : v.split(":"));
  const [sel, setSel] = useState<string[]>(() => parts(value));
  useEffect(() => {
    if (open) setSel(parts(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const columns = useMemo(() => {
    if (mode === "time") return [range(0, 23).map((h) => opt(h, u.hour)), range(0, 59, minuteStep).map((m) => opt(m, u.minute))];
    const y = Number(sel[0]) || now.getFullYear();
    const m = Number(sel[1]) || 1;
    return [range(minY, maxY).map((n) => ({ value: String(n), label: `${n}${u.year}` })), range(1, 12).map((n) => opt(n, u.month)), range(1, daysIn(y, m)).map((n) => opt(n, u.day))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sel[0], sel[1], minY, maxY, minuteStep, u]);
  return (
    <Picker
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      columns={columns}
      value={parts(value)}
      onChange={setSel}
      onConfirm={(v) => onConfirm(v.join(mode === "date" ? "-" : ":"))}
    />
  );
}
