# Scenario Tab (Pass 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Scenario tab's data layer, clamp table, and prediction score in `mentalmodeler-suite`, porting `mentalmodeler-scenario`'s what-if simulation feature.

**Architecture:** Scenario overrides are stored sparsely (only touched concepts) in Redux, merged with live model concepts at read time — no sync bookkeeping. All computation funnels through one async `runScenarioCalculation` seam so a future server-side swap touches one function. Math itself (`mm-modules.runScenario`) already exists.

**Tech Stack:** React, Redux Toolkit (raw `{type, payload}` dispatch — this slice doesn't export action creators), MUI, `mm-modules` (linked via `file:../mm-modules`).

**Spec:** `docs/scenario-implementation-plan.md` (this plan implements that design; read both).

## Global Constraints

- No test runner exists in either repo (`mentalmodeler-suite` or `mm-modules`) — every "test" step below is either a `node --input-type=module -e "..."` one-liner (for pure functions/reducers) or a manual browser check via the dev server. Do not invent `npm test`/`jest`/`vitest` commands; they don't exist here.
- `mm-modules` and `mentalmodeler-suite` are separate git repos (siblings, linked via `file:../mm-modules`) — changes to each get their own commit, in their own repo.
- Scenario overrides (`scenario.concepts`) are a **sparse list**: only entries for concepts a user has touched. Untouched concepts default to `{selected: true, influence: 0}` at read time via `getScenarioOverride`. Never write a "sync all concepts into the scenario" step.
- All scenario math goes through `runScenarioCalculation({model, scenario, squashFunction})` (async, returns `Promise<{results}>`). No component or helper calls `mm-modules.runScenario` directly except this one function.
- `squashFunction` is always a string (`'sigmoid'` or `'hyperbolic tangent'`) at every boundary crossing this task touches — never a function reference — except inside `scenarioEngine.js` itself, where it's resolved to `mm-modules`' `sigm`/`tanh`.
- Dispatch raw `{ type: 'models/<name>', payload }` objects, matching every existing call site in this codebase (`modelsSlice.js`'s action-creator export line is commented out intentionally — don't un-comment it or import action creators).
- Uncontrolled inputs (`defaultValue` + `onBlur`), not controlled (`value` + `onChange`), for free-text/number fields — matches `Info.jsx` and `Matrix.jsx`. Use a `key` prop to force a remount when the underlying value can change from outside that input (e.g. switching scenarios), exactly as `Info.jsx` does with `key={appId}`.

## Review Focus

- A concept with no scenario override at all (the common case — most concepts are never touched) must default to `selected: true, influence: 0`, not throw or render `undefined`.
- Deleting a model concept that has an existing scenario override must not crash anything — the orphaned override just stops being visited (nothing iterates `scenario.concepts` directly; everything iterates `model.concepts` and looks up an override by id).
- A scenario with zero scoreable concepts (nothing selected/unclamped/preferred-state-set) must show a blank prediction score, not `NaN%` or a divide-by-zero crash.
- Switching the squash-function dropdown must re-run the computation and update results — not show stale numbers from the previous function.
- Switching between scenarios (or models) must show that scenario's own clamp values, never a previous scenario's — the same class of bug as the Info tab's model-switch isolation (verified earlier in this port).

---

### Task 1: Export `sigm`/`tanh` from mm-modules' public API

**Repo:** `mm-modules`

**Files:**
- Modify: `index.js`
- Modify: `CLAUDE.md`

**Interfaces:**
- Produces: `sigm(x)` and `tanh(x)` (re-exported from `mathjs`'s `tanh`, both already implemented in `src/scenario.js`), now importable as `import { sigm, tanh } from 'mm-modules'`.

- [ ] **Step 1: Confirm the gap**

Run: `grep -n "sigm\|tanh" /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mm-modules/index.js`
Expected: no output — `index.js` doesn't import or export `sigm`/`tanh` yet, even though `src/scenario.js` already exports both.

- [ ] **Step 2: Add the exports**

In `/Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mm-modules/index.js`, change:

```js
import {runScenario} from './src/scenario';
```

to:

```js
import {runScenario, sigm, tanh} from './src/scenario';
```

and change the final `export { ... }` block from:

```js
export {
    compareModels,
    loadFile, 
    loadURL, 
    loadAndParse, 
    loadAndParseURL, 
    makeId, 
    parseMMP,
    runScenario,
    getMetrics,
    getConceptsWithMetrics,
    importCSV,
};
```

to:

```js
export {
    compareModels,
    loadFile, 
    loadURL, 
    loadAndParse, 
    loadAndParseURL, 
    makeId, 
    parseMMP,
    runScenario,
    sigm,
    tanh,
    getMetrics,
    getConceptsWithMetrics,
    importCSV,
};
```

- [ ] **Step 3: Verify the exports resolve**

Run:
```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mm-modules && node --input-type=module -e "
import { sigm, tanh } from './index.js';
console.log('sigm(0):', sigm(0));
console.log('typeof tanh:', typeof tanh);
"
```
Expected: `sigm(0): 0.5` and `typeof tanh: function` (no import errors).

- [ ] **Step 4: Update CLAUDE.md**

In `/Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mm-modules/CLAUDE.md`, find this exact text (the `scenario.js` bullet under "Module responsibilities (src/)"):

```
- **scenario.js** — `runScenario`: simulates an FCM by iterating `weightMatrix × stateVector`
  to convergence (`converge`, epsilon-based fixed point) with a squashing function (`sigm` or
  `tanh`), once at baseline and once with scenario concepts clamped to fixed influence values.
  Returns the delta per concept between the clamped and baseline steady states, excluding
  concepts that were themselves clamped as scenario inputs.
```

Replace it with:

```
- **scenario.js** — `runScenario`: simulates an FCM by iterating `weightMatrix × stateVector`
  to convergence (`converge`, epsilon-based fixed point) with a squashing function (`sigm` or
  `tanh`), once at baseline and once with scenario concepts clamped to fixed influence values.
  Returns the delta per concept between the clamped and baseline steady states, excluding
  concepts that were themselves clamped as scenario inputs. `sigm` and `tanh` (the two squashing
  functions `runScenario` accepts as its `clampFn` argument) are also exported directly from
  `index.js`, for consumers that need to let a user pick between them by name.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mm-modules
git add index.js CLAUDE.md
git commit -m "Export sigm/tanh squash functions from public API

Needed by mentalmodeler-suite's Scenario tab, which lets a user pick
the squash function by name."
```

---

### Task 2: Scenario-override and prediction-score helpers

**Repo:** `mentalmodeler-suite`

**Files:**
- Create: `src/utils/scenario.js`

**Interfaces:**
- Consumes: nothing new (plain JS, no imports from other new files in this plan).
- Produces:
  - `DEFAULT_SCENARIO_OVERRIDE` — `{ selected: true, influence: 0 }`
  - `getScenarioOverride(scenario, conceptId)` — `(scenario: {concepts: Array<{id, selected, influence}>} | null | undefined, conceptId: string) => {selected: boolean, influence: number}`
  - `getPredictionScore(concepts, scenario, results)` — `(concepts: Array<{id, preferredState}>, scenario: {concepts} | null, results: Array<{id, influence}>) => number` (returns `NaN` when there's nothing to score)

- [ ] **Step 1: Write the file**

Create `src/utils/scenario.js`:

```js
export const DEFAULT_SCENARIO_OVERRIDE = { selected: true, influence: 0 };

export const getScenarioOverride = (scenario, conceptId) => {
    const override = (scenario?.concepts || []).find(({ id }) => id === conceptId);
    return { ...DEFAULT_SCENARIO_OVERRIDE, ...override };
};

export const getPredictionScore = (concepts, scenario, results) => {
    const resultById = new Map((results || []).map(({ id, influence }) => [id, influence]));

    const scoreable = (concepts || []).filter((concept) => {
        const { selected, influence } = getScenarioOverride(scenario, concept.id);
        const preferredState = parseFloat(concept.preferredState || 0);
        return selected && !influence && preferredState !== 0;
    });

    if (scoreable.length === 0) {
        return NaN;
    }

    const correct = scoreable.filter((concept) => {
        const preferredState = parseFloat(concept.preferredState || 0);
        const actualState = resultById.get(concept.id) || 0;
        return (preferredState > 0 && actualState > 0) || (preferredState < 0 && actualState < 0);
    });

    return Math.round(((100 * correct.length) / scoreable.length) * 100) / 100;
};
```

- [ ] **Step 2: Verify `getScenarioOverride` defaults correctly for an untouched concept**

Run:
```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && node --input-type=module -e "
import { getScenarioOverride } from './src/utils/scenario.js';
console.log(getScenarioOverride({ concepts: [] }, 'c1'));
console.log(getScenarioOverride(null, 'c1'));
console.log(getScenarioOverride({ concepts: [{ id: 'c1', selected: false, influence: 0.5 }] }, 'c1'));
"
```
Expected: first two lines print `{ selected: true, influence: 0 }`; third prints `{ selected: false, influence: 0.5 }`.

- [ ] **Step 3: Verify `getPredictionScore` on a known case, including the zero-scoreable edge case**

Run:
```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && node --input-type=module -e "
import { getPredictionScore } from './src/utils/scenario.js';

const concepts = [
    { id: 'a', preferredState: 1 },  // correctly predicted (actual 0.5 > 0)
    { id: 'b', preferredState: -1 }, // incorrectly predicted (actual 0.2 > 0, wanted negative)
    { id: 'c', preferredState: 0 },  // excluded: no preferred state
];
const scenario = { concepts: [] }; // nothing clamped, everything selected by default
const results = [
    { id: 'a', influence: 0.5 },
    { id: 'b', influence: 0.2 },
    { id: 'c', influence: 0.9 },
];

console.log('expect 50:', getPredictionScore(concepts, scenario, results));
console.log('expect NaN (nothing scoreable):', getPredictionScore([{ id: 'x', preferredState: 0 }], scenario, []));
"
```
Expected: `expect 50: 50` and `expect NaN (nothing scoreable): NaN`.

- [ ] **Step 4: Commit**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite
git add src/utils/scenario.js
git commit -m "Add scenario-override and prediction-score helpers

Pure functions: getScenarioOverride merges a sparse override with
defaults for untouched concepts; getPredictionScore replicates
mentalmodeler-scenario's prediction formula."
```

---

### Task 3: Scenario reducers (`addScenario`, `updateScenarioName`, `setScenarioConceptOverride`)

**Repo:** `mentalmodeler-suite`

**Files:**
- Modify: `src/redux/slices/modelsSlice.js`

**Interfaces:**
- Consumes: `makeScenarioId`, `parseScenarioId` (already imported in this file from `../../utils/utils`).
- Produces: three new dispatchable actions:
  - `{ type: 'models/addScenario', payload: { name: string } }` — appends a new scenario, auto-selects it.
  - `{ type: 'models/updateScenarioName', payload: { name: string } }` — renames the currently-selected scenario.
  - `{ type: 'models/setScenarioConceptOverride', payload: { conceptId: string, selected: boolean, influence: number } }` — upserts a full override entry for one concept on the currently-selected scenario. Callers always pass both `selected` and `influence` (merge the current displayed value with the one field being changed before dispatching — see Task 6).

- [ ] **Step 1: Add the three reducers**

In `/Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite/src/redux/slices/modelsSlice.js`, insert after the `removeSelected(state) { ... },` block (immediately before the closing `},` of the `reducers` object, i.e. right before the line `},\n});`):

```js
        addScenario(state, action) {
            const { name } = action.payload;
            const scenarios = [...state.selectedModel.scenarios, { name, concepts: [] }];
            const model = { ...state.selectedModel, scenarios };
            const index = scenarios.length - 1;

            state.selectedModel = model;
            state.models = updateModels(state.models, model);
            state.selectedScenarioId = makeScenarioId(model.appId, name, index);
            state.selectedScenario = scenarios[index];
        },
        updateScenarioName(state, action) {
            const { name } = action.payload;
            const { index } = parseScenarioId(state.selectedScenarioId);
            const scenarioIndex = Number(index);
            const scenarios = state.selectedModel.scenarios.map((scenario, i) =>
                i === scenarioIndex ? { ...scenario, name } : scenario
            );
            const model = { ...state.selectedModel, scenarios };

            state.selectedModel = model;
            state.models = updateModels(state.models, model);
            state.selectedScenario = scenarios[scenarioIndex];
        },
        setScenarioConceptOverride(state, action) {
            const { conceptId, selected, influence } = action.payload;
            const { index } = parseScenarioId(state.selectedScenarioId);
            const scenarioIndex = Number(index);
            const scenarios = state.selectedModel.scenarios.map((scenario, i) => {
                if (i !== scenarioIndex) {
                    return scenario;
                }
                const exists = scenario.concepts.some(({ id }) => id === conceptId);
                const concepts = exists
                    ? scenario.concepts.map((c) => (c.id === conceptId ? { id: conceptId, selected, influence } : c))
                    : [...scenario.concepts, { id: conceptId, selected, influence }];
                return { ...scenario, concepts };
            });
            const model = { ...state.selectedModel, scenarios };

            state.selectedModel = model;
            state.models = updateModels(state.models, model);
            state.selectedScenario = scenarios[scenarioIndex];
        },
