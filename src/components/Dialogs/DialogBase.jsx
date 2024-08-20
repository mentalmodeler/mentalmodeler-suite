import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { IconButton, Slide, Zoom, styled, useMediaQuery, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { dialog_footer_scroll_signifier, sticky_header_before } from '../../constants/styles';
import { useIntersctionSentinel } from '../../hooks/useIntersectionSentinel';
import { DialogBaseActionsType, DialogBaseContentType, DialogBaseTitleType, findChild } from '../../utils/slotUtils';

const timeout = {
    enter: 400,
    exit: 250,
};

const Transition = React.forwardRef(function Transition(props, ref) {
    const onExited = () => {
        // deselect project here
        props.onExited();
    };
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const TransitionComponent = fullScreen ? Slide : Zoom;
    return <TransitionComponent direction="left" ref={ref} {...props} onExited={onExited} timeout={timeout} />;
});

const CustomizedDialog = styled(Dialog)((/*{theme}*/) => ({
    '&.MuiDialog-root': {
        '&.has-video': {
            '& .MuiDialog-paper': {
                maxWidth: ['600px', '1000px'],
                width: '100%', //['600px', '1000px', '1000px'],
            },
        },
    },
    '& .MuiDialogContent-root': {
        // paddingBlockStart: 0,
        // paddingBlockEnd: theme.spacing(4),
        '&.scrolling': {
            paddingInline: 0,
        },
    },
    '& .MuiDialog-paper': {
        maxWidth: ['600px'],
        width: ['600px'],
        // maxWidth: ['600px', '1000px', '1000px'],
        // width: ['600px', '1000px', '1000px'],
    },
    // '& .MuiDialogActions-root': {
    //     padding: theme.spacing(2),
    // },
}));

export const DialogBase = ({ children, open, onClose, PaperProps = {}, closeOnClickOutside = false }) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const title = findChild(children, DialogBaseTitleType);
    const content = findChild(children, DialogBaseContentType);
    const customActions = findChild(children, DialogBaseActionsType);

    const { isIntersecting: isIntersectingTop, Sentinel: SentinelTop } = useIntersctionSentinel({ threshold: 1 });
    const { isIntersecting: isIntersectingBottom, Sentinel: SentinelBottom } = useIntersctionSentinel({ threshold: 1 });

    return (
        <CustomizedDialog
            disableRestoreFocus
            open={open}
            TransitionComponent={Transition}
            fullScreen={fullScreen}
            keepMounted={false}
            {...(closeOnClickOutside && { onClose })}
            // aria-describedby="alert-dialog-slide-description"
            PaperProps={PaperProps}
            // scroll="body"
        >
            <DialogTitle
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    ...(!isIntersectingTop && { borderBlockEnd: '1px solid #e5e3e2' }),
                    '&::before': {
                        ...sticky_header_before,
                        opacity: !isIntersectingTop ? 1 : 0,
                    },
                }}
            >
                {title}
            </DialogTitle>
            <IconButton
                autoFocus
                aria-label="close"
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    zIndex: 1,
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                }}
            >
                <Close />
            </IconButton>
            <DialogContent>
                <SentinelTop
                    sx={{
                        height: ' 2px',
                        top: 'unset',
                        position: 'relative',
                    }}
                />
                {content}
                <SentinelBottom
                    sx={{
                        height: ' 2px',
                        top: 'unset',
                        position: 'relative',
                    }}
                />
            </DialogContent>
            {customActions && (
                <DialogActions
                    sx={{
                        flexWrap: 'wrap',
                        gap: 2,
                        padding: 2,
                        // justifyContent: 'center',
                        zIndex: 1,
                        position: 'relative',
                        ...(!isIntersectingBottom && { borderBlockStart: '1px solid #e5e3e2' }),
                        '&::before': {
                            ...dialog_footer_scroll_signifier,
                            opacity: !isIntersectingBottom ? 1 : 0,
                        },
                    }}
                >
                    {customActions}
                </DialogActions>
            )}
        </CustomizedDialog>
    );
};
