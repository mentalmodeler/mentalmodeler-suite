import { Box, Typography } from '@mui/material';
import { forwardRef } from 'react';

export const Flex = forwardRef(function Flex(
    { children, sx, direction = '', justify = '', align = '', gap = '', colGap = '', rowGap = '', wrap = '', ...props },
    ref,
) {
    return (
        <Box
            ref={ref}
            {...props}
            sx={{
                display: 'flex',
                ...(direction && { flexDirection: direction }),
                ...(justify && { justifyContent: justify }),
                ...(align && { alignItems: align }),
                ...(gap && { gap }),
                ...(colGap && { columnGap: colGap }),
                ...(rowGap && { rowGap }),
                ...(wrap && { flexWrap: wrap }),
                ...sx,
            }}
        >
            {children}
        </Box>
    );
});

export const Text = ({ children, sx, ...props }) => (
    <Typography component="h4" {...props} sx={{ ...sx }}>
        {children}
    </Typography>
);

export const Heading = ({ children, sx, ...props }) => (
    <Typography variant="body1" {...props} sx={{ ...sx }}>
        {children}
    </Typography>
);
