import {
    ExpandLess,
    DeleteOutline,
    DescriptionOutlined,
    Download,
    ExpandMore,
    PrintOutlined,
    SaveOutlined,
    Upload,
} from '@mui/icons-material';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { Flex } from '../IFL/ifl';
import { useState } from 'react';

const NavMenu = ({ item }) => {
    const { label, id, icon, items } = item;
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (e) => {
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    return (
        <>
            <Button
                variant="global-nav"
                id={id}
                startIcon={icon}
                endIcon={open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                {label}
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': id,
                }}
            >
                {items.map(({ label, id, action }) => (
                    <MenuItem
                        key={id}
                        onClick={() => {
                            action();
                            handleClose();
                        }}
                    >
                        {label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export const GlobalNav = () => {
    const navItems = [
        {
            type: 'button',
            label: 'New',
            id: 'new',
            icon: <DescriptionOutlined />,
            action: () => {},
        },
        {
            type: 'menu',
            label: 'Save',
            id: 'save',
            icon: <SaveOutlined />,
            items: [
                {
                    label: 'Save MMP',
                    id: 'savemmp',
                    icon: <SaveOutlined />,
                    action: () => {},
                },
                {
                    label: 'Save Compare Ref',
                    id: 'savecompareref',
                    icon: <SaveOutlined />,
                    action: () => {},
                },
            ],
        },
        {
            type: 'menu',
            label: 'Load',
            id: 'load',
            icon: <Download />,
            items: [
                {
                    label: 'Load MMP',
                    id: 'load',
                    icon: <Download />,
                    action: () => {
                        let input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = () => {
                            // you can use this method to get file and perform respective operations
                            console.log('input.files:', input.files);
                            // let files = Array.from(input.files);
                            // console.log(files);
                        };
                        input.click();
                    },
                },
                {
                    label: 'Import CSV',
                    id: 'importcsv',
                    icon: <Download />,
                    action: () => {},
                },
            ],
        },
        {
            type: 'menu',
            label: 'Export',
            id: 'export',
            icon: <Upload />,
            items: [
                {
                    label: 'Export CSV',
                    id: 'exportcsv',
                    icon: <Upload />,
                    action: () => {},
                },
                {
                    label: 'Export XLS',
                    id: 'exportxls',
                    icon: <Upload />,
                    action: () => {},
                },
            ],
        },
        {
            type: 'button',
            label: 'Remove',
            id: 'remove',
            icon: <DeleteOutline />,
            action: () => {},
        },
        {
            type: 'button',
            label: 'Print',
            id: 'print',
            icon: <PrintOutlined />,
            action: () => {},
        },
    ];

    return (
        <Box
            sx={{
                gridArea: 'global-nav',
                backgroundColor: 'bg.darkest',
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr',
            }}
        >
            <Typography variant="logo" sx={{ paddingBlock: 1, paddingInline: 2, backgroundColor: 'bg.darkest' }}>
                <Box component="span">Mental</Box>
                <Box component="span" sx={{ color: 'primary.main' }}>
                    Modeler
                </Box>
            </Typography>
            <Flex
                component="ul"
                sx={{
                    gap: 1,
                    paddingBlock: 1,
                    paddingInline: 2,
                    listStyle: 'none',
                    margin: 0,
                    flexWrap: 'wrap',
                    // backgroundColor: 'bg.darker',
                }}
            >
                {navItems.map((item) => {
                    const component =
                        item?.type === 'menu' ? (
                            <NavMenu item={item} />
                        ) : (
                            <Button size="small" variant="global-nav" startIcon={item.icon} onClick={item.action}>
                                {item.label}
                            </Button>
                        );
                    return (
                        <Box component="li" key={item.id} sx={{ flexShrink: 0 }}>
                            {component}
                        </Box>
                    );
                })}
            </Flex>
        </Box>
    );
};
