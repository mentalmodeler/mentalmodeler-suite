import { Apps, InfoOutlined, Insights, PlayCircleOutline, SchemaOutlined } from '@mui/icons-material';
import { Box, Tab, Tabs as MUITabs } from '@mui/material';
import { useState } from 'react';
// import { useState } from 'react';

const a11yProps = (index) => {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
};

export const Tabs = () => {
    const _tabs = [
        {
            label: 'Model',
            id: 'model',
            icon: <SchemaOutlined fontSize="small" />,
            action: () => {},
        },
        {
            label: 'Matrix',
            id: 'matrix',
            icon: <Apps fontSize="small" />,
            action: () => {},
        },
        {
            label: 'Preferred State & Metrics',
            id: 'preferredstate',
            icon: <Insights fontSize="small" />,
            action: () => {},
        },
        {
            label: 'Scenario',
            id: 'scenario',
            icon: <PlayCircleOutline fontSize="small" />,
            action: () => {},
        },
        {
            label: 'Info',
            id: 'info',
            icon: <InfoOutlined fontSize="small" />,
            action: () => {},
        },
    ];
    const [value, setValue] = useState(0);

    return (
        <Box
            sx={{
                borderBottom: 1,
                borderColor: 'bg.darker',
                gridArea: 'tabs',
                paddingInlineEnd: 2,
                paddingBlockStart: 2,
                overflow: 'auto',
            }}
        >
            <MUITabs
                // variant="fullWidth"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                value={value}
                onChange={(e, newValue) => {
                    setValue(newValue);
                }}
                aria-label="main content area tabs"
                sx={{
                    borderStartStartRadius: 12,
                    borderStartEndRadius: 12,
                    backgroundColor: 'bg.dark',
                }}
            >
                {_tabs.map(({ label, id, icon }) => (
                    <Tab key={id} iconPosition="top" label={label} icon={icon} {...a11yProps(0)} id={id} />
                ))}
            </MUITabs>
        </Box>
    );
};
