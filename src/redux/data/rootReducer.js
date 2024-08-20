import { combineReducers } from '@reduxjs/toolkit';
import modelsSlice from '../slices/modelsSlice';
import appSlice from '../slices/appSlice';
// import jobsSlice from 'Features/jobsSlice';
// import whatWhereSlice from 'Features/whatWhereSlice';
// import locationSlice from 'Features/locationSlice';
// import recentSearchesSlice from 'Features/recentSearches';
// import filtersSlice from 'Features/filters';
// import pathwaysSlice from 'Features/pathwaysSlice';

const rootReducer = combineReducers({
    models: modelsSlice,
    app: appSlice,
    // jobs: jobsSlice,
    // whatWhere: whatWhereSlice,
    // location: locationSlice,
    // recentSearches: recentSearchesSlice,
    // filters: filtersSlice,
    // pathways: pathwaysSlice,
});

export default rootReducer;
