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

## Post-implementation review (2026-10-04)

After Pass 1 was built, committed, and manually verified, a fresh-context review (no memory of
the build) checked the whole branch against this spec and the implementation plan's own "Review
Focus" list. It found 11 real, reproduced findings — 3 Critical, 4 Important, 4 Minor. All
Critical/Important were fixed in one follow-up pass (commit `87bd5ac`), each verified by
reproducing the failure first, then confirming the fix, then re-confirming live in the browser.
Minors were deferred (not fixed) — noted below for later.

### Fixed — Critical

- **Add Scenario on a model you weren't viewing overwrote its concepts**
  (`src/components/Files/Files.jsx`). The click handler dispatched `models/selectModel` *before*
  `saveModelFromConceptMap`, which flushes whatever's live on the Model-tab canvas into
  `selectedModel`. Since `selectedModel` had already switched to the clicked row's model, the
  *previous* model's canvas got written into the new one — silent data loss. Fix: flush first,
  then select.
- **Switching models while a scenario was selected left the Scenario tab showing stale,
  mismatched data** (`src/redux/slices/modelsSlice.js`). `selectModel`/`addModel` cleared
  `selectedScenarioId` but not `selectedScenario`, and the component's "is a scenario selected?"
  guard only checked `selectedScenario`. Result: the tab could render one model's scenario
  against a *different*, now-selected model's concepts, and any edit would silently vanish (the
  reducers key off `selectedScenarioId`, which was already empty). Fix: clear both together; also
  added `NaN`-index guards to `updateScenarioName`/`setScenarioConceptOverride` and tightened the
  component's guard to require both fields, as defense in depth.
- **`.mmp` file data wasn't type-coerced, so loaded scenario overrides displayed backwards**
  (`src/utils/scenario.js`). Values read from a `.mmp` file are strings (`influence: '0'`,
  `selected: 'False'`), and the code used plain JS truthiness: the string `'0'` is truthy, so a
  concept explicitly clamped to *zero* displayed as clamped (should be the opposite — zero means
  "not clamped"); `'False'` is truthy, so an unselected concept rendered as a checked checkbox
  and got counted in the prediction score. This isn't a hypothetical — two shipped sample files
  exercise it (`fish_wetland_mod2.mmp` has an all-zero-string scenario; `fire_model.mmp` has an
  explicit `selected: False`). Fix: `getScenarioOverride` now coerces explicitly (string
  `'True'`/`'true'` → `true`, everything else → `false`; `parseFloat(influence) || 0`), matching
  legacy's own coercion rules.

### Fixed — Important

- **A brand-new model (zero concepts) crashed the compute step.** `runScenarioCalculation` called
  into `mm-modules.runScenario`, which threw ("cannot multiply two empty vectors") on an empty
  concepts array — the app's actual default state right after clicking New. Fix: short-circuit to
  `{ results: [] }` when there are no concepts.
- **No error handling on the compute call** — any rejection (including the one above, before it
  was fixed) left the tab stuck on "State Prediction: …" forever, since nothing ever cleared the
  loading flag. Fix: added a `.catch` that clears loading and logs the error.
- **Three reducers assumed every model has a `scenarios` array.** A shipped sample
  (`simple_js.mmp`) has no `scenarios` key at all, so `addScenario` (and the other two) threw the
  moment you clicked Add. Fix: default to `[]` in all three.
- **Renaming a scenario desynced it from the sidebar.** Scenario ids embed the name
  (`${appId}::${name}::${index}`), but `updateScenarioName` only updated the name, not
  `selectedScenarioId` — so after a rename, the sidebar tree's item id no longer matched the
  stored selection id, and the highlight disappeared even though you were still editing that
  scenario. Fix: regenerate the id alongside the name.
- **Blurring the (empty) name field right after clicking Add renamed the scenario to `''`.** The
  field starts blank by design (placeholder-only), but the blur handler dispatched whatever was
  there unconditionally. Fix: skip the dispatch when the trimmed value is empty.

### Deferred — Minor (not fixed, noted for later)

- **Clamp input doesn't enforce the -1..1 range.** The `+/-` column's number input has
  `min="-1"`/`max="1"` HTML attributes, but those only matter for built-in browser form
  validation, which nothing here triggers — they don't stop the value from being accepted. The
  blur handler just does `parseFloat(value) || 0`, no clamping. Typing e.g. `50` into that field
  feeds a raw `50` straight into the simulation as that concept's locked value — not run through
  the sigmoid/tanh squashing that normally keeps values bounded, so the result is numerically
  meaningless with no indication anything went wrong. Not a crash, just silent garbage-in on a
  fat-fingered value. Fix would be clamping the parsed value to `[-1, 1]` before dispatching.
- **Duplicate concept names can produce a wrong prediction score.**
  `mm-modules.runScenario` (pre-existing math, not touched by this plan) excludes clamped
  concepts from its results by matching normalized *name*, not id. If two concepts share a name
  and only one is clamped, the other can be silently dropped from the results — it'll show a
  blank Actual State and get scored as "incorrect" even though it was never actually computed.
  Root cause is in `mm-modules`, out of this plan's scope; flagged here since it's reachable from
  this tab.
- **No loading affordance on the table itself.** The only pending-state indicator is the `…` that
  replaces the prediction percentage while a computation is in flight — the clamp table doesn't
  visually indicate "stale, recomputing." Harmless today since local computation is near-instant;
  will matter more once the compute-boundary seam (section 2 above) is ever pointed at a real
  network call.
