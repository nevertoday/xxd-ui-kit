// 输入框：标签、说明、出错、字数。网页版的 .xxd-field / .xxd-input / .xxd-textarea。
import { Input as TaroInput, Textarea as TaroTextarea, View, Text } from "@tarojs/components";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "../styles/field.mini.css";
import { a11y } from "./aria";
import { useAdjustPosition } from "./keyboard";
import { useXxd } from "./provider";
import { cx, IS_H5, mods, nextId } from "./util";

export interface FieldProps {
  label?: ReactNode;
  /** 输入框下面的说明 */
  help?: ReactNode;
  /** 出错时的说明（有它时输入框变红） */
  error?: ReactNode;
  /** 标签后面写「选填」 */
  optional?: boolean;
  children?: ReactNode;
  className?: string;
}

// 字段的标签字：里面的输入框拿它当读屏名字（小程序里没有 <label for>）
const FieldLabel = createContext<string | undefined>(undefined);
// 字段里的输入框把字数交给字段：说明在左、字数在右，放一行（MINI-REVIEW-PLAN U6）
type CounterInfo = { length: number; max: number; over: boolean };
const FieldMeta = createContext<((info: CounterInfo | null) => void) | null>(null);

/** 一个字段：标签 + 输入框 + 说明 / 出错 */
export function Field({ label, help, error, optional, children, className }: FieldProps) {
  const { lang } = useXxd();
  const [counter, setCounter] = useState<CounterInfo | null>(null);
  const report = useRef((info: CounterInfo | null) => setCounter((prev) => (prev && info && prev.length === info.length && prev.max === info.max && prev.over === info.over ? prev : info))).current;
  return (
    <FieldMeta.Provider value={report}>
    <FieldLabel.Provider value={typeof label === "string" ? label : undefined}>
    <View className={cx("xxd-field", mods({ invalid: Boolean(error) }), className)}>
      {label != null && (
        <Text className={cx("xxd-label", mods({ optional }))}>
          {label}
          {optional && <Text className="xxd-label__optional">{lang === "en" ? "Optional" : "选填"}</Text>}
        </Text>
      )}
      {children}
      {(error || help != null || counter) && (
        <View className="xxd-field__meta">
          {error ? (
            <Text className="xxd-error" {...a11y({ role: "alert", live: "assertive" })}>
              {error}
            </Text>
          ) : help != null ? (
            <Text className="xxd-help">{help}</Text>
          ) : null}
          {counter && <Counter length={counter.length} max={counter.max} over={counter.over} />}
        </View>
      )}
    </View>
    </FieldLabel.Provider>
    </FieldMeta.Provider>
  );
}

/** 字数：在字段里交给字段画（和说明一行），不在字段里自己画 */
function useCounter(show: boolean, length: number, max: number | undefined, over: boolean): ReactNode {
  const report = useContext(FieldMeta);
  const on = show && max != null;
  useLayoutEffect(() => {
    if (report) report(on ? { length, max: max!, over } : null);
  });
  useLayoutEffect(() => () => report?.(null), [report]);
  return on && !report ? <Counter length={length} max={max!} over={over} /> : null;
}

/** 输入框的读屏名字：自己的 label → 外面 Field 的标签 → 提示字。H5 里还要交给里面真正的 <input> */
function useInputName(label?: string, placeholder?: string) {
  const fromField = useContext(FieldLabel);
  const name = label ?? fromField ?? placeholder;
  return { name, native: IS_H5 && name ? { nativeProps: { "aria-label": name } } : {} };
}

interface InputBase {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  maxLength?: number;
  /** 输入框下面显示字数（要给 maxLength） */
  counter?: boolean;
  /** 读屏说明（没有 Field 的 label 时写） */
  label?: string;
  className?: string;
  focus?: boolean;
  onConfirm?: (value: string) => void;
  onBlur?: (value: string) => void;
  /** 键盘弹出时把页面往上推（微信缺省是）。底部面板里的输入框缺省 false，由面板自己跟着键盘升起来 */
  adjustPosition?: boolean;
  /** 输入框底部离键盘的距离（px） */
  cursorSpacing?: number;
}

export interface InputProps extends InputBase {
  type?: "text" | "number" | "idcard" | "digit" | "nickname" | "safe-password";
  password?: boolean;
  size?: "sm" | "md" | "lg";
  confirmType?: "send" | "search" | "next" | "go" | "done";
}

function useValue(value: string | undefined, defaultValue: string | undefined, onValueChange?: (v: string) => void) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const set = (v: string) => {
    if (value == null) setInner(v);
    onValueChange?.(v);
  };
  return [current, set] as const;
}

/** 按字算长度（一个表情算一个字，和看到的一致） */
export const charCount = (v: string) => Array.from(v).length;

/**
 * 交给原生输入框的值：打字时不写回（写回会打断中文输入法的拼音、光标跳到最后），
 * 只有外面改了值（清空、改写、截断）才写一次。返回 [给原生输入框的值, 原生输入框报上来的值记一下]。
 */
