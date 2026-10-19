// 所有组件的演示，按 mini.json 的顺序；中英文的组件名也从 mini.json 来
import manifest from "@xxd/mini/mini.json";
import { BATCH1 } from "./batch1";
import { BATCH2 } from "./batch2";
import { BATCH3 } from "./batch3";
import type { Demo } from "./types";

export interface Entry extends Demo {
  zh: string;
  en: string;
  batch: number;
}

const byName = new Map([...BATCH1, ...BATCH2, ...BATCH3].map((d) => [d.name, d]));
export const ENTRIES: Entry[] = manifest.components.flatMap((c: { name: string; zh: string; en: string; batch: number }) => {
  const demo = byName.get(c.name);
  return demo ? [{ ...demo, zh: c.zh, en: c.en, batch: c.batch }] : [];
});
export const findEntry = (name?: string) => ENTRIES.find((e) => e.name === name);
