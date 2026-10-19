import { View } from "@tarojs/components";
import { FileText, Plus } from "@xxd/icons/each";
import { BottomBar, Button, Cell, CellGroup, Empty, Field, Input, Sheet, Text, useToast, XxdPage } from "@xxd/mini";
import { useState } from "react";
import { TABS } from "../../tabs";

export default function Index() {
  const toast = useToast();
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    setItems((list) => [draft.trim(), ...list]);
    setDraft("");
    setOpen(false);
    toast("已添加", { tone: "success" });
  };
  return (
    <XxdPage tabBar={TABS}>
      <View className="page-head">
        <Text variant="heading1">__APP_NAME__</Text>
        <Text variant="secondary">用 @xxd/mini 搭的小程序：直角、墨色、暖黑、系统字体。</Text>
      </View>
      {items.length ? (
        <CellGroup title="列表">
          {items.map((t, i) => (
            <Cell key={`${i}-${t}`} title={t} arrow onClick={() => toast(t)} />
          ))}
        </CellGroup>
      ) : (
        <Empty icon={FileText} title="还没有内容" description="点下面的「新建」加一条。" />
      )}
      {/* 主操作放底部按钮条：自动留安全区，页面底下留出它的高度 */}
      <BottomBar>
        <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
          新建
        </Button>
      </BottomBar>
      <Sheet open={open} onOpenChange={setOpen} title="新建" footer={<Button variant="primary" disabled={!draft.trim()} onClick={add}>添加</Button>}>
        <Field label="内容">
          <Input value={draft} onValueChange={setDraft} placeholder="写点什么" focus={open} confirmType="done" onConfirm={add} />
        </Field>
      </Sheet>
    </XxdPage>
  );
}
