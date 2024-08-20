import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './redux/data/store';
import './index.css';
import { GlobalStyles, ThemeProvider } from '@mui/material';
import { theme } from './constants/theme.js';

console.log('theme:', theme);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <GlobalStyles
                styles={{
                    body: {
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        backgroundColor: theme.palette.bg.darker,
                        '*': {
                            boxSizing: 'border-box',
                        },
                        '.Mui-focusVisible': {
                            // outline: `1px solid ${theme.palette.primary.main}`,
                            // boxShadow:
                            //     '0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12), 0px 0px 0px 3px #8a1b12',
                            // transition: 'none',
                        },
                    },
                    '.filter-view-control > ul': {
                        padding: 0,
                        paddingBlockEnd: theme.spacing(1),
                    },
                    // '.router-link': {
                    //     textDecoration: 'none',
                    //     color: 'neutral.800',
                    // },
                }}
            />
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <App />
                </PersistGate>
            </Provider>
        </ThemeProvider>
    </React.StrictMode>,
);
