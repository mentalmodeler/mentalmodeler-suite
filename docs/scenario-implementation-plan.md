# Scenario tab implementation plan

Design for roadmap item 7 (`docs/porting-roadmap.md`) — porting `mentalmodeler-scenario`'s
Scenario tab (what-if simulation) into this app. This is the largest item on the roadmap; this
doc is the written design, agreed before implementation, kept as the reference for what was
actually supposed to be built.

## Goal

Let a user pick a scenario, clamp a subset of concepts to fixed values (the "what if"
intervention), run the FCM simulation, and see which other concepts move and in which direction
— compared against each concept's `preferredState` (already live from the Metrics tab) to produce
a prediction-accuracy score. Functional parity with `mentalmodeler-scenario/scripts/views/scenario.js`
+ `models/scenario.js`, not pixel parity.

## What already exists

- **Math**: `mm-modules.runScenario(model, scenarioConcepts, clampFn)` — fully ported. Takes the
  model's concepts, a parallel array of scenario overrides (`{name, influence}`, unclamped =
  falsy influence), and a squash function (`sigm` or `tanh`, both exported from `mm-modules`).
  Returns steady-state vs. clamped-state deltas per unclamped concept.
- **Preferred State**: `model.concepts[i].preferredState` — built in the Metrics tab pass. No
  changes needed; the Scenario tab only reads it.
- **Scenario selection**: `modelsSlice`'s `selectedScenarioId`/`selectedScenario`/`selectScenario`
  reducer, and the Files sidebar's scenario tree — already wired.
- **Remove scenario**: `models/removeSelected` (built in the Remove pass) already handles removing
  the selected scenario, guarded against removing the last one.

## What's new

### 1. Scenario-concept data model: sparse overrides, not a synced parallel array

Legacy (`models/scenario.js`) stores one `ScenarioConceptModel` per model concept, always, and
re-syncs that full parallel collection (`addConcepts`/`updateCollection`) every time the model's
concepts change — explicit bookkeeping to keep two collections in lockstep.

This port instead stores `scenario.concepts` as a **sparse overrides list** — only concepts a user
has actually touched (unchecked from the scenario, or given a clamp value):
`[{ id, selected, influence }]`. Anything not in that list defaults to `selected: true,
influence: 0` at read time. The UI merges this sparse list with the live `model.concepts` on
every render/calc — there is no sync code, because there's nothing to keep in sync. Concepts
added or removed on the model just work automatically.

`setScenarioConceptOverride` (new `modelsSlice` reducer) adds/updates/removes an entry in this
sparse list.

When a scenario round-trips through `.mmp` save/load, flatten the sparse list to a full
per-concept array for file-format compatibility — the sparse shape is a live-state optimization,
not a wire format.

### 2. Compute boundary: one seam, already shaped for a future API

Forward-looking requirement (not built now, just designed for): a future improvement could move
scenario computation to a server API, to support heavier simulation logic than client-side math
comfortably allows. To make that swap a one-function change later:

- All scenario computation goes through one new function, `runScenarioCalculation(request)`, in
  `-suite` (not called inline from the component). Every other part of the feature — the table,
  the prediction score, the chart (Pass 2) — awaits this function's result; none of them call
  `mm-modules.runScenario` directly.
- `runScenarioCalculation` is `async` and returns a `Promise`, even though today it resolves
  synchronously via local computation. The call sites are already written against "await the
  engine," so a later swap to a real network call touches only this one function's body.
- Its request/response shape is already JSON-serializable ("wire-shaped"), not a Redux-shaped
  blob:
  - `model`: the standard MMP shape `mm-modules` already uses everywhere (`{ concepts: [{ id,
    name, relationships }] }`) — reusing the format that's already the de facto standard across
    this whole workspace, rather than inventing a new one.
  - `scenario`: the sparse overrides array, `{ concepts: [{ id, influence }] }`.
  - `squashFunction`: a **string** (`'sigmoid' | 'hyperbolic tangent'`), not a function reference
    — a function can't cross a network boundary. `runScenarioCalculation` resolves the string to
    `mm-modules`' `sigm`/`tanh` export internally, today, right before calling `runScenario`.
  - Response: `{ results: [{ id, name, influence }] }` (plain, serializable), matching what
    `runScenario` already returns.
- Today's implementation: map the string to a function, call `mm-modules.runScenario(...)`
  synchronously, wrap the result in `Promise.resolve(...)`.
- Later: swap the function body for a `fetch()` call against the same request/response shape. No
  changes needed anywhere else.
- Because the call is already async, the table carries a lightweight pending/loading affordance
  now, even though local computation resolves near-instantly — so the UI doesn't need rework once
  a real round-trip is in play.

### 3. Add Scenario

Not its own roadmap line item — it got implicitly folded into "Scenario tab" originally, but
without it a model is stuck with just its one default scenario, which makes the tab hard to
exercise. Small addition: a new reducer (e.g. `addScenario`) appending a new `{ name, concepts: []
}` to `model.scenarios`, wired to replace the `alert('Coming soon: Add a scenario')` stub in
`Files.jsx`'s sidebar "Add" button.

### 4. Components & reducers

- **`src/components/Scenario/Scenario.jsx`** (new) — left-panel-only for this pass (see
  Sequencing below): scenario name field, squash-function select, prediction-score badge, and the
  clamp table.
  - Table: one row per `model.concepts` entry. Checkbox (selected), name, clamp slider + number
    input (-1..1, the scenario override), Preferred State (from `concept.preferredState`,
    `Increase`/`Decrease`, shown only when unclamped), Actual State (from the computed results,
    same Increase/Decrease treatment, shown only when unclamped).
  - A `useEffect` calls `runScenarioCalculation({model, scenario, squashFunction})` whenever
    concepts, overrides, or the squash-function selection change, storing `{results, loading}` in
    local component state. This replaces legacy's manual "Refresh Scenario" button + 500ms
    debounce — a Backbone-era workaround for lacking batched reactivity, not needed in React.
- **`modelsSlice.js`** (new reducers): `updateScenarioName`, `setScenarioConceptOverride`,
  `addScenario`.
- **`runScenarioCalculation`** (new, likely `src/services/scenarioEngine.js` or similar) — the
  compute-boundary adapter described above.
- **Prediction score**: computed client-side from `results` + each concept's `preferredState` +
  its override's `selected`/`influence`, replicating legacy's exact formula — percentage of
  selected, unclamped, preferred-state-set concepts whose simulated direction matched their
  preferred direction.

## Sequencing

- **Pass 1 (this implementation)**: data model, clamp table, prediction score, Add Scenario,
  scenario name, squash-function selector, the `runScenarioCalculation` seam.
- **Pass 2 (separate, later)**: the right-panel bar chart (legacy's `views/scenarioGraph.js`, a
  D3 v3 bar chart of concept name vs. result delta) — a modern equivalent, built with the
  `dataviz` skill when picked up.

## Testing

Manual, same approach used for the rest of this port: exercise in the browser against a sample
model with a feedback loop (e.g. `fire_model`) — clamp a concept, confirm other concepts' Actual
State updates and the prediction score reflects selected/unclamped/preferred-state concepts
correctly; verify Add Scenario, scenario rename, and squash-function switching; confirm removing
a concept from the model doesn't orphan/crash on a scenario that had an override for it (the
sparse-overrides design should make this a non-issue, but worth confirming directly).
