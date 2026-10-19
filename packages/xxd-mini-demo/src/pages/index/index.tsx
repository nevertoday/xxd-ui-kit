// 首页：组件目录。点一个组件进它的演示页
import Taro from "@tarojs/taro";
import { CheckSquare, Settings } from "@xxd/icons/each";
import { Cell, CellGroup, Icon, Text, XxdPage } from "@xxd/mini";
import { View } from "@tarojs/components";
import { useContext, useEffect } from "react";
import { ENTRIES } from "../../demos";
import { LangCtx, useTr } from "../../i18n";
import { MAIN_TABS } from "../../tabs";

export default function Index() {
  const tr = useTr();
  const { lang } = useContext(LangCtx);
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: tr("小小东 UI", "XXD UI") }).catch(() => {});
  }, [lang]);
  const group = (batch: number, title: string) => (
    <CellGroup title={title}>
      {ENTRIES.filter((e) => e.batch === batch).map((e) => (
        <Cell key={e.name} title={lang === "en" ? e.en : e.zh} value={lang === "en" ? undefined : e.name} arrow onClick={() => Taro.navigateTo({ url: `/pages/component/index?name=${e.name}` })} />
      ))}
    </CellGroup>
  );
  return (
    <XxdPage tabBar={MAIN_TABS(tr)}>
      <View className="demo-hero">
        <Text variant="heading1">{tr("小小东 UI · 小程序", "XXD UI · Mini Program")}</Text>
        <Text variant="secondary">{tr("和网页版同一套令牌和样式：直角、墨色、暖黑、系统字体。", "Same tokens and styles as the web kit: square corners, ink, warm dark, system fonts.")}</Text>
      </View>
      <View style="display:grid;gap:24px;padding-top:16px">
        {group(1, tr("第一批", "Batch 1"))}
        {group(2, tr("第二批", "Batch 2"))}
        {group(3, tr("第三批：手机上常用的", "Batch 3: mobile essentials"))}
      </View>
      <View className="demo-foot">
        <Icon icon={CheckSquare} size={14} /> {tr("待办和设置在下面的标签栏里", "To-do and settings are in the tab bar")} <Icon icon={Settings} size={14} />
      </View>
    </XxdPage>
  );
}
