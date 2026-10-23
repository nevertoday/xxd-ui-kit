// 组件规格（设计师评审 V5-1）：12 个常用组件，每个一份最小的样品和要量的部位。
// 数字不写在这里：组件页在浏览器里把样品按「标准 / 紧凑 × 直角 / 圆角」各渲染一份，读计算样式，再反查是哪个令牌。
// 所以规格永远和 CSS 一致；量出来的值找不到令牌，audit 的「规格」一项会失败。
//
// 部位：[名字（中, 英）, 选择器（相对样品）, 要量的属性, 首选令牌（可选）]
//   同一个值常常对得上好几个令牌（12px 既是按钮小号的内边距，也是输入框的内边距）：先按这个部位的首选令牌查
//   属性：height 高、width 宽、padX 左右内边距、padY 上下内边距、gap 间隔、radius 圆角、font 字号 / 行高、weight 字重、
//        border 边框、icon 图标尺寸（部位本身是 svg）、marginTop 上外边距

/** @type {Record<string, { sample: (tr: (zh: string, en: string) => string) => string, parts: [string, string, string, string[], Record<string, string[]>?][] }>} */
export const SPECS = {
  Button: {
    sample: (tr) => `<button class="xxd-btn" data-variant="primary"><i data-xxd-icon="Send" data-size="16"></i>${tr("写入", "Post")}</button>`,
    parts: [
      ["按钮", "Button", ".xxd-btn", ["height", "padX", "gap", "radius", "font", "weight", "border"], { height: ["--control-h"], padX: ["--control-pad-x"] }],
      ["图标", "Icon", ".xxd-btn > svg", ["icon"]],
    ],
  },
  Field: {
    sample: (tr) => `<div class="xxd-field" style="width:100%"><label class="xxd-label" for="spec-f">${tr("标题", "Title")}</label><input class="xxd-input" id="spec-f" placeholder="${tr("给这篇文章起个名字", "Name this post")}" aria-describedby="spec-fh"><p class="xxd-help" id="spec-fh">${tr("最多 100 个字", "Up to 100 characters")}</p></div>`,
    parts: [
      ["标签", "Label", ".xxd-label", ["font", "weight"]],
      ["输入框", "Input", ".xxd-input", ["height", "padX", "radius", "font", "border"], { height: ["--control-h"], padX: ["--field-pad-x"] }],
      ["说明", "Help", ".xxd-help", ["font"]],
      ["字段内的间隔", "Gap inside the field", ".xxd-field", ["gap"]],
    ],
  },
  Select: {
    sample: (tr) => `<label class="xxd-select" style="width:100%"><select aria-label="${tr("图片质量", "Image quality")}"><option>${tr("高", "High")}</option></select></label>`,
    parts: [["选择框", "Select", ".xxd-select > select", ["height", "padX", "radius", "font", "border"], { height: ["--control-h"], padX: ["--field-pad-x", "--field-icon-slot"] }]],
  },
  Checkbox: {
    sample: (tr) => `<label class="xxd-choice"><input type="checkbox" class="xxd-check" checked>${tr("智能标点", "Smart punctuation")}</label>`,
    parts: [
      ["方框", "Box", ".xxd-check", ["width", "height", "radius", "border"], { width: ["--choice-size"], height: ["--choice-size"] }],
      ["选项", "Option", ".xxd-choice", ["gap", "font"]],
    ],
  },
  Radio: {
    sample: (tr) => `<fieldset class="xxd-choices"><legend>${tr("写入方式", "Write mode")}</legend><label class="xxd-choice"><input type="radio" class="xxd-radio" name="spec-r" checked>${tr("只写这一篇", "Only this post")}</label><label class="xxd-choice"><input type="radio" class="xxd-radio" name="spec-r">${tr("全部写入", "Write all")}</label></fieldset>`,
    parts: [
      ["圆点", "Dot", ".xxd-radio", ["width", "height", "border"], { width: ["--choice-size"], height: ["--choice-size"] }],
      ["一组", "Group", ".xxd-choices", ["gap"]],
      ["组标题", "Legend", ".xxd-choices > legend", ["font", "weight"]],
    ],
  },
  Switch: {
    sample: (tr) => `<label class="xxd-choice"><input type="checkbox" role="switch" class="xxd-switch" checked>${tr("完成音效", "Done sound")}</label>`,
    parts: [["开关", "Switch", ".xxd-switch", ["width", "height", "radius", "border"], { width: ["--switch-w"], height: ["--switch-h"] }]],
  },
  Tabs: {
    sample: (tr) => `<div class="xxd-tabs" role="tablist" style="width:100%"><button role="tab" aria-selected="true">${tr("写作", "Write")}</button><button role="tab">${tr("记录", "History")}</button></div>`,
    parts: [
      ["标签", "Tab", "[role=tab]", ["height", "font", "weight"], { height: ["--control-h"] }],
      ["标签之间", "Between tabs", ".xxd-tabs", ["gap"]],
    ],
  },
  Segmented: {
    sample: (tr) => `<div class="xxd-segmented" role="radiogroup" aria-label="${tr("类型", "Type")}"><button role="radio" aria-checked="true">${tr("文本", "Text")}</button><button role="radio" aria-checked="false">${tr("图片", "Image")}</button></div>`,
    parts: [
      ["托盘", "Tray", ".xxd-segmented", ["height", "padX", "radius"]],
      ["一段", "Segment", "[role=radio]", ["padX", "radius", "font", "weight"]],
    ],
  },
  List: {
    sample: (tr) => `<ul class="xxd-list" style="width:100%"><li class="xxd-list__item"><div class="xxd-list__main"><div class="xxd-list__title">${tr("一篇长文", "A long post")}</div><div class="xxd-list__meta">${tr("今天 14:02", "Today 14:02")}</div></div></li></ul>`,
    parts: [
      ["行", "Row", ".xxd-list__item", ["padX", "padY"], { padY: ["--list-row-pad-y"] }],
      ["标题", "Title", ".xxd-list__title", ["font", "weight"]],
      ["说明", "Meta", ".xxd-list__meta", ["font"]],
    ],
  },
  SettingsGroup: {
    sample: (tr) => `<section class="xxd-group" style="width:100%"><h2 class="xxd-group__title">${tr("写入", "Writing")}</h2><div class="xxd-group__body"><div class="xxd-row"><div class="xxd-row__text"><div class="xxd-row__title">${tr("写入标题", "Write title")}</div><div class="xxd-row__desc">${tr("第一行作为文章标题", "First line becomes the title")}</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" aria-label="${tr("写入标题", "Write title")}"></div></div></div></section>`,
    parts: [
      ["组标题", "Group title", ".xxd-group__title", ["font", "weight"]],
      ["框", "Frame", ".xxd-group__body", ["radius", "border"]],
      ["行", "Row", ".xxd-row", ["padX", "padY", "gap"], { padX: ["--row-pad-x"], padY: ["--row-pad-y"] }],
      ["行标题", "Row title", ".xxd-row__title", ["font", "weight"]],
      ["行说明", "Row note", ".xxd-row__desc", ["font"]],
    ],
  },
  Dialog: {
    sample: (tr) => `<div class="xxd-dialog" data-static role="dialog" aria-label="${tr("写入哪篇文章？", "Post to which article?")}" style="width:100%"><div class="xxd-dialog__head"><h2 class="xxd-dialog__title">${tr("写入哪篇文章？", "Post to which article?")}</h2></div><div class="xxd-dialog__body"><p>${tr("默认不会替换已有内容。", "Existing content is kept.")}</p></div><div class="xxd-dialog__actions"><button class="xxd-btn ui-dialog-cancel">${tr("取消", "Cancel")}</button><button class="xxd-btn" data-variant="primary">${tr("写入", "Post")}</button></div></div>`,
    parts: [
      ["外框", "Frame", ".xxd-dialog", ["radius", "border"]],
      ["标题", "Title", ".xxd-dialog__title", ["font", "weight"]],
      ["正文", "Body", ".xxd-dialog__body", ["padX", "font"], { padX: ["--inset-lg"] }],
      ["按钮区", "Actions", ".xxd-dialog__actions", ["padX", "gap"], { padX: ["--inset-lg"], gap: ["--gap-items"] }],
    ],
  },
  Toast: {
    sample: (tr) => `<div class="xxd-toast" role="status">${tr("已保存草稿", "Draft saved")}</div>`,
    parts: [["提示", "Toast", ".xxd-toast", ["padX", "padY", "radius", "font", "border"], { padX: ["--inset-md"] }]],
  },
};

