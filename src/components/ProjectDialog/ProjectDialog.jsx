// import * as React from 'react';
// import Button from '@mui/material/Button';
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// // import DialogContentText from '@mui/material/DialogContentText';
// import DialogTitle from '@mui/material/DialogTitle';
// import { ACTION_TYPE, useAppDispatch, useAppState } from '../../context/AppContext/AppContext';
// import { Box, IconButton, Slide, Typography, Zoom, styled, useMediaQuery, useTheme } from '@mui/material';
// import { Flex } from '../IFL/ifl';
// import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
// import { GridMediaContainer, ScrollGridMediaContainer } from '../Grid';
// import { Close, Launch, PictureAsPdf } from '@mui/icons-material';
// import { dialog_footer_scroll_signifier, maxWidthContent, sticky_header_before } from '../../constants/styles';
// import { useIntersctionSentinel } from '../../hooks/useIntersectionSentinel';

// const timeout = {
//     enter: 400,
//     exit: 250,
// };

// const Transition = React.forwardRef(function Transition(props, ref) {
//     const onExited = () => {
//         // deselect project here
//         props.onExited();
//     };
//     const theme = useTheme();
//     const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
//     const TransitionComponent = fullScreen ? Slide : Zoom;
//     return <TransitionComponent direction="left" ref={ref} {...props} onExited={onExited} timeout={timeout} />;
// });

// const CustomizedDialog = styled(Dialog)(({ theme }) => ({
//     '&.MuiDialog-root': {
//         '&.has-video': {
//             '& .MuiDialog-paper': {
//                 maxWidth: ['600px', '1000px'],
//                 width: '100%', //['600px', '1000px', '1000px'],
//             },
//         },
//     },
//     '& .MuiDialogContent-root': {
//         paddingBlockStart: 0,
//         paddingBlockEnd: theme.spacing(4),
//         '&.scrolling': {
//             paddingInline: 0,
//         },
//     },
//     '& .MuiDialog-paper': {
//         // maxWidth: ['600px'],
//         // width: ['600px'],
//         maxWidth: ['600px', '1000px', '1000px'],
//         width: ['600px', '1000px', '1000px'],
//     },
//     // '& .MuiDialogActions-root': {
//     //     padding: theme.spacing(2),
//     // },
// }));

// export const ProjectDialog = () => {
//     const theme = useTheme();
//     const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
//     const { modalOpen, selectedProject } = useAppState();
//     const dispatch = useAppDispatch();
//     const { title, sizes, image, video, images, videos, links, description } = selectedProject || {};

//     const handleClose = () => {
//         dispatch({
//             type: ACTION_TYPE.TOGGLE_MODAL,
//             value: false,
//         });
//     };

//     const { isIntersecting: isIntersectingTop, Sentinel: SentinelTop } = useIntersctionSentinel({ threshold: 1 });
//     const { isIntersecting: isIntersectingBottom, Sentinel: SentinelBottom } = useIntersctionSentinel({ threshold: 1 });

//     const hasMultipleMediaItems =
//         images?.length > 1 || videos?.length > 1 || (images?.length > 0 && videos?.length > 0);

//     return (
//         <CustomizedDialog
//             disableRestoreFocus
//             open={modalOpen}
//             TransitionComponent={Transition}
//             fullScreen={fullScreen}
//             keepMounted={false}
//             onClose={handleClose}
//             {...(video && { className: 'has-video' })}
//             aria-describedby="alert-dialog-slide-description"
//             // scroll="body"
//         >
//             <DialogTitle
//                 sx={{
//                     position: 'relative',
//                     zIndex: 1,
//                     ...(!isIntersectingTop && { borderBlockEnd: '1px solid #e5e3e2' }),
//                     '&::before': {
//                         ...sticky_header_before,
//                         opacity: !isIntersectingTop ? 1 : 0,
//                     },
//                 }}
//             >
//                 <Flex direction="column" gap={0}>
//                     <Typography variant="projectTitle">{title}</Typography>
//                     {sizes && (
//                         <Typography variant="projectSizes" sx={{ marginBlockStart: -0.75 }}>
//                             {sizes.join('/')}
//                         </Typography>
//                     )}
//                 </Flex>
//             </DialogTitle>
//             <IconButton
//                 autoFocus
//                 aria-label="close"
//                 onClick={handleClose}
//                 sx={{
//                     position: 'absolute',
//                     zIndex: 1,
//                     right: 8,
//                     top: 8,
//                     color: (theme) => theme.palette.grey[500],
//                 }}
//             >
//                 <Close />
//             </IconButton>
//             <DialogContent className={hasMultipleMediaItems ? 'scrolling' : ''}>
//                 <SentinelTop
//                     sx={{
//                         height: ' 2px',
//                         top: 'unset',
//                         position: 'relative',
//                     }}
//                 />
//                 <Flex direction="column" gap={3}>
//                     {hasMultipleMediaItems && (
//                         <ScrollGridMediaContainer item={selectedProject} inDialog></ScrollGridMediaContainer>
//                     )}
//                     {!hasMultipleMediaItems && (
//                         <GridMediaContainer item={selectedProject} inDialog>
//                             {video && <VideoPlayer url={video.url} />}
//                             {!video && image && (
//                                 <Box
//                                     as="img"
//                                     sx={{
//                                         width: '100%',
//                                         height: '400px',
//                                         objectFit: 'contain',
//                                         objectPosition: 'center',
//                                         display: 'block',
//                                     }}
//                                     src={`../images/${image?.uri}`}
//                                 />
//                             )}
//                         </GridMediaContainer>
//                     )}
//                     {description && (
//                         <Typography
//                             as="span"
//                             variant="body1"
//                             dangerouslySetInnerHTML={{ __html: description }}
//                             sx={{ ...maxWidthContent, paddingInline: hasMultipleMediaItems ? 3 : 0 }}
//                         />
//                     )}
//                 </Flex>
//                 <SentinelBottom
//                     sx={{
//                         height: ' 2px',
//                         top: 'unset',
//                         position: 'relative',
//                     }}
//                 />
//             </DialogContent>
//             {links?.length > 0 && (
//                 <DialogActions
//                     sx={{
//                         flexWrap: 'wrap',
//                         gap: 2,
//                         padding: 2,
//                         justifyContent: 'center',
//                         zIndex: 1,
//                         position: 'relative',
//                         ...(!isIntersectingBottom && { borderBlockStart: '1px solid #e5e3e2' }),
//                         '&::before': {
//                             ...dialog_footer_scroll_signifier,
//                             opacity: !isIntersectingBottom ? 1 : 0,
//                         },
//                     }}
//                 >
//                     {links &&
//                         links.map((link, i) => {
//                             const _url = link.uri || link.url;
//                             const label = link.label || `${title}`;
//                             return (
//                                 <Button
//                                     variant="contained"
//                                     sx={{
//                                         gap: 1,
//                                         textTransform: 'unset',
//                                         margin: '0 !important',
//                                     }}
//                                     aria-label={`Launch ${label}`}
//                                     key={`${_url}-${i}`}
//                                     target="_blank"
//                                     href={_url}
//                                 >
//                                     {link?.type === 'pdf' && <PictureAsPdf fontSize="small" />}
//                                     {link?.type !== 'pdf' && <Launch fontSize="small" />}
//                                     {label}
//                                 </Button>
//                             );
//                         })}
//                 </DialogActions>
//             )}
//         </CustomizedDialog>
//     );
// };
