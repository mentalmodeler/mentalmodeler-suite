import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

export const NavMenu = ({ item }) => {
    const { label, id, icon, items } = item;
    const [anchorEl, setAnchorEl] = useState(null);
    const open = !!anchorEl;

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
                            handleClose();
                            action();
                        }}
                    >
                        {label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};
