import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vite-plus/test";
import { ChartPalette } from "./Color";
import { TimeseriesChart } from "./TimeseriesChart";
import { TooltipContent } from "./timeseries-tooltip";

const createMockChart = () => ({
  setOption: vi.fn(),
  dispatchAction: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
});

const createMockEcharts = (mockChart = createMockChart()) => ({
  init: vi.fn(() => mockChart),
});

describe("TimeseriesChart", () => {
  it("formats tooltip timestamps in the browser locale and time zone by default", async () => {
    const mockChart = createMockChart();
    const timestamp = Date.UTC(2026, 8, 18, 12, 34, 56);

    render(
      <TimeseriesChart
        echarts={createMockEcharts(mockChart) as any}
        data={[
          {
            name: "Requests",
            color: "#4290F0",
            data: [[timestamp, 10]],
          },
        ]}
      />,
    );

    const updateAxisPointer = mockChart.on.mock.calls.find(
      (call) => call[0] === "updateaxispointer",
    )?.[1];
    expect(updateAxisPointer).toBeTypeOf("function");

    await act(() => updateAxisPointer({ axesInfo: [{ value: timestamp }] }));

    const expected = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(timestamp);
    expect(await screen.findByText(expected)).not.toBeNull();
  });

  it("uses a custom UTC formatter and updates an open tooltip when it changes", async () => {
    const mockChart = createMockChart();
    const mockEcharts = createMockEcharts(mockChart);
    const timestamp = Date.UTC(2026, 8, 18, 12, 34, 56);
    const data = [
      {
        name: "Requests",
        color: "#4290F0",
        data: [[timestamp, 10]] as [number, number][],
      },
    ];
    const utcFormatter = (value: number) =>
      new Intl.DateTimeFormat(undefined, {
        timeZone: "UTC",
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(value);

    const { rerender } = render(
      <TimeseriesChart
        echarts={mockEcharts as any}
        data={data}
        tooltipTimestampFormat={() => "Original time zone"}
      />,
    );

    const updateAxisPointer = mockChart.on.mock.calls.find(
      (call) => call[0] === "updateaxispointer",
    )?.[1];
    expect(updateAxisPointer).toBeTypeOf("function");

    await act(() => updateAxisPointer({ axesInfo: [{ value: timestamp }] }));
    expect(await screen.findByText("Original time zone")).not.toBeNull();

    rerender(
      <TimeseriesChart
        echarts={mockEcharts as any}
        data={data}
        tooltipTimestampFormat={utcFormatter}
      />,
    );

    expect(await screen.findByText(utcFormatter(timestamp))).not.toBeNull();
    expect(screen.queryByText("Original time zone")).toBeNull();
  });

  it("uses the custom timestamp formatter for marker tooltips", async () => {
    const mockChart = createMockChart();
    const timestamp = Date.UTC(2026, 8, 18, 12, 34, 56);
    const marker = { timestamp, label: "Deployment" };
    const tooltipTimestampFormat = vi.fn(
      (value: number) => `UTC: ${new Date(value).toISOString()}`,
    );

    render(
      <TimeseriesChart
        echarts={createMockEcharts(mockChart) as any}
        data={[]}
        markers={[marker]}
        tooltipTimestampFormat={tooltipTimestampFormat}
      />,
    );

    const mouseover = mockChart.on.mock.calls.find(
      (call) => call[0] === "mouseover",
    )?.[1];
    expect(mouseover).toBeTypeOf("function");

    await act(() =>
      mouseover({
        componentType: "markLine",
        data: { tooltip: { marker: { ...marker, markers: [marker] } } },
      }),
    );

    expect(
      await screen.findByText(`UTC: ${new Date(timestamp).toISOString()}`),
    ).not.toBeNull();
    expect(tooltipTimestampFormat).toHaveBeenCalledWith(timestamp);
  });

  it("leaves the y-axis interval unconstrained by default", async () => {
    const mockChart = createMockChart();

    render(
      <TimeseriesChart
        echarts={createMockEcharts(mockChart) as any}
        data={[]}
      />,
    );

    await waitFor(() =>
      expect(mockChart.setOption).toHaveBeenCalledWith(
        expect.objectContaining({
          yAxis: expect.not.objectContaining({
            minInterval: expect.anything(),
          }),
        }),
        expect.anything(),
      ),
    );
  });

  it("passes yAxisMinInterval to ECharts", async () => {
    const mockChart = createMockChart();

    render(
      <TimeseriesChart
        echarts={createMockEcharts(mockChart) as any}
        data={[]}
        yAxisMinInterval={1}
      />,
    );

    await waitFor(() =>
      expect(mockChart.setOption).toHaveBeenCalledWith(
        expect.objectContaining({
          yAxis: expect.objectContaining({ minInterval: 1 }),
        }),
        expect.anything(),
      ),
    );
  });

  it("does not reserve footer space for an empty string", () => {
    const { container } = render(
      <TooltipContent
        state={{ type: "series", ts: 1, rows: [], hiddenCount: 0 }}
        formatTimestamp={() => "Now"}
        footer=""
      />,
    );

    expect(container.querySelector(".text-kumo-subtle")).toBeNull();
  });

  it("server-renders without browser globals", () => {
    const mockEcharts = createMockEcharts();
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);

    try {
      expect(() =>
        renderToString(
          <TimeseriesChart
            echarts={mockEcharts as any}
            data={[
              {
                name: "Requests",
                color: "#4290F0",
                data: [[1, 10]],
              },
            ]}
          />,
        ),
      ).not.toThrow();
    } finally {
      vi.stubGlobal("window", originalWindow);
      vi.stubGlobal("document", originalDocument);
    }
  });

  it("closes the tooltip when leaving the chart after a context menu interaction", async () => {
    const mockChart = createMockChart();
    const mockEcharts = createMockEcharts(mockChart);

    render(
      <TimeseriesChart
        echarts={mockEcharts as any}
        data={[
          {
            name: "Requests",
            color: "#4290F0",
            data: [[1, 10]],
          },
        ]}
      />,
    );

    const updateAxisPointer = mockChart.on.mock.calls.find(
      (call) => call[0] === "updateaxispointer",
    )?.[1];
    expect(updateAxisPointer).toBeTypeOf("function");

    await act(() => updateAxisPointer({ axesInfo: [{ value: 1 }] }));
    expect(await screen.findByText("Requests")).not.toBeNull();

    const trigger = document.querySelector("[data-base-ui-tooltip-trigger]");
    expect(trigger).toBeInstanceOf(HTMLElement);
    fireEvent.contextMenu(trigger as HTMLElement);
    expect(screen.queryByText("Requests")).not.toBeNull();

    await act(() => updateAxisPointer({ axesInfo: [{ value: 1 }] }));
    expect(await screen.findByText("Requests")).not.toBeNull();

    vi.spyOn(trigger as HTMLElement, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 100, 100),
    );
    fireEvent.mouseMove(window, { clientX: 101, clientY: 50 });

    expect(screen.queryByText("Requests")).toBeNull();
  });

  it("renders supplemental content below series values in every tooltip", async () => {
    const mockChart = createMockChart();
    const mockEcharts = createMockEcharts(mockChart);
    const marker = { timestamp: 1, label: "Deployment" };

    render(
      <TimeseriesChart
        echarts={mockEcharts as any}
        data={[
          {
            name: "Requests",
            color: "#4290F0",
            data: [[1, 10]],
          },
        ]}
        markers={[marker]}
        tooltipFooter="Five-minute rolling window"
      />,
    );

    const updateAxisPointer = mockChart.on.mock.calls.find(
      (call) => call[0] === "updateaxispointer",
    )?.[1];
    expect(updateAxisPointer).toBeTypeOf("function");

    await act(() => updateAxisPointer({ axesInfo: [{ value: 1 }] }));

    const row = await screen.findByText("Requests");
    const footer = screen.getByText("Five-minute rolling window");
    expect(
      row.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(footer.className).toContain("text-kumo-subtle");

    const mouseover = mockChart.on.mock.calls.find(
      (call) => call[0] === "mouseover",
    )?.[1];
    expect(mouseover).toBeTypeOf("function");

    await act(() =>
      mouseover({
        componentType: "markLine",
        data: { tooltip: { marker: { ...marker, markers: [marker] } } },
      }),
    );

    expect(await screen.findByText("Deployment")).not.toBeNull();
    expect(screen.getByText("Five-minute rolling window")).not.toBeNull();
    expect(
      screen
        .getByText("Requests")
        .compareDocumentPosition(
          screen.getByText("Five-minute rolling window"),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("reactivates brush-to-zoom after a notMerge option update", async () => {
    const mockChart = createMockChart();
    const mockEcharts = createMockEcharts(mockChart);
    const onTimeRangeChange = vi.fn();
    const optionUpdateBehavior = { notMerge: true };

    const { rerender } = render(
      <TimeseriesChart
        echarts={mockEcharts as any}
        data={[
          {
            name: "Requests",
            color: "#4290F0",
            data: [[1, 10]],
          },
        ]}
        markers={[{ timestamp: 1, label: "Deployment" }]}
        onTimeRangeChange={onTimeRangeChange}
        optionUpdateBehavior={optionUpdateBehavior}
      />,
    );

    await waitFor(() =>
      expect(mockChart.dispatchAction).toHaveBeenCalledWith({
        type: "takeGlobalCursor",
        key: "brush",
        brushOption: {
          brushType: "lineX",
          brushMode: "single",
        },
      }),
    );
    mockChart.dispatchAction.mockClear();

    rerender(
      <TimeseriesChart
        echarts={mockEcharts as any}
        data={[
          {
            name: "Requests",
            color: "#4290F0",
            data: [
              [1, 10],
              [2, 20],
            ],
          },
        ]}
        markers={[{ timestamp: 1, label: "Deployment" }]}
        onTimeRangeChange={onTimeRangeChange}
        optionUpdateBehavior={optionUpdateBehavior}
      />,
    );

    await waitFor(() =>
      expect(mockChart.dispatchAction).toHaveBeenCalledWith({
        type: "takeGlobalCursor",
        key: "brush",
        brushOption: {
          brushType: "lineX",
          brushMode: "single",
        },
      }),
    );
  });
});

// xxd-ui-kit (ECHARTS-REVIEW-PLAN D135): with the xxd tokens on the page, chart colors come from them
describe("ChartPalette with xxd tokens", () => {
  it("uses the Kumo palette when the page has no xxd tokens", () => {
    expect(ChartPalette.categorical(0)).toBe("#4290F0");
    expect(ChartPalette.text("primary")).toBe("#6B7280");
  });

  it("reads series, text, grid and map colors from the tokens when present", () => {
    const root = document.documentElement.style;
    const tokens = { "--action": "#111111", "--gray-9": "#898681", "--accent-8": "#353433", "--muted": "#6b675f", "--heat-1": "#ccc9c5", "--wash-strong": "#eeece9" };
    for (const [k, v] of Object.entries(tokens)) root.setProperty(k, v);
    try {
      expect([0, 1, 2, 5].map((i) => ChartPalette.categorical(i))).toEqual(["#111111", "#898681", "#353433", "#111111"]);
      expect(ChartPalette.text("primary", true)).toBe("#6b675f");
      expect(ChartPalette.mapColors().area).toBe("#eeece9");
      expect(ChartPalette.sequential("blues")[0]).toBe("#ccc9c5");
    } finally {
      for (const k of Object.keys(tokens)) root.removeProperty(k);
    }
  });
});