export function useNativeValue(current: string) {
  const typed = useRef(current);
  const [shown, setShown] = useState(current);
  useEffect(() => {
    if (current === typed.current) return;
    const prev = typed.current;
    typed.current = current;
    if (shown !== current) {
      setShown(current);
      return;
    }
    // 交给原生的值没变过（比如从空打了几个字又被清空）：先对上输入框里实际的字，再写新值，Taro 才会真的写过去
    setShown(prev);
    const t = setTimeout(() => setShown(current), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  return [shown, (v: string) => (typed.current = v)] as const;
}

/**
 * 字数上限：原生输入框放宽一个字，多出来时由这里截掉并提醒（粘贴一大段时不会悄悄没了一截）。
 * 返回 [截好的值, 刚刚超过了没有]
 */
function useLimit(maxLength: number | undefined, counter: boolean | undefined) {
  const { t, toast } = useXxd();
  const [over, setOver] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const limit = (v: string) => {
    if (maxLength == null || maxLength < 0 || charCount(v) <= maxLength) return v;
    setOver(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOver(false), 1600);
    if (!counter) toast(t.tooLong(maxLength), { tone: "warning" });
    return Array.from(v).slice(0, maxLength).join("");
  };
  return { limit, over, native: maxLength == null || maxLength < 0 ? -1 : maxLength + 1 };
}

function Counter({ length, max, over }: { length: number; max: number; over?: boolean }) {
  const { t } = useXxd();
  return <Text className={cx("xxd-help", "is-counter", (over || length > max) && "is-over")}>{t.count(length, max)}</Text>;
}

export function Input({ value, defaultValue, onValueChange, placeholder, disabled, invalid, maxLength, counter, label, className, type = "text", password, size, confirmType, focus, onConfirm, onBlur, adjustPosition: ownAdjust, cursorSpacing }: InputProps) {
  const adjustPosition = useAdjustPosition(ownAdjust);
  const [current, set] = useValue(value, defaultValue, onValueChange);
  const [shown, mark] = useNativeValue(current);
  const { limit, over, native: nativeMax } = useLimit(maxLength, counter);
  const counterNode = useCounter(Boolean(counter), charCount(current), maxLength, over);
  const { name, native } = useInputName(label, placeholder);
  const [id] = useState(() => nextId("input"));
  return (
    <>
      <TaroInput
        id={id}
        className={cx("xxd-input", mods({ invalid, disabled, size: size === "md" ? undefined : size }), className)}
        placeholderClass="is-placeholder"
        value={shown}
        type={type}
        password={password}
        placeholder={placeholder}
        disabled={disabled || undefined}
        maxlength={nativeMax}
        confirmType={confirmType}
        focus={focus}
        adjustPosition={adjustPosition}
        cursorSpacing={cursorSpacing}
        onInput={(e) => {
          mark(e.detail.value);
          set(limit(e.detail.value));
        }}
        onConfirm={(e) => onConfirm?.(e.detail.value)}
        onBlur={(e) => onBlur?.(e.detail.value)}
        {...native}
        {...a11y({ label: name, disabled })}
      />
      {counterNode}
    </>
  );
}

export interface TextareaProps extends InputBase {
  /** 跟着内容长高 */
  autoHeight?: boolean;
  rows?: number;
}

export function Textarea({ value, defaultValue, onValueChange, placeholder, disabled, invalid, maxLength, counter, label, className, autoHeight, rows = 3, focus, onConfirm, onBlur, adjustPosition: ownAdjust, cursorSpacing }: TextareaProps) {
  const adjustPosition = useAdjustPosition(ownAdjust);
  const [current, set] = useValue(value, defaultValue, onValueChange);
  const [shown, mark] = useNativeValue(current);
  const { limit, over, native: nativeMax } = useLimit(maxLength, counter);
  const counterNode = useCounter(Boolean(counter), charCount(current), maxLength, over);
  const { name, native } = useInputName(label, placeholder);
  return (
    <>
      <TaroTextarea
        className={cx("xxd-textarea", mods({ invalid, disabled, autosize: autoHeight }), className)}
        placeholderClass="is-placeholder"
        style={autoHeight ? undefined : `--rows:${rows}`}
        value={shown}
        placeholder={placeholder}
        disabled={disabled || undefined}
        maxlength={nativeMax}
        autoHeight={autoHeight}
        focus={focus}
        adjustPosition={adjustPosition}
        cursorSpacing={cursorSpacing}
        onInput={(e) => {
          mark(e.detail.value);
          set(limit(e.detail.value));
        }}
        onConfirm={(e) => onConfirm?.(e.detail.value)}
        onBlur={(e) => onBlur?.(e.detail.value)}
        {...native}
        {...a11y({ label: name, disabled })}
      />
      {counterNode}
    </>
  );
}
