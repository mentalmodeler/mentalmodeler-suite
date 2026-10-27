import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
// The ES build, not /lib: Vite 8 hands back the whole CommonJS module.exports object for a default import of /lib.
import storage from 'redux-persist/es/storage/session';
import rootReducer from './rootReducer';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: [],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
// note: default middleware = [thunk, immutableStateInvariant, serializableStateInvariant]
//       disable serializableStateInvariant to prevent error
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

if (import.meta.env.MODE === 'development' && import.meta.hot) {
    import.meta.hot.accept('./rootReducer', () => {
        const newRootReducer = rootReducer.default;
        store.replaceReducer(newRootReducer);
    });
}

export const persistor = persistStore(store);
export default store;
