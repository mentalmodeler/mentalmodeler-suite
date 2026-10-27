import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import modelsReducer from '../../redux/slices/modelsSlice';
import { sideHeaderCellStyle } from '../../constants/styles';
import { theme } from '../../constants/theme';
import { makeScenarioId } from '../../utils/utils';
import { alpha } from '@mui/material';
import { runScenarioCalculation } from '../../services/scenarioEngine';
import { Scenario } from './Scenario';

vi.mock('../../services/scenarioEngine', () => ({
    runScenarioCalculation: vi.fn().mockResolvedValue({ results: [] }),
}));
vi.mock('./ScenarioChart', () => ({ ScenarioChart: () => null }));

const makeStore = (scenarioConcepts = [], { settings, extraScenarios = [] } = {}) => {
    const scenario = { name: 'S1', concepts: scenarioConcepts, ...(settings ? { settings } : {}) };
    const model = {
        appId: 'm1',
        info: {},
        groupNames: {},
        concepts: [
            { id: 'a', name: 'A', relationships: [] },
            { id: 'b', name: 'B', relationships: [] },
        ],
        scenarios: [scenario, ...extraScenarios],
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
        left: 0,
        right: 100,
        width: 100,
        top: 0,
        bottom: 10,
        height: 10,
        x: 0,
        y: 0,
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

describe('Scenario cell styling', () => {
    // emotion's rules accumulate across tests, so look only at the rules that target this element's classes.
    const cssFor = (el) => {
        const classes = Array.from(el.classList);
        return Array.from(document.styleSheets)
            .flatMap((sheet) => Array.from(sheet.cssRules))
            .filter((rule) => classes.some((name) => rule.selectorText?.includes(`.${name}`)))
            .map((rule) => rule.cssText)
            .join('\n');
    };
    const scenarioTint = alpha(theme.palette.tabs.scenario, 0.1);
    const renderScenario = (store) =>
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <EmotionThemeProvider theme={theme}>
                        <Scenario />
                    </EmotionThemeProvider>
                </ThemeProvider>
            </Provider>,
        );

    it('tints a +/- cell that has a value, in the scenario color', () => {
        renderScenario(makeStore([{ id: 'a', selected: true, influence: 0.5 }]));
        const cell = document.querySelector('table input[type="number"]').closest('td');
        expect(cssFor(cell)).toContain(scenarioTint);
    });

    it('does not tint +/- cells when none has a value', () => {
        renderScenario(makeStore());
        const cell = document.querySelector('table input[type="number"]').closest('td');
        expect(cssFor(cell)).not.toContain(scenarioTint);
    });

    it('centers the value and outlines the focused cell in the scenario color', () => {
        renderScenario(makeStore());
        const input = document.querySelector('table input[type="number"]');
        input.focus();
        expect(window.getComputedStyle(input).textAlign).toBe('center');
        expect(cssFor(input)).toContain(`outline: 2px solid ${theme.palette.tabs.scenario}`);
    });

    it('keeps a focused cell below the sticky headers like the matrix does', () => {
        renderScenario(makeStore());
        const input = document.querySelector('table input[type="number"]');
        input.focus();
        const { zIndex } = window.getComputedStyle(input);
        expect(Number(zIndex)).toBeGreaterThan(1);
        expect(Number(zIndex)).toBeLessThan(sideHeaderCellStyle.zIndex);
    });
});

describe('Scenario row states', () => {
    const renderScenario = (store) =>
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <EmotionThemeProvider theme={theme}>
                        <Scenario />
                    </EmotionThemeProvider>
                </ThemeProvider>
            </Provider>,
        );

    it('offers a checkbox for a row with no value', () => {
        renderScenario(makeStore());
        expect(document.querySelectorAll('table input[type="checkbox"]')).toHaveLength(2);
    });

    it('drops the checkbox for a row that has a value', () => {
        renderScenario(makeStore([{ id: 'a', selected: true, influence: 0.5 }]));
        expect(document.querySelectorAll('table input[type="checkbox"]')).toHaveLength(1);
        expect(document.querySelector('table input[type="number"]').value).toBe('0.5');
    });

    it('hides the value input for an unchecked row until it is re-checked', () => {
        const store = makeStore([{ id: 'a', selected: false, influence: 0 }]);
        renderScenario(store);
        expect(document.querySelectorAll('table input[type="number"]')).toHaveLength(1);
        const checkbox = document.querySelector('table input[type="checkbox"]');
        expect(checkbox.checked).toBe(false);
        fireEvent.click(checkbox);
        expect(document.querySelectorAll('table input[type="number"]')).toHaveLength(2);
    });

    it('leaves a focused value input on wheel so the table can scroll', () => {
        renderScenario(makeStore());
        const input = document.querySelector('table input[type="number"]');
        input.focus();
        expect(document.activeElement).toBe(input);
        fireEvent.wheel(input);
        expect(document.activeElement).not.toBe(input);
    });
});

