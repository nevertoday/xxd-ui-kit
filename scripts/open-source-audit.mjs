#!/usr/bin/env node
// 开源自查：列出仓库里不该公开的内部引用。只读，不改任何文件。推送前跑一次。
//   node scripts/open-source-audit.mjs          人看的报告
//   node scripts/open-source-audit.mjs --json   机器读
//   node scripts/open-source-audit.mjs --check  CI 用：STRICT 里的几项有一处就退出 1（其余几项只报告）
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter((f) => f !== "scripts/open-source-audit.mjs")
  .filter((f) => f && !/(^|\/)(pnpm-lock\.yaml|CHANGELOG\.md)$/.test(f) && !/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|pdf)$/i.test(f));

export const CHECKS = [
  { id: "local-path", label: "本机路径", re: /\/Volumes\/T7-usb|\/Users\/admin|\/private\/tmp\/claude-/g },
  { id: "email", label: "个人邮箱", re: /[\w.+-]+@gmail\.com/g },
  { id: "wechat", label: "微信号", re: /newbe2012/g },
  { id: "member-domain", label: "会员站域名", re: /vip\.xiaoxiaodong\.ai|xiaoxiaodong\.ai/g },
  { id: "store-id", label: "Chrome 商店 ID", re: /\b[a-p]{32}\b/g },
  // 应当是 0 处。
  { id: "proprietary", label: "旧的保留所有权利声明", re: /UNLICENSED|小小东 \(xiaoxiaodong\.ai\)\. All rights reserved|\u95ed\u6e90/g },
  { id: "private-flag", label: "private: true（要发 npm 的包再改）", re: /"private":\s*true/g },
  { id: "upstream-brand", label: "上游 Cloudflare 品牌 / 账号", re: /cloudflare-logo|CloudflareLogo|account_id|kumo-ui\.com/g },
];

// 必须是 0 处的；会员站域名、private、上游品牌在文档和上游代码里有正当的出现，只报告
export const STRICT = ["local-path", "email", "wechat", "store-id", "proprietary"];

const findings = Object.fromEntries(CHECKS.map((c) => [c.id, []]));
for (const file of files) {
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  for (const check of CHECKS) {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      check.re.lastIndex = 0;
      if (check.re.test(line)) findings[check.id].push(`${file}:${i + 1}`);
    });
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  for (const check of CHECKS) {
    const hits = findings[check.id];
    console.log(`${hits.length ? "•" : "✓"} ${check.label}：${hits.length} 处`);
    for (const h of hits.slice(0, 8)) console.log(`    ${h}`);
    if (hits.length > 8) console.log(`    …还有 ${hits.length - 8} 处（--json 看全部）`);
  }
}

if (process.argv.includes("--check")) {
  const bad = STRICT.filter((id) => findings[id].length);
  if (bad.length) {
    console.error(`✗ 开源自查没过：${bad.map((id) => `${CHECKS.find((c) => c.id === id).label} ${findings[id].length} 处`).join("、")}`);
    process.exit(1);
  }
  console.log("✓ 开源自查：本机路径、邮箱、微信号、商店 ID、旧版权声明都是 0 处");
}
