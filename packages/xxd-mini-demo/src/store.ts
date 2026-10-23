// 待办的数据：存在本机（Taro 存储），不联网
import Taro from "@tarojs/taro";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  tag: "work" | "life" | "none";
  createdAt: number;
}

const KEY = "xxd-mini-demo-todos";

export function loadTodos(): Todo[] {
  try {
    const raw = Taro.getStorageSync(KEY);
    const list = typeof raw === "string" ? (raw ? JSON.parse(raw) : null) : raw;
    if (Array.isArray(list)) return list;
  } catch {
    /* 坏了就当没有 */
  }
  return [];
}

export function saveTodos(list: Todo[]) {
  try {
    Taro.setStorageSync(KEY, JSON.stringify(list));
  } catch {
    /* 存满了：这次照样能用 */
  }
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
