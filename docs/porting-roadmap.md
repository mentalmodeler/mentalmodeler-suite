# Porting roadmap: `mentalmodeler-scenario` → `mentalmodeler-suite`

Tracks the remaining gaps between the legacy `mentalmodeler-scenario` app (RequireJS/Backbone)
and this app, and the order we're closing them in. See `../../CLAUDE.md` (workspace root) for how
the sibling repos relate, and this repo's own `CLAUDE.md` for the current stub locations
(`GlobalNav`, `Content.jsx`, `Tabs`).

Each feature gets its own design + implementation plan when it's picked up (via the
`superpowers:brainstorming` → `superpowers:writing-plans` flow), linked below once it exists.
This doc is the standing overview; the per-feature plan is the detailed checklist for actually
doing the work.

## Status

| # | Feature | Legacy source | Port complexity | Status | Plan |
|---|---|---|---|---|---|
| 1 | Info tab | `mentalmodeler-scenario/scripts/views/info.js` | Trivial | Done | bounded change, no separate plan doc — see `src/components/Info/Info.jsx` |
| 2 | Remove model/scenario | n/a (just unwire the stub) | Trivial | Done | bounded change, no separate plan doc — `models/removeSelected` in `modelsSlice.js` |
| 3 | Preferred State & Metrics tab | `mentalmodeler-scenario/scripts/views/preferred.js`; math: `mm-modules.getMetrics`/`getConceptsWithMetrics` | Low–Medium (bigger than estimated — the legacy tab also writes a `preferredState` field onto each concept, later consumed by Scenario's prediction score) | Done | bounded change, no separate plan doc — `src/components/Metrics/Metrics.jsx`, `models/setPreferredState` in `modelsSlice.js`, new `mm-modules` export `getConceptsWithMetrics` |
| 4 | Export CSV/XLS | `mentalmodeler-scenario/scripts/views/header.js` `exportData()` (jQuery `tableExport`) — exports the same adjacency-matrix data as the Matrix tab | Low | Done | bounded change, no separate plan doc — `utils/getMatrixRows`, `utils/io.downloadBlob`, wired in `GlobalNav.jsx`. New deps: `papaparse` (CSV), `write-excel-file` (XLSX) — chosen over `xlsx`/SheetJS, which has unfixed high-severity advisories on npm |
| 5 | Save Compare Ref | `MmpModel.getXML(removeCoordinates)` in `mentalmodeler-scenario` — canonical answer-key export for `mm-compare`, with a load-guard to discourage students from reopening it | Medium | Done | bounded change, no separate plan doc — `utils/toCompareRefModel`, wired in `GlobalNav.jsx` (`saveCompareRef` + load guard). Exports JSON (not XML — no consumer needs XML, and `mm-modules` has no XML writer); marker is `compareRef: true` instead of legacy's `<compareref/>` |
| 6 | Import CSV | `AppModel.importCSV` in `mentalmodeler-scenario/scripts/models/app.js` (Papa Parse + auto-layout) | Medium | Done | bounded change, no separate plan doc — new `mm-modules` module `src/csvImport.js` (`importCSV`), wired in `GlobalNav.jsx` (`importLocalCSV`). Uses `d3-force` for layout instead of legacy's `dagre` — FCMs are cyclic (feedback loops), and dagre's layered/DAG-oriented algorithm fights cycles by fake-reversing edges; a force simulation has no hierarchy/direction concept so it doesn't fight the graph structure. Also far lighter than the alternative hierarchical options considered (elkjs ~8MB unpacked) |
| 7 | Scenario tab | `mentalmodeler-scenario/scripts/views/scenario.js`; math: `mm-modules.runScenario` (exists) | High | Done (Pass 1) | `docs/scenario-implementation-plan.md`, `docs/superpowers/plans/2026-10-04-scenario-tab.md` — clamp table, prediction score, Add Scenario, squash-function selector, `runScenarioCalculation` seam. Pass 2 (bar chart, legacy's `views/scenarioGraph.js`) not started — pick up with the `dataviz` skill |
| 8 | Print | `mentalmodeler-scenario/scripts/views/header.js` `print()` (`html2canvas` + `window.print()`) | Medium | Done | bounded change, no separate plan doc — `src/services/print.js`, wired in `GlobalNav.jsx`. New dep `html2canvas`, also now exposed as `window.html2canvas` for the embedded `mentalmodeler-js` bundle's own `screenshot()` API, which depended on that same global and was silently broken before this (unrelated latent bug, fixed as a side effect) |

## Sequencing rationale

Front-load the cheap, independent wins (Info, Remove, Metrics) to validate the pattern for
wiring a new `-suite` tab/action against `mm-modules`. Export CSV/XLS and Save Compare Ref are
independent of each other and of the remaining items — either order is fine. Import CSV needs a
layout-dependency decision (`dagre` or a `-suite`-native alternative) so it's sequenced after the
export-side work. Scenario is saved for last among the "real" features since it's the largest
lift (clamp-value UI, run/compare UI) even though its math already exists in `mm-modules`. Print
is last because it visually depends on Metrics and Scenario already having real views to
screenshot.

## When picking up a feature

1. Brainstorm the feature as its own sub-project (architectural or bounded, depending on size).
2. Write/approve a short design; for anything touching `mm-modules`, confirm whether the new
   logic belongs there (shared) or in `-suite` only (app-specific).
3. Run `superpowers:writing-plans` to produce the detailed implementation checklist.
4. Link the resulting plan doc in the table above and flip Status to `In progress` → `Done`.
