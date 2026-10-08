# mentalmodeler-js: deploy notes & how it gets vendored into -suite

Notes from 2026-10-05 through 2026-10-08, captured so this can be picked back up later.

## 1. How `mentalmodeler-js` deploys to GitHub Pages

Repo: `mentalmodeler/mentalmodeler-js` (CRA 1.x, `react-scripts@1.1.5`).

- `"homepage": "."` in `package.json` makes CRA emit relative asset paths
  (`./static/js/...`), required because the site is served from a subpath
  (`https://mentalmodeler.github.io/mentalmodeler-js/`), not domain root.
- **Previously**: `npm run deploy` built the app, replaced the committed
  `docs/` folder on `master` with the fresh build output, and committed +
  pushed it. GitHub Pages was configured to serve `master:/docs`. No CI —
  pure local-build-and-commit.
- **As of this session**: switched to the `gh-pages` npm package.
  - Added `gh-pages` as a devDependency.
  - `package.json` scripts:
    ```
    "predeploy": "run-s -n build-css build-js",
    "deploy": "gh-pages -d build",
    "build": "run-s -n build-css build-js",
    ```
    (`build` no longer renames `build/` to `docs/` — that step is gone.)
  - `npm run deploy` now builds, then pushes `build/` straight to a
    `gh-pages` branch on `origin`.
  - GitHub repo's Pages source was switched from `master:/docs` to
    `gh-pages:/` via:
    ```
    gh api -X PUT repos/mentalmodeler/mentalmodeler-js/pages \
      -f 'source[branch]=gh-pages' -f 'source[path]=/'
    ```
  - Live URL is unchanged: `https://mentalmodeler.github.io/mentalmodeler-js/`.
  - The old `docs/` folder on `master` is now vestigial (not yet deleted).
  - Changes are on branch `extensible-fix-for-suite`, PR open:
    https://github.com/mentalmodeler/mentalmodeler-js/pull/31 (not yet
    merged as of this writing).

## 2. The `?demo` query param

`src/index.js` decides standalone-render + demo-load behavior from the URL:

- `standalone` is true if `?standalone` is present, `NODE_ENV==='development'`,
  or (hostname is `mentalmodeler.github.io` **and** path starts with
  `/mentalmodeler-js`). The path check was added 2026-10-08: once `-suite`
  was *also* deployed under `mentalmodeler.github.io` (different path, same
  domain), hostname alone false-positived for `-suite` too — see "Known bug,
  fixed" below.
- There used to be an `?init` param that loaded a canned model
  (`src/models/simple.mmp.json`), but it was gated by
  `dev && params.has('init')` — since production builds always bake in
  `NODE_ENV=production`, this was **dead on the deployed site**, even though
  `standalone` itself was already true there.
- Renamed to `?demo` and **dropped the `dev` gate**, so it now works
  identically in local dev and on the deployed build. It also now loads the
  **Fire** model (`src/data/fire.mmp.js` / `src/models/fire.mmp.json`)
  instead of Simple.
- Usage: `https://mentalmodeler.github.io/mentalmodeler-js/?demo`

Note: `-suite` has its own `?demo` param (`src/App.jsx:38`, renamed from
`?init` on 2026-10-06 to match this convention) that fetches a model URL
into `-suite`'s own file browser/Redux store via `mm-modules`'
`loadAndParseURL` — defaults to `fire_model.mmp` if no value given, or
`?demo=<url>` to load something else. Different app, different mechanism
(no `dev`/`standalone` gating, no hostname check) — same *name*, not the
same code path, so don't assume a fix to one applies to the other.

### Known bug, fixed (2026-10-08): the hostname collision broke every `-suite` tab switch

Once `-suite` deployed to `mentalmodeler.github.io/mentalmodeler-suite/`, the
old hostname-only `standalone` check started evaluating `true` there too —
`-suite` shares `-js`'s hostname, just not its path. That silently broke
`-suite` in production, not just cosmetically:

- `-suite` calls `window.MentalModelerConceptMap.save()` on every
  tab/model/scenario switch, to flush canvas edits into Redux
  (`saveModelFromConceptMap` in `-suite/src/redux/actions/models.js`).
