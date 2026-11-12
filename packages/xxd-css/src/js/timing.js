// 操作反馈的时间（MOTION-REVIEW-PLAN D85–D87、FEEDBACK-ALIGN-PLAN D174）：网页版、React（Kumo、@xxd/react）、小程序和门禁共用这一份。

/** 进行中晚这么久才露出来：很快的操作字不会闪一下（D85） */
export const BUSY_DELAY = 150;

/** 完成的勾留这么久（D86） */
export const DONE_FOR = 1000;

/** 出错的 toast 至少留这么久（D87） */
export const ERROR_MIN = 6000;

/** 带操作（撤销、重试）的 toast 留这么久：键盘用户还要按 Alt+T 跳过来（D87） */
export const ACTION_FOR = 10000;

/**
 * toast 留多久（D87）：带操作 10 秒；只是告知的 2.6 秒起、每个字加 0.1 秒、最多 8 秒；出错的至少 6 秒。
 * message 是看得见的全部文字（标题加说明）。
 */
export function toastDuration(message, { tone, action = false } = {}) {
  if (action) return ACTION_FOR;
  const read = Math.min(8000, Math.max(2600, 1200 + [...String(message ?? "")].length * 100));
  return Math.max(tone === "danger" ? ERROR_MIN : 0, read);
}
