// 命令行说哪种话：--en / --zh 最优先，然后是 XXD_UI_LANG（en / zh），再看系统语言（LC_ALL / LC_MESSAGES / LANG）。
// 系统语言是中文、没设、或者是 C / POSIX（没有偏好），就说中文；别的语言说英文。
let forced = null;

export function setLang(value) {
  forced = value === "en" || value === "zh" ? value : null;
}

export function lang() {
  if (forced) return forced;
  const own = process.env.XXD_UI_LANG;
  if (own) return /^en/i.test(own) ? "en" : "zh";
  const env = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || "";
  if (!env || /^zh/i.test(env) || /^(c|posix)([._@]|$)/i.test(env)) return "zh";
  return "en";
}

/** say("中文", "English")：按当前语言挑一句。 */
export const say = (zh, en) => (lang() === "en" ? en : zh);
export const isEn = () => lang() === "en";
