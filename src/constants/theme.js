import { createTheme } from '@mui/material/styles';
import { lightGreen, grey } from '@mui/material/colors';

const _theme = createTheme({
    palette: {
        primary: {
            // main: '#8a1b12',
            main: lightGreen['A200'], // '#A5C824',
        },
        text: {
            primary: '#292929',
        },
        bg: {
            dark: grey[700],
            darker: grey[800],
            darkest: grey[900],
        },
    },
    // breakpoints: {
    //     values: {
    //         xs: 0,
    //         sm: 480,
    //         md: 800,
    //         lg: 1020,
    //         xl: 1400,
    //     },
    // },
});

export const theme = createTheme(_theme, {
    typography: {
        logo: {
            fontSize: '1.5rem',
            letterSpacing: '-0.07rem',
            fontWeight: 800,
            color: '#fff',
        },
        // headlineBottom: {
        //     fontSize: '3.25rem',
        //     lineHeight: '3.25rem',
        //     fontWeight: '600',
        //     fontFamily: 'Roboto Condensed',
        //     color: _theme.palette.primary.main,
        // },
        // button: {
        //     textTransform: 'none',
        // },
    },
    components: {
        MuiButtonBase: {
            defaultProps: {
                // The props to change the default for.
                disableRipple: true, // No more ripple, on the whole application 💣!
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: _theme.palette.bg.dark,
                    border: `1px solid ${_theme.palette.bg.dark}`, //primary.main
                    boxShadow: '0 3px 16px rgba(0,0,0,.5)',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: _theme.palette.primary.main,
                    '@media (hover: hover)': {
                        '&:hover': {
                            backgroundColor: _theme.palette.bg.darker,
                        },
                    },
                    '&:focus': {
                        backgroundColor: _theme.palette.bg.darkest,
                    },
                    '&:active': {
                        color: _theme.palette.common.black,
                        backgroundColor: _theme.palette.primary.main,
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                // Name of the slot
                root: {
                    color: _theme.palette.grey[100],
                    textTransform: 'none',
                    paddingBlock: 0,
                    paddingInline: _theme.spacing(3),
                    minHeight: '68px',
                    gap: _theme.spacing(0.5),
                    borderStartStartRadius: 12,
                    borderStartEndRadius: 12,
                    border: '1px solid transparent',
                    '@media (hover: hover)': {
                        '&:hover': {
                            color: _theme.palette.primary.main,
                        },
                    },
                    '&:focus': {
                        // color: _theme.palette.primary.main,
                        borderColor: _theme.palette.primary.main,
                    },
                    // '&[aria-selected="true"]': {
                    //     backgroundColor: _theme.palette.bg.dark,
                    //     borderStartStartRadius: '12px',
                    //     borderStartEndRadius: '12px',
                    // },
                },
                iconWrapper: {
                    margin: 0,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                // Name of the slot
                indicator: {
                    height: '6px',
                },
                flexContainer: {
                    justifyContent: 'space-around',
                },
                scrollButtons: {
                    color: _theme.palette.primary.main,
                    boxShadow: '0 0 16px rgba(0,0,0,.5)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                // Name of the slot
                root: {
                    // Some CSS
                    // borderRadius: '2rem',
                    // '&:focus': {
                    //     outline: `1px solid ${_theme.palette.primary.main}`,
                    // },
                },
            },
            variants: [
                {
                    props: { variant: 'global-nav' },
                    style: {
                        borderRadius: _theme.spacing(1),
                        color: lightGreen['A200'],
                        backgroundColor: _theme.palette.bg.darkest,
                        minWidth: 'unset',
                        paddingInline: _theme.spacing(1),
                        paddingBlock: _theme.spacing(0.5),
                        textTransform: 'none',
                        gap: _theme.spacing(0.5),
                        border: '1px solid transparent',
                        '@media (hover: hover)': {
                            '&:hover': {
                                border: `1px solid ${_theme.palette.primary.main}`,
                                backgroundColor: _theme.palette.grey[900],
                            },
                        },
                        '&:focus': {
                            outline: `1px solid ${_theme.palette.primary.main}`,
                        },
                        '&:active': {
                            transform: 'scale(.95)',
                        },
                        span: {
                            margin: 0,
                        },
                    },
                },
                // {
                //     props: { variant: 'resume' },
                //     style: {
                //         borderRadius: '24px',
                //         // color: 'blue',
                //         // backgroundColor: '#e5e3e2',
                //         paddingBlock: '4px',
                //         paddingInline: '8px',
                //         minWidth: 'unset',
                //         marginInlineEnd: '16px',
                //         textTransform: 'none',
                //     },
                // },
                // {
                //     props: { variant: 'contained' },
                //     style: {
                //         boxShadow: 'none',
                //     },
                // },
            ],
        },
    },

    //     // MuiTypography: {
    //     //     defaultProps: {
    //     //         color: 'primary',
    //     //     },
    //     // },
    // },
});