```

- [ ] **Step 2: Verify `addScenario` against the slice's default export**

The default export of this file is a plain reducer function `(state, action) => newState`, callable directly without a store. Run:

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && node --input-type=module -e "
import reducer from './src/redux/slices/modelsSlice.js';

const state = reducer(undefined, { type: '@@INIT' });
const afterAdd = reducer(state, { type: 'models/addScenario', payload: { name: 'New Scenario' } });

console.log('scenario count:', afterAdd.selectedModel.scenarios.length, '(expect 2)');
console.log('selected is the new one:', afterAdd.selectedScenario.name === 'New Scenario');
console.log('selectedScenarioId set:', afterAdd.selectedScenarioId.length > 0);
"
```
Expected: `scenario count: 2 (expect 2)`, `selected is the new one: true`, `selectedScenarioId set: true`.

- [ ] **Step 3: Verify `updateScenarioName` and `setScenarioConceptOverride`**

Run:
```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && node --input-type=module -e "
import reducer from './src/redux/slices/modelsSlice.js';

let state = reducer(undefined, { type: '@@INIT' });
state = reducer(state, { type: 'models/updateScenarioName', payload: { name: 'Renamed' } });
console.log('renamed:', state.selectedScenario.name === 'Renamed' && state.selectedModel.scenarios[0].name === 'Renamed');

state = reducer(state, {
    type: 'models/setScenarioConceptOverride',
    payload: { conceptId: 'c1', selected: false, influence: 0.75 },
});
console.log('override added:', JSON.stringify(state.selectedScenario.concepts));

state = reducer(state, {
    type: 'models/setScenarioConceptOverride',
    payload: { conceptId: 'c1', selected: false, influence: -0.2 },
});
console.log('override updated (not duplicated):', JSON.stringify(state.selectedScenario.concepts));
"
```
Expected: `renamed: true`; first override log shows one entry `{\"id\":\"c1\",\"selected\":false,\"influence\":0.75}`; second shows still exactly one entry, now with `influence` `-0.2` (confirms upsert, not append-duplicate).

