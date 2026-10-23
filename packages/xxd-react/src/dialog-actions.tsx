import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@cloudflare/kumo";

/**
 * 对话框底部按钮区（DESIGN-PRINCIPLES §10）。
 * 子元素按 DOM 顺序：先放取消（辅助、内容宽度），最后放主操作 —— 主操作是最右的那个承诺。
 * 窄屏可换行，主操作可占剩余宽度；取消永远是内容宽度。
 *
 *   <DialogActions>
 *     <Button variant="ghost" data-xxd-cancel>取消</Button>
 *     <Button variant="primary">保存</Button>
 *   </DialogActions>
 */
export const DialogActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function DialogActions(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-xxd-part="dialog-actions"
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        "[&>[data-xxd-cancel]]:flex-none [&>[data-xxd-cancel]]:w-auto",
        "max-sm:[&>:last-child:not([data-xxd-cancel])]:flex-1",
        className,
      )}
      {...props}
    />
  );
});
DialogActions.displayName = "DialogActions";
