// 图标规则门禁：DESIGN-PRINCIPLES §7
import { test } from "node:test";
import assert from "node:assert/strict";
import { ICON_ALIASES, ICON_ATTRIBUTES, ICON_NODES, iconSVG, resolveIcon } from "../src/svg.js";
import * as phosphor from "../src/phosphor.js";

// 东西本身是圆的才允许画圆。
const ROUND_ALLOWED = new Set([
  "Search", "SearchX", "Clock", "Clock3", "History", "CircleCheck", "CircleAlert", "CircleX", "CirclePause", "Info",
  "CircleHelp", "Ban", "Blend", "CircleDashed", "CircleDot", "Contrast", "Globe", "Sun", "Ellipsis", "GripVertical",
  "Grip", "Dot", "Circle", "Image", "Images", "ImagePlus", "ImageUp", "Share2", "User", "UserRound", "UserPlus",
  "UserRoundCheck", "UserRoundX", "Users", "Contact", "Key", "Tag", "Tags", "Eye", "ScanEye", "Radio", "Palette",
  "MailSearch", "UserRoundPen",
  // 2026-10 扩充：镜头、车轮、表盘、脸、头像、节点、指孔、硬币、音符……都是本身圆的东西
  "Scissors", "AtSign", "Percent", "CirclePlus", "CircleMinus", "Award", "Rocket", "Target", "Crosshair", "Cog", "Anchor",
  "Timer", "AlarmClock", "CalendarClock", "BellDot", "Focus", "ZoomIn", "ZoomOut", "FileImage", "FileAudio", "FileSearch",
  "FileClock", "FolderSearch", "Smile", "Frown", "Meh", "CirclePlay", "CircleStop", "Music", "ListMusic", "Disc", "Camera",
  "Webcam", "ShoppingCart", "Banknote", "Coins", "CircleDollarSign", "Truck", "UserMinus", "UserSearch", "CircleUser",
  "SquareUser", "PersonStanding", "MapPin", "Compass", "Locate", "LocateFixed", "Route", "Car", "Bike", "Shapes",
  "EllipsisVertical", "GripHorizontal", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest", "GitFork",
]);

test("全局属性：1.5 线宽、圆头、斜接角、不填充", () => {
  assert.equal(ICON_ATTRIBUTES["stroke-width"], 1.5);
  assert.equal(ICON_ATTRIBUTES["stroke-linecap"], "round");
  assert.equal(ICON_ATTRIBUTES["stroke-linejoin"], "miter");
  assert.equal(ICON_ATTRIBUTES.fill, "none");
});

test("每个图标的节点不覆盖线宽/端点/转角，矩形无圆角", () => {
  for (const [name, nodes] of Object.entries(ICON_NODES)) {
    assert.ok(nodes.length > 0, `${name} 为空`);
    for (const [tag, attrs] of nodes) {
      assert.ok(["path", "rect", "circle"].includes(tag), `${name}: 不允许 <${tag}>`);
      for (const banned of ["stroke-width", "stroke-linecap", "stroke-linejoin", "rx", "ry"]) {
        assert.ok(!(banned in attrs), `${name}: 不允许 ${banned}`);
      }
    }
  }
});

test("圆只出现在本身是圆的东西上", () => {
  for (const [name, nodes] of Object.entries(ICON_NODES)) {
    if (nodes.some(([tag]) => tag === "circle")) assert.ok(ROUND_ALLOWED.has(name), `${name} 用了 <circle>，若合理请加入白名单`);
  }
});

test("坐标在 24 网格内", () => {
  for (const [name, nodes] of Object.entries(ICON_NODES)) {
    for (const [tag, a] of nodes) {
      if (tag === "rect") assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= 24 && a.y + a.height <= 24, `${name} rect 越界`);
      if (tag === "circle") assert.ok(a.cx - a.r >= 0 && a.cx + a.r <= 24, `${name} circle 越界`);
    }
  }
});

test("别名都指向存在的图标", () => {
  for (const [alias, target] of Object.entries(ICON_ALIASES)) assert.ok(ICON_NODES[target], `${alias} → ${target}`);
  assert.ok(resolveIcon("CaretDown"));
});

test("iconSVG 输出 ui-icon 并处理无障碍", () => {
  const hidden = iconSVG("Check");
  assert.match(hidden, /class="ui-icon"/);
  assert.match(hidden, /aria-hidden="true"/);
  assert.match(iconSVG("Check", { label: "完成" }), /role="img" aria-label="完成"/);
  assert.throws(() => iconSVG("NoSuchIcon"));
});

test("Phosphor 兼容层导出 Kumo 需要的全部名字", () => {
  const needed = ["ArrowRightIcon", "ArrowSquareOutIcon", "ArrowsClockwise", "CaretDoubleLeftIcon", "CaretDoubleRightIcon",
    "CaretDownIcon", "CaretLeftIcon", "CaretRightIcon", "CaretUpDownIcon", "CheckIcon", "CopyIcon", "CopySimpleIcon", "Eye",
    "EyeSlash", "GlobeHemisphereWestIcon", "Info", "MagnifyingGlassIcon", "MinusIcon", "WarningCircleIcon", "X", "XIcon",
    "IconContext"];
  for (const name of needed) assert.ok(phosphor[name], name);
});