- [ ] **Step 4: Commit**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite
git add src/redux/slices/modelsSlice.js
git commit -m "Add addScenario, updateScenarioName, setScenarioConceptOverride reducers

setScenarioConceptOverride upserts a full {id, selected, influence}
entry into the active scenario's sparse concepts list - callers merge
the current value with the one changed field before dispatching."
```

---

### Task 4: Scenario compute engine (the forward-looking seam)

**Repo:** `mentalmodeler-suite`

**Files:**
- Create: `src/services/scenarioEngine.js`

**Interfaces:**
- Consumes: `runScenario`, `sigm`, `tanh` from `mm-modules` (Task 1 makes `sigm`/`tanh` available).
- Produces: `runScenarioCalculation({ model, scenario, squashFunction })` — `async (request) => Promise<{ results: Array<{id, name, influence}> }>`. `model` is `{concepts: [...]}` (a full model, e.g. Redux's `selectedModel`); `scenario` is `{concepts: [...]}` (sparse overrides, e.g. Redux's `selectedScenario`); `squashFunction` is `'sigmoid' | 'hyperbolic tangent'`. This is the **only** place in the app that imports `runScenario` from `mm-modules`.

- [ ] **Step 1: Write the file**

Create `src/services/scenarioEngine.js`:

```js
import { runScenario, sigm, tanh } from 'mm-modules';

