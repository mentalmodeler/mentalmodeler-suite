import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { HashRouter } from 'react-router-dom';
import { GlobalStyles, ThemeProvider } from '@mui/material';
import { theme } from './constants/theme.js';
import { AppProvider } from './context/AppContext/AppContext.jsx';

// console.log('theme:', theme);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <GlobalStyles
                styles={{
                    body: {
                        boxSizing: 'border-box',
                        backgroundColor: theme.palette.bg.darker,
                        '*': {
                            boxSizing: 'border-box',
                        },
                        '.Mui-focusVisible': {
                            // outline: '1px solid #fff',
                            // boxShadow:
                            //     '0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12), 0px 0px 0px 3px #8a1b12',
                            // transition: 'none',
                        },
                    },
                    // '.router-link': {
                    //     textDecoration: 'none',
                    //     color: 'neutral.800',
                    // },
                }}
            />
            <AppProvider>
                <HashRouter>
                    <App />
                </HashRouter>
            </AppProvider>
        </ThemeProvider>
    </React.StrictMode>,
);
