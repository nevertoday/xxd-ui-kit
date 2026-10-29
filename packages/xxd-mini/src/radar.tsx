// 雷达图（CHART-TYPES-PLAN 第 9 节）：只给轴的顺序有意义的数据（霍兰德六边形）。换算和网页版同一份（viz-core → @xxd/css/viz），类名也一样。
// 小程序里不能直接写 SVG：网格、辐条、面积画成一张 SVG 图片（颜色从当前外观的令牌算，和量表一样）；点、名字和数字是 View / Text。
import { Image, Text, View } from "@tarojs/components";
import "../styles/radar.mini.css";
import { a11y } from "./aria";
import { base64 } from "./icon";
import { useXxd } from "./provider";
import { cx, imgAlt, mods } from "./util";
import { radarModel, type XxdRadarModel } from "./viz-core";

/** 各部分用哪个令牌上色（和网页版 chart.css 一致） */
export const RADAR_PAINT = { ring: "--line", outer: "--line-strong", area: "--action", compare: "--line-control" } as const;

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * 网格、辐条、面积拼成一整张 SVG（图片里用不了 CSS 变量，颜色是当前外观算好的值）。
 * px：图大约显示多宽，线宽按它换成 viewBox 的单位（1px、1.5px）；图片按 4 倍画，高分屏上也清楚。
 */
export function radarSvg(m: XxdRadarModel, vars: Record<string, string>, { px = 280 } = {}): string {
  if (m.empty) return "";
  const u = 2 / px;
  const c = (role: keyof typeof RADAR_PAINT) => vars[RADAR_PAINT[role]] ?? "#888";
  const rings = m.rings.map((p, i) => `<polygon points="${p}" fill="none" stroke="${c(i === m.rings.length - 1 ? "outer" : "ring")}" stroke-width="${r3(u)}"/>`).join("");
  const spokes = `<path d="${m.spokes}" fill="none" stroke="${c("ring")}" stroke-width="${r3(u)}"/>`;
  const compare = m.compareArea ? `<polygon points="${m.compareArea}" fill="none" stroke="${c("compare")}" stroke-width="${r3(1.5 * u)}" stroke-dasharray="${r3(4 * u)} ${r3(3 * u)}"/>` : "";
  const area = `<polygon points="${m.area}" fill="${c("area")}" fill-opacity="0.08" stroke="${c("area")}" stroke-width="${r3(1.5 * u)}" stroke-linejoin="miter"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 2 2" width="${px * 4}" height="${px * 4}">${rings}${spokes}${compare}${area}</svg>`;
}

export interface RadarProps {
  /** 按顺序从正上方顺时针排（3–12 根） */
  axes: readonly { label: string; value: number; compare?: number | null; highlight?: boolean }[];
  min?: number;
  max?: number;
  /** 几圈网格（缺省 4） */
  levels?: number;
  /** 有对照时图例的两个名字 */
  valueLabel?: string;
  compareLabel?: string;
  /** 读屏那句话的开头 */
  label?: string;
  unit?: string;
  decimals?: number;
  compact?: boolean;
  format?: (n: number) => string;
  className?: string;
}

/** 雷达图：自己的面积是主色描边加 8% 实色，对照是虚线空心 */
export function Radar({ axes, min, max, levels, valueLabel, compareLabel, label, className, ...text }: RadarProps) {
  const { vars, lang } = useXxd();
  const m = radarModel(axes, { ...text, min, max, levels, valueLabel, compareLabel, label, locale: lang === "en" ? "en" : "zh-CN" });
  if (m.empty)
    return (
      <View className={cx("xxd-radar", className)}>
        <Text className="xxd-viz-empty">{m.empty}</Text>
      </View>
    );
  const src = `data:image/svg+xml;base64,${base64(radarSvg(m, vars))}`;
  return (
    <View className={cx("xxd-radar", mods({ emphasis: m.emphasis, compare: Boolean(m.key) }), className)}>
      {m.key && (
        <View className="xxd-radar__key" {...a11y({ hidden: true })}>
          {m.key.value ? (
            <View className="xxd-radar__keyitem">
              <View className={cx("xxd-radar__swatch", mods({ kind: "value" }))} />
              <Text>{m.key.value}</Text>
            </View>
          ) : null}
          {m.key.compare ? (
            <View className="xxd-radar__keyitem">
              <View className={cx("xxd-radar__swatch", mods({ kind: "compare" }))} />
              <Text>{m.key.compare}</Text>
            </View>
          ) : null}
        </View>
      )}
      <View className="xxd-radar__plot" {...a11y({ role: "img", label: m.label })}>
        <View className="xxd-radar__chart">
          <Image className="xxd-radar__svg" src={src} mode="widthFix" {...imgAlt("")} {...a11y({ hidden: true })} />
          {m.axes.map((a, i) => (
            <View key={i} {...a11y({ hidden: true })}>
              {a.cx != null ? <View className={cx("xxd-radar__dot", mods({ kind: "compare" }))} style={`left:${a.cx}%;top:${a.cy}%`} /> : null}
              <View className="xxd-radar__dot" style={`left:${a.x}%;top:${a.y}%`} />
            </View>
          ))}
          <View className="xxd-radar__axes" {...a11y({ hidden: true })}>
            {m.axes.map((a, i) => (
              <View key={i} className={cx("xxd-radar__axis", mods({ side: a.side, edge: a.edge, highlight: a.highlight }))} style={`left:${a.lx}%;top:${a.ly}%`}>
                <Text className="xxd-radar__label">{a.label}</Text>
                <Text className="xxd-radar__value">
                  {a.text}
                  {a.compareText ? <Text className="xxd-radar__note">{a.compareText}</Text> : null}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
