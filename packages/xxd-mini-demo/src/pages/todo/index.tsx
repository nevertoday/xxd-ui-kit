// 待办：真能用的一页（也是 @xxd/mini 的试点）。新建（底部按钮条）、勾选、左滑删除、长按出更多操作（轻震一下）、按标签筛选，数据存在本机。
import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { CheckSquare, Plus } from "@xxd/icons/each";
import { ActionSheet, Badge, BottomBar, Button, CellGroup, Checkbox, Dialog, Empty, Field, Input, Segmented, Sheet, Swipe, SwipeGroup, Text, useLongPress, useToast, XxdPage } from "@xxd/mini";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTr } from "../../i18n";
import { loadTodos, newId, saveTodos, type Todo } from "../../store";
import { MAIN_TABS } from "../../tabs";

type Filter = "all" | "open" | "done";

export default function TodoPage() {
  const tr = useTr();
  const toast = useToast();
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [filter, setFilter] = useState<Filter>("open");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState<Todo["tag"]>("none");
  const [menuFor, setMenuFor] = useState<Todo | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => saveTodos(todos), [todos]);
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: tr("今日待办", "Today") }).catch(() => {});
  }, [tr]);

  const shown = useMemo(() => todos.filter((t) => (filter === "all" ? true : filter === "open" ? !t.done : t.done)), [todos, filter]);
  const openCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - openCount;

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setTodos((list) => [{ id: newId(), text, done: false, tag, createdAt: Date.now() }, ...list]);
    setDraft("");
    setAdding(false);
    toast(tr("已添加", "Added"), { tone: "success" });
  };
  const toggle = (id: string, done: boolean) => setTodos((list) => list.map((t) => (t.id === id ? { ...t, done } : t)));
  const remove = (item: Todo) => {
    setTodos((list) => list.filter((t) => t.id !== item.id));
    toast(tr("已删除", "Deleted"), { action: { label: tr("撤销", "Undo"), onClick: () => setTodos((list) => [item, ...list].sort((a, b) => b.createdAt - a.createdAt)) } });
  };
  const tagLabel = (t: Todo["tag"]) => (t === "work" ? tr("工作", "Work") : t === "life" ? tr("生活", "Life") : "");

  return (
    <XxdPage tabBar={MAIN_TABS(tr)}>
      <View className="demo-hero">
        <Text variant="heading1">{tr("今日待办", "Today")}</Text>
        <Text variant="secondary">{todos.length ? tr(`还有 ${openCount} 件没做，做完了 ${doneCount} 件`, `${openCount} to do, ${doneCount} done`) : tr("写下今天要做的事", "Write down what to do today")}</Text>
      </View>
      <View className="demo-block">
        <Segmented
          block
          label={tr("筛选", "Filter")}
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "open", label: tr(`未完成 ${openCount}`, `Open ${openCount}`) },
            { value: "done", label: tr(`已完成 ${doneCount}`, `Done ${doneCount}`) },
            { value: "all", label: tr("全部", "All") },
          ]}
        />
      </View>
      {shown.length ? (
        <CellGroup>
          <SwipeGroup>
          {shown.map((t) => (
            <Swipe key={t.id} actions={[{ label: tr("删除", "Delete"), danger: true, onClick: () => remove(t) }]}>
              <TodoRow onLongPress={() => setMenuFor(t)}>
                <Checkbox checked={t.done} onCheckedChange={(on) => toggle(t.id, on)} label={t.text}>
                  <Text className={t.done ? "todo-done" : undefined}>{t.text}</Text>
                </Checkbox>
                {t.tag !== "none" && <Badge tone={t.tag === "work" ? "action" : undefined}>{tagLabel(t.tag)}</Badge>}
              </TodoRow>
            </Swipe>
          ))}
          </SwipeGroup>
        </CellGroup>
      ) : (
        <Empty
          icon={CheckSquare}
          title={filter === "done" ? tr("还没有做完的", "Nothing done yet") : tr("没有要做的事", "Nothing to do")}
          description={filter === "open" ? tr("点下面的「新建」写一件。", "Tap “New” below to add one.") : undefined}
        />
      )}
      {doneCount > 0 && (
        <View className="demo-block" style="display:flex;justify-content:center">
          <Button variant="ghost" size="sm" onClick={() => setClearing(true)}>
            {tr("清掉已完成的", "Clear done")}
          </Button>
        </View>
      )}
      {/* 主操作放底部按钮条：页面底下自动留出位置，轻提示浮在它上面，不会盖住最后一行（MINI-REVIEW-PLAN U4） */}
      <BottomBar>
        <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
          {tr("新建", "New")}
        </Button>
      </BottomBar>

      <Sheet
        open={adding}
        onOpenChange={setAdding}
        title={tr("新建待办", "New to-do")}
        footer={
          <Button variant="primary" disabled={!draft.trim()} onClick={add}>
            {tr("添加", "Add")}
          </Button>
        }
      >
        <View style="display:grid;gap:16px">
          <Field label={tr("要做什么", "What to do")}>
            <Input value={draft} onValueChange={setDraft} placeholder={tr("比如：下午 5 点前交周报", "e.g. Send the weekly report by 5pm")} maxLength={60} focus={adding} confirmType="done" onConfirm={add} />
          </Field>
          <Field label={tr("标签", "Tag")}>
            <Segmented
              block
              label={tr("标签", "Tag")}
              value={tag}
              onValueChange={setTag}
              options={[
                { value: "none", label: tr("不加", "None") },
                { value: "work", label: tr("工作", "Work") },
                { value: "life", label: tr("生活", "Life") },
              ]}
            />
          </Field>
        </View>
      </Sheet>

      <ActionSheet
        open={menuFor != null}
        onOpenChange={(o) => !o && setMenuFor(null)}
        title={menuFor?.text}
        actions={
          menuFor
            ? [
                { label: menuFor.done ? tr("标成没做完", "Mark as open") : tr("标成做完了", "Mark as done"), onClick: () => toggle(menuFor.id, !menuFor.done) },
                { label: tr("复制文字", "Copy text"), onClick: () => Taro.setClipboardData({ data: menuFor.text }).catch(() => {}) },
                { label: tr("删除", "Delete"), danger: true, onClick: () => remove(menuFor) },
              ]
            : []
        }
      />

      <Dialog
        open={clearing}
        onOpenChange={setClearing}
        title={tr(`清掉 ${doneCount} 件已完成的？`, `Clear ${doneCount} done items?`)}
        description={tr("清掉以后找不回来。", "This can't be undone.")}
        confirm={{ label: tr("清掉", "Clear"), danger: true, onClick: () => setTodos((list) => list.filter((t) => !t.done)) }}
      />

    </XxdPage>
  );
}

/** 一行待办：长按出更多操作，长按生效时轻震一下 */
function TodoRow({ children, onLongPress }: { children?: ReactNode; onLongPress: () => void }) {
  return (
    <View className="xxd-row todo-row" onLongPress={useLongPress(onLongPress)}>
      {children}
    </View>
  );
}
