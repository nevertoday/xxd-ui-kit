// 把色阶写进 tokens.css 标明的区域（/* @scales:<名字> */ … /* @scales:end */）。docs/maintainers/COLOR-SCALE-PLAN.md S2
//   node scripts/scales.mjs          重新生成
//   node scripts/scales.mjs --check  只检查是不是最新的（build 和测试会跑）
// 生成的是：五族（gray accent success danger warning）× 12 级的数字令牌、实心底上的字（--accent-on……）、用途名（--danger-tint……），
// 以及主色块里「数字令牌指向运行时算的值」的那几行。灰的用途名就是现有的 --bg、--wash、--line……（值钉在对应的级上，见 GRAY_PINS）。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateFamilies, roleVars, scaleVars } from "../src/scales.js";

const file = fileURLToPath(new URL("../tokens.css", import.meta.url));

export function regions() {
  const fam = generateFamilies({});
  const lines = (vars) => Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  const custom = (sfx) => {
    const out = {};
    for (const f of ["gray", "accent"]) for (let i = 1; i <= 12; i += 1) out[`--${f}-${i}`] = `var(--${f}-${i}-custom${sfx})`;
    out["--accent-on"] = `var(--accent-on-custom${sfx})`;
    return out;
  };
  return {
    light: lines({ ...scaleVars(fam.light), ...roleVars() }),
    dark: lines({ ...scaleVars(fam.dark), ...roleVars() }),
    accent: lines(custom("")),
    "dark-accent": lines(custom("-dark")),
  };
}

export function applyScales(css) {
  const r = regions();
  // 开头标记到最近的结束标记（不跨过下一个开头标记），中间整段换掉
  return css.replace(/\/\* @scales:([\w-]+) \*\/((?:(?!\/\* @scales:)[\s\S])*?)\/\* @scales:end \*\//g, (_, name) => {
    if (!(name in r)) throw new Error(`tokens.css 里不认识的色阶区域：${name}`);
    return `/* @scales:${name} */\n${r[name]}\n  /* @scales:end */`;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = readFileSync(file, "utf8");
  const next = applyScales(css);
  if (process.argv.includes("--check")) {
    if (next !== css) {
      console.error("✗ tokens.css 里的色阶不是最新的：node packages/xxd-tokens/scripts/scales.mjs");
      process.exit(1);
    }
    console.log("✓ tokens.css 的色阶是最新的");
  } else {
    writeFileSync(file, next);
    console.log("tokens.css：色阶已写入");
  }
}
