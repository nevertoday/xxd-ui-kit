# Chrome extension kit

`@xxd/extension` gives every extension the same look: light / dark, square / rounded, an accent color, three languages and the same components.
Extensions can't load remote code (MV3), so the component files are **copied** into each extension's `vendor/xxd/`, and each extension pins the version it uses.

## Create an extension

```bash
xxd-ui new ./today --name "Today" --slug today
```

By default you get the smallest MV3 extension you can load right away with “Load unpacked”:

- `sidepanel.html`: tabs at the very top (no top bar), content, a dock at the bottom; the side panel uses compact density
- `options.html`: the options page (search + appearance group)
- `background.js`: clicking the toolbar icon opens the side panel (`type: module`, so it can `import` the vendored `tokens.mjs`)
- `_locales/en · zh_CN · zh_TW`: every piece of UI text lives here; `default_locale` is `en` (Japanese, German, French… users see English rather than Chinese)
- `vendor/xxd/`: `tokens.css` `xxd.css` `xxd.shadow.css` `xxd.shadow.css.js` `xxd.js` `boot.js` `icons.js` `extension.js` `tokens.mjs` `VERSION` `LICENSE`

Add more when you need it (they combine):

| Option | Adds |
| --- | --- |
| `--popup` | `popup.html`: the small window from the toolbar icon (360 wide, height follows the content up to 600), with a button that opens the side panel |
| `--content "https://*.example.com/*"` | `content.js`: puts a button into matching pages (Shadow DOM), with the manifest's `content_scripts` in the right dependency order |
| `--account` | A sign-in screen plus an account and membership group (a sample: sign-in and payment are fake, prices are placeholders) |

Before publishing: `xxd-ui store-icons ./today --glyph ListChecks` makes the 16 / 32 / 48 / 128 PNGs and adds them to the manifest. Name the extension in a few plain words that say what it does.

## Update and check

```bash
xxd-ui sync ./today ./my-extension     # copy the latest build, write VERSION
xxd-ui status                          # who is behind (anything you new / init / sync is remembered; compared by file content, so doc-only commits don't count)
xxd-ui sync --all                      # update all of them
xxd-ui doctor ./today                  # check it; exits with 1 on errors
```

`doctor` checks: referenced files exist; the manifest and `_locales` agree; **MV3 rules** (inline scripts, `on*=`, remote scripts, `eval`, store length limits, permissions covering every site, icon sizes, content-script dependency order); **hard-coded Chinese** (with `_locales`: Chinese in `aria-label`, page text or JS strings); misspelt icon and class names; hard-coded colors / shadows / weights / radii / motion / fonts. A line that's meant to be different gets `xxd-ignore`.

Don't edit `vendor/xxd/` by hand. When you package the extension, a packer that follows references picks up the files in use, and `vendor/xxd/LICENSE` satisfies license checks.

### `xxd.config.json`

In the project root (extension or site); every field is optional:

| Field | What it does |
| --- | --- |
| `vendorDir` | Where to copy the components; extensions default to `vendor/xxd`, sites write `false` to skip copying |
| `vendorFiles` | Copy only these, e.g. `["tokens.css", "boot.js", "xxd.css", "xxd.js"]` |
| `vendorMinify` | Copy minified `xxd.css` and `xxd.shadow.css` (default `true`) |
| `tokensTargets` | Write `tokens.css` as-is to these paths (for old paths that tests or websites reference), e.g. `["src/xxd-theme.css"]` |
| `layeredTokensRegions` | Write layered tokens into a marked region at the top of these CSS files: the project's own variables always win (see [existing sites](existing-site.md)) |
| `layeredTokensExclude` | Extra token names to skip (`sync` already skips names the project uses without declaring) |
| `iconNodesTargets` | Write icon data to these paths (e.g. `src/lib/xxd-icon-nodes.js`) |
| `adopt` | `xxd-ui adopt <dir>`: `{ file, aliases }`. Drops `:root` declarations whose light and dark values equal the tokens; `aliases` turns old names into `var(--token)`. Try `--dry-run` first |
| `doctor.ignore` | Skip whole checks, e.g. `["color"]` |

Bringing in an existing extension: `xxd-ui init ./my-extension`. If a page already has a `boot.js` `data-key`, it's kept (users keep their appearance settings); `--key` sets it explicitly.

## What each page uses

| Page | Size, density | Good for | Watch out |
| --- | --- | --- | --- |
| Side panel | 320–400 wide, compact | The main features, lists, history, settings entry | Tabs at the top; overlays are sheets rising from the bottom |
| Popup | 360 wide, at most 600 tall, compact | One or two of the most-used actions | Don't set `height:100%` (it collapses to a strip); no modal dialogs — use a sheet or go to the side panel |
| Options page | 680 reading column, comfortable | Appearance, shortcuts, import / export, about | Settings groups + search |
| Inside web pages | Follows the page, compact | An entry button, a small panel | Always Shadow DOM (below) |

The usual extension chores have ready-made patterns on the showcase: permission request, shortcuts, import and export settings, what's new, extension updated — please reload.

## Wiring up a page

