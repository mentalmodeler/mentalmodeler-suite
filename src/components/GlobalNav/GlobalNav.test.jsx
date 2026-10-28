import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import appReducer from '../../redux/slices/appSlice';
import modelsReducer from '../../redux/slices/modelsSlice';
import { theme } from '../../constants/theme';
import { GlobalNav } from './GlobalNav';

const { downloadBlob, saveModelFromConceptMap } = vi.hoisted(() => ({
    downloadBlob: vi.fn(),
    saveModelFromConceptMap: vi.fn(),
}));

vi.mock('../../utils/io', () => ({ createFileInput: vi.fn(), downloadBlob }));
vi.mock('../../redux/actions/models', () => ({ saveModelFromConceptMap }));
vi.mock('../../services/print', () => ({ printModel: vi.fn() }));

const settings = { rule: 'rescaled kosko', squash: 'trivalent', lambda: 2.5, noiseThreshold: 0.15 };

const makeStore = () => {
    const model = {
        appId: 'm1',
        filename: 'fire_model',
        info: { id: 'abc' },
        groupNames: {},
        concepts: [{ id: 'c1', name: 'Old name', relationships: [] }],
        scenarios: [{ name: 'Hot', concepts: [], settings }],
    };
    return configureStore({
        reducer: { models: modelsReducer, app: appReducer },
        preloadedState: {
            models: {
                models: [model],
                selectedId: 'm1',
                selectedModel: model,
                selectedScenarioId: '',
                selectedScenario: null,
            },
            app: { view: 'MODEL' },
        },
    });
};

const readBlob = (blob) =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(blob);
    });

const clickSaveMmp = (store) => {
    render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <GlobalNav />
            </ThemeProvider>
        </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Save MMP' }));
};

describe('Save MMP', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 9, 27, 16, 34));
        saveModelFromConceptMap.mockImplementation(() => (dispatch) => {
            dispatch({
                type: 'models/updateModelFromConceptMap',
                payload: {
                    value: { js: { concepts: [{ id: 'c1', name: 'Fresh name', relationships: [] }], groupNames: {} } },
                },
            });
        });
    });

    it('downloads the selected model, scenarios and settings included, under a stamped .mmp name', async () => {
        clickSaveMmp(makeStore());

        expect(downloadBlob).toHaveBeenCalledTimes(1);
        const [blob, filename] = downloadBlob.mock.calls[0];
        expect(filename).toBe('fire_model_2026-10-27_1634.mmp');
        const saved = JSON.parse(await readBlob(blob));
        expect(saved.scenarios).toEqual([{ name: 'Hot', concepts: [], settings }]);
        expect(saved).not.toHaveProperty('appId');
        expect(saved).not.toHaveProperty('filename');
        expect(saved).not.toHaveProperty('compareRef');
    });

    it('includes the canvas edits flushed by the save, not the stale model from the last render', async () => {
        clickSaveMmp(makeStore());

        const saved = JSON.parse(await readBlob(downloadBlob.mock.calls[0][0]));
        expect(saved.concepts[0].name).toBe('Fresh name');
    });
});
