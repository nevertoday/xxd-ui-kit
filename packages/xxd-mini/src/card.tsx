// 卡片和图片宫格。点图用 previewImage 放大看（§6）。网页版 .xxd-card / .xxd-grid。
import { Image, View, Text } from "@tarojs/components";
// 按名字导入 API：Taro 编 H5 时只改写它自己处理过的源码里的 Taro.xxx，组件库在 node_modules 里，默认导出上没有这些 API
import { previewImage } from "@tarojs/taro";
import type { ReactNode } from "react";
import "../styles/card.mini.css";
import { a11y } from "./aria";
import { cx, imgAlt, mods } from "./util";

export interface CardProps {
  title?: ReactNode;
  meta?: ReactNode;
  /** 封面图地址 */
  image?: string;
  /** 封面的宽高比，缺省 4/3 */
  ratio?: string;
  /** 封面左上角的小标记（状态点、徽标） */
  marks?: ReactNode;
  selected?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Card({ title, meta, image, ratio, marks, selected, children, onClick, className }: CardProps) {
  return (
    <View
      className={cx("xxd-card", mods({ interactive: Boolean(onClick), selected }), className)}
      hoverClass={onClick ? "is-hover" : "none"}
      onClick={onClick}
      {...a11y(onClick ? { role: "button", pressed: selected } : {})}
    >
      {(image || marks) && (
        <View className="xxd-card__media" style={ratio ? `--ratio:${ratio}` : undefined}>
          {image && <Image className="xxd-card__img" src={image} mode="aspectFill" lazyLoad {...imgAlt("")} {...a11y({ hidden: true })} />}
          {marks != null && <View className="xxd-card__marks">{marks}</View>}
        </View>
      )}
      {(title != null || meta != null || children != null) && (
        <View className="xxd-card__body">
          {title != null && <Text className="xxd-card__title">{title}</Text>}
          {meta != null && <Text className="xxd-card__meta">{meta}</Text>}
          {children}
        </View>
      )}
    </View>
  );
}

/** 卡片网格：手机上缺省两列 */
export function CardGrid({ children, columns = 2, className }: { children?: ReactNode; columns?: number; className?: string }) {
  return (
    <View className={cx("xxd-grid", "xxd-card-grid", className)} style={`--grid-cols:${columns}`}>
      {children}
    </View>
  );
}

export interface ImageGridProps {
  images: string[];
  /** 几列，缺省 3 */
  columns?: number;
  /** 点图放大看，缺省是 */
  preview?: boolean;
  /** 每张图的读屏说明 */
  alt?: (index: number) => string;
  className?: string;
}

export function ImageGrid({ images, columns = 3, preview = true, alt, className }: ImageGridProps) {
  return (
    <View className={cx("xxd-image-grid", className)} style={`--grid-cols:${columns}`}>
      {images.map((src, i) => (
        <View
          key={`${i}-${src}`}
          className="xxd-image-grid__cell"
          hoverClass={preview ? "is-hover" : "none"}
          onClick={preview ? () => previewImage({ urls: images, current: src }).catch(() => {}) : undefined}
          {...a11y(preview ? { role: "button", label: alt?.(i) ?? `${i + 1} / ${images.length}` } : alt ? { role: "img", label: alt(i) } : { hidden: true })}
        >
          <Image className="xxd-image-grid__img" src={src} mode="aspectFill" lazyLoad {...imgAlt(alt?.(i) ?? "")} />
        </View>
      ))}
    </View>
  );
}
