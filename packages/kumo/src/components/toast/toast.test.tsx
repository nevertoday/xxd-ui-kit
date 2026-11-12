import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { useEffect } from "react";
import { Toasty, createKumoToastManager, useKumoToastManager } from "./toast";

describe("Toasty", () => {
  // Regression guard: existing callers that don't pass `toastManager`
  // must continue to work via the in-tree `useKumoToastManager` hook.
  it("renders without a toastManager prop and accepts in-tree dispatch", async () => {
    function TriggerOnMount() {
      const toasts = useKumoToastManager();
      useEffect(() => {
        toasts.add({ title: "from inside" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    render(
      <Toasty>
        <TriggerOnMount />
      </Toasty>,
    );

    expect(await screen.findByText("from inside")).toBeTruthy();
  });

  // Headline feature: an external manager passed via the prop allows
  // dispatch from outside the React tree.
  it("dispatches toasts via an external manager passed as a prop", async () => {
    const mgr = createKumoToastManager();

    render(
      <Toasty toastManager={mgr}>
        <div />
      </Toasty>,
    );

    act(() => {
      mgr.add({ title: "from outside" });
    });

    expect(await screen.findByText("from outside")).toBeTruthy();
  });

  it("updates toasts from their current state", async () => {
    const mgr = createKumoToastManager();

    render(
      <Toasty toastManager={mgr}>
        <div />
      </Toasty>,
    );

    act(() => {
      const id = mgr.add({ title: "Saving" });
      mgr.update(id, (toast) => {
        expect(toast.title).toBe("Saving");
        return { title: "Saving complete" };
      });
    });

    expect(await screen.findByText("Saving complete")).toBeTruthy();
  });

  // Duplicate ids dispatched through an external manager must not
  // produce duplicate DOM nodes. (The exact merge semantics — replace vs
  // bump — are owned by `wrapManagerMethods` / base-ui and tested
  // elsewhere; this test only guards against the regression of two
  // toast roots rendering for the same id.)
  it("does not render duplicate toast roots for the same id via an external manager", async () => {
    const mgr = createKumoToastManager();

    render(
      <Toasty toastManager={mgr}>
        <div />
      </Toasty>,
    );

    act(() => {
      mgr.add({ id: "dupe", title: "first" });
      mgr.add({ id: "dupe", title: "second" });
    });

    // Exactly one toast title rendered — not two.
    await screen.findByText("second");
    const titles = document.querySelectorAll("[data-toast-title]");
    expect(titles).toHaveLength(1);
  });

  // `useKumoToastManager()` inside a tree wrapped with an external manager
  // must return that same manager — so in-tree and out-of-tree dispatch
  // converge on a single instance.
  it("exposes the same manager instance to useKumoToastManager inside the tree", async () => {
    const mgr = createKumoToastManager();
    let inTreeAdd: ((opts: { title: string }) => string) | undefined;

    function CaptureManager() {
      const toasts = useKumoToastManager();
      inTreeAdd = toasts.add;
      return null;
    }

    render(
      <Toasty toastManager={mgr}>
        <CaptureManager />
      </Toasty>,
    );

    // External dispatch.
    act(() => {
      mgr.add({ title: "external" });
    });
    expect(await screen.findByText("external")).toBeTruthy();

    // In-tree dispatch via the hook.
    act(() => {
      inTreeAdd?.({ title: "in-tree" });
    });
    expect(await screen.findByText("in-tree")).toBeTruthy();
  });

  describe("how long a toast stays (same rule as @xxd/css, D87)", () => {
    afterEach(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
    });

    function mount() {
      const seen: { current: ReturnType<typeof useKumoToastManager> | null } = { current: null };
      function Capture() {
        seen.current = useKumoToastManager();
        return null;
      }
      const mgr = createKumoToastManager();
      render(
        <Toasty toastManager={mgr}>
          <Capture />
        </Toasty>,
      );
      const toast = (title: string) => seen.current!.toasts.find((t) => t.title === title)!;
      return { mgr, toast };
    }

    it("by content: a short notice 2.6s, a long one 0.1s per character up to 8s, an error at least 6s and assertive, an action 10s", () => {
      const { mgr, toast } = mount();
      const long = "已经把 24 张图片按颜色重新排好，原来的顺序可以在历史记录里找回来";
      act(() => {
        mgr.add({ title: "已保存" });
        mgr.add({ title: long });
        mgr.add({ title: "写入失败", variant: "error" });
        mgr.add({ title: "已删除 1 条", actions: [{ children: "撤销" }] });
        mgr.add({ title: "自己定的", timeout: 1234 });
      });
      expect(toast("已保存").timeout).toBe(2600);
      expect(toast(long).timeout).toBe(1200 + Array.from(long).length * 100);
      expect(toast("写入失败").timeout).toBe(6000);
      expect(toast("写入失败").priority).toBe("high");
      expect(document.querySelector("[role=alertdialog]")).toBeTruthy();
      expect(toast("已删除 1 条").timeout).toBe(10000);
      expect(toast("自己定的").timeout).toBe(1234);
    });

    it("holds every timer while the page is hidden and gives the full time back on return", () => {
      const { mgr, toast } = mount();
      act(() => {
        mgr.add({ title: "已保存" });
      });
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(toast("已保存").timeout).toBe(0);
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(toast("已保存").timeout).toBe(2600);
    });
  });
});
