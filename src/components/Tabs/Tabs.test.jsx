import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import appReducer, { APP_VIEW } from '../../redux/slices/appSlice';
import modelsReducer from '../../redux/slices/modelsSlice';
import { theme } from '../../constants/theme';
import { makeScenarioId } from '../../utils/utils';
import { Tabs } from './Tabs';

// The real action reads the concept-map widget, which needs the mentalmodeler-js bundle.
vi.mock('../../redux/actions/models', () => ({ saveModelFromConceptMap: () => () => {} }));

const makeStore = ({ scenarios = [], selectedScenarioIndex = null, view = APP_VIEW.MODEL } = {}) => {
    const model = { appId: 'm1', info: {}, groupNames: {}, concepts: [], scenarios };
    const selected = selectedScenarioIndex === null ? null : scenarios[selectedScenarioIndex];
    return configureStore({
        reducer: { models: modelsReducer, app: appReducer },
        preloadedState: {
            models: {
                models: [model],
                selectedId: 'm1',
                selectedModel: model,
                selectedScenarioId: selected ? makeScenarioId('m1', selected.name, selectedScenarioIndex) : '',
                selectedScenario: selected,
            },
            app: { view, addDialogOpen: false },
        },
    });
};

const clickScenarioTab = (store) => {
    render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <EmotionThemeProvider theme={theme}>
                    <Tabs />
                </EmotionThemeProvider>
            </ThemeProvider>
        </Provider>,
    );
    fireEvent.click(screen.getByRole('tab', { name: /^Scenario/ }));
    return store.getState();
};

describe('Scenario tab', () => {
    const scenarios = [
        { name: 'First', concepts: [] },
        { name: 'Second', concepts: [] },
    ];

    it('selects and loads the first scenario when none is selected', () => {
        const { models, app } = clickScenarioTab(makeStore({ scenarios }));
        expect(app.view).toBe(APP_VIEW.SCENARIO);
        expect(models.selectedScenarioId).toBe(makeScenarioId('m1', 'First', 0));
        expect(models.selectedScenario).toBe(models.selectedModel.scenarios[0]);
    });

    it('keeps the scenario that is already selected', () => {
        const { models } = clickScenarioTab(makeStore({ scenarios, selectedScenarioIndex: 1 }));
        expect(models.selectedScenarioId).toBe(makeScenarioId('m1', 'Second', 1));
        expect(models.selectedScenario.name).toBe('Second');
    });

    it('selects nothing when the model has no scenarios', () => {
        const { models, app } = clickScenarioTab(makeStore());
        expect(app.view).toBe(APP_VIEW.SCENARIO);
        expect(models.selectedScenarioId).toBe('');
        expect(models.selectedScenario).toBeNull();
    });

    it('does not select a scenario when switching to another tab', () => {
        const store = makeStore({ scenarios });
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <EmotionThemeProvider theme={theme}>
                        <Tabs />
                    </EmotionThemeProvider>
                </ThemeProvider>
            </Provider>,
        );
        fireEvent.click(screen.getByRole('tab', { name: /^Matrix/ }));
        expect(store.getState().models.selectedScenarioId).toBe('');
    });
});

describe.each(['Model', 'Matrix', 'Preferred State & Metrics', 'Info'])('%s tab', (label) => {
    const scenarios = [{ name: 'First', concepts: [] }];

    it('puts the sidebar selection back on the model when a scenario was selected', () => {
        const store = makeStore({ scenarios, selectedScenarioIndex: 0, view: APP_VIEW.SCENARIO });
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <EmotionThemeProvider theme={theme}>
                        <Tabs />
                    </EmotionThemeProvider>
                </ThemeProvider>
            </Provider>,
        );
        fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${label}`) }));
        const { models, app } = store.getState();
        expect(app.view).not.toBe(APP_VIEW.SCENARIO);
        expect(models.selectedScenarioId).toBe('');
        expect(models.selectedScenario).toBeNull();
        expect(models.selectedId).toBe('m1');
        expect(models.selectedModel.appId).toBe('m1');
    });
});