const SQUASH_FUNCTIONS = {
    sigmoid: sigm,
    'hyperbolic tangent': tanh,
};

// The only call site for mm-modules' runScenario. Kept async and
// JSON-shaped (squashFunction as a string, not a function reference) so a
// future swap to a server-computed scenario only touches this function.
export const runScenarioCalculation = async ({ model, scenario, squashFunction }) => {
    const clampFn = SQUASH_FUNCTIONS[squashFunction] || sigm;
    const scenarioConcepts = model.concepts.map((concept) => {
        const override = (scenario.concepts || []).find(({ id }) => id === concept.id);
        return { name: concept.name, influence: override ? override.influence : 0 };
    });

    const results = runScenario(model, { concepts: scenarioConcepts }, clampFn);

    return { results };
};
```

- [ ] **Step 2: Verify against a small cyclic model (same shape used earlier in this port for importCSV)**

Run:
```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && node --input-type=module -e "
import { runScenarioCalculation } from './src/services/scenarioEngine.js';

const model = {
    concepts: [
        { id: 'a', name: 'Rainfall', relationships: [{ id: 'b', influence: 0.5 }] },
        { id: 'b', name: 'Crop Yield', relationships: [{ id: 'c', influence: 0.8 }] },
        { id: 'c', name: 'Farmer Income', relationships: [{ id: 'a', influence: -0.3 }] },
    ],
};
const scenario = { concepts: [{ id: 'a', selected: true, influence: 1 }] }; // clamp Rainfall high

