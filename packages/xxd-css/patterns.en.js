// patterns.json 的英文版（展示站 /en/ 用）。按 name 对应；规则同 registry.en.js。
export const patterns = {
  DropZone: {
    title: "Drop zone and drag veil",
    from: "Image sorter",
    summary: "When empty it is a dashed area: drag things in, pick files, or paste. Once there is content, dragging anywhere over the panel shows “Drop to add”.",
    markup: `<div id="drop-demo" class="xxd-frame" data-surface="page" style="position:relative;padding:var(--inset-md);min-height:220px">
  <div class="xxd-dropzone" id="drop-zone">
    <i data-xxd-icon="ImagePlus" data-size="24"></i>
    <p class="xxd-dropzone__title">Drag images here</p>
    <p class="xxd-help">Or <button class="xxd-link" type="button">choose image files</button>, or paste links with ⌘V</p>
  </div>
  <p class="xxd-help" id="drop-out" style="margin-top:var(--space-3)"></p>
</div>
<script>
  Xxd.bindDrop(document.getElementById("drop-demo"), {
    zone: document.getElementById("drop-zone"),
    onFiles: (files) => (document.getElementById("drop-out").textContent = \`Got \${files.length} files\`),
    onText: (text) => (document.getElementById("drop-out").textContent = \`Got text: \${text.slice(0, 40)}\`),
  });
</script>`,
    anatomy: [
      "Dashed area: icon · one sentence · other ways in (pick files / paste)",
      "Veil: covers the whole panel with one sentence and disappears when you drag out",
    ],
    rules: ["Every way in says what it will bring before you click", "Doesn't take over when pasting into an input"],
    js: `const off = Xxd.bindDrop(panel, { zone, onFiles(files) {…}, onText(text) {…}, veil: "Drop to add to this set" })`,
  },
  Viewer: {
    title: "Image viewer",
    from: "Image sorter, member site",
    summary: "Open an image large, ← → to flip through, Esc returns to the same one; actions sit in a dark pill at the bottom.",
    markup: `<div class="xxd-cluster" id="viewer-demo">
  <button class="xxd-btn" data-i="0">Open image 1</button><button class="xxd-btn" data-i="2">Open image 3</button>
</div>
<script>
  const pics = ["#d65f32", "#3b74b8", "#5a8a3c", "#7b61b0"].map((c, i) => ({ src: \`data:image/svg+xml,\${encodeURIComponent(\`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='560'><rect width='800' height='560' fill='\${c}'/><text x='400' y='300' font-size='64' fill='white' text-anchor='middle' font-family='sans-serif'>\${i + 1}</text></svg>\`)}\`, alt: \`Image \${i + 1}\` }));
  document.getElementById("viewer-demo").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) Xxd.openViewer(pics, Number(b.dataset.i), { actions: [{ label: "Copy image", run: () => Xxd.toast("Image copied", { tone: "success" }) }, { label: "Download", run: () => Xxd.toast("Download started") }] });
  });
</script>`,
    rules: ["On close, focus returns to the thumbnail that opened it", "Action pill: dark and translucent, like X's own image controls"],
  },
  Sortable: {
    title: "Drag to sort",
    from: "Member site navigation, image sorter",
    summary: "Drag the handle to reorder; the other items slide to their new places (FLIP). Long-press on touch. Keyboard: Space on a handle picks it up, ↑ ↓ move, Space drops, Esc cancels.",
    markup: `<ul class="xxd-list xxd-group__body xxd-sortable" data-xxd-sortable style="width:100%;max-width:300px" id="sort-demo">
  <li class="xxd-list__item" data-sort-item data-id="write"><button class="xxd-sort-handle" aria-label="Drag to reorder: Write" aria-pressed="false"><i data-xxd-icon="GripVertical" data-size="16"></i></button>Write</li>
  <li class="xxd-list__item" data-sort-item data-id="prompts"><button class="xxd-sort-handle" aria-label="Drag to reorder: Prompts" aria-pressed="false"><i data-xxd-icon="GripVertical" data-size="16"></i></button>Prompts</li>
  <li class="xxd-list__item" data-sort-item data-id="history"><button class="xxd-sort-handle" aria-label="Drag to reorder: History" aria-pressed="false"><i data-xxd-icon="GripVertical" data-size="16"></i></button>History</li>
  <li class="xxd-list__item" data-sort-item data-id="settings"><button class="xxd-sort-handle" aria-label="Drag to reorder: Settings" aria-pressed="false"><i data-xxd-icon="GripVertical" data-size="16"></i></button>Settings</li>
</ul>
<p class="xxd-help" id="sort-out"></p>
<script>document.getElementById("sort-demo").addEventListener("xxd:change", (e) => (document.getElementById("sort-out").textContent = "New order: " + e.detail.order.join(" · ")));</script>`,
    rules: ["Animation moves transform only (FLIP); with reduced motion items jump straight into place", "Every reorder can be done without dragging (keyboard)"],
    js: `list.addEventListener("xxd:change", (e) => e.detail.order)
await Xxd.flip(container, () => reorderDom())  // the general “slide into the new place”`,
  },
  History: {
    title: "History by day",
    from: "Long-form publisher, image sorter",
    summary: "One row per entry under “Today / Yesterday / Sep 12” headings: stacked thumbnails, title, method · time; Delete appears on hover (click twice to confirm).",
    markup: `<div class="xxd-history" style="max-width:420px">
  <section><h3 class="xxd-history__day">Today</h3>
    <ul class="xxd-list xxd-group__body" data-interactive>
      <li class="xxd-list__item"><span class="xxd-thumbs"><img src="/demo/poster-1.svg" alt=""><img src="/demo/poster-2.svg" alt=""><img src="/demo/poster-3.svg" alt=""></span><div class="xxd-list__main"><div class="xxd-list__title">24 images</div><div class="xxd-list__meta">Gradient · 14:02</div></div><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs" data-confirm-twice="Confirm delete">Delete</button><button class="xxd-btn" data-size="xs">Open</button></li>
      <li class="xxd-list__item"><span class="xxd-thumbs"><img src="/demo/poster-4.svg" alt=""><img src="/demo/poster-5.svg" alt=""></span><div class="xxd-list__main"><div class="xxd-list__title">8 images</div><div class="xxd-list__meta">As is · 09:40</div></div><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs" data-confirm-twice="Confirm delete">Delete</button><button class="xxd-btn" data-size="xs">Open</button></li>
    </ul></section>
  <section><h3 class="xxd-history__day">Yesterday</h3>
    <ul class="xxd-list xxd-group__body" data-interactive>
      <li class="xxd-list__item"><span class="xxd-thumbs"><img src="/demo/poster-6.svg" alt=""></span><div class="xxd-list__main"><div class="xxd-list__title">A long post about design systems</div><div class="xxd-list__meta">Posted to X · 21:15</div></div><button class="xxd-btn xxd-reveal" data-variant="ghost" data-size="xs" data-confirm-twice="Confirm delete">Delete</button><button class="xxd-btn" data-size="xs">Open</button></li>
    </ul></section>
  <button class="xxd-link" data-confirm-twice="Confirm clearing all history" data-tone="danger">Clear all history</button>
</div>`,
    rules: ["At most 50 rows; doing the same set again only updates that row", "Delete takes two clicks (no dialog)"],
  },
  ConfirmTwice: {
    title: "Two-step confirm",
    from: "Image sorter",
    summary: "For deletes that are hard to undo but not serious: the first click turns the button into “Confirm delete” (danger color), and only a second click within 3 seconds does it. No dialog.",
    markup: `<button class="xxd-btn" data-confirm-twice="Confirm delete" id="twice-demo">Delete this set</button>
<script>document.getElementById("twice-demo").addEventListener("xxd:confirm", () => Xxd.toast("Deleted", { tone: "success" }));</script>`,
    rules: ["Without a second click within 3 seconds it goes back to normal", "For truly irreversible, high-impact deletes, use “type the name to delete” (Dialog)"],
  },
  SignIn: {
    title: "Sign in",
    from: "All extensions",
    summary: "When signed out, the side panel shows only this screen: logo, name, one sentence, a new-account offer, Continue with Google, or email (two steps: email → password), and the terms.",
    markup: `<div class="xxd-auth xxd-frame" data-xxd-auth>
  <span class="xxd-logo" data-size="lg"><span class="xxd-logo__mark"></span></span>
  <h2 class="xxd-auth__name">XXD · Long-form publisher</h2>
  <p class="xxd-auth__line">Writes Markdown into X Articles, with formatting and images.</p>
  <span class="xxd-auth__gift">New accounts get 7 days of full access</span>
  <form>
    <button class="xxd-btn" data-block type="button"><svg class="ui-icon" width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continue with Google</button>
    <div class="xxd-auth__or">or use email</div>
    <div data-step="email" data-active>
      <input class="xxd-input" type="email" placeholder="you@example.com" aria-label="Email" required>
      <button class="xxd-btn" data-variant="primary" data-block data-auth-next="password">Continue</button>
    </div>
    <div data-step="password">
      <p class="xxd-help">Sign in as <b data-auth-email></b></p>
      <input class="xxd-input" type="password" placeholder="Password" aria-label="Password">
      <div class="xxd-cluster"><button class="xxd-btn ui-dialog-cancel" data-auth-back="email">Back</button><button class="xxd-btn" data-variant="primary" style="flex:1">Continue</button></div>
      <button class="xxd-link" type="button" style="justify-self:start">Forgot password?</button>
    </div>
  </form>
  <p class="xxd-auth__terms">By continuing you agree to the <a class="xxd-link" href="#">Terms of Service</a> and <a class="xxd-link" href="#">Privacy Policy</a></p>
</div>`,
    rules: [
      "<html data-account> is set before the first frame (the sign-in page never flashes)",
      "“Continue” is always there; when the email is malformed, a line under the field says how to fix it (Xxd.setFieldError) and focus returns to the field",
      "When an expired session lands back here, say why in one sentence",
    ],
  },
  Membership: {
    title: "Membership and purchase",
    from: "Long-form publisher, image sorter",
    summary: "One plan line on the account card; “Become a member / Renew” opens the purchase panel in place: pick a plan · pick a payment method · QR code · “I've paid, check now”. Every outcome gets its own sentence.",
    markup: `<div class="xxd-stack" style="max-width:380px">
  <div class="xxd-group__body"><div class="xxd-account"><span class="xxd-avatar" data-member style="--avatar-size:36px">D</span><div class="xxd-account__main"><div class="xxd-account__name">Dong</div><div class="xxd-plan-line" data-tone="member" id="plan-line">Full access · 6 days left</div></div><button class="xxd-btn" data-size="sm" data-variant="primary" id="buy">Become a member</button></div></div>
  <div class="xxd-plans" role="radiogroup" aria-label="Plan">
    <label class="xxd-plan"><input type="radio" class="xxd-radio" name="plan" checked><span class="xxd-plan__name">Monthly<small>A renewal reminder every month</small></span><span class="xxd-plan__price">¥29</span></label>
    <label class="xxd-plan"><input type="radio" class="xxd-radio" name="plan"><span class="xxd-plan__name">Yearly<small>Works out to ¥19 a month</small></span><span class="xxd-plan__price">¥228</span></label>
  </div>
  <p class="xxd-help">Your remaining trial days are kept; renewals start from your current end date.</p>
  <div class="xxd-segmented" data-xxd-segmented data-block aria-label="Payment method"><button role="radio" aria-checked="true">WeChat Pay</button><button role="radio">Alipay</button><button role="radio">Card</button></div>
  <div class="xxd-qr"><svg class="xxd-qr__code" viewBox="-2 -2 37 37" role="img" aria-label="Payment QR code" shape-rendering="crispEdges"><path fill="#111" d="M0 0h7v1h-7zM9 0h1v1h-1zM12 0h3v1h-3zM16 0h5v1h-5zM23 0h1v1h-1zM26 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM9 1h1v1h-1zM11 1h1v1h-1zM13 1h5v1h-5zM20 1h2v1h-2zM26 1h1v1h-1zM32 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM10 2h1v1h-1zM12 2h2v1h-2zM15 2h1v1h-1zM17 2h6v1h-6zM24 2h1v1h-1zM26 2h1v1h-1zM28 2h3v1h-3zM32 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM11 3h1v1h-1zM14 3h3v1h-3zM19 3h2v1h-2zM22 3h3v1h-3zM26 3h1v1h-1zM28 3h3v1h-3zM32 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h3v1h-3zM15 4h1v1h-1zM17 4h2v1h-2zM21 4h3v1h-3zM26 4h1v1h-1zM28 4h3v1h-3zM32 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM12 5h1v1h-1zM14 5h4v1h-4zM20 5h2v1h-2zM24 5h1v1h-1zM26 5h1v1h-1zM32 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h7v1h-7zM8 7h2v1h-2zM11 7h2v1h-2zM15 7h1v1h-1zM18 7h1v1h-1zM21 7h2v1h-2zM24 7h1v1h-1zM0 8h1v1h-1zM2 8h5v1h-5zM9 8h7v1h-7zM17 8h1v1h-1zM22 8h3v1h-3zM26 8h5v1h-5zM0 9h1v1h-1zM4 9h2v1h-2zM7 9h2v1h-2zM14 9h1v1h-1zM16 9h1v1h-1zM18 9h4v1h-4zM23 9h1v1h-1zM26 9h2v1h-2zM29 9h2v1h-2zM32 9h1v1h-1zM0 10h1v1h-1zM3 10h2v1h-2zM6 10h2v1h-2zM9 10h2v1h-2zM12 10h1v1h-1zM15 10h1v1h-1zM18 10h1v1h-1zM21 10h1v1h-1zM24 10h3v1h-3zM28 10h1v1h-1zM30 10h2v1h-2zM1 11h2v1h-2zM4 11h1v1h-1zM7 11h2v1h-2zM10 11h1v1h-1zM12 11h1v1h-1zM14 11h2v1h-2zM20 11h2v1h-2zM24 11h2v1h-2zM28 11h3v1h-3zM32 11h1v1h-1zM1 12h1v1h-1zM3 12h2v1h-2zM6 12h2v1h-2zM10 12h1v1h-1zM12 12h1v1h-1zM15 12h1v1h-1zM18 12h1v1h-1zM21 12h1v1h-1zM23 12h3v1h-3zM27 12h3v1h-3zM0 13h1v1h-1zM7 13h1v1h-1zM10 13h1v1h-1zM13 13h4v1h-4zM20 13h1v1h-1zM23 13h1v1h-1zM26 13h1v1h-1zM29 13h1v1h-1zM31 13h2v1h-2zM0 14h3v1h-3zM4 14h3v1h-3zM11 14h2v1h-2zM17 14h1v1h-1zM19 14h1v1h-1zM22 14h1v1h-1zM25 14h2v1h-2zM31 14h1v1h-1zM0 15h1v1h-1zM2 15h3v1h-3zM8 15h1v1h-1zM10 15h1v1h-1zM16 15h1v1h-1zM19 15h8v1h-8zM29 15h2v1h-2zM0 16h1v1h-1zM2 16h3v1h-3zM6 16h1v1h-1zM8 16h1v1h-1zM12 16h3v1h-3zM16 16h4v1h-4zM22 16h1v1h-1zM25 16h1v1h-1zM27 16h3v1h-3zM32 16h1v1h-1zM2 17h4v1h-4zM10 17h2v1h-2zM13 17h2v1h-2zM16 17h5v1h-5zM22 17h2v1h-2zM25 17h3v1h-3zM29 17h4v1h-4zM2 18h2v1h-2zM6 18h1v1h-1zM9 18h2v1h-2zM12 18h2v1h-2zM15 18h3v1h-3zM20 18h1v1h-1zM22 18h1v1h-1zM24 18h1v1h-1zM27 18h2v1h-2zM30 18h2v1h-2zM0 19h1v1h-1zM3 19h2v1h-2zM7 19h1v1h-1zM11 19h1v1h-1zM16 19h5v1h-5zM23 19h1v1h-1zM26 19h6v1h-6zM2 20h1v1h-1zM4 20h3v1h-3zM8 20h1v1h-1zM10 20h1v1h-1zM16 20h1v1h-1zM19 20h5v1h-5zM25 20h1v1h-1zM27 20h3v1h-3zM31 20h1v1h-1zM0 21h3v1h-3zM8 21h1v1h-1zM12 21h4v1h-4zM17 21h2v1h-2zM23 21h1v1h-1zM26 21h1v1h-1zM30 21h1v1h-1zM32 21h1v1h-1zM0 22h1v1h-1zM3 22h1v1h-1zM5 22h2v1h-2zM10 22h1v1h-1zM12 22h2v1h-2zM15 22h3v1h-3zM20 22h2v1h-2zM24 22h2v1h-2zM29 22h1v1h-1zM31 22h1v1h-1zM0 23h1v1h-1zM7 23h1v1h-1zM9 23h1v1h-1zM11 23h1v1h-1zM14 23h2v1h-2zM18 23h1v1h-1zM21 23h1v1h-1zM23 23h3v1h-3zM28 23h1v1h-1zM30 23h1v1h-1zM32 23h1v1h-1zM0 24h1v1h-1zM3 24h4v1h-4zM9 24h1v1h-1zM11 24h1v1h-1zM15 24h1v1h-1zM17 24h1v1h-1zM22 24h1v1h-1zM24 24h5v1h-5zM31 24h2v1h-2zM8 25h1v1h-1zM10 25h1v1h-1zM14 25h1v1h-1zM18 25h4v1h-4zM24 25h1v1h-1zM28 25h1v1h-1zM30 25h1v1h-1zM32 25h1v1h-1zM0 26h7v1h-7zM10 26h1v1h-1zM12 26h1v1h-1zM15 26h2v1h-2zM18 26h1v1h-1zM20 26h2v1h-2zM23 26h2v1h-2zM26 26h1v1h-1zM28 26h1v1h-1zM30 26h2v1h-2zM0 27h1v1h-1zM6 27h1v1h-1zM8 27h2v1h-2zM11 27h1v1h-1zM13 27h3v1h-3zM21 27h2v1h-2zM24 27h1v1h-1zM28 27h3v1h-3zM0 28h1v1h-1zM2 28h3v1h-3zM6 28h1v1h-1zM8 28h3v1h-3zM12 28h3v1h-3zM18 28h1v1h-1zM21 28h1v1h-1zM24 28h6v1h-6zM31 28h1v1h-1zM0 29h1v1h-1zM2 29h3v1h-3zM6 29h1v1h-1zM8 29h3v1h-3zM12 29h1v1h-1zM15 29h2v1h-2zM20 29h1v1h-1zM22 29h4v1h-4zM28 29h2v1h-2zM32 29h1v1h-1zM0 30h1v1h-1zM2 30h3v1h-3zM6 30h1v1h-1zM8 30h6v1h-6zM18 30h2v1h-2zM21 30h1v1h-1zM26 30h2v1h-2zM29 30h1v1h-1zM0 31h1v1h-1zM6 31h1v1h-1zM9 31h3v1h-3zM13 31h2v1h-2zM16 31h1v1h-1zM19 31h5v1h-5zM25 31h1v1h-1zM28 31h3v1h-3zM0 32h7v1h-7zM8 32h1v1h-1zM10 32h1v1h-1zM17 32h1v1h-1zM19 32h1v1h-1zM22 32h4v1h-4zM27 32h1v1h-1zM31 32h1v1h-1z"/></svg>Scan with WeChat to pay · the code is valid for 2 hours<button class="xxd-link" type="button" id="paid">I've paid, check now</button></div>
</div>
<script>
  document.getElementById("paid").addEventListener("click", (e) => Xxd.runBusy(e.target, () => new Promise((r) => setTimeout(r, 900))).then(() => { Xxd.rollText(document.getElementById("plan-line"), "Member · until Nov 8, 2027"); Xxd.celebrate(document.getElementById("buy")); Xxd.toast("Membership is active", { tone: "success" }); }));
</script>`,
    rules: [
      "Never say “quota / allowance / trial”: say “Full access”, “N posts left today”, “Become a member”",
      "Limits speak up where the user acts — never in a pop-up",
      "Every outcome has its own sentence (paid, not paid yet, closed, network problem…); no silent failures",
      "When the plan line changes, the old text rolls up and out and the new text rolls in; with reduced motion it just swaps",
    ],
  },
  StatusLine: {
    title: "Status line",
    from: "Image sorter, long-form publisher",
    summary: "A line above the dock that stays empty unless there is something to say — one sentence, at most one action.",
    markup: `<div class="xxd-frame" style="max-width:420px">
  <div class="xxd-statusline" id="status-demo" hidden></div>
  <footer class="xxd-dock" style="position:static"><div class="xxd-dock__status">24 images · from mp.weixin.qq.com</div><div class="xxd-dock__primary"><button class="xxd-btn" data-variant="primary" data-size="sm">Copy 24 links</button></div></footer>
</div>
<div class="xxd-cluster" style="margin-top:var(--space-3)">
  <button class="xxd-btn" data-size="sm" onclick="Xxd.setStatus(document.getElementById('status-demo'), 'Reading colors 12 / 40', { action: { label: 'Stop' } })">In progress</button>
  <button class="xxd-btn" data-size="sm" onclick="Xxd.setStatus(document.getElementById('status-demo'), 'Today’s 5 color sorts are used up (as-is and reversed are unlimited)', { tone: 'warning', action: { label: 'Become a member' } })">Used up</button>
  <button class="xxd-btn" data-size="sm" onclick="Xxd.setStatus(document.getElementById('status-demo'), '')">Clear</button>
</div>`,
    rules: ["One sentence, at most one action; when there is nothing to say the whole line disappears", "No pop-ups, no system notifications"],
  },
  ProgressPill: {
    title: "Progress pill",
    from: "Long-form publisher",
    summary: "While writing into someone else's page (the X editor), a thin dark pill: spinner · progress · number. It lives in Shadow DOM.",
    markup: `<div class="xxd-progress-pill"><span class="xxd-spinner" aria-hidden="true"></span>Writing<progress class="xxd-progress" value="62" max="100"></progress>62%</div>`,
    rules: ["Mount it in Shadow DOM with XxdExtension.mountXxdUI; never touch the host page", "When done it turns into a check, then fades out"],
  },
  Celebrate: {
    title: "Celebrate",
    from: "Long-form publisher",
    summary: "For moments like becoming a member or the first post: a circle draws and checks, the text rises line by line, confetti bursts from the check. With reduced motion it shows the final state directly.",
    markup: `<div class="xxd-celebrate" id="cele">
  <svg class="xxd-celebrate__ring" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"><circle cx="12" cy="12" r="9.5" pathLength="1"/><path d="m7.5 12 3 3 6-6" pathLength="1"/></svg>
  <p class="xxd-text" data-variant="heading2">Membership is active</p>
  <p class="xxd-text" data-variant="caption">Valid until Nov 8, 2027</p>
  <button class="xxd-btn" data-variant="primary" onclick="Xxd.celebrate(this.closest('.xxd-celebrate').querySelector('svg'))">Start writing</button>
</div>`,
    rules: ["Only for moments that truly deserve it, and only once", "Only opacity / transform animate; no confetti with reduced motion"],
  },
  SettingsSearch: {
    title: "Settings search",
    from: "Long-form publisher",
    summary: "A search box pinned to the top of the settings page (⌘F jumps there, Esc clears): filters to matching rows and marks the text; each row carries a few words people might search for (dark / night / theme all find Theme).",
    markup: `<div style="max-width:440px">
  <div class="xxd-input-wrap" style="margin-bottom:var(--space-4)"><i data-xxd-icon="Search" data-size="16"></i><input class="xxd-input" type="search" id="ss-input" placeholder="Search settings (⌘F)" aria-label="Search settings"><button class="xxd-input-clear" aria-label="Clear"><i data-xxd-icon="X" data-size="14"></i></button></div>
  <div class="xxd-settings" id="ss-box">
    <section class="xxd-group"><h2 class="xxd-group__title">Appearance</h2><div class="xxd-group__body">
      <div class="xxd-row" data-keywords="dark night mode theme"><div class="xxd-row__text"><div class="xxd-row__title">Theme</div><div class="xxd-row__desc">Light · Dark · System</div></div></div>
      <div class="xxd-row" data-keywords="rounded corners square radius"><div class="xxd-row__text"><div class="xxd-row__title">Rounded corners</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" aria-label="Rounded corners"></div></div>
    </div></section>
    <section class="xxd-group"><h2 class="xxd-group__title">Writing</h2><div class="xxd-group__body">
      <div class="xxd-row" data-keywords="punctuation quotes typography"><div class="xxd-row__text"><div class="xxd-row__title">Smart punctuation</div></div><div class="xxd-row__control"><input type="checkbox" role="switch" class="xxd-switch" checked aria-label="Smart punctuation"></div></div>
    </div></section>
  </div>
</div>
<script>Xxd.bindSettingsSearch(document.getElementById("ss-input"), document.getElementById("ss-box"), { hotkey: false });</script>`,
    rules: ["Rows and whole groups with no match are hidden", "Settings that live elsewhere also show up in results as shortcuts"],
  },
  AccountCard: {
    title: "Account card",
    from: "All extensions",
    summary: "Avatar (members get an accent ring) · name · plan line · one action.",
    markup: `<div class="xxd-group__body" style="max-width:380px"><div class="xxd-account"><span class="xxd-avatar" style="--avatar-size:36px">D</span><div class="xxd-account__main"><div class="xxd-account__name">Dong</div><div class="xxd-plan-line">Free · 3 posts left today</div></div><button class="xxd-btn" data-size="sm">Become a member</button></div>
<div class="xxd-account"><span class="xxd-avatar" data-member style="--avatar-size:36px">D</span><div class="xxd-account__main"><div class="xxd-account__name">Dong</div><div class="xxd-plan-line" data-tone="warning">Member · ends in 3 days</div></div><button class="xxd-btn" data-size="sm">Renew</button></div></div>`,
    rules: ["Numbers appear only when they help: members never see counts", "The last week uses the warning color"],
  },
  RollText: {
    title: "Text swap",
    from: "Long-form publisher",
    summary: "When a plan line or a count changes: the old text rolls up and out, the new text rolls up and in, and a light sweeps across (only the roll is shown here).",
    markup: `<p class="xxd-plan-line"><span id="roll-demo">Free · 3 posts left today</span></p>
<button class="xxd-btn" data-size="sm" onclick="const el=document.getElementById('roll-demo'); Xxd.rollText(el, el.textContent.includes('Free') ? 'Member · until Nov 8, 2027' : 'Free · 3 posts left today')">Swap</button>`,
    rules: ["With reduced motion the text just swaps"],
  },
  Permission: {
    title: "Permission request",
    from: "Extensions (MV3)",
    summary: "When a feature needs an optional permission: say why first, and request it only when the user clicks. Once granted the button reads “Allowed”; if denied, say what's missing and how to turn it on later. Don't take every permission at install time.",
    markup: `<div class="xxd-banner" data-tone="info">
  <div><p class="xxd-banner__title">Read the current tab's address</p><p class="xxd-banner__text">Used to add this page to your list; read only when you click, never your browsing history.</p><p class="xxd-banner__text" role="status" id="perm-status"></p></div>
  <div class="xxd-banner__actions"><button class="xxd-btn" data-size="sm" data-variant="primary" id="perm-btn">Allow</button></div>
</div>
<script>XxdExtension.bindPermission(document.getElementById("perm-btn"), { permissions: ["tabs"], status: document.getElementById("perm-status") });</script>`,
    rules: ["Put it in optional_permissions / optional_host_permissions in the manifest, not permissions", "chrome.permissions.request only works inside a user click", "Say why and when it's used; after a denial, don't keep asking"],
    a11y: ["The result goes into the role=\"status\" line, so screen readers announce it", "Once granted the button is disabled and marked aria-pressed=\"true\""],
  },
  Shortcuts: {
    title: "Shortcuts",
    from: "Extensions (MV3)",
    summary: "List the extension's shortcuts (the manifest's commands) on the options page, with “Not set” where there's none. Shortcuts can only be changed on Chrome's shortcuts page, so the last button opens it.",
    markup: `<section class="xxd-group" style="width:100%">
  <h2 class="xxd-group__title">Shortcuts</h2>
  <div class="xxd-group__body" id="shortcuts"></div>
</section>
<script>XxdExtension.mountShortcuts(document.getElementById("shortcuts"), { names: { _execute_action: "Open the side panel", save: "Save this page" } });</script>`,
    rules: ["Read the current shortcuts with chrome.commands.getAll(); don't hard-code them", "Show keys with xxd-kbd, joined by “+”"],
    a11y: ["Each row's name is body text with the shortcut on the right; when unset, say so instead of leaving it blank"],
    js: `await XxdExtension.mountShortcuts(container, { names: { _execute_action: "Open the side panel" } })`,
  },
  ImportExport: {
    title: "Import and export settings",
    from: "Extensions (MV3)",
    summary: "Take settings along to a new computer or a reinstall: export a JSON file; on import accept only the known format and keys, and confirm with a toast.",
    markup: `<div class="xxd-row" style="width:100%">
  <div class="xxd-row__text"><div class="xxd-row__title">Settings backup</div><div class="xxd-row__desc">Export to a file, import it on another computer</div></div>
  <div class="xxd-row__control xxd-cluster"><button class="xxd-btn" data-size="sm" id="export-btn">Export</button><button class="xxd-btn" data-size="sm" id="import-btn">Import…</button></div>
</div>
<script>
  document.getElementById("export-btn").addEventListener("click", () => XxdExtension.exportSettings({ filename: "today-settings.json" }));
  document.getElementById("import-btn").addEventListener("click", () => {
    const input = Object.assign(document.createElement("input"), { type: "file", accept: "application/json" });
    input.addEventListener("change", () => input.files[0] && XxdExtension.importSettings(input.files[0]));
    input.click();
  });
</script>`,
    rules: ["Only import files whose format is xxd-settings; pass keys to accept only the ones you know", "After an import every page updates itself through chrome.storage.onChanged; nothing needs reopening"],
    a11y: ["The result is announced with a toast"],
  },
  WhatsNew: {
    title: "What's new",
    from: "Extensions (MV3)",
    summary: "The first time someone opens a new version, a banner at the top says in two or three lines what's different; after “Got it” it doesn't come back for that version. No dialog, no new tab.",
    markup: `<div id="whats-new" style="width:100%"></div>
<script>XxdExtension.showWhatsNew(document.getElementById("whats-new"), { version: "1.3." + Date.now(), title: "New in 1.3", notes: ["History can be collapsed by day", "Exported files include the title"] });</script>`,
    rules: ["Only changes people will notice, three at most", "The version defaults to the manifest's version; it's remembered in chrome.storage.local"],
    a11y: ["The banner is role=\"status\", announced once when it appears"],
    js: `await XxdExtension.showWhatsNew(container, { title: "New in 1.3", notes: ["…", "…"] })`,
  },
  Reload: {
    title: "Extension updated, please reload",
    from: "Extensions (MV3)",
    summary: "In content scripts: after the extension is updated or reloaded, the old script still in the page throws “Extension context invalidated” on any chrome.* call. Wrap calls in guardContext: when the context is gone it says so in its own Shadow root with a reload button, instead of quietly breaking.",
    markup: `<div class="xxd-stack" id="reload-demo" style="width:100%"><button class="xxd-btn" id="reload-try">Save (pretend it was updated)</button></div>
<script>
  const safe = XxdExtension.guardContext(document.getElementById("reload-demo"));
  document.getElementById("reload-try").addEventListener("click", () => safe(() => { throw new Error("Extension context invalidated."); }));
</script>`,
    rules: ["Route every chrome.* call (sendMessage, storage) through safe(…)", "Once it's dead don't retry; reloading the page is the only way out"],
    a11y: ["The banner is role=\"alert\" and focus moves to the reload button"],
  },
};
