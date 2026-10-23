// 外观设置：主题、圆角、主色、密度、按钮质感、语言。改了马上全小程序生效，存在本机
import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { AppearanceSettings, Button, Cell, CellGroup, Segmented, Text, useXxd, XxdPage } from "@xxd/mini";
import { useContext, useEffect } from "react";
import { LangCtx, useTr } from "../../i18n";
import { MAIN_TABS } from "../../tabs";

export default function Settings() {
  const tr = useTr();
  const { lang, setLang } = useContext(LangCtx);
  const x = useXxd();
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: tr("外观", "Appearance") }).catch(() => {});
  }, [tr]);
  return (
    <XxdPage tabBar={MAIN_TABS(tr)}>
      <View className="demo-hero">
        <Text variant="heading1">{tr("外观", "Appearance")}</Text>
        <Text variant="secondary">{tr("改了马上生效，所有页面一起变。", "Changes apply right away, on every page.")}</Text>
      </View>
      <View style="display:grid;gap:24px;padding-top:16px">
        <AppearanceSettings showFinish />
        <CellGroup title={tr("语言", "Language")}>
          <Cell title={tr("界面语言", "Interface")} control={<Segmented label={tr("语言", "Language")} value={lang} onValueChange={setLang} options={[{ value: "zh", label: "中文" }, { value: "en", label: "English" }]} />} />
        </CellGroup>
        <CellGroup title={tr("现在的外观", "Current")}>
          <Cell title={tr("主题", "Theme")} value={x.theme === "dark" ? tr("暗", "Dark") : tr("亮", "Light")} />
          <Cell title={tr("系统", "System")} value={x.system === "dark" ? tr("暗", "Dark") : tr("亮", "Light")} />
        </CellGroup>
      </View>
      <View className="demo-block" style="padding-top:24px">
        <Button block onClick={() => x.update({ theme: "system", corners: "square", accent: "", density: "comfortable", finish: "flat" })}>
          {tr("恢复缺省", "Reset to defaults")}
        </Button>
      </View>
    </XxdPage>
  );
}
