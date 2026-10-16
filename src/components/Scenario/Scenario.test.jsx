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
