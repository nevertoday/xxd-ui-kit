/**
 * Categorical colors for light mode — used when assigning colors to data series
 * by index (e.g. the first series gets Blue, the second gets Violet, etc.).
 */
enum ChartCategoricalLightColors {
  Blue = "#4290F0",
  Yellow = "#F5B647",
  Pink = "#E8649D",
  Purple = "#8D58EE",
  Teal = "#50C3B6",
  Orange = "#D37536",
}

/**
 * Categorical colors for dark mode
 */
enum ChartCategoricalDarkColors {
  Blue = "#4290F0",
  Yellow = "#EEB720",
  Pink = "#E8649D",
  Purple = "#8D58EE",
  Teal = "#50C3B6",
  Orange = "#D37536",
}

/**
 * Semantic colors for light mode — used to convey meaning (status, severity)
 * rather than just distinguishing series. Use via `ChartPalette.semantic()`.
 */
enum ChartSemanticLightColors {
  Attention = "#FC574A",
  Warning = "#F8A054",
  Success = "#00A63E",
  Neutral = "#B9D6FF",
  Disabled = "#CBCBCB",
  Skeleton = "#DDDDDD",
}

/**
 * Semantic colors for dark mode
 */
enum ChartSemanticDarkColors {
  Attention = "#FC574A",
  Warning = "#F8A054",
  Success = "#00A63E",
  Neutral = "#8EC5FF",
  Disabled = "#878787",
  Skeleton = "#5C5C5C",
}

export type ChartSemanticColorName =
  "Attention" | "Warning" | "Success" | "Neutral" | "Disabled" | "Skeleton";

/**
 * Sequential color palettes for light mode with the colour in position #2 of the array as the base.
 */
const sequentialLight = {
  blues: ["#E1EAF4", "#8EBCF6", "#4290F0", "#0E58B4", "#03254F"],
};

/**
 * Sequential color palettes for dark mode. These are the reverse of the light mode palettes using the same base color (position 2).
 */
const sequentialDark = {
  blues: ["#03254F", "#0E58B4", "#4290F0", "#A6BFDD", "#E1EAF4"],
};

/** Colours for GeoJSON-based map charts. */
export interface MapColors {
  /** Fill for land / no-data regions. */
  area: string;
  /** Default bubble fill (the chart palette blue). */
  bubble: string;
  /**
   * Sequential ramp (low → high) for shading choropleth regions. Tuned so the
   * lowest band stays clearly distinct from the neutral no-data fill in both
   * modes (light: low = light blue → high = deep blue; dark: low = deep blue →
   * high = bright blue, so higher values read brighter against the dark base).
   */
  scale: string[];
}

/** Neutral land fill per mode; bubbles use the shared categorical palette. */
const mapAreaByMode = {
  light: "#E5E7EB",
  dark: "#2B2C31",
} as const;

/**
 * Choropleth shading ramp per mode (ordered low → high), anchored on the shared
 * chart blue `#4290F0` (same as BubbleMap and `categorical(0)`) so the maps read
 * as one family. Every step stays clearly blue, and the low ends are kept
 * distinct from the neutral no-data fill in both modes.
 */
const mapScaleByMode = {
  light: ["#C8DEFB", "#8FBDF6", "#4290F0", "#1E60BE", "#0A3A7A"],
  dark: ["#26456C", "#2C68BE", "#4290F0", "#79AEF4", "#BBD6FA"],
} as const;

/**
 * xxd-ui-kit (ECHARTS-REVIEW-PLAN D135): when the page carries the xxd design
 * tokens (`--action` is defined on the root element), chart colors come from
 * the tokens so Kumo charts match `Xxd.chartOptions()`: accent, gray 9,
 * accent 8, gray 10, gray 11 for series; muted ink for text; hairline grid.
 * Returns `null` when Kumo is used on its own, so the Kumo palette applies.
 */
export interface XxdChartTokens {
  categorical: string[];
  text: { primary: string; secondary: string };
  grid: string;
  semantic: Record<ChartSemanticColorName, string>;
  area: string;
  scale: string[];
}

export function xxdChartTokens(): XxdChartTokens | null {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function")
    return null;
  const root = getComputedStyle(document.documentElement);
  const v = (name: string) => root.getPropertyValue(name).trim();
  const action = v("--action");
  if (!action) return null;
  return {
    categorical: [action, v("--gray-9"), v("--accent-8"), v("--gray-10"), v("--gray-11")],
    text: { primary: v("--muted"), secondary: v("--muted-2") },
    grid: v("--line"),
    semantic: {
      Attention: v("--danger"),
      Warning: v("--warning"),
      Success: v("--success"),
      Neutral: v("--gray-7"),
      Disabled: v("--gray-7"),
      Skeleton: v("--wash-strong"),
    },
    area: v("--wash-strong"),
    scale: [v("--heat-1"), v("--heat-2"), v("--heat-3"), v("--heat-4")],
  };
}

