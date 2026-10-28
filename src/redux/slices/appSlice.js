// jobs redux slice with thunks
// NOTE: using Immer to manage state (included as middleware)
// https://immerjs.github.io/immer/docs/introduction
import { createSlice } from '@reduxjs/toolkit';

export const APP_VIEW = {
    MODEL: 'MODEL',
    MATRIX: 'MATRIX',
    METRICS: 'METRICS',
    SCENARIO: 'SCENARIO',
    INFO: 'INFO',
};

const initialState = {
    view: APP_VIEW.MODEL,
    addDialogOpen: false,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setField(state, action) {
            const { field, value } = action.payload;
            state[field] = value;
        },
    },
});

export const { setField } = appSlice.actions;

export default appSlice.reducer;
