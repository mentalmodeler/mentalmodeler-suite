/* eslint-disable react/prop-types */
import debounce from 'lodash.debounce';
// import { Box, Button, Flex } from "@indeed/ifl-components";
import { Box, Button, IconButton } from '@mui/material';
// import { SystemStyleObject } from "@indeed/ifl-css";
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

/************************
 * utils methods
 ***********************/

const getScrollOffset = (elem, itemPeak) => elem.offsetLeft - itemPeak;

const scrollTo = (containerElem, scrollToElem, itemPeak) => {
    if (containerElem && scrollToElem) {
        containerElem.scrollLeft = getScrollOffset(scrollToElem, itemPeak);
    }
};

const itemWrapperDataType = 'carousel-item-wrapper';

const getItemWrappers = (elem) => elem?.querySelectorAll(`[data-type="${itemWrapperDataType}"]`);

// const focusElemFromSelector = (
//   container,
//   selector,
// ) => {
//   const elem = container?.querySelector(selector);
//   if (elem) {
//     elem.focus();
//   }
// };

// const SkipLink = ({
//   position = "top",
//   onClick,
// }) => {
//   return (
//     <Button
//       onClick={() => {
//         const goToSelector = `[data-id="${
//           position === "top" ? "go-back" : "skip"
//         }"]`;
//         onClick(goToSelector);
//       }}
//       size="sm"
//       sx={{
//         paddingInline: 2,
//         paddingBlock: 0,
//         position: "absolute",
//         ...(position === "top" && { top: 0 }),
//         ...(position === "bottom" && { bottom: 0 }),
//         transform: `translateY(${position === "top" ? "-100%" : "50%"})`,
//         opacity: 0,
//         transition: "opacity 250ms ease",
//         minBlockSize: "0rem",
//         maxBlockSize: "0rem",
//         overflow: "hidden",
//         fontSize: ".875rem",
//         fontWeight: 400,
//         pointerEvents: "none",
//         "&:focus": {
//           opacity: 1,
//           minBlockSize: "1.5rem",
//           maxBlockSize: "1.5rem",
//         },
//       }}
//       variant="utility"
//       data-id={position === "top" ? "skip" : "go-back"}>
//       {position === "top"
//         ? "Skip past carousel"
//         : "Go to beginning of carousel"}
//     </Button>
//   );
// };

/************************
 * Carousel component
 ***********************/

// interface Props {
//   children?: React.ReactNode;
//   numCardsShown?: number;
//   paddingInline?: number;
//   itemGap?: number;
//   itemPeak?: number;
//   showScrollbar?: boolean;
//   onFocusIn?: () => void;
//   activeIndex?: number;
//   sx?: SystemStyleObject;
//   snapAfterScroll?: boolean;
//   showNavArrows?: boolean;
//   spacing?: number | string;
//   pageLink?: string;
//   openModal?: () => void;
// }

