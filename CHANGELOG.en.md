# Changelog

**English** · [中文](CHANGELOG.md)

Changes that affect people using the kit. `@xxd/tokens`, `@xxd/icons`, `@xxd/css`, `@xxd/react` and `@xxd/extension` share one version number.
During 0.x, minor versions may include breaking changes; they're listed under "What to change". From now on every change comes with a changeset (see `.changeset/README.md`), merged in here at release time.

## 0.1.0 · Unreleased

The first public version. Not on npm yet — use it from source (see the README).

### Added

- 59 native components, 18 patterns (5 of them for extensions: permission request, shortcuts, import / export, what's new, extension updated) and full-page templates, all in Chinese and English.
- 500+ icons: 24 grid, 1.5 stroke, square corners, searchable by Chinese keyword.
- The `xxd-ui` CLI: `new` (a minimal extension by default; add `--popup` / `--content` / `--account` as needed), `init`, `sync`, `status`, `doctor`, `pack`, `store-icons`, `adopt --dry-run`, `doc`, `icon`, `tokens`; output in Chinese or English.
- Content scripts: `mountXxdUI` puts UI in Shadow DOM with styles attached synchronously (no `web_accessible_resources` needed); overlays and toasts go into the browser's top layer.
- Accessibility: one screen-reader announcer (toasts, sorting, counts, paging); native overlays are modal (everything outside is inert); menus, pickers, drag-to-sort and resizers work from the keyboard; form errors are tied to their field with `setFieldError`.
- Tokens: `--line-control` for control borders (≥ 3:1 against the background), a solid focus ring `--focus-color`, a 24px type step and `--leading-*` line heights, padding tokens for compact density. Dark and compact can apply to one part of a page (`data-theme` / `data-density` on any element). Without JS, dark follows the system.
- Finish: the `data-finish` closest to a button wins, so a `material` area inside a `flat` page (and `flat` inside that) both work.
- Showcase: every page has a `.md` version and there's an `llms.txt`; component pages have "When to use / When not to" and a React props table; versioned CDN path `/v/0.1.0/`.
- Lifecycle: `install(root, { signal })` and `uninstall(root)`; `mountXxdUI`'s `destroy()` removes the listeners installed on its Shadow root. If a page loads `@xxd/css` twice, only one copy installs.
- Explicit dependencies: `useIcons(icons)` (`@xxd/css`) and `useXxd(Xxd)` (`@xxd/extension`); classic scripts still pick up `window.XxdIcons` / `window.Xxd` automatically.
- Icons: an `IconName` type; `@xxd/icons/each` has one named export per icon, so bundlers keep only the ones you use.
- Type declarations for `@xxd/extension`, `@xxd/tokens/accent`, `@xxd/tokens/theme` and `@xxd/icons/nodes`.
- React and native controls are the same height (40px comfortable / 32px compact), and the appearance settings use the same words on both sides.
- Packages made with `xxd-ui pack` install in projects outside the repo (CI installs them into an empty Vite project to check).
- XXD's own React components have props tables too (the showcase's "React props" and `xxd-ui doc <component> --react`).
- Shadow DOM version: selectors like `:root:not(…)` now become `:host(…)` correctly (before, the no-JS dark fallback didn't work inside Shadow DOM).

### What to change

- Fix: pseudo-elements (`::before` / `::after`) inside `.xxd-page` are now `box-sizing: border-box` as well (they used to sit inside `:where()`, which the spec ignores). Things you draw with pseudo-elements may shift by 1–2px.

- `tokens.css` now holds variables only: reduced motion and the accent-colored selection and caret moved to `@xxd/tokens/base.css`. Nothing to do if you use `xxd.css` or `@xxd/react`; if you link only `tokens.css` and want those rules, add `base.css`.
- Using `@xxd/css` as ESM with `<i data-xxd-icon>` on the page: call `useIcons(await import("@xxd/icons"))` once (it used to rely on a global `window.XxdIcons`).
- `@xxd/react` ships Kumo inside the package: don't install `@cloudflare/kumo` yourself, and Tailwind projects no longer need an `@source` pointing at Kumo.
- In `@xxd/icons/each` the `Infinity` icon is `InfinityIcon` (so it doesn't shadow the global Infinity).
- Finish: the `data-finish` closest to a button now wins (before, an outer `flat` switched off any `material` inside it).

- The cascade layer order is now `@layer theme, base, xxd, components, utilities;`. With Tailwind, put that line at the very top of your CSS.
- `@xxd/react` exports only the listed components (it no longer re-exports all of Kumo); Cloudflare brand components aren't exported.
- Dark semantic colors are one step warmer: update screenshot baselines if you keep any.
- Renamed (English): Panel → Details panel, Confirm twice → Two-step confirm, Write progress pill → Progress pill, Rolling text → Text swap, Glyph grid → Symbol picker. Class names are unchanged.
