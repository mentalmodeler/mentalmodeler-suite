import { Apps, InfoOutlined, Insights, PlayCircleOutline, SchemaOutlined } from '@mui/icons-material';
import { Box, Tab, Tabs as MUITabs } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { APP_VIEW } from '../../redux/slices/appSlice';
import { useMemo } from 'react';
import { saveModelFromConceptMap } from '../../redux/actions/models';

const a11yProps = (index) => {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
};

const _tabs = [
    {
        label: 'Model',
        id: 'model',
        value: APP_VIEW.MODEL,
        icon: <SchemaOutlined fontSize="small" sx={{ transform: 'rotate(-90deg)' }} />,
    },
    {
        label: 'Matrix',
        id: 'matrix',
        value: APP_VIEW.MATRIX,
        icon: <Apps fontSize="small" />,
    },
    {
        label: 'Preferred State & Metrics',
        id: 'preferredstate',
        value: APP_VIEW.METRICS,
        icon: <Insights fontSize="small" />,
    },
    {
        label: 'Scenario',
        id: 'scenario',
        value: APP_VIEW.SCENARIO,
        icon: <PlayCircleOutline fontSize="small" />,
    },
    {
        label: 'Info',
        id: 'info',
        value: APP_VIEW.INFO,
        icon: <InfoOutlined fontSize="small" />,
    },
];

export const Tabs = () => {
    const dispatch = useDispatch();
    const { view } = useSelector((state) => state.app) || {};
    const activeTab = useMemo(() => _tabs.findIndex(({ value }) => view === value), [view]);

    return (
        <Box
            sx={{
                gridArea: 'tabs',
                paddingInlineEnd: 2,
                paddingBlockStart: 2,
                overflow: 'auto',
            }}
        >
            <MUITabs
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                value={activeTab}
                onChange={(e, newValue) => {
                    // if (_tabs[activeTab].value === APP_VIEW.MODEL) {
                    dispatch(saveModelFromConceptMap(_tabs[activeTab].value));
                    // }
                    dispatch({
                        type: 'app/setField',
                        payload: {
                            field: 'view',
                            value: _tabs[newValue].value,
                        },
                    });
                }}
                aria-label="main content area tabs"
                sx={{
                    borderStartStartRadius: 12,
                    borderStartEndRadius: 12,
                    borderBottom: 2,
                    borderColor: 'bg.darker',
                }}
            >
                {_tabs.map(({ label, id, icon }) => (
                    <Tab key={id} iconPosition="top" label={label} icon={icon} {...a11yProps(0)} id={id} />
                ))}
            </MUITabs>
        </Box>
    );
};
