import { fireEvent, render } from '@testing-library/react';
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
import { Scenario } from './Scenario';

vi.mock('../../services/scenarioEngine', () => ({
    runScenarioCalculation: vi.fn().mockResolvedValue({ results: [] }),
}));
vi.mock('./ScenarioChart', () => ({ ScenarioChart: () => null }));

const makeStore = (scenarioConcepts = []) => {
    const scenario = { name: 'S1', concepts: scenarioConcepts };
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
