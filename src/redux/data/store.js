import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage/session';
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