const { results } = await runScenarioCalculation({ model, scenario, squashFunction: 'sigmoid' });
console.log('results:', JSON.stringify(results));
console.log('clamped concept excluded:', !results.some((r) => r.id === 'a'));
console.log('unclamped concepts present:', results.some((r) => r.id === 'b') && results.some((r) => r.id === 'c'));
"
```
Expected: `results` is an array of 2 entries (`b` and `c`, each `{id, name, influence}`); `clamped concept excluded: true`; `unclamped concepts present: true`. No thrown errors.

- [ ] **Step 3: Verify the squash-function string maps correctly (different functions, different results)**

Run:
```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && node --input-type=module -e "
import { runScenarioCalculation } from './src/services/scenarioEngine.js';

const model = {
    concepts: [
        { id: 'a', name: 'A', relationships: [{ id: 'b', influence: 0.5 }] },
        { id: 'b', name: 'B', relationships: [] },
    ],
};
const scenario = { concepts: [{ id: 'a', selected: true, influence: 1 }] };

const sigmoidResult = await runScenarioCalculation({ model, scenario, squashFunction: 'sigmoid' });
const tanhResult = await runScenarioCalculation({ model, scenario, squashFunction: 'hyperbolic tangent' });

console.log('sigmoid b:', sigmoidResult.results.find((r) => r.id === 'b').influence);
console.log('tanh b:', tanhResult.results.find((r) => r.id === 'b').influence);
console.log('different results for different squash functions:', sigmoidResult.results[0].influence !== tanhResult.results[0].influence);
"
```
Expected: `different results for different squash functions: true` (the two squashing functions converge to different steady states for the same clamp, confirming the string is actually being resolved to the right function rather than always falling back to the sigmoid default).

- [ ] **Step 4: Commit**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite
git add src/services/scenarioEngine.js
git commit -m "Add runScenarioCalculation compute-boundary seam

Async wrapper around mm-modules.runScenario, JSON-shaped request/
response (squashFunction as a string) so a future server-side swap
touches only this function's body."
```

---

### Task 5: Wire Add Scenario

**Repo:** `mentalmodeler-suite`

**Files:**
- Modify: `src/components/Files/Files.jsx:117-129`

**Interfaces:**
- Consumes: `models/addScenario` action (Task 3).

- [ ] **Step 1: Replace the stub**

In `/Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite/src/components/Files/Files.jsx`, find:

```jsx
                                <Button
                                    size="small"
                                    variant="scenario-add"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        alert('Coming soon: Add a scenario');
                                    }}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    Add
                                </Button>
```

Replace with:

