// 小小东独有的 React 组件（优化计划 O5）：Kumo 没有的，直接渲染 @xxd/css 的类名和属性。
// 需要同时引入 @xxd/css 的样式：import "@xxd/react/xxd.css"。
import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Icon } from "@xxd/icons/react";
import { ACCENT_PRESETS } from "@xxd/tokens";
import { barsModel, calendarModel, dumbbellModel, gaugeModel, matrixModel, proportionModel, quadrantModel, radarModel, waffleModel } from "@xxd/css/viz";
import { useXxdAppearance } from "./appearance";
import { useXxdLocale } from "./locale";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");
const flag = (on: boolean | undefined) => (on ? "" : undefined);

/* ── Dock：状态在开头，工具在中间，下一步在末尾 ── */
export function Dock({ status, tools, primary, danger, className, ...rest }: { status?: ReactNode; tools?: ReactNode; primary?: ReactNode; danger?: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cx("xxd-dock", className)} {...rest}>
      {status != null && <div className="xxd-dock__status" aria-live="polite">{status}</div>}
      {danger != null && <div className="xxd-dock__danger">{danger}</div>}
      {tools != null && <div className="xxd-dock__tools">{tools}</div>}
      {primary != null && <div className="xxd-dock__primary">{primary}</div>}
    </footer>
  );
}

/* ── Sheet：从 dock 上方升起的半屏层；放在 <SheetHost> 里 ── */
export function SheetHost({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("xxd-sheet-host", className)} {...rest} />;
}

const FOCUSABLE = "input, select, textarea, button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

/**
 * 打开时是一个模态对话框：role=dialog + aria-modal，背景（同一个 SheetHost 里的其他东西）inert，Tab 在里面循环，Esc 关；
 * 关掉后焦点回到打开它的按钮。宿主上写 data-sheet-open（dock 主按钮跟着藏起来）。
 */
export function Sheet({ open, onOpenChange, title, children, className }: { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; children?: ReactNode; className?: string }) {
  const { t } = useXxdLocale();
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const back = useRef<Element | null>(null);
  useEffect(() => {
    const sheet = ref.current;
    const host = sheet?.closest(".xxd-sheet-host");
    if (!sheet) return;
    if (open) {
      back.current = document.activeElement;
      host?.setAttribute("data-sheet-open", "");
      // 背景不能点、读屏也读不到
      const others = host ? [...host.children].filter((el) => el !== sheet && !el.classList.contains("xxd-scrim")) : [];
      for (const el of others) el.setAttribute("inert", "");
      const items = [...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items.find((el) => !el.hasAttribute("data-sheet-close")) ?? items[0] ?? sheet;
      // 减少动效时 visibility 的过渡是 0.01ms：这一帧可能还聚焦不上，下一帧再试
      first.focus();
      const raf = requestAnimationFrame(() => document.activeElement !== first && first.focus());
      return () => {
        cancelAnimationFrame(raf);
        for (const el of others) el.removeAttribute("inert");
        host?.removeAttribute("data-sheet-open");
      };
    }
    if (back.current instanceof HTMLElement && sheet.contains(document.activeElement)) back.current.focus();
    else if (back.current instanceof HTMLElement && document.activeElement === document.body) back.current.focus();
    return undefined;
  }, [open]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onOpenChange(false);
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  return (
    <>
      <div className="xxd-scrim" data-open={flag(open)} onClick={() => onOpenChange(false)} aria-hidden="true" />
      <section
        ref={ref}
        className={cx("xxd-sheet", className)}
        data-open={flag(open)}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-labelledby={`${id}-t`}
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className="xxd-sheet__head">
          <h3 className="xxd-sheet__title" id={`${id}-t`}>{title}</h3>
          <button type="button" className="xxd-btn" data-variant="ghost" data-icon-only="" data-size="sm" data-sheet-close="" aria-label={t.close} onClick={() => onOpenChange(false)}>
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="xxd-sheet__body">{children}</div>
      </section>
    </>
  );
}

/* ── 设置：Settings > SettingsGroup > SettingsRow ── */
export function Settings({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("xxd-settings", className)} {...rest} />;
}

/** level：组名的标题级别。缺省 2（设置页的 h1 下面一层）；放在更深的地方时改 3。 */
export function SettingsGroup({ title, note, children, className, level = 2 }: { title?: ReactNode; note?: ReactNode; children: ReactNode; className?: string; level?: 2 | 3 | 4 }) {
  const Heading = `h${level}` as "h2" | "h3" | "h4";
  return (
    <section className={cx("xxd-group", className)}>
      {title != null && <Heading className="xxd-group__title">{title}</Heading>}
      <div className="xxd-group__body">{children}</div>
      {note != null && <p className="xxd-group__note">{note}</p>}
    </section>
  );
}

export function SettingsRow({ title, description, control, keywords, href, stack, onClick }: { title: ReactNode; description?: ReactNode; control?: ReactNode; keywords?: string; href?: string; stack?: boolean; onClick?: () => void }) {
  const inner = (
    <>
      <div className="xxd-row__text">
        <div className="xxd-row__title">{title}</div>
        {description != null && <div className="xxd-row__desc">{description}</div>}
      </div>
      {control != null && <div className="xxd-row__control">{control}</div>}
    </>
  );
  if (href) return <a className="xxd-row" href={href} data-keywords={keywords} onClick={onClick}>{inner}</a>;
  return <div className="xxd-row" data-keywords={keywords} data-stack={flag(stack)}>{inner}</div>;
}

/* ── Chip：可切换的小标签 ── */
export const Chip = forwardRef<HTMLButtonElement, { pressed?: boolean; onPressedChange?: (pressed: boolean) => void } & ButtonHTMLAttributes<HTMLButtonElement>>(function Chip({ pressed, onPressedChange, className, onClick, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("xxd-chip", className)}
      aria-pressed={pressed === undefined ? undefined : pressed}
      onClick={(e) => {
        onClick?.(e);
        if (pressed !== undefined) onPressedChange?.(!pressed);
      }}
      {...rest}
    />
  );
});

/* ── Search：放大镜 + 清空；hotkey 时 ⌘F / Ctrl+F 聚焦，Esc 清空 ── */
export function Search({ value, onValueChange, placeholder, label, hotkey = false, size, className }: { value: string; onValueChange: (value: string) => void; placeholder?: string; label?: string; hotkey?: boolean; size?: "sm" | "lg"; className?: string }) {
  const { t } = useXxdLocale();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);
  return (
    <div className={cx("xxd-input-wrap", className)}>
      <Icon name="Search" size={16} />
      <input
        ref={ref}
        className="xxd-input"
        type="search"
        data-size={size}
        value={value}
        placeholder={placeholder ?? t.search}
        aria-label={label ?? placeholder ?? t.search}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onValueChange("");
          }
        }}
      />
      {value && (
        <button type="button" className="xxd-input-clear" aria-label={t.clear} onClick={() => { onValueChange(""); ref.current?.focus(); }}>
          <Icon name="X" size={14} />
        </button>
      )}
    </div>
  );
}

