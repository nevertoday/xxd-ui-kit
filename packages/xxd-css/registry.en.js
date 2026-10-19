// registry.json 的英文版（展示站 /en/ 用）。按组件名对应；只写需要翻译的字段，没写的沿用 registry.json
// （类名、data-* 取值这些本来就是英文）。测试保证：中文里有汉字的字段，这里都有英文，而且英文里没有汉字。
export const categories = {
  基础: "Basics",
  操作: "Actions",
  表单: "Forms",
  导航: "Navigation",
  设置: "Settings",
  浮层: "Overlays",
  反馈: "Feedback",
  内容: "Content",
  展示: "Data display",
};

export const components = {
  Text: {
    title: "Text styles",
    summary: "A fixed set of sizes for titles, body, captions and monospace. Hierarchy comes from size and weight, not color.",
    attributes: {
      "data-variant": "display | heading1 | heading2 | heading3 | body | secondary | caption | mono | mono-secondary | success | danger | warning",
      "data-size": "xs | sm | base | lg",
      "data-truncate": "Truncate to one line",
    },
    markup: `<div class="xxd-stack">
  <div class="xxd-text-pair">
    <h2 class="xxd-text" data-variant="heading2">Appearance</h2>
    <p class="xxd-text" data-variant="caption">Only affects this extension</p>
  </div>
  <p class="xxd-text">Body 13px <span class="xxd-text" data-variant="mono">--r-sm</span></p>
</div>`,
    rules: ["Weights are 400 / 500 / 600 only", "Related text sits closer together", "Never change letter spacing", "Inline monospace is 0.92em"],
    a11y: [
      "Use real h1–h3 in page order (no skipped levels); never fake a heading with a bold p",
      "Captions use --muted (≥ 4.5:1), nothing lighter",
    ],
  },
  Interaction: {
    title: "Interaction utilities",
    summary: "Small interaction helpers: actions that appear on hover (.xxd-reveal), whole-row click targets, press-down feedback.",
    markup: `<div class="xxd-row xxd-frame"><div class="xxd-row__text">Hover this row</div><button class="xxd-btn xxd-reveal" data-size="xs">Edit</button></div>
<div class="xxd-concentric xxd-frame" style="--pad:4px;width:fit-content;max-width:100%"><button class="xxd-btn" data-size="sm">Concentric corners</button></div>`,
    js: `Xxd.showBubble(button, "Copied")`,
    rules: [
      "Hover changes instantly on enter and fades back over 140ms on leave",
      "Hover-only actions: always visible on touch, reachable by keyboard",
      "Concentric corners: outer = inner + padding",
    ],
    a11y: [
      "Hover-only buttons also appear on keyboard focus (:focus-within) and stay visible on touch screens",
      "When a whole row is clickable, put only one main link in it; other buttons stay separately focusable",
    ],
  },
  Button: {
    title: "Button",
    use: ["Doing one thing: submit, save, open a dialog. The label says what the next click will do", "At most one primary per screen; the rest are the default secondary, ghost in toolbars and for low priority"],
    avoid: ["Just going to another page: use a link (Link)", "outline is only for colored or image backgrounds; on paper it looks the same as secondary, so use secondary"],
    summary: "A button's label says what the next click will do. One solid button per area.",
    attributes: {
      "data-variant": "primary (one main action per screen) | secondary (default, most buttons) | ghost (toolbars, low priority) | outline (on colored or image backgrounds) | danger (irreversible things like delete) | danger-outline (dangerous but not the main action on this screen)",
      "data-size": "xs | sm | md | lg",
      "data-icon-only": "Icon only (aria-label required)",
      "aria-pressed": "Toggle state",
      "aria-busy": "In progress: width stays put, spinner centered; Xxd.runBusy(btn, task) shows a check when done",
      "data-block": "Fill the row",
      "data-shape": "round: circular icon button (follows the corners switch)",
    },
    markup: `<div class="xxd-cluster">
  <button class="xxd-btn" data-variant="primary">Post to X</button>
  <button class="xxd-btn">Save draft</button>
  <button class="xxd-btn" data-variant="ghost">Later</button>
  <button class="xxd-btn" data-variant="danger">Delete</button>
  <button class="xxd-btn" data-size="xs">xs</button>
</div>`,
    sample: `<button class="xxd-btn" data-variant="primary">Post to X</button>`,
    rules: [
      "The label describes what the next click will do",
      "Only one solid button per area",
      "Spell out destructive actions; don't rely on color alone",
      "§9",
      "Long labels only get an ellipsis when wrapped in a <span> (or given .xxd-label-text). A button never pushes out of its container; bare text that is too long is clipped.",
    ],
    examples: [
      {
        title: "Sizes",
        markup: `<div class="xxd-cluster">
  <button class="xxd-btn" data-size="xs">xs</button>
  <button class="xxd-btn" data-size="sm">sm</button>
  <button class="xxd-btn">md</button>
  <button class="xxd-btn" data-size="lg">lg</button>
</div>`,
      },
      {
        title: "outline on a colored background",
        text: "outline is a transparent fill with a hairline: on a colored banner or an image it blends in better than secondary's paper fill. On paper it looks the same as secondary, so use secondary there.",
        markup: `<div class="xxd-banner" data-tone="warning" style="max-width:520px"><i data-xxd-icon="TriangleAlert"></i><div><p class="xxd-banner__title">1 post left today</p><p class="xxd-banner__text">Resets at midnight; members have no limit.</p></div><div class="xxd-banner__actions"><button class="xxd-btn" data-variant="outline" data-size="sm">Become a member</button></div></div>`,
      },
      {
        title: "Icon buttons",
        markup: `<div class="xxd-cluster">
  <button class="xxd-btn" data-icon-only aria-label="Search" data-tooltip="Search ⌘F"><i data-xxd-icon="Search"></i></button>
  <button class="xxd-btn" data-icon-only data-shape="round" aria-label="New" data-tooltip="New"><i data-xxd-icon="Plus"></i></button>
  <button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="More" data-tooltip="More"><i data-xxd-icon="Ellipsis"></i></button>
</div>`,
        text: "Icon-only buttons need an aria-label. Moving across them, tooltips show up one after another without delay. Round icon buttons follow the corners switch.",
      },
      {
        title: "Flat / material",
        markup: `<div class="xxd-cluster" data-finish-preview="flat"><button class="xxd-btn" data-variant="primary">Post to X</button><button class="xxd-btn" data-variant="danger">Delete</button></div>`,
        text: "Under Appearance in the top right, set Button style to Material: solid buttons get a 1px inner highlight on top and a slightly darker edge, and sink 0.5px when pressed.",
      },
      {
        title: "Busy and done",
        markup: `<button class="xxd-btn" data-variant="primary" onclick="Xxd.runBusy(this, () => new Promise((r) => setTimeout(r, 1200)))"><i data-xxd-icon="Save" data-size="16"></i>Save</button>`,
        text: "Click it: the width doesn't jump and the spinner stays centered; when done, the icon turns into a check for one second.",
      },
    ],
    a11y: [
      "Icon-only buttons must have an aria-label (a tooltip is not a name)",
      "While busy, set aria-busy=\"true\": the label hides and a spinner shows, but screen readers still read the button name",
      "Toggle buttons use aria-pressed; pressed, disabled and focus states never rely on color alone",
      "In compact density buttons get shorter, but the hit area stays at least --hit-min (40px, 44px on touch)",
    ],
  },
  Link: {
    title: "Link button",
    summary: "A button that looks like a link: a secondary action inside a sentence, such as “Start a new post instead”.",
    attributes: {
      "data-variant": "inline (default) | plain | current",
      "data-external / target=_blank": "Adds an external-link icon after the text",
    },
    markup: `<button class="xxd-link">Start a new post instead</button>`,
    sample: `<a class="xxd-link" href="#">Start a new post instead</a>`,
    rules: ["Underline at 40%, solid on hover"],
    a11y: [
      "Navigation uses <a href>; actions use <button class=\"xxd-link\"> — that's how screen readers tell users what will happen",
      "The underline is always there; color is never the only cue",
    ],
  },
  ButtonGroup: {
    title: "Button group",
    summary: "A few buttons joined into one strip: different ways to do the same thing.",
    markup: `<div class="xxd-btn-group"><button class="xxd-btn" data-size="sm">Left</button><button class="xxd-btn" data-size="sm">Right</button></div>`,
    a11y: [
      "For mutually exclusive options use the segmented control (radiogroup), not a button group",
      "When needed, give the wrapper role=\"group\" and an aria-label",
    ],
  },
  Field: {
    title: "Field",
    summary: "Label + input + help or error: one row of a form.",
    attributes: {
      "aria-invalid": "Border turns danger color on error",
      "data-optional": "On the label: appends “Optional”",
      "data-autosize": "Textarea grows with its content",
    },
    markup: `<div class="xxd-field">
  <label class="xxd-label" for="title">Title</label>
  <input class="xxd-input" id="title" placeholder="Give this post a name" aria-describedby="title-help">
  <p class="xxd-help" id="title-help">Up to 100 characters</p>
</div>`,
    examples: [
      {
        title: "With an error",
        text: "The input gets aria-invalid; the error text has an id and is added to aria-describedby (the help stays); it says how to fix it. In JS, Xxd.setFieldError(input, \"…\") does all of this, and an empty string clears it.",
        markup: `<div class="xxd-field" style="width:100%;max-width:320px">
  <label class="xxd-label" for="email-x">Email</label>
  <input class="xxd-input" id="email-x" type="email" value="not-an-email" aria-invalid="true" aria-describedby="email-x-help email-x-err">
  <p class="xxd-help" id="email-x-help">Used to sign in and reset your password</p>
  <p class="xxd-error" id="email-x-err">Enter a valid email, like you@example.com</p>
</div>`,
      },
    ],
    js: `Xxd.setFieldError(input, "Enter a valid email, like you@example.com")  // "" clears it`,
    sample: `<input class="xxd-input" style="width:100%;max-width:120px" placeholder="Title">`,
    rules: ["One box is one box: on focus the border darkens once — no outer ring, no inner frame", "§4"],
    a11y: [
      "The label's for points at the input; help and error text are linked with aria-describedby",
      "On error set aria-invalid=\"true\" and say how to fix it — don't just turn it red",
    ],
  },
  Select: {
    title: "Select",
    use: ["Picking one of a list of plain-text options: the native select, best for keyboards and screen readers"],
    avoid: ["Options need groups, descriptions, icons or multiple selection: use Picker", "People need to type to search: use Combobox"],
    summary: "A restyled native <select>: use it for a few options that need no descriptions or groups.",
    attributes: { "data-variant": "bare: “a value + a chevron” inside a settings row" },
    markup: `<label class="xxd-select"><select aria-label="Image quality"><option>High</option><option>Standard</option></select></label>`,
    sample: `<label class="xxd-select"><select aria-label="Quality"><option>High</option></select></label>`,
    rules: ["Native <select>; the dropdown is never rebuilt", "Inside settings rows use bare: a value + chevron, not a box"],
    a11y: ["Without a visible label, give the <select> an aria-label", "Keyboard and screen reader behavior is the browser's own"],
  },
  Picker: {
    title: "Custom select",
    use: ["Options with groups, a line of description or an icon each, or multiple selection"],
    avoid: ["A few plain-text options: use Select (native)", "Many options that need searching: use Combobox"],
    summary: "What a native <select> can't do: groups, per-option descriptions, icons, multiple selection. For simple cases keep using Select (native).",
    attributes: {
      "data-multiple": "Multiple selection (checkmarks; the list stays open)",
      "data-placeholder": "Text shown when nothing is selected",
      "data-size": "sm",
      "aria-invalid": "Error",
      "data-disabled": "Disabled",
    },
    markup: `<div class="xxd-field" style="width:100%;max-width:220px">
<span class="xxd-label">Quality</span>
<div class="xxd-picker" data-xxd-picker>
  <button class="xxd-picker__trigger"><span class="xxd-picker__value"></span></button>
  <div class="xxd-listbox">
    <div class="xxd-option-group" role="group" aria-label="Quality">
      <div class="xxd-option-group__label">Quality</div>
      <div class="xxd-option" data-value="high" aria-selected="true"><span>High<small>2K, a bit slower</small></span></div>
      <div class="xxd-option" data-value="standard"><span>Standard<small>1K, fastest</small></span></div>
    </div>
    <div class="xxd-option-group" role="group" aria-label="Other">
      <div class="xxd-option" data-value="auto">Follow my plan</div>
      <div class="xxd-option" data-value="x" aria-disabled="true">4K (coming soon)</div>
    </div>
  </div>
</div>
</div>
<div class="xxd-field" style="width:100%;max-width:220px">
<span class="xxd-label">Tags</span>
<div class="xxd-picker" data-xxd-picker data-multiple data-placeholder="Choose tags">
  <button class="xxd-picker__trigger"><span class="xxd-picker__value"></span></button>
  <div class="xxd-listbox">
    <div class="xxd-option" data-value="poster" aria-selected="true">Poster</div>
    <div class="xxd-option" data-value="cover">Cover</div>
    <div class="xxd-option" data-value="card">Card</div>
  </div>
</div>
</div>`,
    js: `picker.addEventListener("xxd:change", (e) => e.detail.value)  // an array when multiple; picker.dataset.value is comma-separated`,
    a11y: [
      "The button is role=combobox (APG's select-only combobox) with aria-haspopup=listbox; the highlight uses aria-activedescendant",
      "Its name is the field name plus the current value: inside an .xxd-field with an .xxd-label before it, they're linked automatically (or write aria-labelledby yourself)",
      "↑ ↓ Home End move, Enter / Space choose, Esc closes, typing jumps to the first match",
    ],
  },
  Search: {
    title: "Search box",
    summary: "A search box with a magnifier and a clear button. Esc clears first; press it again to leave.",
    markup: `<div class="xxd-input-wrap">
  <i data-xxd-icon="Search" data-size="16"></i>
  <input class="xxd-input" type="search" placeholder="Search settings (⌘F)" aria-label="Search settings">
  <button class="xxd-input-clear" aria-label="Clear"><i data-xxd-icon="X" data-size="14"></i></button>
</div>`,
    rules: ["⌘F / Ctrl+F jumps to it, Esc clears", "Matching text is marked with mark.xxd-hit"],
    a11y: [
      "type=\"search\"; without a visible label, add an aria-label",
      "The clear button has an aria-label; Esc clears when there is text and passes through when empty",
    ],
  },
  InputGroup: {
    title: "Input group",
    summary: "Prefixes, suffixes and inline buttons. The whole group is one box; on focus its border darkens once.",
    attributes: { "data-size": "sm", "aria-invalid": "Error" },
    markup: `<div class="xxd-input-group" style="width:100%;max-width:320px">
  <span class="xxd-input-group__addon">https://</span>
  <input aria-label="Subdomain" value="today">
  <span class="xxd-input-group__suffix">.xiaoxiaodong.ai</span>
  <button class="xxd-btn" data-variant="ghost" data-size="sm">Check</button>
</div>`,
    rules: ["One box is one box: prefix and suffix live inside it, not two boxes stuck together"],
    a11y: ["Prefixes and suffixes are plain text; the input still needs its own label or aria-label", "Buttons in the group are separate Tab stops"],
  },
  SecretInput: {
    title: "Secret input",
    summary: "API keys and tokens: masked by default, can be shown or hidden, copied in one click. Used for the member site's API settings and the extensions' AI service keys.",
    markup: `<div class="xxd-field" style="width:100%;max-width:340px">
  <label class="xxd-label" for="k1">API key</label>
  <div class="xxd-input-group xxd-secret" data-xxd-secret>
    <input id="k1" type="password" value="sk_live_4f8a2c91d7e3b6a0" readonly>
    <button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-secret-toggle aria-label="Show secret" aria-pressed="false"><i data-xxd-icon="Eye" data-size="16"></i></button>
    <button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-secret-copy aria-label="Copy"><i data-xxd-icon="Copy" data-size="16"></i></button>
  </div>
  <p class="xxd-help">Stored on this computer only.</p>
</div>`,
    rules: ["Masked by default; once shown, never re-mask automatically (the user decides)"],
    a11y: ["The show / hide button is a toggle (aria-pressed) and its label changes with it", "The “Copied” confirmation is announced through a live region"],
  },
  ClipboardText: {
    title: "Copyable value",
    summary: "A read-only value with a copy button. After copying, “Copied” pops up above the button and the icon briefly turns into a check.",
    attributes: { "data-size": "sm" },
    markup: `<div class="xxd-clipboard" style="width:100%;max-width:300px">
  <code>pnpm xxd new ./today</code>
  <button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="Copy" data-copy="pnpm xxd new ./today"><i data-xxd-icon="Copy" data-size="14"></i></button>
</div>`,
    js: `[data-copy="text"] or [data-copy-target="#selector"]; data-copy-done sets the bubble text`,
    a11y: [
      "The copy button has an aria-label; “Copied” is announced through a live region (role=status)",
      "The copied value is selectable text, so keyboard users can copy it themselves",
    ],
  },
  InlineCopy: {
    title: "Inline copy",
    summary: "A piece of copyable text inside a sentence (a command, an ID): click to copy, and “Copied” pops up.",
    markup: `<p class="xxd-text">Run <button class="xxd-inline-copy" data-copy="pnpm xxd ls" data-copy-done="Command copied">pnpm xxd ls<i data-xxd-icon="Copy" data-size="12"></i></button> — one click copies it.</p>`,
    rules: ["The copy icon is always shown faintly (so it reads as copyable) and darkens on hover / focus"],
    a11y: [
      "It is a <button>, so screen readers read its text; use data-copy-done for a more specific confirmation when needed",
      "The result is announced through a live region",
    ],
  },
  Switch: {
    title: "Switch",
    use: ["A setting that takes effect immediately: on means on, no Save needed"],
    avoid: ["An option submitted together with other fields: use Checkbox"],
    summary: "On / off that takes effect immediately. For options that need a Save to apply, use a checkbox.",
    attributes: { "data-size": "sm | (default) | lg", "role=\"switch\"": "Required" },
    markup: `<label class="xxd-choice"><input type="checkbox" role="switch" class="xxd-switch" checked>Completion sound</label>`,
    sample: `<input type="checkbox" role="switch" class="xxd-switch" aria-label="Switch">`,
    rules: ["In square mode the switch is square too (--r-pill)", "On = --switch-on: gray with ink, the accent when an accent is set"],
    a11y: [
      "<input type=\"checkbox\" role=\"switch\">; screen readers announce on / off",
      "Label it with what is on (“Completion sound”), not “Turn on completion sound”",
    ],
  },
  Checkbox: {
    title: "Checkbox",
    use: ["Yes / no or several choices in a form, submitted with the other fields"],
    avoid: ["A setting that takes effect immediately: use Switch", "Exactly one of several: use Radio or Segmented"],
    summary: "Multiple choice, or a single option that applies only after confirming. Supports indeterminate.",
    attributes: { "aria-invalid": "Error", "indeterminate (JS)": "Partially selected" },
    markup: `<label class="xxd-choice"><input type="checkbox" class="xxd-check" checked>Smart punctuation</label>`,
    sample: `<input type="checkbox" class="xxd-check" aria-label="Checkbox">`,
    a11y: [
      "Native checkbox, Space toggles; indeterminate is the property, not just a visual style",
      "The whole label is clickable, and the hit area is at least --hit-min",
    ],
  },
  Radio: {
    title: "Radio",
    summary: "Pick exactly one in a group. Use it for 2–5 options that should all be visible; for more, use a select.",
    markup: `<fieldset class="xxd-choices">
  <legend>How to write</legend>
  <label class="xxd-choice"><input type="radio" class="xxd-radio" name="w" checked>This post only</label>
  <label class="xxd-choice"><input type="radio" class="xxd-radio" name="w">Write all</label>
</fieldset>`,
    sample: `<input type="radio" class="xxd-radio" aria-label="Radio">`,
    rules: ["A radio is a semantic circle and always stays round", "A set of options is one list, not a stack of boxes"],
    a11y: [
      "Wrap it in <fieldset> + <legend> so screen readers read the group name first",
      "Same name per group: ↑ ↓ move and select, Tab stops only once",
    ],
  },
  Range: {
    title: "Slider",
    summary: "Drag to pick a number; with data-fill the left part fills with the accent. For a range use two sliders (.xxd-range-pair).",
    attributes: {
      "data-fill": "Fill the selected part with the accent",
      "data-ticks + --ticks": "Tick marks",
      ".xxd-range-pair": "Two-handle range (min never passes max)",
    },
    markup: `<div class="xxd-field" style="width:100%;max-width:260px"><label class="xxd-label">Generate at once</label><input type="range" class="xxd-range" data-fill min="1" max="4" value="2" aria-label="Generate at once"></div>
<div class="xxd-field" style="width:100%;max-width:260px"><span class="xxd-label">Price range <span class="xxd-range-value"></span></span><div class="xxd-range-pair"><input type="range" class="xxd-range" min="0" max="100" value="20" aria-label="Minimum"><input type="range" class="xxd-range" min="0" max="100" value="70" aria-label="Maximum"></div></div>`,
    a11y: [
      "Native range: ← → nudge, Page Up / Down take big steps, Home / End jump to the ends",
      "Show the current value as text too (aria-valuetext or a number next to it), not just the thumb position",
    ],
  },
  TagInput: {
    title: "Tag input",
    summary: "Enter or a comma turns the text into a tag; Backspace removes the last one.",
    markup: `<div class="xxd-taginput" data-xxd-taginput><input placeholder="Press Enter to add" aria-label="Tags"></div>`,
    js: `box.addEventListener("xxd:change", (e) => e.detail.value)  // an array of strings; Xxd.addTag(box, "Poster")`,
    a11y: [
      "Each tag's remove button has an aria-label (change it with data-remove-label)",
      "Without a visible label give the input an aria-label; changes dispatch xxd:change",
    ],
  },
  Combobox: {
    title: "Combobox",
    summary: "A dropdown you can type into to filter. data-multiple turns picks into chips; data-creatable lets you add new ones.",
    attributes: {
      "data-multiple": "Multiple: picks become chips in front (.xxd-taginput wraps the input)",
      "data-creatable": "Shows “Create “xx”” when nothing matches exactly",
      "data-create-label": "Custom text for “Create”",
      ".xxd-option-group": "Groups (a group hides when all of it is filtered out)",
    },
    markup: `<div data-xxd-combobox style="width:100%;max-width:280px"><input class="xxd-input" placeholder="Type to filter" aria-label="Accent"><ul class="xxd-listbox"><li class="xxd-option" data-value="ink">Ink</li><li class="xxd-option" data-value="#4386ba">Lake blue</li><li class="xxd-option" data-value="#638e4d">Moss</li><li class="xxd-option" data-value="#b7665c">Rouge</li></ul></div>
<div data-xxd-combobox data-multiple data-creatable style="width:100%;max-width:280px"><div class="xxd-taginput"><input placeholder="Pick or create a tag" aria-label="Tags"></div><ul class="xxd-listbox"><li class="xxd-option">Poster</li><li class="xxd-option">Cover</li><li class="xxd-option">Card</li></ul></div>`,
    a11y: [
      "The input has role=combobox + aria-expanded, the list role=listbox, and the highlighted option uses aria-activedescendant",
      "↑ ↓ move, Enter selects, Esc closes",
    ],
  },
  Tabs: {
    title: "Tabs",
    use: ["Several faces of the same thing: Home / History / Settings"],
    avoid: ["Switching a value (view mode, time range): use Segmented", "Going step by step: use steps, not tabs"],
    summary: "Switch between several panels in the same place; the ink line slides to the selected tab.",
    markup: `<div class="xxd-tabs" data-xxd-tabs>
  <button role="tab" id="t1" aria-controls="p1" aria-selected="true">Write</button>
  <button role="tab" id="t2" aria-controls="p2">History</button>
</div>
<div class="xxd-tabpanel" id="p1" style="padding-top:var(--space-3)"><p class="xxd-text" data-variant="secondary">The post in progress: a long piece about design systems.</p></div>
<div class="xxd-tabpanel" id="p2" style="padding-top:var(--space-3)" hidden><p class="xxd-text" data-variant="secondary">Posts you've written show up here, grouped by day.</p></div>`,
    rules: [
      "Text on a baseline + a short sliding ink line",
      "Selection changes color, never weight",
      "No second line under the tabs",
      "When they don't fit, both ends fade and the selected tab scrolls into view",
    ],
    a11y: [
      "JS fills in role=tablist / tab / tabpanel; the selected tab has aria-selected and panels have aria-labelledby",
      "← → Home End switch tabs; Tab stops only on the selected one (roving tabindex)",
    ],
  },
  Segmented: {
    title: "Segmented control",
    use: ["Two to five mutually exclusive values, switched immediately: list / grid, light / dark"],
    avoid: ["Switching whole sections of content: use Tabs", "Many options: use Select"],
    summary: "2–4 mutually exclusive options in one strip: switching views, picking a type.",
    markup: `<div class="xxd-segmented" role="radiogroup" data-xxd-segmented aria-label="Type">
  <button role="radio" aria-checked="true">Text</button>
  <button role="radio" aria-checked="false">Image</button>
</div>`,
    rules: ["One tray; the selected segment rises like paper — not a box inside a box"],
    a11y: [
      "role=radiogroup + aria-label; each segment is role=radio + aria-checked",
      "← → switch, Tab stops once; the selected segment is outlined in high-contrast mode",
    ],
  },
  Breadcrumbs: {
    title: "Breadcrumbs",
    summary: "Where this page is: one line of path. With data-collapse=\"4\" the middle levels fold into a “…” menu.",
    attributes: { "data-collapse": "Fold the middle into a “…” menu beyond N items (default 4)", "data-size": "sm" },
    markup: `<ol class="xxd-breadcrumbs" data-collapse="4"><li><a href="#">Home</a></li><li><a href="#">Extensions</a></li><li><a href="#">Long-form publisher</a></li><li><a href="#">Versions</a></li><li><a href="#">1.8</a></li><li aria-current="page">1.8.2</li></ol>`,
    a11y: [
      "Wrap it in <nav aria-label=\"Breadcrumbs\">; mark the current page with aria-current=\"page\" and don't make it a link",
      "The fold button's aria-label says how many levels it hides; menu items work with arrow keys",
    ],
    rules: ["Never wraps: when it doesn't fit, earlier items shrink to an ellipsis first and the current page shrinks last"],
  },
  Pagination: {
    title: "Pagination",
    summary: "Page numbers, previous / next and page size. JS builds the buttons from data-total and dispatches xxd:change.",
    attributes: {
      "data-xxd-pagination": "Builds buttons from data-page / data-total / data-per-page",
      "data-simple": "Only previous / next",
    },
    markup: `<div class="xxd-pagination-bar">
  <span class="xxd-pagination__info"></span>
  <nav class="xxd-pagination" data-xxd-pagination data-page="3" data-total="230" data-per-page="20" aria-label="Pagination"></nav>
  <label class="xxd-pagination__size">Per page<span class="xxd-select" data-size="sm"><select><option>20</option><option>50</option></select></span></label>
</div>
<nav class="xxd-pagination" data-simple aria-label="Pagination (simple)"><button aria-label="Previous page"><i data-xxd-icon="ChevronLeft" data-size="14"></i></button><button aria-current="page">2</button><button aria-label="Next page"><i data-xxd-icon="ChevronRight" data-size="14"></i></button></nav>`,
    a11y: [
      "<nav> has an aria-label; the current page has aria-current=\"page\"; previous / next have text labels (three languages)",
      "On the first and last page the matching button is disabled",
    ],
    rules: ["Page numbers never wrap; when the bar is narrower than 420px (or on phones) only “‹ 3 / 12 ›” remains"],
  },
  Rail: {
    title: "Rail",
    summary: "A narrow icon navigation rail (the strip on the left of an extension side panel).",
    markup: `<nav class="xxd-rail" aria-label="Main navigation"><a href="#" aria-current="page"><i data-xxd-icon="House"></i>Home</a><a href="#"><i data-xxd-icon="Bookmark"></i>Saved</a></nav>`,
    rules: ["Icons 20px, labels 10px", "Active changes color and background, never stroke width"],
    a11y: ["<nav aria-label>; the current item has aria-current=\"page\"", "Icon-only items each need an aria-label and a tooltip"],
  },
  Sidebar: {
    title: "Sidebar",
    summary: "A full sidebar: groups, submenus, badges, collapsing to a 56px icon bar (labels fade out, tooltips on hover), resizable width; floating and inset variants.",
    attributes: {
      "data-collapsed": "Collapse to an icon bar",
      "data-variant": "floating | inset",
      "--sidebar-w": "Width (updated while dragging)",
      "data-min / data-max": "Drag range (default 200–400)",
      "[data-xxd-sidebar-toggle=\"id\"]": "Collapse / expand button",
      "data-sidebar-sub=\"id\"": "An item with a submenu",
    },
    markup: `<div class="xxd-frame" style="display:flex;height:420px">
<aside class="xxd-sidebar" data-xxd-sidebar id="sb1" style="--sidebar-w:232px">
  <div class="xxd-sidebar__head"><span class="xxd-logo"><span class="xxd-logo__mark"></span><span data-sidebar-hide>XXD</span></span></div>
  <nav class="xxd-sidebar__body">
    <div class="xxd-sidebar__group">
      <div class="xxd-sidebar__label">Content</div>
      <a class="xxd-sidebar__item" href="#" aria-current="page"><i data-xxd-icon="House" data-size="18"></i><span>Home</span></a>
      <a class="xxd-sidebar__item" href="#"><i data-xxd-icon="Bookmark" data-size="18"></i><span>Saved</span><span class="xxd-badge">12</span></a>
      <button class="xxd-sidebar__item" aria-expanded="true" data-sidebar-sub="sb1-sub"><i data-xxd-icon="Folder" data-size="18"></i><span>Style library</span></button>
      <div class="xxd-sidebar__sub" id="sb1-sub">
        <a class="xxd-sidebar__item" href="#"><span>Posters</span></a>
        <a class="xxd-sidebar__item" href="#"><span>Covers</span></a>
      </div>
    </div>
    <div class="xxd-sidebar__group">
      <div class="xxd-sidebar__label">Account</div>
      <a class="xxd-sidebar__item" href="#"><i data-xxd-icon="Settings" data-size="18"></i><span>Settings</span></a>
    </div>
  </nav>
  <div class="xxd-sidebar__foot"><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-xxd-sidebar-toggle="sb1" aria-label="Collapse sidebar"><i data-xxd-icon="PanelsTopLeft" data-size="16"></i></button></div>
  <div class="xxd-sidebar__resize" data-sidebar-resize></div>
</aside>
<main style="flex:1;min-width:6em;padding:16px" class="xxd-muted">Content area</main>
</div>`,
    rules: [
      "Collapsing is instant: labels fade out, icons stay put (only opacity animates)",
      "Active changes color and background, never stroke width or weight",
    ],
    a11y: ["When collapsed, each item's name becomes its aria-label and tooltip automatically", "Submenu buttons carry aria-expanded"],
  },
  Topbar: {
    title: "Top bar",
    summary: "One strip across the top of a page: a title + a few icon buttons.",
    markup: `<header class="xxd-topbar"><span class="xxd-topbar__title">Prompts</span><button class="xxd-btn" data-variant="ghost" data-icon-only aria-label="Search"><i data-xxd-icon="Search"></i></button></header>`,
    rules: ["56px; the divider belongs to this row"],
    a11y: ["Every icon-only button needs an aria-label", "With only one top bar on the page it can be a <header> (banner)"],
  },
  Toolbar: {
    title: "Toolbar",
    summary: "Like an editor's formatting bar: a set of small buttons; ← → move between them (roving tabindex).",
    attributes: {
      "role=\"toolbar\"": "Enables arrow-key movement",
      "data-framed": "With a frame",
      "data-size": "sm | lg",
      "aria-pressed": "Toggle state (bold, etc.)",
    },
    markup: `<div class="xxd-toolbar" role="toolbar" aria-label="Formatting" data-framed>
  <button class="xxd-toolbar__item" aria-label="Bold" aria-pressed="true" data-tooltip="Bold ⌘B"><i data-xxd-icon="Bold" data-size="16"></i></button>
  <button class="xxd-toolbar__item" aria-label="Italic" data-tooltip="Italic ⌘I"><i data-xxd-icon="Italic" data-size="16"></i></button>
  <button class="xxd-toolbar__item" aria-label="Heading" data-tooltip="Heading"><i data-xxd-icon="Heading1" data-size="16"></i></button>
  <span class="xxd-toolbar__sep"></span>
  <button class="xxd-toolbar__item" aria-label="Link" data-tooltip="Link ⌘K"><i data-xxd-icon="Link" data-size="16"></i></button>
  <button class="xxd-toolbar__item" aria-label="Image" data-tooltip="Image"><i data-xxd-icon="Image" data-size="16"></i></button>
  <span class="xxd-toolbar__spacer"></span>
  <button class="xxd-toolbar__item"><i data-xxd-icon="Eye" data-size="14"></i>Preview</button>
</div>`,
    a11y: ["← → Home End move between items; Tab enters and leaves the whole toolbar in one stop"],
  },
  PageHeader: {
    title: "Page header",
    summary: "Breadcrumbs, title, description, actions, tabs — the top of a resource or settings page.",
    markup: `<header class="xxd-page-header">
  <ol class="xxd-breadcrumbs"><li><a href="#">Extensions</a></li><li aria-current="page">Long-form publisher</li></ol>
  <div class="xxd-page-header__row">
    <h1 class="xxd-page-header__title">Long-form publisher</h1>
    <div class="xxd-page-header__actions"><button class="xxd-btn">Open store page</button><button class="xxd-btn" data-variant="primary">Publish new version</button></div>
  </div>
  <p class="xxd-page-header__desc">Writes Markdown into X Articles. v1.8.2 · 2,410 users</p>
  <div class="xxd-tabs" role="tablist" aria-label="Extension" data-xxd-tabs><button role="tab" aria-selected="true">Overview</button><button role="tab">Versions</button><button role="tab">Settings</button></div>
</header>`,
    a11y: [
      "The title is the page's h1; breadcrumbs and tabs carry their own semantics (nav / tablist)",
      "Actions go left to right by importance; the primary action comes last",
    ],
  },
  SettingsGroup: {
    title: "Settings group",
    summary: "One group on a settings page: a group name + rows (title, description, control).",
    markup: `<section class="xxd-group">
  <h2 class="xxd-group__title">Writing</h2>
  <div class="xxd-group__body">
    <div class="xxd-row">
      <div class="xxd-row__text"><div class="xxd-row__title">Write the title</div><div class="xxd-row__desc">Use the first # heading as the post title</div></div>
      <div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" aria-label="Write the title"></div>
    </div>
  </div>
</section>`,
    rules: [
      "A small gray title + one framed body, thin lines between rows",
      "No frame around the whole tab",
      "a.xxd-row makes the whole row clickable and adds a chevron",
      "§5",
    ],
    a11y: [
      "The group name is an h2 (under the page h1); a control's aria-label matches its row title",
      "The description can be linked to the control with aria-describedby",
    ],
  },
  Appearance: {
    title: "Appearance settings",
    summary: "A ready-made settings group for theme, corners, accent, density and finish: Xxd.mountAppearance(container).",
    js: `Xxd.mountAppearance(el, { locale: "en", showDensity: false, lockCorners: false, languages, onLanguage })
// In an extension: wire get/set to XxdExtension.createAppearanceStore({ key })`,
    rules: [
      "Theme · corners · accent · (density) · (language) — the group every extension needs",
      "The member site uses lockCorners: true",
    ],
    a11y: [
      "Every option is a segmented control or a switch with an aria-label; swatches are radios with readable names",
      "Text follows <html lang> or the locale option, in three languages",
    ],
  },
  List: {
    title: "List",
    use: ["A column of similar things: history, files, extensions; each row can have actions"],
    avoid: ["Comparing or sorting by column: use Table", "A group of settings: use SettingsGroup"],
    summary: "A column of clickable rows: title, description, trailing actions. Mark the current item with aria-current.",
    attributes: { "data-interactive": "Rows are clickable (hover background)", "aria-selected": "Selected row: a light tint" },
    markup: `<ul class="xxd-list" data-interactive>
  <li class="xxd-list__item"><div class="xxd-list__main"><div class="xxd-list__title">A long post</div><div class="xxd-list__meta">Today 14:02</div></div></li>
  <li class="xxd-list__item" aria-current="true"><div class="xxd-list__main"><div class="xxd-list__title">Another one</div></div></li>
</ul>`,
    rules: [
      "Lines only between rows — none above the first or below the last",
      "Selection is a light tint, no colored border or side bar",
      "Text in a row keeps at least 8 characters of width; when it doesn't fit, the buttons on the right move to the next line together",
    ],
    a11y: [
      "Mark the selected row with aria-current=\"true\" (not aria-selected — that's for listbox options)",
      "When a whole row is clickable, wrap the main area in one link / button; other actions stay separately focusable",
    ],
  },
  Glyphs: {
    title: "Symbol picker",
    summary: "A grid with one symbol per cell to pick from (numbers, punctuation, emoji).",
    rules: ["Bare characters; filled only on hover"],
    a11y: [
      "Give each button an aria-label with the symbol's name (“circled digit one”), not just the character",
      "Mark the selected symbol with aria-pressed=\"true\"",
    ],
    markup: `<div class="xxd-glyphs"><button aria-label="Circled digit one" aria-pressed="true">①</button><button aria-label="Circled digit two">②</button><button aria-label="Circled digit three">③</button></div>`,
  },
  Dialog: {
    title: "Dialog",
    use: ["A question that must be answered before going on: confirm a delete, pick one of two", "A very short form (one or two fields) that closes when done"],
    avoid: ["Just letting people know: use Toast", "Long forms or content people go back and forth on: use Panel or a new page", "Most overlays in an extension side panel: use Sheet"],
    summary: "A question that must be answered before going on: a confirmation, a choice, a short form.",
    attributes: {
      "data-light-dismiss": "Click the backdrop to close (don't use it for confirmations)",
      "data-size": "sm | (default 440) | lg | xl",
      "role=\"alertdialog\"": "A confirmation that must be answered: no data-light-dismiss",
    },
    markup: `<dialog class="xxd-dialog" id="d1" aria-labelledby="d1-title">
  <div class="xxd-dialog__head"><h2 class="xxd-dialog__title" id="d1-title">Which post should this go into?</h2></div>
  <div class="xxd-dialog__body"><p>Existing content is never replaced by default.</p></div>
  <div class="xxd-dialog__actions">
    <button class="xxd-btn ui-dialog-cancel" data-xxd-dialog-close>Cancel</button>
    <button class="xxd-btn" data-variant="primary" data-xxd-dialog-close="new">Write as a new post</button>
  </div>
</dialog>
<button class="xxd-btn" data-xxd-dialog-open="d1">Open</button>`,
    js: `await Xxd.confirmDialog({ title, message, confirmLabel: "Delete", tone: "danger" })  // → true / false
await Xxd.confirmDelete({ name: "Long-form publisher", what: "all records of this extension" })  // type the name to delete`,
    rules: [
      "Cancel comes first (DOM order), content-width and quiet; the primary action is last, on the right",
      "Destructive confirmations focus Cancel by default",
      "§10",
    ],
    a11y: [
      "Native <dialog> + showModal: the page behind is inert, Esc closes, focus is trapped inside",
      "On close, focus returns to the button that opened it; destructive actions focus “Cancel” by default",
    ],
  },
  Dock: {
    title: "Dock",
    summary: "The strip pinned to the bottom of an extension side panel: status + tools + the primary button.",
    markup: `<footer class="xxd-dock">
  <div class="xxd-dock__status">30 characters · Saved</div>
  <div class="xxd-dock__tools"><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" aria-label="Cover"><i data-xxd-icon="Image"></i></button></div>
  <div class="xxd-dock__primary"><button class="xxd-btn" data-variant="primary" data-size="sm">Post to X</button></div>
</footer>`,
    rules: [
      "Status first · undoable tools in one group · the step with the biggest consequence last",
      "It is not a second navigation bar",
    ],
    a11y: ["Status changes are announced via role=status (e.g. “Saved”)", "Only one primary button, and it says what it does (“Post to X”)"],
  },
  Sheet: {
    title: "Sheet",
    use: ["Secondary tasks in an extension side panel or popup: pick a cover, a group of settings", "A panel rising from the bottom on phones"],
    avoid: ["A confirmation people must answer first: use Dialog", "Details on a desktop page: use Panel"],
    summary: "A panel that rises from the dock: secondary content such as settings or pickers.",
    markup: `<div class="xxd-sheet-host xxd-frame" style="display:flex;flex-direction:column;width:100%;max-width:380px;height:300px;overflow:hidden">
  <p class="xxd-text" data-variant="secondary" style="flex:1;margin:0;padding:14px">The side panel's content. Click “Cover” below and the sheet rises from the dock.</p>
  <div class="xxd-scrim"></div>
  <section class="xxd-sheet" id="s1" aria-labelledby="s1-title"><div class="xxd-sheet__head"><h3 class="xxd-sheet__title" id="s1-title">Cover</h3><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" data-xxd-sheet-close aria-label="Close"><i data-xxd-icon="X"></i></button></div><div class="xxd-sheet__body"><p class="xxd-help">Pick an image as the post cover.</p></div></section>
  <footer class="xxd-dock" style="position:static"><div class="xxd-dock__status">30 characters · Saved</div><div class="xxd-dock__primary"><button class="xxd-btn" data-size="sm" data-xxd-sheet-open="s1">Cover</button></div></footer>
</div>`,
    rules: ["Rises 10px + fades in over 200ms, retracts in 120ms", "While open, the dock's primary action is hidden"],
    a11y: [
      "On open, focus moves to the first focusable element in the sheet; Tab stays inside, Esc closes",
      "On close, focus returns to the button that opened it; the sheet's aria-labelledby points at its title",
    ],
  },
  Panel: {
    title: "Details panel",
    attributes: {
      ".xxd-panel-room": "Content next to the panel makes room while it is open instead of being covered (on narrow screens the panel is a bottom drawer and nothing moves)",
    },
    use: ["Clicking an item in a list to see details or edit a few fields, with the main content still beside it", "Slides in from the right on desktop"],
    avoid: ["A question that must be answered first: use Dialog", "A narrow extension side panel: use Sheet"],
    summary: "A details panel that slides in from the right (resource details on the member site).",
    markup: `<aside class="xxd-panel" id="pd" aria-labelledby="pd-title"><div class="xxd-panel__head"><h2 class="xxd-panel__title" id="pd-title">Details</h2><button class="xxd-btn" data-variant="ghost" data-icon-only data-xxd-panel-close aria-label="Close"><i data-xxd-icon="X"></i></button></div><div class="xxd-panel__body">…</div></aside>
<button class="xxd-btn" data-xxd-panel-open="pd">Details</button>`,
    js: `Xxd.openPanel(el); Xxd.toast("Saved", { within: el.querySelector(".xxd-panel__body") })`,
    rules: ["For actions inside the panel, the toast appears inside the panel"],
    a11y: [
      "aria-labelledby points at the title; on open focus moves into the panel, Esc closes and returns focus",
      "The close button has an aria-label",
    ],
  },
  Menu: {
    title: "Menu",
    use: ["Several actions behind one button: rename, export, delete", "Many options that aren't used often enough to show"],
    avoid: ["Choosing a value: use Select or Picker", "Only one or two actions: just show the buttons"],
    summary: "A column of actions: more, export, sort. Supports submenus, radio groups and checkable items.",
    markup: `<button class="xxd-btn" data-xxd-menu="m1">More<i data-xxd-icon="ChevronDown" data-size="14"></i></button>
<div class="xxd-menu" id="m1" role="menu" popover>
  <button class="xxd-menu__item" role="menuitem"><i data-xxd-icon="Pen" data-size="14"></i>Rename<span class="xxd-menu__kbd">F2</span></button>
  <button class="xxd-menu__item" role="menuitem" data-submenu="m1-export" aria-haspopup="menu"><i data-xxd-icon="Download" data-size="14"></i>Export as</button>
  <div class="xxd-menu" id="m1-export" role="menu" popover="manual">
    <button class="xxd-menu__item" role="menuitem">Markdown</button>
    <button class="xxd-menu__item" role="menuitem">Image (PNG)</button>
  </div>
  <div class="xxd-menu__sep" role="separator"></div>
  <div class="xxd-menu__label">Sort</div>
  <div role="group" aria-label="Sort">
    <button class="xxd-menu__item" role="menuitemradio" aria-checked="true">Newest first</button>
    <button class="xxd-menu__item" role="menuitemradio" aria-checked="false">Oldest first</button>
  </div>
  <button class="xxd-menu__item" role="menuitemcheckbox" aria-checked="true">Smart punctuation</button>
  <div class="xxd-menu__sep" role="separator"></div>
  <button class="xxd-menu__item" role="menuitem" data-tone="danger"><i data-xxd-icon="Trash2" data-size="14"></i>Delete</button>
</div>`,
    js: `group.addEventListener("xxd:change", (e) => e.detail.value)  // radio group`,
    rules: [
      "Arrow keys / Home / End / Esc; clicking outside closes (Popover API)",
      "Submenus live inside the parent menu with popover=\"manual\"; → opens, ← / Esc goes back to the parent item",
      "Focus follows the mouse (only one highlight at a time)",
    ],
    a11y: [
      "The trigger has aria-haspopup + aria-expanded; ↓ ↑ open it and focus the first / last item",
      "↑ ↓ move, → enters a submenu, ← / Esc leaves, focus returns to the trigger",
    ],
  },
  Popover: {
    title: "Popover",
    use: ["Click to read an explanation; it can hold a link or a tiny form"],
    avoid: ["A short line people should see on hover: use Tooltip", "Something that must be answered first: use Dialog"],
    summary: "An explanation or a small form you click to open: holds more than a tooltip, lighter than a dialog.",
    attributes: { "data-arrow": "Small arrow (follows the anchor)", "data-placement": "top | bottom | *-start | *-end" },
    markup: `<button class="xxd-btn" data-xxd-popover="p1">What is this?</button>
<div class="xxd-popover" id="p1" popover>Accent colors are lightened or darkened automatically.</div>`,
    a11y: [
      "Native popover: click outside or Esc closes; the trigger's aria-expanded stays in sync",
      "When it holds interactive content, focus moves into it on open; after Esc, focus returns to the trigger",
    ],
  },
  Tooltip: {
    title: "Tooltip",
    use: ["The name and shortcut of an icon-only button"],
    avoid: ["Important information or anything clickable: touch screens have no hover, so put it in the UI or use Popover"],
    summary: "One line of explanation shown on hover or keyboard focus. Explanations only — never actions.",
    attributes: {
      "data-tooltip": "Tooltip text",
      "data-tooltip-placement": "top (default) | bottom | top-start …",
      "data-tooltip-arrow": "Small arrow",
    },
    markup: `<button class="xxd-btn" data-icon-only aria-label="Search" data-tooltip="Search ⌘F"><i data-xxd-icon="Search"></i></button>`,
    rules: [
      "11px, small shadow; 400ms on hover, instant on focus",
      "In a row: within 300ms of closing, moving to another button shows its tooltip instantly (tooltip group)",
    ],
    a11y: [
      "Also shows on keyboard focus, Esc dismisses; linked to the button with aria-describedby",
      "Icon-only buttons still need an aria-label — the tooltip adds to the name, it isn't the name",
    ],
  },
  Toast: {
    title: "Toast",
    use: ["Saying something finished or failed, optionally with Undo / Retry", "Actions inside a panel: pass within so it appears right there"],
    avoid: ["Things people must read or choose: use Dialog", "A state that should stay visible: use Banner or the status line"],
    summary: "One sentence about an outcome: saved, copied, failed and can retry. When the same sentence comes again it only nudges.",
    markup: `<div class="xxd-cluster">
  <button class="xxd-btn" onclick="Xxd.toast('Draft saved', { tone: 'success' })">Save</button>
  <button class="xxd-btn" onclick="Xxd.toast('Moved to trash', { action: { label: 'Undo', onClick() { Xxd.toast('Restored', { tone: 'success' }) } } })">Delete (undoable)</button>
  <button class="xxd-btn" onclick="Xxd.toast('Message ' + (window.__n = (window.__n || 0) + 1), { tone: 'info' })">Send a few</button>
</div>`,
    js: `Xxd.toast(message, { tone: "success" | "danger" | "warning" | "info", within, duration, action: { label: "Undo", onClick }, stack: true })`,
    rules: [
      "Appears where the action happened (within)",
      "Stacking: several fold into a pile that fans out on hover; a repeated message adds nothing new, it just nudges",
      "Swipe sideways to dismiss",
      "Green only means done",
    ],
    a11y: [
      "The region is role=status + aria-live=polite, so it never interrupts what is being read",
      "Toasts with an action (undo, retry) stay 10 seconds by default; the timer pauses on hover or keyboard focus inside; Alt+T jumps to the latest one, Esc closes it and returns focus",
    ],
  },
  CommandPalette: {
    title: "Command palette",
    summary: "⌘K: search commands and jump to pages; supports groups, recent items and async loading.",
    markup: `<button class="xxd-btn" onclick="Xxd.openCommandPalette({ recentKey: 'xxd-site-demo-en', items: [{ label: 'New post', hint: '⌘N', group: 'Writing', run(){} }, { label: 'Post to X', group: 'Writing', run(){} }, { label: 'Toggle theme', group: 'Appearance', run(){ XxdTheme.set({ theme: XxdTheme.read().theme === 'dark' ? 'light' : 'dark' }) } }, { label: 'Toggle corners', group: 'Appearance', run(){ XxdTheme.set({ corners: XxdTheme.read().corners === 'rounded' ? 'square' : 'rounded' }) } }] })">Command palette ⌘K</button>`,
    js: `Xxd.openCommandPalette({ items: [{ label, hint, group, run }], recentKey: "my-ext-recent", loading: false })
Xxd.bindCommandPalette(items)  // ⌘K / Ctrl+K`,
    rules: [
      "Grouped by group, with group titles",
      "recentKey: with no input, “Recent” comes first",
      "loading: shows “Loading…” first, then call setItems",
    ],
    a11y: [
      "The input is role=combobox, the list role=listbox, and the highlight uses aria-activedescendant",
      "↑ ↓ move, Enter runs, Esc closes and returns focus",
    ],
  },
  Badge: {
    title: "Badge",
    use: ["A very short state or count: New, Beta, 12"],
    avoid: ["A clickable filter: use Chip", "A sentence of information: use Banner or plain text"],
    summary: "A small label for a status or a count: Draft, Posted, 12.",
    attributes: { "data-tone": "action | success | danger | warning", "data-variant": "solid | outline | new", "data-appearance": "dot: dot + text" },
    markup: `<div class="xxd-cluster">
  <span class="xxd-badge">Draft</span> <span class="xxd-badge" data-tone="success">Posted</span> <span class="xxd-badge" data-tone="warning">Needs update</span> <span class="xxd-badge" data-appearance="dot" data-tone="success">Running</span> <span class="xxd-badge" data-variant="new">New</span>
</div>`,
    a11y: [
      "There is always text besides color; for a bare number add a description (aria-label=\"12 unread\")",
      "Text on tinted badges stays ≥ 4.5:1",
    ],
  },
  Chip: {
    title: "Chip",
    attributes: {
      "aria-pressed": "Selected",
      "data-size": "sm: in the same row as a small input or button (32px, same height)",
    },
    use: ["A clickable filter or a removable tag"],
    avoid: ["Just showing a state: use Badge"],
    summary: "A tag you can toggle: filters, multi-select markers.",
    markup: `<div class="xxd-cluster">
  <button class="xxd-chip" aria-pressed="true">Poster</button> <button class="xxd-chip">Cover</button>
</div>`,
    sample: `<button class="xxd-chip">Poster</button>`,
    a11y: ["It is a <button aria-pressed>; screen readers announce “pressed”", "The selected state is outlined in high-contrast mode, not just tinted"],
  },
  Dot: {
    title: "Status dot",
    summary: "A small dot that shows a status (running, error).",
    rules: ["A semantic circle; always round"],
    a11y: [
      "The dot is decoration only (aria-hidden, or text next to it); the status must also be written out",
      "Never tell two statuses apart by color alone",
    ],
    markup: `<div class="xxd-cluster">
  <span class="xxd-cluster" style="--cluster-gap:6px"><span class="xxd-dot" data-tone="success" aria-hidden="true"></span>Running</span>
  <span class="xxd-cluster" style="--cluster-gap:6px"><span class="xxd-dot" data-tone="danger" aria-hidden="true"></span>Error</span>
  <span class="xxd-cluster" style="--cluster-gap:6px"><span class="xxd-dot" aria-hidden="true"></span>Stopped</span>
</div>`,
  },
  Banner: {
    title: "Banner",
    use: ["A state the whole page or section should know about: quota almost used up, offline", "Can be dismissed and can carry one action"],
    avoid: ["The result of one action: use Toast", "An error in one form field: put it under that field (Field)"],
    summary: "One notice at the top of a page or panel: quota, updates, errors.",
    attributes: {
      "data-tone": "warning | danger | success",
      "data-size": "sm",
      "[data-banner-close]": "Close button (fades out, then removes itself and dispatches xxd:banner-close)",
    },
    markup: `<div class="xxd-banner" data-tone="warning" style="max-width:520px"><i data-xxd-icon="TriangleAlert"></i><div><p class="xxd-banner__title">1 post left today</p><p class="xxd-banner__text">Resets at midnight; unlimited for members.</p></div><div class="xxd-banner__actions"><button class="xxd-btn" data-size="sm">Become a member</button></div><button class="xxd-btn xxd-banner__close" data-variant="ghost" data-icon-only data-size="xs" data-banner-close aria-label="Close"><i data-xxd-icon="X" data-size="14"></i></button></div>`,
    a11y: [
      "Important notices use role=status (errors use role=alert); the icon is aria-hidden",
      "The close button has an aria-label; on close, focus moves to the nearest focusable element after it instead of dropping to body",
    ],
    rules: ["When the banner is narrower than 440px, the actions move below the text instead of being squeezed; the close button stays top right"],
  },
  Empty: {
    title: "Empty state",
    summary: "When there is nothing yet: say why it's empty and what to do next.",
    attributes: { "data-size": "sm | lg" },
    markup: `<div class="xxd-empty" data-size="sm"><i data-xxd-icon="FileText"></i><p class="xxd-empty__title">No history yet</p></div>
<div class="xxd-empty"><i data-xxd-icon="Package"></i><p class="xxd-empty__title">No extensions yet</p><p class="xxd-empty__text">Create one with a single command.</p><div class="xxd-clipboard" data-size="sm"><code>pnpm xxd new ./today</code><button class="xxd-btn" data-variant="ghost" data-icon-only data-size="xs" aria-label="Copy" data-copy="pnpm xxd new ./today"><i data-xxd-icon="Copy" data-size="14"></i></button></div></div>`,
    use: ["A list, search or history with nothing in it yet: say why it's empty and what to do next"],
    avoid: ["Loading: use Progress or Loading", "An error: use Banner and say what went wrong and how to retry"],
    rules: [
      "An explanation + one clear next step",
      "By default a single icon (24 grid, 1.5 stroke, drawn like every other icon), not a colorful illustration",
      "Only first-run screens that need to explain what a feature does get an illustration: line art, one color (ink or a tint of the accent), the same stroke as the icons, no gradients or people",
      "The title states the situation (No history yet), the text gives the reason or how, the button names the next step (Import your first post)",
    ],
    a11y: ["The icon is decoration (aria-hidden); the title states the fact, the text gives the next step", "The next step is a button or a link, reachable by keyboard"],
  },
  Progress: {
    title: "Progress",
    summary: "Known progress uses <progress>; unknown progress uses a load bar or a spinner.",
    markup: `<progress class="xxd-progress" value="60" max="100"></progress>
<div class="xxd-loadbar" role="progressbar" aria-label="Loading"></div>
<span class="xxd-spinner"></span>`,
    rules: ["Animates transform only"],
    attributes: {
      ".xxd-meter + --value": "Meter bar: --value is 0–1",
      "data-tone": "Meter bar over a limit: warning | danger | success (write the state in the text next to it)",
      ".xxd-meter__target + --target": "Meter bar target mark (0–1)",
      "data-segments + --segments": "Meter bar in segments: a cell lights only when full",
    },
    examples: [{ title: "Meter bar: target, over limit, segments", markup: `<div class="xxd-stack" style="--stack-gap:20px;width:100%;max-width:320px">
  <div class="xxd-meter" style="--value:.72" role="meter" aria-label="Storage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="72" aria-valuetext="72%, target 80%"><div class="xxd-meter__head"><span>Storage</span><span>72% · target 80%</span></div><div class="xxd-meter__track"><div class="xxd-meter__fill"></div></div><span class="xxd-meter__target" style="--target:.8"></span></div>
  <div class="xxd-meter" data-tone="danger" style="--value:.94" role="meter" aria-label="Monthly quota" aria-valuemin="0" aria-valuemax="100" aria-valuenow="94" aria-valuetext="94%, over limit"><div class="xxd-meter__head"><span>Monthly quota</span><span>94% · over limit</span></div><div class="xxd-meter__track"><div class="xxd-meter__fill"></div></div></div>
  <div class="xxd-meter" data-segments style="--segments:5;--value:.6" role="meter" aria-label="Setup" aria-valuemin="0" aria-valuemax="5" aria-valuenow="3" aria-valuetext="Step 3 of 5"><div class="xxd-meter__head"><span>Setup</span><span>3 / 5 steps</span></div><div class="xxd-meter__track"><div class="xxd-meter__fill"></div></div></div>
</div>` }],
    a11y: [
      "<progress> has progress semantics built in; the load bar needs role=progressbar + aria-label",
      "A decorative spinner is aria-hidden, with text next to it saying what is happening",
      "Meter bars use role=meter + aria-valuenow / min / max; put the limit and target in aria-valuetext and in the text next to it",
    ],
  },
  Table: {
    title: "Table",
    use: ["A set of similar records people compare, sort or act on in bulk"],
    avoid: ["A narrow extension side panel: use List", "Only two or three columns and nothing to compare: use List"],
    summary: "Aligned data: sorting, select all, resizable columns, sticky columns, footer totals.",
    attributes: {
      "data-interactive": "Rows highlight on hover",
      "data-density": "compact: compact",
      "data-sticky-head": "Sticky header",
      "data-sticky (th/td)": "start | end: pin the first / last column",
      "aria-sort (th)": "none | ascending | descending; put a .xxd-th-sort inside",
      "[data-select-all] / [data-select-row]": "Select all and row selection (indeterminate is automatic)",
      ".xxd-th-resize": "Drag to resize the column",
      "data-wrap (td/th)": "Let this column wrap (cells don't wrap by default; when narrow, the table scrolls sideways in .xxd-table-wrap)",
    },
    markup: `<div class="xxd-table-wrap" style="max-width:560px">
<table class="xxd-table" data-interactive>
  <thead><tr>
    <th class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-all aria-label="Select all"></th>
    <th aria-sort="ascending" data-key="name" data-sticky="start"><button class="xxd-th-sort">Extension</button><span class="xxd-th-resize"></span></th>
    <th>Version</th>
    <th aria-sort="none" data-key="users" data-align="end"><button class="xxd-th-sort">Users</button></th>
    <th class="xxd-table__actions"><span class="xxd-sr-only">Actions</span></th>
  </tr></thead>
  <tbody>
    <tr><td class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-row aria-label="Select Long-form publisher"></td><td data-sticky="start">Long-form publisher</td><td>1.8.2</td><td data-align="end">2,410</td><td class="xxd-table__actions"><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs">Edit</button></td></tr>
    <tr><td class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-row checked aria-label="Select Link sorter"></td><td data-sticky="start">Link sorter</td><td>0.9.0</td><td data-align="end">830</td><td class="xxd-table__actions"><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs">Edit</button></td></tr>
    <tr><td class="xxd-table__check"><input type="checkbox" class="xxd-check" data-select-row aria-label="Select Bulk image saver"></td><td data-sticky="start">Bulk image saver</td><td>2.1.0</td><td data-align="end">5,102</td><td class="xxd-table__actions"><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs">Edit</button></td></tr>
  </tbody>
  <tfoot><tr><td></td><td colspan="2">3 extensions</td><td data-align="end">8,342</td><td></td></tr></tfoot>
</table></div>`,
    a11y: [
      "Headers are <th>; sortable columns set aria-sort and put the header text inside a button",
      "The select-all box has an aria-label and uses indeterminate for partial selection; the horizontally scrolling wrapper is keyboard-focusable",
    ],
  },
  Collapsible: {
    title: "Collapsible",
    summary: "Native <details>: FAQs and optional advanced settings. With a shared name only one stays open.",
    attributes: { "name (details)": "Only one open per group with the same name (accordion, native to the browser)" },
    markup: `<details class="xxd-collapse" name="faq" open><summary>Why square corners by default?</summary><p>It's a hard rule on the member site: no rounded dialogs, cards, buttons or inputs.</p></details>
<details class="xxd-collapse" name="faq"><summary>How do I pick an accent?</summary><p>There are 12 presets; ink is the first one and the default. Any other color works too.</p></details>
<details class="xxd-collapse" name="faq"><summary>Can I use React?</summary><p>@xxd/react, with the same tokens.</p></details>`,
    rules: ["Expanding only fades in with a small shift — no height animation"],
    a11y: [
      "<summary> is a button already: Enter / Space toggle it and screen readers announce the state",
      "Don't hide information people must see inside a collapsible",
    ],
  },
  Code: {
    title: "Code",
    summary: "Code blocks: light syntax highlighting, line numbers, a copy button.",
    attributes: {
      "data-highlight": "Light highlighting (js / ts / json / css / html / bash, via data-lang)",
      "data-lines": "Line numbers",
      ".xxd-code__head": "File name + copy",
    },
    markup: `<div class="xxd-code-block" style="max-width:520px">
  <div class="xxd-code__head">sidepanel.js<button class="xxd-btn" data-variant="ghost" data-icon-only data-size="xs" aria-label="Copy" data-copy-target="#code-demo code"><i data-xxd-icon="Copy" data-size="14"></i></button></div>
  <pre class="xxd-code" id="code-demo" tabindex="0" data-highlight data-lines><code data-lang="js">// Appearance settings live in chrome.storage
const store = createAppearanceStore({ key: "today-ui" });
await store.load();
Xxd.toast("Saved", { tone: "success" });</code></pre>
</div>
<p>Inline code <code class="xxd-code-inline">--r-sm</code>, keys <kbd class="xxd-kbd">⌘</kbd><kbd class="xxd-kbd">K</kbd></p>`,
    rules: ["Inline code at 12%, code blocks at 6%"],
    a11y: [
      "Code blocks that scroll sideways are keyboard-focusable (JS adds tabindex=\"0\") and scroll with arrow keys",
      "The copy button has an aria-label; highlight colors stay ≥ 4.5:1 in both light and dark",
    ],
  },
  Avatar: {
    title: "Avatar",
    summary: "A person's picture or initial; members get a small marker.",
    markup: `<div class="xxd-cluster">
  <span class="xxd-avatar">D</span> <span class="xxd-avatar" data-member>X</span>
</div>`,
    a11y: [
      "Avatar images have alt (the person's name); for an initial only, give it an aria-label or show the name next to it",
      "The member marker can't rely on color — say it in nearby text or in the aria-label",
    ],
  },
  Card: {
    title: "Card",
    use: ["A clickable item with an image: a poster, a style, a template"],
    avoid: ["A line of text without an image: use List", "Just framing a block of content: use LayerCard or whitespace"],
    summary: "One card in a masonry or grid: image, title, description; the whole card is clickable.",
    markup: `<div class="xxd-grid" style="--grid-min:200px">
  <a class="xxd-card" href="#"><div class="xxd-card__media" style="--ratio:3/4"></div><div class="xxd-card__body"><p class="xxd-card__title">Editorial poster</p><span class="xxd-card__meta">xxd-panel-001</span></div></a>
</div>`,
    rules: ["Cards have no shadow; hover only darkens the border", "Corner labels hug the corner (they read as UI)"],
    a11y: ["When the whole card is clickable it is one <a> — no links inside it", "Images have alt; purely decorative ones use alt=\"\""],
  },
  LayerCard: {
    title: "Layer card",
    summary: "A body (paper) + a secondary strip (wash): a note or action above or below the card. Don't nest them.",
    markup: `<div class="xxd-layer" style="width:100%;max-width:300px">
  <div class="xxd-layer__secondary">Next step<button class="xxd-btn" data-variant="ghost" data-icon-only data-size="xs" aria-label="Go" style="margin-left:auto"><i data-xxd-icon="ArrowRight" data-size="14"></i></button></div>
  <div class="xxd-layer__primary">Build your first extension with XXD UI</div>
</div>`,
    rules: ["Never put a layer card inside a layer card"],
    a11y: [
      "Buttons in the secondary strip have text or an aria-label",
      "Layers are shown with background and a divider; screen readers follow DOM order, body first",
    ],
  },
  Layout: {
    title: "Layout presets",
    summary: "Common two- and three-column layouts that stack into one column when the layout itself is narrower than 560px (it looks at its container, not the window, so it stacks inside a side panel too). Surfaces have three levels: base (paper), sunken (wash), raised (overlays only).",
    attributes: {
      "data-cols": "2up | 3up | 4up | 1-2 | 2-1 | 1-3 | side",
      "--layout-gap": "Gap",
      "data-level (.xxd-surface)": "base | sunken | raised",
    },
    markup: `<div class="xxd-layout" data-cols="1-2">
  <div class="xxd-surface" data-level="sunken" style="padding:16px">Side 1</div>
  <div class="xxd-surface" style="padding:16px">Main 2</div>
</div>`,
    a11y: [
      "Layouts are plain divs with no semantics; your own wrappers decide main / nav / aside",
      "When it stacks on narrow screens, DOM order is reading order",
    ],
  },
  TableOfContents: {
    title: "Table of contents",
    summary: "A contents list for long pages: the item for the section you've scrolled to is highlighted (data-spy).",
    attributes: { "data-spy": "Highlights the current section while scrolling", "data-depth=\"3\" (li)": "Second-level indent" },
    markup: `<nav aria-label="On this page"><p class="xxd-toc__title">On this page</p>
<ul class="xxd-toc" data-spy>
  <li><a href="#demo" aria-current="true">Demo</a></li>
  <li data-depth="3"><a href="#props">Attributes and classes</a></li>
  <li><a href="#rules">Rules</a></li>
</ul></nav>`,
    a11y: [
      "Wrap it in <nav aria-label=\"On this page\">; the current section has aria-current=\"true\"",
      "Links point at heading ids; the headings themselves are real h2 / h3",
    ],
  },
  Logo: {
    title: "XXD logo",
    summary: "Four small squares fading from full to light on a near-black square — one mark for every extension. Follows the theme (inverted in dark).",
    attributes: { "data-size": "sm | (default 20px) | lg", "--logo-size": "Any size" },
    markup: `<div class="xxd-cluster">
  <span class="xxd-logo" data-size="sm"><span class="xxd-logo__mark"></span>XXD</span>
  <span class="xxd-logo"><span class="xxd-logo__mark"></span>Long-form publisher</span>
  <span class="xxd-logo" data-size="lg"><span class="xxd-logo__mark"></span>XXD UI</span>
</div>`,
    a11y: ["The square mark is decoration (aria-hidden); the name is text", "Inside a link, the link's name is the product name"],
  },
  Prose: {
    title: "Prose",
    summary: "Long-form typography: headings, paragraphs, quotes, lists, code, at reading width.",
    markup: `<article class="xxd-prose"><h2>Editorial poster</h2><p>Restrained editorial brutalism.</p><blockquote>Motion reveals hierarchy.</blockquote></article>`,
    rules: ["One color at four strengths: 100% for pointing, 40% for lines and marks, 12% for inline code, 6% for code blocks", "Reading width 680px"],
    a11y: ["Use real h2 / h3, ul / ol and blockquote so screen readers can jump by structure", "Links are underlined; accent-colored list markers are decoration only"],
  },
  Stat: {
    title: "Stat",
    summary: "Label · number (tabular figures) · change from last period · sparkline. Change uses only two meaning colors: up (success) and down (danger).",
    markup: `<div class="xxd-stats" style="width:100%;max-width:640px">
  <div class="xxd-stat"><p class="xxd-stat__label">Posts this week</p><p class="xxd-stat__value">1,284<span class="xxd-stat__unit">posts</span></p><span class="xxd-stat__delta" data-tone="up">↑ 12.4% vs last week</span><span class="xxd-stat__spark" data-spark="8,9,7,11,10,13,15"></span></div>
  <div class="xxd-stat"><p class="xxd-stat__label">New members</p><p class="xxd-stat__value">86</p><span class="xxd-stat__delta" data-tone="down">↓ 3 vs last week</span><span class="xxd-stat__spark" data-spark="12,11,13,10,9,10,8"></span></div>
  <div class="xxd-stat"><p class="xxd-stat__label">Average write time</p><p class="xxd-stat__value">2.4<span class="xxd-stat__unit">s</span></p><span class="xxd-stat__delta">Flat</span><span class="xxd-stat__spark" data-spark="5,5,6,5,5,4,5"></span></div>
</div>`,
    js: `el.innerHTML = Xxd.sparkline([3, 5, 4, 8])  // or data-spark="3,5,4,8" and then Xxd.init()
// Spark bars (one number a day): Xxd.sparkline(values, { type: "bar" }) or data-spark-type="bar"`,
    a11y: ["The sparkline is aria-hidden decoration; write the change as text (↑ 12.4% vs last week), never color alone."],
  },
  Chart: {
    title: "Chart",
    rules: [
      "Series colors are fixed: series 1 is the accent, series 2–5 are ink mixed toward paper at 78% / 64% / 54% / 46% (the lightest still has 3:1 on paper)",
      "Colors differ only in lightness, so lines change style from series 3 on: solid, solid, dashed, dotted, dash-dot (WCAG 1.4.1: never color alone); series 1 is 2px wide, the rest 1.5px",
      "More than 5 series: split the chart, or highlight one and draw the rest as --muted-2 background lines",
      "Put a one-line conclusion or a data table next to the chart so screen readers and people who skip the chart get it too",
    ],
    summary: "ECharts + Xxd.chartOptions(): one highlighted line in the accent, the rest in shades of ink; hairline grid; redraws automatically when the theme or accent changes. Also works straight in Kumo's <Chart options>.",
    markup: `<div class="xxd-stack" style="--stack-gap:16px;width:100%;max-width:720px">
<div class="xxd-chart-card">
  <div class="xxd-chart-card__head"><h3 class="xxd-chart-card__title">Posts per day</h3><span class="xxd-chart-card__meta">Last 14 days</span></div>
  <div class="xxd-chart" id="chart-line"></div>
  <p class="xxd-text" data-variant="secondary">Long-form Publisher grew every day for 14 days, from 42 posts to 96; Image Sorter went from 20 to 40.</p>
</div>
<div class="xxd-chart-card">
  <div class="xxd-chart-card__head"><h3 class="xxd-chart-card__title">Users per extension</h3></div>
  <div class="xxd-chart" id="chart-bar" style="--chart-h:220px"></div>
  <p class="xxd-text" data-variant="secondary">Bulk Image Saver has the most users (5,102), then Long-form Publisher (2,410).</p>
</div>
</div>
<script>
  if (window.echarts) {
    const days = Array.from({ length: 14 }, (_, i) => \`Day \${i + 1}\`);
    const line = echarts.init(document.getElementById("chart-line"));
    const lineOpt = () => Xxd.chartOptions({ legend: {}, xAxis: { type: "category", data: days, boundaryGap: false }, yAxis: { type: "value" }, series: [{ name: "Long-form publisher", type: "line", data: [42, 48, 45, 60, 58, 66, 71, 69, 80, 78, 85, 90, 88, 96] }, { name: "Image sorter", type: "line", data: [20, 22, 25, 24, 28, 27, 30, 33, 31, 35, 34, 36, 38, 40] }] });
    line.setOption(lineOpt());
    Xxd.watchChartTheme(line, lineOpt);
    const bar = echarts.init(document.getElementById("chart-bar"));
    const barOpt = () => Xxd.chartOptions({ xAxis: { type: "category", data: ["Long-form publisher", "Link sorter", "Bulk image saver", "Today"] }, yAxis: { type: "value" }, series: [{ type: "bar", data: [2410, 830, 5102, 312] }] });
    bar.setOption(barOpt());
    Xxd.watchChartTheme(bar, barOpt);
    new ResizeObserver(() => { line.resize(); bar.resize(); }).observe(document.getElementById("chart-line").parentElement.parentElement);
  }
</script>`,
    js: `chart.setOption(Xxd.chartOptions(option))
Xxd.watchChartTheme(chart, () => Xxd.chartOptions(option))
// React: <Chart echarts={echarts} options={Xxd.chartOptions(option)} />`,
    a11y: ["Put a one-sentence conclusion or a table next to the chart; besides color, line width also marks the highlighted line."],
  },
  Gauge: {
    title: "Gauge",
    summary: "Where one number sits in a range: quota used, a score, progress toward a goal. Three shapes (270° arc, half circle, full ring); the track is a light gray and the fill is the accent, switching to a meaning color only inside a zone. Also target marks, ticks, segments, ranges, stacked parts, concentric rings and a thin needle.",
    attributes: {
      "data-gauge": "Declarative: Xxd.init() draws it from the data-* below; after changing data-*, call Xxd.initGauges() again",
      "data-value": "The value; with data-from it is a range (data-from to data-value)",
      "data-min / data-max": "The range (default 0–100)",
      "data-shape": "arc (default, 270°, opening at the bottom) | half | ring",
      "data-unit / data-label": "Unit; label (shown under the number, and the name screen readers read)",
      "data-zones": "Zones, for meaning only: 80-90:warning,90:danger; with a name: 0-20:danger:Battery low",
      "data-target": "Target marks, one or more: 80,95",
      "data-ticks": "Ticks: how many parts the arc is split into",
      "data-segments": "Segments: N cells, a cell lights only when full",
      "data-needle": "Thin needle (arc / half); no fill is drawn with a needle",
      "data-parts": "Stacked parts: Images:38;Video:22 (each part's own amount, end to end)",
      "data-rings": "Concentric rings, at most 3: Writing:3/5;Reading:40/60 (each ring has its own maximum)",
      "data-size": "sm | lg: size of the number in the middle",
      "--gauge-size": "Maximum width (default 160px); put a row of gauges in .xxd-gauges",
      "data-origin": "The fill grows both ways from this value (variance, profit and loss, e.g. 0); a tick marks the origin",
      "data-compact": "Abbreviate large numbers: \"12.5K\"",
    },
    markup: `<div class="xxd-gauges" style="width:100%;max-width:560px">
  <div class="xxd-gauge" data-gauge data-value="72" data-unit="%" data-label="Storage used" data-target="80" data-zones="80-90:warning,90:danger"></div>
  <div class="xxd-gauge" data-gauge data-value="94" data-unit="%" data-label="Monthly quota" data-target="80" data-zones="80-90:warning,90:danger"></div>
  <div class="xxd-gauge" data-gauge data-shape="ring" data-segments="8" data-max="8" data-value="5" data-unit="glasses" data-label="Water today"></div>
</div>`,
    rules: [
      "A gauge answers one question: where is this number in its range (quota used, a score, progress). Use a line chart for trends and a bar chart for comparisons; don't build a chart out of a row of gauges",
      "The fill is the accent (ink when there is no accent); it changes color only inside a warning / danger / success zone, and the state is written under the number, never color alone",
      "Only three shapes: arc (270°), half (180°), ring (full circle). Track and fill ends follow the corner mode (--stroke-cap); the cuts between segments and parts are always flat",
      "The number, unit and end labels are HTML text (system font, tabular figures), not drawn into the SVG; only the two ends are labelled",
      "No entrance animation; when the value changes the needle turns (220ms) and the fill jumps straight there",
      "Stacked parts and rings always come with a legend that states the numbers; at most 3 rings, in the same category colors as charts",
      "§1",
      "§8",
      "§14",
    ],
    a11y: [
      "One value: role=meter + aria-valuenow / min / max, and aria-valuetext is the full sentence (\"94%, Over limit, target 80%\"); the name comes from data-label, or write aria-label yourself",
      "Ranges, stacked parts and rings: role=group + aria-label; the legend is plain text that screen readers read as is; the SVG is always aria-hidden",
      "Windows high contrast: track GrayText, fill Highlight, target and needle CanvasText",
    ],
    js: `Xxd.gauge(el, { value: 72, unit: "%", label: "Storage used", zones: [{ from: 80, to: 90, tone: "warning" }, { from: 90, tone: "danger" }], target: 80 })
// Declarative: <div class="xxd-gauge" data-gauge data-value="72" …></div>, drawn by Xxd.init()
// React: <Gauge value={72} unit="%" label="Storage used" zones={[{ from: 90, tone: "danger" }]} target={80} />
// Geometry only (mini programs, servers): import { gaugeModel } from "@xxd/css/gauge"`,
    examples: [
      { title: "Needle and ticks", markup: `<div class="xxd-gauges" style="width:100%;max-width:560px">
  <div class="xxd-gauge" data-gauge data-shape="half" data-needle data-ticks="10" data-value="64" data-unit="%" data-label="CPU load" data-zones="80:danger"></div>
  <div class="xxd-gauge" data-gauge data-needle data-ticks="12" data-max="120" data-value="38" data-unit="ms" data-label="Response time" data-zones="60-90:warning,90:danger"></div>
</div>` },
      { title: "Range", markup: `<div class="xxd-gauges" style="width:100%;max-width:560px">
  <div class="xxd-gauge" data-gauge data-shape="half" data-min="-10" data-max="40" data-from="12" data-value="26" data-unit="°C" data-label="Temperature today"></div>
  <div class="xxd-gauge" data-gauge data-from="60" data-value="75" data-label="Target range" data-unit="kg" data-min="40" data-max="100"></div>
</div>` },
      { title: "Stacked parts", markup: `<div class="xxd-gauges" style="width:100%;max-width:560px">
  <div class="xxd-gauge" data-gauge data-shape="ring" data-max="100" data-unit="GB" data-label="Storage used" data-parts="Images:38;Video:22;Documents:9"></div>
</div>` },
      { title: "Rings", markup: `<div class="xxd-gauges" style="width:100%;max-width:560px">
  <div class="xxd-gauge" data-gauge data-shape="ring" data-label="This week" data-rings="Writing:3/5;Reading:40/60;Exercise:2/4"></div>
</div>` },
      { title: "Sizes", markup: `<div class="xxd-gauges" style="width:100%;max-width:560px">
  <div class="xxd-gauge" data-gauge data-size="sm" style="--gauge-size:120px" data-value="36" data-unit="%" data-label="Small"></div>
  <div class="xxd-gauge" data-gauge data-value="36" data-unit="%" data-label="Default"></div>
  <div class="xxd-gauge" data-gauge data-size="lg" style="--gauge-size:220px" data-value="36" data-unit="%" data-label="Large"></div>
</div>` },
      { title: "Growing from an origin", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <div class="xxd-gauges">
    <div class="xxd-gauge" data-gauge data-shape="half" data-min="-50" data-max="50" data-origin="0" data-value="-12" data-unit="%" data-label="Against budget"></div>
    <div class="xxd-gauge" data-gauge data-shape="half" data-min="-50" data-max="50" data-origin="0" data-value="18" data-unit="%" data-label="Against last month"></div>
  </div>
</div>` },
    ],
  },
  Bars: {
    title: "Bar list",
    summary: "Comparing a few categories or a ranking: name on the left, bar in the middle, number on the right, sorted by size. Mark one as the highlight (accent, the rest gray); cut bars into units; diverging bars grow both ways from a center line; a funnel says how many each step keeps; a waterfall breaks a total into changes. Add a comparison value (last year), a reference line (average), an axis and notes. Bars are proportional to the largest value, with no track.",
    attributes: {
      "data-viz=\"bars\" + data-items": "Declarative: \"name:value;name:value\", drawn by Xxd.init() (needs viz.js)",
      "data-highlight": "Names to highlight (comma separated): highlighted bars use the accent, the rest gray 9",
      "data-step": "How much one unit is: bars are cut into units (at most 60)",
      "data-variant": "diverging | funnel | waterfall",
      "data-unit / data-max / data-sort=\"false\"": "Unit; the value of a full bar (default: the largest); keep the given order",
      "data-rungs + --rungs": "Cut into units when you write the HTML yourself: --rungs is how many units a full bar has",
      "--value": "Each row's share when you write the HTML yourself (0–1; −1–1 for diverging)",
      "--bars-label": "Width of the name column (default 28%)",
      "data-items: value/compare": "A comparison value (last year): \"Publisher:2410/1980\" draws a thin gray bar under the main one and writes it under the number",
      "data-value-label / data-compare-label": "Legend names for the main and comparison bars (\"This year\", \"Last year\")",
      "data-mark + data-mark-label": "Reference line (average, target): a thin ink line across all rows, labelled above (\"Average 1,800 users\")",
      "data-axis": "A row of tick values below (rounded to 1 / 2 / 5 × 10ⁿ), with hairline gridlines behind the bars",
      "data-total": "In a waterfall (data-variant=\"waterfall\"), the names of total rows (comma separated): totals start at 0 in the accent; the rest are changes",
      "data-compact": "Abbreviate large numbers: \"12.5K\"",
    },
    markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <div class="xxd-chart-card">
  <div class="xxd-chart-card__head"><h3 class="xxd-chart-card__title">Bulk Image Saver has the most users</h3><span class="xxd-chart-card__meta">Last 30 days</span></div>
  <ol class="xxd-bars" data-viz="bars" data-unit="users" data-highlight="Bulk image saver" data-items="Long-form publisher:2410;Link sorter:830;Bulk image saver:5102;Today:312"></ol>
  <p class="xxd-chart-card__note">Weekly active users per extension.</p>
</div>
</div>`,
    rules: ["Use it for rankings and a few categories (≤ 12); use a line chart for trends", "Bars start at 0 and are proportional to the value; never break the axis", "Positive and negative are both ink, told apart by direction and the − sign, not red and green (up is not always good)", "Waterfall changes are gray 9 with + / −, totals are the accent; no red and green", "Comparison values stay in the background: a thin gray bar plus a line of text under the number; main and comparison differ by weight", "§14"],
    a11y: ["An ordered list: each row's text is the data (name, value, how many stayed), read as is; the bar itself is aria-hidden", "Highlight is not color alone: the name turns to body color, and the title states the conclusion", "Comparison values and notes are written under the number (text), read as is; the legend and axis rows are aria-hidden (all data is in each row's text)"],
    js: `Xxd.viz(el, "bars", [{ label: "Publisher", value: 2410 }, { label: "Image saver", value: 5102, highlight: true }], { unit: "users" })
// Declarative: <ol class="xxd-bars" data-viz="bars" data-items="Publisher:2410;Image saver:5102"></ol>
// React: <Bars items={[{ label: "Publisher", value: 2410 }]} unit="users" />`,
    examples: [
      { title: "Cut into units", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <ol class="xxd-bars" data-viz="bars" data-step="1" data-unit="posts" data-items="Mon:3;Tue:5;Wed:2;Thu:6" data-sort="false"></ol>
  <p class="xxd-chart-card__note">1 unit = 1 post</p>
</div>` },
      { title: "Diverging", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <ol class="xxd-bars" data-viz="bars" data-variant="diverging" data-unit="%" data-items="Posters:18;Covers:6;Notes:-4;Long images:-11"></ol>
</div>` },
      { title: "Funnel", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <ol class="xxd-bars" data-viz="bars" data-variant="funnel" data-unit="people" data-items="Opened:12480;Wrote a post:5210;Became a member:742"></ol>
</div>` },
      { title: "Comparison, reference line and axis", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <ol class="xxd-bars" data-viz="bars" data-unit="users" data-axis data-mark="1800" data-mark-label="Average" data-value-label="This year" data-compare-label="Last year" data-items="Publisher:2410/1980;Link sorter:830/1020;Image saver:3102/2400;Today:312/0"></ol>
</div>` },
      { title: "Waterfall", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <ol class="xxd-bars" data-viz="bars" data-variant="waterfall" data-unit="k" data-total="Gross,Net" data-items="Gross:120;Refunds:-14;Channel fees:-22;Subsidy:6;Net:90"></ol>
</div>` },
    ],
  },
  Proportion: {
    title: "Proportion bar",
    summary: "One whole split into parts (≤ 5): a bar divided by share, with a legend of names, values and percentages (adding up to exactly 100%). Several in a column make a stacked bar chart.",
    attributes: {
      "data-viz=\"proportion\" + data-parts": "Declarative: \"name:value;name:value\" (needs viz.js)",
      "data-label / data-unit": "Title (top row, with the total on the right); unit",
      "data-legend=\"false\"": "No legend (when stacking several, draw it under the last one only)",
      "data-max": "When stacking several, bar length is total ÷ max (shows both make-up and size)",
    },
    markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:480px">
  <div class="xxd-proportion" data-viz="proportion" data-label="Storage used" data-unit="GB" data-parts="Images:38;Video:22;Documents:9;Other:3"></div>
</div>`,
    rules: ["At most 5 parts; merge the rest into \"Other\"", "Percentages are rounded with the largest remainder method, so they add up to exactly 100%", "Colors are the 5 chart category colors; the first part is the accent", "§14"],
    a11y: ["role=group with a full-sentence aria-label (\"Images 53%, Video 31%…\"); the bar is aria-hidden and the legend is text"],
    js: `Xxd.viz(el, "proportion", [{ label: "Images", value: 38 }, { label: "Video", value: 22 }], { label: "Storage used", unit: "GB" })
// React: <Proportion parts={[…]} label="Storage used" unit="GB" />`,
    examples: [
      { title: "Stacked", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:480px">
  <div class="xxd-proportion" data-viz="proportion" data-max="92" data-legend="false" data-label="East" data-unit="k" data-parts="Members:62;Single posts:21;Ads:9"></div>
  <div class="xxd-proportion" data-viz="proportion" data-max="92" data-legend="false" data-label="South" data-unit="k" data-parts="Members:41;Single posts:30;Ads:14"></div>
  <div class="xxd-proportion" data-viz="proportion" data-max="92" data-label="North" data-unit="k" data-parts="Members:35;Single posts:12;Ads:18"></div>
</div>` },
    ],
  },
  Waffle: {
    title: "Waffle",
    summary: "A unit chart for shares: 10 × 10, one cell = 1%, with a legend and a note on the unit. When all you have is a few percentages, it is more honest than a pie: you can count it.",
    attributes: {
      "data-viz=\"waffle\" + data-parts": "Declarative: \"name:value;name:value\" (counts or percentages; needs viz.js)",
      "data-cells": "Number of cells (default 100)",
      "--waffle-size": "Width of the grid (default 160px)",
    },
    markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:480px">
  <div class="xxd-waffle" data-viz="waffle" data-label="Where new members come from" data-parts="Friends:46;Search:27;WeChat:18;Other:9"></div>
</div>`,
    rules: ["Instead of a pie: use it when you only have shares, ≤ 5 kinds", "Cells are allotted by the largest remainder method, exactly 100 in total, no made-up cells", "Say what a cell is (\"1 cell = 1%\")", "§14"],
    a11y: ["role=group with a full-sentence aria-label; the cells are aria-hidden and the legend states the percentages"],
    js: `Xxd.viz(el, "waffle", [{ label: "Friends", value: 46 }, { label: "Search", value: 27 }], { label: "Where new members come from" })
// React: <Waffle parts={[…]} label="Where new members come from" />`,
  },
  Heatmap: {
    title: "Heatmap",
    summary: "Darker means more: a calendar (53 weeks × 7 days, which days were active) and a matrix (two dimensions × a value, such as weekday × hour, with numbers in the cells if you like). Zero plus 4 levels, gray with ink, the accent scale with an accent.",
    attributes: {
      "data-viz=\"heatmap\" + data-values": "Calendar: JSON like {\"2026-03-02\": 5} (needs viz.js)",
      "data-end / data-weeks": "Last day (default today); weeks shown (default 53)",
      "data-variant=\"matrix\" + data-rows / data-cols / data-values": "Matrix: row and column names comma separated, values one row per group, separated by semicolons",
      "data-numbers": "Write the numbers in matrix cells",
      "--heat-cell": "Calendar cell size (default 12px)",
    },
    markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:760px">
  <div class="xxd-chart-card">
  <div class="xxd-chart-card__head"><h3 class="xxd-chart-card__title">More writing on weekdays than at weekends</h3><span class="xxd-chart-card__meta">Through Oct 19</span></div>
  <div class="xxd-heatmap" data-viz="heatmap" data-end="2026-10-19" data-unit="posts" data-values='{"2026-10-19":2,"2026-10-17":1,"2026-10-16":1,"2026-10-14":1,"2026-10-13":1,"2026-10-12":6,"2026-10-11":1,"2026-10-09":1,"2026-10-08":6,"2026-10-07":2,"2026-10-06":2,"2026-10-05":2,"2026-10-02":2,"2026-10-01":2,"2026-09-30":1,"2026-09-29":2,"2026-09-28":6,"2026-09-24":2,"2026-09-22":2,"2026-09-21":3,"2026-09-17":1,"2026-09-16":6,"2026-09-15":4,"2026-09-14":9,"2026-09-11":4,"2026-09-10":4,"2026-09-09":9,"2026-09-08":1,"2026-09-04":3,"2026-09-03":9,"2026-09-02":6,"2026-08-31":9,"2026-08-28":2,"2026-08-26":2,"2026-08-25":9,"2026-08-24":9,"2026-08-22":2,"2026-08-19":6,"2026-08-17":6,"2026-08-15":2,"2026-08-14":2,"2026-08-13":2,"2026-08-12":1,"2026-08-11":4,"2026-08-10":4,"2026-08-07":1,"2026-08-06":6,"2026-08-05":6,"2026-08-04":6,"2026-08-03":1,"2026-07-31":1,"2026-07-30":2,"2026-07-29":4,"2026-07-28":1,"2026-07-25":3,"2026-07-23":9,"2026-07-22":9,"2026-07-20":9,"2026-07-19":2,"2026-07-18":4,"2026-07-16":2,"2026-07-15":2,"2026-07-13":2,"2026-07-09":1,"2026-07-08":3,"2026-07-07":2,"2026-07-06":2,"2026-07-03":2,"2026-07-02":2,"2026-06-28":9,"2026-06-26":1,"2026-06-24":2,"2026-06-23":4,"2026-06-22":4,"2026-06-19":2,"2026-06-18":4,"2026-06-17":1,"2026-06-16":4,"2026-06-14":1,"2026-06-10":2,"2026-06-09":4,"2026-06-08":6,"2026-06-05":2,"2026-06-04":2,"2026-06-03":9,"2026-06-01":9,"2026-05-29":2,"2026-05-28":1,"2026-05-27":2,"2026-05-26":2,"2026-05-24":3,"2026-05-23":2,"2026-05-21":6,"2026-05-19":4,"2026-05-15":2,"2026-05-14":1,"2026-05-11":2,"2026-05-10":9,"2026-05-08":1,"2026-05-07":9,"2026-05-05":1,"2026-05-04":3,"2026-05-03":1,"2026-05-01":1,"2026-04-30":2,"2026-04-29":9,"2026-04-28":9,"2026-04-27":2,"2026-04-23":2,"2026-04-21":1,"2026-04-20":4,"2026-04-19":2,"2026-04-17":3,"2026-04-14":4,"2026-04-13":2,"2026-04-11":1,"2026-04-10":9,"2026-04-09":2,"2026-04-08":6,"2026-04-06":6,"2026-04-05":4,"2026-04-04":4,"2026-04-03":9,"2026-04-02":1,"2026-04-01":3,"2026-03-31":1,"2026-03-30":2,"2026-03-28":3,"2026-03-27":2,"2026-03-26":2,"2026-03-23":3,"2026-03-20":9,"2026-03-19":1,"2026-03-18":2,"2026-03-17":1,"2026-03-16":1,"2026-03-13":2,"2026-03-12":1,"2026-03-11":4,"2026-03-09":3,"2026-03-07":2,"2026-03-04":2,"2026-03-03":3,"2026-03-02":2,"2026-03-01":2,"2026-02-28":1,"2026-02-26":1,"2026-02-24":2,"2026-02-23":2,"2026-02-21":6,"2026-02-20":6,"2026-02-18":2,"2026-02-16":2,"2026-02-14":1,"2026-02-12":3,"2026-02-11":1,"2026-02-10":6,"2026-02-07":2,"2026-02-06":1,"2026-02-05":2,"2026-02-04":1,"2026-02-03":4,"2026-01-31":3,"2026-01-30":2,"2026-01-29":6,"2026-01-28":3,"2026-01-27":2,"2026-01-26":1,"2026-01-25":1,"2026-01-24":1,"2026-01-23":3,"2026-01-22":2,"2026-01-21":2,"2026-01-20":6,"2026-01-16":2,"2026-01-15":6,"2026-01-12":1,"2026-01-08":2,"2026-01-07":1,"2026-01-06":4,"2026-01-02":1,"2026-01-01":2,"2025-12-31":1,"2025-12-30":1,"2025-12-26":1,"2025-12-24":1,"2025-12-22":2,"2025-12-21":9,"2025-12-19":9,"2025-12-17":1,"2025-12-16":2,"2025-12-15":2,"2025-12-14":3,"2025-12-12":9,"2025-12-11":3,"2025-12-09":2,"2025-12-08":3,"2025-12-06":9,"2025-12-05":1,"2025-12-03":3,"2025-11-30":9,"2025-11-29":9,"2025-11-27":2,"2025-11-26":1,"2025-11-25":3,"2025-11-23":3,"2025-11-21":2,"2025-11-20":9,"2025-11-19":2,"2025-11-18":9,"2025-11-17":6,"2025-11-16":2,"2025-11-14":1,"2025-11-12":4,"2025-11-10":2,"2025-11-07":4,"2025-11-06":6,"2025-11-04":4,"2025-10-31":1,"2025-10-29":2,"2025-10-28":3,"2025-10-27":4,"2025-10-26":4,"2025-10-24":1,"2025-10-22":2,"2025-10-21":1,"2025-10-17":3,"2025-10-16":2,"2025-10-15":6,"2025-10-14":3}'></div>
  <p class="xxd-chart-card__note">Each cell is a day; darker means more posts.</p>
</div>
</div>`,
    rules: ["Only zero plus 4 levels: more cannot be told apart", "The latest week is on the right; on narrow screens it scrolls sideways and starts at the right end", "§14"],
    a11y: ["The cells are one image (role=img) whose aria-label is a summary (\"251 of 365 days with activity, 812 in total, at most 9 in a day\")", "The part that scrolls sideways is role=region + aria-label + tabindex=0: keyboard users can focus it and scroll with the arrow keys", "Each cell has a title (date and value) for mouse users; nothing depends on it", "Numbers on the two darkest matrix levels use --on-action, ≥ 4.5:1"],
    js: `Xxd.viz(el, "calendar", { "2026-10-18": 3, "2026-10-19": 5 }, { end: "2026-10-19", unit: "posts" })
Xxd.viz(el, "matrix", { rows: ["Mon", "Tue"], cols: ["9", "10"], values: [[1, 4], [0, 8]] }, { numbers: true })
// React: <Heatmap values={…} unit="posts" /> or <Heatmap matrix={{ rows, cols, values }} numbers />`,
    examples: [
      { title: "Matrix", markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:560px">
  <div class="xxd-heatmap" data-viz="heatmap" data-variant="matrix" data-numbers data-label="When people write" data-rows="Mon,Tue,Wed,Thu,Fri,Sat,Sun" data-cols="8,10,12,14,16,18,20,22" data-values="2,6,4,5,7,3,9,4;1,5,6,4,6,4,8,5;2,7,5,6,8,3,10,6;1,6,4,5,7,4,9,5;3,8,6,7,9,5,6,2;0,1,2,3,2,4,5,3;0,1,1,2,3,5,7,4"></div>
</div>` },
    ],
  },
  Dumbbell: {
    title: "Dumbbell",
    summary: "Before and after per category (≤ 8 rows): a thin line joins two dots, a hollow ring for before and a solid dot (accent) for after, with \"before → after\" and the change on the right. Positions follow the data's range and need not start at 0 (it compares position, not length).",
    attributes: {
      "data-viz=\"dumbbell\" + data-rows": "Declarative: \"name:before>after;…\" (needs viz.js)",
      "data-from-label / data-to-label": "Names of the two dots (default \"Before\" / \"After\")",
      "data-min / data-max / data-unit": "Range of positions (default: the data's range); unit",
    },
    markup: `<div class="xxd-stack" style="--stack-gap:24px;width:100%;max-width:520px">
  <div class="xxd-dumbbell" data-viz="dumbbell" data-unit="min" data-from-label="Before" data-to-label="After" data-rows="First post:14>6;Images ready:9>4;Layout done:21>12;Published:5>3"></div>
</div>`,
    rules: ["Use it for two points in time and ≤ 8 categories; use a line chart for more points", "Dots are always round (--r-circle)", "§14"],
    a11y: ["An ordered list: each row reads \"name before → after change\"; the dots and line are aria-hidden", "Before and after are not color alone: one hollow, one solid, with a key above"],
    js: `Xxd.viz(el, "dumbbell", [{ label: "First post", from: 14, to: 6 }], { unit: "min", fromLabel: "Before", toLabel: "After" })
// React: <Dumbbell rows={[…]} unit="min" fromLabel="Before" toLabel="After" />`,
  },
};
