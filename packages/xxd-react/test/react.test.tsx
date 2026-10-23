import { render, screen, act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
afterEach(cleanup);
import { Button, DialogActions, Icon, XxdAppearanceProvider, useXxdAppearance } from "../src/index";

function Toggle() {
  const { settings, update } = useXxdAppearance();
  return <button onClick={() => update({ corners: settings.corners === "rounded" ? "square" : "rounded" })}>{settings.corners}</button>;
}

describe("@xxd/react", () => {
  it("重导出 Kumo 组件", () => {
    render(<Button>写入</Button>);
    expect(screen.getByRole("button", { name: "写入" })).toBeTruthy();
  });

  it("DialogActions：取消在前、主操作在后", () => {
    render(
      <DialogActions>
        <Button data-xxd-cancel>取消</Button>
        <Button variant="primary">保存</Button>
      </DialogActions>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["取消", "保存"]);
  });

  it("外观 Provider 写到 <html>，默认直角，lock 生效", async () => {
    render(
      <XxdAppearanceProvider storageKey="test-ui">
        <Toggle />
      </XxdAppearanceProvider>,
    );
    expect(document.documentElement.getAttribute("data-corners")).toBe("square");
    await act(async () => screen.getByRole("button").click());
    expect(document.documentElement.getAttribute("data-corners")).toBe("rounded");
  });

  it("Icon 渲染 1.5 线宽", () => {
    const { container } = render(<Icon name="Check" />);
    expect(container.querySelector("svg")?.getAttribute("stroke-width")).toBe("1.5");
  });
});
