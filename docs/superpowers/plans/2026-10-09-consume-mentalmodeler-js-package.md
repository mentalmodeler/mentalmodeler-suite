# Consume mentalmodeler-js as a `file:` package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `mentalmodeler-suite`'s vendored, hand-copied concept-map bundle (`public/libs/conceptmap/` + `<script>`/`<link>` tags + `scripts/sync-conceptmap.js`) with a real `file:../mentalmodeler-js` package that `-suite` `import`s, the same way it already links `mm-modules`.

**Architecture:** `mentalmodeler-js` (phase-2 branch, PR #32) now builds `dist/mentalmodeler-js.es.js` + `dist/mentalmodeler-js.css`. `-suite` adds the `file:` dependency, imports `render`/`load`/`save`/`screenshot` where it used `window.MentalModelerConceptMap.*`, imports the CSS in its entry, passes `showLoadSaveButtons: false`, and deletes the vendoring. `html2canvas` now lives only in `-js`, which assigns `window.html2canvas` on import; `-suite`'s print flow reads that global.

**Tech Stack:** Vite 4.4 + React 18 + MUI 5 + Redux Toolkit (`-suite`); the linked package bundles its own React 16 and is a sealed second React root. No test runner exists in `-suite` (`vitest` is not installed), so verification is lint + build + scripted browser checks.

**Spec:** `../mentalmodeler-js/docs/superpowers/specs/2026-10-08-bundling-and-embedding-design.md` — Section 4 and Testing item 1. Companion plan (already executed): `../mentalmodeler-js/docs/superpowers/plans/2026-10-09-dual-build-outputs.md`.

## Prerequisites

- `mentalmodeler-js` is checked out on `phase2-bundling-design` (or `master` once PR #32 merges) and `npm run build` has produced `../mentalmodeler-js/dist/`. `dist/` is git-ignored, so **a fresh clone of `-js` must be built before `-suite` can install or build.**
- Work on a new branch off `main`: `git switch -c use-mentalmodeler-js-package`.

## Global Constraints

- Link exactly as the spec says: `"mentalmodeler-js": "file:../mentalmodeler-js"` in `package.json`; no npm registry publish.
- Call-site changes are mechanical — signatures match today's globals: `render(container, options)`, `load(model)`, `save()` (returns `{js, json}`), `screenshot()`.
- `render()` is called with `{ showLoadSaveButtons: false }` (`-suite` has its own load/save controls).
- CSS: `import 'mentalmodeler-js/dist/mentalmodeler-js.css'` in `src/main.jsx`; no `<link>` tags.
- Deleted from `-suite`: `scripts/sync-conceptmap.js`, `public/libs/conceptmap/` (including the dated `2024-08-*` snapshot folders; they remain in git history), `index.html`'s vendored `<link>`/`<script>` tags, `.eslintrc.cjs`'s `scripts/**/*.js` Node override, and the `sync-conceptmap` npm script.
- Rebuild discipline stays manual and documented: `npm run build` in `-js`, then `npm install` in `-suite`. No `prepare`-script automation.
- Do not modify `mentalmodeler-js` or `mentalmodeler-scenario` from this plan. If `-js` needs a change, stop and raise it.
- Prettier: 4 spaces, single quotes, trailing commas, 120 columns (`npm run lint` enforces it, `--max-warnings 0`).
- Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Silent data loss on tab switch (the original production failure)** — `saveModelFromConceptMap` dispatches `updateModelFromConceptMap` with whatever `save()` returns; if it is ever `undefined` (a swallowed `-js` error), the reducer overwrites `concepts`/`groupNames` with `undefined`, blanking the model with no crash. Owned by Task 2: add a guard, and the smoke test checks concept counts survive Model → Metrics → Model.
2. **Vite 4 dev server refuses the symlinked package** — `../mentalmodeler-js/dist/...` resolves outside the project root, so `/@fs/` access can 403 or the dep can be mis-pre-bundled, while `npm run build` still passes. Owned by Task 1 (dev-server check); fallback `server.fs.allow` is spelled out there.
3. **Widget looks different once `app.css` is gone** — `-suite` loaded `/libs/conceptmap/shared/app.css` (normalize) next to MUI. `-js` now scopes the base styles it needs, but MUI's own styles are also on the page. Owned by Task 1 (baseline screenshot) and Task 3 (post-deletion comparison).
4. **Print flow has no `html2canvas`** — `print.js` rasterizes Metrics/Scenario panels with `html2canvas`; after removing `-suite`'s own import it relies on `window.html2canvas` set by `-js`. If that global is missing, panels print as blank/missing with only a console error. Owned by Task 2 (guarded read + scripted print check).
5. **Production base path** — the deployed app is served from `/mentalmodeler-suite/`; the old vendored paths were root-absolute (`/libs/...`). The new bundled import must work under that base. Owned by Task 3 (`vite preview` at the real base).

---

## File Structure

- Modify `package.json`, `package-lock.json` — add `mentalmodeler-js`, remove `html2canvas` and the `sync-conceptmap` script.
- Modify `src/main.jsx` — CSS import; drop `html2canvas` import/assignment.
- Modify `src/components/ConceptMap/ConceptMap.jsx`, `src/redux/actions/models.js`, `src/services/print.js` — ES imports.
- Modify `index.html` — remove vendored tags.
- Modify `.eslintrc.cjs` — remove Node-scripts override.
- Delete `scripts/sync-conceptmap.js`, `public/libs/conceptmap/**`.
- Modify `CLAUDE.md`, `docs/mentalmodeler-js-deploy-and-vendoring.md`.

---

### Task 1: Link the package, import its CSS, capture a visual baseline

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/main.jsx`

**Interfaces:**
- Produces: `mentalmodeler-js` resolvable from `-suite` (`node_modules/mentalmodeler-js` → symlink to `../mentalmodeler-js`); baseline screenshots and measurements (taken before any change) for Task 3's comparison.

- [ ] **Step 1: Create the branch and verify `-js` is built**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite
git switch -c use-mentalmodeler-js-package
test -f ../mentalmodeler-js/dist/mentalmodeler-js.es.js && test -f ../mentalmodeler-js/dist/mentalmodeler-js.css && echo built
```
Expected: `built`. If not: `(cd ../mentalmodeler-js && git switch phase2-bundling-design && npm run build)`, then retry.

- [ ] **Step 2: Capture the baseline BEFORE changing anything**

Run `npm run dev` (port 8081). In Chrome (`http://localhost:8081/?demo`), load the Fire model, open the Model tab, and take a screenshot of the full window with `save_to_disk: true`. Also record, via the console:
```js
({
    concepts: document.querySelectorAll('.map__content .Concept').length,
    font: getComputedStyle(document.querySelector('.Concept__textarea')).fontFamily,
    panelWidth: document.querySelector('.controls__bg')?.getBoundingClientRect().width,
})
```
Write the three values into the ledger / your notes; Task 3 compares against them. Stop the dev server.

- [ ] **Step 3: Add the dependency**

In `package.json` `dependencies`, after `"mm-modules": "file:../mm-modules",` (keep alphabetical-ish grouping with it):
```json
"mentalmodeler-js": "file:../mentalmodeler-js",
```
Run: `npm install`
Expected: succeeds; `ls -l node_modules/mentalmodeler-js` shows a symlink to `../../mentalmodeler-js`.

- [ ] **Step 4: Import the CSS in the entry**

`src/main.jsx`, with the other imports at the top:
```js
import 'mentalmodeler-js/dist/mentalmodeler-js.css';
```

- [ ] **Step 5: Verify the package resolves in a production build**

Run: `npm run build`
Expected: builds without "Failed to resolve import". Then:
```bash
grep -l "MentalMapper" dist/assets/*.css
```
Expected: one CSS file listed (the widget's styles are bundled).

- [ ] **Step 6: Verify the dev server serves the linked package (Review Focus 2)**

Temporarily add `import 'mentalmodeler-js';` as the first line of `src/main.jsx`, run `npm run dev`, and `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8081/node_modules/mentalmodeler-js/dist/mentalmodeler-js.es.js`. Then load `http://localhost:8081/` in Chrome and read console errors.
Expected: `200` and no console errors mentioning `/@fs/` or "outside of Vite serving allow list".
If it 403s: add to `vite.config.js` inside `defineConfig({...})`:
```js
server: {
    host: '0.0.0.0',
    port: 8081,
    fs: { allow: ['..'] },
},
```
(merge into the existing `server` block) and retry. Remove the temporary import afterward.

- [ ] **Step 7: Lint and commit**

```bash
npm run lint
git add package.json package-lock.json src/main.jsx vite.config.js
git commit -m "Link mentalmodeler-js as a file: package and import its CSS"
```
Expected: lint clean. (`vite.config.js` only changes if Step 6's fallback was needed; drop it from `git add` otherwise.)

---

### Task 2: Swap the call sites to ES imports

**Files:**
- Modify: `src/components/ConceptMap/ConceptMap.jsx`, `src/redux/actions/models.js`, `src/services/print.js`, `src/main.jsx`, `index.html`, `package.json`

**Interfaces:**
- Consumes: `import { render, load, save, screenshot } from 'mentalmodeler-js'` — `render(target: Element | string, options?: { showLoadSaveButtons?: boolean })`, `load(model: object | string): void`, `save(): { js, json } | undefined`, `screenshot(): Promise<HTMLCanvasElement> | undefined`. Importing the package also sets `window.html2canvas` if unset.
- Produces: `-suite` no longer reads or depends on `window.MentalModelerConceptMap`.

- [ ] **Step 1: `ConceptMap.jsx`**

Replace the file with:
```jsx
import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import { render, load } from 'mentalmodeler-js';
import { APP_VIEW } from '../../redux/slices/appSlice';
import { useSelector } from 'react-redux';

export const ConceptMap = () => {
    const contentRef = useRef(null);
    const { view } = useSelector((state) => state.app) || {};
    const { selectedId, selectedModel } = useSelector((state) => state.models) || {};
    // const selectedModel = useMemo(() => models.find((m) => m.appId === selectedId), [selectedId]);

    useEffect(() => {
        if (view === APP_VIEW.MODEL) {
            render(contentRef.current, { showLoadSaveButtons: false });
        }
    }, [view]);

    useEffect(() => {
        if (selectedId && view === APP_VIEW.MODEL) {
            console.log('selectedModel:', selectedModel);
            load(selectedModel);
        }
    }, [selectedId]);

    return <Box ref={contentRef} sx={{ backgroundColor: 'common.white', height: '100%' }} />;
};
```

- [ ] **Step 2: `models.js` with the Review-Focus-1 guard**

Replace the file with:
```js
import { save } from 'mentalmodeler-js';
import { APP_VIEW } from '../slices/appSlice';

export const saveModelFromConceptMap = (view) => {
    console.log('saveModelFromConceptMap, view:', view);
    if (view === APP_VIEW.MODEL) {
        const model = save();
        console.log('model:', model);
        // save() returns undefined if the widget threw; dispatching that would blank
        // the selected model's concepts/groupNames (see docs/mentalmodeler-js-deploy-and-vendoring.md).
        if (!model) {
            console.error('saveModelFromConceptMap: concept map returned no data; keeping existing model');
            return () => {};
        }
        return (dispatch) => {
            dispatch({
                type: 'models/updateModelFromConceptMap',
                payload: { value: model },
            });
        };
    }
    return () => {};
};
```

- [ ] **Step 3: `print.js`**

Change the top import and the two places that used the old globals:
```js
import { screenshot } from 'mentalmodeler-js';
import store from '../redux/data/store';
```
(remove `import html2canvas from 'html2canvas';`), then in `rasterizePanel` replace
```js
        return await html2canvas(element, { allowTaint: true, logging: false });
```
with
```js
        // window.html2canvas is provided by mentalmodeler-js on import
        if (typeof window.html2canvas === 'undefined') {
            console.error('print: window.html2canvas is not defined; skipping panel', elementId);
            return null;
        }
        return await window.html2canvas(element, { allowTaint: true, logging: false });
```
and in `printModel` replace
```js
        if (window.MentalModelerConceptMap?.screenshot) {
            const modelCanvas = await window.MentalModelerConceptMap.screenshot();
            appendCanvas(printArea, modelCanvas);
        }
```
with
```js
        appendCanvas(printArea, await screenshot());
```
(`appendCanvas` already ignores a falsy canvas.) Note: the `classList.add('printable')` before the guard in `rasterizePanel` is inside the existing `try/finally`, so the early `return null` still removes the class.

- [ ] **Step 4: `main.jsx` and `index.html`**

`src/main.jsx`: delete `import html2canvas from 'html2canvas';` and the comment + `window.html2canvas = html2canvas;` lines.

`index.html`: delete the two commented font-awesome/foundations `<link>` lines, the `/libs/conceptmap/shared/app.css` and `/libs/conceptmap/static/css/main.css` `<link>` lines, the commented `mentalmodeler.github.io` CSS link, the `<script src="/libs/conceptmap/static/js/main.js">` line and the commented `mentalmodeler.github.io` script line. Keep the font links, viewport, title, `#root`, and `<script type="module" src="/src/main.jsx">`.

- [ ] **Step 5: Drop `-suite`'s own `html2canvas` dependency**

Remove `"html2canvas": "^1.4.1",` from `package.json` `dependencies`, then `npm install`.
Check nothing else imports it: `grep -rn "html2canvas" src` — expected: only the guarded `window.html2canvas` lines in `print.js`.

- [ ] **Step 6: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed. If Vite 4's bundler rejects the linked package's syntax ("Unexpected token"), do **not** work around it here: record the error and stop — the fix is a `build.target` in `-js`'s `vite.config.js`, which belongs to `-js`.

- [ ] **Step 7: Scripted browser smoke test (Review Focus 1, 3, 4)**

Run `npm run dev`; open `http://localhost:8081/?demo` in Chrome. Use `read_page` to find the tab controls. With the console:
1. **Widget mounts, buttons hidden:**
```js
({ map: !!document.querySelector('.map__content'),
   save: !!document.querySelector('.map-controls__save'),
   load: !!document.querySelector('.map-controls__load'),
   noGlobal: typeof window.MentalModelerConceptMap,
   h2c: typeof window.html2canvas,
   concepts: document.querySelectorAll('.map__content .Concept').length })
```
Expected: `map: true`, `save: false`, `load: false`, `h2c: 'function'`, `concepts` equal to the baseline from Task 1 Step 2. (`noGlobal` is `'undefined'`: the ES import does not set the old global.)
2. **Tab switch keeps data:** click Metrics, then Model; re-run `concepts` count. Expected: unchanged. Repeat for Scenario → Model. No console errors, and **no `mmp (N).json` download prompts** (the old failure mode).
3. **Switch models:** if the file browser has a second model, select it, then back; `concepts` follows the selected model and returns to the baseline on return.
4. **Save path:** from the console of the app, switch to Metrics (this triggers `saveModelFromConceptMap`); in the Redux-persisted state (`localStorage['persist:root']`) the selected model still contains concepts.
5. **Print (without opening the dialog):** before clicking Print, run
```js
window.print = () => { window.__printed = document.getElementById('printArea').children.length; };
```
then use the Print action. Expected after ~5 s: `window.__printed >= 1` (model canvas) plus one canvas each for Metrics and every scenario, and no `html2canvas is not defined` console errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Import mentalmodeler-js instead of the window global; hide its load/save buttons"
```

---

### Task 3: Delete the vendoring and verify the production build

**Files:**
- Delete: `scripts/sync-conceptmap.js`, `public/libs/conceptmap/**`
- Modify: `package.json`, `.eslintrc.cjs`

**Interfaces:**
- Consumes: Task 2's imports (nothing may still reference `/libs/conceptmap`).
- Produces: a repo with no vendored concept-map assets; a production build verified at the real `/mentalmodeler-suite/` base.

- [ ] **Step 1: Confirm nothing references the vendored paths**

Run: `grep -rn "libs/conceptmap\|sync-conceptmap" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=docs --exclude=CLAUDE.md --exclude-dir=libs`
Expected: only `package.json` (script), `.eslintrc.cjs` (comment), `scripts/sync-conceptmap.js`.

- [ ] **Step 2: Delete**

```bash
git rm -r scripts/sync-conceptmap.js public/libs/conceptmap
```
Remove `"sync-conceptmap": "node scripts/sync-conceptmap.js",` from `package.json` scripts. In `.eslintrc.cjs` remove the whole `overrides: [ ... ]` block (and the trailing comma on the preceding `rules` block if Prettier requires). If `scripts/` is now empty, `git status` will show the directory gone.

- [ ] **Step 3: Lint, build, and check the output has no vendored leftovers**

```bash
npm run lint && npm run build
test ! -e dist/libs && echo no-libs-in-dist
```
Expected: lint clean, build succeeds, `no-libs-in-dist`.

- [ ] **Step 4: Production smoke at the deployed base path (Review Focus 5, 3)**

Run `npm run preview` (serves at `http://localhost:4173/mentalmodeler-suite/`). Repeat Task 2 Step 7 checks 1, 2 and 5 against `http://localhost:4173/mentalmodeler-suite/?demo`. Then compare against the Task 1 baseline: `font` must match, `panelWidth` within 2 px, and take a screenshot of the Model tab — it should match the baseline screenshot visually (concept text sans-serif, same node sizes, same toolbar). Also check the Network tab: no request returns 404.
Expected: all checks pass, no `/libs/` requests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove vendored concept-map bundle, sync script, and Node scripts lint override"
```

---

### Task 4: Update docs

**Files:**
- Modify: `CLAUDE.md`, `docs/mentalmodeler-js-deploy-and-vendoring.md`

- [ ] **Step 1: `CLAUDE.md`**

Replace the section "### The legacy ConceptMap bundle is a separate build, not source in this repo" (and its two following paragraphs) with:
```markdown
### mentalmodeler-js: the ConceptMap editor, linked as a package

`package.json` depends on `"mentalmodeler-js": "file:../mentalmodeler-js"` (same pattern as `mm-modules`). `src/main.jsx` imports its CSS (`mentalmodeler-js/dist/mentalmodeler-js.css`); `src/components/ConceptMap/ConceptMap.jsx` calls `render(container, { showLoadSaveButtons: false })` / `load(model)`; `src/redux/actions/models.js` calls `save()` (returns `{js, json}`; never downloads) to pull canvas state into Redux before switching tabs/models; `src/services/print.js` calls `screenshot()`. The package bundles its own React 16 as a sealed second React root.

`mentalmodeler-js` also sets `window.html2canvas` when imported; `print.js` relies on that global for the Metrics/Scenario panels, so `-suite` has no `html2canvas` dependency of its own.

**Rebuild discipline (manual):** `dist/` in `../mentalmodeler-js` is git-ignored. After changing `-js`, run `npm run build` there, then `npm install` here. A fresh clone of `-js` must be built before `-suite` can install or build.
```
Also update the Commands list if it mentions `sync-conceptmap` (it does not today) and the sentence about guarding with `window.MentalModelerConceptMap?.method` — delete it; the imports are always defined.

- [ ] **Step 2: `docs/mentalmodeler-js-deploy-and-vendoring.md`**

At the very top, under the title, add:
```markdown
> **Superseded 2026-10-09:** `-suite` no longer vendors a copy of `-js`. It links `file:../mentalmodeler-js` and imports it; `scripts/sync-conceptmap.js` and `public/libs/conceptmap/` were deleted. §3 below describes the old interim setup and is kept for history. The `standalone` detection described in §2 was removed from `-js` entirely (PR #32). See `docs/superpowers/plans/2026-10-09-consume-mentalmodeler-js-package.md`.
```
In "§4 Open items", mark the DX-gap bullet resolved by appending ` **Resolved 2026-10-09** — see the note at the top.`

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/mentalmodeler-js-deploy-and-vendoring.md
git commit -m "Document the mentalmodeler-js package link and retire the vendoring notes"
```

---

## Self-Review

**Spec coverage (Section 4):** `file:` link and `npm install` → Task 1; three call-site swaps → Task 2 Steps 1–3; CSS import → Task 1 Step 4; deletions (sync script, `public/libs/conceptmap`, `index.html` tags, `.eslintrc.cjs` override) → Task 2 Step 4 and Task 3; manual rebuild discipline → Global Constraints + Task 4; `showLoadSaveButtons: false` → Task 2 Step 1. Testing item 1 (package-import smoke: tabs, models, scenarios, save, print, data survives a tab switch) → Task 2 Step 7 and Task 3 Step 4.

**Additions beyond the spec:** the `save()` undefined-guard (Review Focus 1); `html2canvas` sourced from `-js` and `-suite`'s own dependency dropped (agreed in conversation, 2026-10-09); a baseline screenshot and visual comparison for the CSS change; `server.fs.allow` fallback.

**Placeholder scan:** none; each code step has full content. Browser steps name exact selectors/classes taken from `-js`'s source (`.map__content`, `.Concept`, `.map-controls__save`); tab controls are located with `read_page` because `-suite`'s tab markup was not inspected while writing this plan.

**Type consistency:** `render(el, { showLoadSaveButtons })`, `load(model)`, `save()`, `screenshot()` match `-js`'s `src/api.js` exports; `window.html2canvas` is read in `print.js` only.

**Risks accepted:** no automated tests in `-suite` (no runner installed); verification is manual-scripted. `-suite` builds depend on a sibling `-js` checkout with `dist/` built — the same limitation `mm-modules` has, accepted in the spec.
