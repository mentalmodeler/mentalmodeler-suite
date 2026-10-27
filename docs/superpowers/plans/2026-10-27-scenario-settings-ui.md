# Scenario Settings UI and Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface PyFCM's scenario options (inference rule, squash function, lambda, noise threshold) in the Scenario tab, and save them on each scenario so results are reproducible.

**Architecture:** Settings live on the scenario object (`scenario.settings`) in the Redux model, so the existing whole-model save persists them. A new reducer merges partial settings into the selected scenario. `scenarioEngine.runScenarioCalculation` reads the scenario's settings (normalized, with an app default) and calls `mm-modules`' `runInference`. A new `ScenarioSettings` component renders the controls in the Scenario header; `Scenario.jsx` drops its local `squashFunction` state.

**Tech Stack:** React 18, MUI 5, Redux Toolkit, Vitest 5 + jsdom + `@testing-library/react` (use `fireEvent`; follow `Scenario.test.jsx` for rendering with a store).

**Spec:** `../mm-modules/docs/superpowers/specs/2026-10-27-scenario-inference-options-design.md`. **Depends on** `../mm-modules/docs/superpowers/plans/2026-10-27-scenario-inference-engine.md` being finished first (it provides `runInference`, `normalizeScenarioSettings`, `DEFAULT_SCENARIO_SETTINGS`, `INFERENCE_RULES`, `SQUASH_FUNCTIONS` from the `mm-modules` package root).

## Global Constraints

- Settings shape on a scenario: `settings: { rule, squash, lambda, noiseThreshold }`; rules `'kosko' | 'modified kosko' | 'rescaled kosko'`; squash `'sigmoid' | 'hyperbolic tangent' | 'bivalent' | 'trivalent'`; lambda 0 < λ <= 10; noiseThreshold 0 to 1. Default `{ rule: 'kosko', squash: 'sigmoid', lambda: 1, noiseThreshold: 0 }` (from `DEFAULT_SCENARIO_SETTINGS`).
- Loading never rewrites a scenario: a scenario with no (or invalid) `settings` is shown and run with the default, and its object in the store stays unchanged until the user edits a setting.
- Do not modify `mm-modules`, `mentalmodeler-js`, or `mentalmodeler-scenario`. Changing a model's non-scenario data is out of scope.
- "Influence 0 means not clamped" stays the UI's meaning: only scenario concepts with a non-zero influence become clamps.
- After `mm-modules` changes, run `npm install` in this repo to pick them up (`"mm-modules": "file:../mm-modules"`).
- Match surrounding code style. Check only files you touch with `npx eslint <files>` (the repo has unrelated lint failures). Work on a new branch off `main`; do not commit to `main`; do not push or merge.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

1. An old scenario with no `settings` runs with defaults, shows default controls, and is not changed in the store merely by being displayed. [Task 1, Task 3]
2. Switching to a different scenario or model shows that scenario's own settings, not the previous one's. [Task 3]
3. Switching to bivalent or trivalent hides the lambda input but does not lose its stored value. [Task 3]
4. A typed lambda or threshold that is blank, 0, or out of range never reaches the store and never crashes the tab. [Task 3]
5. Changing settings quickly never lets an older, slower calculation overwrite a newer result. [Task 3]

## Tasks

### Task 1: `setScenarioSettings` reducer

**Files:**
- Modify: `src/redux/slices/modelsSlice.js` (add the reducer next to `setScenarioConceptOverride`, around line 239)
- Test: `src/redux/slices/modelsSlice.test.js`

**Interfaces:**
- Produces: action `{ type: 'models/setScenarioSettings', payload: { settings: Partial<Settings> } }`. It merges `payload.settings` into the selected scenario's `settings` (creating `settings` if absent), updates `selectedModel`, `models` and `selectedScenario` the way `setScenarioConceptOverride` does, and does nothing when no scenario is selected.

- [ ] **Step 1: Write failing tests** in `modelsSlice.test.js`, using a base state with one model that has two scenarios (`makeScenarioId` / `selectedScenarioId` as the existing scenario tests set them up):
  - Dispatching `{ settings: { rule: 'modified kosko' } }` sets `selectedScenario.settings` to `{ rule: 'modified kosko' }` and the same object appears in `selectedModel.scenarios[i]` and `models`.
  - A second dispatch `{ settings: { lambda: 3 } }` yields `{ rule: 'modified kosko', lambda: 3 }` (merge, not replace).
  - The other scenario in the model is unchanged (`toBe` the same object).
  - The scenario's `concepts` are unchanged.
  - With `selectedScenarioId: ''`, the state is returned unchanged.
