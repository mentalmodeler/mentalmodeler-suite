import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './redux/data/store';
import './index.css';
import { GlobalStyles, ThemeProvider } from '@mui/material';
import { theme } from './constants/theme.js';
import 'mentalmodeler-js/dist/mentalmodeler-js.css';
import html2canvas from 'html2canvas';

// the embedded mentalmodeler-js bundle's own window.MentalModelerConceptMap.screenshot()
// also expects this global - without it, that screenshot API silently fails too
window.html2canvas = html2canvas;

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
                    '@media print': {
                        '#app, .mm-print-overlay': {
                            display: 'none',
                        },
                        '@page': {
                            size: 'landscape',
                            margin: '0.5cm',
                        },
                        '.no-break': {
                            display: 'block',
                            breakBefore: 'always',
                            breakInside: 'avoid',
                        },
                    },
                    '#printArea': {
                        display: 'none',
                    },
                    '.printable': {
                        height: 'unset !important',
                        overflow: 'visible !important',
                        width: '100% !important',
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
