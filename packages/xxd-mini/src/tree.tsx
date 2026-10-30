// 树（DIAGRAM-PLAN 第二批）：两层画成组织图，三层（或 outline）是缩进的大纲。和网页版 .xxd-tree 同一套类名。
import { View, Text } from "@tarojs/components";
import type { ReactNode } from "react";
import "../styles/tree.mini.css";
import { a11y } from "./aria";
import { cx, mods, warnOnce } from "./util";

const desc = (block: string, d?: ReactNode) => (d != null ? <Text className={`${block}__desc`}>{d}</Text> : null);

export interface TreeNode {
  label: ReactNode;
  description?: ReactNode;
  highlight?: boolean;
  children?: TreeNode[];
}

function TreeItem({ node }: { node: TreeNode }) {
  return (
    <View className="xxd-tree__item" {...a11y({ role: "listitem" })}>
      <View className={cx("xxd-tree__node", mods({ highlight: node.highlight }))}>
        <Text>{node.label}</Text>
        {desc("xxd-tree", node.description)}
      </View>
      {node.children?.length ? (
        <View className="xxd-tree__group" {...a11y({ role: "list" })}>
          {node.children.map((c, i) => (
            <TreeItem key={i} node={c} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export interface TreeProps {
  items: TreeNode[];
  /** 缩进的大纲；不写时三层自己变大纲（手机上组织图放不下第三层） */
  outline?: boolean;
  className?: string;
}

const depthOf = (n: TreeNode[]): number => (n.length ? 1 + Math.max(...n.map((x) => depthOf(x.children ?? []))) : 0);
const sizeOf = (n: TreeNode[]): number => n.reduce((m, x) => m + 1 + sizeOf(x.children ?? []), 0);

export function Tree({ items, outline, className }: TreeProps) {
  const depth = depthOf(items);
  if (depth > 3 || sizeOf(items) > 9) warnOnce("tree", "Tree 超过 3 层或 9 个节点：折叠下一层，或者分页（DIAGRAM-PLAN D145）");
  // 网页版用 :has(.xxd-tree__group .xxd-tree__group) 认出三层，小程序里组件自己加（mini.json 的 has）
  return (
    <View className={cx("xxd-tree", mods({ outline: outline || depth > 2 }), className)} {...a11y({ role: "list" })}>
      {items.map((n, i) => (
        <TreeItem key={i} node={n} />
      ))}
    </View>
  );
}
