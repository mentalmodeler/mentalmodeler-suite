import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import { APP_VIEW } from '../../redux/slices/appSlice';
import { useSelector } from 'react-redux';

export const ConceptMap = () => {
    const contentRef = useRef(null);
    const { view } = useSelector((state) => state.app) || {};
    const { selectedId, selectedModel } = useSelector((state) => state.models) || {};
    // const selectedModel = useMemo(() => models.find((m) => m.appId === selectedId), [selectedId]);

    useEffect(() => {
        if (view === APP_VIEW.MODEL && window.MentalModelerConceptMap?.render) {
            window.MentalModelerConceptMap.render(contentRef.current);
        }
    }, [view]);

    useEffect(() => {
        if (selectedId && view === APP_VIEW.MODEL && window.MentalModelerConceptMap?.load) {
            console.log('selectedModel:', selectedModel);
            window.MentalModelerConceptMap.load(selectedModel);
        }
    }, [selectedId]);

    return <Box ref={contentRef} sx={{ backgroundColor: 'common.white', height: '100%' }} />;
};