/** 每种属性反查哪些令牌（按顺序优先）。值相同的令牌有几个时都列出来 */
export const SPEC_TOKENS = {
  height: ["--control-h", "--control-h-sm", "--control-h-xs", "--icon-button", "--hit-min", "--tab-h", "--row-h", "--choice-size", "--switch-h"],
  width: ["--control-h", "--control-h-sm", "--control-h-xs", "--icon-button", "--choice-size", "--switch-w"],
  padX: ["--field-icon-slot", "--control-pad-x", "--control-pad-x-sm", "--control-pad-x-lg", "--field-pad-x", "--row-pad-x", "--space-0-5", "--space-1", "--space-1-5", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-8", "--inset-sm", "--inset-md", "--inset-lg"],
  padY: ["--row-pad-y", "--list-row-pad-y", "--space-0-5", "--space-1", "--space-1-5", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-8", "--inset-sm-y", "--inset-md-y", "--inset-lg-y"],
  gap: ["--space-0-5", "--space-1", "--space-1-5", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-8", "--gap-tight", "--gap-items", "--gap-block", "--gap-group"],
  radius: ["--r-xs", "--r-sm", "--r-md", "--r-lg", "--r-pill", "--r-circle"],
  font: ["--text-2xs", "--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl", "--text-xxl", "--text-display"],
  leading: ["--leading-xs", "--leading-sm", "--leading-md", "--leading-lg", "--leading-xl", "--leading-display"],
  weight: ["--weight-regular", "--weight-medium", "--weight-strong"],
  icon: ["--icon-sm", "--icon-md", "--icon-lg", "--icon-nav", "--icon-rail"],
};

/** 四种外观：标准 / 紧凑 × 直角 / 圆角（圆角在一块里用局部变量打开，和圆角页一样） */
export const SPEC_MODES = [
  ["comfortable", "square"],
  ["comfortable", "rounded"],
  ["compact", "square"],
  ["compact", "rounded"],
];
