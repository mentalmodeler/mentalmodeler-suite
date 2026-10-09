# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mental Modeler Suite 2.0 — a React shell app for managing multiple fuzzy cognitive map ("Mental Modeler") models. It is a workspace/IDE around a **legacy pre-built concept-map editor** rather than a from-scratch modeling tool: the actual concept-map canvas is a separately-built bundle loaded via `<script>` tags in `index.html`, and this app's React code is a file browser, tab bar, and Redux state layer wrapped around it.

## Commands

```bash
npm run dev       # vite dev server on 0.0.0.0:8081
npm run build     # vite build
npm run preview   # preview the production build
npm run lint      # eslint . --ext js,jsx --max-warnings 0
```

There is no test runner configured in this repo. Node version is pinned via `.nvmrc` (`lts/hydrogen`, i.e. Node 18).

## Architecture

### mentalmodeler-js: the ConceptMap editor, linked as a package

`package.json` depends on `"mentalmodeler-js": "file:../mentalmodeler-js"` (same pattern as `mm-modules`). `src/main.jsx` imports its CSS (`mentalmodeler-js/dist/mentalmodeler-js.css`); `src/components/ConceptMap/ConceptMap.jsx` calls `render(container, { showLoadSaveButtons: false })` / `load(model)`; `src/redux/actions/models.js` calls `save()` (returns `{js, json}`; never downloads, and `undefined` only if the widget threw — the action then keeps the existing model) to pull canvas state into Redux before switching tabs/models; `src/services/print.js` calls `screenshot()`. The package bundles its own React 16 as a sealed second React root.

`mentalmodeler-js` also sets `window.html2canvas` when imported; `print.js` relies on that global for the Metrics/Scenario panels, so `-suite` has no `html2canvas` dependency of its own.

**Rebuild discipline (manual):** `dist/` in `../mentalmodeler-js` is git-ignored. After changing `-js`, run `npm run build` there, then `npm install` here. A fresh clone of `-js` must be built before `-suite` can install or build.

### mm-modules: the MMP file format library

`mm-modules` (`package.json` dependency `"mm-modules": "file:../mm-modules"`) is a sibling local package providing the pure-JS logic for the `.mmp` model file format: `loadFile`/`loadURL` (read a file/URL), `parseMMP` (parse MMP XML/JSON into the app's model shape), `compareModels`, `runScenario`, and `getMetrics`. This is where model-file parsing/scenario-running logic belongs — it's intentionally decoupled from the ConceptMap editor bundle and from React. Because it's linked via `file:../mm-modules`, changes to that sibling repo require `npm install` (or a relink) in this repo to pick up.

`src/models/**/*.mmp` and related fixture files (`.mmp.json`, `.emp`, etc.) are sample/test model files used during development, not build assets.

### App shell layout

`src/App.jsx` lays out a CSS grid (`GlobalNav`, `FilesHeader`, `Files`, `Tabs`, `Content`) plus two dialogs (`AddDialog`, `SaveDialog`). On mount, if the URL has a `?demo=<url>` query param, it loads that `.mmp` URL (or a default sample model, `fire_model.mmp`, if no value given) via `mm-modules`' `loadAndParseURL` and adds it to Redux as a new model — this is how the app is deep-linked into a specific model. Named to match `mentalmodeler-js`'s own `?demo` flag, but it's a separate, unrelated mechanism — see `docs/mentalmodeler-js-deploy-and-vendoring.md`.

- **`Files`** (left rail) lists open models and their scenarios in a tree view; selecting one dispatches `saveModelFromConceptMap` (flushes the current canvas into Redux) before switching `selectedId`/`selectedScenarioId`.
- **`Tabs`** switches `app.view` between `APP_VIEW.MODEL | MATRIX | METRICS | SCENARIO | INFO` (see `src/redux/slices/appSlice.js`). Only `MODEL` and `MATRIX` are currently wired to real content in `Content.jsx`; `METRICS`/`SCENARIO`/`INFO` are tab stops with no view yet.
- **`GlobalNav`** (top bar) has New/Load/Save/Export/Remove/Print actions. Several of these (`Import CSV`, `Export CSV/XLS`, `Remove`, `Print`, `Save Compare Ref`) are stubbed with `alert('Coming soon...')` — check there before assuming a feature is implemented.
- Switching tabs or switching the selected model always dispatches `saveModelFromConceptMap(view)` first (see `src/redux/actions/models.js`), which is the mechanism keeping the Redux store in sync with whatever is live in the ConceptMap canvas.

### State: Redux Toolkit + session-storage persistence

`src/redux/data/store.js` wires `redux-persist` with `storage` from `redux-persist/lib/storage/session` (sessionStorage, not localStorage) — but `persistConfig.whitelist` is currently empty, so **nothing is actually persisted across reloads yet**; persistence is scaffolded but not turned on for any slice.

Two slices (`src/redux/data/rootReducer.js`):
- **`models`** (`src/redux/slices/modelsSlice.js`) — the list of open models, which one/scenario is selected, and model-mutation reducers (`addModel`, `updateModel`, `updateModelFromConceptMap`, `setInfluence`, `selectModel`, `selectScenario`). Note the slice's actions are *not* exported/used by name — call sites dispatch plain `{ type: 'models/addModel', payload }` action objects directly instead of importing action creators (the `export const { ... } = modelsSlice.actions` line is commented out). Follow this convention when adding new model actions rather than reintroducing named exports inconsistently.
- **`app`** (`src/redux/slices/appSlice.js`) — current `view`, and dialog open/closed flags (`addDialogOpen`, `saveDialogOpen`). Both slices share a generic `setField(state, { field, value })` reducer for simple single-field updates.

`src/utils/utils.js` has the model/id helpers used by the slices: `makeAppId`, `makeUuid`, `makeScenarioId`/`parseScenarioId` (scenario IDs are `${appId}::${name}::${index}`), and `createModel()` (the shape of a brand-new empty model).

### Known dead/incomplete code

- `src/routes.js` is entirely commented out (leftover from a different template) and is not imported anywhere — routing in this app is driven by `app.view`, not `react-router`, despite `react-router-dom` being a dependency.
- `src/components/ProjectDialog/ProjectDialog.jsx` and `src/context/AppContext/AppContext.jsx` reference each other but neither is imported by `App.jsx` or any live component — treat as unused unless you're specifically wiring them back in.
- `src/utils/io.js`'s `saveFile`/`writeLocalFile` reference undefined globals (`getJson`, `store`, `saveAs`) and will throw if called — only `createFileInput` in that file is actually used (by `GlobalNav`).

## Conventions

- Styling is MUI (`@mui/material`) with the `sx` prop and a custom theme (`src/constants/theme.js`, `themeExtension.js`); custom palette tokens like `bg.darker`/`bg.darkest` and custom `Typography`/`Button` variants (e.g. `variant="logo"`, `variant="global-nav"`) are defined there — grep the theme files before assuming a token/variant doesn't exist.
- Prettier config: 4-space tabs, single quotes, trailing commas, 120 print width (`.prettierrc.json`). ESLint extends `eslint:recommended` + React + `plugin:prettier/recommended`, so `npm run lint` enforces formatting too.
- Reducers across both slices favor dispatching raw `{ type: 'slice/action', payload }` objects over imported action creators — match this when adding new dispatches unless you also update the exports consistently.