/* ── Segmented：二到四个互斥选项；← → 移动 ── */
export function Segmented<T extends string>({ value, onValueChange, options, label, block, size, className }: { value: T; onValueChange: (value: T) => void; options: { value: T; label: ReactNode }[]; label: string; block?: boolean; size?: "sm"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const n = e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onValueChange(options[n].value);
    requestAnimationFrame(() => ref.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[n]?.focus());
  };
  return (
    <div ref={ref} className={cx("xxd-segmented", className)} role="radiogroup" aria-label={label} data-block={flag(block)} data-size={size} onKeyDown={onKeyDown}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1} onClick={() => onValueChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Rail：会员站左侧的竖排导航 ── */
export function Rail({ items, current, label }: { items: { href: string; label: ReactNode; icon?: string; key?: string }[]; current?: string; label?: string }) {
  const { t } = useXxdLocale();
  return (
    <nav className="xxd-rail" aria-label={label ?? t.mainNav}>
      {items.map((it) => (
        <a key={it.key ?? it.href} href={it.href} aria-current={(it.key ?? it.href) === current ? "page" : undefined}>
          {it.icon && <Icon name={it.icon} size={20} />}
          {it.label}
        </a>
      ))}
    </nav>
  );
}

/* ── Swatches：主色预设 ── */
export function Swatches({ value, onValueChange, presets = ACCENT_PRESETS, label }: { value: string; onValueChange: (value: string) => void; presets?: readonly { id: string; name: string; zh?: string }[]; label?: string }) {
  const { locale, t } = useXxdLocale();
  const ref = useRef<HTMLDivElement>(null);
  const current = Math.max(0, presets.findIndex((p) => p.id === (value || "")));
  // 一组单选：← → ↑ ↓ Home End 选择并移动焦点，Tab 只停在选中的那一个
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
    if (!(e.key in keys) && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const n = e.key === "Home" ? 0 : e.key === "End" ? presets.length - 1 : (current + keys[e.key] + presets.length) % presets.length;
    onValueChange(presets[n].id);
    requestAnimationFrame(() => ref.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[n]?.focus());
  };
  return (
    <div ref={ref} className="xxd-swatches" data-balance="" role="radiogroup" aria-label={label ?? t.accent} onKeyDown={onKeyDown}>
      {presets.map((p, i) => {
        const name = locale === "en" ? p.name : p.zh || p.name;
        return (
          <button
            key={p.id || "ink"}
            type="button"
            role="radio"
            className="xxd-swatch"
            tabIndex={i === current ? 0 : -1}
            aria-checked={(value || "") === p.id}
            aria-label={name}
            data-tooltip={name}
            style={p.id ? ({ "--swatch": p.id } as CSSProperties) : undefined}
            onClick={() => onValueChange(p.id)}
          />
        );
      })}
    </div>
  );
}

/* ── AppearanceSettings：完整的「外观」设置组（读写 XxdAppearanceProvider） ── */
export function AppearanceSettings({ showDensity = true, showFinish = false, lockCorners = false }: { showDensity?: boolean; showFinish?: boolean; lockCorners?: boolean }) {
  const { settings, update } = useXxdAppearance();
  const { t } = useXxdLocale();
  return (
    <SettingsGroup title={t.appearance}>
      <SettingsRow
        title={t.theme}
        keywords="dark light 暗色 夜间 主题 theme"
        control={<Segmented label={t.theme} value={settings.theme} onValueChange={(theme) => update({ theme })} options={[{ value: "light", label: t.light }, { value: "dark", label: t.dark }, { value: "system", label: t.system }]} />}
      />
      {!lockCorners && (
        <SettingsRow
          title={t.corners}
          description={t.cornersDesc}
          keywords="rounded square 圆角 直角"
          control={<input type="checkbox" role="switch" className="xxd-switch" aria-label={t.corners} checked={settings.corners === "rounded"} onChange={(e) => update({ corners: e.target.checked ? "rounded" : "square" })} />}
        />
      )}
      <SettingsRow title={t.accent} keywords="accent color 颜色 主色" stack control={<Swatches value={settings.accent} onValueChange={(accent) => update({ accent })} />} />
      {showDensity && (
        <SettingsRow title={t.density} keywords="density compact 紧凑" control={<Segmented label={t.density} value={settings.density} onValueChange={(density) => update({ density })} options={[{ value: "comfortable", label: t.comfortable }, { value: "compact", label: t.compact }]} />} />
      )}
      {showFinish && (
        <SettingsRow title={t.finish} keywords="finish material flat 质感" control={<Segmented label={t.finish} value={settings.finish} onValueChange={(finish) => update({ finish })} options={[{ value: "flat", label: t.flat }, { value: "material", label: t.material }]} />} />
      )}
    </SettingsGroup>
  );
}

/* ── Card / CardGrid：瀑布流卡片 ── */
export function CardGrid({ min = 200, masonry, children, className }: { min?: number; masonry?: boolean; children: ReactNode; className?: string }) {
  return <div className={cx(masonry ? "xxd-masonry" : "xxd-grid", className)} style={{ "--grid-min": `${min}px` } as CSSProperties}>{children}</div>;
}

export function Card({ href, title, meta, media, ratio = "3/4", marks, onClick, className }: { href?: string; title: ReactNode; meta?: ReactNode; media?: ReactNode; ratio?: string; marks?: ReactNode; onClick?: () => void; className?: string }) {
  const body = (
    <>
      <div className="xxd-card__media" style={{ "--ratio": ratio } as CSSProperties}>
        {media}
        {marks != null && <div className="xxd-card__marks">{marks}</div>}
      </div>
      <div className="xxd-card__body">
        <p className="xxd-card__title">{title}</p>
        {meta != null && <span className="xxd-card__meta">{meta}</span>}
      </div>
    </>
  );
  return href ? <a className={cx("xxd-card", className)} href={href} onClick={onClick}>{body}</a> : <button type="button" className={cx("xxd-card", className)} onClick={onClick}>{body}</button>;
}

/* ── Prose：阅读排版 ── */
export function Prose({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("xxd-prose", className)} {...rest} />;
}

/* ── O4 模式 ── */

/** 状态行：空着，除非有事要说 —— 一句话，最多一个动作。 */
/**
 * 状态行：空着时什么都不显示。念出来靠一个常驻的、看不见的 live region（一直挂着，只换文字）：
 * 和内容一起才挂上去的 live region，第一句话很多读屏不念。
 */
export function StatusLine({ children, tone, action }: { children?: ReactNode; tone?: "danger" | "warning" | "success"; action?: { label: ReactNode; onClick: () => void } }) {
  const empty = children == null || children === "" || children === false;
  return (
    <>
      <span className="xxd-sr-only" role={tone === "danger" ? "alert" : "status"} aria-live={tone === "danger" ? "assertive" : "polite"}>
        {empty ? "" : children}
      </span>
      {!empty && (
        <div className="xxd-statusline" data-tone={tone}>
          <span aria-hidden="true">{children}</span>
          {action && <button type="button" className="xxd-link" onClick={action.onClick}>{action.label}</button>}
        </div>
      )}
    </>
  );
}

/** 两次确认的按钮：第一次变成确认文字（危险色），3 秒内再点才执行 onConfirm。 */
export function ConfirmTwiceButton({ children, confirmLabel, onConfirm, size, variant, timeout = 3000 }: { children: ReactNode; confirmLabel?: ReactNode; onConfirm: () => void; size?: "xs" | "sm" | "lg"; variant?: "ghost" | "outline"; timeout?: number }) {
  const { t } = useXxdLocale();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), timeout);
    return () => clearTimeout(id);
  }, [armed, timeout]);
  return (
    <button
      type="button"
      className="xxd-btn"
      data-size={size}
      data-variant={variant}
      data-confirming={flag(armed)}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel ?? t.confirmDelete : children}
    </button>
  );
}

