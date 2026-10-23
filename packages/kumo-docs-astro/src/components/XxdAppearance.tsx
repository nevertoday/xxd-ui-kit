import { useEffect, useState } from "react";
import { ACCENT_PRESETS } from "@xxd/tokens";

type Corners = "square" | "rounded";

/** 文档站头部：圆角开关 + 主色。设置由 public/xxd/boot.js（@xxd/tokens）应用并记住。 */
export function XxdAppearance() {
  const [corners, setCorners] = useState<Corners>("square");
  const [accent, setAccent] = useState("");

  useEffect(() => {
    const s = (window as any).XxdTheme?.read() ?? {};
    setCorners(s.corners === "rounded" ? "rounded" : "square");
    setAccent(s.accent ?? "");
  }, []);

  const update = (patch: { corners?: Corners; accent?: string }) => {
    (window as any).XxdTheme?.set(patch);
    if (patch.corners) setCorners(patch.corners);
    if (patch.accent !== undefined) setAccent(patch.accent);
  };

  return (
    <div className="flex items-center gap-3 text-xs text-kumo-subtle">
      <button
        type="button"
        className="h-7 border border-kumo-line px-2 text-kumo-default hover:bg-kumo-tint rounded-md"
        aria-pressed={corners === "rounded"}
        onClick={() => update({ corners: corners === "rounded" ? "square" : "rounded" })}
        title="切换直角 / 圆角"
      >
        {corners === "rounded" ? "圆角" : "直角"}
      </button>
      <label className="flex items-center gap-1">
        主色
        <select
          className="h-7 bg-transparent text-kumo-default"
          value={accent}
          onChange={(e) => update({ accent: e.target.value })}
        >
          {ACCENT_PRESETS.map((p) => (
            <option key={p.id || "ink"} value={p.id}>
              {p.zh}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