- [ ] **Step 2: Run** `npx vitest run src/redux/slices/modelsSlice.test.js`. Expected: FAIL on the new tests.
- [ ] **Step 3: Implement the reducer** following `setScenarioConceptOverride`'s pattern (`parseScenarioId`, `NaN` guard, rebuild `scenarios`, `updateModels`).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** (`feat: setScenarioSettings reducer`).

---

### Task 2: `runScenarioCalculation` uses scenario settings

**Files:**
- Modify: `src/services/scenarioEngine.js`
- Create: `src/services/scenarioEngine.test.js`

**Interfaces:**
- Consumes: `runInference`, `normalizeScenarioSettings` from `'mm-modules'`.
- Produces: `runScenarioCalculation({ model, scenario }): Promise<{ results: { id, name, influence }[] }>`. The `squashFunction` argument is removed. Settings come from `normalizeScenarioSettings(scenario.settings)`. Clamps are `{ id, value }` for each scenario concept whose `influence` parses to a non-zero number (via the same coercion as `src/utils/scenario.js`), regardless of `selected` (as today).

- [ ] **Step 1: Write failing tests** in `scenarioEngine.test.js`, using a small three-concept model:
  - An empty model (`concepts: []` or missing) resolves to `{ results: [] }`.
  - A scenario with no `settings` resolves to the same `results` as calling `runScenario` from `mm-modules` directly with sigmoid (per concept, `toBeCloseTo(…, 10)`): the upgrade-compatibility guarantee.
  - `settings: { squash: 'hyperbolic tangent' }` matches `runScenario` with `tanh`.
  - `settings: { rule: 'modified kosko' }` gives a different result from the default on a model where the two differ (use a model with a feedback loop and unequal in/out degree), and equals `runInference` called directly with the same clamps and settings.
  - A scenario concept with influence `'0'` is not clamped; one with `'0.5'` (a string, as in `.mmp` files) is, and is absent from `results`.
  - A scenario with `settings: { rule: 'garbage', lambda: 'abc' }` resolves (no throw) with default results.
- [ ] **Step 2: Run** `npm install` then `npx vitest run src/services/scenarioEngine.test.js`. Expected: FAIL on the new behaviors.
- [ ] **Step 3: Rewrite `runScenarioCalculation`** to the signature above. Remove the `SQUASH_FUNCTIONS` map and the `sigm`/`tanh` imports. Keep the function async and its arguments and return JSON-shaped (the file comment about a future server swap stays true).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** (`feat: scenarioEngine runs scenarios with per-scenario settings`).

---

### Task 3: `ScenarioSettings` component and Scenario tab wiring

**Files:**
- Create: `src/components/Scenario/ScenarioSettings.jsx`, `src/components/Scenario/ScenarioSettings.test.jsx`
- Modify: `src/components/Scenario/Scenario.jsx` (remove `SQUASH_FUNCTIONS`, the `squashFunction` state and the `<Select>` at lines ~38-48 and ~137-143; render `<ScenarioSettings>`; effect and `runScenarioCalculation` call use the scenario's settings), `src/components/Scenario/Scenario.test.jsx` (update the mock's call expectations)
- Reuse: `NormalizedNumberInput` (props `min`, `max`, `step`, `onCommit`, `value`; leave `showSlider` off), MUI `ToggleButtonGroup`/`ToggleButton`, `Select`, `MenuItem`.

**Interfaces:**
- Consumes: Task 1's action, Task 2's `runScenarioCalculation({ model, scenario })`, and `normalizeScenarioSettings`, `INFERENCE_RULES`, `SQUASH_FUNCTIONS` from `'mm-modules'`.
- Produces: `ScenarioSettings({ settings, onChange }: { settings: Settings, onChange: (partial: Partial<Settings>) => void })`, a controlled, presentational component (always given normalized settings).

Labels and descriptions (copy for the UI; the builder may tidy wording):
- Rules: `kosko` "Kosko", `modified kosko` "Modified Kosko", `rescaled kosko` "Rescaled Kosko".
- Squash: `sigmoid` "Sigmoid", `hyperbolic tangent` "Hyperbolic Tangent", `bivalent` "Bivalent (0 / 1)", `trivalent` "Trivalent (-1 / 0 / 1)".
- Rule descriptions: Kosko "Each concept is recomputed only from the concepts that point at it." Modified Kosko "Like Kosko, but each concept also keeps its own previous value." Rescaled Kosko "Like Modified Kosko, but states are first rescaled from 0 to 1 onto -1 to +1, so a concept at rest counts as neutral."
- Field labels: "Squash function", "Lambda", "Noise threshold".

