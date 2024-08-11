import { Box } from '@mui/material';
import { forwardRef } from 'react';

export const Flex = forwardRef(function Flex(
    { children, sx, direction = '', justify = '', align = '', gap = '', colGap = '', rowGap = '' },
    ref,
) {
    return (
        <Box
            ref={ref}
            sx={{
                display: 'flex',
                ...(direction && { flexDirection: direction }),
                ...(justify && { justifyContent: justify }),
                ...(align && { alignItems: align }),
                ...(gap && { gap }),
                ...(colGap && { columnGap: colGap }),
                ...(rowGap && { rowGap }),
                ...sx,
            }}
        >
            {children}
        </Box>
    );
});