- Under `standalone=true`, `-js`'s exposed `save()` takes the "download a
  local file" branch instead of returning `{js, json}` to the caller — so it
  returned `undefined` on the live site.
- `-suite`'s `updateModelFromConceptMap` reducer doesn't crash on
  `undefined` (optional chaining/destructuring are too permissive to throw),
  but it *does* unconditionally overwrite `selectedModel.concepts`/
  `groupNames` with `undefined` — silently blanking a model that had real
  data a moment earlier, every single switch.
- Something downstream (most likely `ConceptMap.jsx`'s own effect, re-`load()`ing
  the now-concept-less model back into `-js` to redraw the canvas) then hung
  the tab outright — confirmed live (not just reasoned about): clicking any
  tab froze the renderer, `mmp (N).json` downloads stacked up in the browser,
  and Chrome's "fix the tab slowing your browser" prompt fired.

Fixed by making the hostname check path-aware (`src/index.js`, see §2
above) — no `-suite` change was needed, since the bug was entirely in
`-js`'s own standalone-detection logic.

## 3. How `mentalmodeler-js` gets vendored into `mentalmodeler-suite`

`-suite` does **not** depend on `-js` via npm or a `file:` link (unlike
`mm-modules`). It vendors a copied build of `-js`'s bundle as static assets,
loaded via plain `<script>`/`<link>` tags — fully offline, no runtime fetch.
(A real package dependency is a candidate for the bigger phase-2 rework
below — this section describes the interim, still-static-copy setup.)

**Location**: `mentalmodeler-suite/public/libs/conceptmap/`
- `static/js/main.js` — the active JS bundle, **stable unhashed name**.
- `static/css/main.css` (+ `.map`) — CSS bundle, **also stable** as of
  2026-10-08 (previously kept CRA's content hash, requiring a hand-edit of
  `index.html` on every update — see below for why that was dropped).
- `shared/{app.css, font-awesome.css, foundation.css}` — confirmed these
  come from `-js`'s own `public/shared/` folder (CRA copies `public/`
  verbatim into `build/shared/` on build) — not leftovers from
  `mentalmodeler-scenario`.
- Dated folders (`2024-08-10/`, `2024-08-11/`, `2024-08-12/`, ...) — manual
  snapshots of each previously-vendored version, kept for rollback/history.
  Not referenced by the running app.

**Referenced in `mentalmodeler-suite/index.html`**:
```html
<link href="/libs/conceptmap/shared/app.css" rel="stylesheet" />
<link href="/libs/conceptmap/static/css/main.css" rel="stylesheet" />
<script src="/libs/conceptmap/static/js/main.js"></script>
<!-- commented-out alternative that would load the bundle live from
     https://mentalmodeler.github.io/mentalmodeler-js/... — currently
     disabled in favor of the local copy, which is what keeps -suite
     working offline. -->
```
Both `main.js` and `main.css` are permanently stable names now — this file
never needs editing again when `-js`'s bundle updates.

