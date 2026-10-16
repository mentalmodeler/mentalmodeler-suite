import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { configureStore } from '@reduxjs/toolkit';
import modelsReducer from '../../redux/slices/modelsSlice';
import { theme } from '../../constants/theme';
import { Matrix } from './Matrix';

const makeStore = (relationshipsOfA = []) => {
    const model = {
        appId: 'm1',
        info: {},
        groupNames: {},
        concepts: [
            { id: 'a', name: 'A', relationships: relationshipsOfA },
            { id: 'b', name: 'B', relationships: [] },
        ],
    };
    return configureStore({
        reducer: { models: modelsReducer },
        preloadedState: {
            models: {
                models: [model],
                selectedId: 'm1',
                selectedScenarioId: '',
                selectedModel: model,
                selectedScenario: null,
            },
        },
    });
};

const renderMatrix = (store) => {
    render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                {/* Matrix reads the theme via @emotion/react's useTheme; under Vitest that is a separate
                    context instance from the one MUI's provider fills, so provide it explicitly. */}
                <EmotionThemeProvider theme={theme}>
                    <Matrix />
                </EmotionThemeProvider>
            </ThemeProvider>
        </Provider>,
    );
    // input for the cell where concept `from` influences concept `to`
    return (from, to) => document.getElementById(`${from}-${to}-input`);
};

const relationshipOf = (store, from, to) =>
    store
        .getState()
        .models.selectedModel.concepts.find((c) => c.id === from)
        .relationships.find((r) => r.id === to);

describe('Matrix cells', () => {
    it('shows the influence of an existing connection', () => {
        const cell = renderMatrix(makeStore([{ id: 'b', influence: 0.34 }]));
        expect(cell('a', 'b').value).toBe('0.34');
    });

    it('shows 0 for a connection whose influence is 0', () => {
        const cell = renderMatrix(makeStore([{ id: 'b', influence: 0 }]));
        expect(cell('a', 'b').value).toBe('0');
    });

    it('shows 0 for a connection that has no influence value (empty string)', () => {
        const cell = renderMatrix(makeStore([{ id: 'b', influence: '' }]));
        expect(cell('a', 'b').value).toBe('0');
    });

    it('shows 0 for a connection that has no influence value (missing)', () => {
        const cell = renderMatrix(makeStore([{ id: 'b' }]));
        expect(cell('a', 'b').value).toBe('0');
    });

    it('leaves a cell blank when there is no connection', () => {
        const cell = renderMatrix(makeStore());
        expect(cell('a', 'b').value).toBe('');
    });
});

describe('Matrix editing', () => {
    it('creates the connection when a value is entered in an empty cell', () => {
        const store = makeStore();
        const cell = renderMatrix(store);
        fireEvent.change(cell('a', 'b'), { target: { value: '0.7' } });
        fireEvent.blur(cell('a', 'b'));
        expect(relationshipOf(store, 'a', 'b')?.influence).toBe(0.7);
        expect(cell('a', 'b').value).toBe('0.7');
    });

    it('does not create a connection when an empty cell is left empty', () => {
        const store = makeStore();
        const cell = renderMatrix(store);
        fireEvent.focus(cell('a', 'b'));
        fireEvent.blur(cell('a', 'b'));
        expect(relationshipOf(store, 'a', 'b')).toBeUndefined();
    });

    it('clamps an out-of-range value on commit', () => {
        const store = makeStore();
        const cell = renderMatrix(store);
        fireEvent.change(cell('a', 'b'), { target: { value: '5' } });
        fireEvent.blur(cell('a', 'b'));
        expect(relationshipOf(store, 'a', 'b')?.influence).toBe(1);
    });
});

// MUI recomputes the value from the mouseup's position, so the release must carry the same clientX.
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
