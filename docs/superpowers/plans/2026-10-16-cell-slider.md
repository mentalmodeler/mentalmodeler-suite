# Cell Slider for Matrix and Scenario Inputs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the old `mentalmodeler-scenario` slider to the matrix and scenario cells: a visual, mouse/touch-only accelerator that appears under a cell when it is clicked, with the text input remaining the accessible control.

**Architecture:** Both cells already render the shared `NormalizedNumberInput`, so the slider lives there behind an opt-in `showSlider` prop (default `false`; matrix and scenario opt in). The slider is an MUI `Slider` in a `Popper` anchored to the cell. It updates the text live while dragging and commits once on release, like the old app. As part of this, `NormalizedNumberInput` stops committing on blur when nothing changed.

**Tech Stack:** React 18, MUI 5.16 (`Slider`, `Popper`, `ClickAwayListener`, `@mui/icons-material`), Redux Toolkit, Vitest 0.34 + jsdom + `@testing-library/react` (no `user-event`, no `jest-dom`: use `fireEvent` and plain assertions).

**Spec:** None. Behavior is taken from the old app (`../mentalmodeler-scenario/scripts/views/grid.js`, `scenario.js`, `templates/grid.html`, `scenario.html`) and agreed in conversation.

## Decisions (agreed with the user)

