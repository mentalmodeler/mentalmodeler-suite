import { Box } from '@mui/material';

export const Content = () => {
    return (
        <Box sx={{ gridArea: 'content', paddingInlineEnd: 2, paddingBlockEnd: 2 }}>
            <Box sx={{ backgroundColor: 'common.white', height: '100%' }} />
        </Box>
    );
};