describe('Scenario settings', () => {
    const renderStore = (store) =>
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <EmotionThemeProvider theme={theme}>
                        <Scenario />
                    </EmotionThemeProvider>
                </ThemeProvider>
            </Provider>,
        );
    const pressed = (name) => screen.getByRole('button', { name }).getAttribute('aria-pressed') === 'true';
    const lastCall = () => runScenarioCalculation.mock.calls.at(-1)[0];

    beforeEach(() => {
        runScenarioCalculation.mockReset();
        runScenarioCalculation.mockResolvedValue({ results: [] });
    });

    it('shows and runs the defaults for a scenario with no settings, without changing the scenario', async () => {
        const store = makeStore();
        const original = store.getState().models.selectedScenario;
        renderStore(store);
        await waitFor(() => expect(runScenarioCalculation).toHaveBeenCalled());

        expect(lastCall()).not.toHaveProperty('squashFunction');
        expect(lastCall().scenario).toBe(original);
        expect(pressed('Kosko')).toBe(true);
        expect(screen.getByLabelText('Squash function').textContent).toBe('Sigmoid');
        expect(Number(screen.getByLabelText('Lambda').value)).toBe(1);
        expect(Number(screen.getByLabelText('Noise threshold').value)).toBe(0);
        expect(store.getState().models.selectedScenario).toBe(original);
    });

    it('saves a changed rule on the scenario and recalculates with it', async () => {
        const store = makeStore();
        renderStore(store);
        await waitFor(() => expect(runScenarioCalculation).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByRole('button', { name: 'Modified Kosko' }));

        expect(store.getState().models.selectedScenario.settings).toEqual({ rule: 'modified kosko' });
        await waitFor(() => expect(runScenarioCalculation).toHaveBeenCalledTimes(2));
        expect(lastCall().scenario.settings).toEqual({ rule: 'modified kosko' });
    });

    it("shows each scenario's own settings when the selection changes", async () => {
        const other = { name: 'S2', concepts: [], settings: { rule: 'rescaled kosko', squash: 'trivalent' } };
        const store = makeStore([], { extraScenarios: [other] });
        renderStore(store);
        await waitFor(() => expect(runScenarioCalculation).toHaveBeenCalled());
        expect(pressed('Kosko')).toBe(true);

        act(() => {
            store.dispatch({
                type: 'models/selectScenario',
                payload: { value: { appId: 'm1', id: makeScenarioId('m1', 'S2', 1) } },
            });
        });

        expect(pressed('Rescaled Kosko')).toBe(true);
        expect(pressed('Kosko')).toBe(false);
        expect(screen.getByLabelText('Squash function').textContent).toBe('Trivalent (-1 / 0 / 1)');
        expect(screen.queryByLabelText('Lambda')).toBeNull();
    });

    it('keeps the newest result when an older calculation finishes last', async () => {
        const store = makeStore();
        renderStore(store);
        await waitFor(() => expect(runScenarioCalculation).toHaveBeenCalledTimes(1));
        let resolveFirst;
        let resolveSecond;
        runScenarioCalculation
            .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
            .mockImplementationOnce(() => new Promise((resolve) => (resolveSecond = resolve)));

        fireEvent.click(screen.getByRole('button', { name: 'Modified Kosko' }));
        fireEvent.click(screen.getByRole('button', { name: 'Rescaled Kosko' }));
        await waitFor(() => expect(runScenarioCalculation).toHaveBeenCalledTimes(3));

        await act(async () => resolveSecond({ results: [{ id: 'a', influence: 0.9 }] }));
        await act(async () => resolveFirst({ results: [{ id: 'a', influence: -0.9 }] }));

        const firstRowActualState = document.querySelector('table tbody tr').lastElementChild;
        expect(firstRowActualState.textContent).toBe('Increase');
    });
});
