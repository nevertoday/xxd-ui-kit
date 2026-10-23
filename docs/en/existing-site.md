# Bringing in a site that already has its own CSS variables

[中文](../existing-site.md) · **English**

This is for a site that is already live, has its own `:root { --bg: …; --ink: … }`, and wants XXD's tokens, icons and components **without changing how anything looks today**.
(A brand-new page doesn't need this: see [“Try it” in the README](../../README.en.md#try-it-nothing-to-install).)

There are three steps; you can stop after any of them.

## 1. Write the config

Put an `xxd.config.json` in the site's root:

```json
{
  "vendorDir": false,
  "layeredTokensRegions": ["public/styles.css"],
  "iconNodesTargets": ["src/lib/xxd-icon-nodes.js"]
}
```

| Field | Meaning |
| --- | --- |
| `vendorDir` | Where to copy the component files (xxd.css, xxd.js…). `false` copies nothing (tokens and icons only); a path such as `"public/vendor/xxd"` copies them there |
| `layeredTokensRegions` | CSS files that get the tokens written at the top |
| `iconNodesTargets` | Paths that receive the icon data (`nodes.js` from `@xxd/icons`); your own icon helper reads from there |
| `adopt` | Optional, used in step 3 |

`xxd-ui init ./my-site` writes a basic config for you and prints the lines to put in `<head>`.

## 2. Sync: your variables always win

```bash
xxd-ui sync ./my-site
```

`public/styles.css` gets a block `/* xxd:tokens:start */ … /* xxd:tokens:end */` at the top, containing the tokens wrapped in `@layer xxd.tokens { … }`
(selectors written as `:where(:root…)`).

- **Unlayered styles always beat layered ones**, so none of your existing variables change; you only gain the ones you didn't have (`--r-*` radii, `--space-*`, `--motion-*`, `--control-h`, `--text-*`, `--z-*`…).
- The block is variables only: global rules such as reduced motion live in `@xxd/tokens/base.css` and aren't included, so your own motion handling stays as it is.
- As long as your site doesn't set `data-corners` / `data-accent`, it stays square and ink.
- Running `sync` again only replaces what's between the markers.

**Variables that are skipped automatically**: if your site **uses but never declares** a variable with a token's name (relying on a fallback like `var(--danger, #c33)`, or with no fallback at all),
declaring it would change how things look. `sync` notices, skips it, and lists what it skipped in a comment at the top of the block.
Unifying those is a deliberate visual change, not part of adopting the kit.

## 3. Optional: let the tokens provide identical declarations

If some variables in your `:root` have exactly the same light and dark values as a token, you can delete them and let the tokens provide them; old names can become aliases:

```json
{
  "adopt": {
    "file": "public/styles.css",
    "aliases": { "--old-backdrop": "var(--backdrop)" }
  }
}
```

```bash
xxd-ui adopt ./my-site
```

Only declarations with identical values are removed; different values stay yours. Commit before running it so you can compare.

## Proving “zero visual change”

Save the CSS before and after, then compare the final value of every variable in light and dark mode in headless Chrome:

```bash
CHROME_EXE=… node scripts/verify/css-vars-diff.cjs before.css after.css
```

You should only see new tokens, and no existing variable should change. Then run the site's own tests before and after; `scripts/verify/tap-fail-diff.py` compares two TAP outputs line by line.

## Afterwards

- Changing tokens: edit `packages/xxd-tokens/tokens.css` in xxd-ui-kit → `xxd-ui sync ./my-site` → run the site's tests → commit.
- Changing icons: edit `packages/xxd-icons/src/nodes.js` in xxd-ui-kit → same as above.
- New pages can use `@xxd/css` classes directly (give `vendorDir` a path and the components are copied in); replace old pages one at a time.
- `xxd-ui doctor ./my-site` checks for hard-coded colors, shadows, weights and radii, and misspelt icon or class names.