/** Default series colors for `<Chart>`: the xxd tokens when present, else the Kumo palette. */
export function defaultChartColors(isDarkMode = false): string[] {
  return (
    xxdChartTokens()?.categorical ??
    (isDarkMode ? CHART_DARK_COLORS : CHART_LIGHT_COLORS)
  );
}

/**
 * Ordered list of categorical colors for light mode, indexed by series position.
 * Used as the default ECharts color palette when `isDarkMode` is `false`.
 */
export const CHART_LIGHT_COLORS = [
  ChartCategoricalLightColors.Blue,
  ChartCategoricalLightColors.Yellow,
  ChartCategoricalLightColors.Pink,
  ChartCategoricalLightColors.Purple,
  ChartCategoricalLightColors.Teal,
  ChartCategoricalLightColors.Orange,
];

/**
 * Ordered list of categorical colors for dark mode, indexed by series position.
 * Used as the default ECharts color palette when `isDarkMode` is `true`.
 */
export const CHART_DARK_COLORS = [
  ChartCategoricalDarkColors.Blue,
  ChartCategoricalDarkColors.Yellow,
  ChartCategoricalDarkColors.Pink,
  ChartCategoricalDarkColors.Purple,
  ChartCategoricalDarkColors.Teal,
  ChartCategoricalDarkColors.Orange,
];

/**
 * Utilities for resolving Kumo chart colors by semantic name or series index.
 * All functions accept an `isDarkMode` flag and return the appropriate color string.
 */
export namespace ChartPalette {
  /**
   * Returns the hex color for a named semantic value (status, severity, etc.).
   *
   * @example
   * ```ts
   * ChartPalette.semantic("Attention")           // "#FC574A" (light)
   * ChartPalette.semantic("Warning", true)       // "#F8A054" (dark)
   * ```
   */
  export function semantic(
    name: ChartSemanticColorName,
    isDarkMode = false,
  ): string {
    const xxd = xxdChartTokens();
    if (xxd) return xxd.semantic[name];
    return isDarkMode
      ? ChartSemanticDarkColors[name]
      : ChartSemanticLightColors[name];
  }

  /**
   * Returns the categorical color for a given series index.
   * Wraps around via modulo when `index` exceeds the palette length (6 colors).
   *
   * @example
   * ```ts
   * ChartPalette.categorical(0)        // Blue (light)
   * ChartPalette.categorical(0, true)  // Blue (dark)
   * ChartPalette.categorical(6)        // wraps back to Blue
   * ```
   */
  export function categorical(index: number, isDarkMode = false): string {
    const xxd = xxdChartTokens();
    if (xxd) return xxd.categorical[index % xxd.categorical.length];
    return isDarkMode
      ? CHART_DARK_COLORS[index % CHART_DARK_COLORS.length]
      : CHART_LIGHT_COLORS[index % CHART_LIGHT_COLORS.length];
  }

  /**
   * Returns all steps of a named sequential palette as an array.
   *
   * @example
   * ```ts
   * ChartPalette.sequential("blues")        // 5-step array (light)
   * ChartPalette.sequential("blues", true)  // 5-step array (dark)
   * ```
   */
  export function sequential(
    palette: keyof typeof sequentialLight,
    isDarkMode = false,
  ): string[] {
    const xxd = xxdChartTokens();
    if (xxd) return [...xxd.scale];
    return isDarkMode
      ? [...sequentialDark[palette]]
      : [...sequentialLight[palette]];
  }

  /**
   * Returns the hex color for chart text/labels.
   *
   * @example
   * ```ts
   * ChartPalette.text("primary")        // "#6B7280" (light)
   * ChartPalette.text("primary", true)  // "#9CA3AF" (dark)
   * ChartPalette.text("secondary")      // "#9CA3AF" (light)
   * ```
   */
  export function text(variant: "primary" | "secondary", isDarkMode = false) {
    const xxd = xxdChartTokens();
    if (xxd) return xxd.text[variant];
    const colors = {
      light: { primary: "#6B7280", secondary: "#9CA3AF" },
      dark: { primary: "#9CA3AF", secondary: "#6B7280" },
    };
    return isDarkMode ? colors.dark[variant] : colors.light[variant];
  }

  /** Returns colors for GeoJSON-based map charts. */
  export function mapColors(isDarkMode = false): MapColors {
    const xxd = xxdChartTokens();
    if (xxd)
      return { area: xxd.area, bubble: xxd.categorical[0], scale: [...xxd.scale] };
    const mode = isDarkMode ? "dark" : "light";

    return {
      area: mapAreaByMode[mode],
      bubble: categorical(0, isDarkMode),
      scale: [...mapScaleByMode[mode]],
    };
  }
}
