/** 进行中晚这么久才露出来（毫秒） */
export const BUSY_DELAY: number;
/** 完成的勾留这么久（毫秒） */
export const DONE_FOR: number;
/** 出错的 toast 至少留这么久（毫秒） */
export const ERROR_MIN: number;
/** 带操作的 toast 留这么久（毫秒） */
export const ACTION_FOR: number;
/** toast 留多久（毫秒）：带操作 10 秒；告知按字数 2.6–8 秒；出错至少 6 秒 */
export function toastDuration(message: unknown, options?: { tone?: string; action?: boolean }): number;
