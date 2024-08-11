import bg from '../assets/images/bg-2.webp';

export const headerMaxWidth = '36rem';
export const contentMaxWidth = '50rem';
export const maxWidthContent = {
    maxWidth: contentMaxWidth,
    margin: '0 auto',
    paddingInline: 2,
};
export const outerMaxWidth = '70rem';
export const gridItemHoverTransDur = '300ms';

export const colors = {
    primary: {
        main: '#8a1b12',
    },
};

export const header_bg = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${bg})`,
    filter: 'grayscale(100%)',
    opacity: 0.15,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
};

export const content_bg = {
    // position: 'absolute',
    // inset: 0,
    backgroundImage: `url(${bg})`,
    filter: 'grayscale(100%)',
    opacity: 0.15,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
};

export const brand_stripe = {
    // zIndex: 1,
    position: 'absolute',
    height: '6px',
    left: 0,
    right: 0,
    top: 0,
    background: 'repeating-linear-gradient( 90deg, #8a1b12, #8a1b12 20%, #595a5b 20%, #595a5b 40%)',
};
// background: repeating-linear-gradient( 90deg, #8a1b12, #8a1b12 20%, #595a5b 20%, #595a5b 40%);

export const flex_column = {
    display: 'flex',
    flexDirection: 'column',
};

export const max_width = {
    maxWidth: contentMaxWidth,
    marginInline: 'center',
    paddingInline: '16px',
};

export const sticky_header = {
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    paddingBlock: 2,
};

export const sticky_header_before = {
    content: '""',
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: '-32px',
    height: '32px',
    background: `linear-gradient(to bottom, rgba(0, 0, 0, .1) 0%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .025) 50% , rgba(0, 0, 0, 0) 100%)`,
    // inset: 0,
    // boxShadow: '0 0 32px rgba(0, 0, 0, .2), 0 0 8px rgba(0, 0, 0, .1)',
    opacity: 0,
    transition: 'opacity 350ms ease',
    pointerEvents: 'none',
};

export const dialog_footer_scroll_signifier = {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    top: '-32px',
    height: '32px',
    background: `linear-gradient(to top, rgba(0, 0, 0, .1) 0%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .025) 50% , rgba(0, 0, 0, 0) 100%)`,
    // inset: 0,
    // boxShadow: '0 0 32px rgba(0, 0, 0, .2), 0 0 8px rgba(0, 0, 0, .1)',
    opacity: 0,
    transition: 'opacity 350ms ease',
    pointerEvents: 'none',
};

export const work_decoration = {
    '&::before': {
        content: '""',
        position: 'absolute',
        // inset: 0,
        left: 0,
        top: '4px',
        bottom: '4px',
        width: '3px',
        borderInlineStart: '3px dotted #8a1b12',
        // transition: 'transform 300ms ease',
    },
};

export const subwork_decoration = {
    '&::before': {
        content: '""',
        position: 'absolute',
        // inset: 0,
        left: 0,
        top: '4px',
        bottom: '4px',
        width: '3px',
        borderInlineStart: '3px dotted #595959',
    },
};

export const aspectRatio_4_3 = {
    aspectRatio: '4/3',
    '@supports not (aspect-ratio: 4 / 3)': {
        '&::before': {
            float: 'left',
            paddingTop: '75%',
            content: "''",
        },
        '&::after': {
            display: 'block',
            content: "''",
            clear: 'both',
        },
    },
};

export const aspectRatio_16_9 = {
    aspectRatio: '16/9',
    '@supports not (aspect-ratio: 16 / 9)': {
        '&::before': {
            float: 'left',
            paddingTop: '56.25%',
            content: "''",
        },
        '&::after': {
            display: 'block',
            content: "''",
            clear: 'both',
        },
    },
};

export const hit_area = {
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        cursor: 'pointer',
    },
};
