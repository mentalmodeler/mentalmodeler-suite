import * as React from 'react';

const AppStateContext = React.createContext();
const AppDispatchContext = React.createContext();

export const ACTION_TYPE = {
    TOGGLE_MODAL: 'TOGGLE_MODAL',
    SELECT_PROJECT: 'SELECT_PROJECT',
    TOGGLE_CONDENSED: 'TOGGLE_CONDENSED',
    TOGGLE_ALL_EXPANDED: 'TOGGLE_ALL_EXPANDED',
    TOGGLE_SECTION_ALL_EXPANDED: 'TOGGLE_SECTION_ALL_EXPANDED',
};

export const SECTION = {
    WORK: 'Work',
    CONSULTING: 'Consulting',
    PERSONAL: 'Personal',
    FEEDBACK: 'Feedback',
};

const appReducer = (state, action) => {
    const { type, value } = action;
    // console.log('appReducer, type:', type, ', value:', value);
    switch (type) {
        case ACTION_TYPE.TOGGLE_MODAL: {
            return { ...state, modalOpen: value };
        }
        case ACTION_TYPE.SELECT_PROJECT: {
            return { ...state, modalOpen: true, selectedProject: value };
        }
        case ACTION_TYPE.TOGGLE_CONDENSED: {
            return { ...state, condensed: value };
        }
        case ACTION_TYPE.TOGGLE_ALL_EXPANDED: {
            return { ...state, allExpanded: value };
        }
        case ACTION_TYPE.TOGGLE_SECTION_ALL_EXPANDED: {
            return { ...state, [`allExpanded${value.section}`]: value.expanded };
        }
        default: {
            return { ...state };
        }
    }
};

const initialState = {
    modalOpen: false,
    selectedProject: null,
    condensed: false,
    allExpanded: false,
    allExpandedWork: false,
    allExpandedConsulting: false,
    allExpandedPersonal: false,
};

const AppProvider = ({ children }) => {
    const [state, dispatch] = React.useReducer(appReducer, initialState);
    // NOTE: you *might* need to memoize this value
    // Learn more in http://kcd.im/optimize-context
    // const value = { state, dispatch };
    return (
        <AppDispatchContext.Provider value={dispatch}>
            <AppStateContext.Provider value={state}>{children}</AppStateContext.Provider>
        </AppDispatchContext.Provider>
    );
};

const useAppDispatch = () => {
    const context = React.useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error('AppDispatchContext must be used within a AppDispatchProvider');
    }
    return context;
};

const useAppState = () => {
    const context = React.useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within a AppStateContext');
    }
    return context;
};

export { AppDispatchContext, AppStateContext, AppProvider, useAppDispatch, useAppState };