/** 拖放区 + 拖入遮罩：拖到 DropTarget 任何地方都出现遮罩；松手交给 onFiles / onText。 */
export function DropTarget({ onFiles, onText, veil, children, className, style }: { onFiles?: (files: File[]) => void; onText?: (text: string) => void; veil?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) {
  const { t } = useXxdLocale();
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const has = (e: DragEvent) => [...e.dataTransfer.types].some((x) => x === "Files" || x === "text/plain" || x === "text/uri-list");
  const deliver = useCallback(
    (dt: DataTransfer | null) => {
      const files = [...(dt?.files ?? [])];
      if (files.length) onFiles?.(files);
      else {
        const text = dt?.getData("text/uri-list") || dt?.getData("text/plain");
        if (text) onText?.(text);
      }
    },
    [onFiles, onText],
  );
  return (
    <div
      className={className}
      style={{ position: "relative", ...style }}
      data-drop-over={flag(over)}
      onDragEnter={(e) => {
        if (!has(e)) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => has(e) && e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        deliver(e.dataTransfer);
      }}
      onPaste={(e) => {
        if ((e.target as HTMLElement).closest?.("input, textarea, [contenteditable]")) return;
        deliver(e.clipboardData);
      }}
    >
      {children}
      <div className="xxd-dropveil" data-open={flag(over)} aria-hidden="true">{veil ?? t.dropVeil}</div>
    </div>
  );
}

export function DropZone({ icon = "ImagePlus", title, children, over }: { icon?: string; title: ReactNode; children?: ReactNode; over?: boolean }) {
  return (
    <div className="xxd-dropzone" data-over={flag(over)}>
      <Icon name={icon} size={24} />
      <p className="xxd-dropzone__title">{title}</p>
      {children != null && <p className="xxd-help">{children}</p>}
    </div>
  );
}

/** 账号卡：头像（会员一圈主色环）· 名字 · 计划行 · 一个动作。 */
export function AccountCard({ name, avatar, plan, tone, member, action }: { name: ReactNode; avatar?: ReactNode; plan?: ReactNode; tone?: "member" | "warning"; member?: boolean; action?: ReactNode }) {
  return (
    <div className="xxd-account">
      <span className="xxd-avatar" data-member={flag(member)} style={{ "--avatar-size": "36px" } as CSSProperties}>{avatar}</span>
      <div className="xxd-account__main">
        <div className="xxd-account__name">{name}</div>
        {plan != null && <div className="xxd-plan-line" data-tone={tone}>{plan}</div>}
      </div>
      {action}
    </div>
  );
}

/* ── Gauge：一个数在一个范围里的哪儿（GAUGE-PLAN）。几何和 @xxd/css 的 Xxd.gauge 是同一份（@xxd/css/gauge） ── */
export function Gauge({
  size,
  className,
  style,
  "aria-label": ariaLabel,
  ...options
}: {
  /** 一个数，或者 [最低, 最高] 一段区间（分段、多环不用写） */
  value?: number | readonly [number, number];
  /** 缺省 0 */
  min?: number;
  /** 缺省 100 */
  max?: number;
  /** arc：270°，缺口朝下（缺省）；half：半圆；ring：整圈 */
  shape?: "arc" | "half" | "ring";
  unit?: string;
  /** 显示在数字下面，也是读屏念的名字 */
  label?: string;
  /** 小数位（缺省最多一位） */
  decimals?: number;
  format?: (n: number) => string;
  /** 填充从这个值往两边长（偏差、盈亏，比如 0）；缺省从最小值长 */
  origin?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  /** 目标线（一条或几条） */
  target?: number | readonly number[];
  /** 区段，只表意义：数值进了哪一段，填充换成那一段的颜色，数字下面写出状态 */
  zones?: readonly { from?: number; to?: number; tone: "warning" | "danger" | "success"; label?: string }[];
  /** 刻度：把弧分成几份 */
  ticks?: number;
  /** 分格：N 格，整格才亮 */
  segments?: number;
  /** 细线指针（arc / half；有指针时不画填充）；值变了转过去 */
  needle?: boolean;
  /** 分段：几部分首尾相接，配图例 */
  parts?: readonly { label: string; value: number }[];
  /** 同心多环：最多 3 环，每环自己的满额，配图例 */
  rings?: readonly { label: string; value: number; min?: number; max?: number; unit?: string }[];
  /** 两端的刻度数（缺省：arc / half 显示，ring 不显示） */
  ends?: boolean;
  /** 中间数字的字号 */
  size?: "sm" | "lg";
  /** 没有 label 时，读屏念的名字 */
  "aria-label"?: string;
  className?: string;
  /** 最大宽度：style={{ "--gauge-size": "220px" }} */
  style?: CSSProperties;
}) {
  const { locale } = useXxdLocale();
  const m = gaugeModel({ locale, ...options });
  const d = m.display;
  const aria = { ...m.aria, ...(ariaLabel && !m.aria["aria-label"] ? { "aria-label": ariaLabel } : {}) };
  return (
    <div className={cx("xxd-gauge", className)} data-shape={m.shape} data-needle={flag(Boolean(m.needle))} data-size={size} style={style} {...aria}>
      <div className="xxd-gauge__dial" style={{ "--gauge-cx": `${m.center.x}%`, "--gauge-cy": `${m.center.y}%` } as CSSProperties}>
        <svg className="xxd-gauge__svg" viewBox={m.viewBox} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: m.svgBody }} />
        {m.needle && (
          <svg className="xxd-gauge__pointer" viewBox={m.viewBox} aria-hidden="true" focusable="false">
            {/* 只改 transform：值变了指针转过去；看不见的圆让转轴在圆心 */}
            <g className="xxd-gauge__needle" style={{ transform: `rotate(${m.needle.angle}deg)` }}>
              <circle r={m.needle.length} fill="none" stroke="none" />
              <line x1="0" y1="0" x2="0" y2={-m.needle.length} className="xxd-gauge__needle-line" strokeWidth="1.5" strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
              <circle r="2.5" className="xxd-gauge__hub" />
            </g>
          </svg>
        )}
        {d && (
          <div className="xxd-gauge__center" aria-hidden="true">
            <span className="xxd-gauge__value">
              {d.value}
              {d.unit && <span className="xxd-gauge__unit">{d.unit}</span>}
            </span>
            {d.label && <span className="xxd-gauge__label">{d.label}</span>}
            {d.state && (
              <span className="xxd-gauge__state" data-tone={d.state.tone}>
                {d.state.text}
              </span>
            )}
          </div>
        )}
      </div>
      {m.ends && (
        <div className="xxd-gauge__ends" aria-hidden="true" style={{ "--gauge-ends-x": `${m.ends.x}%` } as CSSProperties}>
          <span className="xxd-gauge__min">{m.ends.min}</span>
          <span className="xxd-gauge__max">{m.ends.max}</span>
        </div>
      )}
      {m.legend.length > 0 && (
        <Legend items={m.legend.map((l) => ({ label: l.label, num: l.text, part: l.part }))} />
      )}
    </div>
  );
}
export type GaugeProps = Parameters<typeof Gauge>[0];

