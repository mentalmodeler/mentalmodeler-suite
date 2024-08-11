import { useState, useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';

const sortBreakpoints = (breakpoints) =>
    Object.keys(breakpoints).sort((a, b) => (parseInt(a, 10) >= parseInt(b, 10) ? -1 : /* istanbul ignore next */ 1));

const getCount = ({ breakpoints, sortedBreakpoints, width }) => {
    const breakpoint = sortedBreakpoints.find((_breakpoint) => {
        const parsedBreakpoint = parseInt(_breakpoint, 10);
        return !isNaN(parsedBreakpoint) && width >= parsedBreakpoint;
    });
    return !isNaN(breakpoints[breakpoint]) ? breakpoints[breakpoint] : 1;
};

const getWidth = () =>
    typeof window !== 'undefined'
        ? window.innerWidth ||
          /* istanbul ignore next */ document.documentElement.clientWidth ||
          /* istanbul ignore next */ document.body.clientWidth
        : /* istanbul ignore next */ 0;

const useCardCount = ({ breakpoints = { 0: 1 }, defaultWidth = 0, debounceTime = 250 } = {}) => {
    const sortedBreakpoints = useMemo(() => sortBreakpoints(breakpoints), [breakpoints]);
    const [width, setWidth] = useState(defaultWidth);
    const [initiallySized, setInitiallySized] = useState(false);
    const [count, setCount] = useState(
        getCount({
            breakpoints,
            sortedBreakpoints,
            width,
        }),
    );
    useEffect(() => {
        const handleResize = () => {
            const _width = getWidth();
            setWidth(_width);
            setCount(
                getCount({
                    breakpoints,
                    sortedBreakpoints,
                    width: _width,
                }),
            );
        };
        const debouncedHandleResize = debounce(handleResize, debounceTime);
        window.addEventListener('resize', debouncedHandleResize);
        /* istanbul ignore else */
        if (width !== initiallySized) {
            handleResize();
            setInitiallySized(true);
        }
        return () => window.removeEventListener('resize', debouncedHandleResize);
    }, [breakpoints, sortedBreakpoints, width, debounceTime, initiallySized]);
    return {
        cardCount: count,
        viewportWidth: width,
    };
};

export default useCardCount;
export { useCardCount };