```html
<head>
  <!-- applies the appearance before the first frame (reads the localStorage mirror); one data-key per extension -->
  <script src="vendor/xxd/boot.js" data-key="today-ui" data-default-density="compact"></script>
  <link rel="stylesheet" href="vendor/xxd/xxd.css">
  <script src="vendor/xxd/icons.js"></script>
  <script src="vendor/xxd/xxd.js"></script>        <!-- window.Xxd, install(document) runs automatically -->
  <script src="vendor/xxd/extension.js"></script>  <!-- window.XxdExtension; sets the language from _locales -->
</head>
<body class="xxd-page">
```

To swap the tokens only and leave the UI alone for now, include just `vendor/xxd/tokens.css` and `boot.js`.

## Language: one source

Every `messages.json` has an `xxdLocale` entry (`en` / `zh-CN` / `zh-Hant`). Whichever file Chrome picks for the user decides the language:

- `extension.js` sets `<html lang>` when it loads, and the components' own text (Close, Cancel, Previous…) follows;
- `XxdExtension.uiLocale()` returns it; format dates with `Intl.DateTimeFormat(uiLocale())`;
- in content scripts only the components' language changes — the host page's `<html lang>` is left alone; the Shadow host gets `lang`, so screen readers use the right language.

```html
<span data-i18n="tabSettings">Settings</span>
<input data-i18n-attr="placeholder:searchPlaceholder,aria-label:searchPlaceholder">
```

`XxdExtension.applyI18n(document)` fills these in from `chrome.i18n`; when a translation is missing, the original text in the HTML stays. In JS use `XxdExtension.t("key", [substitutions])`.

## Appearance settings

`chrome.storage.sync` is the source of truth; a localStorage mirror exists only so the first frame doesn't flash. The side panel, options page and popup stay in sync live.

```js
const { createAppearanceStore, uiLocale } = window.XxdExtension;
const store = createAppearanceStore({ key: "today-ui" });
await store.load();
Xxd.mountAppearance(document.getElementById("settings"), {
  locale: uiLocale(),            // zh-CN | zh-Hant | en
  get: store.get,
  set: (patch) => store.set(patch),
  showDensity: false,
  lockCorners: false,            // true when the product locks square corners
});
```

## Putting UI into web pages

Always inside Shadow DOM, so neither side's styles leak; appearance attributes go on the host, never on the host page's `<html>`, and nothing is written to the host page's localStorage.

```js
// manifest.json: content_scripts js in this order:
//   vendor/xxd/xxd.js, vendor/xxd/extension.js, vendor/xxd/icons.js, vendor/xxd/xxd.shadow.css.js, content.js
(async () => {
  if (document.querySelector("xxd-root[data-ext='today']")) return; // don't inject twice
  const store = XxdExtension.createAppearanceStore({ key: "today-ui", apply: false });
  await store.load();
  const host = document.createElement("xxd-root");          // a custom element: the page's div { … } rules can't reach it
  host.dataset.ext = "today";
  host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000";
  document.documentElement.append(host);
  const ui = await XxdExtension.mountXxdUI(host, { settings: store.get() });
  ui.root.innerHTML = `<button class="xxd-btn" data-variant="primary" data-size="sm">Export MD</button>`;
  store.subscribe((s) => ui.update(s));
})();
```

- Styles come from `xxd.shadow.css.js` (`globalThis.XxdShadowCSS`): attached synchronously, no fetch, **no `web_accessible_resources` needed** (so sites can't use it to detect the extension). `cssHref` still works if you prefer, but then `xxd.shadow.css` must be in WAR.
- Positioning and `z-index` written on the host survive (`all: initial` goes first).
- Toasts, confirm dialogs, the command palette, the image viewer and tooltips appear in this Shadow root when no `within` is given; toasts and tooltips go into the browser's top layer, so no host-page z-index covers them.
- With the theme set to “follow system”, switching the OS between light and dark follows along.
- After the extension updates, the old script's `chrome.*` calls throw “Extension context invalidated”: wrap them with `XxdExtension.guardContext(ui.root)` (see the “Extension updated, please reload” pattern).
- `xxd.js` loaded as a content script doesn't take over the host page.
- `ui.destroy()` removes every listener and observer installed on that Shadow root, then removes the host.
- Content scripts built with a bundler (ESM): `import * as Xxd from "@xxd/css"; useXxd(Xxd)` (or `mountXxdUI(host, { xxd: Xxd })`), so nothing depends on a global `window.Xxd`.

Only want the variables, not page-wide behavior: `tokens.css` holds variables only; the few global rules (reduced motion, accent-colored selection and caret) live in `@xxd/tokens/base.css` (`xxd.css` already includes it).

`xxd.shadow.css` holds off the host page by itself (`pnpm --filter @xxd/site run audit` has a hostile host page as a gate): inherited host styles are reset on the Shadow's top elements; tokens are declared again inside the Shadow, so a host rule like `div { --ink: … }` can't change them; `data-theme` / `data-corners` / `data-finish` on the host all work.

## In the service worker

`vendor/xxd/tokens.mjs` is plain data, so the service worker, OffscreenCanvas and notifications can use the token colors too:

```js
import { TOKENS, setBadge } from "./vendor/xxd/tokens.mjs";
await setBadge("3", "danger");   // the badge on the toolbar icon
TOKENS.light["--ink"];           // "#111111"
```
