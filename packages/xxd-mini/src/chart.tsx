// 图表：折线、柱状、迷你折线。画成 SVG 图片（小程序里不用装 ECharts，主包小），颜色从当前外观的令牌算：
// 和网页版 chartPalette 同一个算法——第一条是主色，后面几条是不同深浅的墨色。坐标轴的字用普通文字画在图外面。
import { Image, View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/chart.mini.css";
import { a11y } from "./aria";
import { base64 } from "./icon";
import { useXxd } from "./provider";
import { cx, imgAlt } from "./util";

export interface ChartSeries {
  name: string;
  data: number[];
}

/** 和 @xxd/css 的 chartPalette 一样（色阶里取）：主色 9 级、灰 9 级、灰 11 / 10 级、主色 8 级 */
export function chartPalette(vars: Record<string, string>): string[] {
  return [vars["--action"], vars["--gray-9"], vars["--gray-11"], vars["--gray-10"], vars["--accent-8"]];
}

const DASH = ["", "4 3", "1.5 3", "6 3 1 3", "4 3"];

interface SvgOptions {
  type: "line" | "bar";
  series: ChartSeries[];
  width: number;
  height: number;
  colors: string[];
  grid?: string;
  /** 迷你图：没有网格、线细一点 */
  spark?: boolean;
  max?: number;
}

/** 数据 → SVG 文本 */
export function chartSvg({ type, series, width, height, colors, grid, spark, max }: SvgOptions): string {
  const count = Math.max(...series.map((s) => s.data.length), 1);
  const top = Math.max(max ?? 0, ...series.flatMap((s) => s.data), 0) || 1;
  const pad = spark ? 2 : 4;
  const h = height - pad * 2;
  const y = (v: number) => pad + h - (v / top) * h;
  const parts: string[] = [];
  if (!spark && grid) for (let i = 0; i <= 3; i += 1) parts.push(`<line x1="0" x2="${width}" y1="${(pad + (h * i) / 3).toFixed(1)}" y2="${(pad + (h * i) / 3).toFixed(1)}" stroke="${grid}" stroke-width="1" vector-effect="non-scaling-stroke"/>`);
  if (type === "line") {
    const step = count > 1 ? width / (count - 1) : width;
    series.forEach((s, i) => {
      const d = s.data.map((v, j) => `${j ? "L" : "M"}${(j * step).toFixed(1)} ${y(v).toFixed(1)}`).join("");
      parts.push(`<path d="${d}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="${spark ? 1.5 : 2}" stroke-linejoin="round" stroke-linecap="round" ${DASH[i % DASH.length] ? `stroke-dasharray="${DASH[i % DASH.length]}"` : ""} vector-effect="non-scaling-stroke"/>`);
    });
  } else {
    const groupW = width / count;
    const barW = Math.max(2, (groupW * 0.64) / series.length);
    series.forEach((s, i) =>
      s.data.forEach((v, j) => {
        const x = j * groupW + (groupW - barW * series.length) / 2 + i * barW;
        parts.push(`<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${(barW - 1).toFixed(1)}" height="${Math.max(0, pad + h - y(v)).toFixed(1)}" fill="${colors[i % colors.length]}"/>`);
      }),
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">${parts.join("")}</svg>`;
}

export interface ChartProps {
  type?: "line" | "bar";
  series: ChartSeries[];
  /** 横轴的字（每个点一个，太多时只显示头、中、尾） */
  labels?: string[];
  height?: number;
  title?: ReactNode;
  meta?: ReactNode;
  /** 读屏念的一句话总结（图表本身是一张图） */
  summary: string;
  className?: string;
}

export function Chart({ type = "line", series, labels, height = 160, title, meta, summary, className }: ChartProps) {
  const { vars } = useXxd();
  const colors = chartPalette(vars);
  const svg = chartSvg({ type, series, width: 320, height, colors, grid: vars["--line"] });
  const shown = labels && labels.length > 5 ? [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]] : labels;
  return (
    <View className={cx("xxd-chart-card", className)}>
      {(title != null || meta != null) && (
        <View className="xxd-chart-card__head">
          {title != null && <Text className="xxd-chart-card__title">{title}</Text>}
          {meta != null && <Text className="xxd-chart-card__meta">{meta}</Text>}
        </View>
      )}
      {series.length > 1 && (
        <View className="xxd-chart__legend" {...a11y({ hidden: true })}>
          {series.map((s, i) => (
            <View key={s.name} className="xxd-chart__key">
              {/* 图例的短线和图里的线型一致：第二条起是虚线 */}
              <View className="xxd-chart__swatch" style={DASH[i % DASH.length] ? `background:repeating-linear-gradient(90deg,${colors[i % colors.length]} 0 3px,transparent 3px 5px)` : `background:${colors[i % colors.length]}`} />
              <Text>{s.name}</Text>
            </View>
          ))}
        </View>
      )}
      <Image className="xxd-chart" style={`height:${height}px`} src={`data:image/svg+xml;base64,${base64(svg)}`} mode="scaleToFill" {...imgAlt(summary)} {...a11y({ role: "img", label: summary })} />
      {shown && (
        <View className="xxd-chart__axis" {...a11y({ hidden: true })}>
          {shown.map((l, i) => (
            <Text key={i}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

/** 迷你折线（统计卡里的小趋势） */
export function Sparkline({ data, height = 24, className }: { data: number[]; height?: number; className?: string }) {
  const { vars } = useXxd();
  const svg = chartSvg({ type: "line", series: [{ name: "", data }], width: 96, height, colors: [vars["--muted"]], spark: true });
  return <Image className={cx("xxd-sparkline", className)} style={`height:${height}px`} src={`data:image/svg+xml;base64,${base64(svg)}`} mode="scaleToFill" {...imgAlt("")} {...a11y({ hidden: true })} />;
}
