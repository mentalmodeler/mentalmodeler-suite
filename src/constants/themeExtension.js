import { createTheme } from '@mui/material/styles';
export let themeExtensions = createTheme({
    palette: {
        primary: {
            main: '#8a1b12',
        },
        text: {
            primary: '#ff0000',
        },
    },
    typography: {
        headlinePrimary: {
            fontSize: '3rem',
            fontWeight: '700',
            // color: 'primary.main',
        },
    },
    // components: {
    //     MuiTypography: {
    //         defaultProps: {
    //             color: 'primary',
    //         },
    //     },
    // },
});