```jsx
                                <Button
                                    size="small"
                                    variant="scenario-add"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(saveModelFromConceptMap(view));
                                        dispatch({
                                            type: 'models/addScenario',
                                            payload: { name: 'New Scenario' },
                                        });
                                        dispatch({
                                            type: 'app/setField',
                                            payload: { field: 'view', value: APP_VIEW.SCENARIO },
                                        });
                                    }}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    Add
                                </Button>
```

This only works if this specific `Add` button's `onClick` is for the model identified by the surrounding `.map(({ filename, scenarios = [], appId }, i) => { ... })` closure — confirm the button is inside that same closure (it is, per the file read during planning) so `appId` isn't needed explicitly: `addScenario` always targets `state.selectedModel`, so clicking "Add" when a *different* model's row isn't selected would add the scenario to the wrong model. Fix this by first dispatching `models/selectModel` for this row's `appId` if it isn't already selected — add this one line before the `addScenario` dispatch:

```jsx
                                        if (appId !== selectedId) {
                                            dispatch({ type: 'models/selectModel', payload: { value: appId } });
                                        }
```

- [ ] **Step 2: Add the needed imports and selector**

At the top of the same file, confirm/add:

```jsx
import { APP_VIEW } from '../../redux/slices/appSlice';
import { saveModelFromConceptMap } from '../../redux/actions/models';
```

(`APP_VIEW` and `saveModelFromConceptMap` are not currently imported in `Files.jsx` — check with `grep -n "^import" src/components/Files/Files.jsx` before adding, to avoid a duplicate import if either is already there.)

Inside the `Files` component, confirm `selectedId` is already destructured from the `state.models` selector (it is: `const { models, selectedId, selectedScenarioId } = useSelector((state) => state.models) || {};`) — no change needed there.

- [ ] **Step 3: Manual verification**

Run: `cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && npm run dev`

In the browser:
1. Open `http://localhost:8081/` (or whatever port the dev server reports).
2. Click "Add" under Scenarios in the sidebar.
3. Confirm a new "Scenario" entry appears in the tree, the app switches to the Scenario tab, and the new scenario is highlighted as selected.
4. Add a second model (New button), then click that second model's own "Add" scenario button — confirm the new scenario lands on the *second* model's scenario list, not the first model's (this is the row-targeting fix from Step 1).

Stop the dev server (`pkill -f vite` or Ctrl-C) when done.

- [ ] **Step 4: Lint**

Run: `cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && npx eslint src/components/Files/Files.jsx --max-warnings 0`
Expected: no output (clean).

- [ ] **Step 5: Commit**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite
git add src/components/Files/Files.jsx
git commit -m "Wire Add Scenario to models/addScenario

Also selects the target model first if a different model's row is
clicked, so Add always lands on the scenario list it visually belongs
to rather than always the currently-selected model."
```

---

### Task 6: Scenario tab component

**Repo:** `mentalmodeler-suite`

**Files:**
- Create: `src/components/Scenario/Scenario.jsx`
- Modify: `src/components/Content/Content.jsx`

**Interfaces:**
- Consumes: `getScenarioOverride`, `getPredictionScore` (Task 2); `models/updateScenarioName`, `models/setScenarioConceptOverride` actions (Task 3); `runScenarioCalculation` (Task 4); `evenRowCellStyle`/`oddRowCellStyle`/`topHeaderCellStyle` (`src/constants/styles.js`, already exists, used by `Matrix.jsx`/`Metrics.jsx`).
- Produces: `<Scenario />` component, rendered by `Content.jsx` when `view === APP_VIEW.SCENARIO`.

- [ ] **Step 1: Write the component**

Create `src/components/Scenario/Scenario.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Checkbox,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { evenRowCellStyle, oddRowCellStyle, topHeaderCellStyle } from '../../constants/styles';
import { getPredictionScore, getScenarioOverride } from '../../utils/scenario';
import { runScenarioCalculation } from '../../services/scenarioEngine';

const SQUASH_FUNCTIONS = [
    { value: 'sigmoid', label: 'Sigmoid' },
    { value: 'hyperbolic tangent', label: 'Hyperbolic Tangent' },
];

