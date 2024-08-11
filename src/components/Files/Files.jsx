import { Box, Typography } from '@mui/material';
import { Flex } from '../IFL/ifl';
import { DescriptionOutlined } from '@mui/icons-material';

export const FilesHeader = () => (
    <Box
        sx={{
            borderBottom: 1,
            borderColor: 'bg.darker',
            gridArea: 'files-header',
            borderStartStartRadius: 24,
            borderEndStartRadius: 24,
            paddingInline: 2,
            paddingBlockStart: 2,
            color: '#fff',
            height: '100%',
        }}
    >
        <Flex
            justify="center"
            align="center"
            direction="column"
            gap={0.5}
            sx={{
                borderStartStartRadius: 12,
                borderStartEndRadius: 12,
                backgroundColor: 'bg.dark',
                height: '100%',
            }}
        >
            <DescriptionOutlined fontSize="small" />
            <Typography variant="subtitle2">Files</Typography>
        </Flex>
    </Box>
);

export const Files = () => {
    return (
        <Box sx={{ gridArea: 'files', padding: 2, paddingBlockStart: 0 }}>
            <Box sx={{ height: '100%', backgroundColor: 'common.white', borderRadius: 0 }}></Box>
        </Box>
    );
};
