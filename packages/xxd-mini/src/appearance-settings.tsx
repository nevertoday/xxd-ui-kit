// 外观设置：主题、圆角、主色、密度、按钮质感。和网页版 @xxd/react 的 AppearanceSettings 一样，改了马上全小程序生效、存在本机。
import { View } from "@tarojs/components";
import { ACCENT_PRESETS } from "@xxd/tokens";
import "../styles/appearance.mini.css";
import { a11y } from "./aria";
import { Cell, CellGroup } from "./cell";
import { Switch } from "./choice";
import { useXxd } from "./provider";
import { Segmented } from "./segmented";
import { cx, mods } from "./util";

const T = {
  zh: { appearance: "外观", theme: "主题", light: "亮", dark: "暗", system: "跟随系统", corners: "圆角", cornersDesc: "缺省是直角", accent: "主色", density: "密度", comfortable: "宽松", compact: "紧凑", finish: "按钮质感", flat: "纯平", material: "质感" },
  en: { appearance: "Appearance", theme: "Theme", light: "Light", dark: "Dark", system: "System", corners: "Rounded corners", cornersDesc: "Square by default", accent: "Accent", density: "Density", comfortable: "Comfortable", compact: "Compact", finish: "Button finish", flat: "Flat", material: "Material" },
};

export interface SwatchesProps {
  value: string;
  onValueChange: (value: string) => void;
  presets?: readonly { id: string; name: string; zh?: string }[];
  label?: string;
}

/** 主色色块：墨色 + 11 个预设，一组单选 */
export function Swatches({ value, onValueChange, presets = ACCENT_PRESETS, label }: SwatchesProps) {
  const { lang } = useXxd();
  return (
    <View className="xxd-swatches" {...a11y({ role: "radiogroup", label: label ?? T[lang].accent })}>
      {presets.map((p) => {
        const on = (value || "") === p.id;
        return (
          <View
            key={p.id || "ink"}
            className={cx("xxd-swatch", mods({ "role-radio": true, checked: on }))}
            style={p.id ? `--swatch:${p.id}` : undefined}
            hoverClass="is-hover"
            onClick={() => onValueChange(p.id)}
            {...a11y({ role: "radio", checked: on, label: lang === "en" ? p.name : p.zh || p.name })}
          />
        );
      })}
    </View>
  );
}

export interface AppearanceSettingsProps {
  showDensity?: boolean;
  showFinish?: boolean;
  /** 产品锁定直角时不给圆角开关 */
  lockCorners?: boolean;
  title?: string;
}

export function AppearanceSettings({ showDensity = true, showFinish = false, lockCorners = false, title }: AppearanceSettingsProps) {
  const { settings, update, lang } = useXxd();
  const t = T[lang];
  return (
    <CellGroup title={title ?? t.appearance}>
      <Cell
        title={t.theme}
        stack
        control={<Segmented block label={t.theme} value={settings.theme} onValueChange={(theme) => update({ theme })} options={[{ value: "system", label: t.system }, { value: "light", label: t.light }, { value: "dark", label: t.dark }]} />}
      />
      {!lockCorners && <Cell title={t.corners} description={t.cornersDesc} control={<Switch label={t.corners} checked={settings.corners === "rounded"} onCheckedChange={(on) => update({ corners: on ? "rounded" : "square" })} />} />}
      <Cell title={t.accent} stack control={<Swatches value={settings.accent} onValueChange={(accent) => update({ accent })} />} />
      {showDensity && <Cell title={t.density} control={<Segmented label={t.density} value={settings.density} onValueChange={(density) => update({ density })} options={[{ value: "comfortable", label: t.comfortable }, { value: "compact", label: t.compact }]} />} />}
      {showFinish && <Cell title={t.finish} control={<Segmented label={t.finish} value={settings.finish} onValueChange={(finish) => update({ finish })} options={[{ value: "flat", label: t.flat }, { value: "material", label: t.material }]} />} />}
    </CellGroup>
  );
}