/* ── 图型（CHART-TYPES-PLAN）：换算和 @xxd/css 的 Xxd.viz 是同一份（@xxd/css/viz），结构和类名也一样 ── */
type VizText = { unit?: string; decimals?: number; compact?: boolean; format?: (n: number) => string };

/** 图例：色块 · 名字 · 数字（· 占比） */
function Legend({ items }: { items: { label: string; num: string; share?: string; part: number }[] }) {
  return (
    <ul className="xxd-legend">
      {items.map((l, i) => (
        <li key={i} className="xxd-legend__item">
          <span className="xxd-legend__key" data-part={l.part} />
          <span className="xxd-legend__name">{l.label}</span>
          <span className="xxd-legend__num">{l.num}</span>
          {l.share && <span className="xxd-legend__share">{l.share}</span>}
        </li>
      ))}
    </ul>
  );
}

/** 色阶那一行；左边写指到 / 点到的那一格（CHART-REVIEW-PLAN D50） */
const HeatScale = ({ less, more, tip }: { less: string; more: string; tip: string }) => (
  <div className="xxd-heatmap__scale" aria-hidden="true">
    <span className="xxd-heatmap__readout">{tip}</span>
    <span>{less}</span>
    {[0, 1, 2, 3, 4].map((l) => (
      <i key={l} className="xxd-heatmap__cell" data-level={l} />
    ))}
    <span>{more}</span>
  </div>
);

const Empty = ({ text, as: Tag = "p" }: { text: string; as?: "p" | "li" }) => <Tag className="xxd-viz-empty">{text}</Tag>;

/** 条形榜：少类目比较、排名、正负、漏斗、瀑布 */
export function Bars({
  items,
  variant,
  step,
  max,
  sort,
  mark,
  markLabel,
  valueLabel,
  compareLabel,
  axis,
  className,
  style,
  ...text
}: {
  /** 每行：名字、数；highlight 标重点（主色，其余灰）；compare 对照值（去年）；note 旁注；total 瀑布的合计行 */
  items: readonly { label: string; value: number; highlight?: boolean; compare?: number; note?: string; total?: boolean }[];
  /** plain（缺省，按大小排）| diverging（正负，从中线往两边）| funnel（漏斗，写出每一步留下多少）| waterfall（瀑布，增减分解） */
  variant?: "plain" | "diverging" | "funnel" | "waterfall";
  /** 每格代表多少：条按单位切格 */
  step?: number;
  /** 满格的值（缺省是最大值） */
  max?: number;
  /** false：不按大小排 */
  sort?: boolean;
  /** 参考线（平均、目标）的值 */
  mark?: number;
  /** 参考线的名字（「平均」） */
  markLabel?: string;
  /** 图例里主条的名字（「今年」） */
  valueLabel?: string;
  /** 图例里对照条的名字（「去年」） */
  compareLabel?: string;
  /** 下面一行刻度数，条后面是网格线 */
  axis?: boolean;
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
  className?: string;
  style?: CSSProperties;
}) {
  const { locale } = useXxdLocale();
  const m = barsModel(items, { ...(text as VizText), variant, step, max, sort, mark, markLabel, valueLabel, compareLabel, axis, locale });
  const vars = { ...(m.rungs ? { "--rungs": m.rungs } : {}), ...(m.axis ? { "--tick": m.axis.tick } : {}), ...(m.mark ? { "--mark": m.mark.at } : {}), ...(m.zero != null ? { "--zero": m.zero } : {}) };
  const swatch = (kind: string, label: string) =>
    label ? (
      <span>
        <span className="xxd-bars__swatch" data-kind={kind} />
        {label}
      </span>
    ) : null;
  return (
    <ol
      className={cx("xxd-bars", className)}
      data-variant={m.variant === "plain" ? undefined : m.variant}
      data-emphasis={flag(m.emphasis)}
      data-rungs={flag(Boolean(m.rungs))}
      data-axis={flag(Boolean(m.axis))}
      data-marked={flag(Boolean(m.mark))}
      data-zero={flag(m.zero != null)}
      style={{ ...style, ...vars } as CSSProperties}
    >
      {m.empty && <Empty as="li" text={m.empty} />}
      {m.key && (
        <li className="xxd-bars__key" aria-hidden="true">
          {swatch("value", m.key.value)}
          {swatch("compare", m.key.compare)}
          {swatch("mark", m.key.mark)}
        </li>
      )}
      {m.rows.map((r, i) => (
        <li
          key={i}
          className="xxd-bars__item"
          data-highlight={flag(r.highlight)}
          data-total={flag(r.total)}
          style={{ "--value": r.frac, ...(r.compareFrac != null ? { "--compare": r.compareFrac } : {}), ...(r.from != null ? { "--from": r.from, "--to": r.to } : {}) } as CSSProperties}
        >
          <span className="xxd-bars__label">{r.label}</span>
          <span className="xxd-bars__track" aria-hidden="true">
            <span className="xxd-bars__bar">
              <span className="xxd-bars__fill" />
            </span>
            {r.compareFrac != null && <span className="xxd-bars__compare" />}
          </span>
          <span className="xxd-bars__value">
            {r.text}
            {r.note && <span className="xxd-bars__note">{r.note}</span>}
          </span>
        </li>
      ))}
      {m.axis && (
        <li className="xxd-bars__axis" aria-hidden="true">
          <span className="xxd-bars__ticks">
            {m.axis.ticks.map((t, i) => (
              <span key={i} className="xxd-bars__tick" style={{ left: `${Math.round(t.at * 1000) / 10}%` }}>
                {t.text}
              </span>
            ))}
          </span>
        </li>
      )}
    </ol>
  );
}

