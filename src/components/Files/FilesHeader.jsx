import { Box, Typography } from '@mui/material';
import { Flex } from '../IFL/ifl';
import { DescriptionOutlined } from '@mui/icons-material';

export const FilesHeader = () => (
    <Box
        sx={{
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
            gap={0}
            sx={{
                borderStartStartRadius: 12,
                borderStartEndRadius: 12,
                backgroundColor: 'bg.darkMid',
                border: '1px solid transparent',
                paddingInline: 3,
                minHeight: 48,
                height: '100%',
            }}
        >
            <DescriptionOutlined fontSize="small" />
            <Typography variant="subtitle2">Files</Typography>
        </Flex>
    </Box>
);
