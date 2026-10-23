// 一个组件的演示页：/pages/component/index?name=Button。展示站嵌的 H5 也是这一页（加 &embed=1 去掉页头）
import { View } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { Empty, Text, XxdPage } from "@xxd/mini";
import { useContext, useEffect } from "react";
import { findEntry } from "../../demos";
import { LangCtx, useTr } from "../../i18n";

export default function ComponentPage() {
  const { params } = useRouter();
  const tr = useTr();
  const { lang } = useContext(LangCtx);
  const entry = findEntry(params.name);
  const embed = params.embed === "1";
  const title = entry ? (lang === "en" ? entry.en : `${entry.zh} ${entry.name}`) : tr("组件", "Component");
  useEffect(() => {
    Taro.setNavigationBarTitle({ title }).catch(() => {});
  }, [title]);
  if (!entry) return <XxdPage><Empty title={tr("没有这个组件", "No such component")} /></XxdPage>;
  return (
    <XxdPage>
      {!embed && (
        <View className="demo-hero">
          <Text variant="heading2">{title}</Text>
        </View>
      )}
      <View className={entry.bleed ? "demo-bleed" : "demo-block"} style={embed ? "padding-top:16px" : undefined}>
        {entry.render(tr)}
      </View>
    </XxdPage>
  );
}
