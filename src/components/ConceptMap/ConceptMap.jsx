import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import { render, load } from 'mentalmodeler-js';
import { APP_VIEW } from '../../redux/slices/appSlice';
import { useSelector } from 'react-redux';

export const ConceptMap = () => {
    const contentRef = useRef(null);
    const { view } = useSelector((state) => state.app) || {};
    const { selectedId, selectedModel } = useSelector((state) => state.models) || {};
    // const selectedModel = useMemo(() => models.find((m) => m.appId === selectedId), [selectedId]);

    useEffect(() => {
        if (view === APP_VIEW.MODEL) {
            render(contentRef.current, { showLoadSaveButtons: false });
        }
    }, [view]);

    useEffect(() => {
        if (selectedId && view === APP_VIEW.MODEL) {
            console.log('selectedModel:', selectedModel);
            load(selectedModel);
        }
    }, [selectedId]);

    return <Box ref={contentRef} sx={{ backgroundColor: 'common.white', height: '100%' }} />;
};