- The slider is a mouse/touch accelerator only. It is `aria-hidden`, not focusable by tab (`tabIndex={-1}`), and is not announced. The text input stays the accessible control, and keyboard users type or use the arrow keys as today.
- It opens on **mouse down** in the cell (input or chevron), never on focus. It closes on a mouse down outside the cell, and on Escape.
- It commits **once on release**, not while dragging. The text box tracks the drag live. In the scenario, each commit already triggers a recalculation through the existing `useEffect` in `Scenario.jsx`, so no debounce is needed (the old app's 500 ms debounce is not ported).
- Range -1 to 1, step 0.01, same as the text input and the old slider.
- **Setting a value to 0, or clearing a cell, never removes a relationship.** Only editing in the concept map removes one. An explicit delete control in the matrix is a separate, later feature (see Backlog). `updateInfluence` in `modelsSlice.js` is not changed by this plan.
- A slider release that ends where the cell already was (a click on the thumb without moving it) commits nothing. In particular it must not create a 0-influence relationship in an empty matrix cell.

## Global Constraints

- Prettier: 4 spaces, single quotes, trailing commas, 120 columns (`npm run lint` uses `--max-warnings 0`; the repo already has unrelated lint failures, so check only the files you touch with `npx eslint <files>`).
- Do not modify `mentalmodeler-js`, `mm-modules`, or `mentalmodeler-scenario`.
- Do not change `src/redux/slices/modelsSlice.js` or the shape of any dispatched action.
- `NormalizedNumberInput` with `showSlider` unset must render exactly the bare `<input>` it renders today (no wrapper element), so any other use is unaffected.
- Work on a new branch off `main`; do not commit to `main`. Do not push or merge.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Tabbing through matrix cells (focus then blur with no edit) must not write anything to the model. [Task 1]
2. Clicking the slider thumb without moving it must not create a relationship in a blank cell. [Task 2, Task 3]
3. Clicking the slider must not lose a half-typed value or leave a stale draft after the commit. [Task 2]
4. Only one slider is open at a time; opening one cell closes the previous. [Task 2]
5. The slider must not add a tab stop or be announced by screen readers. [Task 2]

## Tasks

### Task 1: Commit on blur only when the value changed

Today `NormalizedNumberInput`'s `onBlur` calls `onCommit` unconditionally. For matrix cells this rewrites an unchanged influence (and, for a connection stored with an empty influence that the matrix shows as `0`, rewrites `''` as `0`) just by tabbing through. The slider also needs the "did it change" check, so it goes in first.

**Files:**
- Modify: `src/components/NormalizedNumberInput/NormalizedNumberInput.jsx`
- Create: `src/components/NormalizedNumberInput/NormalizedNumberInput.test.jsx`

**Interfaces:**
- Consumes: `normalize(value, min, max)` from `src/utils/utils`.
- Produces: `NormalizedNumberInput` with the same props as today. `onCommit(committed)` now fires only when `committed` differs from the value the cell currently holds. The draft still snaps to the clamped value on blur either way.

- [ ] **Step 1: Branch**

```bash
cd /Users/jonathan/Workspace/jonathanelbom/mentalmodeler/mentalmodeler-suite
git status -sb   # expect a clean tree on main
git checkout -b cell-slider
```

- [ ] **Step 2: Write the failing tests: `src/components/NormalizedNumberInput/NormalizedNumberInput.test.jsx`**

```jsx
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NormalizedNumberInput } from './NormalizedNumberInput';

const setup = (props) => {
    const onCommit = vi.fn();
    render(<NormalizedNumberInput onCommit={onCommit} {...props} />);
    return { onCommit, input: document.querySelector('input[type="number"]') };
};

describe('NormalizedNumberInput commit-on-blur', () => {
    it('does not commit when focus leaves a cell that was not edited', () => {
        const { onCommit, input } = setup({ value: 0.34 });
        fireEvent.focus(input);
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('does not commit when a blank cell is left blank', () => {
        const { onCommit, input } = setup({ value: '', emptyValue: '' });
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('does not commit a string value that equals the current number', () => {
        // .mmp influences are strings: "0.5" is the same value as 0.5
        const { onCommit, input } = setup({ value: '0.5' });
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('commits a changed value, clamped', () => {
        const { onCommit, input } = setup({ value: 0.2 });
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.blur(input);
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(onCommit).toHaveBeenCalledWith(1);
    });

    it('still snaps an out-of-range draft back into range when nothing is committed', () => {
        const { onCommit, input } = setup({ value: 1 });
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.blur(input);
        expect(onCommit).not.toHaveBeenCalled();
        expect(input.value).toBe('1');
    });
});
```

- [ ] **Step 3: Run to see them fail**

Run: `npx vitest run src/components/NormalizedNumberInput`
Expected: the first three tests FAIL (`onCommit` was called); the last two pass or fail on the call count as described (`commits a changed value` passes already; the snap test fails with `onCommit` called once). If the first three pass, stop: the premise is wrong.

- [ ] **Step 4: Implement.** In `NormalizedNumberInput.jsx`, add above the component:

```jsx
// The value the cell currently holds, as a number (or emptyValue when blank), so "0.5" and 0.5 compare equal.
const toCurrent = (value, emptyValue) => {
    if (value === '' || value == null) {
        return emptyValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? emptyValue : parsed;
};
```

and replace `onBlur` with:

```jsx
    const onBlur = () => {
        const parsed = parseFloat(draft);
        const committed = isNaN(parsed) ? emptyValue : normalize(parsed, min, max);
        setDraft(committed);
        if (committed !== toCurrent(value, emptyValue)) {
            onCommit(committed);
        }
    };
```

- [ ] **Step 5: Run the component tests, then the whole suite**

Run: `npx vitest run`
Expected: all pass. Existing `Matrix.test.jsx` tests still pass (`clamps an out-of-range value on commit`, `creates the connection...`).

- [ ] **Step 6: Commit**

```bash
git add src/components/NormalizedNumberInput
git commit -m "Commit a cell value on blur only when it changed" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Add the slider to `NormalizedNumberInput` (opt-in)

**Files:**
- Modify: `src/components/NormalizedNumberInput/NormalizedNumberInput.jsx`
- Test: `src/components/NormalizedNumberInput/NormalizedNumberInput.test.jsx`

**Interfaces:**
- Consumes: Task 1's `toCurrent` and changed-only commit.
- Produces: new prop `showSlider` (boolean, default `false`). When `false` the component returns the bare `<input>` exactly as before. When `true` it returns a wrapper `Box` containing the input, an `aria-hidden` chevron, and a `Popper` with the `Slider`.

- [ ] **Step 1: Add a slider test helper and tests (append to `NormalizedNumberInput.test.jsx`)**

MUI's `Slider` finds its position from the root's bounding rect, so jsdom needs it stubbed. Dragging is a `mousedown` on the slider root, then a `mouseup` on `document`; `onChangeCommitted` fires on that `mouseup`. With `min=-1`, `max=1`, a `fraction` of 0.5 is value 0 and 0.7 is value 0.4.

```jsx
const openSlider = (input) => fireEvent.mouseDown(input);
// ClickAwayListener starts listening one timeout after mount, so give it that tick before clicking away.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const sliderRoot = () => document.querySelector('.MuiSlider-root');
// MUI recomputes the value from the mouseup's position, so the release must carry the same clientX.
const releaseAt = (fraction) => fireEvent.mouseUp(document, { clientX: fraction * 100 });
const dragTo = (fraction, { release = true } = {}) => {
    const root = sliderRoot();
    root.getBoundingClientRect = () => ({
        left: 0, right: 100, width: 100, top: 0, bottom: 10, height: 10, x: 0, y: 0,
    });
    fireEvent.mouseDown(root, { clientX: fraction * 100, buttons: 1 });
    if (release) {
        releaseAt(fraction);
    }
};

describe('NormalizedNumberInput slider', () => {
    it('renders the bare input and no slider unless showSlider is set', () => {
        const { input } = setup({ value: 0.5 });
        openSlider(input);
        expect(sliderRoot()).toBeNull();
        // RTL renders into a container div; with no slider the input is its direct child (no wrapper).
        expect(input.parentElement).toBe(document.body.firstElementChild);
    });

    it('does not open on focus, only on mouse down', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        fireEvent.focus(input);
        expect(sliderRoot()).toBeNull();
        openSlider(input);
        expect(sliderRoot()).not.toBeNull();
    });

    it('shows the cell value on the slider, and 0 for a blank cell', () => {
        const { input } = setup({ value: '', emptyValue: '', showSlider: true });
        openSlider(input);
        expect(document.querySelector('input[type="range"]').value).toBe('0');
    });

    it('shows the dragged value in the text input before the mouse is released', () => {
        // The text box is how the user sees what value the slider is setting, so it must track the drag.
        const { onCommit, input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        dragTo(0.7, { release: false });
        expect(input.value).toBe('0.4');
        expect(onCommit).not.toHaveBeenCalled();
        releaseAt(0.7);
        expect(onCommit).toHaveBeenCalledWith(0.4);
    });

    it('rounds the dragged value to 2 decimals so the text never shows float noise', () => {
        const { input } = setup({ value: 0, showSlider: true });
        openSlider(input);
        dragTo(0.65, { release: false }); // 0.3 would be 0.30000000000000004 unrounded
        expect(input.value).toBe('0.3');
        releaseAt(0.65);
    });

    it('reverts the preview when the release ends where the cell was', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        dragTo(0.7, { release: false });
        expect(input.value).toBe('0.4');
        dragTo(0.75, { release: true }); // back to 0.5, the original value
        expect(input.value).toBe('0.5');
    });

    it('updates the text while dragging and commits once on release', () => {
        const { onCommit, input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        dragTo(0.7);
        expect(input.value).toBe('0.4');
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(onCommit).toHaveBeenCalledWith(0.4);
    });

    it('commits nothing when the release ends where the cell already was', () => {
        const { onCommit, input } = setup({ value: '', emptyValue: '', showSlider: true });
        openSlider(input);
        dragTo(0.5); // value 0 == a blank cell shown as 0
        expect(onCommit).not.toHaveBeenCalled();
        expect(input.value).toBe('');
    });

    it('closes on a mouse down outside and on Escape', async () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        await tick();
        openSlider(input);
        fireEvent.mouseDown(document.body);
        expect(sliderRoot()).toBeNull();
        openSlider(input);
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(sliderRoot()).toBeNull();
    });

    it('opens only one slider at a time', async () => {
        const onCommit = vi.fn();
        render(
            <>
                <NormalizedNumberInput id="one" value={0.1} onCommit={onCommit} showSlider />
                <NormalizedNumberInput id="two" value={0.2} onCommit={onCommit} showSlider />
            </>,
        );
        await tick();
        fireEvent.mouseDown(document.getElementById('one'));
        fireEvent.mouseDown(document.getElementById('two'));
        expect(document.querySelectorAll('.MuiSlider-root')).toHaveLength(1);
    });

    it('is hidden from assistive tech and not a tab stop', () => {
        const { input } = setup({ value: 0.5, showSlider: true });
        openSlider(input);
        const root = sliderRoot();
        expect(root.closest('[aria-hidden="true"]')).not.toBeNull();
        expect(document.querySelector('input[type="range"]').getAttribute('tabindex')).toBe('-1');
        expect(document.querySelector('[data-testid="ArrowDropDownIcon"]').getAttribute('aria-hidden')).toBe('true');
    });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/components/NormalizedNumberInput`
Expected: every `NormalizedNumberInput slider` test FAILS (no slider rendered, `sliderRoot()` is null), except "renders the bare input and no slider unless showSlider is set", which passes (it pins today's behavior). The Task 1 tests still pass.

- [ ] **Step 3: Implement.** Replace the imports and component body in `NormalizedNumberInput.jsx` (keep `toCurrent` from Task 1 and the existing comment block above the component, extended with a sentence on the slider):

```jsx
import { useEffect, useRef, useState } from 'react';
import { Box, ClickAwayListener, Paper, Popper, Slider } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { normalize } from '../../utils/utils';
```

Inside the component, after the existing `useEffect`, add `const [open, setOpen] = useState(false); const anchorRef = useRef(null);`, build the existing `<Box component="input" .../>` as `const input = (...)` (same props as today), then:

```jsx
    if (!showSlider) {
        return input;
    }

    const roundTo2 = (n) => Math.round(n * 100) / 100;
    const parsedDraft = parseFloat(draft);
    const sliderValue = isNaN(parsedDraft) ? 0 : normalize(parsedDraft, min, max);

    // A release that ends where the cell already was (a click on the thumb) must not write anything --
    // in particular it must not turn a blank matrix cell into a 0-influence connection.
    const onSliderCommit = (_, newValue) => {
        const v = roundTo2(newValue);
        const current = toCurrent(value, emptyValue);
        const where = current === '' ? 0 : current; // a blank cell is shown as 0 on the slider
        if (v === where) {
            setDraft(value ?? '');
            return;
        }
        setDraft(v);
        onCommit(v);
    };

    return (
        <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={() => setOpen(false)}>
            <Box
                ref={anchorRef}
                onMouseDown={() => setOpen(true)}
                onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}
            >
                {input}
                <ArrowDropDownIcon
                    aria-hidden="true"
                    fontSize="small"
                    sx={{ position: 'absolute', right: 0, color: 'text.secondary' }}
                />
                <Popper
                    open={open}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    sx={{ zIndex: (theme) => theme.zIndex.modal }}
                >
                    <Paper
                        aria-hidden="true"
                        elevation={2}
                        sx={{ px: 1.5, py: 0.5, minWidth: 96, width: anchorRef.current?.offsetWidth }}
                    >
                        <Slider
                            size="small"
                            min={min}
                            max={max}
                            step={step}
                            value={sliderValue}
                            tabIndex={-1}
                            onChange={(_, v) => setDraft(roundTo2(v))}
                            onChangeCommitted={onSliderCommit}
                        />
                    </Paper>
                </Popper>
            </Box>
        </ClickAwayListener>
    );
```

Also add `showSlider = false,` to the destructured props (before `sx`).

If a test shows `tabindex` is not on the hidden range input, move it into `slotProps={{ input: { tabIndex: -1 } }}` (MUI 5.16 supports `slotProps.input`). If `onChangeCommitted` does not fire under jsdom after the `mouseup`, check that `dragTo` stubs `getBoundingClientRect` on `.MuiSlider-root` before the `mousedown`; that is the documented way MUI's own tests drive it.

- [ ] **Step 4: Run to verify GREEN, then the whole suite**

Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 5: Lint the touched files**

Run: `npx eslint src/components/NormalizedNumberInput`
Expected: no errors or warnings from these files.

- [ ] **Step 6: Commit**

```bash
git add src/components/NormalizedNumberInput
git commit -m "Add an opt-in decorative slider to NormalizedNumberInput" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Turn the slider on in the matrix

**Files:**
- Modify: `src/components/Matrix/Matrix.jsx` (the `<NormalizedNumberInput` in the cell, one prop)
- Test: `src/components/Matrix/Matrix.test.jsx` (append inside or after `describe('Matrix editing')`)

**Interfaces:**
- Consumes: `showSlider` from Task 2. `Matrix.test.jsx`'s existing `makeStore`, `renderMatrix`, `relationshipOf` helpers.
- Produces: matrix cells show the slider on mouse down. No reducer change.

- [ ] **Step 1: Write the failing tests (append to `src/components/Matrix/Matrix.test.jsx`)**

Add the `dragTo` helper from Task 2 (copy it; the two test files are independent) above the new `describe`.

```jsx
describe('Matrix cell slider', () => {
    it('creates a connection when the slider is released on a value in a blank cell', () => {
        const store = makeStore();
        const cell = renderMatrix(store);
        fireEvent.mouseDown(cell('a', 'b'));
        dragTo(0.7);
        expect(relationshipOf(store, 'a', 'b')?.influence).toBe(0.4);
        expect(cell('a', 'b').value).toBe('0.4');
    });

    it('does not create a connection when the slider is released on 0 in a blank cell', () => {
        const store = makeStore();
        const cell = renderMatrix(store);
        fireEvent.mouseDown(cell('a', 'b'));
        dragTo(0.5);
        expect(relationshipOf(store, 'a', 'b')).toBeUndefined();
    });

    it('updates an existing connection', () => {
        const store = makeStore([{ id: 'b', influence: 0.5, notes: 'keep me', confidence: 2 }]);
        const cell = renderMatrix(store);
        fireEvent.mouseDown(cell('a', 'b'));
        dragTo(0.25); // -0.5
        expect(relationshipOf(store, 'a', 'b')?.influence).toBe(-0.5);
    });

    it('keeps the connection, and its notes, when the slider is released on 0', () => {
        const store = makeStore([{ id: 'b', influence: 0.5, notes: 'keep me', confidence: 2 }]);
        const cell = renderMatrix(store);
        fireEvent.mouseDown(cell('a', 'b'));
        dragTo(0.5);
        const relationship = relationshipOf(store, 'a', 'b');
        expect(relationship).toBeDefined();
        expect(relationship.influence).toBe(0);
        expect(relationship.notes).toBe('keep me');
    });

    it('does not write anything when tabbing through a cell', () => {
        const store = makeStore([{ id: 'b', influence: '' }]);
        const before = store.getState().models.selectedModel;
        const cell = renderMatrix(store);
        fireEvent.focus(cell('a', 'b'));
        fireEvent.blur(cell('a', 'b'));
        expect(store.getState().models.selectedModel).toBe(before);
    });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/components/Matrix`
Expected: the four slider tests FAIL (no slider in the document, so `dragTo` throws on a null root). The tab-through test already passes after Task 1 (it pins that behavior). If it fails, Task 1 is incomplete: stop.

- [ ] **Step 3: Implement.** In `Matrix.jsx`, add `showSlider` to the `<NormalizedNumberInput` element (next to `emptyValue=""`):

```jsx
                                                showSlider
```

- [ ] **Step 4: Run to verify GREEN, then the whole suite**

Run: `npx vitest run`
Expected: all pass, including every pre-existing `Matrix` test.

- [ ] **Step 5: Check layout by hand**

Run `npm run dev`, open a model with several concepts (`?demo` loads one), go to the Matrix tab, and check: the chevron fits in a narrow cell without covering a two-digit value like `-0.15`; clicking a cell opens a slider under it; clicking another cell moves it; the slider is not clipped at the last row or the right edge (it is in a `Popper`, so it should not be); tabbing through cells shows no slider. Note anything off in the commit message body; do not change the Matrix padding without asking.

- [ ] **Step 6: Commit**

```bash
git add src/components/Matrix
git commit -m "Show the decorative value slider on matrix cells" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Turn the slider on in the scenario table

**Files:**
- Modify: `src/components/Scenario/Scenario.jsx` (the `<NormalizedNumberInput` in the `+/-` column)
- Create: `src/components/Scenario/Scenario.test.jsx`

**Interfaces:**
- Consumes: `showSlider` from Task 2; `models/setScenarioConceptOverride` (unchanged); `runScenarioCalculation` and `ScenarioChart` are mocked in the test.
- Produces: the `+/-` input shows the slider. Releasing it dispatches `setScenarioConceptOverride` with the new influence, which changes `selectedScenario`, which re-runs the existing calculation effect.

- [ ] **Step 1: Write the failing test: `src/components/Scenario/Scenario.test.jsx`**

Follow the provider setup of `Matrix.test.jsx` (Redux `Provider`, MUI `ThemeProvider`, emotion `ThemeProvider`). Use `makeScenarioId(appId, name, index)` from `src/utils/utils.js` for `selectedScenarioId`.

```jsx
import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import modelsReducer from '../../redux/slices/modelsSlice';
import { theme } from '../../constants/theme';
import { makeScenarioId } from '../../utils/utils';
import { Scenario } from './Scenario';

vi.mock('../../services/scenarioEngine', () => ({
    runScenarioCalculation: vi.fn().mockResolvedValue({ results: [] }),
}));
vi.mock('./ScenarioChart', () => ({ ScenarioChart: () => null }));

const makeStore = () => {
    const scenario = { name: 'S1', concepts: [] };
    const model = {
        appId: 'm1',
        info: {},
        groupNames: {},
        concepts: [
            { id: 'a', name: 'A', relationships: [] },
            { id: 'b', name: 'B', relationships: [] },
        ],
        scenarios: [scenario],
    };
    return configureStore({
        reducer: { models: modelsReducer },
        preloadedState: {
            models: {
                models: [model],
                selectedId: 'm1',
                selectedScenarioId: makeScenarioId('m1', 'S1', 0),
                selectedModel: model,
                selectedScenario: scenario,
            },
        },
    });
};

const dragTo = (fraction) => {
    const root = document.querySelector('.MuiSlider-root');
    root.getBoundingClientRect = () => ({
        left: 0, right: 100, width: 100, top: 0, bottom: 10, height: 10, x: 0, y: 0,
    });
    fireEvent.mouseDown(root, { clientX: fraction * 100, buttons: 1 });
    fireEvent.mouseUp(document, { clientX: fraction * 100 });
};

describe('Scenario +/- slider', () => {
    it('sets the scenario value for a concept when the slider is released', () => {
        const store = makeStore();
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <EmotionThemeProvider theme={theme}>
                        <Scenario />
                    </EmotionThemeProvider>
                </ThemeProvider>
            </Provider>,
        );
        const inputs = document.querySelectorAll('table input[type="number"]');
        fireEvent.mouseDown(inputs[0]);
        dragTo(0.7);
        const { selectedScenario } = store.getState().models;
        expect(selectedScenario.concepts.find(({ id }) => id === 'a')?.influence).toBe(0.4);
    });

    it('does not write a scenario value when the slider is released where the cell was', () => {
        const store = makeStore();
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <EmotionThemeProvider theme={theme}>
                        <Scenario />
                    </EmotionThemeProvider>
                </ThemeProvider>
            </Provider>,
        );
        const inputs = document.querySelectorAll('table input[type="number"]');
        fireEvent.mouseDown(inputs[0]);
        dragTo(0.5);
        expect(store.getState().models.selectedScenario.concepts).toEqual([]);
    });
});
```

If `Scenario` needs anything else under jsdom (for example a `ResizeObserver` stub), add it at the top of the test file with a one-line comment; the chart is already mocked, which is where that is most likely needed.

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/components/Scenario`
Expected: both tests FAIL because no slider exists (`document.querySelector('.MuiSlider-root')` is null, so `dragTo` throws a TypeError). A different failure (for example the component not rendering) is a test-setup problem: fix the setup, not the production code, and re-run until it fails for the stated reason.