- [ ] **Step 1: Write failing tests** in `ScenarioSettings.test.jsx`:
  - Renders three rule buttons; the one matching `settings.rule` has `aria-pressed="true"`; the matching description text is shown and the others are not.
  - Clicking another rule button calls `onChange({ rule: 'modified kosko' })` exactly once; clicking the already-selected rule calls nothing.
  - The squash dropdown lists all four options; choosing one calls `onChange({ squash: 'bivalent' })`.
  - The Lambda input is present for `sigmoid` and `hyperbolic tangent` and absent (not in the document) for `bivalent` and `trivalent`.
  - Committing lambda `'2.5'` calls `onChange({ lambda: 2.5 })`; committing blank, `'0'`, `'11'` or `'abc'` does not call `onChange` and the input shows the stored value again.
  - Committing threshold `'0.15'` calls `onChange({ noiseThreshold: 0.15 })`; `'-1'` or `'2'` does not call `onChange`.
  In `Scenario.test.jsx` (existing store-based tests; follow its setup):
  - With a scenario that has no `settings`, the controls show Kosko, Sigmoid, lambda 1, threshold 0, `runScenarioCalculation` is called with `{ model, scenario }` (no `squashFunction`), and the store's scenario object is `toBe` the original (nothing dispatched on display).
  - Choosing Modified Kosko dispatches `models/setScenarioSettings` with `{ settings: { rule: 'modified kosko' } }` and triggers a recalculation.
  - After selecting a second scenario whose `settings` are `{ rule: 'rescaled kosko', squash: 'trivalent' }`, the controls show those values (and no lambda input).
  - Two rapid changes where the first calculation resolves after the second leave the second's results on screen (use deferred promises in the mock).
- [ ] **Step 2: Run** `npx vitest run src/components/Scenario`. Expected: FAIL.
- [ ] **Step 3: Implement `ScenarioSettings`** as specified: top row the rule toggle with the description under it; second row squash `Select`, lambda and threshold via `NormalizedNumberInput` (`min`/`max`/`step` set to 0.1 to 10 step 0.1, and 0 to 1 step 0.01) that commit only valid values (reject blank, non-finite, and out-of-range, including lambda 0, by not calling `onChange`); lambda omitted for bivalent/trivalent but not cleared; wraps on narrow widths (`flexWrap`). Because `NormalizedNumberInput` clamps to its range on commit, validate in `ScenarioSettings` before calling `onChange` where clamping would hide an invalid entry (blank, and lambda 0).
- [ ] **Step 4: Wire `Scenario.jsx`:** `const settings = useMemo(() => normalizeScenarioSettings(selectedScenario?.settings), [selectedScenario])`; render `<ScenarioSettings settings={settings} onChange={(settings) => dispatch({ type: 'models/setScenarioSettings', payload: { settings } })} />` in the header row in place of the old `<Select>`; call `runScenarioCalculation({ model: selectedModel, scenario: selectedScenario })`; the existing effect already depends on `selectedScenario`, so remove `squashFunction` from its dependency list and keep the `cancelled` guard.
- [ ] **Step 5: Run** `npx vitest run src/components/Scenario` then the full `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** (`feat: scenario settings controls in the Scenario tab`).

---

### Task 4: Docs and manual check

**Files:**
- Modify: `docs/porting-roadmap.md` (scenario row: new options and per-scenario settings), `../BACKLOG.md` (mark this done; add: expose "clamp to exactly 0" in the UI; deduplicate `converge` and `runInference`'s loop; aggregation as the next PyFCM item; report PyFCM's geometric-mean NaN bug upstream), `CLAUDE.md` in this repo and `../CLAUDE.md` (scenario settings are saved on each scenario; the engine now lives behind `runInference`)

- [ ] **Step 1: Update the docs above** (one short paragraph or table-row change each).
- [ ] **Step 2: Manual browser check** with `npm run dev`: open a demo model (`?demo` with a model under `src/models`), open a scenario that predates this change and confirm the controls show the defaults and the numbers match the pre-change app; change the rule and confirm the chart and State Prediction update; set Bivalent and confirm Lambda disappears; reload via Save MMP then load the saved file and confirm the settings come back; switch scenarios and confirm each shows its own. Report what was and was not checked.
- [ ] **Step 3: Legacy check:** open a file saved from the suite with settings in `mentalmodeler-scenario` (see its `CLAUDE.md` for how to run it) and report whether it loads. This is the risk named in the spec; do not change the legacy app, just report.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** (`docs: scenario settings`).
