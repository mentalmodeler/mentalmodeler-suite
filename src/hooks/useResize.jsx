import { useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

export const useResize = (ref, delay = 300) => {
    const [sizeData, setSizeData] = useState({
        width: ref?.current?.clientWidth || 0,
        height: ref?.current?.clientHeight || 0,
        element: null,
    });
    useEffect(() => {
        const throttledSetSizeData = throttle(({ width, height, element }) => {
            setSizeData({
                width,
                height,
                element,
            });
        }, delay);
        const resizeObserver = new ResizeObserver((entries) => {
            for (var entry of entries) {
                const element = entry?.target;
                if (entry.contentBoxSize) {
                    const { inlineSize, blockSize } = Array.isArray(entry.contentBoxSize)
                        ? entry.contentBoxSize[0]
                        : entry.contentBoxSize;
                    throttledSetSizeData({
                        width: inlineSize,
                        height: blockSize,
                        element,
                    });
                } else {
                    const { width, height } = entry.contentRect;
                    throttledSetSizeData({
                        width,
                        height,
                        element,
                    });
                }
            }
        });
        if (ref && ref.current) {
            resizeObserver.observe(ref.current);
        }
        return () => {
            resizeObserver.disconnect();
        };
    }, [ref, delay]);
    return sizeData;
};
