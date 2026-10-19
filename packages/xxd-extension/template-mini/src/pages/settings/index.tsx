import { View } from "@tarojs/components";
import { AppearanceSettings, XxdPage } from "@xxd/mini";
import { TABS } from "../../tabs";

export default function Settings() {
  return (
    <XxdPage tabBar={TABS}>
      <View style="padding-top:16px">
        <AppearanceSettings />
      </View>
    </XxdPage>
  );
}
