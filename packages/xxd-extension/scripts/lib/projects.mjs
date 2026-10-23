// 记住接入过的项目：new / init / sync 过的目录记在 ~/.config/xxd-ui/projects.json，
// 之后 status、sync --all 不用再一个个写目录。XXD_UI_HOME 可以换位置（测试用）。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

export function projectsFile() {
  const base = process.env.XXD_UI_HOME || join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "xxd-ui");
  return join(base, "projects.json");
}

export function listProjects() {
  const file = projectsFile();
  if (!existsSync(file)) return [];
  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(data.projects) ? data.projects : [];
  } catch {
    return [];
  }
}

function save(projects) {
  const file = projectsFile();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ projects: [...new Set(projects)].sort((a, b) => a.localeCompare(b)) }, null, 2) + "\n");
}

export function rememberProject(dir) {
  const abs = resolve(dir);
  const list = listProjects();
  if (!list.includes(abs)) save([...list, abs]);
}

export function forgetProject(dir) {
  const abs = resolve(dir);
  const list = listProjects();
  if (!list.includes(abs)) return false;
  save(list.filter((p) => p !== abs));
  return true;
}

/** 一个目录是不是接入了的项目（插件有 manifest.json，网站有 xxd.config.json）。 */
export const isProject = (dir) => existsSync(join(dir, "manifest.json")) || existsSync(join(dir, "xxd.config.json"));
