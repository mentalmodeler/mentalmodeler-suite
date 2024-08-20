import { alpha, createTheme } from '@mui/material/styles';
import { lightGreen, grey, purple, orange, red, lightBlue } from '@mui/material/colors';

const _theme = createTheme({
    palette: {
        primary: {
            main: lightGreen['800'], // lime['A400'], // // A200// '#A5C824',
        },
        text: {
            primary: '#292929',
        },
        bg: {
            lightest: grey[100],
            lighter: grey[200],
            light: grey[300],
            lightMid: grey[400],
            mid: grey[500],
            darkMid: grey[600],
            dark: grey[700],
            darker: grey[800],
            darkest: grey[900],
        },
        tabs: {
            model: lightGreen['A100'],
            matrix: purple['A100'],
            metrics: orange['A200'],
            scenario: red['A100'],
            info: lightBlue['A100'],
        },
        action: {
            selectedOpacity: 0.5,
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
                    border: `1px solid ${_theme.palette.bg.dark}`,
                    boxShadow: '0 3px 16px rgba(0,0,0,.5)',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: _theme.palette.common.white,
                    '&:focus-within': {
                        backgroundColor: _theme.palette.bg.darker,
                    },
                    '@media (hover: hover)': {
                        '&:hover': {
                            backgroundColor: _theme.palette.bg.darker,
                        },
                    },
                    '&:active': {
                        color: _theme.palette.common.black,
                        backgroundColor: _theme.palette.tabs.model, //_theme.palette.primary.main,
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                // Name of the slot
                root: {
                    color: _theme.palette.common.white,
                    textTransform: 'none',
                    paddingBlock: 0,
                    paddingInline: _theme.spacing(3),
                    minHeight: '68px',
                    gap: _theme.spacing(0.5),
                    borderStartStartRadius: 12,
                    borderStartEndRadius: 12,
                    border: '1px solid transparent',
                    flexGrow: 1,
                    flexShrink: 1,
                    '@media (hover: hover)': {
                        '&:hover': {
                            '&:nth-of-type(1)': {
                                backgroundColor: alpha(_theme.palette.tabs.model, 0.3),
                            },
                            '&:nth-of-type(2)': {
                                backgroundColor: alpha(_theme.palette.tabs.matrix, 0.3),
                            },
                            '&:nth-of-type(3)': {
                                backgroundColor: alpha(_theme.palette.tabs.metrics, 0.3),
                            },
                            '&:nth-of-type(4)': {
                                backgroundColor: alpha(_theme.palette.tabs.scenario, 0.3),
                            },
                            '&:nth-of-type(5)': {
                                backgroundColor: alpha(_theme.palette.tabs.info, 0.3),
                            },
                        },
                    },
                    '&[aria-selected="true"]': {
                        backgroundColor: _theme.palette.bg.dark,
                        borderStartStartRadius: '12px',
                        borderStartEndRadius: '12px',
                        color: _theme.palette.common.black,
                        '&:nth-of-type(1)': {
                            backgroundColor: _theme.palette.tabs.model,
                        },
                        '&:nth-of-type(2)': {
                            backgroundColor: _theme.palette.tabs.matrix,
                        },
                        '&:nth-of-type(3)': {
                            backgroundColor: _theme.palette.tabs.metrics,
                        },
                        '&:nth-of-type(4)': {
                            backgroundColor: _theme.palette.tabs.scenario,
                        },
                        '&:nth-of-type(5)': {
                            backgroundColor: _theme.palette.tabs.info,
                        },
                    },
                    '&:focus-visible': {
                        '&:nth-of-type(1)': {
                            backgroundColor: alpha(_theme.palette.tabs.model, 0.3),
                        },
                        '&:nth-of-type(2)': {
                            backgroundColor: alpha(_theme.palette.tabs.matrix, 0.3),
                        },
                        '&:nth-of-type(3)': {
                            backgroundColor: alpha(_theme.palette.tabs.metrics, 0.3),
                        },
                        '&:nth-of-type(4)': {
                            backgroundColor: alpha(_theme.palette.tabs.scenario, 0.3),
                        },
                        '&:nth-of-type(5)': {
                            backgroundColor: alpha(_theme.palette.tabs.info, 0.3),
                        },
                    },
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
                    height: '0px', // '6px',
                },
                flexContainer: {},
                scrollButtons: {
                    color: _theme.palette.tabs.model, //_theme.palette.primary.main,
                    boxShadow: '0 0 16px rgba(0,0,0,.5)',
                },
            },
        },
        MuiTreeItem: {
            styleOverrides: {
                root: {
                    '&[aria-selected="true"] > .MuiTreeItem-content': {
                        backgroundColor: _theme.palette.tabs.scenario,
                    },
                },
                label: {
                    fontSize: '.875rem',
                },
                content: {
                    alignItems: 'flex-start',
                    // '&:not(.tree-control)': {
                    //     '&.Mui-selected, &.Mui-selected.Mui-focused, &.Mui-selected:hover': {
                    //         backgroundColor: _theme.palette.tabs.scenario,
                    //     },
                    // },
                },
            },
            variants: [
                {
                    props: { variant: 'branch-control' },
                    style: {
                        '&[aria-selected="true"] > .MuiTreeItem-content': {
                            backgroundColor: 'transparent',
                            '&.Mui-focused, &.Mui-focused.Mui-selected': {
                                backgroundColor: _theme.palette.action.focus,
                            },
                            '&.Mui-selected': {
                                backgroundColor: 'transparent',
                            },
                        },
                    },
                },
            ],
        },
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    textTransform: 'capitalize',
                    gap: _theme.spacing(1),
                    color: _theme.palette.text.primary,
                    '&:focus-within': {
                        backgroundColor: _theme.palette.action.focus,
                    },
                    '&.Mui-selected:hover': {
                        backgroundColor: _theme.palette.tabs.model, //_theme.palette.primary.main,
                    },
                    '&[aria-pressed="true"]': {
                        backgroundColor: _theme.palette.tabs.model, //_theme.palette.primary.main,
                    },
                    p: {
                        textAlign: 'start',
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                // Name of the slot
                root: {
                    // Some CSS
                    '&:focus-visible': {
                        outline: `1px double ${_theme.palette.primary.main}`,
                        outlineOffset: '2px',
                        // outline: `2px solid ${_theme.palette.tabs.model}`,
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                // Name of the slot
                root: {
                    // Some CSS
                    '&:focus-visible': {
                        outline: `1px double ${_theme.palette.primary.main}`,
                        outlineOffset: '2px',
                    },
                },
                // contained: {
                //     outline: `4px double ${_theme.palette.primary.main}`,
                // },
            },
            variants: [
                {
                    props: { variant: 'global-nav' },
                    style: {
                        borderRadius: _theme.spacing(1),
                        color: _theme.palette.common.white,
                        backgroundColor: _theme.palette.bg.darkest,
                        minWidth: 'unset',
                        paddingInline: _theme.spacing(1),
                        paddingBlock: _theme.spacing(0.5),
                        textTransform: 'none',
                        gap: _theme.spacing(0.5),
                        border: '1px solid transparent',
                        '@media (hover: hover)': {
                            '&:hover': {
                                border: `1px solid ${_theme.palette.common.white}`,
                                backgroundColor: _theme.palette.grey[900],
                            },
                        },
                        '&:focus-within': {
                            border: `1px solid ${_theme.palette.common.white}`,
                            outline: 'none', // `1px solid ${_theme.palette.common.white}`,
                        },
                        '&:active': {
                            transform: 'scale(.95)',
                        },
                        span: {
                            margin: 0,
                        },
                    },
                },
                {
                    props: { variant: 'scenario-add' },
                    style: {
                        borderRadius: _theme.spacing(0.5),
                        color: _theme.palette.common.white,
                        backgroundColor: _theme.palette.grey['600'],
                        fontSize: '.75rem',
                        lineHeight: '1.25rem',
                        minWidth: 'unset',
                        minHeight: 'unset',
                        paddingInline: _theme.spacing(1),
                        paddingBlock: _theme.spacing(0),
                        textTransform: 'none',
                        gap: _theme.spacing(0.5),
                        // border: '1px solid white',
                        '@media (hover: hover)': {
                            '&:hover': {
                                color: _theme.palette.tabs.model,
                                backgroundColor: _theme.palette.grey[900],
                            },
                        },
                        '&:focus-within': {
                            // outline: `1px solid ${_theme.palette.primary.main}`,
                            color: _theme.palette.tabs.model,
                            backgroundColor: _theme.palette.grey[900],
                            outline: 'none',
                        },
                        '&:active': {
                            transform: 'scale(.95)',
                            // color: _theme.palette.primary.main,
                            // backgroundColor: _theme.palette.grey[900],
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