/** 构成条：一个整体分成几部分（≤ 5 段） */
export function Proportion({
  parts,
  label,
  legend = true,
  max,
  className,
  ...text
}: {
  parts: readonly { label: string; value: number }[];
  /** 标题（上面一行，右边是合计），也是读屏念的名字 */
  label?: string;
  /** false：不画图例（几根并排时只在最后一根下面画） */
  legend?: boolean;
  /** 几根并排时，条长按合计 ÷ max（既看构成也看总量） */
  max?: number;
  unit?: string;
  compact?: boolean;
  decimals?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const { locale } = useXxdLocale();
  const m = proportionModel(parts, { ...(text as VizText), label, max, locale });
  if (m.empty)
    return (
      <div className={cx("xxd-proportion", className)}>
        {label && (
          <p className="xxd-proportion__head">
            <span className="xxd-proportion__label">{label}</span>
          </p>
        )}
        <Empty text={m.empty} />
      </div>
    );
  return (
    <div className={cx("xxd-proportion", className)} role="group" aria-label={m.label}>
      {label && (
        <p className="xxd-proportion__head">
          <span className="xxd-proportion__label">{label}</span>
          <span className="xxd-proportion__total">{m.totalText}</span>
        </p>
      )}
      <div className="xxd-proportion__bar" aria-hidden="true" style={m.scale < 1 ? ({ "--scale": m.scale } as CSSProperties) : undefined}>
        {m.parts.filter((p) => p.share > 0).map((p) => (
          <span key={p.part} className="xxd-proportion__part" data-part={p.part} style={{ "--v": p.share } as CSSProperties} />
        ))}
      </div>
      {legend && <Legend items={m.parts.map((p) => ({ label: p.label, num: p.text, share: p.percent, part: p.part }))} />}
    </div>
  );
}

/** 百格图：10 × 10，1 格 = 1% */
export function Waffle({
  parts,
  label,
  cells,
  className,
  ...text
}: {
  /** 数可以是人数或百分比 */
  parts: readonly { label: string; value: number }[];
  /** 读屏念的名字 */
  label?: string;
  /** 格子数（缺省 100） */
  cells?: number;
  decimals?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const { locale } = useXxdLocale();
  const m = waffleModel(parts, { ...(text as VizText), label, cells, locale });
  if (m.empty)
    return (
      <div className={cx("xxd-waffle", className)}>
        <Empty text={m.empty} />
      </div>
    );
  return (
    <div className={cx("xxd-waffle", className)} role="group" aria-label={m.label}>
      <div className="xxd-waffle__grid" aria-hidden="true">
        {m.cells.map((c, i) => (
          <i key={i} className="xxd-waffle__cell" data-part={c >= 0 ? c : undefined} />
        ))}
      </div>
      <div className="xxd-waffle__side">
        <Legend items={m.parts.map((p) => ({ label: p.label, num: p.percent, part: p.part }))} />
        <p className="xxd-waffle__note">{m.note}</p>
      </div>
    </div>
  );
}

/** 热力格：日历（values）或矩阵（matrix） */
export function Heatmap({
  values,
  end,
  weeks,
  matrix,
  numbers,
  label,
  className,
  ...text
}: {
  /** 日历：{ "2026-03-02": 5 } 或 [{ date, value }] */
  values?: Record<string, number> | readonly { date: string; value: number }[];
  /** 日历的最后一天（缺省今天） */
  end?: string;
  /** 日历显示几周（缺省 53） */
  weeks?: number;
  /** 矩阵：行名、列名、二维数值 */
  matrix?: { rows: (string | number)[]; cols: (string | number)[]; values: (number | null | undefined)[][] };
  /** 矩阵格子里写数 */
  numbers?: boolean;
  /** 读屏总结前面的名字 */
  label?: string;
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
  className?: string;
}) {
  const { locale } = useXxdLocale();
  const o = { ...(text as VizText), label, locale };
  const cal = matrix ? null : calendarModel(values ?? {}, { ...o, end, weeks });
  const mat = matrix ? matrixModel(matrix, o) : null;
  // 指到 / 点到一格：色阶那一行写出来（D50）；日历最近的一周在最右边是 CSS 做的
  const [active, setActive] = useState<string | null>(null);
  const point = (e: { target: EventTarget }) => {
    const cell = (e.target as HTMLElement).closest?.("[data-tip]") as HTMLElement | null;
    if (cell) setActive(cell.dataset.key ?? null);
  };
  const leave = (e: ReactPointerEvent) => e.pointerType === "mouse" && setActive(null);
  const on = { onPointerOver: point, onClick: point, onPointerLeave: leave };
  if (mat?.empty)
    return (
      <div className={cx("xxd-heatmap", className)} data-variant="matrix">
        <Empty text={mat.empty} />
      </div>
    );
  if (mat)
    return (
      <div className={cx("xxd-heatmap", className)} data-variant="matrix" {...on}>
        <div className="xxd-heatmap__scroll" role="region" aria-label={mat.title} tabIndex={0}>
          <div className="xxd-heatmap__matrix" role="img" aria-label={mat.label} style={{ "--cols": mat.cols.length } as CSSProperties}>
            <span />
            {mat.cols.map((c, j) => (
              <span key={`c${j}`} className="xxd-heatmap__col">{c}</span>
            ))}
            {mat.rows.map((r, i) => [
              <span key={`r${i}`} className="xxd-heatmap__row">{r}</span>,
              ...mat.cells[i].map((c, j) => (
                <i key={`${i}-${j}`} className="xxd-heatmap__cell" data-level={c.level < 0 ? "none" : c.level} data-tip={c.title} data-key={`${i}-${j}`} data-active={flag(active === `${i}-${j}`)}>
                  {numbers ? c.text : null}
                </i>
              )),
            ])}
          </div>
        </div>
        <HeatScale less={mat.less} more={mat.more} tip={active ? mat.cells[Number(active.split("-")[0])]?.[Number(active.split("-")[1])]?.title ?? "" : ""} />
      </div>
    );
  const m = cal!;
  const days = m.columns.flat();
  return (
    <div className={cx("xxd-heatmap", className)} {...on}>
      <div className="xxd-heatmap__body">
        <div className="xxd-heatmap__days" aria-hidden="true">
          {m.weekdays.map((d, i) => (
            <span key={i}>{i % 2 === 0 ? d : ""}</span>
          ))}
        </div>
        <div className="xxd-heatmap__scroll" role="region" aria-label={m.title} tabIndex={0}>
          <div className="xxd-heatmap__frame" style={{ "--weeks": m.columns.length } as CSSProperties}>
            <div className="xxd-heatmap__months" aria-hidden="true">
              {m.months.map((x) => (
                <span key={x.col} style={{ gridColumn: x.col + 1 }}>{x.text}</span>
              ))}
            </div>
            <div className="xxd-heatmap__grid" role="img" aria-label={m.label}>
              {days.map((c) => (
                <i key={c.date} className="xxd-heatmap__cell" data-level={c.level < 0 ? "none" : c.level} data-tip={c.title || undefined} data-key={c.date} data-active={flag(active === c.date)} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <HeatScale less={m.less} more={m.more} tip={(active && days.find((c) => c.date === active)?.title) || ""} />
    </div>
  );
}

/** 前后对比：类目级的两个时点（≤ 8 行） */
export function Dumbbell({
  rows,
  fromLabel,
  toLabel,
  min,
  max,
  className,
  ...text
}: {
  rows: readonly { label: string; from: number; to: number }[];
  /** 之前那个点的名字（缺省「之前」） */
  fromLabel?: string;
  /** 之后那个点的名字（缺省「之后」） */
  toLabel?: string;
  /** 位置的范围（缺省是数据的范围） */
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  /** 大数字缩写：「1.2万」「12K」 */
  compact?: boolean;
  format?: (n: number) => string;
  className?: string;
}) {
  const { locale } = useXxdLocale();
  const m = dumbbellModel(rows, { ...(text as VizText), fromLabel, toLabel, min, max, locale });
  if (m.empty)
    return (
      <div className={cx("xxd-dumbbell", className)}>
        <Empty text={m.empty} />
      </div>
    );
  return (
    <div className={cx("xxd-dumbbell", className)}>
      <p className="xxd-dumbbell__key">
        <span className="xxd-dumbbell__from" />
        {m.fromLabel}
        <span className="xxd-dumbbell__to" />
        {m.toLabel}
      </p>
      <ol className="xxd-dumbbell__list">
        {m.rows.map((r, i) => (
          <li key={i} className="xxd-dumbbell__item">
            <span className="xxd-dumbbell__label">{r.label}</span>
            <span className="xxd-dumbbell__track" aria-hidden="true" style={{ "--a": r.a, "--b": r.b, "--lo": Math.min(r.a, r.b), "--hi": Math.max(r.a, r.b) } as CSSProperties}>
              <span className="xxd-dumbbell__line" />
              <span className="xxd-dumbbell__from" />
              <span className="xxd-dumbbell__to" />
            </span>
            <span className="xxd-dumbbell__value">
              {r.fromText} → {r.toText}
              <span className="xxd-dumbbell__delta">{r.delta}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 雷达图：轴的顺序有意义的轮廓（霍兰德六边形）；几个独立的维度用 Bars */
export function Radar({
  axes,
  min,
  max,
  levels,
  valueLabel,
  compareLabel,
  label,
  className,
  ...text
}: {
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
}) {
  const { locale } = useXxdLocale();
  const m = radarModel(axes, { ...(text as VizText), min, max, levels, valueLabel, compareLabel, label, locale });
  if (m.empty)
    return (
      <div className={cx("xxd-radar", className)}>
        <Empty text={m.empty} />
      </div>
    );
  return (
    <div className={cx("xxd-radar", className)} data-emphasis={flag(m.emphasis)} data-compare={flag(Boolean(m.key))}>
      {m.key && (
        <p className="xxd-radar__key" aria-hidden="true">
          {m.key.value && (
            <span>
              <span className="xxd-radar__swatch" data-kind="value" />
              {m.key.value}
            </span>
          )}
          {m.key.compare && (
            <span>
              <span className="xxd-radar__swatch" data-kind="compare" />
              {m.key.compare}
            </span>
          )}
        </p>
      )}
      <div className="xxd-radar__plot" role="img" aria-label={m.label}>
        <div className="xxd-radar__chart">
          <svg className="xxd-radar__svg" viewBox="-1 -1 2 2" aria-hidden="true">
            {m.rings.map((p, i) => (
              <polygon key={i} className="xxd-radar__ring" points={p} />
            ))}
            <path className="xxd-radar__spokes" d={m.spokes} />
            {m.compareArea && <polygon className="xxd-radar__compare" points={m.compareArea} />}
            <polygon className="xxd-radar__area" points={m.area} />
          </svg>
          {m.axes.map((a, i) => (
            <Fragment key={i}>
              {a.cx != null && <span className="xxd-radar__dot" data-kind="compare" style={{ left: `${a.cx}%`, top: `${a.cy}%` }} />}
              <span className="xxd-radar__dot" style={{ left: `${a.x}%`, top: `${a.y}%` }} />
            </Fragment>
          ))}
          <ul className="xxd-radar__axes">
            {m.axes.map((a, i) => (
              <li key={i} className="xxd-radar__axis" data-side={a.side} data-edge={a.edge} data-highlight={flag(a.highlight)} style={{ left: `${a.lx}%`, top: `${a.ly}%` }}>
                <span className="xxd-radar__label">{a.label}</span>
                <span className="xxd-radar__value">
                  {a.text}
                  {a.compareText && <span className="xxd-radar__note">{a.compareText}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type QuadrantAxis = { label?: string; min?: number; max?: number; cut?: number; low?: string; high?: string };

/** 四象限：两个维度各切一刀，看点落在哪一格 */
export function Quadrant({
  points,
  x,
  y,
  names,
  label,
  className,
  ...text
}: {
  points: readonly { label: string; x: number; y: number; highlight?: boolean }[];
  /** 横轴：名字、范围、切分点（缺省在中间，等于切分点算高）、两端的名字 */
  x?: QuadrantAxis;
  /** 竖轴：同上 */
  y?: QuadrantAxis;
  /** 四格的名字，键是「x 的高低-y 的高低」 */
  names?: Partial<Record<"low-high" | "high-high" | "low-low" | "high-low", string>>;
  label?: string;
  unit?: string;
  decimals?: number;
  compact?: boolean;
  format?: (n: number) => string;
  className?: string;
}) {
  const { locale } = useXxdLocale();
  const m = quadrantModel(points, { ...(text as VizText), x, y, names, label, locale });
  if (m.empty)
    return (
      <div className={cx("xxd-quadrant", className)}>
        <Empty text={m.empty} />
      </div>
    );
  const end = (k: string, t: string) => t && <span className="xxd-quadrant__end" data-end={k}>{t}</span>;
  return (
    <div className={cx("xxd-quadrant", className)} data-emphasis={flag(m.emphasis)}>
      <div className="xxd-quadrant__plot" role="img" aria-label={m.label} style={{ "--cx": m.cut.x, "--cy": m.cut.y } as CSSProperties}>
        <div className="xxd-quadrant__cells">
          {m.cells.map((c) => (
            <span key={c.key} className="xxd-quadrant__cell" data-cell={c.key} data-current={flag(c.current)}>
              {c.name && <span className="xxd-quadrant__name">{c.name}</span>}
            </span>
          ))}
        </div>
        {end("x-low", m.x.low)}
        {end("x-high", m.x.high)}
        {end("y-high", m.y.high)}
        {end("y-low", m.y.low)}
        <ol className="xxd-quadrant__points">
          {m.points.map((p, i) => (
            <li key={i} className="xxd-quadrant__point" data-highlight={flag(p.highlight)} data-flip={flag(p.fx > 0.7)} style={{ "--x": p.fx, "--y": p.fy } as CSSProperties}>
              <span className="xxd-quadrant__dot" />
              <span className="xxd-quadrant__label">{p.label}</span>
            </li>
          ))}
        </ol>
      </div>
      {m.caption && <p className="xxd-quadrant__caption">{m.caption}</p>}
    </div>
  );
}

/* ── 图解（DIAGRAM-PLAN）：节点和字是 HTML，连线是 CSS 的边框；读屏念的是有序列表 ── */

// 超过上限（D145）只提醒一次，不悄悄截掉
const warned = new Set<string>();
const warnOnce = (key: string, text: string) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[xxd] ${text}`);
};

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
}

/** 步骤：一件事分几步。做完的打勾，当前这步是选中底加主色线；放不下横排时自己变竖排。给了 onStepClick 时做完的步能点回去（多步表单）。 */
export function Steps({
  items,
  current,
  vertical,
  label,
  onStepClick,
  className,
}: {
  items: readonly StepItem[];
  /** 当前第几步，从 0 开始；等于 items.length 表示全部做完 */
  current: number;
  /** 竖排（每步有几行说明时） */
  vertical?: boolean;
  /** 列表的 aria-label，缺省「第 n 步，共 m 步」；写了会接在前面（「开通会员：第 2 步，共 3 步」） */
  label?: string;
  /** 点做完的步（回到那一步） */
  onStepClick?: (index: number) => void;
  className?: string;
}) {
  const { t } = useXxdLocale();
  if (items.length > 9) warnOnce("steps", "Steps 超过 9 步：分组，或者拆成几段（DIAGRAM-PLAN D145）");
  const progress = t.stepOf.replace("{n}", String(Math.min(current + 1, items.length))).replace("{total}", String(items.length));
  return (
    <ol className={cx("xxd-steps", className)} data-vertical={flag(vertical)} aria-label={label ? `${label}${t.stepOf.startsWith("Step") ? ": " : "："}${progress}` : progress}>
      {items.map((item, i) => {
        const state = i < current ? "done" : i === current ? "current" : undefined;
        const back = state === "done" && onStepClick;
        return (
          <li key={i} className="xxd-steps__item" data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className="xxd-steps__mark" aria-hidden="true">
              {state === "done" ? <Icon name="Check" size={14} /> : i + 1}
            </span>
            <span className="xxd-steps__text">
              {back ? (
                <button type="button" className="xxd-steps__title xxd-steps__link" onClick={() => onStepClick(i)}>
                  {item.title}
                  <span className="xxd-sr-only">{t.stepBack}</span>
                </button>
              ) : (
                <span className="xxd-steps__title">
                  {item.title}
                  {state === "done" && <span className="xxd-sr-only">{t.stepDone}</span>}
                </span>
              )}
              {item.description != null && <span className="xxd-steps__desc">{item.description}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export interface TimelineItem {
  /** 看得见的时间（「10月23日」） */
  time: ReactNode;
  /** 机器读的完整时间（<time datetime>）；不写时时间是普通文字（「预计 10-31」） */
  dateTime?: string;
  title: ReactNode;
  /** 一两行说明，或者任意内容 */
  children?: ReactNode;
  /** 重点：主色实心点（最多 1–2 条） */
  highlight?: boolean;
  /** 还没发生：空心点、灰字、虚线 */
  upcoming?: boolean;
}

/** 时间线：先后发生了什么。时间在左，一根竖线串起每条；窄时时间写到标题上面。 */
export function Timeline({ items, className, style }: { items: readonly TimelineItem[]; className?: string; style?: CSSProperties }) {
  if (items.length > 9) warnOnce("timeline", "Timeline 超过 9 条：分页，或者按月份分组（DIAGRAM-PLAN D145）");
  return (
    <ol className={cx("xxd-timeline", className)} style={style}>
      {items.map((item, i) => (
        <li key={i} className="xxd-timeline__item" data-highlight={flag(item.highlight)} data-upcoming={flag(item.upcoming)}>
          {item.dateTime ? (
            <time className="xxd-timeline__time" dateTime={item.dateTime}>
              {item.time}
            </time>
          ) : (
            <span className="xxd-timeline__time">{item.time}</span>
          )}
          <div className="xxd-timeline__body">
            <p className="xxd-timeline__title">{item.title}</p>
            {typeof item.children === "string" ? <p className="xxd-timeline__text">{item.children}</p> : item.children}
          </div>
        </li>
      ))}
    </ol>
  );
}

export interface FlowchartStep {
  title: ReactNode;
  description?: ReactNode;
  /** 重点：1.5px 主色线（最多 1–2 个） */
  highlight?: boolean;
  /** 这一步是判断：分成 2–3 条（只分一层） */
  branches?: readonly FlowchartBranch[];
  /** 分支走完合拢，接主线的下一步；不合拢时主线到这里为止 */
  merge?: boolean;
}

export interface FlowchartBranch {
  /** 分支名，写答案（「有」「没有」） */
  label: ReactNode;
  steps: readonly Omit<FlowchartStep, "branches" | "merge">[];
  /** 重点那一条路 */
  highlight?: boolean;
}

const nodeBody = (block: string, title: ReactNode, description?: ReactNode, extra?: ReactNode) => (
  <>
    {title}
    {extra}
    {description != null && <span className={`${block}__desc`}>{description}</span>}
  </>
);

function FlowchartStepItem({ step }: { step: FlowchartStep }) {
  return (
    <li className="xxd-flowchart__step">
      <div className="xxd-flowchart__node" data-highlight={flag(step.highlight)}>
        {nodeBody("xxd-flowchart", step.title, step.description)}
      </div>
      {step.branches && (
        <ul className="xxd-flowchart__branches" data-merge={flag(step.merge)}>
          {step.branches.map((b, i) => (
            <li key={i} className="xxd-flowchart__branch" data-highlight={flag(b.highlight)}>
              <span className="xxd-flowchart__label">{b.label}</span>
              <ol className="xxd-flowchart__path">
                {b.steps.map((s, j) => (
                  <FlowchartStepItem key={j} step={s} />
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** 流程图：一条从上往下的主线，中间一个判断分成 2–3 条，合拢（merge）或者各自结束。放不下时分支上下排、主干在左边。 */
export function Flowchart({ steps, className, style }: { steps: readonly FlowchartStep[]; className?: string; style?: CSSProperties }) {
  const count = steps.reduce((n, s) => n + 1 + (s.branches ?? []).reduce((m, b) => m + b.steps.length, 0), 0);
  if (count > 9) warnOnce("flowchart-nodes", "Flowchart 超过 9 个节点：拆成总览加细节（DIAGRAM-PLAN D145）");
  if (steps.some((s) => (s.branches?.length ?? 0) > 3)) warnOnce("flowchart-branches", "Flowchart 一个判断最多 3 条分支（D145）");
  if (steps.some((s, i) => s.branches && !s.merge && i < steps.length - 1)) warnOnce("flowchart-dangling", "Flowchart 分支不合拢（merge）时主线到这里为止，后面的步骤接不上");
  return (
    <ol className={cx("xxd-flowchart", className)} style={style}>
      {steps.map((s, i) => (
        <FlowchartStepItem key={i} step={s} />
      ))}
    </ol>
  );
}

export interface TreeNode {
  label: ReactNode;
  description?: ReactNode;
  highlight?: boolean;
  children?: readonly TreeNode[];
}

function TreeItem({ node }: { node: TreeNode }) {
  return (
    <li className="xxd-tree__item">
      <span className="xxd-tree__node" data-highlight={flag(node.highlight)}>
        {nodeBody("xxd-tree", node.label, node.description)}
      </span>
      {node.children?.length ? (
        <ul className="xxd-tree__group">
          {node.children.map((c, i) => (
            <TreeItem key={i} node={c} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** 树：一个分成几个。两层以内、够宽时画成组织图；三层、outline 或者窄时是缩进的大纲。 */
export function Tree({ items, outline, className, style }: { items: readonly TreeNode[]; /** 缩进的大纲（不写时按层数和宽度自己选） */ outline?: boolean; className?: string; style?: CSSProperties }) {
  const depth = (n: readonly TreeNode[]): number => (n.length ? 1 + Math.max(...n.map((x) => depth(x.children ?? []))) : 0);
  const size = (n: readonly TreeNode[]): number => n.reduce((m, x) => m + 1 + size(x.children ?? []), 0);
  if (depth(items) > 3 || size(items) > 9) warnOnce("tree", "Tree 超过 3 层或 9 个节点：折叠下一层，或者分页（DIAGRAM-PLAN D145）");
  return (
    <ul className={cx("xxd-tree", className)} data-outline={flag(outline)} style={style}>
      {items.map((n, i) => (
        <TreeItem key={i} node={n} />
      ))}
    </ul>
  );
}

export interface CycleStep {
  title: ReactNode;
  description?: ReactNode;
  highlight?: boolean;
}

/** 循环：3–6 步排成一排，最后一步一根回头线回到第一步（不画成一圈）。窄时一步一行，回头线在右边。 */
export function Cycle({ steps, className, style }: { steps: readonly CycleStep[]; className?: string; style?: CSSProperties }) {
  const { t } = useXxdLocale();
  if (steps.length < 3 || steps.length > 6) warnOnce("cycle", "Cycle 要 3–6 步：少了不成圈，多了合并几步（DIAGRAM-PLAN）");
  return (
    <ol className={cx("xxd-cycle", className)} style={style}>
      {steps.map((s, i) => (
        <li key={i} className="xxd-cycle__item">
          <div className="xxd-cycle__node" data-highlight={flag(s.highlight)}>
            {nodeBody("xxd-cycle", s.title, s.description, i === steps.length - 1 ? <span className="xxd-sr-only">{t.cycleBack}</span> : null)}
          </div>
        </li>
      ))}
    </ol>
  );
}

export interface LayerItem {
  title: ReactNode;
  description?: ReactNode;
  highlight?: boolean;
}

/** 分层：几条一样宽的横带从上往下叠，上层用下层；宽窄不表示多少（不画金字塔）。 */
export function Layers({ items, className, style }: { items: readonly LayerItem[]; className?: string; style?: CSSProperties }) {
  if (items.length > 6) warnOnce("layers", "Layers 超过 6 层：合并几层（DIAGRAM-PLAN）");
  return (
    <ol className={cx("xxd-layers", className)} style={style}>
      {items.map((x, i) => (
        <li key={i} className="xxd-layers__item" data-highlight={flag(x.highlight)}>
          <span className="xxd-layers__title">{x.title}</span>
          {x.description != null && <span className="xxd-layers__desc">{x.description}</span>}
        </li>
      ))}
    </ol>
  );
}