export const ScrollCarousel = ({
    children,
    numCardsShown = 2,
    paddingInline = 16,
    itemGap = 8,
    itemPeak = 32,
    showScrollbar,
    onFocusIn,
    activeIndex,
    sx = {},
    snapAfterScroll,
    showNavArrows,
}) => {
    const [index, setIndex] = useState(activeIndex || 0);
    const [applySnap, setApplySnap] = useState(false);
    const carouselRef = useRef(null);
    const componentRef = useRef(null);
    const getItemsData = useCallback(
        (elem) => {
            const containerElem = carouselRef.current;
            const items = getItemWrappers(containerElem);
            const activeItem = items?.item(index);
            const itemIndex = elem ? Array.from(items || []).findIndex((item) => item.isEqualNode(elem)) : index;

            return {
                items,
                activeItem,
                itemIndex,
                containerElem,
            };
        },
        [index],
    );

    const wrappedChildren = Array.isArray(children)
        ? children.map((child, i) => (
              <Box
                  key={`item-${i}`}
                  data-type={itemWrapperDataType}
                  as="li"
                  sx={{
                      listStyle: 'none',
                      // width: `calc(${100 / numCardsShown}% - ${(itemPeak + paddingInline) / numCardsShown}px)`,
                      // width: `calc(${100 / numCardsShown}% - ${itemPeak}px)`,
                      // width: `calc(${100 / numCardsShown}% - ${0}px)`,
                      width: `calc(${100 / numCardsShown}% - ${itemGap - paddingInline / numCardsShown + itemPeak / numCardsShown}px)`,
                      display: 'flex',
                      flex: '0 0 auto',
                      '> *': {
                          width: '100%',
                      },
                  }}
              >
                  {child}
              </Box>
          ))
        : children;

    // Debounced scroll callback to snap to position after scrolling is complete
    const onScroll = debounce((e) => {
        if (applySnap) {
            const scrollLeft = e.target.scrollLeft;
            const width = e.target.clientWidth;
            const items = getItemWrappers(e.target);
            const adj = paddingInline; //  width / 2
            // '@ts-expect-error' issue with findLastIndex https://github.com/microsoft/TypeScript/issues/49453
            const activeIndex = [...(items || [])].findLastIndex((item) => {
                // console.log('scrollLeft:', scrollLeft, ', item.offsetLeft:', item.offsetLeft, ', width:', width);
                return scrollLeft + paddingInline > item.offsetLeft - item.clientWidth / 2;
            });
            // console.log('activeIndex:', activeIndex);
            setIndex(activeIndex);
            if (snapAfterScroll) {
                scrollTo(e.target, items?.item(activeIndex), itemPeak);
            }
        }
        setApplySnap(false);
    }, 500);

    // Focus in handler for cards
    const _onFocusIn = useCallback(
        ({ target }) => {
            const itemWrapper = target.closest(`[data-type="${itemWrapperDataType}"]`);
            const { itemIndex, activeItem, containerElem } = getItemsData(itemWrapper);

            setIndex(itemIndex);
            // when tabbing within the same index, the scrollTo will stop if in progress,
            // so we need to make sure we call it on all the focus in handling
            scrollTo(containerElem, activeItem, itemPeak);
        },
        [getItemsData, itemPeak],
    );

    // Use effect to scroll to activeCard when index changes
    useEffect(() => {
        const containerElem = carouselRef.current;
        if (containerElem) {
            const activeCard = getItemWrappers(containerElem)?.item(index);
            scrollTo(containerElem, activeCard, itemPeak);
        }
    }, [index, itemPeak]);

    // Use effect to scroll to activeCard when index is initially set.
    // TODO: determine how to set this from any changing prop and not just the initial prop value
    useEffect(() => {
        const containerElem = carouselRef.current;
        const activeCard = getItemWrappers(containerElem)?.item(index);
        scrollTo(containerElem, activeCard, itemPeak);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const wrapppedChildrenLength = Array.isArray(wrappedChildren) ? wrappedChildren.length : 1;

    return (
        <>
            <Box
                ref={componentRef}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    // mx: "-1rem", // Make carousel full width
                }}
            >
                {/* <SkipLink
          position="top"
          onClick={(selector) =>
            focusElemFromSelector(componentRef?.current, selector)
          }
        /> */}
                <Box sx={{ display: 'flex', width: '100%' }}>
                    {showNavArrows && wrapppedChildrenLength > 1 && (
                        <Box
                            className="nav-arrows"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                position: 'absolute',
                                // top: '1.25rem',
                                // right: 0,
                                inset: 0,
                                pointerEvents: 'none',
                            }}
                        >
                            <Button
                                aria-label="previous"
                                onClick={() => {
                                    setIndex((prev) => (prev > 0 ? prev - 1 : wrapppedChildrenLength - 1));
                                }}
                                variant="contained"
                                sx={{
                                    pointerEvents: 'auto',
                                    minWidth: 'unset',
                                    padding: 1,
                                    paddingInlineStart: 0,
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    boxShadow: '2px 2px 2px rgba(0,0,0,.2)',
                                }}
                            >
                                <ChevronLeft />
                            </Button>
                            <Button
                                aria-label="next"
                                onClick={() => {
                                    setIndex((prev) => (prev < wrapppedChildrenLength - 1 ? prev + 1 : 0));
                                }}
                                variant="contained"
                                sx={{
                                    pointerEvents: 'auto',
                                    minWidth: 'unset',
                                    padding: 1,
                                    paddingInlineEnd: 0,
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                    boxShadow: '-2px 2px 2px rgba(0,0,0,.2)',
                                }}
                            >
                                <ChevronRight />
                            </Button>
                        </Box>
                    )}
                </Box>
                <Box
                    ref={carouselRef}
                    className="carousel"
                    // onScroll={onScroll}
                    // {...(snapAfterScroll && { onScroll })}
                    onWheel={(e) => e.deltaX !== 0 && setApplySnap(true)}
                    onTouchMove={() => setApplySnap(true)}
                    onFocus={onFocusIn ? onFocusIn : _onFocusIn}
                    tabIndex={0}
                    as="ul"
                    sx={{
                        display: 'flex',
                        overflow: 'auto',
                        width: '100%',
                        // width: `calc(100% - ${paddingInline * 2}px)`,
                        pb: '5px', // Bottom & top padding to show shadow
                        pt: '1px',
                        scrollBehavior: 'smooth',
                        ...(!showScrollbar && {
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': {
                                display: 'none',
                            },
                        }),
                        ...(showScrollbar && {
                            '&::-webkit-scrollbar': {
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#888',
                                borderRadius: '12px',
                                height: '4px',
                                cursor: 'pointer',
                            },
                        }),
                        '&:focus-within': {
                            outline: '1px solid #fff',
                            boxShadow: '0px 0px 0px 3px #8a1b12',
                        },
                        ...sx,
                        paddingInline: `${paddingInline}px`,
                        gap: `${itemGap}px`,
                    }}
                >
                    {wrappedChildren}
                </Box>
                {/* <SkipLink
          position="bottom"
          onClick={(selector) =>
            focusElemFromSelector(componentRef?.current, selector)
          }
        /> */}
            </Box>
        </>
    );
};

export default ScrollCarousel;
