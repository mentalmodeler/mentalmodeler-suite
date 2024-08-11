/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */

import { useMemo } from 'react';
import { useIntersection } from './useIntersection';
import { Box } from '@mui/material';

export const getThreshold = (count) => new Array(count + 1).fill('').map((_, i) => (i * 1) / count);

export const useIntersctionSentinel = ({
    threshold = getThreshold(100),
    rootMarginValues = `0px 0px 0px 0px`,
} = {}) => {
    const _threshold = useMemo(() => threshold, [threshold.toString()]); //eslint-disable-line react-hooks/exhaustive-deps
    const rootMargin = useMemo(() => rootMarginValues, [rootMarginValues]);
    const { ref, entry, elementRef } = useIntersection({
        threshold: _threshold,
        rootMargin,
    });
    const Sentinel = useMemo(
        () =>
            ({ sx = {} }) => (
                <Box
                    ref={ref}
                    className="sentinel"
                    sx={{
                        width: '4px',
                        height: '100px',
                        flexShrink: 0,
                        position: 'absolute',
                        top: 0,
                        pointerEvents: 'none',
                        ...sx,
                    }}
                />
            ),
        [ref],
    );
    return {
        ref,
        elementRef,
        scrollPct: entry?.intersectionRatio !== undefined ? 1 - entry.intersectionRatio : 0,
        isIntersecting: entry?.isIntersecting ?? true,
        Sentinel,
    };
};