export const Scenario = () => {
    const dispatch = useDispatch();
    const { selectedModel, selectedScenario, selectedScenarioId } = useSelector((state) => state.models) || {};
    const { concepts = [] } = selectedModel || {};
    const [squashFunction, setSquashFunction] = useState('sigmoid');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedScenario) {
            setResults([]);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        runScenarioCalculation({ model: selectedModel, scenario: selectedScenario, squashFunction }).then(
            ({ results: newResults }) => {
                if (!cancelled) {
                    setResults(newResults);
                    setLoading(false);
                }
            }
        );
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [concepts, selectedScenario, squashFunction]);

    const resultById = useMemo(() => new Map(results.map(({ id, influence }) => [id, influence])), [results]);

    const prediction = useMemo(
        () => getPredictionScore(concepts, selectedScenario, results),
        [concepts, selectedScenario, results]
    );

    const onNameChange = (e) => {
        dispatch({ type: 'models/updateScenarioName', payload: { name: e.target.value } });
    };

    const onOverrideChange = (conceptId, field, value) => {
        const current = getScenarioOverride(selectedScenario, conceptId);
        dispatch({
            type: 'models/setScenarioConceptOverride',
            payload: { conceptId, ...current, [field]: value },
        });
    };

    if (!selectedScenario) {
        return (
            <Box sx={{ padding: 2 }}>
                <Typography variant="body2">Select a scenario from the sidebar to get started.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 2, height: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    key={selectedScenarioId}
                    label="Scenario name"
                    placeholder="Scenario Name"
                    defaultValue={selectedScenario.name === 'New Scenario' ? '' : selectedScenario.name}
                    onBlur={onNameChange}
                    sx={{ minWidth: 240 }}
                />
                <Select size="small" value={squashFunction} onChange={(e) => setSquashFunction(e.target.value)}>
                    {SQUASH_FUNCTIONS.map(({ value, label }) => (
                        <MenuItem key={value} value={value}>
                            {label}
                        </MenuItem>
                    ))}
                </Select>
                <Typography variant="body2">
                    State Prediction: {loading ? '…' : Number.isNaN(prediction) ? '' : `${prediction}%`}
                </Typography>
            </Box>
            <TableContainer sx={{ overflow: 'auto', flex: 1 }}>
                <Table size="small" stickyHeader aria-label="Scenario concept table">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={topHeaderCellStyle} />
                            <TableCell sx={topHeaderCellStyle}>Component</TableCell>
                            <TableCell sx={topHeaderCellStyle}>+/-</TableCell>
                            <TableCell sx={topHeaderCellStyle}>Preferred State</TableCell>
                            <TableCell sx={topHeaderCellStyle}>Actual State</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {concepts.map((concept, i) => {
                            const cellStyle = i % 2 === 0 ? oddRowCellStyle : evenRowCellStyle;
                            const { selected, influence } = getScenarioOverride(selectedScenario, concept.id);
                            const isClamped = !!influence;
                            const preferredState = parseFloat(concept.preferredState || 0);
                            const actualState = resultById.get(concept.id) || 0;
                            return (
                                <TableRow key={concept.id}>
                                    <TableCell sx={cellStyle}>
                                        <Checkbox
                                            checked={selected}
                                            size="small"
                                            onChange={(e) => onOverrideChange(concept.id, 'selected', e.target.checked)}
                                        />
                                    </TableCell>
                                    <TableCell sx={cellStyle}>{concept.name}</TableCell>
                                    <TableCell sx={cellStyle}>
                                        <Box
                                            component="input"
                                            type="number"
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                            defaultValue={influence || ''}
                                            onBlur={(e) =>
                                                onOverrideChange(
                                                    concept.id,
                                                    'influence',
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            sx={{ width: '100%' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={cellStyle}>
                                        {!isClamped && preferredState !== 0
                                            ? preferredState > 0
                                                ? 'Increase'
                                                : 'Decrease'
                                            : ''}
                                    </TableCell>
                                    <TableCell sx={cellStyle}>
                                        {!isClamped && actualState !== 0
                                            ? actualState > 0
                                                ? 'Increase'
                                                : 'Decrease'
                                            : ''}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
```

- [ ] **Step 2: Wire into Content.jsx**

In `/Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite/src/components/Content/Content.jsx`, add the import:

```jsx
import { Scenario } from '../Scenario/Scenario';
```

and add the render line alongside the others:

```jsx
                {view === APP_VIEW.SCENARIO && <Scenario />}
```

(full file after this change:)

```jsx
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { APP_VIEW } from '../../redux/slices/appSlice';
import { ConceptMap } from '../ConceptMap/ConceptMap';
import { Matrix } from '../Matrix/Matrix';
import { Info } from '../Info/Info';
import { Metrics } from '../Metrics/Metrics';
import { Scenario } from '../Scenario/Scenario';

export const Content = () => {
    const { view } = useSelector((state) => state.app) || {};
    return (
        <Box
            sx={{
                gridArea: 'content',
                paddingInlineEnd: 2,
                paddingBlockEnd: 2,
                overflow: 'auto',
            }}
        >
            <Box sx={{ backgroundColor: 'common.white', height: '100%', overflow: 'auto' }}>
                {view === APP_VIEW.MODEL && <ConceptMap />}
                {view === APP_VIEW.MATRIX && <Matrix />}
                {view === APP_VIEW.INFO && <Info />}
                {view === APP_VIEW.METRICS && <Metrics />}
                {view === APP_VIEW.SCENARIO && <Scenario />}
            </Box>
        </Box>
    );
};
```

- [ ] **Step 3: Lint**

Run: `cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && npx eslint src/components/Scenario/Scenario.jsx src/components/Content/Content.jsx --max-warnings 0`
Expected: no output (clean).

- [ ] **Step 4: Manual verification — core flow**

Run: `cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite && npm run dev`, then in the browser load a model with a feedback loop, e.g. `http://localhost:8081/?init` (loads the `fire_model` sample).

1. Go to the **Preferred State & Metrics** tab, set Preferred State to "Increase" on 2-3 concepts (needed for the prediction score to have anything to score).
2. Go to the **Scenario** tab. Confirm the table lists every model concept, all unchecked boxes default to checked, all clamp inputs are blank.
3. Set a clamp value (e.g. `1`) on one concept's `+/-` input and blur. Confirm: that row's Preferred State and Actual State columns go blank (it's now an input, not an output); at least one *other* concept's Actual State column populates with "Increase"/"Decrease".
4. Confirm "State Prediction" shows a `NN%` value (not blank, not `NaN%`), given step 1 set some preferred states.
5. Switch the squash-function dropdown to "Hyperbolic Tangent". Confirm the Actual State values in the table change (re-computation happened).
6. Uncheck a concept's selected checkbox. Confirm the prediction score recalculates (fewer concepts counted).

- [ ] **Step 5: Manual verification — Review Focus items**

Still in the browser:

1. **Scenario isolation** (Review Focus item 5): with one clamp value set on the current scenario, click "Add" to create a second scenario. Confirm the new scenario's table shows all-default (unclamped) values, not the first scenario's clamp. Switch back to the first scenario via the sidebar tree and confirm its clamp value is still there.
2. **Orphaned override doesn't crash** (Review Focus item 2): clamp a concept, then go to the Model tab and delete that same concept from the canvas (select it, delete). Switch back to the Scenario tab. Confirm the tab renders without a crash (the deleted concept's row is simply gone; no console error).
3. **Zero-scoreable blank score** (Review Focus item 3): on a scenario where no concept has a `preferredState` set, confirm "State Prediction" shows nothing after the colon (not `NaN%`).

- [ ] **Step 6: Commit**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite
git add src/components/Scenario/Scenario.jsx src/components/Content/Content.jsx
git commit -m "Add Scenario tab: clamp table, prediction score, squash selector

Wires runScenarioCalculation + the scenario reducers/helpers from
earlier tasks into a working Scenario tab. Recomputes automatically
via useEffect on concept/override/squash-function change, replacing
mentalmodeler-scenario's manual Refresh button + debounce (a
Backbone-era workaround not needed with React's reactivity)."
```

---

## After this plan

Update `docs/porting-roadmap.md` row 7 (Scenario tab) status from "In progress" to "Done", with a note that this covers Pass 1 only (data model, clamp table, prediction score, Add Scenario) — the bar-chart visualization (legacy's `views/scenarioGraph.js`) is Pass 2, tracked separately, to be picked up with the `dataviz` skill.
