import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { APP_VIEW } from '../../redux/slices/appSlice';
import { ConceptMap } from '../ConceptMap/ConceptMap';
import { Matrix } from '../Matrix/Matrix';
import { Info } from '../Info/Info';
import { Metrics } from '../Metrics/Metrics';

export const Content = () => {
    const { view } = useSelector((state) => state.app) || {};
    return (
        <Box
            sx={{
                gridArea: 'content',
                paddingInlineEnd: 2,
                paddingBlockEnd: 2,
                overflow: 'auto',
            }}
        >
            <Box sx={{ backgroundColor: 'common.white', height: '100%', overflow: 'auto' }}>
                {view === APP_VIEW.MODEL && <ConceptMap />}
                {view === APP_VIEW.MATRIX && <Matrix />}
                {view === APP_VIEW.INFO && <Info />}
                {view === APP_VIEW.METRICS && <Metrics />}
            </Box>
        </Box>
    );
};
