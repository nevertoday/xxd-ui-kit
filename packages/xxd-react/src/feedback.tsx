// 操作反馈（FEEDBACK-ALIGN-PLAN D174–D179）：和网页版 Xxd.runBusy / Xxd.saveSetting / [data-confirm-twice] 同样的行为，
// 时间读 @xxd/css/timing，文案读 @xxd/css/labels，播报走 @xxd/css/announce（常驻的 live region）。
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useKumoToastManager } from "@cloudflare/kumo";
import { announce } from "@xxd/css/announce";
import { BUSY_DELAY, DONE_FOR } from "@xxd/css/timing";
import { useXxdLocale } from "./locale";

/** 在 <Toasty> 里就用它弹出错的 toast；不在里面（只用了 Button）返回 null，只念出来 */
function useOptionalToasts() {
  try {
    return useKumoToastManager();
  } catch {
    return null;
  }
}

type BusyState = "idle" | "busy" | "done";

/**
 * 进行中的按钮，和 Xxd.runBusy 一样：
 *   const save = useBusy();
 *   <Button {...save.buttonProps} onClick={() => save.run(() => api.save())}>保存</Button>
 * 进行中 aria-busy（Kumo Button 150ms 后才露出转圈、宽度不跳、焦点不掉）；成功打勾 1 秒，polite 地念 done（缺省「已完成」，false 不念）；
 * 失败弹出错的 toast（failed，缺省「没有完成，可以重试」，false 不弹），带「重试」：再跑一次同一个任务。run 照样 reject。
 * 进行中再 run 返回正在跑的那一个。成功后要做的事写进任务里，重试成功时也会做。
 */
export function useBusy({ doneFor = DONE_FOR, done, failed }: { doneFor?: number; done?: string | false; failed?: string | false } = {}) {
  const { t } = useXxdLocale();
  const toasts = useOptionalToasts();
  const [state, setState] = useState<BusyState>("idle");
  const job = useRef<Promise<unknown> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = useCallback(
    <T,>(task: () => T | Promise<T>): Promise<T> => {
      if (job.current) return job.current as Promise<T>;
      clearTimeout(timer.current);
      setState("busy");
      const p = (async () => {
        try {
          const result = await task();
          setState("done");
          timer.current = setTimeout(() => setState("idle"), doneFor);
          if (done !== false) announce(done || t.done);
          return result;
        } catch (error) {
          setState("idle");
          if (failed !== false) {
            const message = failed || t.failed;
            const retry = () => void run(task).catch(() => {});
            if (toasts) toasts.add({ title: message, variant: "error", actions: [{ children: t.retry, onClick: retry }] });
            else announce(message, { assertive: true });
          }
          throw error;
        } finally {
          job.current = null;
        }
      })();
      job.current = p;
      return p;
    },
    [doneFor, done, failed, t, toasts],
  );

  return {
    run,
    busy: state === "busy",
    done: state === "done",
    /** 摊到 Kumo 的 <Button> 上：loading 和完成的勾 */
    buttonProps: { loading: state === "busy", "data-done": state === "done" ? "" : undefined } as const,
  };
}

type SaveState = "idle" | "saving" | "saved" | "failed";

/**
 * 改了马上存的设置（开关、复选、下拉），和 Xxd.saveSetting 一样：
 *   const saving = useSettingSave();
 *   <Switch checked={on} onCheckedChange={(v) => { setOn(v); saving.save(() => store.set({ on: v }), { undo: () => setOn(!v), redo: () => setOn(v) }); }} />
 *   {saving.line}
 * 150ms 还没存好说「正在保存…」，存好「已保存」（2 秒后收起），存不进去调 undo 退回原值、说「没有保存」并给「重试」。
 * line 是放在设置行下面（或底部状态条里）的一行字；读屏：已保存 polite，失败 assertive。save 返回存没存上，不抛错。
 */
export function useSettingSave() {
  const { t } = useXxdLocale();
  const [state, setState] = useState<SaveState>("idle");
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const turn = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lineRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const save = useCallback(
    async (write: () => unknown, { undo, redo }: { undo?: () => void; redo?: () => void } = {}): Promise<boolean> => {
      const mine = ++turn.current;
      clearTimeout(timer.current);
      setRetry(null);
      timer.current = setTimeout(() => turn.current === mine && setState("saving"), BUSY_DELAY);
      try {
        await write();
        if (turn.current !== mine) return true;
        clearTimeout(timer.current);
        setState("saved");
        announce(t.saved);
        timer.current = setTimeout(() => turn.current === mine && setState("idle"), 2000);
        return true;
      } catch {
        if (turn.current !== mine) return false;
        clearTimeout(timer.current);
        undo?.();
        setState("failed");
        if (redo) {
          setRetry(() => () => {
            // 「重试」马上被换成「正在保存…」：焦点挪到这一行字上，不掉到 body（D178）
            lineRef.current?.focus({ preventScroll: true });
            redo();
            void save(write, { undo, redo });
          });
        }
        announce(t.notSaved, { assertive: true });
        return false;
      }
    },
    [t],
  );

  const text = { idle: "", saving: t.saving, saved: t.saved, failed: t.notSaved }[state];
  const line: ReactNode = (
    <p ref={lineRef} tabIndex={-1} className={state === "failed" ? "xxd-error" : "xxd-help"} hidden={!text}>
      {text}
      {state === "failed" && retry && (
        <>
          {" "}
          <button type="button" className="xxd-link" onClick={retry}>
            {t.retry}
          </button>
        </>
      )}
    </p>
  );
  return { save, state, line };
}

/**
 * 两次确认的按钮，和网页版 [data-confirm-twice] 一样（D179）：第一次点变成确认文字（危险色）并念「再按一次…」；
 * 第二次点才执行 onConfirm——双击的第二下不算；Esc 退回；5 秒没再点才复原，焦点或鼠标还在按钮上时不复原，离开 1.5 秒后复原。
 * 只给撤不回来的操作；能撤回的用「删掉 + 撤销」（§9）。
 */
export function ConfirmTwiceButton({ children, confirmLabel, onConfirm, size, variant, timeout = 5000 }: { children: ReactNode; confirmLabel?: ReactNode; onConfirm: () => void; size?: "xs" | "sm" | "lg"; variant?: "ghost" | "outline"; timeout?: number }) {
  const { t } = useXxdLocale();
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const label = confirmLabel ?? t.confirmDelete;

  const disarmLater = useCallback((ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(function later() {
      if (ref.current?.matches(":focus, :hover")) {
        timer.current = setTimeout(later, 1000);
        return;
      }
      setArmed(false);
    }, ms);
  }, []);

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!armed) {
      setArmed(true);
      announce(t.confirmTwiceHint.replace("{label}", typeof label === "string" ? label : ref.current?.textContent ?? ""), { assertive: true });
      disarmLater(timeout);
      return;
    }
    if (event.detail > 1) return;
    clearTimeout(timer.current);
    setArmed(false);
    onConfirm();
  };

  return (
    <button
      ref={ref}
      type="button"
      className="xxd-btn"
      data-size={size}
      data-variant={variant}
      data-confirming={armed ? "" : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !armed) return;
        event.preventDefault();
        clearTimeout(timer.current);
        setArmed(false);
      }}
      onBlur={() => armed && disarmLater(1500)}
    >
      {armed ? label : children}
    </button>
  );
}