**Process (2026-10-08, automated via a script)**:
1. In `mentalmodeler-js`: `npm run build` produces
   `build/static/js/main.<hash>.js` and `build/static/css/main.<hash>.css`
   (CRA still content-hashes its own output — this script doesn't touch
   `-js`'s build config, just copies and renames on the way in).
2. In `mentalmodeler-suite`: `npm run sync-conceptmap`
   (`scripts/sync-conceptmap.js`) copies that JS/CSS (stripping the hash on
   the way in, carrying over `.map` files) and the `shared/` folder into
   `public/libs/conceptmap/`. Errors loudly if `-js`'s `build/` doesn't
   exist yet, or if either `static/js`/`static/css` doesn't contain exactly
   one matching file.
3. Nothing else — `index.html` doesn't need editing, since both output
   filenames are fixed.

This replaced the previous fully-manual process (hand-copy, hand-rename,
hand-edit `index.html`'s CSS link hash on every update) — see git history
for that version of this doc if needed. Not yet wired into `-suite`'s own
`build`/`predeploy` scripts — still a manual step you run when `-js`
changes, not a CI step.

**Runtime contract** `-suite` depends on: `window.MentalModelerConceptMap`
exposing `{render, load, save, screenshot}` (defined in `-js`'s
`src/index.js`). Call sites in `-suite`:
- `src/components/ConceptMap/ConceptMap.jsx` — `render()`, `load()`
- `src/redux/actions/models.js` — `save()`
- `src/services/print.js` — `screenshot()`

## 4. Open items / follow-ups

- **DX gap, partially closed (2026-10-08)**: the copy-rename-and-hand-edit
  part of vendoring is now automated (`npm run sync-conceptmap`, §3 above),
  and there's still no record of which `-js` commit produced the
  currently-vendored bundle. The real fix — planned as its own later
  project, not started — is to stop vendoring static copies at all: rework
  `-js` to ship both (a) a real installable package `-suite` can `import`
  directly (`file:../mentalmodeler-js`, same pattern `mm-modules` already
  uses — no copy step, no hostname-sniffing-style seam at all) and (b) a
  stable-URL global-script build for the public embed API (third parties
  embedding via `<script src="...">` + `window.MentalModelerConceptMap`,
  same contract `-scenario` and standalone users rely on today) — likely
  alongside a Vite rewrite, since `-js` is still on `react-scripts@1.1.5`
  (React 16). Out of scope for now; the 2026-10-08 fixes above were
  deliberately kept small and interim.
- Old `docs/` folder on `-js`'s `master` (previously used for its GitHub
  Pages deploy) — not yet cleaned up.
- `-suite`'s own GitHub Pages deploy — **live** as of 2026-10-07:
  https://mentalmodeler.github.io/mentalmodeler-suite/. What's in place:
  1. `vite.config.js`'s `base` is now `/mentalmodeler-suite/` in production
     (matching the repo name, since Pages project sites serve from
     `https://<org>.github.io/<repo>/`), `/` in dev.
  2. **Verified, not assumed**: built with that subpath `base` and served
     the output via `vite preview` (which also serves from `base`). Vite's
     HTML transform does correctly rewrite every root-absolute path in
     `index.html` — favicon, both `libs/conceptmap/...` `<link>`/`<script>`
     tags, and the bundled JS/CSS — to `/mentalmodeler-suite/...`, with no
     manual edits needed.
  3. That same verification pass caught a **real bug**, not a config gap:
     `App.jsx`'s `?demo` loader `fetch()`-ed a hardcoded `/models/fire_model.mmp`.
     Unlike the HTML `href`/`src` attributes above, a runtime `fetch()` string
     literal is never touched by Vite's build-time rewriting, so under the
     subpath build this 404'd — the 404 page's HTML then got fed into the MMP
     JSON parser (`SyntaxError: Unexpected token '<', "<!DOCTYPE "...`). Fixed
     by building the URL from `import.meta.env.BASE_URL` (Vite's runtime read
     of the same `base` config) instead of a bare `/`-prefixed string.
     Grepped for other hardcoded root-absolute runtime paths in `src/` — this
     was the only one.
  4. `gh-pages` added as a devDependency (`predeploy`/`deploy` npm scripts,
     same shape as `-js`'s). Audited: one new high-severity advisory
     (`braces`, nested under `gh-pages`'s own `globby`/`fast-glob` chain) —
     same low-risk class already accepted for `-suite`'s `@typescript-eslint`
     dev chain (stack-exhaustion DoS needs an attacker-controlled glob
     pattern; `gh-pages` only ever globs the local `dist/` output it just
     built, dev-only, never shipped).
  5. No client-side router in use in `-suite` (confirmed `react-router-dom`
     is gone entirely as of the npm-audit cleanup — no `<BrowserRouter>` was
     ever added), so no SPA 404-fallback trick is needed for Pages.
  6. Still true: `mm-modules` is linked via `file:../mm-modules`, fine for a
     locally-built-then-pushed `gh-pages` deploy, but would break if the
     build ever moves into a GitHub Actions runner (sibling repo wouldn't be
     checked out there).
