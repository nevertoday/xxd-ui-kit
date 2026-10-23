// 量表：一个数在一个范围里的哪儿（配额、得分、完成度）。几何和网页版同一份（viz-core → @xxd/css/viz），
// 表盘画成 SVG 图片（颜色从当前外观的令牌算，和 Chart 一样）；数字、标签、两端刻度、图例是 Text（系统字体，读屏念得到）。
// 小程序里指针不转：值变了整张图重画。
import { Image, Text, View } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/gauge.mini.css";
import { a11y } from "./aria";
import { gaugeColors, gaugeModel, type XxdGaugeOptions } from "./viz-core";
import { Legend } from "./legend";
import { base64 } from "./icon";
import { useXxd } from "./provider";
import { cx, imgAlt, mods } from "./util";

export interface GaugeProps extends Omit<XxdGaugeOptions, "colors" | "cap" | "locale"> {
  /** 中间数字的字号 */
  size?: "sm" | "lg";
  className?: string;
}

export function Gauge({ size, className, ...options }: GaugeProps) {
  const { vars, lang } = useXxd();
  const cap = vars["--stroke-cap"] === "round" ? "round" : "butt";
  const m = gaugeModel({ locale: lang === "en" ? "en" : "zh-CN", ...options, colors: gaugeColors(vars), cap });
  const [, , w, h] = m.viewBox.split(" ").map(Number);
  const src = `data:image/svg+xml;base64,${base64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m.viewBox}" width="${w * 4}" height="${h * 4}">${m.svgBody}</svg>`)}`;
  const d = m.display;
  // 读屏：表盘是一张图，名字是整句（「空间已用，72%，目标 80%」）；图例是文字，接着念
  const spoken = m.aria.role === "meter" ? [m.label, m.valueText].filter(Boolean).join(lang === "en" ? ", " : "，") : String(m.aria["aria-label"] ?? m.valueText);
  return (
    <View className={cx("xxd-gauge", mods({ shape: m.shape, needle: Boolean(m.needle), size }), className)}>
      <View className="xxd-gauge__dial" style={`--gauge-cx:${m.center.x}%;--gauge-cy:${m.center.y}%`} {...a11y({ role: "img", label: spoken })}>
        <Image className="xxd-gauge__svg" src={src} mode="widthFix" {...imgAlt("")} {...a11y({ hidden: true })} />
        {d && (
          <View className="xxd-gauge__center" {...a11y({ hidden: true })}>
            <Text className="xxd-gauge__value">
              {d.value}
              {d.unit ? <Text className="xxd-gauge__unit">{d.unit}</Text> : null}
            </Text>
            {d.label ? <Text className="xxd-gauge__label">{d.label}</Text> : null}
            {d.state ? <Text className={cx("xxd-gauge__state", mods({ tone: d.state.tone }))}>{d.state.text}</Text> : null}
          </View>
        )}
      </View>
      {m.ends && (
        <View className="xxd-gauge__ends" style={`--gauge-ends-x:${m.ends.x}%`} {...a11y({ hidden: true })}>
          <Text className="xxd-gauge__min">{m.ends.min}</Text>
          <Text className="xxd-gauge__max">{m.ends.max}</Text>
        </View>
      )}
      {m.legend.length > 0 && (
        <Legend items={m.legend.map((l) => ({ label: l.label, num: l.text, part: l.part }))} />
      )}
    </View>
  );
}

/** 一排量表 */
export function Gauges({ children, className }: { children?: ReactNode; className?: string }) {
  return <View className={cx("xxd-gauges", className)}>{children}</View>;
}