- [ ] **Step 3: Implement.** In `Scenario.jsx`, add `showSlider` to the `<NormalizedNumberInput` in the `+/-` column (next to `emptyValue={0}`).

- [ ] **Step 4: Run to verify GREEN, then the whole suite**

Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 5: Check by hand**

Run `npm run dev`, open a model with a scenario (`?demo`, then the Scenario tab). Check: the slider opens under a `+/-` cell, the State Prediction updates once after release (not while dragging), and the Increase/Decrease columns refresh. The old app only showed sliders on rows whose checkbox was ticked; the current input is editable regardless, and this plan matches that (see Backlog).

- [ ] **Step 6: Final checks and commit**

```bash
npx vitest run
npx eslint src/components/NormalizedNumberInput src/components/Matrix src/components/Scenario
npm run build 2>&1 | tail -4
git add src/components/Scenario
git commit -m "Show the decorative value slider on scenario +/- cells" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Expected: tests pass, eslint reports no problems for these files, the build succeeds (the chunk-size warning is pre-existing). Do not push or merge; report the branch name.

---

## Backlog (decided to leave out; do not execute)

- **Explicit delete control for a matrix relationship.** Setting 0 or clearing a cell does not remove a relationship (see Decisions); deleting would also discard `notes`/`confidence`, so it needs a deliberate action (and probably a confirm). To be designed separately.
- **Scenario slider gating.** The old app showed the slider and allowed editing only on rows whose checkbox was ticked. The current `+/-` input is editable regardless. Revisit if the product owner wants the old gating.
- **Slider tick/keyboard polish** (for example snapping at 0, Escape returning focus to the input) if the product owner asks.
