# mentalmodeler-js: deploy notes & how it gets vendored into -suite

Notes from a 2026-10-05/06 session, captured so this can be picked back up later.

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
  or hostname is `mentalmodeler.github.io`.
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

## 3. How `mentalmodeler-js` gets vendored into `mentalmodeler-suite`

`-suite` does **not** depend on `-js` via npm or a `file:` link (unlike
`mm-modules`). It vendors a manually-copied build of `-js`'s bundle as
static assets, loaded via plain `<script>`/`<link>` tags — fully offline,
no runtime fetch.

**Location**: `mentalmodeler-suite/public/libs/conceptmap/`
- `static/js/main.js` — the active JS bundle. Manually **renamed** from
  CRA's hashed output (`main.<hash>.js`) to a stable unhashed name, so
  `index.html` doesn't need to change on every update.
- `static/css/main.<hash>.css` (+ `.map`) — CSS bundle, hash **kept**, so
  `index.html`'s `<link>` href must be hand-edited to match whenever this
  file changes.
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
<link href="/libs/conceptmap/static/css/main.43f0ba4e.css" rel="stylesheet" />
<script src="/libs/conceptmap/static/js/main.js"></script>
<!-- commented-out alternative that would load the bundle live from
     https://mentalmodeler.github.io/mentalmodeler-js/... — currently
     disabled in favor of the local copy, which is what keeps -suite
     working offline. -->
```

**Process today is entirely manual** — no script, no CI step:
1. In `mentalmodeler-js`: `npm run build` (or `build-js`) produces
   `build/static/js/main.<hash>.js` and `build/static/css/main.<hash>.css`.
2. Copy the JS file into `-suite/public/libs/conceptmap/static/js/`,
   renaming it to `main.js`.
3. Copy the CSS file (+ `.map`) into
   `-suite/public/libs/conceptmap/static/css/`, keeping the hashed name.
4. Hand-edit the hashed CSS filename in `-suite/index.html`'s `<link>` tag
   to match.
5. (Optionally) snapshot the previous `static/` contents into a new dated
   folder before overwriting.

**Runtime contract** `-suite` depends on: `window.MentalModelerConceptMap`
exposing `{render, load, save, screenshot}` (defined in `-js`'s
`src/index.js`). Call sites in `-suite`:
- `src/components/ConceptMap/ConceptMap.jsx` — `render()`, `load()`
- `src/redux/actions/models.js` — `save()`
- `src/services/print.js` — `screenshot()`

## 4. Open items / follow-ups

- **DX gap**: the vendoring process above is manual and error-prone — no
  record of which `-js` commit produced the currently-vendored bundle.
  Discussed candidate fix: convert to a `file:../mentalmodeler-js` link
  (same pattern `mm-modules` already uses) or publish `-js` to npm. Not
  started.
- Old `docs/` folder on `-js`'s `master` (previously used for its GitHub
  Pages deploy) — not yet cleaned up.
- `-suite`'s own GitHub Pages deploy — config done (2026-10-07), same
  `gh-pages` npm package approach as `-js`; the actual first deploy and the
  GitHub repo's Pages-source switch haven't been run yet (external/live
  changes, held for explicit go-ahead). What's in place:
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
