import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { normalize, usePan } from './hooks/usePan';
import { Box } from '@mui/material';
import { Flex } from '../IFL/ifl';

const getViewboxTransform = ({ panPct, index, moving, transitionDuration, cardCount }) => {
    return {
        transform: `translateX(${-100 * index * (1 / cardCount) + panPct}%)`,
        ...(!moving && { transition: `transform ${transitionDuration}ms ease` }),
    };
};

const getGutters = ({ gutters, guttersEdge = [], index, length, cardCount }) => {
    const atBeginning = index === 0;
    const atEnd = index === length - cardCount;
    const leftGutter = atBeginning && guttersEdge[0] ? guttersEdge[0] : gutters[0];
    const rightGutter = atEnd && guttersEdge[1] ? guttersEdge[1] : gutters[1];
    return [leftGutter, rightGutter];
};

export const SwipeableCarousel = ({
    children,
    guttersEdge,
    cardCount,
    changeThreshold,
    transitionDuration,
    gutters,
    cardMargin,
    onPan,
    onChange,
    onChangeEnd,
    index,
    preventVerticalScrolling,
    sx = {},
}) => {
    const timeoutId = useRef(null);
    const ref = useRef(null);
    const pan = usePan({ ref, preventVerticalScrolling });

    useEffect(() => {
        const { xPercent, touchState } = pan;
        /* istanbul ignore else */
        if (touchState === 'end') {
            const reset = Math.abs(xPercent) < changeThreshold / cardCount;
            clearTimeout(timeoutId.current);
            /* istanbul ignore else */
            if (!reset) {
                const adj = Math.ceil(Math.abs(xPercent / 100) * cardCount);
                const newIndex = normalize(xPercent < 0 ? index + adj : index - adj, [
                    0,
                    children.length - (cardCount === 1 ? 1 : cardCount),
                ]);
                onChange(newIndex);
                timeoutId.current = setTimeout(() => {
                    onChangeEnd(newIndex);
                }, transitionDuration);
            }
        }
        onPan(pan);
    }, [index, children.length, onPan, onChange, onChangeEnd, pan, changeThreshold, transitionDuration, cardCount]);
    const { xPercent, touchState } = pan;
    const [leftGutter, rightGutter] = getGutters({
        gutters,
        guttersEdge,
        index,
        length: children.length,
        cardCount,
    });
    return (
        <Box
            ref={ref}
            sx={{
                width: '100%',
                position: 'relative',
                ...sx,
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    // width: `calc(100% - ${leftGutter + rightGutter}px)`,
                    height: '100%',
                    position: 'relative',
                    overflowX: 'hidden',
                    paddingBlock: 4,
                    paddingInline: 0,
                    transition: 'padding 250ms ease',
                    paddingInlineStart: `${leftGutter}px`,
                    paddingInlineEnd: `${rightGutter}px`,
                    transitionDuration: `${transitionDuration}ms`,
                }}
            >
                <Flex
                    as="ul"
                    sx={{
                        height: '100%',
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        ...getViewboxTransform({
                            panPct: xPercent,
                            index,
                            moving: touchState === 'move',
                            transitionDuration,
                            cardCount,
                        }),
                    }}
                >
                    {children.map((child, i) => (
                        <Box
                            as="li"
                            sx={{
                                userSelect: 'none',
                                flexShrink: 0,
                                paddingInlineStart: `${cardMargin}px`,
                                paddingInlineEnd: `${cardMargin}px`,
                                width: `${100 / cardCount}%`,
                                // '*': {
                                //     pointerEvents: 'none',
                                // },
                            }}
                            key={`item-${i}`}
                        >
                            {child}
                        </Box>
                    ))}
                </Flex>
            </Box>
        </Box>
    );
};

SwipeableCarousel.propTypes = {
    /** Number of full cards to show at once. */
    cardCount: PropTypes.number,
    /** Percentage change of total carousel width required to change index. */
    changeThreshold: PropTypes.number,
    /** Duration (in milliseconds) of transition to next index after touchend. */
    transitionDuration: PropTypes.number,
    /** Left and right gutters of carousel. In combination with cardMargin, these gutters affect how much of the next and previous cards will be shown. */
    gutters: PropTypes.arrayOf(PropTypes.number),
    /** Left and right gutters of carousel in the edge index case. guttersEdge[0] with be used as the leftGutter when at the first index of the carousel and guttersEdge[1] with be used as the right gutter when at the last index of the carousel. */
    guttersEdge: PropTypes.arrayOf(PropTypes.number),
    /** The left and right 'margin' for each card. This number times 2 will be the space in between each card. */
    cardMargin: PropTypes.number,
    /** Pan callback the passes the object {xPercent, xPixels, yPercent, yPixels, touchState}. */
    onPan: PropTypes.func,
    /** Callback on touchend if the index will be updated. */
    onChange: PropTypes.func,
    /** Callback on the end of the transition after touchend if the index will be updated. */
    onChangeEnd: PropTypes.func,
    /** The current index. */
    index: PropTypes.number,
    /** On touch devices, should vertical scrolling be prevented while the carousel is being scrolled horizontally */
    preventVerticalScrolling: PropTypes.bool,
};

SwipeableCarousel.defaultProps = {
    cardCount: 1,
    changeThreshold: 25,
    transitionDuration: 250,
    gutters: [24, 24],
    cardMargin: 8,
    onPan: () => {},
    onChange: () => {},
    onChangeEnd: () => {},
    index: 0,
    preventVerticalScrolling: true,
};
